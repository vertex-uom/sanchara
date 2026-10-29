import { Transform, Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Length, Matches, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const blankToUndefined = ({ value }: { value: unknown }) => (typeof value === 'string' && value.trim() === '' ? undefined : trim({ value }));

export const COMPANY_STATUS_FILTERS = ['all', 'active', 'pending-setup', 'suspended', 'suspended-by-admin', 'suspended-non-payment'] as const;
export type CompanyStatusFilter = (typeof COMPANY_STATUS_FILTERS)[number];

export class ListCompaniesQueryDto {
  @Transform(blankToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(COMPANY_STATUS_FILTERS, { message: 'Choose a status.' })
  status?: CompanyStatusFilter;

  // Plan code, e.g. STANDARD.
  @Transform(blankToUndefined)
  @IsOptional()
  @Matches(/^[A-Z_]{1,32}$/, { message: 'Choose a plan.' })
  plan?: string;

  @Transform(blankToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  town?: string;

  // Joined on or after this instant.
  @Transform(blankToUndefined)
  @IsOptional()
  @IsDateString({}, { message: 'Use an ISO date.' })
  joinedAfter?: string;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'name'], { message: 'Choose newest, oldest or name.' })
  sort?: 'newest' | 'oldest' | 'name';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

export class PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

// Shown in the enforcement log and the company's history.
export class CompanyStatusChangeDto {
  @Transform(trim)
  @IsString()
  @Length(3, 500, { message: 'Give a reason (3 to 500 characters).' })
  reason: string;
}
