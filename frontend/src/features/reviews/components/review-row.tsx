"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { firstName, formatReviewDate, formatStay } from "../format";
import { VERIFIED_BADGE } from "../status-tokens";
import type { Review } from "../types";
import { StarRating } from "./star-rating";

// One review: avatar, name and stars, date, stay, room and the Verified stay
// badge, then the comment (two lines, expandable when longer). Read-only.
export function ReviewRow({ review }: { review: Review }) {
  return (
    <article aria-label={`Review by ${firstName(review.guestName)}`} className="flex gap-3 rounded-[12px] border border-border bg-card p-4">
      {/* Tint follows the name, so a guest keeps the same colour. */}
      <Avatar id={review.guestName} name={review.guestName} className="size-9" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-office-muted">
          <span className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{firstName(review.guestName)}</span>
            <StarRating value={review.rating} className="text-sm" />
            <span className="sr-only">
              {review.rating} out of 5 stars
            </span>
          </span>
          <time dateTime={review.createdAt}>{formatReviewDate(review.createdAt)}</time>
          <span>{formatStay(review.stayFrom, review.stayTo)}</span>
          <span>{review.unitName}</span>
          <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium sm:ml-auto", VERIFIED_BADGE)}>
            <BadgeCheck aria-hidden="true" className="size-3.5" />
            Verified stay
          </span>
        </div>
        {review.comment ? <Comment text={review.comment} /> : null}
      </div>
    </article>
  );
}

// Two lines with an ellipsis; "Read more" appears only when the text is longer.
function Comment({ text }: { text: string }) {
  const id = useId();
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Measured while clamped; re-measured when the width changes.
    const observer = new ResizeObserver(() => {
      if (!element.classList.contains("line-clamp-2")) return;
      setOverflows(element.scrollHeight > element.clientHeight + 1);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mt-1.5">
      <p id={id} ref={ref} className={cn("text-sm text-foreground", !expanded && "line-clamp-2")}>
        {text}
      </p>
      {overflows || expanded ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((open) => !open)}
          className="focus-ring mt-1 rounded text-xs font-semibold text-brand-tropical hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
