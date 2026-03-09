import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entity/category.entity.js';
import {
  autoRegisterControllers,
  autoRegisterProviders,
} from '../../config/auto-di-setup.js';

const categoryControllers = autoRegisterControllers(__dirname);
const categoryProviders = autoRegisterProviders(__dirname);

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: categoryControllers,
  providers: categoryProviders,
  exports: categoryProviders,
})
export class CategoryModule {}
