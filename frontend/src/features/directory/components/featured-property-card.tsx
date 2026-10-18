import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { RemoteImage } from "@/components/ui/remote-image";
import { propertyHref } from "../config";
import type { FeaturedProperty } from "../types";

export function FeaturedPropertyCard({ property }: { property: FeaturedProperty }) {
  const { slug, name, town, district, type, rating, imageUrl } = property;

  return (
    <article className="group glass relative flex h-full flex-col rounded-3xl bg-black/40 p-2 text-white shadow-lg">
      <div className="relative">
        <RemoteImage
          src={imageUrl}
          alt={`${name} in ${town}`}
          width={640}
          height={480}
          className="aspect-4/3 w-full rounded-2xl object-cover"
        />
        <p className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium">
          <Star aria-hidden="true" className="size-3.5 fill-current" />
          <span className="sr-only">Rated </span>
          {rating.toFixed(1)}
          <span className="sr-only"> out of 5</span>
        </p>
      </div>

      <div className="flex flex-1 items-start justify-between gap-3 px-2 pt-3 pb-1">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-xs text-white/85">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            {town}, {district}
          </p>
          <h3 className="mt-1 line-clamp-2 font-semibold">{name}</h3>
          <p className="text-xs text-white/85">{type}</p>
        </div>
        {/* Stretched link: the ::after covers the whole card, one tab stop. */}
        <Link
          href={propertyHref(slug)}
          aria-label={`View ${name}`}
          className="focus-ring flex size-11 shrink-0 self-end items-center justify-center rounded-full border border-white/40 bg-white/15 transition-colors after:absolute after:inset-0 after:rounded-3xl after:content-[''] group-hover:bg-white/30 motion-reduce:transition-none"
        >
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </article>
  );
}
