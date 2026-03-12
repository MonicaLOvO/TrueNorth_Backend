import { Injectable } from '@nestjs/common';

export interface GuidedPromptInput {
  categoryName: string;
  answers: Record<string, string>;
  conversationHistory?: string;
}

export interface ChatPromptInput {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}

@Injectable()
export class AiPromptBuilderService {
  buildGuidedQuestionMessages(input: GuidedPromptInput) {
    const answersText = Object.entries(input.answers)
      .filter(([, v]) => v != null && String(v).trim())
      .map(([k, v]) => `${k}: ${String(v).trim()}`)
      .join(', ');

    const systemPrompt =
      'You are a guided decision assistant. Return ONLY valid JSON with one next question and options. Do not include markdown, explanations, or extra text.';
    const userPrompt = [
      `Category: ${input.categoryName}`,
      `Known user context: ${answersText || 'none yet'}`,
      `Previous conversation history: ${input.conversationHistory?.trim() || 'none yet'}`,
      'Return this exact JSON shape:',
      '{"question":{"prompt":"string","options":["string","string","string"]}}',
      'Rules:',
      '- Ask exactly one concise question.',
      '- Provide 3 to 5 options.',
      '- Options should be actionable choices.',
    ].join('\n');

    return [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];
  }

  buildFinalizeExploreMessages(input: GuidedPromptInput) {
    const answersText = Object.entries(input.answers)
      .filter(([, v]) => v != null && String(v).trim())
      .map(([k, v]) => `${k}: ${String(v).trim()}`)
      .join(', ');

    const systemPrompt =
      'You are an explore result engine. Return ONLY valid JSON with explore results. No markdown, no explanations.';
    const userPrompt = [
      `Category: ${input.categoryName}`,
      `Final user answers: ${answersText || 'none'}`,
      `Previous conversation history: ${input.conversationHistory?.trim() || 'none yet'}`,
      'Return this exact JSON shape:',
      '{"explores":[{"name":"string","description":"string|null","url":"string|null","location":"string|null","imageUrl":"string|null"}]}',
      'Rules:',
      '- Return 3 to 6 explore results.',
      '- name is required for every explore item.',
      '- If you cannot determine any optional field, set it to "N/A".',
      '- Optional fields are: description, url, location, imageUrl.',
      '- Keep descriptions concise.',
    ].join('\n');

    return [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];
  }

  buildChatMessages(input: ChatPromptInput) {
    const systemPrompt =
      'You are a friendly decision assistant. Help the user decide (e.g. what to eat, watch, or do). When you suggest options, keep them brief so they can be shown as explore cards.';

    return [
      { role: 'system' as const, content: systemPrompt },
      ...input.messages.filter((m) => m.role !== 'system'),
    ];
  }
}
