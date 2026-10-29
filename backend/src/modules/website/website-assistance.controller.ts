import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { CurrentStaff } from '../../common/decorators/current-staff.decorator.js';
import { StaffRoles } from '../staff/guards/staff-roles.guard.js';
import type { SignedInStaff } from '../staff/staff.service.js';
import { AssistanceRequestDto } from './dto/website-assistance.dto.js';
import { WebsiteAssistanceService } from './website-assistance.service.js';

// Back Office: the company's request for WEMIXT to build its website. Owner
// and Manager only; always the signed-in user's own company.
@Controller('website/assistance-request')
@StaffRoles('owner', 'manager')
export class WebsiteAssistanceController {
  constructor(private readonly assistance: WebsiteAssistanceService) {}

  // The open request, or null.
  @Get()
  async current(@CurrentStaff() actor: SignedInStaff) {
    return { request: await this.assistance.current(actor) };
  }

  // 409 REQUEST_OPEN while another request is open.
  @Post()
  async send(@CurrentStaff() actor: SignedInStaff, @Body() body: AssistanceRequestDto) {
    return { request: await this.assistance.send(actor, body) };
  }

  @Put()
  async update(@CurrentStaff() actor: SignedInStaff, @Body() body: AssistanceRequestDto) {
    return { request: await this.assistance.update(actor, body) };
  }

  @Post('cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(@CurrentStaff() actor: SignedInStaff) {
    await this.assistance.cancel(actor);
  }
}
