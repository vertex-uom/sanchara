import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import { NestFactory } from '@nestjs/core';
import { plainToInstance, Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength, validateSync } from 'class-validator';
import { AppModule } from './app.module.js';
import { normaliseEmail } from './common/validation/normalise.js';
import { AdminsService } from './modules/auth/admins/admins.service.js';
import { PASSWORD_MAX, PASSWORD_MIN } from './modules/auth/auth.policy.js';
import { PasswordService } from './modules/auth/services/password.service.js';

// Creates a platform admin (there is no admin sign-up). Run while the api is up:
//   make admin email=you@example.com name="Your Name"
// The password comes from ADMIN_PASSWORD, or a random one is printed once.
class NewAdmin {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? normaliseEmail(value) : value))
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(254)
  email: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 120, { message: 'name must be 1 to 120 characters' })
  fullName: string;

  @IsString()
  @Length(PASSWORD_MIN, PASSWORD_MAX, { message: `ADMIN_PASSWORD must be ${PASSWORD_MIN} to ${PASSWORD_MAX} characters` })
  password: string;
}

async function createAdmin() {
  const { values } = parseArgs({ options: { email: { type: 'string' }, name: { type: 'string' } } });
  const generated = !process.env['ADMIN_PASSWORD'];
  const input = plainToInstance(NewAdmin, {
    email: values.email ?? '',
    fullName: values.name ?? '',
    password: process.env['ADMIN_PASSWORD'] ?? randomBytes(18).toString('base64url'),
  });
  const errors = validateSync(input);
  if (errors.length > 0) {
    throw new Error(errors.flatMap((error) => Object.values(error.constraints ?? {})).join('; '));
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });
  try {
    const hash = await app.get(PasswordService).hash(input.password);
    const admin = await app.get(AdminsService).create({ fullName: input.fullName, email: input.email }, hash);
    // Plain stdout: the app context only logs warnings and errors.
    console.log(`Created platform admin ${admin.email}.`);
    if (generated) console.log(`Password (shown once, store it safely): ${input.password}`);
  } finally {
    await app.close();
  }
}

await createAdmin().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
