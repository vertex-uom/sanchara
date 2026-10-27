import { Plus, Trash2 } from "lucide-react";
import { ToneChip } from "@/components/ui/tone-chip";
import { cn } from "@/lib/utils";
import { AVAILABILITY_META, ITEM_KIND_LABELS, ITEM_KINDS, PACKAGE_LIMITS, PAYMENT_LABELS, PAYMENT_MODES } from "../config";
import type { ItemKind, PackageTheme, PaymentMode, RoomAvailability } from "../types";
import type { DayDraft, ItemDraft } from "../validation";
import { ChipSelect, FieldError, InlineInput } from "./editor-fields";
import { ItemIcon } from "./package-icons";

type ItineraryDayProps = {
  day: DayDraft;
  index: number;
  theme: PackageTheme;
  errors: Record<string, string>;
  // Saved room availability by item id (new rows have none yet).
  availability: Map<string, RoomAvailability | null>;
  canRemove: boolean;
  onDayChange: (patch: Partial<Omit<DayDraft, "items">>) => void;
  onItemChange: (itemIndex: number, patch: Partial<ItemDraft>) => void;
  onAddItem: (kind: ItemKind) => void;
  onRemoveItem: (itemIndex: number) => void;
  onRemove: () => void;
};

const iconButtonClass =
  "focus-ring inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-office-icon hover:bg-office-danger-soft hover:text-office-danger";

const PAYMENT_OPTIONS = PAYMENT_MODES.map((mode) => ({ value: mode, label: PAYMENT_LABELS[mode] }));

// One itinerary day: its title and note on the left, its items in a card.
export function ItineraryDay({ day, index, theme, errors, availability, canRemove, ...handlers }: ItineraryDayProps) {
  const key = `days.${index}`;
  const label = day.title || `Day ${index + 1}`;
  const full = day.items.length >= PACKAGE_LIMITS.itemsPerDay;

  return (
    <li className="grid gap-3 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
      <div className="flex gap-2 sm:flex-col sm:gap-0">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <span aria-hidden="true" className="mt-2.5 size-2 shrink-0 rounded-full bg-office-chart-bright" />
          <div className="min-w-0 flex-1">
            <InlineInput
              id={`${key}-title`}
              label={`Day ${index + 1} title`}
              value={day.title}
              maxLength={PACKAGE_LIMITS.dayTitle}
              error={errors[`${key}.title`]}
              onChange={(event) => handlers.onDayChange({ title: event.target.value })}
              className="text-sm font-semibold"
            />
            <InlineInput
              id={`${key}-note`}
              label={`${label} note`}
              value={day.note}
              placeholder="Add a note"
              maxLength={PACKAGE_LIMITS.dayNote}
              error={errors[`${key}.note`]}
              onChange={(event) => handlers.onDayChange({ note: event.target.value })}
              className="text-xs text-office-muted"
            />
          </div>
        </div>
        {canRemove ? (
          <button type="button" onClick={handlers.onRemove} className={cn(iconButtonClass, "sm:mt-1 sm:ml-2.5")}>
            <Trash2 aria-hidden="true" className="size-4" />
            <span className="sr-only">Remove {label}</span>
          </button>
        ) : null}
      </div>

      <div className="rounded-xl border border-border">
        {day.items.length > 0 ? (
          <ul aria-label={`${label} items`} className="divide-y divide-border">
            {day.items.map((item, itemIndex) => (
              <ItemRow
                key={item.id}
                item={item}
                fieldKey={`${key}.items.${itemIndex}`}
                theme={theme}
                errors={errors}
                availability={availability.get(item.id) ?? null}
                onChange={(patch) => handlers.onItemChange(itemIndex, patch)}
                onRemove={() => handlers.onRemoveItem(itemIndex)}
              />
            ))}
          </ul>
        ) : (
          <p className="px-4 py-3 text-sm text-office-muted">No items on this day yet.</p>
        )}
        <div className="flex flex-wrap items-center gap-1 border-t border-border px-3 py-2">
          <span className="mr-1 text-xs text-office-muted">Add:</span>
          {ITEM_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              disabled={full}
              onClick={() => handlers.onAddItem(kind)}
              className="focus-ring inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-office-link hover:bg-office-nav-active disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus aria-hidden="true" className="size-3.5" />
              {ITEM_KIND_LABELS[kind]}
              <span className="sr-only"> to {label}</span>
            </button>
          ))}
        </div>
        <FieldError id={`${key}-items-error`} error={errors[`${key}.items`]} />
      </div>
    </li>
  );
}

type ItemRowProps = {
  item: ItemDraft;
  fieldKey: string;
  theme: PackageTheme;
  errors: Record<string, string>;
  availability: RoomAvailability | null;
  onChange: (patch: Partial<ItemDraft>) => void;
  onRemove: () => void;
};

function ItemRow({ item, fieldKey, theme, errors, availability, onChange, onRemove }: ItemRowProps) {
  const name = item.name || ITEM_KIND_LABELS[item.kind].toLowerCase();
  const available = item.kind === "room" && availability ? AVAILABILITY_META[availability] : null;

  return (
    <li className="flex flex-wrap items-start gap-x-3 gap-y-2 px-3 py-3 sm:px-4">
      <ItemIcon kind={item.kind} theme={theme} className="mt-1 size-5 shrink-0 text-office-icon" />
      <div className="min-w-40 flex-1">
        <span className="sr-only">{ITEM_KIND_LABELS[item.kind]}: </span>
        <InlineInput
          id={`${fieldKey}-name`}
          label={`${ITEM_KIND_LABELS[item.kind]} name`}
          value={item.name}
          placeholder={`${ITEM_KIND_LABELS[item.kind]} name`}
          maxLength={PACKAGE_LIMITS.itemName}
          error={errors[`${fieldKey}.name`]}
          onChange={(event) => onChange({ name: event.target.value })}
          className="text-sm font-medium"
        />
        <InlineInput
          id={`${fieldKey}-description`}
          label={`Description of ${name}`}
          value={item.description}
          placeholder="Add a description"
          maxLength={PACKAGE_LIMITS.itemDescription}
          error={errors[`${fieldKey}.description`]}
          onChange={(event) => onChange({ description: event.target.value })}
          className="text-xs text-office-muted"
        />
      </div>
      <div className="ml-8 flex flex-wrap items-center gap-2 sm:ml-0">
        <ChipSelect
          label={`How ${name} is paid`}
          value={item.payment}
          options={PAYMENT_OPTIONS}
          onChange={(value) => onChange({ payment: value as PaymentMode })}
          className={item.payment === "online" ? "bg-office-tint-teal text-office-primary" : undefined}
        />
        <div className="w-32 text-right">
          {item.payment === "online" ? (
            <label className="flex items-center justify-end gap-1 text-sm font-medium">
              <span aria-hidden="true">LKR</span>
              <span className="sr-only">Price of {name} in LKR</span>
              <input
                id={`${fieldKey}-price`}
                inputMode="numeric"
                value={item.price}
                placeholder="0"
                aria-invalid={errors[`${fieldKey}.price`] ? true : undefined}
                aria-describedby={errors[`${fieldKey}.price`] ? `${fieldKey}-price-error` : undefined}
                onChange={(event) => onChange({ price: event.target.value })}
                className="focus-ring h-8 w-20 rounded-md border border-border bg-card px-2 text-right text-sm aria-invalid:border-office-danger"
              />
            </label>
          ) : (
            <span className="text-sm text-office-muted">
              <span aria-hidden="true">–</span>
              <span className="sr-only">No online price</span>
            </span>
          )}
          <FieldError id={`${fieldKey}-price-error`} error={errors[`${fieldKey}.price`]} />
        </div>
        {available ? (
          <ToneChip tone={available.tone} dot>
            {available.label}
          </ToneChip>
        ) : null}
        <button type="button" onClick={onRemove} className={iconButtonClass}>
          <Trash2 aria-hidden="true" className="size-4" />
          <span className="sr-only">Remove {name}</span>
        </button>
      </div>
    </li>
  );
}
