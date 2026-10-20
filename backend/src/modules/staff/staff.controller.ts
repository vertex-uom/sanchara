import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentStaff } from '../../common/decorators/current-staff.decorator.js';
import { InviteStaffDto } from './dto/staff.dto.js';
import { StaffOnly } from './guards/staff.guard.js';
import { StaffInvitesService } from './staff-invites.service.js';
import { ROLES_BY_NAME, toStaffProfile, type SignedInStaff } from './staff.service.js';

// Staff management within the signed-in user's company. Listing, role changes
// and deactivation come next.
@Controller('staff')
@StaffOnly()
export class StaffController {
  constructor(private readonly invites: StaffInvitesService) {}

  @Post()
  async invite(@CurrentStaff() actor: SignedInStaff, @Body() body: InviteStaffDto) {
    const { staff, invite } = await this.invites.invite(actor, {
      fullName: body.fullName,
      email: body.email,
      role: ROLES_BY_NAME[body.role],
    });
    return { staff: toStaffProfile(staff), invite };
  }

  @Post(':staffId/invite')
  @HttpCode(HttpStatus.OK)
  async resendInvite(@CurrentStaff() actor: SignedInStaff, @Param('staffId', ParseUUIDPipe) staffId: string) {
    return { invite: await this.invites.resend(actor, staffId) };
  }
}
