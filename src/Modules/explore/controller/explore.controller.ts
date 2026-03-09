import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ExploreService } from '../service/explore.service.js';
import { CreateExploreDto } from '../dto/create-explore.dto.js';
import { ExploreDto } from '../dto/explore.dto.js';

@Controller('explores')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Get()
  getAll() {
    return this.exploreService.findAll();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.exploreService.findById(id);
  }

  // @Post()
  // create(@Body() body: CreateExploreDto) {
  //   return this.exploreService.create(body);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() body: ExploreDto) {
  //   return this.exploreService.update(id, body);
  // }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.exploreService.remove(id);
  }
}
