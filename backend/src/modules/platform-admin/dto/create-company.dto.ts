import { Transform, Type } from 'class-transformer';
import { IsDefined, IsEmail, IsInt, IsOptional, IsString, Length, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { LK_PHONE_PATTERN, normaliseEmail, normaliseSriLankanPhone } from '../../../common/validation/normalise.js';
import { SUBDOMAIN_PATTERN } from '../../domains/domains.service.js';

type Value = { value: unknown };
const trim = ({ value }: Value) => (typeof value === 'string' ? value.trim() : value);
// Optional text: blank means "not given".
const optionalText = ({ value }: Value) => (typeof value === 'string' ? value.trim() || undefined : value);
const lower = ({ value }: Value) => (typeof value === 'string' ? value.trim().toLowerCase() : value);
const upper = ({ value }: Value) => (typeof value === 'string' ? value.trim().toUpperCase() : value);
const email = ({ value }: Value) => (typeof value === 'string' ? normaliseEmail(value) : value);
const phone = ({ value }: Value) => (typeof value === 'string' ? normaliseSriLankanPhone(value) : value);

const CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

export class CompanyInputDto {
  @Transform(trim)
  @IsString()
  @Length(2, 120, { message: 'Enter the company name (2 to 120 characters).' })
  name: string;

  @Transform(lower)
  @IsString()
  @Matches(SUBDOMAIN_PATTERN, { message: '3–40 characters: lowercase letters, digits and hyphens; no hyphen at the ends.' })
  subdomain: string;

  @Transform(trim)
  @IsString()
  @Length(1, 80, { message: 'Enter the town or area (up to 80 characters).' })
  town: string;

  @IsOptional()
  @Transform(optionalText)
  @IsString()
  @Length(1, 160)
  legalName?: string;

  @IsOptional()
  @Transform(optionalText)
  @IsString()
  @Length(1, 40)
  registrationNo?: string;

  @Transform(upper)
  @IsString()
  @Matches(CODE_PATTERN, { message: 'Choose a plan.' })
  planCode: string;
}

export class AddressInputDto {
  @Transform(trim)
  @IsString()
  @Length(1, 160, { message: 'Enter the street address (up to 160 characters).' })
  line1: string;

  @IsOptional()
  @Transform(optionalText)
  @IsString()
  @Length(1, 160)
  line2?: string;

  @Transform(trim)
  @IsString()
  @Length(1, 80, { message: 'Enter the town or city (up to 80 characters).' })
  city: string;

  @IsInt({ message: 'Choose a district.' })
  @Min(1)
  @Max(32767)
  districtId: number;

  @IsOptional()
  @Transform(optionalText)
  @IsString()
  @Matches(/^\d{5}$/, { message: 'Postal codes in Sri Lanka have 5 digits.' })
  postalCode?: string;
}

export class PropertyInputDto {
  @Transform(trim)
  @IsString()
  @Length(2, 120, { message: 'Enter the property name (2 to 120 characters).' })
  name: string;

  @Transform(upper)
  @IsString()
  @Matches(CODE_PATTERN, { message: 'Choose a property type.' })
  typeCode: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => AddressInputDto)
  address: AddressInputDto;
}

export class OwnerInputDto {
  @Transform(trim)
  @IsString()
  @Length(2, 120, { message: "Enter the Owner's name (2 to 120 characters)." })
  fullName: string;

  @Transform(email)
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  email: string;

  @Transform(phone)
  @IsString()
  @Matches(LK_PHONE_PATTERN, { message: 'Enter a Sri Lankan phone number, e.g. 077 123 4567 or +94 77 123 4567.' })
  phone: string;
}

// Everything the platform team enters to open a company: the company, its
// first property and its Owner.
export class CreateCompanyDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => CompanyInputDto)
  company: CompanyInputDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => PropertyInputDto)
  property: PropertyInputDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => OwnerInputDto)
  owner: OwnerInputDto;
}
