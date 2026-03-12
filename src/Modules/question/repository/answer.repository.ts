import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Answer } from '../entity/answer.entity.js';
import { Option } from '../entity/option.entity.js';
import { User } from '../../user/entity/user.entity.js';

@Injectable()
export class AnswerRepository {
  constructor(
    @InjectRepository(Answer)
    private readonly repo: Repository<Answer>,
  ) {}

  async createAndSave(input: { optionId: string; userId?: string | null }): Promise<Answer> {
    const entity = this.repo.create({
      option: { Id: input.optionId } as Option,
      user: input.userId?.trim() ? ({ Id: input.userId.trim() } as User) : null,
    });
    return this.repo.save(entity);
  }
}
