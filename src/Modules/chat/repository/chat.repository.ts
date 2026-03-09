import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from '../entity/chat.entity.js';
import { CreateChatDto } from '../dto/create-chat.dto.js';
import { User } from '../../user/entity/user.entity.js';
import { Category } from '../../category/entity/category.entity.js';

@Injectable()
export class ChatRepository {
  constructor(
    @InjectRepository(Chat)
    private readonly repo: Repository<Chat>,
  ) {}

  async findAll(): Promise<Chat[]> {
    return this.repo.find({
      relations: {
        user: true,
        category: true,
      },
      order: {
        Id: 'ASC',
      },
    });
  }

  async findByUserId(userId: string): Promise<Chat[]> {
    return this.repo.find({
      where: { user: { Id: userId } },
      relations: {
        user: true,
        category: true,
      },
      order: {
        Id: 'ASC',
      },
    });
  }

  async findById(id: string): Promise<Chat | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: {
        user: true,
        category: true,
      },
    });
  }

  async createAndSave(input: CreateChatDto): Promise<Chat> {
    const entity = this.repo.create({
      user: input.userId ? ({ Id: input.userId } as User) : null,
      category: { Id: input.categoryId } as Category,
    });
    return this.repo.save(entity);
  }

  async save(entity: Chat): Promise<Chat> {
    return this.repo.save(entity);
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repo.softDelete({ Id: id });
  }
}
