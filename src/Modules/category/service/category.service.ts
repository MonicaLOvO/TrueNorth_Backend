import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from '../repository/category.repository.js';
import { CreateCategoryDto } from '../dto/create-category.dto.js';
import { CategoryDto } from '../dto/category.dto.js';
import { Category } from '../entity/category.entity.js';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async findAll(): Promise<CategoryDto[]> {
    const entities = await this.categoryRepository.findAll();
    return entities.map((entity) => this.toDto(entity));
  }

  async findById(id: string): Promise<CategoryDto> {
    const entity = await this.categoryRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Category with id '${id}' not found`);
    }
    return this.toDto(entity);
  }

  async create(input: CreateCategoryDto): Promise<CategoryDto> {
    const normalizedName = input.name ?? (input as { Name?: string }).Name;
    const normalizedIconUrl = input.iconUrl ?? (input as { IconUrl?: string }).IconUrl;
    const normalizedDescription =
      input.description ?? (input as { Description?: string }).Description;

    if (!normalizedName?.trim()) {
      throw new BadRequestException('name is required');
    }

    const saved = await this.categoryRepository.createAndSave({
      name: normalizedName.trim(),
      iconUrl: normalizedIconUrl,
      description: normalizedDescription,
    });
    return this.toDto(saved);
  }

  async update(id: string, input: CategoryDto): Promise<CategoryDto> {
    const entity = await this.categoryRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Category with id '${id}' not found`);
    }
    if (!input.name) {
      throw new BadRequestException('name is required');
    }

    const normalizedName = input.name ?? (input as { Name?: string }).Name;
    const normalizedIconUrl = input.iconUrl ?? (input as { IconUrl?: string | null }).IconUrl;
    const normalizedDescription =
      input.description ?? (input as { Description?: string | null }).Description;

    if (normalizedName !== undefined) {
      if (!normalizedName.trim()) {
        throw new BadRequestException('name cannot be empty');
      }
      entity.name = normalizedName.trim();
    }

    if (normalizedIconUrl !== undefined) {
      entity.iconUrl = normalizedIconUrl?.trim() ? normalizedIconUrl.trim() : null;
    }

    if (normalizedDescription !== undefined) {
      entity.description = normalizedDescription?.trim() ? normalizedDescription.trim() : null;
    }

    const saved = await this.categoryRepository.save(entity);
    return this.toDto(saved);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.categoryRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Category with id '${id}' not found`);
    }
    await this.categoryRepository.softDeleteById(id);
  }

  private toDto(entity: Category): CategoryDto {
    return {
      id: entity.Id,
      name: entity.name,
      iconUrl: entity.iconUrl?.trim() ? entity.iconUrl : null,
      description: entity.description?.trim() ? entity.description : null,
    };
  }
}
