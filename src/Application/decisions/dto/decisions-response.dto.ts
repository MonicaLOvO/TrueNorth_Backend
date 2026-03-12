import type { ExploreSuggestionDto } from './explore-suggestion.dto.js';

export interface GuidedResponseDto {
  explores: ExploreSuggestionDto[];
}

export interface ChatResponseDto {
  message: string;
  explores: ExploreSuggestionDto[];
}
