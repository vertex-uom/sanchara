import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsISO8601, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
import {
  AUDIENCE_NAME_LIST,
  MESSAGE_MAX,
  STATUS_NAME_LIST,
  TITLE_MAX,
  TYPE_NAME_LIST,
  type AnnouncementAudienceName,
  type AnnouncementStatusName,
  type AnnouncementTypeName,
} from '../announcements.rules.js';

type Value = { value: unknown };
const trim = ({ value }: Value) => (typeof value === 'string' ? value.trim() : value);

// Times must carry their offset ("…+05:30" or "…Z"): a bare local time would be
// read in the server's time zone.
const WITH_OFFSET = /(Z|[+-]\d{2}:\d{2})$/;
const TIME_MESSAGE = 'Send a full date and time with its offset, e.g. 2026-11-02T01:00:00+05:30.';

// Create, and replace a scheduled announcement (same fields).
export class AnnouncementDto {
  @Transform(trim)
  @IsString()
  @Length(1, TITLE_MAX, { message: `Enter a title (up to ${TITLE_MAX} characters).` })
  title: string;

  @Transform(trim)
  @IsString()
  @Length(1, MESSAGE_MAX, { message: `Enter the message (up to ${MESSAGE_MAX} characters).` })
  message: string;

  @IsIn(TYPE_NAME_LIST, { message: 'Choose a type.' })
  type: AnnouncementTypeName;

  @IsIn(AUDIENCE_NAME_LIST, { message: 'Choose an audience.' })
  audience: AnnouncementAudienceName;

  @IsBoolean({ message: 'Say whether staff can dismiss it.' })
  dismissible: boolean;

  // Omitted: starts now.
  @IsOptional()
  @IsISO8601({ strict: true }, { message: TIME_MESSAGE })
  @Matches(WITH_OFFSET, { message: TIME_MESSAGE })
  startsAt?: string;

  // Omitted or null: until archived.
  @IsOptional()
  @IsISO8601({ strict: true }, { message: TIME_MESSAGE })
  @Matches(WITH_OFFSET, { message: TIME_MESSAGE })
  endsAt?: string | null;
}

export class ListAnnouncementsQueryDto {
  @IsIn(STATUS_NAME_LIST, { message: 'Choose active, scheduled or archived.' })
  status: AnnouncementStatusName;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be a whole number.' })
  @Min(1, { message: 'Page must be a whole number.' })
  page: number = 1;
}
