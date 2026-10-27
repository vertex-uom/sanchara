import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SEARCH_PATH } from "../config";
import { HomeBackdrop } from "./home-backdrop";

// /properties/[slug] until property pages exist: every property card links
// here, so it explains what is coming and leads back to the directory.
export function PropertyComingSoon() {
  return (
    <section aria-labelledby="property-coming-soon-title" className="relative isolate flex min-h-[85dvh] items-center text-white">
      <HomeBackdrop />
      <div className="page-container pt-32 pb-20 md:pt-40">
        <p className="flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-brand-lagoon uppercase">
          <span aria-hidden="true" className="h-px w-8 bg-brand-lagoon" />
          Property pages
        </p>
        <h1
          id="property-coming-soon-title"
          className="mt-4 max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl xl:text-6xl"
        >
          Property details are <span className="text-brand-teal">coming soon.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-white/90 sm:text-lg">
          We&apos;re building a page for every stay: photos, rooms and rates, guest reviews and booking direct with the owner. Until then, keep exploring stays across Sri Lanka.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href={SEARCH_PATH}
            className="focus-ring group inline-flex min-h-14 items-center gap-6 rounded-full bg-linear-to-r from-brand-tropical via-brand-tropical to-brand-teal py-2 pr-2 pl-7 text-lg font-medium text-white shadow-lg"
          >
            Explore other stays
            <span className="flex size-11 items-center justify-center rounded-full bg-white text-brand-tropical transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">
              <ArrowRight aria-hidden="true" className="size-5" />
            </span>
          </Link>
          <Link
            href="/"
            className="focus-ring inline-flex min-h-14 items-center rounded-full border border-white/50 px-7 text-lg font-medium text-white transition-colors hover:bg-white/10 motion-reduce:transition-none"
          >
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
