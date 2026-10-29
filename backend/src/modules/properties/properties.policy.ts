import type { CancellationPolicy, PropertyCategory, PropertyStatus, SmokingPolicy } from '../../generated/prisma/client.js';

// Sanchara lists Sri Lankan properties only (districts are Sri Lankan).
export const PROPERTY_COUNTRY = 'Sri Lanka';

// Property Settings → Amenities. The Back Office shows the same keys, grouped.
export const AMENITY_KEYS = [
  'wifi',
  'parking',
  'air-conditioning',
  'front-desk-24h',
  'laundry',
  'luggage-storage',
  'restaurant',
  'bar',
  'breakfast',
  'room-service',
  'pool',
  'garden',
  'beach-access',
  'bbq',
  'spa',
  'fitness',
  'airport-transfer',
  'tour-desk',
  'bicycle-rental',
  'family-rooms',
  'wheelchair',
  'lift',
  'ground-floor',
] as const;

export const SETTINGS_LIMITS = {
  name: 100,
  description: 250,
  minYear: 1800,
  addressLine: 120,
  town: 60,
  houseRules: 1000,
  url: 500,
  bookingWindowDays: { min: 30, max: 730 },
  minNoticeHours: { min: 0, max: 72 },
} as const;

// API names are the enum values in lower-case kebab: HILL_COUNTRY ↔ hill-country.
type KebabName<T extends string> = T extends `${infer Head}_${infer Tail}` ? `${Lowercase<Head>}-${KebabName<Tail>}` : Lowercase<T>;

export const toApiName = <T extends string>(value: T) => value.toLowerCase().replaceAll('_', '-') as KebabName<T>;
export const fromApiName = <T extends string>(name: string) => name.toUpperCase().replaceAll('-', '_') as T;

export type PropertyStatusName = KebabName<PropertyStatus>;
export type PropertyCategoryName = KebabName<PropertyCategory>;
export type CancellationPolicyName = KebabName<CancellationPolicy>;
export type SmokingPolicyName = KebabName<SmokingPolicy>;

export const PROPERTY_STATUS_NAMES: readonly PropertyStatusName[] = ['active', 'inactive'];
export const CATEGORY_NAMES: readonly PropertyCategoryName[] = ['beachfront', 'city', 'hill-country', 'wildlife', 'lakeside', 'heritage', 'rural'];
export const CANCELLATION_NAMES: readonly CancellationPolicyName[] = ['flexible', 'moderate', 'strict', 'non-refundable'];
export const SMOKING_NAMES: readonly SmokingPolicyName[] = ['not-allowed', 'designated-areas', 'allowed'];
