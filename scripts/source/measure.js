// measure.js — run in a page (e.g. via a browser JS tool). Returns JSON.
//
// Pattern checks are bundled verbatim from design-slop-cop by Adrian Krebs
// (https://github.com/AdrianKrebs/design-slop-cop, commit e2fab6c, MIT License; see
// LICENSE-design-slop-cop in this folder). Same checks, thresholds and tiers as his
// study (https://adriankrebs.ch/blog/design-slop/), so results are comparable.
// Only change: detection and scoring run together in the page instead of via Playwright,
// and a few extra measurements (see EXTRA) are appended for the report.
(() => {
  const report = (() => {
    // ── shared helpers ────────────────────────────────────────────────
    function createColorHelpers() {
  const cache = new Map();

  // A 2D canvas context lets the browser normalize ANY CSS colour (named, hex,
  // hsl, hwb, lab, lch, oklab, oklch, …) into rgba. But some pages break or
  // override canvas (e.g. canvas.getContext isn't a function), so guard every
  // step and fall back to a JS parser for the common rgb()/hex cases rather than
  // letting the whole scan crash.
  let ctx2d = null;
  try {
    const c = document.createElement('canvas');
    if (c && typeof c.getContext === 'function') { c.width = 1; c.height = 1; ctx2d = c.getContext('2d'); }
  } catch {}
  if (!ctx2d && typeof OffscreenCanvas === 'function') {
    try { ctx2d = new OffscreenCanvas(1, 1).getContext('2d'); } catch {}
  }

  // Canvas-free fallback: handles rgb()/rgba() and #hex (what getComputedStyle
  // returns for most colours). Exotic formats return null (treated as no match).
  function parseBasic(str) {
    const m = str.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i);
    if (m) {
      let a = 1;
      if (m[4] != null) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      return { r: +m[1], g: +m[2], b: +m[3], a };
    }
    let h = str.trim();
    if (h[0] === '#') {
      h = h.slice(1);
      if (h.length === 3 || h.length === 4) h = h.split('').map(c => c + c).join('');
      if (h.length === 6 || h.length === 8) {
        return {
          r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16),
          a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
        };
      }
    }
    return null;
  }

  function parseColor(str) {
    if (!str) return null;
    if (cache.has(str)) return cache.get(str);
    if (str === 'transparent' || str === 'rgba(0, 0, 0, 0)') {
      const v = { r: 0, g: 0, b: 0, a: 0 };
      cache.set(str, v);
      return v;
    }
    let out = null;
    if (ctx2d) {
      ctx2d.clearRect(0, 0, 1, 1);
      let ok = true;
      try { ctx2d.fillStyle = str; } catch { ok = false; }
      if (ok) {
        ctx2d.fillRect(0, 0, 1, 1);
        try {
          const d = ctx2d.getImageData(0, 0, 1, 1).data;
          out = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
        } catch {}
      }
    } else {
      out = parseBasic(str);
    }
    cache.set(str, out);
    return out;
  }

  function rgbToHsl(rgb) {
    let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    return { h, s, l };
  }

  function relativeLuminance(rgb) {
    const chan = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * chan(rgb.r) + 0.7152 * chan(rgb.g) + 0.0722 * chan(rgb.b);
  }

  function contrastRatio(c1, c2) {
    const L1 = relativeLuminance(c1), L2 = relativeLuminance(c2);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  }

  function isPurple(color) {
    if (!color || color.a < 0.3) return false;
    const hsl = rgbToHsl(color);
    // Purple/violet/magenta range with enough saturation to not be grey.
    return hsl.h >= 250 && hsl.h <= 300 && hsl.s > 0.25 && hsl.l > 0.15 && hsl.l < 0.85;
  }

  return { parseColor, rgbToHsl, relativeLuminance, contrastRatio, isPurple };
}
    function createVisibilityHelpers(parseColor) {
  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.05) return false;
    return true;
  }

  function effectiveBg(el) {
    let cur = el;
    while (cur) {
      const cs = getComputedStyle(cur);
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0.5) return c;
      // Also consider a solid-looking gradient bg-image. Many AI templates
      // ship body { background-image: linear-gradient(#070f1f, #081428) }
      // with backgroundColor still transparent — the visible bg is the
      // gradient's average colour.
      const grad = gradientAverageColor(cs.backgroundImage);
      if (grad) return grad;
      cur = cur.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }

  // Return the average of all colour stops in a CSS gradient bg-image, or
  // null if the value isn't a gradient. We only call this for the body /
  // html / topmost-section ancestor walk, so cost is bounded.
  function gradientAverageColor(bgImage) {
    if (!bgImage || !/gradient\(/.test(bgImage)) return null;
    const matches = bgImage.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi) || [];
    if (!matches.length) return null;
    let r = 0, g = 0, b = 0, n = 0;
    for (const m of matches) {
      const c = parseColor(m);
      if (!c) continue;
      r += c.r; g += c.g; b += c.b; n++;
    }
    if (!n) return null;
    return { r: r / n, g: g / n, b: b / n, a: 1 };
  }

  return { isVisible, effectiveBg };
}
    function countEmoji(s) {
  if (!s) return 0;
  // Variation selector ️ is the "show as emoji" qualifier.
  const re = /(?:\p{Extended_Pictographic}️?)|[\u{1F300}-\u{1FAFF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]️/gu;
  const m = s.match(re);
  return m ? m.length : 0;
}
    function isSlopFont(name) {
  if (!name) return false;
  return SLOP_FONT_PREFIXES.some(p => name === p || name.startsWith(p + ' '));
}
    const SLOP_FONT_PREFIXES = ["Space Grotesk","Instrument Serif","Fraunces","Bricolage Grotesque","Sora","Young Serif","Bodoni","Syne"];

    const colors = createColorHelpers();
    const visHelpers = createVisibilityHelpers(colors.parseColor);

    // ── shared signals (computed once) ────────────────────────────────
    const all = Array.from(document.querySelectorAll('*'));
    const visible = all.filter(visHelpers.isVisible);
    const bodyBg = visHelpers.effectiveBg(document.body);
    const bodyLuminance = colors.relativeLuminance(bodyBg);
    const isDarkMode = bodyLuminance < 0.2;
    const h1 = document.querySelector('h1');

    // Font usage by character count, separately for headings.
    const fontCharCounts = new Map();
    const headingFontChars = new Map();
    let totalTextChars = 0;
    for (const el of visible) {
      const hasText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
      if (!hasText) continue;
      const cs = getComputedStyle(el);
      const fam = (cs.fontFamily || '').split(',')[0].trim().replace(/^['"]|['"]$/g, '');
      if (!fam) continue;
      const txt = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
      const chars = txt.length;
      fontCharCounts.set(fam, (fontCharCounts.get(fam) || 0) + chars);
      totalTextChars += chars;
      if (/^H[1-3]$/.test(el.tagName)) {
        headingFontChars.set(fam, (headingFontChars.get(fam) || 0) + chars);
      }
    }
    const sortedFonts = [...fontCharCounts.entries()].sort((a, b) => b[1] - a[1]);
    const topFonts = sortedFonts.slice(0, 6).map(([name, chars]) => ({
      name, chars, pct: totalTextChars ? +(100 * chars / totalTextChars).toFixed(1) : 0
    }));
    const slopFontsDetected = sortedFonts
      .filter(([name]) => isSlopFont(name))
      .map(([name, chars]) => ({ name, chars, pct: totalTextChars ? +(100 * chars / totalTextChars).toFixed(1) : 0 }));
    const headingFont = ([...headingFontChars.entries()].sort((a, b) => b[1] - a[1])[0] || [null])[0];

    // ── ctx passed to each pattern extract ────────────────────────────
    const ctxBase = {
      // helpers
      parseColor: colors.parseColor,
      rgbToHsl: colors.rgbToHsl,
      relativeLuminance: colors.relativeLuminance,
      contrastRatio: colors.contrastRatio,
      isPurple: colors.isPurple,
      isVisible: visHelpers.isVisible,
      effectiveBg: visHelpers.effectiveBg,
      countEmoji,
      // computed signals
      visible,
      bodyBg,
      bodyLuminance,
      isDarkMode,
      h1,
      fonts: { topFonts, slopFontsDetected, headingFont, totalTextChars }
    };

    // ── run patterns ──────────────────────────────────────────────────
    const signals = {};
    try { signals["slop_fonts"] = (function (ctx) {
    return {
      detected: ctx.fonts.slopFontsDetected,
      headingFont: ctx.fonts.headingFont
    };
  })({
      ...ctxBase,
      thresholds: {"minTotalPct":25}
    }); } catch (e) { signals["slop_fonts"] = null; }
    try { signals["hero_font_mix"] = (function (ctx) {
    var T = ctx.thresholds;
    var MAXTOP = window.innerHeight || 900;

    // Per-run paint token: a gradient-clipped word, or a quantized solid colour.
    function paintOf(cs) {
      var clip = cs.webkitBackgroundClip || cs.backgroundClip || '';
      if (clip === 'text' && /gradient/.test(cs.backgroundImage || '')) return { paint: 'grad', disp: 'gradient' };
      var m = (cs.color || '').match(/rgba?\(([^)]+)\)/);
      if (m) {
        var p = m[1].split(',').map(function (x) { return parseFloat(x); });
        var a = p.length > 3 ? p[3] : 1;
        if (a >= 0.1) return {
          paint: 'c' + Math.round(p[0] / 24) + '_' + Math.round(p[1] / 24) + '_' + Math.round(p[2] / 24),
          disp: 'rgb(' + Math.round(p[0]) + ',' + Math.round(p[1]) + ',' + Math.round(p[2]) + ')'
        };
      }
      return { paint: null, disp: null };
    }

    // Candidate hero headings: large font, near top, headline-length text.
    var cands = [];
    for (var i = 0; i < ctx.visible.length; i++) {
      var el = ctx.visible[i];
      var cs = getComputedStyle(el);
      var size = parseFloat(cs.fontSize) || 0;
      if (size < T.minFontSize) continue;
      var r = el.getBoundingClientRect();
      if (r.top < 0 || r.top > MAXTOP || r.width === 0) continue;
      var txt = (el.textContent || '').trim();
      if (txt.length < 2 || txt.length > T.maxTextLen) continue;
      // A real heading: has its own text, or wraps only inline runs.
      var hasDirect = false, onlyInline = true;
      for (var c = 0; c < el.childNodes.length; c++) {
        var n = el.childNodes[c];
        if (n.nodeType === 3 && n.textContent.trim().length >= 2) hasDirect = true;
        if (n.nodeType === 1 && !/^(SPAN|EM|I|B|STRONG|MARK|A|U|SMALL)$/.test(n.tagName)) onlyInline = false;
      }
      if (!hasDirect && !onlyInline) continue;
      cands.push({ el: el, size: size, top: r.top, txt: txt });
    }
    if (!cands.length) return { hero: false };
    // Biggest first; on a tie prefer the LONGER heading (the parent that holds
    // the whole headline) over an inline emphasized fragment of the same size.
    cands.sort(function (a, b) { return b.size - a.size || b.txt.length - a.txt.length || a.top - b.top; });

    // One run per text node in the chosen heading's subtree — so an inline
    // emphasized word (different family / italic / colour / gradient) is seen
    // alongside the rest of the headline.
    var hero = cands[0];
    var runs = [];
    (function visit(el) {
      for (var c = 0; c < el.childNodes.length; c++) {
        var n = el.childNodes[c];
        if (n.nodeType === 3) {
          var t = n.textContent.trim();
          if (t.length >= 2) {
            var cs = getComputedStyle(el);
            var fam = (cs.fontFamily || '').split(',')[0].replace(/^['"]|['"]$/g, '').trim();
            // Skip icon fonts and monospace/code fonts — a code snippet in the
            // hero (e.g. Inter + ui-monospace) is not decorative font-mixing.
            if (!fam || /awesome|material icons|icon|mono|consolas|menlo|courier/i.test(fam)) continue;
            var st = (cs.fontStyle || '');
            var pt = paintOf(cs);
            runs.push({ fam: fam, style: (st.indexOf('italic') === 0 || st.indexOf('oblique') === 0) ? 'italic' : 'normal', paint: pt.paint, disp: pt.disp });
          }
        } else if (n.nodeType === 1) {
          visit(n);
        }
      }
    })(hero.el);

    var fams = [], styles = [], paints = [], colors = [];
    for (var k = 0; k < runs.length; k++) {
      if (fams.indexOf(runs[k].fam) < 0) fams.push(runs[k].fam);
      if (styles.indexOf(runs[k].style) < 0) styles.push(runs[k].style);
      if (runs[k].paint && paints.indexOf(runs[k].paint) < 0) { paints.push(runs[k].paint); colors.push(runs[k].disp); }
    }
    return {
      hero: true,
      heroText: hero.txt.slice(0, 80),
      fontSize: Math.round(hero.size),
      top: Math.round(hero.top),
      families: fams,
      styles: styles,
      colors: colors,
      colorCount: paints.length,
      runCount: runs.length
    };
  })({
      ...ctxBase,
      thresholds: {"minFontSize":32,"maxTextLen":140}
    }); } catch (e) { signals["hero_font_mix"] = null; }
    try { signals["purple_accent"] = (function (ctx) {
    const { visible, parseColor, isPurple } = ctx;
    let elementCount = 0;
    let filledAccentCount = 0;
    const samples = [];
    for (const el of visible) {
      const cs = getComputedStyle(el);
      const bg = parseColor(cs.backgroundColor);
      const borderColor = parseColor(cs.borderColor);
      const bgImg = cs.backgroundImage || '';
      let isP = false;
      let bgGradientPurple = false;
      if (isPurple(bg)) isP = true;
      if (isPurple(borderColor) && parseFloat(cs.borderWidth) > 0) isP = true;
      if (bgImg.includes('gradient')) {
        // parseColor handles both rgba(...) and #hex via the canvas, so a
        // single regex covering both forms is enough.
        const colorMatches = bgImg.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi) || [];
        for (const cm of colorMatches) {
          if (isPurple(parseColor(cm))) { bgGradientPurple = true; break; }
        }
        if (bgGradientPurple) isP = true;
      }
      if (!isP) continue;
      elementCount++;
      if (samples.length < 4) {
        samples.push({ tag: el.tagName.toLowerCase(), bg: cs.backgroundColor, color: cs.color });
      }

      // "Filled accent": a CTA-like element actually painted purple. Outline /
      // ghost / link-text-only purples don't qualify — those don't make a site
      // feel "VibeCode purple" the way a solid violet button does.
      const className = (el.className || '') + '';
      const isCta = /^(A|BUTTON)$/.test(el.tagName) || /btn|button|cta/i.test(className);
      if (!isCta) continue;
      if (/outline|ghost/i.test(className)) continue;
      const filledBg = bg && bg.a >= 0.5 && isPurple(bg);
      // Gradient-on-CTA counts as filled only if backgroundColor is also (near-)
      // transparent — i.e. the gradient IS the fill, not a stroke / mask trick.
      // Outline-style gradient buttons set backgroundColor to white/page color.
      const filledGradient = bgGradientPurple && (!bg || bg.a < 0.1);
      if (filledBg || filledGradient) filledAccentCount++;
    }
    return {
      elementCount,
      filledAccentCount,
      samples
    };
  })({
      ...ctxBase,
      thresholds: {"minFilledAccent":1}
    }); } catch (e) { signals["purple_accent"] = null; }
    try { signals["gradients"] = (function (ctx) {
    const { visible, h1 } = ctx;

    // A gradient string is "visible" only if it has at least one non-transparent
    // color stop. Skips no-op fallback gradients like
    //   linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0))
    // commonly stacked under SVG icons (e.g. HN's vote arrows).
    function hasVisibleStop(bgImg) {
      const rgbaRe = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*([\d.]+))?\s*\)/g;
      let m;
      while ((m = rgbaRe.exec(bgImg)) !== null) {
        const alpha = m[1] === undefined ? 1 : parseFloat(m[1]);
        if (alpha > 0.05) return true;
      }
      const hexRe = /#([0-9a-fA-F]{3,8})\b/g;
      while ((m = hexRe.exec(bgImg)) !== null) {
        const h = m[1];
        if (h.length === 3 || h.length === 6) return true;
        if (h.length === 4) { if (parseInt(h.slice(3, 4), 16) > 0) return true; }
        if (h.length === 8) { if (parseInt(h.slice(6, 8), 16) > 12) return true; }
      }
      return /\b(red|blue|green|yellow|orange|purple|violet|indigo|cyan|magenta|pink|black|white|gray|grey|brown|teal|navy|aqua|lime|silver|gold|maroon|olive|fuchsia|coral|crimson|salmon|tomato|currentcolor)\b/i.test(bgImg);
    }

    let bgElements = 0;
    let textElements = 0;
    let conic = 0;
    for (const el of visible) {
      const cs = getComputedStyle(el);
      const bgImg = cs.backgroundImage || '';
      if (/gradient\(/.test(bgImg) && hasVisibleStop(bgImg)) {
        bgElements++;
        if (/conic-gradient/.test(bgImg)) conic++;
      }
      if ((cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text')
          && /gradient\(/.test(bgImg) && hasVisibleStop(bgImg)) {
        textElements++;
      }
    }

    // Big centered hero with gradient text — strong signal on its own.
    let bigHeroGradientText = false;
    if (h1) {
      const cs = getComputedStyle(h1);
      const fontSize = parseFloat(cs.fontSize);
      const heroBg = cs.backgroundImage || '';
      if (fontSize >= 40 && cs.textAlign === 'center'
          && (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text')
          && /gradient\(/.test(heroBg) && hasVisibleStop(heroBg)) {
        bigHeroGradientText = true;
      }
    }

    return {
      bgElements,
      textElements,
      conic,
      bigHeroGradientText,
      ratio: visible.length ? +(bgElements / visible.length).toFixed(3) : 0
    };
  })({
      ...ctxBase,
      thresholds: {"minBgGradients":4}
    }); } catch (e) { signals["gradients"] = null; }
    try { signals["accent_stripe"] = (function (ctx) {
    const { visible, parseColor, rgbToHsl, thresholds: T } = ctx;
    const skipTags = new Set(T.excludedTags.split(','));
    // Treat near-neutral border colors (grey/black/white tints) as
    // non-accents — Markdown blockquotes, footer rules, and table dividers
    // are usually a desaturated grey.
    function isAccentColor(c) {
      if (!c || c.a < 0.3) return false;
      return rgbToHsl(c).s >= T.minSaturation;
    }
    // Real "accent stripe on a card" has a heading inside (it's a feature
    // card with title+blurb). Markdown callouts, code blocks, stat cells,
    // and quote divs have a colored border but no heading — those are not
    // the slop pattern we want to flag.
    function hasHeadingChild(el) {
      if (el.querySelector('h1, h2, h3, h4, h5, h6')) return true;
      if (el.querySelector('[class*="title" i], [class*="heading" i]')) return true;
      // Prominent text leaf: ≥16px, weight ≥500, short
      const leaves = el.querySelectorAll('div, span, p, strong, b');
      let checked = 0;
      for (const l of leaves) {
        if (++checked > 20) break;
        if (l.children.length > 0) continue;
        const t = (l.textContent || '').trim();
        if (t.length < 2 || t.length > 60) continue;
        const ls = getComputedStyle(l);
        if ((parseFloat(ls.fontSize) || 0) >= 16 && (parseInt(ls.fontWeight) || 400) >= 500) return true;
      }
      return false;
    }
    let count = 0;
    const samples = [];
    for (const el of visible) {
      if (skipTags.has(el.tagName)) continue;
      // Skip accent stripes inside footer/blockquote ancestors too.
      if (el.closest('blockquote, footer, [role=contentinfo]')) continue;
      const cs = getComputedStyle(el);
      const lw = parseFloat(cs.borderLeftWidth) || 0;
      const tw = parseFloat(cs.borderTopWidth) || 0;
      const rw = parseFloat(cs.borderRightWidth) || 0;
      const bw = parseFloat(cs.borderBottomWidth) || 0;
      let matched = false;
      let evidence = null;
      const r = el.getBoundingClientRect();
      const elW = r.width, elH = r.height;
      if (elW < T.minDimW || elH < T.minDimH) {
        // skip tiny elements
      } else if (lw >= T.minBorderPx && lw > tw + 1 && lw > rw + 1 && lw > bw + 1) {
        const bc = parseColor(cs.borderLeftColor);
        if (isAccentColor(bc)) {
          matched = true;
          evidence = { kind: 'border-left', width: lw, color: cs.borderLeftColor };
        }
      } else if (tw >= T.minBorderPx && tw > lw + 1 && tw > rw + 1 && tw > bw + 1) {
        const bc = parseColor(cs.borderTopColor);
        if (isAccentColor(bc)) {
          matched = true;
          evidence = { kind: 'border-top', width: tw, color: cs.borderTopColor };
        }
      } else {
        for (const pseudo of ['::before', '::after']) {
          if (matched) break;
          const ps = getComputedStyle(el, pseudo);
          const content = ps.content;
          if (!content || content === 'none' || content === 'normal') continue;
          const pos = ps.position;
          if (pos !== 'absolute' && pos !== 'fixed') continue;
          const leftVal = parseFloat(ps.left);
          const topVal = parseFloat(ps.top);
          const widthVal = parseFloat(ps.width);
          const heightVal = ps.height;
          const psBg = parseColor(ps.backgroundColor);
          const bgOK = isAccentColor(psBg);
          const widthIsPct = /%/.test(ps.width);
          const heightIsPct = /%/.test(heightVal);

          const leftStripe = bgOK
            && !isNaN(widthVal) && widthVal >= T.stripeMinPx && widthVal <= T.stripeMaxPx
            && Math.abs(leftVal) <= 4
            && (isNaN(topVal) || Math.abs(topVal) <= 4)
            && ((parseFloat(heightVal) >= elH * T.fullEdgeRatio) || (heightIsPct && parseFloat(heightVal) >= 60));

          const hVal = parseFloat(heightVal);
          const topStripe = bgOK
            && !isNaN(hVal) && hVal >= T.stripeMinPx && hVal <= T.stripeMaxPx
            && Math.abs(topVal) <= 4
            && (isNaN(leftVal) || Math.abs(leftVal) <= 4)
            && ((widthVal >= elW * T.fullEdgeRatio) || (widthIsPct && widthVal >= 60));

          if (leftStripe) {
            matched = true;
            evidence = { kind: 'pseudo-left-stripe', pseudo, width: widthVal, height: heightVal, color: ps.backgroundColor };
          } else if (topStripe) {
            matched = true;
            evidence = { kind: 'pseudo-top-stripe', pseudo, width: ps.width, height: hVal, color: ps.backgroundColor };
          }
        }
      }
      // Real accent-stripe cards have a heading inside. This filters out
      // markdown blockquotes/callouts, code blocks, stat dividers, etc.
      if (matched && !hasHeadingChild(el)) matched = false;
      if (matched) {
        count++;
        if (samples.length < 3) {
          samples.push({
            tag: el.tagName.toLowerCase(),
            sample: (el.textContent || '').trim().slice(0, 60),
            ...evidence
          });
        }
      }
    }
    return { count, samples };
  })({
      ...ctxBase,
      thresholds: {"minBorderPx":2,"minDimW":40,"minDimH":20,"stripeMinPx":2,"stripeMaxPx":10,"fullEdgeRatio":0.6,"minSaturation":0.2,"excludedTags":"BLOCKQUOTE,FOOTER,BUTTON,HR,TABLE,TD,TH,TR,THEAD,TBODY"}
    }); } catch (e) { signals["accent_stripe"] = null; }
    try { signals["glassmorphism"] = (function (ctx) {
    const { visible, parseColor, thresholds: T } = ctx;
    const VIEWPORT_W = window.innerWidth || 1440;
    let count = 0;
    const samples = [];
    for (const el of visible) {
      const cs = getComputedStyle(el);
      const bf = cs.backdropFilter || cs.webkitBackdropFilter || '';
      const m = bf.match(/blur\(([\d.]+)px\)/);
      if (!m) continue;
      const blurPx = parseFloat(m[1]);
      if (blurPx < T.minBlurPx) continue;
      const bg = parseColor(cs.backgroundColor);
      if (!bg || bg.a < T.minBgAlpha || bg.a >= T.maxBgAlpha) continue;
      const r = el.getBoundingClientRect();
      const pos = cs.position;
      const isStickyTop = (pos === 'sticky' || pos === 'fixed') && parseFloat(cs.top || '99') <= T.stickyEdgePx;
      const isStickyBottom = (pos === 'sticky' || pos === 'fixed') && parseFloat(cs.bottom || '99') <= T.stickyEdgePx;
      const isFullWidthish = r.width >= VIEWPORT_W * T.fullWidthRatio;
      // Skip frosted nav / footer bars
      if ((isStickyTop || isStickyBottom) && isFullWidthish) continue;
      // Card or panel shape only
      if (r.width < T.cardWidthMin || r.width > T.cardWidthMax) continue;
      if (r.height < T.cardHeightMin || r.height > T.cardHeightMax) continue;
      count++;
      if (samples.length < 3) {
        samples.push({
          blur: blurPx,
          bg: cs.backgroundColor,
          width: Math.round(r.width),
          height: Math.round(r.height)
        });
      }
    }
    return { count, samples };
  })({
      ...ctxBase,
      thresholds: {"minBlurPx":2,"minBgAlpha":0.02,"maxBgAlpha":0.9,"cardWidthMin":150,"cardWidthMax":820,"cardHeightMin":40,"cardHeightMax":900,"fullWidthRatio":0.85,"stickyEdgePx":20}
    }); } catch (e) { signals["glassmorphism"] = null; }
    try { signals["colored_glows"] = (function (ctx) {
    const { visible, parseColor, rgbToHsl, thresholds: T } = ctx;
    let count = 0;
    const samples = [];
    for (const el of visible) {
      const cs = getComputedStyle(el);
      const shadow = cs.boxShadow || '';
      if (shadow === 'none' || !shadow) continue;
      const matches = shadow.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi) || [];
      const blurMatch = shadow.match(/(?:-?\d+px\s+){2}(\d+)px/);
      const blur = blurMatch ? parseInt(blurMatch[1]) : 0;
      if (blur < T.minBlurPx) continue;
      for (const cm of matches) {
        let col = null;
        if (cm.startsWith('#')) {
          const norm = cm.length === 4 ? '#' + cm.slice(1).split('').map(c => c + c).join('') : cm;
          col = {
            r: parseInt(norm.slice(1, 3), 16),
            g: parseInt(norm.slice(3, 5), 16),
            b: parseInt(norm.slice(5, 7), 16),
            a: 1
          };
        } else {
          col = parseColor(cm);
        }
        if (!col || col.a < 0.1) continue;
        const hsl = rgbToHsl(col);
        if (hsl.s > 0.3 && hsl.l > 0.2 && hsl.l < 0.9) {
          count++;
          if (samples.length < 3) samples.push({ shadow: shadow.slice(0, 120) });
          break;
        }
      }
    }
    return { count, samples };
  })({
      ...ctxBase,
      thresholds: {"minBlurPx":15,"minTriggerCount":2}
    }); } catch (e) { signals["colored_glows"] = null; }
    try { signals["sidebar_emoji"] = (function (ctx) {
    const { isVisible, countEmoji, thresholds: T } = ctx;
    // Sidebar pattern: dedicated aside / sidebar with emoji-prefixed links.
    let sidebarPattern = false;
    const aside = document.querySelector('aside, nav[class*="sidebar" i], [class*="sidebar" i], [data-sidebar]');
    if (aside && isVisible(aside)) {
      const links = Array.from(aside.querySelectorAll('a, button')).slice(0, 30);
      let withEmoji = 0;
      for (const l of links) {
        if (countEmoji(l.textContent || '') > 0) withEmoji++;
      }
      if (links.length >= T.sidebarMinLinks && withEmoji / links.length > T.sidebarRatio) {
        sidebarPattern = true;
      }
    }

    // Loose: emoji-prefixed nav / sidebar links. Card titles with cute
    // emojis and standalone <button>s aren't slop on their own — the slop
    // signature is emoji icons used as nav glyphs.
    const uiSel = 'nav a, nav button, aside a, aside button, header a, header button, [role=navigation] a, .sidebar a, .sidebar button';
    let inNavOrButtons = 0;
    for (const el of document.querySelectorAll(uiSel)) {
      if (!isVisible(el)) continue;
      inNavOrButtons += countEmoji((el.textContent || '').slice(0, 100));
    }

    // Total page emoji count for evidence
    const totalInPage = countEmoji((document.body && document.body.innerText) || '');

    return { sidebarPattern, inNavOrButtons, totalInPage };
  })({
      ...ctxBase,
      thresholds: {"sidebarRatio":0.4,"sidebarMinLinks":3,"minNavCount":3}
    }); } catch (e) { signals["sidebar_emoji"] = null; }
    try { signals["center_aligned_hero"] = (function (ctx) {
    const { visible, h1, thresholds: T } = ctx;
    let heroH1Centered = false;
    let heroSample = null;
    if (h1) {
      const cs = getComputedStyle(h1);
      if (cs.textAlign === 'center') {
        heroH1Centered = true;
        heroSample = (h1.textContent || '').trim().slice(0, 80);
      }
    }
    const viewportH = window.innerHeight || 800;
    let aboveFoldCenter = 0, aboveFoldTotal = 0;
    for (const el of visible) {
      const r = el.getBoundingClientRect();
      if (r.top > viewportH) continue;
      if (!/^(P|H1|H2|H3|SPAN|DIV)$/.test(el.tagName)) continue;
      const cs = getComputedStyle(el);
      const fontSize = parseFloat(cs.fontSize);
      if (fontSize < T.minFontSize) continue;
      const hasText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 5);
      if (!hasText) continue;
      aboveFoldTotal++;
      if (cs.textAlign === 'center') aboveFoldCenter++;
    }
    const aboveFoldCenterRatio = aboveFoldTotal > 0
      ? +(aboveFoldCenter / aboveFoldTotal).toFixed(2)
      : 0;
    return {
      heroH1Centered,
      heroSample,
      aboveFoldCenterRatio,
      aboveFoldTextBlocks: aboveFoldTotal
    };
  })({
      ...ctxBase,
      thresholds: {"minAboveFoldRatio":0.6,"withH1Ratio":0.4,"minFontSize":14}
    }); } catch (e) { signals["center_aligned_hero"] = null; }
    try { signals["perma_dark_mode"] = (function (ctx) {
    const { visible, parseColor, effectiveBg, relativeLuminance, contrastRatio, isDarkMode, thresholds: T } = ctx;

    // Walk visible body-text leaves; record contrast ratio + whether the
    // backing surface is dark.
    let bodyTextSamples = 0;
    let lowContrastBody = 0;
    let lowContrastOnDark = 0;
    let bodyTextOnDark = 0;
    const samples = [];

    for (const el of visible) {
      // Skip code blocks — intentionally styled dark with monospace greys
      // and not body text. Counting them inflates the low-contrast ratio on
      // any landing page that shows code samples.
      if (el.closest('pre, code, [class*="codeblock" i], [class*="hljs" i], [class*="prism" i], [class*="shiki" i]')) continue;
      const cs = getComputedStyle(el);
      const fontSize = parseFloat(cs.fontSize) || 0;
      const weight = parseInt(cs.fontWeight) || 400;
      if (fontSize < T.bodyMinFs || fontSize > T.bodyMaxFs) continue;
      if (weight >= T.bodyMaxWeight) continue;
      const hasText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 3);
      if (!hasText) continue;
      const color = parseColor(cs.color);
      if (!color) continue;
      const bg = effectiveBg(el);
      const bgLum = relativeLuminance(bg);
      const cr = contrastRatio(color, bg);
      bodyTextSamples++;
      if (cr < 7) lowContrastBody++;
      if (bgLum < T.darkSurfaceLuminance) {
        bodyTextOnDark++;
        if (cr < 7) lowContrastOnDark++;
      }
      if (samples.length < 3 && cr < 4.5) {
        samples.push({
          ratio: +cr.toFixed(2),
          color: cs.color,
          bg: 'rgb(' + (bg.r | 0) + ',' + (bg.g | 0) + ',' + (bg.b | 0) + ')',
          sample: (el.textContent || '').trim().slice(0, 60)
        });
      }
    }

    const pctBelowAAA = bodyTextSamples ? +(100 * lowContrastBody / bodyTextSamples).toFixed(1) : 0;
    const darkSurfaceTextRatio = bodyTextSamples ? +(bodyTextOnDark / bodyTextSamples).toFixed(2) : 0;
    const pctBelowAAAOnDark = bodyTextOnDark ? +(100 * lowContrastOnDark / bodyTextOnDark).toFixed(1) : 0;

    return {
      isDarkMode,
      bodyTextSamples,
      lowContrastCount: lowContrastBody,
      pctBelowAAA,
      bodyTextOnDark,
      darkSurfaceTextRatio,
      pctBelowAAAOnDark,
      samples
    };
  })({
      ...ctxBase,
      thresholds: {"bodyMinFs":12,"bodyMaxFs":20,"bodyMaxWeight":600,"pctBelowAAATrigger":12,"darkSurfaceLuminance":0.2,"fallbackDarkSurfaceRatio":0.35,"fallbackPctBelowAAATrigger":20,"minBodySamples":5,"darkTemplateMinSamples":20,"darkTemplateSurfaceRatio":0.7}
    }); } catch (e) { signals["perma_dark_mode"] = null; }
    try { signals["numbered_steps"] = (function (ctx) {
    const { visible, thresholds: T } = ctx;
    const stepNumbers = [];
    for (const el of visible) {
      if (el.children.length > 0) continue;
      const txt = (el.textContent || '').trim();
      let num = null;
      // Standalone digit: "1", "01", "1.", "01.", "1)", "1/", "1 —"
      const m1 = txt.match(/^0?([1-9])\s*[.)\/\-—]?$/);
      // "Step 1" / "Step 01"
      const m2 = txt.match(/^Step\s+0?([1-9])$/i);
      // Circled number ①
      const m3 = txt.match(/^([①②③④⑤⑥⑦⑧⑨])$/);
      if (m1) num = parseInt(m1[1], 10);
      else if (m2) num = parseInt(m2[1], 10);
      else if (m3) num = '①②③④⑤⑥⑦⑧⑨'.indexOf(m3[1]) + 1;
      if (!num) continue;
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      const r = el.getBoundingClientRect();
      // Either the digit itself is large, or it sits in a clearly-styled badge:
      //   - parent has a circular/rounded box ≥ 24×24
      //   - parent has a background fill or border
      let qualifies = fs >= T.minFontSize;
      if (!qualifies && el.parentElement) {
        const pr = el.parentElement.getBoundingClientRect();
        const pcs = getComputedStyle(el.parentElement);
        const isBadgeShape = pr.width >= T.minBadgeBoxSize && pr.height >= T.minBadgeBoxSize
          && pr.width <= 80 && pr.height <= 80;
        const hasFill = pcs.backgroundColor && pcs.backgroundColor !== 'rgba(0, 0, 0, 0)' && pcs.backgroundColor !== 'transparent';
        const hasBorder = parseFloat(pcs.borderTopWidth) >= 1;
        const isRounded = parseFloat(pcs.borderTopLeftRadius) >= 6;
        if (isBadgeShape && (hasFill || hasBorder || isRounded)) qualifies = true;
      }
      if (!qualifies) continue;
      stepNumbers.push({ num, top: r.top, left: r.left, fontSize: fs });
      if (stepNumbers.length >= T.maxStepNumbers) break;
    }
    stepNumbers.sort((a, b) => a.top - b.top || a.left - b.left);
    // A real step sequence is spatially grouped — a row (similar top, marching
    // right) or a column (similar left, marching down). Only extend the run when
    // the next number is adjacent to the previous one; this rejects unrelated
    // standalone digits scattered across the page (paginators, spinners, stat
    // values on a component-library demo) that happen to ascend in reading order.
    let runLength = 0;
    let run = [];
    const grouped = (a, b) => {
      const dx = Math.abs(a.left - b.left), dy = Math.abs(a.top - b.top);
      return (dy <= 140 && dx <= 600) || (dx <= 140 && dy <= 600);
    };
    for (const s of stepNumbers) {
      const prev = run[run.length - 1];
      if (prev && s.num === prev.num + 1 && grouped(s, prev)) run.push(s);
      else run = s.num === 1 ? [s] : [];
      if (run.length > runLength) runLength = run.length;
    }
    return {
      runLength,
      samples: stepNumbers.slice(0, 6).map(s => ({ num: s.num, fontSize: Math.round(s.fontSize) }))
    };
  })({
      ...ctxBase,
      thresholds: {"minFontSize":14,"minBadgeBoxSize":24,"minRunLength":3,"maxStepNumbers":50}
    }); } catch (e) { signals["numbered_steps"] = null; }
    try { signals["stat_banner_row"] = (function (ctx) {
    const { visible, isVisible, thresholds: T } = ctx;
    let count = 0;
    const samples = [];
    const numericRegex = /\d[\d,.]*\s*(?:k|m|b|%|x|\+)?/i;
    // Pure ordinals like "01", "02", "03" or "1", "2", "3" are step markers,
    // not stats. We only consider single small integers as ordinals; a stat
    // like "100K+" or "9.9M" easily clears that.
    const pureOrdinalRegex = /^0?[1-9]$|^1[0-2]$/;
    // Currency-prefixed values are pricing tiers, not stats.
    const priceRegex = /^[$€£¥₹]|US\$|EUR|GBP/i;
    for (const el of visible) {
      const kids = Array.from(el.children).filter(isVisible);
      if (kids.length < T.minKids || kids.length > T.maxKids) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < T.minRowWidth) continue;
      const stats = kids.map(k => {
        let maxFs = 0, bigText = '';
        for (const d of k.querySelectorAll('*')) {
          if (d.children.length > 0) continue;
          const t = (d.textContent || '').trim();
          if (!t || t.length > 12) continue;
          const fs = parseFloat(getComputedStyle(d).fontSize) || 0;
          if (fs > maxFs) { maxFs = fs; bigText = t; }
        }
        return { maxFs, bigText };
      });
      // Reject if the "stats" are actually a sequential ordinal run (01,02,03…).
      const allOrdinals = stats.every(s => pureOrdinalRegex.test(s.bigText));
      if (allOrdinals) continue;
      // Reject if the values look like prices ($0, $9, US$29, £49…).
      const anyPrice = stats.some(s => priceRegex.test(s.bigText));
      if (anyPrice) continue;
      const allStats = stats.every(s =>
        s.maxFs >= T.minBigFontSize &&
        s.bigText.length <= T.maxBigTextLen &&
        numericRegex.test(s.bigText) &&
        !pureOrdinalRegex.test(s.bigText)
      );
      if (!allStats) continue;
      count++;
      if (samples.length < 2) {
        samples.push({ cards: kids.length, values: stats.map(s => s.bigText) });
      }
    }
    return { count, samples };
  })({
      ...ctxBase,
      thresholds: {"minKids":3,"maxKids":6,"minRowWidth":300,"minBigFontSize":22,"maxBigTextLen":10}
    }); } catch (e) { signals["stat_banner_row"] = null; }
    try { signals["hero_eyebrow_pill"] = (function (ctx) {
    const { visible, h1, parseColor, thresholds: T } = ctx;
    if (!h1) return { detected: false, samples: [] };
    const h1Rect = h1.getBoundingClientRect();
    const h1CenterX = (h1Rect.left + h1Rect.right) / 2;
    const samples = [];

    for (const el of visible) {
      if (el === h1 || el.contains(h1) || h1.contains(el)) continue;

      // Skip nav / header chrome — eyebrow lives in the hero, not the global nav.
      if (el.closest('nav, [role=navigation]')) continue;
      // Skip clickable nav-style elements that happen to be pill-shaped buttons.
      const tag = el.tagName;
      if (tag === 'A' || tag === 'BUTTON') continue;
      if (el.closest('a, button')) continue;

      const r = el.getBoundingClientRect();
      if (r.bottom > h1Rect.top + 10) continue;       // must sit above H1
      if (r.bottom < h1Rect.top - T.abovePillPx) continue;
      if (r.width < T.pillMinW || r.width > T.pillMaxW) continue;
      if (r.height < T.pillMinH || r.height > T.pillMaxH) continue;

      // Horizontally aligned with the H1. Three accepted cases:
      //   - candidate's center sits within H1's horizontal range (centered hero)
      //   - candidate's left edge aligns with H1's left within 60px (left-aligned hero)
      //   - candidate horizontally overlaps H1 substantially
      const candCenterX = (r.left + r.right) / 2;
      const centerInside = candCenterX >= h1Rect.left && candCenterX <= h1Rect.right;
      const leftAligned = Math.abs(r.left - h1Rect.left) <= 60;
      const overlap = Math.max(0, Math.min(r.right, h1Rect.right) - Math.max(r.left, h1Rect.left));
      const overlapsH1 = overlap >= Math.min(r.width, h1Rect.width) * 0.5;
      if (!centerInside && !leftAligned && !overlapsH1) continue;

      const text = (el.textContent || '').trim();
      if (!text || text.length < T.minTextLen || text.length > T.maxTextLen) continue;
      // Skip if the text content has internal newlines or many words — pills
      // are short single labels.
      if (text.split(/\s+/).length > 6) continue;

      const cs = getComputedStyle(el);
      const br = parseFloat(cs.borderTopLeftRadius) || 0;

      const bg = parseColor(cs.backgroundColor);
      const hasFill = bg && bg.a >= T.minBgAlpha;
      const borderW = parseFloat(cs.borderTopWidth) || 0;
      const borderColor = parseColor(cs.borderTopColor);
      const hasBorder = borderW >= T.minBorderW && borderColor && borderColor.a > T.minBorderAlpha;

      // Three eyebrow shapes — any one qualifies:
      //  a) Pill-shaped (round radius) with bg or border
      //  b) Boxed badge: any radius, has bg-fill or border
      //  c) Small-caps eyebrow text: uppercase + letter-spacing > 0, no bg
      //     required (this is the "AGENTS · LIVE NOW" style)
      const isPillShape = br >= 999 || br >= r.height / 2 - 1;
      const isPill = isPillShape && (hasFill || hasBorder);
      const isBoxed = !isPillShape && br >= 4 && (hasFill || hasBorder);
      const letterSpacing = parseFloat(cs.letterSpacing) || 0;
      const isUppercase = cs.textTransform === 'uppercase' ||
        (text.replace(/[^A-Za-z]/g, '').length >= 3 &&
         text.replace(/[^A-Za-z]/g, '').replace(/[^A-Z]/g, '').length / text.replace(/[^A-Za-z]/g, '').length > 0.85);
      const isSmallCapsEyebrow = isUppercase && letterSpacing >= 0.5 && r.width <= T.smallcapsMaxW;
      if (!isPill && !isBoxed && !isSmallCapsEyebrow) continue;

      samples.push({
        text: text.slice(0, 60),
        kind: isPill ? 'pill' : isBoxed ? 'boxed' : 'smallcaps',
        bg: cs.backgroundColor,
        radius: br,
        width: Math.round(r.width),
        height: Math.round(r.height),
        textTransform: cs.textTransform,
        letterSpacing
      });
      if (samples.length >= 2) break;
    }
    return { detected: samples.length > 0, samples };
  })({
      ...ctxBase,
      thresholds: {"abovePillPx":220,"pillMinW":40,"pillMaxW":600,"pillMinH":16,"pillMaxH":56,"minTextLen":3,"maxTextLen":80,"smallcapsMaxW":320,"minBgAlpha":0.05,"minBorderW":1,"minBorderAlpha":0.15}
    }); } catch (e) { signals["hero_eyebrow_pill"] = null; }
    try { signals["faq_accordion"] = (function (ctx) {
    const { visible, isVisible, thresholds: T } = ctx;
    const docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, 1);
    const bottomCutoff = docH * T.bottomHalfFraction;
    const headingRe = new RegExp(T.headingRegex, 'i');
    const questionRe = new RegExp(T.questionStart, 'i');

    function looksLikeQuestion(text) {
      const t = text.trim();
      if (!t) return false;
      if (t.endsWith('?')) return true;
      if (questionRe.test(t)) return true;
      return false;
    }

    // Path A: native <details> cluster in the bottom half.
    const detailsList = Array.from(document.querySelectorAll('details')).filter(d => {
      if (!isVisible(d)) return false;
      const r = d.getBoundingClientRect();
      const top = r.top + window.scrollY;
      return top >= bottomCutoff;
    });
    let detailsCount = detailsList.length;
    let detailsSamples = [];
    if (detailsCount >= T.minItems) {
      detailsSamples = detailsList.slice(0, 3).map(d => {
        const sum = d.querySelector('summary');
        return { kind: 'details', text: ((sum || d).textContent || '').trim().slice(0, 80) };
      });
    }

    // Path B: heading match → uniform repeating children below.
    let accordionCount = 0;
    let accordionSamples = [];
    let foundHeading = null;
    const headings = visible.filter(el => /^H[1-4]$/.test(el.tagName) || /heading|title/i.test(el.className || ''));
    for (const h of headings) {
      const text = (h.textContent || '').trim();
      if (text.length > 60) continue;
      if (!headingRe.test(text)) continue;
      const r = h.getBoundingClientRect();
      const top = r.top + window.scrollY;
      if (top < bottomCutoff) continue;
      // Walk forward in DOM, looking for a parent / sibling that contains
      // ≥3 children whose text starts with a question word.
      let scope = h.parentElement;
      let bestCount = 0;
      let bestSamples = [];
      for (let depth = 0; depth < 4 && scope; depth++) {
        const candidates = Array.from(scope.querySelectorAll('*'));
        for (const c of candidates) {
          const kids = Array.from(c.children).filter(isVisible);
          if (kids.length < T.minItems) continue;
          // Each kid must look like a question entry: short leading text that
          // starts with a question word OR ends in "?".
          const qKids = kids.filter(k => {
            const t = (k.textContent || '').trim();
            if (t.length < 3 || t.length > 800) return false;
            // Take the first 120 chars (likely the question line)
            const lead = t.slice(0, 120);
            return looksLikeQuestion(lead);
          });
          if (qKids.length >= T.minItems && qKids.length > bestCount) {
            bestCount = qKids.length;
            bestSamples = qKids.slice(0, 3).map(k => ({
              kind: 'accordion',
              text: (k.textContent || '').trim().slice(0, 80)
            }));
          }
        }
        if (bestCount >= T.minItems) break;
        scope = scope.parentElement;
      }
      if (bestCount > accordionCount) {
        accordionCount = bestCount;
        accordionSamples = bestSamples;
        foundHeading = text;
      }
    }

    return {
      detailsCount,
      detailsSamples,
      accordionCount,
      accordionSamples,
      faqHeading: foundHeading
    };
  })({
      ...ctxBase,
      thresholds: {"minItems":3,"headingRegex":"^(faq|faqs?|frequently asked questions?|common questions?|questions?|q\\s*&\\s*a)\\b","questionStart":"^(how|what|when|where|why|who|which|can|could|do(es)?|is|are|will|should|may|might|am|have|has)\\b","bottomHalfFraction":0.5}
    }); } catch (e) { signals["faq_accordion"] = null; }

    return {
      helpers: { parseColor: colors.parseColor, rgbToHsl: colors.rgbToHsl },
      meta: {
        url: location.href,
        title: document.title,
        bodyBg: 'rgb(' + (bodyBg.r|0) + ',' + (bodyBg.g|0) + ',' + (bodyBg.b|0) + ')',
        bodyLuminance: +bodyLuminance.toFixed(3),
        isDarkMode,
        visibleElements: visible.length,
        textChars: totalTextChars
      },
      fonts: {
        topFonts,
        slopFontsDetected,
        headingFont,
        hasSlopFonts: slopFontsDetected.length > 0
      },
      signals
    };
  })();
  // Module-level helpers from slop-fonts.js and centered-hero.js (also Krebs, MIT).
  const TEMPLATED_HEADING_FONTS = [
    'Space Grotesk', 'Instrument Serif', 'Fraunces',
    'Bricolage Grotesque', 'Sora', 'Young Serif',
    'Bodoni', 'Syne'
  ];
  
  function isTemplatedFont(name) {
    if (!name) return false;
    return TEMPLATED_HEADING_FONTS.some(f => name === f || name.startsWith(f + ' '));
  }
  const GENERIC_FONTS = [
    'Inter', 'Inter Variable', '-apple-system', 'system-ui', 'ui-sans-serif',
    'Helvetica', 'Helvetica Neue', 'Arial', 'DM Sans', 'Plus Jakarta Sans',
    'Manrope', 'SF Pro Display'
  ];
  const PATTERNS = [{id:"slop_fonts",label:"Templated display fonts",description:"Trendy display fonts like Space Grotesk used as the page default.",category:"fonts",thresholds:{"minTotalPct":25},score:(function (signal, T) {
    if (!signal || !signal.detected || !signal.detected.length) return { triggered: false };
    // Filter cached detections through the current list so removing a font
    // (e.g. Geist) takes effect on rescore without re-extracting every URL.
    const detected = signal.detected.filter(x => isTemplatedFont(x.name));
    const totalPct = detected.reduce((a, b) => a + b.pct, 0);
    const heading = signal.headingFont;
    const headingSlop = isTemplatedFont(heading);
    if (totalPct < T.minTotalPct && !headingSlop) return { triggered: false };
    if (!detected.length && !headingSlop) return { triggered: false };
    return {
      triggered: true,
      evidence: {
        fonts: detected.map(x => `${x.name} (${x.pct}%)`),
        heading
      }
    };
  })},
{id:"hero_font_mix",label:"Two fonts/colors mixed in the hero",description:"One headline word set apart with a different font, italic, or color.",category:"fonts",thresholds:{"minFontSize":32,"maxTextLen":140},score:(function (signal, T) {
    if (!signal || !signal.hero) return { triggered: false };
    if (signal.runCount < 2) return { triggered: false };
    var twoFamilies = signal.families.length >= 2;
    var styleMix = signal.styles.indexOf('italic') >= 0 && signal.styles.indexOf('normal') >= 0;
    var colorMix = (signal.colorCount || 0) >= 2;
    if (!twoFamilies && !styleMix && !colorMix) return { triggered: false };
    var kinds = [];
    if (twoFamilies) kinds.push('two typefaces');
    if (styleMix) kinds.push('roman + italic');
    if (colorMix) kinds.push('two colours');
    return {
      triggered: true,
      evidence: {
        hero: signal.heroText,
        fontSize: signal.fontSize,
        families: signal.families,
        colors: signal.colors,
        kind: kinds.join(' + ')
      }
    };
  })},
{id:"purple_accent",label:"VibeCode Purple accent",description:"Indigo or violet accent on buttons and links.",category:"colors",thresholds:{"minFilledAccent":1},score:(function (signal, T) {
    if (!signal) return { triggered: false };
    // Only fire when purple shows up as a real filled accent on a CTA. Pure
    // decorative purple (illustrations, stamps, hand-drawn art) and
    // outline-only purple buttons don't qualify.
    if (signal.filledAccentCount < T.minFilledAccent) return { triggered: false };
    return {
      triggered: true,
      evidence: {
        elementsWithPurple: signal.elementCount,
        purpleOnButtonsOrLinks: signal.filledAccentCount,
        samples: signal.samples.slice(0, 2)
      }
    };
  })},
{id:"gradients",label:"Gradient-heavy backgrounds / gradient text on hero",description:"Gradient backgrounds, or gradient-filled headline text.",category:"colors",thresholds:{"minBgGradients":4},score:(function (signal, T) {
    if (!signal) return { triggered: false };
    // Trigger if hero has gradient text OR there are 5+ gradient backgrounds.
    const triggered = signal.bigHeroGradientText
      || signal.textElements > 0
      || signal.bgElements >= T.minBgGradients;
    if (!triggered) return { triggered: false };
    return {
      triggered: true,
      evidence: {
        gradientBackgrounds: signal.bgElements,
        gradientText: signal.textElements,
        conicGradients: signal.conic,
        heroHasGradientText: signal.bigHeroGradientText
      }
    };
  })},
{id:"accent_stripe",label:"Accent stripe on cards (top or left edge)",description:"A colored stripe along the top or left edge of cards.",category:"layout",thresholds:{"minBorderPx":2,"minDimW":40,"minDimH":20,"stripeMinPx":2,"stripeMaxPx":10,"fullEdgeRatio":0.6,"minSaturation":0.2,"excludedTags":"BLOCKQUOTE,FOOTER,BUTTON,HR,TABLE,TD,TH,TR,THEAD,TBODY"},score:(function (signal) {
    if (!signal || signal.count < 1) return { triggered: false };
    return {
      triggered: true,
      evidence: { count: signal.count, samples: signal.samples }
    };
  })},
{id:"glassmorphism",label:"Glassmorphism",description:"Frosted, blurred translucent panels.",category:"css",thresholds:{"minBlurPx":2,"minBgAlpha":0.02,"maxBgAlpha":0.9,"cardWidthMin":150,"cardWidthMax":820,"cardHeightMin":40,"cardHeightMax":900,"fullWidthRatio":0.85,"stickyEdgePx":20},score:(function (signal) {
    if (!signal || signal.count < 1) return { triggered: false };
    return {
      triggered: true,
      evidence: { count: signal.count, samples: signal.samples }
    };
  })},
{id:"colored_glows",label:"Large colored glows / colored box-shadows",description:"A colored glow behind buttons or cards.",category:"colors",thresholds:{"minBlurPx":15,"minTriggerCount":2},score:(function (signal, T) {
    if (!signal || signal.count < T.minTriggerCount) return { triggered: false };
    return {
      triggered: true,
      evidence: { count: signal.count, samples: signal.samples }
    };
  })},
{id:"sidebar_emoji",label:"Sidebar/nav with emoji icons",description:"Navigation links prefixed with emoji.",category:"layout",thresholds:{"sidebarRatio":0.4,"sidebarMinLinks":3,"minNavCount":3},score:(function (signal, T) {
    if (!signal) return { triggered: false };
    if (!signal.sidebarPattern && signal.inNavOrButtons < T.minNavCount) return { triggered: false };
    return {
      triggered: true,
      evidence: {
        sidebarPattern: signal.sidebarPattern,
        emojiInNavOrButtons: signal.inNavOrButtons,
        totalPageEmoji: signal.totalInPage
      }
    };
  })},
{id:"center_aligned_hero",label:"Centered hero set in Inter / generic sans",description:"A centered hero set in Inter or a default sans-serif.",category:"layout",thresholds:{"minAboveFoldRatio":0.6,"withH1Ratio":0.4,"minFontSize":14},score:(function (signal, T, ctxFonts) {
    // ctxFonts is passed so we can check the heading font at score time.
    const heading = ctxFonts?.headingFont || '';
    const isGeneric = GENERIC_FONTS.some(f => heading === f || heading.startsWith(f + ' '));
    if (!isGeneric) return { triggered: false };
    // A genuinely centered hero, not just a lone centered <h1> on an otherwise
    // left-aligned page: need broad centering, more of it required when the only
    // other signal is the centered H1.
    const centeredEnough = signal.aboveFoldCenterRatio >= T.minAboveFoldRatio ||
      (signal.heroH1Centered && signal.aboveFoldCenterRatio >= T.withH1Ratio);
    if (!centeredEnough) return { triggered: false };
    return {
      triggered: true,
      evidence: {
        headingFont: heading,
        heroH1Centered: signal.heroH1Centered,
        aboveFoldCenterRatio: signal.aboveFoldCenterRatio,
        sample: signal.heroSample
      }
    };
  })},
{id:"perma_dark_mode",label:"Perma dark mode look (dark bg + muted grey text)",description:"Dark background with muted grey body text.",category:"colors",thresholds:{"bodyMinFs":12,"bodyMaxFs":20,"bodyMaxWeight":600,"pctBelowAAATrigger":12,"darkSurfaceLuminance":0.2,"fallbackDarkSurfaceRatio":0.35,"fallbackPctBelowAAATrigger":20,"minBodySamples":5,"darkTemplateMinSamples":20,"darkTemplateSurfaceRatio":0.7},score:(function (signal, T) {
    if (!signal) return { triggered: false };
    if (signal.bodyTextSamples < T.minBodySamples) return { triggered: false };
    // Path A: body bg is dark + enough low-contrast (muted-grey) text on it
    if (signal.isDarkMode && signal.pctBelowAAA >= T.pctBelowAAATrigger) {
      return {
        triggered: true,
        evidence: { mode: 'dark-body-muted', pctBelowAAA: signal.pctBelowAAA, sampleCount: signal.bodyTextSamples, examples: signal.samples }
      };
    }
    // Path B: body bg is light but a meaningful chunk of text sits on dark
    //         surfaces with low contrast (dark hero / dark sections aesthetic)
    if (!signal.isDarkMode
        && signal.darkSurfaceTextRatio >= T.fallbackDarkSurfaceRatio
        && signal.pctBelowAAAOnDark >= T.fallbackPctBelowAAATrigger) {
      return {
        triggered: true,
        evidence: { mode: 'dark-section', darkSurfaceTextRatio: signal.darkSurfaceTextRatio, pctBelowAAAOnDark: signal.pctBelowAAAOnDark, sampleCount: signal.bodyTextSamples, examples: signal.samples }
      };
    }
    // Path C: dark-template look. Body bg is dark and most text sits on dark
    //         surfaces — even if contrast is high (white-on-black). Many AI
    //         starter sites have this aesthetic without the muted-grey text.
    if (signal.isDarkMode
        && signal.bodyTextSamples >= T.darkTemplateMinSamples
        && signal.darkSurfaceTextRatio >= T.darkTemplateSurfaceRatio) {
      return {
        triggered: true,
        evidence: { mode: 'dark-template', darkSurfaceTextRatio: signal.darkSurfaceTextRatio, sampleCount: signal.bodyTextSamples }
      };
    }
    return { triggered: false };
  })},
{id:"numbered_steps",label:"Numbered step sequence (1, 2, 3 …)",description:"The numbered how-it-works step row.",category:"layout",thresholds:{"minFontSize":14,"minBadgeBoxSize":24,"minRunLength":3,"maxStepNumbers":50},score:(function (signal, T) {
    if (!signal || signal.runLength < T.minRunLength) return { triggered: false };
    return {
      triggered: true,
      evidence: { runLength: signal.runLength, samples: signal.samples }
    };
  })},
{id:"stat_banner_row",label:"Stat banner row (10K+ users · 99.9% uptime …)",description:"A row of big stats like 10K+ users or 99.9% uptime.",category:"layout",thresholds:{"minKids":3,"maxKids":6,"minRowWidth":300,"minBigFontSize":22,"maxBigTextLen":10},score:(function (signal) {
    if (!signal || signal.count < 1) return { triggered: false };
    return {
      triggered: true,
      evidence: { count: signal.count, samples: signal.samples }
    };
  })},
{id:"hero_eyebrow_pill",label:"Headline badge (pill above the H1)",description:"A small pill label above the headline.",category:"layout",thresholds:{"abovePillPx":220,"pillMinW":40,"pillMaxW":600,"pillMinH":16,"pillMaxH":56,"minTextLen":3,"maxTextLen":80,"smallcapsMaxW":320,"minBgAlpha":0.05,"minBorderW":1,"minBorderAlpha":0.15},score:(function (signal) {
    if (!signal || !signal.detected) return { triggered: false };
    return {
      triggered: true,
      evidence: { samples: signal.samples }
    };
  })},
{id:"faq_accordion",label:"Generic FAQ accordion at the bottom of the page",description:"A collapsible FAQ section near the bottom.",category:"layout",thresholds:{"minItems":3,"headingRegex":"^(faq|faqs?|frequently asked questions?|common questions?|questions?|q\\s*&\\s*a)\\b","questionStart":"^(how|what|when|where|why|who|which|can|could|do(es)?|is|are|will|should|may|might|am|have|has)\\b","bottomHalfFraction":0.5},score:(function (signal, T) {
    if (!signal) return { triggered: false };
    if (signal.detailsCount >= T.minItems) {
      return {
        triggered: true,
        evidence: {
          mode: 'details',
          count: signal.detailsCount,
          samples: signal.detailsSamples
        }
      };
    }
    if (signal.accordionCount >= T.minItems) {
      return {
        triggered: true,
        evidence: {
          mode: 'accordion',
          heading: signal.faqHeading,
          count: signal.accordionCount,
          samples: signal.accordionSamples
        }
      };
    }
    return { triggered: false };
  })}];
  const patterns = PATTERNS.map(p => {
    let res; try { res = p.score(report.signals[p.id], p.thresholds, report.fonts) || {}; } catch (e) { res = { triggered: false, error: String(e) }; }
    return { id: p.id, label: p.label, category: p.category, triggered: !!res.triggered, evidence: res.evidence || null };
  });
  const flagged = patterns.filter(p => p.triggered).length;
  const tier = flagged >= 5 ? 'Heavy' : flagged >= 3 ? 'Mild' : 'Clean';

  // EXTRA (not in Krebs): measurements used by the skill's report, all from computed styles.
  const vis = Array.from(document.querySelectorAll('body *')).filter(e => e.offsetParent || getComputedStyle(e).position === 'fixed');
  const radii = {}; let blur = 0;
  for (const e of vis) {
    const cs = getComputedStyle(e);
    if (cs.borderRadius && cs.borderRadius !== '0px') radii[cs.borderRadius] = (radii[cs.borderRadius] || 0) + 1;
    if (cs.backdropFilter && cs.backdropFilter !== 'none') blur++;
  }
  const textEls = vis.filter(e => Array.from(e.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 2));
  const capsLabels = textEls.filter(e => { const cs = getComputedStyle(e); return cs.textTransform === 'uppercase' && parseFloat(cs.fontSize) <= 16; })
    .map(e => e.textContent.trim().slice(0, 40));
  const headingAccents = Array.from(document.querySelectorAll('h1,h2,h3')).filter(h => {
    const fams = new Set(), styles = new Set();
    h.querySelectorAll('*').forEach(c => { const cs = getComputedStyle(c); if (c.textContent.trim().length > 1) { fams.add(cs.fontFamily.split(',')[0]); styles.add(cs.fontStyle); } });
    const hc = getComputedStyle(h); fams.add(hc.fontFamily.split(',')[0]); styles.add(hc.fontStyle);
    return fams.size > 1 || (styles.has('italic') && styles.has('normal'));
  }).map(h => h.innerText.replace(/\s+/g, ' ').slice(0, 60));
  const sections = Array.from(document.querySelectorAll('main > *, body > section, main section')).length;

  // Gradients in any color syntax (Krebs's check only parses rgb()/hex, so it misses
  // oklab()/oklch() gradients; his result is kept unchanged for comparability).
  let gradAny = 0, gradText = 0;
  for (const e of vis) {
    const cs = getComputedStyle(e), bi = cs.backgroundImage || '';
    if (/gradient\(/.test(bi)) {
      gradAny++;
      if (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') gradText++;
    }
  }

  // System readout: how many distinct values the page uses. Plain counts, no verdict.
  const tally = () => new Map();
  const add = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, c]) => k + ' x' + c);
  const fs = tally(), tc = tally(), bg = tally(), sp = tally();
  for (const e of textEls) { const cs = getComputedStyle(e); add(fs, Math.round(parseFloat(cs.fontSize)) + 'px'); add(tc, cs.color); }
  for (const e of vis) {
    const cs = getComputedStyle(e);
    if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') add(bg, cs.backgroundColor);
    for (const prop of ['paddingTop', 'paddingLeft', 'marginTop', 'marginBottom', 'rowGap', 'columnGap']) {
      const v = Math.round(parseFloat(cs[prop]));
      if (v > 0) add(sp, v + 'px');
    }
  }

  // Page type: landing page vs app/dashboard. Krebs's checks target landing pages.
  const hasSidebar = !!document.querySelector('aside, nav[class*="sidebar" i], [class*="sidebar" i], [data-sidebar]');
  const tableish = document.querySelectorAll('table, [role=table], [role=grid]').length;
  const appWords = /dashboard|leaderboard|settings|log ?out|sign ?out|my account|welcome back/i.test(document.body.innerText.slice(0, 4000));
  const pageType = (hasSidebar && (tableish || appWords)) || (appWords && tableish) ? 'app' : 'landing';

  // Box density ("all boxes"): card-like containers and how much text sits inside them.
  const parseC = report.helpers.parseColor, sat = report.helpers.rgbToHsl;
  const isCard = e => {
    if (!/^(DIV|SECTION|ARTICLE|LI|A|ASIDE)$/.test(e.tagName)) return false;
    const r = e.getBoundingClientRect(); if (r.width < 80 || r.height < 40) return false;
    if (r.width > window.innerWidth * 0.95) return false;
    const cs = getComputedStyle(e);
    const bw = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth);
    const bg = parseC(cs.backgroundColor); const shadow = cs.boxShadow && cs.boxShadow !== 'none';
    const rad = parseFloat(cs.borderTopLeftRadius) || 0;
    return (bw > 0 || (bg && bg.a > 0.3) || shadow) && (rad > 0 || bw > 0 || shadow);
  };
  const cards = vis.filter(isCard);
  const cardSet = new Set(cards);
  const inCard = el => { for (let p = el.parentElement; p; p = p.parentElement) if (cardSet.has(p)) return true; return false; };
  const textInCards = textEls.filter(inCard).length;
  let maxNest = 0;
  for (const c of cards) { let d = 1; for (let p = c.parentElement; p; p = p.parentElement) if (cardSet.has(p)) d++; if (d > maxNest) maxNest = d; }

  // Color richness ("no color"): how much of the page surface is colored, and how much text.
  const pageArea = Math.max(1, document.documentElement.scrollWidth * document.documentElement.scrollHeight);
  const isSat = c => { if (!c || c.a < 0.3) return false; const h = sat(c); return h.s > 0.25 && h.l > 0.15 && h.l < 0.85; };
  const hueArea = {}; let satBgArea = 0, satTextChars = 0, allTextChars = 0;
  for (const e of vis) {
    const cs = getComputedStyle(e), c = parseC(cs.backgroundColor), r = e.getBoundingClientRect(), a = r.width * r.height;
    if (a > 400 && isSat(c)) { satBgArea += a; const k = Math.round(sat(c).h / 30) % 12; hueArea[k] = (hueArea[k] || 0) + a; }
  }
  for (const e of textEls) {
    const n = e.textContent.trim().length; allTextChars += n;
    if (isSat(parseC(getComputedStyle(e).color))) satTextChars += n;
  }
  const surfaceHues = Object.values(hueArea).filter(v => v >= satBgArea * 0.05).length;

  // Imagery ("no personality" proxy): large photos/illustrations/video vs none.
  let imgCount = 0, imgArea = 0;
  for (const e of vis) {
    const isMedia = /^(IMG|PICTURE|VIDEO|CANVAS)$/.test(e.tagName) || (e.tagName === 'svg' && e.getBoundingClientRect().width > 120) || /url\(/.test(getComputedStyle(e).backgroundImage || '');
    if (!isMedia) continue; const r = e.getBoundingClientRect(); const a = r.width * r.height;
    if (a >= 15000) { imgCount++; imgArea += a; }
  }

  // Copy sample for the copy pass: headings and short button/link labels.
  const clean = s => (s || '').replace(/\s+/g, ' ').trim();
  const headingsText = Array.from(document.querySelectorAll('h1,h2,h3')).filter(e => e.offsetParent).map(e => clean(e.innerText).slice(0, 90)).filter(Boolean).slice(0, 12);
  const ctas = [...new Set(Array.from(document.querySelectorAll('a,button')).filter(e => e.offsetParent).map(e => clean(e.innerText)).filter(s => s.length > 1 && s.length <= 40))].slice(0, 10);

  return JSON.stringify({
    meta: report.meta,
    fonts: report.fonts,
    krebs: { flagged, of: PATTERNS.length, tier, triggered: patterns.filter(p => p.triggered).map(p => ({ id: p.id, label: p.label, evidence: p.evidence })) },
    extra: {
      distinctRadii: Object.keys(radii).length,
      backdropBlurElements: blur,
      gradientsAnySyntax: { backgrounds: gradAny, text: gradText },
      system: {
        fontSizes: { distinct: fs.size, top: top(fs, 5) },
        textColors: { distinct: tc.size, top: top(tc, 3) },
        backgroundColors: { distinct: bg.size, top: top(bg, 3) },
        radii: { distinct: Object.keys(radii).length, top: top(new Map(Object.entries(radii)), 4) },
        spacingValues: { distinct: sp.size, top: top(sp, 5) }
      },
      pageType,
      boxes: { cards: cards.length, textInsideCardsPct: textEls.length ? Math.round(100 * textInCards / textEls.length) : 0, maxCardNesting: maxNest },
      color: { coloredSurfacePctOfPage: Math.round(100 * satBgArea / pageArea), surfaceHues, coloredTextPct: allTextChars ? Math.round(100 * satTextChars / allTextChars) : 0 },
      imagery: { largeImages: imgCount, imageAreaPct: Math.round(100 * imgArea / pageArea) },
      copy: { headings: headingsText, buttonsAndLinks: ctas },
      smallCapsLabels: { count: capsLabels.length, examples: capsLabels.slice(0, 5) },
      headingsWithAccentSwitch: { count: headingAccents.length, examples: headingAccents.slice(0, 5) },
      sectionCount: sections
    }
  });
})();
