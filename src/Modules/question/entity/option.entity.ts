import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Tracking } from '../../../common/entity/tracking.entity.js';
import { Question } from './question.entity.js';
import { Answer } from './answer.entity.js';

@Entity('options')
export class Option extends Tracking {
  @ManyToOne(() => Question, (question) => question.options, { nullable: false })
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @Column({ type: 'varchar', length: 300 })
  label: string;

  @Column({ type: 'int' })
  sortOrder: number;

  @OneToMany(() => Answer, (answer) => answer.option)
  answers: Answer[];
}
