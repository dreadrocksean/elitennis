# EliTennisKC — Private Tennis Lessons SPA

A slick, modern single-page app for Coach Eli's private tennis lessons in Kansas City.

**Stack:** React (Vite) · Tailwind CSS · Firebase Auth + Firestore (realtime) · Stripe Checkout · Google Cloud Functions · deployed on Vercel.

## Features

- 🎾 Polished marketing site — hero, bio, stats, pricing, photo gallery, testimonials
- 📅 Self-service **booking calendar** with realtime slot availability (slots vanish the instant they're taken)
- 💳 **Stripe Checkout** — clients pay at booking; the slot is confirmed only after payment (via webhook)
- 🔐 **Owner login** (Firebase email/password) → `/admin` dashboard
- ✏️ Live editing of testimonials, gallery, bio/pricing copy, and weekly availability — changes appear on the site instantly
- 📖 Booking management with confirmed/pending views and revenue totals

---

## 1. Prerequisites

- Node.js 20+
- A [Firebase](https://console.firebase.google.com) project (Blaze plan — required for Cloud Functions + outbound Stripe calls)
- A [Stripe](https://dashboard.stripe.com) account
- A [Vercel](https://vercel.com) account
- CLIs: `yarn global add firebase-tools vercel`

---

## 2. Local setup

```bash
yarn                        # install dependencies
cp .env.example .env        # then fill in the values (see below)
yarn dev                    # http://localhost:5173
```

### Environment variables (`.env`)

| Var                           | Where to find it                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `VITE_FIREBASE_*`             | Firebase Console → Project Settings → "Your apps" (Web app)                        |
| `VITE_OWNER_EMAIL`            | The email that may access `/admin` (default: `adrian@bartholomusic.com`)           |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys (`pk_...`)                                |
| `VITE_FUNCTIONS_BASE_URL`     | After deploying functions, e.g. `https://us-central1-<project>.cloudfunctions.net` |

> The site runs without Firebase configured — it falls back to the default content in `src/data/siteContent.js` — but booking, payments, and admin need the full setup.

---

## 3. Firebase setup

```bash
firebase login
firebase use --add            # select your project, alias "default"
```

1. **Authentication** → enable **Email/Password** → add a user with the owner email + a password. Make sure the email is **verified** (the rules require it) — you can mark it verified in the console.
2. **Firestore Database** → create (production mode).
3. **Update the owner email in the rules:** open `firestore.rules` and set the email in `isOwner()` to match `VITE_OWNER_EMAIL`.
4. Deploy rules + indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

### Cloud Functions (Stripe backend)

```bash
cd functions && npm install && cd ..

# Set Stripe secrets (you'll be prompted to paste each value)
firebase functions:secrets:set STRIPE_SECRET_KEY        # sk_test_... or sk_live_...
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET    # from step below

firebase deploy --only functions
```

After deploy, copy the `createCheckoutSession` URL base into `VITE_FUNCTIONS_BASE_URL`
(e.g. `https://us-central1-<project>.cloudfunctions.net`).

> Also edit `ALLOWED_ORIGINS` in `functions/index.js` to include your real domain(s).

---

## 4. Stripe webhook

1. Stripe Dashboard → Developers → **Webhooks** → "Add endpoint".
2. Endpoint URL: `https://us-central1-<project>.cloudfunctions.net/stripeWebhook`
3. Events: `checkout.session.completed` and `checkout.session.expired`.
4. Copy the **Signing secret** (`whsec_...`) → that's your `STRIPE_WEBHOOK_SECRET` (re-run the `secrets:set` + redeploy if you set it after the first deploy).

Test locally with the Stripe CLI:

```bash
stripe listen --forward-to localhost:5001/<project>/us-central1/stripeWebhook
```

---

## 5. Add images

Drop photos into `public/images/`. The site references:

- `hero.jpg` — main hero photo
- `about.jpg` — portrait for the About section
- gallery images (any names — set their paths in **Admin → Gallery**)

You can also paste hosted image URLs directly in the admin gallery editor.

---

## 6. Deploy to Vercel

```bash
vercel            # first run links the project
vercel --prod
```

In the Vercel dashboard → Project → **Settings → Environment Variables**, add every
`VITE_*` value from your `.env`. Redeploy. `vercel.json` already handles SPA routing
and asset caching.

> Add your final Vercel/custom domain to `ALLOWED_ORIGINS` in `functions/index.js`
> and to the Firebase Auth **Authorized domains** list.

---

## Data model (Firestore)

```
site/content        → all editable copy (hero, bio, pricing, gallery, testimonials)
site/availability   → { weekly: {0..6: ["16:00",…]}, blackouts: [], leadHours }
bookings/{date_time}→ { date, time, name, email, phone, notes, status, amount, … }
                       status: pending → paid (set by the Stripe webhook)
```

A booking's document ID is `YYYY-MM-DD_HH:mm`, so a slot is physically unique —
two people can't grab the same time.

## Project structure

```
src/
  components/        marketing sections + BookingCalendar + Navbar/Footer
  components/admin/  dashboard editors (bookings, content, gallery, etc.)
  pages/             Home, BookingPage, BookingSuccess, Login, Admin, NotFound
  lib/               firebase, firestore hooks, date utils, checkout
  data/siteContent   default/fallback copy
functions/           Stripe Cloud Functions (checkout + webhook + cleanup)
```

## Routes

| Route              | Purpose                     |
| ------------------ | --------------------------- |
| `/`                | Homepage                    |
| `/book`            | Booking calendar + payment  |
| `/booking-success` | Post-payment confirmation   |
| `/login`           | Owner login                 |
| `/admin`           | Owner dashboard (protected) |
