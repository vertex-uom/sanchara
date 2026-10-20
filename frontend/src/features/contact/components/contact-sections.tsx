import { HomeBackdrop } from "@/features/directory";
import { REPLY_PROMISE } from "../config";
import { ContactDetails } from "./contact-details";
import { ContactForm } from "./contact-form";

// /contact: photo hero, then the message form beside the contact details.
export function ContactSections() {
  return (
    <>
      <section aria-labelledby="contact-title" className="relative isolate text-white">
        <HomeBackdrop />
        <div className="page-container pt-44 pb-16 md:pt-40 md:pb-24">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-brand-lagoon uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-brand-lagoon" />
            Contact us
          </p>
          <h1
            id="contact-title"
            className="mt-4 max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl xl:text-6xl"
          >
            Sanchara — <span className="text-brand-teal">We&apos;d love to hear from you.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-white/90 sm:text-lg">
            Questions, support or partnerships — get in touch with the Sanchara team.
          </p>
          <p className="mt-2 text-sm text-white/80">{REPLY_PROMISE}</p>
        </div>
      </section>

      <div className="page-container grid gap-6 py-14 md:py-20 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start xl:gap-8">
        <section aria-labelledby="contact-form-title" className="rounded-3xl border border-brand-lagoon/60 bg-white p-6 shadow-sm sm:p-8">
          <h2 id="contact-form-title" className="text-2xl font-semibold tracking-tight text-brand-tropical">
            Send us a message
          </h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">{REPLY_PROMISE}</p>
          <ContactForm />
        </section>

        <section aria-labelledby="contact-details-title">
          <h2 id="contact-details-title" className="sr-only">
            Other ways to reach us
          </h2>
          <ContactDetails />
        </section>
      </div>
    </>
  );
}
