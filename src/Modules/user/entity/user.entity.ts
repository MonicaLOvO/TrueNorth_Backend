import { Column, Entity, OneToMany } from 'typeorm';
import { Chat } from '../../chat/entity/chat.entity.js';
import { Tracking } from '../../../common/entity/tracking.entity.js';
import { Favorite } from '../../explore/entity/favorite.entity.js';
import { Answer } from '../../question/entity/answer.entity.js';


@Entity('users')
export class User extends Tracking {
  @Column({ type: 'varchar', length: 100, unique: true })
  userName: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  email: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  displayName: string | null;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @OneToMany(() => Chat, (chat) => chat.user)
  chats: Chat[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];

  @OneToMany(() => Answer, (answer) => answer.user)
  answers: Answer[];
}
