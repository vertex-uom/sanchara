"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { cancelAssistanceRequest } from "../assistance-actions";
import {
  ASSISTANCE_GOALS,
  ASSISTANCE_STATUS_LABELS,
  ASSISTANCE_STYLES,
  ASSISTANCE_TIMINGS,
  CONTACT_METHODS,
  labelOf,
  type AssistanceRequest,
} from "../assistance-options";

const FORM_PATH = `${COMPANY_PATHS.website}/assistance`;

type AssistanceDetailsProps = {
  propertyName: string;
  dashboardHref: string;
  request: AssistanceRequest | null;
};

// What the company sent to WEMIXT, with links to change or cancel it.
export function AssistanceDetails({ propertyName, dashboardHref, request }: AssistanceDetailsProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, startCancel] = useTransition();

  const back = (
    <Link
      href={dashboardHref}
      className="focus-ring inline-flex items-center gap-2 self-start rounded-md text-sm font-medium text-office-primary hover:underline"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Back to dashboard
    </Link>
  );

  if (!request) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        {back}
        <Card>
          <h1 className="text-xl font-semibold text-office-icon">No website request yet</h1>
          <p className="mt-2 text-sm text-office-muted">Tell WEMIXT about your property and they will build your website.</p>
          <Button asChild variant="office" className="mt-5 h-11 gap-2 px-5 font-semibold">
            <Link href={FORM_PATH}>
              Request WEMIXT assistance
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  function cancel() {
    startCancel(async () => {
      const result = await cancelAssistanceRequest();
      setError(result.message ?? null);
    });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Request details</h1>
            <span className="rounded-full bg-office-tint-teal px-2.5 py-0.5 text-xs font-semibold text-office-primary">
              {ASSISTANCE_STATUS_LABELS[request.status]}
            </span>
          </div>
          <p className="mt-2 text-sm text-office-muted">WEMIXT assistance · {request.propertyName ?? propertyName}</p>
        </div>
        <Button asChild variant="office" className="h-11 gap-2 px-5 font-semibold">
          <Link href={`${FORM_PATH}?edit=1`}>
            <Pencil aria-hidden="true" className="size-4" />
            Edit request
          </Link>
        </Button>
      </div>

      <Card title="Request">
        <Rows>
          <Row label="Request ID" value={request.reference} />
          <Row label="Submitted" value={formatDate(request.requestedAt)} />
          <Row label="Package" value="Done-for-you" />
        </Rows>
      </Card>

      <Card title="Your details">
        <Rows>
          <Row label="Property" value={request.propertyName ?? propertyName} />
          <Row label="Name" value={request.contactName} />
          <Row label="Phone / WhatsApp" value={request.phone} />
          <Row label="Email" value={request.email} />
          <Row label="Contact me by" value={labelOf(CONTACT_METHODS, request.contactMethod)} />
        </Rows>
      </Card>

      <Card title="Your website">
        <Rows>
          <Row label="Goals" value={request.goals.map((goal) => labelOf(ASSISTANCE_GOALS, goal)).join(", ")} />
          <Row label="Preferred style" value={labelOf(ASSISTANCE_STYLES, request.style)} />
          <Row label="Needed by" value={labelOf(ASSISTANCE_TIMINGS, request.timing)} />
          <Row label="Notes" value={request.notes} />
        </Rows>
      </Card>

      <div className="rounded-2xl border border-office-meter-track bg-card p-5 shadow-[0_4px_16px_rgb(15_107_110/0.06)]">
        {error ? (
          <p role="alert" className="mb-3 text-sm font-medium text-office-danger-text">
            {error}
          </p>
        ) : null}
        {confirmCancel ? (
          <div className="rounded-lg bg-office-danger-soft p-3">
            <p className="text-sm text-office-danger-text">Cancel this request? WEMIXT will stop work on your website.</p>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="office-danger"
                onClick={cancel}
                disabled={cancelling}
                aria-busy={cancelling || undefined}
                className="h-9 gap-2 px-3.5 text-sm font-semibold"
              >
                {cancelling ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
                {cancelling ? "Cancelling…" : "Yes, cancel"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmCancel(false)}
                disabled={cancelling}
                className="h-9 border-office-meter-track bg-card px-3.5 text-sm font-semibold text-office-icon"
              >
                Keep request
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-office-muted">No longer need help from WEMIXT?</p>
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="focus-ring rounded text-sm font-semibold text-office-danger-text hover:underline"
            >
              Cancel request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-office-meter-track bg-card p-5 shadow-[0_4px_16px_rgb(15_107_110/0.06)]">
      {title ? <h2 className="mb-3 font-semibold text-office-icon">{title}</h2> : null}
      {children}
    </section>
  );
}

function Rows({ children }: { children: ReactNode }) {
  return <dl className="flex flex-col gap-2.5 text-sm">{children}</dl>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-office-muted">{label}</dt>
      <dd className="text-right font-semibold break-words whitespace-pre-line text-office-icon">{value.trim() || "—"}</dd>
    </div>
  );
}

// "Oct 27, 2026, 10:31 AM", Sri Lanka time.
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  });
}
