"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/format/money";
import { Button } from "@/components/ui/button";
import { FlatCard } from "@/components/ui/widget";
import { savePackageAction, type SavePackageState } from "../actions";
import { PACKAGE_LIMITS, PACKAGE_STATUSES, STATUS_META } from "../config";
import type { ItemKind, PackageDetail } from "../types";
import type { DayDraft, ItemDraft, PackageDraft } from "../validation";
import { ChipSelect, FieldError, InlineInput } from "./editor-fields";
import { ItineraryDay } from "./itinerary-day";
import { THEME_ICONS } from "./package-icons";

const STATUS_OPTIONS = PACKAGE_STATUSES.map((status) => ({ value: status, label: STATUS_META[status].label }));

const rupees = (amountMinor: number) => String(Math.round(amountMinor / 100));

function toDraft(pkg: PackageDetail): PackageDraft {
  return {
    name: pkg.name,
    tagline: pkg.tagline,
    status: pkg.status,
    nights: String(pkg.nights),
    days: pkg.days.map((day) => ({
      id: day.id,
      title: day.title,
      note: day.note,
      items: day.items.map((item) => ({
        id: item.id,
        kind: item.kind,
        name: item.name,
        description: item.description,
        payment: item.payment,
        price: item.price ? rupees(item.price.amountMinor) : "",
      })),
    })),
  };
}

const INITIAL: SavePackageState = { error: null, saved: 0 };

// Detail of the selected package, edited in place. Totals are the API's,
// so they refresh after a save. The page keys this by package id.
export function PackageEditor({ propertyId, pkg, deleteHref }: { propertyId: string; pkg: PackageDetail; deleteHref: string }) {
  const [state, formAction, pending] = useActionState(savePackageAction, INITIAL);
  const [version, setVersion] = useState(pkg.version);
  const [draft, setDraft] = useState(() => toDraft(pkg));
  const nextKey = useRef(0);

  // A save (here or elsewhere) brings a new version: start from it.
  if (pkg.version !== version) {
    setVersion(pkg.version);
    setDraft(toDraft(pkg));
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(pkg));
  const errors = state.error?.fieldErrors ?? {};
  const availability = new Map(pkg.days.flatMap((day) => day.items).map((item) => [item.id, item.availability]));
  const Icon = THEME_ICONS[pkg.theme];

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const newKey = (prefix: string) => `new-${prefix}-${++nextKey.current}`;

  function updateDays(change: (days: DayDraft[]) => DayDraft[]) {
    setDraft((current) => ({ ...current, days: change(current.days) }));
  }

  function updateDay(index: number, change: (day: DayDraft) => DayDraft) {
    updateDays((days) => days.map((day, d) => (d === index ? change(day) : day)));
  }

  function addItem(dayIndex: number, kind: ItemKind) {
    const item: ItemDraft = { id: newKey("item"), kind, name: "", description: "", payment: kind === "meal" ? "property" : "online", price: "" };
    updateDay(dayIndex, (day) => ({ ...day, items: [...day.items, item] }));
  }

  function addDay() {
    updateDays((days) => [...days, { id: newKey("day"), title: `Day ${days.length + 1}`, note: "", items: [] }]);
  }

  return (
    <FlatCard aria-labelledby="package-name" className="min-w-0">
      <form action={formAction} noValidate className="flex flex-col gap-5">
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="packageId" value={pkg.id} />
        <input type="hidden" name="version" value={pkg.version} />
        <input type="hidden" name="payload" value={JSON.stringify(draft)} />

        {state.error ? (
          <p role="alert" className="rounded-lg border border-office-danger/40 bg-office-danger-soft px-3 py-2 text-sm font-medium text-office-danger-text">
            {state.error.message}
          </p>
        ) : null}

        <header className="flex gap-3">
          <Icon aria-hidden="true" className="mt-1 size-7 shrink-0 text-office-primary" />
          <div className="min-w-0 flex-1">
            <h2 id="package-name" className="sr-only">
              {pkg.name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="min-w-0 flex-1 sm:max-w-sm">
                <InlineInput
                  id="package-name-input"
                  label="Package name"
                  value={draft.name}
                  maxLength={PACKAGE_LIMITS.name}
                  error={errors.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  className="text-xl font-semibold"
                />
              </div>
              <ChipSelect
                label="Status"
                value={draft.status}
                options={STATUS_OPTIONS}
                onChange={(value) => setDraft({ ...draft, status: value === "active" ? "active" : "draft" })}
                aria-describedby={errors.status ? "package-status-error" : undefined}
                className={draft.status === "active" ? "bg-office-success-soft text-office-success-text" : undefined}
              />
            </div>
            <FieldError id="package-status-error" error={errors.status} />
            <div className="mt-1 flex flex-wrap items-start gap-x-1 text-sm text-office-muted">
              <span className="flex items-center">
                <InlineInput
                  id="package-nights"
                  label="Nights"
                  inputMode="numeric"
                  value={draft.nights}
                  error={errors.nights}
                  onChange={(event) => setDraft({ ...draft, nights: event.target.value })}
                  className="w-10 text-right"
                />
                <span className="ml-1.5">nights</span>
              </span>
              <span aria-hidden="true" className="mx-1 py-0.5">
                •
              </span>
              <div className="min-w-48 flex-1">
                <InlineInput
                  id="package-tagline"
                  label="Short description"
                  value={draft.tagline}
                  placeholder="Add a short description"
                  maxLength={PACKAGE_LIMITS.tagline}
                  error={errors.tagline}
                  onChange={(event) => setDraft({ ...draft, tagline: event.target.value })}
                />
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="itinerary-title" className="flex flex-col gap-4">
          <h3 id="itinerary-title" className="text-base font-semibold">
            Itinerary
          </h3>
          <ol className="flex flex-col gap-4">
            {draft.days.map((day, index) => (
              <ItineraryDay
                key={day.id}
                day={day}
                index={index}
                theme={pkg.theme}
                errors={errors}
                availability={availability}
                canRemove={draft.days.length > 1}
                onDayChange={(patch) => updateDay(index, (current) => ({ ...current, ...patch }))}
                onItemChange={(itemIndex, patch) =>
                  updateDay(index, (current) => ({
                    ...current,
                    items: current.items.map((item, i) => (i === itemIndex ? { ...item, ...patch } : item)),
                  }))
                }
                onAddItem={(kind) => addItem(index, kind)}
                onRemoveItem={(itemIndex) =>
                  updateDay(index, (current) => ({ ...current, items: current.items.filter((_, i) => i !== itemIndex) }))
                }
                onRemove={() => updateDays((days) => days.filter((_, d) => d !== index))}
              />
            ))}
          </ol>
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={addDay}
              disabled={draft.days.length >= PACKAGE_LIMITS.days}
              className="h-11 gap-2 rounded-lg bg-card md:h-9"
            >
              <Plus aria-hidden="true" className="size-4" />
              Add day
            </Button>
            <FieldError id="package-days-error" error={errors.days} />
          </div>
        </section>

        <section aria-label="Package total" className="flex flex-wrap items-center gap-4 rounded-xl bg-office-tint-teal px-4 py-4">
          <CreditCard aria-hidden="true" className="size-6 shrink-0 text-office-label" />
          <div className="min-w-40 flex-1">
            <p className="text-sm font-semibold">Pay online now</p>
            {pkg.totals.hasPayAtProperty ? <p className="text-xs text-office-muted">Food and extras are paid at the property.</p> : null}
            {dirty ? <p className="text-xs font-medium text-office-label">Totals update when you save.</p> : null}
          </div>
          <dl className="flex gap-6 text-right">
            <div className="flex flex-col-reverse">
              <dt className="text-xs text-office-muted">Total (LKR)</dt>
              <dd className="text-lg font-semibold">{formatMoney(pkg.totals.payOnline)}</dd>
            </div>
            <div className="flex flex-col-reverse">
              <dt className="text-xs text-office-muted">Total (USD)</dt>
              <dd className="text-lg font-semibold">{formatMoney(pkg.totals.payOnlineUsd)}</dd>
            </div>
          </dl>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button asChild variant="ghost" className="h-11 gap-2 rounded-lg px-3 text-base text-office-danger hover:bg-office-danger-soft hover:text-office-danger md:h-10">
            <Link href={deleteHref} scroll={false}>
              <Trash2 aria-hidden="true" className="size-4" />
              Delete package
            </Link>
          </Button>
          <p role="status" className="mr-auto text-sm text-office-muted">
            {dirty ? "You have unsaved changes." : state.saved > 0 && !state.error ? "Package saved." : ""}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={!dirty || pending}
            onClick={() => setDraft(toDraft(pkg))}
            className="h-11 rounded-lg bg-card px-5 text-base md:h-10"
          >
            Cancel
          </Button>
          <Button type="submit" variant="office" disabled={!dirty || pending} className="h-11 rounded-lg px-5 text-base md:h-10">
            {pending ? "Saving…" : "Save package"}
          </Button>
        </div>
      </form>
    </FlatCard>
  );
}
