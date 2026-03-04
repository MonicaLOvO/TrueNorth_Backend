/**
 * =============================================================================
 * RECOMMENDATIONS MODULE – Recommendation card shape and parsing
 * =============================================================================
 *
 * Exports RecommendationsService so the decisions module (A5) can inject it
 * and call parseFromAI(aiResponse) to return cards to the client. No controller
 * here; the API entry point will be POST /decisions/guided (or similar).
 */

import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller.js';
import { RecommendationsService } from './recommendations.service.js';

@Module({
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
