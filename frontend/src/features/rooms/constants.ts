// Active/inactive units are a proposal pending team approval; these settings
// keep the behaviour in one place.

// Making a unit with upcoming reservations inactive: "prevent" refuses,
// "warn_and_allow" shows a warning and saves. Confirm with team.
export const INACTIVE_UNIT_WITH_RESERVATIONS: "prevent" | "warn_and_allow" = "prevent";

// Allowed range for a unit's maximum guests. Confirm with team.
export const MAX_GUESTS_MIN = 1;
export const MAX_GUESTS_MAX = 20;
