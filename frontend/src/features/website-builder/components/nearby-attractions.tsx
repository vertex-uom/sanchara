"use client";

import { useState } from "react";
import {
  Compass,
  Landmark,
  ShoppingBag,
  Trees,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { EditorPanel, RowActions } from "./list-editor";
import {
  AddButton,
  AffixInput,
  Field,
  inputClass,
  SelectInput,
} from "./template-fields";

const KINDS: Record<string, LucideIcon> = {
  Landmark: Landmark,
  Beach: Waves,
  Nature: Trees,
  "Food & shopping": ShoppingBag,
  Activity: Compass,
};

export type Attraction = {
  id: string;
  kind: string;
  name: string;
  description: string;
  // Kilometres from the property.
  distance: string;
};

type NearbyAttractionsProps = {
  attractions: Attraction[];
  onChange: (attractions: Attraction[]) => void;
};

export function NearbyAttractions({
  attractions,
  onChange,
}: NearbyAttractionsProps) {
  // Attraction being edited: an id, "new", or null.
  const [editing, setEditing] = useState<string | null>(null);

  function saveAttraction(attraction: Attraction) {
    const exists = attractions.some((other) => other.id === attraction.id);
    onChange(
      exists
        ? attractions.map((other) =>
            other.id === attraction.id ? attraction : other,
          )
        : [...attractions, attraction],
    );
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {attractions.length ? (
        <ul className="flex flex-col gap-3">
          {attractions.map((attraction) => {
            if (editing === attraction.id) {
              return (
                <li key={attraction.id}>
                  <AttractionEditor
                    attraction={attraction}
                    onSave={saveAttraction}
                    onCancel={() => setEditing(null)}
                  />
                </li>
              );
            }
            const Icon = KINDS[attraction.kind] ?? Compass;
            return (
              <li
                key={attraction.id}
                className="flex items-center gap-3 rounded-xl border border-office-meter-track bg-card p-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-office-tint-teal text-office-primary">
                  <Icon aria-hidden="true" className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-office-icon">
                    {attraction.name}
                  </p>
                  {attraction.description ? (
                    <p className="truncate text-xs text-office-muted">
                      {attraction.description}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-sm font-semibold text-office-icon">
                  {Number(attraction.distance)} km
                </span>
                <RowActions
                  name={attraction.name}
                  onEdit={() => setEditing(attraction.id)}
                  onDelete={() =>
                    onChange(
                      attractions.filter((other) => other.id !== attraction.id),
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      ) : null}
      {editing === "new" ? (
        <AttractionEditor
          onSave={saveAttraction}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <AddButton onClick={() => setEditing("new")}>Add attraction</AddButton>
      )}
    </div>
  );
}

function AttractionEditor({
  attraction,
  onSave,
  onCancel,
}: {
  attraction?: Attraction;
  onSave: (attraction: Attraction) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Attraction>(
    attraction ?? {
      id: crypto.randomUUID(),
      kind: "Landmark",
      name: "",
      description: "",
      distance: "",
    },
  );
  const [error, setError] = useState<string | null>(null);
  const id = (field: string) => `attraction-${values.id}-${field}`;

  function save() {
    if (!values.name.trim() || !(Number(values.distance) > 0)) {
      setError("Enter a name and a distance above 0 km.");
      return;
    }
    onSave({
      ...values,
      name: values.name.trim(),
      description: values.description.trim(),
    });
  }

  return (
    <EditorPanel
      error={error}
      saveLabel={attraction ? "Save attraction" : "Add attraction"}
      onSave={save}
      onCancel={onCancel}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={id("name")} label="Name" required>
          <input
            id={id("name")}
            value={values.name}
            onChange={(event) =>
              setValues({ ...values, name: event.target.value })
            }
            placeholder="Galle Fort"
            className={inputClass}
          />
        </Field>
        <Field id={id("kind")} label="Type">
          <SelectInput
            id={id("kind")}
            options={Object.keys(KINDS)}
            value={values.kind}
            onChange={(event) =>
              setValues({ ...values, kind: event.target.value })
            }
          />
        </Field>
        <Field id={id("description")} label="Short description" hint="Optional">
          <input
            id={id("description")}
            maxLength={60}
            value={values.description}
            onChange={(event) =>
              setValues({ ...values, description: event.target.value })
            }
            placeholder="UNESCO World Heritage site"
            className={inputClass}
          />
        </Field>
        <Field id={id("distance")} label="Distance" required>
          <AffixInput
            id={id("distance")}
            type="number"
            inputMode="decimal"
            min={0.1}
            step={0.1}
            suffix="km"
            value={values.distance}
            onChange={(event) =>
              setValues({ ...values, distance: event.target.value })
            }
            placeholder="2.5"
          />
        </Field>
      </div>
    </EditorPanel>
  );
}
