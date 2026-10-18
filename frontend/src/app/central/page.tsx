import { CentralHeader } from "@/components/shell/central-header";
import { FeaturedProperties, HomeBackdrop, HomeHero, HomeSearchForm } from "@/features/directory";

// Central site home: hero, featured stays and directory search.
export default function Page() {
  return (
    <div className="relative isolate flex min-h-dvh flex-1 flex-col text-white">
      <HomeBackdrop />
      <CentralHeader active="home" />
      <main className="page-container flex flex-1 flex-col gap-10 pt-44 pb-6 md:pt-32">
        {/* Centred in the space above the search bar; card bottoms line up with the CTA. */}
        <div className="grid flex-1 content-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-end 2xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <HomeHero />
          <FeaturedProperties />
        </div>
        <HomeSearchForm />
      </main>
    </div>
  );
}
