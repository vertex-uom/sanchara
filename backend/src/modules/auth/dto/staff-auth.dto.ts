import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';
import { TOKEN_PATTERN } from '../../../common/security/tokens.js';
import { PASSWORD_MAX, PASSWORD_MIN } from '../auth.policy.js';

// Staff login, Google, forgot and reset use the same DTOs as guests (guest-auth.dto.ts).

export class InviteTokenDto {
  @IsString()
  @Matches(TOKEN_PATTERN, { message: 'This invite link is invalid or has expired.' })
  token: string;
}

export class AcceptInviteDto extends InviteTokenDto {
  @IsString()
  @Length(PASSWORD_MIN, PASSWORD_MAX, { message: `Password must be ${PASSWORD_MIN} to ${PASSWORD_MAX} characters.` })
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
