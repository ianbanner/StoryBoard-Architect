
// Fix: Use namespace import for firebase/app to resolve "no exported member" errors in some environments
import * as firebaseApp from 'firebase/app';
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

// Fix: Correctly initialize and export 'db' to be used by other files (DataExplorer, DatabaseSync, etc.)
const app = firebaseApp.getApps().length === 0 ? firebaseApp.initializeApp(FIREBASE_CONFIG) : firebaseApp.getApp();

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
