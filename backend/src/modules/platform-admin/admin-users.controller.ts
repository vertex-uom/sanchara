import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { AdminsService } from '../auth/admins/admins.service.js';
import { AdminOnly } from '../auth/guards/admin.guard.js';

// Platform Admin: the admin accounts of this console. Admins only.
@Controller('admin/admins')
@AdminOnly()
export class AdminUsersController {
  constructor(private readonly admins: AdminsService) {}

  // Paged, active first by last sign-in, with counts per status.
  @Get()
  list(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number) {
    return this.admins.list(page);
  }
}
