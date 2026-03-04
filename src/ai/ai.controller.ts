/**
 * =============================================================================
 * AI CONTROLLER – Test endpoint for the AI module
 * =============================================================================
 *
 * This controller exposes a simple GET /ai/test so you can verify the AI
 * pipeline works (mock or real). It calls AiService.generateCompletion with
 * a single user message and returns the reply. Later, the real decision
 * flows (guided, chat) will use AiService from their own controllers.
 */

import { Controller, Get } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * GET /ai/test – Returns one AI completion for a fixed test message.
   * Use this to confirm mock (or OpenAI) is working. No request body needed.
   */
  @Get('test')
  async test() {
    const reply = await this.aiService.generateCompletion([
      { role: 'user', content: 'What should I eat for dinner tonight?' },
    ]);
    return { reply };
  }
}
