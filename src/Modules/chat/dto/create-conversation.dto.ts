export class CreateConversationDto {
  chatId: string;
  action: string;
  promptSummary?: string | null;
  aiResponse?: string | null;
}
