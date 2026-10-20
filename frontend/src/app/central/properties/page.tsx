import { CentralFooter } from "@/components/shell/central-footer";
import { CentralHeader } from "@/components/shell/central-header";
import { DiscoverDirectory, DiscoverHero, FeaturedStays } from "@/features/directory";
import { HeaderAccount } from "@/features/guest-auth";

export const metadata = {
  title: "Discover stays",
  description:
    "Find independently owned guest houses, villas, surf camps and retreats across Sri Lanka, then book direct on each property's own site.",
};

// Directory: hero search, featured stays, then filters and results.
// Filters live in the URL: location, type (repeatable), minRating, sort, page.
export default function Page({ searchParams }: PageProps<"/central/properties">) {
  return (
    <div className="relative flex flex-1 flex-col">
      <CentralHeader active="discover" action={<HeaderAccount />} />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <DiscoverHero searchParams={searchParams} />
        <FeaturedStays />
        <DiscoverDirectory searchParams={searchParams} />
      </main>
      <CentralFooter />
    </div>
  );
}
