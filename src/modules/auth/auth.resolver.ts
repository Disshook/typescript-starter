import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthPayload } from './dto/auth-payload.dto';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { RegisterWithEmailInput } from './dto/register-with-email.input';
import { RegisterWithMobileInput } from './dto/register-with-mobile.input';
import { LoginWithEmailInput } from './dto/login-with-email.input';
import { LoginWithMobileInput } from './dto/login-with-mobile.input';

/**
 * Authentication GraphQL Resolver
 *
 * Provides GraphQL mutations for authentication operations:
 * - User registration
 * - User login
 * - Token refresh
 *
 * All mutations return AuthPayload with tokens and user information.
 *
 * Requirements:
 * - 2.1: Register mutation
 * - 2.2: Login mutation
 * - 2.3: Return AuthPayload with tokens and user
 * - 2.12: RefreshToken mutation
 */
@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user account
   *
   * Creates a new user with hashed password and returns authentication tokens.
   *
   * GraphQL Mutation:
   * ```graphql
   * mutation Register($input: RegisterInput!) {
   *   register(input: $input) {
   *     accessToken
   *     refreshToken
   *     expiresIn
   *     user {
   *       id
   *       email
   *       firstName
   *       lastName
   *       roles
   *     }
   *   }
   * }
   * ```
   *
   * @param input - Registration input data
   * @returns AuthPayload with tokens and user information
   * @throws ConflictException if email already exists
   * @throws BadRequestException if input validation fails
   */
  @Mutation(() => AuthPayload, {
    description: 'Register a new user account',
  })
  async register(
    @Args('input') input: RegisterInput,
  ): Promise<AuthPayload> {
    return this.authService.register(input);
  }

  /**
   * Login with email and password
   *
   * Validates credentials and returns authentication tokens.
   *
   * GraphQL Mutation:
   * ```graphql
   * mutation Login($input: LoginInput!) {
   *   login(input: $input) {
   *     accessToken
   *     refreshToken
   *     expiresIn
   *     user {
   *       id
   *       email
   *       firstName
   *       lastName
   *       roles
   *     }
   *   }
   * }
   * ```
   *
   * @param input - Login credentials
   * @returns AuthPayload with tokens and user information
   * @throws UnauthorizedException if credentials are invalid
   */
  @Mutation(() => AuthPayload, {
    description: 'Login with email and password',
  })
  async login(
    @Args('input') input: LoginInput,
  ): Promise<AuthPayload> {
    return this.authService.login(input.email, input.password);
  }

  /**
   * Refresh access token using a valid refresh token
   *
   * Issues a new access token without requiring re-authentication.
   *
   * GraphQL Mutation:
   * ```graphql
   * mutation RefreshToken($input: RefreshTokenInput!) {
   *   refreshToken(input: $input) {
   *     accessToken
   *     refreshToken
   *     expiresIn
   *     user {
   *       id
   *       email
   *       firstName
   *       lastName
   *       roles
   *     }
   *   }
   * }
   * ```
   *
   * @param input - Refresh token input
   * @returns AuthPayload with new access token
   * @throws UnauthorizedException if refresh token is invalid
   */
  @Mutation(() => AuthPayload, { description: 'Refresh access token using a valid refresh token' })
  async refreshToken(@Args('input') input: RefreshTokenInput): Promise<AuthPayload> {
    return this.authService.refreshToken(input.refreshToken);
  }

  @Mutation(() => AuthPayload, { description: 'Register a new user with email and password' })
  async registerWithEmail(
    @Args('input') input: RegisterWithEmailInput,
  ): Promise<AuthPayload> {
    return this.authService.registerWithEmail(input);
  }

  @Mutation(() => AuthPayload, { description: 'Register a new user with mobile number and password' })
  async registerWithMobile(
    @Args('input') input: RegisterWithMobileInput,
  ): Promise<AuthPayload> {
    return this.authService.registerWithMobile(input);
  }

  @Mutation(() => AuthPayload, { description: 'Login with email and password' })
  async loginWithEmail(
    @Args('input') input: LoginWithEmailInput,
  ): Promise<AuthPayload> {
    return this.authService.loginWithEmail(input);
  }

  @Mutation(() => AuthPayload, { description: 'Login with mobile number and password' })
  async loginWithMobile(
    @Args('input') input: LoginWithMobileInput,
  ): Promise<AuthPayload> {
    return this.authService.loginWithMobile(input);
  }
}
