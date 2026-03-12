import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ChatService } from '../service/chat.service.js';
import { CreateChatDto } from '../dto/create-chat.dto.js';
import { ChatDto } from '../dto/chat.dto.js';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /** Lists all chat sessions. */
  @Get()
  getAll() {
    return this.chatService.findAll();
  }

  /** Returns one chat session by id. */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.chatService.findById(id);
  }

  /** Creates a chat context (category required, user optional). */
  @Post()
  create(@Body() body: CreateChatDto) {
    return this.chatService.create(body);
  }

  /** Updates chat references (user/category). */
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: ChatDto) {
    return this.chatService.update(id, body);
  }

  /** Soft-deletes a chat session. */
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.chatService.remove(id);
  }
}
