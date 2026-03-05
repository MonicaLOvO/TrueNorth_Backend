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

  async createAndSave(input: CreateCategoryDto): Promise<Category> {
    const entity = this.repo.create({
      name: input.name,
      iconUrl: input.iconUrl?.trim() ? input.iconUrl : '',
      description: input.description?.trim() ? input.description : '',
    });
    return this.repo.save(entity);
  }
}
