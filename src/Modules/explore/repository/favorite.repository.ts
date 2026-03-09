import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../entity/favorite.entity.js';
import { CreateFavoriteDto } from '../dto/create-favorite.dto.js';
import { User } from '../../user/entity/user.entity.js';
import { Explore } from '../entity/explore.entity.js';

@Injectable()
export class FavoriteRepository {
  constructor(
    @InjectRepository(Favorite)
    private readonly repo: Repository<Favorite>,
  ) {}

  async findAll(): Promise<Favorite[]> {
    return this.repo.find({
      relations: {
        user: true,
        explore: true,
      },
      order: {
        explore: {
          name: 'ASC',
        },
      },
    });
  }

  async findByUserId(userId: string): Promise<Favorite[]> {
    return this.repo.find({
      where: { user: { Id: userId } },
      relations: {
        user: true,
        explore: true,
      },
      order: {
        explore: {
          name: 'ASC',
        },
      },
    });
  }

  async findById(id: string): Promise<Favorite | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: {
        user: true,
        explore: true,
      },
    });
  }

  async createAndSave(input: CreateFavoriteDto): Promise<Favorite> {
    const entity = this.repo.create({
      user: { Id: input.userId } as User,
      explore: { Id: input.exploreId } as Explore,
    });
    return this.repo.save(entity);
  }

  async save(entity: Favorite): Promise<Favorite> {
    return this.repo.save(entity);
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repo.softDelete({ Id: id });
  }
}
