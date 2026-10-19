// Pure host classification, shared by proxy.ts. No I/O: tenant lookup happens
// in the site layout via the API.

export type AppTarget =
  | { app: "central" }
  | { app: "backoffice" }
  | { app: "admin" }
  | { app: "site"; host: string };

const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN ?? "sanchara.localhost";
const BACKOFFICE_HOST = process.env.BACKOFFICE_HOST ?? "backoffice.localhost";
const ADMIN_HOST = process.env.ADMIN_HOST ?? "admin.localhost";

export function normalizeHost(raw: string): string {
  return raw.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

export function resolveHost(rawHost: string): AppTarget {
  const host = normalizeHost(rawHost);

  if (host === PLATFORM_DOMAIN || host === `www.${PLATFORM_DOMAIN}`) {
    return { app: "central" };
  }
  if (host === BACKOFFICE_HOST) return { app: "backoffice" };
  if (host === ADMIN_HOST) return { app: "admin" };
  // Dev convenience: plain localhost serves the central site.
  if (host === "localhost" && process.env.NODE_ENV !== "production") {
    return { app: "central" };
  }

  // {company}.PLATFORM_DOMAIN and custom domains are both resolved by host.
  return { app: "site", host };
}

// Default company site host: {subdomain}.PLATFORM_DOMAIN.
export function companySiteHost(subdomain: string): string {
  return `${subdomain}.${PLATFORM_DOMAIN}`;
}

export function internalPrefix(target: AppTarget): string {
  return target.app === "site"
    ? `/site/${encodeURIComponent(target.host)}`
    : `/${target.app}`;
}
