import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiConnection } from './entity/ai-connection.entity.js';
import {
  autoRegisterControllers,
  autoRegisterProviders,
} from '../../config/auto-di-setup.js';
import { ConfigModule } from '@nestjs/config';

const controllers = autoRegisterControllers(__dirname);
const providers = autoRegisterProviders(__dirname);

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([AiConnection])],
  controllers,
  providers,
  exports: providers,
})
export class AiConnectionModule {}
