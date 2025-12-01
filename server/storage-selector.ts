// Select between Firebase, PostgreSQL, and Memory storage based on environment variables
import { DatabaseStorage } from './storage';
import { isInitialized as isFirebaseInitialized } from './firebase';
import { MemoryStorage } from './storage-memory';

let selectedStorage: any;

// Try Firebase first
if (isFirebaseInitialized) {
  try {
    const { FirestoreStorage } = require('./storage-firebase');
    selectedStorage = new FirestoreStorage();
    console.log("✅ Using Firebase storage");
  } catch (err: any) {
    console.warn("⚠️ Failed to load Firestore storage:", err.message);
    selectedStorage = null;
  }
}

// Fallback to PostgreSQL if Firebase not available
if (!selectedStorage) {
  try {
    selectedStorage = new DatabaseStorage();
    console.log("✅ Using PostgreSQL storage");
  } catch (err: any) {
    console.warn("⚠️ PostgreSQL unavailable:", err.message);
    selectedStorage = null;
  }
}

// Final fallback to Memory storage (emergency mode)
if (!selectedStorage) {
  console.warn("⚠️ Using Memory storage (emergency mode)");
  selectedStorage = new MemoryStorage();
}

export { selectedStorage as storage };
