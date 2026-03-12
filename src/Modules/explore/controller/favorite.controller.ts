import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { FavoriteService } from '../service/favorite.service.js';
import { CreateFavoriteDto } from '../dto/create-favorite.dto.js';
import { FavoriteDto } from '../dto/favorite.dto.js';

@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  /** Lists all favorite links. */
  @Get()
  getAll() {
    return this.favoriteService.findAll();
  }

  /** Lists favorites for one user. */
  @Get('user/:userId')
  getByUserId(@Param('userId') userId: string) {
    return this.favoriteService.findByUserId(userId);
  }

  /** Returns one favorite record by id. */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.favoriteService.findById(id);
  }

  /** Creates a user -> explore favorite link. */
  @Post()
  create(@Body() body: CreateFavoriteDto) {
    return this.favoriteService.create(body);
  }

  /** Updates an existing favorite link. */
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: FavoriteDto) {
    return this.favoriteService.update(id, body);
  }

  /** Soft-deletes one favorite link. */
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.favoriteService.remove(id);
  }
}
