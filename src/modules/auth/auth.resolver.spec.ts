import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { AuthPayload } from './dto/auth-payload.dto';
import { User } from '../user/entities/user.entity';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: jest.Mocked<AuthService>;

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

  const mockAuthPayload: AuthPayload = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: mockUser,
    expiresIn: 3600,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and return AuthPayload', async () => {
      authService.register.mockResolvedValue(mockAuthPayload);

      const input = {
        email: 'new@example.com',
        password: 'Password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const result = await resolver.register(input);

      expect(authService.register).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockAuthPayload);
    });
  });

  describe('login', () => {
    it('should call authService.login and return AuthPayload', async () => {
      authService.login.mockResolvedValue(mockAuthPayload);

      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await resolver.login(input);

      expect(authService.login).toHaveBeenCalledWith(
        input.email,
        input.password,
      );
      expect(result).toEqual(mockAuthPayload);
    });
  });

  describe('refreshToken', () => {
    it('should call authService.refreshToken and return AuthPayload', async () => {
      authService.refreshToken.mockResolvedValue(mockAuthPayload);

      const input = {
        refreshToken: 'refresh-token',
      };

      const result = await resolver.refreshToken(input);

      expect(authService.refreshToken).toHaveBeenCalledWith(input.refreshToken);
      expect(result).toEqual(mockAuthPayload);
    });
  });
});
