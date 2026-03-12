import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CategoryDto } from '../dto/category.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CategoryService } from '../service/category.service';


@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /** Lists all available categories. */
  @Get()
  getAll() {
    return this.categoryService.findAll();
  }

  /** Returns one category by id. */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  /** Creates a new category. */
  @Post()
  create(@Body() body: CreateCategoryDto) {
    return this.categoryService.create(body);
  }

  /** Updates an existing category. */
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: CategoryDto) {
    return this.categoryService.update(id, body);
  }

  /** Soft-deletes a category. */
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.categoryService.remove(id);
  }
}
