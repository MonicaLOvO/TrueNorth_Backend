/**
 * =============================================================================
 * AI SERVICE – Single entry point for AI completions
 * =============================================================================
 *
 * AiService is what the rest of the app uses to get AI responses. It doesn't
 * know whether the backend is mock or OpenAI—it just calls generateCompletion
 * on whatever provider Nest injected (via LLM_PROVIDER_TOKEN).
 *
 * Controllers (e.g. future DecisionsController, ChatController) will inject
 * AiService and call generateCompletion(messages). We keep all provider logic
 * behind the interface so we can swap or add providers without changing callers.
 */

import { Inject, Injectable } from '@nestjs/common';
import type { ChatMessage, ILLMProvider } from './interfaces/llm-provider.interface';
import { LLM_PROVIDER_TOKEN } from './interfaces/llm-provider.interface';

@Injectable()
export class AiService {
  constructor(
    @Inject(LLM_PROVIDER_TOKEN)
    private readonly provider: ILLMProvider,
  ) {}

  /**
   * Send messages to the AI and get the assistant reply. Uses whichever
   * provider is configured (mock or OpenAI). Same method for guided flow,
   * chat, or any future feature that needs AI.
   */
  async generateCompletion(messages: ChatMessage[]): Promise<string> {
    return this.provider.generateCompletion(messages);
  }
}
