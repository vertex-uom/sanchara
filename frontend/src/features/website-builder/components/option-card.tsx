import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

export type OptionCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  points: { icon: LucideIcon; text: string }[];
  action: { label: string; href: string };
};

// Cards look alike until hovered (or focused by keyboard), then take the highlighted style.
export function OptionCard({
  icon: Icon,
  title,
  description,
  points,
  action,
}: OptionCardProps) {
  return (
    <article className="group/card flex flex-col rounded-2xl border-[1.5px] border-office-meter-track bg-card px-7 pt-7 pb-7 text-center shadow-[0_4px_16px_rgb(15_107_110/0.06)] transition-colors duration-200 focus-within:border-brand-cyan focus-within:bg-[#f8fcfd] hover:border-brand-cyan hover:bg-[#f8fcfd]">
      <span className="mx-auto flex size-24 items-center justify-center rounded-full bg-brand-aqua text-office-icon">
        <Icon aria-hidden="true" className="size-9" strokeWidth={1.5} />
      </span>
      <h2 className="mt-6 text-[1.375rem] leading-tight font-bold text-office-icon">
        {title}
      </h2>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-office-muted">
        {description}
      </p>
      <ul className="mt-5 flex flex-1 flex-col gap-4 border-t border-office-meter-track pt-5 text-left">
        {points.map(({ icon: PointIcon, text }) => (
          <li
            key={text}
            className="flex items-center gap-4 text-[0.95rem] text-office-icon"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-office-chip text-office-icon">
              <PointIcon
                aria-hidden="true"
                className="size-[18px]"
                strokeWidth={2}
              />
            </span>
            {text}
          </li>
        ))}
      </ul>
      <Button
        asChild
        variant="outline"
        className={cn(
          "mt-12 h-11 w-full gap-2.5 rounded-lg text-[0.95rem] font-semibold",
          "border-office-meter-track bg-card text-office-primary",
          // Fills teal while its card is hovered or focused.
          "group-hover/card:border-office-primary group-hover/card:bg-office-primary group-hover/card:text-white",
          "group-focus-within/card:border-office-primary group-focus-within/card:bg-office-primary group-focus-within/card:text-white",
        )}
      >
        <Link href={action.href}>
          {action.label}
          <ArrowRight aria-hidden="true" className="size-[18px]" />
        </Link>
      </Button>
    </article>
  );
}
