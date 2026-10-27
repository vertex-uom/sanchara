"use client";

import { useActionState, useRef, useState } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToneChip } from "@/components/ui/tone-chip";
import { FlatCard } from "@/components/ui/widget";
import { addImageAction, removeImageAction, setCoverAction, type SettingsFormState } from "../actions";
import { IMAGE_RULES } from "../config";
import type { PropertyImage, PropertySettings } from "../types";
import { imageError } from "../validation";
import { EditableSection } from "./editable-section";
import { Field, TextInput } from "./settings-fields";

const INITIAL: SettingsFormState = { error: null, saved: 0 };

const smallButton = "h-11 gap-1.5 rounded-lg bg-card px-3 text-sm md:h-8";

const altText = (image: PropertyImage, index: number, propertyName: string) => image.caption || `${propertyName}, photo ${index + 1}`;

// Gallery photos. Upload, cover and remove save at once; captions use "Edit captions".
export function ImagesSection({ property }: { property: PropertySettings }) {
  const { images } = property;
  const full = images.length >= IMAGE_RULES.maxImages;
  const description = `${images.length} of ${IMAGE_RULES.maxImages} photos. The cover photo leads your website and listings.`;

  if (images.length === 0) {
    return (
      <FlatCard aria-labelledby="images-settings-title" className="flex flex-col gap-5">
        <div>
          <h2 id="images-settings-title" className="text-lg font-semibold">
            Images
          </h2>
          <p className="mt-0.5 text-sm text-office-muted">Add photos of your property. The first one becomes the cover.</p>
        </div>
        <UploadButton propertyId={property.id} full={false} />
      </FlatCard>
    );
  }

  return (
    <EditableSection
      section="images"
      property={property}
      title="Images"
      editLabel="Edit captions"
      viewDescription={description}
      editDescription="Captions describe each photo to guests and screen readers."
      firstFieldId={`caption-${images[0].id}`}
      initial={Object.fromEntries(images.map((image) => [`caption:${image.id}`, image.caption]))}
      view={
        <div className="flex flex-col gap-5">
          <UploadButton propertyId={property.id} full={full} />
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image, index) => (
              <GalleryItem
                key={image.id}
                propertyId={property.id}
                image={image}
                alt={altText(image, index, property.name)}
                cover={image.id === property.coverImageId}
              />
            ))}
          </ul>
        </div>
      }
      fields={({ values, set, errors }) => (
        <ul className="flex flex-col gap-4">
          {images.map((image, index) => {
            const key = `caption:${image.id}`;
            return (
              <li key={image.id} className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the temporary store */}
                <img src={image.url} alt="" className="h-16 w-24 shrink-0 rounded-md object-cover" />
                <Field id={`caption-${image.id}`} label={`Caption for photo ${index + 1}`} error={errors[key]} className="flex-1">
                  <TextInput
                    id={`caption-${image.id}`}
                    name={key}
                    maxLength={IMAGE_RULES.caption}
                    placeholder="e.g. Sea-view room balcony at sunset"
                    value={values[key] ?? ""}
                    onValue={set(key)}
                    error={errors[key]}
                  />
                </Field>
              </li>
            );
          })}
        </ul>
      )}
    />
  );
}

// Choosing a file uploads it at once. Size and type are checked here first.
function UploadButton({ propertyId, full }: { propertyId: string; full: boolean }) {
  const [state, formAction, pending] = useActionState(addImageAction, INITIAL);
  const [clientError, setClientError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const error = clientError ?? state.error?.message ?? null;

  function onFileChange(file: File | undefined) {
    if (!file) return;
    const message = imageError(file);
    setClientError(message);
    if (message) {
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <input type="hidden" name="propertyId" value={propertyId} />
      <input
        ref={fileRef}
        name="image"
        type="file"
        accept={IMAGE_RULES.types.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => onFileChange(event.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        disabled={pending || full}
        onClick={() => fileRef.current?.click()}
        className="h-11 gap-2 rounded-lg border-office-primary bg-card px-4 text-office-primary hover:text-office-primary md:h-10"
      >
        <ImagePlus aria-hidden="true" className="size-4" />
        {pending ? "Uploading…" : "Add photo"}
      </Button>
      <p className="text-xs text-office-muted">
        {full ? "The gallery is full. Remove a photo to add another." : "JPG, PNG or WebP, up to 2MB. Landscape photos look best."}
      </p>
      <p role="status" className={error ? "w-full text-sm font-medium text-office-danger" : "sr-only"}>
        {error ?? (state.saved > 0 && !pending ? "Photo added." : "")}
      </p>
    </form>
  );
}

// Remove asks once more in place before it deletes.
function GalleryItem({ propertyId, image, alt, cover }: { propertyId: string; image: PropertyImage; alt: string; cover: boolean }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-border">
      <div className="relative aspect-[4/3] bg-office-chip">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the temporary store */}
        <img src={image.url} alt={alt} className="size-full object-cover" />
        {cover ? (
          <span className="absolute top-2 left-2">
            <ToneChip tone="success" icon={Star}>
              Cover
            </ToneChip>
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        <p className={image.caption ? "text-sm" : "text-sm text-office-muted italic"}>{image.caption || "No caption"}</p>
        <div className="mt-auto flex flex-wrap gap-2">
          {cover ? null : (
            <form action={setCoverAction}>
              <input type="hidden" name="propertyId" value={propertyId} />
              <input type="hidden" name="imageId" value={image.id} />
              <Button type="submit" variant="outline" className={smallButton}>
                <Star aria-hidden="true" className="size-3.5" />
                Set as cover
              </Button>
            </form>
          )}
          {confirming ? (
            <form action={removeImageAction} className="flex gap-2">
              <input type="hidden" name="propertyId" value={propertyId} />
              <input type="hidden" name="imageId" value={image.id} />
              <Button type="submit" variant="office-danger" className="h-11 rounded-lg px-3 text-sm md:h-8">
                Remove photo
              </Button>
              <Button type="button" variant="outline" onClick={() => setConfirming(false)} className={smallButton}>
                Keep
              </Button>
            </form>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming(true)}
              className={`${smallButton} border-office-danger/60 text-office-danger hover:bg-office-danger-soft hover:text-office-danger`}
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
