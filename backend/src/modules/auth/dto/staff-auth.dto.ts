import { IsBoolean, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { TOKEN_PATTERN } from '../../../common/security/tokens.js';
import { STAFF_PORTALS, type StaffPortal } from '../../staff/staff.policy.js';
import { PASSWORD_MAX, PASSWORD_MIN } from '../auth.policy.js';
import { ForgotPasswordDto, GoogleStartDto, LoginDto } from './guest-auth.dto.js';

// Staff requests say which portal they came from (owner or staff); an account
// only works in its own portal. Reset and the Google callback reuse the guest
// DTOs (guest-auth.dto.ts) unchanged.

const PORTAL_MESSAGE = 'Choose the owner or staff portal.';

export class StaffLoginDto extends LoginDto {
  @IsIn(STAFF_PORTALS, { message: PORTAL_MESSAGE })
  portal: StaffPortal;
}

export class StaffGoogleStartDto extends GoogleStartDto {
  @IsIn(STAFF_PORTALS, { message: PORTAL_MESSAGE })
  portal: StaffPortal;
}

export class StaffForgotPasswordDto extends ForgotPasswordDto {
  @IsIn(STAFF_PORTALS, { message: PORTAL_MESSAGE })
  portal: StaffPortal;
}

export class InviteTokenDto {
  @IsString()
  @Matches(TOKEN_PATTERN, { message: 'This invite link is invalid or has expired.' })
  token: string;

  @IsIn(STAFF_PORTALS, { message: PORTAL_MESSAGE })
  portal: StaffPortal;
}

export class AcceptInviteDto extends InviteTokenDto {
  @IsString()
  @Length(PASSWORD_MIN, PASSWORD_MAX, { message: `Password must be ${PASSWORD_MIN} to ${PASSWORD_MAX} characters.` })
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
