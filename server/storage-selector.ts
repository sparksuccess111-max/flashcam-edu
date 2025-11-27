// Select between Firebase and PostgreSQL storage based on environment variables
import { DatabaseStorage } from './storage';
import { isInitialized as isFirebaseInitialized } from './firebase';

let selectedStorage: any = new DatabaseStorage();

// Only try to use Firebase storage if it was successfully initialized
if (isFirebaseInitialized) {
  try {
    const { FirestoreStorage } = require('./storage-firebase');
    selectedStorage = new FirestoreStorage();
  } catch (err: any) {
    console.warn("⚠️ Failed to load Firestore storage, using PostgreSQL:", err.message);
    selectedStorage = new DatabaseStorage();
  }
}

export { selectedStorage as storage };
