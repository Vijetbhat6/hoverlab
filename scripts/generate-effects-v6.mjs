// scripts/generate-effects-v6.mjs
//
// Sixth wave: TWO new template families in every one of the thirty-two
// categories — twenty new effects each, 640 in total.
//
// The selection rule, and why it is not "more colorways":
//
//   Buttons already carries 198 named entries, but only six of them are
//   distinct SHAPES — the rest is one solid-fill template crossed with
//   seventeen palettes and three sizes. Loaders has nine shapes, Cards
//   eight, Dividers six. So depth in this catalog does not mean more
//   colors of what is there; it means shapes nobody has drawn yet.
//
//   Every family below is a form the catalog could not previously make:
//   the split button with its own caret segment, the pin-code field, the
//   tag input, the mega-menu panel, the sidebar rail. If a family reads as
//   a recolor of something already generated, it does not belong here.
//
// Twenty per category is `GRADPAIRS` (12) + `TRIOS` (8) — two families,
// one on each token set, which lands on exactly twenty without a partial
// loop. Tokens and helpers come from generate-effects.mjs; the dark
// preview surface and `withMotionGuard` behave as in every prior wave.
//
// Anything that animates forever gets its guard at assembly time, so
// keyframes here are written unguarded on purpose — see `withMotionGuard`
// in src/lib/effect-insights.ts and the audit in audit-motion-guard.mts.

import { rgbOf } from './generate-effects-modern.mjs'

export function generateV6(ctx) {
  const { GRADPAIRS, TRIOS, cls, mk, add } = ctx

  /* ============================================================
   *  BUTTONS — split action with a caret segment  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-btn-split-${g.name}`)
    const html = `<div class="${c}"><button>Deploy</button><button aria-label="More deploy options"><i></i></button></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: stretch;
  border-radius: 0.55rem;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(${rgbOf(g.a)}, 0.32);
}
.${c} button {
  border: none;
  cursor: pointer;
  color: #0b1120;
  font-weight: 600;
  font-size: 0.9rem;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  transition: filter 0.18s ease;
}
.${c} button:first-child {
  padding: 0.65rem 1.25rem;
}
.${c} button:last-child {
  padding: 0.65rem 0.7rem;
  display: grid;
  place-items: center;
  box-shadow: inset 1px 0 0 rgba(11,17,32,0.25);
}
.${c} button:hover {
  filter: brightness(1.08);
}
.${c} button:active {
  filter: brightness(0.94);
}
.${c} i {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid #0b1120;
  transition: transform 0.18s ease;
}
.${c} button:last-child:hover i {
  transform: translateY(1px);
}`
    add(mk({
      name: `${g.name} Split Button`,
      category: 'Buttons',
      description: `Primary action joined to its own caret segment by an inset rule, so the dropdown half is a separate target rather than a wider button.`,
      html, css,
      tags: ['button', 'split', 'dropdown', 'caret', 'action', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BUTTONS — traced conic border  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-btn-trace-${t.name}`)
    const html = `<button class="${c}"><span>Get started</span></button>`
    const css = `.${c} {
  position: relative;
  padding: 2px;
  border: none;
  border-radius: 0.6rem;
  cursor: pointer;
  background: #0f172a;
  isolation: isolate;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: -60%;
  z-index: -1;
  background: conic-gradient(from 0deg, transparent 0 55%, ${t.a}, ${t.b}, ${t.c}, transparent 100%);
  animation: ${c}-trace 3s linear infinite;
}
.${c} span {
  display: block;
  padding: 0.6rem 1.4rem;
  border-radius: 0.5rem;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.2s ease, color 0.2s ease;
}
.${c}:hover span {
  background: #1e293b;
  color: #fff;
}
@keyframes ${c}-trace {
  to { transform: rotate(360deg); }
}`
    add(mk({
      name: `${t.name} Traced Border Button`,
      category: 'Buttons',
      description: `A ${t.name.toLowerCase()} conic gradient rotating behind a solid inset face, so only the two-pixel rim reads as light travelling around the edge.`,
      html, css,
      tags: ['button', 'border', 'conic', 'animated', 'outline', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  LOADERS — determinate ring with a readable percentage  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-load-pct-${g.name}`)
    const html = `<div class="${c}" role="progressbar" aria-valuenow="68" aria-valuemin="0" aria-valuemax="100"><span>68%</span></div>`
    const css = `.${c} {
  position: relative;
  width: 68px;
  height: 68px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: conic-gradient(${g.a} 0turn 0.68turn, rgba(148,163,184,0.18) 0.68turn 1turn);
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 7px;
  border-radius: 50%;
  background: #0f172a;
}
.${c} span {
  position: relative;
  z-index: 1;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${g.b};
  font-variant-numeric: tabular-nums;
}`
    add(mk({
      name: `${g.name} Percentage Ring`,
      category: 'Loaders',
      description: `Determinate conic ring with the value printed in the middle in tabular figures, so the number does not jitter as it counts.`,
      html, css,
      tags: ['loader', 'progress', 'ring', 'determinate', 'percentage', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  LOADERS — orbiting satellites  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-load-orbit-${t.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 60px;
  height: 60px;
  animation: ${c}-spin 3s linear infinite;
}
.${c} i {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 11px;
  height: 11px;
  margin: -5.5px 0 0 -5.5px;
  border-radius: 50%;
}
.${c} i:nth-child(1) {
  background: ${t.a};
  box-shadow: 0 0 10px ${t.a};
  transform: rotate(0deg) translateX(24px);
}
.${c} i:nth-child(2) {
  background: ${t.b};
  box-shadow: 0 0 10px ${t.b};
  transform: rotate(120deg) translateX(24px);
}
.${c} i:nth-child(3) {
  background: ${t.c};
  box-shadow: 0 0 10px ${t.c};
  transform: rotate(240deg) translateX(24px);
}
@keyframes ${c}-spin {
  to { transform: rotate(360deg); }
}`
    add(mk({
      name: `${t.name} Orbit Loader`,
      category: 'Loaders',
      description: `Three ${t.name.toLowerCase()} satellites parked at 120-degree intervals and rotated as one group, so the ring keeps its spacing at any speed.`,
      html, css,
      tags: ['loader', 'orbit', 'spinner', 'dots', 'rotation', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CARDS — metric card with a CSS-drawn sparkline  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-card-spark-${g.name}`)
    const html = `<div class="${c}"><header><span>Monthly revenue</span><em>+12.4%</em></header><strong>$48,120</strong><div class="spark"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  width: 250px;
  padding: 1.1rem 1.2rem 1rem;
  border-radius: 0.9rem;
  background: #111827;
  border: 1px solid #1f2937;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
}
.${c} header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.${c} header span {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}
.${c} header em {
  font-style: normal;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.4rem;
  border-radius: 0.3rem;
  color: ${g.a};
  background: rgba(${rgbOf(g.a)}, 0.14);
}
.${c} strong {
  display: block;
  margin-top: 0.5rem;
  font-size: 1.65rem;
  font-weight: 800;
  color: #f1f5f9;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.${c} .spark {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 42px;
  margin-top: 0.85rem;
}
.${c} .spark i {
  flex: 1;
  border-radius: 2px 2px 0 0;
  background: linear-gradient(to top, rgba(${rgbOf(g.a)}, 0.25), ${g.b});
  transition: filter 0.2s ease;
}
.${c} .spark i:nth-child(1) { height: 38%; }
.${c} .spark i:nth-child(2) { height: 54%; }
.${c} .spark i:nth-child(3) { height: 44%; }
.${c} .spark i:nth-child(4) { height: 71%; }
.${c} .spark i:nth-child(5) { height: 58%; }
.${c} .spark i:nth-child(6) { height: 86%; }
.${c} .spark i:nth-child(7) { height: 74%; }
.${c} .spark i:nth-child(8) { height: 100%; }
.${c}:hover .spark i {
  filter: brightness(1.15);
}`
    add(mk({
      name: `${g.name} Sparkline Card`,
      category: 'Cards',
      description: `Metric tile with a delta pill and an eight-bar sparkline drawn in CSS, so the trend needs no charting library and no SVG.`,
      html, css,
      tags: ['card', 'metric', 'sparkline', 'dashboard', 'stat', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CARDS — profile card with a cover banner  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-card-profile-${t.name}`)
    const html = `<div class="${c}"><div class="cover"></div><div class="av">AW</div><div class="body"><strong>Ada Whitfield</strong><span>Principal Engineer</span><button>Follow</button></div></div>`
    const css = `.${c} {
  width: 230px;
  border-radius: 0.9rem;
  overflow: hidden;
  background: #111827;
  border: 1px solid #1f2937;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
}
.${c} .cover {
  height: 62px;
  background: linear-gradient(120deg, ${t.a}, ${t.b}, ${t.c});
}
.${c} .av {
  width: 54px;
  height: 54px;
  margin: -27px auto 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0b1120;
  background: linear-gradient(140deg, ${t.b}, ${t.c});
  border: 3px solid #111827;
}
.${c} .body {
  padding: 0.6rem 1rem 1.1rem;
}
.${c} .body strong {
  display: block;
  font-size: 0.95rem;
  color: #f1f5f9;
}
.${c} .body span {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.75rem;
  color: #64748b;
}
.${c} button {
  margin-top: 0.85rem;
  padding: 0.4rem 1.1rem;
  border: 1px solid ${t.a};
  border-radius: 0.4rem;
  background: transparent;
  color: ${t.a};
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.${c} button:hover {
  background: ${t.a};
  color: #0b1120;
}`
    add(mk({
      name: `${t.name} Profile Card`,
      category: 'Cards',
      description: `Cover banner with an avatar pulled up over the seam by a negative margin, so the ring sits half on the gradient and half on the body.`,
      html, css,
      tags: ['card', 'profile', 'avatar', 'banner', 'team', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TEXT — typewriter with a blinking caret  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-text-type-${g.name}`)
    const html = `<span class="${c}">Ship it faster</span>`
    const css = `.${c} {
  display: inline-block;
  font-size: 1.6rem;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  border-right: 2px solid ${g.b};
  white-space: nowrap;
  overflow: hidden;
  width: 14ch;
  animation: ${c}-type 3.4s steps(14) infinite, ${c}-caret 0.8s step-end infinite;
}
@keyframes ${c}-type {
  0%, 8% { width: 0; }
  45%, 62% { width: 14ch; }
  100% { width: 0; }
}
@keyframes ${c}-caret {
  50% { border-color: transparent; }
}`
    add(mk({
      name: `${g.name} Typewriter Text`,
      category: 'Text',
      description: `Width stepped in whole characters with \`steps()\` and a caret blinking on its own cycle, so the cursor keeps ticking while the text is paused.`,
      html, css,
      tags: ['text', 'typewriter', 'typing', 'caret', 'monospace', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TEXT — vertical word rotator  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-text-rotate-${t.name}`)
    const html = `<span class="${c}">Build <b><i>faster</i><i>better</i><i>together</i></b></span>`
    const css = `.${c} {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #e2e8f0;
}
.${c} b {
  display: inline-block;
  height: 1.5em;
  overflow: hidden;
  vertical-align: bottom;
}
.${c} i {
  display: block;
  height: 1.5em;
  line-height: 1.5em;
  font-style: normal;
  animation: ${c}-roll 6s cubic-bezier(0.85, 0, 0.15, 1) infinite;
}
.${c} i:nth-child(1) { color: ${t.a}; }
.${c} i:nth-child(2) { color: ${t.b}; }
.${c} i:nth-child(3) { color: ${t.c}; }
@keyframes ${c}-roll {
  0%, 26%   { transform: translateY(0); }
  33%, 59%  { transform: translateY(-1.5em); }
  66%, 92%  { transform: translateY(-3em); }
  100%      { transform: translateY(0); }
}`
    add(mk({
      name: `${t.name} Word Rotator`,
      category: 'Text',
      description: `A stack of words rolled behind a one-line window, holding on each long enough to read before the next snaps up.`,
      html, css,
      tags: ['text', 'rotator', 'headline', 'slide', 'words', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BACKGROUNDS — drifting mesh blobs  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-bg-mesh-${g.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 100%;
  height: 190px;
  overflow: hidden;
  border-radius: 0.75rem;
  background: #0b1120;
}
.${c} i {
  position: absolute;
  border-radius: 50%;
  filter: blur(46px);
  opacity: 0.55;
}
.${c} i:nth-child(1) {
  width: 190px;
  height: 190px;
  top: -40px;
  left: -30px;
  background: ${g.a};
  animation: ${c}-a 14s ease-in-out infinite;
}
.${c} i:nth-child(2) {
  width: 160px;
  height: 160px;
  bottom: -50px;
  right: -20px;
  background: ${g.b};
  animation: ${c}-b 17s ease-in-out infinite;
}
.${c} i:nth-child(3) {
  width: 130px;
  height: 130px;
  top: 40%;
  left: 45%;
  background: ${g.a};
  opacity: 0.32;
  animation: ${c}-c 21s ease-in-out infinite;
}
@keyframes ${c}-a {
  50% { transform: translate(70px, 45px) scale(1.18); }
}
@keyframes ${c}-b {
  50% { transform: translate(-60px, -40px) scale(0.85); }
}
@keyframes ${c}-c {
  50% { transform: translate(-45px, 55px) scale(1.3); }
}`
    add(mk({
      name: `${g.name} Mesh Gradient`,
      category: 'Backgrounds',
      description: `Three heavily blurred blobs drifting on unequal periods, so the field never visibly loops back to where it started.`,
      html, css,
      tags: ['background', 'mesh', 'gradient', 'blob', 'ambient', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BACKGROUNDS — topographic contour rings  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-bg-topo-${t.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 100%;
  height: 190px;
  border-radius: 0.75rem;
  background:
    repeating-radial-gradient(circle at 22% 30%, transparent 0 17px, rgba(${rgbOf(t.a)}, 0.16) 17px 19px),
    repeating-radial-gradient(circle at 78% 72%, transparent 0 21px, rgba(${rgbOf(t.b)}, 0.14) 21px 23px),
    linear-gradient(140deg, #0b1120, ${t.c}22 70%, #0b1120);
  background-size: 260px 260px, 300px 300px, 100% 100%;
  animation: ${c}-drift 26s linear infinite;
}
@keyframes ${c}-drift {
  to { background-position: 260px 260px, -300px 300px, 0 0; }
}`
    add(mk({
      name: `${t.name} Contour Field`,
      category: 'Backgrounds',
      description: `Two repeating radial gradients offset into contour rings, drifting in opposite directions so the map reads as terrain rather than a texture.`,
      html, css,
      tags: ['background', 'topographic', 'contour', 'lines', 'pattern', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  INPUTS & HOVER — pin / one-time code group  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-input-pin-${g.name}`)
    const html = `<div class="${c}"><input value="4" size="1" readonly><input value="8" size="1" readonly><input value="2" size="1" readonly><input placeholder="0" size="1" readonly><input placeholder="0" size="1" readonly><input placeholder="0" size="1" readonly></div>`
    const css = `.${c} {
  display: inline-flex;
  gap: 0.5rem;
}
.${c} input {
  width: 42px;
  height: 52px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: 700;
  color: #f1f5f9;
  background: #111827;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  outline: none;
  caret-color: ${g.a};
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}
.${c} input::placeholder {
  color: #334155;
}
.${c} input:not(:placeholder-shown) {
  border-color: ${g.a};
  box-shadow: inset 0 -2px 0 ${g.b};
}
.${c} input:focus {
  border-color: ${g.b};
  transform: translateY(-2px);
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.b)}, 0.22);
}`
    add(mk({
      name: `${g.name} Pin Code Field`,
      category: 'Inputs & Hover',
      description: `Six single-character boxes that mark themselves filled with \`:not(:placeholder-shown)\`, so state comes from the value rather than a class.`,
      html, css,
      tags: ['input', 'pin', 'otp', 'code', 'verification', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  INPUTS & HOVER — tag input with removable chips  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-input-tags-${t.name}`)
    const html = `<div class="${c}"><span>design<b>×</b></span><span>css<b>×</b></span><span>motion<b>×</b></span><input placeholder="Add a tag…" readonly></div>`
    const css = `.${c} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  width: 290px;
  padding: 0.5rem 0.6rem;
  background: #111827;
  border: 1px solid #334155;
  border-radius: 0.6rem;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.${c}:focus-within {
  border-color: ${t.a};
  box-shadow: 0 0 0 3px rgba(${rgbOf(t.a)}, 0.18);
}
.${c} span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.3rem 0.2rem 0.55rem;
  font-size: 0.76rem;
  font-weight: 500;
  border-radius: 0.35rem;
  color: #0b1120;
}
.${c} span:nth-of-type(1) { background: ${t.a}; }
.${c} span:nth-of-type(2) { background: ${t.b}; }
.${c} span:nth-of-type(3) { background: ${t.c}; }
.${c} b {
  display: grid;
  place-items: center;
  width: 15px;
  height: 15px;
  border-radius: 0.2rem;
  font-weight: 700;
  cursor: pointer;
  background: rgba(11,17,32,0.18);
  transition: background 0.15s ease;
}
.${c} b:hover {
  background: rgba(11,17,32,0.4);
}
.${c} input {
  flex: 1;
  min-width: 90px;
  border: none;
  outline: none;
  background: transparent;
  color: #e2e8f0;
  font-size: 0.82rem;
}
.${c} input::placeholder {
  color: #475569;
}`
    add(mk({
      name: `${t.name} Tag Input`,
      category: 'Inputs & Hover',
      description: `Chips and a flexible field sharing one bordered box, with \`:focus-within\` lighting the whole container rather than just the input.`,
      html, css,
      tags: ['input', 'tags', 'chips', 'multiselect', 'token', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  NAVIGATION & MENUS — sidebar with an active rail  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-nav-side-${g.name}`)
    const html = `<nav class="${c}"><a href="#"><i></i>Overview</a><a href="#" class="on"><i></i>Analytics</a><a href="#"><i></i>Billing</a><a href="#"><i></i>Settings</a></nav>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  width: 186px;
  padding: 0.6rem;
  border-radius: 0.7rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} a {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.7rem;
  border-radius: 0.45rem;
  font-size: 0.85rem;
  color: #94a3b8;
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease;
}
.${c} a::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 0;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(${g.a}, ${g.b});
  transform: translateY(-50%);
  transition: height 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} a i {
  width: 15px;
  height: 15px;
  border-radius: 0.25rem;
  background: currentColor;
  opacity: 0.45;
}
.${c} a:hover {
  background: #1e293b;
  color: #e2e8f0;
}
.${c} a:hover::before {
  height: 40%;
}
.${c} a.on {
  background: rgba(${rgbOf(g.a)}, 0.12);
  color: ${g.b};
}
.${c} a.on::before {
  height: 62%;
}
.${c} a.on i {
  opacity: 1;
}`
    add(mk({
      name: `${g.name} Sidebar Rail`,
      category: 'Navigation & Menus',
      description: `Vertical nav whose active marker grows from the centre out, so hover and selected read as the same gesture at two lengths.`,
      html, css,
      tags: ['nav', 'sidebar', 'rail', 'active', 'menu', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  NAVIGATION & MENUS — hover mega-menu panel  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-nav-mega-${t.name}`)
    const html = `<div class="${c}"><button>Products <i></i></button><div class="panel"><a href="#"><b>Analytics</b><span>Funnels and retention</span></a><a href="#"><b>Warehouse</b><span>Managed Postgres</span></a><a href="#"><b>Edge</b><span>Deploy in 38 regions</span></a></div></div>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding-bottom: 0.6rem;
}
.${c} > button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  border: none;
  border-radius: 0.45rem;
  background: transparent;
  color: #cbd5e1;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}
.${c}:hover > button {
  background: #1e293b;
  color: #fff;
}
.${c} > button i {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid currentColor;
  transition: transform 0.2s ease;
}
.${c}:hover > button i {
  transform: rotate(180deg);
}
.${c} .panel {
  position: absolute;
  top: 100%;
  left: 0;
  width: 250px;
  padding: 0.45rem;
  border-radius: 0.65rem;
  background: #111827;
  border: 1px solid #1f2937;
  box-shadow: 0 18px 40px rgba(0,0,0,0.5);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-6px);
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
}
.${c}:hover .panel,
.${c}:focus-within .panel {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.${c} .panel a {
  display: block;
  padding: 0.55rem 0.65rem;
  border-radius: 0.45rem;
  text-decoration: none;
  transition: background 0.15s ease;
}
.${c} .panel a:hover {
  background: #1e293b;
}
.${c} .panel b {
  display: block;
  font-size: 0.85rem;
  color: #e2e8f0;
}
.${c} .panel a:nth-child(1):hover b { color: ${t.a}; }
.${c} .panel a:nth-child(2):hover b { color: ${t.b}; }
.${c} .panel a:nth-child(3):hover b { color: ${t.c}; }
.${c} .panel span {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.73rem;
  color: #64748b;
}`
    add(mk({
      name: `${t.name} Mega Menu`,
      category: 'Navigation & Menus',
      description: `Dropdown panel opening on hover and on \`:focus-within\`, so it is reachable by keyboard, with \`visibility\` transitioned so it is not tabbable while faded out.`,
      html, css,
      tags: ['nav', 'mega menu', 'dropdown', 'panel', 'hover', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  DIVIDERS & SEPARATORS — notched chevron seam  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-div-chevron-${g.name}`)
    const html = `<div class="${c}"><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 300px;
  height: 26px;
  display: grid;
  place-items: center;
}
.${c}::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(${rgbOf(g.a)}, 0.55) 20%, rgba(${rgbOf(g.b)}, 0.55) 80%, transparent);
}
.${c} i {
  position: relative;
  width: 13px;
  height: 13px;
  border-right: 2px solid ${g.a};
  border-bottom: 2px solid ${g.b};
  transform: rotate(45deg) translate(-2px, -2px);
  background: #0b1120;
  box-shadow: 0 0 0 6px #0b1120;
}`
    add(mk({
      name: `${g.name} Chevron Divider`,
      category: 'Dividers & Separators',
      description: `A rule interrupted by a rotated chevron, punched out of the line with a solid box-shadow rather than a background swatch that has to match.`,
      html, css,
      tags: ['divider', 'chevron', 'separator', 'rule', 'section', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  DIVIDERS & SEPARATORS — double rule with a centred node  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-div-node-${t.name}`)
    const html = `<div class="${c}"><span></span></div>`
    const css = `.${c} {
  position: relative;
  width: 300px;
  height: 22px;
  display: grid;
  place-items: center;
}
.${c}::before,
.${c}::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, ${t.a}, ${t.b}, ${t.c}, transparent);
  opacity: 0.5;
}
.${c}::before { top: 8px; }
.${c}::after  { bottom: 8px; }
.${c} span {
  position: relative;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${t.b};
  box-shadow: 0 0 0 4px #0b1120, 0 0 12px ${t.b};
}`
    add(mk({
      name: `${t.name} Double Rule Divider`,
      category: 'Dividers & Separators',
      description: `Two hairlines bracketing a glowing node, spaced far enough apart to read as a deliberate seam rather than a doubled border.`,
      html, css,
      tags: ['divider', 'double', 'node', 'separator', 'ornament', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BADGES & TAGS — count badge on a carrier icon  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-badge-count-${g.name}`)
    const html = `<span class="${c}"><i></i><b>7</b></span>`
    const css = `.${c} {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 0.6rem;
  background: #1e293b;
  border: 1px solid #334155;
}
.${c} i {
  width: 19px;
  height: 15px;
  border: 2px solid #94a3b8;
  border-radius: 0.2rem;
}
.${c} i::after {
  content: '';
  display: block;
  width: 100%;
  height: 7px;
  border-bottom: 2px solid #94a3b8;
  transform: skewY(-14deg);
  transform-origin: left;
}
.${c} b {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  display: grid;
  place-items: center;
  font-size: 0.68rem;
  font-weight: 700;
  color: #0b1120;
  border-radius: 999px;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  border: 2px solid #0b1120;
  box-shadow: 0 0 10px rgba(${rgbOf(g.a)}, 0.5);
}`
    add(mk({
      name: `${g.name} Count Badge`,
      category: 'Badges & Tags',
      description: `Unread counter pinned to the corner of a carrier tile, with a background-colored ring so it stays legible over whatever sits beneath it.`,
      html, css,
      tags: ['badge', 'count', 'notification', 'unread', 'indicator', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BADGES & TAGS — ribbon with a folded tail  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-badge-ribbon-${t.name}`)
    const html = `<span class="${c}">Best value</span>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding: 0.38rem 1.4rem 0.38rem 0.9rem;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #0b1120;
  background: linear-gradient(90deg, ${t.a}, ${t.b});
  clip-path: polygon(0 0, 100% 0, calc(100% - 11px) 50%, 100% 100%, 0 100%);
  filter: drop-shadow(0 4px 10px rgba(${rgbOf(t.a)}, 0.35));
}
.${c}::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: ${t.c};
}`
    add(mk({
      name: `${t.name} Ribbon Badge`,
      category: 'Badges & Tags',
      description: `Notched banner cut with \`clip-path\` and given a drop-shadow rather than a box-shadow, so the shade follows the arrow instead of boxing it.`,
      html, css,
      tags: ['badge', 'ribbon', 'label', 'clip-path', 'pricing', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOGGLES & SWITCHES — labelled on/off track  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-toggle-label-${g.name}`)
    const html = `<label class="${c}"><input type="checkbox" checked><span><em>ON</em><em>OFF</em><i></i></span></label>`
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
  display: flex;
  align-items: center;
  width: 82px;
  height: 34px;
  border-radius: 999px;
  background: #334155;
  transition: background 0.25s ease;
}
.${c} em {
  flex: 1;
  font-style: normal;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-align: center;
  transition: opacity 0.25s ease;
}
.${c} em:nth-of-type(1) { color: #0b1120; opacity: 0; }
.${c} em:nth-of-type(2) { color: #94a3b8; opacity: 1; }
.${c} i {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e2e8f0;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} input:checked + span {
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}
.${c} input:checked + span em:nth-of-type(1) { opacity: 1; }
.${c} input:checked + span em:nth-of-type(2) { opacity: 0; }
.${c} input:checked + span i {
  transform: translateX(48px);
}
.${c} input:focus-visible + span {
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.b)}, 0.4);
}`
    add(mk({
      name: `${g.name} Labelled Switch`,
      category: 'Toggles & Switches',
      description: `Track carrying its own ON and OFF words, cross-faded rather than translated, with a real checkbox behind it so it keeps focus and keyboard toggling.`,
      html, css,
      tags: ['toggle', 'switch', 'label', 'checkbox', 'on off', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOGGLES & SWITCHES — segmented radio group  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-toggle-seg-${t.name}`)
    const html = `<div class="${c}"><input type="radio" name="${c}" id="${c}-d" checked><label for="${c}-d">Day</label><input type="radio" name="${c}" id="${c}-w"><label for="${c}-w">Week</label><input type="radio" name="${c}" id="${c}-m"><label for="${c}-m">Month</label></div>`
    const css = `.${c} {
  display: inline-flex;
  padding: 3px;
  border-radius: 0.55rem;
  background: #111827;
  border: 1px solid #334155;
}
.${c} input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.${c} label {
  padding: 0.42rem 1rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.${c} label:hover {
  color: #cbd5e1;
}
.${c} input:nth-of-type(1):checked + label { background: ${t.a}; color: #0b1120; }
.${c} input:nth-of-type(2):checked + label { background: ${t.b}; color: #0b1120; }
.${c} input:nth-of-type(3):checked + label { background: ${t.c}; color: #0b1120; }
.${c} input:focus-visible + label {
  box-shadow: 0 0 0 2px #0b1120, 0 0 0 4px ${t.b};
}`
    add(mk({
      name: `${t.name} Segmented Control`,
      category: 'Toggles & Switches',
      description: `Three exclusive options as real radios, so arrow keys move between segments — a row of buttons would need a Tab stop each.`,
      html, css,
      tags: ['toggle', 'segmented', 'radio', 'tabs', 'range', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOOLTIPS & POPOVERS — keyboard shortcut hint  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-tip-kbd-${g.name}`)
    const html = `<span class="${c}"><button>Search</button><span class="tip">Open palette <kbd>⌘</kbd><kbd>K</kbd></span></span>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
}
.${c} > button {
  padding: 0.5rem 1.1rem;
  border: 1px solid #334155;
  border-radius: 0.45rem;
  background: #1e293b;
  color: #cbd5e1;
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.${c}:hover > button {
  border-color: ${g.a};
}
.${c} .tip {
  position: absolute;
  bottom: calc(100% + 9px);
  left: 50%;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.45rem 0.6rem;
  white-space: nowrap;
  font-size: 0.75rem;
  color: #e2e8f0;
  background: #0b1120;
  border: 1px solid rgba(${rgbOf(g.a)}, 0.4);
  border-radius: 0.45rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  opacity: 0;
  visibility: hidden;
  transform: translate(-50%, 4px);
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
}
.${c} .tip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border: 5px solid transparent;
  border-top-color: #0b1120;
}
.${c}:hover .tip,
.${c}:focus-within .tip {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, 0);
}
.${c} kbd {
  padding: 0.1rem 0.35rem;
  font-size: 0.68rem;
  font-family: inherit;
  color: ${g.b};
  background: #1e293b;
  border: 1px solid #334155;
  border-bottom-width: 2px;
  border-radius: 0.25rem;
}`
    add(mk({
      name: `${g.name} Shortcut Tooltip`,
      category: 'Tooltips & Popovers',
      description: `Hint showing its own key binding in real \`<kbd>\` elements, opening on hover and focus so the shortcut is discoverable from the keyboard too.`,
      html, css,
      tags: ['tooltip', 'shortcut', 'keyboard', 'kbd', 'hint', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOOLTIPS & POPOVERS — guided coach mark  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-tip-coach-${t.name}`)
    const html = `<div class="${c}"><span class="dot"></span><div class="pop"><b>New: saved views</b><p>Pin a filter set and it will be waiting next time.</p><footer><em>2 of 4</em><button>Next</button></footer></div></div>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding: 14px;
}
.${c} .dot {
  display: block;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: ${t.a};
  box-shadow: 0 0 0 0 rgba(${rgbOf(t.a)}, 0.55);
  animation: ${c}-ping 2s ease-out infinite;
}
.${c} .pop {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  width: 232px;
  transform: translateX(-50%);
  padding: 0.8rem 0.9rem;
  text-align: left;
  background: #111827;
  border: 1px solid ${t.b};
  border-radius: 0.6rem;
  box-shadow: 0 18px 40px rgba(0,0,0,0.55);
}
.${c} .pop b {
  font-size: 0.85rem;
  color: #f1f5f9;
}
.${c} .pop p {
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #94a3b8;
}
.${c} footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
}
.${c} footer em {
  font-style: normal;
  font-size: 0.7rem;
  color: #64748b;
}
.${c} footer button {
  padding: 0.3rem 0.8rem;
  border: none;
  border-radius: 0.35rem;
  font-size: 0.74rem;
  font-weight: 600;
  color: #0b1120;
  cursor: pointer;
  background: linear-gradient(90deg, ${t.b}, ${t.c});
}
@keyframes ${c}-ping {
  70%, 100% { box-shadow: 0 0 0 13px rgba(${rgbOf(t.a)}, 0); }
}`
    add(mk({
      name: `${t.name} Coach Mark`,
      category: 'Tooltips & Popovers',
      description: `Product-tour callout anchored to a pinging hotspot, with step counter and advance button — the shape a first-run walkthrough actually needs.`,
      html, css,
      tags: ['popover', 'coach mark', 'onboarding', 'tour', 'hotspot', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SKELETONS & SHIMMERS — table row placeholder  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-skel-table-${g.name}`)
    const html = `<div class="${c}"><div class="row"><i class="a"></i><i class="b"></i><i class="c"></i></div><div class="row"><i class="a"></i><i class="b"></i><i class="c"></i></div><div class="row"><i class="a"></i><i class="b"></i><i class="c"></i></div></div>`
    const css = `.${c} {
  width: 300px;
  padding: 0.6rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} .row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.4rem;
}
.${c} .row + .row {
  border-top: 1px solid #1f2937;
}
.${c} i {
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, #1e293b 25%, rgba(${rgbOf(g.a)}, 0.35) 50%, #1e293b 75%);
  background-size: 240px 100%;
  animation: ${c}-sweep 1.5s linear infinite;
}
.${c} .a { width: 26px; height: 26px; border-radius: 0.35rem; flex: none; }
.${c} .b { flex: 1; }
.${c} .c { width: 52px; flex: none; }
.${c} .row:nth-child(2) i { animation-delay: 0.12s; }
.${c} .row:nth-child(3) i { animation-delay: 0.24s; }
@keyframes ${c}-sweep {
  to { background-position: 240px 0; }
}`
    add(mk({
      name: `${g.name} Table Skeleton`,
      category: 'Skeletons & Shimmers',
      description: `Three placeholder rows whose sweeps are staggered by a tenth of a second, so the list reads as loading top-down instead of pulsing as one block.`,
      html, css,
      tags: ['skeleton', 'table', 'row', 'shimmer', 'loading', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SKELETONS & SHIMMERS — article placeholder  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-skel-article-${t.name}`)
    const html = `<div class="${c}"><i class="img"></i><i class="h"></i><i class="l"></i><i class="l"></i><i class="s"></i></div>`
    const css = `.${c} {
  width: 250px;
  padding: 0.85rem;
  border-radius: 0.7rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} i {
  display: block;
  border-radius: 0.3rem;
  background: linear-gradient(110deg, #1e293b 8%, rgba(${rgbOf(t.b)}, 0.28) 18%, #1e293b 33%);
  background-size: 220% 100%;
  animation: ${c}-glide 1.6s ease-in-out infinite;
}
.${c} .img { height: 92px; border-radius: 0.45rem; }
.${c} .h { height: 15px; width: 72%; margin-top: 0.8rem; }
.${c} .l { height: 9px; margin-top: 0.5rem; }
.${c} .s { height: 9px; width: 45%; margin-top: 0.5rem; }
.${c} .h { animation-delay: 0.1s; }
.${c} .l:nth-of-type(3) { animation-delay: 0.2s; }
.${c} .l:nth-of-type(4) { animation-delay: 0.3s; }
.${c} .s { animation-delay: 0.4s; }
@keyframes ${c}-glide {
  to { background-position: -180% 0; }
}`
    add(mk({
      name: `${t.name} Article Skeleton`,
      category: 'Skeletons & Shimmers',
      description: `Thumbnail, headline and three ragged text lines, sized to the article card it stands in for so nothing jumps when the content lands.`,
      html, css,
      tags: ['skeleton', 'article', 'card', 'placeholder', 'loading', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ENTRANCE ANIMATIONS — clip-path wipe in  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-enter-wipe-${g.name}`)
    const html = `<div class="${c}"><span>Now available</span></div>`
    const css = `.${c} {
  display: inline-block;
  padding: 0.85rem 1.6rem;
  border-radius: 0.6rem;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  animation: ${c}-wipe 2.6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
.${c} span {
  font-size: 1rem;
  font-weight: 700;
  color: #0b1120;
  display: inline-block;
  animation: ${c}-lift 2.6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
@keyframes ${c}-wipe {
  0%, 6%    { clip-path: inset(0 100% 0 0); }
  38%, 80%  { clip-path: inset(0 0 0 0); }
  100%      { clip-path: inset(0 0 0 100%); }
}
@keyframes ${c}-lift {
  0%, 10%   { transform: translateY(8px); opacity: 0; }
  42%, 80%  { transform: translateY(0); opacity: 1; }
  100%      { transform: translateY(-6px); opacity: 0; }
}`
    add(mk({
      name: `${g.name} Wipe Entrance`,
      category: 'Entrance Animations',
      description: `Container revealed by an inset clip while the label lifts on its own curve, so the box and its contents arrive a beat apart.`,
      html, css,
      tags: ['entrance', 'wipe', 'clip-path', 'reveal', 'animation', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ENTRANCE ANIMATIONS — 3D card deal-in  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-enter-deal-${t.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.6rem;
  perspective: 700px;
}
.${c} i {
  width: 62px;
  height: 84px;
  border-radius: 0.5rem;
  transform-origin: bottom center;
  animation: ${c}-deal 3s cubic-bezier(0.2, 0.9, 0.3, 1) infinite;
}
.${c} i:nth-child(1) { background: linear-gradient(150deg, ${t.a}, ${t.b}); animation-delay: 0s; }
.${c} i:nth-child(2) { background: linear-gradient(150deg, ${t.b}, ${t.c}); animation-delay: 0.16s; }
.${c} i:nth-child(3) { background: linear-gradient(150deg, ${t.c}, ${t.a}); animation-delay: 0.32s; }
@keyframes ${c}-deal {
  0%, 4%   { opacity: 0; transform: rotateX(-70deg) translateY(26px); }
  30%, 78% { opacity: 1; transform: rotateX(0) translateY(0); }
  100%     { opacity: 0; transform: rotateX(20deg) translateY(-14px); }
}`
    add(mk({
      name: `${t.name} Card Deal-In`,
      category: 'Entrance Animations',
      description: `Three tiles hinged from their bottom edge and dealt in on a stagger, with the perspective on the parent so they share one vanishing point.`,
      html, css,
      tags: ['entrance', '3d', 'stagger', 'cards', 'rotate', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BORDERS & OUTLINES — inset double frame  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-border-double-${g.name}`)
    const html = `<div class="${c}"><span>Certified</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 190px;
  height: 96px;
  border: 2px solid ${g.a};
  border-radius: 0.4rem;
  background: #0f172a;
  transition: border-color 0.25s ease;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(${rgbOf(g.b)}, 0.55);
  border-radius: 0.2rem;
  transition: inset 0.25s ease, border-color 0.25s ease;
}
.${c} span {
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${g.b};
}
.${c}:hover {
  border-color: ${g.b};
}
.${c}:hover::before {
  inset: 10px;
  border-color: ${g.a};
}`
    add(mk({
      name: `${g.name} Double Frame`,
      category: 'Borders & Outlines',
      description: `Outer border with an inset rule that pulls further in on hover, so the frame breathes without the box itself resizing.`,
      html, css,
      tags: ['border', 'double', 'frame', 'inset', 'certificate', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BORDERS & OUTLINES — dashed offset shadow frame  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-border-offset-${t.name}`)
    const html = `<div class="${c}"><span>Drop files here</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 210px;
  height: 104px;
  border: 2px dashed ${t.a};
  border-radius: 0.55rem;
  background: #0f172a;
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid ${t.c};
  border-radius: 0.55rem;
  transform: translate(7px, 7px);
  z-index: -1;
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.${c} span {
  font-size: 0.82rem;
  color: #94a3b8;
}
.${c}:hover {
  transform: translate(3px, 3px);
  border-color: ${t.b};
}
.${c}:hover::after {
  transform: translate(0, 0);
  border-color: ${t.a};
}`
    add(mk({
      name: `${t.name} Offset Frame`,
      category: 'Borders & Outlines',
      description: `A dashed box over a solid one offset behind it; on hover the two close the gap, so the whole thing reads as pressing down.`,
      html, css,
      tags: ['border', 'offset', 'dashed', 'neobrutalism', 'dropzone', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PROGRESS & METERS — multi-step bar with nodes  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-prog-steps-${g.name}`)
    const html = `<div class="${c}"><i class="done"></i><i class="done"></i><i class="now"></i><i></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  width: 280px;
}
.${c} i {
  position: relative;
  flex: 1;
  height: 4px;
  background: #1e293b;
}
.${c} i::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 50%;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #1e293b;
  border: 2px solid #0b1120;
  transform: translateY(-50%);
  z-index: 1;
}
.${c} i:first-child { border-radius: 3px 0 0 3px; }
.${c} .done { background: linear-gradient(90deg, ${g.a}, ${g.b}); }
.${c} .done::after { background: ${g.b}; }
.${c} .now {
  background: linear-gradient(90deg, ${g.b} 50%, #1e293b 50%);
}
.${c} .now::after {
  background: #0b1120;
  box-shadow: inset 0 0 0 2px ${g.b}, 0 0 0 4px rgba(${rgbOf(g.b)}, 0.2);
  animation: ${c}-pulse 1.9s ease-in-out infinite;
}
@keyframes ${c}-pulse {
  50% { box-shadow: inset 0 0 0 2px ${g.b}, 0 0 0 8px rgba(${rgbOf(g.b)}, 0.05); }
}`
    add(mk({
      name: `${g.name} Step Progress Bar`,
      category: 'Progress & Meters',
      description: `Segmented track with nodes at each boundary, the current leg half-filled and its node pulsing — progress and position in one control.`,
      html, css,
      tags: ['progress', 'steps', 'stepper', 'nodes', 'checkout', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PROGRESS & METERS — half-circle gauge  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-prog-gauge-${t.name}`)
    const html = `<div class="${c}"><span>72</span><em>score</em></div>`
    const css = `.${c} {
  position: relative;
  width: 150px;
  height: 78px;
  overflow: hidden;
  text-align: center;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 150px 150px 0 0;
  background: conic-gradient(from 270deg, ${t.a} 0deg, ${t.b} 65deg, ${t.c} 130deg, #1e293b 130deg 180deg);
}
.${c}::after {
  content: '';
  position: absolute;
  left: 17px;
  right: 17px;
  bottom: 0;
  top: 17px;
  border-radius: 120px 120px 0 0;
  background: #0b1120;
}
.${c} span {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  z-index: 1;
  font-size: 1.5rem;
  font-weight: 800;
  color: #f1f5f9;
  font-variant-numeric: tabular-nums;
}
.${c} em {
  position: absolute;
  bottom: 2px;
  left: 0;
  right: 0;
  z-index: 1;
  font-style: normal;
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #64748b;
}`
    add(mk({
      name: `${t.name} Half Gauge`,
      category: 'Progress & Meters',
      description: `Semicircular dial built from one conic gradient masked by an inner arc, with the reading in tabular figures so it holds still as it changes.`,
      html, css,
      tags: ['gauge', 'meter', 'semicircle', 'score', 'dial', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  AVATARS & IMAGES — image with a sliding caption bar  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-img-caption-${g.name}`)
    const html = `<figure class="${c}"><figcaption><b>Northern light</b><span>Tromsø, 2026</span></figcaption></figure>`
    const css = `.${c} {
  position: relative;
  width: 210px;
  height: 145px;
  margin: 0;
  overflow: hidden;
  border-radius: 0.65rem;
  background: linear-gradient(145deg, ${g.a}, ${g.b});
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 70% 25%, rgba(255,255,255,0.28), transparent 55%);
  transition: transform 0.4s ease;
}
.${c}:hover::before {
  transform: scale(1.15);
}
.${c} figcaption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0.75rem 0.85rem;
  background: linear-gradient(to top, rgba(11,17,32,0.92), transparent);
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c}:hover figcaption {
  transform: translateY(0);
}
.${c} b {
  display: block;
  font-size: 0.85rem;
  color: #f8fafc;
}
.${c} span {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.7rem;
  color: #cbd5e1;
}`
    add(mk({
      name: `${g.name} Caption Slide`,
      category: 'Avatars & Images',
      description: `Media tile whose caption bar slides up from below the frame on hover while the highlight drifts, marked up as a real figure and figcaption.`,
      html, css,
      tags: ['image', 'caption', 'hover', 'figure', 'gallery', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  AVATARS & IMAGES — segmented story ring  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-avatar-story-${t.name}`)
    const html = `<div class="${c}"><span>AW</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background:
    conic-gradient(#0b1120 0 3deg, transparent 3deg 87deg, #0b1120 87deg 93deg, transparent 93deg 177deg, #0b1120 177deg 183deg, transparent 183deg 267deg, #0b1120 267deg 273deg, transparent 273deg 357deg, #0b1120 357deg 360deg),
    conic-gradient(${t.a}, ${t.b}, ${t.c}, ${t.a});
  animation: ${c}-turn 7s linear infinite;
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: #0b1120;
}
.${c} span {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0b1120;
  background: linear-gradient(140deg, ${t.b}, ${t.c});
  animation: ${c}-steady 7s linear infinite;
}
@keyframes ${c}-turn {
  to { transform: rotate(360deg); }
}
@keyframes ${c}-steady {
  to { transform: rotate(-360deg); }
}`
    add(mk({
      name: `${t.name} Story Ring Avatar`,
      category: 'Avatars & Images',
      description: `Four-segment ring turning around the avatar while the face counter-rotates at the same rate, so the initials stay upright.`,
      html, css,
      tags: ['avatar', 'story', 'ring', 'segmented', 'social', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MODALS & OVERLAYS — side drawer with a scrim  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-modal-drawer-${g.name}`)
    const html = `<div class="${c}"><div class="scrim"></div><aside><header><b>Filters</b><button aria-label="Close">×</button></header><i></i><i></i><i class="s"></i><button class="cta">Apply</button></aside></div>`
    const css = `.${c} {
  position: relative;
  width: 300px;
  height: 190px;
  overflow: hidden;
  border-radius: 0.65rem;
  background: #0f172a;
}
.${c} .scrim {
  position: absolute;
  inset: 0;
  background: rgba(2,6,23,0.6);
  backdrop-filter: blur(2px);
}
.${c} aside {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 178px;
  padding: 0.8rem;
  background: #111827;
  border-left: 1px solid rgba(${rgbOf(g.a)}, 0.35);
  box-shadow: -18px 0 40px rgba(0,0,0,0.5);
  animation: ${c}-slide 3.4s cubic-bezier(0.32, 0.72, 0, 1) infinite;
}
.${c} header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}
.${c} header b {
  font-size: 0.85rem;
  color: #f1f5f9;
}
.${c} header button {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 0.25rem;
  background: #1e293b;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}
.${c} aside i {
  display: block;
  height: 9px;
  margin-bottom: 0.55rem;
  border-radius: 999px;
  background: #1e293b;
}
.${c} aside .s { width: 55%; }
.${c} .cta {
  width: 100%;
  margin-top: 0.6rem;
  padding: 0.45rem;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #0b1120;
  cursor: pointer;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}
@keyframes ${c}-slide {
  0%, 8%   { transform: translateX(100%); }
  30%, 82% { transform: translateX(0); }
  100%     { transform: translateX(100%); }
}`
    add(mk({
      name: `${g.name} Side Drawer`,
      category: 'Modals & Overlays',
      description: `Panel sliding in over a blurred scrim on a decelerating curve, so it settles rather than stopping dead at the edge.`,
      html, css,
      tags: ['modal', 'drawer', 'sheet', 'overlay', 'panel', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MODALS & OVERLAYS — lightbox with thumbnail strip  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-modal-lightbox-${t.name}`)
    const html = `<div class="${c}"><div class="stage"><button class="nav">‹</button><button class="nav r">›</button></div><div class="strip"><i class="on"></i><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  width: 280px;
  padding: 0.7rem;
  border-radius: 0.7rem;
  background: rgba(2,6,23,0.92);
  border: 1px solid #1f2937;
  backdrop-filter: blur(6px);
}
.${c} .stage {
  position: relative;
  height: 132px;
  border-radius: 0.5rem;
  background: linear-gradient(140deg, ${t.a}, ${t.b}, ${t.c});
}
.${c} .nav {
  position: absolute;
  top: 50%;
  left: 8px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  transform: translateY(-50%);
  border: none;
  border-radius: 50%;
  background: rgba(2,6,23,0.55);
  color: #f8fafc;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.18s ease;
}
.${c} .nav.r { left: auto; right: 8px; }
.${c} .nav:hover { background: rgba(2,6,23,0.85); }
.${c} .strip {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.6rem;
}
.${c} .strip i {
  flex: 1;
  height: 34px;
  border-radius: 0.3rem;
  background: linear-gradient(140deg, ${t.b}, ${t.c});
  opacity: 0.4;
  cursor: pointer;
  transition: opacity 0.2s ease, outline-color 0.2s ease;
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.${c} .strip i:hover { opacity: 0.75; }
.${c} .strip .on {
  opacity: 1;
  outline-color: ${t.a};
}`
    add(mk({
      name: `${t.name} Lightbox`,
      category: 'Modals & Overlays',
      description: `Gallery overlay with prev/next controls and a thumbnail strip whose active frame is marked with an outline, so selection costs no layout.`,
      html, css,
      tags: ['modal', 'lightbox', 'gallery', 'overlay', 'carousel', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ALERTS & TOASTS — inline form validation message  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-alert-inline-${g.name}`)
    const html = `<div class="${c}" role="alert"><i></i><div><b>Check your card number</b><span>The number you entered is 15 digits, not 16.</span></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  width: 300px;
  padding: 0.75rem 0.85rem;
  border-radius: 0.55rem;
  background: rgba(${rgbOf(g.a)}, 0.1);
  border: 1px solid rgba(${rgbOf(g.a)}, 0.35);
  border-left-width: 3px;
  border-left-color: ${g.a};
}
.${c} i {
  flex: none;
  width: 17px;
  height: 17px;
  margin-top: 1px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: ${g.a};
  position: relative;
}
.${c} i::after {
  content: '!';
  font-size: 0.68rem;
  font-weight: 800;
  color: #0b1120;
}
.${c} b {
  display: block;
  font-size: 0.8rem;
  color: ${g.b};
}
.${c} span {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.74rem;
  line-height: 1.45;
  color: #94a3b8;
}`
    add(mk({
      name: `${g.name} Inline Alert`,
      category: 'Alerts & Toasts',
      description: `Field-level message that says what is wrong and what to do about it, keyed by a thick left rule so it scans as attached to the input above.`,
      html, css,
      tags: ['alert', 'validation', 'inline', 'error', 'form', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ALERTS & TOASTS — undo toast with an action  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-alert-undo-${t.name}`)
    const html = `<div class="${c}" role="status"><span>Message archived</span><button>Undo</button><div class="bar"></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.7rem 0.9rem;
  overflow: hidden;
  border-radius: 0.55rem;
  background: #111827;
  border: 1px solid #1f2937;
  box-shadow: 0 12px 30px rgba(0,0,0,0.45);
}
.${c} span {
  font-size: 0.82rem;
  color: #e2e8f0;
}
.${c} button {
  padding: 0.25rem 0.7rem;
  border: 1px solid ${t.a};
  border-radius: 0.35rem;
  background: transparent;
  color: ${t.a};
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}
.${c} button:hover {
  background: ${t.a};
  color: #0b1120;
}
.${c} .bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 100%;
  transform-origin: left;
  background: linear-gradient(90deg, ${t.a}, ${t.b}, ${t.c});
  animation: ${c}-drain 5s linear infinite;
}
@keyframes ${c}-drain {
  to { transform: scaleX(0); }
}`
    add(mk({
      name: `${t.name} Undo Toast`,
      category: 'Alerts & Toasts',
      description: `Confirmation carrying its own reversal, with a timer bar draining by \`scaleX\` so the countdown animates on the compositor rather than on width.`,
      html, css,
      tags: ['toast', 'undo', 'action', 'snackbar', 'timer', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ACCORDIONS & TABS — FAQ list with a plus/minus marker  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-acc-faq-${g.name}`)
    const html = `<div class="${c}"><details open><summary>Can I cancel anytime?<i></i></summary><p>Yes — cancel from the billing page and access runs to the end of the period.</p></details><details><summary>Do you offer refunds?<i></i></summary><p>Thirty days, no questions asked.</p></details></div>`
    const css = `.${c} {
  width: 300px;
  border-radius: 0.6rem;
  overflow: hidden;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} details + details {
  border-top: 1px solid #1f2937;
}
.${c} summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  padding: 0.8rem 0.9rem;
  font-size: 0.84rem;
  font-weight: 500;
  color: #e2e8f0;
  cursor: pointer;
  list-style: none;
  transition: color 0.18s ease;
}
.${c} summary::-webkit-details-marker { display: none; }
.${c} summary:hover { color: ${g.b}; }
.${c} i {
  position: relative;
  flex: none;
  width: 15px;
  height: 15px;
}
.${c} i::before,
.${c} i::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  margin-top: -1px;
  border-radius: 1px;
  background: ${g.a};
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} i::after { transform: rotate(90deg); }
.${c} details[open] i::after { transform: rotate(0deg); }
.${c} p {
  margin: 0;
  padding: 0 0.9rem 0.85rem;
  font-size: 0.78rem;
  line-height: 1.55;
  color: #94a3b8;
}`
    add(mk({
      name: `${g.name} FAQ Accordion`,
      category: 'Accordions & Tabs',
      description: `Native \`<details>\` rows whose plus collapses to a minus by rotating one bar — open state comes from the element, so it works without script.`,
      html, css,
      tags: ['accordion', 'faq', 'details', 'disclosure', 'toggle', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ACCORDIONS & TABS — tabs with a badge counter  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-tabs-badge-${t.name}`)
    const html = `<div class="${c}"><input type="radio" name="${c}" id="${c}-1" checked><label for="${c}-1">Inbox <b>12</b></label><input type="radio" name="${c}" id="${c}-2"><label for="${c}-2">Drafts <b>3</b></label><input type="radio" name="${c}" id="${c}-3"><label for="${c}-3">Sent</label></div>`
    const css = `.${c} {
  display: inline-flex;
  gap: 0.2rem;
  padding-bottom: 2px;
  border-bottom: 1px solid #1f2937;
}
.${c} input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.${c} label {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  font-size: 0.83rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: color 0.2s ease;
}
.${c} label::after {
  content: '';
  position: absolute;
  left: 0.6rem;
  right: 0.6rem;
  bottom: -3px;
  height: 2px;
  border-radius: 2px;
  background: currentColor;
  transform: scaleX(0);
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} label b {
  padding: 0.05rem 0.35rem;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 700;
  color: #0b1120;
  background: #475569;
  transition: background 0.2s ease;
}
.${c} label:hover { color: #cbd5e1; }
.${c} input:nth-of-type(1):checked + label { color: ${t.a}; }
.${c} input:nth-of-type(2):checked + label { color: ${t.b}; }
.${c} input:nth-of-type(3):checked + label { color: ${t.c}; }
.${c} input:checked + label::after { transform: scaleX(1); }
.${c} input:nth-of-type(1):checked + label b { background: ${t.a}; }
.${c} input:nth-of-type(2):checked + label b { background: ${t.b}; }
.${c} input:focus-visible + label {
  outline: 2px solid ${t.b};
  outline-offset: 2px;
  border-radius: 0.3rem;
}`
    add(mk({
      name: `${t.name} Counter Tabs`,
      category: 'Accordions & Tabs',
      description: `Tab strip carrying per-tab counts, with the underline scaled from zero and the badge recoloring only on the selected tab.`,
      html, css,
      tags: ['tabs', 'badge', 'counter', 'radio', 'inbox', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  3D & PERSPECTIVE — coverflow row  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-3d-coverflow-${g.name}`)
    const html = `<div class="${c}"><i class="l"></i><i class="m"></i><i class="r"></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  width: 270px;
  height: 130px;
  perspective: 640px;
}
.${c} i {
  width: 74px;
  height: 100px;
  border-radius: 0.5rem;
  background: linear-gradient(145deg, ${g.a}, ${g.b});
  box-shadow: 0 12px 28px rgba(0,0,0,0.45);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), filter 0.35s ease;
}
.${c} .l { transform: rotateY(42deg) translateZ(-26px); filter: brightness(0.55); }
.${c} .m { transform: rotateY(0) translateZ(18px) scale(1.06); z-index: 1; }
.${c} .r { transform: rotateY(-42deg) translateZ(-26px); filter: brightness(0.55); }
.${c}:hover .l { transform: rotateY(30deg) translateZ(-14px); filter: brightness(0.75); }
.${c}:hover .r { transform: rotateY(-30deg) translateZ(-14px); filter: brightness(0.75); }
.${c}:hover .m { transform: rotateY(0) translateZ(34px) scale(1.1); }`
    add(mk({
      name: `${g.name} Coverflow`,
      category: '3D & Perspective',
      description: `Three panels turned toward a shared vanishing point, the flanking pair dimmed with \`brightness\` so depth reads without a fog layer.`,
      html, css,
      tags: ['3d', 'coverflow', 'perspective', 'carousel', 'rotate', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  3D & PERSPECTIVE — folding book panel  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-3d-fold-${t.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: flex;
  width: 220px;
  height: 118px;
  perspective: 520px;
  transform-style: preserve-3d;
}
.${c} i {
  flex: 1;
  transform-origin: left center;
  animation: ${c}-fold 4.5s ease-in-out infinite;
}
.${c} i:nth-child(1) { background: linear-gradient(90deg, ${t.a}, ${t.b}); animation-delay: 0s; }
.${c} i:nth-child(2) { background: linear-gradient(90deg, ${t.b}, ${t.c}); animation-delay: 0.15s; }
.${c} i:nth-child(3) { background: linear-gradient(90deg, ${t.c}, ${t.a}); animation-delay: 0.3s; }
.${c} i:nth-child(4) { background: linear-gradient(90deg, ${t.a}, ${t.b}); animation-delay: 0.45s; }
@keyframes ${c}-fold {
  0%, 20%  { transform: rotateY(0deg); filter: brightness(1); }
  50%, 70% { transform: rotateY(-62deg); filter: brightness(0.5); }
  100%     { transform: rotateY(0deg); filter: brightness(1); }
}`
    add(mk({
      name: `${t.name} Folding Panels`,
      category: '3D & Perspective',
      description: `Four leaves hinged on their left edge and folded on a stagger, darkening as they turn away so the crease reads without a gradient overlay.`,
      html, css,
      tags: ['3d', 'fold', 'accordion', 'perspective', 'panels', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  GLOW & NEON — outlined neon button  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-neon-outline-${g.name}`)
    const html = `<button class="${c}">Enter</button>`
    const css = `.${c} {
  position: relative;
  padding: 0.7rem 1.9rem;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${g.a};
  background: transparent;
  border: 2px solid ${g.a};
  border-radius: 0.4rem;
  cursor: pointer;
  text-shadow: 0 0 8px rgba(${rgbOf(g.a)}, 0.7);
  box-shadow: 0 0 10px rgba(${rgbOf(g.a)}, 0.35), inset 0 0 10px rgba(${rgbOf(g.a)}, 0.15);
  transition: color 0.25s ease, box-shadow 0.25s ease, text-shadow 0.25s ease;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 0.4rem;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  opacity: 0;
  z-index: -1;
  transition: opacity 0.25s ease;
}
.${c}:hover {
  color: #0b1120;
  text-shadow: none;
  box-shadow: 0 0 24px rgba(${rgbOf(g.b)}, 0.65);
}
.${c}:hover::before {
  opacity: 1;
}`
    add(mk({
      name: `${g.name} Neon Outline Button`,
      category: 'Glow & Neon',
      description: `Hollow tube that floods on hover, with the fill cross-faded behind the text so the label never reflows as the state changes.`,
      html, css,
      tags: ['neon', 'glow', 'button', 'outline', 'cyberpunk', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  GLOW & NEON — glowing status rail  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-neon-rail-${t.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 62px;
  padding: 0.7rem 0.9rem;
  border-radius: 0.55rem;
  background: #06080f;
  border: 1px solid #1e293b;
}
.${c} i {
  width: 7px;
  border-radius: 2px;
  animation: ${c}-bounce 1.4s ease-in-out infinite;
}
.${c} i:nth-child(1) { height: 40%; background: ${t.a}; box-shadow: 0 0 9px ${t.a}; animation-delay: 0s; }
.${c} i:nth-child(2) { height: 68%; background: ${t.a}; box-shadow: 0 0 9px ${t.a}; animation-delay: 0.1s; }
.${c} i:nth-child(3) { height: 90%; background: ${t.b}; box-shadow: 0 0 9px ${t.b}; animation-delay: 0.2s; }
.${c} i:nth-child(4) { height: 74%; background: ${t.b}; box-shadow: 0 0 9px ${t.b}; animation-delay: 0.3s; }
.${c} i:nth-child(5) { height: 52%; background: ${t.c}; box-shadow: 0 0 9px ${t.c}; animation-delay: 0.4s; }
.${c} i:nth-child(6) { height: 34%; background: ${t.c}; box-shadow: 0 0 9px ${t.c}; animation-delay: 0.5s; }
@keyframes ${c}-bounce {
  50% { transform: scaleY(0.45); filter: brightness(1.4); }
}`
    add(mk({
      name: `${t.name} Neon Level Meter`,
      category: 'Glow & Neon',
      description: `Six lit bars scaled from their base on a rolling delay, brightening at the bottom of the travel so the glow pumps with the motion.`,
      html, css,
      tags: ['neon', 'glow', 'meter', 'equalizer', 'audio', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PATTERNS & TEXTURES — isometric cube tiling  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-pat-iso-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 100%;
  height: 180px;
  border-radius: 0.7rem;
  background-color: #0b1120;
  background-image:
    linear-gradient(30deg, rgba(${rgbOf(g.a)}, 0.16) 12%, transparent 12.5%, transparent 87%, rgba(${rgbOf(g.a)}, 0.16) 87.5%, rgba(${rgbOf(g.a)}, 0.16)),
    linear-gradient(150deg, rgba(${rgbOf(g.a)}, 0.16) 12%, transparent 12.5%, transparent 87%, rgba(${rgbOf(g.a)}, 0.16) 87.5%, rgba(${rgbOf(g.a)}, 0.16)),
    linear-gradient(30deg, rgba(${rgbOf(g.b)}, 0.16) 12%, transparent 12.5%, transparent 87%, rgba(${rgbOf(g.b)}, 0.16) 87.5%, rgba(${rgbOf(g.b)}, 0.16)),
    linear-gradient(150deg, rgba(${rgbOf(g.b)}, 0.16) 12%, transparent 12.5%, transparent 87%, rgba(${rgbOf(g.b)}, 0.16) 87.5%, rgba(${rgbOf(g.b)}, 0.16));
  background-size: 44px 78px;
  background-position: 0 0, 0 0, 22px 39px, 22px 39px;
}`
    add(mk({
      name: `${g.name} Isometric Tiling`,
      category: 'Patterns & Textures',
      description: `Four sheared gradients offset by half a tile into an interlocking cube lattice — one element, no SVG, and it tiles seamlessly at any size.`,
      html, css,
      tags: ['pattern', 'isometric', 'cubes', 'geometric', 'tiling', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PATTERNS & TEXTURES — woven basket weave  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-pat-weave-${t.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 100%;
  height: 180px;
  border-radius: 0.7rem;
  background-color: #0b1120;
  background-image:
    repeating-linear-gradient(45deg, rgba(${rgbOf(t.a)}, 0.2) 0 9px, transparent 9px 18px),
    repeating-linear-gradient(-45deg, rgba(${rgbOf(t.b)}, 0.2) 0 9px, transparent 9px 18px),
    repeating-linear-gradient(90deg, rgba(${rgbOf(t.c)}, 0.09) 0 1px, transparent 1px 26px);
  background-size: 52px 52px, 52px 52px, 100% 100%;
  animation: ${c}-shift 30s linear infinite;
}
@keyframes ${c}-shift {
  to { background-position: 52px 52px, -52px 52px, 0 0; }
}`
    add(mk({
      name: `${t.name} Woven Texture`,
      category: 'Patterns & Textures',
      description: `Two opposed diagonal repeats crossing into a basket weave, drifting against each other so the surface shimmers without any element moving.`,
      html, css,
      tags: ['pattern', 'weave', 'texture', 'diagonal', 'fabric', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MASKS & CLIP PATHS — text masked by a moving gradient  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-mask-text-${g.name}`)
    const html = `<div class="${c}"><span>MASKED</span></div>`
    const css = `.${c} {
  display: inline-block;
  padding: 0.6rem 0.2rem;
}
.${c} span {
  display: block;
  font-size: 2.6rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  background: linear-gradient(115deg, ${g.a} 0%, #ffffff 26%, ${g.b} 52%, ${g.a} 78%, ${g.b} 100%);
  background-size: 320% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ${c}-slide 5.5s linear infinite;
}
@keyframes ${c}-slide {
  to { background-position: 320% 0; }
}`
    add(mk({
      name: `${g.name} Masked Gradient Text`,
      category: 'Masks & Clip Paths',
      description: `Oversized gradient clipped to the glyphs and slid across them, with a white stop so a highlight travels through the letterforms.`,
      html, css,
      tags: ['mask', 'text', 'gradient', 'background-clip', 'shine', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MASKS & CLIP PATHS — arrow / chevron process flow  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-mask-flow-${t.name}`)
    const html = `<div class="${c}"><span>Draft</span><span>Review</span><span>Live</span></div>`
    const css = `.${c} {
  display: flex;
  gap: 3px;
}
.${c} span {
  padding: 0.5rem 1.5rem 0.5rem 1.7rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #0b1120;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%);
  transition: filter 0.2s ease;
}
.${c} span:first-child {
  padding-left: 1.1rem;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%);
}
.${c} span:last-child {
  padding-right: 1.1rem;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 14px 50%);
}
.${c} span:nth-child(1) { background: ${t.a}; }
.${c} span:nth-child(2) { background: ${t.b}; }
.${c} span:nth-child(3) { background: ${t.c}; }
.${c} span:hover { filter: brightness(1.15); }`
    add(mk({
      name: `${t.name} Chevron Flow`,
      category: 'Masks & Clip Paths',
      description: `Interlocking arrow segments cut with \`clip-path\`, the first and last squared off so the run reads as a pipeline with real ends.`,
      html, css,
      tags: ['clip-path', 'chevron', 'breadcrumb', 'process', 'flow', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CHARTS & DATA — horizontal ranked bars  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-chart-ranked-${g.name}`)
    const html = `<div class="${c}"><div class="r"><span>Direct</span><i style="width:92%"></i><em>4,812</em></div><div class="r"><span>Search</span><i style="width:71%"></i><em>3,704</em></div><div class="r"><span>Social</span><i style="width:44%"></i><em>2,291</em></div><div class="r"><span>Email</span><i style="width:23%"></i><em>1,205</em></div></div>`
    const css = `.${c} {
  width: 300px;
  padding: 0.9rem;
  border-radius: 0.65rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} .r {
  display: grid;
  grid-template-columns: 52px 1fr 46px;
  align-items: center;
  gap: 0.6rem;
}
.${c} .r + .r { margin-top: 0.7rem; }
.${c} span {
  font-size: 0.72rem;
  color: #94a3b8;
}
.${c} i {
  display: block;
  height: 9px;
  border-radius: 999px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  transform-origin: left;
  animation: ${c}-grow 1.4s cubic-bezier(0.2, 0.8, 0.3, 1) infinite alternate;
}
.${c} .r:nth-child(2) i { animation-delay: 0.08s; }
.${c} .r:nth-child(3) i { animation-delay: 0.16s; }
.${c} .r:nth-child(4) i { animation-delay: 0.24s; }
.${c} em {
  font-style: normal;
  font-size: 0.72rem;
  font-weight: 600;
  color: #e2e8f0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
@keyframes ${c}-grow {
  from { transform: scaleX(0.82); }
  to   { transform: scaleX(1); }
}`
    add(mk({
      name: `${g.name} Ranked Bars`,
      category: 'Charts & Data',
      description: `Three-column grid so labels, bars and values line up on their own axes, with widths as inline styles because the lengths are data.`,
      html, css,
      tags: ['chart', 'bar', 'ranked', 'horizontal', 'analytics', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CHARTS & DATA — contribution heat calendar  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-chart-cal-${t.name}`)
    const cells = [0,2,1,3,0,1,2,3,3,1,0,2,1,3,2,0,1,3,2,2,0,3,1,1,2,0,3,2,1,3,2,1,0,2,3]
    const html = `<div class="${c}">${cells.map((n) => `<i class="l${n}"></i>`).join('')}</div>`
    const css = `.${c} {
  display: grid;
  grid-template-rows: repeat(5, 13px);
  grid-auto-flow: column;
  grid-auto-columns: 13px;
  gap: 3px;
  padding: 0.8rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} i {
  border-radius: 2px;
  transition: transform 0.15s ease;
}
.${c} i:hover { transform: scale(1.35); }
.${c} .l0 { background: #1e293b; }
.${c} .l1 { background: rgba(${rgbOf(t.a)}, 0.42); }
.${c} .l2 { background: ${t.b}; }
.${c} .l3 { background: ${t.c}; }`
    add(mk({
      name: `${t.name} Heat Calendar`,
      category: 'Charts & Data',
      description: `Contribution grid filled column-first with \`grid-auto-flow\`, so weeks run down and the whole thing stays one flat list of cells.`,
      html, css,
      tags: ['chart', 'heatmap', 'calendar', 'contributions', 'grid', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TIMELINES & STEPS — alternating two-sided timeline  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-time-alt-${g.name}`)
    const html = `<ol class="${c}"><li><b>Founded</b><span>Two people, one room</span></li><li><b>Series A</b><span>$12M led by Northwind</span></li><li><b>Public beta</b><span>4,000 teams onboarded</span></li></ol>`
    const css = `.${c} {
  position: relative;
  width: 300px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.${c}::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 6px;
  bottom: 6px;
  width: 2px;
  margin-left: -1px;
  background: linear-gradient(${g.a}, ${g.b});
  border-radius: 1px;
}
.${c} li {
  position: relative;
  width: 50%;
  padding: 0 1rem 1.1rem 0;
  text-align: right;
}
.${c} li:nth-child(even) {
  margin-left: 50%;
  padding: 0 0 1.1rem 1rem;
  text-align: left;
}
.${c} li::after {
  content: '';
  position: absolute;
  top: 4px;
  right: -5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${g.a};
  box-shadow: 0 0 0 3px #0b1120;
}
.${c} li:nth-child(even)::after {
  right: auto;
  left: -5px;
  background: ${g.b};
}
.${c} b {
  display: block;
  font-size: 0.82rem;
  color: #f1f5f9;
}
.${c} span {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.72rem;
  color: #64748b;
}`
    add(mk({
      name: `${g.name} Alternating Timeline`,
      category: 'Timelines & Steps',
      description: `Entries flipping side to side across a centre spine, with each node punched out of the rail by a background-colored ring.`,
      html, css,
      tags: ['timeline', 'alternating', 'history', 'milestones', 'vertical', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TIMELINES & STEPS — numbered horizontal stepper  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-time-numbered-${t.name}`)
    const html = `<ol class="${c}"><li class="done"><i>1</i><span>Account</span></li><li class="now"><i>2</i><span>Payment</span></li><li><i>3</i><span>Confirm</span></li></ol>`
    const css = `.${c} {
  display: flex;
  width: 300px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.${c} li {
  position: relative;
  flex: 1;
  text-align: center;
}
.${c} li:not(:last-child)::before {
  content: '';
  position: absolute;
  top: 15px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: #1e293b;
}
.${c} .done:not(:last-child)::before {
  background: linear-gradient(90deg, ${t.a}, ${t.b});
}
.${c} i {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  margin: 0 auto;
  border-radius: 50%;
  font-style: normal;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  background: #0b1120;
  box-shadow: inset 0 0 0 2px #1e293b;
}
.${c} .done i {
  color: #0b1120;
  background: ${t.a};
  box-shadow: none;
}
.${c} .now i {
  color: ${t.b};
  box-shadow: inset 0 0 0 2px ${t.b}, 0 0 0 4px rgba(${rgbOf(t.b)}, 0.18);
}
.${c} span {
  display: block;
  margin-top: 0.45rem;
  font-size: 0.72rem;
  color: #64748b;
}
.${c} .done span, .${c} .now span { color: #cbd5e1; }`
    add(mk({
      name: `${t.name} Numbered Stepper`,
      category: 'Timelines & Steps',
      description: `Ordered list where the connector belongs to the step behind it, so a completed leg fills without any element spanning two items.`,
      html, css,
      tags: ['stepper', 'steps', 'numbered', 'wizard', 'checkout', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TABLES & DATA GRIDS — table with an inline expand row  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-table-expand-${g.name}`)
    const html = `<table class="${c}"><thead><tr><th>Invoice</th><th>Status</th><th>Amount</th></tr></thead><tbody><tr><td>INV-2041</td><td><em class="ok">Paid</em></td><td>$1,280</td></tr><tr class="sub"><td colspan="3">Card ending 4242 · charged 12 Mar</td></tr><tr><td>INV-2042</td><td><em>Due</em></td><td>$960</td></tr></tbody></table>`
    const css = `.${c} {
  width: 300px;
  border-collapse: collapse;
  font-size: 0.76rem;
  border-radius: 0.55rem;
  overflow: hidden;
  background: #111827;
  box-shadow: 0 0 0 1px #1f2937;
}
.${c} th {
  padding: 0.6rem 0.75rem;
  text-align: left;
  font-size: 0.66rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  background: #0f172a;
  border-bottom: 1px solid #1f2937;
}
.${c} td {
  padding: 0.6rem 0.75rem;
  color: #cbd5e1;
  border-bottom: 1px solid #1f2937;
}
.${c} tbody tr:not(.sub):hover td {
  background: rgba(${rgbOf(g.a)}, 0.07);
}
.${c} .sub td {
  padding: 0.45rem 0.75rem 0.55rem 1.5rem;
  font-size: 0.7rem;
  color: #64748b;
  background: #0d1424;
  border-left: 2px solid ${g.a};
}
.${c} em {
  font-style: normal;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 600;
  color: #94a3b8;
  background: #1e293b;
}
.${c} .ok {
  color: #0b1120;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}`
    add(mk({
      name: `${g.name} Expandable Table`,
      category: 'Tables & Data Grids',
      description: `Detail row spanning the full width with \`colspan\`, keyed by an accent rule so the child reads as belonging to the row above it.`,
      html, css,
      tags: ['table', 'expandable', 'detail row', 'invoice', 'data', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TABLES & DATA GRIDS — pinned first column  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-table-pinned-${t.name}`)
    const html = `<div class="${c}"><table><thead><tr><th>Region</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr></thead><tbody><tr><th>EMEA</th><td>412</td><td>498</td><td>530</td><td>602</td></tr><tr><th>APAC</th><td>287</td><td>341</td><td>388</td><td>410</td></tr><tr><th>LATAM</th><td>164</td><td>190</td><td>212</td><td>256</td></tr></tbody></table></div>`
    const css = `.${c} {
  width: 280px;
  overflow-x: auto;
  border-radius: 0.55rem;
  background: #111827;
  box-shadow: 0 0 0 1px #1f2937;
}
.${c} table {
  border-collapse: collapse;
  font-size: 0.75rem;
  min-width: 380px;
}
.${c} th, .${c} td {
  padding: 0.55rem 0.8rem;
  white-space: nowrap;
  border-bottom: 1px solid #1f2937;
}
.${c} thead th {
  text-align: left;
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  background: #0f172a;
}
.${c} tbody th {
  position: sticky;
  left: 0;
  text-align: left;
  font-weight: 600;
  color: ${t.a};
  background: #111827;
  box-shadow: 1px 0 0 #1f2937;
}
.${c} thead th:first-child {
  position: sticky;
  left: 0;
  z-index: 1;
  background: #0f172a;
  box-shadow: 1px 0 0 #1f2937;
}
.${c} td {
  color: #cbd5e1;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.${c} tbody tr:hover td { background: rgba(${rgbOf(t.b)}, 0.07); }
.${c}::-webkit-scrollbar { height: 6px; }
.${c}::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: linear-gradient(90deg, ${t.b}, ${t.c});
}`
    add(mk({
      name: `${t.name} Pinned Column Table`,
      category: 'Tables & Data Grids',
      description: `Row headers frozen with \`position: sticky\` while the measures scroll, using a box-shadow as the divider so the seam does not scroll away.`,
      html, css,
      tags: ['table', 'sticky', 'pinned', 'scroll', 'grid', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FORMS & VALIDATION — labelled field with helper text  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-form-field-${g.name}`)
    const html = `<div class="${c}"><label for="${c}-i">Workspace URL</label><div class="wrap"><span>hoverlab.app/</span><input id="${c}-i" value="northwind" readonly></div><small>Lowercase letters, numbers and hyphens only.</small></div>`
    const css = `.${c} {
  width: 290px;
}
.${c} label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: #cbd5e1;
}
.${c} .wrap {
  display: flex;
  align-items: center;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #111827;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.${c} .wrap:focus-within {
  border-color: ${g.a};
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.a)}, 0.18);
}
.${c} span {
  padding: 0.55rem 0 0.55rem 0.7rem;
  font-size: 0.8rem;
  color: #64748b;
  user-select: none;
}
.${c} input {
  flex: 1;
  padding: 0.55rem 0.7rem 0.55rem 0.15rem;
  border: none;
  outline: none;
  background: transparent;
  color: #f1f5f9;
  font-size: 0.8rem;
}
.${c} small {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.7rem;
  color: #64748b;
}
.${c} .wrap:focus-within ~ small {
  color: ${g.b};
}`
    add(mk({
      name: `${g.name} Prefixed Field`,
      category: 'Forms & Validation',
      description: `Immutable prefix and input sharing one bordered wrapper, so the focus ring surrounds the whole control instead of half of it.`,
      html, css,
      tags: ['form', 'input', 'prefix', 'label', 'helper', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FORMS & VALIDATION — switch-style consent row  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-form-consent-${t.name}`)
    const html = `<label class="${c}"><input type="checkbox" checked><span class="box"></span><span class="copy"><b>Product emails</b><em>Release notes and changelog, about twice a month.</em></span></label>`
    const css = `.${c} {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  width: 292px;
  padding: 0.8rem 0.85rem;
  border: 1px solid #334155;
  border-radius: 0.6rem;
  background: #111827;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.${c}:hover { border-color: #475569; }
.${c} input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.${c} .box {
  flex: none;
  position: relative;
  width: 19px;
  height: 19px;
  margin-top: 1px;
  border: 2px solid #475569;
  border-radius: 0.3rem;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.${c} .box::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 4px;
  height: 9px;
  border: solid #0b1120;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) scale(0);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} input:checked ~ .box {
  background: linear-gradient(135deg, ${t.a}, ${t.b});
  border-color: ${t.a};
}
.${c} input:checked ~ .box::after { transform: rotate(45deg) scale(1); }
.${c} input:checked ~ .copy b { color: ${t.b}; }
.${c} input:focus-visible ~ .box {
  box-shadow: 0 0 0 3px rgba(${rgbOf(t.a)}, 0.3);
}
.${c} .copy b {
  display: block;
  font-size: 0.8rem;
  color: #e2e8f0;
  transition: color 0.2s ease;
}
.${c} .copy em {
  display: block;
  margin-top: 0.15rem;
  font-style: normal;
  font-size: 0.72rem;
  line-height: 1.45;
  color: #64748b;
}`
    add(mk({
      name: `${t.name} Consent Row`,
      category: 'Forms & Validation',
      description: `Whole card is the label, so the entire row is a hit target, with the tick scaled from zero rather than toggled on \`display\`.`,
      html, css,
      tags: ['form', 'checkbox', 'consent', 'opt-in', 'settings', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SCROLL & STICKY — sticky summary bar over content  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-scroll-bar-${g.name}`)
    const html = `<div class="${c}"><header><b>Nimbus Chair</b><span>$480</span><button>Add</button></header><i></i><i></i><i class="s"></i><i></i><i></i><i class="s"></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 292px;
  height: 175px;
  overflow-y: auto;
  padding: 0 0.85rem 0.85rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
  scrollbar-width: thin;
}
.${c} header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 -0.85rem 0.85rem;
  padding: 0.7rem 0.85rem;
  background: rgba(17,24,39,0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(${rgbOf(g.a)}, 0.3);
}
.${c} header b {
  flex: 1;
  font-size: 0.82rem;
  color: #f1f5f9;
}
.${c} header span {
  font-size: 0.8rem;
  font-weight: 700;
  color: ${g.b};
}
.${c} header button {
  padding: 0.28rem 0.7rem;
  border: none;
  border-radius: 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #0b1120;
  cursor: pointer;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}
.${c} i {
  display: block;
  height: 10px;
  margin-bottom: 0.6rem;
  border-radius: 999px;
  background: #1e293b;
}
.${c} .s { width: 62%; }
.${c}::-webkit-scrollbar { width: 6px; }
.${c}::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: linear-gradient(${g.a}, ${g.b});
}`
    add(mk({
      name: `${g.name} Sticky Buy Bar`,
      category: 'Scroll & Sticky',
      description: `Price and action pinned to the top of a scrolling pane with negative margins cancelling the padding, so the blur runs edge to edge.`,
      html, css,
      tags: ['sticky', 'scroll', 'buy bar', 'header', 'ecommerce', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SCROLL & STICKY — scroll-linked timeline rail  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-scroll-rail-${t.name}`)
    const html = `<div class="${c}"><div class="rail"><b></b></div><div class="body"><p>Discovery</p><p>Design</p><p>Build</p><p>Launch</p><p>Iterate</p></div></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.85rem;
  width: 292px;
  height: 168px;
  padding: 0.85rem;
  overflow-y: auto;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
  scrollbar-width: none;
}
.${c}::-webkit-scrollbar { display: none; }
.${c} .rail {
  position: sticky;
  top: 0;
  flex: none;
  width: 3px;
  height: 138px;
  border-radius: 2px;
  background: #1e293b;
  overflow: hidden;
}
.${c} .rail b {
  display: block;
  width: 100%;
  height: 40%;
  border-radius: 2px;
  background: linear-gradient(${t.a}, ${t.b}, ${t.c});
  animation: ${c}-track 4s ease-in-out infinite alternate;
}
.${c} .body { flex: 1; }
.${c} p {
  margin: 0 0 1.05rem;
  padding-left: 0.1rem;
  font-size: 0.82rem;
  color: #64748b;
  transition: color 0.2s ease;
}
.${c} p:hover { color: #e2e8f0; }
@keyframes ${c}-track {
  from { transform: translateY(0); }
  to   { transform: translateY(150%); }
}`
    add(mk({
      name: `${t.name} Scroll Rail`,
      category: 'Scroll & Sticky',
      description: `Progress thumb riding a sticky rail beside scrolling copy, hiding the native scrollbar so the rail is the only indicator.`,
      html, css,
      tags: ['scroll', 'sticky', 'rail', 'progress', 'timeline', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SLIDERS & CAROUSELS — dual-handle range  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-slider-dual-${g.name}`)
    const html = `<div class="${c}"><header><span>Price</span><em>$40 – $180</em></header><div class="track"><i class="fill"></i><b class="lo"></b><b class="hi"></b></div></div>`
    const css = `.${c} {
  width: 280px;
}
.${c} header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.85rem;
}
.${c} header span {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}
.${c} header em {
  font-style: normal;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${g.b};
  font-variant-numeric: tabular-nums;
}
.${c} .track {
  position: relative;
  height: 5px;
  border-radius: 3px;
  background: #1e293b;
}
.${c} .fill {
  position: absolute;
  left: 18%;
  right: 26%;
  top: 0;
  bottom: 0;
  border-radius: 3px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}
.${c} b {
  position: absolute;
  top: 50%;
  width: 17px;
  height: 17px;
  margin-top: -8.5px;
  margin-left: -8.5px;
  border-radius: 50%;
  background: #e2e8f0;
  border: 3px solid ${g.a};
  cursor: grab;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.${c} .lo { left: 18%; }
.${c} .hi { left: 74%; border-color: ${g.b}; }
.${c} b:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 6px rgba(${rgbOf(g.a)}, 0.18);
}`
    add(mk({
      name: `${g.name} Dual Range Slider`,
      category: 'Sliders & Carousels',
      description: `Two handles bounding a filled span, positioned as percentages so the same markup serves any min and max without recomputing pixels.`,
      html, css,
      tags: ['slider', 'range', 'dual', 'filter', 'price', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SLIDERS & CAROUSELS — carousel with dot pagination  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-slider-dots-${t.name}`)
    const html = `<div class="${c}"><div class="stage"><i></i><i></i><i></i></div><div class="dots"><b class="on"></b><b></b><b></b></div></div>`
    const css = `.${c} {
  width: 262px;
}
.${c} .stage {
  display: flex;
  height: 128px;
  overflow: hidden;
  border-radius: 0.6rem;
}
.${c} .stage i {
  flex: none;
  width: 100%;
  animation: ${c}-slide 9s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
.${c} .stage i:nth-child(1) { background: linear-gradient(140deg, ${t.a}, ${t.b}); }
.${c} .stage i:nth-child(2) { background: linear-gradient(140deg, ${t.b}, ${t.c}); }
.${c} .stage i:nth-child(3) { background: linear-gradient(140deg, ${t.c}, ${t.a}); }
.${c} .dots {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.7rem;
}
.${c} .dots b {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #334155;
  cursor: pointer;
  transition: width 0.25s ease, background 0.25s ease;
}
.${c} .dots b:hover { background: #475569; }
.${c} .dots .on {
  width: 20px;
  background: linear-gradient(90deg, ${t.a}, ${t.b});
}
@keyframes ${c}-slide {
  0%, 26%   { transform: translateX(0); }
  33%, 59%  { transform: translateX(-100%); }
  66%, 92%  { transform: translateX(-200%); }
  100%      { transform: translateX(0); }
}`
    add(mk({
      name: `${t.name} Dot Carousel`,
      category: 'Sliders & Carousels',
      description: `Slides translated as one strip with a pagination row whose active dot stretches into a pill rather than just changing color.`,
      html, css,
      tags: ['carousel', 'slider', 'dots', 'pagination', 'gallery', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ICONS & SHAPES — CSS-drawn folder / document  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-icon-folder-${g.name}`)
    const html = `<div class="${c}"><i></i></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 82px;
  height: 78px;
  perspective: 420px;
}
.${c} i {
  position: relative;
  width: 62px;
  height: 46px;
  border-radius: 0.15rem 0.35rem 0.35rem 0.35rem;
  background: linear-gradient(150deg, ${g.a}, ${g.b});
  box-shadow: 0 8px 20px rgba(${rgbOf(g.a)}, 0.3);
  transition: transform 0.3s ease;
}
.${c} i::before {
  content: '';
  position: absolute;
  top: -7px;
  left: 0;
  width: 26px;
  height: 8px;
  border-radius: 0.3rem 0.3rem 0 0;
  background: ${g.a};
}
.${c} i::after {
  content: '';
  position: absolute;
  left: 3px;
  right: 3px;
  bottom: 0;
  height: 36px;
  border-radius: 0.25rem;
  background: linear-gradient(150deg, ${g.b}, ${g.a});
  transform-origin: bottom;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c}:hover i::after {
  transform: rotateX(-32deg) translateY(-3px);
}
.${c}:hover i {
  transform: translateY(-2px);
}`
    add(mk({
      name: `${g.name} Folder Icon`,
      category: 'Icons & Shapes',
      description: `Folder drawn from one element and two pseudo-elements, the front flap hinged on its bottom edge so it opens in perspective on hover.`,
      html, css,
      tags: ['icon', 'folder', 'shape', 'css art', 'hover', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ICONS & SHAPES — animated location pin  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-icon-pin-${t.name}`)
    const html = `<div class="${c}"><i></i><span></span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 78px;
  height: 86px;
}
.${c} i {
  position: relative;
  width: 38px;
  height: 38px;
  margin-bottom: 18px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background: linear-gradient(135deg, ${t.a}, ${t.b});
  box-shadow: 0 6px 16px rgba(${rgbOf(t.a)}, 0.4);
  animation: ${c}-hover 2.4s ease-in-out infinite;
}
.${c} i::after {
  content: '';
  position: absolute;
  inset: 11px;
  border-radius: 50%;
  background: #0b1120;
}
.${c} span {
  position: absolute;
  bottom: 12px;
  width: 26px;
  height: 7px;
  border-radius: 50%;
  background: ${t.c};
  opacity: 0.3;
  filter: blur(3px);
  animation: ${c}-shadow 2.4s ease-in-out infinite;
}
@keyframes ${c}-hover {
  50% { transform: rotate(-45deg) translate(4px, -4px); }
}
@keyframes ${c}-shadow {
  50% { transform: scale(0.7); opacity: 0.16; }
}`
    add(mk({
      name: `${t.name} Location Pin`,
      category: 'Icons & Shapes',
      description: `Teardrop made from three rounded corners and one square one, floating over a shadow that shrinks as it rises so the lift reads as height.`,
      html, css,
      tags: ['icon', 'pin', 'map', 'marker', 'css art', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MICRO-INTERACTIONS — save/bookmark toggle  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-micro-save-${g.name}`)
    const html = `<label class="${c}"><input type="checkbox"><span><i></i>Save</span></label>`
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
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.05rem;
  border: 1px solid #334155;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #94a3b8;
  transition: border-color 0.22s ease, color 0.22s ease, background 0.22s ease;
}
.${c} i {
  position: relative;
  width: 12px;
  height: 15px;
  border: 2px solid currentColor;
  border-bottom: none;
  border-radius: 0.15rem 0.15rem 0 0;
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c} i::after {
  content: '';
  position: absolute;
  left: -2px;
  right: -2px;
  bottom: -6px;
  height: 8px;
  background: currentColor;
  clip-path: polygon(0 0, 100% 0, 50% 72%);
  transition: background 0.22s ease;
}
.${c} input:checked + span {
  color: #0b1120;
  border-color: transparent;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}
.${c} input:checked + span i {
  transform: translateY(-2px) scale(1.12);
}
.${c} input:focus-visible + span {
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.a)}, 0.3);
}`
    add(mk({
      name: `${g.name} Save Toggle`,
      category: 'Micro-interactions',
      description: `Bookmark flag drawn with a clip-path notch, springing up on an overshoot curve as the pill fills — one checkbox, no script.`,
      html, css,
      tags: ['micro', 'bookmark', 'save', 'toggle', 'spring', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MICRO-INTERACTIONS — star rating hover trail  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-micro-stars-${t.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: inline-flex;
  flex-direction: row-reverse;
  gap: 0.3rem;
}
.${c} i {
  width: 24px;
  height: 24px;
  background: #334155;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  cursor: pointer;
  transition: background 0.16s ease, transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c} i:hover,
.${c} i:hover ~ i {
  background: linear-gradient(140deg, ${t.a}, ${t.b});
}
.${c} i:hover {
  transform: scale(1.22) rotate(-8deg);
}
.${c} i:hover ~ i {
  transform: scale(1.08);
}`
    add(mk({
      name: `${t.name} Star Rating`,
      category: 'Micro-interactions',
      description: `Row reversed in flex so a plain sibling combinator lights every star to the left of the pointer — the trick that makes hover ratings work in pure CSS.`,
      html, css,
      tags: ['micro', 'rating', 'stars', 'hover', 'clip-path', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FILTERS & BLEND MODES — colour-dodge light leak  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v6-filter-leak-${g.name}`)
    const html = `<div class="${c}"><span>ANALOG</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 232px;
  height: 132px;
  overflow: hidden;
  border-radius: 0.6rem;
  background: linear-gradient(150deg, #1e293b, #0b1120);
  isolation: isolate;
}
.${c}::before {
  content: '';
  position: absolute;
  top: -40%;
  left: -30%;
  width: 90%;
  height: 180%;
  background: linear-gradient(70deg, transparent, ${g.a}, ${g.b}, transparent);
  filter: blur(22px);
  mix-blend-mode: color-dodge;
  animation: ${c}-sweep 6s ease-in-out infinite;
}
.${c} span {
  position: relative;
  z-index: 1;
  font-size: 1.35rem;
  font-weight: 900;
  letter-spacing: 0.28em;
  color: #e2e8f0;
  mix-blend-mode: overlay;
}
@keyframes ${c}-sweep {
  50% { transform: translateX(115%) rotate(8deg); }
}`
    add(mk({
      name: `${g.name} Light Leak`,
      category: 'Filters & Blend Modes',
      description: `Blurred band swept across the frame in \`color-dodge\` with the label in \`overlay\`, so both react to what passes beneath them.`,
      html, css,
      tags: ['blend', 'light leak', 'color-dodge', 'analog', 'filter', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FILTERS & BLEND MODES — saturation split reveal  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v6-filter-split-${t.name}`)
    const html = `<div class="${c}"><i class="flat"></i><i class="rich"></i><b></b></div>`
    const css = `.${c} {
  position: relative;
  width: 236px;
  height: 138px;
  overflow: hidden;
  border-radius: 0.6rem;
  cursor: col-resize;
}
.${c} i {
  position: absolute;
  inset: 0;
  background: linear-gradient(140deg, ${t.a}, ${t.b}, ${t.c});
}
.${c} .flat {
  filter: saturate(0.12) brightness(0.8);
}
.${c} .rich {
  filter: saturate(1.45) contrast(1.1);
  clip-path: inset(0 0 0 50%);
  transition: clip-path 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} b {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  margin-left: -1px;
  background: #f8fafc;
  box-shadow: 0 0 10px rgba(0,0,0,0.6);
  transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} b::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  margin: -12px 0 0 -12px;
  border-radius: 50%;
  background: #f8fafc;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
}
.${c}:hover .rich { clip-path: inset(0 0 0 16%); }
.${c}:hover b { left: 16%; }`
    add(mk({
      name: `${t.name} Saturation Split`,
      category: 'Filters & Blend Modes',
      description: `Two copies of one surface at different saturations, split by a clip-path handle that slides on hover — a before/after with no second asset.`,
      html, css,
      tags: ['filter', 'saturation', 'split', 'compare', 'clip-path', t.name.toLowerCase()],
    }))
  }
}
