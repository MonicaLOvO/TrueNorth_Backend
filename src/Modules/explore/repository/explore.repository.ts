import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Explore } from '../entity/explore.entity.js';
import { CreateExploreDto } from '../dto/create-explore.dto.js';
import { Chat } from '../../chat/entity/chat.entity.js';

@Injectable()
export class ExploreRepository {
  constructor(
    @InjectRepository(Explore)
    private readonly repo: Repository<Explore>,
  ) {}

  async findAll(): Promise<Explore[]> {
    return this.repo.find({
      relations: {
        chat: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async findById(id: string): Promise<Explore | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: {
        chat: true,
      },
    });
  }

  async createAndSave(input: CreateExploreDto): Promise<Explore> {
    const entity = this.repo.create({
      chat: { Id: input.chatId } as Chat,
      name: input.name.trim(),
      description: input.description?.trim() ? input.description.trim() : null,
      url: input.url?.trim() ? input.url.trim() : null,
      location: input.location?.trim() ? input.location.trim() : null,
      imageUrl: input.imageUrl?.trim() ? input.imageUrl.trim() : null,
    });
    return this.repo.save(entity);
  }

  async save(entity: Explore): Promise<Explore> {
    return this.repo.save(entity);
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repo.softDelete({ Id: id });
  }
}
