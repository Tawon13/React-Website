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
export const TIKTOK_CALLBACK_URL = import.meta.env.VITE_TIKTOK_CALLBACK_URL;
export const YOUTUBE_CONNECT_URL = import.meta.env.VITE_YOUTUBE_CONNECT_URL;
export const CONTACT_EMAIL_URL = import.meta.env.VITE_CONTACT_EMAIL_URL;
export const STRIPE_CREATE_CHECKOUT_URL = import.meta.env.VITE_STRIPE_CREATE_CHECKOUT_URL;
export const STRIPE_APPROVE_COLLAB_URL = import.meta.env.VITE_STRIPE_APPROVE_COLLAB_URL;
export const MARK_PAYOUT_PAID_URL = import.meta.env.VITE_MARK_PAYOUT_PAID_URL;
export const CREATE_COLLABORATION_REQUEST_URL = import.meta.env.VITE_CREATE_COLLABORATION_REQUEST_URL;
export const RESPOND_TO_COLLABORATION_REQUEST_URL = import.meta.env.VITE_RESPOND_TO_COLLABORATION_REQUEST_URL;
export const SEND_WELCOME_EMAIL_URL = import.meta.env.VITE_SEND_WELCOME_EMAIL_URL;
export const SEND_VERIFICATION_CODE_URL = import.meta.env.VITE_SEND_VERIFICATION_CODE_URL;
export const VERIFY_EMAIL_CODE_URL = import.meta.env.VITE_VERIFY_EMAIL_CODE_URL;

// Validate required function URLs
if (!INSTAGRAM_CONNECT_URL || !TIKTOK_CONNECT_URL || !YOUTUBE_CONNECT_URL) {
    console.warn('Some Cloud Run function URLs are missing. Social media connections may not work.');
}

if (!TIKTOK_CALLBACK_URL) {
    console.warn('VITE_TIKTOK_CALLBACK_URL is missing. The TikTok connection popup will not be able to notify the app when done.');
}

if (!STRIPE_CREATE_CHECKOUT_URL || !STRIPE_APPROVE_COLLAB_URL) {
    console.warn('Some Stripe function URLs are missing. Payments may not work.');
}

if (!CREATE_COLLABORATION_REQUEST_URL || !RESPOND_TO_COLLABORATION_REQUEST_URL) {
    console.warn('Some collaboration request function URLs are missing. The request/accept flow may not work.');
}

if (!SEND_WELCOME_EMAIL_URL) {
    console.warn('VITE_SEND_WELCOME_EMAIL_URL is missing. The welcome email will not be sent.');
}

if (!SEND_VERIFICATION_CODE_URL || !VERIFY_EMAIL_CODE_URL) {
    console.warn('Some email verification function URLs are missing. The sign-up verification code flow may not work.');
}

export default app;
