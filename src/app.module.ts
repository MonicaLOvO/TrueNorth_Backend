import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot(),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password1234',
      database: 'truenorth',
      autoLoadEntities: true,
      synchronize: true, // only for development
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
