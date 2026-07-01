import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const sentry = vi.hoisted(() => ({ init: vi.fn() }));
vi.mock('@sentry/react', () => sentry);

import { initSentry } from '../lib/sentry';

beforeEach(() => sentry.init.mockReset());
afterEach(() => vi.unstubAllEnvs());

describe('initSentry', () => {
  it('does nothing when no DSN is configured', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    await initSentry();
    expect(sentry.init).not.toHaveBeenCalled();
  });

  it('initializes Sentry when a DSN is set', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://abc@o1.ingest.sentry.io/2');
    await initSentry();
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: 'https://abc@o1.ingest.sentry.io/2' }),
    );
  });
});
