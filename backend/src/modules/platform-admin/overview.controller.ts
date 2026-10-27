import { Controller, Get, Query } from '@nestjs/common';
import { AdminOnly } from '../auth/guards/admin.guard.js';
import { OverviewQueryDto } from './dto/overview-query.dto.js';
import { OverviewService } from './overview.service.js';

// Platform Admin: the Platform Overview page. Admins only.
@Controller('admin/overview')
@AdminOnly()
export class OverviewController {
  constructor(private readonly overview: OverviewService) {}

  // Companies by status, properties by type, staff accounts by role and
  // subscriptions; ?provinceId= narrows them to one province.
  @Get('summary')
  summary(@Query() query: OverviewQueryDto) {
    return this.overview.summary(query.provinceId);
  }

  // For the province filter in the console header.
  @Get('provinces')
  provinces() {
    return this.overview.provinces();
  }
}
