import { plainToInstance, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUrl, Max, Min, MinLength, validateSync } from 'class-validator';

// Every variable the API reads. The app refuses to start if one is missing or invalid.
export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: 'development' | 'test' | 'production' = 'development';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsUrl({ protocols: ['postgresql', 'postgres'], require_tld: false })
  DATABASE_URL: string;

  @IsUrl({ protocols: ['redis', 'rediss'], require_tld: false })
  REDIS_URL: string;

  // Web app origin, used for links in emails (e.g. password reset).
  @IsUrl({ require_tld: false })
  WEB_APP_URL: string;

  // Company sites live on {company}.PLATFORM_DOMAIN.
  @IsString()
  @MinLength(1)
  PLATFORM_DOMAIN: string;

  @IsString()
  @MinLength(1)
  GOOGLE_CLIENT_ID: string;

  @IsString()
  @MinLength(1)
  GOOGLE_CLIENT_SECRET: string;

  // The Next.js route Google redirects back to (BFF).
  @IsUrl({ require_tld: false })
  GOOGLE_CALLBACK_URL: string;

  // Express "trust proxy" value, e.g. "loopback, uniquelocal". Empty = trust nobody.
  @IsOptional()
  @IsString()
  TRUST_PROXY?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length > 0) {
    // Names only: values may be secrets.
    const names = errors.map((error) => error.property).join(', ');
    throw new Error(`Invalid environment variables: ${names}`);
  }
  return env;
}
