/**
 * =============================================================================
 * DECISIONS RESPONSE DTOs – What the backend returns to the frontend
 * =============================================================================
 *
 * Purpose: So the frontend knows exactly what shape to expect. Guided and chat
 * both return recommendation cards (title, description, link, type). Chat
 * also returns the AI's text reply so the UI can show the conversation.
 */

import type { RecommendationCardDto } from '../../../recommendations/dto/recommendation-card.dto.js';

/** Response from POST /decisions/guided: list of recommendation cards. */
export interface GuidedResponseDto {
  recommendations: RecommendationCardDto[];
}

/** Response from POST /decisions/chat: AI reply + optional recommendation cards. */
export interface ChatResponseDto {
  /** The AI's latest message (so the frontend can show it in the chat). */
  message: string;
  /** If the AI suggested options, we parse them into cards. Can be empty. */
  recommendations: RecommendationCardDto[];
}
