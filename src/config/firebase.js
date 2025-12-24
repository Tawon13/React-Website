// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const requiredEnvKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID'
];

const missingKeys = requiredEnvKeys.filter((key) => !import.meta.env[key]);

if (missingKeys.length) {
    throw new Error(
        `Firebase configuration missing. Configure these env vars: ${missingKeys.join(', ')}`
    );
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);

// Cloud Run Functions URLs (Gen2)
export const INSTAGRAM_CONNECT_URL = import.meta.env.VITE_INSTAGRAM_CONNECT_URL;
export const TIKTOK_CONNECT_URL = import.meta.env.VITE_TIKTOK_CONNECT_URL;
export const YOUTUBE_CONNECT_URL = import.meta.env.VITE_YOUTUBE_CONNECT_URL;
export const CONTACT_EMAIL_URL = import.meta.env.VITE_CONTACT_EMAIL_URL;

// Validate required function URLs
if (!INSTAGRAM_CONNECT_URL || !TIKTOK_CONNECT_URL || !YOUTUBE_CONNECT_URL) {
    console.warn('Some Cloud Run function URLs are missing. Social media connections may not work.');
}

export default app;
