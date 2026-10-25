import { Controller, Get } from '@nestjs/common';
import { AdminOnly } from '../auth/guards/admin.guard.js';
import { OverviewService } from './overview.service.js';

// Platform Admin: the Platform Overview page. Admins only.
@Controller('admin/overview')
@AdminOnly()
export class OverviewController {
  constructor(private readonly overview: OverviewService) {}

  // Companies by status, properties by type and staff accounts by role.
  @Get('summary')
  summary() {
    return this.overview.summary();
  }
}
