import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create postgres client for Supabase or any PostgreSQL database
const queryClient = postgres(process.env.DATABASE_URL);

// Export db and queryClient for use in the application
export const db = drizzle({ client: queryClient, schema });
export { queryClient };
