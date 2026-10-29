import { Injectable } from '@nestjs/common';
import type { Db } from '../../common/prisma/db.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { Prisma, PropertyStatus } from '../../generated/prisma/client.js';

const WITH_LOOKUPS = { propertyType: true, district: true } as const;

export type PropertyWithLookups = Prisma.PropertyGetPayload<{ include: typeof WITH_LOOKUPS }>;

// Settings columns a save may change (never company, slug or version).
export type PropertySettingsChanges = Omit<
  Prisma.PropertyUncheckedUpdateManyInput,
  'id' | 'companyId' | 'slug' | 'status' | 'settingsVersion' | 'createdAt' | 'updatedAt'
>;

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

  findDistrictByName(name: string) {
    return this.prisma.district.findUnique({ where: { name } });
  }

  // Oldest first, so the first property stays first in the switcher.
  listForCompany(companyId: string) {
    return this.prisma.property.findMany({ where: { companyId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  }

  // Null when the property doesn't exist or belongs to another company.
  findForCompany(id: string, companyId: string, db: Db = this.prisma): Promise<PropertyWithLookups | null> {
    return db.property.findFirst({ where: { id, companyId }, include: WITH_LOOKUPS });
  }

  // Applies a settings save only if nobody saved since `version`; false otherwise.
  async updateSettings(id: string, companyId: string, version: number, changes: PropertySettingsChanges, db: Db = this.prisma) {
    const { count } = await db.property.updateMany({
      where: { id, companyId, settingsVersion: version },
      data: { ...changes, settingsVersion: { increment: 1 } },
    });
    return count === 1;
  }

  async setStatus(id: string, companyId: string, status: PropertyStatus, db: Db = this.prisma) {
    const { count } = await db.property.updateMany({ where: { id, companyId }, data: { status } });
    return count === 1;
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
