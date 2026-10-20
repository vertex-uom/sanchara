import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SignedIn } from './guards/signed-in.guard.js';

// One endpoint for every audience; "audience" tells the client which shape it got.
@Controller('me')
export class MeController {
  @Get()
  @SignedIn()
  me(@Req() request: Request) {
    if (request.guest) return { audience: 'guest' as const, guest: request.guest };
    const { company, ...staff } = request.staff!;
    return { audience: 'staff' as const, staff, company };
  }
}
