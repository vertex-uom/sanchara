import { Global, Module } from '@nestjs/common';
import { DomainEvents } from './domain-events.js';

// In-process domain events, shared by every module.
@Global()
@Module({
  providers: [DomainEvents],
  exports: [DomainEvents],
})
export class EventsModule {}
