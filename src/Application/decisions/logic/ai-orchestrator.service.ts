import { Injectable } from '@nestjs/common';
import { AiService } from '../../../ai/ai.service.js';
import { AiPromptBuilderService } from './ai-prompt-builder.service.js';
import { AiResponseParserService } from './ai-response-parser.service.js';
import type { ChatMessage } from '../../../ai/interfaces/llm-provider.interface.js';

@Injectable()
export class AiOrchestratorService {
  constructor(
    private readonly aiService: AiService,
    private readonly promptBuilder: AiPromptBuilderService,
    private readonly responseParser: AiResponseParserService,
  ) {}

  async runGuidedQuestion(input: {
    categoryName: string;
    answers: Record<string, string>;
    conversationHistory?: string;
  }) {
    const messages = this.promptBuilder.buildGuidedQuestionMessages(input);
    const rawReply = await this.aiService.generateCompletion(messages);
    const question = this.responseParser.toGuidedQuestion(rawReply);
    if (question) {
      return { reply: rawReply, question };
    }

    const retryMessages: ChatMessage[] = [
      ...messages,
      { role: 'assistant', content: rawReply },
      {
        role: 'user',
        content:
          'Your previous response did not match the required schema. Return ONLY valid JSON in this exact shape: {"question":{"prompt":"string","options":["string","string","string"]}}. Do not include markdown or extra text.',
      },
    ];
    const retryReply = await this.aiService.generateCompletion(retryMessages);
    const retryQuestion = this.responseParser.toGuidedQuestion(retryReply);
    if (retryQuestion) {
      return { reply: retryReply, question: retryQuestion };
    }
    return { reply: retryReply, question: null };
  }

  async runFinalizeExplores(input: {
    categoryName: string;
    answers: Record<string, string>;
    conversationHistory?: string;
  }) {
    const messages = this.promptBuilder.buildFinalizeExploreMessages(input);
    const rawReply = await this.aiService.generateCompletion(messages);
    const explores = this.responseParser.toExploreSuggestions(rawReply);
    return { reply: rawReply, explores };
  }

  async runChat(input: { messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> }) {
    const fullMessages = this.promptBuilder.buildChatMessages(input);
    const reply = await this.aiService.generateCompletion(fullMessages);
    const explores = this.responseParser.toExploreSuggestions(reply);
    return { reply, explores };
  }
}
