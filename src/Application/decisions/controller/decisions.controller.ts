/**
 * =============================================================================
 * DECISIONS CONTROLLER – API endpoints for guided and chat flows
 * =============================================================================
 */

import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { DecisionsService } from '../service/decisions.service.js';
import type { GuidedRequestDto } from '../dto/guided-request.dto.js';
import type { ChatRequestDto } from '../dto/chat-request.dto.js';
import type { GuidedNextRequestDto } from '../dto/guided-next-request.dto.js';
import type { GuidedSkipRequestDto } from '../dto/guided-skip-request.dto.js';
import type { GuidedFinalizeRequestDto } from '../dto/guided-finalize-request.dto.js';

@Controller('decisions')
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  /** One-shot guided request (legacy-compatible shortcut). */
  @Post('guided')
  @HttpCode(200)
  async guided(@Body() body: GuidedRequestDto) {
    return this.decisionsService.guidedFlow(body.categoryId, body.answers ?? {});
  }

  /** Free-form chat request that returns AI text + explore suggestions. */
  @Post('chat')
  @HttpCode(200)
  async chat(@Body() body: ChatRequestDto) {
    return this.decisionsService.chatFlow(body.messages ?? []);
  }

  /** Starts guided flow for an existing chat context. */
  @Post('guided/start/:chatId')
  async guidedStart(@Param('chatId') chatId: string) {
    return this.decisionsService.startGuided(chatId);
  }

  /** Stores one answer and asks AI for the next question. */
  @Post('guided/next/:chatId')
  async guidedNext(@Param('chatId') chatId: string, @Body() body: GuidedNextRequestDto) {
    return this.decisionsService.nextGuided(chatId, body);
  }

  /** Marks a question as skipped and asks AI for a replacement. */
  @Post('guided/skip/:chatId')
  async guidedSkip(@Param('chatId') chatId: string, @Body() body: GuidedSkipRequestDto) {
    return this.decisionsService.skipGuided(chatId, body);
  }

  /** Finalizes guided flow and persists explore cards. */
  @Post('guided/finalize/:chatId')
  async guidedFinalize(@Param('chatId') chatId: string, @Body() body: GuidedFinalizeRequestDto) {
    return this.decisionsService.finalizeGuided(chatId, body.answers ?? {});
  }
}
