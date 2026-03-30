import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Explore } from './entity/explore.entity.js';
import { Favorite } from './entity/favorite.entity.js';
import {
  autoRegisterControllers,
  autoRegisterProviders,
} from '../../config/auto-di-setup.js';
import { AuthModule } from '../auth/auth.module.js';

const exploreControllers = autoRegisterControllers(__dirname);
const exploreProviders = autoRegisterProviders(__dirname);

@Module({
  imports: [TypeOrmModule.forFeature([Explore, Favorite]), AuthModule],
  controllers: exploreControllers,
  providers: exploreProviders,
  exports: exploreProviders,
})
export class ExploreModule {}
