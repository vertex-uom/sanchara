import { Module } from '@nestjs/common';
import { SubscriptionsRepository } from './subscriptions.repository.js';
import { SubscriptionsService } from './subscriptions.service.js';

@Module({
  providers: [SubscriptionsRepository, SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
