import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { normaliseEmail } from '../../../common/validation/normalise.js';
import type { StaffRoleName, StaffStatusName } from '../staff.service.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const email = ({ value }: { value: unknown }) => (typeof value === 'string' ? normaliseEmail(value) : value);

const ROLE_NAMES: StaffRoleName[] = ['owner', 'manager', 'front-desk'];

export class InviteStaffDto {
  @Transform(trim)
  @IsString()
  @Length(1, 120, { message: 'Enter the full name (up to 120 characters).' })
  fullName: string;

  @Transform(email)
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  email: string;

  @IsIn(ROLE_NAMES, { message: 'Pick a role.' })
  role: StaffRoleName;
}

const STATUS_NAMES: StaffStatusName[] = ['invited', 'active', 'inactive'];

// Staff list filters (all optional).
export class ListStaffQueryDto {
  @IsOptional()
  @IsIn(ROLE_NAMES, { message: 'Pick a role.' })
  role?: StaffRoleName;

  @IsOptional()
  @IsIn(STATUS_NAMES, { message: 'Pick a status.' })
  status?: StaffStatusName;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

// A company has one Owner, so the role is Manager or Front Desk.
export class ChangeStaffRoleDto {
  @IsIn(['manager', 'front-desk'], { message: 'Pick Manager or Front Desk.' })
  role: Exclude<StaffRoleName, 'owner'>;
}
