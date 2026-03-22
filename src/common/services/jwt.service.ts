import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { JWTPayload } from '../interfaces/jwt-payload.interface';

/**
 * JWT Token Service
 *
 * Handles JWT token generation and verification for authentication.
 * Provides methods for:
 * - Generating access tokens (1 hour expiration)
 * - Generating refresh tokens (7 days expiration)
 * - Verifying and decoding tokens
 * - Extracting payload from tokens
 *
 * Requirements:
 * - 2.5: Generate JWT access token with 1-hour expiration
 * - 2.6: Generate JWT refresh token with 7-day expiration
 * - 2.7: Verify JWT signature using configured JWT_SECRET
 * - 2.8: Check token has not expired
 * - 15.3: Sign tokens with configured JWT_SECRET
 * - 15.4: Validate JWT_SECRET is at least 256 bits
 */
@Injectable()
export class JwtTokenService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {
    // Load JWT configuration
    this.jwtSecret = this.configService.get<string>('jwt.secret');
    this.jwtExpiresIn = this.configService.get<string>('jwt.expiresIn');
    this.jwtRefreshSecret = this.configService.get<string>('jwt.refreshSecret');
    this.jwtRefreshExpiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
    );

    // Validate JWT_SECRET is at least 256 bits (32 characters)
    if (!this.jwtSecret || this.jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 256 bits (32 characters) for security',
      );
    }

    if (!this.jwtRefreshSecret || this.jwtRefreshSecret.length < 32) {
      throw new Error(
        'JWT_REFRESH_SECRET must be at least 256 bits (32 characters) for security',
      );
    }
  }

  /**
   * Generates an access token for a user
   *
   * Access tokens are short-lived (1 hour) and used for API authentication.
   *
   * @param payload - JWT payload containing user information
   * @returns Signed JWT access token string
   */
  async generateAccessToken(
    payload: Omit<JWTPayload, 'iat' | 'exp'>,
  ): Promise<string> {
    return this.jwtService.signAsync(payload as any, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn as any,
    });
  }

  /**
   * Generates a refresh token for a user
   *
   * Refresh tokens are long-lived (7 days) and used to obtain new access tokens.
   *
   * @param payload - JWT payload containing user information
   * @returns Signed JWT refresh token string
   */
  async generateRefreshToken(
    payload: Omit<JWTPayload, 'iat' | 'exp'>,
  ): Promise<string> {
    return this.jwtService.signAsync(payload as any, {
      secret: this.jwtRefreshSecret,
      expiresIn: this.jwtRefreshExpiresIn as any,
    });
  }

  /**
   * Generates both access and refresh tokens for a user
   *
   * @param userId - User's unique identifier
   * @param email - User's email address
   * @param roles - User's roles for authorization
   * @returns Object containing both access and refresh tokens
   */
  async generateTokens(
    userId: string,
    email: string,
    roles: string[],
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      roles,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verifies an access token and extracts the payload
   *
   * Validates:
   * - Token signature using JWT_SECRET
   * - Token has not expired
   *
   * @param token - JWT access token to verify
   * @returns Decoded JWT payload
   * @throws UnauthorizedException if token is invalid or expired
   */
  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JWTPayload>(token, {
        secret: this.jwtSecret,
      });
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /**
   * Verifies a refresh token and extracts the payload
   *
   * Validates:
   * - Token signature using JWT_REFRESH_SECRET
   * - Token has not expired
   *
   * @param token - JWT refresh token to verify
   * @returns Decoded JWT payload
   * @throws UnauthorizedException if token is invalid or expired
   */
  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JWTPayload>(token, {
        secret: this.jwtRefreshSecret,
      });
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Decodes a token without verifying the signature
   *
   * WARNING: This method does not validate the token.
   * Use only when you need to inspect token contents without verification.
   *
   * @param token - JWT token to decode
   * @returns Decoded JWT payload or null if invalid
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      return this.jwtService.decode(token);
    } catch {
      return null;
    }
  }

  /**
   * Gets the expiration time in seconds for access tokens
   *
   * @returns Expiration time in seconds (3600 for 1 hour)
   */
  getAccessTokenExpiresIn(): number {
    // Parse expiration string (e.g., "1h" -> 3600 seconds)
    return this.parseExpirationToSeconds(this.jwtExpiresIn);
  }

  /**
   * Gets the expiration time in seconds for refresh tokens
   *
   * @returns Expiration time in seconds (604800 for 7 days)
   */
  getRefreshTokenExpiresIn(): number {
    // Parse expiration string (e.g., "7d" -> 604800 seconds)
    return this.parseExpirationToSeconds(this.jwtRefreshExpiresIn);
  }

  /**
   * Parses expiration string to seconds
   *
   * Supports formats: "1h", "7d", "60s", "3600"
   *
   * @param expiration - Expiration string
   * @returns Expiration in seconds
   */
  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd]?)$/);
    if (!match) {
      throw new Error(`Invalid expiration format: ${expiration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] || 's';

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }
}
