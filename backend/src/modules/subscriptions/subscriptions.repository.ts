import { Injectable } from '@nestjs/common';
import type { Db } from '../../common/prisma/db.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

// Prisma access for plans and subscriptions. Only SubscriptionsService uses it.
@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  activePlans() {
    return this.prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
  }

  findPlanByCode(code: string) {
    return this.prisma.plan.findUnique({ where: { code } });
  }

  create(subscription: { companyId: string; planId: number }, db: Db = this.prisma) {
    return db.subscription.create({ data: subscription, include: { plan: true } });
  }
}
