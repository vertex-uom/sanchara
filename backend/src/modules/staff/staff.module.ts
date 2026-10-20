import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module.js';
import { MessagingModule } from '../messaging/messaging.module.js';
import { StaffGuard } from './guards/staff.guard.js';
import { StaffController } from './staff.controller.js';
import { StaffInvitesService } from './staff-invites.service.js';
import { StaffRepository } from './staff.repository.js';
import { StaffService } from './staff.service.js';

@Module({
  imports: [CompaniesModule, MessagingModule],
  controllers: [StaffController],
  providers: [StaffRepository, StaffService, StaffInvitesService, StaffGuard],
  // Guard for other modules' staff-only routes (they import CompaniesModule too).
  exports: [StaffService, StaffInvitesService, StaffGuard, CompaniesModule],
})
export class StaffModule {}
