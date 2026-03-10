/**
 * =============================================================================
 * DECISIONS CONTROLLER – API endpoints for guided and chat flows
 * =============================================================================
 *
 * Purpose: Exposes the two main endpoints the frontend needs to implement
 * the TrueNorth decision flows:
 *   - POST /decisions/guided  → user picked category + answered questions
 *   - POST /decisions/chat    → user is chatting freely with the AI
 *
 * How it's used: The frontend (e.g. Next.js) calls these URLs with the
 * request body described in the DTOs. The controller validates the body,
 * calls DecisionsService, and returns the response (recommendation cards
 * and/or chat message). No AI or business logic here—only HTTP in/out.
 */

import { Body, Controller, Post } from '@nestjs/common';
import { DecisionsService } from '../service/decisions.service.js';
import type { GuidedRequestDto } from '../dto/guided-request.dto.js';
import type { ChatRequestDto } from '../dto/chat-request.dto.js';

@Controller('decisions')
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  /**
   * Guided flow: send categoryId and answers (e.g. { categoryId: "...", answers: { time: "dinner", mood: "cozy" } }).
   * Returns { recommendations: [{ title, description, link?, type? }, ...] }.
   */
  @Post('guided')
  async guided(@Body() body: GuidedRequestDto) {
    return this.decisionsService.guidedFlow(body.categoryId, body.answers ?? {});
  }

  /**
   * Chat flow: send messages (e.g. { messages: [{ role: "user", content: "I want comfort food" }] }).
   * Returns { message: "...", recommendations: [...] }.
   */
  @Post('chat')
  async chat(@Body() body: ChatRequestDto) {
    return this.decisionsService.chatFlow(body.messages ?? []);
  }
}
