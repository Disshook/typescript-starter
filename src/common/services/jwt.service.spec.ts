import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { JwtTokenService } from './jwt.service';
import { JWTPayload } from '../interfaces/jwt-payload.interface';

describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockJwtSecret = 'test-secret-key-at-least-32-characters-long';
  const mockRefreshSecret = 'test-refresh-secret-key-at-least-32-chars';
  const mockExpiresIn = '1h';
  const mockRefreshExpiresIn = '7d';

  const mockPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: 'user-123',
    email: 'test@example.com',
    roles: ['user'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtTokenService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'jwt.secret': mockJwtSecret,
                'jwt.expiresIn': mockExpiresIn,
                'jwt.refreshSecret': mockRefreshSecret,
                'jwt.refreshExpiresIn': mockRefreshExpiresIn,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<JwtTokenService>(JwtTokenService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw error if JWT_SECRET is less than 32 characters', () => {
      const shortSecret = 'short-secret';
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'jwt.secret') return shortSecret;
        if (key === 'jwt.refreshSecret') return mockRefreshSecret;
        return null;
      });

      expect(() => {
        new JwtTokenService(jwtService, configService);
      }).toThrow(
        'JWT_SECRET must be at least 256 bits (32 characters) for security',
      );
    });

    it('should throw error if JWT_REFRESH_SECRET is less than 32 characters', () => {
      const shortRefreshSecret = 'short-refresh';
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'jwt.secret') return mockJwtSecret;
        if (key === 'jwt.refreshSecret') return shortRefreshSecret;
        return null;
      });

      expect(() => {
        new JwtTokenService(jwtService, configService);
      }).toThrow(
        'JWT_REFRESH_SECRET must be at least 256 bits (32 characters) for security',
      );
    });
  });

  describe('generateAccessToken', () => {
    it('should generate an access token with correct payload and expiration', async () => {
      const mockToken = 'mock-access-token';
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(mockToken);

      const result = await service.generateAccessToken(mockPayload);

      expect(result).toBe(mockToken);
      expect(jwtService.signAsync).toHaveBeenCalledWith(mockPayload, {
        secret: mockJwtSecret,
        expiresIn: mockExpiresIn,
      });
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token with correct payload and expiration', async () => {
      const mockToken = 'mock-refresh-token';
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(mockToken);

      const result = await service.generateRefreshToken(mockPayload);

      expect(result).toBe(mockToken);
      expect(jwtService.signAsync).toHaveBeenCalledWith(mockPayload, {
        secret: mockRefreshSecret,
        expiresIn: mockRefreshExpiresIn,
      });
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', async () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const result = await service.generateTokens(
        mockPayload.sub,
        mockPayload.email,
        mockPayload.roles,
      );

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and return payload for valid access token', async () => {
      const mockToken = 'valid-access-token';
      const mockDecodedPayload: JWTPayload = {
        ...mockPayload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue(mockDecodedPayload);

      const result = await service.verifyAccessToken(mockToken);

      expect(result).toEqual(mockDecodedPayload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
        secret: mockJwtSecret,
      });
    });

    it('should throw UnauthorizedException for invalid access token', async () => {
      const mockToken = 'invalid-access-token';
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new Error('Invalid token'));

      await expect(service.verifyAccessToken(mockToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.verifyAccessToken(mockToken)).rejects.toThrow(
        'Invalid or expired access token',
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and return payload for valid refresh token', async () => {
      const mockToken = 'valid-refresh-token';
      const mockDecodedPayload: JWTPayload = {
        ...mockPayload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 604800,
      };

      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue(mockDecodedPayload);

      const result = await service.verifyRefreshToken(mockToken);

      expect(result).toEqual(mockDecodedPayload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
        secret: mockRefreshSecret,
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const mockToken = 'invalid-refresh-token';
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new Error('Invalid token'));

      await expect(service.verifyRefreshToken(mockToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.verifyRefreshToken(mockToken)).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const mockToken = 'some-token';
      const mockDecodedPayload: JWTPayload = {
        ...mockPayload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      jest.spyOn(jwtService, 'decode').mockReturnValue(mockDecodedPayload);

      const result = service.decodeToken(mockToken);

      expect(result).toEqual(mockDecodedPayload);
      expect(jwtService.decode).toHaveBeenCalledWith(mockToken);
    });

    it('should return null for invalid token', () => {
      const mockToken = 'invalid-token';
      jest.spyOn(jwtService, 'decode').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = service.decodeToken(mockToken);

      expect(result).toBeNull();
    });
  });

  describe('getAccessTokenExpiresIn', () => {
    it('should return expiration time in seconds for access token', () => {
      const result = service.getAccessTokenExpiresIn();
      expect(result).toBe(3600); // 1 hour = 3600 seconds
    });
  });

  describe('getRefreshTokenExpiresIn', () => {
    it('should return expiration time in seconds for refresh token', () => {
      const result = service.getRefreshTokenExpiresIn();
      expect(result).toBe(604800); // 7 days = 604800 seconds
    });
  });

  describe('parseExpirationToSeconds', () => {
    it('should parse seconds correctly', () => {
      const result = service['parseExpirationToSeconds']('60s');
      expect(result).toBe(60);
    });

    it('should parse minutes correctly', () => {
      const result = service['parseExpirationToSeconds']('30m');
      expect(result).toBe(1800);
    });

    it('should parse hours correctly', () => {
      const result = service['parseExpirationToSeconds']('2h');
      expect(result).toBe(7200);
    });

    it('should parse days correctly', () => {
      const result = service['parseExpirationToSeconds']('7d');
      expect(result).toBe(604800);
    });

    it('should parse number without unit as seconds', () => {
      const result = service['parseExpirationToSeconds']('3600');
      expect(result).toBe(3600);
    });

    it('should throw error for invalid format', () => {
      expect(() => service['parseExpirationToSeconds']('invalid')).toThrow(
        'Invalid expiration format: invalid',
      );
    });
  });
});
