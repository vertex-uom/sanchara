import type { AboutContent } from "../types";
import { IconTile, SectionHeading } from "./about-bits";

// Four booking steps, then what happens after a booking.
export function HowItWorks({ content }: { content: AboutContent["howItWorks"] }) {
  return (
    <section aria-labelledby="how-title" className="page-container py-14 md:py-20">
      <SectionHeading id="how-title" eyebrow="How it works" title={content.title} intro={content.intro} centred />

      <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {content.steps.map((step, index) => (
          <li key={step.title} className="relative rounded-3xl border border-brand-lagoon/60 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <IconTile icon={step.icon} className="bg-brand-tropical text-white" />
              <span aria-hidden="true" className="text-3xl font-semibold text-brand-lagoon">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-4 font-semibold text-brand-tropical">
              <span className="sr-only">Step {index + 1}: </span>
              {step.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-3xl bg-brand-aqua/60 p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-brand-tropical">{content.afterBookingTitle}</h3>
        <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {content.afterBooking.map((item) => (
            <li key={item.title} className="flex gap-3">
              <IconTile icon={item.icon} className="size-10 bg-white" />
              <div>
                <h4 className="text-sm font-semibold text-brand-tropical">{item.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-brand-tropical/80">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
