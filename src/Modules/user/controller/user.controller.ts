import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { UserService } from '../service/user.service.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { UserDto } from '../dto/user.dto.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.userService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UserDto) {
    return this.userService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.userService.remove(id);
  }
}
