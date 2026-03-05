import { Column, Entity } from 'typeorm';
import { Tracking } from '../../common/entity/tracking.entity.js';

@Entity('questions')
export class Question extends Tracking {
  @Column({ type: 'text' })
  questionDetail: string;

  @Column({ type: 'text', array: true, default: '{}' })
  options: string[];

  @Column({ type: 'text', nullable: true })
  answer: string | null;
}
