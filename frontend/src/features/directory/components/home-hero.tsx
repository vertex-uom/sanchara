import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SEARCH_PATH } from "../config";

export function HomeHero() {
  return (
    <section aria-labelledby="home-hero-title" className="max-w-xl">
      <p className="flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-brand-lagoon uppercase">
        <span aria-hidden="true" className="h-px w-8 bg-brand-lagoon" />
        Discover Sri Lanka
      </p>
      <h1
        id="home-hero-title"
        className="mt-5 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl xl:text-7xl"
      >
        Travel Beyond the <span className="text-brand-teal">Expected.</span>
      </h1>
      <p className="mt-6 max-w-md text-lg text-white/90">
        From scenic hills to golden beaches, find your perfect stay in Sri Lanka.
      </p>
      <Link
        href={SEARCH_PATH}
        className="focus-ring group mt-8 inline-flex min-h-14 items-center gap-6 rounded-full bg-linear-to-r from-brand-tropical via-brand-tropical to-brand-teal py-2 pr-2 pl-7 text-lg font-medium text-white shadow-lg"
      >
        Explore Journeys
        <span className="flex size-11 items-center justify-center rounded-full bg-white text-brand-tropical transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">
          <ArrowRight aria-hidden="true" className="size-5" />
        </span>
      </Link>
    </section>
  );
}
