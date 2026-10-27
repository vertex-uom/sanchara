"use client";

import { ToneChip } from "@/components/ui/tone-chip";
import type { PropertyIntegrations, PropertySettings } from "../types";
import { EditableSection } from "./editable-section";
import { Field, SubHeading, TextInput } from "./settings-fields";

type IntegrationKey = keyof PropertyIntegrations;

// TODO(confirm): v8 has not listed integrations or how calendar sync works;
// the API decides what each value turns on. Grouped as the guest sees them.
const GROUPS: {
  label: string;
  items: { key: IntegrationKey; label: string; placeholder: string; hint: string; type?: "url" }[];
}[] = [
  {
    label: "Analytics",
    items: [
      { key: "googleAnalyticsId", label: "Google Analytics measurement ID", placeholder: "G-AB12CD34EF", hint: "Tracks visits to your booking website." },
      { key: "metaPixelId", label: "Meta Pixel ID", placeholder: "123456789012345", hint: "Measures Facebook and Instagram ads." },
    ],
  },
  {
    label: "Listings & reviews",
    items: [
      { key: "googleBusinessUrl", label: "Google Business Profile", placeholder: "https://g.page/…", hint: "Linked from your website.", type: "url" },
      { key: "tripAdvisorUrl", label: "Tripadvisor page", placeholder: "https://www.tripadvisor.com/…", hint: "Linked from your website.", type: "url" },
    ],
  },
  {
    label: "Calendar sync",
    items: [
      { key: "bookingComIcalUrl", label: "Booking.com calendar (iCal) link", placeholder: "https://admin.booking.com/…ics", hint: "Blocks dates booked on Booking.com.", type: "url" },
      { key: "airbnbIcalUrl", label: "Airbnb calendar (iCal) link", placeholder: "https://www.airbnb.com/calendar/ical/…", hint: "Blocks dates booked on Airbnb.", type: "url" },
    ],
  },
];

// Third-party services connected to the property.
export function IntegrationsSection({ property }: { property: PropertySettings }) {
  const { integrations } = property;
  const connected = Object.values(integrations).filter(Boolean).length;

  return (
    <EditableSection
      section="integrations"
      property={property}
      title="Integrations"
      viewDescription={`${connected} of ${Object.keys(integrations).length} services connected.`}
      editDescription="Paste the IDs and links from each service. Leave a field empty to disconnect it."
      firstFieldId="integration-googleAnalyticsId"
      initial={Object.fromEntries(Object.entries(integrations).map(([key, value]) => [key, value ?? ""]))}
      view={
        <div className="flex flex-col gap-6">
          {GROUPS.map((group) => (
            <section key={group.label} aria-label={group.label} className="flex flex-col gap-3">
              <SubHeading>{group.label}</SubHeading>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {group.items.map((item) => {
                  const value = integrations[item.key];
                  return (
                    <li key={item.key} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="truncate text-xs text-office-muted">{value ?? item.hint}</p>
                      </div>
                      <ToneChip tone={value ? "success" : "neutral"} dot={Boolean(value)}>
                        {value ? "Connected" : "Not connected"}
                      </ToneChip>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      }
      fields={({ values, set, errors }) => (
        <div className="flex flex-col gap-6">
          {GROUPS.map((group) => (
            <fieldset key={group.label}>
              <legend className="mb-4">
                <SubHeading>{group.label}</SubHeading>
              </legend>
              <div className="grid gap-5 sm:grid-cols-2">
                {group.items.map((item) => (
                  <Field key={item.key} id={`integration-${item.key}`} label={item.label} hint={item.hint} error={errors[item.key]}>
                    <TextInput
                      id={`integration-${item.key}`}
                      name={item.key}
                      type={item.type ?? "text"}
                      spellCheck={false}
                      autoComplete="off"
                      placeholder={item.placeholder}
                      hint
                      value={values[item.key]}
                      onValue={set(item.key)}
                      error={errors[item.key]}
                    />
                  </Field>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}
    />
  );
}
