import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { bearerToken } from '../../common/security/bearer-token.js';
import { AdminLoginDto } from './dto/admin-auth.dto.js';
import { AdminAuthService } from './services/admin-auth.service.js';

// Client IP for rate limits (X-Forwarded-For is honoured only via TRUST_PROXY).
const clientIp = (request: Request) => request.ip ?? 'unknown';

@Controller('auth/admin')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: AdminLoginDto, @Req() request: Request) {
    return this.auth.login(body, clientIp(request));
  }

  // Idempotent: no or unknown token still answers 204.
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: Request) {
    const token = bearerToken(request);
    if (token) await this.auth.logout(token);
  }
}
