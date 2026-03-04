/**
 * =============================================================================
 * LLM PROVIDER INTERFACE – Contract for any AI/LLM backend
 * =============================================================================
 *
 * This interface defines what "an AI provider" must do. Both our mock provider
 * (no API, no cost) and the real OpenAI provider implement this. The rest of
 * the app (e.g. AiService) only depends on this contract, so we can swap
 * mock ↔ OpenAI or add DeepSeek later without changing any calling code.
 *
 * Why an interface?
 * - Dependency injection: we inject "the provider" and Nest gives us whichever
 *   implementation is bound in AiModule (mock or OpenAI).
 * - Easy to add more providers later (e.g. DeepSeek) and choose via config.
 */

/** One message in a conversation: role (who said it) and content (the text). */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Contract for an LLM provider. Implement this for mock, OpenAI, DeepSeek, etc.
 */
export interface ILLMProvider {
  /**
   * Send a list of messages to the AI and get back the assistant's reply.
   * @param messages - Conversation so far (system prompt, user messages, etc.)
   * @returns The assistant's reply as plain text
   */
  generateCompletion(messages: ChatMessage[]): Promise<string>;
}

/**
 * Token we use in Nest to inject the provider. TypeScript interfaces don't
 * exist at runtime, so we need a string/symbol for dependency injection.
 */
export const LLM_PROVIDER_TOKEN = 'LLM_PROVIDER';
