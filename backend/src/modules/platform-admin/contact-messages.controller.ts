import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator.js';
import type { AdminProfile } from '../auth/admins/admins.service.js';
import { AdminOnly } from '../auth/guards/admin.guard.js';
import { ContactService } from '../contact/contact.service.js';
import { ListContactMessagesQueryDto, MarkContactMessageDto } from '../contact/dto/contact.dto.js';

// Platform Admin: messages from the central site's contact form. Admins only.
@Controller('admin/contact-messages')
@AdminOnly()
export class ContactMessagesController {
  constructor(private readonly contact: ContactService) {}

  // Newest first, 20 per page; open by default. `open` counts every open message.
  @Get()
  list(@Query() query: ListContactMessagesQueryDto) {
    return this.contact.list(query.status ?? 'open', query.page ?? 1);
  }

  @Put(':id/handled')
  async markHandled(@CurrentAdmin() admin: AdminProfile, @Param('id', ParseUUIDPipe) id: string, @Body() body: MarkContactMessageDto) {
    return { message: await this.contact.markHandled(admin, id, body.handled) };
  }
}
