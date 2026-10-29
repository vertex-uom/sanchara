import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { AppConfig } from '../config/app-config.service.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: AppConfig) {
    // The pg adapter ignores ?schema= in the URL (the e2e tests use schema "e2e").
    // search_path makes raw SQL (the tests' TRUNCATEs) hit the same schema.
    const schema = new URL(config.databaseUrl).searchParams.get('schema') ?? undefined;
    const options = schema ? `-c search_path=${schema}` : undefined;
    super({ adapter: new PrismaPg({ connectionString: config.databaseUrl, options }, { schema }) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
