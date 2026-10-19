import { List } from "lucide-react";
import { formatCount } from "@/lib/format/numbers";
import { ChipLink } from "@/components/ui/chip-link";
import { auditHref, type AuditFilters } from "../audit-params";
import { AUDIT_CATEGORIES, CATEGORY_LABELS } from "../config";
import type { AuditCategory, AuditPage } from "../types";
import { CATEGORY_ICONS } from "./audit-parts";

const CHIPS: { category: AuditCategory | null; label: string; icon: typeof List }[] = [
  { category: null, label: "All", icon: List },
  ...AUDIT_CATEGORIES.map((category) => ({ category, label: CATEGORY_LABELS[category], icon: CATEGORY_ICONS[category] })),
];

// Counts come with the data and use every filter except the category.
export function AuditChips({ filters, counts }: { filters: AuditFilters; counts: AuditPage["counts"] }) {
  return (
    <ul aria-label="Categories" className="flex flex-wrap gap-2">
      {CHIPS.map(({ category, label, icon: Icon }) => (
        <li key={label}>
          <ChipLink href={auditHref(filters, { category })} active={filters.category === category} variant="outline">
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {label} ({formatCount(counts[category ?? "all"])})
          </ChipLink>
        </li>
      ))}
    </ul>
  );
}
