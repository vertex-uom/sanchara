import { BedDouble, Car, Flower2, Mountain, Package, Utensils, Waves, type LucideIcon } from "lucide-react";
import type { ItemKind, PackageTheme } from "../types";

export const THEME_ICONS: Record<PackageTheme, LucideIcon> = {
  surf: Waves,
  wellness: Flower2,
  "hill-country": Mountain,
  general: Package,
};

const KIND_ICONS: Record<Exclude<ItemKind, "activity">, LucideIcon> = {
  room: BedDouble,
  meal: Utensils,
  transfer: Car,
};

// Activities take the package's own icon (a surf lesson shows the wave).
export function ItemIcon({ kind, theme, className }: { kind: ItemKind; theme: PackageTheme; className?: string }) {
  const Icon = kind === "activity" ? THEME_ICONS[theme] : KIND_ICONS[kind];
  return <Icon aria-hidden="true" className={className} />;
}
