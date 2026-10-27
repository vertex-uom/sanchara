import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

// Current = not replaced or cancelled (one per company, enforced by an index).
const CURRENT = { endedAt: null } as const;

// A company is in a province when one of its properties is.
const companyIn = (provinceId?: number) => (provinceId ? { properties: { some: { district: { provinceId } } } } : {});

// Read queries for the Platform Overview cards: counts only, grouped so each
// card is one query on an indexed column. `provinceId` narrows every count to
// companies with a property in that province (properties: those in it).
@Injectable()
export class OverviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  companiesByStatus(provinceId?: number) {
    return this.prisma.company.groupBy({ by: ['status'], where: companyIn(provinceId), _count: { _all: true } });
  }

  propertiesByType(provinceId?: number) {
    return this.prisma.property.groupBy({ by: ['propertyTypeId'], where: provinceId ? { district: { provinceId } } : {}, _count: { _all: true } });
  }

  propertyTypes() {
    return this.prisma.propertyType.findMany({ select: { id: true, code: true, name: true, sortOrder: true } });
  }

  // Paying: an ACTIVE current subscription of a company not suspended for
  // non-payment. Grouped by plan, priced by the caller.
  payingByPlan(provinceId?: number) {
    return this.prisma.subscription.groupBy({
      by: ['planId'],
      where: { ...CURRENT, status: 'ACTIVE', company: { status: { not: 'SUSPENDED_NON_PAYMENT' }, ...companyIn(provinceId) } },
      _count: { _all: true },
    });
  }

  countUnpaid(provinceId?: number) {
    return this.prisma.subscription.count({
      where: { ...CURRENT, status: { not: 'CANCELLED' }, company: { status: 'SUSPENDED_NON_PAYMENT', ...companyIn(provinceId) } },
    });
  }

  planPrices() {
    return this.prisma.plan.findMany({ select: { id: true, monthlyPriceMinor: true, currency: true } });
  }

  staffByRole(provinceId?: number) {
    return this.prisma.staff.groupBy({ by: ['role'], where: provinceId ? { company: companyIn(provinceId) } : {}, _count: { _all: true } });
  }

  findProvince(id: number) {
    return this.prisma.province.findUnique({ where: { id } });
  }

  // Every province with how many companies have a property in it. A company
  // with properties in two provinces counts in both.
  provincesWithCompanyCounts() {
    return this.prisma.$queryRaw<{ id: number; name: string; companies: number }[]>`
      SELECT pr.id, pr.name, COUNT(DISTINCT p.company_id)::int AS companies
      FROM provinces pr
      LEFT JOIN districts d ON d.province_id = pr.id
      LEFT JOIN properties p ON p.district_id = d.id
      GROUP BY pr.id, pr.name
      ORDER BY pr.name`;
  }
}
