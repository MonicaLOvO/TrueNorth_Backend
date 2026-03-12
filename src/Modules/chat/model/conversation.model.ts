export class ConversationModel {
  Id!: string;
  ChatId!: string;
  Action!: string;
  PromptSummary?: string | null;
  AiResponse?: string | null;
}
