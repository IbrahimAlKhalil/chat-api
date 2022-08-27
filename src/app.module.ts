import { HyperExModule } from './hyper-ex/hyper-ex.module.js';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from './config/config.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      global: true,
    }),
    PrismaModule,
    ConfigModule,
    HyperExModule,
  ],
})
export class AppModule {}
