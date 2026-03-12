import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiConnectionRepository } from '../repository/ai-connection.repository.js';
import { CreateAiConnectionDto } from '../dto/create-ai-connection.dto.js';
import { AiConnectionDto } from '../dto/ai-connection.dto.js';
import { AiConnectionCryptoService } from './ai-connection-crypto.service.js';

export interface AiProviderCandidate {
  id: string | null;
  name: string;
  providerType: 'openai' | 'gemini' | 'ollama';
  apiKey: string | null;
  endpointUrl: string | null;
  modelName: string | null;
  isSelected: boolean;
  source: 'db' | 'env';
}

const RATE_LIMIT_COOLDOWN_MS = 60_000;

@Injectable()
export class AiConnectionService implements OnModuleInit {
  constructor(
    private readonly repo: AiConnectionRepository,
    private readonly crypto: AiConnectionCryptoService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDefaultOllamaConnection();
  }

  async listAll(): Promise<AiConnectionDto[]> {
    const entities = await this.repo.findAllConnections();
    return entities.map((entity) => ({
      id: entity.Id,
      name: entity.name,
      providerType: entity.providerType,
      endpointUrl: entity.endpointUrl,
      modelName: entity.modelName,
      isEnabled: entity.isEnabled,
      isSelected: entity.isSelected,
      priority: entity.priority,
      keyPreview: entity.encryptedApiKey ? this.maskKey(this.safeDecrypt(entity.encryptedApiKey)) : 'n/a',
      lastFailureAt: entity.lastFailureAt ? entity.lastFailureAt.toISOString() : null,
      lastFailureReason: entity.lastFailureReason,
    }));
  }

  async create(input: CreateAiConnectionDto): Promise<AiConnectionDto> {
    if (!input || typeof input !== 'object') {
      throw new BadRequestException('request body is required');
    }
    const name = input.name?.trim();
    const apiKey = input.apiKey?.trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }
    const providerType = input.providerType?.trim().toLowerCase() || 'openai';
    if (!['openai', 'gemini', 'ollama'].includes(providerType)) {
      throw new BadRequestException('providerType must be one of: openai, gemini, ollama');
    }
    if (providerType !== 'ollama' && !apiKey) {
      throw new BadRequestException('apiKey is required for openai/gemini');
    }

    const setSelected = input.setSelected === true;
    const priority = Number.isFinite(input.priority) ? Number(input.priority) : 100;
    const endpointUrl = input.endpointUrl?.trim()
      ? input.endpointUrl.trim()
      : providerType === 'ollama'
        ? this.config.get<string>('ollamaBaseUrl')?.trim() || 'http://127.0.0.1:11434'
        : null;
    const modelName = input.modelName?.trim()
      ? input.modelName.trim()
      : providerType === 'ollama'
        ? this.config.get<string>('ollamaModel')?.trim() || 'llama3.2'
        : null;
    const saved = await this.repo.createAndSave({
      name,
      providerType,
      encryptedApiKey: apiKey ? this.crypto.encrypt(apiKey) : null,
      endpointUrl,
      modelName,
      isEnabled: input.isEnabled ?? true,
      isSelected: setSelected,
      priority,
    });

    if (setSelected) {
      await this.activate(saved.Id);
    }

    const list = await this.listAll();
    const created = list.find((item) => item.id === saved.Id);
    if (!created) {
      throw new NotFoundException('Created AI connection not found.');
    }
    return created;
  }

  async activate(id: string): Promise<AiConnectionDto> {
    const connections = await this.repo.findAllConnections();
    const target = connections.find((item) => item.Id === id);
    if (!target) {
      throw new NotFoundException(`AI connection with id '${id}' not found`);
    }
    if (!target.isEnabled) {
      throw new BadRequestException('Cannot activate a disabled AI connection.');
    }

    await Promise.all(
      connections.map(async (conn) => {
        const shouldSelect = conn.Id === id;
        if (conn.isSelected !== shouldSelect) {
          conn.isSelected = shouldSelect;
          await this.repo.save(conn);
        }
      }),
    );

    return {
      id: target.Id,
      name: target.name,
      providerType: target.providerType,
      endpointUrl: target.endpointUrl,
      modelName: target.modelName,
      isEnabled: target.isEnabled,
      isSelected: true,
      priority: target.priority,
      keyPreview: target.encryptedApiKey ? this.maskKey(this.safeDecrypt(target.encryptedApiKey)) : 'n/a',
      lastFailureAt: target.lastFailureAt ? target.lastFailureAt.toISOString() : null,
      lastFailureReason: target.lastFailureReason,
    };
  }

  async getProviderCandidates(): Promise<AiProviderCandidate[]> {
    const entities = await this.repo.findAllConnections();
    const dbCandidatesAll: AiProviderCandidate[] = entities
      .filter((item) => item.isEnabled)
      .map((item) => ({
        id: item.Id,
        name: item.name,
        providerType: (item.providerType === 'gemini'
          ? 'gemini'
          : item.providerType === 'ollama'
            ? 'ollama'
            : 'openai') as
          | 'openai'
          | 'gemini'
          | 'ollama',
        apiKey: item.encryptedApiKey ? this.safeDecrypt(item.encryptedApiKey) : null,
        endpointUrl: item.endpointUrl,
        modelName: item.modelName,
        isSelected: item.isSelected,
        source: 'db' as const,
      }))
      .filter((candidate) => this.isUsableCandidate(candidate));

    const dbCandidates = entities
      .filter((item) => item.isEnabled)
      .filter((item) => !this.isInRateLimitCooldown(item))
      .map((item) => dbCandidatesAll.find((c) => c.id === item.Id))
      .filter((candidate): candidate is AiProviderCandidate => Boolean(candidate));

    const envKey = this.config.get<string>('openaiApiKey')?.trim();
    if (envKey) {
      dbCandidates.push({
        id: null,
        name: 'env-openai-key',
        providerType: 'openai',
        apiKey: envKey,
        endpointUrl: null,
        modelName: null,
        isSelected: dbCandidates.length === 0,
        source: 'env',
      });
    }
    return dbCandidates;
  }

  async markTemporaryFailure(candidate: AiProviderCandidate, reason: string): Promise<void> {
    if (!candidate.id) {
      return;
    }
    const entity = await this.repo.findById(candidate.id);
    if (!entity) {
      return;
    }
    entity.lastFailureAt = new Date();
    entity.lastFailureReason = reason.slice(0, 255);
    await this.repo.save(entity);
  }

  async promoteAsSelected(candidate: AiProviderCandidate): Promise<void> {
    if (!candidate.id) {
      return;
    }
    await this.activate(candidate.id);
  }

  private safeDecrypt(payload: string): string {
    if (!payload?.trim()) {
      return '';
    }
    try {
      return this.crypto.decrypt(payload);
    } catch {
      return '';
    }
  }

  private maskKey(key: string): string {
    const trimmed = key.trim();
    if (!trimmed) {
      return 'hidden';
    }
    if (trimmed.length <= 8) {
      return `${trimmed[0]}***${trimmed[trimmed.length - 1]}`;
    }
    const last4 = trimmed.slice(-4);
    return `***${last4}`;
  }

  private isUsableCandidate(candidate: AiProviderCandidate): boolean {
    if (candidate.providerType === 'ollama') {
      return Boolean(candidate.endpointUrl?.trim() && candidate.modelName?.trim());
    }
    return Boolean(candidate.apiKey?.trim());
  }

  private isInRateLimitCooldown(entity: {
    lastFailureAt: Date | null;
    lastFailureReason: string | null;
  }): boolean {
    if (!entity.lastFailureAt || !entity.lastFailureReason) {
      return false;
    }
    if (!entity.lastFailureReason.startsWith('429:')) {
      return false;
    }
    const elapsedMs = Date.now() - new Date(entity.lastFailureAt).getTime();
    return elapsedMs >= 0 && elapsedMs < RATE_LIMIT_COOLDOWN_MS;
  }

  private async ensureDefaultOllamaConnection(): Promise<void> {
    const existing = await this.repo.findByProviderType('ollama');
    if (existing.length > 0) {
      return;
    }
    const defaultEndpoint =
      this.config.get<string>('ollamaBaseUrl')?.trim() || 'http://127.0.0.1:11434';
    const defaultModel = this.config.get<string>('ollamaModel')?.trim() || 'llama3.2';

    await this.repo.createAndSave({
      name: 'local-ollama-default',
      providerType: 'ollama',
      encryptedApiKey: null,
      endpointUrl: defaultEndpoint,
      modelName: defaultModel,
      isEnabled: true,
      isSelected: false,
      priority: 1000,
    });
  }
}
