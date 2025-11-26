// Select between Firebase and PostgreSQL storage based on environment variables
// Default to PostgreSQL - Firebase will be loaded asynchronously if available
import { storage as pgStorage } from './storage';

export const storage = pgStorage;
