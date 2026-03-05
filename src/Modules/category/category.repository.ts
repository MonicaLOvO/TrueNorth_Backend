import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity.js';
import { CreateCategoryDto } from './create-category.dto.js';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.repo.find({
      order: {
        Id: 'ASC',
      },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.repo.findOne({
      where: { Id: id },
    });
  }

  async createAndSave(input: CreateCategoryDto): Promise<Category> {
    const entity = this.repo.create({
      name: input.name,
      iconUrl: input.iconUrl?.trim() ? input.iconUrl.trim() : null,
      description: input.description?.trim() ? input.description.trim() : null,
    });
    return this.repo.save(entity);
  }

  async save(entity: Category): Promise<Category> {
    return this.repo.save(entity);
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repo.softDelete({ Id: id });
  }
}
