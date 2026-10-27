"use client";

import { useActionState, useRef, useState } from "react";
import { ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlatCard } from "@/components/ui/widget";
import { saveLogoAction, type SettingsFormState } from "../actions";
import { LOGO_RULES } from "../config";
import { logoError } from "../validation";

const INITIAL: SettingsFormState = { error: null, saved: 0 };

const buttonClass = "h-11 gap-2 rounded-lg bg-card px-3 md:h-9";

// Choosing a file uploads it at once; Remove sends an empty upload.
// Size and type are checked here first so a wrong file fails fast.
export function LogoCard({ propertyId, logoUrl, propertyName }: { propertyId: string; logoUrl: string | null; propertyName: string }) {
  const [state, formAction, pending] = useActionState(saveLogoAction, INITIAL);
  const [clientError, setClientError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const error = clientError ?? state.error?.message ?? null;

  function onFileChange(file: File | undefined) {
    if (!file) return;
    const message = logoError(file);
    setClientError(message);
    if (message) {
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    formRef.current?.requestSubmit();
  }

  function remove() {
    setClientError(null);
    if (fileRef.current) fileRef.current.value = "";
    formRef.current?.requestSubmit();
  }

  return (
    <FlatCard aria-labelledby="logo-title" aria-busy={pending}>
      <h2 id="logo-title" className="mb-4 text-base font-semibold">
        Property logo
      </h2>
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="propertyId" value={propertyId} />
        <div className="flex gap-3">
          <div className="size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-office-tint-blue">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL from the temporary store
              <img src={logoUrl} alt={`${propertyName} logo`} className="size-full object-contain" />
            ) : (
              <LogoPlaceholder />
            )}
          </div>
          <div className="min-w-0 text-xs text-office-muted">
            <p>Upload a logo for your property. This will be shown on your website and booking confirmations.</p>
            <p className="mt-2">
              Recommended size: {LOGO_RULES.recommendedPx} × {LOGO_RULES.recommendedPx} px. JPG, PNG (Max 2MB)
            </p>
          </div>
        </div>

        <input
          ref={fileRef}
          id="logo-file"
          name="logo"
          type="file"
          accept={LOGO_RULES.types.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => onFileChange(event.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
            className={`${buttonClass} border-office-primary text-office-primary hover:text-office-primary`}
          >
            <ImageIcon aria-hidden="true" className="size-4" />
            {pending ? "Uploading…" : logoUrl ? "Change image" : "Upload image"}
          </Button>
          {logoUrl ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={remove}
              className={`${buttonClass} border-office-danger/60 text-office-danger hover:bg-office-danger-soft hover:text-office-danger`}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Remove
            </Button>
          ) : null}
        </div>
        <p role="status" className={error ? "text-sm font-medium text-office-danger" : "sr-only"}>
          {error ?? (state.saved > 0 && !pending ? (logoUrl ? "Logo updated." : "Logo removed.") : "")}
        </p>
      </form>
    </FlatCard>
  );
}

// The design's sky-and-hills illustration, shown until a logo is uploaded.
function LogoPlaceholder() {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" className="size-full">
      <rect width="96" height="96" fill="#e3f1f7" />
      <circle cx="68" cy="30" r="9" fill="#f6c86b" />
      <path d="M0 70 Q24 48 48 66 T96 60 V96 H0 Z" fill="#9cc9b0" />
      <path d="M0 80 Q30 62 60 78 T96 74 V96 H0 Z" fill="#6aa98b" />
      <rect y="86" width="96" height="10" fill="#efe1c4" />
    </svg>
  );
}
