import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app-exception.js';
import { DomainsService } from '../domains/domains.service.js';
import { PropertiesService } from '../properties/properties.service.js';
import { DEFAULT_PAGE_SIZE, type DirectoryQueryDto, type DirectorySort } from './dto/directory-query.dto.js';
import { DirectoryRepository, type DirectoryFilters, type DirectoryRow } from './directory.repository.js';

// One property card on the directory: only what the card shows.
export type DirectoryProperty = {
  slug: string;
  name: string;
  town: string;
  district: string;
  type: { code: string; name: string };
  // Average of published reviews, 1 decimal place; null when there are none.
  rating: number | null;
  reviewCount: number;
  featured: boolean;
  // The property's own booking site, e.g. "sunrisevilla.sanchara.lk".
  websiteHost: string;
  // Site-relative or absolute; null when the property has no cover photo.
  imageUrl: string | null;
};

export type DirectorySearchResult = {
  items: DirectoryProperty[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  // Matches per active type, ignoring the type filter.
  typeCounts: { code: string; name: string; count: number }[];
};

const DEFAULT_FEATURED_LIMIT = 8;

// "  Nuwara   ELIYA " → "nuwara eliya", as the repository compares it.
export const normaliseLocation = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

// A page past the end (stale link, fewer matches since) shows the last page.
export function clampPage(requested: number, total: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return { page: Math.min(requested, pageCount), pageCount };
}

// Central directory search for guests. Shows only listed properties of active
// companies (suspended companies are hidden).
@Injectable()
export class DirectoryService {
  constructor(
    private readonly repository: DirectoryRepository,
    private readonly properties: PropertiesService,
    private readonly domains: DomainsService,
  ) {}

  async search(query: DirectoryQueryDto): Promise<DirectorySearchResult> {
    const filters: DirectoryFilters = {
      location: query.location ? normaliseLocation(query.location) : null,
      name: query.name || null,
      typeCodes: [...new Set(query.type ?? [])],
      minRating: query.minRating ?? null,
    };
    const sort: DirectorySort = query.sort ?? 'recommended';
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    return this.repository.readSnapshot(async (db) => {
      const typeCounts = await this.repository.countsByType(filters, db);

      // The counts list every active type, so they double as the known codes.
      const unknown = filters.typeCodes.filter((code) => !typeCounts.some((type) => type.code === code));
      if (unknown.length) {
        throw new AppException(HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED', 'Some fields are invalid.', { type: ['Choose a property type.'] });
      }

      const matching = filters.typeCodes.length ? typeCounts.filter((type) => filters.typeCodes.includes(type.code)) : typeCounts;
      const total = matching.reduce((sum, type) => sum + type.count, 0);
      const { page, pageCount } = clampPage(query.page ?? 1, total, pageSize);
      const rows = total ? await this.repository.page(filters, sort, pageSize, (page - 1) * pageSize, db) : [];

      return { items: rows.map((row) => this.toCard(row)), page, pageSize, total, pageCount, typeCounts };
    });
  }

  async featured(limit = DEFAULT_FEATURED_LIMIT): Promise<DirectoryProperty[]> {
    const rows = await this.repository.featured(limit);
    return rows.map((row) => this.toCard(row));
  }

  // For the type filter and chips.
  propertyTypes() {
    return this.properties.propertyTypes();
  }

  private toCard(row: DirectoryRow): DirectoryProperty {
    return {
      slug: row.slug,
      name: row.name,
      town: row.town,
      district: row.district,
      type: { code: row.typeCode, name: row.typeName },
      rating: row.rating,
      reviewCount: row.reviewCount,
      featured: row.featured,
      websiteHost: this.domains.siteHost(row.subdomain),
      imageUrl: row.imageUrl,
    };
  }
}
