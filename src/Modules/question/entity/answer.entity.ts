import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Tracking } from '../../../common/entity/tracking.entity.js';
import { Option } from './option.entity.js';
import { User } from '../../user/entity/user.entity.js';

@Entity('answers')
export class Answer extends Tracking {
  @ManyToOne(() => Option, (option) => option.answers, { nullable: false })
  @JoinColumn({ name: 'optionId' })
  option: Option;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;
}
