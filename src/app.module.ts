import { ConversationModule } from './conversation/conversation.module.js';
import { HyperExModule } from './hyper-ex/hyper-ex.module.js';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from './config/config.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { MemberModule } from './member/member.module.js';
import { AuthModule } from './auth/auth.module.js';
import { S3Module } from './s3/s3.module.js';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      global: true,
    }),
    ConversationModule,
    HyperExModule,
    MemberModule,
    PrismaModule,
    ConfigModule,
    AuthModule,
    S3Module,
  ],
})
export class AppModule {}
