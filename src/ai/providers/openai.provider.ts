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
import OpenAI from 'openai';
import type { ChatMessage, ILLMProvider } from '../interfaces/llm-provider.interface';
import { AiConnectionService } from '../../Modules/ai-connection/service/ai-connection.service.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AiProviderCandidate } from '../../Modules/ai-connection/service/ai-connection.service.js';

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
  private readonly clients = new Map<string, OpenAI>();
  private readonly geminiClients = new Map<string, GoogleGenerativeAI>();

  constructor(
    private readonly aiConnectionService: AiConnectionService,
  ) {}

  /**
   * Calls the OpenAI API. On any error (429 rate limit, invalid key, network),
   * we catch it, log it server-side, and return a safe message so the app
   * doesn't crash and the user sees a clear message.
   */
  async generateCompletion(messages: ChatMessage[]): Promise<string> {
    const candidates = await this.aiConnectionService.getProviderCandidates();
    if (candidates.length === 0) {
      return FALLBACK_MESSAGE + ' (No usable AI connection right now.)';
    }

    let lastStatus: number | undefined;
    let lastMessage = '';

    for (const candidate of candidates) {
      try {
        const content = await this.generateWithCandidate(candidate, messages);
        if (content) {
          // Auto-switch selected connection to the one that is currently healthy.
          await this.aiConnectionService.promoteAsSelected(candidate);
          return content;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const status = (err as { status?: number })?.status;
        lastStatus = status;
        lastMessage = message;
        console.error('[OpenAIProvider]', status ?? message, err);
        await this.aiConnectionService.markTemporaryFailure(
          candidate,
          `${status ?? 'no-status'}:${message}`,
        );
        if (!this.shouldTryFallback(status)) {
          break;
        }
      }
    }

    if (lastStatus === 429) {
      return 'Too many requests right now. Please try again in a minute.';
    }
    if (lastStatus === 401) {
      return FALLBACK_MESSAGE + ' (Invalid API key.)';
    }
    if (lastMessage) {
      return FALLBACK_MESSAGE;
    }
    return FALLBACK_MESSAGE;
  }

  private getClient(apiKey: string): OpenAI {
    const existing = this.clients.get(apiKey);
    if (existing) {
      return existing;
    }
    const client = new OpenAI({ apiKey });
    this.clients.set(apiKey, client);
    return client;
  }

  private async generateWithCandidate(
    candidate: AiProviderCandidate,
    messages: ChatMessage[],
  ): Promise<string | null> {
    if (candidate.providerType === 'ollama') {
      const baseUrl = candidate.endpointUrl?.trim() || 'http://127.0.0.1:11434';
      const modelName = candidate.modelName?.trim() || 'llama3.2';
      return this.generateWithOllama(baseUrl, modelName, messages);
    }
    if (candidate.providerType === 'gemini') {
      return this.generateWithGemini(candidate.apiKey || '', messages);
    }
    const response = await this.getClient(candidate.apiKey || '').chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages.map(toOpenAIMessage),
      max_tokens: 1024,
    });
    return response.choices?.[0]?.message?.content?.trim() ?? null;
  }

  private async generateWithGemini(apiKey: string, messages: ChatMessage[]): Promise<string | null> {
    const prompt = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');
    const modelCandidates = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro'];

    let lastError: unknown;
    for (const modelName of modelCandidates) {
      try {
        const model = this.getGeminiClient(apiKey).getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text()?.trim();
        if (text) {
          return text;
        }
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        lastError = err;
        // 404 means this model name is unavailable for this key/project; try next model.
        if (status === 404) {
          continue;
        }
        throw err;
      }
    }

    if (lastError) {
      throw lastError;
    }
    return null;
  }

  private async generateWithOllama(
    baseUrl: string,
    modelName: string,
    messages: ChatMessage[],
  ): Promise<string | null> {
    const prompt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const endpoint = `${baseUrl.replace(/\/$/, '')}/api/generate`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt,
        stream: false,
      }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw {
        status: res.status,
        message: `Ollama error (${res.status}): ${errorText}`,
      };
    }
    const data = (await res.json()) as { response?: string };
    const text = data.response?.trim();
    return text || null;
  }

  private getGeminiClient(apiKey: string): GoogleGenerativeAI {
    const existing = this.geminiClients.get(apiKey);
    if (existing) {
      return existing;
    }
    const client = new GoogleGenerativeAI(apiKey);
    this.geminiClients.set(apiKey, client);
    return client;
  }

  private shouldTryFallback(status?: number): boolean {
    if (!status) {
      return true;
    }
    return [401, 429, 500, 502, 503, 504].includes(status);
  }
}
