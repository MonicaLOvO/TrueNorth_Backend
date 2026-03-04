/**
 * =============================================================================
 * RECOMMENDATIONS CONTROLLER – Test endpoint for A4 (manual check)
 * =============================================================================
 *
 * GET /recommendations/test returns sample recommendation cards so you can
 * verify the RecommendationsService and card shape without the full guided flow.
 * Used by e2e and for manual testing before commit.
 */

import { Controller, Get } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service.js';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  /**
   * GET /recommendations/test – Returns parsed recommendation cards from sample text.
   * Confirms A4 (DTO + parseFromAI) works. No request body.
   */
  @Get('test')
  getTest() {
    const sample = 'Sample AI response: Try the pizza place on Main St. Great for dinner.';
    const recommendations = this.recommendationsService.parseFromAI(sample);
    return { recommendations };
  }
}
