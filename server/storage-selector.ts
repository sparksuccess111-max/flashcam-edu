// Select between Firebase and Memory storage
// PostgreSQL is disabled because Neon free tier endpoint is unreliable
import bcrypt from 'bcrypt';
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

// Use Memory storage as default (works reliably without external dependencies)
// PostgreSQL/Neon is disabled because free tier endpoints are frequently disabled
if (!selectedStorage) {
  console.log("✅ Using Memory storage (Firebase not available - using reliable in-memory database)");
  selectedStorage = new MemoryStorage();
  
  // Initialize with default admin account for testing
  (async () => {
    try {
      // Create default admin account
      const hashedPassword = await bcrypt.hash("CaMa_39.cAmA", 10);
      await selectedStorage.createUser({
        firstName: "Camille",
        lastName: "Cordier",
        email: "camille@flashcamedu.local",
        password: hashedPassword,
        role: "admin"
      });
      console.log("✅ Default admin account created (Camille Cordier)");
    } catch (error: any) {
      // User might already exist, ignore
    }
  })();
}

export { selectedStorage as storage };
