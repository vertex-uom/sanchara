"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarDays, Receipt, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TEMPLATE_FORM_PATH } from "./template-steps";
import {
  formatPrice,
  isRoomComplete,
  newRoomCategory,
  RoomEditor,
  RoomSummary,
  type RoomCategory,
} from "./room-category";
import { DRAFT_KEYS, useTemplateDraft } from "./template-draft";
import { FILE_KEYS, NO_ROOM_PHOTOS, useTemplateFiles } from "./template-files";
import {
  AddButton,
  AffixInput,
  Field,
  formCardClass,
  inputClass,
  SelectInput,
  ToggleRow,
} from "./template-fields";
import { TemplateProgress } from "./template-progress";

// Shown as "LKR - Sri Lankan Rupee"; the code before " - " is the price prefix.
export const CURRENCIES = [
  "LKR - Sri Lankan Rupee",
  "USD - US Dollar",
  "EUR - Euro",
  "GBP - British Pound",
];
const PRICE_BASES = ["Per room, per night", "Per person, per night"];

export type PriceRule = {
  id: string;
  kind: "season" | "extra";
  name: string;
  details: string;
  // Percent for a season, an amount in the site currency for an extra.
  amount: string;
};

export type RoomsPrices = {
  currency: string;
  priceBasis: string;
  taxesIncluded: boolean;
  breakfastIncluded: boolean;
  rooms: RoomCategory[];
  rules: PriceRule[];
};

// Step 3 of the hotel template form. Room photos are optional and live in the
// shared in-memory file store.
export function RoomsPricesForm() {
  const router = useRouter();
  const { values, update, save, saved } = useTemplateDraft<RoomsPrices>(
    DRAFT_KEYS.rooms,
    {
      currency: CURRENCIES[0],
      priceBasis: PRICE_BASES[0],
      taxesIncluded: true,
      breakfastIncluded: true,
      rooms: [],
      rules: [],
    },
  );
  const [photos, setPhotos] = useTemplateFiles(
    FILE_KEYS.roomPhotos,
    NO_ROOM_PHOTOS,
  );
  // Category open in the editor; the first one when nothing was picked.
  const [editing, setEditing] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const currency = values.currency.split(" - ")[0];
  const rooms = values.rooms;
  const editingId = editing ?? rooms[0]?.id ?? null;
  const totalRooms = rooms.reduce(
    (sum, room) => sum + (Number(room.count) || 0),
    0,
  );

  function updateRoom(id: string, patch: Partial<RoomCategory>) {
    update({
      rooms: rooms.map((room) =>
        room.id === id ? { ...room, ...patch } : room,
      ),
    });
  }

  function addRoom() {
    const room = newRoomCategory();
    update({ rooms: [...rooms, room] });
    setEditing(room.id);
  }

  function deleteRoom(room: RoomCategory) {
    const name = room.name.trim() || "this room category";
    if (!window.confirm(`Delete ${name}?`)) return;
    update({ rooms: rooms.filter((other) => other.id !== room.id) });
    setPhotos((current) => {
      const rest = { ...current };
      delete rest[room.id];
      return rest;
    });
    setEditing(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rooms.length) {
      setProblem("Add at least one room category.");
      return;
    }
    const incomplete = rooms.find((room) => !isRoomComplete(room));
    if (incomplete) {
      setEditing(incomplete.id);
      setProblem(
        `Finish ${incomplete.name.trim() || "the highlighted room category"}: it needs a name, price and number of rooms.`,
      );
      return;
    }
    setProblem(null);
    save();
    router.push(`${TEMPLATE_FORM_PATH}/facilities`);
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <form
        id="rooms-prices-form"
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-1 flex-col gap-5"
      >
        <section aria-labelledby="pricing-title" className={formCardClass}>
          <h2
            id="pricing-title"
            className="text-lg font-semibold text-office-icon"
          >
            Pricing settings
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            These settings apply to all room prices.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field id="currency" label="Currency" required>
              <SelectInput
                id="currency"
                required
                options={CURRENCIES}
                value={values.currency}
                onChange={(event) => update({ currency: event.target.value })}
              />
            </Field>
            <Field id="price-basis" label="Show prices" required>
              <SelectInput
                id="price-basis"
                required
                options={PRICE_BASES}
                value={values.priceBasis}
                onChange={(event) => update({ priceBasis: event.target.value })}
              />
            </Field>
          </div>
          <div className="mt-5 flex flex-col gap-4">
            <ToggleRow
              id="taxes-included"
              label="Taxes & service charge included"
              description="Guests see the final price with no extra charges at checkout."
              checked={values.taxesIncluded}
              onChange={(taxesIncluded) => update({ taxesIncluded })}
            />
            <ToggleRow
              id="breakfast-included"
              label="Breakfast included in price"
              description="Shows a “Breakfast included” tag on every room card."
              checked={values.breakfastIncluded}
              onChange={(breakfastIncluded) => update({ breakfastIncluded })}
            />
          </div>
        </section>

        <section aria-labelledby="rooms-title" className={formCardClass}>
          <h2
            id="rooms-title"
            className="text-lg font-semibold text-office-icon"
          >
            Room categories
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            Add every room type guests can book.{" "}
            {rooms.length
              ? `You have ${rooms.length} ${rooms.length === 1 ? "category" : "categories"} and ${totalRooms} ${totalRooms === 1 ? "room" : "rooms"} in total.`
              : "You have not added any yet."}
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {rooms.map((room, index) =>
              room.id === editingId ? (
                <RoomEditor
                  key={room.id}
                  index={index}
                  room={room}
                  currency={currency}
                  photos={photos[room.id] ?? []}
                  onChange={(patch) => updateRoom(room.id, patch)}
                  onPhotosChange={(files) =>
                    setPhotos((current) => ({ ...current, [room.id]: files }))
                  }
                  onDelete={() => deleteRoom(room)}
                  onDone={() => setEditing("")}
                />
              ) : (
                <RoomSummary
                  key={room.id}
                  room={room}
                  index={index}
                  currency={currency}
                  photo={photos[room.id]?.[0]}
                  onEdit={() => setEditing(room.id)}
                />
              ),
            )}
            <AddButton onClick={addRoom}>Add room category</AddButton>
          </div>
          {problem ? (
            <p
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-lg bg-office-danger-soft px-4 py-3 text-sm text-office-danger-text"
            >
              <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
              {problem}
            </p>
          ) : null}
        </section>

        <PriceRules
          currency={currency}
          rules={values.rules}
          onChange={(rules) => update({ rules })}
        />
      </form>

      <TemplateProgress
        formStep={3}
        note="Rooms and prices appear on your Rooms page and in the booking widget. You can change them any time."
        formId="rooms-prices-form"
        backHref={`${TEMPLATE_FORM_PATH}/brand`}
        onSaveDraft={save}
        saved={saved}
      />
    </div>
  );
}

type PriceRulesProps = {
  currency: string;
  rules: PriceRule[];
  onChange: (rules: PriceRule[]) => void;
};

function PriceRules({ currency, rules, onChange }: PriceRulesProps) {
  const [adding, setAdding] = useState(false);

  return (
    <section aria-labelledby="rules-title" className={formCardClass}>
      <h2 id="rules-title" className="text-lg font-semibold text-office-icon">
        Seasonal &amp; extra prices
      </h2>
      <p className="mt-1 text-sm text-office-muted">
        Optional. Add peak-season rates and extra charges.
      </p>
      <ul className="mt-5 flex flex-col gap-3">
        {rules.map((rule) => {
          const Icon = rule.kind === "season" ? CalendarDays : Receipt;
          return (
            <li
              key={rule.id}
              className="flex items-center gap-3 rounded-xl border border-office-meter-track bg-card p-3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-office-chip text-office-icon">
                <Icon aria-hidden="true" className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-office-icon">
                  {rule.name}
                </p>
                {rule.details ? (
                  <p className="truncate text-xs text-office-muted">
                    {rule.details}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 text-sm font-semibold text-office-icon">
                {rule.kind === "season"
                  ? `+${Number(rule.amount)}%`
                  : formatPrice(currency, rule.amount)}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange(rules.filter((other) => other.id !== rule.id))
                }
                aria-label={`Delete ${rule.name}`}
                className="focus-ring inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-office-icon hover:bg-office-danger-soft hover:text-office-danger-text"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
      <div className={cn(rules.length && "mt-3")}>
        {adding ? (
          <RuleEditor
            currency={currency}
            onAdd={(rule) => {
              onChange([...rules, rule]);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <AddButton onClick={() => setAdding(true)}>Add price rule</AddButton>
        )}
      </div>
    </section>
  );
}

// Inline form for a new rule. It is not a <form> (forms cannot nest), so
// fields are checked here rather than by the browser.
function RuleEditor({
  currency,
  onAdd,
  onCancel,
}: {
  currency: string;
  onAdd: (rule: PriceRule) => void;
  onCancel: () => void;
}) {
  const [rule, setRule] = useState<Omit<PriceRule, "id">>({
    kind: "season",
    name: "",
    details: "",
    amount: "",
  });
  const [error, setError] = useState<string | null>(null);
  const season = rule.kind === "season";

  function add() {
    if (!rule.name.trim() || !(Number(rule.amount) > 0)) {
      setError(
        `Enter a name and ${season ? "a percentage" : "an amount"} above 0.`,
      );
      return;
    }
    onAdd({ ...rule, name: rule.name.trim(), id: crypto.randomUUID() });
  }

  return (
    <div className="rounded-xl border-[1.5px] border-brand-cyan bg-[#f8fcfd] p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="rule-kind" label="Type">
          <SelectInput
            id="rule-kind"
            options={["Seasonal rate", "Extra charge"]}
            value={season ? "Seasonal rate" : "Extra charge"}
            onChange={(event) =>
              setRule({
                ...rule,
                kind:
                  event.target.value === "Seasonal rate" ? "season" : "extra",
              })
            }
          />
        </Field>
        <Field id="rule-name" label="Name" required>
          <input
            id="rule-name"
            value={rule.name}
            onChange={(event) => setRule({ ...rule, name: event.target.value })}
            placeholder={season ? "Peak season" : "Extra bed"}
            className={inputClass}
          />
        </Field>
        <Field id="rule-details" label="Details" hint="Optional">
          <input
            id="rule-details"
            value={rule.details}
            onChange={(event) =>
              setRule({ ...rule, details: event.target.value })
            }
            placeholder={
              season
                ? "15 Dec – 15 Apr · all room categories"
                : "Per night, on request"
            }
            className={inputClass}
          />
        </Field>
        <Field
          id="rule-amount"
          label={season ? "Price increase" : "Amount"}
          required
        >
          <AffixInput
            id="rule-amount"
            type="number"
            inputMode="numeric"
            min={1}
            prefix={season ? "+" : currency}
            suffix={season ? "%" : undefined}
            value={rule.amount}
            onChange={(event) =>
              setRule({ ...rule, amount: event.target.value })
            }
            placeholder={season ? "20" : "3500"}
          />
        </Field>
      </div>
      {error ? (
        <p
          role="alert"
          className="mt-3 text-xs font-medium text-office-danger-text"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-10 border-office-meter-track bg-card px-4 font-semibold text-office-icon hover:bg-office-chip"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="office"
          onClick={add}
          className="h-10 px-4 font-semibold"
        >
          Add rule
        </Button>
      </div>
    </div>
  );
}
