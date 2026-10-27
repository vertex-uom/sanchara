import { Quote } from "lucide-react";
import type { AboutContent } from "../types";
import { SectionHeading } from "./about-bits";

type OurStoryProps = { story: AboutContent["story"]; pillars: AboutContent["pillars"] };

// Origin story with the founder quote, then mission, vision and promise.
export function OurStory({ story, pillars }: OurStoryProps) {
  return (
    <section aria-labelledby="story-title" className="page-container py-14 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
        <div>
          <SectionHeading id="story-title" eyebrow="Our story" title={story.title} />
          {story.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-4 max-w-3xl leading-relaxed text-brand-tropical/90">
              {paragraph}
            </p>
          ))}
        </div>

        <figure className="relative rounded-3xl bg-brand-tropical p-8 text-white shadow-xl">
          <Quote aria-hidden="true" className="size-10 text-brand-teal" />
          <blockquote className="mt-4 text-xl leading-snug font-medium sm:text-2xl">&ldquo;{story.quote.text}&rdquo;</blockquote>
          <figcaption className="mt-6 text-sm">
            <span className="block font-semibold">{story.quote.author}</span>
            <span className="block text-white/80">{story.quote.role}</span>
          </figcaption>
        </figure>
      </div>

      <ul className="mt-12 grid gap-5 md:grid-cols-3">
        {pillars.map((pillar) => (
          <li key={pillar.title} className="rounded-3xl border border-brand-lagoon/60 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-brand-tropical">{pillar.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
