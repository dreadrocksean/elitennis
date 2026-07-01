// Calls the manageBooking Cloud Function for customer self-service (view/cancel)
// using the signed token from the confirmation email — no login required.
const FUNCTIONS_BASE = import.meta.env.VITE_FUNCTIONS_BASE_URL || '';

const call = async (payload) => {
  if (!FUNCTIONS_BASE) throw new Error('Booking management is not configured.');
  const res = await fetch(`${FUNCTIONS_BASE}/manageBooking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};

export const getManagedBooking = ({ id, token }) => call({ id, token, action: 'get' });
export const cancelManagedBooking = ({ id, token }) => call({ id, token, action: 'cancel' });
