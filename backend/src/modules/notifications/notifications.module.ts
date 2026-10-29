import { Module } from '@nestjs/common';
import { AnnouncementsModule } from '../announcements/announcements.module.js';
import { StaffModule } from '../staff/staff.module.js';
import { AnnouncementNotificationsListener } from './announcement-notifications.listener.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationsService } from './notifications.service.js';

// System (in-app) notifications for company staff; never email or WhatsApp.
// Fed by domain events (today: announcements). StaffModule provides the guard.
@Module({
  imports: [StaffModule, AnnouncementsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository, AnnouncementNotificationsListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}
