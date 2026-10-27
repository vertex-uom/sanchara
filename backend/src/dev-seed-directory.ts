import type { Logger } from '@nestjs/common';
import type { PrismaService } from './common/prisma/prisma.service.js';
import type { CompaniesService } from './modules/companies/companies.service.js';
import { slugify } from './modules/properties/slug.js';

// Development data for the central directory: 67 listed properties, one demo
// company each (its subdomain is the property's website), cover photos from
// the web app's public/Properties folder, demo guests and their reviews. The
// rating summary on properties is filled by the reviews trigger. Re-running
// replaces the demo images and reviews and leaves everything else alone.

type DemoProperty = {
  name: string;
  town: string;
  district: string;
  type: string;
  subdomain?: string;
  // Target published reviews (count and average); random when left out.
  reviews?: { count: number; average: number };
  featuredRank?: number;
};

// The 17 from the frontend's Discover fixture, on the database's types
// (Boutique Villa → VILLA, Home Stay → HOMESTAY, Bungalow → COTTAGE,
// Surf Camp → HOSTEL, Wellness Retreat → RESORT). Each has its own photo.
const FRONTEND_PROPERTIES: DemoProperty[] = [
  { name: 'Sunrise Villa', town: 'Pinnawala', district: 'Matale', type: 'VILLA', subdomain: 'sunrisevilla', reviews: { count: 128, average: 4.8 }, featuredRank: 1 },
  { name: 'Ocean Breeze', town: 'Unawatuna', district: 'Galle', type: 'GUEST_HOUSE', subdomain: 'oceanbreeze', reviews: { count: 214, average: 4.6 }, featuredRank: 2 },
  { name: 'Serene Hills Retreat', town: 'Ella', district: 'Badulla', type: 'RESORT', subdomain: 'serenehills', reviews: { count: 96, average: 4.7 }, featuredRank: 3 },
  { name: 'Lagoon View Bungalow', town: 'Galle', district: 'Galle', type: 'COTTAGE', subdomain: 'lagoonview', reviews: { count: 342, average: 4.9 }, featuredRank: 4 },
  { name: 'Tea Hill Home Stay', town: 'Nuwara Eliya', district: 'Nuwara Eliya', type: 'HOMESTAY', subdomain: 'teahill', reviews: { count: 74, average: 4.5 } },
  { name: 'Palm Breeze Villa', town: 'Matara', district: 'Matara', type: 'VILLA', subdomain: 'palmbreeze', reviews: { count: 158, average: 4.7 } },
  { name: 'Forest Edge Villa', town: 'Ella', district: 'Badulla', type: 'VILLA', subdomain: 'forestedge', reviews: { count: 88, average: 4.8 } },
  { name: 'Coral Bay Surf Camp', town: 'Hikkaduwa', district: 'Galle', type: 'HOSTEL', subdomain: 'coralbay', reviews: { count: 201, average: 4.5 }, featuredRank: 5 },
  { name: 'Sigiriya Rock Guest House', town: 'Sigiriya', district: 'Matale', type: 'GUEST_HOUSE', subdomain: 'sigiriyarock', reviews: { count: 119, average: 4.6 } },
  { name: 'Kandy Lake Guest House', town: 'Kandy', district: 'Kandy', type: 'GUEST_HOUSE', subdomain: 'kandylake', reviews: { count: 163, average: 4.4 } },
  { name: 'Mirissa Bay Home Stay', town: 'Mirissa', district: 'Matara', type: 'HOMESTAY', subdomain: 'mirissabay', reviews: { count: 92, average: 4.6 } },
  { name: 'Arugam Point Surf Camp', town: 'Arugam Bay', district: 'Ampara', type: 'HOSTEL', subdomain: 'arugampoint', reviews: { count: 176, average: 4.7 } },
  { name: 'Knuckles Mist Bungalow', town: 'Rangala', district: 'Kandy', type: 'COTTAGE', subdomain: 'knucklesmist', reviews: { count: 41, average: 4.3 } },
  { name: 'Jaffna Heritage Home Stay', town: 'Jaffna', district: 'Jaffna', type: 'HOMESTAY', subdomain: 'jaffnaheritage', reviews: { count: 58, average: 4.5 } },
  { name: 'Nilaveli Shore Guest House', town: 'Nilaveli', district: 'Trincomalee', type: 'GUEST_HOUSE', subdomain: 'nilavelishore', reviews: { count: 67, average: 4.2 } },
  { name: 'Bentota Ayurveda Retreat', town: 'Bentota', district: 'Galle', type: 'RESORT', subdomain: 'bentotaayurveda', reviews: { count: 133, average: 4.8 } },
  { name: 'Haputale Cloud Villa', town: 'Haputale', district: 'Badulla', type: 'VILLA', subdomain: 'haputalecloud', reviews: { count: 52, average: 4.4 } },
];

// 50 more across all 25 districts and all 8 types. They reuse the 17 photos.
// Three are new listings with no reviews yet.
const MORE_PROPERTIES: DemoProperty[] = [
  { name: 'Colombo Harbour Apartments', town: 'Colombo', district: 'Colombo', type: 'APARTMENT' },
  { name: 'Galle Face Boutique Hotel', town: 'Colombo', district: 'Colombo', type: 'BOUTIQUE_HOTEL' },
  { name: 'Mount Lavinia Sea Apartments', town: 'Mount Lavinia', district: 'Colombo', type: 'APARTMENT' },
  { name: 'Negombo Lagoon Guest House', town: 'Negombo', district: 'Gampaha', type: 'GUEST_HOUSE' },
  { name: 'Negombo Beach Hostel', town: 'Negombo', district: 'Gampaha', type: 'HOSTEL' },
  { name: 'Kalutara River Villa', town: 'Kalutara', district: 'Kalutara', type: 'VILLA' },
  { name: 'Beruwala Palm Resort', town: 'Beruwala', district: 'Kalutara', type: 'RESORT' },
  { name: 'Peradeniya Garden Homestay', town: 'Peradeniya', district: 'Kandy', type: 'HOMESTAY' },
  { name: 'Temple View Boutique Hotel', town: 'Kandy', district: 'Kandy', type: 'BOUTIQUE_HOTEL', featuredRank: 8 },
  { name: 'Kandy Hills Apartments', town: 'Kandy', district: 'Kandy', type: 'APARTMENT' },
  { name: 'Dambulla Cave Cottage', town: 'Dambulla', district: 'Matale', type: 'COTTAGE' },
  { name: 'Knuckles Ridge Resort', town: 'Matale', district: 'Matale', type: 'RESORT' },
  { name: 'Gregory Lake Cottage', town: 'Nuwara Eliya', district: 'Nuwara Eliya', type: 'COTTAGE' },
  { name: 'Horton Plains Hostel', town: 'Ohiya', district: 'Nuwara Eliya', type: 'HOSTEL' },
  { name: 'Galle Fort Heritage Villa', town: 'Galle', district: 'Galle', type: 'VILLA', featuredRank: 6 },
  { name: 'Ahangama Surf Hostel', town: 'Ahangama', district: 'Galle', type: 'HOSTEL' },
  { name: 'Hikkaduwa Coral Villa', town: 'Hikkaduwa', district: 'Galle', type: 'VILLA' },
  { name: 'Weligama Bay Apartments', town: 'Weligama', district: 'Matara', type: 'APARTMENT' },
  { name: 'Polhena Reef Guest House', town: 'Matara', district: 'Matara', type: 'GUEST_HOUSE' },
  { name: 'Mirissa Whale Boutique Hotel', town: 'Mirissa', district: 'Matara', type: 'BOUTIQUE_HOTEL' },
  { name: 'Tangalle Dunes Resort', town: 'Tangalle', district: 'Hambantota', type: 'RESORT' },
  { name: 'Yala Safari Cottage', town: 'Tissamaharama', district: 'Hambantota', type: 'COTTAGE' },
  { name: 'Nallur Courtyard Guest House', town: 'Jaffna', district: 'Jaffna', type: 'GUEST_HOUSE' },
  { name: 'Kilinochchi Tank Homestay', town: 'Kilinochchi', district: 'Kilinochchi', type: 'HOMESTAY', reviews: { count: 0, average: 0 } },
  { name: 'Mannar Baobab Guest House', town: 'Mannar', district: 'Mannar', type: 'GUEST_HOUSE' },
  { name: 'Vavuniya Garden Homestay', town: 'Vavuniya', district: 'Vavuniya', type: 'HOMESTAY' },
  { name: 'Mullaitivu Shore Cottage', town: 'Mullaitivu', district: 'Mullaitivu', type: 'COTTAGE', reviews: { count: 0, average: 0 } },
  { name: 'Pasikudah Blue Resort', town: 'Pasikudah', district: 'Batticaloa', type: 'RESORT', featuredRank: 7 },
  { name: 'Batticaloa Lagoon Villa', town: 'Batticaloa', district: 'Batticaloa', type: 'VILLA' },
  { name: 'Arugam Bay Palm Hostel', town: 'Arugam Bay', district: 'Ampara', type: 'HOSTEL' },
  { name: 'Pottuvil Point Villa', town: 'Pottuvil', district: 'Ampara', type: 'VILLA' },
  { name: 'Uppuveli Beach Apartments', town: 'Uppuveli', district: 'Trincomalee', type: 'APARTMENT' },
  { name: 'Marble Beach Boutique Hotel', town: 'Trincomalee', district: 'Trincomalee', type: 'BOUTIQUE_HOTEL' },
  { name: 'Kurunegala Rock Homestay', town: 'Kurunegala', district: 'Kurunegala', type: 'HOMESTAY' },
  { name: 'Ridi Viharaya Cottage', town: 'Ridigama', district: 'Kurunegala', type: 'COTTAGE', reviews: { count: 0, average: 0 } },
  { name: 'Kalpitiya Kite Hostel', town: 'Kalpitiya', district: 'Puttalam', type: 'HOSTEL' },
  { name: 'Kalpitiya Lagoon Resort', town: 'Kalpitiya', district: 'Puttalam', type: 'RESORT' },
  { name: 'Sacred City Guest House', town: 'Anuradhapura', district: 'Anuradhapura', type: 'GUEST_HOUSE' },
  { name: 'Tissa Wewa Boutique Hotel', town: 'Anuradhapura', district: 'Anuradhapura', type: 'BOUTIQUE_HOTEL' },
  { name: 'Parakrama Lake Villa', town: 'Polonnaruwa', district: 'Polonnaruwa', type: 'VILLA' },
  { name: 'Minneriya Elephant Homestay', town: 'Minneriya', district: 'Polonnaruwa', type: 'HOMESTAY' },
  { name: 'Ella Gap Apartments', town: 'Ella', district: 'Badulla', type: 'APARTMENT' },
  { name: 'Nine Arches Hostel', town: 'Ella', district: 'Badulla', type: 'HOSTEL' },
  { name: 'Lipton Seat Cottage', town: 'Haputale', district: 'Badulla', type: 'COTTAGE' },
  { name: 'Wellawaya Falls Guest House', town: 'Wellawaya', district: 'Monaragala', type: 'GUEST_HOUSE' },
  { name: 'Gal Oya Wilderness Resort', town: 'Bibile', district: 'Monaragala', type: 'RESORT' },
  { name: 'Sinharaja Rainforest Homestay', town: 'Kudawa', district: 'Ratnapura', type: 'HOMESTAY' },
  { name: 'Ratnapura Gem Boutique Hotel', town: 'Ratnapura', district: 'Ratnapura', type: 'BOUTIQUE_HOTEL' },
  { name: 'Kitulgala River Cottage', town: 'Kitulgala', district: 'Kegalle', type: 'COTTAGE' },
  { name: 'Pinnawala Riverside Guest House', town: 'Pinnawala', district: 'Kegalle', type: 'GUEST_HOUSE' },
];

const PHOTOS = FRONTEND_PROPERTIES.map((property) => `/Properties/${encodeURIComponent(property.name)}.jpg`);

const FIRST_NAMES = ['Nimal', 'Kasuni', 'Tharindu', 'Dilini', 'Ruwan', 'Sachini', 'Emma', 'Lukas', 'Aiko', 'Priya'];
const LAST_NAMES = ['Perera', 'Fernando', 'Silva', 'Jayasinghe', 'Müller', 'Tanaka'];
const DEMO_GUESTS = FIRST_NAMES.flatMap((first, i) =>
  LAST_NAMES.map((last, j) => ({ fullName: `${first} ${last}`, email: `guest${i * LAST_NAMES.length + j + 1}@demo.example.com` })),
);

// Null entries are stars-only reviews.
const REVIEW_COMMENTS: Record<number, (string | null)[]> = {
  5: ['Spotless rooms, warm hosts and the best breakfast of our trip.', 'Beautiful setting and everything was taken care of.', null],
  4: ['Great location and friendly staff. The Wi-Fi was a little slow.', 'Comfortable and clean; check-in took a while.', null],
  3: ['Decent room, but noisy in the evening.'],
  2: ['The room was smaller than in the photos.'],
  1: ['Our booking was mixed up on arrival.'],
};

// Deterministic, so re-seeding gives the same data.
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// `count` star ratings whose average rounds to `average`, in shuffled order.
export function ratingsFor(count: number, average: number, next: () => number): number[] {
  const total = Math.round(average * count);
  const base = Math.min(4, Math.floor(average));
  const higher = total - base * count;
  const ratings = Array.from({ length: count }, (_, i) => (i < higher ? base + 1 : base));
  for (let i = ratings.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [ratings[i], ratings[j]] = [ratings[j]!, ratings[i]!];
  }
  return ratings;
}

const subdomainOf = (property: DemoProperty) => property.subdomain ?? slugify(property.name).replace(/-/g, '').slice(0, 40);

export async function seedDirectory(prisma: PrismaService, companies: CompaniesService, logger: Logger) {
  const next = random(20261027);
  const [types, districts] = await Promise.all([prisma.propertyType.findMany(), prisma.district.findMany()]);
  const typeId = new Map(types.map((type) => [type.code, type.id]));
  const districtId = new Map(districts.map((district) => [district.name, district.id]));

  const guests = await Promise.all(
    DEMO_GUESTS.map((guest) => prisma.guest.upsert({ where: { email: guest.email }, update: {}, create: guest, select: { id: true } })),
  );

  const all = [...FRONTEND_PROPERTIES, ...MORE_PROPERTIES];
  const reviews: { propertyId: string; guestId: string; rating: number; comment: string | null; status: 'PUBLISHED' | 'HIDDEN'; createdAt: Date }[] = [];
  const propertyIds: string[] = [];
  let skipped = 0;

  for (const [index, demo] of all.entries()) {
    const subdomain = subdomainOf(demo);
    const company = (await companies.findBySubdomain(subdomain)) ?? (await companies.create({ name: demo.name, subdomain, town: demo.town }));
    const slug = slugify(demo.name);
    const existing = await prisma.property.findUnique({ where: { slug }, select: { companyId: true } });
    if (existing && existing.companyId !== company.id) {
      logger.warn(`Skipped ${demo.name}: the slug "${slug}" belongs to another company.`);
      skipped++;
      continue;
    }

    const listing = {
      name: demo.name,
      propertyTypeId: typeId.get(demo.type)!,
      city: demo.town,
      districtId: districtId.get(demo.district)!,
      addressLine1: `${index + 1} Main Street`,
      isListed: true,
      isFeatured: demo.featuredRank !== undefined,
      featuredRank: demo.featuredRank ?? null,
    };
    const property = await prisma.property.upsert({
      where: { slug },
      update: listing,
      create: { ...listing, slug, companyId: company.id },
      select: { id: true },
    });
    propertyIds.push(property.id);

    await prisma.propertyImage.deleteMany({ where: { propertyId: property.id } });
    await prisma.propertyImage.create({
      data: { propertyId: property.id, url: PHOTOS[index % PHOTOS.length]!, altText: `${demo.name} in ${demo.town}`, sortOrder: 0, isCover: true },
    });

    const target = demo.reviews ?? { count: 5 + Math.floor(next() * 240), average: Math.round((3.8 + next() * 1.1) * 10) / 10 };
    for (const [n, rating] of ratingsFor(target.count, target.average, next).entries()) {
      const comments = REVIEW_COMMENTS[rating]!;
      const daysAgo = Math.floor(next() * 730);
      reviews.push({
        propertyId: property.id,
        guestId: guests[(index * 7 + n) % guests.length]!.id,
        rating,
        comment: comments[n % comments.length]!,
        status: 'PUBLISHED',
        createdAt: new Date(Date.now() - daysAgo * 86_400_000),
      });
    }
    // Every fifth property also has a review hidden by moderation (not counted).
    if (index % 5 === 0) {
      reviews.push({ propertyId: property.id, guestId: guests[index % guests.length]!.id, rating: 1, comment: REVIEW_COMMENTS[1]![0]!, status: 'HIDDEN', createdAt: new Date() });
    }
  }

  // One statement each, so the trigger refreshes every property's rating once.
  await prisma.$transaction([
    prisma.review.deleteMany({ where: { propertyId: { in: propertyIds } } }),
    prisma.review.createMany({ data: reviews }),
  ]);

  logger.log(`Directory: ${propertyIds.length} listed properties, ${reviews.length} reviews, ${guests.length} demo guests${skipped ? `, ${skipped} skipped` : ''}.`);
}
