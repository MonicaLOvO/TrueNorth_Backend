import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';
import { AiConnectionService } from '../Modules/ai-connection/service/ai-connection.service.js';

type TranscriptionContext =
  | { mode: 'mock' }
  | { mode: 'deepgram'; apiKey: string }
  | { mode: 'openai'; apiKey: string };

const DEEPGRAM_LISTEN_URL = 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true';

@Injectable()
export class SpeechTranscriptionService {
  constructor(
    private readonly config: ConfigService,
    private readonly aiConnectionService: AiConnectionService,
  ) {}

  /**
   * Transcribes uploaded audio: Deepgram when DEEPGRAM_API_KEY is set (env), else mock if
   * AI_USE_MOCK, else OpenAI Whisper from DB AI connections. Chat after transcript still uses
   * the normal AI stack (mock vs real) unchanged.
   */
  async transcribe(buffer: Buffer, filename: string, mimetype?: string): Promise<string> {
    const ctx = await this.resolveTranscriptionContext();
    if (ctx.mode === 'mock') {
      return 'Mock voice message: suggest something fun to do this weekend.';
    }
    if (ctx.mode === 'deepgram') {
      return this.transcribeWithDeepgram(buffer, ctx.apiKey, mimetype);
    }
    return this.transcribeWithWhisper(buffer, filename, mimetype, ctx.apiKey);
  }

  private async transcribeWithDeepgram(
    buffer: Buffer,
    apiKey: string,
    mimetype: string | undefined,
  ): Promise<string> {
    const contentType = mimetype?.trim() || 'application/octet-stream';
    let res: Response;
    try {
      res = await fetch(DEEPGRAM_LISTEN_URL, {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': contentType,
        },
        body: new Uint8Array(buffer),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SpeechTranscriptionService] Deepgram network error', message);
      throw new BadRequestException('Speech-to-text failed. Check your connection and try again.');
    }

    const rawText = await res.text();
    if (!res.ok) {
      console.error('[SpeechTranscriptionService] Deepgram API error', res.status, rawText.slice(0, 500));
      if (res.status === 401) {
        throw new BadRequestException('Speech-to-text failed: invalid Deepgram API key.');
      }
      if (res.status === 429) {
        throw new BadRequestException('Speech-to-text rate limited. Please try again shortly.');
      }
      throw new BadRequestException('Speech-to-text failed. Check the audio format and try again.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText) as unknown;
    } catch {
      throw new BadRequestException('Speech-to-text returned an invalid response.');
    }

    const text = extractDeepgramTranscript(parsed)?.trim();
    if (!text) {
      throw new BadRequestException('Could not transcribe audio. Try again with clearer audio.');
    }
    return text;
  }

  private async transcribeWithWhisper(
    buffer: Buffer,
    filename: string,
    mimetype: string | undefined,
    apiKey: string,
  ): Promise<string> {
    const client = new OpenAI({ apiKey });
    const uploadName = filename?.trim() || 'audio.webm';
    let file: Awaited<ReturnType<typeof toFile>>;
    try {
      file = await toFile(buffer, uploadName, mimetype?.trim() ? { type: mimetype.trim() } : undefined);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SpeechTranscriptionService] toFile failed', message);
      throw new BadRequestException('Invalid audio upload.');
    }

    try {
      const result = await client.audio.transcriptions.create({
        file,
        model: 'whisper-1',
      });
      const text = result.text?.trim();
      if (!text) {
        throw new BadRequestException('Could not transcribe audio. Try again with clearer audio.');
      }
      return text;
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SpeechTranscriptionService] Whisper API error', status ?? message, err);
      if (status === 401) {
        throw new BadRequestException('Speech-to-text failed: invalid OpenAI API key.');
      }
      if (status === 429) {
        throw new BadRequestException('Speech-to-text rate limited. Please try again shortly.');
      }
      throw new BadRequestException('Speech-to-text failed. Check the audio format and try again.');
    }
  }

  private async resolveTranscriptionContext(): Promise<TranscriptionContext> {
    const deepgramKey = this.config.get<string>('deepgramApiKey')?.trim();
    if (deepgramKey) {
      return { mode: 'deepgram', apiKey: deepgramKey };
    }

    const useMock = this.config.get<boolean>('aiUseMock');
    if (useMock) {
      return { mode: 'mock' };
    }

    const candidates = await this.aiConnectionService.getProviderCandidates();
    const openai = candidates.find(
      (c) => c.source === 'db' && c.providerType === 'openai' && c.apiKey?.trim(),
    );
    if (!openai?.apiKey?.trim()) {
      throw new BadRequestException(
        'Voice input needs speech-to-text. Set DEEPGRAM_API_KEY or add an enabled OpenAI AI connection for Whisper.',
      );
    }
    return { mode: 'openai', apiKey: openai.apiKey.trim() };
  }
}

function extractDeepgramTranscript(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const results = (body as { results?: unknown }).results;
  if (!results || typeof results !== 'object') {
    return null;
  }
  const channels = (results as { channels?: unknown }).channels;
  if (!Array.isArray(channels) || channels.length === 0) {
    return null;
  }
  const first = channels[0];
  if (!first || typeof first !== 'object') {
    return null;
  }
  const alternatives = (first as { alternatives?: unknown }).alternatives;
  if (!Array.isArray(alternatives) || alternatives.length === 0) {
    return null;
  }
  const alt = alternatives[0];
  if (!alt || typeof alt !== 'object') {
    return null;
  }
  const transcript = (alt as { transcript?: unknown }).transcript;
  return typeof transcript === 'string' ? transcript : null;
}
