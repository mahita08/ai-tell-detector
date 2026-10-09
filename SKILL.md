---
name: ai-tell-detector
description: Diagnoses how much a UI (live URL, screenshot, Figma frame, or HTML/CSS/React code) converges on the common patterns of AI-generated and template-made sites, using measured checks and cited research, then helps the person make their own design decisions instead of auto-fixing. Use whenever someone asks if a design "looks AI", "looks generic", "looks vibe-coded", "looks like a template", "has no personality", or "feels like every other SaaS site", wants a site built with Lovable, v0, Bolt, Claude, Cursor or similar to feel more distinctive, or wants a review of any AI-generated landing page, portfolio or app UI before it ships, even if they never say "AI tell".
---

# AI Tell Detector

## What this skill is (and isn't)

AI site builders converge on a small set of looks. In one study, 73 Lovable sites built
for different businesses, under an assignment that graded originality, collapsed into
about 6–12 distinct designs, and the builders couldn't tell: how original they felt had
no link to how original their site was (`references/sources.md` A8). The cause is the
model defaulting to the most common choices in its training data (C1).

This skill makes that convergence visible and then helps the person decide what to do
about it. Two rules shape everything below:

1. **Diagnose convergence, never authorship.** A tell means "this matches a common
   default", not "an AI made this". Humans use the same templates and libraries, and
   people judge AI vs. human content at about chance (A2, A7). Never say or imply a site
   was AI-generated.
2. **Don't hand over the fix.** A single AI-written fix anchors people on it (A8a,
   Wadinambiarachchi) and usually swaps one default for another. Feedback broken into
   named dimensions, with the person deciding, works better (A8b, Shi & Chu).

Every claim about *why* something reads as generic must cite a source id. The ids are
already in `references/tells.md`, next to each tell; use those. Don't read
`references/sources.md` during a normal review (it's long). Open it only if the person
asks about a source, and then search it for the id instead of reading it all. If no
source supports a claim, label it **"judgment"**.

## This is a snapshot, and it will drift

AI models and builders keep changing, and so do their defaults. Labs remove well-known
tells and new ones appear with each model version (B4): em-dashes were a famous tell and
are now mostly gone; "delves" spiked in 2024 (A7c) and current models favor different
words. Layout archetypes will shift as models update (A8), and "slop font" lists move as
advice spreads (B1, C1).

So: treat every tell as dated. Say when a pattern comes from older-model research. Don't
present any list as permanent, and expect this skill's catalog to need updating. What
stays stable is the method: measure, compare against the crowd, separate defaults from
decisions, and let the person decide.

## Phase 1: Report

### 1. Get the evidence

Pick the route by what the person gives you. Never ask them to install or set anything
up.

- **A URL → open it and measure, every time.** First find a browser tool. Browser tools
  are often deferred (not loaded until searched for), so before deciding you have none,
  search your available tools for "chrome" or "browser" and load what you find (for
  example `mcp__claude-in-chrome__*`, or a built-in browser pane). Claude in Chrome does
  not need a linked computer; it only needs Chrome open with the extension connected. If
  a browser tool call fails because Chrome isn't reachable, say so in one line and ask
  the person to open Chrome, then use the fallback below. Then open the page at
  desktop width, let it load, run `scripts/measure.min.js` in the page (it returns JSON; don't
  read or edit it first, just pass its contents to the browser's JavaScript tool), then
  take one screenshot of the first screen and at most 3 more while scrolling, at reduced
  scale (about 0.5) to save tokens. If you have no browser tool but can
  run code with a browser installed (e.g. Playwright), load the page headlessly and
  evaluate `scripts/measure.min.js` there. (Many cloud workspaces have a browser but block
  ordinary websites, so this often fails; if the page doesn't load, move on.)
  If you can't open the page: fetch its text with a web-fetch tool and review the copy,
  then ask once, in one sentence, for a full-page screenshot so you can review the visuals.
  Don't explain tools or setup to the person. Mark the report "Not measured: no browser
  available" and treat any screenshot they send as a by-eye review.
- **A screenshot → review by eye.** Label the report **"Reviewed by eye, not
  measured."** By eye you can judge layout patterns, color, gradients, dark mode, the
  italic accent word, and copy reliably. You **cannot** reliably name exact fonts (tell
  serif from sans and say so, don't guess "Inter" vs "Geist"), detect subtle glass or
  low contrast, count radii, or see anything outside the screenshot. Mark those as "not
  checked" rather than guessing.
- **Code:** read the CSS, tokens and components. Fonts, colors, radii, blur and gradients
  can be read directly; layout patterns need judgment.

`measure.min.js` bundles Adrian Krebs's 14 deterministic checks verbatim (MIT; B1), so the
result is comparable to his study, plus a few extra measurements (radii count, blur
count, small-caps labels, headings that switch font or italic mid-line). See
`references/measure-notes.md` for what each check means and its known false positives.

**Logged-in pages:** if the URL opens a signed-in app or dashboard (e.g. "Welcome back"),
say so in one line and offer to review the public, logged-out page too, since that's
what most visitors see.

### 2. Gut read (this leads the report)

One or two honest sentences: what it feels like in the first five seconds, and whether
it could belong to anyone else. The gut read is the headline. The measured numbers
support or qualify it; a low score never overrules a clear "this could be anyone's".

### 3. Place it in the comparison set

People can't see their own convergence because they never see the distribution (A8). So
show where the site sits:

- **Krebs tier** from `measure.min.js`: Heavy (5+ of 14), Mild (3–4), Clean (0–2). His code
  notes Heavy covers about 10% of his Show HN corpus (~1,400–1,600 sites) (B1). His checks
  target **landing pages**. If `extra.pageType` is "app" (dashboard, signed-in product),
  report the tier but say plainly that most of his patterns don't apply to apps, so a
  low score there doesn't mean the UI is distinctive.
- **Surface readouts** (`extra.boxes`, `extra.color`, `extra.imagery`), plain numbers:
  share of text inside card-like boxes, colored surface as % of the page, colored text
  %, and large images. Together these describe the "all boxes, no color, no personality"
  look. Cite them as measured counts; for how far each links to AI defaults, use
  `tells.md` 4c (partly sourced, partly judgment). A boxy page with strong photography or illustration is a different case (the imagery
  is usually what's theirs).
- **Boussioux layout archetype**, by eye: Card-Grid, Whitespace, Full-Bleed Photo, Menu,
  Product Catalog, Editorial, or none. Card-Grid was the most common at 29% of 73 Lovable
  sites (A8). Archetypes are descriptive and will drift as models change.

### 4. Copy pass (always)

Copy is visible in every route, so always check it. Use `extra.copy` from the script, or
read the headings, taglines and buttons from the page or screenshot. Quote 2–5 lines that
match known tells, with the source id from `tells.md` (B4 Graphite for current models,
A7c for older-model words and structure), or label them "judgment" (marketing clichés
like "meet you where you are" have no measured source yet). Copy tells are clues, never
proof (A7b): light editing defeats detection.

### 5. Separate defaults from decisions

For each flagged pattern, look for evidence it was chosen: tied to the brand, used
consistently, pushed further than the default, or clearly part of a concept. If so,
it's a decision, not a tell. Move it to "Already theirs" and say why. The checks can't
tell the difference; you can. (Example: a newspaper-style site's dateline above the
headline trips the "headline badge" check but is part of the concept.)

**Use the system readout** (`extra.system`: distinct font sizes, colors, radii, spacing
values) only as evidence for decisions. A tight, deliberate, custom system (a clear type
scale, a small set of radii, one accent used with discipline) belongs in "Already
theirs". Don't call high counts or inconsistency an AI tell: no source supports it, and
one source describes AI output as too evenly spaced rather than messy (D, Kakehi).
Report the counts plainly if they're useful; no verdict.

### 6. Write the report

```
## Gut read
<1–2 sentences>

## Where it sits
- Page type: <landing | app>
- Krebs patterns: <n>/14 → <tier> (measured) | or "Reviewed by eye, not measured"
- Surface: <text in boxes %, colored surface %, large images> (measured)
- Layout archetype: <name or none> (by eye; landing pages only)

## Tells found
| # | Pattern | Where | Measured evidence | Why it reads as common | Source |
|---|---------|-------|-------------------|------------------------|--------|
(worst first; "Source" is an id from tells.md like B1 or A8, or "judgment")

## Copy
<2–5 quoted lines that match known tells, each with a source id or "judgment">

## Already theirs
<authored choices, including any flagged patterns that are clearly decisions, and why>

## Questions this raises
<2–4 questions about intent, brand, voice or audience that the person would need to
answer to address the biggest tells. Real questions, not suggestions in disguise.>

## Not checked
<what the method couldn't see: mobile, interactions, copy across pages, etc.>
```

Keep it to the findings that matter. If the site is genuinely distinctive, say so and
keep the table short. Don't invent problems to fill the template.

**Never claim how common or popular anything is unless a source gives the number.**
Before sending the report, reread every "Why it reads as common" cell and every sentence
with words like popular, common, rare, least, most, trendy, everywhere, near-universal,
"right now". Each needs a number from a source, or gets rewritten as a plain fact
("one of the 8 fonts on Krebs's list", "one of the 14 patterns in Krebs's checker").
The only numbers available:
- Card-Grid: 29% of 73 Lovable sites (A8). **No counts exist for the other five
  archetypes**, so never rank them (no "least common", "rare").
- Krebs's tiers: Heavy is about 10% of his corpus (B1). No per-pattern or per-font
  frequencies.
- Graphite's per-phrase multiples (B4) and Kobak/Liang word multiples (A7c).
- Inter on ~1.4–1.5% of all web pages (B2).
Nothing else. "Popular in AI builds" with no number is judgment and must be labeled so.

**Gradients:** Krebs's gradient check only reads rgb()/hex colors and misses newer
formats like oklab(). Report his result as-is, and if `extra.gradientsAnySyntax` is much
higher, mention it as a note outside his score.

## Phase 2: Solutions (only when the person asks to move on)

The research points to a specific shape (sources in brackets):

1. **Start from their answers** to "Questions this raises". Build on what they say they
   want; don't introduce unrelated directions. AI that deepened people's own ideas beat
   AI that diversified them, on trust and adoption [A8b Komura & Yamada]; deliberately
   high-diversity options didn't inspire more [A8a DesignAID].
2. **Work one dimension at a time** (type, color, layout, imagery, copy, motion) and
   explain the trade-off of each option [A8b Shi & Chu].
3. **Offer 2–3 options per dimension, each traced to something they said** or something
   in "Already theirs". Never a single fix [A8a Wadinambiarachchi].
4. **They choose. Don't apply changes on your own** [A8b Shi & Chu; A4 Weisz].
5. **Use friction on purpose:** before they regenerate a section with an AI builder, have
   them write one sentence about what should make it theirs [A8 "deliberate friction"].
6. **Hand back a prompt brief** once they've made their choices, so they can regenerate
   in whatever tool they use (Lovable, v0, Bolt, Claude, Cursor). Build it only from what
   they decided and from "Already theirs"; add nothing of your own taste. Format:

   ```
   ## Prompt brief: <site name>
   Audience: <who, in their words>
   Keep: <what's already theirs, specifically>
   Decisions:
   - Type: <their choice and why>
   - Color: <their choice; what the accent means>
   - Layout: <their choice>
   - Imagery: <their choice>
   - Copy voice: <their words, plus 1–2 example lines they wrote or approved>
   Avoid: <the defaults found in the report, named concretely, e.g. "italic accent word
   in every heading", "text inside cards everywhere", "small all-caps labels on every
   section">
   ```

   Then suggest they run the skill again on the regenerated version to see what moved.
   Iterating with AI tends to drift back toward defaults (D, Kakehi), so the second run
   is a check, not a formality.

## Tone

Direct. The person suspects something is off; hedging wastes their time. Explain why
each pattern reads as common, because the why lets them spot the next one themselves.
Be honest about uncertainty: measured vs. by-eye vs. judgment should always be clear.
