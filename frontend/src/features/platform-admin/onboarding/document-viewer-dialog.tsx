"use client";

import type { ReactNode } from "react";
import { CalendarDays, Check, X } from "lucide-react";
import { AdminDialog, AdminDialogClose } from "../components/dialog";
import { AdminButton, AdminChip } from "../components/ui";
import type { ApplicationDocument } from "../types";
import { DOCUMENT_STATUS_META } from "./status";

// Opens from a document in the detail panel. The preview area shows the file
// once document storage exists; the actions are placeholders until then.
// TODO(onboarding): render the stored file and wire verify / reject / expiry.
export function DocumentViewerDialog({ document, businessName, children }: { document: ApplicationDocument; businessName: string; children: ReactNode }) {
  const meta = DOCUMENT_STATUS_META[document.status];
  return (
    <AdminDialog
      trigger={children}
      title={document.name}
      description={`${businessName} · ${document.detail}`}
      size="lg"
      footer={
        <>
          <AdminDialogClose asChild>
            <AdminButton>Close</AdminButton>
          </AdminDialogClose>
          <AdminButton icon={CalendarDays} placeholder>
            Set expiry date
          </AdminButton>
          <AdminButton icon={X} placeholder>
            Reject document
          </AdminButton>
          <AdminButton icon={Check} variant="primary" placeholder>
            Verify document
          </AdminButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
        <div
          role="img"
          aria-label={`${document.name} preview is not available yet`}
          className="flex aspect-[11/14] flex-col gap-2 rounded-[10px] bg-admin-muted p-4"
        >
          <p className="text-[11px] font-semibold tracking-wide text-admin-heading uppercase">{document.name}</p>
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} aria-hidden="true" className="block h-1.5 rounded-full bg-admin-border" style={{ width: `${90 - (i % 3) * 18}%` }} />
          ))}
          <p className="mt-auto text-[10.5px] text-admin-muted-text">Preview appears once document storage is connected.</p>
        </div>
        <div className="flex flex-col gap-2.5">
        <dl className="flex flex-col gap-2.5 text-[12.5px]">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-admin-muted-text">Status</dt>
            <dd>
              <AdminChip tone={meta.tone} dot>
                {meta.label}
              </AdminChip>
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-admin-muted-text">Detail</dt>
            <dd className="text-right font-medium text-admin-heading">{document.detail}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-admin-muted-text">Uploaded by</dt>
            <dd className="text-right font-medium text-admin-heading">Applicant</dd>
          </div>
        </dl>
        <p className="mt-2 rounded-[10px] bg-admin-muted px-3 py-2.5 text-[11.5px] text-admin-muted-text">
          Verifying or rejecting a document asks for confirmation and is recorded in the audit log.
        </p>
        </div>
      </div>
    </AdminDialog>
  );
}
