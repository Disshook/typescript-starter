import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';
import { JwtTokenService } from '../../common/services/jwt.service';
import * as passwordUtil from '../../common/utils/password.util';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtTokenService: jest.Mocked<JwtTokenService>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    roles: ['user'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    posts: [],
    comments: [],
    profile: undefined,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtTokenService,
          useValue: {
            generateTokens: jest.fn(),
            generateAccessToken: jest.fn(),
            verifyRefreshToken: jest.fn(),
            getAccessTokenExpiresIn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtTokenService = module.get(JwtTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(passwordUtil, 'comparePassword').mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(passwordUtil, 'comparePassword').mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });

    it('should return null when account is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOne.mockResolvedValue(inactiveUser);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return AuthPayload when credentials are valid', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(passwordUtil, 'comparePassword').mockResolvedValue(true);
      jwtTokenService.generateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      jwtTokenService.getAccessTokenExpiresIn.mockReturnValue(3600);

      const result = await service.login('test@example.com', 'password123');

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
        expiresIn: 3600,
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create new user and return AuthPayload', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      jest
        .spyOn(passwordUtil, 'hashPassword')
        .mockResolvedValue('$2b$10$hashedpassword');
      jwtTokenService.generateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      jwtTokenService.getAccessTokenExpiresIn.mockReturnValue(3600);

      const result = await service.register({
        email: 'new@example.com',
        password: 'Password123',
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
        expiresIn: 3600,
      });
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Password123',
          firstName: 'Jane',
          lastName: 'Smith',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('refreshToken', () => {
    it('should return new AuthPayload with fresh access token', async () => {
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
        iat: 1234567890,
        exp: 1234567890,
      };
      jwtTokenService.verifyRefreshToken.mockResolvedValue(payload);
      userRepository.findOne.mockResolvedValue(mockUser);
      jwtTokenService.generateAccessToken.mockResolvedValue('new-access-token');
      jwtTokenService.getAccessTokenExpiresIn.mockReturnValue(3600);

      const result = await service.refreshToken('refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
        expiresIn: 3600,
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const payload = {
        sub: 'nonexistent-id',
        email: 'test@example.com',
        roles: ['user'],
        iat: 1234567890,
        exp: 1234567890,
      };
      jwtTokenService.verifyRefreshToken.mockResolvedValue(payload);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshToken('refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when account is inactive', async () => {
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
        iat: 1234567890,
        exp: 1234567890,
      };
      const inactiveUser = { ...mockUser, isActive: false };
      jwtTokenService.verifyRefreshToken.mockResolvedValue(payload);
      userRepository.findOne.mockResolvedValue(inactiveUser);

      await expect(service.refreshToken('refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
