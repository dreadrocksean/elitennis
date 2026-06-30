/**
 * EliTennisKC — Cloud Functions (2nd gen, runs on Google Cloud Run / Functions)
 *
 *  • createCheckoutSession  — HTTPS endpoint the frontend calls to start payment.
 *  • stripeWebhook          — Stripe calls this; we mark the booking `paid`.
 *  • releaseStaleHolds      — scheduled cleanup of unpaid pending holds.
 *
 * Secrets (set with: firebase functions:secrets:set NAME):
 *  • STRIPE_SECRET_KEY        sk_live_... / sk_test_...
 *  • STRIPE_WEBHOOK_SECRET    whsec_...
 */
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { setGlobalOptions } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';

initializeApp();
const db = getFirestore();

setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

const LESSON = {
  name: '60-Minute Private Tennis Lesson',
  amount: 4000, // cents — default/fallback if no price is set in Firestore
  currency: 'usd',
};

// Parse an owner-entered display price like "$1.53" or "$40" into integer cents.
const priceToCents = (priceStr, fallback) => {
  const n = parseFloat(String(priceStr ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : fallback;
};

// Restrict CORS to your deployed origins (add your Vercel + custom domains).
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://elitenniskc.com',
  'https://www.elitenniskc.com',
];

const cors = (req, res) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin || '')) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
};

// ────────────────────────────────────────────────────────────────────────────
// 1) Create a Stripe Checkout Session for a held booking.
// ────────────────────────────────────────────────────────────────────────────
export const createCheckoutSession = onRequest(
  { secrets: [STRIPE_SECRET_KEY], cors: false },
  async (req, res) => {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).send('Method not allowed');

    try {
      const { bookingId, date, time, name, email, phone, notes, origin } = req.body || {};
      if (!bookingId || !date || !time || !email) {
        return res.status(400).send('Missing required booking fields.');
      }

      const bookingRef = db.collection('bookings').doc(bookingId);
      const snap = await bookingRef.get();
      if (!snap.exists) return res.status(409).send('Booking hold not found.');
      if (snap.data().status === 'paid') return res.status(409).send('Already paid.');

      const stripe = new Stripe(STRIPE_SECRET_KEY.value());
      const baseUrl =
        ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin || '')
          ? origin
          : 'https://elitenniskc.com';

      // Charge the current owner-set price from Firestore (falls back to default).
      let amount = LESSON.amount;
      try {
        const contentSnap = await db.collection('site').doc('content').get();
        amount = priceToCents(contentSnap.data()?.pricing?.price, LESSON.amount);
      } catch (e) {
        console.warn('Could not read price from site/content; using default.', e);
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: email,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: LESSON.currency,
              unit_amount: amount,
              product_data: {
                name: LESSON.name,
                description: `${date} at ${time} · with Coach Eli`,
              },
            },
          },
        ],
        metadata: {
          bookingId,
          date,
          time,
          name: name || '',
          phone: phone || '',
          notes: notes || '',
        },
        success_url: `${baseUrl}/booking-success?date=${date}&time=${time}`,
        cancel_url: `${baseUrl}/book?canceled=1`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
      });

      await bookingRef.set(
        { stripeSessionId: session.id, status: 'pending', updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );

      return res.status(200).json({ url: session.url });
    } catch (err) {
      console.error('createCheckoutSession error', err);
      return res.status(500).send(err.message || 'Internal error');
    }
  },
);

// ────────────────────────────────────────────────────────────────────────────
// 2) Stripe webhook — finalize the booking on successful payment.
//    Must use the raw body for signature verification.
// ────────────────────────────────────────────────────────────────────────────
export const stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const stripe = new Stripe(STRIPE_SECRET_KEY.value());
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      // onRequest provides req.rawBody (Buffer) for signature checks.
      event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET.value());
    } catch (err) {
      console.error('Webhook signature failed', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;
        if (bookingId) {
          await db
            .collection('bookings')
            .doc(bookingId)
            .set(
              {
                status: 'paid',
                amount: session.amount_total ?? LESSON.amount,
                paymentIntent: session.payment_intent || null,
                paidAt: FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
        }
      }

      if (event.type === 'checkout.session.expired') {
        const bookingId = event.data.object.metadata?.bookingId;
        if (bookingId) {
          const ref = db.collection('bookings').doc(bookingId);
          const snap = await ref.get();
          if (snap.exists && snap.data().status !== 'paid') await ref.delete();
        }
      }

      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('Webhook handler error', err);
      return res.status(500).send('Handler error');
    }
  },
);

// ────────────────────────────────────────────────────────────────────────────
// 3) Sweep unpaid holds older than 45 minutes (belt-and-suspenders).
// ────────────────────────────────────────────────────────────────────────────
export const releaseStaleHolds = onSchedule('every 30 minutes', async () => {
  const cutoff = new Date(Date.now() - 45 * 60 * 1000).toISOString();
  const stale = await db
    .collection('bookings')
    .where('status', '==', 'pending')
    .where('createdAt', '<', cutoff)
    .get();

  const batch = db.batch();
  stale.forEach((doc) => batch.delete(doc.ref));
  if (!stale.empty) await batch.commit();
  console.log(`Released ${stale.size} stale holds.`);
});
