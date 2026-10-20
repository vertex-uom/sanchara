"use client";

import { useId, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, Hotel, Loader2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format/money";
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from "../components/form";
import { AdminButton, AdminButtonLink, AdminCard } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import type { CompanyDraft, CompanyPlan, OwnerCredentials, PlanDefinition } from "../types";
import { EMPTY_DRAFT, issueCredentials, toSubdomain, validateStep, type StepErrors, type StepKey } from "./credentials";
import { CredentialsPanel } from "./credentials-panel";
import { onboardingHref } from "./search-params";

type Step = { key: StepKey | "review" | "done"; label: string };

const STEPS: Step[] = [
  { key: "company", label: "Company" },
  { key: "property", label: "First property" },
  { key: "owner", label: "Owner" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

type Props = {
  plans: PlanDefinition[];
  propertyTypes: readonly string[];
  reservedSubdomains: string[];
  platformDomain: string;
  backOfficeHost: string;
};

// Four steps and a result, like a cloud console's "create user" flow. State is
// local: nothing is saved until Create, and the credentials are shown once.
export function CreateCompanyWizard({ plans, propertyTypes, reservedSubdomains, platformDomain, backOfficeHost }: Props) {
  const [draft, setDraft] = useState<CompanyDraft>(EMPTY_DRAFT);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<StepErrors>({});
  const [subdomainEdited, setSubdomainEdited] = useState(false);
  const [propertyNameEdited, setPropertyNameEdited] = useState(false);
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState<OwnerCredentials | null>(null);

  const step = STEPS[stepIndex];

  const patch = <K extends keyof CompanyDraft>(section: K, changes: Partial<CompanyDraft[K]>) => setDraft((d) => ({ ...d, [section]: { ...d[section], ...changes } }));

  const onCompanyName = (name: string) => {
    patch("company", { name, ...(subdomainEdited ? {} : { subdomain: toSubdomain(name) }) });
    if (!propertyNameEdited) patch("property", { name });
  };

  const goTo = (index: number) => {
    setErrors({});
    setStepIndex(index);
  };

  const next = () => {
    if (step.key === "company" || step.key === "property" || step.key === "owner") {
      const found = validateStep(step.key, draft, reservedSubdomains);
      setErrors(found);
      if (Object.keys(found).length > 0) return;
    }
    goTo(stepIndex + 1);
  };

  const create = () => {
    setCreating(true);
    // TODO(onboarding): POST to the platform-admin API; it returns the credentials.
    window.setTimeout(() => {
      setCredentials(issueCredentials(draft, backOfficeHost, new Date()));
      setCreating(false);
      goTo(STEPS.length - 1);
    }, 900);
  };

  const reset = () => {
    setDraft(EMPTY_DRAFT);
    setSubdomainEdited(false);
    setPropertyNameEdited(false);
    setCredentials(null);
    goTo(0);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <Stepper steps={STEPS} current={stepIndex} done={credentials !== null} onSelect={goTo} />

      <AdminCard aria-labelledby="create-company-step-title" className="flex flex-col gap-5">
        {step.key === "company" ? (
          <StepBody title="Company" description={`The company's site will be at {subdomain}.${platformDomain}. The Owner can change the name later; the subdomain is fixed.`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name" id="company-name" error={errors.name} className="sm:col-span-2">
                <AdminInput id="company-name" value={draft.company.name} onChange={(e) => onCompanyName(e.target.value)} placeholder="e.g. Tea Hill Cottages" autoComplete="organization" />
              </Field>
              <Field label="Subdomain" id="company-subdomain" error={errors.subdomain} hint={`${draft.company.subdomain || "subdomain"}.${platformDomain}`}>
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
              <Field label="Town or area" id="company-location" error={errors.location}>
                <AdminInput id="company-location" value={draft.company.location} onChange={(e) => patch("company", { location: e.target.value })} placeholder="e.g. Ella" />
              </Field>
            </div>
            <PlanPicker plans={plans} value={draft.company.plan} onChange={(plan) => patch("company", { plan })} />
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
                />
              </Field>
              <Field label="Property type" id="property-type" error={errors.type}>
                <AdminSelect id="property-type" value={draft.property.type} onChange={(e) => patch("property", { type: e.target.value })}>
                  <option value="">Choose…</option>
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </AdminSelect>
              </Field>
              <Field label="Address" id="property-address" error={errors.address} className="sm:col-span-2">
                <AdminTextarea id="property-address" rows={2} value={draft.property.address} onChange={(e) => patch("property", { address: e.target.value })} placeholder="Street, town, postcode" autoComplete="street-address" />
              </Field>
            </div>
          </StepBody>
        ) : null}

        {step.key === "owner" ? (
          <StepBody title="Owner" description="The Owner account is created with a temporary password. The Owner must change it at first sign-in and can then invite Managers and Front Desk staff.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" id="owner-name" error={errors.ownerName} className="sm:col-span-2">
                <AdminInput id="owner-name" value={draft.owner.name} onChange={(e) => patch("owner", { name: e.target.value })} placeholder="e.g. Nadeesha Herath" autoComplete="name" />
              </Field>
              <Field label="Email" id="owner-email" error={errors.email} hint="The owner-portal link and temporary password are sent here.">
                <AdminInput id="owner-email" type="email" value={draft.owner.email} onChange={(e) => patch("owner", { email: e.target.value.trim().toLowerCase() })} placeholder="owner@example.lk" autoComplete="email" inputMode="email" />
              </Field>
              <Field label="Phone" id="owner-phone" error={errors.phone}>
                <AdminInput id="owner-phone" type="tel" value={draft.owner.phone} onChange={(e) => patch("owner", { phone: e.target.value })} placeholder="+94 77 123 4567" autoComplete="tel" inputMode="tel" />
              </Field>
            </div>
            <Notice icon={ShieldCheck}>The owner-portal sign-in is separate from the staff sign-in. Its link goes only to the Owner; never share it with Managers or Front Desk staff.</Notice>
          </StepBody>
        ) : null}

        {step.key === "review" ? (
          <StepBody title="Review" description="Check the details, then create the company. The Owner is emailed straight away.">
            <div className="grid gap-3 md:grid-cols-3">
              <Summary icon={Building2} title="Company" onEdit={() => goTo(0)} rows={[["Name", draft.company.name], ["Site", `${draft.company.subdomain}.${platformDomain}`], ["Town", draft.company.location], ["Plan", planLabel(plans, draft.company.plan)]]} />
              <Summary icon={Hotel} title="First property" onEdit={() => goTo(1)} rows={[["Name", draft.property.name], ["Type", draft.property.type], ["Address", draft.property.address]]} />
              <Summary icon={UserRound} title="Owner" onEdit={() => goTo(2)} rows={[["Name", draft.owner.name], ["Email", draft.owner.email], ["Phone", draft.owner.phone]]} />
            </div>
            <div>
              <h3 className="mb-2 text-[12.5px] font-semibold text-admin-heading">When you create</h3>
              <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[12.5px] text-admin-body">
                <li>The company is opened with status Pending setup and its first property.</li>
                <li>An Owner account is created with a temporary password; the Owner must change it at first sign-in.</li>
                <li>An email with the owner-portal link and the temporary password goes to {draft.owner.email}. Both are valid for 72 hours.</li>
                <li>The password is shown to you once, on the next screen, with a CSV you can keep.</li>
                <li>Everything is recorded in the audit log under your name.</li>
              </ol>
            </div>
          </StepBody>
        ) : null}

        {step.key === "done" && credentials ? <CredentialsPanel credentials={credentials} onCreateAnother={reset} /> : null}

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
              <AdminButton icon={creating ? Loader2 : Mail} variant="primary" onClick={create} disabled={creating} aria-busy={creating || undefined} className={creating ? "[&>svg]:animate-spin" : undefined}>
                {creating ? "Creating and emailing the Owner…" : "Create company and email the Owner"}
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

function planLabel(plans: PlanDefinition[], plan: CompanyPlan) {
  const found = plans.find((p) => p.id === plan);
  return found ? `${found.name} · ${formatMoney(found.monthlyPrice)}/month` : plan;
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

function PlanPicker({ plans, value, onChange }: { plans: PlanDefinition[]; value: CompanyPlan; onChange: (plan: CompanyPlan) => void }) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-1.5 text-[11px] leading-[14px] font-medium text-admin-muted-text">Plan</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {plans.map((plan) => {
          const selected = plan.id === value;
          return (
            <label key={plan.id} className={cn("focus-within:focus-ring flex cursor-pointer flex-col gap-1 rounded-[10px] border p-3 transition-colors motion-reduce:transition-none", selected ? "border-admin-primary bg-admin-primary-soft" : "border-admin-border hover:bg-admin-muted/60")}>
              <span className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-admin-heading">{plan.name}</span>
                <input type="radio" name={name} value={plan.id} checked={selected} onChange={() => onChange(plan.id)} className="size-4 accent-admin-primary" />
              </span>
              <span className="text-[12.5px] font-medium text-admin-heading">
                {formatMoney(plan.monthlyPrice)}
                <span className="font-normal text-admin-muted-text">/month</span>
              </span>
              <span className="text-[11px] text-admin-muted-text">
                {plan.limits.properties === null ? "Unlimited" : plan.limits.properties} {plan.limits.properties === 1 ? "property" : "properties"} · {plan.limits.staffAccounts === null ? "unlimited" : plan.limits.staffAccounts} staff
              </span>
            </label>
          );
        })}
      </div>
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
      <dl className="flex flex-col gap-1 text-[12px]">
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
    <p className="flex items-start gap-2 rounded-[10px] bg-admin-info-soft px-3 py-2.5 text-[12px] leading-snug text-admin-info">
      <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
