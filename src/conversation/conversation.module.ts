import { ConversationController } from './conversation.controller.js';
import { HyperExModule } from '../hyper-ex/hyper-ex.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { HelperModule } from '../helper/helper.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { Module } from '@nestjs/common';

@Module({
  imports: [HyperExModule, PrismaModule, AuthModule, HelperModule],
  providers: [ConversationController],
})
export class ConversationModule {}
