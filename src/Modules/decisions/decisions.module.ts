/**
 * =============================================================================
 * DECISIONS MODULE – Guided and chat decision flows
 * =============================================================================
 *
 * Purpose: Groups everything needed for the two main TrueNorth flows:
 * guided (category + questions → recommendations) and chat (conversation →
 * AI reply + recommendations). Imports AI, Recommendations, and Category
 * so the decisions service can build prompts and return cards.
 *
 * Why it's here: Same pattern as your teammate's category, user, chat, explore
 * modules—one feature per folder under Modules/, with controller, service, dto,
 * and auto-registration so we don't list every file by hand.
 */

import { Module } from '@nestjs/common';
import {
  autoRegisterControllers,
  autoRegisterProviders,
} from '../../config/auto-di-setup.js';
import { AiModule } from '../../ai/ai.module.js';
import { RecommendationsModule } from '../../recommendations/recommendations.module.js';
import { CategoryModule } from '../category/category.module.js';

const decisionsControllers = autoRegisterControllers(__dirname);
const decisionsProviders = autoRegisterProviders(__dirname);

@Module({
  imports: [AiModule, RecommendationsModule, CategoryModule],
  controllers: decisionsControllers,
  providers: decisionsProviders,
  exports: decisionsProviders,
})
export class DecisionsModule {}
