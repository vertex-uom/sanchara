import Form from "next/form";
import Link from "next/link";
import { Calendar, Search } from "lucide-react";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { fieldClass, NativeSelect } from "@/components/ui/field";
import { FlatCard } from "@/components/ui/widget";
import type { AuditFilters as Filters } from "../audit-params";
import { ACTION_LABELS, AUDIT_ACTIONS, AUDIT_CATEGORIES, CATEGORY_LABELS } from "../config";
import type { AuditPage } from "../types";
import { StaffOrRoleSelects } from "./staff-or-role-selects";

const dateInputClass = "focus-ring min-w-0 flex-1 rounded-sm bg-transparent text-sm text-foreground";

// One GET form, so the filters work without JS. Selects don't submit on change
// (WCAG 3.2.2); Apply or Enter in the search does.
export function AuditFilters({ filters, actors }: { filters: Filters; actors: AuditPage["actors"] }) {
  const { category, from, to, staffId, role, action, q } = filters;
  return (
    <FlatCard aria-label="Audit filters">
      <Form
        key={[category, from, to, staffId, role, action, q].join("|")}
        action={COMPANY_PATHS.audit}
        scroll={false}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center gap-3">
          <fieldset className="w-full sm:w-auto">
            <legend className="sr-only">Date range</legend>
            <div className="flex h-11 items-center gap-2 rounded-md border border-border bg-card px-3 md:h-10">
              <Calendar aria-hidden="true" className="size-5 shrink-0 text-office-icon" />
              <label htmlFor="audit-from" className="sr-only">
                From
              </label>
              <input id="audit-from" name="from" type="date" required defaultValue={from} className={dateInputClass} />
              <span aria-hidden="true" className="text-office-muted">
                –
              </span>
              <label htmlFor="audit-to" className="sr-only">
                To
              </label>
              <input id="audit-to" name="to" type="date" required defaultValue={to} className={dateInputClass} />
            </div>
          </fieldset>
          <NativeSelect
            id="audit-category"
            name="category"
            label="Category"
            labelHidden
            defaultValue={category ?? ""}
            options={[
              { value: "", label: "All categories" },
              ...AUDIT_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] })),
            ]}
            className="w-full sm:w-44"
          />
          <StaffOrRoleSelects staffId={staffId} role={role} actors={actors} />
          <NativeSelect
            id="audit-action"
            name="action"
            label="Action"
            labelHidden
            defaultValue={action ?? ""}
            options={[{ value: "", label: "All actions" }, ...AUDIT_ACTIONS.map((value) => ({ value, label: ACTION_LABELS[value] }))]}
            className="w-full sm:w-40"
          />
          <Link
            href={COMPANY_PATHS.audit}
            scroll={false}
            className="focus-ring inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-office-primary underline underline-offset-4 xl:ml-auto"
          >
            Clear filters
          </Link>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div role="search" className="relative flex-1">
            <label htmlFor="audit-search" className="sr-only">
              Search by booking ID, unit or staff name
            </label>
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-office-icon" />
            <input
              id="audit-search"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search by booking ID, unit, staff name…"
              className={cn(fieldClass, "pr-3 pl-10 placeholder:text-office-muted")}
            />
          </div>
          <Button type="submit" variant="office" className="h-11 rounded-md px-5 md:h-10">
            Apply
          </Button>
        </div>
      </Form>
    </FlatCard>
  );
}
