import type { AboutContent } from "../types";
import { IconTile, SectionHeading } from "./about-bits";

// "What makes us different": six reasons to trust the directory.
export function BuiltForTrust({ content }: { content: AboutContent["differentiators"] }) {
  return (
    <section aria-labelledby="trust-title" className="bg-white py-14 md:py-20">
      <div className="page-container">
        <SectionHeading id="trust-title" eyebrow="What makes us different" title={content.title} intro={content.intro} centred />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.items.map((item) => (
            <li key={item.title} className="flex gap-4 rounded-3xl border border-brand-lagoon/60 bg-brand-cream p-6">
              <IconTile icon={item.icon} />
              <div>
                <h3 className="font-semibold text-brand-tropical">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
