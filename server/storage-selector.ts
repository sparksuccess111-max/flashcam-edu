// Select between Firebase and PostgreSQL storage based on environment variables
import { DatabaseStorage } from './storage';

// Check if all Firebase environment variables are set
const hasFirebaseConfig = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

let selectedStorage: any = new DatabaseStorage();

// If Firebase is configured, we'll try to use it
if (hasFirebaseConfig) {
  try {
    // Lazy load Firebase storage only if configured
    const { FirestoreStorage } = require('./storage-firebase');
    selectedStorage = new FirestoreStorage();
  } catch (err: any) {
    console.warn("⚠️  Firebase initialization failed, falling back to PostgreSQL:", err.message);
    selectedStorage = new DatabaseStorage();
  }
}

export { selectedStorage as storage };
