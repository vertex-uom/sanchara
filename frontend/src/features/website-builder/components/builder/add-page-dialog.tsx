"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { inputClass, Switch } from "../template-fields";
import { pagePath, type Builder } from "./builder-state";
import { PAGE_TEMPLATES, type PageTemplate } from "./page-templates";

type AddPageDialogProps = {
  builder: Builder;
  // Free web address shown before the page URL.
  address: string;
};

// "Add a new page": a page type with suggested sections, its name and URL,
// and whether it is in the menu and in search results.
export function AddPageDialog({ builder, address }: AddPageDialogProps) {
  return (
    <Dialog.Root open={builder.addingPage} onOpenChange={builder.setAddingPage}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[#0b2240]/40 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[min(92dvh,46rem)] w-[min(94vw,32rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl outline-none">
          {/* Remounted on each open, so the form starts fresh. */}
          {builder.addingPage ? (
            <AddPageForm builder={builder} address={address} />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AddPageForm({ builder, address }: AddPageDialogProps) {
  const [template, setTemplate] = useState<PageTemplate>(
    PAGE_TEMPLATES.find(
      (option) =>
        !builder.pathTaken(pagePath(option.name)) && option.id !== "blank",
    ) ?? PAGE_TEMPLATES[0],
  );
  const [name, setName] = useState(template.name);
  // The URL follows the name until it is edited by hand.
  const [slug, setSlug] = useState<string | null>(null);
  const [inNav, setInNav] = useState(true);
  const [noIndex, setNoIndex] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const path = slug === null ? pagePath(name) : pagePath(slug);

  function chooseTemplate(next: PageTemplate) {
    // Keep a name the user typed; otherwise follow the page type.
    if (name === template.name) setName(next.name);
    setTemplate(next);
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Give the page a name.");
    if (path === "/" || builder.pathTaken(path))
      return setError(
        `Another page already uses ${path}. Choose a different URL.`,
      );
    builder.addPage({
      name: trimmed,
      path,
      inNav,
      noIndex,
      sections: template.sections,
    });
    builder.setAddingPage(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-office-meter-track px-6 py-5">
        <div>
          <Dialog.Title className="text-xl font-semibold text-office-icon">
            Add a new page
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-office-muted">
            Pick a page type. It comes with suggested sections you can edit.
          </Dialog.Description>
        </div>
        <Dialog.Close
          aria-label="Close"
          className="focus-ring inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-office-meter-track text-office-icon hover:bg-office-chip"
        >
          <X aria-hidden="true" className="size-4" />
        </Dialog.Close>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        <fieldset>
          <legend className="mb-2.5 text-sm font-semibold text-office-icon">
            Page type
          </legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PAGE_TEMPLATES.map((option) => {
              const selected = option.id === template.id;
              const Icon = option.icon;
              return (
                <label
                  key={option.id}
                  className={cn(
                    "cursor-pointer rounded-xl border-[1.5px] p-3.5 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-office-primary",
                    selected
                      ? "border-brand-cyan bg-[#f4fbfc]"
                      : "border-office-meter-track bg-card hover:border-brand-cyan/60",
                  )}
                >
                  <input
                    type="radio"
                    name="page-type"
                    checked={selected}
                    onChange={() => chooseTemplate(option)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      selected
                        ? "bg-office-tint-teal text-office-primary"
                        : "bg-office-chip text-office-icon",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="mt-3 block text-sm font-semibold text-office-icon">
                    {option.label}
                  </span>
                  <span className="block text-xs text-office-muted">
                    {option.description}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="new-page-name"
              className="mb-2 block text-sm font-semibold text-office-icon"
            >
              Page name
            </label>
            <input
              id="new-page-name"
              required
              maxLength={40}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="new-page-url"
              className="mb-2 block text-sm font-semibold text-office-icon"
            >
              Page URL
            </label>
            <div className="flex h-11 items-center rounded-lg border border-office-meter-track bg-card px-3.5 text-sm has-focus-visible:ring-2 has-focus-visible:ring-office-primary">
              <span className="shrink-0 truncate text-office-muted">
                {address}/
              </span>
              <input
                id="new-page-url"
                value={path.slice(1)}
                onChange={(event) => {
                  setSlug(event.target.value);
                  setError(null);
                }}
                onBlur={() => setSlug(path.slice(1))}
                className="w-full min-w-0 bg-transparent font-semibold text-office-icon outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SwitchRow
            id="new-page-nav"
            label="Show in navigation menu"
            description={`Adds “${name.trim() || "this page"}” to the top menu`}
            checked={inNav}
            onChange={setInNav}
          />
          <SwitchRow
            id="new-page-noindex"
            label="Hide from search engines"
            description="Useful for private or draft pages"
            checked={noIndex}
            onChange={setNoIndex}
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="text-sm font-medium text-office-danger-text"
          >
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end gap-2.5 border-t border-office-meter-track px-6 py-4">
        <Dialog.Close asChild>
          <Button
            type="button"
            variant="outline"
            className="h-11 border-office-meter-track bg-card px-6 font-semibold text-office-icon hover:bg-office-chip"
          >
            Cancel
          </Button>
        </Dialog.Close>
        <Button
          type="submit"
          variant="office"
          className="h-11 px-6 font-semibold"
        >
          Create page
        </Button>
      </div>
    </form>
  );
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>
        <span
          id={`${id}-label`}
          className="block text-sm font-semibold text-office-icon"
        >
          {label}
        </span>
        <span
          id={`${id}-description`}
          className="block text-xs text-office-muted"
        >
          {description}
        </span>
      </span>
      <Switch
        id={id}
        checked={checked}
        onChange={onChange}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-description`}
      />
    </div>
  );
}
