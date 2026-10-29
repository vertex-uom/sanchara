import { Module } from '@nestjs/common';
import { AnnouncementsModule } from '../announcements/announcements.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ContactModule } from '../contact/contact.module.js';
import { DomainsModule } from '../domains/domains.module.js';
import { PropertiesModule } from '../properties/properties.module.js';
import { StaffModule } from '../staff/staff.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { WebsiteModule } from '../website/website.module.js';
import { AccountsController } from './accounts.controller.js';
import { AccountsRepository } from './accounts.repository.js';
import { AccountsService } from './accounts.service.js';
import { AdminUsersController } from './admin-users.controller.js';
import { ContactMessagesController } from './contact-messages.controller.js';
import { AnnouncementsController } from './announcements.controller.js';
import { AdminUsersService } from './admin-users.service.js';
import { OnboardingRepository } from './onboarding.repository.js';
import { OnboardingService } from './onboarding.service.js';
import { OverviewController } from './overview.controller.js';
import { OverviewRepository } from './overview.repository.js';
import { OverviewService } from './overview.service.js';
import { PlatformAdminController } from './platform-admin.controller.js';
import { WebsiteRequestsController } from './website-requests.controller.js';

// Must never import guests, reservations, enquiries, payments or refund-log:
// admins don't read bookings or guests. StaffModule also exports CompaniesModule.
@Module({
  imports: [AuthModule, StaffModule, PropertiesModule, SubscriptionsModule, DomainsModule, AuditModule, AnnouncementsModule, WebsiteModule, ContactModule],
  controllers: [AccountsController, ContactMessagesController, PlatformAdminController, AdminUsersController, OverviewController, AnnouncementsController, WebsiteRequestsController],
  providers: [AccountsService, AccountsRepository, OnboardingService, OnboardingRepository, AdminUsersService, OverviewService, OverviewRepository],
})
export class PlatformAdminModule {}
