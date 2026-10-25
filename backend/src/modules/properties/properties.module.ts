import { Module } from '@nestjs/common';
import { PropertiesRepository } from './properties.repository.js';
import { PropertiesService } from './properties.service.js';

@Module({
  providers: [PropertiesRepository, PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
