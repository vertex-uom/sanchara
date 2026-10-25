"use client";

import { useRef, useState } from "react";
import { ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "cn";
import { ChipPicker } from "./chip-picker";
import { LocalThumbnail as Thumbnail } from "./local-thumbnail";
import { AffixInput, Field, SelectInput, inputClass } from "./template-fields";

export type RoomCategory = {
  id: string;
  name: string;
  price: string;
  guests: string;
  bed: string;
  size: string;
  count: string;
  weekendPrice: string;
  description: string;
  features: string[];
  customFeatures: string[];
};

// Label → total guests, used in the collapsed summary.
const GUEST_OPTIONS: Record<string, number> = {
  "1 adult": 1,
  "2 adults": 2,
  "2 adults · 1 child": 3,
  "2 adults · 2 children": 4,
  "3 adults": 3,
  "4 adults": 4,
  "4 adults · 2 children": 6,
};
const BED_TYPES = [
  "1 King bed",
  "1 Queen bed",
  "1 Double bed",
  "2 Single beds",
  "2 Double beds",
  "Bunk beds",
];
const FEATURES = [
  "Air conditioning",
  "Ocean view",
  "Balcony",
  "Free Wi-Fi",
  "Mini bar",
  "Hot water",
  "Smart TV",
];
const DESCRIPTION_MAX = 400;
export const PHOTOS_MAX = 10;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function newRoomCategory(): RoomCategory {
  return {
    id: crypto.randomUUID(),
    name: "",
    price: "",
    guests: "2 adults",
    bed: "1 Queen bed",
    size: "",
    count: "1",
    weekendPrice: "",
    description: "",
    features: [],
    customFeatures: [],
  };
}

// The fields Save & continue needs before leaving the step.
export function isRoomComplete(room: RoomCategory) {
  return Boolean(
    room.name.trim() && Number(room.price) > 0 && Number(room.count) > 0,
  );
}

// "3 guests · 1 King bed · 32 m² · 4 rooms"
export function describeRoom(room: RoomCategory) {
  return [
    `${GUEST_OPTIONS[room.guests] ?? room.guests} guests`,
    room.bed,
    room.size ? `${room.size} m²` : null,
    `${room.count || 0} ${Number(room.count) === 1 ? "room" : "rooms"}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function formatPrice(currency: string, amount: string | number) {
  return `${currency} ${Number(amount || 0).toLocaleString("en-US")}`;
}

function toggle(list: string[], option: string) {
  return list.includes(option)
    ? list.filter((item) => item !== option)
    : [...list, option];
}

type RoomEditorProps = {
  index: number;
  room: RoomCategory;
  currency: string;
  photos: File[];
  onChange: (patch: Partial<RoomCategory>) => void;
  onPhotosChange: (photos: File[]) => void;
  onDelete: () => void;
  onDone: () => void;
};

// Expanded card for the category being edited.
export function RoomEditor({
  index,
  room,
  currency,
  photos,
  onChange,
  onPhotosChange,
  onDelete,
  onDone,
}: RoomEditorProps) {
  const id = (field: string) => `room-${room.id}-${field}`;

  return (
    <div className="rounded-xl border-[1.5px] border-brand-cyan bg-[#f8fcfd] p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-office-primary text-xs font-semibold text-white">
          {index + 1}
        </span>
        <h3 className="min-w-0 truncate font-semibold text-office-icon">
          {room.name.trim() || "New room category"}
        </h3>
        <span className="rounded-full bg-office-tint-teal px-2 py-0.5 text-xs font-medium text-office-primary">
          Editing
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onDone}
            className="focus-ring rounded-md px-2 py-1 text-xs font-semibold text-office-primary hover:underline"
          >
            Done
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${room.name.trim() || "this room category"}`}
            className="focus-ring inline-flex size-9 items-center justify-center rounded-lg text-office-icon hover:bg-office-danger-soft hover:text-office-danger-text"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field id={id("name")} label="Category name" required>
          <input
            id={id("name")}
            required
            value={room.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="Deluxe Ocean View Room"
            className={inputClass}
          />
        </Field>
        <Field id={id("price")} label="Price per night" required>
          <AffixInput
            id={id("price")}
            prefix={currency}
            required
            type="number"
            inputMode="numeric"
            min={1}
            value={room.price}
            onChange={(event) => onChange({ price: event.target.value })}
            placeholder="18500"
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field id={id("guests")} label="Max guests" required>
          <SelectInput
            id={id("guests")}
            required
            options={Object.keys(GUEST_OPTIONS)}
            value={room.guests}
            onChange={(event) => onChange({ guests: event.target.value })}
          />
        </Field>
        <Field id={id("bed")} label="Bed type" required>
          <SelectInput
            id={id("bed")}
            required
            options={BED_TYPES}
            value={room.bed}
            onChange={(event) => onChange({ bed: event.target.value })}
          />
        </Field>
        <Field id={id("size")} label="Room size">
          <AffixInput
            id={id("size")}
            suffix="m²"
            type="number"
            inputMode="numeric"
            min={1}
            value={room.size}
            onChange={(event) => onChange({ size: event.target.value })}
            placeholder="32"
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field id={id("count")} label="Rooms of this type" required>
          <input
            id={id("count")}
            required
            type="number"
            inputMode="numeric"
            min={1}
            max={500}
            value={room.count}
            onChange={(event) => onChange({ count: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field id={id("weekend")} label="Weekend price" hint="Optional">
          <AffixInput
            id={id("weekend")}
            prefix={currency}
            type="number"
            inputMode="numeric"
            min={1}
            value={room.weekendPrice}
            onChange={(event) => onChange({ weekendPrice: event.target.value })}
            placeholder="21000"
          />
        </Field>
      </div>

      <Field
        id={id("description")}
        label="Room description"
        hint={`${room.description.length} / ${DESCRIPTION_MAX}`}
        className="mt-4"
      >
        <textarea
          id={id("description")}
          rows={3}
          maxLength={DESCRIPTION_MAX}
          value={room.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Spacious room with a private balcony facing the ocean, rain shower and a cosy reading corner."
          className={cn(inputClass, "h-auto resize-y py-3 leading-relaxed")}
        />
      </Field>

      <RoomPhotos id={id("photos")} photos={photos} onChange={onPhotosChange} />

      <div className="mt-4">
        <ChipPicker
          label="Room features"
          options={[...FEATURES, ...room.customFeatures]}
          selected={room.features}
          addLabel="Add feature"
          onToggle={(option) =>
            onChange({ features: toggle(room.features, option) })
          }
          onAdd={(option) =>
            onChange({
              customFeatures: [...room.customFeatures, option],
              features: [...room.features, option],
            })
          }
        />
      </div>
    </div>
  );
}

type RoomSummaryProps = {
  room: RoomCategory;
  index: number;
  currency: string;
  photo: File | undefined;
  onEdit: () => void;
};

// Collapsed row for a category that is not being edited.
export function RoomSummary({
  room,
  index,
  currency,
  photo,
  onEdit,
}: RoomSummaryProps) {
  const name = room.name.trim() || `Room category ${index + 1}`;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-office-meter-track bg-card p-3">
      <Thumbnail file={photo} className="h-12 w-16 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-office-icon">
          {name}
        </p>
        <p className="truncate text-xs text-office-muted">
          {describeRoom(room)}
        </p>
        {!isRoomComplete(room) ? (
          <p className="text-xs font-medium text-office-danger-text">
            Add a name, price and number of rooms
          </p>
        ) : null}
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-office-primary">
          {formatPrice(currency, room.price)}
        </p>
        <p className="text-xs text-office-muted">per night</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${name}`}
        className="focus-ring inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-office-icon hover:bg-office-chip"
      >
        <Pencil aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        onClick={onEdit}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden size-9 shrink-0 items-center justify-center rounded-lg text-office-icon hover:bg-office-chip sm:inline-flex"
      >
        <ChevronDown className="size-4" />
      </button>
    </div>
  );
}

type RoomPhotosProps = {
  id: string;
  photos: File[];
  onChange: (photos: File[]) => void;
};

// Photo grid with an "Add photo" tile; files stay in memory only.
function RoomPhotos({ id, photos, onChange }: RoomPhotosProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function add(files: FileList | null) {
    if (inputRef.current) inputRef.current.value = "";
    if (!files) return;
    const chosen = [...files];
    const accepted = chosen.filter(
      (file) =>
        PHOTO_TYPES.includes(file.type) && file.size <= 10 * 1024 * 1024,
    );
    const room = PHOTOS_MAX - photos.length;
    setError(
      accepted.length < chosen.length
        ? "Some files were skipped: use JPG, PNG or WebP up to 10 MB."
        : accepted.length > room
          ? `Only ${PHOTOS_MAX} photos fit; the extra ones were skipped.`
          : null,
    );
    onChange([...photos, ...accepted.slice(0, room)]);
  }

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span
          id={`${id}-label`}
          className="text-sm font-semibold text-office-icon"
        >
          Room photos
        </span>
        <span className="text-xs text-office-muted">
          Optional · {photos.length} / {PHOTOS_MAX}
        </span>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        multiple
        accept={PHOTO_TYPES.join(",")}
        aria-labelledby={`${id}-label`}
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => add(event.target.files)}
      />
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {photos.map((photo, index) => (
          <li key={`${photo.name}-${index}`} className="group relative">
            <Thumbnail
              file={photo}
              className="aspect-[4/3] w-full rounded-lg"
            />
            <button
              type="button"
              onClick={() =>
                onChange(photos.filter((_, other) => other !== index))
              }
              aria-label={`Remove ${photo.name}`}
              className="focus-ring absolute top-1 right-1 inline-flex size-7 items-center justify-center rounded-full bg-black/55 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </li>
        ))}
        {photos.length < PHOTOS_MAX ? (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="focus-ring flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-office-primary/60 bg-card text-xs font-semibold text-office-primary hover:bg-office-tint-teal"
            >
              <Plus aria-hidden="true" className="size-5" />
              Add photo
            </button>
          </li>
        ) : null}
      </ul>
      {error ? (
        <p
          role="alert"
          className="mt-1.5 text-xs font-medium text-office-danger-text"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
