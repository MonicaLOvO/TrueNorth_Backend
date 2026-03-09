import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { FavoriteService } from '../service/favorite.service.js';
import { CreateFavoriteDto } from '../dto/create-favorite.dto.js';
import { FavoriteDto } from '../dto/favorite.dto.js';

@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get()
  getAll() {
    return this.favoriteService.findAll();
  }

  @Get('user/:userId')
  getByUserId(@Param('userId') userId: string) {
    return this.favoriteService.findByUserId(userId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.favoriteService.findById(id);
  }

  @Post()
  create(@Body() body: CreateFavoriteDto) {
    return this.favoriteService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: FavoriteDto) {
    return this.favoriteService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.favoriteService.remove(id);
  }
}
