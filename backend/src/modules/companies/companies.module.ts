import { Module } from '@nestjs/common';
import { CompaniesRepository } from './companies.repository.js';
import { CompaniesService } from './companies.service.js';

@Module({
  providers: [CompaniesRepository, CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
