import type { AboutContent } from "../types";
import { PlaceholderBadge, SectionHeading } from "./about-bits";

// Counters on a dark band. Static numbers: no count-up animation, per the spec.
export function OurNumbers({ content }: { content: AboutContent["numbers"] }) {
  return (
    <section aria-labelledby="numbers-title" className="bg-brand-tropical py-14 text-white md:py-20">
      <div className="page-container">
        <SectionHeading
          id="numbers-title"
          eyebrow="Our numbers"
          title={content.title}
          inverted
          action={content.placeholder ? <PlaceholderBadge className="self-start md:self-end" /> : null}
        />
        <dl className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {content.stats.map((stat) => (
            <div key={stat.label} className="glass flex flex-col-reverse rounded-3xl bg-white/10 p-6">
              <dt className="mt-1 text-sm text-white/85">{stat.label}</dt>
              <dd className="text-4xl font-semibold tracking-tight sm:text-5xl">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
