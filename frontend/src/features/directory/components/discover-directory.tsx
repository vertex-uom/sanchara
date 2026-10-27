import { Suspense } from "react";
import { parseDirectoryQuery } from "../query";
import { searchDirectory } from "../server/directory-properties";
import type { SearchParams } from "../types";
import { DirectoryPropertyCardSkeleton } from "./directory-property-card";
import { DiscoverFilters } from "./discover-filters";
import { DiscoverResults } from "./discover-results";
import { TypeChips } from "./type-chips";

type DiscoverDirectoryProps = { searchParams: Promise<SearchParams> };

// Category chips, filter sidebar and results. Reads the URL, so it streams
// in behind <Suspense>.
export function DiscoverDirectory({ searchParams }: DiscoverDirectoryProps) {
  return (
    <section aria-labelledby="directory-title" className="page-container pb-16 md:pb-20">
      <h2 id="directory-title" className="sr-only">
        All stays
      </h2>
      <Suspense fallback={<DiscoverDirectorySkeleton />}>
        <Directory searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Directory({ searchParams }: DiscoverDirectoryProps) {
  const query = parseDirectoryQuery(await searchParams);
  const result = await searchDirectory(query);

  return (
    <>
      <TypeChips query={query} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start xl:grid-cols-[19rem_minmax(0,1fr)] xl:gap-8">
        <DiscoverFilters query={query} typeCounts={result.typeCounts} total={result.total} />
        <DiscoverResults query={query} result={result} />
      </div>
    </>
  );
}

function DiscoverDirectorySkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading stays</span>
      <div aria-hidden="true" className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3, 4].map((chip) => (
          <div key={chip} className="h-11 w-32 shrink-0 animate-pulse rounded-full bg-brand-aqua motion-reduce:animate-none" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)] xl:gap-8">
        <div aria-hidden="true" className="h-12 animate-pulse rounded-3xl bg-brand-aqua motion-reduce:animate-none lg:h-[32rem]" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((card) => (
            <DirectoryPropertyCardSkeleton key={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
