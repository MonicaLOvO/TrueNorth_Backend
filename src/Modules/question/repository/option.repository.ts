import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Option } from '../entity/option.entity.js';
import { Question } from '../entity/question.entity.js';

@Injectable()
export class OptionRepository {
  constructor(
    @InjectRepository(Option)
    private readonly repo: Repository<Option>,
  ) {}

  async createMany(questionId: string, labels: string[]): Promise<Option[]> {
    const entities = labels.map((label, index) =>
      this.repo.create({
        question: { Id: questionId } as Question,
        label: label.trim(),
        sortOrder: index + 1,
      }),
    );
    return this.repo.save(entities);
  }

  async findById(id: string): Promise<Option | null> {
    return this.repo.findOne({
      where: { Id: id },
      relations: {
        question: true,
      },
    });
  }
}
