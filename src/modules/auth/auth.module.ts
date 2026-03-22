import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { User } from '../user/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtTokenService } from '../../common/services/jwt.service';

/**
 * Authentication Module
 *
 * Provides authentication and authorization functionality:
 * - User registration and login
 * - JWT token generation and validation
 * - Passport JWT strategy for protected routes
 * - Authentication guards for GraphQL resolvers
 * - Token refresh functionality
 *
 * This module configures:
 * - JwtModule with secret and expiration from config
 * - PassportModule with JWT strategy
 * - User repository for user validation
 * - AuthService for complex authentication business logic
 * - AuthResolver for GraphQL mutations
 */
@Module({
  imports: [
    // Import User entity repository for JWT strategy
    TypeOrmModule.forFeature([User]),

    // Configure Passport with default JWT strategy
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Configure JWT module with async configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = (configService.get<string>('jwt.expiresIn') ||
          '1h') as StringValue;
        return {
          secret: configService.get<string>('jwt.secret'),
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  providers: [
    // Register JWT strategy
    JwtStrategy,
    // Register JWT token service
    JwtTokenService,
    // Register authentication service
    AuthService,
    // Register authentication resolver
    AuthResolver,
  ],
  exports: [
    // Export JwtStrategy for use in guards
    JwtStrategy,
    // Export PassportModule for use in other modules
    PassportModule,
    // Export JwtModule for token generation in AuthService
    JwtModule,
    // Export AuthService for use in other modules
    AuthService,
  ],
})
export class AuthModule {}
