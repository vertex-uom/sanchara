import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app-exception.js';
import { isUniqueViolation } from '../../common/prisma/db.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { fromApiName, toApiName } from '../../common/validation/api-names.js';
import type { AuditEntry, WebsiteAssistanceStatus } from '../../generated/prisma/client.js';
import { AuditService, type AuditActor } from '../audit/audit.service.js';
import type { AdminProfile } from '../auth/admins/admins.service.js';
import { ROLE_NAMES, type SignedInStaff, type StaffRoleName } from '../staff/staff.service.js';
import type { AssistanceRequestDto } from './dto/website-assistance.dto.js';
import {
  dueAt,
  newReference,
  OPEN_STATUSES,
  type AssistanceContactName,
  type AssistanceStatusName,
  type AssistanceStyleName,
  type AssistanceTimingName,
} from './website-assistance.policy.js';
import { WebsiteAssistanceRepository, type AssistanceDetail, type AssistanceRow } from './website-assistance.repository.js';

// What the company sees of its request.
export type AssistanceRequestView = {
  id: string;
  reference: string;
  status: AssistanceStatusName;
  contactName: string;
  phone: string;
  email: string;
  contactMethod: AssistanceContactName;
  goals: string[];
  style: AssistanceStyleName;
  timing: AssistanceTimingName;
  notes: string;
  propertyName: string | null;
  requestedAt: string;
  updatedAt: string;
};

export type TeamMember = { id: string; name: string };

// A row of the platform team's queue.
export type WebsiteRequestRowView = {
  id: string;
  reference: string;
  companyId: string;
  companyName: string;
  location: string;
  requestedAt: string;
  dueAt: string | null;
  status: AssistanceStatusName;
  style: AssistanceStyleName;
  timing: AssistanceTimingName;
  assignee: TeamMember | null;
};

export type TimelineEvent = {
  id: string;
  at: string;
  kind: 'requested' | 'updated' | 'cancelled' | 'assigned' | 'status-changed';
  actor: string;
  // status-changed: the new status.
  status: AssistanceStatusName | null;
  note: string | null;
};

export type WebsiteRequestDetailView = WebsiteRequestRowView & {
  plan: string | null;
  contact: { name: string; phone: string; email: string; method: AssistanceContactName };
  requestedBy: { name: string; role: StaffRoleName } | null;
  property: { id: string; name: string } | null;
  goals: string[];
  notes: string;
  closedAt: string | null;
  // Newest first.
  timeline: TimelineEvent[];
  internalNotes: { id: string; at: string; author: string; text: string }[];
  team: TeamMember[];
};

export type WebsiteRequestList = {
  items: WebsiteRequestRowView[];
  total: number;
  counts: Record<'requested' | 'in-progress' | 'review', number>;
  assignees: TeamMember[];
};

type ListFilters = { status?: AssistanceStatusName; assignee?: string; q?: string };

const ENTITY = 'website_request';
const ACTIONS = {
  requested: 'website_request.requested',
  updated: 'website_request.updated',
  cancelled: 'website_request.cancelled',
  assigned: 'website_request.assigned',
  statusChanged: 'website_request.status_changed',
  noteAdded: 'website_request.note_added',
} as const;

const TIMELINE_KINDS: Partial<Record<string, TimelineEvent['kind']>> = {
  [ACTIONS.requested]: 'requested',
  [ACTIONS.updated]: 'updated',
  [ACTIONS.cancelled]: 'cancelled',
  [ACTIONS.assigned]: 'assigned',
  [ACTIONS.statusChanged]: 'status-changed',
};

// Form fields by name, for "Changed goals, timing" on the timeline.
const FIELD_WORDS: Record<string, string> = {
  contactName: 'name',
  phone: 'phone',
  email: 'email',
  contactMethod: 'contact method',
  goals: 'goals',
  style: 'style',
  timing: 'timing',
  notes: 'notes',
};

const MAX_REFERENCE_TRIES = 5;

const requestOpen = () =>
  new AppException(HttpStatus.CONFLICT, 'REQUEST_OPEN', 'You already have an open request with WEMIXT. Change that request instead.');
const noOpenRequest = () => new AppException(HttpStatus.NOT_FOUND, 'NO_OPEN_REQUEST', 'There is no open request to change.');
const notFound = () => new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'That website request no longer exists.');
const requestClosed = () => new AppException(HttpStatus.CONFLICT, 'REQUEST_CLOSED', 'This request is already published or cancelled.');

const isOpen = (status: WebsiteAssistanceStatus) => OPEN_STATUSES.includes(status);

function toRequestView(request: AssistanceRow): AssistanceRequestView {
  return {
    id: request.id,
    reference: request.reference,
    status: toApiName(request.status),
    contactName: request.contactName,
    phone: request.phone,
    email: request.email,
    contactMethod: toApiName(request.contactMethod),
    goals: request.goals,
    style: toApiName(request.style),
    timing: toApiName(request.timing),
    notes: request.notes,
    propertyName: request.property?.name ?? null,
    requestedAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}

function toRowView(request: AssistanceRow): WebsiteRequestRowView {
  return {
    id: request.id,
    reference: request.reference,
    companyId: request.company.id,
    companyName: request.company.name,
    location: request.property?.city ?? request.company.town ?? '',
    requestedAt: request.createdAt.toISOString(),
    dueAt: request.dueAt?.toISOString() ?? null,
    status: toApiName(request.status),
    style: toApiName(request.style),
    timing: toApiName(request.timing),
    assignee: request.assignee ? { id: request.assignee.id, name: request.assignee.fullName } : null,
  };
}

// The columns a form save writes.
function formData(input: AssistanceRequestDto) {
  return {
    contactName: input.contactName,
    phone: input.phone,
    email: input.email,
    contactMethod: fromApiName<AssistanceRow['contactMethod']>(input.contactMethod),
    goals: input.goals,
    style: fromApiName<AssistanceRow['style']>(input.style),
    timing: fromApiName<AssistanceRow['timing']>(input.timing),
    notes: input.notes,
  };
}

// Requests for WEMIXT to build a company's website: sent and changed from the
// Back Office (Owner or Manager, own company only), worked on by the platform
// team. Every change is audited; the audit entries are the request's timeline.
@Injectable()
export class WebsiteAssistanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: WebsiteAssistanceRepository,
    private readonly audit: AuditService,
  ) {}

  // --- Back Office ---------------------------------------------------------

  async current(actor: SignedInStaff): Promise<AssistanceRequestView | null> {
    const request = await this.repository.findOpenForCompany(actor.company.id);
    return request ? toRequestView(request) : null;
  }

  // One open request per company; a clash with a new reference is retried.
  async send(actor: SignedInStaff, input: AssistanceRequestDto): Promise<AssistanceRequestView> {
    if (await this.repository.findOpenForCompany(actor.company.id)) throw requestOpen();
    const propertyId = await this.repository.firstPropertyId(actor.company.id);
    const data = formData(input);

    for (let attempt = 1; ; attempt++) {
      try {
        const request = await this.prisma.$transaction(async (tx) => {
          const now = new Date();
          const created = await this.repository.create(
            { ...data, reference: newReference(), companyId: actor.company.id, propertyId, requestedById: actor.id, dueAt: dueAt(data.timing, now), createdAt: now },
            tx,
          );
          await this.record(this.staffActor(actor), ACTIONS.requested, created.id, actor.company.id, { reference: created.reference }, tx);
          return created;
        });
        return toRequestView(request);
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        if (await this.repository.findOpenForCompany(actor.company.id)) throw requestOpen();
        if (attempt >= MAX_REFERENCE_TRIES) throw error;
      }
    }
  }

  async update(actor: SignedInStaff, input: AssistanceRequestDto): Promise<AssistanceRequestView> {
    const current = await this.repository.findOpenForCompany(actor.company.id);
    if (!current) throw noOpenRequest();
    const data = formData(input);
    const fields = Object.entries(data)
      .filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(current[key as keyof typeof data]))
      .map(([key]) => key);
    if (fields.length === 0) return toRequestView(current);

    const updated = await this.prisma.$transaction(async (tx) => {
      const changes = { ...data, dueAt: dueAt(data.timing, current.createdAt) };
      if (!(await this.repository.updateIfOpen(current.id, changes, tx))) throw noOpenRequest();
      await this.record(this.staffActor(actor), ACTIONS.updated, current.id, actor.company.id, { fields }, tx);
      return this.repository.findRow(current.id, tx);
    });
    return toRequestView(updated);
  }

  async cancel(actor: SignedInStaff): Promise<void> {
    const current = await this.repository.findOpenForCompany(actor.company.id);
    if (!current) throw noOpenRequest();
    await this.prisma.$transaction(async (tx) => {
      if (!(await this.repository.updateIfOpen(current.id, { status: 'CANCELLED', closedAt: new Date() }, tx))) throw noOpenRequest();
      await this.record(this.staffActor(actor), ACTIONS.cancelled, current.id, actor.company.id, {}, tx);
    });
  }

  // --- Platform team -------------------------------------------------------

  async list({ status, assignee, q }: ListFilters): Promise<WebsiteRequestList> {
    const [rows, counts, assignees] = await Promise.all([
      this.repository.listOpen({
        status: status ? fromApiName<WebsiteAssistanceStatus>(status) : undefined,
        assigneeId: assignee === undefined ? undefined : assignee === 'unassigned' ? null : assignee,
        q,
      }),
      this.repository.openCounts(),
      this.repository.openAssignees(),
    ]);
    return {
      items: rows.map(toRowView),
      total: counts.REQUESTED + counts.IN_PROGRESS + counts.REVIEW,
      counts: { requested: counts.REQUESTED, 'in-progress': counts.IN_PROGRESS, review: counts.REVIEW },
      assignees: assignees.map(({ id, fullName }) => ({ id, name: fullName })),
    };
  }

  async detail(id: string): Promise<WebsiteRequestDetailView> {
    const request = await this.repository.findDetail(id);
    if (!request) throw notFound();
    const [plan, entries, team] = await Promise.all([
      this.repository.currentPlanName(request.companyId),
      this.audit.listForEntity(ENTITY, id),
      this.repository.activeTeam(),
    ]);
    return {
      ...toRowView(request),
      plan,
      contact: { name: request.contactName, phone: request.phone, email: request.email, method: toApiName(request.contactMethod) },
      requestedBy: request.requestedBy ? { name: request.requestedBy.fullName, role: ROLE_NAMES[request.requestedBy.role] } : null,
      property: request.property ? { id: request.property.id, name: request.property.name } : null,
      goals: request.goals,
      notes: request.notes,
      closedAt: request.closedAt?.toISOString() ?? null,
      timeline: await this.timeline(entries),
      internalNotes: request.internalNotes.map((note) => ({
        id: note.id,
        at: note.createdAt.toISOString(),
        author: note.author?.fullName ?? 'Former team member',
        text: note.text,
      })),
      team: team.map(({ id: memberId, fullName }) => ({ id: memberId, name: fullName })),
    };
  }

  async assign(admin: AdminProfile, id: string, adminId: string | null): Promise<WebsiteRequestDetailView> {
    const request = await this.openRequest(id);
    const assignee = adminId ? await this.repository.findActiveAdmin(adminId) : null;
    if (adminId && !assignee) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED', 'Some fields are invalid.', { adminId: ['Choose an active team member.'] });
    }
    if (request.assigneeId === (assignee?.id ?? null)) return this.detail(id);

    await this.prisma.$transaction(async (tx) => {
      if (!(await this.repository.updateIfOpen(id, { assigneeId: assignee?.id ?? null }, tx))) throw requestClosed();
      await this.record(this.adminActor(admin), ACTIONS.assigned, id, request.companyId, { assigneeId: assignee?.id ?? null, assigneeName: assignee?.fullName ?? null }, tx);
    });
    return this.detail(id);
  }

  async setStatus(admin: AdminProfile, id: string, status: AssistanceStatusName, note: string | undefined): Promise<WebsiteRequestDetailView> {
    const request = await this.openRequest(id);
    const next = fromApiName<WebsiteAssistanceStatus>(status);
    if (request.status === next) return this.detail(id);

    await this.prisma.$transaction(async (tx) => {
      const closedAt = next === 'PUBLISHED' ? new Date() : null;
      if (!(await this.repository.updateIfOpen(id, { status: next, closedAt }, tx))) throw requestClosed();
      await this.record(this.adminActor(admin), ACTIONS.statusChanged, id, request.companyId, { from: toApiName(request.status), to: status, ...(note ? { note } : {}) }, tx);
    });
    return this.detail(id);
  }

  // Notes may still be added after the request is closed.
  async addNote(admin: AdminProfile, id: string, text: string): Promise<WebsiteRequestDetailView> {
    const request = await this.repository.findDetail(id);
    if (!request) throw notFound();
    await this.prisma.$transaction(async (tx) => {
      await this.repository.addNote(id, admin.id, text, tx);
      await this.record(this.adminActor(admin), ACTIONS.noteAdded, id, request.companyId, {}, tx);
    });
    return this.detail(id);
  }

  private async openRequest(id: string): Promise<AssistanceDetail> {
    const request = await this.repository.findDetail(id);
    if (!request) throw notFound();
    if (!isOpen(request.status)) throw requestClosed();
    return request;
  }

  private staffActor(actor: SignedInStaff): AuditActor {
    return { type: 'STAFF', id: actor.id };
  }

  private adminActor(admin: AdminProfile): AuditActor {
    return { type: 'PLATFORM_ADMIN', id: admin.id };
  }

  private record(actor: AuditActor, action: string, id: string, companyId: string, details: Record<string, string | string[] | null>, tx: Parameters<AuditService['record']>[1]) {
    return this.audit.record({ actor, action, entity: { type: ENTITY, id }, companyId, details }, tx);
  }

  private async timeline(entries: AuditEntry[]): Promise<TimelineEvent[]> {
    const shown = entries.filter((entry) => TIMELINE_KINDS[entry.action]);
    const ids = (type: AuditEntry['actorType']) => shown.filter((e) => e.actorType === type && e.actorId).map((e) => e.actorId!);
    const names = await this.repository.actorNames(ids('STAFF'), ids('PLATFORM_ADMIN'));

    return shown.map((entry) => {
      const kind = TIMELINE_KINDS[entry.action]!;
      const details = (entry.details ?? {}) as Record<string, unknown>;
      return {
        id: entry.id,
        at: entry.occurredAt.toISOString(),
        kind,
        actor: (entry.actorId && names.get(entry.actorId)) || (entry.actorType === 'SYSTEM' ? 'System' : 'Former user'),
        status: kind === 'status-changed' ? (details.to as AssistanceStatusName) : null,
        note: this.timelineNote(kind, details),
      };
    });
  }

  private timelineNote(kind: TimelineEvent['kind'], details: Record<string, unknown>): string | null {
    if (kind === 'requested') return typeof details.reference === 'string' ? details.reference : null;
    if (kind === 'updated' && Array.isArray(details.fields)) return `Changed ${details.fields.map((field: string) => FIELD_WORDS[field] ?? field).join(', ')}`;
    if (kind === 'assigned') return typeof details.assigneeName === 'string' ? `Assigned to ${details.assigneeName}` : 'Unassigned';
    if (kind === 'status-changed') return typeof details.note === 'string' ? details.note : null;
    return null;
  }
}
