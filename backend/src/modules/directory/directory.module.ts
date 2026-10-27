import { Module } from '@nestjs/common';
import { DomainsModule } from '../domains/domains.module.js';
import { PropertiesModule } from '../properties/properties.module.js';
import { DirectoryController } from './directory.controller.js';
import { DirectoryRepository } from './directory.repository.js';
import { DirectoryService } from './directory.service.js';

@Module({
  imports: [PropertiesModule, DomainsModule],
  controllers: [DirectoryController],
  providers: [DirectoryRepository, DirectoryService],
})
export class DirectoryModule {}
