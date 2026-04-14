/**
 * =============================================================================
 * CONFIGURATION – Environment variables and app config
 * =============================================================================
 *
 * This file defines how we read and validate environment variables.
 * NestJS ConfigModule calls this function on startup and makes values available
 * via ConfigService (e.g. in app.module.ts or any service).
 *
 * Why we do this:
 * - Secrets (DB password, API keys) stay in .env and are never committed.
 * - On Render, you set env vars in the dashboard; they get injected here.
 * - We validate required vars so the app fails fast with a clear error if
 *   something is missing, instead of failing later with a cryptic message.
 */

/**
 * List of env vars that must be set for the app to run.
 * Add a variable here when you add a new required setting.
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_USERNAME',
  'DATABASE_PASSWORD',
  'DATABASE_NAME',
] as const;

/**
 * Validates that all required environment variables are present.
 * Called when the config is first loaded. Throws a clear error if any are missing.
 */
function validateRequiredEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in the values.',
    );
  }
}

/**
 * Configuration factory used by ConfigModule.
 * NestJS calls this once at startup; the returned object is what you get
 * when you inject ConfigService and call get('database'), get('port'), etc.
 */
export default function configuration() {
  // Fail fast if required vars are missing (e.g. DATABASE_*)
  validateRequiredEnv();

  return {
    // -------------------------------------------------------------------------
    // Server
    // -------------------------------------------------------------------------
    /** Port the HTTP server listens on. Default 3000; on Render, set PORT in env. */
    port: parseInt(process.env.PORT ?? '3000', 10),

    // -------------------------------------------------------------------------
    // Database (PostgreSQL) – used by TypeORM in app.module.ts
    // -------------------------------------------------------------------------
    database: {
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      name: process.env.DATABASE_NAME,
    },

    // -------------------------------------------------------------------------
    // AI / LLM
    // -------------------------------------------------------------------------
    /** Optional fallback OpenAI API key from env (DB keys are preferred when configured). */
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    /**
     * When true, LLM uses mock provider. Speech-to-text still uses Deepgram if DEEPGRAM_API_KEY is set.
     * When false, use real providers from DB (or env fallback for OpenAI chat).
     */
    aiUseMock: process.env.AI_USE_MOCK === 'true',
    /** Secret used to encrypt AI provider keys stored in DB. */
    aiConnectionEncryptionKey: process.env.AI_CONNECTION_ENCRYPTION_KEY ?? '',
    /** Default local Ollama endpoint used when creating default local provider row. */
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434',
    /** Default local Ollama model used for local fallback. */
    ollamaModel: process.env.OLLAMA_MODEL ?? 'llama3.2',

    /**
     * Optional Deepgram API key for speech-to-text (POST /decisions/chat/audio).
     * When set, transcription always uses Deepgram (takes precedence over AI_USE_MOCK for STT only).
     */
    deepgramApiKey: process.env.DEEPGRAM_API_KEY ?? 'b8fb9853e9cd3d6cb4a430b30de43474498eff18',

    // -------------------------------------------------------------------------
    // JWT – used by AuthModule for login / register (Bearer tokens)
    // -------------------------------------------------------------------------
    jwt: {
      /** Required for auth. Generate a long random string for production. */
      secret: process.env.JWT_SECRET ?? '',
      /** Access token lifetime in seconds (default 1 day). */
      expiresInSeconds: parseInt(process.env.JWT_EXPIRES_IN_SECONDS ?? '86400', 10),
    },
  };
}

/**
 * TypeScript type for the config object. Use this when you need to type
 * ConfigService.get('key') or when extending configuration.
 */
export type Configuration = ReturnType<typeof configuration>;
