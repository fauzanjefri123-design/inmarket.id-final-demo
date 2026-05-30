import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

const isConfigured = 
  apiKey && apiKey !== 'your_api_key' && !apiKey.startsWith('your_') &&
  projectId && projectId !== 'your_project_id' && !projectId.startsWith('your_');

if (!isConfigured) {
  console.warn("KONFIGURASI FIREBASE TIDAK DITEMUKAN atau masih menggunakan placeholder. Menggunakan fallback mode.");
}

const config = {
  apiKey: apiKey || 'fallback',
  authDomain: authDomain || 'fallback',
  projectId: projectId || 'fallback',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fallback',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'fallback',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'fallback',
};

// Robust initialization for both App and services to handle HMR/deployment lifecycle.
const app = !getApps().length ? initializeApp(config) : getApp();

const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'n/a';
const isOriginAuthorized = config.authDomain.includes(currentHostname) || currentHostname === 'localhost';

console.debug("Firebase Init Debug:", {
  hostname: currentHostname,
  authDomain: config.authDomain,
  projectId: config.projectId,
  isOriginAuthorized: isOriginAuthorized
});

if (!isOriginAuthorized) {
  console.warn(`[Firebase] WARNING: Hostname '${currentHostname}' may not be authorized for auth domain '${config.authDomain}'. Please check Authorized Domains in Firebase Auth settings.`);
}

const dbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DB_ID || '(default)';

export let db: any;
export let auth: any;

try {
  db = getFirestore(app, dbId);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase service initialization failed.");
  console.error("DIAGNOSTIC CHECKLIST:");
  console.error("- Current Host:", typeof window !== 'undefined' ? window.location.hostname : 'n/a');
  console.error("- Configured Auth Domain:", config.authDomain);
  console.error("- Verify that your project's Identity Toolkit API is enabled in the Google Cloud Console.");
  console.error("- Ensure the API Key provided in your environment variables has proper permissions.");
  console.error("- Check if your current host is added to 'Authorized Domains' in Firebase Auth settings (Console > Auth > Settings > Authorized Domains).");
  console.error("Error details:", error);
  throw error;
}

console.log("Firebase initialized successfully. If authentication fails, ensure 'Identity Toolkit API' is enabled and your domain is in 'Authorized Domains'.");
