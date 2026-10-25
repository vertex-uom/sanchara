import { Injectable } from '@nestjs/common';
import type { Db } from '../../common/prisma/db.js';
import { SubscriptionsRepository } from './subscriptions.repository.js';

export type PlanOption = { code: string; name: string; monthlyPrice: { amountMinor: number; currency: string } };

// Company subscriptions and the plans they use. Billing (payment, renewal,
// suspension for non-payment) is not built yet: subscriptions stay PENDING.
@Injectable()
export class SubscriptionsService {
  constructor(private readonly repository: SubscriptionsRepository) {}

  async plans(): Promise<PlanOption[]> {
    const plans = await this.repository.activePlans();
    return plans.map(({ code, name, monthlyPriceMinor, currency }) => ({
      code,
      name,
      monthlyPrice: { amountMinor: monthlyPriceMinor, currency },
    }));
  }

  // Null when the code is unknown or the plan is no longer offered.
  async findSelectablePlan(code: string) {
    const plan = await this.repository.findPlanByCode(code);
    return plan?.isActive ? plan : null;
  }

  // The company's first subscription. Pass `db` to join a caller's transaction.
  start(companyId: string, planId: number, db?: Db) {
    return this.repository.create({ companyId, planId }, db);
  }
}
