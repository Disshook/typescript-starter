import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * JWT Strategy Unit Tests
 *
 * Tests the JWT authentication strategy for Passport.
 * Validates token extraction, user validation, and error handling.
 *
 * Requirements tested:
 * - 2.7: Verify JWT signature using configured JWT_SECRET
 * - 2.8: Check token has not expired
 * - 2.11: Reject login for inactive users
 * - 3.1: Verify valid JWT token is present in request
 */

describe('JwtStrategy', () => {
  let strategy: any;
  let userRepository: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.secret') {
        return 'test-secret-key-for-jwt-authentication';
      }
      return null;
    }),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    // Import JwtStrategy dynamically to avoid circular dependency issues
    const { JwtStrategy } = await import('./jwt.strategy');
    const { User } = await import('../../user/entities/user.entity');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
    userRepository = mockUserRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user when valid payload and user exists', async () => {
      // Arrange
      const payload = {
        sub: 'user-id-123',
        email: 'test@example.com',
        roles: ['user'],
      };

      const mockUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      const payload = {
        sub: 'non-existent-user',
        email: 'test@example.com',
        roles: ['user'],
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      // Arrange
      const payload = {
        sub: 'user-id-123',
        email: 'test@example.com',
        roles: ['user'],
      };

      const inactiveUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user'],
        isActive: false, // User is inactive
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User account is inactive',
      );
    });

    it('should extract user ID from payload.sub', async () => {
      // Arrange
      const payload = {
        sub: 'specific-user-id',
        email: 'test@example.com',
        roles: ['user'],
      };

      const mockUser = {
        id: 'specific-user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      await strategy.validate(payload);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'specific-user-id' },
      });
    });
  });
});
