import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';

type Health = { status: 'ok'; db: 'connected' | 'disconnected' };

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Liveness check for the docker-compose healthcheck; also pings the database.
  @Get('health')
  async health(): Promise<Health> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'connected' };
    } catch (error) {
      this.logger.error('Database health check failed', error instanceof Error ? error.stack : String(error));
      return { status: 'ok', db: 'disconnected' };
    }
  }
}
