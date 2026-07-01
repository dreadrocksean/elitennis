import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.doUnmock('firebase/app');
  vi.doUnmock('firebase/auth');
  vi.doUnmock('firebase/firestore');
  vi.doUnmock('firebase/functions');
  vi.doUnmock('firebase/storage');
});

const mockSdk = ({ initThrows = false } = {}) => {
  vi.doMock('firebase/app', () => ({
    initializeApp: vi.fn(() => {
      if (initThrows) throw new Error('bad config');
      return { name: 'app' };
    }),
  }));
  vi.doMock('firebase/auth', () => ({ getAuth: vi.fn(() => ({ kind: 'auth' })) }));
  vi.doMock('firebase/firestore', () => ({ getFirestore: vi.fn(() => ({ kind: 'db' })) }));
  vi.doMock('firebase/functions', () => ({ getFunctions: vi.fn(() => ({ kind: 'functions' })) }));
  vi.doMock('firebase/storage', () => ({ getStorage: vi.fn(() => ({ kind: 'storage' })) }));
};

describe('firebase config', () => {
  it('is configured and lowercases the owner email when env is present', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'real-key');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'real.firebaseapp.com');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'real-project');
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'real.appspot.com');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', 'real-sender');
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'real-app');
    vi.stubEnv('VITE_OWNER_EMAIL', 'Coach@Eli.COM');
    mockSdk();
    const mod = await import('../lib/firebase');
    expect(mod.firebaseConfigured).toBe(true);
    expect(mod.OWNER_EMAILS).toEqual(['coach@eli.com']);
    expect(mod.auth).toEqual({ kind: 'auth' });
    expect(mod.db).toEqual({ kind: 'db' });
    expect(mod.functions).toEqual({ kind: 'functions' });
    expect(mod.storage).toEqual({ kind: 'storage' });
    expect(mod.default).toEqual({ name: 'app' });
  });

  it('is not configured and owner email empty when env is missing', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', '');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', '');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '');
    vi.stubEnv('VITE_FIREBASE_APP_ID', '');
    vi.stubEnv('VITE_OWNER_EMAIL', '');
    mockSdk();
    const mod = await import('../lib/firebase');
    expect(mod.firebaseConfigured).toBe(false);
    expect(mod.OWNER_EMAILS).toEqual([]);
  });

  it('parses a comma-separated list of owner emails', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'real-key');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'real-project');
    vi.stubEnv('VITE_OWNER_EMAIL', 'Coach@Eli.com, owner2@kc.com , ');
    mockSdk();
    const mod = await import('../lib/firebase');
    expect(mod.OWNER_EMAILS).toEqual(['coach@eli.com', 'owner2@kc.com']);
  });

  it('warns and continues when initialization throws', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'real-key');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'real-project');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockSdk({ initThrows: true });
    const mod = await import('../lib/firebase');
    expect(warn).toHaveBeenCalledWith(
      'Firebase initialization failed. Using fallback content.',
      expect.any(Error),
    );
    expect(mod.auth).toBeUndefined();
    expect(mod.db).toBeUndefined();
    warn.mockRestore();
  });
});
