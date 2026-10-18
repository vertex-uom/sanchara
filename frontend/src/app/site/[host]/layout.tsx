import { RootHtml } from "@/components/shell/root-html";
import "../../globals.css";

// Cache Components needs at least one value for a root param. Hosts are only known
// at runtime; underscores are invalid in hostnames, so this never matches a tenant.
// Later this can list active tenant hosts from the API for prerendering.
export function generateStaticParams() {
  return [{ host: "__placeholder__" }];
}

// Root layout for tenant sites ({company}.<platform-domain> and custom domains).
// Later: resolve the tenant by host via the API (cached, tagged 'tenant:<host>'),
// apply branding as CSS variables, notFound() for unknown hosts, and hide the
// Booking Engine when the company is suspended.
export default function SiteLayout({ children }: LayoutProps<"/site/[host]">) {
  return <RootHtml>{children}</RootHtml>;
}
