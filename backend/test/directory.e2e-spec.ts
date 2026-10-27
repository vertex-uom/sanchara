import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { CompaniesService } from '../src/modules/companies/companies.service.js';
import type { CompanyStatus } from '../src/generated/prisma/client.js';

// District ids and property type ids from the company_onboarding seed.
const GALLE = 7;
const KANDY = 4;
const GUEST_HOUSE = 1;
const VILLA = 2;

type Listing = { name: string; slug: string; typeId?: number; districtId?: number; city?: string; listed?: boolean; featuredRank?: number; status?: CompanyStatus; ratings?: number[] };

describe('Directory (e2e)', () => {
  let app: NestExpressApplication;
  let http: ReturnType<NestExpressApplication['getHttpServer']>;
  let prisma: PrismaService;
  let guestId: string;

  const get = (path: string) => request(http).get(`/v1/directory${path}`);

  async function listing({ name, slug, typeId = GUEST_HOUSE, districtId = GALLE, city = 'Galle', listed = true, featuredRank, status = 'ACTIVE', ratings = [] }: Listing) {
    const company = await app.get(CompaniesService).create({ name, subdomain: slug.replace(/-/g, ''), status });
    const property = await prisma.property.create({
      data: {
        companyId: company.id,
        propertyTypeId: typeId,
        districtId,
        city,
        name,
        slug,
        addressLine1: '1 Main Street',
        isListed: listed,
        isFeatured: featuredRank !== undefined,
        featuredRank: featuredRank ?? null,
        images: { create: [{ url: `/Properties/${slug}.jpg`, sortOrder: 0, isCover: true }, { url: `/Properties/${slug}-2.jpg`, sortOrder: 1 }] },
      },
    });
    if (ratings.length) await prisma.review.createMany({ data: ratings.map((rating) => ({ propertyId: property.id, guestId, rating })) });
    return property;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
    http = app.getHttpServer();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "companies", "platform_admins", "audit_entries", "guests" CASCADE');
    guestId = (await prisma.guest.create({ data: { fullName: 'Nimal Perera', email: 'nimal@example.com' } })).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns only the card fields, with the rating summary kept by the reviews trigger', async () => {
    await listing({ name: 'Sunrise Villa', slug: 'sunrise-villa', typeId: VILLA, featuredRank: 1, ratings: [5, 5, 4] });

    const response = await get('/properties').expect(200);
    expect(response.body).toEqual({
      items: [
        {
          slug: 'sunrise-villa',
          name: 'Sunrise Villa',
          town: 'Galle',
          district: 'Galle',
          type: { code: 'VILLA', name: 'Villa' },
          rating: 4.7,
          reviewCount: 3,
          featured: true,
          websiteHost: expect.stringMatching(/^sunrisevilla\./),
          imageUrl: '/Properties/sunrise-villa.jpg',
        },
      ],
      page: 1,
      pageSize: 9,
      total: 1,
      pageCount: 1,
      typeCounts: expect.arrayContaining([{ code: 'VILLA', name: 'Villa', count: 1 }, { code: 'GUEST_HOUSE', name: 'Guest House', count: 0 }]),
    });
  });

  it('hides unlisted properties and companies that are not active', async () => {
    await listing({ name: 'Shown', slug: 'shown' });
    await listing({ name: 'Draft', slug: 'draft', listed: false });
    await listing({ name: 'Suspended', slug: 'suspended', status: 'SUSPENDED_BY_ADMIN' });
    await listing({ name: 'Unpaid', slug: 'unpaid', status: 'SUSPENDED_NON_PAYMENT' });

    const response = await get('/properties').expect(200);
    expect(response.body.items.map((item: { slug: string }) => item.slug)).toEqual(['shown']);
    expect(response.body.total).toBe(1);
  });

  it('a property with no published reviews has no rating', async () => {
    const property = await listing({ name: 'New Place', slug: 'new-place', ratings: [2] });
    await prisma.review.updateMany({ where: { propertyId: property.id }, data: { status: 'HIDDEN' } });

    const response = await get('/properties').expect(200);
    expect(response.body.items[0]).toMatchObject({ rating: null, reviewCount: 0 });
  });

  it('filters by location, name, type and minimum rating; type counts ignore the type filter', async () => {
    await listing({ name: 'Galle Fort Villa', slug: 'galle-fort-villa', typeId: VILLA, ratings: [5] });
    await listing({ name: 'Galle Lane Guest House', slug: 'galle-lane', ratings: [4] });
    await listing({ name: 'Kandy Lake Villa', slug: 'kandy-lake-villa', typeId: VILLA, districtId: KANDY, city: 'Kandy', ratings: [5] });

    const galle = await get('/properties?location=%20GALLE%20&type=VILLA').expect(200);
    expect(galle.body.items.map((item: { slug: string }) => item.slug)).toEqual(['galle-fort-villa']);
    expect(galle.body.typeCounts).toEqual(expect.arrayContaining([{ code: 'VILLA', name: 'Villa', count: 1 }, { code: 'GUEST_HOUSE', name: 'Guest House', count: 1 }]));

    const named = await get('/properties?name=lake').expect(200);
    expect(named.body.items.map((item: { slug: string }) => item.slug)).toEqual(['kandy-lake-villa']);

    const rated = await get('/properties?minRating=4.5&sort=rating').expect(200);
    expect(rated.body.items.map((item: { slug: string }) => item.slug).sort()).toEqual(['galle-fort-villa', 'kandy-lake-villa']);
  });

  it('pages with a stable order and shows the last page for a page past the end', async () => {
    for (let n = 1; n <= 5; n++) await listing({ name: `Stay ${n}`, slug: `stay-${n}`, ratings: [4] });

    const pages = await Promise.all([1, 2, 3].map((page) => get(`/properties?pageSize=2&page=${page}&sort=reviews`).expect(200)));
    const slugs = pages.flatMap((page) => page.body.items.map((item: { slug: string }) => item.slug));
    expect(new Set(slugs).size).toBe(5);
    expect(pages[0]!.body).toMatchObject({ total: 5, pageCount: 3 });

    const past = await get('/properties?pageSize=2&page=9').expect(200);
    expect(past.body).toMatchObject({ page: 3, items: [expect.anything()] });
  });

  it('sorts featured first by rank on the default sort, and lists featured placements', async () => {
    await listing({ name: 'Plain', slug: 'plain', ratings: [5] });
    await listing({ name: 'Second', slug: 'second', featuredRank: 2 });
    await listing({ name: 'First', slug: 'first', featuredRank: 1 });

    const search = await get('/properties').expect(200);
    expect(search.body.items.map((item: { slug: string }) => item.slug)).toEqual(['first', 'second', 'plain']);

    const featured = await get('/featured').expect(200);
    expect(featured.body.map((item: { slug: string }) => item.slug)).toEqual(['first', 'second']);
  });

  it('refuses unknown types and invalid parameters', async () => {
    const unknown = await get('/properties?type=SURF_CAMP').expect(400);
    expect(unknown.body).toMatchObject({ code: 'VALIDATION_FAILED', fieldErrors: { type: ['Choose a property type.'] } });

    const invalid = await get('/properties?page=51&pageSize=100&minRating=3&sort=price').expect(400);
    expect(Object.keys(invalid.body.fieldErrors).sort()).toEqual(['minRating', 'page', 'pageSize', 'sort']);
  });

  it('lists the active property types from the database', async () => {
    const response = await get('/property-types').expect(200);
    expect(response.body[0]).toEqual({ code: 'GUEST_HOUSE', name: 'Guest House' });
    expect(response.body.map((type: { code: string }) => type.code)).not.toContain('SURF_CAMP');
  });
});
