import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { PASSWORD_MAX, PASSWORD_MIN } from '../auth.policy.js';
import { E164_PATTERN, normaliseEmail, normaliseMobile } from '../../../common/validation/normalise.js';
import { TOKEN_PATTERN } from '../../../common/security/tokens.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const email = ({ value }: { value: unknown }) => (typeof value === 'string' ? normaliseEmail(value) : value);
const mobile = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() !== '' ? normaliseMobile(value) : undefined;

const PASSWORD_LENGTH = `Password must be ${PASSWORD_MIN} to ${PASSWORD_MAX} characters.`;

export class RegisterDto {
  @Transform(trim)
  @IsString()
  @Length(1, 120, { message: 'Enter your full name (up to 120 characters).' })
  fullName: string;

  @Transform(email)
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  email: string;

  @IsString()
  @Length(PASSWORD_MIN, PASSWORD_MAX, { message: PASSWORD_LENGTH })
  password: string;

  @IsOptional()
  @Transform(mobile)
  @Matches(E164_PATTERN, { message: 'Enter the mobile number with country code, e.g. +94771234567.' })
  mobile?: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  returnTo?: string;
}

// Login doesn't re-check password rules: old passwords may predate them.
export class LoginDto {
  @Transform(email)
  @IsString()
  @Length(1, 254)
  email: string;

  @IsString()
  @Length(1, PASSWORD_MAX)
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  returnTo?: string;
}

export class GoogleStartDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  returnTo?: string;
}

export class GoogleCallbackDto {
  @IsString()
  @Length(1, 2048)
  code: string;

  @IsString()
  @Matches(TOKEN_PATTERN)
  state: string;
}

export class ForgotPasswordDto {
  @Transform(email)
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @Matches(TOKEN_PATTERN, { message: 'This link is invalid or has expired.' })
  token: string;

  @IsString()
  @Length(PASSWORD_MIN, PASSWORD_MAX, { message: PASSWORD_LENGTH })
  newPassword: string;
}
