import type { AboutContent } from "../types";
import { CtaButton } from "./about-bits";

// Closing call to action above the footer.
export function AboutCta({ cta }: { cta: AboutContent["cta"] }) {
  return (
    <section aria-labelledby="about-cta-title" className="page-container pb-14 md:pb-20">
      <div className="rounded-[2rem] bg-linear-to-br from-brand-tropical via-brand-deep-teal to-brand-teal px-6 py-12 text-center text-white shadow-xl sm:px-10 md:py-16">
        <h2 id="about-cta-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {cta.title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/90">{cta.body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <CtaButton link={cta.primary} variant="outline" />
          <CtaButton link={cta.secondary} variant="glass" />
        </div>
      </div>
    </section>
  );
}
