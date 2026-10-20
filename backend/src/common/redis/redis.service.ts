import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppConfig } from '../config/app-config.service.js';

// One shared connection for sessions, rate limits and short-lived tokens.
@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor(config: AppConfig) {
    super(config.redisUrl, { maxRetriesPerRequest: 2 });
  }

  async onModuleDestroy() {
    await this.quit();
  }
}
