import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// Shared shell for each search-bar field: icon, visible label and control.
export const searchControlClass =
  "w-full min-w-0 bg-transparent text-sm text-brand-tropical outline-none placeholder:text-brand-tropical/80";

// htmlFor labels a single control; groupId labels a group of controls.
type SearchFieldProps = {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
} & ({ htmlFor: string; groupId?: never } | { groupId: string; htmlFor?: never });

const labelClass = "block text-sm font-semibold text-brand-tropical";

export function SearchField({ icon: Icon, label, htmlFor, groupId, children }: SearchFieldProps) {
  return (
    <div
      role={groupId ? "group" : undefined}
      aria-labelledby={groupId}
      className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-brand-teal"
    >
      <Icon aria-hidden="true" className="size-5 shrink-0 text-brand-teal" />
      <div className="min-w-0 flex-1">
        {groupId ? (
          <span id={groupId} className={labelClass}>
            {label}
          </span>
        ) : (
          <label htmlFor={htmlFor} className={labelClass}>
            {label}
          </label>
        )}
        {children}
      </div>
    </div>
  );
}

// Line between search-bar fields: horizontal when stacked, vertical from md.
export function SearchDivider() {
  return <span aria-hidden="true" className="mx-4 h-px bg-brand-lagoon/60 md:mx-0 md:h-10 md:w-px" />;
}
