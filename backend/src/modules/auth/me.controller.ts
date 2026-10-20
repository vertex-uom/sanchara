import { Controller, Get } from '@nestjs/common';
import { CurrentGuest } from '../../common/decorators/current-guest.decorator.js';
import type { GuestProfile } from '../guests/guests.service.js';
import { GuestOnly } from './guards/guest.guard.js';

// "audience" lets staff and admin share this endpoint later.
@Controller('me')
export class MeController {
  @Get()
  @GuestOnly()
  me(@CurrentGuest() guest: GuestProfile) {
    return { audience: 'guest' as const, guest };
  }
}
