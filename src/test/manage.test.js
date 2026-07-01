import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

const load = () => import('../lib/manage');

describe('manage lib', () => {
  it('throws when the functions base URL is missing', async () => {
    vi.stubEnv('VITE_FUNCTIONS_BASE_URL', '');
    vi.resetModules();
    const { getManagedBooking } = await load();
    await expect(getManagedBooking({ id: 'a', token: 't' })).rejects.toThrow(/not configured/);
  });

  it('gets a booking on success and posts the right payload', async () => {
    vi.stubEnv('VITE_FUNCTIONS_BASE_URL', 'https://fn.example');
    vi.resetModules();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ date: '2026-07-10', time: '16:00', status: 'paid' }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    const { getManagedBooking } = await load();
    const b = await getManagedBooking({ id: 'a', token: 't' });
    expect(b.date).toBe('2026-07-10');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://fn.example/manageBooking',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      id: 'a',
      token: 't',
      action: 'get',
    });
  });

  it('cancels and surfaces the server error message on failure', async () => {
    vi.stubEnv('VITE_FUNCTIONS_BASE_URL', 'https://fn.example');
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({ error: 'not found' }) })),
    );
    const { cancelManagedBooking } = await load();
    await expect(cancelManagedBooking({ id: 'a', token: 't' })).rejects.toThrow('not found');
  });

  it('falls back to a status message when the error body is unreadable', async () => {
    vi.stubEnv('VITE_FUNCTIONS_BASE_URL', 'https://fn.example');
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('bad json');
        },
      })),
    );
    const { getManagedBooking } = await load();
    await expect(getManagedBooking({ id: 'a', token: 't' })).rejects.toThrow(
      'Request failed (500)',
    );
  });
});
