import { Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Tracking } from '../../../common/entity/tracking.entity.js';
import { User } from '../../user/entity/user.entity.js';
import { Category } from '../../category/entity/category.entity.js';
import { Explore } from '../../explore/entity/explore.entity.js';

@Entity('chats')
export class Chat extends Tracking {
  @ManyToOne(() => User, (user) => user.chats, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @ManyToOne(() => Category, { nullable: false })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => Explore, (explore) => explore.chat)
  explores: Explore[];
}
