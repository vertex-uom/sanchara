import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { ADMIN_ACTIONS, AdminsService } from '../auth/admins/admins.service.js';

export type AdminChangeKind = keyof typeof ADMIN_ACTIONS;

const KIND_BY_ACTION = new Map(Object.entries(ADMIN_ACTIONS).map(([kind, action]) => [action as string, kind as AdminChangeKind]));

// Admin Users page: account-lifecycle history, read from the audit log.
@Injectable()
export class AdminUsersService {
  constructor(
    private readonly admins: AdminsService,
    private readonly audit: AuditService,
  ) {}

  // Newest first. `actor` is null for the system (e.g. the command line).
  async changes(limit: number) {
    const entries = await this.audit.listByActions(Object.values(ADMIN_ACTIONS), limit);
    const ids = new Set(entries.flatMap((entry) => [entry.entityId, ...(entry.actorType === 'PLATFORM_ADMIN' && entry.actorId ? [entry.actorId] : [])]));
    const names = await this.admins.namesByIds([...ids]);
    return entries.flatMap((entry) => {
      const kind = KIND_BY_ACTION.get(entry.action);
      if (!kind) return [];
      const actor = entry.actorType === 'PLATFORM_ADMIN' && entry.actorId ? { id: entry.actorId, fullName: names.get(entry.actorId) ?? 'Removed admin' } : null;
      return [
        {
          id: entry.id,
          kind,
          admin: { id: entry.entityId, fullName: names.get(entry.entityId) ?? 'Removed admin' },
          actor,
          occurredAt: entry.occurredAt.toISOString(),
        },
      ];
    });
  }
}
