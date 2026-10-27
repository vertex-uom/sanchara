import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAR } from "../status-tokens";

type StarRatingProps = {
  // 0–5; fractions fill part of a star (4.6 → four full stars and 60% of the fifth).
  value: number;
  className?: string;
};

// Five stars filled to match a rating. Decorative: always show the number or
// text next to it, which is what screen readers read.
export function StarRating({ value, className }: StarRatingProps) {
  return (
    <span aria-hidden="true" className={cn("inline-flex items-center gap-0.5", className)}>
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.min(1, Math.max(0, value - index));
        return (
          <span key={index} className="relative inline-flex">
            <Star className={cn("size-[1em]", STAR.empty)} strokeWidth={1.5} />
            {fill > 0 ? (
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn("size-[1em]", STAR.filled)} strokeWidth={1.5} />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
