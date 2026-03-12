import { Column, Entity } from 'typeorm';
import { Tracking } from '../../../common/entity/tracking.entity.js';

@Entity('ai_connections')
export class AiConnection extends Tracking {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'openai' })
  providerType: string;

  @Column({ type: 'text', nullable: true })
  encryptedApiKey: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  endpointUrl: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  modelName: string | null;

  @Column({ type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  isSelected: boolean;

  @Column({ type: 'int', default: 100 })
  priority: number;

  @Column({ type: 'timestamp', nullable: true })
  lastFailureAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastFailureReason: string | null;
}
