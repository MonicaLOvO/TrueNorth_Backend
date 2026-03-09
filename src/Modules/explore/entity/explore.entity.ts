import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Tracking } from '../../../common/entity/tracking.entity.js';
import { Chat } from '../../chat/entity/chat.entity.js';
import { Favorite } from './favorite.entity.js';

@Entity('explores')
export class Explore extends Tracking {
  @ManyToOne(() => Chat, (chat) => chat.explores, { nullable: false })
  @JoinColumn({ name: 'chatId' })
  chat: Chat;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @OneToMany(() => Favorite, (favorite) => favorite.explore)
  favorites: Favorite[];
}
