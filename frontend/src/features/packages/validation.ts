import { ITEM_KINDS, PACKAGE_LIMITS as LIMITS, PACKAGE_STATUSES, PACKAGE_THEMES, PAYMENT_MODES } from "./config";
import type { ItemKind, PackageStatus, PackageTheme, PaymentMode } from "./types";

// Editor state as the form holds it (all text), sent to the Server Action as JSON.
// Field errors are keyed by path: "name", "days.0.title", "days.0.items.1.price".
export type ItemDraft = { id: string; kind: ItemKind; name: string; description: string; payment: PaymentMode; price: string };
export type DayDraft = { id: string; title: string; note: string; items: ItemDraft[] };
export type PackageDraft = { name: string; tagline: string; status: PackageStatus; nights: string; days: DayDraft[] };

export type ValidItem = Omit<ItemDraft, "price"> & { priceRupees: number | null };
export type ValidDay = Omit<DayDraft, "items"> & { items: ValidItem[] };
export type ValidPackage = Omit<PackageDraft, "nights" | "days"> & { nights: number; days: ValidDay[] };

export type NewPackageInput = { name: string; theme: string; nights: string };
export type NewPackage = { name: string; theme: PackageTheme; nights: number };

type Result<T> = { ok: true; value: T } | { ok: false; fieldErrors: Record<string, string> };

const ID = /^[a-z0-9_-]{1,64}$/;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const list = (value: unknown) => (Array.isArray(value) ? value : []);
const record = (value: unknown): Record<string, unknown> => (value && typeof value === "object" ? (value as Record<string, unknown>) : {});
const pick = <T extends string>(options: readonly T[], value: unknown) => options.find((option) => option === value);

function wholeNumber(value: string) {
  const plain = value.replace(/[,\s]/g, "");
  return /^\d{1,9}$/.test(plain) ? Number(plain) : null;
}

function checkText(errors: Record<string, string>, key: string, value: string, max: number, required: string | null) {
  if (!value && required) errors[key] = required;
  else if (value.length > max) errors[key] = `Use ${max} characters or fewer.`;
}

function checkNights(errors: Record<string, string>, raw: string) {
  const nights = wholeNumber(raw);
  if (nights === null || nights < 1 || nights > LIMITS.nights) errors.nights = `Enter 1 to ${LIMITS.nights} nights.`;
  return nights ?? 0;
}

// The one schema for saving a package. Input is untrusted JSON.
export function validatePackage(input: unknown): Result<ValidPackage> {
  const raw = record(input);
  const errors: Record<string, string> = {};
  const name = text(raw.name);
  const tagline = text(raw.tagline);
  const status = pick(PACKAGE_STATUSES, raw.status);
  const nights = checkNights(errors, text(raw.nights));

  checkText(errors, "name", name, LIMITS.name, "Enter the package name.");
  checkText(errors, "tagline", tagline, LIMITS.tagline, null);
  if (!status) errors.status = "Choose Active or Draft.";

  const rawDays = list(raw.days);
  if (rawDays.length === 0) errors.days = "Add at least one day.";
  else if (rawDays.length > LIMITS.days) errors.days = `Use ${LIMITS.days} days or fewer.`;

  const days = rawDays.slice(0, LIMITS.days).map((value, d): ValidDay => {
    const day = record(value);
    const title = text(day.title);
    const note = text(day.note);
    checkText(errors, `days.${d}.title`, title, LIMITS.dayTitle, "Give the day a title.");
    checkText(errors, `days.${d}.note`, note, LIMITS.dayNote, null);
    const rawItems = list(day.items);
    if (rawItems.length > LIMITS.itemsPerDay) errors[`days.${d}.items`] = `Use ${LIMITS.itemsPerDay} items or fewer a day.`;

    const items = rawItems.slice(0, LIMITS.itemsPerDay).map((itemValue, i): ValidItem => {
      const item = record(itemValue);
      const key = `days.${d}.items.${i}`;
      const kind = pick(ITEM_KINDS, item.kind) ?? "activity";
      const payment = pick(PAYMENT_MODES, item.payment) ?? "property";
      const itemName = text(item.name);
      const description = text(item.description);
      checkText(errors, `${key}.name`, itemName, LIMITS.itemName, "Enter the item name.");
      checkText(errors, `${key}.description`, description, LIMITS.itemDescription, null);

      let priceRupees: number | null = null;
      if (payment === "online") {
        priceRupees = wholeNumber(text(item.price));
        if (priceRupees === null || priceRupees < 1 || priceRupees > LIMITS.maxPrice) {
          errors[`${key}.price`] = "Enter a price in whole rupees.";
        }
      }
      return { id: ID.test(text(item.id)) ? text(item.id) : "", kind, name: itemName, description, payment, priceRupees };
    });
    return { id: ID.test(text(day.id)) ? text(day.id) : "", title, note, items };
  });

  // Guests pay online to book, so a bookable package needs something to pay for.
  const paysOnline = days.some((day) => day.items.some((item) => item.payment === "online"));
  if (status === "active" && !paysOnline && !errors.days) {
    errors.status = "An active package needs at least one item paid online. Save it as a draft for now.";
  }

  if (!status || Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return { ok: true, value: { name, tagline, status, nights, days } };
}

export function validateNewPackage(input: NewPackageInput): Result<NewPackage> {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  const theme = pick(PACKAGE_THEMES, input.theme);
  const nights = checkNights(errors, input.nights.trim());
  checkText(errors, "name", name, LIMITS.name, "Enter the package name.");
  if (!theme) errors.theme = "Choose a theme.";

  if (!theme || Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return { ok: true, value: { name, theme, nights } };
}
