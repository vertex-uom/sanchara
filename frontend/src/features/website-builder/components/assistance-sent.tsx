"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { ASSISTANCE_TIMINGS, CONTACT_METHODS, firstName, goalsSummary, labelOf, type AssistanceRequest } from "../assistance-options";

type AssistanceSentProps = {
  propertyName: string;
  dashboardHref: string;
  request: AssistanceRequest | null;
};

// Confirmation after "Send request": the request ID and what was asked for.
export function AssistanceSent({ propertyName, dashboardHref, request }: AssistanceSentProps) {
  const [copied, setCopied] = useState(false);

  if (!request) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-office-icon">No request sent yet</h1>
        <p className="mt-2 text-sm text-office-muted">Tell WEMIXT about your property and they will build your website.</p>
        <Button asChild variant="office" className="mt-5 h-11 gap-2 px-5 font-semibold">
          <Link href={`${COMPANY_PATHS.website}/assistance`}>
            Request WEMIXT assistance
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </Card>
    );
  }

  const method = labelOf(CONTACT_METHODS, request.contactMethod);
  const contact = request.contactMethod === "email" ? `Email · ${request.email}` : `${method} · ${request.phone}`;
  const name = firstName(request.contactName);

  async function copyReference() {
    if (!request) return;
    try {
      await navigator.clipboard.writeText(request.reference);
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
      <h1 className="mt-5 text-2xl font-semibold text-office-icon">Request sent to WEMIXT!</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-office-muted">
        Thanks{name ? `, ${name}` : ""}. Our team has received your request and will contact you{" "}
        {request.contactMethod === "phone" ? "by phone" : `on ${method}`} within 1 business day.
      </p>
      <button
        type="button"
        onClick={copyReference}
        aria-label={copied ? "Request ID copied" : `Copy request ID ${request.reference}`}
        className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full bg-office-tint-teal px-3.5 py-1.5 text-xs text-office-primary"
      >
        Request ID: <span className="font-semibold">{request.reference}</span>
        {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
      </button>

      <dl className="mt-6 flex flex-col gap-2.5 rounded-xl bg-office-chip/60 p-4 text-left text-sm">
        <Row label="Property" value={request.propertyName ?? propertyName} />
        <Row label="Contact" value={contact} />
        <Row label="Goals" value={goalsSummary(request.goals)} />
        <Row label="Needed by" value={labelOf(ASSISTANCE_TIMINGS, request.timing)} />
      </dl>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button asChild variant="outline" className="h-11 border-office-meter-track bg-card font-semibold text-office-icon hover:bg-office-chip">
          <Link href={dashboardHref}>Go to dashboard</Link>
        </Button>
        <Button asChild variant="office" className="h-11 font-semibold">
          <Link href={`${COMPANY_PATHS.website}/assistance/request`}>View request</Link>
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
      <dd className="text-right font-semibold break-words text-office-icon">{value}</dd>
    </div>
  );
}
