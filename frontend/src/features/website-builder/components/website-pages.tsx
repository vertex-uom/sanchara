"use client";

import {
  BedDouble,
  CalendarCheck,
  Compass,
  House,
  Images,
  MessageSquare,
  Newspaper,
  Star,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { Switch } from "./template-fields";

// Required pages are always in the menu; the rest can be switched off.
export const WEBSITE_PAGES: {
  name: string;
  icon: LucideIcon;
  required?: boolean;
}[] = [
  { name: "Home", icon: House, required: true },
  { name: "Rooms", icon: BedDouble, required: true },
  { name: "Booking", icon: CalendarCheck, required: true },
  { name: "Gallery", icon: Images },
  { name: "Reviews", icon: Star },
  { name: "Contact", icon: MessageSquare },
  { name: "Offers", icon: Tag },
  { name: "Blog", icon: Newspaper },
  { name: "Things to do", icon: Compass },
];

type WebsitePagesProps = {
  // Optional pages that are switched on.
  enabled: string[];
  onToggle: (page: string) => void;
};

export function WebsitePages({ enabled, onToggle }: WebsitePagesProps) {
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {WEBSITE_PAGES.map(({ name, icon: Icon, required }) => {
        const on = required || enabled.includes(name);
        const labelId = `page-${name.toLowerCase().replace(/\s+/g, "-")}`;
        return (
          <li
            key={name}
            className={cn(
              "flex h-12 items-center gap-3 rounded-lg border-[1.5px] px-3.5 transition-colors",
              on
                ? "border-brand-cyan bg-[#f8fcfd]"
                : "border-office-meter-track bg-card",
            )}
          >
            <Icon
              aria-hidden="true"
              className="size-4 shrink-0 text-office-icon"
            />
            <span
              id={labelId}
              className={cn(
                "flex-1 text-sm text-office-icon",
                on && "font-semibold",
              )}
            >
              {name}
            </span>
            {required ? (
              <span className="text-xs text-office-muted">Required</span>
            ) : (
              <Switch
                size="sm"
                checked={on}
                onChange={() => onToggle(name)}
                aria-labelledby={labelId}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
