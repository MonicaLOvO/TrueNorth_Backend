import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OptionRepository } from '../repository/option.repository.js';
import { AnswerRepository } from '../repository/answer.repository.js';

@Injectable()
export class AnswerService {
  constructor(
    private readonly optionRepository: OptionRepository,
    private readonly answerRepository: AnswerRepository,
  ) {}

  async create(optionId: string, userId?: string | null): Promise<{ optionId: string; userId: string | null }> {
    if (!optionId?.trim()) {
      throw new BadRequestException('optionId is required');
    }
    const option = await this.optionRepository.findById(optionId);
    if (!option) {
      throw new NotFoundException(`Option with id '${optionId}' not found`);
    }
    await this.answerRepository.createAndSave({
      optionId: optionId.trim(),
      userId: userId ?? null,
    });
    return {
      optionId: optionId.trim(),
      userId: userId?.trim() ? userId.trim() : null,
    };
  }
}
