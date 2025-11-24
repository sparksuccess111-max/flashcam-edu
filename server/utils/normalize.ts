/**
 * Normalizes a name string for intelligent login comparison
 * - Trims whitespace
 * - Converts to lowercase
 * - Removes consecutive spaces
 */
export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Safely finds a user by normalized firstName and lastName
 * Throws if multiple users match (security safeguard)
 */
export function findUserByNormalizedName(users: any[], firstName: string, lastName: string) {
  const normalizedFirstName = normalizeName(firstName);
  const normalizedLastName = normalizeName(lastName);

  const matches = users.filter(u => 
    normalizeName(u.firstName) === normalizedFirstName &&
    normalizeName(u.lastName) === normalizedLastName
  );

  if (matches.length === 0) {
    return null;
  }

  if (matches.length > 1) {
    throw new Error("Plusieurs comptes trouvés avec ce nom. Veuillez contacter l'administration.");
  }

  return matches[0];
}
