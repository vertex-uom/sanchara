import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { bearerToken } from '../../common/security/bearer-token.js';
import { GoogleCallbackDto, ResetPasswordDto } from './dto/guest-auth.dto.js';
import { AcceptInviteDto, InviteTokenDto, StaffForgotPasswordDto, StaffGoogleStartDto, StaffLoginDto } from './dto/staff-auth.dto.js';
import { StaffAuthService } from './services/staff-auth.service.js';

// Client IP for rate limits (X-Forwarded-For is honoured only via TRUST_PROXY).
const clientIp = (request: Request) => request.ip ?? 'unknown';

@Controller('auth/staff')
export class StaffAuthController {
  constructor(private readonly auth: StaffAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: StaffLoginDto, @Req() request: Request) {
    return this.auth.login(body, clientIp(request));
  }

  // Idempotent: no or unknown token still answers 204.
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: Request) {
    const token = bearerToken(request);
    if (token) await this.auth.logout(token);
  }

  @Post('google/start')
  @HttpCode(HttpStatus.OK)
  googleStart(@Body() body: StaffGoogleStartDto) {
    return this.auth.googleStart(body.returnTo, body.portal);
  }

  @Post('google/callback')
  @HttpCode(HttpStatus.OK)
  googleCallback(@Body() body: GoogleCallbackDto) {
    return this.auth.googleCallback(body);
  }

  // POST so the token stays out of URLs and access logs.
  @Post('invite/check')
  @HttpCode(HttpStatus.OK)
  async checkInvite(@Body() body: InviteTokenDto) {
    return { invite: await this.auth.checkInvite(body.token, body.portal) };
  }

  @Post('invite/accept')
  @HttpCode(HttpStatus.OK)
  acceptInvite(@Body() body: AcceptInviteDto, @Req() request: Request) {
    return this.auth.acceptInvite(body, clientIp(request));
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(@Body() body: StaffForgotPasswordDto, @Req() request: Request) {
    await this.auth.forgotPassword(body.email, body.portal, clientIp(request));
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.auth.resetPassword(body);
  }
}
