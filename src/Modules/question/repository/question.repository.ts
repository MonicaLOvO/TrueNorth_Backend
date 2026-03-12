import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../entity/question.entity.js';
import { Conversation } from '../../chat/entity/conversation.entity.js';

@Injectable()
export class QuestionRepository {
  constructor(
    @InjectRepository(Question)
    private readonly repo: Repository<Question>,
  ) {}

  async createAndSave(input: {
    conversationId: string;
    prompt: string;
    isCarried?: boolean;
  }): Promise<Question> {
    const entity = this.repo.create({
      conversation: { Id: input.conversationId } as Conversation,
      prompt: input.prompt.trim(),
      isCarried: input.isCarried ?? false,
    });
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<Question | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: {
        options: true,
        conversation: true,
      },
    });
  }

  async save(entity: Question): Promise<Question> {
    return this.repo.save(entity);
  }

  async findByChatIdWithAnswers(chatId: string): Promise<Question[]> {
    return this.repo.find({
      where: {
        conversation: {
          chat: { Id: chatId },
        },
      },
      relations: {
        conversation: {
          chat: true,
        },
        options: {
          answers: true,
        },
      },
      order: {
        CreatedAt: 'ASC',
      },
    });
  }
}
