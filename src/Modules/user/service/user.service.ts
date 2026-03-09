import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { UserDto } from '../dto/user.dto.js';
import { User } from '../entity/user.entity.js';
import { UserModel } from '../model/user.model.js';

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

    if (!normalizedUserName?.trim()) {
      throw new BadRequestException('userName is required');
    }

    if (!normalizedPassword?.trim()) {
      throw new BadRequestException('password is required');
    }

    const saved = await this.userRepository.createAndSave({
      userName: normalizedUserName.trim(),
      password: normalizedPassword.trim(),
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
    entity.password = normalizedPassword.trim();

    const saved = await this.userRepository.save(entity);
    return this.mapEntityToModel(saved);
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
      Password: entity.password,
    };
  }
}
