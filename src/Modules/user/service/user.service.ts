import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repository/user.repository.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { UserDto } from '../dto/user.dto.js';
import { User } from '../entity/user.entity.js';
import { UserModel } from '../model/user.model.js';
import type { UpdateProfileDto } from '../dto/update-profile.dto.js';
import type { ChangePasswordDto } from '../dto/change-password.dto.js';

/** Cost factor for bcrypt password hashing (higher = slower, more secure). */
const BCRYPT_ROUNDS = 10;

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll(): Promise<UserModel[]> {
    const entities = await this.userRepository.findAll();
    return entities.map((entity) => this.mapEntityToModel(entity));
  }

  async findById(id: string): Promise<UserModel> {
    const entity = await this.userRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`User with id '${id}' not found`);
    }
    return this.mapEntityToModel(entity);
  }

  async create(input: CreateUserDto): Promise<UserModel> {
    const normalizedUserName = input.userName ?? (input as { UserName?: string }).UserName;
    const normalizedPassword = input.password ?? (input as { Password?: string }).Password;
    const normalizedEmail = input.email ?? (input as { Email?: string }).Email;
    const normalizedDisplayName = input.displayName ?? (input as { DisplayName?: string }).DisplayName;

    if (!normalizedUserName?.trim()) {
      throw new BadRequestException('userName is required');
    }

    if (!normalizedPassword?.trim()) {
      throw new BadRequestException('password is required');
    }

    const emailTrimmed = normalizedEmail?.trim()
      ? normalizedEmail.trim().toLowerCase()
      : null;
    if (emailTrimmed) {
      const emailOwner = await this.userRepository.findByEmail(emailTrimmed);
      if (emailOwner) {
        throw new ConflictException('Email is already in use');
      }
    }

    const passwordHash = await bcrypt.hash(normalizedPassword.trim(), BCRYPT_ROUNDS);
    const saved = await this.userRepository.createAndSave({
      userName: normalizedUserName.trim(),
      password: passwordHash,
      email: emailTrimmed,
      displayName: normalizedDisplayName?.trim() ? normalizedDisplayName.trim() : null,
    });
    return this.mapEntityToModel(saved);
  }

  async update(id: string, input: UserDto): Promise<UserModel> {
    const entity = await this.userRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`User with id '${id}' not found`);
    }

    const normalizedUserName = input.userName ?? (input as { UserName?: string }).UserName;
    const normalizedPassword = input.password ?? (input as { Password?: string }).Password;

    if (!normalizedUserName?.trim()) {
      throw new BadRequestException('userName is required');
    }

    if (!normalizedPassword?.trim()) {
      throw new BadRequestException('password is required');
    }

    entity.userName = normalizedUserName.trim();
    entity.password = await bcrypt.hash(normalizedPassword.trim(), BCRYPT_ROUNDS);

    const saved = await this.userRepository.save(entity);
    return this.mapEntityToModel(saved);
  }

  /**
   * Partial profile update for the logged-in user (no password here).
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserModel> {
    const entity = await this.userRepository.findById(userId);
    if (!entity) {
      throw new NotFoundException(`User with id '${userId}' not found`);
    }

    if (dto.userName !== undefined && dto.userName.trim()) {
      const next = dto.userName.trim();
      if (next !== entity.userName) {
        const taken = await this.userRepository.findByUserName(next);
        if (taken && taken.Id !== userId) {
          throw new ConflictException('Username is already taken');
        }
        entity.userName = next;
      }
    }

    if (dto.email !== undefined) {
      const next = dto.email === null || dto.email === '' ? null : dto.email.trim().toLowerCase();
      if (next !== entity.email) {
        if (next) {
          const owner = await this.userRepository.findByEmail(next);
          if (owner && owner.Id !== userId) {
            throw new ConflictException('Email is already in use');
          }
        }
        entity.email = next;
      }
    }

    if (dto.displayName !== undefined) {
      entity.displayName =
        dto.displayName === null || dto.displayName === ''
          ? null
          : dto.displayName.trim();
    }

    const saved = await this.userRepository.save(entity);
    return this.mapEntityToModel(saved);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const entity = await this.userRepository.findById(userId);
    if (!entity) {
      throw new NotFoundException(`User with id '${userId}' not found`);
    }
    const ok = await bcrypt.compare(dto.currentPassword.trim(), entity.password);
    if (!ok) {
      throw new BadRequestException('Current password is incorrect');
    }
    entity.password = await bcrypt.hash(dto.newPassword.trim(), BCRYPT_ROUNDS);
    await this.userRepository.save(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.userRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`User with id '${id}' not found`);
    }
    await this.userRepository.softDeleteById(id);
  }

  private mapEntityToModel(entity: User): UserModel {
    return {
      Id: entity.Id,
      UserName: entity.userName,
      Email: entity.email,
      DisplayName: entity.displayName,
    };
  }
}
