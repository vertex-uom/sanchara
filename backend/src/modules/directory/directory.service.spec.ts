import { AppException } from '../../common/errors/app-exception.js';
import type { DomainsService } from '../domains/domains.service.js';
import type { PropertiesService } from '../properties/properties.service.js';
import type { DirectoryRepository, DirectoryRow, TypeCountRow } from './directory.repository.js';
import { clampPage, DirectoryService, normaliseLocation } from './directory.service.js';

const COUNTS: TypeCountRow[] = [
  { code: 'GUEST_HOUSE', name: 'Guest House', count: 12 },
  { code: 'VILLA', name: 'Villa', count: 7 },
  { code: 'HOSTEL', name: 'Hostel', count: 0 },
];

const ROW: DirectoryRow = {
  slug: 'sunrise-villa',
  name: 'Sunrise Villa',
  town: 'Pinnawala',
  district: 'Matale',
  typeCode: 'VILLA',
  typeName: 'Villa',
  rating: 4.8,
  reviewCount: 128,
  featured: true,
  subdomain: 'sunrisevilla',
  imageUrl: '/Properties/Sunrise%20Villa.jpg',
};

function setup() {
  const repository = {
    readSnapshot: vi.fn((work: (db: unknown) => Promise<unknown>) => work('tx')),
    countsByType: vi.fn().mockResolvedValue(COUNTS),
    page: vi.fn().mockResolvedValue([ROW]),
    featured: vi.fn().mockResolvedValue([ROW]),
  };
  const domains = { siteHost: (subdomain: string) => `${subdomain}.sanchara.lk` };
  const service = new DirectoryService(repository as unknown as DirectoryRepository, {} as PropertiesService, domains as DomainsService);
  return { service, repository };
}

describe('clampPage', () => {
  it('keeps a page in range and counts pages', () => {
    expect(clampPage(2, 19, 9)).toEqual({ page: 2, pageCount: 3 });
  });

  it('shows the last page for a page past the end', () => {
    expect(clampPage(9, 19, 9)).toEqual({ page: 3, pageCount: 3 });
  });

  it('has one (empty) page when nothing matches', () => {
    expect(clampPage(4, 0, 9)).toEqual({ page: 1, pageCount: 1 });
  });
});

describe('normaliseLocation', () => {
  it('ignores case and extra spacing', () => {
    expect(normaliseLocation('  Nuwara   ELIYA ')).toBe('nuwara eliya');
  });
});

describe('DirectoryService.search', () => {
  it('pages the matches and maps rows to cards', async () => {
    const { service, repository } = setup();
    const result = await service.search({ page: 2, pageSize: 9 });

    expect(result).toMatchObject({ page: 2, pageSize: 9, total: 19, pageCount: 3, typeCounts: COUNTS });
    expect(result.items).toEqual([
      {
        slug: 'sunrise-villa',
        name: 'Sunrise Villa',
        town: 'Pinnawala',
        district: 'Matale',
        type: { code: 'VILLA', name: 'Villa' },
        rating: 4.8,
        reviewCount: 128,
        featured: true,
        websiteHost: 'sunrisevilla.sanchara.lk',
        imageUrl: '/Properties/Sunrise%20Villa.jpg',
      },
    ]);
    expect(repository.page).toHaveBeenCalledWith(expect.anything(), 'recommended', 9, 9, 'tx');
  });

  it('counts only the chosen types in the total, and normalises the filters', async () => {
    const { service, repository } = setup();
    const result = await service.search({ type: ['VILLA', 'VILLA'], location: ' Galle ', name: '' });

    expect(result.total).toBe(7);
    expect(repository.countsByType).toHaveBeenCalledWith({ location: 'galle', name: null, typeCodes: ['VILLA'], minRating: null }, 'tx');
  });

  it('refuses a type code the database does not have', async () => {
    const { service, repository } = setup();
    await expect(service.search({ type: ['SURF_CAMP'] })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      fieldErrors: { type: ['Choose a property type.'] },
    } satisfies Partial<AppException>);
    expect(repository.page).not.toHaveBeenCalled();
  });

  it('skips the page query when nothing matches', async () => {
    const { service, repository } = setup();
    const result = await service.search({ type: ['HOSTEL'] });

    expect(result).toMatchObject({ items: [], total: 0, page: 1, pageCount: 1 });
    expect(repository.page).not.toHaveBeenCalled();
  });
});
