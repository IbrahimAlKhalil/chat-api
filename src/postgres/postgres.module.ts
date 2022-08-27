import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { POSTGRES } from './postgres.symbol.js';
import { Config } from '../config/config.js';
import postgres, { Sql } from 'postgres';

@Module({
  providers: [
    {
      provide: POSTGRES,
      useFactory({ postgres: config }: Config) {
        return postgres(config.url, {
          publications: config.publications,
        });
      },
      inject: [Config],
    },
  ],
  exports: [POSTGRES],
})
export class PostgresModule implements OnModuleDestroy {
  constructor(@Inject(POSTGRES) private readonly postgres: Sql<any>) {}

  async onModuleDestroy() {
    await this.postgres.end({ timeout: 10 });
  }
}
