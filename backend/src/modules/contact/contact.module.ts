import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ContactController } from './contact.controller.js';
import { ContactService } from './contact.service.js';

// Contact form messages: sent from the central site, read in the admin console.
@Module({
  imports: [AuthModule],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
