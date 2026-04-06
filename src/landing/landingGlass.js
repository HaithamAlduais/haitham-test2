/**
 * Landing page glass (frosted) utilities — single source of truth.
 *
 * All values are Tailwind class strings. Pair blur with a translucent fill so
 * the grid/pattern behind reads softly.
 */

/** Small surfaces: stat blocks, inline chips (1px border, background tint). */
export const landingGlassPanel =
  "border border-border bg-background/30 text-foreground shadow-neo-sm backdrop-blur-xl backdrop-saturate-150 dark:border-border dark:bg-background/20 dark:text-foreground";

/**
 * Strong shell — saved recipe matching #intro chart column DOM:
 *   border-2 border-border bg-card/25 text-foreground shadow-shadow
 *   backdrop-blur-xl backdrop-saturate-150
 *   dark:border-border dark:bg-card/20 dark:text-foreground
 *
 * Used by: LandingHeader (floating bar), LandingIntro (chart panel),
 * LandingFAQ, LandingContact hero card.
 */
export const landingGlassPanelStrong =
  "border-2 border-border bg-card/25 text-foreground shadow-shadow backdrop-blur-xl backdrop-saturate-150 dark:border-border dark:bg-card/20 dark:text-foreground";

/** Same tokens as `landingGlassPanelStrong` — semantic alias for the #intro right column. */
export const landingIntroGlass = landingGlassPanelStrong;
