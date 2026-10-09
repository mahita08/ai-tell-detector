# Tell catalog

Every entry has a source id from `sources.md` and an evidence level:
- **Measured:** detected by code across a real sample.
- **Named by source:** a primary or academic source names it, without per-pattern counts.
- **Commentary:** opinion pieces; use for framing, not as evidence.
- **Judgment:** no source yet. Label it "judgment" in reports. These are the gaps our own
  generated-sites sample is meant to fill.

All of these are clues to convergence, never proof of authorship (A2, A7).

---

## 1. Measured patterns (Krebs, B1; run by `scripts/measure.min.js`)

| Id | Pattern | Category |
|----|---------|----------|
| slop_fonts | Templated display fonts as the page or heading default: Space Grotesk, Instrument Serif, Fraunces, Bricolage Grotesque, Sora, Young Serif, Bodoni, Syne | fonts |
| hero_font_mix | Hero headline mixes two typefaces, roman + italic, or two colors / a gradient word | fonts |
| purple_accent | Indigo/violet filled buttons or links | colors |
| gradients | 4+ gradient backgrounds, or gradient-filled text | colors |
| accent_stripe | Colored stripe on the top or left edge of cards | layout |
| glassmorphism | Frosted, blurred translucent card-sized panels | css |
| colored_glows | 2+ large colored box-shadows / glows | colors |
| sidebar_emoji | Nav or sidebar links prefixed with emoji | layout |
| center_aligned_hero | Centered hero set in Inter or another generic sans (Inter, system-ui, Helvetica, Arial, DM Sans, Plus Jakarta Sans, Manrope, SF Pro) | layout |
| perma_dark_mode | Dark background with muted grey body text | colors |
| numbered_steps | A 1-2-3 "how it works" step row | layout |
| stat_banner_row | Row of 3–6 big stats ("10K+", "99.9%") | layout |
| hero_eyebrow_pill | Small pill / boxed / small-caps label just above the H1 | layout |
| faq_accordion | Collapsible FAQ near the bottom of the page | layout |

Notes:
- Inter only counts here when paired with a centered hero. On the web overall, Inter is
  on about 1.4–1.5% of pages (B2), so it's not "everywhere" in general.
- Krebs's font list comes from an r/UXDesign thread, and it includes Bricolage
  Grotesque, which Anthropic recommends as an alternative (C1). Font "tells" shift as
  advice spreads; treat them as the weakest measured signal.

## 2. Layout archetypes (Boussioux et al., A8; by eye)

From 73 Lovable sites, measured by image similarity:
- **Card-Grid:** hero band over a grid of uniform feature cards. Most common, 29%.
- **Whitespace:** airy, low-density, pastel.
- **Full-Bleed Photo:** edge-to-edge photographic hero (mostly dark).
- **Menu:** food hero over dish blocks.
- **Product Catalog:** text hero over dense feature cards.
- **Editorial:** atmospheric photo with serif type.

Dark vs. light is a "skin" applied across these layouts, not a style of its own (A8).
Closest-pair example: a dark hero, gradient accents and the same section rhythm (A8).

## 3. Named by primary sources (no counts)

- **Overused fonts:** Inter, Roboto, Arial, Open Sans, Lato, system fonts; models drift
  back to Space Grotesk even when told to avoid generic fonts (C1, Anthropic).
- **Purple gradients on white** (C1).
- **Timid, evenly distributed palettes** vs. dominant color with sharp accents (C1).
- **Predictable layouts and familiar component patterns** (C1).

## 4. Commentary (framing only)

- Centered hero + confident headline + two buttons; rounded cards on soft gradients;
  neutral sans; very even spacing (D, Kakehi). Overlaps with measured items above.
- Purple traced to Tailwind's `bg-indigo-500` example default (D, prg.sh; the Wathan
  apology claim is unverified).

## 4a. Copy tells, measured in academic writing (A7c; 2023–2024 models)

Older models, academic text. Useful for the *kind* of tell, less for the exact words.
- Tells are **style words, not topic words** (Kobak: 66% verbs, 16% adjectives).
- Words that spiked: "delves" (28x), "underscores" (10.9x), "showcasing" (10.2x),
  "meticulous" (34.7x), "intricate" (11.2x), "commendable" (9.8x); also "crucial",
  "potential", "innovative", "notable", "versatile" (Kobak; Liang).
- Structure: **fewer personal hedges and discourse markers, more nominalizations**
  ("the implementation of" instead of "implementing"), higher lexical diversity
  (Herbold).

## 4b. Copy tells, measured in articles (Graphite, B4)

Per-model and version-specific; they drift with each release. Measured on articles, not
website copy, so treat as strong clues rather than settled website tells.
- Claude Opus 5.5: "this matters" (116x human rate), "why _ matters" (92x),
  "is more than a _, it's a _" (98x), "looking ahead" (40x), "rather than simply" (32x),
  "adds another layer" (27x), "what comes next" (24x), "dependable" (23x), "steady",
  "thoughtful", "meaningful", "in practice".
- GPT-6 Astra: corrective framing, e.g. "not simply X", "rather than relying on X" (100x+).
- Em-dashes are no longer a reliable tell for recent models (largely removed).

## 4c. App and dashboard look (measured by our readouts; partly sourced)

Krebs's checks target landing pages, so apps need their own lens. Our script measures:
- **All boxes:** most text sits inside card-like containers, often cards inside cards
  (`extra.boxes`). Related: uniform card grids (A8), rounded cards everywhere (D).
- **No color:** near-zero colored surface, color only in small text or one accent
  (`extra.color`). Related: timid, evenly distributed palettes (C1).
- **No personality:** no photography or illustration (`extra.imagery`). Judgment.
- Common app shell: dark background, sidebar, card grid, table or leaderboard, one neon
  accent. Judgment; no source measures AI dashboards yet.

## 5. Judgment (unsourced; label as such)

- Copy clichés: "Seamless", "Effortless", "Supercharge", "Elevate your workflow",
  "Built for X. Designed for Y.", "meet you where you are", em-dash triplets.
- Team banned-word lists (e.g. "delve", "tapestry", "leverage", "unlock", "robust",
  "in today's fast-paced world") are practitioner lists. Check each word against B4's
  downloadable data before citing it as measured.
- Emoji or a single stock icon set as the only visual language.
- Abstract 3D blobs, orbs, mesh gradients, sparkle icons; smooth AI-generated people.
- Fade-up-on-scroll on every section; hover = lift + bigger shadow on every card.
- Bento grids with no reason for their cell sizes.
- The formula section order: hero → logo strip → feature cards → mockup →
  testimonials → pricing → FAQ → CTA. (Only the FAQ part is measured, B1.)
- Inconsistent radii, spacing and type below the hero. Unsupported, and possibly the
  opposite of what AI does (Kakehi, D, describes very even spacing). Don't treat as a tell;
  `measure.min.js` reports system counts as evidence for decisions only.
- Small all-caps labels above every section. `measure.min.js` counts them; Krebs's checks
  only flag the one above the H1.
