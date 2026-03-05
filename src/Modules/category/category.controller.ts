import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CreateCategoryDto } from './create-category.dto.js';
import { CategoryDto } from './category.dto.js';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  getAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  @Post()
  create(@Body() body: CreateCategoryDto) {
    return this.categoryService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: CategoryDto) {
    return this.categoryService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.categoryService.remove(id);
  }
}
