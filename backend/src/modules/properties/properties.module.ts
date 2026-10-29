import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { StaffModule } from '../staff/staff.module.js';
import { PropertiesController } from './properties.controller.js';
import { PropertiesRepository } from './properties.repository.js';
import { PropertiesService } from './properties.service.js';
import { PropertySettingsService } from './property-settings.service.js';

@Module({
  imports: [StaffModule, AuditModule],
  controllers: [PropertiesController],
  providers: [PropertiesRepository, PropertiesService, PropertySettingsService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
