export interface QuestionOptionModel {
  id: string;
  label: string;
  sortOrder: number;
}

export interface QuestionModel {
  id: string;
  conversationId: string;
  prompt: string;
  isCarried: boolean;
  options: QuestionOptionModel[];
}
