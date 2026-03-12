/**
 * =============================================================================
 * MOCK LLM PROVIDER – No API calls, no cost, no rate limits
 * =============================================================================
 *
 * This provider implements the same interface as the real OpenAI provider but
 * never calls any external API. It returns fixed/sample text. Use this when:
 * - OPENAI_API_KEY is not set (default), so you can develop and test without cost.
 * - You want to test the app without hitting rate limits or the network.
 *
 * The rest of the app (AiService, future controllers) doesn't know or care
 * whether it's talking to the mock or to OpenAI—same interface, same flow.
 */

import { Injectable } from '@nestjs/common';
import type { ChatMessage, ILLMProvider } from '../interfaces/llm-provider.interface';

@Injectable()
export class MockLLMProvider implements ILLMProvider {
  /**
   * Returns a fake assistant reply. In real flow we'd use the messages to
   * build a prompt; here we just acknowledge and return sample text so you can
   * see the pipeline working without spending money.
   */
  async generateCompletion(messages: ChatMessage[]): Promise<string> {
    const lastUser = messages.filter((m) => m.role === 'user').pop();
    const topic = lastUser?.content?.slice(0, 50) ?? 'your request';

    return `[Mock AI – no API called] I received: "${topic}...". ` +
      `Here are 3 sample explore options: 1) Option A, 2) Option B, 3) Option C. ` +
      `Set OPENAI_API_KEY in .env to use the real OpenAI API.`;
  }
}
