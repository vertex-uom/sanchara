"use client";

import { useId } from "react";
import { MessageSquarePlus, RefreshCw, UserRoundPlus } from "lucide-react";
import { AdminDialog, AdminDialogClose } from "../components/dialog";
import { AdminField, AdminSelect, AdminTextarea } from "../components/form";
import { AdminButton } from "../components/ui";
import type { WebsiteRequestAssignee, WebsiteRequestStatus } from "../types";
import { WEBSITE_REQUEST_STATUS_META } from "./status";

// Actions on a website request. Confirm buttons are placeholders until the
// platform-admin API exists.

type RequestSummary = { id: string; companyName: string; status: WebsiteRequestStatus; assignee: WebsiteRequestAssignee | null };

const NEXT_STATUSES: { value: WebsiteRequestStatus | "published"; label: string; description: string }[] = [
  ...(Object.keys(WEBSITE_REQUEST_STATUS_META) as WebsiteRequestStatus[]).map((value) => ({ value, ...WEBSITE_REQUEST_STATUS_META[value] })),
  { value: "published", label: "Published", description: "The Owner approved the preview; the site goes live and the request closes." },
];

export function ChangeStatusDialog({ request }: { request: RequestSummary }) {
  const id = useId();
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={RefreshCw} className="w-full">
          Change status
        </AdminButton>
      }
      title="Change the request status"
      description={`${request.companyName} · ${request.id}. The change is added to the timeline and the audit log.`}
      footer={
        <>
          <CancelButton />
          <AdminButton icon={RefreshCw} variant="primary" placeholder>
            Update status
          </AdminButton>
        </>
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[11px] font-medium text-admin-muted-text">New status</legend>
        {NEXT_STATUSES.map((status) => (
          <label key={status.value} className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-admin-border p-3 has-[:checked]:border-admin-primary has-[:checked]:bg-admin-primary-soft">
            <input type="radio" name={`${id}-status`} value={status.value} defaultChecked={status.value === request.status} className="mt-0.5 accent-admin-primary" />
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold text-admin-heading">{status.label}</span>
              <span className="block text-[11.5px] text-admin-muted-text">{status.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <AdminField label="Note for the timeline (optional)" htmlFor={`${id}-note`}>
        <AdminTextarea id={`${id}-note`} placeholder="e.g. Preview sent; Owner asked for a darker hero image" />
      </AdminField>
      <PendingNote />
    </AdminDialog>
  );
}

export function AssignDialog({ request, team }: { request: RequestSummary; team: WebsiteRequestAssignee[] }) {
  const id = useId();
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={UserRoundPlus} className="w-full">
          {request.assignee ? "Reassign" : "Assign"}
        </AdminButton>
      }
      title={request.assignee ? "Reassign the request" : "Assign the request"}
      description={`${request.companyName} · ${request.id}. The team member is notified and becomes responsible for the build.`}
      footer={
        <>
          <CancelButton />
          <AdminButton icon={UserRoundPlus} variant="primary" placeholder>
            Save
          </AdminButton>
        </>
      }
    >
      <AdminField label="Assigned to" htmlFor={`${id}-assignee`}>
        <AdminSelect id={`${id}-assignee`} defaultValue={request.assignee?.id ?? ""}>
          <option value="">Unassigned</option>
          {team.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <PendingNote />
    </AdminDialog>
  );
}

export function AddNoteDialog({ request }: { request: RequestSummary }) {
  const id = useId();
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={MessageSquarePlus} className="w-full">
          Add internal note
        </AdminButton>
      }
      title="Add an internal note"
      description="Only the platform team sees internal notes; the Owner never does."
      footer={
        <>
          <CancelButton />
          <AdminButton icon={MessageSquarePlus} variant="primary" placeholder>
            Add note
          </AdminButton>
        </>
      }
    >
      <AdminField label={`Note on ${request.companyName}`} htmlFor={`${id}-note`}>
        <AdminTextarea id={`${id}-note`} placeholder="e.g. Waiting on the Owner for the room rates" />
      </AdminField>
      <PendingNote />
    </AdminDialog>
  );
}

function CancelButton() {
  return (
    <AdminDialogClose asChild>
      <AdminButton>Cancel</AdminButton>
    </AdminDialogClose>
  );
}

function PendingNote() {
  return <p className="text-[11px] text-admin-muted-text">Connects to the API in a later step.</p>;
}
