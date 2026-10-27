import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export const DIRECTORY_SORTS = ['recommended', 'rating', 'reviews'] as const;
export type DirectorySort = (typeof DIRECTORY_SORTS)[number];

// The minimum-rating steps the directory offers.
export const MIN_RATINGS = [4, 4.5, 4.8] as const;

// Deep pages are capped so OFFSET stays cheap.
export const MAX_PAGE = 50;
export const MAX_PAGE_SIZE = 48;
export const DEFAULT_PAGE_SIZE = 9;

const trimmed = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
// ?type=A&type=B arrives as an array, ?type=A as a string.
const asArray = ({ value }: { value: unknown }) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]);

// GET /directory/properties. Empty strings (from blank form fields) mean "any".
export class DirectoryQueryDto {
  // Town or district, matched exactly (case and spacing ignored).
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(80, { message: 'Enter at most 80 characters.' })
  location?: string;

  // Part of the property name, case-insensitive.
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(80, { message: 'Enter at most 80 characters.' })
  name?: string;

  // Property type codes, e.g. GUEST_HOUSE. Unknown codes are refused by the service.
  @IsOptional()
  @Transform(asArray)
  @IsArray()
  @ArrayMaxSize(20)
  @Matches(/^[A-Z][A-Z0-9_]{0,31}$/, { each: true, message: 'Choose a property type.' })
  type?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsIn(MIN_RATINGS, { message: 'Choose a minimum rating.' })
  minRating?: number;

  @IsOptional()
  @IsIn(DIRECTORY_SORTS, { message: 'Choose a sort order.' })
  sort?: DirectorySort;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Choose a page.' })
  @Min(1, { message: 'Choose a page.' })
  @Max(MAX_PAGE, { message: `Choose a page up to ${MAX_PAGE}.` })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Choose a page size.' })
  @Min(1, { message: 'Choose a page size.' })
  @Max(MAX_PAGE_SIZE, { message: `Choose a page size up to ${MAX_PAGE_SIZE}.` })
  pageSize?: number;
}

export class FeaturedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Choose a limit.' })
  @Min(1, { message: 'Choose a limit.' })
  @Max(24, { message: 'Choose a limit up to 24.' })
  limit?: number;
}
