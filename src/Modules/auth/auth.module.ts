/**
 * Authentication: JWT access tokens + bcrypt passwords (handled in UserService).
 * Import JwtAuthGuard in other modules (or use @UseGuards(JwtAuthGuard)) to protect routes.
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module.js';
import { AuthService } from './service/auth.service.js';
import { AuthController } from './controller/auth.controller.js';
import { JwtStrategy } from './strategy/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('jwt.secret');
        if (!secret?.trim()) {
          throw new Error(
            'JWT_SECRET is required. Add it to your .env file (see .env.example).',
          );
        }
        return {
          secret,
          signOptions: {
            expiresIn: config.get<number>('jwt.expiresInSeconds') ?? 86400,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
