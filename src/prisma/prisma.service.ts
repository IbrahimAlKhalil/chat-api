import { INestApplicationContext, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../prisma/client/index.js';
import { Config } from '../config/config.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly config: Config) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplicationContext) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}