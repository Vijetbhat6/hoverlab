// scripts/generate-effects-v7.mjs
//
// Seventh wave: a second pair of template families in every category —
// twenty more each, 640 in total, on top of the 640 that v6 added.
//
// The constraint that shaped this file:
//
//   v6 took the obvious missing shapes. What is left in each category is
//   narrower and more specific, so every family here was checked against
//   the full set of names already in the catalog before it was written.
//   Buttons is the clearest case: after six waves it holds a solid-fill
//   colorway grid plus eight distinct shapes, so the two here had to be
//   things none of those cover — an OAuth row with a mark slot, and a
//   hold-to-confirm destructive control.
//
//   Where a category is genuinely near its useful depth (Dividers,
//   Skeletons), the families lean on structure rather than novelty: a
//   torn edge and a vertical rule are still shapes the catalog cannot
//   currently make, even if they are quieter than a coverflow.
//
// Same arithmetic as v6 — `GRADPAIRS` (12) + `TRIOS` (8) = 20 per
// category, tokens and helpers from generate-effects.mjs, dark preview
// surface, and `withMotionGuard` applied at assembly rather than here.

import { rgbOf } from './generate-effects-modern.mjs'

export function generateV7(ctx) {
  const { GRADPAIRS, TRIOS, cls, mk, add } = ctx

  /* ============================================================
   *  BUTTONS — OAuth / provider sign-in row  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-btn-oauth-${g.name}`)
    const html = `<button class="${c}"><i></i><span>Continue with SSO</span><em></em></button>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  width: 260px;
  padding: 0.65rem 0.9rem;
  border: 1px solid #334155;
  border-radius: 0.55rem;
  background: #111827;
  color: #e2e8f0;
  font-size: 0.86rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.${c} i {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 0.3rem;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c} span {
  flex: 1;
  text-align: left;
}
.${c} em {
  flex: none;
  width: 7px;
  height: 7px;
  border-top: 2px solid #475569;
  border-right: 2px solid #475569;
  transform: rotate(45deg);
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.${c}:hover {
  border-color: ${g.a};
  background: #1a2234;
}
.${c}:hover em {
  transform: rotate(45deg) translate(2px, -2px);
  border-color: ${g.b};
}
.${c}:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.a)}, 0.3);
}`
    add(mk({
      name: `${g.name} Provider Button`,
      category: 'Buttons',
      description: `Full-width sign-in row with a square slot for the provider mark and a chevron that nudges on hover, sized so several stack without ragged edges.`,
      html, css,
      tags: ['button', 'oauth', 'sso', 'sign in', 'provider', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BUTTONS — hold-to-confirm destructive control  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-btn-hold-${t.name}`)
    const html = `<button class="${c}"><span>Hold to delete</span><i></i></button>`
    const css = `.${c} {
  position: relative;
  padding: 0.65rem 1.5rem;
  overflow: hidden;
  border: 1px solid rgba(${rgbOf(t.a)}, 0.5);
  border-radius: 0.5rem;
  background: rgba(${rgbOf(t.a)}, 0.1);
  color: ${t.a};
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}
.${c} span {
  position: relative;
  z-index: 1;
}
.${c} i {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  transform-origin: left;
  transform: scaleX(0);
  background: linear-gradient(90deg, ${t.a}, ${t.b}, ${t.c});
  transition: transform 1.6s linear;
}
.${c}:active i {
  transform: scaleX(1);
}
.${c}:active {
  color: #0b1120;
  border-color: ${t.c};
}
.${c}:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(${rgbOf(t.b)}, 0.3);
}`
    add(mk({
      name: `${t.name} Hold to Confirm`,
      category: 'Buttons',
      description: `Destructive action gated behind a press-and-hold fill driven by \`:active\`, so letting go before the sweep completes cancels it.`,
      html, css,
      tags: ['button', 'destructive', 'hold', 'confirm', 'delete', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  LOADERS — upload card with a determinate bar  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-load-upload-${g.name}`)
    const html = `<div class="${c}"><i class="doc"></i><div class="meta"><b>quarterly-report.pdf</b><span>4.2 MB of 6.1 MB</span><div class="bar"><em></em></div></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 280px;
  padding: 0.8rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} .doc {
  flex: none;
  position: relative;
  width: 30px;
  height: 38px;
  border-radius: 0.2rem 0.45rem 0.25rem 0.25rem;
  background: linear-gradient(150deg, ${g.a}, ${g.b});
}
.${c} .doc::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 11px;
  height: 11px;
  background: #111827;
  clip-path: polygon(0 0, 100% 100%, 100% 0);
}
.${c} .meta { flex: 1; min-width: 0; }
.${c} b {
  display: block;
  font-size: 0.78rem;
  color: #e2e8f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${c} span {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.68rem;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
.${c} .bar {
  height: 4px;
  margin-top: 0.5rem;
  border-radius: 2px;
  overflow: hidden;
  background: #1e293b;
}
.${c} .bar em {
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: left;
  border-radius: 2px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  animation: ${c}-fill 3s cubic-bezier(0.3, 0.8, 0.4, 1) infinite;
}
@keyframes ${c}-fill {
  0%   { transform: scaleX(0.04); }
  70%  { transform: scaleX(0.69); }
  100% { transform: scaleX(1); }
}`
    add(mk({
      name: `${g.name} Upload Loader`,
      category: 'Loaders',
      description: `File row with a CSS-drawn dog-eared document and a bar that eases as it fills, so the last stretch reads slower the way a real transfer does.`,
      html, css,
      tags: ['loader', 'upload', 'file', 'progress', 'transfer', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  LOADERS — liquid fill sphere  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-load-liquid-${t.name}`)
    const html = `<div class="${c}"><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 62px;
  height: 62px;
  overflow: hidden;
  border-radius: 50%;
  background: #0f172a;
  box-shadow: inset 0 0 0 2px ${t.a};
}
.${c} i {
  position: absolute;
  left: -50%;
  width: 200%;
  height: 200%;
  top: 42%;
  border-radius: 42%;
  background: linear-gradient(180deg, ${t.b}, ${t.c});
  animation: ${c}-churn 5s linear infinite, ${c}-rise 4s ease-in-out infinite alternate;
}
@keyframes ${c}-churn {
  to { transform: rotate(360deg); }
}
@keyframes ${c}-rise {
  from { top: 62%; }
  to   { top: 22%; }
}`
    add(mk({
      name: `${t.name} Liquid Loader`,
      category: 'Loaders',
      description: `An oversized blob with a 42% radius spinning inside a circular clip, which turns a plain rotation into a rolling waterline.`,
      html, css,
      tags: ['loader', 'liquid', 'wave', 'fill', 'water', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CARDS — product card with rating and action  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-card-product-${g.name}`)
    const html = `<article class="${c}"><div class="shot"><span>New</span></div><div class="body"><b>Nimbus Desk Lamp</b><div class="row"><em>$128</em><i>4.8 ★</i></div><button>Add to cart</button></div></article>`
    const css = `.${c} {
  width: 210px;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #111827;
  border: 1px solid #1f2937;
  transition: transform 0.25s ease, border-color 0.25s ease;
}
.${c}:hover {
  transform: translateY(-4px);
  border-color: rgba(${rgbOf(g.a)}, 0.5);
}
.${c} .shot {
  position: relative;
  height: 122px;
  background: linear-gradient(150deg, ${g.a}, ${g.b});
}
.${c} .shot span {
  position: absolute;
  top: 0.55rem;
  left: 0.55rem;
  padding: 0.12rem 0.45rem;
  border-radius: 0.25rem;
  font-size: 0.64rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${g.a};
  background: #0b1120;
}
.${c} .body { padding: 0.75rem 0.8rem 0.85rem; }
.${c} b {
  display: block;
  font-size: 0.83rem;
  color: #f1f5f9;
}
.${c} .row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 0.4rem;
}
.${c} em {
  font-style: normal;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${g.b};
}
.${c} i {
  font-style: normal;
  font-size: 0.7rem;
  color: #94a3b8;
}
.${c} button {
  width: 100%;
  margin-top: 0.7rem;
  padding: 0.45rem;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #0b1120;
  cursor: pointer;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  transition: filter 0.2s ease;
}
.${c} button:hover { filter: brightness(1.1); }`
    add(mk({
      name: `${g.name} Product Card`,
      category: 'Cards',
      description: `Commerce tile with a corner flag, price and rating on one baseline, and a full-width action — the four things a grid card has to carry.`,
      html, css,
      tags: ['card', 'product', 'commerce', 'price', 'rating', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CARDS — quote card with a hanging mark  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-card-quote-${t.name}`)
    const html = `<figure class="${c}"><blockquote>Shipped our onboarding in a weekend. The arguments were already settled, and settled well.</blockquote><figcaption><i>PR</i><span><b>Priya Raman</b><em>Head of Engineering</em></span></figcaption></figure>`
    const css = `.${c} {
  position: relative;
  width: 258px;
  margin: 0;
  padding: 1.5rem 1.1rem 1.1rem;
  border-radius: 0.75rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c}::before {
  content: '\\201C';
  position: absolute;
  top: -0.35rem;
  left: 0.8rem;
  font-size: 3.4rem;
  line-height: 1;
  font-family: Georgia, serif;
  background: linear-gradient(140deg, ${t.a}, ${t.b});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.${c} blockquote {
  margin: 0;
  font-size: 0.83rem;
  line-height: 1.6;
  color: #cbd5e1;
}
.${c} figcaption {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.95rem;
  padding-top: 0.85rem;
  border-top: 1px solid #1f2937;
}
.${c} figcaption i {
  flex: none;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-style: normal;
  font-size: 0.7rem;
  font-weight: 700;
  color: #0b1120;
  background: linear-gradient(140deg, ${t.b}, ${t.c});
}
.${c} b {
  display: block;
  font-size: 0.78rem;
  color: #e2e8f0;
}
.${c} em {
  display: block;
  font-style: normal;
  font-size: 0.68rem;
  color: #64748b;
}`
    add(mk({
      name: `${t.name} Quote Card`,
      category: 'Cards',
      description: `Testimonial with the opening mark hung outside the text block and clipped to a gradient, marked up as a real figure and blockquote.`,
      html, css,
      tags: ['card', 'quote', 'testimonial', 'blockquote', 'social proof', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TEXT — highlighter marker sweep  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-text-marker-${g.name}`)
    const html = `<p class="${c}">The part that <mark>actually matters</mark> here.</p>`
    const css = `.${c} {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #e2e8f0;
}
.${c} mark {
  position: relative;
  padding: 0 0.2rem;
  color: inherit;
  background: transparent;
}
.${c} mark::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0.05em;
  height: 0.62em;
  z-index: -1;
  border-radius: 0.12em;
  transform-origin: left;
  background: linear-gradient(90deg, rgba(${rgbOf(g.a)}, 0.55), rgba(${rgbOf(g.b)}, 0.55));
  animation: ${c}-swipe 3.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
@keyframes ${c}-swipe {
  0%, 8%   { transform: scaleX(0); }
  40%, 82% { transform: scaleX(1); }
  100%     { transform: scaleX(0); }
}`
    add(mk({
      name: `${g.name} Marker Highlight`,
      category: 'Text',
      description: `Translucent bar swept behind a real \`<mark>\`, sitting slightly proud of the baseline so it reads as ink rather than a background box.`,
      html, css,
      tags: ['text', 'highlight', 'marker', 'mark', 'emphasis', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TEXT — outlined display type that fills  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-text-stroke-${t.name}`)
    const html = `<span class="${c}" data-text="OUTLINE">OUTLINE</span>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  font-size: 2.6rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: transparent;
  -webkit-text-stroke: 2px ${t.a};
}
.${c}::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  -webkit-text-stroke: 0;
  background: linear-gradient(100deg, ${t.a}, ${t.b}, ${t.c});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.5s cubic-bezier(0.65, 0, 0.35, 1);
}
.${c}:hover::after {
  clip-path: inset(0 0 0 0);
}`
    add(mk({
      name: `${t.name} Outline Fill Text`,
      category: 'Text',
      description: `Hollow display type with a filled copy in \`::after\` reading the same string from \`data-text\`, wiped in on hover so the two never disagree.`,
      html, css,
      tags: ['text', 'outline', 'stroke', 'fill', 'display', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BACKGROUNDS — layered sine wave bands  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-bg-waves-${g.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 100%;
  height: 185px;
  overflow: hidden;
  border-radius: 0.7rem;
  background: linear-gradient(180deg, #0b1120, #0f172a);
}
.${c} i {
  position: absolute;
  left: -55%;
  width: 210%;
  height: 210%;
  border-radius: 43%;
}
.${c} i:nth-child(1) {
  bottom: 26%;
  background: rgba(${rgbOf(g.a)}, 0.24);
  animation: ${c}-roll 13s linear infinite;
}
.${c} i:nth-child(2) {
  bottom: 14%;
  background: rgba(${rgbOf(g.b)}, 0.3);
  animation: ${c}-roll 9s linear infinite reverse;
}
.${c} i:nth-child(3) {
  bottom: 2%;
  background: rgba(${rgbOf(g.a)}, 0.4);
  animation: ${c}-roll 17s linear infinite;
}
@keyframes ${c}-roll {
  to { transform: rotate(360deg); }
}`
    add(mk({
      name: `${g.name} Wave Bands`,
      category: 'Backgrounds',
      description: `Three oversized near-circles rotating at different rates and directions, which reads as overlapping swells rather than three spinning discs.`,
      html, css,
      tags: ['background', 'waves', 'layered', 'ocean', 'ambient', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BACKGROUNDS — concentric ripple pulse  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-bg-ripple-${t.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 185px;
  overflow: hidden;
  border-radius: 0.7rem;
  background: radial-gradient(circle at 50% 50%, #131c33, #0b1120 70%);
}
.${c} i {
  position: absolute;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 1px solid ${t.b};
  opacity: 0;
  animation: ${c}-out 5s cubic-bezier(0.2, 0.6, 0.35, 1) infinite;
}
.${c} i:nth-child(1) { animation-delay: 0s; border-color: ${t.a}; }
.${c} i:nth-child(2) { animation-delay: 1.25s; border-color: ${t.b}; }
.${c} i:nth-child(3) { animation-delay: 2.5s; border-color: ${t.c}; }
.${c} i:nth-child(4) { animation-delay: 3.75s; border-color: ${t.b}; }
@keyframes ${c}-out {
  0%   { transform: scale(0.3); opacity: 0; }
  12%  { opacity: 0.75; }
  100% { transform: scale(5.2); opacity: 0; }
}`
    add(mk({
      name: `${t.name} Ripple Field`,
      category: 'Backgrounds',
      description: `Four rings released a beat apart and eased out, so the pulse is continuous from four elements rather than a long single-ring loop.`,
      html, css,
      tags: ['background', 'ripple', 'radar', 'pulse', 'rings', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  INPUTS & HOVER — number stepper  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-input-stepper-${g.name}`)
    const html = `<div class="${c}"><button aria-label="Decrease">−</button><input value="3" readonly><button aria-label="Increase">+</button></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #111827;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.${c}:focus-within {
  border-color: ${g.a};
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.a)}, 0.18);
}
.${c} button {
  width: 36px;
  border: none;
  background: #1a2234;
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.${c} button:hover {
  background: linear-gradient(180deg, ${g.a}, ${g.b});
  color: #0b1120;
}
.${c} button:active { filter: brightness(0.92); }
.${c} input {
  width: 52px;
  padding: 0.55rem 0;
  border: none;
  border-left: 1px solid #334155;
  border-right: 1px solid #334155;
  outline: none;
  text-align: center;
  background: transparent;
  color: #f1f5f9;
  font-size: 0.88rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}`
    add(mk({
      name: `${g.name} Number Stepper`,
      category: 'Inputs & Hover',
      description: `Quantity control with the field flanked by its own increment buttons, in tabular figures so the box does not resize between 9 and 10.`,
      html, css,
      tags: ['input', 'stepper', 'number', 'quantity', 'spinner', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  INPUTS & HOVER — colour swatch picker  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-input-swatch-${t.name}`)
    const html = `<div class="${c}"><input type="radio" name="${c}" id="${c}-1" checked><label for="${c}-1" class="s1"></label><input type="radio" name="${c}" id="${c}-2"><label for="${c}-2" class="s2"></label><input type="radio" name="${c}" id="${c}-3"><label for="${c}-3" class="s3"></label><input type="radio" name="${c}" id="${c}-4"><label for="${c}-4" class="s4"></label></div>`
    const css = `.${c} {
  display: inline-flex;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.55rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.${c} label {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  outline: 2px solid transparent;
  outline-offset: 3px;
  transition: outline-color 0.18s ease, transform 0.18s ease;
}
.${c} label:hover { transform: scale(1.12); }
.${c} .s1 { background: ${t.a}; }
.${c} .s2 { background: ${t.b}; }
.${c} .s3 { background: ${t.c}; }
.${c} .s4 { background: #e2e8f0; }
.${c} input:checked + .s1 { outline-color: ${t.a}; }
.${c} input:checked + .s2 { outline-color: ${t.b}; }
.${c} input:checked + .s3 { outline-color: ${t.c}; }
.${c} input:checked + .s4 { outline-color: #e2e8f0; }
.${c} input:focus-visible + label {
  outline-color: #f8fafc;
  outline-style: dashed;
}`
    add(mk({
      name: `${t.name} Swatch Picker`,
      category: 'Inputs & Hover',
      description: `Colour choices as real radios with selection drawn by \`outline\` rather than a border, so picking one costs no layout shift.`,
      html, css,
      tags: ['input', 'swatch', 'color', 'picker', 'radio', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  NAVIGATION & MENUS — context menu with shortcuts  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-nav-context-${g.name}`)
    const html = `<div class="${c}"><a href="#">Duplicate<kbd>⌘D</kbd></a><a href="#">Rename<kbd>F2</kbd></a><hr><a href="#">Move to…<kbd>⌘M</kbd></a><a href="#" class="danger">Delete<kbd>⌫</kbd></a></div>`
    const css = `.${c} {
  width: 208px;
  padding: 0.35rem;
  border-radius: 0.55rem;
  background: #111827;
  border: 1px solid #1f2937;
  box-shadow: 0 18px 40px rgba(0,0,0,0.55);
}
.${c} a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.42rem 0.55rem;
  border-radius: 0.35rem;
  font-size: 0.8rem;
  color: #cbd5e1;
  text-decoration: none;
  transition: background 0.14s ease, color 0.14s ease;
}
.${c} a:hover {
  background: linear-gradient(90deg, rgba(${rgbOf(g.a)}, 0.9), rgba(${rgbOf(g.b)}, 0.9));
  color: #0b1120;
}
.${c} a.danger { color: #f87171; }
.${c} a.danger:hover { background: #f87171; color: #0b1120; }
.${c} hr {
  height: 1px;
  margin: 0.3rem 0.2rem;
  border: none;
  background: #1f2937;
}
.${c} kbd {
  font-family: inherit;
  font-size: 0.68rem;
  color: #64748b;
  transition: color 0.14s ease;
}
.${c} a:hover kbd { color: rgba(11,17,32,0.7); }`
    add(mk({
      name: `${g.name} Context Menu`,
      category: 'Navigation & Menus',
      description: `Right-click menu with a rule between groups and each item's binding right-aligned, dimmed until the row is hovered so the shortcuts do not compete.`,
      html, css,
      tags: ['menu', 'context', 'dropdown', 'shortcut', 'right click', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  NAVIGATION & MENUS — pagination control  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-nav-page-${t.name}`)
    const html = `<nav class="${c}"><a href="#" class="edge">‹</a><a href="#">1</a><a href="#" class="on">2</a><a href="#">3</a><span>…</span><a href="#">18</a><a href="#" class="edge">›</a></nav>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem;
  border-radius: 0.55rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} a {
  display: grid;
  place-items: center;
  min-width: 30px;
  height: 30px;
  padding: 0 0.4rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
  text-decoration: none;
  font-variant-numeric: tabular-nums;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} a:hover { background: #1e293b; color: #e2e8f0; }
.${c} a.edge { color: #64748b; font-size: 1rem; }
.${c} a.on {
  color: #0b1120;
  background: linear-gradient(135deg, ${t.a}, ${t.b});
  box-shadow: 0 4px 12px rgba(${rgbOf(t.a)}, 0.35);
}
.${c} a.on:hover { color: #0b1120; }
.${c} span {
  padding: 0 0.2rem;
  font-size: 0.8rem;
  color: #475569;
}
.${c} a:focus-visible {
  outline: 2px solid ${t.c};
  outline-offset: 1px;
}`
    add(mk({
      name: `${t.name} Pagination`,
      category: 'Navigation & Menus',
      description: `Page links with an elided middle and tabular numerals, so widths stay even from page 2 to page 18 and the control never reflows.`,
      html, css,
      tags: ['nav', 'pagination', 'pages', 'links', 'table', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  DIVIDERS & SEPARATORS — torn paper edge  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-div-torn-${g.name}`)
    const html = `<div class="${c}"><i></i></div>`
    const css = `.${c} {
  width: 300px;
  height: 44px;
  border-radius: 0.4rem;
  overflow: hidden;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}
.${c} i {
  display: block;
  width: 100%;
  height: 26px;
  background: #0b1120;
  --tooth: radial-gradient(circle at 50% 0, transparent 0 9px, #0b1120 9px);
  -webkit-mask: none;
  background-image: var(--tooth), var(--tooth);
  background-size: 26px 26px;
  background-position: 0 100%, 13px 100%;
  background-repeat: repeat-x;
  background-color: #0b1120;
}`
    add(mk({
      name: `${g.name} Torn Edge`,
      category: 'Dividers & Separators',
      description: `Scalloped seam cut by two offset radial repeats, so the notches interlock into a torn edge rather than a row of even semicircles.`,
      html, css,
      tags: ['divider', 'torn', 'scallop', 'edge', 'section', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  DIVIDERS & SEPARATORS — vertical rule with rotated label  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-div-vert-${t.name}`)
    const html = `<div class="${c}"><i></i><span>OR</span><i></i></div>`
    const css = `.${c} {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  height: 150px;
}
.${c} i {
  flex: 1;
  width: 2px;
  border-radius: 1px;
}
.${c} i:first-child {
  background: linear-gradient(180deg, transparent, ${t.a}, ${t.b});
}
.${c} i:last-child {
  background: linear-gradient(180deg, ${t.b}, ${t.c}, transparent);
}
.${c} span {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: ${t.b};
  writing-mode: vertical-rl;
  text-orientation: mixed;
}`
    add(mk({
      name: `${t.name} Vertical Divider`,
      category: 'Dividers & Separators',
      description: `Column separator whose label runs with the rule via \`writing-mode\`, so the text rotates without a transform that would break its box.`,
      html, css,
      tags: ['divider', 'vertical', 'label', 'column', 'separator', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BADGES & TAGS — verified trust badge  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-badge-verified-${g.name}`)
    const html = `<span class="${c}"><i></i>Verified</span>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.28rem 0.7rem 0.28rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${g.b};
  background: rgba(${rgbOf(g.a)}, 0.12);
  border: 1px solid rgba(${rgbOf(g.a)}, 0.35);
}
.${c} i {
  position: relative;
  flex: none;
  width: 15px;
  height: 15px;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  clip-path: polygon(50% 0%, 65% 10%, 83% 8%, 91% 24%, 100% 38%, 94% 55%, 97% 73%, 82% 82%, 70% 95%, 50% 92%, 30% 95%, 18% 82%, 3% 73%, 6% 55%, 0% 38%, 9% 24%, 17% 8%, 35% 10%);
}
.${c} i::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 3px;
  width: 3px;
  height: 6px;
  border: solid #0b1120;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}`
    add(mk({
      name: `${g.name} Verified Badge`,
      category: 'Badges & Tags',
      description: `Scalloped seal cut with an eighteen-point \`clip-path\` and a tick drawn from two borders, so the whole mark is one element and no SVG.`,
      html, css,
      tags: ['badge', 'verified', 'trust', 'seal', 'check', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BADGES & TAGS — sale starburst  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-badge-burst-${t.name}`)
    const html = `<span class="${c}"><b>-40%</b></span>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
}
.${c}::before,
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 0.55rem;
  background: linear-gradient(140deg, ${t.a}, ${t.b});
  box-shadow: 0 6px 18px rgba(${rgbOf(t.a)}, 0.35);
}
.${c}::after {
  transform: rotate(45deg);
  background: linear-gradient(140deg, ${t.b}, ${t.c});
}
.${c} b {
  position: relative;
  z-index: 1;
  font-size: 0.85rem;
  font-weight: 800;
  color: #0b1120;
  font-variant-numeric: tabular-nums;
}`
    add(mk({
      name: `${t.name} Sale Starburst`,
      category: 'Badges & Tags',
      description: `Eight-point star made from two rounded squares at 45 degrees to each other — cheaper than a polygon and it keeps soft corners.`,
      html, css,
      tags: ['badge', 'sale', 'starburst', 'discount', 'promo', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOGGLES & SWITCHES — switch with a pending state  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-toggle-pending-${g.name}`)
    const html = `<label class="${c}"><input type="checkbox" checked><span><i></i></span></label>`
    const css = `.${c} {
  display: inline-block;
  cursor: pointer;
}
.${c} input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.${c} span {
  position: relative;
  display: block;
  width: 54px;
  height: 30px;
  border-radius: 999px;
  background: #334155;
  transition: background 0.25s ease;
}
.${c} i {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  transition: transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} i::after {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: ${g.a};
  opacity: 0;
  transition: opacity 0.2s ease;
  animation: ${c}-spin 0.7s linear infinite;
}
.${c} input:checked + span {
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}
.${c} input:checked + span i {
  transform: translateX(24px);
}
.${c} input:checked + span i::after {
  opacity: 1;
}
.${c} input:focus-visible + span {
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.b)}, 0.35);
}
@keyframes ${c}-spin {
  to { transform: rotate(360deg); }
}`
    add(mk({
      name: `${g.name} Pending Switch`,
      category: 'Toggles & Switches',
      description: `Toggle whose knob carries a spinner once flipped, for settings that persist over the network and are not actually on until the server says so.`,
      html, css,
      tags: ['toggle', 'switch', 'pending', 'async', 'spinner', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOGGLES & SWITCHES — selectable option tile  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-toggle-tile-${t.name}`)
    const html = `<label class="${c}"><input type="radio" name="${c}" checked><span><i></i><b>Team</b><em>$29 per seat</em></span></label>`
    const css = `.${c} {
  display: inline-block;
  cursor: pointer;
}
.${c} input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.${c} span {
  position: relative;
  display: block;
  width: 150px;
  padding: 0.85rem 0.9rem;
  border: 1px solid #334155;
  border-radius: 0.6rem;
  background: #111827;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}
.${c} span:hover { border-color: #475569; }
.${c} i {
  position: absolute;
  top: 0.7rem;
  right: 0.7rem;
  width: 16px;
  height: 16px;
  border: 2px solid #475569;
  border-radius: 50%;
  transition: border-color 0.2s ease;
}
.${c} i::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: ${t.a};
  transform: scale(0);
  transition: transform 0.22s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.${c} b {
  display: block;
  font-size: 0.85rem;
  color: #e2e8f0;
}
.${c} em {
  display: block;
  margin-top: 0.2rem;
  font-style: normal;
  font-size: 0.72rem;
  color: #64748b;
}
.${c} input:checked + span {
  border-color: ${t.a};
  background: rgba(${rgbOf(t.a)}, 0.08);
  transform: translateY(-2px);
}
.${c} input:checked + span i { border-color: ${t.a}; }
.${c} input:checked + span i::after { transform: scale(1); }
.${c} input:checked + span b { color: ${t.b}; }
.${c} input:focus-visible + span {
  box-shadow: 0 0 0 3px rgba(${rgbOf(t.c)}, 0.28);
}`
    add(mk({
      name: `${t.name} Option Tile`,
      category: 'Toggles & Switches',
      description: `Plan picker where the whole card is the label and the radio dot scales in on an overshoot, so the selection has weight without a layout change.`,
      html, css,
      tags: ['toggle', 'radio', 'tile', 'plan', 'selection', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOOLTIPS & POPOVERS — four-direction tooltip set  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-tip-dirs-${g.name}`)
    const html = `<div class="${c}"><span class="t up"><b>Top</b><i>Above</i></span><span class="t dn"><b>Bottom</b><i>Below</i></span></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.7rem;
  padding: 2.2rem 0;
}
.${c} .t {
  position: relative;
  display: inline-block;
}
.${c} b {
  display: block;
  padding: 0.45rem 0.9rem;
  border: 1px solid #334155;
  border-radius: 0.45rem;
  background: #1e293b;
  color: #cbd5e1;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: default;
  transition: border-color 0.2s ease;
}
.${c} .t:hover b { border-color: ${g.a}; }
.${c} i {
  position: absolute;
  left: 50%;
  padding: 0.35rem 0.65rem;
  white-space: nowrap;
  font-style: normal;
  font-size: 0.72rem;
  color: #0b1120;
  border-radius: 0.35rem;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
}
.${c} i::after {
  content: '';
  position: absolute;
  left: 50%;
  margin-left: -4px;
  border: 4px solid transparent;
}
.${c} .up i {
  bottom: calc(100% + 7px);
  transform: translate(-50%, 4px);
}
.${c} .up i::after {
  top: 100%;
  border-top-color: ${g.b};
}
.${c} .dn i {
  top: calc(100% + 7px);
  transform: translate(-50%, -4px);
}
.${c} .dn i::after {
  bottom: 100%;
  border-bottom-color: ${g.a};
}
.${c} .t:hover i,
.${c} .t:focus-within i {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, 0);
}`
    add(mk({
      name: `${g.name} Directional Tooltips`,
      category: 'Tooltips & Popovers',
      description: `Top and bottom variants sharing one rule set, each arrow tinted to the gradient stop nearest it so the tail never mismatches the bubble.`,
      html, css,
      tags: ['tooltip', 'direction', 'arrow', 'placement', 'hint', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOOLTIPS & POPOVERS — confirm popover with actions  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-tip-confirm-${t.name}`)
    const html = `<div class="${c}"><button class="trigger">Delete</button><div class="pop"><b>Delete this project?</b><p>Everything in it goes too. This cannot be undone.</p><footer><button class="ghost">Cancel</button><button class="go">Delete</button></footer></div></div>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding-bottom: 0.5rem;
}
.${c} .trigger {
  padding: 0.48rem 1rem;
  border: 1px solid rgba(${rgbOf(t.a)}, 0.5);
  border-radius: 0.45rem;
  background: transparent;
  color: ${t.a};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}
.${c} .pop {
  position: absolute;
  top: 100%;
  left: 50%;
  width: 226px;
  padding: 0.8rem 0.85rem;
  transform: translate(-50%, -6px);
  border-radius: 0.55rem;
  background: #111827;
  border: 1px solid #1f2937;
  box-shadow: 0 18px 40px rgba(0,0,0,0.55);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
}
.${c}:hover .pop,
.${c}:focus-within .pop {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, 0);
}
.${c} .pop b {
  font-size: 0.82rem;
  color: #f1f5f9;
}
.${c} .pop p {
  margin: 0.3rem 0 0;
  font-size: 0.73rem;
  line-height: 1.5;
  color: #94a3b8;
}
.${c} footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
  margin-top: 0.75rem;
}
.${c} footer button {
  padding: 0.32rem 0.75rem;
  border-radius: 0.35rem;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
}
.${c} .ghost {
  border: 1px solid #334155;
  background: transparent;
  color: #94a3b8;
}
.${c} .go {
  border: none;
  color: #0b1120;
  background: linear-gradient(90deg, ${t.a}, ${t.b});
}`
    add(mk({
      name: `${t.name} Confirm Popover`,
      category: 'Tooltips & Popovers',
      description: `Inline confirmation with cancel and proceed, opening on focus as well as hover so a keyboard user can reach the buttons inside it.`,
      html, css,
      tags: ['popover', 'confirm', 'destructive', 'actions', 'dialog', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SKELETONS & SHIMMERS — chart placeholder  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-skel-chart-${g.name}`)
    const html = `<div class="${c}"><i class="t"></i><div class="plot"><i></i><i></i><i></i><i></i><i></i><i></i></div><i class="x"></i></div>`
    const css = `.${c} {
  width: 282px;
  padding: 0.9rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} i {
  border-radius: 0.25rem;
  background: linear-gradient(100deg, #1e293b 20%, rgba(${rgbOf(g.a)}, 0.3) 40%, #1e293b 60%);
  background-size: 250% 100%;
  animation: ${c}-pan 1.7s linear infinite;
}
.${c} .t {
  display: block;
  width: 44%;
  height: 12px;
}
.${c} .plot {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  height: 84px;
  margin: 0.9rem 0 0.6rem;
}
.${c} .plot i { flex: 1; }
.${c} .plot i:nth-child(1) { height: 44%; animation-delay: 0.05s; }
.${c} .plot i:nth-child(2) { height: 68%; animation-delay: 0.1s; }
.${c} .plot i:nth-child(3) { height: 52%; animation-delay: 0.15s; }
.${c} .plot i:nth-child(4) { height: 88%; animation-delay: 0.2s; }
.${c} .plot i:nth-child(5) { height: 71%; animation-delay: 0.25s; }
.${c} .plot i:nth-child(6) { height: 100%; animation-delay: 0.3s; }
.${c} .x {
  display: block;
  height: 7px;
}
@keyframes ${c}-pan {
  to { background-position: -250% 0; }
}`
    add(mk({
      name: `${g.name} Chart Skeleton`,
      category: 'Skeletons & Shimmers',
      description: `Placeholder shaped like the chart it stands in for — title, ragged bars and an axis — so the panel does not resize when real data arrives.`,
      html, css,
      tags: ['skeleton', 'chart', 'placeholder', 'dashboard', 'loading', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SKELETONS & SHIMMERS — profile header placeholder  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-skel-profile-${t.name}`)
    const html = `<div class="${c}"><i class="cover"></i><i class="av"></i><div class="txt"><i class="n"></i><i class="r"></i></div><div class="stats"><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  position: relative;
  width: 250px;
  padding-bottom: 0.9rem;
  border-radius: 0.65rem;
  overflow: hidden;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} i {
  border-radius: 0.3rem;
  background: linear-gradient(105deg, #1e293b 22%, rgba(${rgbOf(t.b)}, 0.28) 42%, #1e293b 62%);
  background-size: 240% 100%;
  animation: ${c}-sheen 1.8s linear infinite;
}
.${c} .cover {
  display: block;
  height: 60px;
  border-radius: 0;
}
.${c} .av {
  display: block;
  width: 52px;
  height: 52px;
  margin: -26px 0 0 0.9rem;
  border-radius: 50%;
  border: 3px solid #111827;
  animation-delay: 0.1s;
}
.${c} .txt { padding: 0.6rem 0.9rem 0; }
.${c} .n { display: block; width: 55%; height: 12px; animation-delay: 0.18s; }
.${c} .r { display: block; width: 38%; height: 9px; margin-top: 0.45rem; animation-delay: 0.26s; }
.${c} .stats {
  display: flex;
  gap: 0.5rem;
  padding: 0.85rem 0.9rem 0;
}
.${c} .stats i { flex: 1; height: 30px; animation-delay: 0.34s; }
@keyframes ${c}-sheen {
  to { background-position: -240% 0; }
}`
    add(mk({
      name: `${t.name} Profile Skeleton`,
      category: 'Skeletons & Shimmers',
      description: `Cover, overlapping avatar, name lines and a stat row, staggered top-down so the header reads as filling in rather than flashing at once.`,
      html, css,
      tags: ['skeleton', 'profile', 'header', 'avatar', 'loading', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ENTRANCE ANIMATIONS — elastic drop-in  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-enter-drop-${g.name}`)
    const html = `<div class="${c}"><span>Saved</span><i></i></div>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding-bottom: 12px;
}
.${c} span {
  display: block;
  padding: 0.7rem 1.5rem;
  border-radius: 0.6rem;
  font-size: 0.92rem;
  font-weight: 700;
  color: #0b1120;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  box-shadow: 0 8px 22px rgba(${rgbOf(g.a)}, 0.3);
  transform-origin: bottom center;
  animation: ${c}-drop 2.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}
.${c} i {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 56px;
  height: 8px;
  margin-left: -28px;
  border-radius: 50%;
  background: rgba(${rgbOf(g.b)}, 0.3);
  filter: blur(4px);
  animation: ${c}-shade 2.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}
@keyframes ${c}-drop {
  0%, 6%   { opacity: 0; transform: translateY(-34px) scale(0.86, 1.14); }
  38%      { opacity: 1; transform: translateY(0) scale(1.1, 0.9); }
  52%      { transform: translateY(-7px) scale(0.97, 1.03); }
  66%, 84% { transform: translateY(0) scale(1, 1); }
  100%     { opacity: 0; transform: translateY(-16px) scale(0.94); }
}
@keyframes ${c}-shade {
  0%, 6%   { opacity: 0; transform: scaleX(0.4); }
  38%      { opacity: 1; transform: scaleX(1.1); }
  66%, 84% { opacity: 0.8; transform: scaleX(1); }
  100%     { opacity: 0; transform: scaleX(0.6); }
}`
    add(mk({
      name: `${g.name} Elastic Drop`,
      category: 'Entrance Animations',
      description: `Squash-and-stretch entrance with a shadow that widens on impact, which is what sells the landing more than the bounce itself.`,
      html, css,
      tags: ['entrance', 'drop', 'bounce', 'elastic', 'squash', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ENTRANCE ANIMATIONS — per-character stagger  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-enter-chars-${t.name}`)
    const html = `<span class="${c}"><i>L</i><i>A</i><i>U</i><i>N</i><i>C</i><i>H</i></span>`
    const css = `.${c} {
  display: inline-flex;
  gap: 0.1em;
  font-size: 2.1rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}
.${c} i {
  display: inline-block;
  font-style: normal;
  background: linear-gradient(140deg, ${t.a}, ${t.b}, ${t.c});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ${c}-in 3.4s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}
.${c} i:nth-child(1) { animation-delay: 0s; }
.${c} i:nth-child(2) { animation-delay: 0.07s; }
.${c} i:nth-child(3) { animation-delay: 0.14s; }
.${c} i:nth-child(4) { animation-delay: 0.21s; }
.${c} i:nth-child(5) { animation-delay: 0.28s; }
.${c} i:nth-child(6) { animation-delay: 0.35s; }
@keyframes ${c}-in {
  0%, 5%   { opacity: 0; transform: translateY(0.5em) rotate(9deg); }
  32%, 80% { opacity: 1; transform: translateY(0) rotate(0deg); }
  100%     { opacity: 0; transform: translateY(-0.3em) rotate(-5deg); }
}`
    add(mk({
      name: `${t.name} Character Stagger`,
      category: 'Entrance Animations',
      description: `Letters wrapped individually and released seventy milliseconds apart, each rotating slightly so the line assembles rather than sliding as a block.`,
      html, css,
      tags: ['entrance', 'stagger', 'letters', 'split text', 'headline', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BORDERS & OUTLINES — beaded dotted frame  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-border-beaded-${g.name}`)
    const html = `<div class="${c}"><span>Draft</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 196px;
  height: 98px;
  padding: 4px;
  border-radius: 0.55rem;
  background:
    repeating-linear-gradient(90deg, ${g.a} 0 5px, transparent 5px 11px) top/100% 2px no-repeat,
    repeating-linear-gradient(90deg, ${g.b} 0 5px, transparent 5px 11px) bottom/100% 2px no-repeat,
    repeating-linear-gradient(0deg, ${g.a} 0 5px, transparent 5px 11px) left/2px 100% no-repeat,
    repeating-linear-gradient(0deg, ${g.b} 0 5px, transparent 5px 11px) right/2px 100% no-repeat;
  animation: ${c}-march 1.4s linear infinite;
}
.${c} span {
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${g.b};
}
@keyframes ${c}-march {
  to { background-position: 11px 0, -11px 100%, 0 -11px, 100% 11px; }
}`
    add(mk({
      name: `${g.name} Beaded Frame`,
      category: 'Borders & Outlines',
      description: `Four repeating gradients as edges rather than a dashed border, which is the only way to animate the dashes travelling around the box.`,
      html, css,
      tags: ['border', 'dashed', 'marching', 'frame', 'draft', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BORDERS & OUTLINES — split corner keyline  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-border-keyline-${t.name}`)
    const html = `<div class="${c}"><span>Focus</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 200px;
  height: 100px;
  background: #0f172a;
  border-radius: 0.4rem;
}
.${c}::before,
.${c}::after {
  content: '';
  position: absolute;
  width: 34px;
  height: 34px;
  transition: width 0.3s ease, height 0.3s ease, border-color 0.3s ease;
}
.${c}::before {
  top: 0;
  left: 0;
  border-top: 2px solid ${t.a};
  border-left: 2px solid ${t.a};
  border-radius: 0.4rem 0 0 0;
}
.${c}::after {
  bottom: 0;
  right: 0;
  border-bottom: 2px solid ${t.c};
  border-right: 2px solid ${t.c};
  border-radius: 0 0 0.4rem 0;
}
.${c} span {
  font-size: 0.85rem;
  font-weight: 600;
  color: #cbd5e1;
  transition: color 0.3s ease;
}
.${c}:hover::before,
.${c}:hover::after {
  width: calc(100% - 2px);
  height: calc(100% - 2px);
}
.${c}:hover::before { border-color: ${t.b}; }
.${c}:hover::after { border-color: ${t.b}; }
.${c}:hover span { color: ${t.b}; }`
    add(mk({
      name: `${t.name} Corner Keyline`,
      category: 'Borders & Outlines',
      description: `Two opposing corner brackets that grow to meet as a full frame on hover, so the border draws itself from both ends at once.`,
      html, css,
      tags: ['border', 'corner', 'keyline', 'draw', 'hover', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PROGRESS & METERS — battery level indicator  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-prog-battery-${g.name}`)
    const html = `<div class="${c}"><i><b></b></i><span>68%</span></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}
.${c} i {
  position: relative;
  display: block;
  width: 54px;
  height: 26px;
  padding: 3px;
  border: 2px solid #475569;
  border-radius: 0.35rem;
}
.${c} i::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 50%;
  width: 4px;
  height: 10px;
  margin-top: -5px;
  border-radius: 0 2px 2px 0;
  background: #475569;
}
.${c} b {
  display: block;
  width: 68%;
  height: 100%;
  border-radius: 0.15rem;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  animation: ${c}-breathe 2.6s ease-in-out infinite;
}
.${c} span {
  font-size: 0.78rem;
  font-weight: 600;
  color: ${g.b};
  font-variant-numeric: tabular-nums;
}
@keyframes ${c}-breathe {
  50% { filter: brightness(1.25); }
}`
    add(mk({
      name: `${g.name} Battery Meter`,
      category: 'Progress & Meters',
      description: `Charge indicator with the terminal nub drawn as a pseudo-element, so the cell body stays a clean box for the fill to sit inside.`,
      html, css,
      tags: ['meter', 'battery', 'level', 'charge', 'indicator', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PROGRESS & METERS — concentric activity rings  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-prog-rings-${t.name}`)
    const html = `<div class="${c}"><i class="r1"></i><i class="r2"></i><i class="r3"></i></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
}
.${c} i {
  position: absolute;
  border-radius: 50%;
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 7px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 7px));
}
.${c} .r1 {
  width: 96px;
  height: 96px;
  background: conic-gradient(${t.a} 0turn 0.78turn, rgba(148,163,184,0.16) 0.78turn 1turn);
}
.${c} .r2 {
  width: 68px;
  height: 68px;
  background: conic-gradient(${t.b} 0turn 0.55turn, rgba(148,163,184,0.16) 0.55turn 1turn);
}
.${c} .r3 {
  width: 40px;
  height: 40px;
  background: conic-gradient(${t.c} 0turn 0.34turn, rgba(148,163,184,0.16) 0.34turn 1turn);
}`
    add(mk({
      name: `${t.name} Activity Rings`,
      category: 'Progress & Meters',
      description: `Three nested conic dials each masked to a band, so one element per metric shows three independent values without any overlap maths.`,
      html, css,
      tags: ['progress', 'rings', 'activity', 'concentric', 'fitness', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  AVATARS & IMAGES — polaroid frame with hover reveal  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-img-polaroid-${g.name}`)
    const html = `<figure class="${c}"><i></i><figcaption>Tromsø · 2026</figcaption></figure>`
    const css = `.${c} {
  width: 168px;
  margin: 0;
  padding: 9px 9px 0;
  border-radius: 0.3rem;
  background: #e2e8f0;
  box-shadow: 0 12px 28px rgba(0,0,0,0.45);
  transform: rotate(-2.5deg);
  transition: transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.3s ease;
}
.${c} i {
  display: block;
  height: 148px;
  border-radius: 0.15rem;
  background: linear-gradient(150deg, ${g.a}, ${g.b});
  filter: saturate(0.55) brightness(0.85);
  transition: filter 0.35s ease;
}
.${c} figcaption {
  padding: 0.6rem 0.15rem 0.7rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  text-align: center;
  color: #475569;
}
.${c}:hover {
  transform: rotate(0deg) translateY(-5px) scale(1.03);
  box-shadow: 0 20px 40px rgba(0,0,0,0.55);
}
.${c}:hover i {
  filter: saturate(1.15) brightness(1);
}`
    add(mk({
      name: `${g.name} Polaroid Frame`,
      category: 'Avatars & Images',
      description: `Instant-photo mount tilted off-axis that straightens and develops on hover, the caption in monospace on the wide bottom margin.`,
      html, css,
      tags: ['image', 'polaroid', 'frame', 'photo', 'hover', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  AVATARS & IMAGES — avatar group with overflow  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-avatar-group-${t.name}`)
    const html = `<div class="${c}"><i class="a1">AW</i><i class="a2">PR</i><i class="a3">JK</i><i class="more">+9</i></div>`
    const css = `.${c} {
  display: inline-flex;
  padding-left: 9px;
}
.${c} i {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  margin-left: -9px;
  border-radius: 50%;
  border: 2px solid #0b1120;
  font-style: normal;
  font-size: 0.7rem;
  font-weight: 700;
  color: #0b1120;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.5, 0.64, 1), z-index 0s;
}
.${c} .a1 { background: linear-gradient(140deg, ${t.a}, ${t.b}); }
.${c} .a2 { background: linear-gradient(140deg, ${t.b}, ${t.c}); }
.${c} .a3 { background: linear-gradient(140deg, ${t.c}, ${t.a}); }
.${c} .more {
  color: #cbd5e1;
  background: #1e293b;
  border-color: #0b1120;
}
.${c} i:hover {
  transform: translateY(-5px) scale(1.08);
  position: relative;
  z-index: 1;
}`
    add(mk({
      name: `${t.name} Avatar Group`,
      category: 'Avatars & Images',
      description: `Overlapped stack with a counted overflow chip, each face lifting out of the pile on hover with a background-colored ring keeping the seams clean.`,
      html, css,
      tags: ['avatar', 'group', 'stack', 'overflow', 'team', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MODALS & OVERLAYS — full-screen menu curtain  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-modal-curtain-${g.name}`)
    const html = `<div class="${c}"><button class="x"><i></i><i></i></button><nav><a href="#">Work</a><a href="#">Studio</a><a href="#">Journal</a><a href="#">Contact</a></nav></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 268px;
  height: 190px;
  overflow: hidden;
  border-radius: 0.65rem;
  background: linear-gradient(150deg, ${g.a}, ${g.b});
}
.${c} .x {
  position: absolute;
  top: 0.7rem;
  right: 0.7rem;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  cursor: pointer;
}
.${c} .x i {
  position: absolute;
  left: 3px;
  top: 12px;
  width: 20px;
  height: 2px;
  border-radius: 1px;
  background: #0b1120;
  transition: transform 0.25s ease;
}
.${c} .x i:first-child { transform: rotate(45deg); }
.${c} .x i:last-child { transform: rotate(-45deg); }
.${c} .x:hover i:first-child { transform: rotate(135deg); }
.${c} .x:hover i:last-child { transform: rotate(45deg); }
.${c} nav {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  text-align: center;
}
.${c} a {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #0b1120;
  text-decoration: none;
  opacity: 0;
  animation: ${c}-rise 4s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  transition: opacity 0.2s ease;
}
.${c} a:nth-child(1) { animation-delay: 0.05s; }
.${c} a:nth-child(2) { animation-delay: 0.13s; }
.${c} a:nth-child(3) { animation-delay: 0.21s; }
.${c} a:nth-child(4) { animation-delay: 0.29s; }
.${c} nav:hover a { opacity: 0.45; }
.${c} nav a:hover { opacity: 1; }
@keyframes ${c}-rise {
  0%, 6%   { opacity: 0; transform: translateY(18px); }
  30%, 82% { opacity: 1; transform: translateY(0); }
  100%     { opacity: 0; transform: translateY(-10px); }
}`
    add(mk({
      name: `${g.name} Menu Curtain`,
      category: 'Modals & Overlays',
      description: `Full-bleed navigation whose links rise on a stagger, with the siblings dimming on hover so the pointed-at item is the only bright one.`,
      html, css,
      tags: ['modal', 'overlay', 'menu', 'fullscreen', 'nav', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MODALS & OVERLAYS — alert dialog with an icon head  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-modal-alert-${t.name}`)
    const html = `<div class="${c}"><i></i><b>Session expiring</b><p>You will be signed out in two minutes unless you continue.</p><footer><button class="ghost">Sign out</button><button class="go">Stay</button></footer></div>`
    const css = `.${c} {
  width: 250px;
  padding: 1.3rem 1.1rem 1.1rem;
  text-align: center;
  border-radius: 0.75rem;
  background: #111827;
  border: 1px solid #1f2937;
  box-shadow: 0 24px 50px rgba(0,0,0,0.6);
  animation: ${c}-pop 3.4s cubic-bezier(0.34, 1.4, 0.64, 1) infinite;
}
.${c} i {
  position: relative;
  display: block;
  width: 46px;
  height: 46px;
  margin: 0 auto 0.8rem;
  border-radius: 50%;
  background: rgba(${rgbOf(t.a)}, 0.14);
  border: 1px solid rgba(${rgbOf(t.a)}, 0.4);
}
.${c} i::after {
  content: '!';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  font-weight: 800;
  color: ${t.a};
}
.${c} b {
  display: block;
  font-size: 0.92rem;
  color: #f1f5f9;
}
.${c} p {
  margin: 0.4rem 0 0;
  font-size: 0.76rem;
  line-height: 1.55;
  color: #94a3b8;
}
.${c} footer {
  display: flex;
  gap: 0.45rem;
  margin-top: 1rem;
}
.${c} footer button {
  flex: 1;
  padding: 0.45rem;
  border-radius: 0.4rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}
.${c} .ghost {
  border: 1px solid #334155;
  background: transparent;
  color: #94a3b8;
}
.${c} .go {
  border: none;
  color: #0b1120;
  background: linear-gradient(90deg, ${t.b}, ${t.c});
}
@keyframes ${c}-pop {
  0%, 5%   { opacity: 0; transform: scale(0.9) translateY(10px); }
  22%, 84% { opacity: 1; transform: scale(1) translateY(0); }
  100%     { opacity: 0; transform: scale(0.97) translateY(-6px); }
}`
    add(mk({
      name: `${t.name} Alert Dialog`,
      category: 'Modals & Overlays',
      description: `Centred confirmation led by a ringed icon, with the dismissive action styled quieter than the one you actually want pressed.`,
      html, css,
      tags: ['modal', 'dialog', 'alert', 'confirm', 'session', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ALERTS & TOASTS — transfer toast with percentage  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-alert-transfer-${g.name}`)
    const html = `<div class="${c}" role="status"><i></i><div class="meta"><b>Uploading 3 files</b><div class="bar"><em></em></div></div><span>62%</span></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 292px;
  padding: 0.75rem 0.85rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
  box-shadow: 0 12px 30px rgba(0,0,0,0.45);
}
.${c} i {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid rgba(${rgbOf(g.a)}, 0.25);
  border-top-color: ${g.a};
  animation: ${c}-spin 0.85s linear infinite;
}
.${c} .meta { flex: 1; min-width: 0; }
.${c} b {
  display: block;
  font-size: 0.78rem;
  color: #e2e8f0;
}
.${c} .bar {
  height: 4px;
  margin-top: 0.45rem;
  border-radius: 2px;
  overflow: hidden;
  background: #1e293b;
}
.${c} .bar em {
  display: block;
  width: 62%;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}
.${c} span {
  flex: none;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${g.b};
  font-variant-numeric: tabular-nums;
}
@keyframes ${c}-spin {
  to { transform: rotate(360deg); }
}`
    add(mk({
      name: `${g.name} Transfer Toast`,
      category: 'Alerts & Toasts',
      description: `Background-job notice carrying a spinner, a bar and a numeric read-out, so the same toast covers both indeterminate and measured phases.`,
      html, css,
      tags: ['toast', 'upload', 'progress', 'transfer', 'status', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ALERTS & TOASTS — consent bar  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-alert-consent-${t.name}`)
    const html = `<div class="${c}"><p>We use cookies to measure what people actually read. <a href="#">What we collect</a></p><div class="acts"><button class="ghost">Essential only</button><button class="go">Accept all</button></div></div>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 296px;
  padding: 0.9rem;
  border-radius: 0.65rem;
  background: rgba(17,24,39,0.94);
  border: 1px solid #1f2937;
  border-bottom: 2px solid ${t.a};
  backdrop-filter: blur(8px);
  box-shadow: 0 -10px 34px rgba(0,0,0,0.45);
}
.${c} p {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.55;
  color: #94a3b8;
}
.${c} a {
  color: ${t.b};
  text-decoration: underline;
  text-underline-offset: 2px;
}
.${c} .acts {
  display: flex;
  gap: 0.45rem;
}
.${c} button {
  flex: 1;
  padding: 0.45rem;
  border-radius: 0.4rem;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.18s ease, background 0.18s ease;
}
.${c} .ghost {
  border: 1px solid #334155;
  background: transparent;
  color: #cbd5e1;
}
.${c} .ghost:hover { background: #1e293b; }
.${c} .go {
  border: none;
  color: #0b1120;
  background: linear-gradient(90deg, ${t.b}, ${t.c});
}
.${c} .go:hover { filter: brightness(1.1); }`
    add(mk({
      name: `${t.name} Consent Bar`,
      category: 'Alerts & Toasts',
      description: `Cookie notice giving both choices equal size, since a decline styled as an afterthought is the pattern regulators actually object to.`,
      html, css,
      tags: ['banner', 'consent', 'cookies', 'privacy', 'gdpr', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ACCORDIONS & TABS — nested tree disclosure  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-acc-tree-${g.name}`)
    const html = `<div class="${c}"><details open><summary><i></i>src</summary><details><summary><i></i>components</summary><a href="#">button.tsx</a><a href="#">card.tsx</a></details><a href="#">index.ts</a></details></div>`
    const css = `.${c} {
  width: 236px;
  padding: 0.6rem;
  border-radius: 0.55rem;
  background: #111827;
  border: 1px solid #1f2937;
  font-size: 0.78rem;
}
.${c} details { padding-left: 0; }
.${c} details details { padding-left: 0.85rem; }
.${c} summary {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.3rem 0.35rem;
  border-radius: 0.3rem;
  color: #cbd5e1;
  cursor: pointer;
  list-style: none;
  transition: background 0.15s ease;
}
.${c} summary::-webkit-details-marker { display: none; }
.${c} summary:hover { background: #1e293b; }
.${c} summary i {
  flex: none;
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 5px solid ${g.a};
  transition: transform 0.18s ease;
}
.${c} details[open] > summary i {
  transform: rotate(90deg);
}
.${c} a {
  display: block;
  padding: 0.28rem 0.35rem 0.28rem 1.3rem;
  border-radius: 0.3rem;
  color: #64748b;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}
.${c} details details a { padding-left: 2.15rem; }
.${c} a:hover {
  background: rgba(${rgbOf(g.a)}, 0.1);
  color: ${g.b};
}`
    add(mk({
      name: `${g.name} Tree Disclosure`,
      category: 'Accordions & Tabs',
      description: `Nested \`<details>\` forming a file tree, with indentation from the nesting itself so any depth works without new rules.`,
      html, css,
      tags: ['accordion', 'tree', 'nested', 'file explorer', 'details', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ACCORDIONS & TABS — card tabs with panels  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-tabs-panel-${t.name}`)
    const html = `<div class="${c}"><input type="radio" name="${c}" id="${c}-a" checked><label for="${c}-a">Overview</label><input type="radio" name="${c}" id="${c}-b"><label for="${c}-b">Pricing</label><div class="panels"><div><b>Built for teams</b><p>Shared workspaces, roles and an audit trail.</p></div><div><b>Simple pricing</b><p>One seat price, no metered surprises.</p></div></div></div>`
    const css = `.${c} {
  display: grid;
  grid-template-columns: repeat(2, auto);
  width: 268px;
  border-radius: 0.6rem;
  overflow: hidden;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.${c} label {
  padding: 0.6rem 0.4rem;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  background: #0f172a;
  border-bottom: 2px solid transparent;
  transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}
.${c} label:hover { color: #cbd5e1; }
.${c} .panels {
  grid-column: 1 / -1;
  display: grid;
}
.${c} .panels > div {
  grid-area: 1 / 1;
  padding: 0.9rem;
  opacity: 0;
  visibility: hidden;
  transform: translateY(5px);
  transition: opacity 0.22s ease, transform 0.22s ease, visibility 0.22s;
}
.${c} b { display: block; font-size: 0.84rem; color: #f1f5f9; }
.${c} p { margin: 0.3rem 0 0; font-size: 0.74rem; line-height: 1.5; color: #94a3b8; }
.${c} input:nth-of-type(1):checked ~ .panels > div:nth-child(1),
.${c} input:nth-of-type(2):checked ~ .panels > div:nth-child(2) {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.${c} input:nth-of-type(1):checked + label { color: ${t.a}; background: #111827; border-color: ${t.a}; }
.${c} input:nth-of-type(2):checked + label { color: ${t.b}; background: #111827; border-color: ${t.b}; }
.${c} input:focus-visible + label { outline: 2px solid ${t.c}; outline-offset: -2px; }`
    add(mk({
      name: `${t.name} Card Tabs`,
      category: 'Accordions & Tabs',
      description: `Radio-driven tabs whose panels are stacked in one grid cell, so the container height is the tallest panel and switching never jumps.`,
      html, css,
      tags: ['tabs', 'panels', 'radio', 'card', 'switcher', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  3D & PERSPECTIVE — rotating carousel ring  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-3d-ring-${g.name}`)
    const html = `<div class="${c}"><div class="ring"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 100%;
  height: 178px;
  perspective: 800px;
}
.${c} .ring {
  position: relative;
  width: 96px;
  height: 122px;
  transform-style: preserve-3d;
  animation: ${c}-turn 14s linear infinite;
}
.${c} i {
  position: absolute;
  inset: 0;
  border-radius: 0.5rem;
  background: linear-gradient(150deg, ${g.a}, ${g.b});
  box-shadow: 0 10px 26px rgba(0,0,0,0.4);
  opacity: 0.92;
}
.${c} i:nth-child(1) { transform: rotateY(0deg) translateZ(118px); }
.${c} i:nth-child(2) { transform: rotateY(60deg) translateZ(118px); }
.${c} i:nth-child(3) { transform: rotateY(120deg) translateZ(118px); }
.${c} i:nth-child(4) { transform: rotateY(180deg) translateZ(118px); }
.${c} i:nth-child(5) { transform: rotateY(240deg) translateZ(118px); }
.${c} i:nth-child(6) { transform: rotateY(300deg) translateZ(118px); }
@keyframes ${c}-turn {
  to { transform: rotateY(-360deg); }
}`
    add(mk({
      name: `${g.name} Carousel Ring`,
      category: '3D & Perspective',
      description: `Six panels pushed out along Z at sixty-degree intervals and turned as one group, which is the whole trick behind a 3D carousel.`,
      html, css,
      tags: ['3d', 'carousel', 'ring', 'rotate', 'perspective', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  3D & PERSPECTIVE — parallax layered scene  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-3d-parallax-${t.name}`)
    const html = `<div class="${c}"><i class="back"></i><i class="mid"></i><i class="front"></i><b>DEPTH</b></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 240px;
  height: 150px;
  overflow: hidden;
  border-radius: 0.65rem;
  background: #0b1120;
  perspective: 600px;
  transform-style: preserve-3d;
}
.${c} i {
  position: absolute;
  border-radius: 50%;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.3, 1);
}
.${c} .back {
  width: 150px;
  height: 150px;
  background: rgba(${rgbOf(t.a)}, 0.3);
  filter: blur(22px);
}
.${c} .mid {
  width: 96px;
  height: 96px;
  background: rgba(${rgbOf(t.b)}, 0.45);
  filter: blur(9px);
}
.${c} .front {
  width: 52px;
  height: 52px;
  background: ${t.c};
  box-shadow: 0 0 26px ${t.c};
}
.${c} b {
  position: relative;
  z-index: 1;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.3em;
  color: #f8fafc;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.3, 1);
}
.${c}:hover .back  { transform: translate(-18px, -10px); }
.${c}:hover .mid   { transform: translate(-9px, -5px); }
.${c}:hover .front { transform: translate(9px, 5px); }
.${c}:hover b      { transform: translate(16px, 9px); }`
    add(mk({
      name: `${t.name} Parallax Scene`,
      category: '3D & Perspective',
      description: `Four layers shifted by different amounts on hover, blur increasing with distance so the depth cue is optical rather than just positional.`,
      html, css,
      tags: ['3d', 'parallax', 'layers', 'depth', 'hover', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  GLOW & NEON — neon directional arrow sign  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-neon-arrow-${g.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i><span>THIS WAY</span></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.2rem;
  border-radius: 0.5rem;
  background: #06080f;
  border: 1px solid rgba(${rgbOf(g.a)}, 0.3);
}
.${c} i {
  width: 11px;
  height: 11px;
  border-top: 2px solid ${g.a};
  border-right: 2px solid ${g.a};
  transform: rotate(45deg);
  filter: drop-shadow(0 0 5px ${g.a});
  animation: ${c}-chase 1.5s ease-in-out infinite;
}
.${c} i:nth-child(1) { animation-delay: 0s; }
.${c} i:nth-child(2) { animation-delay: 0.18s; }
.${c} i:nth-child(3) { animation-delay: 0.36s; }
.${c} span {
  margin-left: 0.35rem;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: ${g.b};
  text-shadow: 0 0 9px rgba(${rgbOf(g.b)}, 0.75);
}
@keyframes ${c}-chase {
  0%, 100% { opacity: 0.22; }
  40%      { opacity: 1; }
}`
    add(mk({
      name: `${g.name} Neon Arrow Sign`,
      category: 'Glow & Neon',
      description: `Three chevrons lighting in sequence beside a glowing label, the arrows drawn from two borders so each is a single element.`,
      html, css,
      tags: ['neon', 'arrow', 'sign', 'direction', 'chase', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  GLOW & NEON — synthwave grid horizon  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-neon-horizon-${t.name}`)
    const html = `<div class="${c}"><i class="sun"></i><i class="grid"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  border-radius: 0.7rem;
  background: linear-gradient(180deg, #12071f 0%, #2a0e3d 52%, #06080f 52%);
}
.${c} .sun {
  position: absolute;
  left: 50%;
  top: 22%;
  width: 92px;
  height: 92px;
  margin-left: -46px;
  border-radius: 50%;
  background: linear-gradient(180deg, ${t.a}, ${t.b});
  box-shadow: 0 0 46px rgba(${rgbOf(t.a)}, 0.55);
}
.${c} .grid {
  position: absolute;
  left: -50%;
  right: -50%;
  top: 52%;
  bottom: 0;
  background-image:
    repeating-linear-gradient(to right, rgba(${rgbOf(t.c)}, 0.55) 0 1px, transparent 1px 42px),
    repeating-linear-gradient(to bottom, rgba(${rgbOf(t.c)}, 0.55) 0 1px, transparent 1px 26px);
  transform: perspective(155px) rotateX(64deg);
  transform-origin: top center;
  animation: ${c}-run 1.6s linear infinite;
}
@keyframes ${c}-run {
  to { background-position: 0 26px, 0 26px; }
}`
    add(mk({
      name: `${t.name} Neon Horizon`,
      category: 'Glow & Neon',
      description: `Retro grid receding under a glowing sun, scrolled by exactly one cell so the loop is seamless and the lines appear to run forever.`,
      html, css,
      tags: ['neon', 'synthwave', 'grid', 'horizon', 'retro', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PATTERNS & TEXTURES — hexagon honeycomb  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-pat-hex-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 100%;
  height: 180px;
  border-radius: 0.7rem;
  background-color: #0b1120;
  background-image:
    radial-gradient(circle farthest-side at 0% 50%, #0b1120 23.5%, transparent 0),
    radial-gradient(circle farthest-side at 0% 50%, rgba(${rgbOf(g.a)}, 0.4) 24%, transparent 0),
    linear-gradient(rgba(${rgbOf(g.b)}, 0.35) 1px, transparent 0);
  background-size: 40px 70px, 40px 70px, 40px 35px;
  background-position: -40px -35px, 0 0, 0 0;
}`
    add(mk({
      name: `${g.name} Honeycomb`,
      category: 'Patterns & Textures',
      description: `Hexagonal lattice from two offset radial gradients and a rule — a tiling CSS cannot draw directly, faked with half-cell offsets.`,
      html, css,
      tags: ['pattern', 'hexagon', 'honeycomb', 'geometric', 'tiling', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PATTERNS & TEXTURES — circuit board traces  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-pat-circuit-${t.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 100%;
  height: 180px;
  border-radius: 0.7rem;
  background-color: #06120e;
  background-image:
    linear-gradient(90deg, rgba(${rgbOf(t.a)}, 0.35) 1px, transparent 1px),
    linear-gradient(rgba(${rgbOf(t.a)}, 0.35) 1px, transparent 1px),
    radial-gradient(circle, rgba(${rgbOf(t.b)}, 0.85) 2px, transparent 2.5px),
    radial-gradient(circle, rgba(${rgbOf(t.c)}, 0.5) 1.5px, transparent 2px);
  background-size: 46px 46px, 46px 46px, 92px 92px, 46px 46px;
  background-position: 0 0, 0 0, 23px 23px, 0 0;
  animation: ${c}-pulse 4s ease-in-out infinite;
}
@keyframes ${c}-pulse {
  50% { background-color: #08170f; }
}`
    add(mk({
      name: `${t.name} Circuit Traces`,
      category: 'Patterns & Textures',
      description: `Orthogonal tracks with solder pads at the junctions, on two grid scales so the vias land between the crossings rather than on them.`,
      html, css,
      tags: ['pattern', 'circuit', 'pcb', 'tech', 'grid', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MASKS & CLIP PATHS — wavy section edge  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-mask-wave-${g.name}`)
    const html = `<div class="${c}"><span>Section</span></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 100%;
  height: 150px;
  padding-bottom: 1.6rem;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  --wave: radial-gradient(24px at 50% 100%, transparent 98%, #000);
  -webkit-mask:
    linear-gradient(#000 0 0) top/100% calc(100% - 22px) no-repeat,
    var(--wave) bottom/48px 22px repeat-x;
  mask:
    linear-gradient(#000 0 0) top/100% calc(100% - 22px) no-repeat,
    var(--wave) bottom/48px 22px repeat-x;
}
.${c} span {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #0b1120;
}`
    add(mk({
      name: `${g.name} Wavy Edge`,
      category: 'Masks & Clip Paths',
      description: `Section whose bottom is scalloped by a repeating radial mask, so the wave is cut out of the element rather than covered by a shape on top.`,
      html, css,
      tags: ['mask', 'wave', 'section', 'scallop', 'edge', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MASKS & CLIP PATHS — iris circular reveal  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-mask-iris-${t.name}`)
    const html = `<div class="${c}"><i class="under"></i><i class="over"></i><b>HOVER</b></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 210px;
  height: 132px;
  overflow: hidden;
  border-radius: 0.6rem;
  cursor: pointer;
}
.${c} i {
  position: absolute;
  inset: 0;
}
.${c} .under {
  background: linear-gradient(140deg, ${t.a}, ${t.b});
}
.${c} .over {
  background: #0f172a;
  clip-path: circle(78% at 50% 50%);
  transition: clip-path 0.55s cubic-bezier(0.65, 0, 0.35, 1);
}
.${c} b {
  position: relative;
  z-index: 1;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  color: ${t.c};
  transition: color 0.4s ease;
}
.${c}:hover .over { clip-path: circle(0% at 50% 50%); }
.${c}:hover b { color: #0b1120; }`
    add(mk({
      name: `${t.name} Iris Reveal`,
      category: 'Masks & Clip Paths',
      description: `Cover layer collapsed to a zero-radius circle on hover, revealing the surface beneath from the centre out with no opacity crossfade.`,
      html, css,
      tags: ['clip-path', 'iris', 'reveal', 'circle', 'hover', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CHARTS & DATA — stacked area with gridlines  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-chart-area-${g.name}`)
    const html = `<div class="${c}"><header><b>Sessions</b><em>+18.2%</em></header><div class="plot"><i class="a"></i><i class="b"></i></div><footer><span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span></footer></div>`
    const css = `.${c} {
  width: 290px;
  padding: 0.9rem;
  border-radius: 0.65rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.${c} header b { font-size: 0.82rem; color: #f1f5f9; }
.${c} header em {
  font-style: normal;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${g.a};
}
.${c} .plot {
  position: relative;
  height: 96px;
  border-radius: 0.3rem;
  background-image: repeating-linear-gradient(to top, rgba(148,163,184,0.12) 0 1px, transparent 1px 24px);
}
.${c} .plot i {
  position: absolute;
  inset: 0;
}
.${c} .a {
  background: linear-gradient(180deg, rgba(${rgbOf(g.a)}, 0.45), transparent);
  clip-path: polygon(0 62%, 14% 48%, 28% 56%, 42% 34%, 57% 42%, 71% 22%, 85% 30%, 100% 12%, 100% 100%, 0 100%);
}
.${c} .b {
  background: linear-gradient(180deg, rgba(${rgbOf(g.b)}, 0.55), transparent);
  clip-path: polygon(0 80%, 14% 72%, 28% 78%, 42% 62%, 57% 68%, 71% 52%, 85% 60%, 100% 44%, 100% 100%, 0 100%);
}
.${c} footer {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
}
.${c} footer span {
  font-size: 0.64rem;
  color: #475569;
}`
    add(mk({
      name: `${g.name} Stacked Area`,
      category: 'Charts & Data',
      description: `Two series cut from gradients with \`clip-path\` over repeating gridlines, so the plot needs no SVG path and still has real axis labels.`,
      html, css,
      tags: ['chart', 'area', 'stacked', 'trend', 'analytics', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CHARTS & DATA — conversion funnel  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-chart-funnel-${t.name}`)
    const html = `<div class="${c}"><div class="s s1"><span>Visits</span><em>12,480</em></div><div class="s s2"><span>Signups</span><em>3,120</em></div><div class="s s3"><span>Trials</span><em>1,044</em></div><div class="s s4"><span>Paid</span><em>318</em></div></div>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 282px;
  padding: 0.9rem;
  border-radius: 0.65rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} .s {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  padding: 0 1rem;
  border-radius: 0.25rem;
  transition: filter 0.18s ease;
}
.${c} .s:hover { filter: brightness(1.12); }
.${c} .s1 { width: 100%; background: linear-gradient(90deg, ${t.a}, ${t.b}); }
.${c} .s2 { width: 82%;  background: linear-gradient(90deg, ${t.b}, ${t.c}); }
.${c} .s3 { width: 62%;  background: linear-gradient(90deg, ${t.c}, ${t.a}); }
.${c} .s4 { width: 42%;  background: linear-gradient(90deg, ${t.a}, ${t.c}); }
.${c} span {
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(11,17,32,0.75);
}
.${c} em {
  font-style: normal;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0b1120;
  font-variant-numeric: tabular-nums;
}`
    add(mk({
      name: `${t.name} Conversion Funnel`,
      category: 'Charts & Data',
      description: `Stage bars narrowing by percentage width with the count inside each, so the drop-off is legible without reading a single number.`,
      html, css,
      tags: ['chart', 'funnel', 'conversion', 'stages', 'analytics', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TIMELINES & STEPS — activity feed with avatars  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-time-feed-${g.name}`)
    const html = `<ol class="${c}"><li><i>AW</i><div><b>Ada</b> merged <em>fix/auth-redirect</em><span>12 minutes ago</span></div></li><li><i>PR</i><div><b>Priya</b> opened <em>#482</em><span>1 hour ago</span></div></li><li><i>JK</i><div><b>Jonas</b> deployed to <em>production</em><span>3 hours ago</span></div></li></ol>`
    const css = `.${c} {
  position: relative;
  width: 288px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.${c}::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 20px;
  bottom: 20px;
  width: 2px;
  background: linear-gradient(${g.a}, ${g.b});
  opacity: 0.35;
}
.${c} li {
  position: relative;
  display: flex;
  gap: 0.7rem;
  padding-bottom: 1rem;
}
.${c} li:last-child { padding-bottom: 0; }
.${c} i {
  flex: none;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-style: normal;
  font-size: 0.66rem;
  font-weight: 700;
  color: #0b1120;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 0 0 3px #0b1120;
}
.${c} div {
  padding-top: 0.15rem;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #94a3b8;
}
.${c} b { color: #e2e8f0; font-weight: 600; }
.${c} em {
  font-style: normal;
  padding: 0.05rem 0.3rem;
  border-radius: 0.2rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  color: ${g.b};
  background: rgba(${rgbOf(g.a)}, 0.12);
}
.${c} span {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.68rem;
  color: #475569;
}`
    add(mk({
      name: `${g.name} Activity Feed`,
      category: 'Timelines & Steps',
      description: `Event stream with avatars punched out of a connecting spine, refs set in monospace so an identifier never reads as prose.`,
      html, css,
      tags: ['timeline', 'activity', 'feed', 'avatars', 'events', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TIMELINES & STEPS — gantt-style schedule bars  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-time-gantt-${t.name}`)
    const html = `<div class="${c}"><div class="r"><span>Research</span><i class="b1"></i></div><div class="r"><span>Design</span><i class="b2"></i></div><div class="r"><span>Build</span><i class="b3"></i></div><div class="r"><span>QA</span><i class="b4"></i></div></div>`
    const css = `.${c} {
  width: 292px;
  padding: 0.9rem;
  border-radius: 0.65rem;
  background: #111827;
  border: 1px solid #1f2937;
  background-image: repeating-linear-gradient(90deg, transparent 0 calc(25% - 1px), rgba(148,163,184,0.1) calc(25% - 1px) 25%);
  background-position: 82px 0;
  background-size: calc(100% - 96px) 100%;
  background-repeat: no-repeat;
}
.${c} .r {
  display: grid;
  grid-template-columns: 70px 1fr;
  align-items: center;
  gap: 0.75rem;
}
.${c} .r + .r { margin-top: 0.6rem; }
.${c} span {
  font-size: 0.72rem;
  color: #94a3b8;
}
.${c} i {
  display: block;
  height: 16px;
  border-radius: 0.25rem;
  transition: filter 0.18s ease;
}
.${c} i:hover { filter: brightness(1.15); }
.${c} .b1 { margin-left: 0;   width: 42%; background: linear-gradient(90deg, ${t.a}, ${t.b}); }
.${c} .b2 { margin-left: 28%; width: 44%; background: linear-gradient(90deg, ${t.b}, ${t.c}); }
.${c} .b3 { margin-left: 55%; width: 45%; background: linear-gradient(90deg, ${t.c}, ${t.a}); }
.${c} .b4 { margin-left: 78%; width: 22%; background: linear-gradient(90deg, ${t.a}, ${t.c}); }`
    add(mk({
      name: `${t.name} Gantt Bars`,
      category: 'Timelines & Steps',
      description: `Schedule rows offset by margin and sized by width, over a gridline background positioned to start where the track does.`,
      html, css,
      tags: ['timeline', 'gantt', 'schedule', 'roadmap', 'project', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TABLES & DATA GRIDS — selectable rows with a bulk bar  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-table-select-${g.name}`)
    const html = `<div class="${c}"><div class="bulk"><b>2 selected</b><button>Export</button><button class="del">Delete</button></div><table><tbody><tr class="on"><td><i></i></td><td>Ada Whitfield</td><td>Owner</td></tr><tr class="on"><td><i></i></td><td>Priya Raman</td><td>Admin</td></tr><tr><td><i class="off"></i></td><td>Jonas Krieg</td><td>Member</td></tr></tbody></table></div>`
    const css = `.${c} {
  width: 292px;
  border-radius: 0.6rem;
  overflow: hidden;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} .bulk {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(${rgbOf(g.a)}, 0.12);
  border-bottom: 1px solid rgba(${rgbOf(g.a)}, 0.3);
}
.${c} .bulk b {
  flex: 1;
  font-size: 0.74rem;
  color: ${g.b};
}
.${c} .bulk button {
  padding: 0.22rem 0.6rem;
  border: 1px solid #334155;
  border-radius: 0.3rem;
  background: #111827;
  color: #cbd5e1;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.${c} .bulk button:hover { border-color: ${g.a}; color: ${g.b}; }
.${c} .bulk .del:hover { border-color: #f87171; color: #f87171; }
.${c} table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.76rem;
}
.${c} td {
  padding: 0.55rem 0.75rem;
  color: #cbd5e1;
  border-bottom: 1px solid #1f2937;
}
.${c} td:first-child { width: 30px; }
.${c} td:last-child { color: #64748b; text-align: right; }
.${c} tr:last-child td { border-bottom: none; }
.${c} .on td { background: rgba(${rgbOf(g.a)}, 0.06); }
.${c} i {
  position: relative;
  display: block;
  width: 15px;
  height: 15px;
  border-radius: 0.22rem;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c} i::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 3px;
  height: 7px;
  border: solid #0b1120;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.${c} .off {
  background: transparent;
  box-shadow: inset 0 0 0 2px #475569;
}
.${c} .off::after { display: none; }`
    add(mk({
      name: `${g.name} Selectable Table`,
      category: 'Tables & Data Grids',
      description: `Row selection with a bulk-action bar that replaces the header, and selected rows tinted so the count and the rows agree at a glance.`,
      html, css,
      tags: ['table', 'selection', 'bulk', 'checkbox', 'actions', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TABLES & DATA GRIDS — feature comparison matrix  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-table-compare-${t.name}`)
    const html = `<table class="${c}"><thead><tr><th></th><th>Free</th><th class="hi">Pro</th></tr></thead><tbody><tr><td>Projects</td><td>3</td><td class="hi">∞</td></tr><tr><td>History</td><td><i class="no"></i></td><td class="hi"><i class="yes"></i></td></tr><tr><td>SSO</td><td><i class="no"></i></td><td class="hi"><i class="yes"></i></td></tr></tbody></table>`
    const css = `.${c} {
  width: 280px;
  border-collapse: collapse;
  font-size: 0.77rem;
  border-radius: 0.55rem;
  overflow: hidden;
  background: #111827;
  box-shadow: 0 0 0 1px #1f2937;
}
.${c} th {
  padding: 0.6rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  background: #0f172a;
  border-bottom: 1px solid #1f2937;
}
.${c} th:first-child { text-align: left; padding-left: 0.8rem; }
.${c} td {
  padding: 0.55rem 0.5rem;
  text-align: center;
  color: #cbd5e1;
  border-bottom: 1px solid #1f2937;
}
.${c} td:first-child { text-align: left; padding-left: 0.8rem; color: #94a3b8; }
.${c} tr:last-child td { border-bottom: none; }
.${c} .hi {
  background: rgba(${rgbOf(t.a)}, 0.09);
  color: ${t.b};
  font-weight: 600;
}
.${c} th.hi {
  color: #0b1120;
  background: linear-gradient(90deg, ${t.a}, ${t.b});
}
.${c} i {
  display: inline-block;
  position: relative;
  width: 14px;
  height: 14px;
  vertical-align: middle;
}
.${c} .yes::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 0;
  width: 4px;
  height: 9px;
  border: solid ${t.c};
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.${c} .no::before,
.${c} .no::after {
  content: '';
  position: absolute;
  left: 1px;
  top: 6px;
  width: 12px;
  height: 2px;
  border-radius: 1px;
  background: #475569;
}
.${c} .no::before { transform: rotate(45deg); }
.${c} .no::after  { transform: rotate(-45deg); }`
    add(mk({
      name: `${t.name} Comparison Matrix`,
      category: 'Tables & Data Grids',
      description: `Plan matrix with the recommended column tinted top to bottom, and ticks and crosses drawn from borders rather than glyphs that vary by font.`,
      html, css,
      tags: ['table', 'comparison', 'pricing', 'matrix', 'features', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FORMS & VALIDATION — textarea with a character counter  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-form-counter-${g.name}`)
    const html = `<div class="${c}"><label for="${c}-t">Release note</label><textarea id="${c}-t" rows="3" readonly>Fixes the redirect loop after SSO sign-in.</textarea><footer><span>Markdown supported</span><em>42 / 280</em></footer></div>`
    const css = `.${c} {
  width: 292px;
}
.${c} label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: #cbd5e1;
}
.${c} textarea {
  display: block;
  width: 100%;
  padding: 0.6rem 0.7rem;
  border: 1px solid #334155;
  border-radius: 0.5rem 0.5rem 0 0;
  border-bottom: none;
  outline: none;
  resize: none;
  background: #111827;
  color: #f1f5f9;
  font-family: inherit;
  font-size: 0.8rem;
  line-height: 1.5;
  transition: border-color 0.18s ease;
}
.${c} textarea:focus { border-color: ${g.a}; }
.${c} footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.7rem;
  border: 1px solid #334155;
  border-radius: 0 0 0.5rem 0.5rem;
  background: #0f172a;
  transition: border-color 0.18s ease;
}
.${c} textarea:focus + footer { border-color: ${g.a}; }
.${c} span { font-size: 0.68rem; color: #475569; }
.${c} em {
  font-style: normal;
  font-size: 0.7rem;
  font-weight: 600;
  color: ${g.b};
  font-variant-numeric: tabular-nums;
}`
    add(mk({
      name: `${g.name} Counted Textarea`,
      category: 'Forms & Validation',
      description: `Field and its meta bar joined into one control by removing the shared border, both taking the focus color so they light as a unit.`,
      html, css,
      tags: ['form', 'textarea', 'counter', 'limit', 'input', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FORMS & VALIDATION — click-to-edit inline field  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-form-inline-${t.name}`)
    const html = `<div class="${c}"><span class="k">Display name</span><div class="edit"><input value="Northwind Labs" readonly><i></i></div></div>`
    const css = `.${c} {
  width: 268px;
  padding: 0.75rem 0.85rem;
  border-radius: 0.55rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} .k {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}
.${c} .edit {
  position: relative;
  display: flex;
  align-items: center;
}
.${c} input {
  flex: 1;
  padding: 0.35rem 1.7rem 0.35rem 0.45rem;
  border: 1px solid transparent;
  border-radius: 0.35rem;
  outline: none;
  background: transparent;
  color: #f1f5f9;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: text;
  transition: border-color 0.18s ease, background 0.18s ease;
}
.${c} .edit:hover input { border-color: #334155; background: #0f172a; }
.${c} input:focus {
  border-color: ${t.a};
  background: #0f172a;
  box-shadow: 0 0 0 3px rgba(${rgbOf(t.a)}, 0.16);
}
.${c} i {
  position: absolute;
  right: 0.5rem;
  width: 13px;
  height: 13px;
  border: 1.5px solid #475569;
  border-radius: 0.15rem 0.15rem 0.15rem 0;
  transform: rotate(-45deg);
  opacity: 0;
  transition: opacity 0.18s ease, border-color 0.18s ease;
  pointer-events: none;
}
.${c} .edit:hover i { opacity: 1; }
.${c} input:focus ~ i { opacity: 1; border-color: ${t.b}; }`
    add(mk({
      name: `${t.name} Inline Edit Field`,
      category: 'Forms & Validation',
      description: `Value that reads as text until hovered, when a border and a pencil appear — the settings pattern that avoids a separate edit mode.`,
      html, css,
      tags: ['form', 'inline edit', 'settings', 'field', 'hover', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SCROLL & STICKY — back-to-top floating button  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-scroll-top-${g.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><a href="#" aria-label="Back to top"><b></b></a></div>`
    const css = `.${c} {
  position: relative;
  width: 288px;
  height: 172px;
  padding: 0.9rem;
  overflow-y: auto;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
  scrollbar-width: none;
}
.${c}::-webkit-scrollbar { display: none; }
.${c} > i {
  display: block;
  height: 11px;
  margin-bottom: 0.75rem;
  border-radius: 999px;
  background: #1e293b;
}
.${c} > i:nth-child(even) { width: 68%; }
.${c} a {
  position: sticky;
  bottom: 0;
  float: right;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 8px 22px rgba(${rgbOf(g.a)}, 0.4);
  transition: transform 0.2s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.${c} a:hover { transform: translateY(-3px); }
.${c} b {
  width: 11px;
  height: 11px;
  border-top: 2.5px solid #0b1120;
  border-left: 2.5px solid #0b1120;
  transform: rotate(45deg) translate(1px, 1px);
}`
    add(mk({
      name: `${g.name} Back to Top`,
      category: 'Scroll & Sticky',
      description: `Floating return control pinned with \`position: sticky\` inside the scroller, so it needs no fixed positioning and no scroll listener.`,
      html, css,
      tags: ['scroll', 'sticky', 'back to top', 'fab', 'button', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SCROLL & STICKY — snap gallery with a counter  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-scroll-snap-${t.name}`)
    const html = `<div class="${c}"><div class="rail"><i></i><i></i><i></i><i></i></div><span>Swipe · 4 items</span></div>`
    const css = `.${c} {
  width: 288px;
}
.${c} .rail {
  display: flex;
  gap: 0.6rem;
  padding-bottom: 0.6rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
  scrollbar-color: ${t.a} #1e293b;
}
.${c} .rail::-webkit-scrollbar { height: 5px; }
.${c} .rail::-webkit-scrollbar-track { border-radius: 3px; background: #1e293b; }
.${c} .rail::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: linear-gradient(90deg, ${t.a}, ${t.b});
}
.${c} .rail i {
  flex: none;
  width: 168px;
  height: 106px;
  border-radius: 0.5rem;
  scroll-snap-align: center;
  transition: filter 0.2s ease;
}
.${c} .rail i:nth-child(1) { background: linear-gradient(140deg, ${t.a}, ${t.b}); }
.${c} .rail i:nth-child(2) { background: linear-gradient(140deg, ${t.b}, ${t.c}); }
.${c} .rail i:nth-child(3) { background: linear-gradient(140deg, ${t.c}, ${t.a}); }
.${c} .rail i:nth-child(4) { background: linear-gradient(140deg, ${t.a}, ${t.c}); }
.${c} .rail i:hover { filter: brightness(1.12); }
.${c} span {
  display: block;
  font-size: 0.68rem;
  color: #64748b;
}`
    add(mk({
      name: `${t.name} Snap Gallery`,
      category: 'Scroll & Sticky',
      description: `Horizontal rail with \`scroll-snap-align: center\`, so tiles settle centred rather than flush left and the row never stops half-way.`,
      html, css,
      tags: ['scroll', 'snap', 'gallery', 'carousel', 'horizontal', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SLIDERS & CAROUSELS — notched slider with tick labels  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-slider-notch-${g.name}`)
    const html = `<div class="${c}"><div class="track"><i></i><b></b></div><div class="ticks"><span>Free</span><span>Pro</span><span>Team</span><span>Scale</span></div></div>`
    const css = `.${c} {
  width: 282px;
}
.${c} .track {
  position: relative;
  height: 6px;
  border-radius: 3px;
  background:
    repeating-linear-gradient(90deg, transparent 0 calc(33.33% - 2px), #0b1120 calc(33.33% - 2px) calc(33.33% + 2px)),
    #1e293b;
}
.${c} i {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 66.66%;
  border-radius: 3px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}
.${c} b {
  position: absolute;
  left: 66.66%;
  top: 50%;
  width: 19px;
  height: 19px;
  margin: -9.5px 0 0 -9.5px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 3px solid ${g.b};
  cursor: grab;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}
.${c} b:hover {
  transform: scale(1.18);
  box-shadow: 0 0 0 6px rgba(${rgbOf(g.b)}, 0.18);
}
.${c} .ticks {
  display: flex;
  justify-content: space-between;
  margin-top: 0.65rem;
}
.${c} .ticks span {
  font-size: 0.68rem;
  color: #64748b;
}
.${c} .ticks span:nth-child(3) { color: ${g.b}; font-weight: 600; }`
    add(mk({
      name: `${g.name} Notched Slider`,
      category: 'Sliders & Carousels',
      description: `Discrete tier picker with the stops cut into the track by a repeating gradient, so the notches are part of the rail and cannot drift out of line.`,
      html, css,
      tags: ['slider', 'steps', 'notched', 'tiers', 'pricing', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SLIDERS & CAROUSELS — filmstrip with arrow controls  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-slider-strip-${t.name}`)
    const html = `<div class="${c}"><button class="nav">‹</button><div class="strip"><i class="on"></i><i></i><i></i><i></i><i></i></div><button class="nav r">›</button></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 288px;
  padding: 0.6rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} .nav {
  flex: none;
  width: 26px;
  height: 46px;
  display: grid;
  place-items: center;
  border: 1px solid #334155;
  border-radius: 0.35rem;
  background: #0f172a;
  color: #94a3b8;
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 0.16s ease, color 0.16s ease;
}
.${c} .nav:hover { border-color: ${t.a}; color: ${t.b}; }
.${c} .strip {
  display: flex;
  flex: 1;
  gap: 0.35rem;
  overflow: hidden;
}
.${c} .strip i {
  flex: 1;
  height: 46px;
  border-radius: 0.3rem;
  opacity: 0.45;
  cursor: pointer;
  outline: 2px solid transparent;
  outline-offset: 1px;
  transition: opacity 0.18s ease, outline-color 0.18s ease;
}
.${c} .strip i:nth-child(odd)  { background: linear-gradient(140deg, ${t.a}, ${t.b}); }
.${c} .strip i:nth-child(even) { background: linear-gradient(140deg, ${t.b}, ${t.c}); }
.${c} .strip i:hover { opacity: 0.8; }
.${c} .strip .on {
  opacity: 1;
  outline-color: ${t.c};
}`
    add(mk({
      name: `${t.name} Filmstrip`,
      category: 'Sliders & Carousels',
      description: `Thumbnail row flanked by step controls, the active frame marked with an outline so selection costs no width and the strip never shifts.`,
      html, css,
      tags: ['carousel', 'filmstrip', 'thumbnails', 'gallery', 'arrows', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ICONS & SHAPES — search-to-close morph  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-icon-morph-${g.name}`)
    const html = `<button class="${c}" aria-label="Search"><i></i><b></b></button>`
    const css = `.${c} {
  position: relative;
  width: 48px;
  height: 48px;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  background: #111827;
  cursor: pointer;
  transition: border-color 0.25s ease, background 0.25s ease;
}
.${c} i {
  position: absolute;
  left: 13px;
  top: 13px;
  width: 15px;
  height: 15px;
  border: 2px solid ${g.a};
  border-radius: 50%;
  transition: transform 0.35s cubic-bezier(0.65, 0, 0.35, 1), border-radius 0.35s ease, width 0.35s ease, height 0.35s ease, border-width 0.35s ease;
}
.${c} b {
  position: absolute;
  left: 26px;
  top: 27px;
  width: 11px;
  height: 2px;
  border-radius: 1px;
  background: ${g.b};
  transform-origin: left center;
  transform: rotate(45deg);
  transition: transform 0.35s cubic-bezier(0.65, 0, 0.35, 1), left 0.35s ease, top 0.35s ease, width 0.35s ease;
}
.${c}:hover { border-color: ${g.a}; background: #16203a; }
.${c}:hover i {
  width: 18px;
  height: 2px;
  border-width: 0;
  border-radius: 1px;
  background: ${g.a};
  transform: translate(-1px, 6px) rotate(45deg);
}
.${c}:hover b {
  left: 15px;
  top: 23px;
  width: 18px;
  transform: rotate(-45deg);
}`
    add(mk({
      name: `${g.name} Search Morph`,
      category: 'Icons & Shapes',
      description: `Magnifier whose ring flattens into a bar and whose handle counter-rotates, turning the glass into a cross without swapping any element.`,
      html, css,
      tags: ['icon', 'search', 'close', 'morph', 'transition', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ICONS & SHAPES — weather cloud with rain  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-icon-weather-${t.name}`)
    const html = `<div class="${c}"><i class="cloud"></i><b></b><b></b><b></b></div>`
    const css = `.${c} {
  position: relative;
  width: 86px;
  height: 82px;
}
.${c} .cloud {
  position: absolute;
  left: 14px;
  top: 20px;
  width: 56px;
  height: 22px;
  border-radius: 999px;
  background: linear-gradient(140deg, ${t.a}, ${t.b});
}
.${c} .cloud::before,
.${c} .cloud::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: inherit;
}
.${c} .cloud::before {
  left: 8px;
  top: -13px;
  width: 24px;
  height: 24px;
}
.${c} .cloud::after {
  right: 7px;
  top: -18px;
  width: 30px;
  height: 30px;
}
.${c} b {
  position: absolute;
  top: 46px;
  width: 3px;
  height: 11px;
  border-radius: 2px;
  background: ${t.c};
  opacity: 0;
  animation: ${c}-fall 1.5s linear infinite;
}
.${c} b:nth-of-type(1) { left: 26px; animation-delay: 0s; }
.${c} b:nth-of-type(2) { left: 41px; animation-delay: 0.35s; }
.${c} b:nth-of-type(3) { left: 56px; animation-delay: 0.7s; }
@keyframes ${c}-fall {
  0%   { opacity: 0; transform: translateY(0); }
  25%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(22px); }
}`
    add(mk({
      name: `${t.name} Rain Cloud`,
      category: 'Icons & Shapes',
      description: `Cloud built from a pill and two circles inheriting its gradient, with three drops falling on a stagger so the rain never syncs into a row.`,
      html, css,
      tags: ['icon', 'weather', 'cloud', 'rain', 'css art', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MICRO-INTERACTIONS — thumbs vote pair  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-micro-vote-${g.name}`)
    const html = `<div class="${c}"><button class="up"><i></i><span>128</span></button><button class="dn"><i></i><span>4</span></button></div>`
    const css = `.${c} {
  display: inline-flex;
  gap: 0.35rem;
  padding: 0.25rem;
  border-radius: 0.5rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.6rem;
  border: none;
  border-radius: 0.35rem;
  background: transparent;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} i {
  position: relative;
  width: 11px;
  height: 9px;
  background: currentColor;
  transition: transform 0.22s cubic-bezier(0.34, 1.55, 0.64, 1);
}
.${c} i::before {
  content: '';
  position: absolute;
  left: -3px;
  bottom: 100%;
  width: 0;
  height: 0;
  border-left: 8.5px solid transparent;
  border-right: 8.5px solid transparent;
  border-bottom: 7px solid currentColor;
}
.${c} .dn i { transform: rotate(180deg); }
.${c} .up:hover {
  color: ${g.a};
  background: rgba(${rgbOf(g.a)}, 0.12);
}
.${c} .up:hover i { transform: translateY(-3px) scale(1.1); }
.${c} .dn:hover {
  color: #f87171;
  background: rgba(248,113,113,0.12);
}
.${c} .dn:hover i { transform: rotate(180deg) translateY(-3px) scale(1.1); }`
    add(mk({
      name: `${g.name} Vote Pair`,
      category: 'Micro-interactions',
      description: `Up and down controls sharing one arrow drawn from a block and a triangle, the down variant just the same shape rotated.`,
      html, css,
      tags: ['micro', 'vote', 'thumbs', 'upvote', 'feedback', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MICRO-INTERACTIONS — emoji reaction bar  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-micro-react-${t.name}`)
    const html = `<div class="${c}"><button><i class="e1"></i><span>12</span></button><button class="on"><i class="e2"></i><span>8</span></button><button><i class="e3"></i><span>3</span></button><button class="add"><i class="plus"></i></button></div>`
    const css = `.${c} {
  display: inline-flex;
  gap: 0.3rem;
}
.${c} button {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.55rem;
  border: 1px solid #334155;
  border-radius: 999px;
  background: #111827;
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  transition: transform 0.2s cubic-bezier(0.34, 1.5, 0.64, 1), border-color 0.18s ease, background 0.18s ease;
}
.${c} button:hover { transform: translateY(-2px); border-color: #475569; }
.${c} i {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
}
.${c} .e1 { background: linear-gradient(140deg, ${t.a}, ${t.b}); }
.${c} .e2 { background: linear-gradient(140deg, ${t.b}, ${t.c}); }
.${c} .e3 { background: linear-gradient(140deg, ${t.c}, ${t.a}); }
.${c} .on {
  border-color: ${t.b};
  background: rgba(${rgbOf(t.b)}, 0.14);
  color: ${t.b};
}
.${c} .add { padding: 0.25rem 0.45rem; }
.${c} .plus {
  position: relative;
  border-radius: 0;
  background: transparent;
}
.${c} .plus::before,
.${c} .plus::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  background: currentColor;
  border-radius: 1px;
}
.${c} .plus::before { width: 10px; height: 2px; margin: -1px 0 0 -5px; }
.${c} .plus::after  { width: 2px; height: 10px; margin: -5px 0 0 -1px; }`
    add(mk({
      name: `${t.name} Reaction Bar`,
      category: 'Micro-interactions',
      description: `Count chips that lift on hover with the one you have picked tinted and outlined, plus an add control drawn as two crossed bars.`,
      html, css,
      tags: ['micro', 'reactions', 'emoji', 'chips', 'social', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FILTERS & BLEND MODES — chromatic aberration text  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v7-filter-chroma-${g.name}`)
    const html = `<span class="${c}" data-text="SIGNAL">SIGNAL</span>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  font-size: 2.3rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #e2e8f0;
  isolation: isolate;
}
.${c}::before,
.${c}::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  mix-blend-mode: screen;
}
.${c}::before {
  color: ${g.a};
  animation: ${c}-l 3.6s ease-in-out infinite;
}
.${c}::after {
  color: ${g.b};
  animation: ${c}-r 3.6s ease-in-out infinite;
}
@keyframes ${c}-l {
  0%, 100% { transform: translate(-2px, 0); }
  50%      { transform: translate(-5px, 1px); }
}
@keyframes ${c}-r {
  0%, 100% { transform: translate(2px, 0); }
  50%      { transform: translate(5px, -1px); }
}`
    add(mk({
      name: `${g.name} Chromatic Text`,
      category: 'Filters & Blend Modes',
      description: `Two coloured copies drifting apart in \`screen\` blend, so the fringes brighten where they overlap the way a real lens split does.`,
      html, css,
      tags: ['filter', 'chromatic', 'aberration', 'blend', 'glitch', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FILTERS & BLEND MODES — vignette film frame  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v7-filter-vignette-${t.name}`)
    const html = `<div class="${c}"><i class="img"></i><i class="grain"></i><i class="vig"></i><span>35mm</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: end start;
  width: 236px;
  height: 148px;
  padding: 0.7rem;
  overflow: hidden;
  border-radius: 0.55rem;
  isolation: isolate;
}
.${c} i {
  position: absolute;
  inset: 0;
}
.${c} .img {
  background: linear-gradient(145deg, ${t.a}, ${t.b}, ${t.c});
  filter: saturate(0.78) contrast(1.12) sepia(0.18);
}
.${c} .grain {
  background-image:
    repeating-conic-gradient(rgba(255,255,255,0.06) 0 0.0006turn, transparent 0 0.0012turn),
    repeating-conic-gradient(rgba(0,0,0,0.07) 0 0.0004turn, transparent 0 0.001turn);
  mix-blend-mode: overlay;
  animation: ${c}-jitter 0.6s steps(3) infinite;
}
.${c} .vig {
  background: radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(0,0,0,0.72) 100%);
}
.${c} span {
  position: relative;
  z-index: 1;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  color: rgba(248,250,252,0.85);
}
@keyframes ${c}-jitter {
  33%  { transform: translate(-1px, 1px); }
  66%  { transform: translate(1px, -1px); }
}`
    add(mk({
      name: `${t.name} Film Vignette`,
      category: 'Filters & Blend Modes',
      description: `Stacked grade, overlay grain and a radial vignette, the grain stepped in three frames so it stutters like emulsion rather than sliding.`,
      html, css,
      tags: ['filter', 'vignette', 'film', 'grain', 'analog', t.name.toLowerCase()],
    }))
  }
}
