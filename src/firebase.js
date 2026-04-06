import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
export const auth = getAuth(app);

// Ramsha — actionCodeSettings for email verification links.
// The verification email will redirect the user to /email-verified
// where the oobCode is applied to complete verification.
export const actionCodeSettings = {
  url: `${window.location.origin}/email-verified`,
  handleCodeInApp: true,
};

// Ramsha — actionCodeSettings for password reset links.
// The reset email will redirect the user to /reset-password
// where the oobCode is used to confirm the new password.
export const passwordResetActionCodeSettings = {
  url: `${window.location.origin}/reset-password`,
  handleCodeInApp: true,
};

export default app;
