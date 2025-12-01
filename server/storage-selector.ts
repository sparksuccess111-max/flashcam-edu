// Select between SQLite, Firebase, and Memory storage
// Priority: SQLite (reliable) → Firebase (if configured) → Memory (fallback)
// PostgreSQL/Neon is disabled because free tier endpoints are unreliable
import bcrypt from 'bcrypt';
import { isInitialized as isFirebaseInitialized } from './firebase';
import { MemoryStorage } from './storage-memory';
import { SQLiteStorage } from './storage-sqlite';

let selectedStorage: any;

// Try SQLite first (most reliable, persistent, no external dependencies)
try {
  selectedStorage = new SQLiteStorage();
  console.log("✅ Using SQLite storage (reliable, persistent database)");
  
  // Initialize with default admin account if needed
  (async () => {
    try {
      const existing = await selectedStorage.getAllUsers();
      if (existing.length === 0) {
        const hashedPassword = await bcrypt.hash("CaMa_39.cAmA", 10);
        await selectedStorage.createUser({
          firstName: "Camille",
          lastName: "Cordier",
          email: "camille@flashcamedu.local",
          password: hashedPassword,
          role: "admin"
        });
        console.log("✅ Default admin account created in SQLite (Camille Cordier)");
      }
    } catch (error: any) {
      console.warn("⚠️ Could not initialize default admin:", error.message);
    }
  })();
} catch (err: any) {
  console.warn("⚠️ SQLite initialization failed:", err.message);
  selectedStorage = null;
}

// Fallback to Firebase if SQLite fails
if (!selectedStorage && isFirebaseInitialized) {
  try {
    const { FirestoreStorage } = require('./storage-firebase');
    selectedStorage = new FirestoreStorage();
    console.log("✅ Using Firebase storage (fallback)");
  } catch (err: any) {
    console.warn("⚠️ Failed to load Firestore storage:", err.message);
    selectedStorage = null;
  }
}

// Final fallback to Memory storage
if (!selectedStorage) {
  console.log("✅ Using Memory storage (final fallback - data resets on restart)");
  selectedStorage = new MemoryStorage();
  
  // Initialize with default admin account for testing
  (async () => {
    try {
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
