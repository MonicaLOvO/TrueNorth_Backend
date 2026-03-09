import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entity/chat.entity.js';
import {
  autoRegisterControllers,
  autoRegisterProviders,
} from '../../config/auto-di-setup.js';

const chatControllers = autoRegisterControllers(__dirname);
const chatProviders = autoRegisterProviders(__dirname);

@Module({
  imports: [TypeOrmModule.forFeature([Chat])],
  controllers: chatControllers,
  providers: chatProviders,
  exports: chatProviders,
})
export class ChatModule {}
