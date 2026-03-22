import * as bcrypt from 'bcrypt';

/**
 * Number of salt rounds for bcrypt hashing
 * Higher values increase security but also increase computation time
 */
const SALT_ROUNDS = 10;

/**
 * Password complexity requirements
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

/**
 * Validates password complexity requirements
 *
 * @param password - The password to validate
 * @returns true if password meets complexity requirements
 * @throws Error if password doesn't meet requirements
 */
export function validatePasswordComplexity(password: string): boolean {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
    );
  }

  if (!PASSWORD_REGEX.test(password)) {
    throw new Error(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    );
  }

  return true;
}

/**
 * Hashes a password using bcrypt with 10 salt rounds
 *
 * Preconditions:
 * - password is non-empty string
 * - password meets complexity requirements (min 8 chars, uppercase, lowercase, number)
 *
 * Postconditions:
 * - Returns bcrypt hash string (60 characters)
 * - Hash uses salt rounds = 10
 * - Same password produces different hashes (due to random salt)
 * - Hash can be verified with bcrypt.compare()
 * - Original password cannot be recovered from hash
 *
 * @param password - The plain text password to hash
 * @returns Promise resolving to the bcrypt hash (60 characters)
 */
export async function hashPassword(password: string): Promise<string> {
  // Validate password complexity before hashing
  validatePasswordComplexity(password);

  // Generate hash with random salt
  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  return hash;
}

/**
 * Compares a plain text password with a bcrypt hash
 * Uses constant-time comparison to prevent timing attacks
 *
 * @param password - The plain text password to verify
 * @param hash - The bcrypt hash to compare against
 * @returns Promise resolving to true if password matches hash, false otherwise
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
