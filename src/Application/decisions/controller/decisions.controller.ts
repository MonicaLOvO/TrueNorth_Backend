/**
 * =============================================================================
 * DECISIONS CONTROLLER – API endpoints for guided and chat flows
 * =============================================================================
 */

import { Body, Controller, HttpCode, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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

  /**
   * Audio chat: multipart field `audio` = file (mp3, webm, m4a, wav, …). Whisper → text, then same pipeline as POST /decisions/chat.
   * Optional field `messages` = JSON string (same array shape as POST /decisions/chat). Open to guests (no JWT).
   */
  @Post('chat/audio')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async chatAudio(@UploadedFile() file: Express.Multer.File | undefined, @Body('messages') messages?: string) {
    return this.decisionsService.chatFlowFromVoice(file, messages);
  }

  /** Free-form chat request that returns AI text + explore suggestions. Open to guests (no JWT). */
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
