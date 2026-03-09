import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ChatService } from '../service/chat.service.js';
import { CreateChatDto } from '../dto/create-chat.dto.js';
import { ChatDto } from '../dto/chat.dto.js';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  getAll() {
    return this.chatService.findAll();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.chatService.findById(id);
  }

  @Post()
  create(@Body() body: CreateChatDto) {
    return this.chatService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: ChatDto) {
    return this.chatService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.chatService.remove(id);
  }
}
