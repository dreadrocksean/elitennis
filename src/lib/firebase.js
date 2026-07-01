import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'demo-id',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app-id',
};

// Helps surface a clear message during local dev if env vars are missing.
export const firebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID,
);

let app, auth, db, functions, storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app, 'us-central1');
  storage = getStorage(app);
} catch (error) {
  // Firebase initialization failed (e.g., invalid config)
  // App will use fallback content
  console.warn('Firebase initialization failed. Using fallback content.', error);
}

export { auth, db, functions, storage };

// One or more owner emails (comma-separated) allowed into /admin.
export const OWNER_EMAILS = (import.meta.env.VITE_OWNER_EMAIL || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
export default app;
