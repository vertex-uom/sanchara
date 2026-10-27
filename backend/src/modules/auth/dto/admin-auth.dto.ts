import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { normaliseEmail } from '../../../common/validation/normalise.js';
import { PASSWORD_MAX } from '../auth.policy.js';

const email = ({ value }: { value: unknown }) => (typeof value === 'string' ? normaliseEmail(value) : value);

// No "remember me" for admins. Login doesn't re-check password rules.
export class AdminLoginDto {
  @Transform(email)
  @IsString()
  @Length(1, 254)
  email: string;

  @IsString()
  @Length(1, PASSWORD_MAX)
  password: string;
}
