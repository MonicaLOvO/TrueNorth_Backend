/**
 * Use on routes that require a logged-in user.
 * Client sends: Authorization: Bearer <access_token>
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
