"use client";

import {
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { WEMIXT_PHONE } from "../assistance-config";
import type {
  AssistanceProgress,
  AssistanceStage,
} from "../server/assistance-progress";
import { firstName, useAssistanceRequest } from "./assistance-draft";

const DAY_MS = 24 * 60 * 60 * 1000;
const MESSAGE_MAX = 1000;
const noSubscription = () => () => {};

const STAGES: { value: AssistanceStage; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "assigned", label: "Designer assigned" },
  { value: "designing", label: "Designing" },
  { value: "review", label: "Your review" },
  { value: "published", label: "Published" },
];

type AssistanceTrackerProps = {
  propertyName: string;
  dashboardHref: string;
  // From the assistance service (a TEMPORARY fixture for now).
  progress: AssistanceProgress;
};

type ThreadMessage = { id: string; mine: boolean; text: string; at: Date };

// "Website request": progress, messages with the designer, the draft and
// the request details. Dates count from when the owner sent the request.
export function AssistanceTracker({
  propertyName,
  dashboardHref,
  progress,
}: AssistanceTrackerProps) {
  const { values: request, save } = useAssistanceRequest();
  // The request is only readable in the browser; wait before saying "none".
  const hydrated = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const [draft, setDraft] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!hydrated) return <span className="sr-only">Loading your request</span>;

  if (!request.sentAt) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-office-meter-track bg-card p-7 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-office-icon">
          No website request yet
        </h1>
        <p className="mt-2 text-sm text-office-muted">
          Ask WEMIXT to design and set up your website for you.
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
      </div>
    );
  }

  const sent = new Date(request.sentAt);
  const after = (days: number) => new Date(sent.getTime() + days * DAY_MS);
  const draftDate = after(progress.draftAfterDays);
  const launchDate = after(progress.launchAfterDays);
  const stageIndex = STAGES.findIndex(
    (stage) => stage.value === progress.stage,
  );
  const designerInitials = progress.designer.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  const thread: ThreadMessage[] = [
    ...progress.messages.map((message) => ({
      id: message.id,
      mine: false,
      text: message.text.replace(
        "{firstName}",
        firstName(request.name) || "there",
      ),
      at: new Date(sent.getTime() + message.afterMinutes * 60_000),
    })),
    ...request.messages.map((message) => ({
      id: message.id,
      mine: true,
      text: message.text,
      at: new Date(message.at),
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    // TODO: send through the assistance service once it exists.
    save({
      messages: [
        ...request.messages,
        {
          id: crypto.randomUUID(),
          text,
          at: new Date().toISOString(),
          files: [],
        },
      ],
    });
    setDraft("");
  }

  function cancel() {
    // TODO: cancel through the assistance service once it exists.
    save({ sentAt: null, requestId: null, messages: [] });
  }

  // Dates under each stage: done stages on the sent date, the current one
  // with its target, the last with the launch estimate.
  const stageNote = (index: number) => {
    if (index < stageIndex) return formatDay(sent);
    if (index === stageIndex && STAGES[index].value === "designing")
      return `Draft by ${formatDay(draftDate)}`;
    if (index === stageIndex) return formatDay(sent);
    if (index === STAGES.length - 1) return `Est. ${formatDay(launchDate)}`;
    return "";
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <Link
        href={dashboardHref}
        className="focus-ring inline-flex items-center gap-2 self-start rounded-md text-sm font-medium text-office-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to dashboard
      </Link>
      <div>
        <h1 className="flex flex-wrap items-center gap-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Website request
          <span className="inline-flex items-center gap-1.5 rounded-full bg-office-tint-orange px-2.5 py-0.5 text-xs font-semibold text-office-ink-orange">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-office-ink-orange"
            />
            {progress.stage === "published" ? "Completed" : "In progress"}
          </span>
        </h1>
        <p className="mt-2 text-sm text-office-muted">
          Request {request.requestId} · {propertyName}
        </p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-office-icon">Progress</h2>
              <span className="inline-flex items-center gap-1.5 text-xs text-office-muted">
                <Clock aria-hidden="true" className="size-3.5" />
                Estimated launch: {formatDay(launchDate)}
              </span>
            </div>
            <ol className="mt-5 grid grid-cols-5 gap-2">
              {STAGES.map((stage, index) => {
                const done = index < stageIndex;
                const current = index === stageIndex;
                return (
                  <li
                    key={stage.value}
                    className="flex flex-col items-center text-center"
                    aria-current={current ? "step" : undefined}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full text-xs font-semibold",
                        done && "bg-office-primary text-white",
                        current &&
                          "border-2 border-office-primary bg-card text-office-primary",
                        !done && !current && "bg-office-chip text-office-muted",
                      )}
                    >
                      {done ? (
                        <Check className="size-4" strokeWidth={3} />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span
                      className={cn(
                        "mt-2 text-xs",
                        done || current
                          ? "font-semibold text-office-icon"
                          : "text-office-muted",
                      )}
                    >
                      {stage.label}
                      {done ? <span className="sr-only"> (done)</span> : null}
                    </span>
                    <span
                      className={cn(
                        "text-[0.7rem]",
                        current ? "text-office-primary" : "text-office-muted",
                      )}
                    >
                      {stageNote(index)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card>
            <h2 className="font-semibold text-office-icon">Messages</h2>
            <ol
              aria-label="Messages with your designer"
              className="mt-4 flex flex-col gap-4"
            >
              {thread.map((message) => (
                <li
                  key={message.id}
                  className={cn("flex gap-3", message.mine && "justify-end")}
                >
                  {message.mine ? null : (
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-office-primary/80 text-xs font-semibold text-white"
                    >
                      {designerInitials}
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-xl px-4 py-3",
                      message.mine
                        ? "bg-office-tint-teal"
                        : "border border-office-meter-track bg-office-chip/40",
                    )}
                  >
                    <p className="flex items-baseline justify-between gap-6 text-xs">
                      <span className="font-semibold text-office-icon">
                        {message.mine ? "You" : progress.designer.name}
                      </span>
                      <span className="text-office-muted">
                        {formatTime(message.at)}
                      </span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-office-icon">
                      {message.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <form
              onSubmit={send}
              className="mt-4 flex items-center gap-2 rounded-xl border border-office-meter-track bg-card p-1.5 pl-3.5 has-focus-visible:ring-2 has-focus-visible:ring-office-primary"
            >
              <label htmlFor="assist-message" className="sr-only">
                Write a message
              </label>
              <input
                id="assist-message"
                value={draft}
                maxLength={MESSAGE_MAX}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Write a message..."
                className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-office-muted/80"
              />
              <Button
                type="submit"
                variant="office"
                aria-label="Send message"
                disabled={!draft.trim()}
                className="size-9 shrink-0 p-0"
              >
                <Send aria-hidden="true" className="size-4" />
              </Button>
            </form>
          </Card>
        </div>

        <aside
          aria-label="Request details"
          className="flex flex-col gap-5 lg:w-80 lg:shrink-0"
        >
          <Card>
            <h2 className="font-semibold text-office-icon">Your designer</h2>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-office-primary/80 font-semibold text-white">
                {designerInitials}
              </span>
              <div>
                <p className="font-semibold text-office-icon">
                  {progress.designer.name}
                </p>
                <p className="text-xs text-office-muted">
                  {progress.designer.role}
                </p>
                {progress.designer.online ? (
                  <p className="flex items-center gap-1.5 text-xs text-office-success-text">
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-office-success-dot"
                    />
                    Online now
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="office"
                onClick={() =>
                  document.getElementById("assist-message")?.focus()
                }
                className="h-10 gap-2 font-semibold"
              >
                <MessageSquare aria-hidden="true" className="size-4" />
                Message
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 gap-2 border-office-meter-track bg-card font-semibold text-office-icon hover:bg-office-chip"
              >
                <a href={WEMIXT_PHONE.href}>
                  <Phone aria-hidden="true" className="size-4" />
                  Call
                </a>
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-office-icon">Website draft</h2>
              <span className="rounded-md bg-office-tint-orange px-2 py-0.5 text-xs font-medium text-office-ink-orange">
                {stageIndex >= 3 ? "Ready" : "In progress"}
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-office-muted">
              Your first draft will appear here on {formatDay(draftDate)}.
              You&apos;ll be able to preview it and request changes.
            </p>
            <Button
              type="button"
              disabled
              variant="outline"
              className="mt-4 h-10 w-full border-office-meter-track bg-office-chip font-semibold text-office-muted"
            >
              View draft (available {formatDay(draftDate)})
            </Button>
          </Card>

          <Card>
            <h2 className="font-semibold text-office-icon">Request details</h2>
            <dl className="mt-3 flex flex-col gap-2.5 text-sm">
              <Row label="Request ID" value={request.requestId ?? "—"} />
              <Row label="Package" value="Done-for-you" />
              <Row label="Submitted" value={formatDay(sent, true)} />
              <Row
                label="Revisions left"
                value={`${progress.revisionsLeft} of ${progress.revisionsTotal}`}
              />
            </dl>
            {confirmCancel ? (
              <div className="mt-4 rounded-lg bg-office-danger-soft p-3">
                <p className="text-xs text-office-danger-text">
                  Cancel this request? WEMIXT will stop work on your site.
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="office-danger"
                    onClick={cancel}
                    className="h-8 px-3 text-xs font-semibold"
                  >
                    Yes, cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmCancel(false)}
                    className="h-8 border-office-meter-track bg-card px-3 text-xs font-semibold text-office-icon"
                  >
                    Keep request
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="focus-ring mt-4 rounded text-sm font-semibold text-office-danger-text hover:underline"
              >
                Cancel request
              </button>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-office-meter-track bg-card p-5 shadow-[0_4px_16px_rgb(15_107_110/0.06)]">
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-office-muted">{label}</dt>
      <dd className="text-right font-semibold text-office-icon">{value}</dd>
    </div>
  );
}

// "Oct 24", or "Oct 20, 2026" with the year.
function formatDay(date: Date, withYear = false) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

// "Oct 20, 2:15 PM"
function formatTime(date: Date) {
  return `${formatDay(date)}, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}
