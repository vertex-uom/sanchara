import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  AMENITY_KEYS,
  CANCELLATION_NAMES,
  CATEGORY_NAMES,
  PROPERTY_STATUS_NAMES,
  SETTINGS_LIMITS,
  SMOKING_NAMES,
  type CancellationPolicyName,
  type PropertyCategoryName,
  type PropertyStatusName,
  type SmokingPolicyName,
} from '../properties.policy.js';

// Same rules as the Back Office forms (features/properties/validation.ts).
const PHONE = /^\+?[\d\s()-]{7,20}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const HTTPS_URL = { protocols: ['https'], require_protocol: true };
const URL_MESSAGE = 'Enter a full link starting with https://';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
// Optional text: blank means "not set".
const blankToNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

// Every save says which version it was edited from (stale saves are refused).
class VersionedSettingsDto {
  @IsInt({ message: 'Reload the page and try again.' })
  @Min(1, { message: 'Reload the page and try again.' })
  version: number;
}

export class BasicSettingsDto extends VersionedSettingsDto {
  @Transform(trim)
  @IsString()
  @Length(1, SETTINGS_LIMITS.name, { message: `Enter the property name (up to ${SETTINGS_LIMITS.name} characters).` })
  name: string;

  // A property type name, e.g. "guest-house"; checked against the list in the service.
  @IsString()
  @Matches(/^[a-z]+(-[a-z]+)*$/, { message: 'Choose a property type.' })
  @MaxLength(32, { message: 'Choose a property type.' })
  type: string;

  @Transform(trim)
  @IsString()
  @Length(1, SETTINGS_LIMITS.description, { message: `Enter a short description (up to ${SETTINGS_LIMITS.description} characters).` })
  description: string;

  @IsOptional()
  @IsInt({ message: 'Choose a star rating.' })
  @Min(1, { message: 'Choose a star rating.' })
  @Max(5, { message: 'Choose a star rating.' })
  starRating?: number | null;

  // Not in the future; checked in the service against today's year.
  @IsOptional()
  @IsInt({ message: 'Enter a year.' })
  @Min(SETTINGS_LIMITS.minYear, { message: `Enter a year from ${SETTINGS_LIMITS.minYear}.` })
  establishedYear?: number | null;

  @IsOptional()
  @IsIn(CATEGORY_NAMES, { message: 'Choose a category.' })
  category?: PropertyCategoryName | null;
}

export class ContactSettingsDto extends VersionedSettingsDto {
  @Transform(trim)
  @IsString()
  @Matches(PHONE, { message: 'Enter a phone number, like +94 77 123 4567.' })
  phone: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Enter a valid email address, like name@example.com.' })
  @MaxLength(254, { message: 'Enter a valid email address, like name@example.com.' })
  email: string;

  @Transform(blankToNull)
  @IsOptional()
  @Matches(PHONE, { message: 'Enter a WhatsApp number, like +94 77 123 4567.' })
  whatsapp?: string | null;

  @Transform(blankToNull)
  @IsOptional()
  @IsUrl(HTTPS_URL, { message: URL_MESSAGE })
  @MaxLength(SETTINGS_LIMITS.url, { message: URL_MESSAGE })
  website?: string | null;

  @Transform(trim)
  @IsString()
  @Length(1, SETTINGS_LIMITS.addressLine, { message: `Enter the street address (up to ${SETTINGS_LIMITS.addressLine} characters).` })
  addressLine1: string;

  @Transform(blankToNull)
  @IsOptional()
  @IsString()
  @MaxLength(SETTINGS_LIMITS.addressLine, { message: `Use ${SETTINGS_LIMITS.addressLine} characters or fewer.` })
  addressLine2?: string | null;

  @Transform(trim)
  @IsString()
  @Length(1, SETTINGS_LIMITS.town, { message: `Enter the town or city (up to ${SETTINGS_LIMITS.town} characters).` })
  town: string;

  // A Sri Lankan district name; checked against the list in the service.
  @IsString({ message: 'Choose a district.' })
  @Length(1, 40, { message: 'Choose a district.' })
  district: string;

  @Transform(blankToNull)
  @IsOptional()
  @Matches(/^\d{5}$/, { message: 'Enter a 5-digit postal code.' })
  postalCode?: string | null;

  @Transform(blankToNull)
  @IsOptional()
  @IsUrl(HTTPS_URL, { message: URL_MESSAGE })
  @MaxLength(SETTINGS_LIMITS.url, { message: URL_MESSAGE })
  mapUrl?: string | null;
}

export class PoliciesSettingsDto extends VersionedSettingsDto {
  @Matches(TIME, { message: 'Enter the check-in time.' })
  checkInFrom: string;

  @Transform(blankToNull)
  @IsOptional()
  @Matches(TIME, { message: 'Enter a time, or leave it empty.' })
  checkInUntil?: string | null;

  @Matches(TIME, { message: 'Enter the check-out time.' })
  checkOutBy: string;

  @IsIn(CANCELLATION_NAMES, { message: 'Choose a cancellation policy.' })
  cancellation: CancellationPolicyName;

  @IsBoolean({ message: 'Choose yes or no.' })
  childrenAllowed: boolean;

  @IsBoolean({ message: 'Choose yes or no.' })
  petsAllowed: boolean;

  @IsIn(SMOKING_NAMES, { message: 'Choose a smoking policy.' })
  smoking: SmokingPolicyName;

  @Transform(trim)
  @IsString()
  @MaxLength(SETTINGS_LIMITS.houseRules, { message: `Use ${SETTINGS_LIMITS.houseRules} characters or fewer.` })
  houseRules: string;
}

export class AmenitiesSettingsDto extends VersionedSettingsDto {
  @IsArray()
  @ArrayMaxSize(AMENITY_KEYS.length)
  @ArrayUnique({ message: 'Choose each amenity once.' })
  @IsIn(AMENITY_KEYS, { each: true, message: 'Choose amenities from the list.' })
  amenities: string[];
}

export class IntegrationsSettingsDto extends VersionedSettingsDto {
  @Transform(blankToNull)
  @IsOptional()
  @Matches(/^G-[A-Z0-9]{4,12}$/, { message: 'Enter the measurement ID, like G-AB12CD34EF.' })
  googleAnalyticsId?: string | null;

  @Transform(blankToNull)
  @IsOptional()
  @Matches(/^\d{10,20}$/, { message: 'Enter the Pixel ID (numbers only).' })
  metaPixelId?: string | null;

  @Transform(blankToNull)
  @IsOptional()
  @IsUrl(HTTPS_URL, { message: URL_MESSAGE })
  @MaxLength(SETTINGS_LIMITS.url, { message: URL_MESSAGE })
  googleBusinessUrl?: string | null;

  @Transform(blankToNull)
  @IsOptional()
  @IsUrl(HTTPS_URL, { message: URL_MESSAGE })
  @MaxLength(SETTINGS_LIMITS.url, { message: URL_MESSAGE })
  tripAdvisorUrl?: string | null;

  @Transform(blankToNull)
  @IsOptional()
  @IsUrl(HTTPS_URL, { message: URL_MESSAGE })
  @MaxLength(SETTINGS_LIMITS.url, { message: URL_MESSAGE })
  bookingComIcalUrl?: string | null;

  @Transform(blankToNull)
  @IsOptional()
  @IsUrl(HTTPS_URL, { message: URL_MESSAGE })
  @MaxLength(SETTINGS_LIMITS.url, { message: URL_MESSAGE })
  airbnbIcalUrl?: string | null;
}

export class AdvancedSettingsDto extends VersionedSettingsDto {
  @Transform(blankToNull)
  @IsOptional()
  @Matches(/^[A-Za-z0-9/-]{3,30}$/, { message: 'Use letters, numbers, / and - only.' })
  sltdaNumber?: string | null;

  @Transform(blankToNull)
  @IsOptional()
  @Matches(/^\d{9}-?\d{4}$/, { message: 'Enter the VAT number, like 123456789-7000.' })
  vatNumber?: string | null;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z0-9]{2,6}$/, { message: 'Use 2 to 6 letters or numbers.' })
  invoicePrefix: string;

  @IsInt({ message: 'Enter a whole number of days.' })
  @Min(SETTINGS_LIMITS.bookingWindowDays.min, { message: `Enter ${SETTINGS_LIMITS.bookingWindowDays.min} to ${SETTINGS_LIMITS.bookingWindowDays.max} days.` })
  @Max(SETTINGS_LIMITS.bookingWindowDays.max, { message: `Enter ${SETTINGS_LIMITS.bookingWindowDays.min} to ${SETTINGS_LIMITS.bookingWindowDays.max} days.` })
  bookingWindowDays: number;

  @IsInt({ message: 'Enter a whole number of hours.' })
  @Min(SETTINGS_LIMITS.minNoticeHours.min, { message: `Enter ${SETTINGS_LIMITS.minNoticeHours.min} to ${SETTINGS_LIMITS.minNoticeHours.max} hours.` })
  @Max(SETTINGS_LIMITS.minNoticeHours.max, { message: `Enter ${SETTINGS_LIMITS.minNoticeHours.min} to ${SETTINGS_LIMITS.minNoticeHours.max} hours.` })
  minNoticeHours: number;
}

export class PropertyStatusDto {
  @IsIn(PROPERTY_STATUS_NAMES, { message: 'Choose active or inactive.' })
  status: PropertyStatusName;
}
