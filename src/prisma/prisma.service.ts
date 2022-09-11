import { INestApplicationContext, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../prisma/client/index.js';
import { Config } from '../config/config.js';
import postgres from 'postgres';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly config: Config) {
    super();
  }

  public readonly postgres = postgres(this.config.postgres.url, {
    publications: this.config.postgres.publications,
  });

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplicationContext) {
    this.$on('beforeExit', async () => {
      await this.postgres.end({ timeout: 10 });
      await app.close();
    });
  }
}