import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

// Read queries for the Platform Overview cards: counts only, grouped so each
// card is one query on an indexed column.

// Current = not replaced or cancelled (one per company, enforced by an index).
const CURRENT = { endedAt: null } as const;
@Injectable()
export class OverviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  companiesByStatus() {
    return this.prisma.company.groupBy({ by: ['status'], _count: { _all: true } });
  }

  propertiesByType() {
    return this.prisma.property.groupBy({ by: ['propertyTypeId'], _count: { _all: true } });
  }

  propertyTypes() {
    return this.prisma.propertyType.findMany({ select: { id: true, code: true, name: true, sortOrder: true } });
  }

  // Paying: an ACTIVE current subscription of a company not suspended for
  // non-payment. Grouped by plan, priced by the caller.
  payingByPlan() {
    return this.prisma.subscription.groupBy({
      by: ['planId'],
      where: { ...CURRENT, status: 'ACTIVE', company: { status: { not: 'SUSPENDED_NON_PAYMENT' } } },
      _count: { _all: true },
    });
  }

  countUnpaid() {
    return this.prisma.subscription.count({ where: { ...CURRENT, status: { not: 'CANCELLED' }, company: { status: 'SUSPENDED_NON_PAYMENT' } } });
  }

  planPrices() {
    return this.prisma.plan.findMany({ select: { id: true, monthlyPriceMinor: true, currency: true } });
  }

  staffByRole() {
    return this.prisma.staff.groupBy({ by: ['role'], _count: { _all: true } });
  }
}
