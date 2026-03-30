import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entity/chat.entity.js';
import { Conversation } from './entity/conversation.entity.js';
import {
  autoRegisterControllers,
  autoRegisterProviders,
} from '../../config/auto-di-setup.js';
import { AuthModule } from '../auth/auth.module.js';

const chatControllers = autoRegisterControllers(__dirname);
const chatProviders = autoRegisterProviders(__dirname);

@Module({
  imports: [TypeOrmModule.forFeature([Chat, Conversation]), AuthModule],
  controllers: chatControllers,
  providers: chatProviders,
  exports: chatProviders,
})
export class ChatModule {}
