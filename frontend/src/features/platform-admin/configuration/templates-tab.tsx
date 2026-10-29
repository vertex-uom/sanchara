import { Suspense } from "react";
import { LayoutTemplate } from "lucide-react";
import { formatDateOnly } from "@/lib/format/dates";
import { AdminCard, AdminChip, AdminSkeleton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import { listWebsiteTemplates } from "../server/configuration";

// Website templates tab: what the team builds a company site from when an
// owner asks ("build a company website on request"). Read-only; the build
// itself starts from the website request in Accounts & Enforcement.
export function TemplatesTab() {
  return (
    <section aria-labelledby="templates-title">
      <h2 id="templates-title" className="sr-only">
        Website templates
      </h2>
      <Suspense fallback={<TemplatesSkeleton />}>
        <TemplateCards />
      </Suspense>
    </section>
  );
}

async function TemplateCards() {
  const templates = await listWebsiteTemplates();
  return (
    <>
      <ul className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <li key={template.id}>
            <AdminCard aria-labelledby={`${template.id}-title`} className="flex h-full flex-col gap-3">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-admin-primary-soft text-admin-primary">
                  <LayoutTemplate strokeWidth={ICON_STROKE} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id={`${template.id}-title`} className="text-base font-semibold text-admin-heading">
                      {template.name}
                    </h3>
                    <AdminChip tone="neutral">{template.companies.toLocaleString("en-US")} sites</AdminChip>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-admin-muted-text">{template.suitedTo}</p>
                </div>
              </div>
              <p className="text-[12.5px] leading-snug text-admin-body">{template.description}</p>
              <div className="mt-auto flex flex-col gap-2 border-t border-admin-border pt-3">
                <p className="text-[11px] font-medium text-admin-muted-text">Pages</p>
                <ul className="flex flex-wrap gap-1.5">
                  {template.pages.map((page) => (
                    <li key={page}>
                      <AdminChip tone="info">{page}</AdminChip>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-admin-muted-text">
                  Updated <time dateTime={template.updatedAt}>{formatDateOnly(template.updatedAt)}</time>
                </p>
              </div>
            </AdminCard>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11.5px] text-admin-muted-text">Templates are maintained by the platform team. A site is built from one when an owner&apos;s website request is picked up in Accounts &amp; Enforcement.</p>
    </>
  );
}

function TemplatesSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-4 md:grid-cols-2">
      <span className="sr-only">Loading website templates</span>
      {Array.from({ length: 4 }, (_, i) => (
        <AdminSkeleton key={i} className="h-55 rounded-[14px]" />
      ))}
    </div>
  );
}
