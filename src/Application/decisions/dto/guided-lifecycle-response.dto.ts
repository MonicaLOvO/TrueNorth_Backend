import type { ExploreSuggestionDto } from './explore-suggestion.dto.js';
import type { ExploreModel } from '../../../Modules/explore/model/explore.model.js';
import type { QuestionModel } from '../../../Modules/question/model/question.model.js';

export interface GuidedLifecycleResponseDto {
  chatId: string;
  stage: 'start' | 'next' | 'skip' | 'finalize';
  message: string;
  question?: QuestionModel;
  explores: ExploreSuggestionDto[];
  persistedExplores?: ExploreModel[];
}
