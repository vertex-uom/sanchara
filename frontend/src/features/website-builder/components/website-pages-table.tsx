import Link from "next/link";
import { ChevronRight, FileText, Plus } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { timeAgo } from "./template-status";
import { formCardClass } from "./template-fields";
import { WEBSITE_PAGES } from "./website-pages";

export type PageRow = {
  name: string;
  path: string;
  // Saved since the last publish.
  changed: boolean;
  views: number;
  lastEdited: Date | null;
  editHref: string;
};

const ICONS = Object.fromEntries(
  WEBSITE_PAGES.map((page) => [page.name, page.icon]),
);

// The site's menu pages with status, views and when they were last edited.
export function WebsitePagesTable({
  pages,
  addHref,
}: {
  pages: PageRow[];
  addHref: string;
}) {
  return (
    <section
      aria-labelledby="pages-title"
      className={cn(formCardClass, "min-w-0")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="pages-title" className="font-semibold text-office-icon">
            Pages
          </h2>
          <p className="text-xs text-office-muted">
            {pages.length} {pages.length === 1 ? "page" : "pages"} on your
            website
          </p>
        </div>
        <Button
          asChild
          variant="secondary"
          className="h-9 gap-1.5 bg-office-tint-teal px-3 text-sm font-semibold text-office-primary hover:bg-office-tint-teal/80"
        >
          <Link href={addHref}>
            <Plus aria-hidden="true" className="size-4" />
            Add page
          </Link>
        </Button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="bg-office-chip/60 text-xs text-office-muted">
              <th scope="col" className="rounded-l-lg px-3 py-2.5 font-medium">
                Page
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                Status
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                Views
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                Last edited
              </th>
              <th scope="col" className="rounded-r-lg px-3 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => {
              const Icon = ICONS[page.name] ?? FileText;
              return (
                <tr
                  key={page.name}
                  className="border-b border-office-meter-track/70 last:border-0"
                >
                  <th scope="row" className="px-3 py-3 font-normal">
                    <span className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-office-chip text-office-icon">
                        <Icon aria-hidden="true" className="size-4" />
                      </span>
                      <span>
                        <span className="block font-semibold text-office-icon">
                          {page.name}
                        </span>
                        <span className="block text-xs text-office-muted">
                          {page.path}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                        page.changed
                          ? "bg-office-tint-orange text-office-ink-orange"
                          : "bg-office-success-soft text-office-success-text",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-1.5 rounded-full",
                          page.changed
                            ? "bg-office-ink-orange"
                            : "bg-office-success-dot",
                        )}
                      />
                      {page.changed ? "Unpublished changes" : "Published"}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-semibold text-office-icon">
                    {page.views.toLocaleString("en-US")}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-office-muted">
                    {page.lastEdited ? lastEdited(page.lastEdited) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      href={page.editHref}
                      className="focus-ring inline-flex items-center gap-1 rounded-md text-sm font-semibold text-office-icon hover:text-office-primary"
                    >
                      Edit<span className="sr-only"> {page.name} page</span>
                      <ChevronRight aria-hidden="true" className="size-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// "2 hours ago", "Today, 10:12 AM" or "18 Oct".
function lastEdited(date: Date) {
  const hours = (Date.now() - date.getTime()) / 3_600_000;
  if (hours < 1) return timeAgo(date);
  if (hours < 6)
    return `${Math.round(hours)} ${Math.round(hours) === 1 ? "hour" : "hours"} ago`;
  if (date.toDateString() === new Date().toDateString()) {
    return `Today, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
