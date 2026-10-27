"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ImageUploadProps = {
  id: string;
  label: string;
  // Shown on the right of the label, e.g. "PNG or SVG, up to 2 MB".
  hint: string;
  required?: boolean;
  // MIME types the file input accepts and the check enforces.
  types: string[];
  maxBytes: number;
  // Smallest width × height allowed (cover photos).
  minSize?: { width: number; height: number };
  // Extra text after the file size, e.g. "Used in the home page banner".
  usage?: string;
  // Logos sit inside the frame; photos fill it.
  fit?: "contain" | "cover";
  file: File | null;
  onChange: (file: File) => void;
  // Set by the form when a required image is missing on submit.
  missing?: boolean;
};

// One image slot: an upload box when empty, then thumbnail, name, size and Replace.
export function ImageUpload({
  id,
  label,
  hint,
  required,
  types,
  maxBytes,
  minSize,
  usage,
  fit = "cover",
  file,
  onChange,
  missing,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  // Free the previous preview when the file changes or the slot unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleFile(selected: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!selected) return;
    const problem = await checkImage(selected, types, maxBytes, minSize);
    setError(problem);
    if (!problem) onChange(selected);
  }

  const message =
    error ?? (missing && !file ? `Add a ${label.toLowerCase()}.` : null);
  const errorId = `${id}-error`;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span
          id={`${id}-label`}
          className="text-sm font-semibold text-office-icon"
        >
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </span>
        <span className="text-xs text-office-muted">{hint}</span>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={types.join(",")}
        aria-labelledby={`${id}-label`}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <div
        className={cn(
          "flex items-center gap-4 rounded-xl border bg-office-sidebar/40 p-3",
          message ? "border-office-danger" : "border-office-meter-track",
          !file && "border-dashed",
        )}
      >
        {file && preview ? (
          <>
            {/* Local object URL preview, so next/image is not used. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt=""
              className={cn(
                "h-14 w-20 shrink-0 rounded-lg border border-office-meter-track bg-card",
                fit === "contain" ? "object-contain p-1.5" : "object-cover",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-office-icon">
                {file.name}
              </p>
              <p className="mt-0.5 text-xs text-office-muted">
                Uploaded · {formatSize(file.size)}
                {usage ? ` · ${usage}` : null}
              </p>
            </div>
          </>
        ) : (
          <>
            <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-office-chip text-office-icon">
              <ImagePlus
                aria-hidden="true"
                className="size-6"
                strokeWidth={1.5}
              />
            </span>
            <p className="min-w-0 flex-1 text-sm text-office-muted">
              No file chosen yet
            </p>
          </>
        )}
        <Button
          type="button"
          variant="outline"
          aria-describedby={message ? errorId : undefined}
          onClick={() => inputRef.current?.click()}
          className="h-10 shrink-0 border-office-meter-track bg-card px-4 text-sm font-semibold text-office-icon hover:bg-office-chip"
        >
          {file ? "Replace" : "Upload"}
          <span className="sr-only"> {label.toLowerCase()}</span>
        </Button>
      </div>
      {message ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs font-medium text-office-danger-text"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function checkImage(
  file: File,
  types: string[],
  maxBytes: number,
  minSize?: { width: number; height: number },
): Promise<string | null> {
  if (!types.includes(file.type)) return "This file type is not supported.";
  if (file.size > maxBytes)
    return `The file is larger than ${formatSize(maxBytes)}.`;
  if (!minSize) return null;
  const size = await imageSize(file);
  if (!size) return "This image could not be read.";
  return size.width < minSize.width || size.height < minSize.height
    ? `The image must be at least ${minSize.width} × ${minSize.height} pixels.`
    : null;
}

function imageSize(file: File) {
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}
