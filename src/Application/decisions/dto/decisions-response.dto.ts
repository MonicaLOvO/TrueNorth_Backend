import type { ExploreSuggestionDto } from './explore-suggestion.dto.js';

export interface GuidedResponseDto {
  explores: ExploreSuggestionDto[];
}

export interface ChatResponseDto {
  message: string;
  explores: ExploreSuggestionDto[];
}

/** Same as chat JSON API, plus the transcript Whisper produced from the uploaded audio. */
export interface VoiceChatResponseDto extends ChatResponseDto {
  transcript: string;
}
