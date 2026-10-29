import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleInit } from '@nestjs/common';
import { DomainEvents } from '../../common/events/domain-events.js';
import { AnnouncementsService } from '../announcements/announcements.service.js';
import { NotificationsService } from './notifications.service.js';

// Turns platform announcements into staff notifications: a notification per
// announcement while it is live (announcement.published → shown,
// announcement.withdrawn → taken down). On start-up it catches up with the
// announcements that are live now, in case events were missed.
@Injectable()
export class AnnouncementNotificationsListener implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(AnnouncementNotificationsListener.name);

  constructor(
    private readonly events: DomainEvents,
    private readonly announcements: AnnouncementsService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    this.events.on('announcement.published', (event) => this.notifications.showAnnouncement(event));
    this.events.on('announcement.withdrawn', (event) => this.notifications.withdrawAnnouncement(event.announcementId, new Date(event.withdrawnAt)));
  }

  async onApplicationBootstrap() {
    try {
      await this.notifications.reconcileAnnouncements(await this.announcements.liveAnnouncements());
    } catch (error) {
      this.logger.error('Catching up with live announcements failed', error instanceof Error ? error.stack : undefined);
    }
  }
}
