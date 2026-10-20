import { Injectable } from '@nestjs/common';
import { AppConfig } from '../../common/config/app-config.service.js';

// Subdomains of the platform domain that are not company sites.
const RESERVED_LABELS = new Set(['admin', 'backoffice', 'api']);
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

// Host → company resolution. For now only config-based platform hosts; custom
// domains are checked here once the domains table exists.
@Injectable()
export class DomainsService {
  constructor(private readonly config: AppConfig) {}

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
