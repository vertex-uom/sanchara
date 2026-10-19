import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { RedisService } from '../common/redis/redis.service.js';

// Liveness + dependencies, used by the Docker healthcheck. Outside the /v1 prefix.
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check(@Res({ passthrough: true }) response: Response) {
    const [database, redis] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(() => 'up' as const, () => 'down' as const),
      this.redis.ping().then(() => 'up' as const, () => 'down' as const),
    ]);
    const ok = database === 'up' && redis === 'up';
    response.status(ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return { status: ok ? 'ok' : 'error', database, redis };
  }
}
