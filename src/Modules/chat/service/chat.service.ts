import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ChatRepository } from '../repository/chat.repository.js';
import { CreateChatDto } from '../dto/create-chat.dto.js';
import { ChatDto } from '../dto/chat.dto.js';
import { Chat } from '../entity/chat.entity.js';
import { ChatModel } from '../model/chat.model.js';

@Injectable()
export class ChatService {
  constructor(private readonly chatRepository: ChatRepository) {}

  async findAll(): Promise<ChatModel[]> {
    const entities = await this.chatRepository.findAll();
    return entities.map((entity) => this.mapEntityToModel(entity));
  }

  async findByUserId(userId: string): Promise<ChatModel[]> {
    const entities = await this.chatRepository.findByUserId(userId);
    return entities.map((entity) => this.mapEntityToModel(entity));
  }

  async findById(id: string): Promise<ChatModel> {
    const entity = await this.chatRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Chat with id '${id}' not found`);
    }
    return this.mapEntityToModel(entity);
  }

  async create(input: CreateChatDto): Promise<ChatModel> {
    const normalizedUserId = input.userId ?? (input as { UserId?: string | null }).UserId;
    const normalizedCategoryId = input.categoryId ?? (input as { CategoryId?: string }).CategoryId;

    if (!normalizedCategoryId?.trim()) {
      throw new BadRequestException('categoryId is required');
    }

    const saved = await this.chatRepository.createAndSave({
      userId: normalizedUserId?.trim() ? normalizedUserId.trim() : null,
      categoryId: normalizedCategoryId.trim(),
    });
    return this.mapEntityToModel(saved);
  }

  async update(id: string, input: ChatDto): Promise<ChatModel> {
    const entity = await this.chatRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Chat with id '${id}' not found`);
    }

    const normalizedUserId = input.userId ?? (input as { UserId?: string | null }).UserId;
    const normalizedCategoryId = input.categoryId ?? (input as { CategoryId?: string }).CategoryId;

    if (!normalizedCategoryId?.trim()) {
      throw new BadRequestException('categoryId is required');
    }

    entity.user = normalizedUserId?.trim() ? ({ Id: normalizedUserId.trim() } as Chat['user']) : null;
    entity.category = { Id: normalizedCategoryId.trim() } as Chat['category'];

    const saved = await this.chatRepository.save(entity);
    return this.mapEntityToModel(saved);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.chatRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Chat with id '${id}' not found`);
    }
    await this.chatRepository.softDeleteById(id);
  }

  private mapEntityToModel(entity: Chat): ChatModel {
    return {
      Id: entity.Id,
      UserId: entity.user?.Id ?? null,
      CategoryId: entity.category?.Id,
    };
  }
}
