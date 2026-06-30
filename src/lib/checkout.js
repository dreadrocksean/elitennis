// Kicks off Stripe Checkout via the Cloud Function, then redirects the browser.
const FUNCTIONS_BASE = import.meta.env.VITE_FUNCTIONS_BASE_URL || '';

/**
 * @param {object} booking { date, time, name, email, phone, notes, bookingId }
 * Returns nothing on success (the browser is redirected to Stripe).
 */
export const startCheckout = async (booking) => {
  if (!FUNCTIONS_BASE) {
    throw new Error('Payments are not configured yet (VITE_FUNCTIONS_BASE_URL is missing).');
  }

  const res = await fetch(`${FUNCTIONS_BASE}/createCheckoutSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...booking,
      origin: window.location.origin,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `Checkout failed (${res.status})`);
  }

  const { url } = await res.json();
  if (!url) throw new Error('No checkout URL returned.');
  window.location.assign(url); // Stripe-hosted Checkout
};
