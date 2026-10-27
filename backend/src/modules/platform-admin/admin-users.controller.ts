import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { AdminsService } from '../auth/admins/admins.service.js';
import { AdminOnly } from '../auth/guards/admin.guard.js';
import { AdminUsersService } from './admin-users.service.js';

// Platform Admin: the admin accounts of this console. Admins only.
@Controller('admin/admins')
@AdminOnly()
export class AdminUsersController {
  constructor(
    private readonly admins: AdminsService,
    private readonly adminUsers: AdminUsersService,
  ) {}

  // Paged, active first by last sign-in, with counts per status.
  @Get()
  list(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number) {
    return this.admins.list(page);
  }

  // Account changes (added, invited, activated, deactivated, reactivated),
  // newest first; at most 50.
  @Get('changes')
  changes(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return this.adminUsers.changes(Math.min(Math.max(limit, 1), 50));
  }
}
