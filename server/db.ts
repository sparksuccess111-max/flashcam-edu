import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

// If FIREBASE_PROJECT_ID is set, we'll use Firebase instead of PostgreSQL
// DATABASE_URL is only required if NOT using Firebase
if (!process.env.FIREBASE_PROJECT_ID && !process.env.DATABASE_URL) {
  throw new Error(
    "Either FIREBASE_PROJECT_ID or DATABASE_URL must be set",
  );
}

// Create postgres client for Supabase or any PostgreSQL database (if DATABASE_URL exists)
const queryClient = process.env.DATABASE_URL 
  ? postgres(process.env.DATABASE_URL)
  : null; // Firebase will be used instead

// Export db and queryClient for use in the application
export const db = drizzle({ client: queryClient, schema });
export { queryClient };
