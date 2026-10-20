import { Module } from '@nestjs/common';
import { DomainsModule } from '../domains/domains.module.js';
import { GuestsModule } from '../guests/guests.module.js';
import { MessagingModule } from '../messaging/messaging.module.js';
import { AuthController } from './auth.controller.js';
import { GuestGuard } from './guards/guest.guard.js';
import { MeController } from './me.controller.js';
import { GoogleOidcService } from './services/google-oidc.service.js';
import { GuestAuthService } from './services/guest-auth.service.js';
import { PasswordResetService } from './services/password-reset.service.js';
import { PasswordService } from './services/password.service.js';
import { RateLimitService } from './services/rate-limit.service.js';
import { SessionService } from './services/session.service.js';

@Module({
  imports: [GuestsModule, DomainsModule, MessagingModule],
  controllers: [AuthController, MeController],
  providers: [
    GuestAuthService,
    SessionService,
    PasswordService,
    PasswordResetService,
    RateLimitService,
    GoogleOidcService,
    GuestGuard,
  ],
  // Guard + session store for other modules' guest-only routes.
  exports: [GuestGuard, SessionService, GuestsModule],
})
export class AuthModule {}
