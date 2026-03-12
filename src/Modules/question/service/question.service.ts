import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QuestionRepository } from '../repository/question.repository.js';
import { OptionRepository } from '../repository/option.repository.js';
import { CreateQuestionOptionsDto } from '../dto/create-question-options.dto.js';
import { QuestionModel } from '../model/question.model.js';
import { Question } from '../entity/question.entity.js';

@Injectable()
export class QuestionService {
  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly optionRepository: OptionRepository,
  ) {}

  async createQuestionWithOptions(input: CreateQuestionOptionsDto): Promise<QuestionModel> {
    if (!input.conversationId?.trim()) {
      throw new BadRequestException('conversationId is required');
    }
    if (!input.prompt?.trim()) {
      throw new BadRequestException('prompt is required');
    }
    const optionLabels = input.options
      .map((v) => v?.trim())
      .filter((v): v is string => Boolean(v));
    if (optionLabels.length === 0) {
      throw new BadRequestException('at least one option is required');
    }

    const question = await this.questionRepository.createAndSave({
      conversationId: input.conversationId.trim(),
      prompt: input.prompt.trim(),
    });
    const options = await this.optionRepository.createMany(question.Id, optionLabels);
    question.options = options;
    return this.toModel(question);
  }

  async markCarried(questionId: string, isCarried: boolean): Promise<QuestionModel> {
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new NotFoundException(`Question with id '${questionId}' not found`);
    }
    question.isCarried = isCarried;
    const saved = await this.questionRepository.save(question);
    return this.toModel(saved);
  }

  async buildQuestionAnswerHistory(chatId: string): Promise<string> {
    if (!chatId?.trim()) {
      return '';
    }
    const questions = await this.questionRepository.findByChatIdWithAnswers(chatId.trim());
    if (questions.length === 0) {
      return '';
    }

    const lines = questions
      .slice(-20)
      .map((question, index) => {
        const selected = (question.options ?? [])
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .filter((option) => (option.answers?.length ?? 0) > 0)
          .map((option) => option.label);

        const answerText = selected.length > 0 ? selected.join(' | ') : 'N/A';
        return `Q${index + 1}: ${question.prompt}\nA${index + 1}: ${answerText}`;
      })
      .join('\n');

    // Keep history bounded so prompt size stays stable.
    return lines.slice(-5000);
  }

  private toModel(entity: Question): QuestionModel {
    return {
      id: entity.Id,
      conversationId: entity.conversation?.Id ?? '',
      prompt: entity.prompt,
      isCarried: entity.isCarried,
      options: (entity.options ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((opt) => ({
          id: opt.Id,
          label: opt.label,
          sortOrder: opt.sortOrder,
        })),
    };
  }
}
