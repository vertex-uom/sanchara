import { Suspense } from "react";
import { getFeaturedStays } from "../server/directory-properties";
import { DirectoryPropertyCardSkeleton } from "./directory-property-card";
import { FeaturedStaysTabs } from "./featured-stays-tabs";

// "Handpicked for you" band on /properties.
export function FeaturedStays() {
  return (
    <section aria-labelledby="featured-stays-title" className="page-container py-12 md:py-16">
      <Suspense fallback={<FeaturedStaysSkeleton />}>
        <FeaturedStaysContent />
      </Suspense>
    </section>
  );
}

async function FeaturedStaysContent() {
  const properties = await getFeaturedStays();
  return <FeaturedStaysTabs heading={<FeaturedStaysHeading />} properties={properties} />;
}

function FeaturedStaysHeading() {
  return (
    <div>
      <p className="flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-brand-teal uppercase">
        <span aria-hidden="true" className="h-px w-8 bg-brand-teal" />
        Featured stays
      </p>
      <h2 id="featured-stays-title" className="mt-3 text-3xl font-semibold tracking-tight text-brand-tropical sm:text-4xl">
        Handpicked for you.
      </h2>
      <p className="mt-2 text-muted-foreground">Featured properties from across the Sanchara directory.</p>
    </div>
  );
}

function FeaturedStaysSkeleton() {
  return (
    <div aria-busy="true">
      <FeaturedStaysHeading />
      <span className="sr-only">Loading featured stays</span>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <DirectoryPropertyCardSkeleton key={card} />
        ))}
      </div>
    </div>
  );
}
