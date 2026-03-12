import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { UserService } from '../service/user.service.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { UserDto } from '../dto/user.dto.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** Lists all users. */
  @Get()
  getAll() {
    return this.userService.findAll();
  }

  /** Returns one user by id. */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  /** Creates a new user. */
  @Post()
  create(@Body() body: CreateUserDto) {
    return this.userService.create(body);
  }

  /** Updates an existing user. */
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UserDto) {
    return this.userService.update(id, body);
  }

  /** Soft-deletes a user. */
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.userService.remove(id);
  }
}
