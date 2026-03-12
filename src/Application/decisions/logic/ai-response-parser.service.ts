import { Injectable } from '@nestjs/common';
import type { AiGuidedQuestionDto } from '../dto/ai-guided-question.dto.js';
import type { ExploreSuggestionDto } from '../dto/explore-suggestion.dto.js';

@Injectable()
export class AiResponseParserService {
  toGuidedQuestion(rawAiReply: string): AiGuidedQuestionDto | null {
    const trimmed = rawAiReply?.trim();
    if (!trimmed) {
      return null;
    }

    const payload = this.tryParseJson(trimmed);
    const question = this.extractGuidedQuestion(payload);
    return question;
  }

  toExploreSuggestions(rawAiReply: string): ExploreSuggestionDto[] {
    const trimmed = rawAiReply?.trim();
    if (!trimmed) {
      return [];
    }
    const payload = this.tryParseJson(trimmed);
    const rawItems = this.extractExploreItems(payload, trimmed);
    return rawItems.map((item) => this.normalizeExploreItem(item)).filter((item): item is ExploreSuggestionDto => item !== null).slice(0, 6);
  }

  private tryParseJson(raw: string): unknown {
    const candidates = this.collectJsonCandidates(raw);
    for (const candidate of candidates) {
      const parsed = this.parseJsonCandidate(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }
    return null;
  }

  private parseJsonCandidate(candidate: string): unknown | null {
    let current = candidate.trim();
    for (let i = 0; i < 3; i += 1) {
      if (!current) {
        return null;
      }
      try {
        const parsed = JSON.parse(current);
        if (typeof parsed === 'string') {
          current = parsed.trim();
          continue;
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  }

  private collectJsonCandidates(raw: string): string[] {
    const unique = new Set<string>();
    const push = (value: string | null | undefined) => {
      if (!value) {
        return;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      unique.add(trimmed);
    };

    const trimmed = raw?.trim() ?? '';
    push(trimmed);

    const unwrappedFence = this.unwrapCodeFence(trimmed);
    push(unwrappedFence);

    push(this.extractOuterJsonBlock(trimmed));
    push(this.extractOuterJsonBlock(unwrappedFence));

    return Array.from(unique.values());
  }

  private unwrapCodeFence(value: string): string {
    return value
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  private extractOuterJsonBlock(value: string): string | null {
    const objectStart = value.indexOf('{');
    const objectEnd = value.lastIndexOf('}');
    if (objectStart >= 0 && objectEnd > objectStart) {
      return value.slice(objectStart, objectEnd + 1);
    }

    const arrayStart = value.indexOf('[');
    const arrayEnd = value.lastIndexOf(']');
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      return value.slice(arrayStart, arrayEnd + 1);
    }
    return null;
  }

  private extractGuidedQuestion(parsed: unknown): AiGuidedQuestionDto | null {
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    const candidate = (record.question ?? record) as Record<string, unknown>;
    const prompt = this.readString(candidate.prompt) ?? this.readString(candidate.question);
    const optionsSource = Array.isArray(candidate.options) ? candidate.options : [];
    const options = optionsSource
      .map((value) => this.readString(value))
      .filter((value): value is string => Boolean(value))
      .slice(0, 5);
    if (!prompt || options.length === 0) {
      return null;
    }
    return { prompt, options };
  }

  private extractExploreItems(parsed: unknown, raw: string): unknown[] {
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      if (Array.isArray(record.explores)) {
        return record.explores;
      }
    }
    return [
      {
        name: 'Explore Result',
        description: raw.slice(0, 500),
      },
    ];
  }

  private normalizeExploreItem(raw: unknown): ExploreSuggestionDto | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const item = raw as Record<string, unknown>;
    const name = this.readString(item.name) ?? this.readString(item.title);
    if (!name) {
      return null;
    }
    return {
      name,
      description: this.readNullableString(item.description),
      url: this.readNullableString(item.url) ?? this.readNullableString(item.link),
      location: this.readNullableString(item.location),
      imageUrl: this.readNullableString(item.imageUrl),
    };
  }

  private readString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private readNullableString(value: unknown): string | null {
    return this.readString(value);
  }
}
