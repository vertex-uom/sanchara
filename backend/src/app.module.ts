import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AppConfigModule } from './common/config/config.module.js';
import { EventsModule } from './common/events/events.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware.js';
import { createValidationPipe } from './common/pipes/validation.pipe.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { RedisModule } from './common/redis/redis.module.js';
import { SecurityModule } from './common/security/security.module.js';
import { HealthController } from './health/health.controller.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { GuestsModule } from './modules/guests/guests.module.js';
import { StaffModule } from './modules/staff/staff.module.js';
import { CapabilitiesModule } from './modules/capabilities/capabilities.module.js';
import { CompaniesModule } from './modules/companies/companies.module.js';
import { PropertiesModule } from './modules/properties/properties.module.js';
import { DomainsModule } from './modules/domains/domains.module.js';
import { WebsiteModule } from './modules/website/website.module.js';
import { ContactModule } from './modules/contact/contact.module.js';
import { RoomTypesModule } from './modules/room-types/room-types.module.js';
import { UnitsModule } from './modules/units/units.module.js';
import { RatePlansModule } from './modules/rate-plans/rate-plans.module.js';
import { SeasonsModule } from './modules/seasons/seasons.module.js';
import { RestrictionsModule } from './modules/restrictions/restrictions.module.js';
import { BlocksModule } from './modules/blocks/blocks.module.js';
import { PackagesModule } from './modules/packages/packages.module.js';
import { AvailabilityModule } from './modules/availability/availability.module.js';
import { PricingModule } from './modules/pricing/pricing.module.js';
import { TaxModule } from './modules/tax/tax.module.js';
import { QuotationsModule } from './modules/quotations/quotations.module.js';
import { ReservationsModule } from './modules/reservations/reservations.module.js';
import { EnquiriesModule } from './modules/enquiries/enquiries.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { RefundLogModule } from './modules/refund-log/refund-log.module.js';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module.js';
import { MessagingModule } from './modules/messaging/messaging.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { DirectoryModule } from './modules/directory/directory.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { AnnouncementsModule } from './modules/announcements/announcements.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { PlatformAdminModule } from './modules/platform-admin/platform-admin.module.js';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    RedisModule,
    SecurityModule,
    EventsModule,
    AuthModule,
    GuestsModule,
    StaffModule,
    CapabilitiesModule,
    CompaniesModule,
    PropertiesModule,
    DomainsModule,
    WebsiteModule,
    ContactModule,
    RoomTypesModule,
    UnitsModule,
    RatePlansModule,
    SeasonsModule,
    RestrictionsModule,
    BlocksModule,
    PackagesModule,
    AvailabilityModule,
    PricingModule,
    TaxModule,
    QuotationsModule,
    ReservationsModule,
    EnquiriesModule,
    PaymentsModule,
    RefundLogModule,
    SubscriptionsModule,
    MessagingModule,
    ReviewsModule,
    DirectoryModule,
    ReportsModule,
    AuditModule,
    AnnouncementsModule,
    PlatformAdminModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, RequestLoggingMiddleware).forRoutes('*path');
  }
}
