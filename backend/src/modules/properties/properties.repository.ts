import { Injectable } from '@nestjs/common';
import type { Db } from '../../common/prisma/db.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

export type NewProperty = {
  companyId: string;
  propertyTypeId: number;
  name: string;
  slug: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  districtId: number;
  postalCode: string | null;
};

// Prisma access for properties and their reference data. Only PropertiesService uses it.
@Injectable()
export class PropertiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  activePropertyTypes() {
    return this.prisma.propertyType.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
  }

  findPropertyTypeByCode(code: string) {
    return this.prisma.propertyType.findUnique({ where: { code } });
  }

  provincesWithDistricts() {
    return this.prisma.province.findMany({
      orderBy: { name: 'asc' },
      include: { districts: { orderBy: { name: 'asc' } } },
    });
  }

  findDistrict(id: number) {
    return this.prisma.district.findUnique({ where: { id } });
  }

  // Slugs already used that start with `base` (base, base-2, …).
  async slugsStartingWith(base: string, db: Db = this.prisma): Promise<Set<string>> {
    const rows = await db.property.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } });
    return new Set(rows.map((row) => row.slug));
  }

  create(property: NewProperty, db: Db = this.prisma) {
    return db.property.create({ data: property, include: { propertyType: true, district: true } });
  }
}
