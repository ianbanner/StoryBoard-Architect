
// Corrected: Use named imports for firebase/app as per v9+ modular SDK
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA8_Dx6M0U-OE5WChRnZgia0fRiHGp0e0I",
  authDomain: "storyboard-architect.firebaseapp.com",
  projectId: "storyboard-architect",
  storageBucket: "storyboard-architect.firebasestorage.app",
  messagingSenderId: "688524050076",
  appId: "1:688524050076:web:d9d4a0d6f4f2219ccab759"
};

let dbInstance: Firestore | null = null;

// Corrected: Using named imports for app management to avoid property access errors
const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();

try {
  dbInstance = initializeFirestore(app, { experimentalForceLongPolling: true });
} catch (e) {
  dbInstance = getFirestore(app);
}

// Fix: Exporting db constant directly resolves "no exported member 'db'" errors in other files
export const db = dbInstance!;

export const getDb = (): Firestore => {
  return db;
};
