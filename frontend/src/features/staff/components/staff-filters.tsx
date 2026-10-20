import Form from "next/form";
import { Search } from "lucide-react";
import type { StaffRole } from "@/lib/auth/staff";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { ChipLink } from "@/components/ui/chip-link";
import { ROLE_META } from "../config";
import { staffHref, type StaffFilters as Filters } from "../staff-params";

const CHIPS: { label: string; role: StaffRole | null; inactive: boolean }[] = [
  { label: "All", role: null, inactive: false },
  { label: ROLE_META.owner.label, role: "owner", inactive: false },
  { label: ROLE_META.manager.label, role: "manager", inactive: false },
  { label: ROLE_META["front-desk"].label, role: "front-desk", inactive: false },
  { label: "Inactive", role: null, inactive: true },
];

// Chips are links that keep the search; the search is a GET form that keeps the chip.
export function StaffFilters({ filters }: { filters: Filters }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <ul aria-label="Filter staff" className="flex flex-wrap gap-2">
        {CHIPS.map(({ label, role, inactive }) => (
          <li key={label}>
            <ChipLink
              href={staffHref({ role, inactive, q: filters.q })}
              active={role === filters.role && inactive === filters.inactive}
            >
              {label}
            </ChipLink>
          </li>
        ))}
      </ul>
      <Form key={filters.q} action={COMPANY_PATHS.staff} scroll={false} role="search" className="relative w-full sm:w-60">
        {filters.role ? <input type="hidden" name="role" value={filters.role} /> : null}
        {filters.inactive ? <input type="hidden" name="status" value="inactive" /> : null}
        <label htmlFor="staff-search" className="sr-only">
          Search staff by name or email
        </label>
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-office-icon" />
        <input
          id="staff-search"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Search staff…"
          className="focus-ring h-11 w-full rounded-lg border border-border bg-card pr-3 pl-10 text-sm text-foreground placeholder:text-office-muted md:h-10"
        />
      </Form>
    </div>
  );
}
