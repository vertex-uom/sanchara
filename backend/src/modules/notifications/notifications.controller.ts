import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentStaff } from '../../common/decorators/current-staff.decorator.js';
import { StaffOnly } from '../staff/guards/staff.guard.js';
import type { SignedInStaff } from '../staff/staff.service.js';
import { NotificationsService } from './notifications.service.js';

// The signed-in staff member's system notifications (Back Office bell).
@Controller('notifications')
@StaffOnly()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  // Live notifications for this staff member, newest first, plus the unread total.
  @Get()
  feed(@CurrentStaff() staff: SignedInStaff) {
    return this.notifications.feed(staff);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(@CurrentStaff() staff: SignedInStaff) {
    return this.notifications.markAllRead(staff);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(@CurrentStaff() staff: SignedInStaff, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.markRead(staff, id);
  }

  // 409 NOT_DISMISSIBLE when the notification must stay until it ends.
  @Post(':id/dismiss')
  @HttpCode(HttpStatus.NO_CONTENT)
  dismiss(@CurrentStaff() staff: SignedInStaff, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.dismiss(staff, id);
  }
}
