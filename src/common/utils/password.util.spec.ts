import {
  hashPassword,
  comparePassword,
  validatePasswordComplexity,
} from './password.util';

describe('Password Utility', () => {
  describe('validatePasswordComplexity', () => {
    it('should accept valid passwords', () => {
      expect(() => validatePasswordComplexity('Password123')).not.toThrow();
      expect(() => validatePasswordComplexity('SecurePass1')).not.toThrow();
      expect(() => validatePasswordComplexity('MyP@ssw0rd')).not.toThrow();
    });

    it('should reject passwords shorter than 8 characters', () => {
      expect(() => validatePasswordComplexity('Pass1')).toThrow(
        'Password must be at least 8 characters long',
      );
      expect(() => validatePasswordComplexity('Abc123')).toThrow();
    });

    it('should reject passwords without uppercase letter', () => {
      expect(() => validatePasswordComplexity('password123')).toThrow(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      );
    });

    it('should reject passwords without lowercase letter', () => {
      expect(() => validatePasswordComplexity('PASSWORD123')).toThrow(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      );
    });

    it('should reject passwords without number', () => {
      expect(() => validatePasswordComplexity('PasswordABC')).toThrow(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      );
    });

    it('should reject empty or null passwords', () => {
      expect(() => validatePasswordComplexity('')).toThrow();
      expect(() => validatePasswordComplexity(null as any)).toThrow();
    });
  });

  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(60); // bcrypt hash is always 60 characters
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt format
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'SecurePass123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different due to random salt
      expect(hash1.length).toBe(60);
      expect(hash2.length).toBe(60);
    });

    it('should reject invalid passwords', async () => {
      await expect(hashPassword('short')).rejects.toThrow();
      await expect(hashPassword('nouppercaseornumber')).rejects.toThrow();
      await expect(hashPassword('NOLOWERCASE123')).rejects.toThrow();
      await expect(hashPassword('NoNumbers')).rejects.toThrow();
    });

    it('should use 10 salt rounds', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);

      // bcrypt hash format: $2a$10$... where 10 is the salt rounds
      expect(hash).toMatch(/^\$2[aby]\$10\$/);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);

      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'SecurePass123';
      const wrongPassword = 'WrongPass456';
      const hash = await hashPassword(password);

      const result = await comparePassword(wrongPassword, hash);
      expect(result).toBe(false);
    });

    it('should work with different hashes of the same password', async () => {
      const password = 'SecurePass123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Both hashes should verify the same password
      expect(await comparePassword(password, hash1)).toBe(true);
      expect(await comparePassword(password, hash2)).toBe(true);

      // Hashes should be different
      expect(hash1).not.toBe(hash2);
    });

    it('should be case-sensitive', async () => {
      const password = 'SecurePass123';
      const hash = await hashPassword(password);

      expect(await comparePassword('securepass123', hash)).toBe(false);
      expect(await comparePassword('SECUREPASS123', hash)).toBe(false);
      expect(await comparePassword('SecurePass123', hash)).toBe(true);
    });
  });

  describe('Integration tests', () => {
    it('should handle complete password lifecycle', async () => {
      // User registration: hash password
      const originalPassword = 'MySecurePassword123';
      const hashedPassword = await hashPassword(originalPassword);

      // Store hash in database (simulated)
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword.length).toBe(60);

      // User login: verify password
      const loginAttempt1 = await comparePassword(
        originalPassword,
        hashedPassword,
      );
      expect(loginAttempt1).toBe(true);

      // Failed login: wrong password
      const loginAttempt2 = await comparePassword(
        'WrongPassword123',
        hashedPassword,
      );
      expect(loginAttempt2).toBe(false);
    });

    it('should not allow password recovery from hash', async () => {
      const password = 'SecretPassword123';
      const hash = await hashPassword(password);

      // Hash should not contain the original password
      expect(hash).not.toContain(password);
      expect(hash).not.toContain('Secret');
      expect(hash).not.toContain('Password');
      expect(hash).not.toContain('123');
    });
  });
});
