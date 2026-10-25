import { Injectable } from '@nestjs/common';
import type { CompanyStatus, StaffRole } from '../../generated/prisma/client.js';
import { OverviewRepository } from './overview.repository.js';

const COMPANY_STATUS_KEYS = {
  ACTIVE: 'active',
  PENDING_SETUP: 'pendingSetup',
  SUSPENDED_NON_PAYMENT: 'suspendedNonPayment',
  SUSPENDED_BY_ADMIN: 'suspendedByAdmin',
} as const satisfies Record<CompanyStatus, string>;

const STAFF_ROLE_KEYS = { OWNER: 'owner', MANAGER: 'manager', FRONT_DESK: 'frontDesk' } as const satisfies Record<StaffRole, string>;

type Counts<K extends string> = Record<K, number>;

const zeros = <K extends string>(keys: readonly K[]) => Object.fromEntries(keys.map((key) => [key, 0])) as Counts<K>;

// Platform Overview: live counts of companies, properties and staff accounts,
// and subscriptions. Staff counts every account (invited, active and inactive).
// MRR is the monthly price of every paying subscription, per currency.
@Injectable()
export class OverviewService {
  constructor(private readonly repository: OverviewRepository) {}

  async summary() {
    const [companyGroups, propertyGroups, propertyTypes, staffGroups, payingGroups, unpaid, plans] = await Promise.all([
      this.repository.companiesByStatus(),
      this.repository.propertiesByType(),
      this.repository.propertyTypes(),
      this.repository.staffByRole(),
      this.repository.payingByPlan(),
      this.repository.countUnpaid(),
      this.repository.planPrices(),
    ]);

    const byStatus = zeros(Object.values(COMPANY_STATUS_KEYS));
    for (const group of companyGroups) byStatus[COMPANY_STATUS_KEYS[group.status]] += group._count._all;

    const byRole = zeros(Object.values(STAFF_ROLE_KEYS));
    for (const group of staffGroups) byRole[STAFF_ROLE_KEYS[group.role]] += group._count._all;

    // Types that have properties, largest first (ties in the catalogue's order).
    const propertyCounts = new Map(propertyGroups.map((group) => [group.propertyTypeId, group._count._all]));
    const byType = propertyTypes
      .filter((type) => propertyCounts.has(type.id))
      .map((type) => ({ code: type.code, name: type.name, count: propertyCounts.get(type.id) ?? 0, sortOrder: type.sortOrder }))
      .sort((a, b) => b.count - a.count || a.sortOrder - b.sortOrder)
      .map(({ code, name, count }) => ({ code, name, count }));

    const priceOf = new Map(plans.map((plan) => [plan.id, plan]));
    const mrr = new Map<string, number>();
    for (const group of payingGroups) {
      const plan = priceOf.get(group.planId);
      if (plan) mrr.set(plan.currency, (mrr.get(plan.currency) ?? 0) + plan.monthlyPriceMinor * group._count._all);
    }
    const paying = payingGroups.reduce((total, group) => total + group._count._all, 0);

    const sum = (counts: Record<string, number>) => Object.values(counts).reduce((total, count) => total + count, 0);
    return {
      companies: { total: sum(byStatus), byStatus },
      properties: { total: byType.reduce((total, type) => total + type.count, 0), byType },
      staffUsers: { total: sum(byRole), byRole },
      subscriptions: {
        // Largest first; [] when nobody pays yet.
        mrr: [...mrr].map(([currency, amountMinor]) => ({ currency, amountMinor })).sort((a, b) => b.amountMinor - a.amountMinor),
        paying,
        unpaid,
      },
    };
  }
}
