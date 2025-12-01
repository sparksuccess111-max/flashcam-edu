import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

// PostgreSQL is DISABLED - we use SQLite, Firebase, or Memory storage instead
// Neon free tier is unreliable (endpoints get disabled frequently)
// This file is kept for backward compatibility but NOT used

// Create a dummy client that never connects
const queryClient = null; // PostgreSQL is disabled

// Export dummy db and queryClient (never used - storage-selector uses SQLite instead)
export const db = drizzle({ client: queryClient, schema });
export { queryClient };
