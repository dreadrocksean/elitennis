import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// checkout.js reads import.meta.env at module load, so we re-import per scenario.
const loadCheckout = async (base) => {
  vi.resetModules();
  if (base === undefined) vi.stubEnv('VITE_FUNCTIONS_BASE_URL', '');
  else vi.stubEnv('VITE_FUNCTIONS_BASE_URL', base);
  return (await import('../lib/checkout')).startCheckout;
};

describe('startCheckout', () => {
  const booking = { date: '2026-07-06', time: '16:00', name: 'Sam' };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    // window.location.assign
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { origin: 'https://example.com', assign: vi.fn() },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('throws when the functions base URL is missing', async () => {
    const startCheckout = await loadCheckout(undefined);
    await expect(startCheckout(booking)).rejects.toThrow(/not configured/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('posts the booking and redirects to the returned URL', async () => {
    const startCheckout = await loadCheckout('https://fn.example.com');
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://stripe.test/session' }),
    });
    await startCheckout(booking);
    expect(fetch).toHaveBeenCalledWith(
      'https://fn.example.com/createCheckoutSession',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body).toMatchObject({ ...booking, origin: 'https://example.com' });
    expect(window.location.assign).toHaveBeenCalledWith('https://stripe.test/session');
  });

  it('throws the server message when the response is not ok', async () => {
    const startCheckout = await loadCheckout('https://fn.example.com');
    fetch.mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });
    await expect(startCheckout(booking)).rejects.toThrow('boom');
  });

  it('falls back to a status message when no text is returned', async () => {
    const startCheckout = await loadCheckout('https://fn.example.com');
    fetch.mockResolvedValue({
      ok: false,
      status: 402,
      text: async () => {
        throw new Error('no body');
      },
    });
    await expect(startCheckout(booking)).rejects.toThrow('Checkout failed (402)');
  });

  it('throws when no URL is returned', async () => {
    const startCheckout = await loadCheckout('https://fn.example.com');
    fetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    await expect(startCheckout(booking)).rejects.toThrow('No checkout URL returned.');
  });
});
