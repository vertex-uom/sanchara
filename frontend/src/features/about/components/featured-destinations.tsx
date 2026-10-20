import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RemoteImage } from "@/components/ui/remote-image";
import { SEARCH_PATH, TopRatedStays, directoryHref } from "@/features/directory";
import type { AboutContent } from "../types";
import { SectionHeading } from "./about-bits";

// Destination tiles linking into the directory, then top-rated properties.
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

      <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {content.items.map((destination) => (
          <li key={destination.name}>
            <article className="group relative isolate grid overflow-hidden rounded-3xl shadow-sm">
              <RemoteImage
                src={destination.imageUrl}
                alt={`${destination.name}, ${destination.region}`}
                width={800}
                height={1000}
                className="col-start-1 row-start-1 aspect-4/5 w-full bg-brand-aqua object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
              {/* Not positioned, so the link's ::after below stretches over the whole tile. */}
              <div className="z-10 col-start-1 row-start-1 self-end p-4 text-white sm:p-5">
                <h3 className="text-xl font-semibold sm:text-2xl">{destination.name}</h3>
                <p className="text-sm text-white/85">{destination.region}</p>
                <Link
                  href={directoryHref({ location: destination.name })}
                  className="focus-ring mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full text-sm font-medium after:absolute after:inset-0 after:content-['']"
                >
                  Browse stays
                  <span className="sr-only"> in {destination.name}</span>
                  <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>

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
