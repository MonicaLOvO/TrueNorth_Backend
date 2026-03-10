/**
 * =============================================================================
 * DECISIONS SERVICE – Orchestrates guided and chat flows (AI + recommendations)
 * =============================================================================
 *
 * Purpose: This is the "brain" that connects:
 *   - The user's choice (category + answers, or chat messages)
 *   - The AI (we build a prompt and call AiService)
 *   - The recommendation cards (we pass AI text to RecommendationsService)
 *
 * Why it exists: Controllers only handle HTTP. This service holds the business
 * logic: what prompt to send, how to turn the AI reply into cards, and what
 * to return. The frontend never talks to the AI directly; it only calls our
 * API, and this service does the rest.
 *
 * How it's used: DecisionsController calls guidedFlow() or chatFlow(); the
 * frontend calls POST /decisions/guided or POST /decisions/chat.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { AiService } from '../../../ai/ai.service.js';
import { RecommendationsService } from '../../../recommendations/recommendations.service.js';
import { CategoryService } from '../../category/service/category.service.js';
import type { GuidedResponseDto, ChatResponseDto } from '../dto/decisions-response.dto.js';

@Injectable()
export class DecisionsService {
  constructor(
    private readonly aiService: AiService,
    private readonly recommendationsService: RecommendationsService,
    private readonly categoryService: CategoryService,
  ) {}

  /**
   * Guided flow: user picked a category and answered questions (e.g. time, mood).
   * We build a prompt from that, ask the AI for recommendations, and return
   * cards. Used when the frontend sends POST /decisions/guided.
   */
  async guidedFlow(categoryId: string, answers: Record<string, string>): Promise<GuidedResponseDto> {
    const category = await this.categoryService.findById(categoryId).catch(() => null);
    if (!category) {
      throw new NotFoundException(`Category with id '${categoryId}' not found`);
    }

    const answersText = Object.entries(answers)
      .filter(([, v]) => v != null && String(v).trim())
      .map(([k, v]) => `${k}: ${String(v).trim()}`)
      .join(', ');

    const systemPrompt =
      'You are a helpful decision assistant. Given a category and user answers, suggest a few concrete, personalized recommendations. Keep each suggestion brief (1–2 sentences).';
    const userPrompt = `Category: ${category.name}. User context: ${answersText || 'none'}. Give 2–3 short recommendations.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];
    const rawReply = await this.aiService.generateCompletion(messages);
    const recommendations = this.recommendationsService.parseFromAI(rawReply);

    return { recommendations };
  }

  /**
   * Chat flow: user sent a conversation (messages). We send it to the AI and
   * return the reply plus any recommendation cards we can parse. Used when
   * the frontend sends POST /decisions/chat.
   */
  async chatFlow(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<ChatResponseDto> {
    const systemPrompt =
      'You are a friendly decision assistant. Help the user decide (e.g. what to eat, watch, or do). When you suggest options, keep them brief so they can be shown as recommendation cards.';
    const fullMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.filter((m) => m.role !== 'system'),
    ];

    const reply = await this.aiService.generateCompletion(fullMessages);
    const recommendations = this.recommendationsService.parseFromAI(reply);

    return { message: reply, recommendations };
  }
}
