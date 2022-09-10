import { HyperExModule } from '../hyper-ex/hyper-ex.module.js';
import { HelperModule } from '../helper/helper.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MemberController } from './member.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { Module } from '@nestjs/common';

@Module({
  imports: [HelperModule, HyperExModule, PrismaModule, AuthModule],
  providers: [MemberController],
})
export class MemberModule {}
