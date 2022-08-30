import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthService } from './auth.service.js';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
