import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ConversationService } from '../service/conversation.service.js';
import { CreateConversationDto } from '../dto/create-conversation.dto.js';
import { ConversationDto } from '../dto/conversation.dto.js';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  /** Lists all conversation turns. */
  @Get()
  getAll() {
    return this.conversationService.findAll();
  }

  /** Lists conversation turns for one chat id. */
  @Get('chat/:chatId')
  getByChatId(@Param('chatId') chatId: string) {
    return this.conversationService.findByChatId(chatId);
  }

  /** Returns one conversation turn by id. */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.conversationService.findById(id);
  }

  /** Creates a conversation turn record. */
  @Post()
  create(@Body() body: CreateConversationDto) {
    return this.conversationService.create(body);
  }

  /** Updates a conversation turn record. */
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: ConversationDto) {
    return this.conversationService.update(id, body);
  }

  /** Soft-deletes a conversation turn. */
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.conversationService.remove(id);
  }

  /** Hard-deletes all conversation/question/option/answer rows for one chat id. */
  @Delete('chat/:chatId/hard-clean')
  hardCleanByChatId(@Param('chatId') chatId: string) {
    return this.conversationService.hardCleanByChatId(chatId);
  }
}
