import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './entity/question.entity.js';
import { Option } from './entity/option.entity.js';
import { Answer } from './entity/answer.entity.js';
import {
  autoRegisterControllers,
  autoRegisterProviders,
} from '../../config/auto-di-setup.js';

const questionControllers = autoRegisterControllers(__dirname);
const questionProviders = autoRegisterProviders(__dirname);

@Module({
  imports: [TypeOrmModule.forFeature([Question, Option, Answer])],
  controllers: questionControllers,
  providers: questionProviders,
  exports: questionProviders,
})
export class QuestionModule {}
