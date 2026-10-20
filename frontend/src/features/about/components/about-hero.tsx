import { HomeBackdrop } from "@/features/directory";
import type { AboutContent } from "../types";
import { CtaButton } from "./about-bits";

// Photo band at the top of /about. The header sits over it.
export function AboutHero({ hero }: { hero: AboutContent["hero"] }) {
  return (
    <section aria-labelledby="about-title" className="relative isolate text-white">
      <HomeBackdrop />
      <div className="page-container pt-44 pb-16 md:pt-40 md:pb-24">
        <p className="flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-brand-lagoon uppercase">
          <span aria-hidden="true" className="h-px w-8 bg-brand-lagoon" />
          About Sanchara
        </p>
        <h1
          id="about-title"
          className="mt-4 max-w-4xl text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl xl:text-6xl"
        >
          {hero.titleLead} <span className="text-brand-teal">{hero.titleAccent}</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-white/90 sm:text-lg">{hero.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <CtaButton link={hero.primary} variant="primary" />
          <CtaButton link={hero.secondary} variant="glass" />
        </div>
      </div>
    </section>
  );
}
