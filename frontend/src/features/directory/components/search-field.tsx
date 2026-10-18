import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// Shared shell for each search-bar field: icon, visible label and control.
export const searchControlClass =
  "w-full min-w-0 bg-transparent text-sm text-brand-tropical outline-none placeholder:text-brand-tropical/80";

type SearchFieldProps = {
  icon: LucideIcon;
  label: string;
  htmlFor: string;
  children: ReactNode;
};

export function SearchField({ icon: Icon, label, htmlFor, children }: SearchFieldProps) {
  return (
    <div className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-brand-teal">
      <Icon aria-hidden="true" className="size-5 shrink-0 text-brand-teal" />
      <div className="min-w-0 flex-1">
        <label htmlFor={htmlFor} className="block text-sm font-semibold text-brand-tropical">
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}
