import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity.js';

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

  /** Lookup by username (exact match, trimmed) – used at login. */
  async findByUserName(userName: string): Promise<User | null> {
    const trimmed = userName.trim();
    if (!trimmed) {
      return null;
    }
    return this.repo.findOne({
      where: { userName: trimmed },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      return null;
    }
    return this.repo.findOne({
      where: { email: trimmed },
    });
  }

  /** `password` must already be a bcrypt hash (UserService hashes before calling). */
  async createAndSave(input: {
    userName: string;
    password: string;
    email?: string | null;
    displayName?: string | null;
  }): Promise<User> {
    const entity = this.repo.create({
      userName: input.userName.trim(),
      password: input.password,
      email: input.email?.trim() ? input.email.trim().toLowerCase() : null,
      displayName: input.displayName?.trim() ? input.displayName.trim() : null,
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
