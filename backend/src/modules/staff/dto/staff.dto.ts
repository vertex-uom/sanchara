import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsString, Length, MaxLength } from 'class-validator';
import { normaliseEmail } from '../../../common/validation/normalise.js';
import type { StaffRoleName } from '../staff.service.js';

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
