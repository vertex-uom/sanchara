import { Suspense } from "react";
import Link from "next/link";
import { ExternalLink, Link2 } from "lucide-react";
import { companySiteHost } from "@/lib/tenant/hosts";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { cn } from "@/lib/utils";
import { Skeleton, WidgetCard, WidgetHeader, WidgetLink } from "@/components/ui/widget";
import { getWebsiteStatus } from "../server/website";
import type { WebsiteStatus } from "../types";

// TODO(confirm): production sites are https; dev hosts have no TLS.
const SITE_PROTOCOL = process.env.NODE_ENV === "production" ? "https" : "http";

export function WebsiteCard() {
  return (
    <WidgetCard aria-labelledby="website-title" className="h-full">
      <Suspense
        fallback={
          <>
            <WidgetHeader id="website-title" title="Website" />
            <Skeleton className="h-28 rounded-xl" />
          </>
        }
      >
        <WebsiteDetails />
      </Suspense>
    </WidgetCard>
  );
}

async function WebsiteDetails() {
  const website = await getWebsiteStatus();
  const host = companySiteHost(website.subdomain);
  const siteUrl = `${SITE_PROTOCOL}://${host}`;

  return (
    <>
      <WidgetHeader
        id="website-title"
        title="Website"
        action={
          website.published ? (
            <WidgetLink href={siteUrl} external>
              View site
            </WidgetLink>
          ) : undefined
        }
      />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-3 rounded-xl border border-border p-4">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-office-chip text-office-icon">
            <Link2 className="size-5" />
          </span>
          <div className="min-w-0">
            {website.published ? (
              <Link
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-md font-semibold break-all underline-offset-4 hover:underline"
              >
                {host}
                <span className="sr-only"> (opens in a new tab)</span>
                <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
              </Link>
            ) : (
              <p className="font-semibold break-all">{host}</p>
            )}
            <p className="text-sm text-office-accent">{websiteMessage(website)}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <BookingEngineBadge status={website.bookingEngine} />
          <Link
            href={COMPANY_PATHS.website}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-office-nav-active motion-reduce:transition-none"
          >
            Edit website
          </Link>
        </div>
      </div>
    </>
  );
}

function websiteMessage({ published, bookingEngine }: WebsiteStatus) {
  if (!published) return "Your website is not published yet.";
  return bookingEngine === "live"
    ? "Your website is live and accepting bookings."
    : "Your website is live. Online booking is turned off.";
}

function BookingEngineBadge({ status }: { status: WebsiteStatus["bookingEngine"] }) {
  const live = status === "live";
  return (
    <p
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm",
        live ? "bg-office-success-soft text-office-text" : "bg-muted text-muted-foreground",
      )}
    >
      <span aria-hidden="true" className={cn("size-2.5 rounded-full", live ? "bg-office-success-dot" : "bg-neutral-400")} />
      Booking Engine: <span className={cn("font-semibold", live && "text-office-success")}>{live ? "Live" : "Offline"}</span>
    </p>
  );
}
