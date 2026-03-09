import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Tracking } from '../../../common/entity/tracking.entity.js';
import { User } from '../../user/entity/user.entity.js';
import { Explore } from './explore.entity.js';

@Entity('favorites')
export class Favorite extends Tracking {
  @ManyToOne(() => User, (user) => user.favorites, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Explore, (explore) => explore.favorites, { nullable: false })
  @JoinColumn({ name: 'exploreId' })
  explore: Explore;
}
