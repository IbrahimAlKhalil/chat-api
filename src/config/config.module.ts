import { Global, Module } from '@nestjs/common';
import { Config } from './config.js';
import { config } from 'dotenv';

@Global()
@Module({
  providers: [Config],
  exports: [Config],
})
export class ConfigModule {
  constructor() {
    try {
      config();
    } catch (e) {
      //
    }
  }
}
