/**
 * Passport JWT strategy: reads Bearer token from Authorization header,
 * verifies signature with JWT_SECRET, and attaches { userId, userName } to the request.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type JwtPayload = {
  sub: string;
  userName: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('jwt.secret');
    if (!secret?.trim()) {
      throw new Error('JWT_SECRET is missing. Set it in .env for authentication to work.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Whatever this returns becomes `req.user` on protected routes.
   */
  validate(payload: JwtPayload): { userId: string; userName: string } {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, userName: payload.userName };
  }
}
