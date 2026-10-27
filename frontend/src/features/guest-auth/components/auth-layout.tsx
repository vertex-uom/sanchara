import type { ReactNode } from "react";
import Image from "next/image";
import { CalendarDays, Headphones, ShieldCheck, Star, Tag, UserRound, type LucideIcon } from "lucide-react";
import { BackHomeLink, CentralHeader } from "@/components/shell/central-header";
import heroImage from "../../../../public/hero.jpg";

type Feature = { icon: LucideIcon; title: string; text: string };
// The heading breaks after `firstLine` from sm up, as in the design.
type HeroCopy = { firstLine: string; lead: string; accent: string; body: string; features: Feature[] };

// Hero copy per screen, exactly as designed (forgot/reset reuse sign-in).
const HERO: Record<"sign-in" | "sign-up", HeroCopy> = {
  "sign-up": {
    firstLine: "Start Your Journey",
    lead: "with",
    accent: "Sanchara.",
    body: "Create a free account to book verified stays, save favourites and unlock member prices.",
    features: [
      { icon: Tag, title: "Member prices", text: "Exclusive deals on 600+ stays" },
      { icon: ShieldCheck, title: "Verified stays", text: "Every host checked by our team" },
      { icon: Headphones, title: "24/7 local support", text: "Help whenever you need it" },
    ],
  },
  "sign-in": {
    firstLine: "Welcome Back",
    lead: "to",
    accent: "Sanchara.",
    body: "Sign in to manage bookings, save stays, and continue your Sri Lankan journey.",
    features: [
      { icon: Star, title: "Saved stays", text: "Keep your favourite places" },
      { icon: CalendarDays, title: "Easy booking access", text: "View and manage your trips" },
      { icon: UserRound, title: "Personalized travel experience", text: "Get recommendations just for you" },
    ],
  },
};

// Shared shell for the auth screens: dark green backdrop, glass header with
// "Back to Home", hero on the left and the form card on the right. Below lg
// the hero sits above a full-width card.
export function AuthLayout({ hero, title, children }: { hero: "sign-in" | "sign-up"; title: ReactNode; children: ReactNode }) {
  const copy = HERO[hero];
  return (
    <div className="auth-backdrop relative isolate flex min-h-dvh flex-1 flex-col text-white">
      <AuthBackdrop />
      <CentralHeader action={<BackHomeLink />} />
      <main
        id="main-content"
        tabIndex={-1}
        className="page-container grid flex-1 items-center gap-8 pt-32 pb-10 outline-none md:pt-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16 xl:gap-24"
      >
        <section aria-labelledby="auth-hero-title" className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-brand-cyan uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-brand-cyan" />
            Discover Sri Lanka
          </p>
          <h2
            id="auth-hero-title"
            className="mt-4 text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl xl:text-6xl"
          >
            {copy.firstLine} <br className="hidden sm:inline" />
            {copy.lead} <span className="text-brand-cyan">{copy.accent}</span>
          </h2>
          <p className="mt-4 max-w-md text-base text-white/90 sm:text-lg">{copy.body}</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-5">
            {copy.features.map(({ icon: Icon, title: featureTitle, text }) => (
              <li key={featureTitle} className="flex items-start gap-3">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-cyan text-white">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{featureTitle}</span>
                  <span className="block text-xs text-white/80">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="auth-card-title"
          className="glass w-full rounded-[1.75rem] bg-auth-bg-bottom/55 p-6 shadow-2xl shadow-black/30 sm:p-8"
        >
          <h1 id="auth-card-title" className="mb-5 text-2xl font-semibold sm:text-3xl">
            {title}
          </h1>
          {children}
        </section>
      </main>
    </div>
  );
}

// Local hero photo (static import, optimised by next/image) under a dark green
// tint so the hero text and glass card keep AA contrast. The gradient behind
// it shows while the photo loads.
function AuthBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
      <Image src={heroImage} alt="" fill priority placeholder="blur" sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-linear-to-r from-auth-bg-bottom/90 via-auth-bg-top/70 to-auth-bg-bottom/80" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-auth-bg-bottom/80 to-transparent" />
    </div>
  );
}

// Card placeholder while the session check streams in.
export function AuthFormSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <span className="sr-only">Loading form</span>
      {[0, 1, 2].map((row) => (
        <div key={row} className="h-12 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
      ))}
      <div className="h-12 animate-pulse rounded-full bg-white/20 motion-reduce:animate-none" />
    </div>
  );
}
