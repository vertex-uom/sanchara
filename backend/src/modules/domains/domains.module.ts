import { Module } from '@nestjs/common';
import { DomainsService } from './domains.service.js';

@Module({
  providers: [DomainsService],
  exports: [DomainsService],
})
export class DomainsModule {}
