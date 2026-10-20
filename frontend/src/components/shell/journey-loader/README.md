# JourneyLoader

Branded first-visit splash for the central home page. A dotted route draws from
a hills marker to a coast marker while a map pin follows it, then the overlay
lifts away to reveal the hero. It plays once per browser session.

## Usage

Render it once, as the first element of the page (it is used only on
`src/app/central/page.tsx`):

```tsx
import { JourneyLoader } from "@/components/shell/journey-loader";

<JourneyLoader />
```

The page can stay a Server Component. Only `journey-loader.tsx` is a client component.

## Props

| Prop | Default | Notes |
|---|---|---|
| `label` | `"Finding your stay..."` | Visible text, announced politely (`role="status"`). |
| `minDurationMs` | `3200` | Shortest run. The route draw is timed to finish just before it. Capped at 600ms with reduced motion. |
| `maxDurationMs` | `4500` | Longest run, even if the hero image has not loaded. |
| `heroSelector` | `"[data-hero-image]"` | Image the loader waits for. If none matches, only `minDurationMs` applies. |
| `onComplete` | none | Called once the overlay is removed, or skipped. Only usable from a client parent. |

Both timings are measured from when the HTML is parsed (the first paint), not
from hydration.

## How it works

- **First paint:** the server always renders the overlay. A small inline script
  runs before it during parsing and checks `sessionStorage`
  (`sanchara:journey-seen`, wrapped in try/catch). On a repeat visit it adds a
  one-rule `<head>` style that hides the overlay, so it never flashes. Because
  nothing depends on cookies, the page stays statically prerendered.
- **Client-side navigation:** the script does not run in this case. A layout
  effect reads the same storage key before paint. If storage is blocked, a
  module flag prevents replays within the same page lifetime.
- **Exit:** the route fades out, then the sheet slides up and fades. After that
  the overlay is removed from the DOM.
- **Safety nets:**
  - With JavaScript disabled, a `<noscript>` style hides the overlay.
  - If hydration never happens, a CSS animation hides it at `maxDurationMs + 1s`.
- **Accessibility:**
  - With `prefers-reduced-motion`, there is no drawing or gliding: a static logo
    and label, then an opacity fade.
  - There is no focus trap and no scroll lock.

## Styles

Colours use the Tailwind brand tokens (`brand-tropical`, `brand-aqua`,
`brand-lagoon`, `brand-blaze`, `brand-cream`). Keyframes and states live in
`journey-loader.css`, a plain global stylesheet with `journey-loader__*` class
names. The turbopack `*.css` rule in `next.config.ts` turns `.module.css` files
into global CSS, so CSS Modules are not used here.

The route box is a fixed 320×120 px, scaled up with `transform` from `md`. The
pin's CSS `offset-path` uses px, so a fixed box keeps the pin on the SVG path at
every width. Browsers without `offset-path` show the pin at the coast marker instead.
