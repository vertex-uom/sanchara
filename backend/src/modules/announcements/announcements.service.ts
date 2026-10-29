import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException, type FieldErrors } from '../../common/errors/app-exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { AdminProfile } from '../auth/admins/admins.service.js';
import type { AnnouncementPublished } from './announcement.events.js';
import { AnnouncementsPublisher, publishedEvent } from './announcements.publisher.js';
import { AnnouncementsRepository, type AnnouncementInput, type AnnouncementRow } from './announcements.repository.js';
import {
  ANNOUNCEMENT_PAGE_SIZE,
  AUDIENCE_NAMES,
  AUDIENCES_BY_NAME,
  MAX_LEAD_MS,
  START_GRACE_MS,
  STATUS_NAME_LIST,
  statusOf,
  TYPE_NAMES,
  TYPES_BY_NAME,
  type AnnouncementStatusName,
} from './announcements.rules.js';
import type { AnnouncementDto } from './dto/announcement.dto.js';

const ENTITY = 'announcement';

const notFound = () => new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'That announcement does not exist.');
const invalid = (fieldErrors: FieldErrors) => new AppException(HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED', 'Some fields are invalid.', fieldErrors);
const live = () =>
  new AppException(HttpStatus.CONFLICT, 'ANNOUNCEMENT_LIVE', 'This announcement has started, so it can no longer be edited. Archive it and create a new one.');
const archived = () => new AppException(HttpStatus.CONFLICT, 'ANNOUNCEMENT_ARCHIVED', 'This announcement is archived and can no longer be edited.');

// What the admin API returns for an announcement.
export function toAnnouncementView(row: AnnouncementRow, now: Date) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: TYPE_NAMES[row.type],
    audience: AUDIENCE_NAMES[row.audience],
    dismissible: row.dismissible,
    status: statusOf(row, now),
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    archivedAt: row.archivedAt?.toISOString() ?? null,
    archivedBy: row.archivedBy,
    // When the system notification went out / was taken down.
    publishedAt: row.publishedAt?.toISOString() ?? null,
    withdrawnAt: row.withdrawnAt?.toISOString() ?? null,
  };
}

// Platform announcements to company staff, delivered as system notifications
// by the notifications module (via the events in announcement.events.ts).
// A scheduled announcement can be edited or cancelled; once it has started it
// can only be archived.
@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: AnnouncementsRepository,
    private readonly publisher: AnnouncementsPublisher,
    private readonly audit: AuditService,
  ) {}

  async list(status: AnnouncementStatusName, page: number, now = new Date()) {
    const total = await this.repository.count(status, now);
    const safePage = Math.min(Math.max(page, 1), Math.max(Math.ceil(total / ANNOUNCEMENT_PAGE_SIZE), 1));
    const rows = await this.repository.list(status, now, (safePage - 1) * ANNOUNCEMENT_PAGE_SIZE, ANNOUNCEMENT_PAGE_SIZE);
    return { items: rows.map((row) => toAnnouncementView(row, now)), total, page: safePage, pageSize: ANNOUNCEMENT_PAGE_SIZE };
  }

  async summary(now = new Date()) {
    const counts = await Promise.all(STATUS_NAME_LIST.map((status) => this.repository.count(status, now)));
    return Object.fromEntries(STATUS_NAME_LIST.map((status, i) => [status, counts[i]])) as Record<AnnouncementStatusName, number>;
  }

  async get(id: string, now = new Date()) {
    const row = await this.repository.findById(id);
    if (!row) throw notFound();
    return toAnnouncementView(row, now);
  }

  async create(admin: AdminProfile, input: AnnouncementDto, now = new Date()) {
    const data = this.toInput(input, now);
    const { id } = await this.prisma.$transaction(async (tx) => {
      const created = await this.repository.create({ ...data, createdById: admin.id }, tx);
      await this.audit.record({ actor: { type: 'PLATFORM_ADMIN', id: admin.id }, action: 'announcement.created', entity: { type: ENTITY, id: created.id }, details: this.details(data) }, tx);
      return created;
    });
    // Published "now": goes out at once rather than on the next pass.
    if (data.startsAt <= now) await this.publisher.run();
    return this.get(id);
  }

  // Replaces a scheduled announcement's fields.
  async update(admin: AdminProfile, id: string, input: AnnouncementDto, now = new Date()) {
    const current = await this.repository.findById(id);
    if (!current) throw notFound();
    this.assertEditable(current, now);
    const data = this.toInput(input, now);
    await this.prisma.$transaction(async (tx) => {
      // The publisher may have taken it in the meantime.
      if (!(await this.repository.updateScheduled(id, data, now, tx))) throw live();
      await this.audit.record({ actor: { type: 'PLATFORM_ADMIN', id: admin.id }, action: 'announcement.updated', entity: { type: ENTITY, id }, details: this.details(data) }, tx);
    });
    if (data.startsAt <= now) await this.publisher.run();
    return this.get(id);
  }

  // Cancels a scheduled announcement, or takes a live one down at once.
  // Archiving one that is already archived or ended changes nothing.
  async archive(admin: AdminProfile, id: string, now = new Date()) {
    const current = await this.repository.findById(id);
    if (!current) throw notFound();
    if (statusOf(current, now) !== 'archived') {
      const wasScheduled = statusOf(current, now) === 'scheduled';
      await this.prisma.$transaction(async (tx) => {
        if (!(await this.repository.archive(id, admin.id, now, tx))) return;
        await this.audit.record(
          { actor: { type: 'PLATFORM_ADMIN', id: admin.id }, action: wasScheduled ? 'announcement.cancelled' : 'announcement.archived', entity: { type: ENTITY, id }, details: { title: current.title } },
          tx,
        );
      });
      await this.publisher.run();
    }
    return this.get(id);
  }

  // Everything staff should currently see, as published events. For the
  // notifications module to rebuild its state, e.g. after a restart.
  async liveAnnouncements(): Promise<AnnouncementPublished[]> {
    return (await this.repository.live()).map((row) => publishedEvent(row, row.publishedAt!));
  }

  private assertEditable(row: AnnouncementRow, now: Date) {
    if (statusOf(row, now) === 'archived') throw archived();
    if (row.publishedAt || row.startsAt <= now) throw live();
  }

  // Start defaults to now; a start a few minutes in the past (clock skew, a
  // slow form) also counts as now.
  private toInput(input: AnnouncementDto, now: Date): AnnouncementInput {
    const requested = input.startsAt ? new Date(input.startsAt) : now;
    const startsAt = requested < now ? now : requested;
    const endsAt = input.endsAt ? new Date(input.endsAt) : null;
    const errors: FieldErrors = {};
    if (requested.getTime() < now.getTime() - START_GRACE_MS) errors['startsAt'] = ['The start is in the past. Leave it empty to publish now.'];
    else if (startsAt.getTime() > now.getTime() + MAX_LEAD_MS) errors['startsAt'] = ['Schedule it at most a year ahead.'];
    if (endsAt && endsAt <= startsAt) errors['endsAt'] = ['The end must be after the start.'];
    if (Object.keys(errors).length > 0) throw invalid(errors);
    return {
      title: input.title,
      message: input.message,
      type: TYPES_BY_NAME[input.type],
      audience: AUDIENCES_BY_NAME[input.audience],
      dismissible: input.dismissible,
      startsAt,
      endsAt,
    };
  }

  private details(data: AnnouncementInput) {
    return {
      title: data.title,
      type: TYPE_NAMES[data.type],
      audience: AUDIENCE_NAMES[data.audience],
      startsAt: data.startsAt.toISOString(),
      endsAt: data.endsAt?.toISOString() ?? null,
    };
  }
}
