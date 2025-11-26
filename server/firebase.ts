import * as admin from 'firebase-admin';

if (!process.env.FIREBASE_PROJECT_ID) {
  console.error("❌ FIREBASE_PROJECT_ID not set in environment variables");
  process.exit(1);
}

if (!process.env.FIREBASE_CLIENT_EMAIL) {
  console.error("❌ FIREBASE_CLIENT_EMAIL not set in environment variables");
  process.exit(1);
}

if (!process.env.FIREBASE_PRIVATE_KEY) {
  console.error("❌ FIREBASE_PRIVATE_KEY not set in environment variables");
  process.exit(1);
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  }
  console.log("✅ Firebase Admin SDK initialized");
} catch (error: any) {
  console.error("❌ Failed to initialize Firebase:", error.message);
  process.exit(1);
}

export const firestore = admin.firestore();
export const auth = admin.auth();

firestore.settings({ ignoreUndefinedProperties: true });

export default admin.app();
