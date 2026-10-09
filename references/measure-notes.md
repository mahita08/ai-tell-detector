# Notes on scripts/measure.min.js

## Running it
Open the page in a browser tool that can execute JavaScript, let it finish loading
(scroll once if content lazy-loads), then run the full contents of `scripts/measure.min.js`
in the page. The last expression returns a JSON string.

## What comes back
- `meta`: URL, title, body background, dark mode, element and text counts.
- `fonts`: top fonts by share of visible text, the main heading font, and any fonts on
  Krebs's templated-font list.
- `krebs`: how many of the 14 patterns fired, the tier (Heavy 5+, Mild 3–4, Clean 0–2),
  and evidence for each hit. Identical logic and thresholds to design-slop-cop (B1).
- `extra` (ours, not Krebs): distinct border radii, backdrop-blur elements, small
  uppercase labels, headings that switch font or italic mid-line, section count,
  `gradientsAnySyntax` (gradients in any color format), `system` (distinct font sizes,
  text and background colors, radii, spacing values, with the most-used values), and
  `copy` (headings and button/link labels for the copy pass), `pageType` (landing or
  app), `boxes` (card count, % of text inside cards, card nesting), `color` (colored
  surface as % of page, number of surface hues, % of colored text) and `imagery` (large
  images and their share of the page). No source sets thresholds for these; report them
  as plain counts.

## Known false positives
- **hero_eyebrow_pill** fired on a newspaper-style portfolio's masthead name line (a
  deliberate dateline above the headline). Check whether a "badge" is part of a concept.
- **slop_fonts** fired on Instrument Serif used as a deliberate display face in a mixed,
  editorial type system. A font on the list isn't automatically a default.
- Krebs reports an estimated 5–10% false-positive rate from manual QA (B1).

## Known blind spots
- **gradients** misses gradients written in newer color formats (oklab, oklch), because
  the check only parses rgb()/hex. One test page had ~51 such gradients and scored as not
  triggered. Use `extra.gradientsAnySyntax` as a note outside the score.

## Limits
- One page, one viewport per run. Mobile layouts can differ.
- Interaction quality and accessibility aren't covered (see the
  ux-heuristic-a11y-audit skill).
- Font lists and archetypes reflect 2025–2026 defaults and will drift as models change.
