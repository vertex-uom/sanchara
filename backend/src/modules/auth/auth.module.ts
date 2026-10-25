import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { DomainsModule } from '../domains/domains.module.js';
import { GuestsModule } from '../guests/guests.module.js';
import { MessagingModule } from '../messaging/messaging.module.js';
import { StaffModule } from '../staff/staff.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AdminsRepository } from './admins/admins.repository.js';
import { AdminsService } from './admins/admins.service.js';
import { AuthController } from './auth.controller.js';
import { AdminGuard } from './guards/admin.guard.js';
import { GuestGuard } from './guards/guest.guard.js';
import { SignedInGuard } from './guards/signed-in.guard.js';
import { MeController } from './me.controller.js';
import { AdminAuthService } from './services/admin-auth.service.js';
import { GoogleOidcService } from './services/google-oidc.service.js';
import { GuestAuthService } from './services/guest-auth.service.js';
import { PasswordService } from './services/password.service.js';
import { RateLimitService } from './services/rate-limit.service.js';
import { StaffAuthService } from './services/staff-auth.service.js';
import { StaffAuthController } from './staff-auth.controller.js';

// Sessions and single-use tokens come from the global SecurityModule.
@Module({
  imports: [GuestsModule, StaffModule, DomainsModule, MessagingModule, AuditModule, SubscriptionsModule],
  controllers: [AuthController, StaffAuthController, AdminAuthController, MeController],
  providers: [
    GuestAuthService,
    StaffAuthService,
    PasswordService,
    RateLimitService,
    GoogleOidcService,
    AdminAuthService,
    AdminsRepository,
    AdminsService,
    GuestGuard,
    AdminGuard,
    SignedInGuard,
  ],
  // Guards for other modules' guest-only and admin-only routes (AdminsService is
  // the admin guard's dependency, and the admin CLI's). Staff-only routes import StaffModule.
  exports: [GuestGuard, GuestsModule, AdminGuard, AdminsService, PasswordService],
})
export class AuthModule {}
