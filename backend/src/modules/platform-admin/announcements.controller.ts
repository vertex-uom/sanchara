import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator.js';
import { AnnouncementDto, ListAnnouncementsQueryDto } from '../announcements/dto/announcement.dto.js';
import { AnnouncementsService } from '../announcements/announcements.service.js';
import type { AdminProfile } from '../auth/admins/admins.service.js';
import { AdminOnly } from '../auth/guards/admin.guard.js';

// Platform Admin: announcements to company staff (system notifications). Admins only.
@Controller('admin/announcements')
@AdminOnly()
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  // One status (active, scheduled or archived), paged.
  @Get()
  list(@Query() query: ListAnnouncementsQueryDto) {
    return this.announcements.list(query.status, query.page);
  }

  // How many are active, scheduled and archived.
  @Get('summary')
  summary() {
    return this.announcements.summary();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.announcements.get(id);
  }

  // Starts now when startsAt is omitted.
  @Post()
  create(@CurrentAdmin() admin: AdminProfile, @Body() body: AnnouncementDto) {
    return this.announcements.create(admin, body);
  }

  // Replaces a scheduled announcement; 409 ANNOUNCEMENT_LIVE once it has started.
  @Put(':id')
  update(@CurrentAdmin() admin: AdminProfile, @Param('id', ParseUUIDPipe) id: string, @Body() body: AnnouncementDto) {
    return this.announcements.update(admin, id, body);
  }

  // Cancels a scheduled one or takes a live one down.
  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  archive(@CurrentAdmin() admin: AdminProfile, @Param('id', ParseUUIDPipe) id: string) {
    return this.announcements.archive(admin, id);
  }
}
