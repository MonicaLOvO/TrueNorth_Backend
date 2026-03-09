import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ExploreRepository } from '../repository/explore.repository.js';
import { CreateExploreDto } from '../dto/create-explore.dto.js';
import { ExploreDto } from '../dto/explore.dto.js';
import { Explore } from '../entity/explore.entity.js';
import { ExploreModel } from '../model/explore.model.js';

@Injectable()
export class ExploreService {
  constructor(private readonly exploreRepository: ExploreRepository) {}

  async findAll(): Promise<ExploreModel[]> {
    const entities = await this.exploreRepository.findAll();
    return entities.map((entity) => this.mapEntityToModel(entity));
  }

  async findById(id: string): Promise<ExploreModel> {
    const entity = await this.exploreRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Explore with id '${id}' not found`);
    }
    return this.mapEntityToModel(entity);
  }

  async create(input: CreateExploreDto): Promise<ExploreModel> {
    const normalizedChatId = input.chatId ?? (input as { ChatId?: string }).ChatId;
    const normalizedName = input.name ?? (input as { Name?: string }).Name;
    const normalizedDescription =
      input.description ?? (input as { Description?: string | null }).Description;
    const normalizedUrl = input.url ?? (input as { Url?: string | null }).Url;
    const normalizedLocation = input.location ?? (input as { Location?: string | null }).Location;
    const normalizedImageUrl = input.imageUrl ?? (input as { ImageUrl?: string | null }).ImageUrl;

    if (!normalizedChatId?.trim()) {
      throw new BadRequestException('chatId is required');
    }

    if (!normalizedName?.trim()) {
      throw new BadRequestException('name is required');
    }

    const saved = await this.exploreRepository.createAndSave({
      chatId: normalizedChatId.trim(),
      name: normalizedName.trim(),
      description: normalizedDescription,
      url: normalizedUrl,
      location: normalizedLocation,
      imageUrl: normalizedImageUrl,
    });
    return this.mapEntityToModel(saved);
  }

  async update(id: string, input: ExploreDto): Promise<ExploreModel> {
    const entity = await this.exploreRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Explore with id '${id}' not found`);
    }

    const normalizedChatId = input.chatId ?? (input as { ChatId?: string }).ChatId;
    const normalizedName = input.name ?? (input as { Name?: string }).Name;
    const normalizedDescription =
      input.description ?? (input as { Description?: string | null }).Description;
    const normalizedUrl = input.url ?? (input as { Url?: string | null }).Url;
    const normalizedLocation = input.location ?? (input as { Location?: string | null }).Location;
    const normalizedImageUrl = input.imageUrl ?? (input as { ImageUrl?: string | null }).ImageUrl;

    if (!normalizedChatId?.trim()) {
      throw new BadRequestException('chatId is required');
    }

    if (!normalizedName?.trim()) {
      throw new BadRequestException('name is required');
    }

    entity.chat = { Id: normalizedChatId.trim() } as Explore['chat'];
    entity.name = normalizedName.trim();
    entity.description = normalizedDescription?.trim() ? normalizedDescription.trim() : null;
    entity.url = normalizedUrl?.trim() ? normalizedUrl.trim() : null;
    entity.location = normalizedLocation?.trim() ? normalizedLocation.trim() : null;
    entity.imageUrl = normalizedImageUrl?.trim() ? normalizedImageUrl.trim() : null;

    const saved = await this.exploreRepository.save(entity);
    return this.mapEntityToModel(saved);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.exploreRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Explore with id '${id}' not found`);
    }
    await this.exploreRepository.softDeleteById(id);
  }

  private mapEntityToModel(entity: Explore): ExploreModel {
    return Object.assign<ExploreModel, Partial<ExploreModel>>(new ExploreModel(), {
      Id: entity.Id,
      ChatId: entity.chat?.Id,
      Name: entity.name,
      Description: entity.description?.trim() ? entity.description : null,
      Url: entity.url?.trim() ? entity.url : null,
      Location: entity.location?.trim() ? entity.location : null,
      ImageUrl: entity.imageUrl?.trim() ? entity.imageUrl : null,
    });
  }
}
