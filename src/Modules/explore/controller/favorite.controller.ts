import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { FavoriteService } from '../service/favorite.service.js';
import { SaveFavoriteDto } from '../dto/save-favorite.dto.js';
import { UpdateFavoriteExploreDto } from '../dto/update-favorite-explore.dto.js';

type AuthedRequest = Request & { user: { userId: string; userName: string } };

/**
 * All favorites routes require a logged-in user (Bearer JWT).
 * userId is never taken from the client body for create — it comes from the token.
 */
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  /** Current user's favorites (recommended for the app UI). */
  @Get()
  getMine(@Req() req: AuthedRequest) {
    return this.favoriteService.findByUserId(req.user.userId);
  }

  /** Same as GET / when :userId matches the token (convenience for explicit URLs). */
  @Get('user/:userId')
  getByUserId(@Param('userId') userId: string, @Req() req: AuthedRequest) {
    if (userId !== req.user.userId) {
      throw new ForbiddenException('You can only list your own favorites');
    }
    return this.favoriteService.findByUserId(userId);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.favoriteService.findByIdForUser(id, req.user.userId);
  }

  @Post()
  create(@Body() body: SaveFavoriteDto, @Req() req: AuthedRequest) {
    return this.favoriteService.createForUser(req.user.userId, body.exploreId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateFavoriteExploreDto,
    @Req() req: AuthedRequest,
  ) {
    return this.favoriteService.update(
      id,
      { userId: req.user.userId, exploreId: body.exploreId },
      req.user.userId,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Req() req: AuthedRequest): Promise<void> {
    await this.favoriteService.remove(id, req.user.userId);
  }
}
