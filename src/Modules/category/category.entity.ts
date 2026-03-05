import { Column, Entity } from 'typeorm';
import { Tracking } from '../../common/entity/tracking.entity.js';

@Entity('categories')
export class Category extends Tracking {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  iconUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
