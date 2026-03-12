export class ChatMessageDto {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class ChatRequestDto {
  messages: ChatMessageDto[];
}
