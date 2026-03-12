import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConnection } from '../entity/ai-connection.entity.js';

@Injectable()
export class AiConnectionRepository {
  constructor(
    @InjectRepository(AiConnection)
    private readonly repo: Repository<AiConnection>,
  ) {}

  async findAllConnections(): Promise<AiConnection[]> {
    return this.repo.find({
      order: {
        isSelected: 'DESC',
        priority: 'ASC',
        CreatedAt: 'ASC',
      },
    });
  }

  async findById(id: string): Promise<AiConnection | null> {
    return this.repo.findOne({ where: { Id: id } });
  }

  async findByProviderType(providerType: string): Promise<AiConnection[]> {
    return this.repo.find({
      where: { providerType },
      order: {
        priority: 'ASC',
        CreatedAt: 'ASC',
      },
    });
  }

  async save(entity: AiConnection): Promise<AiConnection> {
    return this.repo.save(entity);
  }

  async createAndSave(input: {
    name: string;
    providerType: string;
    encryptedApiKey: string | null;
    endpointUrl: string | null;
    modelName: string | null;
    isEnabled: boolean;
    isSelected: boolean;
    priority: number;
  }): Promise<AiConnection> {
    const entity = this.repo.create({
      name: input.name,
      providerType: input.providerType,
      encryptedApiKey: input.encryptedApiKey,
      endpointUrl: input.endpointUrl,
      modelName: input.modelName,
      isEnabled: input.isEnabled,
      isSelected: input.isSelected,
      priority: input.priority,
      lastFailureAt: null,
      lastFailureReason: null,
    });
    return this.repo.save(entity);
  }
}
