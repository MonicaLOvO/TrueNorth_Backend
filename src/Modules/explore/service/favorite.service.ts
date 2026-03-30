import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FavoriteRepository } from '../repository/favorite.repository.js';
import { CreateFavoriteDto } from '../dto/create-favorite.dto.js';
import { FavoriteDto } from '../dto/favorite.dto.js';
import { Favorite } from '../entity/favorite.entity.js';
import { FavoriteModel } from '../model/favorite.model.js';

@Injectable()
export class FavoriteService {
  constructor(private readonly favoriteRepository: FavoriteRepository) {}

  async findAll(): Promise<FavoriteModel[]> {
    const entities = await this.favoriteRepository.findAll();
    return entities.map((entity) => this.mapEntityToModel(entity));
  }

  async findByUserId(userId: string): Promise<FavoriteModel[]> {
    const entities = await this.favoriteRepository.findByUserId(userId);
    return entities.map((entity) => this.mapEntityToModel(entity));
  }

  async findById(id: string): Promise<FavoriteModel> {
    const entity = await this.favoriteRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Favorite with id '${id}' not found`);
    }
    return this.mapEntityToModel(entity);
  }

  async create(input: CreateFavoriteDto): Promise<FavoriteModel> {
    const normalizedUserId = input.userId ?? (input as { UserId?: string }).UserId;
    const normalizedExploreId = input.exploreId ?? (input as { ExploreId?: string }).ExploreId;

    if (!normalizedUserId?.trim()) {
      throw new BadRequestException('userId is required');
    }

    if (!normalizedExploreId?.trim()) {
      throw new BadRequestException('exploreId is required');
    }

    const saved = await this.favoriteRepository.createAndSave({
      userId: normalizedUserId.trim(),
      exploreId: normalizedExploreId.trim(),
    });
    return this.mapEntityToModel(saved);
  }

  /** Used when userId comes from JWT (body should only send exploreId). */
  async createForUser(userId: string, exploreId: string): Promise<FavoriteModel> {
    if (!exploreId?.trim()) {
      throw new BadRequestException('exploreId is required');
    }
    return this.create({ userId, exploreId: exploreId.trim() });
  }

  async update(id: string, input: FavoriteDto, actingUserId: string): Promise<FavoriteModel> {
    const entity = await this.favoriteRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Favorite with id '${id}' not found`);
    }
    this.assertFavoriteOwner(entity, actingUserId);

    const normalizedExploreId = input.exploreId ?? (input as { ExploreId?: string }).ExploreId;

    if (!normalizedExploreId?.trim()) {
      throw new BadRequestException('exploreId is required');
    }

    entity.explore = { Id: normalizedExploreId.trim() } as Favorite['explore'];

    const saved = await this.favoriteRepository.save(entity);
    return this.mapEntityToModel(saved);
  }

  async remove(id: string, actingUserId: string): Promise<void> {
    const entity = await this.favoriteRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Favorite with id '${id}' not found`);
    }
    this.assertFavoriteOwner(entity, actingUserId);
    await this.favoriteRepository.softDeleteById(id);
  }

  async findByIdForUser(id: string, actingUserId: string): Promise<FavoriteModel> {
    const entity = await this.favoriteRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Favorite with id '${id}' not found`);
    }
    this.assertFavoriteOwner(entity, actingUserId);
    return this.mapEntityToModel(entity);
  }

  private assertFavoriteOwner(entity: Favorite, userId: string): void {
    const ownerId = entity.user?.Id;
    if (!ownerId || ownerId !== userId) {
      throw new ForbiddenException('You can only access your own favorites');
    }
  }

  private mapEntityToModel(entity: Favorite): FavoriteModel {
    return Object.assign<FavoriteModel, Partial<FavoriteModel>>(new FavoriteModel(), {
      Id: entity.Id,
      UserId: entity.user?.Id,
      ExploreId: entity.explore?.Id,
    });
  }
}
