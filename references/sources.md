# Sources

Every claim the skill makes about *why* something reads as generic should trace back to
an entry here. Entries list what the source actually says, what we can use it for, and
what it does **not** support. Last verified: 2026-10-08.

---

## A. Peer-reviewed / academic

### A1. Design Theater (Imteyaz et al., 2026)
- **Link:** https://arxiv.org/abs/2607.22928 (arXiv preprint, v2 Jul 2026)
- **Method:** 24 UI tasks (structural, styling, functional) run through ChatGPT, Claude,
  Firebase Studio, Vercel v0 and Bolt, giving 120 interfaces. Two evaluators. Three metrics:
  Thinking Fidelity Score, Principle Adherence Score, Design Homogeneity Index (DHI).
- **Findings:**
  - Mean thinking fidelity 0.75: about 1 in 4 stated design rationales was not fully
    implemented. Claude highest (0.87), Firebase lowest (0.53).
  - Mean principle adherence about 0.54. Four of five tools scored 0.06 or lower on
    functional principles.
  - DHI: Claude and v0 were the most visually similar pair. Color varied most across
    tools; visual and layout similarity varied less.
- **Use for:** evidence that AI UI tools converge visually; evidence that the tools'
  stated design reasoning can't be trusted as a description of what was built.
- **Does not support:** any specific tell (fonts, gradients, labels).

### A2. Usable but Conventional (Romero, Wiese, Balancieiri, Leal, Guerino)
- **Link:** https://arxiv.org/abs/2605.15124 (also SEMISH: https://sol.sbc.org.br/index.php/semish/article/view/43563)
- **Method:** 92 participants (mostly CS students) rated 10 prototypes (5 AI-generated
  with Stitch, Uizard, UX Pilot, Lovable, Magic Patterns; 5 human-made) using UEQ-S,
  without knowing authorship.
- **Findings:**
  - Pragmatic (usability) quality was positive for all prototypes.
  - Hedonic quality (appeal, inventiveness) was negative for most.
  - **No consistent advantage for AI or human authorship**; both appeared at the top
    and bottom of the rankings.
- **Use for:** "generic" and "unusable" are different questions; tells are about
  convention, not authorship.
- **Does not support:** "AI designs are more conventional than human ones." The authors
  suggest it in the discussion, but the data don't show it.
- **Limits:** static screens, student raters, human prototypes made by one researcher.

### A3. Qualitative Evaluation of LLM-Designed GUI (Sawicki et al., 2025)
- **Link:** https://arxiv.org/abs/2601.22759
- **Method:** 27 single-file HTML mockups from Claude 3.5 Sonnet, GPT o3-mini-high and
  DeepSeek R1 (3 interfaces × 3 versions each). Three experts scored prompt coverage,
  Nielsen heuristics, accessibility, aesthetics and error severity.
- **Findings:** Layouts and calls to action were consistently well structured.
  Recurring problems were weak accessibility, non-functional elements, weak table and
  chart formatting, missing help or export, and missing error handling.
- **Use for:** looking beyond the visual layer; the gaps are in function and
  accessibility, not just style.
- **Does not support:** any claim about visual tells.

### A4. Design Principles for Generative AI Applications (Weisz et al., CHI 2024)
- **Link:** https://arxiv.org/abs/2401.14484
- **Content:** HCI principles for generative AI apps, including designing for
  co-creation, handling imperfect output, and keeping appropriate human control.
- **Use for:** the solutions phase: the person makes the design decisions; the tool
  supports them rather than auto-fixing.

### A5. UX Design Professionals' Perceptions of Generative AI (Li et al., CHI 2024)
- **Link:** https://arxiv.org/abs/2309.15237
- **Method:** Interviews with 20 UX designers (11 with 5+ years' experience) across
  15 companies, 2023.
- **Findings:** Designers saw GenAI mainly as an assistant for repetitive work and said
  final decision-making, empathy and user research should stay with people. Concerns
  included skill degradation and creativity exhaustion, especially for juniors.
- **Use for:** the solutions phase: practitioners themselves want to keep the decisions.

### A6. Towards a Working Definition of Designing Generative User Interfaces (Lee, 2025)
- **Link:** https://arxiv.org/abs/2505.15049
- **Method:** Review of 127 publications, 18 expert interviews, 12 case studies.
- **Content:** Defines generative UI as designers and AI building interfaces together
  through repeated cycles of generation and revision.
- **Use for:** background framing only.

### A7. As Good as a Coin Toss: Human Detection of AI-Generated Content (Cooke et al., 2025)
- **Link:** https://doi.org/10.1145/3729417 (ACM, ISSN 0001-0782 = Communications of the ACM)
- **Method:** 1,276 participants judged images, audio, video and audiovisual media.
- **Finding:** Average detection was close to chance (50%).
- **Use for:** don't trust the eye; measure instead.
- **Does not support:** anything about websites specifically (not tested). The "51.2%"
  figure circulating in summaries was not confirmed on the source page.

### A7b. AI-text detection (read 2026-10-08)
These support "clues, not proof" for copy. None gives a list of AI words.

- **Weber-Wulff et al., "Testing of detection tools for AI-generated text"**,
  *International Journal for Educational Integrity* 19:26, 2023.
  https://doi.org/10.1007/s40979-023-00146-z
  - 14 detectors (incl. Turnitin), 54 documents in 6 categories, 756 tests.
  - No tool was accurate or reliable; best was Turnitin at 76–81%. Accuracy fell to 42%
    on manually edited AI text and 26% on paraphrased AI text. About 20% of AI texts, and
    about 50% of obfuscated ones, would be judged human. Human text that was
    machine-translated was falsely flagged 11.1% of the time on average.
  - Limits: English only, Feb 2023 ChatGPT, no mixed human-AI writing.
- **Sadasivan et al., "Can AI-Generated Text be Reliably Detected?"**, arXiv 2303.11156
  (v4, Jan 2025). https://arxiv.org/abs/2303.11156
  - Recursive paraphrasing defeats watermarking, zero-shot, trained and retrieval
    detectors (e.g. watermark detection 99.3% to 9.7%). Human text can be made to look AI
    ("spoofing"). Theoretical bound: as AI and human text distributions get closer, even
    the best detector approaches chance. Note: some figures are reported inconsistently
    between the intro and body.
- **Chaka, "Reviewing the performance of AI detection tools…"**, *Journal of Applied
  Learning & Teaching*, 2024. Review of 17 studies (2023): detection efficacy was
  inconsistent across all tools; ChatGPT 3.5/4 only.
- **Uzun, "ChatGPT and Academic Integrity Concerns: Detecting AI Generated Content"**,
  *Language Education and Technology* 3(1), 2023. Brief communication listing tools and
  techniques; no data. Background only.
- **Maddugoda, "A Comprehensive Review: Detection Techniques for Human-Generated and
  AI-Generated Texts"** (5 pp., ResearchGate, ~2023). Claims modern detectors score above
  99%, which conflicts with the stronger evidence above. Do not cite.
- **Use for:** never present copy tells as proof of AI authorship; detection breaks
  down with light editing.

### A7c. Measured differences in AI writing (verified 2026-10-08)
These measure what is actually different in the text, not whether software can detect it.
All are about academic or essay writing from ChatGPT-era (2023–2024) models, not website
copy, and word tells change with each model version (see B4).

- **Kobak, González-Márquez, Horvát, Lause, "Delving into LLM-assisted writing in
  biomedical publications through excess vocabulary"** (arXiv 2406.07016; DOI
  10.1126/sciadv.adt3813, Science Advances). https://arxiv.org/abs/2406.07016
  - 15M+ PubMed abstracts, 2010–2024. At least 13.5% of 2024 abstracts likely
    LLM-processed (up to 40% in some subgroups).
  - 2024 excess words were almost all **style** words (66% verbs, 16% adjectives), unlike
    Covid-era excess words, which were content words. Examples: **"delves" (28x),
    "underscores" (10.9x), "showcasing" (10.2x)**; plus "potential", "findings",
    "crucial" by frequency gap.
- **Liang et al., "Monitoring AI-Modified Content at Scale: A Case Study on the Impact of
  ChatGPT on AI Conference Peer Reviews"**, ICML 2024.
  https://proceedings.mlr.press/v235/liang24b.html
  - 6.5–16.9% of peer-review text at four ML conferences likely substantially
    LLM-modified; higher near deadlines and in low-confidence reviews.
  - Adjective jumps (ICLR 2024): **"meticulous" 34.7x, "intricate" 11.2x,
    "commendable" 9.8x**; "innovative", "notable", "versatile" also among top AI-skewed
    adjectives.
- **Herbold et al., "A large-scale comparison of human-written versus ChatGPT-generated
  essays"**, Scientific Reports, Oct 2023 (arXiv 2304.14276).
  https://arxiv.org/abs/2304.14276
  - Teachers rated ChatGPT essays **higher** in quality than student essays.
  - AI essays: **fewer discourse and epistemic markers** (less "I think", "however",
    hedging), **more nominalizations**, **higher lexical diversity**.
- **Guo et al., "How Close is ChatGPT to Human Experts? Comparison Corpus, Evaluation, and
  Detection" (HC3)**, arXiv 2301.07597, 2023. https://arxiv.org/abs/2301.07597
  - Tens of thousands of paired human-expert and ChatGPT answers across open, finance,
    medical, legal and psychology questions. The abstract confirms the corpus and
    linguistic analysis but not the specific differences; full text not yet read.
- **Use for:** a measured base for copy tells (style words, nominalizations, fewer
  personal hedges), and evidence that tells are **style**, not content. **Does not
  support:** applying 2023–2024 word lists to current models without checking B4.

### A8. One Tool, One Taste? How Vibe Coding Trades Collective Diversity for Individual Creativity (Boussioux, Zhao, Cho, 2026)
- **Link:** https://arxiv.org/abs/2609.38183 (arXiv preprint, submitted Aug 5, 2026;
  full text, 43 pp., read 2026-10-08)
- **Method:** 73 promotional websites built with **Lovable** by graduate students for
  distinct real businesses, in a graded assignment that **rewarded original design**.
  Homepages compared with image embeddings (DINOv3): pairwise similarity, effective
  diversity, clustering. Plus 9 screen recordings (preliminary) and a survey.
- **Findings:**
  - 88% of the sites fell into 6 visual clusters (3–12 under sensitivity checks):
    "within-cohort visual concentration", even though originality was graded.
  - 2,628 site pairs: mean similarity 22.8 index points, but each site's nearest
    neighbour median 49; 14 of 73 sites (19%) have a near-twin above 70. Top pair (86):
    two different IT consultancies by different students, with "a similar dark hero,
    gradient accents, and section rhythm".
  - Effective number of distinct designs: about **6 to 12** depending on the estimator
    (Vendi 12.0, Shannon 8.0, inverse-Simpson 6.0).
  - **Six named archetypes** (by layout, not palette): **Card-Grid** (hero band over a
    grid of uniform feature cards), the most common at **21 sites (29%)**, spanning two
    IT firms, a barber and a credit-card app; **Whitespace** (airy, low-density, pastel);
    **Full-Bleed Photo** (edge-to-edge photographic hero); **Menu** (food hero over dish
    blocks); **Product Catalog** (text hero over dense feature cards); **Editorial**
    (atmospheric photo with serif type). Archetype count ranges 3–12 across 60 clustering
    settings (median 7), so six is descriptive, not a fixed fact.
  - **Dark vs light is a "skin", not a style:** Card-Grid was 16 dark / 5 light;
    Full-Bleed Photo 11 of 12 dark.
  - **"Authored ignorance":** builders' sense of control, satisfaction, intention to be
    distinctive and perceived quality had **no detectable link** to measured
    originality. Originality is relative to what everyone else made, and **no individual
    builder can see that distribution**, only their own polished site.
  - Process (recordings): one generate-and-check loop, thin and thinning prompts, quick
    generic acceptance; intentions said out loud often didn't reach the prompt;
    originality was rarely evaluated; 61% of generation time was idle waiting.
  - **Design implications they propose:** first candidates from *distinct* archetypes;
    **deliberate friction** (pre-generation constraints and comparison work, done during
    the idle wait); **originality feedback**; diversity as a platform metric.
  - **Limitations (theirs):** one class, one platform, one model generation; archetypes
    will drift as models update; no external (non-AI) baseline yet; survey covers 58 of 73
    sites; originality measured visually only ("a site can be visually generic and
    verbally distinctive").
- **Use for:** (1) the strongest evidence that one AI tool converges visually, even under
  pressure to be original; (2) named, measured archetypes (Card-Grid etc.) we can cite;
  (3) the core design insight for this skill: people need a **comparison set** to see
  their own convergence; (4) the solutions phase (friction, comparison work).
- **Does not support:** font- or color-level tells (it measures whole-page similarity),
  or any claim that AI sites are more alike than human-made ones (no baseline yet).

### A8a. Related: homogenization and fixation (read 2026-10-08)
These are not about websites, but they show the same mechanism in other creative work:
AI helps individuals and narrows the group, and it anchors people on what it shows them.

- **Doshi & Hauser, "Generative AI enhances individual creativity but reduces the
  collective diversity of novel content"**, *Science Advances*, 2024.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC11244532/
  - 293 writers wrote 8-sentence stories in 3 randomized conditions: human only, with one
    GenAI idea, with five GenAI ideas.
  - AI ideas made stories rated more creative, better written and more enjoyable,
    mostly for less-creative writers (novelty up 6.3% with one idea, 10.7% with five).
  - But AI-assisted stories were **more similar to each other**: the increase equals
    10.7% (one idea) and 8.9% (five ideas) of the human-only similarity range. The authors
    frame it as a social dilemma: individually better, collectively narrower.
  - Limits (theirs): short stories only, no back-and-forth with the model.
  - **Use for:** the "individually better, collectively samey" pattern, measured causally.
- **Wadinambiarachchi, Kelly, Pareek, Zhou, Velloso, "The Effects of Generative AI on
  Design Fixation and Divergent Thinking"**, CHI 2024. https://doi.org/10.1145/3613904.3642919
  - 60 participants sketched ideas for a chatbot avatar; between-subjects (AI image
    generator vs. image search vs. baseline).
  - With the AI image generator, participants **fixated more on the initial example** and
    produced **fewer ideas, with less variety and lower originality** than baseline.
  - The prompts people wrote, and how they turned images into ideas, drove the effect.
  - Limits (theirs): early, fairly naïve use of the tools; AI output was not instant.
  - **Use for:** AI assistance can anchor people on one direction, so the skill should
    push for alternatives, not hand over a single fix.
- **Chen, Song, Zheng, Jing, Hansen, Sun, "Understanding Design Fixation in Generative AI"**,
  arXiv 2025 (preprint). https://arxiv.org/abs/2502.05870
  - Proposes a framework for fixation *in the AI itself* (models falling back to familiar
    solutions). Empirical part: **10 novice designers**, GPT-4o and Midjourney, product
    design tasks.
  - Limits (theirs): small sample, two models, novices only, product design only.
  - **Use for:** conceptual framing ("the model fixates"), consistent with Anthropic's
    distributional convergence. Too small to cite for numbers.
- **Cai et al., "DesignAID: Using Generative AI and Semantic Diversity for Design
  Inspiration"**, CI '23 (ACM Collective Intelligence). https://doi.org/10.1145/3582269.3615596
  - 87 crowd-sourced designers. Generating images from LLM-written ideas was rated more
    inspirational, enjoyable and useful than Pinterest image search.
  - **Surprise:** deliberately *high-diversity* ideas were **not** better. Participants
    found low-diversity sets more enjoyable and useful, with no difference in inspiration.
  - **Use for:** a caution for the solutions phase. Simply throwing very different
    alternatives at people doesn't help by itself; options need to connect to their intent.

### A8b. Decision support and co-creation (read 2026-10-08)

- **Shi & Chu, "A Usability Study of Interpretable Aesthetic Evaluation as Decision Support
  in Full-Site AI Website Generators for Novice Users"**, *IEEE Access* vol. 14, 2026.
  https://doi.org/10.1109/ACCESS.2026.3686928
  - Within-subjects study, **N = 30** (mostly young university students). Compared **Wix
    ADI** with a prototype that adds **interpretable aesthetic evaluation** (scores broken
    down by color, layout, typography and details) plus actionable suggestions.
  - Guided system improved perceived usability (p < .01, d = 0.36), AI literacy (d = 0.31),
    AI self-efficacy (d = 0.19) and **perceived design quality (d = 0.51)**, and cut task
    time (p < .05); task success was similar. Eye-tracking hinted at lower cognitive effort
    (authors call it preliminary). Users' questions shifted from vague uncertainty to
    concrete, actionable ones.
  - Their design goals: feedback **decomposed into human-meaningful visual dimensions**;
    **user control, no automatic modifications**; preferences built from samples the user
    picks.
  - Limits (theirs): student sample; prototype vs. a commercial product differs in more
    than the feedback feature; small effects for pupil data. Note: the funding line cites
    "Grant BS123456", which looks like a placeholder.
  - **Use for:** the closest existing evidence for what this skill does: breaking design
    quality into named dimensions and leaving decisions to the user helps novices judge
    AI-generated sites. Supports the report format and "no auto-fix".
- **Komura & Yamada, "Deepening ideas vs. exploring new ones: AI strategy effects in
  human-AI creative collaboration"**, *PLOS ONE* 21(1), 2026. https://doi.org/10.1371/journal.pone.0340449
  - Controlled experiment, **148 participants**, turn-based brainstorming ("how to increase
    café sales"). AI that **deepened the person's own ideas** beat AI that **diversified**
    the idea space on both trust and idea adoption; its behavior was easier to understand.
  - Limits (theirs): single short session, one domain.
  - **Use for:** the solutions phase should build on what the person says they want, not
    push unrelated alternatives. Agrees with DesignAID (A8a).
- **Fu et al., "Creativity in the Age of AI: Evaluating the Impact of Generative AI on Design
  Outputs and Designers' Creative Thinking"** (Univ. of Washington), arXiv 2411.00168.
  https://arxiv.org/abs/2411.00168
  - 36 designers, within-subjects, 1080×1080 social ad; 105 designs rated blind by 5 experts.
  - GenAI designs rated more creative (~13%) and more unconventional (~23%); **no
    difference** in usefulness, visual appeal or brand alignment. Experts often called
    GenAI designs "too busy" with poor text legibility.
  - **Use for:** limited. It's about AI-generated ad images (DALL·E 2), not websites or UI,
    and does not measure homogeneity.
- **Tholander & Jonsson, "Design Ideation with AI: Sketching, Thinking and Talking with
  Generative Machine Learning Models"**, DIS '23. https://doi.org/10.1145/3563657.3596014
  - Qualitative workshop: design practitioners and researchers ideated with GPT-3.
    Themes: practical usefulness and limits, how the interaction form shapes expectations,
    how AI discourse shapes co-creation. **Use for:** background only.

### A9. ViBench: A Benchmark on Vibe Coding (Zhong et al., CAIS '26)
- **Link:** https://doi.org/10.1145/3786335.3813162 (ACM CAIS '26, open access)
- **Method:** 15 web apps from real Replit traces; 9 models, 105 artifacts; automatic
  browser evaluator (99% step agreement with humans).
- **Findings:** Best Pass@1 only 46% (Opus 4.6) and 42% (GPT-5.2); with Claude Code as
  the harness, Opus 4.6 reached 51%. Failures were mostly mundane: shallow verification,
  command misuse, logic errors, components not wired together.
- **Use for:** functional quality, not visuals. The authors **explicitly exclude visual
  design** as subjective and name automated visual evaluation as open future work, which
  confirms the gap this skill works in.

### A10. Read and set aside (not relevant to visual tells)
- **Vibe Coding vs. Agentic Coding** (Sapkota et al., 2025), https://arxiv.org/abs/2505.19443.
  Conceptual review/taxonomy; no data on visual design.
- **A Review on Vibe Coding** (Ray, TechRxiv, May 2025),
  https://doi.org/10.36227/techrxiv.174681482.27435614/v1. Not peer reviewed; a review of
  tools and challenges; no data on visual design.
- **Human and AI-Generated Website Content** (Aggeli & Drivas, 2025, ResearchGate
  publication 392589934). 2-page work-in-progress about **written content and SEO** on two
  library-science websites; reports only preliminary findings citing other work. Not
  about visual design.
- **Borovynska & Vovk, "Investigating the vision of AI driven website builder in user
  interface components"**, *Syntopia* vol. 26 (year not stated). Uizard Autodesigner 1.5
  (beta), 7 components, 5 variants each, no statistics. Simple components (radio buttons,
  checkboxes) about 30% accurate to the prompt; card layouts "fit common design norms" with
  limited novelty on repeat. Too informal to cite for numbers.
- **Vinaykarthik & Mohana, "Design of AI based User Experience Websites for E-commerce…"**,
  IEEE conference, 2022. About implementing personalization in Sitecore/ASP.NET, not
  AI-generated design.
- **Virvou, "Artificial Intelligence and User Experience in reciprocity"**, *Intelligent
  Decision Technologies* 17, 2023 (53-page review). Broad AI-for-UX and UX-for-AI review
  (assistants, recommenders, tutoring systems); not about AI-generated visual design.
- **Lively, Hutson, Melick, "Integrating AI-Generative Tools in Web Design Education"**,
  *DS Journal of AI and Robotics* 1(1), 2023. Student survey (26 or 33 students; the
  paper reports both) on using AI in a web design course. No analysis of AI-generated
  design or copy. Not relevant.
- **Li et al., "User Interaction Interface Design and Innovation Based on AI Technology"**,
  *J. Theory and Practice of Engineering Science*, 2024. Conceptual, no data; contains an
  uncited statistic. Do not cite.

---

## B. Measured, non-academic

### B1. Scoring 500 Show HN pages for AI design patterns (Adrian Krebs)
- **Link:** https://adriankrebs.ch/blog/design-slop/ (results: slopcop.adriankrebs.ch/show; code on GitHub)
- **Method:** Headless browser read DOM and computed styles; each pattern is a
  deterministic CSS/DOM check, no LLM judging. Manual QA estimated 5–10% false positives.
  Sample described as about 1,400–1,590 recent Show HN sites.
- **Patterns checked:** about 18 in the blog post; the shipped code implements 14
  (listed in `tells.md` section 1).
- **Findings (tiers only, no per-pattern numbers):** High, 4+ patterns: 22%. Medium,
  2–3: 32%. Low, 0–1: 46%.
- **Code:** https://github.com/AdrianKrebs/design-slop-cop (MIT). Read 2026-10-08; latest
  commit Jul 7, 2026. The **shipped checker differs from the blog post**:
  - The "slop font" list is **Space Grotesk, Instrument Serif, Fraunces, Bricolage
    Grotesque, Sora, Young Serif, Bodoni, Syne**, taken from an r/UXDesign thread.
    **Inter and Geist are not flagged** by the code, even though the blog lists them as
    candidates. (Note: Anthropic's blog, C1, recommends Bricolage Grotesque as an
    alternative to generic fonts, so "slop fonts" shift as advice spreads.)
  - Tiers in code: Heavy = 5+ patterns, Mild = 3–4, Clean = 0–2 (the blog used 4+/2–3).
- **Use for:** the only measured source for specific visual tells. The skill's
  `scripts/measure.min.js` bundles these exact checks so results are comparable.
- **Limits:** one author, Show HN sample (skews toward developer side projects).

### B2. HTTP Archive Web Almanac 2025, Fonts chapter (web-wide baseline)
- **Link:** https://almanac.httparchive.org/en/2025/fonts
- **What it is:** Large-scale crawl measurement of font use across the web (sample size is
  in its methodology section, not yet read).
- **Findings (share of pages declaring the font in CSS):** Roboto ~10–10.7%, Font Awesome
  ~8.5–9.3%, Poppins ~5.8–6%, Open Sans ~5–5.6%, Montserrat ~3.3–3.9%, **Inter ~1.4–1.5%**
  (called a "notable climber"). Geist and Space Grotesk are not mentioned.
- **Use for:** a baseline. Inter is uncommon on the web overall, so if it shows up far
  more often in AI-generated samples, that's a real signal, not just "Inter is popular".
- **Does not support:** anything about AI-generated sites by itself.

### B3. Searched for, none found (2026-10-08)
No second independent study measuring specific visual patterns in AI-generated sites
turned up. Checked and ruled out: "Vibe or Not" (Product Hunt; crowd voting, publishes no
data), aman.bh bookmark (links back to Krebs), slopcop (Krebs's own tool). Krebs remains
the only measured source for specific tells; our own sample is meant to be the second.

### B4. Graphite "AI Tells" study, Opus 5.5 update (Graphite, Oct 2026)
- **Link:** https://graphite.io/five-percent/research/ai-tells-opus-5-5-update
  (reported by TechCrunch, Oct 1, 2026:
  https://techcrunch.com/2026/10/01/opus-5-5-loves-to-tell-you-this-matters-and-other-ai-writing-tells/)
- **Who:** Graphite, a marketing firm (chief AI officer Greg Druck). Not peer reviewed.
- **Method:** 9,974 aligned topics, each with a human article from before ChatGPT and an
  article from each model (TechCrunch: models rewrote articles from summaries). A "tell" is
  a word/phrase/frame used at least 2x the human rate after length normalization, with
  minimum-frequency cut-offs. Also measures word-distribution divergence and em-dash rate;
  a "mannered prose" score is assigned by an LLM (Claude Opus 5), not humans. Says tells
  data and raw articles are downloadable (Google Drive; contents not yet checked).
- **Findings for Claude Opus 5.5 (vs. human rate):** "this matters" 116x, "why _ matters"
  92x, "is more than a _ it" 98x, "looking ahead the" 40x, "rather than simply" 32x,
  "adds another layer" 27x, "what comes next" 24x, "dependable" 23x, "not only about" 13x,
  "just as important" 13x, "matters most" 12x, "steady" 11x, "thoughtful" 9x,
  "meaningful" 8x, "in practice" 7x, "instead it" 8x.
- **Other models (via TechCrunch):** GPT-6 Astra "corrective framing" ("not simply X",
  "rather than relying on X") over 100x; em-dashes largely gone in Opus 5.5 and Gemini 3.1
  Pro.
- **Key caveat from the author:** labs remove well-known tells but new ones appear; each
  model version has its own. Tell lists go stale fast.
- **Use for:** the first measured source for **copy** tells, with per-model numbers.
- **Does not support:** website or marketing copy specifically (articles only), or any
  word on a team's banned list unless it appears in their data.

---

## C. Primary but non-peer-reviewed

### C1. Improving frontend design through Skills (Anthropic)
- **Link:** https://claude.com/blog/improving-frontend-design-through-skills
- **Content:** Calls the cause "distributional convergence": without direction, models
  default to the high-probability, safe choices common in training data. Names Inter,
  Roboto, Arial, Open Sans, Lato and system fonts as overused; purple gradients on white
  as a cliché; notes models still drift to Space Grotesk when told to avoid generic fonts.
- **Use for:** the *why* behind convergence, from a model maker.

---

### C2. How AI site builders are set up (primary sources)

- **Bolt.new open-source system prompt** (StackBlitz):
  https://github.com/stackblitz/bolt.new/blob/main/app/lib/.server/llm/prompts.ts
  (last commit in repo: Dec 17, 2024; the live commercial Bolt may differ.)
  Role line: an expert assistant and senior software developer. Constraints are about the
  in-browser runtime (WebContainer), preferring Vite, installing dependencies first,
  splitting code into small modules, and wrapping output in `<boltArtifact>` /
  `<boltAction>` tags. **It contains no design, styling, color, font, Tailwind, shadcn
  or icon instructions.**
  - **Use for:** in this builder, the look is not dictated by the platform's prompt, so
    it comes from the model's own defaults. Consistent with Anthropic's "distributional
    convergence" (C1).
- **Lovable official FAQ:** https://docs.lovable.dev/introduction/faq
  Apps from May 13, 2026 use TanStack Start (older apps React + Vite); PostgreSQL via
  Lovable Cloud or Supabase. Says it "uses current leading AI models" and updates them
  automatically; users can't choose. **Names no model and no styling/component library.**
- **v0 official docs:** https://v0.app/docs
  Lists Next.js, Tailwind and shadcn/ui as examples of stacks it "works with". **Names
  no model and no default styling.**
- **Not verified (do not cite):** which models Lovable/v0 use internally (e.g. "Gemini
  Flash as workhorse"); any quoted "base instructions" for Claude Design or Lovable;
  `<lovableAction>` tags; BAML. Leaked prompt collections exist on GitHub but are
  unofficial and unverifiable.

---

## D. Opinion / commentary (use for framing, not as evidence)

- **Kakehi, "AI design isn't ugly, it's fluent, and that's the problem"**, UX Collective,
  Jun 2026: https://uxdesign.cc/ai-design-isnt-ugly-it-s-fluent-and-that-s-the-problem-131b2f4eb78c
  Describes the same centered hero / two buttons / rounded cards / even spacing across
  Claude Design, Lovable, v0 and Bolt; argues iterating on AI output converges further.
- **prg.sh, "Why Your AI Keeps Building the Same Purple Gradient Website"**:
  https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website
  Traces purple to Tailwind's `bg-indigo-500` example default. Its claim that Adam
  Wathan apologized (Aug 2025) was **not independently verified**.

---

## E. Existing tools (competition, not evidence)

- **ux-skill `/ux-polish`**: https://github.com/Laith0003/ux-skill/wiki/How-to-detect-AI-slop-in-your-design
  Offline deterministic linter, severity tags, slop score /100, `--fix` auto-rewrites.
- **Krebs's checker** (B1) is also a tool.
- Gap neither fills: sourced diagnosis followed by the person making the decisions.

---

## F. Checked and excluded (could not be found as cited)

- "Looks Good, But Is It Usable? Evaluating Usability in AI-Generated User Interfaces"
- Sun & Baber, "How well can generative AI design and evaluate user interfaces?"
- "Accessibility in the Age of Generative AI Web Based Builders" (closest real paper:
  Pillai et al., ASSETS '22, about website builders in general, not AI:
  https://repository.rit.edu/article/2055)
- "Generative AI in User Experience Design and Research" (closest real paper: A5)
- "Unveiling the Invisible Hand: How AI Is Reshaping Web Design" / the UNC case study
- "Towards a World Wide Web Powered by Generative AI" (not yet checked)
- "Ability of AI Detection Tools and Humans…" and the AI-text-detection survey (not yet checked)
