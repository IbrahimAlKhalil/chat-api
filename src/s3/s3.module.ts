import { HyperExModule } from '../hyper-ex/hyper-ex.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { S3Controller } from './s3.controller.js';
import { S3Service } from './s3.service.js';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, HyperExModule, AuthModule],
  providers: [S3Service, S3Controller],
  exports: [S3Service],
})
export class S3Module {}
