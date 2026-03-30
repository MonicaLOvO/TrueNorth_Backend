/**
 * Auth: register, login, profile (me), update profile, change password.
 * Protected routes use JwtAuthGuard + Authorization: Bearer <access_token>
 */
import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../service/auth.service.js';
import { LoginDto } from '../dto/login.dto.js';
import { RegisterDto } from '../dto/register.dto.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { UserService } from '../../user/service/user.service.js';
import { UpdateProfileDto } from '../../user/dto/update-profile.dto.js';
import { ChangePasswordDto } from '../../user/dto/change-password.dto.js';

type AuthedRequest = Request & { user: { userId: string; userName: string } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register({
      userName: body.userName,
      password: body.password,
      email: body.email,
      displayName: body.displayName,
    });
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.userName, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthedRequest) {
    return this.userService.findById(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Req() req: AuthedRequest, @Body() body: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, body);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req: AuthedRequest, @Body() body: ChangePasswordDto) {
    await this.userService.changePassword(req.user.userId, body);
    return { ok: true };
  }
}
