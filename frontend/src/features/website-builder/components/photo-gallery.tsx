"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Plus, X } from "lucide-react";
import { cn } from "cn";
import { LocalThumbnail } from "./local-thumbnail";

// Not enforced; the gallery is optional.
export const GALLERY_RECOMMENDED = 6;
const GALLERY_MAX = 30;
const PHOTO_TYPES = ["image/jpeg", "image/png"];
const MAX_BYTES = 10 * 1024 * 1024;

type PhotoGalleryProps = {
  photos: File[];
  onChange: (photos: File[]) => void;
};

// Gallery grid: drag (or the arrow buttons) to reorder; the first is the cover.
export function PhotoGallery({ photos, onChange }: PhotoGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  function add(files: FileList | null) {
    if (inputRef.current) inputRef.current.value = "";
    if (!files) return;
    const chosen = [...files];
    const accepted = chosen.filter(
      (file) => PHOTO_TYPES.includes(file.type) && file.size <= MAX_BYTES,
    );
    const space = GALLERY_MAX - photos.length;
    setError(
      accepted.length < chosen.length
        ? "Some files were skipped: use JPG or PNG up to 10 MB."
        : accepted.length > space
          ? `Only ${GALLERY_MAX} photos fit; the extra ones were skipped.`
          : null,
    );
    onChange([...photos, ...accepted.slice(0, space)]);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= photos.length || from === to) return;
    const next = [...photos];
    const [photo] = next.splice(from, 1);
    next.splice(to, 0, photo);
    onChange(next);
  }

  function handleDrop(event: DragEvent, to: number) {
    event.preventDefault();
    if (dragging !== null) move(dragging, to);
    setDragging(null);
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span
          id="gallery-label"
          className="text-sm font-semibold text-office-icon"
        >
          {photos.length} / {GALLERY_MAX} photos
        </span>
        <span className="text-xs text-office-muted">
          JPG or PNG · up to 10 MB each
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={PHOTO_TYPES.join(",")}
        aria-labelledby="gallery-label"
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => add(event.target.files)}
      />
      <ul
        aria-labelledby="gallery-label"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4"
      >
        {photos.map((photo, index) => (
          <li
            key={`${photo.name}-${photo.lastModified}-${index}`}
            draggable
            onDragStart={() => setDragging(index)}
            onDragEnd={() => setDragging(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, index)}
            className={cn(
              "group relative cursor-grab overflow-hidden rounded-lg active:cursor-grabbing",
              dragging === index && "opacity-40",
            )}
          >
            <LocalThumbnail file={photo} className="aspect-[4/3] w-full" />
            {index === 0 ? (
              <span className="absolute top-1.5 left-1.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[0.7rem] font-semibold text-office-icon">
                Cover
              </span>
            ) : null}
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
              <span className="flex gap-1">
                <PhotoAction
                  label={`Move ${photo.name} earlier`}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ChevronLeft className="size-4" />
                </PhotoAction>
                <PhotoAction
                  label={`Move ${photo.name} later`}
                  disabled={index === photos.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ChevronRight className="size-4" />
                </PhotoAction>
              </span>
              <PhotoAction
                label={`Remove ${photo.name}`}
                onClick={() =>
                  onChange(photos.filter((_, other) => other !== index))
                }
              >
                <X className="size-4" />
              </PhotoAction>
            </div>
          </li>
        ))}
        {photos.length < GALLERY_MAX ? (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="focus-ring flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-office-primary/60 bg-card text-sm font-semibold text-office-primary hover:bg-office-tint-teal"
            >
              {photos.length ? (
                <Plus aria-hidden="true" className="size-5" />
              ) : (
                <ImagePlus
                  aria-hidden="true"
                  className="size-6"
                  strokeWidth={1.5}
                />
              )}
              Upload photos
            </button>
          </li>
        ) : null}
      </ul>
      {error ? (
        <p
          role="alert"
          className="mt-2 text-xs font-medium text-office-danger-text"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PhotoAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="focus-ring inline-flex size-7 items-center justify-center rounded-full bg-black/55 text-white disabled:opacity-40"
    >
      {children}
    </button>
  );
}
