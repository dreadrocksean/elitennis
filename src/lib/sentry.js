/**
 * Initialize error monitoring. Dormant until VITE_SENTRY_DSN is set (so local
 * dev and un-configured deploys don't report). Sentry is lazy-loaded so it's
 * only pulled into the bundle when a DSN is actually configured.
 */
export const initSentry = async () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  const Sentry = await import('@sentry/react');
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
};
