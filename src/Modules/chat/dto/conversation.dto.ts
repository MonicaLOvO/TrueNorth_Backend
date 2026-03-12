export class ConversationDto {
  id?: string;
  chatId: string;
  action: string;
  promptSummary?: string | null;
  aiResponse?: string | null;
}
