/**
 * =============================================================================
 * APP MODULE – Root module of the NestJS application
 * =============================================================================
 *
 * This is the "main" module. It imports:
 * - ConfigModule: loads .env and our configuration (see config/configuration.ts)
 * - TypeOrmModule: connects to PostgreSQL and registers entities (we add entities later)
 *
 * We use forRootAsync for TypeORM so we can inject ConfigService and read
 * database settings from environment variables instead of hardcoding them.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import configuration from './config/configuration';
import { getTypeOrmEntityGlobs } from './config/typeorm-entities';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module.js';
import { CategoryModule } from './Modules/category/category.module.js';
import { RecommendationsModule } from './recommendations/recommendations.module.js';
import { UserModule } from './Modules/user/user.module.js';
import { ChatModule } from './Modules/chat/chat.module.js';
import { ExploreModule } from './Modules/explore/explore.module.js';
import { DecisionsModule } from './Modules/decisions/decisions.module.js';

@Module({
  imports: [
    AiModule,
    CategoryModule,
    UserModule,
    ChatModule,
    ExploreModule,
    DecisionsModule,
    RecommendationsModule,
    // -------------------------------------------------------------------------
    // Config: load .env and our configuration. The 'load' array runs
    // configuration() at startup and merges the result into ConfigService.
    // -------------------------------------------------------------------------
    ConfigModule.forRoot({
      isGlobal: true, // So we don't have to import ConfigModule in every feature module
      load: [configuration],
    }),

    // -------------------------------------------------------------------------
    // TypeORM: PostgreSQL connection. We use forRootAsync so we can inject
    // ConfigService and read DB_* from env. Sync is only for dev; use
    // migrations in production.
    // -------------------------------------------------------------------------
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        entities: getTypeOrmEntityGlobs(),
        autoLoadEntities: true, // Load entities from any module that uses TypeOrmModule.forFeature()
        synchronize: true, // ONLY for development – creates/updates tables from entities. Use migrations in prod.
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
