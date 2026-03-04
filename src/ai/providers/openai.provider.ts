/**
 * =============================================================================
 * OPENAI PROVIDER – Real API calls with safe error handling
 * =============================================================================
 *
 * This provider implements ILLMProvider by calling the OpenAI Chat Completions API.
 * We catch all errors (rate limit 429, invalid key, network, etc.) and return a
 * user-friendly message so the app never crashes and users don't see raw errors.
 *
 * When rate limited (429): that request is NOT charged; we just return a "try
 * again later" style message. Same for any other API error.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatMessage, ILLMProvider } from '../interfaces/llm-provider.interface';

/** Message format expected by the OpenAI API. */
const toOpenAIMessage = (m: ChatMessage): OpenAI.Chat.ChatCompletionMessageParam => ({
  role: m.role,
  content: m.content,
});

/** User-facing message when the AI is temporarily unavailable (rate limit, etc.). */
const FALLBACK_MESSAGE =
  'The AI is temporarily unavailable. Please try again in a moment.';

@Injectable()
export class OpenAIProvider implements ILLMProvider {
  private readonly client: OpenAI | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('openaiApiKey')?.trim();
    // If no key, client stays null and we'll return fallback in generateCompletion
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  /**
   * Calls the OpenAI API. On any error (429 rate limit, invalid key, network),
   * we catch it, log it server-side, and return a safe message so the app
   * doesn't crash and the user sees a clear message.
   */
  async generateCompletion(messages: ChatMessage[]): Promise<string> {
    if (!this.client) {
      return FALLBACK_MESSAGE + ' (No API key configured.)';
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages.map(toOpenAIMessage),
        max_tokens: 1024,
      });

      const content = response.choices?.[0]?.message?.content?.trim();
      return content ?? FALLBACK_MESSAGE;
    } catch (err: unknown) {
      // Log the real error for debugging (don't send raw errors to the client)
      const message = err instanceof Error ? err.message : String(err);
      const status = (err as { status?: number })?.status;
      console.error('[OpenAIProvider]', status ?? message, err);

      if (status === 429) {
        return 'Too many requests right now. Please try again in a minute.';
      }
      if (status === 401) {
        return FALLBACK_MESSAGE + ' (Invalid API key.)';
      }
      return FALLBACK_MESSAGE;
    }
  }
}
