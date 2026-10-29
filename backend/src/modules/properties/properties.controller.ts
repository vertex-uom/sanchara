import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { CurrentStaff } from '../../common/decorators/current-staff.decorator.js';
import { OwnerOnly } from '../staff/guards/owner.guard.js';
import { StaffOnly } from '../staff/guards/staff.guard.js';
import type { SignedInStaff } from '../staff/staff.service.js';
import {
  AdvancedSettingsDto,
  AmenitiesSettingsDto,
  BasicSettingsDto,
  ContactSettingsDto,
  IntegrationsSettingsDto,
  PoliciesSettingsDto,
  PropertyStatusDto,
} from './dto/property-settings.dto.js';
import { PropertySettingsService } from './property-settings.service.js';

const PropertyId = () => Param('propertyId', ParseUUIDPipe);

// The signed-in user's company properties. Every staff role sees the list
// (property switcher); only the Owner reads or changes Property Settings.
@Controller('properties')
export class PropertiesController {
  constructor(private readonly settings: PropertySettingsService) {}

  @Get()
  @StaffOnly()
  async list(@CurrentStaff() actor: SignedInStaff) {
    return { properties: await this.settings.list(actor) };
  }

  @Get(':propertyId/settings')
  @OwnerOnly()
  async get(@CurrentStaff() actor: SignedInStaff, @PropertyId() propertyId: string) {
    return { property: await this.settings.get(actor, propertyId) };
  }

  @Put(':propertyId/settings/basic')
  @OwnerOnly()
  async saveBasic(@CurrentStaff() actor: SignedInStaff, @PropertyId() propertyId: string, @Body() body: BasicSettingsDto) {
    return { property: await this.settings.update(actor, propertyId, 'basic', body) };
  }

  @Put(':propertyId/settings/contact')
  @OwnerOnly()
  async saveContact(@CurrentStaff() actor: SignedInStaff, @PropertyId() propertyId: string, @Body() body: ContactSettingsDto) {
    return { property: await this.settings.update(actor, propertyId, 'contact', body) };
  }

  @Put(':propertyId/settings/policies')
  @OwnerOnly()
  async savePolicies(@CurrentStaff() actor: SignedInStaff, @PropertyId() propertyId: string, @Body() body: PoliciesSettingsDto) {
    return { property: await this.settings.update(actor, propertyId, 'policies', body) };
  }

  @Put(':propertyId/settings/amenities')
  @OwnerOnly()
  async saveAmenities(@CurrentStaff() actor: SignedInStaff, @PropertyId() propertyId: string, @Body() body: AmenitiesSettingsDto) {
    return { property: await this.settings.update(actor, propertyId, 'amenities', body) };
  }

  @Put(':propertyId/settings/integrations')
  @OwnerOnly()
  async saveIntegrations(@CurrentStaff() actor: SignedInStaff, @PropertyId() propertyId: string, @Body() body: IntegrationsSettingsDto) {
    return { property: await this.settings.update(actor, propertyId, 'integrations', body) };
  }

  @Put(':propertyId/settings/advanced')
  @OwnerOnly()
  async saveAdvanced(@CurrentStaff() actor: SignedInStaff, @PropertyId() propertyId: string, @Body() body: AdvancedSettingsDto) {
    return { property: await this.settings.update(actor, propertyId, 'advanced', body) };
  }

  // Inactive hides the property from the website and booking channels.
  @Put(':propertyId/status')
  @OwnerOnly()
  async setStatus(@CurrentStaff() actor: SignedInStaff, @PropertyId() propertyId: string, @Body() body: PropertyStatusDto) {
    return { property: await this.settings.setStatus(actor, propertyId, body.status) };
  }
}
