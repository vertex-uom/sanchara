import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { StaffModule } from '../staff/staff.module.js';
import { WebsiteAssistanceController } from './website-assistance.controller.js';
import { WebsiteAssistanceRepository } from './website-assistance.repository.js';
import { WebsiteAssistanceService } from './website-assistance.service.js';

// Company websites. So far: requests for WEMIXT to build one (website assistance).
@Module({
  imports: [StaffModule, AuditModule],
  controllers: [WebsiteAssistanceController],
  providers: [WebsiteAssistanceService, WebsiteAssistanceRepository],
  exports: [WebsiteAssistanceService],
})
export class WebsiteModule {}
