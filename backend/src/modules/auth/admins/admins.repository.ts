import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

// Prisma access for platform admins and their credentials. Only AdminsService uses it.
@Injectable()
export class AdminsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.platformAdmin.findUnique({ where: { id } });
  }

  findNames(ids: string[]) {
    return this.prisma.platformAdmin.findMany({ where: { id: { in: ids } }, select: { id: true, fullName: true } });
  }

  findByEmail(email: string) {
    return this.prisma.platformAdmin.findUnique({ where: { email } });
  }

  // One query: the admin plus their password hash, if any.
  findByEmailWithPassword(email: string) {
    return this.prisma.platformAdmin.findUnique({ where: { email }, include: { passwordCredential: { select: { hash: true } } } });
  }

  // Active before disabled, then most recently signed in; never signed in last.
  list(skip: number, take: number) {
    return this.prisma.platformAdmin.findMany({
      orderBy: [{ status: 'asc' }, { lastSignInAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take,
    });
  }

  countByStatus() {
    return this.prisma.platformAdmin.groupBy({ by: ['status'], _count: { _all: true } });
  }

  createWithPassword(admin: { fullName: string; email: string }, hash: string) {
    return this.prisma.platformAdmin.create({ data: { ...admin, passwordCredential: { create: { hash } } } });
  }

  async recordSignIn(adminId: string) {
    await this.prisma.platformAdmin.update({ where: { id: adminId }, data: { lastSignInAt: new Date() } });
  }

  async setPasswordHash(adminId: string, hash: string) {
    await this.prisma.adminPasswordCredential.update({ where: { adminId }, data: { hash, changedAt: new Date() } });
  }
}
