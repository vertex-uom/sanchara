import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from './env.validation.js';

// Typed access to the validated environment. Inject this, not ConfigService.
@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  get nodeEnv() {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get isProduction() {
    return this.nodeEnv === 'production';
  }

  get port() {
    return this.config.get('PORT', { infer: true });
  }

  get databaseUrl() {
    return this.config.get('DATABASE_URL', { infer: true });
  }

  get redisUrl() {
    return this.config.get('REDIS_URL', { infer: true });
  }

  get webAppUrl() {
    return this.config.get('WEB_APP_URL', { infer: true });
  }

  get backofficeUrl() {
    return this.config.get('BACKOFFICE_URL', { infer: true });
  }

  get platformDomain() {
    return this.config.get('PLATFORM_DOMAIN', { infer: true });
  }

  get google() {
    return {
      clientId: this.config.get('GOOGLE_CLIENT_ID', { infer: true }),
      clientSecret: this.config.get('GOOGLE_CLIENT_SECRET', { infer: true }),
      callbackUrl: this.config.get('GOOGLE_CALLBACK_URL', { infer: true }),
      staffCallbackUrl: this.config.get('GOOGLE_STAFF_CALLBACK_URL', { infer: true }),
      adminCallbackUrl: this.config.get('GOOGLE_ADMIN_CALLBACK_URL', { infer: true }),
    };
  }
}
