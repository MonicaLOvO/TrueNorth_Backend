import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConversationRepository } from '../repository/conversation.repository.js';
import { CreateConversationDto } from '../dto/create-conversation.dto.js';
import { ConversationModel } from '../model/conversation.model.js';
import { Conversation } from '../entity/conversation.entity.js';
import { ConversationDto } from '../dto/conversation.dto.js';

@Injectable()
export class ConversationService {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  async findAll(): Promise<ConversationModel[]> {
    const entities = await this.conversationRepository.findAll();
    return entities.map((entity) => this.toModel(entity));
  }

  async findByChatId(chatId: string): Promise<ConversationModel[]> {
    if (!chatId?.trim()) {
      throw new BadRequestException('chatId is required');
    }
    const entities = await this.conversationRepository.findByChatId(chatId.trim());
    return entities.map((entity) => this.toModel(entity));
  }

  async findById(id: string): Promise<ConversationModel> {
    const entity = await this.conversationRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Conversation with id '${id}' not found`);
    }
    return this.toModel(entity);
  }

  async create(input: CreateConversationDto): Promise<ConversationModel> {
    if (!input.chatId?.trim()) {
      throw new BadRequestException('chatId is required');
    }
    if (!input.action?.trim()) {
      throw new BadRequestException('action is required');
    }

    const saved = await this.conversationRepository.createAndSave({
      chatId: input.chatId.trim(),
      action: input.action.trim(),
      promptSummary: input.promptSummary,
      aiResponse: input.aiResponse,
    });
    return this.toModel(saved);
  }

  async update(id: string, input: ConversationDto): Promise<ConversationModel> {
    const entity = await this.conversationRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Conversation with id '${id}' not found`);
    }

    const normalizedChatId = input.chatId ?? (input as { ChatId?: string }).ChatId;
    const normalizedAction = input.action ?? (input as { Action?: string }).Action;
    const normalizedPromptSummary =
      input.promptSummary ?? (input as { PromptSummary?: string | null }).PromptSummary;
    const normalizedAiResponse =
      input.aiResponse ?? (input as { AiResponse?: string | null }).AiResponse;

    if (!normalizedChatId?.trim()) {
      throw new BadRequestException('chatId is required');
    }
    if (!normalizedAction?.trim()) {
      throw new BadRequestException('action is required');
    }

    entity.chat = { Id: normalizedChatId.trim() } as Conversation['chat'];
    entity.action = normalizedAction.trim();
    entity.promptSummary = normalizedPromptSummary?.trim() ? normalizedPromptSummary.trim() : null;
    entity.aiResponse = normalizedAiResponse?.trim() ? normalizedAiResponse.trim() : null;

    const saved = await this.conversationRepository.save(entity);
    return this.toModel(saved);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.conversationRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Conversation with id '${id}' not found`);
    }
    await this.conversationRepository.softDeleteById(id);
  }

  async hardCleanByChatId(chatId: string): Promise<{
    chatId: string;
    deleted: { answers: number; options: number; questions: number; conversations: number };
  }> {
    if (!chatId?.trim()) {
      throw new BadRequestException('chatId is required');
    }
    const deleted = await this.conversationRepository.hardDeleteTreeByChatId(chatId.trim());
    return {
      chatId: chatId.trim(),
      deleted,
    };
  }

  private toModel(entity: Conversation): ConversationModel {
    return {
      Id: entity.Id,
      ChatId: entity.chat.Id,
      Action: entity.action,
      PromptSummary: entity.promptSummary,
      AiResponse: entity.aiResponse,
    };
  }
}
