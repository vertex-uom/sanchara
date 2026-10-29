"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Archive, CalendarClock, Info, Loader2, Megaphone, Pencil, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminDialog, AdminDialogClose } from "../components/dialog";
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from "../components/form";
import { AdminButton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import type { Announcement, AnnouncementAudience, AnnouncementType } from "../types";
import { archiveAnnouncement, createAnnouncement, updateAnnouncement, type AnnouncementField } from "./actions";
import { BannerPreview } from "./banner-preview";
import { announcementHref } from "./search-params";
import { AUDIENCE_LABELS, AUDIENCES, TYPE_META, TYPES } from "./status";

// Create, edit (scheduled only) and archive. Saved through Server Actions; the
// API turns announcements into system notifications for staff.

type Draft = {
  title: string;
  message: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  // <input type="datetime-local"> values, in Sri Lanka time.
  startsAt: string;
  endsAt: string;
  dismissible: boolean;
};

type FieldErrors = Partial<Record<AnnouncementField, string>>;

const EMPTY_DRAFT: Draft = { title: "", message: "", type: "feature", audience: "all-staff", startsAt: "", endsAt: "", dismissible: true };
const COLOMBO_OFFSET = "+05:30";

// ISO → value for <input type="datetime-local"> in Sri Lanka time.
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// A datetime-local value entered in Sri Lanka time → ISO with its offset, so
// neither the browser's nor the server's time zone changes its meaning.
const fromLocalInput = (value: string) => (value ? `${value}:00${COLOMBO_OFFSET}` : null);
const isFuture = (value: string) => Boolean(value) && Date.parse(`${value}:00${COLOMBO_OFFSET}`) > Date.now();

function draftFrom(announcement: Announcement): Draft {
  return {
    title: announcement.title,
    message: announcement.message,
    type: announcement.type,
    audience: announcement.audience,
    startsAt: toLocalInput(announcement.startsAt),
    endsAt: toLocalInput(announcement.endsAt),
    dismissible: announcement.dismissible,
  };
}

function checkDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.title.trim()) errors.title = "Enter a title.";
  if (!draft.message.trim()) errors.message = "Enter the message.";
  if (draft.endsAt) {
    const start = draft.startsAt ? Date.parse(`${draft.startsAt}:00${COLOMBO_OFFSET}`) : Date.now();
    if (Date.parse(`${draft.endsAt}:00${COLOMBO_OFFSET}`) <= start) errors.endsAt = "The end must be after the start.";
  }
  return errors;
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

// Only offered while the announcement is scheduled.
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

function AnnouncementDialog({ mode, announcement, trigger }: { mode: "create" | "edit"; announcement?: Announcement; trigger: ReactNode }) {
  const id = useId();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => (announcement ? draftFrom(announcement) : EMPTY_DRAFT));
  // True when the start is in the future: the confirm button then reads
  // "Schedule" instead of "Publish now". Computed in handlers, never at render.
  const [scheduled, setScheduled] = useState(announcement?.status === "scheduled");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Every opening starts from the saved values.
  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    const fresh = announcement ? draftFrom(announcement) : EMPTY_DRAFT;
    setDraft(fresh);
    setScheduled(isFuture(fresh.startsAt));
    setErrors({});
    setFailure(null);
  };

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const onStartChange = (value: string) => {
    update("startsAt", value);
    setScheduled(isFuture(value));
  };

  const submit = () => {
    const local = checkDraft(draft);
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }
    startTransition(async () => {
      const input = {
        title: draft.title.trim(),
        message: draft.message.trim(),
        type: draft.type,
        audience: draft.audience,
        dismissible: draft.dismissible,
        startsAt: fromLocalInput(draft.startsAt),
        endsAt: fromLocalInput(draft.endsAt),
      };
      const result = mode === "edit" && announcement ? await updateAnnouncement(announcement.id, input) : await createAnnouncement(input);
      if (!result.ok) {
        setErrors(result.fieldErrors);
        setFailure(result.message);
        return;
      }
      setOpen(false);
      router.push(announcementHref(result.id, result.status));
      router.refresh();
    });
  };

  const confirmLabel = mode === "edit" ? "Save changes" : scheduled ? "Schedule" : "Publish now";

  return (
    <AdminDialog
      size="lg"
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={mode === "edit" ? "Edit announcement" : "New announcement"}
      description={
        mode === "edit"
          ? "Scheduled announcements can be changed until they start."
          : "Shown to staff as a system notification in Back Office. Leave the start empty to publish now."
      }
      footer={
        <>
          <AdminDialogClose asChild>
            <AdminButton disabled={pending}>Cancel</AdminButton>
          </AdminDialogClose>
          <AdminButton
            icon={pending ? Loader2 : scheduled && mode === "create" ? CalendarClock : Send}
            variant="primary"
            onClick={submit}
            disabled={pending}
            aria-busy={pending || undefined}
            className={pending ? "[&>svg]:animate-spin" : undefined}
          >
            {pending ? "Saving…" : confirmLabel}
          </AdminButton>
        </>
      }
    >
      {failure ? (
        <p role="alert" className="rounded-[10px] bg-admin-danger-soft px-3 py-2.5 text-[12px] text-admin-danger">
          {failure}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <AdminField label="Title" htmlFor={`${id}-title`}>
            <AdminInput id={`${id}-title`} value={draft.title} onChange={(e) => update("title", e.target.value)} maxLength={80} required aria-invalid={Boolean(errors.title) || undefined} placeholder="e.g. Maintenance: PayHere gateway, 22 Oct 02:00–04:00" />
            <FieldError message={errors.title} />
          </AdminField>
          <AdminField label="Message" htmlFor={`${id}-message`}>
            <AdminTextarea id={`${id}-message`} value={draft.message} onChange={(e) => update("message", e.target.value)} maxLength={400} required aria-invalid={Boolean(errors.message) || undefined} placeholder="What is changing, when, and what staff should do." />
            <FieldError message={errors.message} />
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
              <FieldError message={errors.type} />
            </AdminField>
            <AdminField label="Audience" htmlFor={`${id}-audience`}>
              <AdminSelect id={`${id}-audience`} value={draft.audience} onChange={(e) => update("audience", e.target.value as AnnouncementAudience)}>
                {AUDIENCES.map((audience) => (
                  <option key={audience} value={audience}>
                    {AUDIENCE_LABELS[audience]}
                  </option>
                ))}
              </AdminSelect>
              <FieldError message={errors.audience} />
            </AdminField>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Start (empty = now)" htmlFor={`${id}-start`}>
              <AdminInput id={`${id}-start`} type="datetime-local" value={draft.startsAt} onChange={(e) => onStartChange(e.target.value)} aria-invalid={Boolean(errors.startsAt) || undefined} className="tabular-nums" />
              <FieldError message={errors.startsAt} />
            </AdminField>
            <AdminField label="End (optional)" htmlFor={`${id}-end`}>
              <AdminInput id={`${id}-end`} type="datetime-local" value={draft.endsAt} min={draft.startsAt || undefined} onChange={(e) => update("endsAt", e.target.value)} aria-invalid={Boolean(errors.endsAt) || undefined} className="tabular-nums" />
              <FieldError message={errors.endsAt} />
            </AdminField>
          </div>
          <DismissibleToggle checked={draft.dismissible} onChange={(next) => update("dismissible", next)} />
          <div>
            <p className="mb-1.5 text-[11px] leading-[14px] font-medium text-admin-muted-text">Notification preview</p>
            <BannerPreview type={draft.type} title={draft.title} message={draft.message} dismissible={draft.dismissible} />
          </div>
        </div>
      </div>
      <p className="flex items-start gap-2 text-[11px] text-admin-muted-text">
        <Info aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-3.5 shrink-0" />
        <span>Times are Sri Lanka time (GMT+5:30). Staff of active and suspended companies receive it. Recorded in the audit log.</span>
      </p>
    </AdminDialog>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-[11px] text-admin-danger">
      {message}
    </p>
  ) : null;
}

function DismissibleToggle({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-admin-border px-3 py-2.5">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-[12.5px] font-semibold text-admin-heading">
          Dismissible
        </label>
        <p className="mt-0.5 text-[11px] text-admin-muted-text">{checked ? "Staff can close the notification" : "It stays until the window ends"}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("focus-ring relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors motion-reduce:transition-none", checked ? "bg-admin-primary" : "bg-admin-border")}
      >
        <span aria-hidden="true" className={cn("inline-block size-4 rounded-full bg-white shadow transition-transform motion-reduce:transition-none", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

export function ArchiveAnnouncementDialog({ announcement }: { announcement: Announcement }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scheduled = announcement.status === "scheduled";

  const confirm = () =>
    startTransition(async () => {
      const result = await archiveAnnouncement(announcement.id);
      if (!result.ok) {
        setFailure(result.message);
        return;
      }
      setOpen(false);
      router.push(announcementHref(announcement.id, "archived"));
      router.refresh();
    });

  return (
    <AdminDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setFailure(null);
      }}
      trigger={
        <AdminButton icon={Archive} variant="danger" className="w-full">
          {scheduled ? "Cancel schedule" : "Archive now"}
        </AdminButton>
      }
      title={scheduled ? `Cancel “${announcement.title}”?` : `Archive “${announcement.title}”?`}
      description={scheduled ? "It will never be sent. It stays in Archived for reference." : "The system notification is taken down for all staff right away."}
      footer={
        <>
          <AdminDialogClose asChild>
            <AdminButton disabled={pending}>Keep it</AdminButton>
          </AdminDialogClose>
          <AdminButton icon={pending ? Loader2 : Archive} variant="danger" onClick={confirm} disabled={pending} aria-busy={pending || undefined} className={pending ? "[&>svg]:animate-spin" : undefined}>
            {pending ? "Working…" : scheduled ? "Cancel announcement" : "Archive"}
          </AdminButton>
        </>
      }
    >
      {failure ? (
        <p role="alert" className="rounded-[10px] bg-admin-danger-soft px-3 py-2.5 text-[12px] text-admin-danger">
          {failure}
        </p>
      ) : null}
      <p className="flex items-start gap-2 text-[11px] text-admin-muted-text">
        <Info aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-3.5 shrink-0" />
        <span>This action is recorded in the audit log.</span>
      </p>
    </AdminDialog>
  );
}
