import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Tracking } from '../../../common/entity/tracking.entity.js';
import { Chat } from './chat.entity.js';
import { Question } from '../../question/entity/question.entity.js';

@Entity('conversations')
export class Conversation extends Tracking {
  @ManyToOne(() => Chat, (chat) => chat.conversations, { nullable: false })
  @JoinColumn({ name: 'chatId' })
  chat: Chat;

  @Column({ type: 'varchar', length: 40 })
  action: string;

  @Column({ type: 'text', nullable: true })
  promptSummary: string | null;

  @Column({ type: 'text', nullable: true })
  aiResponse: string | null;

  @OneToMany(() => Question, (question) => question.conversation)
  questions: Question[];
}
