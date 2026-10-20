import type { ReactNode } from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONTACT_ADDRESS,
  CONTACT_EMAILS,
  CONTACT_PHONE,
  CONTACT_SOCIALS,
  CONTACT_WHATSAPP,
  telHref,
} from "../config";

const linkClass = "focus-ring rounded-sm font-medium text-brand-tropical underline-offset-4 hover:underline";

// Right-hand column: email, phone, address, WhatsApp and social links.
export function ContactDetails() {
  return (
    <div className="grid gap-4">
      <DetailCard icon={Mail} title="Email us">
        <dl className="space-y-2 text-sm">
          {CONTACT_EMAILS.map((email) => (
            <div key={email.address} className="flex flex-wrap items-center justify-between gap-x-4">
              <dt className="text-muted-foreground">{email.label}</dt>
              <dd>
                <a href={`mailto:${email.address}`} className={cn(linkClass, "inline-flex min-h-11 items-center sm:min-h-8")}>
                  {email.address}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </DetailCard>

      <DetailCard icon={Phone} title="Call us">
        <a href={telHref(CONTACT_PHONE.display)} className={cn(linkClass, "inline-flex min-h-11 items-center text-lg")}>
          {CONTACT_PHONE.display}
        </a>
        <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
          <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-teal" />
          <span>
            <span className="sr-only">Business hours: </span>
            {CONTACT_PHONE.hours}
            <span className="block">{CONTACT_PHONE.timeZone}</span>
          </span>
        </p>
      </DetailCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <DetailCard icon={MapPin} title="Visit us">
          <address className="text-sm text-brand-tropical not-italic">{CONTACT_ADDRESS}</address>
        </DetailCard>

        <DetailCard icon={MessageCircle} title="WhatsApp">
          <a
            href={`https://wa.me/${CONTACT_WHATSAPP.number}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(linkClass, "inline-flex min-h-11 flex-col justify-center text-sm")}
          >
            Chat with us
            <span className="font-normal text-muted-foreground">{CONTACT_WHATSAPP.display}</span>
            <span className="sr-only"> (opens WhatsApp in a new tab)</span>
          </a>
        </DetailCard>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-brand-lagoon/60 bg-white px-5 py-4">
        <p className="text-sm font-semibold text-brand-tropical">Follow us</p>
        <ul className="flex flex-wrap gap-2">
          {CONTACT_SOCIALS.map((social) => {
            const content = (
              <>
                <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-brand-aqua text-xs font-semibold">
                  {social.badge}
                </span>
                {social.label}
              </>
            );
            const pillClass = "inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-lagoon py-1 pr-4 pl-1.5 text-sm";
            return (
              <li key={social.label}>
                {social.href ? (
                  <a href={social.href} target="_blank" rel="noopener noreferrer" className={cn(pillClass, "focus-ring text-brand-tropical hover:bg-brand-aqua")}>
                    {content}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <span aria-disabled="true" title="Coming soon" className={cn(pillClass, "cursor-not-allowed text-brand-tropical/60")}>
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
  );
}

function DetailCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-brand-lagoon/60 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-3 font-semibold text-brand-tropical">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-aqua">
          <Icon className="size-5" />
        </span>
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
