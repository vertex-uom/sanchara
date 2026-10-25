import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AppConfig } from './common/config/app-config.service.js';
import { CompaniesService } from './modules/companies/companies.service.js';
import { StaffInvitesService } from './modules/staff/staff-invites.service.js';
import { StaffService } from './modules/staff/staff.service.js';

// Development data: a demo company and an invite for its Owner (the invite link
// is printed by the dev mail sender). Safe to re-run: an Owner who hasn't
// accepted yet gets a fresh link. Run with `make seed` while the api is up.
const DEMO_COMPANY = { name: 'Demo Hotels', subdomain: 'demo' };
const DEMO_OWNER = { fullName: 'Demo Owner', email: 'owner@demo.example.com' };

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  const logger = new Logger('Seed');
  try {
    if (app.get(AppConfig).nodeEnv !== 'development') throw new Error('The dev seed runs only with NODE_ENV=development');
    const companies = app.get(CompaniesService);
    const staff = app.get(StaffService);
    const invites = app.get(StaffInvitesService);

    const company = (await companies.findBySubdomain(DEMO_COMPANY.subdomain)) ?? (await companies.create(DEMO_COMPANY));
    const owner = await staff.findByEmail(DEMO_OWNER.email);
    if (!owner) {
      await invites.inviteOwner(company.id, DEMO_OWNER);
      logger.log(`Invited ${DEMO_OWNER.email} as Owner of ${company.name}; open the link above to set a password.`);
    } else if (owner.status === 'INVITED') {
      await invites.send(owner);
      logger.log(`Sent a new invite link to ${owner.email}.`);
    } else {
      logger.log(`${owner.email} is already ${owner.status.toLowerCase()}; sign in at the Back Office.`);
    }
  } finally {
    await app.close();
  }
}
await seed();
