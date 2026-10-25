import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator.js';
import type { AdminProfile } from '../auth/admins/admins.service.js';
import { AdminOnly } from '../auth/guards/admin.guard.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { OnboardingService } from './onboarding.service.js';

// Platform Admin: company onboarding. Admins only.
@Controller('admin')
@AdminOnly()
export class PlatformAdminController {
  constructor(private readonly onboarding: OnboardingService) {}

  // Plans, property types, provinces/districts and subdomain rules for the form.
  @Get('onboarding/options')
  options() {
    return this.onboarding.options();
  }

  @Get('subdomains/:subdomain/availability')
  subdomainAvailability(@Param('subdomain') subdomain: string) {
    return this.onboarding.subdomainAvailability(subdomain);
  }

  // Company + first property + plan + invited Owner; returns the invite link once.
  @Post('companies')
  createCompany(@CurrentAdmin() admin: AdminProfile, @Body() body: CreateCompanyDto) {
    return this.onboarding.createCompany(admin, body);
  }

  @Post('companies/:companyId/owner-invite')
  @HttpCode(HttpStatus.OK)
  reissueOwnerInvite(@CurrentAdmin() admin: AdminProfile, @Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.onboarding.reissueOwnerInvite(admin, companyId);
  }
}
