import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Tracking } from '../../../common/entity/tracking.entity.js';
import { Conversation } from '../../chat/entity/conversation.entity.js';
import { Option } from './option.entity';

@Entity('questions')
export class Question extends Tracking {
  @ManyToOne(() => Conversation, (conversation) => conversation.questions, { nullable: false })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'boolean', default: false })
  isCarried: boolean;

  @OneToMany(() => Option, (option) => option.question)
  options: Option[];
}
