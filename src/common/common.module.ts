import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtTokenService } from './services/jwt.service';
import { DataLoaderFactory } from './services/dataloader.factory';
import { User } from '../modules/user/entities/user.entity';
import { Post } from '../modules/post/entities/post.entity';
import { Comment } from '../modules/comment/entities/comment.entity';
import { Profile } from '../modules/profile/entities/profile.entity';

/**
 * Common Module
 *
 * Provides shared services, utilities, and configurations
 * that are used across multiple feature modules.
 *
 * This module is marked as @Global() so its exports are available
 * throughout the application without needing to import it in every module.
 *
 * Exports:
 * - JwtTokenService: JWT token generation and verification
 * - DataLoaderFactory: DataLoader instances for N+1 query prevention
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Post, Comment, Profile]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') as any,
        },
      }),
    }),
  ],
  providers: [JwtTokenService, DataLoaderFactory],
  exports: [JwtTokenService, JwtModule, DataLoaderFactory],
})
export class CommonModule {}
