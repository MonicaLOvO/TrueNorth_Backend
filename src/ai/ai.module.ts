/**
 * =============================================================================
 * AI MODULE – Wires the LLM provider and exposes AiService
 * =============================================================================
 *
 * This module decides which provider (mock or OpenAI) to use based on config:
 * - If aiUseMock is true → use MockLLMProvider (no cost).
 * - Otherwise → use OpenAIProvider (keys come from DB, with env fallback key).
 *
 * We use a custom provider with inject so that Nest injects ConfigService into
 * the factory and we can pass the right implementation to LLM_PROVIDER_TOKEN.
 * Any module that imports AiModule can inject AiService and get completions.
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LLM_PROVIDER_TOKEN } from './interfaces/llm-provider.interface';
import type { ILLMProvider } from './interfaces/llm-provider.interface';
import { MockLLMProvider } from './providers/mock-llm.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { AiConnectionModule } from '../Modules/ai-connection/ai-connection.module.js';
import { SpeechTranscriptionService } from './speech-transcription.service.js';

@Module({
  imports: [ConfigModule, AiConnectionModule],
  controllers: [AiController],
  providers: [
    MockLLMProvider,
    OpenAIProvider,
    SpeechTranscriptionService,
    // -------------------------------------------------------------------------
    // Bind the abstract "LLM provider" to the real implementation.
    // Nest will inject whichever class we provide here into AiService.
    // -------------------------------------------------------------------------
    {
      provide: LLM_PROVIDER_TOKEN,
      inject: [ConfigService, MockLLMProvider, OpenAIProvider],
      useFactory: (
        config: ConfigService,
        mockProvider: MockLLMProvider,
        openAiProvider: OpenAIProvider,
      ): ILLMProvider => {
        const useMock = config.get<boolean>('aiUseMock');
        if (useMock) {
          return mockProvider;
        }
        return openAiProvider;
      },
    },
    AiService,
  ],
  exports: [AiService, SpeechTranscriptionService],
})
export class AiModule {}
