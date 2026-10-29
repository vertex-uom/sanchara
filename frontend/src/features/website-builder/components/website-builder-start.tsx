import {
  Check,
  Headphones,
  Image as ImageIcon,
  Monitor,
  MessageSquare,
  Pencil,
  Settings,
  Users,
} from "lucide-react";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { OptionCard, type OptionCardProps } from "./option-card";

const buildOwn: OptionCardProps = {
  icon: Monitor,
  title: "Create your own website",
  description:
    "Choose a template or start from scratch and build your website exactly the way you want.",
  points: [
    { icon: ImageIcon, text: "Choose from beautiful templates" },
    { icon: Pencil, text: "Customize with easy drag & drop" },
    { icon: Settings, text: "No technical skills required" },
  ],
  action: { label: "Get started", href: `${COMPANY_PATHS.website}/templates` },
};

const requestAssistance: OptionCardProps = {
  icon: Headphones,
  title: "Request WEMIXT assistance",
  description:
    "Let our partner (WEMIXT) create a professional website for your property based on your requirements.",
  points: [
    { icon: Users, text: "Share your requirements" },
    { icon: MessageSquare, text: "Get expert support" },
    {
      icon: Check,
      text: "A fixed technical fee will be added to your next subscription charge",
    },
  ],
  action: {
    label: "Request assistance",
    href: `${COMPANY_PATHS.website}/assistance`,
  },
};

// Entry screen of the Website Builder: build it yourself or ask WEMIXT.
export function WebsiteBuilderStart() {
  return (
    <div className="relative isolate flex min-h-full flex-col items-center gap-10 overflow-hidden lg:flex-row lg:items-center lg:gap-6 xl:gap-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 -z-10 size-112 rounded-full bg-office-chart-fill/70 blur-3xl"
      />
      <section
        aria-labelledby="website-builder-title"
        className="w-full max-w-md lg:flex-[0_1_24rem]"
      >
        <p className="text-sm font-medium tracking-[0.18em] text-office-primary uppercase">
          Website builder
        </p>
        <h1
          id="website-builder-title"
          className="mt-4 text-4xl leading-[1.15] font-semibold tracking-tight text-foreground sm:text-5xl"
        >
          Create your
          <br />
          <span className="text-office-primary">property website</span>
        </h1>
        <p className="mt-4 text-base leading-relaxed text-office-muted">
          Build a beautiful website for your property and reach more travelers.
          Choose the option that best suits your needs.
        </p>
      </section>
      <div className="grid w-full max-w-md gap-5 lg:max-w-none lg:flex-1 lg:grid-cols-2 xl:max-w-192 xl:flex-none">
        <OptionCard {...buildOwn} />
        <OptionCard {...requestAssistance} />
      </div>
    </div>
  );
}
