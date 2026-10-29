import { Suspense } from "react";
import { getAboutContent } from "../server/about-content";
import { AboutCta } from "./about-cta";
import { AboutHero } from "./about-hero";
import { BuiltForTrust } from "./built-for-trust";
import { FeaturedDestinations } from "./featured-destinations";
import { HowItWorks } from "./how-it-works";
import { OrganizationJsonLd } from "./organization-json-ld";
import { OurNumbers } from "./our-numbers";
import { OurStory } from "./our-story";
import { OurValues } from "./our-values";
import { SafeByDesign } from "./safe-by-design";
import { TravellerVoices } from "./traveller-voices";

// All /about sections, from content the platform team edits.
export function AboutSections() {
  return (
    <Suspense fallback={<AboutSkeleton />}>
      <AboutSectionsContent />
    </Suspense>
  );
}

async function AboutSectionsContent() {
  const content = await getAboutContent();
  return (
    <>
      <OrganizationJsonLd organization={content.organization} />
      <AboutHero hero={content.hero} destinations={content.destinations.items} />
      <OurStory story={content.story} pillars={content.pillars} />
      <BuiltForTrust content={content.differentiators} />
      <HowItWorks content={content.howItWorks} />
      <SafeByDesign content={content.safety} />
      <OurNumbers content={content.numbers} />
      <FeaturedDestinations content={content.destinations} />
      <TravellerVoices content={content.voices} />
      <OurValues content={content.values} />
      <AboutCta cta={content.cta} />
    </>
  );
}

// Dark hero band and content blocks, so the header and layout don't jump.
function AboutSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading about Sanchara</span>
      <div aria-hidden="true" className="h-128 bg-brand-tropical" />
      <div aria-hidden="true" className="page-container grid gap-5 py-14 md:grid-cols-3">
        {[0, 1, 2].map((block) => (
          <div key={block} className="h-40 animate-pulse rounded-3xl bg-brand-aqua motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
