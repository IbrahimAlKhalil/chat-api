import { HyperExService } from './hyper-ex.service.js';
import { Module } from '@nestjs/common';

@Module({
  providers: [HyperExService],
  exports: [HyperExService],
})
export class HyperExModule {}
