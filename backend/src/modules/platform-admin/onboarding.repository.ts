import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

// Read queries for the Onboarding tab. Writes go through the owning modules.
@Injectable()
export class OnboardingRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Owners who haven't accepted their invite, i.e. one per company still in
  // PENDING_SETUP.
  awaitingOwnerIds() {
    return this.prisma.staff.findMany({
      where: { role: 'OWNER', status: 'INVITED', company: { status: 'PENDING_SETUP' } },
      select: { id: true },
    });
  }

  // Those companies, newest first, with what the list shows.
  awaitingCompanies(skip: number, take: number) {
    return this.prisma.company.findMany({
      where: { status: 'PENDING_SETUP', staff: { some: { role: 'OWNER', status: 'INVITED' } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
      select: {
        id: true,
        name: true,
        subdomain: true,
        town: true,
        createdAt: true,
        createdBy: { select: { fullName: true } },
        staff: { where: { role: 'OWNER' }, select: { id: true, fullName: true, email: true } },
        subscriptions: { where: { endedAt: null }, select: { plan: { select: { code: true, name: true } } } },
        properties: { orderBy: { createdAt: 'asc' }, take: 1, select: { district: { select: { name: true } } } },
      },
    });
  }

  countCreated(from: Date, to: Date) {
    return this.prisma.company.count({ where: { createdAt: { gte: from, lt: to } } });
  }

  // Companies whose Owner accepted the invite in the period.
  countSetupCompleted(from: Date, to: Date) {
    return this.prisma.companyStatusChange.count({
      where: { fromStatus: 'PENDING_SETUP', toStatus: 'ACTIVE', changedAt: { gte: from, lt: to } },
    });
  }
}
