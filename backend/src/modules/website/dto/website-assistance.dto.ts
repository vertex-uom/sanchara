import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsEmail, IsIn, IsOptional, IsString, IsUUID, Length, Matches, MaxLength, ValidateIf } from 'class-validator';
import { normaliseEmail } from '../../../common/validation/normalise.js';
import {
  ADMIN_STATUS_NAMES,
  CONTACT_NAMES,
  GOAL_KEYS,
  INTERNAL_NOTE_MAX,
  NOTES_MAX,
  OPEN_STATUS_NAMES,
  STYLE_NAMES,
  TIMING_NAMES,
  type AssistanceContactName,
  type AssistanceStatusName,
  type AssistanceStyleName,
  type AssistanceTimingName,
} from '../website-assistance.policy.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const blankToUndefined = ({ value }: { value: unknown }) => (typeof value === 'string' && value.trim() === '' ? undefined : trim({ value }));

// What the Owner or a Manager sends from the Back Office (same rules as the form).
export class AssistanceRequestDto {
  @Transform(trim)
  @IsString()
  @Length(1, 80, { message: 'Enter your name (up to 80 characters).' })
  contactName: string;

  @Transform(trim)
  @IsString()
  @Matches(/^\+?[\d\s()-]{9,20}$/, { message: 'Enter a phone number, like +94 77 123 4567.' })
  phone: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? normaliseEmail(value) : value))
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254, { message: 'Enter a valid email address.' })
  email: string;

  @IsIn(CONTACT_NAMES, { message: 'Choose how we should contact you.' })
  contactMethod: AssistanceContactName;

  @IsArray()
  @ArrayMaxSize(GOAL_KEYS.length)
  @ArrayUnique({ message: 'Choose each goal once.' })
  @IsIn(GOAL_KEYS, { each: true, message: 'Choose goals from the list.' })
  goals: string[];

  @IsIn(STYLE_NAMES, { message: 'Choose a style.' })
  style: AssistanceStyleName;

  @IsIn(TIMING_NAMES, { message: 'Choose when you need it.' })
  timing: AssistanceTimingName;

  @Transform(trim)
  @IsString()
  @MaxLength(NOTES_MAX, { message: `Use ${NOTES_MAX} characters or fewer.` })
  notes: string;
}

// Admin list filters. assignee: an admin id, or "unassigned".
export class ListWebsiteRequestsQueryDto {
  @IsOptional()
  @IsIn(OPEN_STATUS_NAMES, { message: 'Choose requested, in-progress or review.' })
  status?: AssistanceStatusName;

  @IsOptional()
  @ValidateIf((_, value) => value !== 'unassigned')
  @IsUUID('all', { message: 'Choose a team member.' })
  assignee?: string;

  @Transform(blankToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class AssignWebsiteRequestDto {
  // Null unassigns.
  @ValidateIf((_, value) => value !== null)
  @IsUUID('all', { message: 'Choose a team member.' })
  adminId: string | null;
}

export class WebsiteRequestStatusDto {
  @IsIn(ADMIN_STATUS_NAMES, { message: 'Choose requested, in-progress, review or published.' })
  status: AssistanceStatusName;

  // Shown on the timeline.
  @Transform(blankToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Use 300 characters or fewer.' })
  note?: string;
}

export class WebsiteRequestNoteDto {
  @Transform(trim)
  @IsString()
  @Length(1, INTERNAL_NOTE_MAX, { message: `Write a note (up to ${INTERNAL_NOTE_MAX} characters).` })
  text: string;
}
