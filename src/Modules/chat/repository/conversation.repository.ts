import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entity/conversation.entity.js';
import { Chat } from '../entity/chat.entity.js';
import { CreateConversationDto } from '../dto/create-conversation.dto.js';
import { Question } from '../../question/entity/question.entity.js';
import { Option } from '../../question/entity/option.entity.js';
import { Answer } from '../../question/entity/answer.entity.js';

@Injectable()
export class ConversationRepository {
  constructor(
    @InjectRepository(Conversation)
    private readonly repo: Repository<Conversation>,
  ) {}

  async createAndSave(input: CreateConversationDto): Promise<Conversation> {
    const entity = this.repo.create({
      chat: { Id: input.chatId } as Chat,
      action: input.action.trim(),
      promptSummary: input.promptSummary?.trim() ? input.promptSummary.trim() : null,
      aiResponse: input.aiResponse?.trim() ? input.aiResponse.trim() : null,
    });
    return this.repo.save(entity);
  }

  async findAll(): Promise<Conversation[]> {
    return this.repo.find({
      relations: {
        chat: true,
      },
      order: {
        CreatedAt: 'ASC',
      },
    });
  }

  async findByChatId(chatId: string): Promise<Conversation[]> {
    return this.repo.find({
      where: {
        chat: { Id: chatId },
      },
      relations: {
        chat: true,
      },
      order: {
        CreatedAt: 'ASC',
      },
    });
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: {
        chat: true,
      },
    });
  }

  async save(entity: Conversation): Promise<Conversation> {
    return this.repo.save(entity);
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repo.softDelete({ Id: id });
  }

  async hardDeleteTreeByChatId(chatId: string): Promise<{
    answers: number;
    options: number;
    questions: number;
    conversations: number;
  }> {
    return this.repo.manager.transaction(async (manager) => {
      const conversationRows = await manager
        .getRepository(Conversation)
        .createQueryBuilder('conversation')
        .select('conversation.Id', 'id')
        .where('conversation.chatId = :chatId', { chatId })
        .getRawMany<{ id: string }>();

      const conversationIds = conversationRows.map((row) => row.id);
      if (conversationIds.length === 0) {
        return {
          answers: 0,
          options: 0,
          questions: 0,
          conversations: 0,
        };
      }

      const questionRows = await manager
        .getRepository(Question)
        .createQueryBuilder('question')
        .select('question.Id', 'id')
        .where('question.conversationId IN (:...conversationIds)', { conversationIds })
        .getRawMany<{ id: string }>();
      const questionIds = questionRows.map((row) => row.id);

      const optionRows =
        questionIds.length > 0
          ? await manager
              .getRepository(Option)
              .createQueryBuilder('option')
              .select('option.Id', 'id')
              .where('option.questionId IN (:...questionIds)', { questionIds })
              .getRawMany<{ id: string }>()
          : [];
      const optionIds = optionRows.map((row) => row.id);

      const answerDeleteResult =
        optionIds.length > 0
          ? await manager
              .getRepository(Answer)
              .createQueryBuilder()
              .delete()
              .where('optionId IN (:...optionIds)', { optionIds })
              .execute()
          : { affected: 0 };

      const optionDeleteResult =
        questionIds.length > 0
          ? await manager
              .getRepository(Option)
              .createQueryBuilder()
              .delete()
              .where('questionId IN (:...questionIds)', { questionIds })
              .execute()
          : { affected: 0 };

      const questionDeleteResult = await manager
        .getRepository(Question)
        .createQueryBuilder()
        .delete()
        .where('conversationId IN (:...conversationIds)', { conversationIds })
        .execute();

      const conversationDeleteResult = await manager
        .getRepository(Conversation)
        .createQueryBuilder()
        .delete()
        .where('Id IN (:...conversationIds)', { conversationIds })
        .execute();

      return {
        answers: answerDeleteResult.affected ?? 0,
        options: optionDeleteResult.affected ?? 0,
        questions: questionDeleteResult.affected ?? 0,
        conversations: conversationDeleteResult.affected ?? 0,
      };
    });
  }
}
