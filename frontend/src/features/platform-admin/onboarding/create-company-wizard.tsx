"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, Hotel, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format/money";
import { AdminField, AdminInput, AdminSelect } from "../components/form";
import { AdminButton, AdminButtonLink, AdminCard } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import type { CompanyDraft, CreatedCompany, OnboardingOptions, OnboardingPlan } from "../types";
import { checkSubdomain, createCompany, type SubdomainAvailability } from "./actions";
import { FIELD_STEP, SUBDOMAIN_PATTERN, emailError, emptyDraft, phoneError, toSubdomain, validateStep, type FieldKey, type StepErrors, type StepKey } from "./draft";
import { InvitePanel } from "./invite-panel";
import { onboardingHref } from "./search-params";

type Step = { key: StepKey | "review" | "done"; label: string };

const STEPS: Step[] = [
  { key: "company", label: "Company" },
  { key: "property", label: "First property" },
  { key: "owner", label: "Owner" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

// Wait this long after typing before checking the subdomain with the API.
const SUBDOMAIN_CHECK_DELAY_MS = 400;

const DEFAULT_PLAN = "STANDARD";

// Draft paths → the wizard field whose error they clear.
const DRAFT_FIELD: Record<string, FieldKey | undefined> = {
  "company.name": "name",
  "company.subdomain": "subdomain",
  "company.town": "town",
  "company.planCode": "plan",
  "property.name": "propertyName",
  "property.typeCode": "type",
  "property.line1": "line1",
  "property.line2": "line2",
  "property.city": "city",
  "property.districtId": "district",
  "property.postalCode": "postalCode",
  "owner.fullName": "ownerName",
  "owner.email": "email",
  "owner.phone": "phone",
};

function omit(errors: StepErrors, fields: (FieldKey | undefined)[]): StepErrors {
  const next = { ...errors };
  for (const field of fields) if (field) delete next[field];
  return next;
}

// Four steps and a result, like a cloud console's "create user" flow. State is
// local: nothing is saved until Create, and the Owner's invite link is shown once.
export function CreateCompanyWizard({ options }: { options: OnboardingOptions }) {
  const { plans, propertyTypes, provinces, reservedSubdomains, platformDomain } = options;
  const initialPlan = plans.some((plan) => plan.code === DEFAULT_PLAN) ? DEFAULT_PLAN : (plans[0]?.code ?? "");
  const [draft, setDraft] = useState<CompanyDraft>(() => emptyDraft(initialPlan));
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<StepErrors>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [subdomainEdited, setSubdomainEdited] = useState(false);
  const [propertyNameEdited, setPropertyNameEdited] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedCompany | null>(null);
  const availability = useSubdomainAvailability(draft.company.subdomain, reservedSubdomains);

  const step = STEPS[stepIndex];

  const patch = <K extends keyof CompanyDraft>(section: K, changes: Partial<CompanyDraft[K]>) => {
    setDraft((d) => ({ ...d, [section]: { ...d[section], ...changes } }));
    // Editing a field clears its error; the rest stay until the next check.
    const edited = Object.keys(changes).map((key) => DRAFT_FIELD[`${section}.${key}`]);
    setErrors((current) => (edited.some((field) => field && current[field]) ? omit(current, edited) : current));
  };

  // Email and phone are checked as you type; an empty field waits for Next.
  const patchChecked = (field: "email" | "phone", value: string) => {
    patch("owner", { [field]: value });
    const problem = value.trim() ? (field === "email" ? emailError(value) : phoneError(value)) : undefined;
    setErrors((current) => (problem ? { ...current, [field]: problem } : omit(current, [field])));
  };

  const onCompanyName = (name: string) => {
    patch("company", { name, ...(subdomainEdited ? {} : { subdomain: toSubdomain(name) }) });
    if (!propertyNameEdited) patch("property", { name });
  };

  const goTo = (index: number) => {
    setErrors({});
    setFormMessage(null);
    setStepIndex(index);
  };

  const next = () => {
    if (step.key === "company" || step.key === "property" || step.key === "owner") {
      const found = validateStep(step.key, draft, reservedSubdomains);
      // A subdomain the API already reported as taken stops the step too.
      if (step.key === "company" && !found.subdomain && availability?.subdomain === draft.company.subdomain && availability.reason === "taken") {
        found.subdomain = "This subdomain is already in use.";
      }
      setErrors(found);
      if (Object.keys(found).length > 0) return;
    }
    goTo(stepIndex + 1);
  };

  const create = async () => {
    setCreating(true);
    setFormMessage(null);
    const result = await createCompany(draft).catch(() => ({ ok: false as const, message: "Something went wrong. Please try again.", fieldErrors: {} }));
    setCreating(false);
    if (result.ok) {
      setCreated(result.created);
      goTo(STEPS.length - 1);
      return;
    }
    // Field errors: back to the first step that has one, with the messages shown.
    const firstField = (Object.keys(result.fieldErrors) as FieldKey[])[0];
    if (firstField) {
      setStepIndex(STEPS.findIndex((s) => s.key === FIELD_STEP[firstField]));
      setErrors(result.fieldErrors);
    }
    setFormMessage(result.message);
  };

  const reset = () => {
    setDraft(emptyDraft(initialPlan));
    setSubdomainEdited(false);
    setPropertyNameEdited(false);
    setCreated(null);
    goTo(0);
  };

  const district = provinces.flatMap((p) => p.districts.map((d) => ({ ...d, province: p.name }))).find((d) => String(d.id) === draft.property.districtId);
  const addressSummary = [draft.property.line1, draft.property.line2, draft.property.city, district ? `${district.name} District` : "", draft.property.postalCode]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
  const typeName = propertyTypes.find((t) => t.code === draft.property.typeCode)?.name ?? "";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <Stepper steps={STEPS} current={stepIndex} done={created !== null} onSelect={goTo} />

      <AdminCard aria-labelledby="create-company-step-title" className="flex flex-col gap-5">
        {formMessage && step.key !== "done" ? (
          <p role="alert" className="rounded-[10px] bg-admin-danger-soft px-3 py-2.5 text-[12.5px] text-admin-danger">
            {formMessage}
          </p>
        ) : null}

        {step.key === "company" ? (
          <StepBody title="Company" description={`The company's site will be at {subdomain}.${platformDomain}. The Owner can change the name later; the subdomain is fixed.`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name" id="company-name" error={errors.name} className="sm:col-span-2">
                <AdminInput id="company-name" value={draft.company.name} onChange={(e) => onCompanyName(e.target.value)} placeholder="e.g. Tea Hill Cottages" autoComplete="organization" maxLength={120} />
              </Field>
              <Field label="Subdomain" id="company-subdomain" error={errors.subdomain} hint={subdomainHint(draft.company.subdomain, platformDomain, availability)}>
                <AdminInput
                  id="company-subdomain"
                  value={draft.company.subdomain}
                  onChange={(e) => {
                    setSubdomainEdited(true);
                    patch("company", { subdomain: toSubdomain(e.target.value) });
                  }}
                  placeholder="tea-hill-cottages"
                  spellCheck={false}
                  autoCapitalize="none"
                />
              </Field>
              <Field label="Town or area" id="company-town" error={errors.town}>
                <AdminInput id="company-town" value={draft.company.town} onChange={(e) => patch("company", { town: e.target.value })} placeholder="e.g. Ella" maxLength={80} />
              </Field>
            </div>
            <PlanPicker plans={plans} value={draft.company.planCode} error={errors.plan} onChange={(planCode) => patch("company", { planCode })} />
          </StepBody>
        ) : null}

        {step.key === "property" ? (
          <StepBody title="First property" description="Every company starts with one property; the Owner adds rooms, rates and more properties in Back Office.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Property name" id="property-name" error={errors.propertyName}>
                <AdminInput
                  id="property-name"
                  value={draft.property.name}
                  onChange={(e) => {
                    setPropertyNameEdited(true);
                    patch("property", { name: e.target.value });
                  }}
                  placeholder={draft.company.name || "e.g. Tea Hill Cottages"}
                  maxLength={120}
                />
              </Field>
              <Field label="Property type" id="property-type" error={errors.type}>
                <AdminSelect id="property-type" value={draft.property.typeCode} onChange={(e) => patch("property", { typeCode: e.target.value })}>
                  <option value="">Choose…</option>
                  {propertyTypes.map((type) => (
                    <option key={type.code} value={type.code}>
                      {type.name}
                    </option>
                  ))}
                </AdminSelect>
              </Field>
              <Field label="Address line 1" id="property-line1" error={errors.line1} className="sm:col-span-2">
                <AdminInput id="property-line1" value={draft.property.line1} onChange={(e) => patch("property", { line1: e.target.value })} placeholder="e.g. 12 Ella–Passara Road" autoComplete="address-line1" maxLength={160} />
              </Field>
              <Field label="Address line 2 (optional)" id="property-line2" error={errors.line2} className="sm:col-span-2">
                <AdminInput id="property-line2" value={draft.property.line2} onChange={(e) => patch("property", { line2: e.target.value })} placeholder="Building, landmark" autoComplete="address-line2" maxLength={160} />
              </Field>
              <Field label="Town or city" id="property-city" error={errors.city}>
                <AdminInput id="property-city" value={draft.property.city} onChange={(e) => patch("property", { city: e.target.value })} placeholder="e.g. Ella" autoComplete="address-level2" maxLength={80} />
              </Field>
              <Field label="District" id="property-district" error={errors.district}>
                <AdminSelect id="property-district" value={draft.property.districtId} onChange={(e) => patch("property", { districtId: e.target.value })}>
                  <option value="">Choose…</option>
                  {provinces.map((province) => (
                    <optgroup key={province.id} label={`${province.name} Province`}>
                      {province.districts.map((d) => (
                        <option key={d.id} value={String(d.id)}>
                          {d.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </AdminSelect>
              </Field>
              <Field label="Postal code (optional)" id="property-postal-code" error={errors.postalCode} hint={district ? `${district.province} Province` : undefined}>
                <AdminInput id="property-postal-code" value={draft.property.postalCode} onChange={(e) => patch("property", { postalCode: e.target.value })} placeholder="e.g. 90090" autoComplete="postal-code" inputMode="numeric" maxLength={5} />
              </Field>
            </div>
          </StepBody>
        ) : null}

        {step.key === "owner" ? (
          <StepBody title="Owner" description="The Owner account is created with an invite link. The Owner opens it, sets their own password and can then invite Managers and Front Desk staff.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" id="owner-name" error={errors.ownerName} className="sm:col-span-2">
                <AdminInput id="owner-name" value={draft.owner.fullName} onChange={(e) => patch("owner", { fullName: e.target.value })} placeholder="e.g. Nadeesha Herath" autoComplete="name" maxLength={120} />
              </Field>
              <Field label="Email" id="owner-email" error={errors.email} hint="The Owner signs in to Back Office with this email.">
                <AdminInput id="owner-email" type="email" value={draft.owner.email} onChange={(e) => patchChecked("email", e.target.value.trim().toLowerCase())} placeholder="owner@example.lk" autoComplete="email" inputMode="email" />
              </Field>
              <Field label="Phone" id="owner-phone" error={errors.phone}>
                <AdminInput id="owner-phone" type="tel" value={draft.owner.phone} onChange={(e) => patchChecked("phone", e.target.value)} placeholder="077 123 4567" autoComplete="tel" inputMode="tel" />
              </Field>
            </div>
            <Notice icon={ShieldCheck}>The invite link works once and only for the Owner. Never share it with Managers or Front Desk staff.</Notice>
          </StepBody>
        ) : null}

        {step.key === "review" ? (
          <StepBody title="Review" description="Check the details, then create the company.">
            <div className="grid gap-3 md:grid-cols-3">
              <Summary icon={Building2} title="Company" onEdit={() => goTo(0)} rows={[["Name", draft.company.name], ["Site", `${draft.company.subdomain}.${platformDomain}`], ["Town", draft.company.town], ["Plan", planLabel(plans, draft.company.planCode)]]} />
              <Summary icon={Hotel} title="First property" onEdit={() => goTo(1)} rows={[["Name", draft.property.name], ["Type", typeName], ["Address", addressSummary]]} />
              <Summary icon={UserRound} title="Owner" onEdit={() => goTo(2)} rows={[["Name", draft.owner.fullName], ["Email", draft.owner.email], ["Phone", draft.owner.phone]]} />
            </div>
            <div>
              <h3 className="mb-2 text-[12.5px] font-semibold text-admin-heading">When you create</h3>
              <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[12.5px] text-admin-body">
                <li>The company is opened with status Pending setup, its first property and the chosen plan.</li>
                <li>An Owner account is created for {draft.owner.email || "the Owner"}, with no password yet.</li>
                <li>You get a single-use invite link, valid for 72 hours, on the next screen. Email isn&apos;t connected yet, so send it to the Owner yourself.</li>
                <li>When the Owner opens it and sets a password, the company becomes Active.</li>
                <li>Everything is recorded in the audit log under your name.</li>
              </ol>
            </div>
          </StepBody>
        ) : null}

        {step.key === "done" && created ? <InvitePanel created={created} onCreateAnother={reset} /> : null}

        {step.key !== "done" ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-admin-border pt-4">
            {stepIndex === 0 ? (
              <AdminButtonLink href={onboardingHref()} icon={ArrowLeft}>
                Cancel
              </AdminButtonLink>
            ) : (
              <AdminButton icon={ArrowLeft} onClick={() => goTo(stepIndex - 1)} disabled={creating}>
                Back
              </AdminButton>
            )}
            {step.key === "review" ? (
              <AdminButton icon={creating ? Loader2 : Building2} variant="primary" onClick={create} disabled={creating} aria-busy={creating || undefined} className={creating ? "[&>svg]:animate-spin" : undefined}>
                {creating ? "Creating the company…" : "Create company"}
              </AdminButton>
            ) : (
              <AdminButton icon={ArrowRight} variant="primary" onClick={next}>
                Next: {STEPS[stepIndex + 1].label}
              </AdminButton>
            )}
          </div>
        ) : null}
      </AdminCard>
    </div>
  );
}

// Asks the API whether a well-formed subdomain is free, once typing pauses.
// Null until there is an answer for the current value (or the check failed).
function useSubdomainAvailability(subdomain: string, reserved: readonly string[]) {
  const [result, setResult] = useState<SubdomainAvailability | null>(null);
  useEffect(() => {
    if (!SUBDOMAIN_PATTERN.test(subdomain) || reserved.includes(subdomain)) return;
    let current = true;
    const timer = window.setTimeout(async () => {
      const answer = await checkSubdomain(subdomain).catch(() => null);
      if (current) setResult(answer);
    }, SUBDOMAIN_CHECK_DELAY_MS);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [subdomain, reserved]);
  return result?.subdomain === subdomain ? result : null;
}

function subdomainHint(subdomain: string, platformDomain: string, availability: SubdomainAvailability | null) {
  const host = `${subdomain || "subdomain"}.${platformDomain}`;
  if (!availability) return host;
  return availability.available ? `${host} · available` : availability.reason === "taken" ? `${host} · already in use` : host;
}

function planLabel(plans: OnboardingPlan[], code: string) {
  const found = plans.find((p) => p.code === code);
  return found ? `${found.name} · ${formatMoney(found.monthlyPrice)}/month` : code;
}

function Stepper({ steps, current, done, onSelect }: { steps: Step[]; current: number; done: boolean; onSelect: (index: number) => void }) {
  return (
    <nav aria-label="Create company steps" className="rounded-[14px] border border-admin-border bg-admin-card p-3 lg:sticky lg:top-4">
      <ol className="flex gap-1 overflow-x-auto lg:flex-col">
        {steps.map((step, index) => {
          const state = index < current ? "complete" : index === current ? "current" : "upcoming";
          // Earlier steps can be revisited until the company exists.
          const clickable = state === "complete" && !done;
          const content = (
            <>
              <span aria-hidden="true" className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", state === "complete" ? "bg-admin-success text-white" : state === "current" ? "bg-admin-primary text-white" : "bg-admin-muted text-admin-muted-text")}>
                {state === "complete" ? <Check strokeWidth={2.5} className="size-3.5" /> : index + 1}
              </span>
              <span className={cn("text-[12.5px] font-medium whitespace-nowrap", state === "upcoming" ? "text-admin-muted-text" : "text-admin-heading", state !== "current" && "sr-only lg:not-sr-only")}>{step.label}</span>
            </>
          );
          return (
            <li key={step.key} aria-current={state === "current" ? "step" : undefined} className="shrink-0 lg:min-w-0 lg:shrink">
              {clickable ? (
                <button type="button" onClick={() => onSelect(index)} className="focus-ring flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-admin-muted">
                  {content}
                  <span className="sr-only"> (completed, go back)</span>
                </button>
              ) : (
                <span className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-2", state === "current" && "bg-admin-primary-soft")}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepBody({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <>
      <header>
        <h2 id="create-company-step-title" className="text-base font-semibold text-admin-heading">
          {title}
        </h2>
        <p className="mt-1 text-[12.5px] text-admin-muted-text">{description}</p>
      </header>
      {children}
    </>
  );
}

function Field({ label, id, error, hint, className, children }: { label: string; id: string; error?: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <AdminField label={label} htmlFor={id}>
        <div aria-invalid={error ? true : undefined} className={error ? "[&_input,&_select,&_textarea]:border-admin-danger" : undefined}>
          {children}
        </div>
      </AdminField>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[11px] text-admin-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="truncate text-[11px] text-admin-muted-text">{hint}</p>
      ) : null}
    </div>
  );
}

function PlanPicker({ plans, value, error, onChange }: { plans: OnboardingPlan[]; value: string; error?: string; onChange: (planCode: string) => void }) {
  const name = useId();
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="mb-1.5 text-[11px] leading-[14px] font-medium text-admin-muted-text">Plan</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {plans.map((plan) => {
          const selected = plan.code === value;
          return (
            <label key={plan.code} className={cn("focus-within:focus-ring flex cursor-pointer flex-col gap-1 rounded-[10px] border p-3 transition-colors motion-reduce:transition-none", selected ? "border-admin-primary bg-admin-primary-soft" : "border-admin-border hover:bg-admin-muted/60")}>
              <span className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-admin-heading">{plan.name}</span>
                <input type="radio" name={name} value={plan.code} checked={selected} onChange={() => onChange(plan.code)} className="size-4 accent-admin-primary" />
              </span>
              <span className="text-[12.5px] font-medium text-admin-heading">
                {formatMoney(plan.monthlyPrice)}
                <span className="font-normal text-admin-muted-text">/month</span>
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={`${name}-error`} role="alert" className="mt-1 text-[11px] text-admin-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function Summary({ icon: Icon, title, rows, onEdit }: { icon: typeof Building2; title: string; rows: [string, string][]; onEdit: () => void }) {
  return (
    <section aria-label={title} className="rounded-[10px] border border-admin-border p-3">
      <div className="mb-2 flex items-center gap-2">
        <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4 text-admin-icon" />
        <h3 className="text-[12.5px] font-semibold text-admin-heading">{title}</h3>
        <button type="button" onClick={onEdit} className="focus-ring ml-auto rounded-sm text-[11.5px] font-medium text-admin-primary hover:underline">
          Edit<span className="sr-only"> {title.toLowerCase()}</span>
        </button>
      </div>
      <dl className="flex flex-col gap-1 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="shrink-0 text-admin-muted-text">{label}</dt>
            <dd className="min-w-0 text-right font-medium break-words text-admin-heading">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Notice({ icon: Icon, children }: { icon: typeof ShieldCheck; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-[10px] bg-admin-info-soft px-3 py-2.5 text-xs leading-snug text-admin-info">
      <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
