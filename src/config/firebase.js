// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDhBSJCCPNs-CswHOZxJ2kAxHSlqvVLnaE",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "collabzzinflu.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "collabzzinflu",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "collabzzinflu.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "173621950184",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:173621950184:web:d9ca853948733c8f0bfb5d",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-87R6DYEQPC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Firebase Functions URL
export const FUNCTIONS_URL = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || "https://us-central1-collabzzinflu.cloudfunctions.net";

export default app;
