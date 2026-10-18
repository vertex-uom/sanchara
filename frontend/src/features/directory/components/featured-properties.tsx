import { Suspense } from "react";
import { getFeaturedProperties } from "../server/featured-properties";
import { FeaturedPropertyCard } from "./featured-property-card";

// Horizontal snap-scroll on phones and tablets, three columns from lg.
// scroll-px matches px so snapped cards keep the page gutter.
const listClass =
  "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0";
const itemClass = "w-64 shrink-0 snap-start lg:w-auto";

export function FeaturedProperties() {
  return (
    <section aria-labelledby="featured-title" className="min-w-0">
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

  return (
    <ul className={listClass}>
      {properties.map((property) => (
        <li key={property.slug} className={itemClass}>
          <FeaturedPropertyCard property={property} />
        </li>
      ))}
    </ul>
  );
}

function FeaturedPropertiesSkeleton() {
  return (
    <ul aria-hidden="true" className={listClass}>
      {[1, 2, 3].map((n) => (
        <li key={n} className={itemClass}>
          <div className="glass h-72 animate-pulse rounded-3xl bg-white/10 motion-reduce:animate-none" />
        </li>
      ))}
    </ul>
  );
}
