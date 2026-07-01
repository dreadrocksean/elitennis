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
import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { setGlobalOptions } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import { Resend } from 'resend';

initializeApp();
const db = getFirestore();

setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

// Sender for owner notifications. Must be a verified Resend domain/sender —
// elitenniskc.com is the obvious choice. Until a domain is verified you can use
// 'onboarding@resend.dev' (only delivers to the Resend account's own address).
const NOTIFY_FROM = 'EliTennisKC <noreply@elitenniskc.com>';

const LESSON = {
  name: '60-Minute Private Tennis Lesson',
  amount: 4000, // cents — default/fallback if no price is set in Firestore
  currency: 'usd',
};

// Slot times are bare 'HH:mm' wall-clock in the coach's local zone (Kansas City).
// This function runs in UTC, so we convert explicitly. Keep in sync with the
// client default in src/lib/useBookings.js.
const TIMEZONE = 'America/Chicago';
const DEFAULT_LEAD_HOURS = 12;

// Owner emails allowed to cancel/refund. Keep in sync with firestore.rules and
// VITE_OWNER_EMAIL.
const OWNER_EMAILS = ['elijahdona77@gmail.com', 'adrianbartholomew25@pm.me'];

// Parse an owner-entered display price like "$1.53" or "$40" into integer cents.
const priceToCents = (priceStr, fallback) => {
  const n = parseFloat(String(priceStr ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : fallback;
};

// 'YYYY-MM-DD' + 'HH:mm' interpreted as wall-clock in `timeZone` -> UTC epoch ms.
// DST-correct: derives the zone's offset at that instant via Intl.
const zonedWallTimeToMs = (date, time, timeZone) => {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, m] = time.split(':').map(Number);
  const naiveUtc = Date.UTC(y, mo - 1, d, h, m);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const map = {};
  for (const p of dtf.formatToParts(new Date(naiveUtc))) map[p.type] = p.value;
  let hour = Number(map.hour);
  if (hour === 24) hour = 0; // some ICU builds emit '24' for midnight
  const wallAsUtc = Date.UTC(
    map.year,
    Number(map.month) - 1,
    map.day,
    hour,
    map.minute,
    map.second,
  );
  return naiveUtc - (wallAsUtc - naiveUtc);
};

// Mirror of the client's isBeforeLeadTime — is the slot too soon to book?
const isBeforeLeadTime = (date, time, leadHours) =>
  zonedWallTimeToMs(date, time, TIMEZONE) - Date.now() < leadHours * 3600 * 1000;

// Email the owner(s) about a new paid booking. Best-effort: a failure here must
// never break the webhook (the payment is already finalized).
const notifyOwnerOfBooking = async ({ date, time, name, email, phone, notes, amount }) => {
  try {
    const resend = new Resend(RESEND_API_KEY.value());
    const dollars = ((amount ?? LESSON.amount) / 100).toFixed(2);
    await resend.emails.send({
      from: NOTIFY_FROM,
      to: OWNER_EMAILS,
      replyTo: email || undefined,
      subject: `New booking — ${date} at ${time} (CT)`,
      text: [
        'A lesson was just booked and paid.',
        '',
        `Date:  ${date}`,
        `Time:  ${time} (Central)`,
        `Name:  ${name || '—'}`,
        `Email: ${email || '—'}`,
        `Phone: ${phone || '—'}`,
        `Notes: ${notes || '—'}`,
        `Paid:  $${dollars}`,
      ].join('\n'),
    });
  } catch (err) {
    console.error('Owner notification failed (booking still recorded):', err);
  }
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

      // Defense in depth: re-validate lead time server-side (the client checks
      // too, but a stale page or crafted request could submit a passed slot).
      let leadHours = DEFAULT_LEAD_HOURS;
      try {
        const availSnap = await db.collection('site').doc('availability').get();
        const v = availSnap.data()?.leadHours;
        if (Number.isFinite(v)) leadHours = v;
      } catch (e) {
        console.warn('Could not read site/availability; using default lead time.', e);
      }
      if (isBeforeLeadTime(date, time, leadHours)) {
        // Release the now-invalid hold so the slot isn't locked until the sweep.
        await bookingRef.delete();
        return res.status(409).send('That time is no longer available.');
      }

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
// 1b) Owner cancels a booking — optionally refunding the customer via Stripe.
//     Callable so the Firebase Auth token is verified for us.
// ────────────────────────────────────────────────────────────────────────────
export const cancelBooking = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (request) => {
  const email = request.auth?.token?.email?.toLowerCase();
  if (!email || !OWNER_EMAILS.includes(email)) {
    throw new HttpsError('permission-denied', 'Owner access required.');
  }

  const { id, refund = false } = request.data || {};
  if (!id) throw new HttpsError('invalid-argument', 'Missing booking id.');

  const ref = db.collection('bookings').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Booking not found.');
  const booking = snap.data();

  let refunded = false;
  if (refund && booking.status === 'paid') {
    if (!booking.paymentIntent) {
      // No charge reference on file — don't free the slot under a false promise.
      throw new HttpsError(
        'failed-precondition',
        'No payment reference on file — refund manually in Stripe, then cancel.',
      );
    }
    try {
      const stripe = new Stripe(STRIPE_SECRET_KEY.value());
      await stripe.refunds.create({ payment_intent: booking.paymentIntent });
      refunded = true;
    } catch (err) {
      console.error('Refund failed', err);
      throw new HttpsError('internal', err.message || 'Refund failed.');
    }
  }

  await ref.delete();
  return { ok: true, refunded };
});

// ────────────────────────────────────────────────────────────────────────────
// 2) Stripe webhook — finalize the booking on successful payment.
//    Must use the raw body for signature verification.
// ────────────────────────────────────────────────────────────────────────────
export const stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY] },
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

          await notifyOwnerOfBooking({
            date: session.metadata?.date,
            time: session.metadata?.time,
            name: session.metadata?.name,
            email: session.customer_email || session.customer_details?.email,
            phone: session.metadata?.phone,
            notes: session.metadata?.notes,
            amount: session.amount_total,
          });
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
