/**
 * =============================================================================
 * CHAT REQUEST DTO – What the frontend sends for "chat" flow
 * =============================================================================
 *
 * Purpose: In chat mode the user types freely (e.g. "I want something cozy
 * for dinner"). The frontend sends the conversation history + the latest message
 * to POST /decisions/chat. The backend sends it to the AI and returns the
 * reply (and optionally recommendation cards if the AI suggests options).
 *
 * Why we need it: So the API receives a valid list of messages (role + content)
 * that we can pass straight to the AI. The frontend builds this array as
 * the user and assistant exchange messages.
 */
export class ChatMessageDto {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class ChatRequestDto {
  /** Full conversation so far: system prompt (optional), user and assistant messages. */
  messages: ChatMessageDto[];
}
