import {
  Calendar,
  CalendarDays,
  CreditCard,
  Pencil,
  Plus,
  RotateCcw,
  Tag,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { formatDateOnly, formatDateTimeParts } from "@/lib/format/dates";
import { formatMoney } from "@/lib/format/money";
import { cn } from "@/lib/utils";
import { ACTION_LABELS, CATEGORY_LABELS } from "../config";
import type { AuditAction, AuditCategory, AuditValue } from "../types";

// Pieces shared by the table, the phone cards and the detail panel.

// The audit design's icons (they differ from the Overview's recent-activity icons).
export const CATEGORY_ICONS: Record<AuditCategory, LucideIcon> = {
  rate: Tag,
  reservation: Calendar,
  payment: CreditCard,
  refund: RotateCcw,
  block: CalendarDays,
  staff: Users,
};

export function CategoryLabel({ category }: { category: AuditCategory }) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <span className="flex items-center gap-2 text-sm">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-office-icon" />
      {CATEGORY_LABELS[category]}
    </span>
  );
}

const ACTION_STYLES: Record<AuditAction, { icon: LucideIcon; className: string }> = {
  created: { icon: Plus, className: "bg-office-success-soft text-office-success-text" },
  updated: { icon: Pencil, className: "bg-office-tint-blue text-office-ink-blue" },
  deleted: { icon: Trash2, className: "bg-office-danger-soft text-office-danger-text" },
};

// The word and icon carry the action; colour only reinforces it.
export function ActionChip({ action }: { action: AuditAction }) {
  const { icon: Icon, className } = ACTION_STYLES[action];
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 rounded-md px-2 text-[0.8125rem] font-medium whitespace-nowrap", className)}>
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {ACTION_LABELS[action]}
    </span>
  );
}

// "06 Oct 2026" over "11:35 AM".
export function AuditDateTime({ iso }: { iso: string }) {
  const { date, time } = formatDateTimeParts(iso);
  return (
    <time dateTime={iso} className="block whitespace-nowrap">
      <span className="block text-sm font-semibold">{date}</span>
      <span className="block text-xs text-office-muted">{time}</span>
    </time>
  );
}

// A Before/After value; empty shows a dash that reads as "none".
export function AuditValueText({ value }: { value: AuditValue | null }) {
  if (!value) {
    return (
      <>
        <span aria-hidden="true">—</span>
        <span className="sr-only">none</span>
      </>
    );
  }
  if (value.kind === "money") return <>{formatMoney(value.money)}</>;
  if (value.kind === "date") return <>{formatDateOnly(value.date)}</>;
  return <>{value.text}</>;
}
