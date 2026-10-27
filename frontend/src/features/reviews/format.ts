import { colomboDateKey } from "@/lib/format/dates";
import type { Rating, ReviewSort } from "./types";

export const SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest rating" },
  { value: "lowest", label: "Lowest rating" },
];

// Fixed three-letter months: some browsers write September as "Sept" in en-GB.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function starsLabel(rating: Rating) {
  return `${rating} ${rating === 1 ? "star" : "stars"}`;
}

// "2026-09-28" → "28 Sep" (with " 2026" when asked).
function dayMonth(isoDay: string, withYear: boolean) {
  const [year, month, day] = isoDay.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}${withYear ? ` ${year}` : ""}`;
}

// "12 Oct 2026": the day the review was written, in Colombo time.
export function formatReviewDate(iso: string) {
  return dayMonth(colomboDateKey(new Date(iso)), true);
}

// "Stayed 10 Oct – 12 Oct"; years appear only when the stay crosses one.
export function formatStay(from: string, to: string) {
  const crossesYear = from.slice(0, 4) !== to.slice(0, 4);
  return `Stayed ${dayMonth(from, crossesYear)} – ${dayMonth(to, crossesYear)}`;
}

// "James P." → "James"; the initial still shows in the avatar.
export function firstName(guestName: string) {
  return guestName.trim().split(/\s+/)[0] ?? guestName;
}
