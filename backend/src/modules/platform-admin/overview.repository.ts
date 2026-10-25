import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

// Read queries for the Platform Overview cards: counts only, grouped so each
// card is one query on an indexed column.
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

  staffByRole() {
    return this.prisma.staff.groupBy({ by: ['role'], _count: { _all: true } });
  }
}
