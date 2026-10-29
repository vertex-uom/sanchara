import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppConfig } from '../config/app-config.service.js';

type RedisCommandCaller = {
  call(command: 'FLUSHDB'): Promise<'OK'>;
};

// One shared connection for sessions, rate limits and short-lived tokens.
@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor(config: AppConfig) {
    super(config.redisUrl, { maxRetriesPerRequest: 2 });
  }

  flushdb() {
    return (this as unknown as RedisCommandCaller).call('FLUSHDB');
  }

  async onModuleDestroy() {
    await this.quit();
  }
}
