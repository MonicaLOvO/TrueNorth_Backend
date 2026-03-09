import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity.js';
import {
  autoRegisterControllers,
  autoRegisterProviders,
} from '../../config/auto-di-setup.js';

const userControllers = autoRegisterControllers(__dirname);
const userProviders = autoRegisterProviders(__dirname);

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: userControllers,
  providers: userProviders,
  exports: userProviders,
})
export class UserModule {}
