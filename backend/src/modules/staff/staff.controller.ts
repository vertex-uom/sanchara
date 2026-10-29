import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { CurrentStaff } from '../../common/decorators/current-staff.decorator.js';
import { ChangeStaffRoleDto, InviteStaffDto, ListStaffQueryDto } from './dto/staff.dto.js';
import { StaffRoles } from './guards/staff-roles.guard.js';
import { StaffManagementService } from './staff-management.service.js';
import { ROLES_BY_NAME, toStaffProfile, type SignedInStaff } from './staff.service.js';

// Staff Management within the signed-in user's company. Owner and Manager
// only; who may change whom is checked per account (StaffManagementService).
@Controller('staff')
@StaffRoles('owner', 'manager')
export class StaffController {
  constructor(private readonly management: StaffManagementService) {}

  // With seat usage against the plan's limit.
  @Get()
  list(@CurrentStaff() actor: SignedInStaff, @Query() query: ListStaffQueryDto) {
    return this.management.list(actor, query);
  }

  // 409 LIMIT_REACHED when the plan's seats are used up.
  @Post()
  async invite(@CurrentStaff() actor: SignedInStaff, @Body() body: InviteStaffDto) {
    const { staff, invite } = await this.management.invite(actor, {
      fullName: body.fullName,
      email: body.email,
      role: ROLES_BY_NAME[body.role],
    });
    return { staff: toStaffProfile(staff), invite };
  }

  @Post(':staffId/invite')
  @HttpCode(HttpStatus.OK)
  async resendInvite(@CurrentStaff() actor: SignedInStaff, @Param('staffId', ParseUUIDPipe) staffId: string) {
    return { invite: await this.management.resendInvite(actor, staffId) };
  }

  @Put(':staffId/role')
  async changeRole(@CurrentStaff() actor: SignedInStaff, @Param('staffId', ParseUUIDPipe) staffId: string, @Body() body: ChangeStaffRoleDto) {
    return { staff: await this.management.changeRole(actor, staffId, body.role) };
  }

  @Post(':staffId/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivate(@CurrentStaff() actor: SignedInStaff, @Param('staffId', ParseUUIDPipe) staffId: string) {
    return { staff: await this.management.deactivate(actor, staffId) };
  }

  @Post(':staffId/reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivate(@CurrentStaff() actor: SignedInStaff, @Param('staffId', ParseUUIDPipe) staffId: string) {
    return { staff: await this.management.reactivate(actor, staffId) };
  }
}
