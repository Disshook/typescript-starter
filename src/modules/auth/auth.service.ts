import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { JwtTokenService } from '../../common/services/jwt.service';
import {
  hashPassword,
  comparePassword,
} from '../../common/utils/password.util';
import { RegisterInput } from './dto/register.input';
import { RegisterWithEmailInput } from './dto/register-with-email.input';
import { RegisterWithMobileInput } from './dto/register-with-mobile.input';
import { LoginWithEmailInput } from './dto/login-with-email.input';
import { LoginWithMobileInput } from './dto/login-with-mobile.input';
import { AuthPayload } from './dto/auth-payload.dto';

/**
 * Authentication Service
 *
 * Handles complex authentication business logic:
 * - User registration with password hashing
 * - User login with credential validation
 * - JWT token generation and refresh
 * - Password verification
 *
 * Requirements:
 * - 2.1: User registration with hashed password
 * - 2.2: Assign default role of "user"
 * - 2.3: Return access token, refresh token, and user information
 * - 2.4: Validate credentials with bcrypt
 * - 2.5: Generate JWT access token with 1-hour expiration
 * - 2.6: Generate JWT refresh token with 7-day expiration
 * - 2.9: Return conflict error for duplicate email
 * - 2.10: Return unauthorized error for invalid credentials
 * - 2.11: Reject login for inactive accounts
 * - 2.12: Issue new access token from valid refresh token
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  /**
   * Validates user credentials
   *
   * Verifies email exists and password matches the stored hash.
   * Does not reveal whether email or password was incorrect for security.
   *
   * Preconditions:
   * - email is non-empty valid email format
   * - password is non-empty string
   *
   * Postconditions:
   * - Returns User entity if credentials are valid and account is active
   * - Returns null if credentials are invalid or account is inactive
   * - Does not throw exceptions (returns null for security)
   *
   * @param email - User's email address
   * @param password - Plain text password to verify
   * @returns User entity if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    if (!email) return null;
    const user = await this.userRepository.findOne({
      where: { email },
    });

    // Return null if user doesn't exist (don't reveal this to caller)
    if (!user) {
      return null;
    }

    // Return null if account is inactive
    if (!user.isActive) {
      return null;
    }

    // Verify password using bcrypt constant-time comparison
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    // Return null if password doesn't match
    if (!isPasswordValid) {
      return null;
    }

    // Credentials are valid
    return user;
  }

  /**
   * Authenticates user and generates tokens
   *
   * Validates credentials and returns JWT tokens with user information.
   *
   * Preconditions:
   * - email is non-empty valid email format
   * - password is non-empty string
   *
   * Postconditions:
   * - Returns AuthPayload with valid access and refresh tokens
   * - Access token expires in 1 hour
   * - Refresh token expires in 7 days
   * - Throws UnauthorizedException if credentials are invalid
   *
   * @param email - User's email address
   * @param password - Plain text password
   * @returns AuthPayload with tokens and user information
   * @throws UnauthorizedException if credentials are invalid or account is inactive
   */
  async login(email: string, password: string): Promise<AuthPayload> {
    // Validate credentials
    const user = await this.validateUser(email, password);

    // Throw unauthorized error if validation failed
    // Don't reveal whether email or password was incorrect
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } =
      await this.jwtTokenService.generateTokens(
        user.id,
        user.email,
        user.roles,
      );

    // Get access token expiration time
    const expiresIn = this.jwtTokenService.getAccessTokenExpiresIn();

    // Return authentication payload
    return {
      accessToken,
      refreshToken,
      user,
      expiresIn,
    };
  }

  /**
   * Registers a new user account
   *
   * Creates a new user with hashed password and default role.
   * Validates email uniqueness and password complexity.
   *
   * Preconditions:
   * - input.email is valid email format and unique
   * - input.password meets complexity requirements (min 8 chars, uppercase, lowercase, number)
   * - input.firstName is 1-100 characters
   * - input.lastName is 1-100 characters
   *
   * Postconditions:
   * - Creates new user in database with hashed password
   * - Assigns default role of "user"
   * - Returns AuthPayload with valid access and refresh tokens
   * - Throws ConflictException if email already exists
   *
   * @param input - Registration input data
   * @returns AuthPayload with tokens and user information
   * @throws ConflictException if email already exists
   */
  async register(input: RegisterInput): Promise<AuthPayload> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password using bcrypt with 10 salt rounds
    // This also validates password complexity
    const passwordHash = await hashPassword(input.password);

    // Create new user entity
    const user = this.userRepository.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      roles: ['user'], // Default role
      isActive: true,
    });

    // Save user to database
    await this.userRepository.save(user);

    // Generate JWT tokens
    const { accessToken, refreshToken } =
      await this.jwtTokenService.generateTokens(
        user.id,
        user.email,
        user.roles,
      );

    // Get access token expiration time
    const expiresIn = this.jwtTokenService.getAccessTokenExpiresIn();

    // Return authentication payload
    return {
      accessToken,
      refreshToken,
      user,
      expiresIn,
    };
  }

  /**
   * Refreshes access token using a valid refresh token
   *
   * Verifies the refresh token and issues a new access token.
   * The refresh token itself is not rotated.
   *
   * Preconditions:
   * - refreshToken is a valid JWT refresh token
   * - User associated with token still exists and is active
   *
   * Postconditions:
   * - Returns new AuthPayload with fresh access token
   * - Refresh token remains the same
   * - Throws UnauthorizedException if refresh token is invalid or user is inactive
   *
   * @param refreshToken - Valid JWT refresh token
   * @returns AuthPayload with new access token
   * @throws UnauthorizedException if refresh token is invalid or user is inactive
   */
  async refreshToken(refreshToken: string): Promise<AuthPayload> {
    const payload = await this.jwtTokenService.verifyRefreshToken(refreshToken);

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const accessToken = await this.jwtTokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    const expiresIn = this.jwtTokenService.getAccessTokenExpiresIn();

    return {
      accessToken,
      refreshToken,
      user,
      expiresIn,
    };
  }

  async registerWithEmail(input: RegisterWithEmailInput): Promise<AuthPayload> {
    const existing = await this.userRepository.findOne({
      where: { email: input.email },
    });
    if (existing) throw new ConflictException('Email already exists');

    const passwordHash = await hashPassword(input.password);
    const user = this.userRepository.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      roles: ['user'],
      isActive: true,
    });
    await this.userRepository.save(user);

    return this.generatePayload(user);
  }

  async registerWithMobile(
    input: RegisterWithMobileInput,
  ): Promise<AuthPayload> {
    const existing = await this.userRepository.findOne({
      where: { mobile: input.mobile },
    });
    if (existing) throw new ConflictException('Mobile number already exists');

    const passwordHash = await hashPassword(input.password);
    const user = this.userRepository.create({
      mobile: input.mobile,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      roles: ['user'],
      isActive: true,
    });
    await this.userRepository.save(user);

    return this.generatePayload(user);
  }

  async loginWithEmail(input: LoginWithEmailInput): Promise<AuthPayload> {
    let user: User | null = null;

    if (input.email) {
      user = await this.validateUser(input.email, input.password);
    } else if (input.mobile) {
      user = await this.userRepository.findOne({ where: { mobile: input.mobile } });
      if (user && user.isActive) {
        const valid = await comparePassword(input.password, user.passwordHash);
        if (!valid) user = null;
      } else {
        user = null;
      }
    }

    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.generatePayload(user);
  }

  async loginWithMobile(input: LoginWithMobileInput): Promise<AuthPayload> {
    let user: User | null = null;

    if (input.mobile) {
      user = await this.userRepository.findOne({ where: { mobile: input.mobile } });
      if (user && user.isActive) {
        const valid = await comparePassword(input.password, user.passwordHash);
        if (!valid) user = null;
      } else {
        user = null;
      }
    } else if (input.email) {
      user = await this.validateUser(input.email, input.password);
    }

    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.generatePayload(user);
  }

  private async generatePayload(user: User): Promise<AuthPayload> {
    const { accessToken, refreshToken } =
      await this.jwtTokenService.generateTokens(
        user.id,
        user.email,
        user.roles,
      );
    const expiresIn = this.jwtTokenService.getAccessTokenExpiresIn();
    return { accessToken, refreshToken, user, expiresIn };
  }
}
