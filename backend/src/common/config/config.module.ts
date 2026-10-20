import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfig } from './app-config.service.js';
import { validateEnv } from './env.validation.js';

// Env comes from docker compose (env_file + environment), not from a .env read here.
@Global()
@Module({
  imports: [ConfigModule.forRoot({ ignoreEnvFile: true, validate: validateEnv })],
  providers: [AppConfig],
  exports: [AppConfig],
})
export class AppConfigModule {}
