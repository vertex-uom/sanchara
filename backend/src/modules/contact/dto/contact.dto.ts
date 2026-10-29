import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';
import { normaliseEmail } from '../../../common/validation/normalise.js';
import { CONTACT_SUBJECT_NAMES, MESSAGE_MAX, MESSAGE_MIN, type ContactSubjectName } from '../contact.policy.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// The central site's contact form (same rules as the form).
export class ContactMessageDto {
  @Transform(trim)
  @IsString()
  @Length(1, 120, { message: 'Enter your name (up to 120 characters).' })
  name: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? normaliseEmail(value) : value))
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254, { message: 'Enter a valid email address.' })
  email: string;

  @IsIn(CONTACT_SUBJECT_NAMES, { message: 'Choose a subject.' })
  subject: ContactSubjectName;

  @Transform(trim)
  @IsString()
  @Length(MESSAGE_MIN, MESSAGE_MAX, { message: `Write ${MESSAGE_MIN} to ${MESSAGE_MAX} characters.` })
  message: string;
}

export class ListContactMessagesQueryDto {
  @IsOptional()
  @IsIn(['open', 'handled', 'all'], { message: 'Choose open, handled or all.' })
  status?: 'open' | 'handled' | 'all';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

export class MarkContactMessageDto {
  // False reopens it.
  @IsBoolean({ message: 'Choose handled or not.' })
  handled: boolean;
}
