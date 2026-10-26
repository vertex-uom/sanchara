"use client";

import { Check } from "lucide-react";
import { AMENITY_GROUPS } from "../config";
import type { PropertySettings } from "../types";
import { EditableSection } from "./editable-section";
import { SubHeading } from "./settings-fields";

// Facilities guests can filter and look for. Edited as grouped checkboxes.
export function AmenitiesSection({ property }: { property: PropertySettings }) {
  const chosen = new Set(property.amenities);
  const groups = AMENITY_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => chosen.has(item.key)) })).filter(
    (group) => group.items.length > 0,
  );

  return (
    <EditableSection
      section="amenities"
      property={property}
      title="Amenities"
      viewDescription={`${property.amenities.length} amenit${property.amenities.length === 1 ? "y" : "ies"} shown on your website.`}
      editDescription="Tick everything the property offers. Guests see these on your website."
      firstFieldId={`amenity-${AMENITY_GROUPS[0].items[0].key}`}
      initial={{ amenities: property.amenities.join(",") }}
      view={
        groups.length === 0 ? (
          <p className="text-sm text-office-muted italic">No amenities added yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <section key={group.label} aria-label={group.label} className="flex flex-col gap-3">
                <SubHeading>{group.label}</SubHeading>
                <ul className="flex flex-col gap-2">
                  {group.items.map((item) => (
                    <li key={item.key} className="flex items-center gap-2 text-sm font-medium">
                      <Check aria-hidden="true" className="size-4 shrink-0 text-office-success" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )
      }
      fields={({ values, set }) => {
        const selected = new Set(values.amenities.split(",").filter(Boolean));
        const toggle = (key: string, on: boolean) => {
          if (on) selected.add(key);
          else selected.delete(key);
          set("amenities")([...selected].join(","));
        };
        return (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {AMENITY_GROUPS.map((group) => (
              <fieldset key={group.label} className="flex flex-col gap-1">
                <legend className="mb-2">
                  <SubHeading>{group.label}</SubHeading>
                </legend>
                {group.items.map((item) => (
                  <label key={item.key} htmlFor={`amenity-${item.key}`} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-1 text-sm hover:bg-office-chip md:min-h-9">
                    <input
                      id={`amenity-${item.key}`}
                      type="checkbox"
                      name="amenities"
                      value={item.key}
                      checked={selected.has(item.key)}
                      onChange={(event) => toggle(item.key, event.target.checked)}
                      className="focus-ring size-4 shrink-0 accent-office-primary"
                    />
                    {item.label}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
        );
      }}
    />
  );
}
