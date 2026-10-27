import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "../sidebar-modes";
import type { AnnouncementType } from "../types";
import { TYPE_META } from "./status";

const TONE_CLASS: Record<AnnouncementType, string> = {
  feature: "bg-admin-success-soft text-admin-success",
  maintenance: "bg-admin-info-soft text-admin-info",
  policy: "bg-admin-muted text-admin-heading",
  reminder: "bg-admin-warning-soft text-admin-warning",
  urgent: "bg-admin-danger-soft text-admin-danger",
};

// How the in-app banner looks at the top of Back Office. Used by the detail
// panel and, live, by the create/edit dialog.
export function BannerPreview({ type, title, message, dismissible, className }: { type: AnnouncementType; title: string; message: string; dismissible: boolean; className?: string }) {
  const Icon = TYPE_META[type].icon;
  return (
    <div aria-label="Banner preview" className={cn("flex items-start gap-2.5 rounded-[10px] px-3 py-2.5 text-[11.5px] leading-snug", TONE_CLASS[type], className)}>
      <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-[18px] shrink-0" />
      <p className="min-w-0 flex-1">
        <span className="font-semibold">{title.trim() || "Announcement title"}</span>
        {message.trim() ? <span className="block">{message}</span> : null}
      </p>
      {dismissible ? <X aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4 shrink-0 opacity-70" /> : null}
    </div>
  );
}
