import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SEARCH_PATH, TopRatedStays, directoryHref } from "@/features/directory";
import type { AboutContent } from "../types";
import { SectionHeading } from "./about-bits";
import { DestinationExplorer } from "./destination-explorer";

// Destination tiles that open into the 3D island map, then top-rated properties.
export function FeaturedDestinations({ content }: { content: AboutContent["destinations"] }) {
  return (
    <section aria-labelledby="destinations-title" className="page-container py-14 md:py-20">
      <SectionHeading
        id="destinations-title"
        eyebrow="Featured destinations"
        title={content.title}
        action={
          <Link
            href={SEARCH_PATH}
            className="focus-ring inline-flex min-h-11 items-center gap-2 self-start rounded-full text-sm font-medium text-brand-tropical underline-offset-4 hover:underline md:self-end"
          >
            Browse all stays
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        }
      />

      <DestinationExplorer
        destinations={content.items.map(({ name, region, imageUrl, position }) => ({
          name,
          region,
          imageUrl,
          position,
          href: directoryHref({ location: name }),
        }))}
      />

      <h3 className="mt-14 text-xl font-semibold text-brand-tropical">{content.topRatedTitle}</h3>
      <div className="mt-5">
        <Suspense fallback={<TopRatedSkeleton />}>
          <TopRatedStays limit={3} />
        </Suspense>
      </div>
    </section>
  );
}

function TopRatedSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <span className="sr-only">Loading top-rated properties</span>
      {[0, 1, 2].map((card) => (
        <div key={card} aria-hidden="true" className="h-80 animate-pulse rounded-3xl bg-brand-aqua motion-reduce:animate-none" />
      ))}
    </div>
  );
}
