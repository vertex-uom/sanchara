import { Suspense } from "react";
import { parseDirectoryQuery } from "../query";
import { getPropertyTypes } from "../server/directory-properties";
import type { SearchParams } from "../types";
import { DiscoverSearchForm } from "./discover-search-form";
import { HomeBackdrop } from "./home-backdrop";

type DiscoverHeroProps = { searchParams: Promise<SearchParams> };

// Photo band at the top of /properties: title and the search bar. The header
// sits over it, so the top padding clears the header on every breakpoint.
export function DiscoverHero({ searchParams }: DiscoverHeroProps) {
  return (
    <section aria-labelledby="discover-title" className="relative isolate text-white">
      <HomeBackdrop />
      <div className="page-container pt-32 pb-12 md:pt-36 md:pb-16">
        <p className="flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-brand-lagoon uppercase">
          <span aria-hidden="true" className="h-px w-8 bg-brand-lagoon" />
          Discover Sri Lanka
        </p>
        <h1 id="discover-title" className="mt-4 text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl xl:text-6xl">
          Discover your <span className="text-brand-teal">perfect stay.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
          Independently owned guest houses, villas, surf camps and retreats — book direct on each property&apos;s own
          site.
        </p>
        <div className="mt-8">
          {/* The empty form shows while the URL is read, then the pre-filled one replaces it. */}
          <Suspense fallback={<DiscoverSearchForm />}>
            <PrefilledSearchForm searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

async function PrefilledSearchForm({ searchParams }: DiscoverHeroProps) {
  const propertyTypes = await getPropertyTypes();
  const query = parseDirectoryQuery(await searchParams, propertyTypes);
  return <DiscoverSearchForm query={query} propertyTypes={propertyTypes} />;
}
