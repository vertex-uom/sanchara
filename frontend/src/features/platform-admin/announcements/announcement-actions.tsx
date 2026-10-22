"use client";

import { useId, useState } from "react";
import { Archive, CalendarClock, Info, Megaphone, Pencil, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminDialog, AdminDialogClose } from "../components/dialog";
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from "../components/form";
import { AdminButton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import type { Announcement, AnnouncementAudience, AnnouncementChannel, AnnouncementType } from "../types";
import { BannerPreview } from "./banner-preview";
import { AUDIENCE_LABELS, AUDIENCES, CHANNEL_LABELS, CHANNELS, TYPE_META, TYPES } from "./status";

// Create / edit and archive. Placeholders until the platform-admin API
// exists: the forms validate locally and preview the banner, but the confirm
// buttons do not submit.
// TODO(announcements): submit through Server Actions, send email through
// `messaging`, record in the audit log.

type Draft = {
  title: string;
  message: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  channels: AnnouncementChannel[];
  startsAt: string;
  endsAt: string;
  dismissible: boolean;
};

const EMPTY_DRAFT: Draft = { title: "", message: "", type: "feature", audience: "all-staff", channels: ["in-app"], startsAt: "", endsAt: "", dismissible: true };

// ISO → value for <input type="datetime-local"> in Sri Lanka time.
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function draftFrom(announcement: Announcement): Draft {
  return {
    title: announcement.title,
    message: announcement.message,
    type: announcement.type,
    audience: announcement.audience,
    channels: announcement.channels,
    startsAt: toLocalInput(announcement.startsAt),
    endsAt: toLocalInput(announcement.endsAt),
    dismissible: announcement.dismissible,
  };
}

export function NewAnnouncementDialog() {
  return (
    <AnnouncementDialog
      mode="create"
      trigger={
        <AdminButton icon={Megaphone} variant="primary">
          New announcement
        </AdminButton>
      }
    />
  );
}

export function EditAnnouncementDialog({ announcement }: { announcement: Announcement }) {
  return (
    <AnnouncementDialog
      mode="edit"
      announcement={announcement}
      trigger={
        <AdminButton icon={Pencil} className="w-full">
          Edit
        </AdminButton>
      }
    />
  );
}

function AnnouncementDialog({ mode, announcement, trigger }: { mode: "create" | "edit"; announcement?: Announcement; trigger: React.ReactNode }) {
  const id = useId();
  const [draft, setDraft] = useState<Draft>(() => (announcement ? draftFrom(announcement) : EMPTY_DRAFT));
  // True when the start is in the future: the confirm button then reads
  // "Schedule" instead of "Publish". Computed in the handler, never at render.
  const [scheduled, setScheduled] = useState(announcement?.status === "scheduled");

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const toggleChannel = (channel: AnnouncementChannel) =>
    setDraft((d) => ({ ...d, channels: d.channels.includes(channel) ? d.channels.filter((c) => c !== channel) : [...d.channels, channel] }));
  const onStartChange = (value: string) => {
    update("startsAt", value);
    setScheduled(Boolean(value) && new Date(value).getTime() > Date.now());
  };

  const confirmLabel = mode === "edit" ? "Save changes" : scheduled ? "Schedule" : "Publish now";
  const inApp = draft.channels.includes("in-app");

  return (
    <AdminDialog
      size="lg"
      trigger={trigger}
      title={mode === "edit" ? "Edit announcement" : "New announcement"}
      description={
        mode === "edit"
          ? "Changes apply to the banner at once; emails already sent are not resent."
          : "Shown as a banner in Back Office, sent by email, or both. Leave the start empty to publish immediately."
      }
      footer={
        <>
          <AdminDialogClose asChild>
            <AdminButton>Cancel</AdminButton>
          </AdminDialogClose>
          <AdminButton icon={scheduled && mode === "create" ? CalendarClock : Send} variant="primary" placeholder>
            {confirmLabel}
          </AdminButton>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <AdminField label="Title" htmlFor={`${id}-title`}>
            <AdminInput id={`${id}-title`} value={draft.title} onChange={(e) => update("title", e.target.value)} maxLength={80} required placeholder="e.g. Maintenance: PayHere gateway, 22 Oct 02:00–04:00" />
          </AdminField>
          <AdminField label="Message" htmlFor={`${id}-message`}>
            <AdminTextarea id={`${id}-message`} value={draft.message} onChange={(e) => update("message", e.target.value)} maxLength={400} required placeholder="What is changing, when, and what staff should do." />
          </AdminField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Type" htmlFor={`${id}-type`}>
              <AdminSelect id={`${id}-type`} value={draft.type} onChange={(e) => update("type", e.target.value as AnnouncementType)}>
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {TYPE_META[type].label}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Audience" htmlFor={`${id}-audience`}>
              <AdminSelect id={`${id}-audience`} value={draft.audience} onChange={(e) => update("audience", e.target.value as AnnouncementAudience)}>
                {AUDIENCES.map((audience) => (
                  <option key={audience} value={audience}>
                    {AUDIENCE_LABELS[audience]}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <fieldset className="flex min-w-0 flex-col gap-1.5">
            <legend className="mb-1.5 text-[11px] leading-[14px] font-medium text-admin-muted-text">Channels</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {CHANNELS.map((channel) => (
                <label key={channel} className="flex items-center gap-2 text-[12.5px] text-admin-heading">
                  <input type="checkbox" checked={draft.channels.includes(channel)} onChange={() => toggleChannel(channel)} className="focus-ring size-4 rounded border-admin-border accent-admin-primary" />
                  {CHANNEL_LABELS[channel]}
                </label>
              ))}
            </div>
            {draft.channels.length === 0 ? <p className="text-[11px] text-admin-danger">Pick at least one channel.</p> : null}
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Start" htmlFor={`${id}-start`}>
              <AdminInput id={`${id}-start`} type="datetime-local" value={draft.startsAt} onChange={(e) => onStartChange(e.target.value)} className="tabular-nums" />
            </AdminField>
            <AdminField label="End (optional)" htmlFor={`${id}-end`}>
              <AdminInput id={`${id}-end`} type="datetime-local" value={draft.endsAt} min={draft.startsAt || undefined} onChange={(e) => update("endsAt", e.target.value)} className="tabular-nums" />
            </AdminField>
          </div>
          <DismissibleToggle checked={draft.dismissible} onChange={(next) => update("dismissible", next)} disabled={!inApp} />
          {inApp ? (
            <div>
              <p className="mb-1.5 text-[11px] leading-[14px] font-medium text-admin-muted-text">Banner preview</p>
              <BannerPreview type={draft.type} title={draft.title} message={draft.message} dismissible={draft.dismissible} />
            </div>
          ) : null}
        </div>
      </div>
      <p className="flex items-start gap-2 text-[11px] text-admin-muted-text">
        <Info aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-3.5 shrink-0" />
        <span>Times are Sri Lanka time (GMT+5:30). Publishing is recorded in the audit log. Connects to the API in a later step.</span>
      </p>
    </AdminDialog>
  );
}

function DismissibleToggle({ checked, onChange, disabled }: { checked: boolean; onChange: (next: boolean) => void; disabled: boolean }) {
  const id = useId();
  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-[10px] border border-admin-border px-3 py-2.5", disabled && "opacity-60")}>
      <div className="min-w-0">
        <label htmlFor={id} className="block text-[12.5px] font-semibold text-admin-heading">
          Dismissible
        </label>
        <p className="mt-0.5 text-[11px] text-admin-muted-text">{disabled ? "Only applies to the in-app banner" : checked ? "Staff can close the banner" : "The banner stays until the window ends"}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "focus-ring relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors motion-reduce:transition-none disabled:cursor-not-allowed",
          checked ? "bg-admin-primary" : "bg-admin-border",
        )}
      >
        <span aria-hidden="true" className={cn("inline-block size-4 rounded-full bg-white shadow transition-transform motion-reduce:transition-none", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

export function ArchiveAnnouncementDialog({ announcement }: { announcement: Announcement }) {
  const scheduled = announcement.status === "scheduled";
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={Archive} variant="danger" className="w-full">
          {scheduled ? "Cancel schedule" : "Archive now"}
        </AdminButton>
      }
      title={scheduled ? `Cancel “${announcement.title}”?` : `Archive “${announcement.title}”?`}
      description={scheduled ? "It will not be shown or emailed. It stays in Archived for reference." : "The banner disappears from Back Office immediately. Emails already sent are unaffected."}
      footer={
        <>
          <AdminDialogClose asChild>
            <AdminButton>Keep it</AdminButton>
          </AdminDialogClose>
          <AdminButton icon={Archive} variant="danger" placeholder>
            {scheduled ? "Cancel announcement" : "Archive"}
          </AdminButton>
        </>
      }
    >
      <p className="flex items-start gap-2 text-[11px] text-admin-muted-text">
        <Info aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-3.5 shrink-0" />
        <span>This action is recorded in the audit log. Connects to the API in a later step.</span>
      </p>
    </AdminDialog>
  );
}
