import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Liveness check for the docker-compose healthcheck.
  @Get('health')
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
