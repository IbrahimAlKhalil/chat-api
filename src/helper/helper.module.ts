import { HelperService } from './helper.service.js';
import { Module } from '@nestjs/common';

@Module({
  providers: [HelperService],
  exports: [HelperService],
})
export class HelperModule {}
