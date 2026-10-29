import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator.js';
import type { AdminProfile } from '../auth/admins/admins.service.js';
import { AdminOnly } from '../auth/guards/admin.guard.js';
import { AccountsService } from './accounts.service.js';
import { CompanyStatusChangeDto, ListCompaniesQueryDto, PageQueryDto } from './dto/accounts.dto.js';

// Platform Admin: Accounts & Enforcement. Admins only.
@Controller('admin')
@AdminOnly()
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  // Paged, 8 per page, with filters.
  @Get('companies')
  list(@Query() query: ListCompaniesQueryDto) {
    return this.accounts.list(query);
  }

  // Counts by status, for the KPIs.
  @Get('companies/summary')
  summary() {
    return this.accounts.summary();
  }

  // Towns and plans for the filters.
  @Get('companies/options')
  options() {
    return this.accounts.options();
  }

  @Get('companies/:companyId')
  async get(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return { company: await this.accounts.detail(companyId) };
  }

  @Post('companies/:companyId/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(@CurrentAdmin() admin: AdminProfile, @Param('companyId', ParseUUIDPipe) companyId: string, @Body() body: CompanyStatusChangeDto) {
    return { company: await this.accounts.suspend(admin, companyId, body.reason) };
  }

  @Post('companies/:companyId/reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivate(@CurrentAdmin() admin: AdminProfile, @Param('companyId', ParseUUIDPipe) companyId: string, @Body() body: CompanyStatusChangeDto) {
    return { company: await this.accounts.reactivate(admin, companyId, body.reason) };
  }

  // Suspensions and reactivations across companies, newest first.
  @Get('enforcement')
  enforcement(@Query() query: PageQueryDto) {
    return this.accounts.enforcementLog(query.page ?? 1);
  }
}
