# AI Tell Detector

A Claude skill for when something you generated looks AI-made and you can't say why.
It names the defaults, asks what you actually want, and turns your answers into a
better prompt. It never auto-fixes and never claims AI made something.

A Claude skill by Mahita Uppuluri. Status: **v2, research-backed, in testing.**

## How to use
1. Install the skill (upload the `.skill` file in Claude settings, or copy this folder into
   `.claude/skills/ai-tell-detector/` for Claude Code).
2. Generate something with your AI tool of choice.
3. Give Claude the URL or a screenshot and ask: "does this look AI-generated?"
4. Answer its questions. It turns your answers into a prompt brief for your builder.
5. Regenerate, then run it again to see what moved.

## What it does

**1. Looks**
- **URL:** Claude opens the page in Chrome (needs Claude in Chrome) and runs a measurement
  script: Adrian Krebs's 14 landing-page checks, plus counts of how boxy the page is, how
  much color and imagery it has, its fonts, its design-system values and its copy.
- **Screenshot:** reviews by eye and says "not measured". It won't guess exact fonts.

**2. Reports**
- **Gut read first:** one honest line on whether it could belong to anyone else.
- **Where it sits:** page type (landing or app), Krebs score, surface numbers (boxes,
  color, images), and which common layout type it matches.
- **Tells found:** each with where it is, the measured evidence, why it reads as common,
  and a source tag, or "judgment" when no source supports it.
- **Copy:** 2–5 lines that match known AI phrasing.
- **Already yours:** what's clearly a decision, including deliberate choices the checks flag.
- **Questions:** 2–4 about what you actually want.
- **Not checked:** what it couldn't see.

**3. Helps you fix it (only if you ask)**
- Works from your answers, one area at a time (type, color, layout, imagery, copy), with
  2–3 options each. You choose.
- Ends with a **prompt brief** to paste into your builder: audience, what to keep, your
  decisions, and the specific defaults to avoid.

**What it won't do:** claim AI made something, call a pattern "common" without a number
behind it, or push its own taste.

## Why it works this way
- AI site builders converge on a few looks, and builders can't see it in their own work
  (Boussioux et al., 2026).
- People can't reliably tell AI-made from human-made work, so tells are clues, not proof
  (Romero et al.; Cooke et al., 2025).
- A single AI-suggested fix anchors you; building on your own decisions works better
  (Wadinambiarachchi et al., CHI 2024; Komura & Yamada, 2026; Shi & Chu, 2026).
- Tells change with every model release, so the lists are dated snapshots.

Full sources, with what each one does and doesn't support: `references/sources.md`.

## Files
- `SKILL.md`: instructions Claude follows
- `references/tells.md`: tell catalog, tagged by source and evidence level
- `references/sources.md`: every source checked, including ones set aside
- `references/measure-notes.md`: what the script returns, known false positives and blind spots
- `scripts/measure.min.js`: in-page measurement script (readable version in `scripts/source/`)
- `scripts/LICENSE-design-slop-cop`: MIT license for the bundled checks

## Credits
Pattern checks: [design-slop-cop](https://github.com/AdrianKrebs/design-slop-cop) by
Adrian Krebs (MIT).
