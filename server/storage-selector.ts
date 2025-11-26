// Select between Firebase and PostgreSQL storage based on environment variables
import { DatabaseStorage } from './storage';

let selectedStorage: any = null;

// Check if Firebase is configured
if (process.env.FIREBASE_PROJECT_ID) {
  try {
    // Import Firebase storage only if Firebase credentials are present
    const { FirestoreStorage } = require('./storage-firebase');
    selectedStorage = new FirestoreStorage();
    console.log("✅ Firebase Firestore storage loaded");
  } catch (err: any) {
    console.error("❌ Firebase loading failed, falling back to PostgreSQL:", err.message);
    selectedStorage = new DatabaseStorage();
  }
} else {
  // Default to PostgreSQL
  selectedStorage = new DatabaseStorage();
}

export { selectedStorage as storage };
