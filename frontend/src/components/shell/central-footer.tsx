import Link from "next/link";
import { Logo } from "./logo";

// href null = page not built yet (shown as "coming soon").
const QUICK_LINKS: { label: string; href: string | null }[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

// TODO(confirm): the design has no profile URLs yet; add them when known.
const SOCIAL_LINKS: { label: string; badge: string; href: string | null }[] = [
  { label: "Facebook", badge: "f", href: null },
  { label: "Instagram", badge: "ig", href: null },
  { label: "LinkedIn", badge: "in", href: null },
  { label: "WhatsApp", badge: "wa", href: null },
];

// Contact details from the design.
const CONTACT = {
  email: "sanchara@gmail.com",
  phone: "+94 71461045",
  address: "Moratuwa, Sri Lanka",
};

const headingClass = "text-sm font-semibold tracking-wide text-white";
const linkClass = "focus-ring inline-flex min-h-11 items-center rounded-sm text-white/85 hover:text-brand-aqua sm:min-h-8";

// Footer for the central site's content pages.
export function CentralFooter() {
  return (
    <footer className="bg-brand-tropical text-white">
      <div className="page-container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.4fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-white/85">Your Travel Partner</p>
          <p className="mt-6 text-xs text-white/70">© 2026 Sanchara. All rights reserved.</p>
        </div>

        <nav aria-labelledby="footer-quick-links">
          <h2 id="footer-quick-links" className={headingClass}>
            Quick Links
          </h2>
          <ul className="mt-3 space-y-1 text-sm">
            {QUICK_LINKS.map((link) => (
              <li key={link.label}>
                {link.href ? (
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                ) : (
                  <span aria-disabled="true" title="Coming soon" className="inline-flex min-h-11 items-center text-white/60 sm:min-h-8">
                    {link.label}
                    <span className="sr-only"> (coming soon)</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={headingClass}>Contact</h2>
          <ul className="mt-3 space-y-1 text-sm text-white/85">
            <li>
              Email:{" "}
              <a href={`mailto:${CONTACT.email}`} className={linkClass}>
                {CONTACT.email}
              </a>
            </li>
            <li>
              Phone:{" "}
              <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className={linkClass}>
                {CONTACT.phone}
              </a>
            </li>
            <li className="py-1.5">Address: {CONTACT.address}</li>
          </ul>
        </div>

        <div>
          <h2 className={headingClass}>Follow Us</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {SOCIAL_LINKS.map((social) => {
              const content = (
                <>
                  <span
                    aria-hidden="true"
                    className="flex size-7 items-center justify-center rounded-full bg-white/15 text-xs font-semibold"
                  >
                    {social.badge}
                  </span>
                  {social.label}
                </>
              );
              return (
                <li key={social.label}>
                  {social.href ? (
                    <a href={social.href} target="_blank" rel="noopener noreferrer" className={`${linkClass} gap-2`}>
                      {content}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <span aria-disabled="true" title="Coming soon" className="inline-flex min-h-11 items-center gap-2 text-white/60 sm:min-h-8">
                      {content}
                      <span className="sr-only"> (coming soon)</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="page-container flex justify-center gap-3 py-4 text-xs sm:justify-end">
          <Link href="/privacy" className={linkClass}>
            Privacy Policy
          </Link>
          <span aria-hidden="true" className="self-center text-white/50">
            |
          </span>
          <Link href="/terms" className={linkClass}>
            Terms &amp; Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
