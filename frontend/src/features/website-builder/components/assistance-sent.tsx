"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import {
  firstName,
  goalsSummary,
  useAssistanceRequest,
} from "./assistance-draft";
import { FILE_KEYS, useTemplateFiles } from "./template-files";

const NO_FILES: File[] = [];
const noSubscription = () => () => {};

type AssistanceSentProps = {
  propertyName: string;
  dashboardHref: string;
};

// Confirmation after "Send request": the request ID and what was asked for.
export function AssistanceSent({
  propertyName,
  dashboardHref,
}: AssistanceSentProps) {
  const { values: request } = useAssistanceRequest();
  const [files] = useTemplateFiles(FILE_KEYS.assistanceFiles, NO_FILES);
  // The request is only readable in the browser; wait before saying "none".
  const hydrated = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const [copied, setCopied] = useState(false);

  if (!hydrated) return <span className="sr-only">Loading your request</span>;

  if (!request.sentAt) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-office-icon">
          No request sent yet
        </h1>
        <p className="mt-2 text-sm text-office-muted">
          Tell WEMIXT about your property and they will build your website.
        </p>
        <Button
          asChild
          variant="office"
          className="mt-5 h-11 gap-2 px-5 font-semibold"
        >
          <Link href={`${COMPANY_PATHS.website}/assistance`}>
            Request WEMIXT assistance
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </Card>
    );
  }

  const contact =
    request.contactBy === "Email"
      ? `Email · ${request.email}`
      : `${request.contactBy} · ${request.phone}`;

  async function copyId() {
    if (!request.requestId) return;
    try {
      await navigator.clipboard.writeText(request.requestId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card>
      <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-office-tint-teal">
        <span className="flex size-12 items-center justify-center rounded-full bg-office-primary text-white">
          <Check aria-hidden="true" className="size-6" strokeWidth={3} />
        </span>
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-office-icon">
        Request sent to WEMIXT!
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-office-muted">
        Thanks{firstName(request.name) ? `, ${firstName(request.name)}` : ""}.
        Our team has received your request and will contact you{" "}
        {request.contactBy === "Phone call"
          ? "by phone"
          : `on ${request.contactBy}`}{" "}
        within 1 business day.
      </p>
      {request.requestId ? (
        <button
          type="button"
          onClick={copyId}
          aria-label={
            copied
              ? "Request ID copied"
              : `Copy request ID ${request.requestId}`
          }
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full bg-office-tint-teal px-3.5 py-1.5 text-xs text-office-primary"
        >
          Request ID: <span className="font-semibold">{request.requestId}</span>
          {copied ? (
            <Check aria-hidden="true" className="size-3.5" />
          ) : (
            <Copy aria-hidden="true" className="size-3.5" />
          )}
        </button>
      ) : null}

      <dl className="mt-6 flex flex-col gap-2.5 rounded-xl bg-office-chip/60 p-4 text-left text-sm">
        <Row label="Property" value={propertyName} />
        <Row label="Contact" value={contact} />
        <Row label="Goals" value={goalsSummary(request.goals)} />
        <Row
          label="Files"
          value={files.length ? `${files.length} uploaded` : "None"}
        />
        <Row label="Needed by" value={request.timing} />
      </dl>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button
          asChild
          variant="outline"
          className="h-11 border-office-meter-track bg-card font-semibold text-office-icon hover:bg-office-chip"
        >
          <Link href={dashboardHref}>Go to dashboard</Link>
        </Button>
        <Button asChild variant="office" className="h-11 font-semibold">
          <Link href={`${COMPANY_PATHS.website}/assistance/request`}>
            Track my request
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-office-meter-track bg-card p-7 text-center shadow-[0_8px_30px_rgb(15_107_110/0.08)]">
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-office-muted">{label}</dt>
      <dd className="text-right font-semibold break-words text-office-icon">
        {value}
      </dd>
    </div>
  );
}
