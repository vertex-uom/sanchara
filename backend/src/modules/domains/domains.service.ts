import { Injectable } from '@nestjs/common';
import { AppConfig } from '../../common/config/app-config.service.js';

// Subdomains of the platform domain that are not company sites (the database
// refuses them too: companies_subdomain_reserved_check).
export const RESERVED_SUBDOMAINS: readonly string[] = ['admin', 'backoffice', 'api', 'www'];
const RESERVED_LABELS = new Set(RESERVED_SUBDOMAINS);
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

// What platform onboarding accepts for a new company: 3–40 characters,
// lowercase letters, digits and inner hyphens.
export const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export type SubdomainCheck = { valid: true } | { valid: false; reason: 'invalid' | 'reserved' };

// Host → company resolution. For now only config-based platform hosts; custom
// domains are checked here once the domains table exists.
@Injectable()
export class DomainsService {
  constructor(private readonly config: AppConfig) {}

  // Format and reserved-name rules only; whether a company already uses it is
  // the companies module's question.
  checkSubdomain(label: string): SubdomainCheck {
    if (!SUBDOMAIN_PATTERN.test(label)) return { valid: false, reason: 'invalid' };
    if (RESERVED_LABELS.has(label)) return { valid: false, reason: 'reserved' };
    return { valid: true };
  }

  // The company site's host, e.g. palm.sanchara.lk.
  siteHost(subdomain: string): string {
    return `${subdomain}.${this.config.platformDomain.toLowerCase()}`;
  }

  get platformDomain(): string {
    return this.config.platformDomain.toLowerCase();
  }

  // Central site and {company}.PLATFORM_DOMAIN sites are valid redirect targets.
  isRegisteredHost(host: string): boolean {
    const platform = this.config.platformDomain.toLowerCase();
    const name = host.toLowerCase().replace(/\.$/, '');
    if (name === platform || name === `www.${platform}`) return true;
    if (!name.endsWith(`.${platform}`)) return false;
    const label = name.slice(0, -(platform.length + 1));
    return LABEL.test(label) && !RESERVED_LABELS.has(label);
  }
}
