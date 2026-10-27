import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { Db } from '../../common/prisma/db.js';
import type { AuditActorType, Prisma } from '../../generated/prisma/client.js';

export type AuditActor = { type: Exclude<AuditActorType, 'SYSTEM'>; id: string } | { type: 'SYSTEM' };

export type AuditRecord = {
  actor: AuditActor;
  // Dotted verb, e.g. "company.created".
  action: string;
  entity: { type: string; id: string };
  companyId?: string | null;
  // Non-secret details only: never passwords, tokens or links.
  details?: Prisma.InputJsonObject;
};

// The one audit log. Any module may record; pass the open transaction so the
// entry commits with the change it describes.
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditRecord, db: Db = this.prisma): Promise<void> {
    await db.auditEntry.create({
      data: {
        actorType: entry.actor.type,
        actorId: entry.actor.type === 'SYSTEM' ? null : entry.actor.id,
        companyId: entry.companyId ?? null,
        action: entry.action,
        entityType: entry.entity.type,
        entityId: entry.entity.id,
        details: entry.details,
      },
    });
  }

  // Newest first, only the given actions.
  listByActions(actions: string[], take: number) {
    return this.prisma.auditEntry.findMany({
      where: { action: { in: actions } },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take,
    });
  }
}
