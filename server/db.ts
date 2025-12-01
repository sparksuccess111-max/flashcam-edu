// PostgreSQL is COMPLETELY DISABLED
// We use SQLite (via storage-selector.ts) instead
// Neon free tier is unreliable (endpoints get disabled frequently)

// Dummy exports to prevent import errors
// DO NOT USE - storage-selector uses SQLite/Firebase/Memory instead
export const db = null;
export const queryClient = null;
