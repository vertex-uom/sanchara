import { Suspense } from "react";
import { getFeaturedProperties } from "../server/featured-properties";
import { FeaturedCarousel } from "./featured-carousel";

export function FeaturedProperties() {
  return (
    <section aria-labelledby="featured-title" aria-roledescription="carousel" className="min-w-0">
      <h2 id="featured-title" className="sr-only">
        Featured stays
      </h2>
      <Suspense fallback={<FeaturedPropertiesSkeleton />}>
        <FeaturedPropertyList />
      </Suspense>
    </section>
  );
}

async function FeaturedPropertyList() {
  const properties = await getFeaturedProperties();
  return <FeaturedCarousel properties={properties} />;
}

function FeaturedPropertiesSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="glass mx-auto h-80 w-64 animate-pulse rounded-3xl bg-white/10 motion-reduce:animate-none sm:w-72 xl:w-80 2xl:w-96"
    />
  );
}
