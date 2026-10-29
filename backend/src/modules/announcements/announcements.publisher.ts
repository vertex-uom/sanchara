import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import { DomainEvents } from '../../common/events/domain-events.js';
import type { Announcement } from '../../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import type { AnnouncementPublished } from './announcement.events.js';
import { AnnouncementsRepository } from './announcements.repository.js';
import {
  AUDIENCE_NAMES,
  AUDIENCE_ROLES,
  PUBLISH_BATCH,
  PUBLISH_INTERVAL_MS,
  RECIPIENT_COMPANY_STATUSES,
  RECIPIENT_STAFF_STATUSES,
  TYPE_NAMES,
} from './announcements.rules.js';

export function publishedEvent(announcement: Announcement, publishedAt: Date): AnnouncementPublished {
  return {
    announcementId: announcement.id,
    title: announcement.title,
    message: announcement.message,
    type: TYPE_NAMES[announcement.type],
    audience: AUDIENCE_NAMES[announcement.audience],
    recipients: { roles: AUDIENCE_ROLES[announcement.audience], staffStatuses: RECIPIENT_STAFF_STATUSES, companyStatuses: RECIPIENT_COMPANY_STATUSES },
    dismissible: announcement.dismissible,
    startsAt: announcement.startsAt.toISOString(),
    endsAt: announcement.endsAt?.toISOString() ?? null,
    publishedAt: publishedAt.toISOString(),
  };
}

// Raises announcement.published when an announcement starts and
// announcement.withdrawn when it ends or is archived. Runs every minute, and
// right after an admin publishes "now" or archives. Each announcement is
// claimed in the database before its event is raised, so it is raised once
// even with several API instances; if a listener fails, the claim is undone
// and the next pass retries (listeners must be idempotent).
@Injectable()
export class AnnouncementsPublisher implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(AnnouncementsPublisher.name);
  private timer: NodeJS.Timeout | undefined;
  // Passes run one at a time, in call order.
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly repository: AnnouncementsRepository,
    private readonly events: DomainEvents,
    private readonly audit: AuditService,
  ) {}

  onApplicationBootstrap() {
    void this.run();
    this.timer = setInterval(() => void this.run(), PUBLISH_INTERVAL_MS);
    // A pending pass must not keep a script (seed, create-admin) alive.
    this.timer.unref();
  }

  async onModuleDestroy() {
    clearInterval(this.timer);
    await this.queue;
  }

  // One pass over both queues, after any pass already running. Never throws.
  run(): Promise<void> {
    this.queue = this.queue.then(() => this.pass());
    return this.queue;
  }

  private async pass() {
    const now = new Date();
    try {
      for (const announcement of await this.repository.dueToPublish(now, PUBLISH_BATCH)) await this.publish(announcement, now);
      for (const announcement of await this.repository.dueToWithdraw(now, PUBLISH_BATCH)) await this.withdraw(announcement, now);
    } catch (error) {
      this.logger.error('Announcement publishing pass failed', error instanceof Error ? error.stack : undefined);
    }
  }

  private async publish(announcement: Announcement, now: Date) {
    if (!(await this.repository.claimPublish(announcement.id, now))) return;
    try {
      await this.events.emit('announcement.published', publishedEvent(announcement, now));
    } catch (error) {
      await this.repository.releasePublish(announcement.id, now);
      this.logger.error(`announcement.published failed for ${announcement.id}; retrying next pass`, error instanceof Error ? error.stack : undefined);
      return;
    }
    await this.record('announcement.published', announcement.id, { audience: AUDIENCE_NAMES[announcement.audience] });
  }

  private async withdraw(announcement: Announcement, now: Date) {
    if (!(await this.repository.claimWithdraw(announcement.id, now))) return;
    const reason = announcement.archivedAt ? 'archived' : 'ended';
    try {
      await this.events.emit('announcement.withdrawn', { announcementId: announcement.id, reason, withdrawnAt: now.toISOString() });
    } catch (error) {
      await this.repository.releaseWithdraw(announcement.id, now);
      this.logger.error(`announcement.withdrawn failed for ${announcement.id}; retrying next pass`, error instanceof Error ? error.stack : undefined);
      return;
    }
    await this.record('announcement.withdrawn', announcement.id, { reason });
  }

  // After the event: a failed audit write is logged, not retried, so the
  // event is never raised twice because of it.
  private async record(action: string, announcementId: string, details: Record<string, string>) {
    try {
      await this.audit.record({ actor: { type: 'SYSTEM' }, action, entity: { type: 'announcement', id: announcementId }, details });
    } catch (error) {
      this.logger.error(`Audit entry ${action} failed for ${announcementId}`, error instanceof Error ? error.stack : undefined);
    }
  }
}
