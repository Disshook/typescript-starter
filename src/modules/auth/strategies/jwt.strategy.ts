import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { JWTPayload } from '../../../common/interfaces/jwt-payload.interface';

/**
 * JWT Authentication Strategy
 *
 * Passport strategy for validating JWT tokens and extracting user information.
 * This strategy:
 * 1. Extracts JWT token from Authorization header (Bearer token)
 * 2. Validates token signature using JWT_SECRET
 * 3. Checks token expiration
 * 4. Loads user from database using token payload
 * 5. Attaches user to request object
 *
 * Requirements:
 * - 2.7: Verify JWT signature using configured JWT_SECRET
 * - 2.8: Check token has not expired
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  /**
   * Validates JWT payload and returns user
   *
   * This method is called automatically by Passport after the JWT token
   * is validated. It receives the decoded token payload and should return
   * the user object to be attached to the request.
   *
   * @param payload - Decoded JWT payload
   * @returns User object if valid, throws UnauthorizedException otherwise
   */
  async validate(payload: JWTPayload): Promise<User> {
    const { sub: userId } = payload;

    // Load user from database
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    // Check if user exists
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user account is active
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Return user to be attached to request
    return user;
  }
}
