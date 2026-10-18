import { CentralHeader } from "@/components/shell/central-header";
import { FeaturedProperties, HomeBackdrop, HomeHero, HomeSearchForm } from "@/features/directory";

// Central site home: hero, featured stays and directory search.
export default function Page() {
  return (
    <div className="relative isolate flex min-h-dvh flex-1 flex-col text-white">
      <HomeBackdrop />
      <CentralHeader active="home" />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end gap-10 px-4 pt-44 pb-6 sm:px-6 md:pt-32 lg:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <HomeHero />
          <FeaturedProperties />
        </div>
        <HomeSearchForm />
      </main>
    </div>
  );
}
