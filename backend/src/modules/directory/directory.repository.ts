import { Injectable } from '@nestjs/common';
import type { Db } from '../../common/prisma/db.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import type { DirectorySort } from './dto/directory-query.dto.js';

export type DirectoryFilters = {
  // Lowercased, single-spaced town or district; null for any.
  location: string | null;
  name: string | null;
  // Property type codes; empty for any.
  typeCodes: string[];
  minRating: number | null;
};

export type DirectoryRow = {
  slug: string;
  name: string;
  town: string;
  district: string;
  typeCode: string;
  typeName: string;
  rating: number | null;
  reviewCount: number;
  featured: boolean;
  subdomain: string;
  imageUrl: string | null;
};

export type TypeCountRow = { code: string; name: string; count: number };

// Each ends in id so a page boundary never splits ties differently. They match
// the partial indexes in the directory_listing migration.
const ORDER_BY: Record<DirectorySort, Prisma.Sql> = {
  recommended: Prisma.raw('p.is_featured DESC, p.featured_rank, p.rating_avg DESC NULLS LAST, p.review_count DESC, p.id'),
  rating: Prisma.raw('p.rating_avg DESC NULLS LAST, p.review_count DESC, p.id'),
  reviews: Prisma.raw('p.review_count DESC, p.rating_avg DESC NULLS LAST, p.id'),
};

// What a guest may see: listed properties of active companies.
const VISIBLE = Prisma.sql`p.is_listed AND c.status = 'ACTIVE'`;

// The card's columns. The cover is unique per property (partial unique index).
const CARD_SELECT = Prisma.sql`
  SELECT p.slug, p.name, p.city AS town, d.name AS district,
         pt.code AS "typeCode", pt.name AS "typeName",
         round(p.rating_avg, 1)::float8 AS rating, p.review_count AS "reviewCount",
         p.is_featured AS featured, c.subdomain, pi.url AS "imageUrl"
  FROM properties p
  JOIN companies c ON c.id = p.company_id
  JOIN districts d ON d.id = p.district_id
  JOIN property_types pt ON pt.id = p.property_type_id
  LEFT JOIN property_images pi ON pi.property_id = p.id AND pi.is_cover`;

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

// Filters other than type; the type counts ignore the type filter.
function baseConditions(filters: DirectoryFilters): Prisma.Sql[] {
  const conditions = [VISIBLE];
  if (filters.location) {
    conditions.push(Prisma.sql`(lower(btrim(p.city)) = ${filters.location} OR lower(d.name) = ${filters.location})`);
  }
  if (filters.name) conditions.push(Prisma.sql`p.name ILIKE ${`%${escapeLike(filters.name)}%`}`);
  // Rounded as the card shows it, so a "4.8" property passes "4.8 and up".
  if (filters.minRating !== null) conditions.push(Prisma.sql`round(p.rating_avg, 1) >= ${filters.minRating}`);
  return conditions;
}

const where = (conditions: Prisma.Sql[]) => Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

// The central directory's read model: one query over properties, their
// company, district, type and cover image. A documented exception to "modules
// don't read each other's tables" (see docs/backend-architecture.md). Read-only.
@Injectable()
export class DirectoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Runs `work` on one consistent snapshot, so counts and the page agree.
  readSnapshot<T>(work: (db: Db) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET TRANSACTION READ ONLY`;
      return work(tx);
    }, { isolationLevel: 'RepeatableRead' });
  }

  // Matches per active property type, ignoring the type filter, in catalogue order.
  countsByType(filters: DirectoryFilters, db: Db = this.prisma) {
    return db.$queryRaw<TypeCountRow[]>`
      SELECT pt.code, pt.name, count(m.id)::int AS count
      FROM property_types pt
      LEFT JOIN (
        SELECT p.id, p.property_type_id
        FROM properties p
        JOIN companies c ON c.id = p.company_id
        JOIN districts d ON d.id = p.district_id
        ${where(baseConditions(filters))}
      ) m ON m.property_type_id = pt.id
      WHERE pt.is_active
      GROUP BY pt.id
      ORDER BY pt.sort_order`;
  }

  page(filters: DirectoryFilters, sort: DirectorySort, limit: number, offset: number, db: Db = this.prisma) {
    const conditions = baseConditions(filters);
    if (filters.typeCodes.length) conditions.push(Prisma.sql`pt.code = ANY(${filters.typeCodes}::text[])`);
    return db.$queryRaw<DirectoryRow[]>`
      ${CARD_SELECT}
      ${where(conditions)}
      ORDER BY ${ORDER_BY[sort]}
      LIMIT ${limit} OFFSET ${offset}`;
  }

  featured(limit: number) {
    return this.prisma.$queryRaw<DirectoryRow[]>`
      ${CARD_SELECT}
      ${where([VISIBLE, Prisma.sql`p.is_featured`])}
      ORDER BY p.featured_rank, p.id
      LIMIT ${limit}`;
  }
}
