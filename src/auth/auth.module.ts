import { AuthService } from './auth.service.js';
import { Module } from '@nestjs/common';

@Module({
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
