import { Star } from "lucide-react";
import { formatPercent } from "@/lib/format/numbers";
import type { AboutContent } from "../types";
import { PlaceholderBadge, SectionHeading, TextLink } from "./about-bits";

// Testimonials beside the overall rating and its star distribution.
export function TravellerVoices({ content }: { content: AboutContent["voices"] }) {
  const { rating } = content;

  return (
    <section aria-labelledby="voices-title" className="bg-white py-14 md:py-20">
      <div className="page-container">
        <SectionHeading id="voices-title" eyebrow="Traveller voices" title={content.title} />

        <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
          <ul className="grid gap-5 md:grid-cols-3">
            {content.testimonials.map((testimonial) => (
              <li key={testimonial.name}>
                <figure className="flex h-full flex-col rounded-3xl border border-brand-lagoon/60 bg-brand-cream p-6">
                  <blockquote className="flex-1 leading-relaxed text-brand-tropical">&ldquo;{testimonial.quote}&rdquo;</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-tropical font-semibold text-white"
                    >
                      {testimonial.name.charAt(0)}
                    </span>
                    <span className="min-w-0 text-sm">
                      <span className="block font-semibold text-brand-tropical">
                        {testimonial.name} · {testimonial.country}
                      </span>
                      <span className="block text-muted-foreground">Stayed at {testimonial.stayedAt}</span>
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>

          <div className="rounded-3xl bg-brand-tropical p-6 text-white">
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-2 text-5xl font-semibold tracking-tight">
                {rating.average.toFixed(1)}
                <Star aria-hidden="true" className="size-8 fill-brand-blaze text-brand-blaze" />
                <span className="sr-only"> out of 5</span>
              </p>
              {rating.placeholder ? <PlaceholderBadge /> : null}
            </div>
            <p className="mt-1 text-sm text-white/85">{rating.reviewCountLabel}</p>

            <ul aria-label="Rating breakdown" className="mt-6 space-y-2">
              {rating.distribution.map((row) => (
                <li key={row.stars} className="flex items-center gap-3 text-sm">
                  <span className="w-3 shrink-0 text-right">{row.stars}</span>
                  <span className="sr-only"> stars:</span>
                  <span aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
                    <span className="block h-full rounded-full bg-brand-teal" style={{ width: `${row.ratio * 100}%` }} />
                  </span>
                  <span className="w-10 shrink-0 text-right text-white/85">{formatPercent(row.ratio, 0)}</span>
                </li>
              ))}
            </ul>

            <TextLink
              link={content.moreReviews}
              className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-white underline underline-offset-4"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
