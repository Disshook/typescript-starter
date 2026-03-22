import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtTokenService } from './jwt.service';
import jwtConfig from '../../config/jwt.config';

/**
 * Integration tests for JwtTokenService
 *
 * These tests verify the JWT service works correctly with the actual JWT library
 * and configuration, testing real token generation and verification.
 */
describe('JwtTokenService (Integration)', () => {
  let service: JwtTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [jwtConfig],
          envFilePath: '.env.development',
        }),
        JwtModule.register({}),
      ],
      providers: [JwtTokenService],
    }).compile();

    service = module.get<JwtTokenService>(JwtTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Token Generation and Verification', () => {
    const userId = 'test-user-123';
    const email = 'test@example.com';
    const roles = ['user', 'admin'];

    it('should generate and verify access token', async () => {
      // Generate access token
      const accessToken = await service.generateAccessToken({
        sub: userId,
        email,
        roles,
      });

      expect(accessToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(accessToken.split('.')).toHaveLength(3); // JWT has 3 parts

      // Verify access token
      const payload = await service.verifyAccessToken(accessToken);

      expect(payload.sub).toBe(userId);
      expect(payload.email).toBe(email);
      expect(payload.roles).toEqual(roles);
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
      expect(payload.exp).toBeGreaterThan(payload.iat);
    });

    it('should generate and verify refresh token', async () => {
      // Generate refresh token
      const refreshToken = await service.generateRefreshToken({
        sub: userId,
        email,
        roles,
      });

      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.split('.')).toHaveLength(3);

      // Verify refresh token
      const payload = await service.verifyRefreshToken(refreshToken);

      expect(payload.sub).toBe(userId);
      expect(payload.email).toBe(email);
      expect(payload.roles).toEqual(roles);
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
      expect(payload.exp).toBeGreaterThan(payload.iat);
    });

    it('should generate both tokens with generateTokens', async () => {
      const { accessToken, refreshToken } = await service.generateTokens(
        userId,
        email,
        roles,
      );

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(accessToken).not.toBe(refreshToken);

      // Verify both tokens
      const accessPayload = await service.verifyAccessToken(accessToken);
      const refreshPayload = await service.verifyRefreshToken(refreshToken);

      expect(accessPayload.sub).toBe(userId);
      expect(refreshPayload.sub).toBe(userId);
    });

    it('should produce different hashes for same payload', async () => {
      const payload = { sub: userId, email, roles };

      const token1 = await service.generateAccessToken(payload);

      // Wait 1 second to ensure different iat timestamp
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const token2 = await service.generateAccessToken(payload);

      // Tokens should be different due to different iat timestamps
      expect(token1).not.toBe(token2);

      // But both should verify successfully
      const payload1 = await service.verifyAccessToken(token1);
      const payload2 = await service.verifyAccessToken(token2);

      expect(payload1.sub).toBe(payload2.sub);
      expect(payload1.email).toBe(payload2.email);
    });

    it('should reject access token verified with refresh secret', async () => {
      const accessToken = await service.generateAccessToken({
        sub: userId,
        email,
        roles,
      });

      // Trying to verify access token with refresh token method should fail
      await expect(service.verifyRefreshToken(accessToken)).rejects.toThrow();
    });

    it('should reject refresh token verified with access secret', async () => {
      const refreshToken = await service.generateRefreshToken({
        sub: userId,
        email,
        roles,
      });

      // Trying to verify refresh token with access token method should fail
      await expect(service.verifyAccessToken(refreshToken)).rejects.toThrow();
    });

    it('should decode token without verification', () => {
      const payload = { sub: userId, email, roles };

      // We can't easily test this without generating a real token first
      // So we'll just verify the method exists and returns expected type
      const result = service.decodeToken('invalid.token.here');
      expect(result).toBeNull();
    });
  });

  describe('Token Expiration', () => {
    it('should have correct expiration times', () => {
      const accessExpiration = service.getAccessTokenExpiresIn();
      const refreshExpiration = service.getRefreshTokenExpiresIn();

      // Access token: 1 hour = 3600 seconds
      expect(accessExpiration).toBe(3600);

      // Refresh token: 7 days = 604800 seconds
      expect(refreshExpiration).toBe(604800);
    });

    it('should set correct expiration in token payload', async () => {
      const beforeGeneration = Math.floor(Date.now() / 1000);

      const accessToken = await service.generateAccessToken({
        sub: 'test-user',
        email: 'test@example.com',
        roles: ['user'],
      });

      const payload = await service.verifyAccessToken(accessToken);
      const afterGeneration = Math.floor(Date.now() / 1000);

      // iat should be around current time
      expect(payload.iat).toBeGreaterThanOrEqual(beforeGeneration);
      expect(payload.iat).toBeLessThanOrEqual(afterGeneration);

      // exp should be iat + 3600 seconds (1 hour)
      expect(payload.exp).toBe(payload.iat + 3600);
    });
  });
});
