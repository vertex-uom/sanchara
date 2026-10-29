"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { Loader2, MessageSquarePlus, RefreshCw, UserRoundPlus, type LucideIcon } from "lucide-react";
import { AdminDialog, AdminDialogClose } from "../components/dialog";
import { AdminField, AdminSelect, AdminTextarea } from "../components/form";
import { AdminButton } from "../components/ui";
import type { WebsiteRequestAssignee, WebsiteRequestStatus } from "../types";
import { WEBSITE_REQUEST_STATUS_META } from "./status";
import {
  addWebsiteRequestNote,
  assignWebsiteRequest,
  setWebsiteRequestStatus,
  type WebsiteRequestActionResult,
} from "./website-request-server-actions";

// Actions on an open website request. Each saves through the API, closes on
// success and adds to the timeline (internal notes stay off it).

type RequestSummary = { id: string; reference: string; companyName: string; status: WebsiteRequestStatus; assignee: WebsiteRequestAssignee | null };

type NextStatus = WebsiteRequestStatus | "published";

const NEXT_STATUSES: { value: NextStatus; label: string; description: string }[] = [
  ...(Object.keys(WEBSITE_REQUEST_STATUS_META) as WebsiteRequestStatus[]).map((value) => ({ value, ...WEBSITE_REQUEST_STATUS_META[value] })),
  { value: "published", label: "Published", description: "The company approved the preview; the site goes live and the request closes." },
];

// Open state, pending state and the refusal message shared by the dialogs.
function useDialogAction() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setMessage(null);
  }
  function run(action: () => Promise<WebsiteRequestActionResult>) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) onOpenChange(false);
      else setMessage(result.message);
    });
  }
  return { open, onOpenChange, message, pending, run };
}

export function ChangeStatusDialog({ request }: { request: RequestSummary }) {
  const id = useId();
  const dialog = useDialogAction();
  const [status, setStatus] = useState<NextStatus>(request.status);
  const [note, setNote] = useState("");
  return (
    <AdminDialog
      open={dialog.open}
      onOpenChange={dialog.onOpenChange}
      trigger={
        <AdminButton icon={RefreshCw} className="w-full">
          Change status
        </AdminButton>
      }
      title="Change the request status"
      description={`${request.companyName} · ${request.reference}. The change is added to the timeline and the audit log.`}
      footer={
        <Footer
          icon={RefreshCw}
          pending={dialog.pending}
          disabled={status === request.status}
          onConfirm={() => dialog.run(() => setWebsiteRequestStatus(request.id, status, note))}
        >
          Update status
        </Footer>
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[11px] font-medium text-admin-muted-text">New status</legend>
        {NEXT_STATUSES.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-admin-border p-3 has-[:checked]:border-admin-primary has-[:checked]:bg-admin-primary-soft">
            <input
              type="radio"
              name={`${id}-status`}
              value={option.value}
              checked={status === option.value}
              onChange={() => setStatus(option.value)}
              className="mt-0.5 accent-admin-primary"
            />
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold text-admin-heading">{option.label}</span>
              <span className="block text-[11.5px] text-admin-muted-text">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <AdminField label="Note for the timeline (optional)" htmlFor={`${id}-note`}>
        <AdminTextarea
          id={`${id}-note`}
          maxLength={300}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Preview sent; the Owner asked for a darker hero image"
        />
      </AdminField>
      <Refusal message={dialog.message} />
    </AdminDialog>
  );
}

export function AssignDialog({ request, team }: { request: RequestSummary; team: WebsiteRequestAssignee[] }) {
  const id = useId();
  const dialog = useDialogAction();
  const [adminId, setAdminId] = useState(request.assignee?.id ?? "");
  return (
    <AdminDialog
      open={dialog.open}
      onOpenChange={dialog.onOpenChange}
      trigger={
        <AdminButton icon={UserRoundPlus} className="w-full">
          {request.assignee ? "Reassign" : "Assign"}
        </AdminButton>
      }
      title={request.assignee ? "Reassign the request" : "Assign the request"}
      description={`${request.companyName} · ${request.reference}. The team member becomes responsible for the build.`}
      footer={
        <Footer
          icon={UserRoundPlus}
          pending={dialog.pending}
          disabled={adminId === (request.assignee?.id ?? "")}
          onConfirm={() => dialog.run(() => assignWebsiteRequest(request.id, adminId))}
        >
          Save
        </Footer>
      }
    >
      <AdminField label="Assigned to" htmlFor={`${id}-assignee`}>
        <AdminSelect id={`${id}-assignee`} value={adminId} onChange={(event) => setAdminId(event.target.value)}>
          <option value="">Unassigned</option>
          {team.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <Refusal message={dialog.message} />
    </AdminDialog>
  );
}

export function AddNoteDialog({ request }: { request: Pick<RequestSummary, "id" | "reference" | "companyName"> }) {
  const id = useId();
  const dialog = useDialogAction();
  const [text, setText] = useState("");
  return (
    <AdminDialog
      open={dialog.open}
      onOpenChange={(next) => {
        dialog.onOpenChange(next);
        if (!next) setText("");
      }}
      trigger={
        <AdminButton icon={MessageSquarePlus} className="w-full">
          Add internal note
        </AdminButton>
      }
      title="Add an internal note"
      description="Only the platform team sees internal notes; the company never does."
      footer={
        <Footer icon={MessageSquarePlus} pending={dialog.pending} disabled={!text.trim()} onConfirm={() => dialog.run(() => addWebsiteRequestNote(request.id, text))}>
          Add note
        </Footer>
      }
    >
      <AdminField label={`Note on ${request.companyName}`} htmlFor={`${id}-note`}>
        <AdminTextarea
          id={`${id}-note`}
          maxLength={1000}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="e.g. Waiting on the Owner for the room rates"
        />
      </AdminField>
      <Refusal message={dialog.message} />
    </AdminDialog>
  );
}

function Footer({ icon, pending, disabled, onConfirm, children }: { icon: LucideIcon; pending: boolean; disabled: boolean; onConfirm: () => void; children: ReactNode }) {
  return (
    <>
      <AdminDialogClose asChild>
        <AdminButton disabled={pending}>Cancel</AdminButton>
      </AdminDialogClose>
      <AdminButton
        icon={pending ? Loader2 : icon}
        variant="primary"
        onClick={onConfirm}
        disabled={pending || disabled}
        aria-busy={pending || undefined}
        className={pending ? "[&>svg]:animate-spin" : undefined}
      >
        {children}
      </AdminButton>
    </>
  );
}

function Refusal({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="rounded-[10px] bg-admin-danger-soft px-3 py-2.5 text-[12.5px] text-admin-danger">
      {message}
    </p>
  ) : null;
}
