import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { AnnouncementsPublisher } from './announcements.publisher.js';
import { AnnouncementsRepository } from './announcements.repository.js';
import { AnnouncementsService } from './announcements.service.js';

// Platform announcements to company staff. Raises announcement.published and
// announcement.withdrawn (announcement.events.ts); the notifications module
// turns them into system notifications. Never sends email or WhatsApp.
@Module({
  imports: [AuditModule],
  providers: [AnnouncementsService, AnnouncementsRepository, AnnouncementsPublisher],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
