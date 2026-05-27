import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const requiredFirebaseEnv = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingFirebaseEnv = Object.entries(requiredFirebaseEnv)
  .filter(([, value]) => !value || value.trim() === '')
  .map(([key]) => key);

export const isFirebaseConfigured = missingFirebaseEnv.length === 0;
export const firebaseConfigError = isFirebaseConfigured
  ? null
  : `Configuracao do Firebase ausente. Defina no .env: ${missingFirebaseEnv.join(', ')}`;

const firebaseConfig = {
  apiKey: requiredFirebaseEnv.VITE_FIREBASE_API_KEY,
  authDomain: requiredFirebaseEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: requiredFirebaseEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: requiredFirebaseEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: requiredFirebaseEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: requiredFirebaseEnv.VITE_FIREBASE_APP_ID,
};

const app = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
