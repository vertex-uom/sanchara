import type { AboutContent } from "../types";
import { IconTile, SectionHeading } from "./about-bits";

// Five values, then the sustainability and accessibility commitments.
export function OurValues({ content }: { content: AboutContent["values"] }) {
  return (
    <section aria-labelledby="values-title" className="page-container py-14 md:py-20">
      <SectionHeading id="values-title" eyebrow="Values & commitments" title={content.title} centred />

      <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {content.items.map((value) => (
          <li
            key={value.title}
            className="flex flex-col items-center rounded-3xl border border-brand-lagoon/60 bg-white p-5 text-center shadow-sm last:col-span-2 md:last:col-span-1"
          >
            <IconTile icon={value.icon} className="rounded-full" />
            <h3 className="mt-3 font-semibold text-brand-tropical">{value.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{value.text}</p>
          </li>
        ))}
      </ul>

      <ul className="mt-8 grid gap-5 md:grid-cols-2">
        {content.commitments.map((commitment) => (
          <li key={commitment.title} className="rounded-3xl bg-brand-aqua/60 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <IconTile icon={commitment.icon} className="bg-white" />
              <h3 className="text-lg font-semibold text-brand-tropical">{commitment.title}</h3>
            </div>
            {commitment.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-relaxed text-brand-tropical/85">
                {paragraph}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
