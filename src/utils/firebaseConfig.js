import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Environment-based or runtime Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

// Check if valid Firebase credentials are provided
export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== "your_api_key"
);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;
let analytics = null;

if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({ prompt: 'select_account' });

        // Optional Analytics if supported in browser environment
        if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
            import('firebase/analytics').then(({ getAnalytics, isSupported }) => {
                isSupported().then((supported) => {
                    if (supported) {
                        analytics = getAnalytics(app);
                    }
                }).catch(() => {});
            }).catch(() => {});
        }
    } catch (e) {
        console.warn('Firebase initialization error:', e);
    }
}

// Region Detection based on browser timezone and locale
export function detectUserRegion() {
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        if (timeZone.startsWith("America/")) return "AMERICAS";
        if (timeZone.startsWith("Europe/")) return "EUROPE";
        if (timeZone.startsWith("Asia/Calcutta") || timeZone.startsWith("Asia/Kolkata")) return "INDIA";
        if (timeZone.startsWith("Asia/")) return "ASIA";
        if (timeZone.startsWith("Australia/") || timeZone.startsWith("Pacific/")) return "OCEANIA";
        if (timeZone.startsWith("Africa/")) return "AFRICA";
    } catch (_) {}
    return "GLOBAL";
}

export { app, auth, db, googleProvider, analytics };
