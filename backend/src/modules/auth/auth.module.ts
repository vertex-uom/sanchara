import { Module } from '@nestjs/common';
import { DomainsModule } from '../domains/domains.module.js';
import { GuestsModule } from '../guests/guests.module.js';
import { MessagingModule } from '../messaging/messaging.module.js';
import { StaffModule } from '../staff/staff.module.js';
import { AuthController } from './auth.controller.js';
import { GuestGuard } from './guards/guest.guard.js';
import { SignedInGuard } from './guards/signed-in.guard.js';
import { MeController } from './me.controller.js';
import { GoogleOidcService } from './services/google-oidc.service.js';
import { GuestAuthService } from './services/guest-auth.service.js';
import { PasswordService } from './services/password.service.js';
import { RateLimitService } from './services/rate-limit.service.js';
import { StaffAuthService } from './services/staff-auth.service.js';
import { StaffAuthController } from './staff-auth.controller.js';

// Sessions and single-use tokens come from the global SecurityModule.
@Module({
  imports: [GuestsModule, StaffModule, DomainsModule, MessagingModule],
  controllers: [AuthController, StaffAuthController, MeController],
  providers: [
    GuestAuthService,
    StaffAuthService,
    PasswordService,
    RateLimitService,
    GoogleOidcService,
    GuestGuard,
    SignedInGuard,
  ],
  // Guard for other modules' guest-only routes. Staff-only routes import StaffModule.
  exports: [GuestGuard, GuestsModule],
})
export class AuthModule {}
