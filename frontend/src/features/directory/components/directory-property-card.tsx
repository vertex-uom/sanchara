import Link from "next/link";
import { ArrowUpRight, MapPin, Sparkles, Star } from "lucide-react";
import { RemoteImage } from "@/components/ui/remote-image";
import { formatCount } from "@/lib/format/numbers";
import { propertyHref } from "../config";
import type { DirectoryProperty } from "../types";

// Listing card on /properties. The name is a stretched link to the property
// page; "Visit site" opens the property's own booking site.
export function DirectoryPropertyCard({ property }: { property: DirectoryProperty }) {
  const { slug, name, town, district, rating, reviewCount, featured, websiteHost, imageUrl } = property;
  const place = town === district ? town : `${town}, ${district}`;

  return (
    <article className="group relative flex h-full flex-col rounded-3xl border border-brand-lagoon/50 bg-white p-2 shadow-sm transition-shadow hover:shadow-lg motion-reduce:transition-none">
      <div className="relative">
        <RemoteImage
          src={imageUrl}
          alt={`${name} in ${place}`}
          width={640}
          height={480}
          className="aspect-4/3 w-full rounded-2xl bg-brand-aqua object-cover"
        />
        {featured ? (
          <p className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-tropical shadow">
            <Sparkles aria-hidden="true" className="size-3.5 text-brand-blaze" />
            Featured
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-2 pt-3 pb-1">
        <div className="flex items-center justify-between gap-3 text-xs">
          <p className="flex min-w-0 items-center gap-1 text-muted-foreground">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-brand-teal" />
            <span className="truncate">{place}</span>
          </p>
          <p className="flex shrink-0 items-center gap-1 font-semibold text-brand-tropical">
            <Star aria-hidden="true" className="size-3.5 fill-brand-blaze text-brand-blaze" />
            <span className="sr-only">Rated </span>
            {rating.toFixed(1)}
            <span className="sr-only"> out of 5 from</span>
            <span className="font-normal text-muted-foreground">
              <span aria-hidden="true">(</span>
              {formatCount(reviewCount)}
              <span aria-hidden="true">)</span>
              <span className="sr-only"> reviews</span>
            </span>
          </p>
        </div>

        <div className="mt-2 flex flex-1 items-end justify-between gap-3">
          <h3 className="min-w-0 font-semibold text-brand-tropical">
            {/* Stretched link: the ::after covers the card; "Visit site" sits above it. */}
            <Link
              href={propertyHref(slug)}
              className="focus-ring rounded-sm after:absolute after:inset-0 after:rounded-3xl after:content-[''] group-hover:underline"
            >
              {name}
            </Link>
          </h3>
          <a
            href={`https://${websiteHost}`}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring relative z-10 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-brand-lagoon px-3 text-xs font-medium text-brand-tropical transition-colors hover:bg-brand-aqua motion-reduce:transition-none"
          >
            Visit site
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
            <span className="sr-only"> of {name} (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export function DirectoryPropertyCardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-3xl border border-brand-lagoon/50 bg-white p-2">
      <div className="aspect-4/3 animate-pulse rounded-2xl bg-brand-aqua motion-reduce:animate-none" />
      <div className="space-y-2 px-2 pt-3 pb-1">
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-brand-aqua motion-reduce:animate-none" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-brand-aqua motion-reduce:animate-none" />
      </div>
    </div>
  );
}
