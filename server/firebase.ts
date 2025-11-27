import * as admin from 'firebase-admin';

let isInitialized = false;
let firestore: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

// Check if all Firebase variables are present
const hasAllVars = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

if (hasAllVars) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    }
    
    firestore = admin.firestore();
    auth = admin.auth();
    firestore.settings({ ignoreUndefinedProperties: true });
    
    isInitialized = true;
    console.log("✅ Firebase Admin SDK initialized");
  } catch (error: any) {
    console.warn("⚠️ Firebase initialization failed:", error.message);
    isInitialized = false;
  }
} else {
  console.warn("⚠️ Firebase environment variables not configured. Using PostgreSQL storage.");
}

export { firestore, auth, isInitialized };
