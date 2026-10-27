import { Injectable } from '@nestjs/common';
import type { Db } from '../../common/prisma/db.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { StaffRole } from '../../generated/prisma/client.js';

type NewStaff = { companyId: string; fullName: string; email: string; role: StaffRole; phone?: string | null };
type GoogleIdentity = { subject: string; email: string };

// Prisma access for staff accounts and their credentials. Only StaffService uses it.
@Injectable()
export class StaffRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.staff.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.staff.findUnique({ where: { email } });
  }

  // At most one: a partial unique index allows one Owner per company.
  findOwner(companyId: string) {
    return this.prisma.staff.findFirst({ where: { companyId, role: 'OWNER' } });
  }

  // One query: the staff account plus its password hash, if any.
  findByEmailWithPassword(email: string) {
    return this.prisma.staff.findUnique({ where: { email }, include: { passwordCredential: { select: { hash: true } } } });
  }

  async findByGoogleSubject(subject: string) {
    const identity = await this.prisma.staffExternalIdentity.findUnique({
      where: { provider_subject: { provider: 'GOOGLE', subject } },
      select: { staff: true },
    });
    return identity?.staff ?? null;
  }

  createInvited(staff: NewStaff, db: Db = this.prisma) {
    return db.staff.create({ data: { ...staff, status: 'INVITED' } });
  }

  // INVITED → ACTIVE with a password, in one transaction. Null if the account
  // is no longer invited (accepted twice, or deactivated meanwhile).
  activate(staffId: string, hash: string) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.staff.updateMany({
        where: { id: staffId, status: 'INVITED' },
        data: { status: 'ACTIVE', activatedAt: new Date() },
      });
      if (count === 0) return null;
      await tx.staffPasswordCredential.upsert({
        where: { staffId },
        create: { staffId, hash },
        update: { hash, changedAt: new Date() },
      });
      return tx.staff.findUnique({ where: { id: staffId } });
    });
  }

  linkGoogle(staffId: string, identity: GoogleIdentity) {
    return this.prisma.staffExternalIdentity.create({
      data: { staffId, provider: 'GOOGLE', subject: identity.subject, email: identity.email },
    });
  }

  async setPasswordHash(staffId: string, hash: string) {
    await this.prisma.staffPasswordCredential.upsert({
      where: { staffId },
      create: { staffId, hash },
      update: { hash, changedAt: new Date() },
    });
  }
}
