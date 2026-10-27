import { Check } from "lucide-react";
import type { AboutContent } from "../types";
import { IconTile, SectionHeading, TextLink } from "./about-bits";

// "Trust, safety & quality": verification, reviews, payments and support.
export function SafeByDesign({ content }: { content: AboutContent["safety"] }) {
  return (
    <section aria-labelledby="safety-title" className="bg-white py-14 md:py-20">
      <div className="page-container">
        <SectionHeading id="safety-title" eyebrow="Trust, safety & quality" title={content.title} intro={content.intro} centred />

        <ul className="mt-10 grid gap-5 md:grid-cols-2">
          {content.groups.map((group) => (
            <li key={group.title} className="rounded-3xl border border-brand-lagoon/60 bg-brand-cream p-6">
              <div className="flex items-center gap-3">
                <IconTile icon={group.icon} />
                <h3 className="font-semibold text-brand-tropical">{group.title}</h3>
              </div>
              <ul className="mt-4 space-y-2">
                {group.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm text-brand-tropical/90">
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-teal" />
                    {point}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-3xl border border-brand-lagoon/60 px-6 py-4 sm:flex-row">
          <ul aria-label="Payment and security" className="flex flex-wrap justify-center gap-2">
            {content.paymentBadges.map((badge) => (
              <li
                key={badge}
                className="rounded-lg border border-brand-lagoon bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-brand-tropical"
              >
                {badge}
              </li>
            ))}
          </ul>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm font-medium text-brand-tropical">
            {content.links.map((link) => (
              <li key={link.label}>
                <TextLink link={link} className="inline-flex min-h-11 items-center" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
