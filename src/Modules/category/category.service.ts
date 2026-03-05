import { Injectable } from '@nestjs/common';
import { CategoryRepository } from './category.repository.js';
import { CreateCategoryDto } from './create-category.dto.js';
import { CategoryDto } from './category.dto.js';
import { Category } from './category.entity.js';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async findAll(): Promise<CategoryDto[]> {
    const entities = await this.categoryRepository.findAll();
    return entities.map((entity) => this.toDto(entity));
  }

  async create(input: CreateCategoryDto): Promise<CategoryDto> {
    const saved = await this.categoryRepository.createAndSave(input);
    return this.toDto(saved);
  }

  private toDto(entity: Category): CategoryDto {
    return {
      id: entity.Id,
      name: entity.name,
      iconUrl: entity.iconUrl?.trim() ? entity.iconUrl : '',
      description: entity.description?.trim() ? entity.description : '',
    };
  }
}
