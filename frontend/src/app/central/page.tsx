import { CentralHeader } from "@/components/shell/central-header";
import { JourneyLoader } from "@/components/shell/journey-loader";
import { FeaturedProperties, HomeBackdrop, HomeHero, HomeSearchForm } from "@/features/directory";
import { HeaderAccount } from "@/features/guest-auth";

// Central site home: hero, featured stays and directory search.
export default function Page() {
  return (
    <>
      <JourneyLoader />
      {/* One screen tall. Text and card sizes scale with the viewport height
          (see HomeHero and featured-card-width) so the hero fits; min-height
          rather than height, so very short screens scroll instead of clipping.
          Phones and tablets show the search bar just below the fold. */}
      <div className="relative isolate flex min-h-screen flex-1 flex-col text-white supports-[min-height:100dvh]:min-h-dvh">
        <HomeBackdrop />
        <CentralHeader active="home" action={<HeaderAccount />} />
        <main className="page-container flex flex-1 flex-col gap-10 pt-24 pb-10 md:pt-28 md:pb-14">
          {/* Centred in the space above the search bar; card bottoms line up with the CTA. */}
          <div className="grid flex-1 content-center gap-6 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-end 2xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <HomeHero />
            <FeaturedProperties />
          </div>
          <HomeSearchForm />
        </main>
      </div>
    </>
  );
}
