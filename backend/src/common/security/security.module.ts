import { Global, Module } from '@nestjs/common';
import { OneTimeTokenService } from './one-time-token.service.js';
import { SessionService } from './session.service.js';

// Session store and single-use tokens, shared by every audience (guest, staff, admin).
@Global()
@Module({
  providers: [SessionService, OneTimeTokenService],
  exports: [SessionService, OneTimeTokenService],
})
export class SecurityModule {}
