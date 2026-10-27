import type { UnitStatus } from "./types";

// What saving a block does when it overlaps reservations, holds or blocks:
// "prevent" refuses to save, "warn" shows the conflicts and lets it through.
// Confirm with team.
export const BLOCK_CONFLICT_BEHAVIOUR: "prevent" | "warn" = "prevent";

// True: a block's end date is the last blocked night (28–30 Oct blocks the
// night of the 30th too). Confirm with team.
export const BLOCK_END_DATE_INCLUSIVE = true;

// Longest note a date block can carry.
export const BLOCK_NOTE_MAX = 200;

// When several things apply to a unit, the first status in this list wins.
// Confirm with team.
export const STATUS_PRECEDENCE: readonly UnitStatus[] = ["blocked", "booked", "held", "capacity_too_small", "available"];
