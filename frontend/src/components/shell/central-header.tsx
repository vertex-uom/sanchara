import type { ReactNode } from "react";
import Link from "next/link";
import { House } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

type NavKey = "home" | "discover" | "about" | "contact";

// href null = page not built yet (shown as "coming soon").
const NAV_ITEMS: { key: NavKey; label: string; href: string | null }[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "discover", label: "Discover", href: "/properties" },
  { key: "about", label: "About", href: null },
  { key: "contact", label: "Contact us", href: null },
];

const navItemClass = "relative inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium";

// Glass header for the central site. Pages pass the active nav item and the
// right-hand action (account menu / sign-in pill, or "Back to Home").
export function CentralHeader({ active, action }: { active?: NavKey; action: ReactNode }) {
  return (
    // Same container as the page content so the bar's edges line up with it.
    // From md, a 1fr/auto/1fr grid keeps the nav truly centred.
    <header className="page-container absolute inset-x-0 top-0 z-20 pt-4">
      <div className="glass flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-3xl bg-white/15 px-3 py-2 text-white shadow-lg md:grid md:grid-cols-[1fr_auto_1fr] md:rounded-full">
        <Link href="/" className="focus-ring justify-self-start rounded-full pr-2" aria-label="Sanchara home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="order-last w-full md:order-none md:w-auto">
          <ul className="flex justify-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                {item.href ? (
                  <Link
                    href={item.href}
                    aria-current={item.key === active ? "page" : undefined}
                    className={cn(
                      navItemClass,
                      "focus-ring transition-colors hover:text-brand-aqua motion-reduce:transition-none",
                      item.key === active &&
                        "after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:rounded-full after:bg-brand-teal",
                    )}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span aria-disabled="true" title="Coming soon" className={cn(navItemClass, "cursor-not-allowed text-white/70")}>
                    {item.label}
                    <span className="sr-only"> (coming soon)</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {action}
      </div>
    </header>
  );
}

// Right-hand action on the auth screens.
export function BackHomeLink() {
  return (
    <Link
      href="/"
      className="focus-ring inline-flex min-h-11 items-center gap-2 justify-self-end rounded-full bg-white py-1.5 pr-4 pl-1.5 text-sm font-medium text-brand-tropical shadow transition-colors hover:bg-brand-aqua motion-reduce:transition-none"
    >
      <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-brand-blaze text-white">
        <House className="size-4" />
      </span>
      <span className="hidden sm:inline">Back to Home</span>
      {/* Short label keeps the pill on the logo's row on phones. */}
      <span className="sm:hidden">Back home</span>
    </Link>
  );
}
