import { Module } from '@nestjs/common';
import { GuestsRepository } from './guests.repository.js';
import { GuestsService } from './guests.service.js';

@Module({
  providers: [GuestsRepository, GuestsService],
  exports: [GuestsService],
})
export class GuestsModule {}
