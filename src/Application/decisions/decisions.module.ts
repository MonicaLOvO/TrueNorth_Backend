/**
 * =============================================================================
 * DECISIONS APPLICATION MODULE – Guided/chat workflow orchestration
 * =============================================================================
 *
 * This module belongs to the application/workflow layer. It orchestrates AI +
 * domain modules (category, chat, question, explore) and does not define persistence
 * entities itself.
 */

import { Module } from '@nestjs/common';
import {
  autoRegisterControllers,
  autoRegisterProviders,
} from '../../config/auto-di-setup.js';
import { AiModule } from '../../ai/ai.module.js';
import { CategoryModule } from '../../Modules/category/category.module.js';
import { ChatModule } from '../../Modules/chat/chat.module.js';
import { ExploreModule } from '../../Modules/explore/explore.module.js';
import { QuestionModule } from '../../Modules/question/question.module.js';
import { AuthModule } from '../../Modules/auth/auth.module.js';

const decisionsControllers = autoRegisterControllers(__dirname);
const decisionsProviders = autoRegisterProviders(__dirname);

@Module({
  imports: [AiModule, AuthModule, CategoryModule, ChatModule, ExploreModule, QuestionModule],
  controllers: decisionsControllers,
  providers: decisionsProviders,
  exports: decisionsProviders,
})
export class DecisionsModule {}
