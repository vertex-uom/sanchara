"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import {
  Check,
  Crop,
  ImageOff,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LocalThumbnail } from "../local-thumbnail";
import { inputClass } from "../template-fields";
import {
  FILE_KEYS,
  NO_GALLERY,
  NO_HOTEL_IMAGES,
  NO_ROOM_PHOTOS,
  useTemplateFiles,
} from "../template-files";

const MB = 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const CROPS = [
  { label: "16:9", ratio: 16 / 9 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "1:1", ratio: 1 },
  { label: "3:4", ratio: 3 / 4 },
];

export type MediaItem = {
  id: string;
  file: File;
  width: number;
  height: number;
};
const NO_UPLOADS: MediaItem[] = [];
const NO_ALT: Record<string, string> = {};

type Tab = "uploads" | "property" | "stock";

type MediaLibraryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // What the photo is for, e.g. "Hero background".
  target: string;
  onUse: (file: File, alt: string) => void;
};

// Pick a photo from your uploads or the property's photos, upload more,
// crop, and set alt text. Photos stay in this browser session until the
// builder has file storage.
export function MediaLibrary({
  open,
  onOpenChange,
  target,
  onUse,
}: MediaLibraryProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[#0b2240]/40 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex h-[min(90dvh,40rem)] w-[min(96vw,60rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl outline-none">
          {open ? (
            <Library
              target={target}
              onUse={onUse}
              onClose={() => onOpenChange(false)}
            />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Library({
  target,
  onUse,
  onClose,
}: {
  target: string;
  onUse: MediaLibraryProps["onUse"];
  onClose: () => void;
}) {
  const [uploads, setUploads] = useTemplateFiles(
    FILE_KEYS.mediaUploads,
    NO_UPLOADS,
  );
  const [alts, setAlts] = useTemplateFiles(FILE_KEYS.mediaAlt, NO_ALT);
  const property = usePropertyPhotos();
  const [tab, setTab] = useState<Tab>("uploads");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const items =
    tab === "uploads" ? uploads : tab === "property" ? property : [];
  const shown = items.filter((item) => {
    const text = `${item.file.name} ${alts[item.id] ?? ""}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });
  const selected =
    [...uploads, ...property].find((item) => item.id === selectedId) ?? null;

  async function upload(files: FileList | null) {
    if (inputRef.current) inputRef.current.value = "";
    if (!files?.length) return;
    const chosen = [...files];
    const accepted = chosen.filter(
      (file) => IMAGE_TYPES.includes(file.type) && file.size <= 10 * MB,
    );
    setError(
      accepted.length < chosen.length
        ? "Some files were skipped: use JPG, PNG or WebP up to 10 MB."
        : null,
    );
    setTab("uploads");
    setAdding(accepted.length);
    const added = await Promise.all(accepted.map((file) => toMediaItem(file)));
    setAdding(0);
    const valid = added.filter((item): item is MediaItem => item !== null);
    if (valid.length < accepted.length)
      setError("Some files could not be read as images.");
    setUploads((current) => [...valid, ...current]);
    if (valid[0]) setSelectedId(valid[0].id);
  }

  async function crop(ratio: number, label: string) {
    if (!selected) return;
    const file = await cropFile(selected.file, ratio, label);
    const item = file ? await toMediaItem(file) : null;
    if (!item) {
      setError("This photo could not be cropped.");
      return;
    }
    setUploads((current) => [item, ...current]);
    setAlts((current) => ({
      ...current,
      [item.id]: current[selected.id] ?? "",
    }));
    setTab("uploads");
    setSelectedId(item.id);
    setCropping(false);
  }

  function remove(id: string) {
    setUploads((current) => current.filter((item) => item.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function use(item: MediaItem) {
    onUse(item.file, alts[item.id] ?? "");
    onClose();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 px-6 pt-5">
        <Dialog.Title className="mr-auto text-xl font-semibold text-office-icon">
          Media Library
        </Dialog.Title>
        <Dialog.Description className="sr-only">
          Choose a photo for {target}.
        </Dialog.Description>
        <label className="flex h-10 w-56 items-center gap-2 rounded-lg border border-office-meter-track bg-card px-3 has-focus-visible:ring-2 has-focus-visible:ring-office-primary">
          <Search aria-hidden="true" className="size-4 text-office-muted" />
          <span className="sr-only">Search photos</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search photos..."
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-office-muted/80"
          />
        </label>
        <Button
          type="button"
          variant="office"
          onClick={() => inputRef.current?.click()}
          className="h-10 gap-2 px-4 font-semibold"
        >
          <Upload aria-hidden="true" className="size-4" />
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={IMAGE_TYPES.join(",")}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(event) => upload(event.target.files)}
        />
        <Dialog.Close
          aria-label="Close"
          className="focus-ring inline-flex size-10 items-center justify-center rounded-lg border border-office-meter-track text-office-icon hover:bg-office-chip"
        >
          <X aria-hidden="true" className="size-4" />
        </Dialog.Close>
      </div>

      <div
        role="tablist"
        aria-label="Photo sources"
        className="mt-3 flex gap-6 border-b border-office-meter-track px-6"
      >
        {(
          [
            ["uploads", "My uploads", uploads.length],
            ["property", "Property photos", property.length],
            ["stock", "Free stock photos", null],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "focus-ring -mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-sm",
              tab === value
                ? "border-office-primary font-semibold text-office-primary"
                : "border-transparent text-office-muted hover:text-office-icon",
            )}
          >
            {label}
            {count !== null ? (
              <span className="rounded-full bg-office-chip px-1.5 text-[0.7rem] font-medium text-office-muted">
                {count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <div role="tabpanel" className="min-w-0 flex-1 overflow-y-auto p-5">
          {error ? (
            <p
              role="alert"
              className="mb-3 text-xs font-medium text-office-danger-text"
            >
              {error}
            </p>
          ) : null}
          {tab === "stock" ? (
            <EmptyState
              title="Stock photos are not connected yet"
              text="A free stock photo service needs to be set up first. Upload your own photos for now."
            />
          ) : shown.length || adding ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from(
                { length: tab === "uploads" ? adding : 0 },
                (_, index) => (
                  <li
                    key={`adding-${index}`}
                    className="flex aspect-4/3 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-office-primary/50 bg-office-tint-teal/40 text-xs text-office-primary"
                  >
                    <Loader2
                      aria-hidden="true"
                      className="size-5 animate-spin motion-reduce:animate-none"
                    />
                    Adding photo…
                  </li>
                ),
              )}
              {shown.map((item) => {
                const active = item.id === selectedId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      aria-label={alts[item.id] || item.file.name}
                      onClick={() => {
                        setSelectedId(item.id);
                        setCropping(false);
                      }}
                      onDoubleClick={() => use(item)}
                      className={cn(
                        "focus-ring relative block w-full overflow-hidden rounded-lg border-2",
                        active
                          ? "border-brand-cyan"
                          : "border-transparent hover:border-brand-cyan/50",
                      )}
                    >
                      <LocalThumbnail
                        file={item.file}
                        className="aspect-4/3 w-full"
                      />
                      {active ? (
                        <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-office-primary text-white ring-2 ring-white">
                          <Check
                            aria-hidden="true"
                            className="size-3.5"
                            strokeWidth={3}
                          />
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : tab === "uploads" ? (
            <EmptyState
              title={query ? "No photos match your search" : "No uploads yet"}
              text={
                query
                  ? "Try another word."
                  : "Upload JPG, PNG or WebP photos up to 10 MB each."
              }
            />
          ) : (
            <EmptyState
              title={
                query ? "No photos match your search" : "No property photos yet"
              }
              text={
                query
                  ? "Try another word."
                  : "Photos you add in the hotel template (cover, gallery, rooms) appear here."
              }
            />
          )}
        </div>

        <aside
          aria-label="Selected photo"
          className="hidden w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-office-meter-track p-5 md:flex"
        >
          {selected ? (
            <>
              <LocalThumbnail
                file={selected.file}
                className="aspect-4/3 w-full rounded-lg"
              />
              <div>
                <p
                  className="truncate text-sm font-semibold text-office-icon"
                  title={selected.file.name}
                >
                  {selected.file.name}
                </p>
                <p className="text-xs text-office-muted">
                  {selected.width} × {selected.height} ·{" "}
                  {formatSize(selected.file.size)} · {fileType(selected.file)}
                </p>
              </div>
              <div>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <label
                    htmlFor="media-alt"
                    className="text-sm font-semibold text-office-icon"
                  >
                    Alt text
                  </label>
                  <span className="text-xs text-office-muted">
                    For accessibility &amp; SEO
                  </span>
                </div>
                <textarea
                  id="media-alt"
                  rows={2}
                  maxLength={125}
                  value={alts[selected.id] ?? ""}
                  onChange={(event) =>
                    setAlts((current) => ({
                      ...current,
                      [selected.id]: event.target.value,
                    }))
                  }
                  placeholder="Describe the photo, e.g. Pool overlooking the beach at sunset"
                  className={cn(
                    inputClass,
                    "h-auto resize-none py-2.5 leading-relaxed",
                  )}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  aria-expanded={cropping}
                  onClick={() => setCropping((on) => !on)}
                  className="h-10 flex-1 gap-2 border-office-meter-track bg-card font-semibold text-office-icon hover:bg-office-chip"
                >
                  <Crop aria-hidden="true" className="size-4" />
                  Crop &amp; edit
                </Button>
                {uploads.some((item) => item.id === selected.id) ? (
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Delete ${selected.file.name}`}
                    onClick={() => remove(selected.id)}
                    className="size-10 border-office-meter-track bg-card p-0 text-office-danger-text hover:bg-office-danger-soft"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                ) : null}
              </div>
              {cropping ? (
                <div className="rounded-lg border border-office-meter-track p-3">
                  <p className="text-xs text-office-muted">
                    Crop from the centre. A cropped copy is added to My uploads.
                  </p>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {CROPS.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => crop(option.ratio, option.label)}
                        className="focus-ring h-8 rounded-md border border-office-meter-track text-xs font-semibold text-office-icon hover:bg-office-chip"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="mt-10 text-center text-sm text-office-muted">
              Select a photo to see its details.
            </p>
          )}
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-office-meter-track px-6 py-4">
        <p role="status" className="text-sm text-office-muted">
          {selected ? "1 photo selected" : "No photo selected"} · {target}
        </p>
        <div className="flex gap-2.5">
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
            type="button"
            variant="office"
            disabled={!selected}
            onClick={() => selected && use(selected)}
            className="h-11 px-6 font-semibold"
          >
            Use this photo
          </Button>
        </div>
      </div>
    </>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex h-full min-h-60 flex-col items-center justify-center gap-2 text-center">
      <ImageOff
        aria-hidden="true"
        className="size-8 text-office-muted/60"
        strokeWidth={1.5}
      />
      <p className="text-sm font-semibold text-office-icon">{title}</p>
      <p className="max-w-sm text-xs text-office-muted">{text}</p>
    </div>
  );
}

// Photos added in the hotel template steps, with their sizes.
function usePropertyPhotos() {
  const [hotel] = useTemplateFiles(FILE_KEYS.hotelImages, NO_HOTEL_IMAGES);
  const [gallery] = useTemplateFiles(FILE_KEYS.gallery, NO_GALLERY);
  const [rooms] = useTemplateFiles(FILE_KEYS.roomPhotos, NO_ROOM_PHOTOS);
  const files = useMemo(
    () =>
      [
        hotel.cover,
        hotel.about,
        ...gallery,
        ...Object.values(rooms).flat(),
      ].filter((file): file is File => Boolean(file)),
    [hotel, gallery, rooms],
  );
  const [items, setItems] = useState<MediaItem[]>([]);
  useEffect(() => {
    let current = true;
    Promise.all(
      files.map((file) =>
        toMediaItem(
          file,
          `property-${file.name}-${file.size}-${file.lastModified}`,
        ),
      ),
    ).then((read) => {
      if (current)
        setItems(read.filter((item): item is MediaItem => item !== null));
    });
    return () => {
      current = false;
    };
  }, [files]);
  return items;
}

async function toMediaItem(
  file: File,
  id: string = crypto.randomUUID(),
): Promise<MediaItem | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const item = { id, file, width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return item;
  } catch {
    return null;
  }
}

// Centre crop to the ratio, as a new JPEG (PNG stays PNG for transparency).
async function cropFile(
  file: File,
  ratio: number,
  label: string,
): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file);
    let width = bitmap.width;
    let height = Math.round(width / ratio);
    if (height > bitmap.height) {
      height = bitmap.height;
      width = Math.round(height * ratio);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas
      .getContext("2d")
      ?.drawImage(
        bitmap,
        Math.round((bitmap.width - width) / 2),
        Math.round((bitmap.height - height) / 2),
        width,
        height,
        0,
        0,
        width,
        height,
      );
    bitmap.close();
    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, 0.9),
    );
    if (!blob) return null;
    const base = file.name.replace(/\.[^.]+$/, "");
    const extension = type === "image/png" ? "png" : "jpg";
    return new File([blob], `${base}-${label.replace(":", "x")}.${extension}`, {
      type,
    });
  } catch {
    return null;
  }
}

function formatSize(bytes: number) {
  return bytes >= MB
    ? `${(bytes / MB).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function fileType(file: File) {
  return file.type === "image/jpeg"
    ? "JPG"
    : (file.type.split("/")[1] ?? "Image").toUpperCase();
}
