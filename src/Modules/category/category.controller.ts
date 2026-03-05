import { Body, Controller, Get, Post } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CreateCategoryDto } from './create-category.dto.js';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  getAll() {
    return this.categoryService.findAll();
  }

  @Post()
  create(@Body() body: CreateCategoryDto) {
    return this.categoryService.create(body);
  }
}
