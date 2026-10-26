"use client";

import {
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CircleCheck,
  FileImage,
  FileText,
  Headphones,
  Phone,
  Send,
  Upload,
  X,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import {
  WEMIXT_PACKAGE,
  WEMIXT_PHONE,
  WEMIXT_STEPS,
} from "../assistance-config";
import { DRAFT_KEYS, useTemplateDraft } from "./template-draft";
import { Field, inputClass, SelectInput } from "./template-fields";
import { FILE_KEYS, useTemplateFiles } from "./template-files";

const GOALS = [
  "Get direct bookings",
  "Show rooms & prices",
  "Photo gallery",
  "Multi-language",
  "Local experiences",
  "Online payments",
  "Guest reviews",
];
const STYLES = [
  "Coastal & relaxed",
  "Modern & minimal",
  "Luxury & elegant",
  "Cozy & traditional",
];
const TIMINGS = [
  "Within 1 week",
  "Within 2 weeks",
  "Within a month",
  "No rush",
];
const CONTACT_BY = ["WhatsApp", "Phone call", "Email"] as const;
const FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILES = 20;
const MAX_BYTES = 25 * 1024 * 1024;
const NOTES_MAX = 600;
const NO_FILES: File[] = [];

type AssistanceRequest = {
  name: string;
  phone: string;
  email: string;
  goals: string[];
  style: string;
  timing: string;
  notes: string;
  contactBy: (typeof CONTACT_BY)[number];
  // When the request was sent; null while it is being written.
  sentAt: string | null;
};

type AssistanceRequestProps = {
  propertyName: string;
  // The signed-in staff member, as the starting contact name.
  staffName: string;
};

// "Request WEMIXT assistance": the owner's details, what the site should
// do, photos and how to be contacted. The form is kept as a draft in this
// browser while it is filled in.
export function AssistanceRequest({
  propertyName,
  staffName,
}: AssistanceRequestProps) {
  const { values, update, save } = useTemplateDraft<AssistanceRequest>(
    DRAFT_KEYS.assistance,
    {
      name: staffName,
      phone: "",
      email: "",
      goals: ["Get direct bookings", "Show rooms & prices"],
      style: STYLES[0],
      timing: TIMINGS[1],
      notes: "",
      contactBy: "WhatsApp",
      sentAt: null,
    },
  );
  const [files, setFiles] = useTemplateFiles(
    FILE_KEYS.assistanceFiles,
    NO_FILES,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: send the request (and files) to WEMIXT once the assistance
    // service exists.
    save({ sentAt: new Date().toISOString() });
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        href={COMPANY_PATHS.website}
        className="focus-ring inline-flex items-center gap-2 self-start rounded-md text-sm font-medium text-office-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to options
      </Link>
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-office-primary uppercase">
          WEMIXT assistance
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Let us build your website
        </h1>
        <p className="mt-2 text-sm text-office-muted sm:text-base">
          Tell us about your property and our team will design and set up your
          website for you.
        </p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          {values.sentAt ? (
            <Sent
              request={values}
              files={files.length}
              onEdit={() => save({ sentAt: null })}
            />
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-office-meter-track bg-card shadow-[0_4px_16px_rgb(15_107_110/0.06)]"
            >
              <Step number={1} title="Your details">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="assist-property" label="Property">
                    <input
                      id="assist-property"
                      readOnly
                      value={propertyName}
                      className={cn(
                        inputClass,
                        "bg-office-chip/60 text-office-icon",
                      )}
                    />
                  </Field>
                  <Field id="assist-name" label="Your name">
                    <input
                      id="assist-name"
                      required
                      autoComplete="name"
                      maxLength={80}
                      value={values.name}
                      onChange={(event) => update({ name: event.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field id="assist-phone" label="Phone / WhatsApp">
                    <input
                      id="assist-phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      inputMode="tel"
                      pattern="[+0-9 ()-]{9,20}"
                      title="Use digits, spaces and an optional +, e.g. +94 77 123 4567"
                      value={values.phone}
                      onChange={(event) =>
                        update({ phone: event.target.value })
                      }
                      placeholder="+94 77 123 4567"
                      className={inputClass}
                    />
                  </Field>
                  <Field id="assist-email" label="Email">
                    <input
                      id="assist-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={values.email}
                      onChange={(event) =>
                        update({ email: event.target.value })
                      }
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </Step>

              <Step number={2} title="Your website">
                <fieldset>
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <legend className="text-sm font-semibold text-office-icon">
                      What should your website do?
                    </legend>
                    <span className="text-xs text-office-muted">
                      Choose all that apply
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map((goal) => {
                      const on = values.goals.includes(goal);
                      return (
                        <label
                          key={goal}
                          className={cn(
                            "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-office-primary",
                            on
                              ? "border-brand-cyan bg-[#f4fbfc] text-office-primary"
                              : "border-office-meter-track bg-card text-office-icon hover:border-brand-cyan/60",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() =>
                              update({
                                goals: on
                                  ? values.goals.filter((item) => item !== goal)
                                  : [...values.goals, goal],
                              })
                            }
                            className="sr-only"
                          />
                          {on ? (
                            <Check
                              aria-hidden="true"
                              className="size-3.5"
                              strokeWidth={2.5}
                            />
                          ) : null}
                          {goal}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field id="assist-style" label="Preferred style">
                    <SelectInput
                      id="assist-style"
                      options={STYLES}
                      value={values.style}
                      onChange={(event) =>
                        update({ style: event.target.value })
                      }
                    />
                  </Field>
                  <Field id="assist-timing" label="When do you need it?">
                    <SelectInput
                      id="assist-timing"
                      options={TIMINGS}
                      value={values.timing}
                      onChange={(event) =>
                        update({ timing: event.target.value })
                      }
                    />
                  </Field>
                </div>
                <Field
                  id="assist-notes"
                  label="Anything else we should know?"
                  hint={`Optional · ${values.notes.length} / ${NOTES_MAX}`}
                  className="mt-4"
                >
                  <textarea
                    id="assist-notes"
                    rows={3}
                    maxLength={NOTES_MAX}
                    value={values.notes}
                    onChange={(event) => update({ notes: event.target.value })}
                    placeholder="e.g. We have 6 rooms and want guests to book directly instead of through agents. We'd love a calm, beachy look."
                    className={cn(
                      inputClass,
                      "h-auto resize-y py-2.5 leading-relaxed",
                    )}
                  />
                </Field>
              </Step>

              <Step number={3} title="Photos & logo">
                <FileDrop files={files} onChange={setFiles} />
                <fieldset className="mt-5">
                  <legend className="mb-2 text-sm font-semibold text-office-icon">
                    How should we contact you?
                  </legend>
                  <div className="grid grid-cols-3 rounded-lg border border-office-meter-track p-1">
                    {CONTACT_BY.map((option) => (
                      <label key={option} className="cursor-pointer">
                        <input
                          type="radio"
                          name="contact-by"
                          checked={values.contactBy === option}
                          onChange={() => update({ contactBy: option })}
                          className="peer sr-only"
                        />
                        <span
                          className={cn(
                            "flex h-9 items-center justify-center rounded-md text-sm font-medium peer-focus-visible:ring-2 peer-focus-visible:ring-office-primary",
                            values.contactBy === option
                              ? "bg-office-primary text-white"
                              : "text-office-icon hover:bg-office-chip",
                          )}
                        >
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </Step>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-office-meter-track px-6 py-4">
                <p className="text-xs text-office-muted">
                  We usually reply within 1 business day.
                </p>
                <Button
                  type="submit"
                  variant="office"
                  className="h-11 gap-2 px-5 font-semibold"
                >
                  <Send aria-hidden="true" className="size-4" />
                  Send request
                </Button>
              </div>
            </form>
          )}
        </div>

        <aside
          aria-label="About WEMIXT assistance"
          className="flex flex-col gap-4 lg:w-80 lg:shrink-0"
        >
          <section className="rounded-2xl border border-office-meter-track bg-card p-5 shadow-[0_4px_16px_rgb(15_107_110/0.06)]">
            <h2 className="font-semibold text-office-icon">
              What happens next
            </h2>
            <ol className="mt-4 flex flex-col gap-4">
              {WEMIXT_STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-office-primary text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-office-icon">
                      {step.title}
                    </span>
                    <span className="block text-xs leading-relaxed text-office-muted">
                      {step.text}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl bg-office-primary p-5 text-white shadow-[0_4px_16px_rgb(15_107_110/0.18)]">
            <p className="text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">
              Done-for-you package
            </p>
            <p className="mt-2">
              <span className="text-2xl font-bold">
                From LKR {WEMIXT_PACKAGE.priceFrom.toLocaleString("en-US")}
              </span>
              <span className="ml-1.5 text-sm text-white/80">one-time</span>
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {WEMIXT_PACKAGE.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check
                    aria-hidden="true"
                    className="size-4 shrink-0 text-white/80"
                    strokeWidth={2.5}
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </section>

          <a
            href={WEMIXT_PHONE.href}
            className="focus-ring flex items-center gap-3 rounded-2xl border border-office-meter-track bg-card p-4 shadow-[0_4px_16px_rgb(15_107_110/0.06)] hover:bg-office-chip/40"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-office-tint-teal text-office-primary">
              <Headphones aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-office-icon">
                Prefer to talk first?
              </span>
              <span className="block text-xs text-office-muted">
                Call WEMIXT: {WEMIXT_PHONE.display}
              </span>
            </span>
            <Phone aria-hidden="true" className="size-4 text-office-primary" />
          </a>
        </aside>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  const id = `assist-step-${number}`;
  return (
    <section
      aria-labelledby={id}
      className="border-b border-office-meter-track px-6 py-5 last-of-type:border-b-0"
    >
      <h2
        id={id}
        className="mb-4 flex items-center gap-2.5 font-semibold text-office-icon"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-office-tint-teal text-xs font-semibold text-office-primary">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

// Drop zone and list for photos, logo and PDFs (kept in this browser
// session until the request can be sent).
function FileDrop({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function add(list: FileList | null) {
    if (inputRef.current) inputRef.current.value = "";
    if (!list?.length) return;
    const chosen = [...list];
    const accepted = chosen.filter(
      (file) => FILE_TYPES.includes(file.type) && file.size <= MAX_BYTES,
    );
    const space = MAX_FILES - files.length;
    setError(
      accepted.length < chosen.length
        ? "Some files were skipped: use JPG, PNG or PDF up to 25 MB each."
        : accepted.length > space
          ? `Up to ${MAX_FILES} files; the extra ones were skipped.`
          : null,
    );
    onChange([...files, ...accepted.slice(0, space)]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    add(event.dataTransfer.files);
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-wrap items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-colors",
          over
            ? "border-office-primary bg-office-tint-teal/60"
            : "border-office-meter-track bg-office-chip/30",
        )}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-office-tint-teal text-office-primary">
          <Upload aria-hidden="true" className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-office-icon">
            Drag photos here or browse
          </span>
          <span className="block text-xs text-office-muted">
            JPG, PNG or PDF · up to {MAX_FILES} files ({files.length} added)
          </span>
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={files.length >= MAX_FILES}
          className="h-9 border-office-meter-track bg-card px-3.5 text-sm font-semibold text-office-icon hover:bg-office-chip"
        >
          Browse files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={FILE_TYPES.join(",")}
          aria-label="Add photos, logo or PDFs"
          tabIndex={-1}
          className="sr-only"
          onChange={(event) => add(event.target.files)}
        />
      </div>
      {error ? (
        <p
          role="alert"
          className="mt-2 text-xs font-medium text-office-danger-text"
        >
          {error}
        </p>
      ) : null}
      {files.length ? (
        <ul className="mt-3 flex flex-col gap-2">
          {files.map((file, index) => {
            const Icon = file.type === "application/pdf" ? FileText : FileImage;
            return (
              <li
                key={`${file.name}-${file.lastModified}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-office-meter-track px-3 py-2"
              >
                <Icon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-office-primary"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-office-icon">
                  {file.name}
                </span>
                <span className="shrink-0 text-xs text-office-muted">
                  {formatSize(file.size)}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() =>
                    onChange(files.filter((_, other) => other !== index))
                  }
                  className="focus-ring inline-flex size-7 shrink-0 items-center justify-center rounded-md text-office-muted hover:bg-office-chip hover:text-office-icon"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

// Shown once the request is sent: what was asked for, and a way to change it.
function Sent({
  request,
  files,
  onEdit,
}: {
  request: AssistanceRequest;
  files: number;
  onEdit: () => void;
}) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-office-meter-track bg-card p-6 shadow-[0_4px_16px_rgb(15_107_110/0.06)]"
    >
      <p className="flex items-center gap-2.5 text-lg font-semibold text-office-icon">
        <CircleCheck
          aria-hidden="true"
          className="size-6 text-office-primary"
        />
        Request received
      </p>
      <p className="mt-2 text-sm text-office-muted">
        WEMIXT will contact {request.name || "you"} by{" "}
        {request.contactBy.toLowerCase()} — usually within 1 business day.
      </p>
      <dl className="mt-5 grid gap-3 rounded-xl bg-office-chip/50 p-4 text-sm sm:grid-cols-2">
        <Summary label="Phone / WhatsApp" value={request.phone} />
        <Summary label="Email" value={request.email} />
        <Summary
          label="Website should"
          value={request.goals.join(", ") || "—"}
        />
        <Summary
          label="Style · timing"
          value={`${request.style} · ${request.timing}`}
        />
        <Summary
          label="Files"
          value={`${files} ${files === 1 ? "file" : "files"}`}
        />
      </dl>
      <p className="mt-4 text-xs text-office-muted">
        Sending to WEMIXT needs the assistance service, which is not connected
        yet.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onEdit}
        className="mt-4 h-10 border-office-meter-track bg-card px-4 font-semibold text-office-icon hover:bg-office-chip"
      >
        Edit request
      </Button>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-office-muted">{label}</dt>
      <dd className="font-medium break-words text-office-icon">{value}</dd>
    </div>
  );
}

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1
    ? `${mb.toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
