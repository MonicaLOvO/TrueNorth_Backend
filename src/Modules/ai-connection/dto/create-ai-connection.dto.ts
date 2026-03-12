export class CreateAiConnectionDto {
  name: string;
  /** Required for openai/gemini. Not required for ollama. */
  apiKey?: string;
  /** openai | gemini | ollama */
  providerType?: string;
  /** Optional provider endpoint override (useful for ollama). */
  endpointUrl?: string;
  /** Optional model override (useful for ollama). */
  modelName?: string;
  isEnabled?: boolean;
  setSelected?: boolean;
  priority?: number;
}
