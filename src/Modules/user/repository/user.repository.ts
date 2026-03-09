import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity.js';
import { CreateUserDto } from '../dto/create-user.dto.js';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.repo.find({
      order: {
        Id: 'ASC',
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { Id: id },
    });
  }

  async createAndSave(input: CreateUserDto): Promise<User> {
    const entity = this.repo.create({
      userName: input.userName.trim(),
      password: input.password.trim(),
    });
    return this.repo.save(entity);
  }

  async save(entity: User): Promise<User> {
    return this.repo.save(entity);
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repo.softDelete({ Id: id });
  }
}
