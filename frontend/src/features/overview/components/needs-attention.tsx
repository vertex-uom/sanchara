import { Suspense } from "react";
import { CalendarX, CircleAlert, Clock, FileText, MessageCircle, type LucideIcon } from "lucide-react";
import { formatDateOnly } from "@/lib/format/dates";
import { formatPercent } from "@/lib/format/numbers";
import { COMPANY_PATHS, propertyPath } from "@/lib/routes/backoffice";
import { EmptyState, Skeleton, WidgetCard, WidgetHeader, WidgetLink } from "@/components/ui/widget";
import { getAttentionItems } from "../server/attention";
import type { AttentionItem } from "../types";

type Presented = { icon: LucideIcon; message: string; action: { label: string; href: string } };

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

function present(item: AttentionItem, propertyId: string): Presented {
  switch (item.kind) {
    case "enquiry-holds-expiring":
      return {
        icon: Clock,
        message: `${item.count} ${plural(item.count, "enquiry hold expires", "enquiry holds expire")} today`,
        action: { label: "View calendar", href: propertyPath(propertyId, "calendar") },
      };
    case "payment-pending":
      return {
        icon: CircleAlert,
        message: `${item.count} ${plural(item.count, "booking", "bookings")} pending payment (${item.holdMinutes}-min hold)`,
        action: { label: "View reservations", href: propertyPath(propertyId, "reservations?view=pending-payment") },
      };
    case "no-shows-marked":
      return {
        icon: CalendarX,
        message: `${item.count} ${plural(item.count, "no-show", "no-shows")} marked this morning`,
        action: { label: "View reservations", href: propertyPath(propertyId, "reservations?view=no-shows") },
      };
    case "whatsapp-usage":
      return {
        icon: MessageCircle,
        message: `WhatsApp usage at ${formatPercent(item.usedRatio, 0)} of monthly limit`,
        action: { label: "View subscription", href: COMPANY_PATHS.subscription },
      };
    case "subscription-renewal":
      return {
        icon: FileText,
        message: `Subscription renews on ${formatDateOnly(item.renewsOn)}`,
        action: { label: "View subscription", href: COMPANY_PATHS.subscription },
      };
  }
}

export function NeedsAttention({ propertyId }: { propertyId: string }) {
  return (
    <WidgetCard aria-labelledby="attention-title" className="h-full">
      <WidgetHeader id="attention-title" title="Needs attention" />
      <Suspense fallback={<AttentionSkeleton />}>
        <AttentionList propertyId={propertyId} />
      </Suspense>
    </WidgetCard>
  );
}

async function AttentionList({ propertyId }: { propertyId: string }) {
  const items = await getAttentionItems(propertyId);
  if (items.length === 0) return <EmptyState>Nothing needs your attention right now.</EmptyState>;

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const { icon: Icon, message, action } = present(item, propertyId);
        return (
          <li
            key={item.id}
            className="flex flex-col gap-x-4 rounded-xl border border-brand-lagoon/50 px-3 py-1 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="flex items-center gap-3 pt-2 text-sm sm:pt-0">
              <Icon aria-hidden="true" className="size-5 shrink-0 text-brand-teal" />
              {message}
            </p>
            <WidgetLink href={action.href} srContext={`(${message})`} className="shrink-0 self-end sm:self-auto">
              {action.label}
            </WidgetLink>
          </li>
        );
      })}
    </ul>
  );
}

function AttentionSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading items that need attention</span>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-12 rounded-xl" />
      ))}
    </div>
  );
}
