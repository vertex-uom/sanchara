// The admin sidebar is a "group/admin-sidebar" with data-mode = auto | rail | full.
// auto: icon rail from md, full labels from lg. The phone drawer is always full.
export const SIDEBAR_FULL_ONLY =
  "hidden lg:flex group-data-[mode=rail]/admin-sidebar:hidden group-data-[mode=full]/admin-sidebar:flex";
export const SIDEBAR_LABEL =
  "sr-only lg:not-sr-only group-data-[mode=rail]/admin-sidebar:sr-only group-data-[mode=full]/admin-sidebar:not-sr-only";
// Centre the icon in the rail; left-align icon + label in the full sidebar.
export const SIDEBAR_RAIL_CENTER =
  "justify-center lg:justify-start group-data-[mode=rail]/admin-sidebar:justify-center group-data-[mode=full]/admin-sidebar:justify-start";
// Design: nav item inset 12px left / 8px right in the full sidebar; none in
// the rail, where the icon is centred.
export const SIDEBAR_ITEM_INSET =
  "px-0 lg:pr-2 lg:pl-3 group-data-[mode=rail]/admin-sidebar:px-0 group-data-[mode=full]/admin-sidebar:pr-2 group-data-[mode=full]/admin-sidebar:pl-3";
// Design: brand row inset 8px in the full sidebar; flush in the rail.
export const SIDEBAR_BRAND_INSET =
  "px-0 lg:px-2 group-data-[mode=rail]/admin-sidebar:px-0 group-data-[mode=full]/admin-sidebar:px-2";

// Every icon in the design is Lucide drawn at this stroke (24px basis).
export const ICON_STROKE = 2.2;

export const ADMIN_ICON_BUTTON =
  "focus-ring inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] text-admin-icon transition-colors hover:bg-admin-card/70 motion-reduce:transition-none";
