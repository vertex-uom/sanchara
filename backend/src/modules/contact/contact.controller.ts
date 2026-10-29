import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ContactService } from './contact.service.js';
import { ContactMessageDto } from './dto/contact.dto.js';

// Client IP for rate limits (X-Forwarded-For is honoured only via TRUST_PROXY).
const clientIp = (request: Request) => request.ip ?? 'unknown';

// The central site's contact form. Public; 429 when a sender sends too many.
@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async send(@Body() body: ContactMessageDto, @Req() request: Request) {
    await this.contact.send(body, clientIp(request));
  }
}
