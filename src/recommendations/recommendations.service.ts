/**
 * =============================================================================
 * RECOMMENDATIONS SERVICE – Turn AI output into recommendation cards
 * =============================================================================
 *
 * The AI returns raw text (or later, structured JSON). This service turns that
 * into an array of RecommendationCardDto so the API always returns a consistent
 * shape. For now we do simple parsing; when we add structured AI output (A5+),
 * we can parse JSON or use a schema.
 *
 * Used by: future DecisionsService in the guided flow (category + answers →
 * prompt → AI → parseFromAI → return cards).
 */

import { Injectable } from '@nestjs/common';
import type { RecommendationCardDto } from './dto/recommendation-card.dto.js';

@Injectable()
export class RecommendationsService {
  /**
   * Parse raw AI response into recommendation cards. Right now we return a
   * single card with the raw text as description so the contract is in place;
   * when we use structured output (e.g. JSON from the LLM), we'll parse into
   * multiple cards with title, description, link, type.
   */
  parseFromAI(raw: string): RecommendationCardDto[] {
    if (!raw?.trim()) {
      return [];
    }

    // Simple fallback: one card with the full text as description.
    // A5 can replace this with structured parsing or LLM JSON output.
    return [
      {
        title: 'Recommendation',
        description: raw.trim().slice(0, 500),
        type: 'general',
      },
    ];
  }
}
