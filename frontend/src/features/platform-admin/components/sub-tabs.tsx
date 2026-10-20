import Link from "next/link";
import { cn } from "@/lib/utils";

export type AdminSubTab = { key: string; label: string; href: string; count?: number };

// Tab row from the design: 34px pills, the active one filled with the brand
// colour. Tabs are links so the active tab is part of the URL.
export function AdminSubTabs({ tabs, active, label }: { tabs: AdminSubTab[]; active: string; label: string }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-1.5">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "focus-ring inline-flex h-[34px] items-center gap-1.5 rounded-lg px-4 text-[12.5px] font-medium whitespace-nowrap transition-colors motion-reduce:transition-none",
              isActive ? "bg-admin-primary text-white" : "bg-admin-muted text-admin-body hover:bg-admin-border/70",
            )}
          >
            {tab.label}
            {tab.count !== undefined ? <span>({tab.count.toLocaleString("en-US")})</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
