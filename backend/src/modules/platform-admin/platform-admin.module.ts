import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { DomainsModule } from '../domains/domains.module.js';
import { PropertiesModule } from '../properties/properties.module.js';
import { StaffModule } from '../staff/staff.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { OnboardingService } from './onboarding.service.js';
import { PlatformAdminController } from './platform-admin.controller.js';

// Must never import guests, reservations, enquiries, payments or refund-log:
// admins don't read bookings or guests. StaffModule also exports CompaniesModule.
@Module({
  imports: [AuthModule, StaffModule, PropertiesModule, SubscriptionsModule, DomainsModule, AuditModule],
  controllers: [PlatformAdminController],
  providers: [OnboardingService],
})
export class PlatformAdminModule {}
