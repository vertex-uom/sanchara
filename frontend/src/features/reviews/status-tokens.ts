// The one place reviews colours live; components never pick them.
// Stars are always shown with the number or text next to them.

export const STAR = {
  filled: "text-amber-400 fill-amber-400",
  empty: "text-office-meter-track fill-office-meter-track",
};

// "Verified stay" badge on each review.
export const VERIFIED_BADGE = "bg-office-success-soft text-office-success-text";

// Rating distribution bars: teal fill on a light grey track.
export const RATING_BAR = { track: "bg-office-meter-track", fill: "bg-brand-teal" };

// 2px Fresh Teal focus ring for this page (the shared focus-ring utility
// reads --focus-ring). Put on the page root.
export const FOCUS_SCOPE = "[--focus-ring:var(--brand-teal)]";

// Read-only info note above the list.
export const INFO_NOTE = "bg-office-tint-blue text-office-label";
