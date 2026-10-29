import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator.js';
import type { AdminProfile } from '../auth/admins/admins.service.js';
import { AdminOnly } from '../auth/guards/admin.guard.js';
import {
  AssignWebsiteRequestDto,
  ListWebsiteRequestsQueryDto,
  WebsiteRequestNoteDto,
  WebsiteRequestStatusDto,
} from '../website/dto/website-assistance.dto.js';
import { WebsiteAssistanceService } from '../website/website-assistance.service.js';

// Platform Admin: companies' requests for WEMIXT to build their website.
// Admins only.
@Controller('admin/website-requests')
@AdminOnly()
export class WebsiteRequestsController {
  constructor(private readonly assistance: WebsiteAssistanceService) {}

  // Open requests, soonest due first, with counts per status.
  @Get()
  list(@Query() query: ListWebsiteRequestsQueryDto) {
    return this.assistance.list(query);
  }

  // Everything the company sent, plus the team's work: timeline, internal notes.
  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return { request: await this.assistance.detail(id) };
  }

  @Put(':id/assignee')
  async assign(@CurrentAdmin() admin: AdminProfile, @Param('id', ParseUUIDPipe) id: string, @Body() body: AssignWebsiteRequestDto) {
    return { request: await this.assistance.assign(admin, id, body.adminId) };
  }

  // Publishing closes the request.
  @Put(':id/status')
  async setStatus(@CurrentAdmin() admin: AdminProfile, @Param('id', ParseUUIDPipe) id: string, @Body() body: WebsiteRequestStatusDto) {
    return { request: await this.assistance.setStatus(admin, id, body.status, body.note) };
  }

  // Team-only; the company never sees these.
  @Post(':id/notes')
  async addNote(@CurrentAdmin() admin: AdminProfile, @Param('id', ParseUUIDPipe) id: string, @Body() body: WebsiteRequestNoteDto) {
    return { request: await this.assistance.addNote(admin, id, body.text) };
  }
}
