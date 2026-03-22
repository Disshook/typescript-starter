import { registerAs } from '@nestjs/config';

/**
 * JWT Configuration
 *
 * Provides configuration for JWT token generation and validation:
 * - Access tokens: Short-lived (1 hour) for API authentication
 * - Refresh tokens: Long-lived (7 days) for obtaining new access tokens
 *
 * Security Requirements:
 * - JWT_SECRET must be at least 256 bits (32 characters)
 * - Different secrets for access and refresh tokens
 * - Tokens signed with HS256 algorithm
 */
export default registerAs('jwt', () => ({
  // Access token configuration (1 hour expiration)
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',

  // Refresh token configuration (7 days expiration)
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Token algorithm
  algorithm: 'HS256',
}));
