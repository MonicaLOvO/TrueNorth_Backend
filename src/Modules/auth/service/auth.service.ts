/**
 * AuthService ties together users, passwords (bcrypt), and JWTs.
 * - Register: create user (password hashed in UserService), return token.
 * - Login: check username + password, return token.
 * The frontend stores the token and sends it on protected routes.
 */
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../user/repository/user.repository.js';
import { UserService } from '../../user/service/user.service.js';
import { CreateUserDto } from '../../user/dto/create-user.dto.js';
import type { UserModel } from '../../user/model/user.model.js';
import type { JwtPayload } from '../strategy/jwt.strategy.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto): Promise<{ access_token: string; user: UserModel }> {
    const existing = await this.userRepository.findByUserName(dto.userName ?? '');
    if (existing) {
      throw new ConflictException('Username is already taken');
    }
    const email = dto.email?.trim();
    if (email) {
      const emailOwner = await this.userRepository.findByEmail(email);
      if (emailOwner) {
        throw new ConflictException('Email is already in use');
      }
    }
    const user = await this.userService.create(dto);
    return this.buildTokenResponse(user);
  }

  async login(userName: string, password: string): Promise<{ access_token: string; user: UserModel }> {
    const user = await this.userRepository.findByUserName(userName);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }
    const ok = await bcrypt.compare(password.trim(), user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid username or password');
    }
    const safeUser = await this.userService.findById(user.Id);
    return this.buildTokenResponse(safeUser);
  }

  private buildTokenResponse(user: UserModel): { access_token: string; user: UserModel } {
    const payload: JwtPayload = { sub: user.Id, userName: user.UserName ?? '' };
    const access_token = this.jwtService.sign(payload);
    return { access_token, user };
  }
}
