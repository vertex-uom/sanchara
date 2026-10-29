import { Suspense } from "react";
import { Mail } from "lucide-react";
import { formatRelativeDateTime } from "@/lib/format/dates";
import { single, type SearchParams } from "@/lib/routes/search-params";
import { AdminPageHeader } from "../components/page-header";
import { AdminPagination } from "../components/pagination";
import { AdminSubTabs } from "../components/sub-tabs";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { ICON_STROKE } from "../sidebar-modes";
import { listContactMessages, type ContactMessage, type ContactMessageStatus } from "../server/contact-messages";
import { MarkButton } from "./mark-button";

const SUBJECT_LABELS: Record<ContactMessage["subject"], string> = {
  "general-inquiry": "General inquiry",
  support: "Support",
  sales: "Sales",
  feedback: "Feedback",
  other: "Other",
};

const STATUSES: ContactMessageStatus[] = ["open", "handled", "all"];

function href(status: ContactMessageStatus, page = 1) {
  const query = new URLSearchParams();
  if (status !== "open") query.set("status", status);
  if (page > 1) query.set("page", String(page));
  return `${adminNavItem("contact-messages").href}${query.size ? `?${query}` : ""}`;
}

// Contact Messages: what visitors sent from the central site's contact form,
// newest first. The team replies by email and marks each one handled.
export function ContactMessagesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const item = adminNavItem("contact-messages");
  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader title={item.pageTitle ?? item.label} description={item.description} />
      <Suspense fallback={<AdminSkeleton className="h-160 rounded-[14px]" />}>
        <Messages searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Messages({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const status = STATUSES.find((option) => option === single(query.status)) ?? "open";
  const page = Math.max(Number.parseInt(single(query.page) ?? "1", 10) || 1, 1);
  const result = await listContactMessages(status, page);
  const now = new Date();

  return (
    <>
      <AdminSubTabs
        label="Message filters"
        active={status}
        tabs={[
          { key: "open", label: "Open", count: result.open, href: href("open") },
          { key: "handled", label: "Handled", href: href("handled") },
          { key: "all", label: "All", href: href("all") },
        ]}
      />
      <AdminCard aria-labelledby="contact-messages-title">
        <AdminCardHeader id="contact-messages-title" icon={Mail} title="Messages" chip={<AdminChip tone="neutral">{result.total}</AdminChip>} />
        {result.items.length === 0 ? (
          <p className="py-8 text-center text-xs text-admin-muted-text">{status === "open" ? "No open messages. Everything is handled." : "No messages here."}</p>
        ) : (
          <ul className="divide-y divide-admin-border">
            {result.items.map((message) => (
              <li key={message.id} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-start sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[12.5px]">
                    <span className="font-semibold text-admin-heading">{message.name}</span>
                    <a href={`mailto:${message.email}`} className="focus-ring rounded-sm break-all text-admin-primary underline-offset-4 hover:underline">
                      {message.email}
                    </a>
                    <AdminChip tone="info">{SUBJECT_LABELS[message.subject]}</AdminChip>
                  </p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed whitespace-pre-line text-admin-body">{message.message}</p>
                  <p className="mt-1.5 text-[11px] text-admin-muted-text">
                    <Mail aria-hidden="true" strokeWidth={ICON_STROKE} className="mr-1 inline size-3.5 align-[-2px]" />
                    <time dateTime={message.sentAt}>{formatRelativeDateTime(message.sentAt, now)}</time>
                    {message.handledAt ? (
                      <>
                        {" "}
                        · handled by {message.handledBy} <time dateTime={message.handledAt}>{formatRelativeDateTime(message.handledAt, now)}</time>
                      </>
                    ) : null}
                  </p>
                </div>
                <MarkButton id={message.id} handled={message.handledAt !== null} from={message.name} />
              </li>
            ))}
          </ul>
        )}
        <AdminPagination result={result} hrefFor={(target) => href(status, target)} label="Messages pages" />
      </AdminCard>
    </>
  );
}
