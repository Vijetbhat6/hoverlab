// scripts/generate-effects-v9.mjs
//
// Ninth wave: a fourth pair of template families per category — twenty
// more each, 640 in total, on top of the 1,920 that v6, v7 and v8 added.
//
// What is left to draw, and an honest note about it:
//
//   v6 took the missing basics, v7 the second tier, v8 the composite and
//   domain shapes. This wave goes wide across all 32 categories because
//   that is what was asked for, and the categories are no longer in the
//   same condition as each other. Three groups:
//
//   Still genuinely short of shapes — Charts, Tables, Forms, Micro-
//   interactions, Timelines. A radar chart, a waterfall, a grouped-row
//   table with subtotals, a card-number field and a branching git-graph
//   timeline are all things the catalog could not draw before today.
//   These are the strongest entries in the wave.
//
//   Thinning but workable — Buttons, Cards, Loaders, Navigation, Scroll,
//   Toggles, Tooltips, Modals. The obvious nouns are taken, so these
//   reach for the specific-but-real: slide-to-unlock, pull-to-refresh,
//   the indeterminate parent checkbox, the footer sitemap.
//
//   Out of distinct shapes — Dividers above all, then Badges, Skeletons,
//   Borders. A zigzag divider and an ornament divider are new forms, but
//   they are new the way a fourth kind of horizontal rule is new. They
//   were flagged as exhausted before this wave ran and shipping them
//   does not un-exhaust them. Anyone reading the catalog by category
//   should know which paragraph a given entry came from.
//
// Same arithmetic throughout: `GRADPAIRS` (12) + `TRIOS` (8) = 20 per
// category. Tokens and helpers from generate-effects.mjs, dark preview
// surface, guards applied at assembly by `withMotionGuard`.
//
// One constraint worth restating, since several families here animate on
// a loop: the assembled guard collapses an animation to 1ms and runs it
// ONCE, so the element rests wherever the 100% keyframe puts it. Every
// infinite keyframe below therefore ends where it began, or ends
// somewhere deliberately chosen as the still state.

import { rgbOf } from './generate-effects-modern.mjs'

export function generateV9(ctx) {
  const { GRADPAIRS, TRIOS, cls, mk, add } = ctx

  /* ============================================================
   *  3D & PERSPECTIVE — vanishing-point floor grid  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-3d-floor-${g.name}`)
    const html = `<div class="${c}"><i class="sky"></i><i class="sun"></i><div class="stage"><i class="grid"></i></div></div>`
    const css = `.${c} {
  position: relative;
  width: 238px;
  height: 142px;
  overflow: hidden;
  border-radius: 0.55rem;
  background: #05070f;
  perspective: 150px;
  perspective-origin: 50% 0%;
}
.${c} .sky {
  position: absolute;
  inset: 0 0 50% 0;
  background: linear-gradient(180deg, #05070f, ${g.b});
  opacity: 0.55;
}
.${c} .sun {
  position: absolute;
  left: 50%;
  top: 20%;
  width: 74px;
  height: 74px;
  margin-left: -37px;
  border-radius: 50%;
  background: linear-gradient(180deg, ${g.a}, ${g.b});
  box-shadow: 0 0 44px rgba(${rgbOf(g.a)}, 0.6);
}
.${c} .stage {
  position: absolute;
  inset: 50% 0 0 0;
  overflow: hidden;
  transform-style: preserve-3d;
}
.${c} .grid {
  position: absolute;
  left: -50%;
  width: 200%;
  height: 300%;
  background-image:
    linear-gradient(90deg, rgba(${rgbOf(g.a)}, 0.75) 1px, transparent 1px),
    linear-gradient(0deg, rgba(${rgbOf(g.b)}, 0.75) 1px, transparent 1px);
  background-size: 32px 32px;
  transform: rotateX(78deg);
  transform-origin: 50% 0%;
  animation: ${c}-run 1.6s linear infinite;
}
@keyframes ${c}-run {
  from { background-position: 0 0; }
  to   { background-position: 0 32px; }
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgba(5,7,15,0.85));
  pointer-events: none;
}`
    add(mk({
      name: `${g.name} Perspective Floor`,
      category: '3D & Perspective',
      description: `Ground plane laid flat under an 78-degree rotateX so the grid converges on a horizon, with the background position scrolling one cell per cycle to read as forward travel.`,
      html, css,
      tags: ['3d', 'perspective', 'grid', 'horizon', 'retro', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  3D & PERSPECTIVE — rotating four-face prism  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-3d-prism-${t.name}`)
    const html = `<div class="${c}"><div class="drum"><span class="f1">Design</span><span class="f2">Build</span><span class="f3">Ship</span><span class="f4">Scale</span></div></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 190px;
  height: 96px;
  perspective: 520px;
}
.${c} .drum {
  position: relative;
  width: 150px;
  height: 44px;
  transform-style: preserve-3d;
  transition: transform 0.7s cubic-bezier(0.62, 0.02, 0.34, 1);
}
.${c}:hover .drum { transform: rotateX(-90deg); }
.${c} span {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 0.4rem;
  font-size: 0.9rem;
  font-weight: 650;
  letter-spacing: 0.02em;
  color: #f8fafc;
  backface-visibility: hidden;
}
.${c} .f1 { background: linear-gradient(135deg, ${t.a}, ${t.b}); transform: rotateX(0deg)    translateZ(22px); }
.${c} .f2 { background: linear-gradient(135deg, ${t.b}, ${t.c}); transform: rotateX(90deg)   translateZ(22px); }
.${c} .f3 { background: linear-gradient(135deg, ${t.c}, ${t.a}); transform: rotateX(180deg)  translateZ(22px); }
.${c} .f4 { background: linear-gradient(135deg, ${t.a}, ${t.c}); transform: rotateX(270deg)  translateZ(22px); }`
    add(mk({
      name: `${t.name} Prism Drum`,
      category: '3D & Perspective',
      description: `Four labelled faces mounted around a shared axis at a quarter turn each, the drum rotating one detent on hover so the next word rolls up into place.`,
      html, css,
      tags: ['3d', 'prism', 'drum', 'rotate', 'faces', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ACCORDIONS & TABS — faceted filter groups  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-acc-facet-${g.name}`)
    const html = `<div class="${c}"><details open><summary>Category<b>3</b></summary><label><i></i>Headphones<em>84</em></label><label><i class="on"></i>Speakers<em>37</em></label><label><i></i>Turntables<em>12</em></label></details><details><summary>Price<b>1</b></summary><label><i></i>Under $100<em>52</em></label></details></div>`
    const css = `.${c} {
  width: 214px;
  padding: 0.3rem 0.55rem;
  border-radius: 0.55rem;
  background: #0f172a;
  border: 1px solid #1e293b;
}
.${c} details { border-bottom: 1px solid #1e293b; }
.${c} details:last-child { border-bottom: none; }
.${c} summary {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0;
  font-size: 0.78rem;
  font-weight: 650;
  color: #e2e8f0;
  cursor: pointer;
  list-style: none;
}
.${c} summary::-webkit-details-marker { display: none; }
.${c} summary::after {
  content: '';
  order: 3;
  width: 6px;
  height: 6px;
  border-right: 1.6px solid #64748b;
  border-bottom: 1.6px solid #64748b;
  transform: rotate(45deg);
  transition: transform 0.25s ease;
}
.${c} details[open] summary::after { transform: rotate(-135deg); }
.${c} summary b {
  margin-left: auto;
  padding: 0.05rem 0.32rem;
  border-radius: 999px;
  font-size: 0.62rem;
  color: #0b1120;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c} label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.3rem 0 0.3rem 0.1rem;
  font-size: 0.74rem;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.15s ease;
}
.${c} label:last-child { padding-bottom: 0.6rem; }
.${c} label:hover { color: #e2e8f0; }
.${c} label i {
  flex: none;
  width: 13px;
  height: 13px;
  border-radius: 0.22rem;
  border: 1.5px solid #334155;
  transition: background 0.18s ease, border-color 0.18s ease;
}
.${c} label i.on {
  border-color: transparent;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c} label em {
  margin-left: auto;
  font-style: normal;
  font-size: 0.66rem;
  color: #475569;
}`
    add(mk({
      name: `${g.name} Facet Filters`,
      category: 'Accordions & Tabs',
      description: `Stacked filter groups on native details elements, each summary carrying its active count and each row its result tally so the panel reads before it is opened.`,
      html, css,
      tags: ['accordion', 'filters', 'facets', 'sidebar', 'details', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ACCORDIONS & TABS — overflow menu for tabs  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-acc-overflow-${t.name}`)
    const html = `<div class="${c}"><div class="bar"><button class="on">Overview</button><button>Activity</button><button>Files</button><button class="more">+2<i></i></button></div><div class="pop"><span>Settings</span><span>Members</span></div></div>`
    const css = `.${c} {
  position: relative;
  width: 250px;
  padding-bottom: 62px;
}
.${c} .bar {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.25rem;
  border-radius: 0.5rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} .bar button {
  padding: 0.34rem 0.5rem;
  border: none;
  border-radius: 0.35rem;
  background: transparent;
  font-size: 0.73rem;
  color: #94a3b8;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} .bar button:hover { color: #e2e8f0; background: #1f2937; }
.${c} .bar .on {
  color: #0b1120;
  font-weight: 650;
  background: linear-gradient(135deg, ${t.a}, ${t.b});
}
.${c} .more {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: auto;
}
.${c} .more i {
  width: 5px;
  height: 5px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg) translate(-1px, -1px);
  transition: transform 0.22s ease;
}
.${c}:hover .more i { transform: rotate(-135deg); }
.${c} .pop {
  position: absolute;
  right: 0;
  top: 46px;
  display: grid;
  width: 128px;
  padding: 0.25rem;
  border-radius: 0.5rem;
  background: #0f172a;
  border: 1px solid ${t.b};
  box-shadow: 0 12px 30px rgba(0,0,0,0.5);
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
  transform-origin: top right;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.${c}:hover .pop { opacity: 1; transform: none; pointer-events: auto; }
.${c} .pop span {
  padding: 0.36rem 0.45rem;
  border-radius: 0.3rem;
  font-size: 0.73rem;
  color: #cbd5e1;
  cursor: pointer;
  transition: background 0.14s ease;
}
.${c} .pop span:hover { background: #1e293b; }`
    add(mk({
      name: `${t.name} Tab Overflow`,
      category: 'Accordions & Tabs',
      description: `Tab strip that stops at the width it has and parks the remainder behind a counted overflow button, the popover anchored to its top-right corner.`,
      html, css,
      tags: ['tabs', 'overflow', 'menu', 'responsive', 'popover', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ALERTS & TOASTS — expandable error with detail  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-alert-detail-${g.name}`)
    const html = `<details class="${c}"><summary><i class="ic">!</i><b>Deploy failed</b><em>Show detail</em></summary><pre>Error: ENOENT build/manifest.json
  at resolveManifest (build.js:214)
  at async run (cli.js:48)</pre></details>`
    const css = `.${c} {
  width: 262px;
  overflow: hidden;
  border-radius: 0.55rem;
  background: #111827;
  border: 1px solid #1f2937;
  border-left: 3px solid ${g.a};
}
.${c} summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.7rem;
  cursor: pointer;
  list-style: none;
}
.${c} summary::-webkit-details-marker { display: none; }
.${c} .ic {
  flex: none;
  display: grid;
  place-items: center;
  width: 19px;
  height: 19px;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 800;
  font-style: normal;
  color: #0b1120;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c} b { font-size: 0.79rem; font-weight: 600; color: #f1f5f9; }
.${c} em {
  margin-left: auto;
  font-style: normal;
  font-size: 0.68rem;
  color: ${g.b};
}
.${c}[open] em::after { content: ' ▲'; font-size: 0.55rem; }
.${c}:not([open]) em::after { content: ' ▼'; font-size: 0.55rem; }
.${c} pre {
  margin: 0;
  padding: 0.6rem 0.7rem 0.7rem;
  border-top: 1px solid #1f2937;
  background: #0b1120;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.64rem;
  line-height: 1.55;
  color: #94a3b8;
  white-space: pre;
  overflow-x: auto;
}`
    add(mk({
      name: `${g.name} Detail Alert`,
      category: 'Alerts & Toasts',
      description: `Failure banner that keeps the stack trace folded behind a disclosure, so the summary stays one line and the detail is one click away rather than a separate screen.`,
      html, css,
      tags: ['alert', 'error', 'details', 'stack trace', 'disclosure', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ALERTS & TOASTS — permission request bar  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-alert-perm-${t.name}`)
    const html = `<div class="${c}"><i class="ic"></i><div class="tx"><b>Allow notifications?</b><span>hoverlab.dev wants to notify you</span></div><div class="ac"><button class="no">Block</button><button class="yes">Allow</button></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 300px;
  padding: 0.6rem 0.7rem;
  border-radius: 0.6rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  box-shadow: 0 14px 34px rgba(0,0,0,0.45);
}
.${c} .ic {
  position: relative;
  flex: none;
  width: 15px;
  height: 14px;
  border-radius: 7px 7px 2px 2px;
  background: linear-gradient(135deg, ${t.a}, ${t.b});
}
.${c} .ic::after {
  content: '';
  position: absolute;
  left: -3px;
  right: -3px;
  bottom: -3px;
  height: 2px;
  border-radius: 1px;
  background: ${t.c};
}
.${c} .tx { display: grid; gap: 0.1rem; min-width: 0; }
.${c} .tx b { font-size: 0.76rem; font-weight: 600; color: #f1f5f9; }
.${c} .tx span {
  font-size: 0.66rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.${c} .ac { display: flex; gap: 0.3rem; margin-left: auto; }
.${c} .ac button {
  padding: 0.3rem 0.5rem;
  border-radius: 0.35rem;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.16s ease, background 0.16s ease;
}
.${c} .no {
  border: 1px solid #334155;
  background: transparent;
  color: #94a3b8;
}
.${c} .no:hover { background: #1e293b; }
.${c} .yes {
  border: none;
  color: #0b1120;
  background: linear-gradient(135deg, ${t.b}, ${t.c});
}
.${c} .yes:hover { filter: brightness(1.1); }`
    add(mk({
      name: `${t.name} Permission Prompt`,
      category: 'Alerts & Toasts',
      description: `Consent bar in the shape a browser uses for it — origin under the ask, block and allow weighted differently, the whole thing sized to sit under an address bar.`,
      html, css,
      tags: ['alert', 'permission', 'consent', 'prompt', 'notifications', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  AVATARS & IMAGES — progressive blur-up load  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-avatar-progressive-${g.name}`)
    const html = `<div class="${c}"><i class="lo"></i><i class="hi"></i><span>Loading full resolution</span></div>`
    const css = `.${c} {
  position: relative;
  width: 218px;
  height: 138px;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #0b1120;
}
.${c} i { position: absolute; inset: 0; }
.${c} .lo {
  background:
    radial-gradient(50% 60% at 28% 32%, ${g.a}, transparent 70%),
    radial-gradient(60% 70% at 76% 70%, ${g.b}, transparent 72%),
    linear-gradient(150deg, #1e293b, #0b1120);
  filter: blur(14px) saturate(1.4);
  transform: scale(1.15);
}
.${c} .hi {
  background:
    radial-gradient(38% 46% at 28% 32%, ${g.a}, transparent 68%),
    radial-gradient(44% 52% at 76% 70%, ${g.b}, transparent 70%),
    repeating-linear-gradient(58deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 7px),
    linear-gradient(150deg, #1e293b, #0b1120);
  opacity: 0;
  transition: opacity 0.55s ease;
}
.${c}:hover .hi { opacity: 1; }
.${c} span {
  position: absolute;
  left: 0.6rem;
  bottom: 0.6rem;
  padding: 0.16rem 0.42rem;
  border-radius: 999px;
  font-size: 0.63rem;
  color: #cbd5e1;
  background: rgba(11,17,32,0.72);
  backdrop-filter: blur(6px);
  transition: opacity 0.3s ease;
}
.${c}:hover span { opacity: 0; }`
    add(mk({
      name: `${g.name} Progressive Load`,
      category: 'Avatars & Images',
      description: `Blurred low-resolution stand-in sitting under the full image, the sharp layer fading over it and the status pill dropping out once there is nothing left to wait for.`,
      html, css,
      tags: ['image', 'progressive', 'blur-up', 'placeholder', 'loading', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  AVATARS & IMAGES — upload ring with camera badge  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-avatar-upload-${t.name}`)
    const html = `<div class="${c}"><div class="ring"><div class="face">AR</div></div><i class="cam"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 92px;
  height: 92px;
}
.${c} .ring {
  display: grid;
  place-items: center;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: conic-gradient(${t.a} 0deg, ${t.b} 150deg, ${t.c} 252deg, #1e293b 252deg 360deg);
  animation: ${c}-fill 2.4s cubic-bezier(0.5, 0, 0.2, 1) infinite;
}
@keyframes ${c}-fill {
  0%   { background: conic-gradient(${t.a} 0deg, #1e293b 0deg 360deg); }
  70%  { background: conic-gradient(${t.a} 0deg, ${t.b} 150deg, ${t.c} 252deg, #1e293b 252deg 360deg); }
  100% { background: conic-gradient(${t.a} 0deg, ${t.b} 150deg, ${t.c} 252deg, #1e293b 252deg 360deg); }
}
.${c} .face {
  display: grid;
  place-items: center;
  width: 78px;
  height: 78px;
  border-radius: 50%;
  font-size: 1.4rem;
  font-weight: 650;
  color: #e2e8f0;
  background: #111827;
  box-shadow: inset 0 0 0 3px #0b1120;
}
.${c} .cam {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 27px;
  height: 21px;
  border-radius: 0.32rem;
  background: linear-gradient(135deg, ${t.b}, ${t.c});
  box-shadow: 0 0 0 3px #0b1120;
  cursor: pointer;
  transition: transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} .cam::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 9px;
  height: 9px;
  margin: -4.5px 0 0 -4.5px;
  border-radius: 50%;
  border: 2px solid #0b1120;
}
.${c} .cam::after {
  content: '';
  position: absolute;
  left: 7px;
  top: -3px;
  width: 9px;
  height: 4px;
  border-radius: 2px 2px 0 0;
  background: inherit;
}
.${c}:hover .cam { transform: scale(1.12); }`
    add(mk({
      name: `${t.name} Upload Ring`,
      category: 'Avatars & Images',
      description: `Profile photo wrapped in a conic progress ring that fills as the upload lands, with a camera affordance notched out of the lower-right corner.`,
      html, css,
      tags: ['avatar', 'upload', 'progress', 'ring', 'camera', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BACKGROUNDS — cellular / voronoi field  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-bg-cells-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 250px;
  height: 150px;
  border-radius: 0.55rem;
  background-color: #060913;
  background-image:
    radial-gradient(circle at 18% 24%, rgba(${rgbOf(g.a)}, 0.55) 0, transparent 26%),
    radial-gradient(circle at 62% 12%, rgba(${rgbOf(g.b)}, 0.5) 0, transparent 24%),
    radial-gradient(circle at 86% 42%, rgba(${rgbOf(g.a)}, 0.45) 0, transparent 25%),
    radial-gradient(circle at 34% 66%, rgba(${rgbOf(g.b)}, 0.5) 0, transparent 27%),
    radial-gradient(circle at 72% 84%, rgba(${rgbOf(g.a)}, 0.4) 0, transparent 23%),
    radial-gradient(circle at 8% 88%, rgba(${rgbOf(g.b)}, 0.45) 0, transparent 22%);
  background-size: 100% 100%;
  animation: ${c}-drift 9s ease-in-out infinite;
}
@keyframes ${c}-drift {
  0%   { background-position: 0 0, 0 0, 0 0, 0 0, 0 0, 0 0; }
  50%  { background-position: 12px -8px, -14px 10px, 9px 12px, -10px -12px, 14px 6px, -8px 9px; }
  100% { background-position: 0 0, 0 0, 0 0, 0 0, 0 0, 0 0; }
}`
    add(mk({
      name: `${g.name} Cellular Field`,
      category: 'Backgrounds',
      description: `Six overlapping radial cells at fixed seed positions, each drifting on its own vector so the field reorganises without any single blob reading as the subject.`,
      html, css,
      tags: ['background', 'cellular', 'voronoi', 'organic', 'drift', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BACKGROUNDS — diagonal rain streaks  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-bg-rain-${t.name}`)
    const html = `<div class="${c}"><i class="l1"></i><i class="l2"></i><i class="l3"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 250px;
  height: 150px;
  overflow: hidden;
  border-radius: 0.55rem;
  background: linear-gradient(170deg, #0b1224, #05070f);
}
.${c} i {
  position: absolute;
  inset: -60% -20%;
  background-repeat: repeat;
}
.${c} .l1 {
  background-image: repeating-linear-gradient(74deg, rgba(${rgbOf(t.a)}, 0.55) 0 1px, transparent 1px 26px);
  animation: ${c}-fall 0.75s linear infinite;
}
.${c} .l2 {
  background-image: repeating-linear-gradient(74deg, rgba(${rgbOf(t.b)}, 0.4) 0 1px, transparent 1px 38px);
  animation: ${c}-fall 1.15s linear infinite;
}
.${c} .l3 {
  background-image: repeating-linear-gradient(74deg, rgba(${rgbOf(t.c)}, 0.3) 0 1px, transparent 1px 54px);
  animation: ${c}-fall 1.7s linear infinite;
}
@keyframes ${c}-fall {
  from { transform: translate(0, 0); }
  to   { transform: translate(-26px, 92px); }
}`
    add(mk({
      name: `${t.name} Rain Streaks`,
      category: 'Backgrounds',
      description: `Three repeating-gradient sheets falling at different rates and densities, the parallax between them doing the work that individual raindrop elements would otherwise cost.`,
      html, css,
      tags: ['background', 'rain', 'streaks', 'parallax', 'weather', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BADGES & TAGS — trend delta chip  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-badge-delta-${g.name}`)
    const html = `<span class="${c}"><i></i>12.4%</span>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  padding: 0.18rem 0.48rem 0.18rem 0.38rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  color: ${g.b};
  background: rgba(${rgbOf(g.b)}, 0.12);
  box-shadow: inset 0 0 0 1px rgba(${rgbOf(g.b)}, 0.32);
  transition: background 0.18s ease, transform 0.18s ease;
}
.${c} i {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 6px solid ${g.a};
  transition: transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c}:hover {
  background: rgba(${rgbOf(g.b)}, 0.2);
  transform: translateY(-1px);
}
.${c}:hover i { transform: translateY(-2px); }`
    add(mk({
      name: `${g.name} Delta Chip`,
      category: 'Badges & Tags',
      description: `Percentage-change pill with a border-drawn caret, tabular figures so a column of them stays aligned, and a tinted fill derived from the same hue as the arrow.`,
      html, css,
      tags: ['badge', 'delta', 'trend', 'percentage', 'metric', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BADGES & TAGS — pennant priority flag  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-badge-pennant-${t.name}`)
    const html = `<span class="${c}">P1 · Urgent</span>`
    const css = `.${c} {
  display: inline-block;
  padding: 0.26rem 1.05rem 0.26rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #0b1120;
  background: linear-gradient(100deg, ${t.a}, ${t.b} 60%, ${t.c});
  clip-path: polygon(0 0, 100% 0, calc(100% - 11px) 50%, 100% 100%, 0 100%);
  transition: clip-path 0.24s ease, filter 0.24s ease;
}
.${c}:hover {
  clip-path: polygon(0 0, 100% 0, calc(100% - 4px) 50%, 100% 100%, 0 100%);
  filter: brightness(1.08);
}`
    add(mk({
      name: `${t.name} Priority Pennant`,
      category: 'Badges & Tags',
      description: `Swallow-tail flag cut from a single clip-path, the notch shallowing on hover so the tag squares off as it is picked out of a list.`,
      html, css,
      tags: ['badge', 'pennant', 'priority', 'flag', 'clip-path', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BORDERS & OUTLINES — notched legend border  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-border-notch-${g.name}`)
    const html = `<div class="${c}"><span class="lg">Connection</span><p>Region and endpoint are resolved at request time.</p></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  padding: 0.95rem 0.85rem 0.85rem;
  border-radius: 0.5rem;
  border: 1.5px solid transparent;
  background:
    linear-gradient(#0b1120, #0b1120) padding-box,
    linear-gradient(120deg, ${g.a}, ${g.b}) border-box;
  transition: transform 0.24s ease;
}
.${c} .lg {
  position: absolute;
  top: -0.52rem;
  left: 0.7rem;
  padding: 0 0.38rem;
  background: #0b1120;
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${g.b};
  transition: color 0.24s ease;
}
.${c} p {
  margin: 0;
  font-size: 0.73rem;
  line-height: 1.55;
  color: #94a3b8;
}
.${c}:hover { transform: translateY(-2px); }
.${c}:hover .lg { color: ${g.a}; }`
    add(mk({
      name: `${g.name} Notched Legend`,
      category: 'Borders & Outlines',
      description: `Fieldset-style frame where the label sits in a gap punched through the stroke, the notch made by matching the label background to the surface rather than by clipping.`,
      html, css,
      tags: ['border', 'legend', 'fieldset', 'notch', 'gradient', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BORDERS & OUTLINES — rotating segmented ring  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-border-segring-${t.name}`)
    const html = `<div class="${c}"><i class="seg"></i><span>Scanning</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 132px;
  height: 132px;
  border-radius: 50%;
  background: #0b1120;
}
.${c} .seg {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  padding: 2px;
  background: conic-gradient(${t.a} 0 14deg, transparent 14deg 30deg, ${t.b} 30deg 44deg, transparent 44deg 60deg, ${t.c} 60deg 74deg, transparent 74deg 90deg);
  background-repeat: repeat;
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
  animation: ${c}-spin 4s linear infinite;
}
@keyframes ${c}-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.${c} span {
  font-size: 0.74rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
}`
    add(mk({
      name: `${t.name} Segmented Ring`,
      category: 'Borders & Outlines',
      description: `Dashed arc border built from a conic gradient rather than dash properties, masked to a hairline so the segments can carry three colours and still rotate as one piece.`,
      html, css,
      tags: ['border', 'ring', 'segments', 'conic', 'rotate', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BUTTONS — slide to unlock track  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-btn-slide-${g.name}`)
    const html = `<div class="${c}"><span class="hint">Slide to deploy</span><i class="fill"></i><button class="knob"><b></b></button></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: center;
  width: 232px;
  height: 46px;
  padding: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: #111827;
  box-shadow: inset 0 0 0 1px #1f2937;
}
.${c} .hint {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #64748b;
  transition: opacity 0.3s ease;
}
.${c} .fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 46px;
  border-radius: 999px;
  background: linear-gradient(100deg, ${g.a}, ${g.b});
  opacity: 0.22;
  transition: width 0.42s cubic-bezier(0.5, 0, 0.2, 1);
}
.${c} .knob {
  position: relative;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  cursor: grab;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  box-shadow: 0 4px 14px rgba(${rgbOf(g.a)}, 0.5);
  transition: transform 0.42s cubic-bezier(0.5, 0, 0.2, 1);
}
.${c} .knob b {
  width: 8px;
  height: 8px;
  border-top: 2px solid #0b1120;
  border-right: 2px solid #0b1120;
  transform: rotate(45deg) translate(-1px, 1px);
}
.${c}:hover .fill { width: 100%; }
.${c}:hover .hint { opacity: 0; }
.${c}:hover .knob { transform: translateX(186px); }
.${c} .knob:active { cursor: grabbing; }`
    add(mk({
      name: `${g.name} Slide to Unlock`,
      category: 'Buttons',
      description: `Drag-track confirmation where the knob travels the full width and a tinted fill follows it, the prompt fading out once the gesture is past the point of being accidental.`,
      html, css,
      tags: ['button', 'slide', 'unlock', 'confirm', 'gesture', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BUTTONS — download progress morph  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-btn-download-${t.name}`)
    const html = `<button class="${c}"><span class="lb">Download</span><i class="bar"></i><i class="tick"></i></button>`
    const css = `.${c} {
  position: relative;
  width: 158px;
  height: 42px;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  overflow: hidden;
  background: linear-gradient(135deg, ${t.a}, ${t.b});
  animation: ${c}-run 3.6s cubic-bezier(0.5, 0, 0.2, 1) infinite;
}
@keyframes ${c}-run {
  0%, 18%   { width: 158px; border-radius: 0.5rem; }
  36%, 74%  { width: 158px; border-radius: 0.5rem; }
  92%, 100% { width: 158px; border-radius: 0.5rem; }
}
.${c} .lb {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 0.8rem;
  font-weight: 650;
  color: #0b1120;
  animation: ${c}-label 3.6s ease infinite;
}
@keyframes ${c}-label {
  0%, 16%   { opacity: 1; }
  24%, 76%  { opacity: 0; }
  88%, 100% { opacity: 0; }
}
.${c} .bar {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 50%;
  height: 4px;
  margin-top: -2px;
  border-radius: 2px;
  background: rgba(11,17,32,0.3);
  opacity: 0;
  animation: ${c}-track 3.6s ease infinite;
}
@keyframes ${c}-track {
  0%, 18%   { opacity: 0; }
  26%, 72%  { opacity: 1; }
  80%, 100% { opacity: 0; }
}
.${c} .bar::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 2px;
  background: #0b1120;
  animation: ${c}-fill 3.6s cubic-bezier(0.4, 0, 0.3, 1) infinite;
}
@keyframes ${c}-fill {
  0%, 22%   { width: 0%; }
  70%, 100% { width: 100%; }
}
.${c} .tick {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 15px;
  height: 8px;
  margin: -6px 0 0 -8px;
  border-left: 2.5px solid #0b1120;
  border-bottom: 2.5px solid #0b1120;
  transform: rotate(-45deg) scale(0.4);
  opacity: 0;
  animation: ${c}-done 3.6s cubic-bezier(0.34, 1.5, 0.64, 1) infinite;
}
@keyframes ${c}-done {
  0%, 74%   { opacity: 0; transform: rotate(-45deg) scale(0.4); }
  84%, 96%  { opacity: 1; transform: rotate(-45deg) scale(1); }
  100%      { opacity: 0; transform: rotate(-45deg) scale(0.4); }
}`
    add(mk({
      name: `${t.name} Download Progress`,
      category: 'Buttons',
      description: `One control carrying three states in sequence — label, determinate bar, then a checkmark — so the transfer never leaves the place the user clicked to start it.`,
      html, css,
      tags: ['button', 'download', 'progress', 'states', 'success', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CARDS — resumable progress card  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-card-progress-${g.name}`)
    const html = `<article class="${c}"><div class="cov"><span class="dur">42m left</span></div><div class="bd"><b>Advanced CSS Layout</b><span>Module 4 of 9</span><i class="tr"><i class="fl"></i></i><button>Resume</button></div></article>`
    const css = `.${c} {
  width: 226px;
  overflow: hidden;
  border-radius: 0.7rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  transition: transform 0.26s ease, border-color 0.26s ease;
}
.${c}:hover { transform: translateY(-3px); border-color: ${g.b}; }
.${c} .cov {
  position: relative;
  height: 92px;
  background:
    radial-gradient(60% 80% at 25% 20%, rgba(${rgbOf(g.a)}, 0.85), transparent 70%),
    linear-gradient(135deg, ${g.b}, #0b1120);
}
.${c} .dur {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  padding: 0.13rem 0.4rem;
  border-radius: 999px;
  font-size: 0.62rem;
  color: #e2e8f0;
  background: rgba(11,17,32,0.6);
  backdrop-filter: blur(5px);
}
.${c} .bd { display: grid; gap: 0.35rem; padding: 0.7rem 0.75rem 0.8rem; }
.${c} .bd b { font-size: 0.83rem; font-weight: 650; color: #f1f5f9; }
.${c} .bd > span { font-size: 0.68rem; color: #64748b; }
.${c} .tr {
  height: 5px;
  margin: 0.15rem 0 0.3rem;
  border-radius: 3px;
  background: #1e293b;
  overflow: hidden;
}
.${c} .fl {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  animation: ${c}-fill 1.5s cubic-bezier(0.4, 0, 0.2, 1) 1 both;
}
@keyframes ${c}-fill { from { width: 0; } to { width: 44%; } }
.${c} button {
  padding: 0.42rem;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 650;
  color: #0b1120;
  cursor: pointer;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  transition: filter 0.18s ease;
}
.${c} button:hover { filter: brightness(1.1); }`
    add(mk({
      name: `${g.name} Progress Card`,
      category: 'Cards',
      description: `Course-style tile that leads with how much is left rather than what it is, the meter animating to its real position once so a reduced-motion reader still sees 44 percent.`,
      html, css,
      tags: ['card', 'progress', 'course', 'resume', 'media', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CARDS — dashed empty state  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-card-empty-${t.name}`)
    const html = `<div class="${c}"><i class="ic"><b></b></i><b class="ti">No projects yet</b><span>Create one to see it here.</span><button>New project</button></div>`
    const css = `.${c} {
  display: grid;
  justify-items: center;
  gap: 0.3rem;
  width: 224px;
  padding: 1.5rem 1.1rem 1.3rem;
  text-align: center;
  border-radius: 0.7rem;
  border: 1.5px dashed #1e293b;
  background: rgba(15,23,42,0.5);
  transition: border-color 0.26s ease, background 0.26s ease;
}
.${c}:hover { border-color: ${t.b}; background: rgba(15,23,42,0.85); }
.${c} .ic {
  position: relative;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  margin-bottom: 0.35rem;
  border-radius: 0.6rem;
  background: linear-gradient(135deg, rgba(${rgbOf(t.a)}, 0.2), rgba(${rgbOf(t.c)}, 0.2));
  box-shadow: inset 0 0 0 1px rgba(${rgbOf(t.b)}, 0.35);
  transition: transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c}:hover .ic { transform: translateY(-2px) rotate(-6deg); }
.${c} .ic b {
  width: 16px;
  height: 2px;
  border-radius: 1px;
  background: ${t.b};
  box-shadow: 0 0 0 0 transparent;
}
.${c} .ic b::after {
  content: '';
  display: block;
  width: 2px;
  height: 16px;
  margin: -7px 0 0 7px;
  border-radius: 1px;
  background: ${t.b};
}
.${c} .ti { font-size: 0.82rem; font-weight: 650; color: #e2e8f0; }
.${c} > span { font-size: 0.7rem; color: #64748b; }
.${c} button {
  margin-top: 0.6rem;
  padding: 0.38rem 0.8rem;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.73rem;
  font-weight: 650;
  color: #0b1120;
  cursor: pointer;
  background: linear-gradient(135deg, ${t.b}, ${t.c});
  transition: filter 0.18s ease;
}
.${c} button:hover { filter: brightness(1.1); }`
    add(mk({
      name: `${t.name} Empty State Card`,
      category: 'Cards',
      description: `Placeholder panel with a dashed edge that reads as a slot waiting to be filled, the plus glyph tilting on hover so the whole card behaves like one target.`,
      html, css,
      tags: ['card', 'empty state', 'placeholder', 'dashed', 'onboarding', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CHARTS & DATA — radar / spider polygon  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-chart-radar-${g.name}`)
    const html = `<div class="${c}"><i class="web"></i><i class="poly"></i><span class="s1">Speed</span><span class="s2">Reach</span><span class="s3">Cost</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 176px;
  height: 168px;
  border-radius: 0.55rem;
  background: #0b1120;
}
.${c} .web {
  position: absolute;
  top: 22px;
  width: 124px;
  height: 124px;
  background:
    repeating-radial-gradient(circle at 50% 50%, transparent 0 19px, rgba(148,163,184,0.16) 19px 20px),
    conic-gradient(from 0deg, rgba(148,163,184,0.16) 0 0.4deg, transparent 0.4deg 60deg,
                   rgba(148,163,184,0.16) 60deg 60.4deg, transparent 60.4deg 120deg,
                   rgba(148,163,184,0.16) 120deg 120.4deg, transparent 120.4deg 180deg,
                   rgba(148,163,184,0.16) 180deg 180.4deg, transparent 180.4deg 240deg,
                   rgba(148,163,184,0.16) 240deg 240.4deg, transparent 240.4deg 300deg,
                   rgba(148,163,184,0.16) 300deg 300.4deg, transparent 300.4deg 360deg);
  border-radius: 50%;
}
.${c} .poly {
  position: absolute;
  top: 22px;
  width: 124px;
  height: 124px;
  background: linear-gradient(150deg, rgba(${rgbOf(g.a)}, 0.55), rgba(${rgbOf(g.b)}, 0.55));
  box-shadow: 0 0 22px rgba(${rgbOf(g.a)}, 0.28);
  clip-path: polygon(50% 6%, 92% 34%, 78% 84%, 30% 92%, 8% 52%, 26% 20%);
  animation: ${c}-plot 1.1s cubic-bezier(0.34, 1.3, 0.64, 1) 1 both;
}
@keyframes ${c}-plot {
  from { transform: scale(0.2); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}
.${c} span {
  position: absolute;
  font-size: 0.62rem;
  color: #64748b;
}
.${c} .s1 { top: 4px;   left: 50%; transform: translateX(-50%); }
.${c} .s2 { bottom: 6px; right: 18px; }
.${c} .s3 { bottom: 6px; left: 18px; }`
    add(mk({
      name: `${g.name} Radar Chart`,
      category: 'Charts & Data',
      description: `Six-axis spider plot where the web is one repeating-radial and one conic gradient, and the series is a single clip-path polygon that scales up from the centre as it plots.`,
      html, css,
      tags: ['chart', 'radar', 'spider', 'polygon', 'multivariate', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CHARTS & DATA — waterfall bridge  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-chart-waterfall-${t.name}`)
    const html = `<div class="${c}"><div class="pl"><i class="b base" style="--h:56px;--y:0px"></i><i class="b up" style="--h:26px;--y:56px"></i><i class="b up" style="--h:18px;--y:82px"></i><i class="b dn" style="--h:22px;--y:78px"></i><i class="b tot" style="--h:78px;--y:0px"></i></div><div class="ax"><span>Q1</span><span>New</span><span>Exp</span><span>Churn</span><span>Q2</span></div></div>`
    const css = `.${c} {
  width: 236px;
  padding: 0.75rem 0.7rem 0.55rem;
  border-radius: 0.55rem;
  background: #0b1120;
  border: 1px solid #1e293b;
}
.${c} .pl {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 104px;
  padding: 0 0.15rem;
  border-bottom: 1px solid #1e293b;
}
.${c} .b {
  position: relative;
  width: 30px;
  height: var(--h);
  margin-bottom: var(--y);
  border-radius: 0.2rem;
  transform-origin: 50% 100%;
  animation: ${c}-rise 0.75s cubic-bezier(0.34, 1.25, 0.64, 1) 1 both;
}
.${c} .b:nth-child(2) { animation-delay: 0.09s; }
.${c} .b:nth-child(3) { animation-delay: 0.18s; }
.${c} .b:nth-child(4) { animation-delay: 0.27s; }
.${c} .b:nth-child(5) { animation-delay: 0.36s; }
@keyframes ${c}-rise {
  from { transform: scaleY(0); opacity: 0; }
  to   { transform: scaleY(1); opacity: 1; }
}
.${c} .base { background: #334155; }
.${c} .up   { background: linear-gradient(180deg, ${t.a}, ${t.b}); }
.${c} .dn   { background: linear-gradient(180deg, ${t.c}, ${t.b}); opacity: 0.75; }
.${c} .tot  { background: linear-gradient(180deg, ${t.b}, ${t.c}); }
.${c} .b:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 0;
  width: 16px;
  border-top: 1px dashed #475569;
}
.${c} .ax {
  display: flex;
  justify-content: space-between;
  padding: 0.35rem 0.15rem 0;
}
.${c} .ax span {
  width: 30px;
  text-align: center;
  font-size: 0.58rem;
  color: #64748b;
}`
    add(mk({
      name: `${t.name} Waterfall Chart`,
      category: 'Charts & Data',
      description: `Bridge from one period total to the next, each floating bar offset by the running balance beneath it and connected by dashed leader lines so the arithmetic is visible.`,
      html, css,
      tags: ['chart', 'waterfall', 'bridge', 'variance', 'finance', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  DIVIDERS & SEPARATORS — zigzag sawtooth  (12)
   *  Note: Dividers were flagged exhausted before this wave. This
   *  is a new form, but it is a fourth kind of horizontal rule.
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-div-zigzag-${g.name}`)
    const html = `<div class="${c}"><i></i></div>`
    const css = `.${c} {
  width: 250px;
  padding: 0.9rem 0;
}
.${c} i {
  display: block;
  height: 10px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  -webkit-mask:
    conic-gradient(from -45deg at 50% 0, #000 0 90deg, transparent 90deg) 50% 0 / 16px 10px repeat-x;
  mask:
    conic-gradient(from -45deg at 50% 0, #000 0 90deg, transparent 90deg) 50% 0 / 16px 10px repeat-x;
  transition: -webkit-mask-size 0.3s ease, mask-size 0.3s ease;
}
.${c}:hover i {
  -webkit-mask-size: 24px 10px;
  mask-size: 24px 10px;
}`
    add(mk({
      name: `${g.name} Zigzag Divider`,
      category: 'Dividers & Separators',
      description: `Sawtooth rule cut with a repeating conic mask rather than drawn as triangles, so the tooth pitch is one background-size value and widens on hover.`,
      html, css,
      tags: ['divider', 'zigzag', 'sawtooth', 'mask', 'separator', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  DIVIDERS & SEPARATORS — centred ornament  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-div-ornament-${t.name}`)
    const html = `<div class="${c}"><i class="r"></i><b class="d"></b><i class="r"></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 250px;
  padding: 0.9rem 0;
}
.${c} .r {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, ${t.a} 45%, ${t.b});
}
.${c} .r:last-child {
  background: linear-gradient(270deg, transparent, ${t.a} 45%, ${t.b});
}
.${c} .d {
  position: relative;
  width: 9px;
  height: 9px;
  background: ${t.c};
  transform: rotate(45deg);
  transition: transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} .d::before,
.${c} .d::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 5px;
  height: 5px;
  margin-top: -2.5px;
  background: ${t.b};
  transform: rotate(0deg);
}
.${c} .d::before { left: -9px; }
.${c} .d::after  { right: -9px; }
.${c}:hover .d { transform: rotate(225deg); }`
    add(mk({
      name: `${t.name} Ornament Divider`,
      category: 'Dividers & Separators',
      description: `Three lozenges at the centre of a pair of rules that taper into the surface, the middle one turning half a revolution on hover while the flankers hold still.`,
      html, css,
      tags: ['divider', 'ornament', 'diamond', 'editorial', 'separator', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ENTRANCE ANIMATIONS — masked line rise  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-ent-linerise-${g.name}`)
    const html = `<div class="${c}"><span class="ln"><b>Build the interface</b></span><span class="ln"><b>your users already</b></span><span class="ln"><b>know how to use.</b></span></div>`
    const css = `.${c} {
  width: 250px;
  padding: 0.4rem 0;
}
.${c} .ln {
  display: block;
  overflow: hidden;
}
.${c} .ln b {
  display: block;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.01em;
  background: linear-gradient(100deg, ${g.a}, ${g.b});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transform: translateY(100%);
  animation: ${c}-rise 0.85s cubic-bezier(0.22, 0.85, 0.3, 1) 1 both;
}
.${c} .ln:nth-child(2) b { animation-delay: 0.11s; }
.${c} .ln:nth-child(3) b { animation-delay: 0.22s; }
@keyframes ${c}-rise {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}`
    add(mk({
      name: `${g.name} Line Rise`,
      category: 'Entrance Animations',
      description: `Each line pushed up out of its own overflow-hidden track on a short stagger, which reads as type setting itself rather than as three blocks sliding in.`,
      html, css,
      tags: ['entrance', 'text', 'mask', 'stagger', 'reveal', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ENTRANCE ANIMATIONS — rolling digit counter  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-ent-counter-${t.name}`)
    const html = `<div class="${c}"><span class="win"><i class="col c1">0123456789</i></span><span class="win"><i class="col c2">0123456789</i></span><span class="win"><i class="col c3">0123456789</i></span><em>%</em></div>`
    const css = `.${c} {
  display: flex;
  align-items: baseline;
  gap: 1px;
  padding: 0.5rem 0;
  font-variant-numeric: tabular-nums;
}
.${c} .win {
  display: block;
  height: 46px;
  overflow: hidden;
}
.${c} .col {
  display: flex;
  flex-direction: column;
  font-size: 2.3rem;
  font-weight: 750;
  line-height: 46px;
  font-style: normal;
  letter-spacing: -0.02em;
  background: linear-gradient(160deg, ${t.a}, ${t.b} 50%, ${t.c});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  white-space: pre;
  writing-mode: vertical-lr;
  text-orientation: upright;
}
.${c} .c1 { animation: ${c}-r1 1.5s cubic-bezier(0.25, 0.9, 0.25, 1) 1 both; }
.${c} .c2 { animation: ${c}-r2 1.7s cubic-bezier(0.25, 0.9, 0.25, 1) 1 both; }
.${c} .c3 { animation: ${c}-r3 1.9s cubic-bezier(0.25, 0.9, 0.25, 1) 1 both; }
@keyframes ${c}-r1 { from { transform: translateY(0); } to { transform: translateY(-414px); } }
@keyframes ${c}-r2 { from { transform: translateY(0); } to { transform: translateY(-138px); } }
@keyframes ${c}-r3 { from { transform: translateY(0); } to { transform: translateY(-322px); } }
.${c} em {
  font-style: normal;
  font-size: 1.2rem;
  font-weight: 650;
  color: #475569;
}`
    add(mk({
      name: `${t.name} Counter Roll`,
      category: 'Entrance Animations',
      description: `Odometer entrance built from three digit columns behind fixed windows, each travelling a different distance and settling at a different moment so it lands like a mechanism.`,
      html, css,
      tags: ['entrance', 'counter', 'odometer', 'number', 'stat', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FILTERS & BLEND MODES — posterize banding  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-filter-poster-${g.name}`)
    const html = `<div class="${c}"><i class="art"></i><i class="steps"></i><span>POSTERIZE</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: end start;
  width: 232px;
  height: 138px;
  padding: 0.6rem 0.7rem;
  overflow: hidden;
  border-radius: 0.55rem;
  background: #0b1120;
  isolation: isolate;
}
.${c} i { position: absolute; inset: 0; }
.${c} .art {
  background:
    radial-gradient(70% 90% at 30% 20%, ${g.a}, transparent 70%),
    linear-gradient(150deg, ${g.b}, #0b1120);
}
.${c} .steps {
  background: repeating-linear-gradient(
    150deg,
    rgba(11,17,32,0)    0 14px,
    rgba(11,17,32,0.34) 14px 28px,
    rgba(11,17,32,0.6)  28px 42px
  );
  mix-blend-mode: multiply;
  transition: opacity 0.4s ease;
}
.${c}:hover .steps { opacity: 0.25; }
.${c} span {
  position: relative;
  z-index: 1;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  color: #f8fafc;
  mix-blend-mode: difference;
}`
    add(mk({
      name: `${g.name} Posterize Bands`,
      category: 'Filters & Blend Modes',
      description: `Continuous gradient quantized into three tone steps by a multiplying repeating-gradient, the banding backing off on hover to show what was thrown away.`,
      html, css,
      tags: ['filter', 'posterize', 'bands', 'quantize', 'blend', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FILTERS & BLEND MODES — x-ray inversion sweep  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-filter-xray-${t.name}`)
    const html = `<div class="${c}"><i class="art"></i><i class="inv"></i><i class="edge"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 234px;
  height: 140px;
  overflow: hidden;
  border-radius: 0.55rem;
  background: #05070f;
}
.${c} i { position: absolute; inset: 0; }
.${c} .art {
  background:
    radial-gradient(45% 60% at 34% 38%, ${t.a}, transparent 68%),
    radial-gradient(50% 65% at 70% 66%, ${t.b}, transparent 70%),
    linear-gradient(160deg, ${t.c}, #05070f);
}
.${c} .inv {
  background: inherit;
  backdrop-filter: invert(1) hue-rotate(180deg) contrast(1.2);
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.6s cubic-bezier(0.5, 0, 0.2, 1);
}
.${c}:hover .inv { clip-path: inset(0 0 0 0); }
.${c} .edge {
  left: 0;
  width: 2px;
  background: #f8fafc;
  box-shadow: 0 0 14px rgba(248,250,252,0.7);
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.5, 0, 0.2, 1), opacity 0.3s ease;
}
.${c}:hover .edge { opacity: 1; transform: translateX(232px); }`
    add(mk({
      name: `${t.name} X-Ray Sweep`,
      category: 'Filters & Blend Modes',
      description: `Inverting backdrop-filter revealed by an animated inset clip, with a lit scan edge riding the boundary so the wipe reads as an instrument passing over the plate.`,
      html, css,
      tags: ['filter', 'invert', 'x-ray', 'scan', 'backdrop', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FORMS & VALIDATION — card number field  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-form-card-${g.name}`)
    const html = `<div class="${c}"><label>Card details</label><div class="row main"><i class="brand"><b></b><b></b></i><span class="num">4242 4242 4242 4242</span></div><div class="row split"><span class="exp">12 / 28</span><span class="cvc">•••</span></div></div>`
    const css = `.${c} {
  display: grid;
  gap: 0.35rem;
  width: 246px;
}
.${c} label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
}
.${c} .row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.6rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c} .main { border-radius: 0.45rem 0.45rem 0 0; }
.${c} .split { border-top: none; border-radius: 0 0 0.45rem 0.45rem; }
.${c} .row:hover,
.${c} .row:focus-within {
  border-color: ${g.b};
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.b)}, 0.14);
}
.${c} .brand {
  position: relative;
  flex: none;
  width: 26px;
  height: 17px;
  border-radius: 0.2rem;
  background: #1e293b;
}
.${c} .brand b {
  position: absolute;
  top: 50%;
  width: 11px;
  height: 11px;
  margin-top: -5.5px;
  border-radius: 50%;
}
.${c} .brand b:first-child { left: 3px;  background: ${g.a}; }
.${c} .brand b:last-child  { right: 3px; background: ${g.b}; mix-blend-mode: screen; }
.${c} .num,
.${c} .exp,
.${c} .cvc {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  color: #e2e8f0;
}
.${c} .split { justify-content: space-between; }
.${c} .cvc { color: #64748b; }`
    add(mk({
      name: `${g.name} Card Number Field`,
      category: 'Forms & Validation',
      description: `Payment entry as one joined control — number above, expiry and CVC sharing the row below — with the detected brand mark sitting inside the field it applies to.`,
      html, css,
      tags: ['form', 'payment', 'card number', 'checkout', 'input group', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FORMS & VALIDATION — repeatable field array  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-form-array-${t.name}`)
    const html = `<div class="${c}"><label>Team invites</label><div class="rw"><span>ada@hoverlab.dev</span><button class="rm"></button></div><div class="rw"><span>grace@hoverlab.dev</span><button class="rm"></button></div><button class="addr"><i></i>Add another</button></div>`
    const css = `.${c} {
  display: grid;
  gap: 0.32rem;
  width: 246px;
}
.${c} label { font-size: 0.7rem; font-weight: 600; color: #94a3b8; }
.${c} .rw {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.4rem 0.45rem 0.6rem;
  border-radius: 0.42rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.${c} .rw:hover { border-color: ${t.b}; transform: translateX(2px); }
.${c} .rw span {
  flex: 1;
  font-size: 0.74rem;
  color: #cbd5e1;
}
.${c} .rm {
  position: relative;
  flex: none;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 0.3rem;
  background: transparent;
  cursor: pointer;
  transition: background 0.16s ease;
}
.${c} .rm:hover { background: rgba(${rgbOf(t.a)}, 0.18); }
.${c} .rm::before,
.${c} .rm::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10px;
  height: 1.6px;
  margin: -0.8px 0 0 -5px;
  border-radius: 1px;
  background: #64748b;
  transition: background 0.16s ease;
}
.${c} .rm::before { transform: rotate(45deg); }
.${c} .rm::after  { transform: rotate(-45deg); }
.${c} .rm:hover::before,
.${c} .rm:hover::after { background: ${t.a}; }
.${c} .addr {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.15rem;
  padding: 0.42rem 0.6rem;
  border-radius: 0.42rem;
  border: 1px dashed #334155;
  background: transparent;
  font-size: 0.73rem;
  color: #94a3b8;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}
.${c} .addr:hover { border-color: ${t.c}; color: #e2e8f0; }
.${c} .addr i {
  position: relative;
  width: 10px;
  height: 10px;
}
.${c} .addr i::before,
.${c} .addr i::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  background: currentColor;
}
.${c} .addr i::before { width: 10px; height: 1.6px; margin: -0.8px 0 0 -5px; }
.${c} .addr i::after  { width: 1.6px; height: 10px; margin: -5px 0 0 -0.8px; }`
    add(mk({
      name: `${t.name} Field Array`,
      category: 'Forms & Validation',
      description: `Repeatable row group where every entry carries its own remove control and the add affordance is dashed, marking it as the one row that is not yet data.`,
      html, css,
      tags: ['form', 'repeatable', 'field array', 'add remove', 'invites', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  GLOW & NEON — plasma globe with arcs  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-glow-plasma-${g.name}`)
    const html = `<div class="${c}"><i class="core"></i><i class="arc a1"></i><i class="arc a2"></i><i class="arc a3"></i></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 138px;
  height: 138px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, rgba(${rgbOf(g.b)}, 0.16), rgba(11,17,32,0.9) 68%);
  box-shadow: inset 0 0 34px rgba(${rgbOf(g.a)}, 0.28), 0 0 40px rgba(${rgbOf(g.a)}, 0.22);
}
.${c} .core {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff, ${g.a} 55%, ${g.b});
  box-shadow: 0 0 22px rgba(${rgbOf(g.a)}, 0.9);
  animation: ${c}-throb 2.4s ease-in-out infinite;
}
@keyframes ${c}-throb {
  0%, 100% { transform: scale(1);    filter: brightness(1); }
  50%      { transform: scale(1.16); filter: brightness(1.3); }
}
.${c} .arc {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 2px;
  height: 52px;
  border-radius: 1px;
  transform-origin: 50% 0;
  background: linear-gradient(180deg, ${g.a}, transparent);
  filter: blur(0.6px) drop-shadow(0 0 5px ${g.b});
}
.${c} .a1 { animation: ${c}-sweep1 3.2s ease-in-out infinite; }
.${c} .a2 { animation: ${c}-sweep2 4.1s ease-in-out infinite; }
.${c} .a3 { animation: ${c}-sweep3 2.7s ease-in-out infinite; }
@keyframes ${c}-sweep1 {
  0%, 100% { transform: rotate(20deg)  skewX(8deg); opacity: 0.9; }
  50%      { transform: rotate(66deg)  skewX(-10deg); opacity: 0.5; }
}
@keyframes ${c}-sweep2 {
  0%, 100% { transform: rotate(150deg) skewX(-6deg); opacity: 0.75; }
  50%      { transform: rotate(196deg) skewX(9deg);  opacity: 1; }
}
@keyframes ${c}-sweep3 {
  0%, 100% { transform: rotate(268deg) skewX(10deg); opacity: 0.6; }
  50%      { transform: rotate(304deg) skewX(-8deg); opacity: 0.95; }
}`
    add(mk({
      name: `${g.name} Plasma Globe`,
      category: 'Glow & Neon',
      description: `Filaments pinned to a pulsing core and swept through short arcs on mismatched cycles, each skewed as it travels so the discharge never looks like a rotating spoke.`,
      html, css,
      tags: ['neon', 'plasma', 'globe', 'arc', 'glow', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  GLOW & NEON — chasing bulb marquee  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-glow-marquee-${t.name}`)
    const html = `<div class="${c}"><i class="bulbs"></i><span>NOW SHOWING</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 230px;
  height: 84px;
  border-radius: 0.5rem;
  background: #0b1120;
  box-shadow: inset 0 0 0 2px rgba(${rgbOf(t.a)}, 0.35);
}
.${c} .bulbs {
  position: absolute;
  inset: 7px;
  border-radius: 0.35rem;
  background:
    radial-gradient(circle, ${t.a} 1.8px, transparent 2.2px) 0 0 / 15px 15px repeat-x,
    radial-gradient(circle, ${t.a} 1.8px, transparent 2.2px) 0 100% / 15px 15px repeat-x,
    radial-gradient(circle, ${t.a} 1.8px, transparent 2.2px) 0 0 / 15px 15px repeat-y,
    radial-gradient(circle, ${t.a} 1.8px, transparent 2.2px) 100% 0 / 15px 15px repeat-y;
  filter: drop-shadow(0 0 4px ${t.b});
  animation: ${c}-chase 0.9s steps(3) infinite;
}
@keyframes ${c}-chase {
  0%   { background-position: 0 0, 0 100%, 0 0, 100% 0; }
  100% { background-position: 15px 0, -15px 100%, 0 15px, 100% -15px; }
}
.${c} span {
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: ${t.c};
  text-shadow: 0 0 6px ${t.b}, 0 0 18px rgba(${rgbOf(t.b)}, 0.7);
}`
    add(mk({
      name: `${t.name} Bulb Marquee`,
      category: 'Glow & Neon',
      description: `Theatre sign whose bulbs are four repeat-axis radial gradients, stepped rather than eased so the chase clicks from lamp to lamp instead of sliding.`,
      html, css,
      tags: ['neon', 'marquee', 'bulbs', 'chase', 'sign', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ICONS & SHAPES — swinging notification bell  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-icon-bell-${g.name}`)
    const html = `<div class="${c}"><i class="body"></i><i class="clap"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 56px;
  height: 60px;
  cursor: pointer;
}
.${c} .body {
  position: absolute;
  left: 50%;
  top: 6px;
  width: 34px;
  height: 34px;
  margin-left: -17px;
  border-radius: 17px 17px 5px 5px;
  background: linear-gradient(160deg, ${g.a}, ${g.b});
  transform-origin: 50% 0;
  transition: transform 0.2s ease;
  animation: ${c}-swing 2.6s ease-in-out infinite;
}
@keyframes ${c}-swing {
  0%, 68%, 100% { transform: rotate(0deg); }
  74%           { transform: rotate(13deg); }
  80%           { transform: rotate(-11deg); }
  86%           { transform: rotate(7deg); }
  92%           { transform: rotate(-4deg); }
}
.${c} .body::before {
  content: '';
  position: absolute;
  left: 50%;
  top: -5px;
  width: 6px;
  height: 6px;
  margin-left: -3px;
  border-radius: 50%;
  background: ${g.a};
}
.${c} .body::after {
  content: '';
  position: absolute;
  left: -7px;
  right: -7px;
  bottom: -4px;
  height: 4px;
  border-radius: 2px;
  background: ${g.b};
}
.${c} .clap {
  position: absolute;
  left: 50%;
  top: 44px;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  border-radius: 50%;
  background: ${g.a};
  box-shadow: 0 0 10px rgba(${rgbOf(g.a)}, 0.6);
  animation: ${c}-clap 2.6s ease-in-out infinite;
}
@keyframes ${c}-clap {
  0%, 68%, 100% { transform: translateX(0); }
  76%           { transform: translateX(5px); }
  84%           { transform: translateX(-4px); }
  92%           { transform: translateX(2px); }
}`
    add(mk({
      name: `${g.name} Ringing Bell`,
      category: 'Icons & Shapes',
      description: `Bell drawn from one rounded block plus a crown and a lip, pivoting at the mount while the clapper runs a second, later-peaking keyframe so the two do not move as one body.`,
      html, css,
      tags: ['icon', 'bell', 'notification', 'swing', 'css shape', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ICONS & SHAPES — circular sync arrows  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-icon-sync-${t.name}`)
    const html = `<div class="${c}"><i class="ring"></i><i class="h1"></i><i class="h2"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 52px;
  height: 52px;
  cursor: pointer;
  animation: ${c}-spin 1.9s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}
@keyframes ${c}-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.${c} .ring {
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  border: 3px solid transparent;
  background: conic-gradient(${t.a} 0 40%, transparent 40% 50%, ${t.b} 50% 90%, transparent 90% 100%) border-box;
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
}
.${c} .h1,
.${c} .h2 {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
}
.${c} .h1 {
  top: 3px;
  left: 26px;
  border-bottom: 8px solid ${t.a};
  transform: rotate(38deg);
}
.${c} .h2 {
  bottom: 3px;
  right: 26px;
  border-top: 8px solid ${t.c};
  transform: rotate(38deg);
}`
    add(mk({
      name: `${t.name} Sync Arrows`,
      category: 'Icons & Shapes',
      description: `Two gapped arcs cut from one conic gradient with border-drawn heads at each opening, the whole glyph spinning on an ease that speeds through the middle of each turn.`,
      html, css,
      tags: ['icon', 'sync', 'refresh', 'arrows', 'spin', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  INPUTS & HOVER — mention autocomplete  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-input-mention-${g.name}`)
    const html = `<div class="${c}"><div class="fld">Nice work <b>@ad</b><i class="car"></i></div><div class="pop"><span class="on"><i>AL</i>Ada Lovelace<em>@ada</em></span><span><i>AT</i>Alan Turing<em>@alan</em></span><span><i>AD</i>Adele Goldberg<em>@adele</em></span></div></div>`
    const css = `.${c} {
  position: relative;
  width: 248px;
  padding-bottom: 116px;
}
.${c} .fld {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 0.55rem 0.65rem;
  border-radius: 0.45rem;
  background: #0f172a;
  border: 1px solid ${g.b};
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.b)}, 0.14);
  font-size: 0.78rem;
  color: #cbd5e1;
}
.${c} .fld b {
  margin-left: 0.28rem;
  font-weight: 600;
  color: ${g.a};
}
.${c} .car {
  width: 1.5px;
  height: 14px;
  background: ${g.b};
  animation: ${c}-blink 1.1s steps(2) infinite;
}
@keyframes ${c}-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.${c} .pop {
  position: absolute;
  left: 0;
  right: 0;
  top: 46px;
  display: grid;
  padding: 0.25rem;
  border-radius: 0.5rem;
  background: #111827;
  border: 1px solid #1f2937;
  box-shadow: 0 16px 34px rgba(0,0,0,0.5);
}
.${c} .pop span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.4rem;
  border-radius: 0.35rem;
  font-size: 0.75rem;
  color: #cbd5e1;
  cursor: pointer;
  transition: background 0.14s ease;
}
.${c} .pop .on,
.${c} .pop span:hover { background: rgba(${rgbOf(g.b)}, 0.16); }
.${c} .pop i {
  flex: none;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.58rem;
  font-style: normal;
  font-weight: 650;
  color: #0b1120;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c} .pop em {
  margin-left: auto;
  font-style: normal;
  font-size: 0.67rem;
  color: #475569;
}`
    add(mk({
      name: `${g.name} Mention Autocomplete`,
      category: 'Inputs & Hover',
      description: `Composer that switches to name-matching the moment an at-sign is typed, the partial token tinted in place and the handle right-aligned so the list scans as one column.`,
      html, css,
      tags: ['input', 'mention', 'autocomplete', 'typeahead', 'composer', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  INPUTS & HOVER — password reveal toggle  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-input-reveal-${t.name}`)
    const html = `<div class="${c}"><span class="dots">••••••••••</span><span class="plain">correct-horse</span><button class="eye"><i class="lid"></i><i class="pupil"></i><i class="slash"></i></button></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: center;
  width: 240px;
  padding: 0.55rem 2.6rem 0.55rem 0.7rem;
  border-radius: 0.45rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem;
  color: #e2e8f0;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c}:hover {
  border-color: ${t.b};
  box-shadow: 0 0 0 3px rgba(${rgbOf(t.b)}, 0.14);
}
.${c} .dots,
.${c} .plain {
  transition: opacity 0.18s ease;
}
.${c} .plain {
  position: absolute;
  left: 0.7rem;
  opacity: 0;
}
.${c}:hover .dots  { opacity: 0; }
.${c}:hover .plain { opacity: 1; }
.${c} .eye {
  position: absolute;
  right: 0.5rem;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 0.3rem;
  background: transparent;
  cursor: pointer;
}
.${c} .lid {
  width: 20px;
  height: 13px;
  border: 1.6px solid #64748b;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  transition: border-color 0.2s ease;
}
.${c} .pupil {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #64748b;
  transition: background 0.2s ease, transform 0.2s ease;
}
.${c} .slash {
  position: absolute;
  width: 22px;
  height: 1.6px;
  border-radius: 1px;
  background: #64748b;
  transform: rotate(-45deg);
  transition: transform 0.24s cubic-bezier(0.5, 0, 0.2, 1), opacity 0.2s ease;
  transform-origin: 50% 50%;
}
.${c}:hover .lid   { border-color: ${t.c}; }
.${c}:hover .pupil { background: ${t.c}; transform: scale(1.15); }
.${c}:hover .slash { opacity: 0; transform: rotate(-45deg) scaleX(0); }`
    add(mk({
      name: `${t.name} Password Reveal`,
      category: 'Inputs & Hover',
      description: `Masked field whose eye control drops its strike-through by scaling the bar to nothing from the centre, so the icon changes meaning without a second glyph swapping in.`,
      html, css,
      tags: ['input', 'password', 'reveal', 'toggle', 'eye', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  LOADERS — dot on an infinity path  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-loader-infinity-${g.name}`)
    const html = `<div class="${c}"><i class="lobe l"></i><i class="lobe r"></i><i class="dot"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 108px;
  height: 56px;
}
.${c} .lobe {
  position: absolute;
  top: 4px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid rgba(148,163,184,0.16);
}
.${c} .l { left: 0; }
.${c} .r { right: 0; }
.${c} .dot {
  position: absolute;
  top: 22px;
  left: 20px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  box-shadow: 0 0 14px rgba(${rgbOf(g.a)}, 0.65);
  animation: ${c}-loop 2.2s cubic-bezier(0.55, 0, 0.45, 1) infinite;
}
@keyframes ${c}-loop {
  0%   { transform: translate(0, 0); }
  12%  { transform: translate(-16px, -18px); }
  25%  { transform: translate(-32px, 0); }
  37%  { transform: translate(-16px, 18px); }
  50%  { transform: translate(0, 0); }
  62%  { transform: translate(16px, -18px); }
  75%  { transform: translate(32px, 0); }
  87%  { transform: translate(16px, 18px); }
  100% { transform: translate(0, 0); }
}`
    add(mk({
      name: `${g.name} Infinity Loader`,
      category: 'Loaders',
      description: `Single dot traced around a lemniscate in eight keyframe stations, crossing at the waist so the two lobes read as one continuous circuit rather than two orbits.`,
      html, css,
      tags: ['loader', 'infinity', 'lemniscate', 'path', 'spinner', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  LOADERS — folding cube  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-loader-fold-${t.name}`)
    const html = `<div class="${c}"><i class="q1"></i><i class="q2"></i><i class="q3"></i><i class="q4"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 54px;
  height: 54px;
  transform: rotateZ(45deg);
}
.${c} i {
  position: relative;
  float: left;
  width: 50%;
  height: 50%;
  transform: scale(1.06);
}
.${c} i::before {
  content: '';
  position: absolute;
  inset: 0;
  transform-origin: 100% 100%;
  animation: ${c}-fold 2.4s linear infinite both;
}
.${c} .q1::before { background: ${t.a}; }
.${c} .q2::before { background: ${t.b}; animation-delay: 0.3s; }
.${c} .q3::before { background: ${t.c}; animation-delay: 0.9s; }
.${c} .q4::before { background: ${t.b}; animation-delay: 0.6s; }
.${c} .q2 { transform: scale(1.06) rotateZ(90deg); }
.${c} .q3 { transform: scale(1.06) rotateZ(180deg); }
.${c} .q4 { transform: scale(1.06) rotateZ(270deg); }
@keyframes ${c}-fold {
  0%, 10%   { transform: perspective(140px) rotateX(-180deg); opacity: 0; }
  25%, 75%  { transform: perspective(140px) rotateX(0deg);    opacity: 1; }
  90%, 100% { transform: perspective(140px) rotateY(180deg);  opacity: 0; }
}`
    add(mk({
      name: `${t.name} Folding Cube`,
      category: 'Loaders',
      description: `Four quadrants hinged at the shared centre corner, each folding in on X and out on Y a beat after the last so the square appears to turn itself inside out.`,
      html, css,
      tags: ['loader', 'cube', 'fold', '3d', 'spinner', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MASKS & CLIP PATHS — squircle frame  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-mask-squircle-${g.name}`)
    const html = `<div class="${c}"><i class="art"></i><span>iOS</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 128px;
  height: 128px;
  overflow: hidden;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  clip-path: polygon(
    50% 0%, 66% 0.6%, 79% 3%, 88% 7.5%, 93.5% 14%, 97% 22%, 99.4% 34%, 100% 50%,
    99.4% 66%, 97% 78%, 93.5% 86%, 88% 92.5%, 79% 97%, 66% 99.4%, 50% 100%,
    34% 99.4%, 21% 97%, 12% 92.5%, 6.5% 86%, 3% 78%, 0.6% 66%, 0% 50%,
    0.6% 34%, 3% 22%, 6.5% 14%, 12% 7.5%, 21% 3%, 34% 0.6%
  );
  transition: transform 0.32s cubic-bezier(0.34, 1.35, 0.64, 1);
}
.${c} .art {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 60% at 30% 25%, rgba(255,255,255,0.35), transparent 70%),
    repeating-linear-gradient(125deg, rgba(11,17,32,0.12) 0 8px, transparent 8px 18px);
}
.${c} span {
  position: relative;
  font-size: 1.5rem;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: #0b1120;
}
.${c}:hover { transform: scale(1.06) rotate(-2deg); }`
    add(mk({
      name: `${g.name} Squircle Frame`,
      category: 'Masks & Clip Paths',
      description: `Superellipse approximated with a 28-point clip-path, which holds its continuous curvature under scale in a way a border-radius corner visibly does not.`,
      html, css,
      tags: ['mask', 'squircle', 'superellipse', 'clip-path', 'app icon', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MASKS & CLIP PATHS — conic sweep reveal  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-mask-sweep-${t.name}`)
    const html = `<div class="${c}"><i class="under"></i><i class="over"></i><span>SWEEP</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  background: #0b1120;
}
.${c} i { position: absolute; inset: 0; }
.${c} .under {
  background: repeating-conic-gradient(from 0deg, #1e293b 0 15deg, #0f172a 15deg 30deg);
}
.${c} .over {
  background: conic-gradient(from 0deg, ${t.a}, ${t.b} 40%, ${t.c} 70%, ${t.a});
  -webkit-mask: conic-gradient(from -90deg, #000 0deg, #000 var(--${c}-a, 0deg), transparent var(--${c}-a, 0deg));
  mask: conic-gradient(from -90deg, #000 0deg, #000 var(--${c}-a, 0deg), transparent var(--${c}-a, 0deg));
  animation: ${c}-sweep 2.6s cubic-bezier(0.5, 0, 0.2, 1) infinite;
}
@property --${c}-a {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
@keyframes ${c}-sweep {
  0%        { --${c}-a: 0deg; }
  70%, 100% { --${c}-a: 360deg; }
}
.${c} span {
  position: relative;
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.2em;
  color: #0b1120;
  mix-blend-mode: overlay;
}`
    add(mk({
      name: `${t.name} Conic Sweep Mask`,
      category: 'Masks & Clip Paths',
      description: `Radar-style wipe driven by an animated @property angle inside the mask itself, so the reveal follows a rotating wedge rather than a straight edge crossing the box.`,
      html, css,
      tags: ['mask', 'conic', 'sweep', 'radar', 'at-property', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MICRO-INTERACTIONS — add to cart flight  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-micro-cart-${g.name}`)
    const html = `<div class="${c}"><button class="add">Add to cart</button><i class="fly"></i><div class="cart"><i class="body"></i><b>3</b></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 232px;
  padding: 0.5rem 0.55rem;
  border-radius: 0.55rem;
  background: #0f172a;
  border: 1px solid #1e293b;
}
.${c} .add {
  padding: 0.4rem 0.7rem;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.74rem;
  font-weight: 650;
  color: #0b1120;
  cursor: pointer;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  transition: filter 0.16s ease;
}
.${c} .add:hover { filter: brightness(1.08); }
.${c} .fly {
  position: absolute;
  left: 78px;
  top: 22px;
  width: 12px;
  height: 12px;
  border-radius: 0.2rem;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  opacity: 0;
  pointer-events: none;
}
.${c}:hover .fly { animation: ${c}-fly 0.85s cubic-bezier(0.4, 0, 0.5, 1) 1 forwards; }
@keyframes ${c}-fly {
  0%   { opacity: 1; transform: translate(0, 0) scale(1); }
  55%  { opacity: 1; transform: translate(58px, -26px) scale(0.85); }
  100% { opacity: 0; transform: translate(118px, 4px) scale(0.35); }
}
.${c} .cart { position: relative; }
.${c} .cart .body {
  display: block;
  width: 22px;
  height: 17px;
  border: 2px solid #94a3b8;
  border-top: none;
  border-radius: 0 0 0.3rem 0.3rem;
  transition: border-color 0.2s ease;
}
.${c} .cart .body::before {
  content: '';
  position: absolute;
  left: -4px;
  top: -6px;
  width: 8px;
  height: 8px;
  border-left: 2px solid #94a3b8;
  border-top: 2px solid #94a3b8;
  border-radius: 2px 0 0 0;
  transform: skewX(-16deg);
}
.${c} .cart b {
  position: absolute;
  right: -8px;
  top: -8px;
  min-width: 16px;
  padding: 0 3px;
  border-radius: 999px;
  font-size: 0.6rem;
  font-weight: 700;
  text-align: center;
  color: #0b1120;
  background: ${g.a};
}
.${c}:hover .cart b { animation: ${c}-bump 0.4s cubic-bezier(0.34, 1.6, 0.64, 1) 0.7s 1 both; }
@keyframes ${c}-bump {
  0%   { transform: scale(1); }
  45%  { transform: scale(1.45); }
  100% { transform: scale(1); }
}
.${c}:hover .cart .body { border-color: ${g.b}; }`
    add(mk({
      name: `${g.name} Add to Cart Flight`,
      category: 'Micro-interactions',
      description: `Ghost of the item arcing from the button to the basket and shrinking as it goes, the count bumping only once the flight lands so cause and effect stay in order.`,
      html, css,
      tags: ['micro', 'cart', 'flight', 'ecommerce', 'badge', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MICRO-INTERACTIONS — task strike-through  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-micro-strike-${t.name}`)
    const html = `<label class="${c}"><i class="box"><b></b></i><span>Ship the redesign<i class="rule"></i></span></label>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 224px;
  padding: 0.55rem 0.65rem;
  border-radius: 0.5rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  cursor: pointer;
  transition: background 0.2s ease;
}
.${c}:hover { background: #131f38; }
.${c} .box {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 19px;
  height: 19px;
  border-radius: 0.32rem;
  border: 1.6px solid #334155;
  background: transparent;
  transition: background 0.24s ease, border-color 0.24s ease;
}
.${c}:hover .box {
  border-color: transparent;
  background: linear-gradient(135deg, ${t.a}, ${t.b});
}
.${c} .box b {
  width: 9px;
  height: 5px;
  border-left: 2px solid #0b1120;
  border-bottom: 2px solid #0b1120;
  transform: rotate(-45deg) scale(0);
  transform-origin: 50% 50%;
  transition: transform 0.26s cubic-bezier(0.34, 1.5, 0.64, 1) 0.06s;
}
.${c}:hover .box b { transform: rotate(-45deg) scale(1); }
.${c} span {
  position: relative;
  font-size: 0.79rem;
  color: #e2e8f0;
  transition: color 0.3s ease 0.1s;
}
.${c}:hover span { color: #64748b; }
.${c} .rule {
  position: absolute;
  left: 0;
  top: 50%;
  height: 1.5px;
  width: 100%;
  border-radius: 1px;
  background: ${t.c};
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform 0.32s cubic-bezier(0.5, 0, 0.2, 1) 0.08s;
}
.${c}:hover .rule { transform: scaleX(1); }`
    add(mk({
      name: `${t.name} Task Strike`,
      category: 'Micro-interactions',
      description: `Checkbox and label treated as one gesture — the tick springs in, the rule draws left to right, and the text dims last so the sequence reads as completion rather than deletion.`,
      html, css,
      tags: ['micro', 'checkbox', 'task', 'strike-through', 'todo', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MODALS & OVERLAYS — fullscreen takeover  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-modal-takeover-${g.name}`)
    const html = `<div class="${c}"><div class="pg"><span class="rw"></span><span class="rw s"></span><span class="rw"></span></div><div class="sheet"><div class="hd"><b>Compose</b><i class="x"></i></div><div class="bd"><span></span><span></span><span class="sh"></span></div></div></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 156px;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #0b1120;
  border: 1px solid #1e293b;
}
.${c} .pg {
  display: grid;
  gap: 0.5rem;
  padding: 1rem;
  transition: filter 0.4s ease, transform 0.4s ease;
}
.${c} .rw {
  height: 9px;
  border-radius: 3px;
  background: #1e293b;
}
.${c} .rw.s { width: 62%; }
.${c}:hover .pg { filter: blur(2px); transform: scale(0.97); }
.${c} .sheet {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 96px;
  height: 34px;
  margin: -17px 0 0 -48px;
  overflow: hidden;
  border-radius: 0.5rem;
  background: #111827;
  box-shadow: 0 0 0 1px rgba(${rgbOf(g.b)}, 0.5), 0 18px 40px rgba(0,0,0,0.55);
  transition: width 0.44s cubic-bezier(0.5, 0, 0.2, 1),
              height 0.44s cubic-bezier(0.5, 0, 0.2, 1),
              margin 0.44s cubic-bezier(0.5, 0, 0.2, 1),
              border-radius 0.44s ease;
}
.${c}:hover .sheet {
  width: 240px;
  height: 156px;
  margin: -78px 0 0 -120px;
  border-radius: 0.6rem;
}
.${c} .hd {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid #1f2937;
  opacity: 0;
  transition: opacity 0.24s ease 0.24s;
}
.${c}:hover .hd { opacity: 1; }
.${c} .hd b { font-size: 0.76rem; font-weight: 650; color: #f1f5f9; }
.${c} .hd .x {
  position: relative;
  width: 14px;
  height: 14px;
  margin-left: auto;
}
.${c} .hd .x::before,
.${c} .hd .x::after {
  content: '';
  position: absolute;
  left: 1px;
  top: 6px;
  width: 12px;
  height: 1.6px;
  background: #64748b;
}
.${c} .hd .x::before { transform: rotate(45deg); }
.${c} .hd .x::after  { transform: rotate(-45deg); }
.${c} .bd {
  display: grid;
  gap: 0.45rem;
  padding: 0.7rem 0.6rem;
  opacity: 0;
  transition: opacity 0.24s ease 0.3s;
}
.${c}:hover .bd { opacity: 1; }
.${c} .bd span {
  height: 8px;
  border-radius: 3px;
  background: #1e293b;
}
.${c} .bd .sh {
  width: 44%;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}`
    add(mk({
      name: `${g.name} Fullscreen Takeover`,
      category: 'Modals & Overlays',
      description: `Dialog that grows from the footprint of the control that opened it to the whole viewport, its chrome fading in only after the box has finished travelling.`,
      html, css,
      tags: ['modal', 'takeover', 'fullscreen', 'expand', 'transition', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MODALS & OVERLAYS — nested sheet stack  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-modal-stack-${t.name}`)
    const html = `<div class="${c}"><i class="l3"></i><i class="l2"></i><div class="l1"><i class="grab"></i><b>Payment method</b><span></span><span class="s"></span></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 236px;
  height: 156px;
  overflow: hidden;
  border-radius: 0.6rem;
  background: linear-gradient(180deg, #0b1120, #060913);
  border: 1px solid #1e293b;
}
.${c} i.l3,
.${c} i.l2 {
  position: absolute;
  left: 50%;
  border-radius: 0.7rem 0.7rem 0 0;
  background: #1e293b;
  transition: transform 0.4s cubic-bezier(0.5, 0, 0.2, 1), opacity 0.4s ease;
}
.${c} .l3 {
  bottom: 96px;
  width: 178px;
  height: 26px;
  margin-left: -89px;
  opacity: 0.4;
  transform: translateY(14px);
}
.${c} .l2 {
  bottom: 88px;
  width: 200px;
  height: 30px;
  margin-left: -100px;
  background: #273449;
  opacity: 0.7;
  transform: translateY(12px);
}
.${c}:hover .l3 { transform: translateY(0); opacity: 0.55; }
.${c}:hover .l2 { transform: translateY(0); opacity: 0.9; }
.${c} .l1 {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0.45rem;
  width: 220px;
  padding: 0.5rem 0.8rem 1rem;
  border-radius: 0.75rem 0.75rem 0 0;
  background: #111827;
  box-shadow: 0 -12px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(${rgbOf(t.b)}, 0.35);
  transform: translateY(18px);
  transition: transform 0.4s cubic-bezier(0.5, 0, 0.2, 1);
}
.${c}:hover .l1 { transform: translateY(0); }
.${c} .grab {
  width: 34px;
  height: 4px;
  border-radius: 2px;
  background: #334155;
}
.${c} .l1 b {
  font-size: 0.78rem;
  font-weight: 650;
  color: #f1f5f9;
}
.${c} .l1 span {
  width: 100%;
  height: 8px;
  border-radius: 3px;
  background: #1e293b;
}
.${c} .l1 .s {
  width: 55%;
  margin-right: auto;
  background: linear-gradient(90deg, ${t.a}, ${t.c});
}`
    add(mk({
      name: `${t.name} Sheet Stack`,
      category: 'Modals & Overlays',
      description: `Three bottom sheets pushed one behind the other, each narrower and dimmer than the one in front, so depth in the navigation stack is legible without a back label.`,
      html, css,
      tags: ['modal', 'sheet', 'stack', 'bottom sheet', 'depth', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  NAVIGATION & MENUS — locale switcher  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-nav-locale-${g.name}`)
    const html = `<div class="${c}"><button class="tg"><i class="gl"></i>EN<b class="cv"></b></button><div class="mn"><span class="on">English<em>EN</em></span><span>Deutsch<em>DE</em></span><span>日本語<em>JA</em></span><span>Português<em>PT</em></span></div></div>`
    const css = `.${c} {
  position: relative;
  width: 168px;
  padding-bottom: 140px;
}
.${c} .tg {
  display: flex;
  align-items: center;
  gap: 0.42rem;
  width: 100%;
  padding: 0.45rem 0.6rem;
  border-radius: 0.45rem;
  background: #111827;
  border: 1px solid #1f2937;
  font-size: 0.76rem;
  font-weight: 600;
  color: #e2e8f0;
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.${c}:hover .tg { border-color: ${g.b}; }
.${c} .gl {
  position: relative;
  flex: none;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 1.5px solid ${g.b};
}
.${c} .gl::before,
.${c} .gl::after {
  content: '';
  position: absolute;
  border: 1px solid ${g.a};
}
.${c} .gl::before {
  inset: -1.5px 3px;
  border-radius: 50%;
}
.${c} .gl::after {
  left: -1.5px;
  right: -1.5px;
  top: 50%;
  height: 0;
  border-width: 1px 0 0 0;
}
.${c} .cv {
  margin-left: auto;
  width: 6px;
  height: 6px;
  border-right: 1.5px solid #64748b;
  border-bottom: 1.5px solid #64748b;
  transform: rotate(45deg) translate(-1px, -1px);
  transition: transform 0.24s ease;
}
.${c}:hover .cv { transform: rotate(-135deg) translate(-2px, -2px); }
.${c} .mn {
  position: absolute;
  left: 0;
  right: 0;
  top: 44px;
  display: grid;
  padding: 0.25rem;
  border-radius: 0.5rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  box-shadow: 0 16px 34px rgba(0,0,0,0.5);
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.${c}:hover .mn { opacity: 1; transform: none; pointer-events: auto; }
.${c} .mn span {
  display: flex;
  align-items: center;
  padding: 0.36rem 0.45rem;
  border-radius: 0.32rem;
  font-size: 0.75rem;
  color: #cbd5e1;
  cursor: pointer;
  transition: background 0.14s ease;
}
.${c} .mn span:hover { background: #1e293b; }
.${c} .mn .on { color: ${g.a}; font-weight: 600; }
.${c} .mn em {
  margin-left: auto;
  font-style: normal;
  font-size: 0.63rem;
  letter-spacing: 0.06em;
  color: #475569;
}`
    add(mk({
      name: `${g.name} Locale Switcher`,
      category: 'Navigation & Menus',
      description: `Language menu listing each option in its own script rather than in the current one, with the ISO code trailing so the list stays scannable to someone who cannot read the endonym.`,
      html, css,
      tags: ['nav', 'locale', 'language', 'switcher', 'i18n', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  NAVIGATION & MENUS — footer sitemap  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-nav-sitemap-${t.name}`)
    const html = `<footer class="${c}"><div class="col"><b>Product</b><a>Catalog</a><a>Pricing</a><a>Changelog</a></div><div class="col"><b>Company</b><a>About</a><a>Careers</a></div><div class="col"><b>Legal</b><a>Terms</a><a>Privacy</a></div></footer>`
    const css = `.${c} {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.9rem;
  width: 262px;
  padding: 0.9rem 0.85rem;
  border-radius: 0.6rem;
  background: #0b1120;
  border-top: 2px solid transparent;
  border-image: linear-gradient(90deg, ${t.a}, ${t.b}, ${t.c}) 1;
}
.${c} .col { display: grid; gap: 0.32rem; align-content: start; }
.${c} b {
  margin-bottom: 0.1rem;
  font-size: 0.63rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: ${t.b};
}
.${c} a {
  position: relative;
  width: fit-content;
  font-size: 0.72rem;
  color: #94a3b8;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.18s ease;
}
.${c} a::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 1px;
  background: ${t.c};
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform 0.24s cubic-bezier(0.5, 0, 0.2, 1);
}
.${c} a:hover { color: #e2e8f0; }
.${c} a:hover::after { transform: scaleX(1); }`
    add(mk({
      name: `${t.name} Footer Sitemap`,
      category: 'Navigation & Menus',
      description: `Three-column link map under a gradient border-image rule, each link underlining from its leading edge so the columns stay quiet until something is pointed at.`,
      html, css,
      tags: ['nav', 'footer', 'sitemap', 'columns', 'links', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PATTERNS & TEXTURES — fish-scale fan  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-pattern-scales-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 144px;
  border-radius: 0.55rem;
  background-color: #0b1120;
  background-image:
    radial-gradient(circle at 50% 100%, transparent 9px, ${g.a} 9px, ${g.a} 10.4px, transparent 10.4px),
    radial-gradient(circle at 50% 100%, transparent 9px, ${g.b} 9px, ${g.b} 10.4px, transparent 10.4px);
  background-size: 24px 12px;
  background-position: 0 0, 12px 6px;
  animation: ${c}-shift 6s ease-in-out infinite;
}
@keyframes ${c}-shift {
  0%, 100% { background-position: 0 0, 12px 6px; }
  50%      { background-position: 0 12px, 12px 18px; }
}`
    add(mk({
      name: `${g.name} Scale Fan`,
      category: 'Patterns & Textures',
      description: `Interlocking arcs from two offset radial layers, the half-cell stagger doing the overlap that makes a scale pattern read as roofing rather than as rows of circles.`,
      html, css,
      tags: ['pattern', 'scales', 'fan', 'clamshell', 'seamless', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PATTERNS & TEXTURES — herringbone weave  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-pattern-herring-${t.name}`)
    const html = `<div class="${c}"><i class="a"></i><i class="b"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 144px;
  overflow: hidden;
  border-radius: 0.55rem;
  background: #0b1120;
}
.${c} i {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  background-size: 18px 18px;
  transition: background-size 0.4s ease;
}
.${c} .a {
  left: 0;
  background-image: repeating-linear-gradient(45deg, ${t.a} 0 2px, transparent 2px 9px),
                    repeating-linear-gradient(45deg, ${t.b} 4px 5px, transparent 5px 9px);
}
.${c} .b {
  right: 0;
  background-image: repeating-linear-gradient(-45deg, ${t.b} 0 2px, transparent 2px 9px),
                    repeating-linear-gradient(-45deg, ${t.c} 4px 5px, transparent 5px 9px);
}
.${c}:hover i { background-size: 26px 26px; }`
    add(mk({
      name: `${t.name} Herringbone`,
      category: 'Patterns & Textures',
      description: `Two mirrored diagonal stripe fields butted at the centre line, which is the whole trick — herringbone is one hatch and its reflection sharing a seam.`,
      html, css,
      tags: ['pattern', 'herringbone', 'weave', 'diagonal', 'texture', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PROGRESS & METERS — countdown ring  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-prog-countdown-${g.name}`)
    const html = `<div class="${c}"><i class="tr"></i><i class="fl"></i><span>09</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 106px;
  height: 106px;
}
.${c} .tr,
.${c} .fl {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}
.${c} .tr {
  border: 6px solid #1e293b;
}
.${c} .fl {
  background: conic-gradient(from -90deg, ${g.a} 0deg, ${g.b} var(--${c}-sw, 300deg), transparent var(--${c}-sw, 300deg));
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px));
  animation: ${c}-drain 9s linear infinite;
  filter: drop-shadow(0 0 6px rgba(${rgbOf(g.a)}, 0.5));
}
@property --${c}-sw {
  syntax: '<angle>';
  inherits: false;
  initial-value: 360deg;
}
@keyframes ${c}-drain {
  from { --${c}-sw: 360deg; }
  to   { --${c}-sw: 0deg; }
}
.${c} span {
  font-size: 1.65rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #e2e8f0;
}`
    add(mk({
      name: `${g.name} Countdown Ring`,
      category: 'Progress & Meters',
      description: `Timer that empties rather than fills, the sweep animated through a registered angle property so the arc interpolates smoothly instead of snapping between conic stops.`,
      html, css,
      tags: ['progress', 'countdown', 'timer', 'ring', 'conic', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PROGRESS & METERS — signal strength bars  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-prog-signal-${t.name}`)
    const html = `<div class="${c}"><i class="b1"></i><i class="b2"></i><i class="b3"></i><i class="b4"></i><i class="b5"></i><span>LTE</span></div>`
    const css = `.${c} {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  padding: 0.5rem 0.6rem;
  border-radius: 0.45rem;
  background: #0f172a;
  border: 1px solid #1e293b;
}
.${c} i {
  width: 7px;
  border-radius: 1.5px;
  background: #1e293b;
  animation: ${c}-lit 2.8s ease-in-out infinite;
}
.${c} .b1 { height: 8px;  animation-delay: 0s; }
.${c} .b2 { height: 13px; animation-delay: 0.14s; }
.${c} .b3 { height: 18px; animation-delay: 0.28s; }
.${c} .b4 { height: 23px; animation-delay: 0.42s; }
.${c} .b5 { height: 28px; animation-delay: 0.56s; }
@keyframes ${c}-lit {
  0%, 8%    { background: #1e293b; }
  22%, 72%  { background: linear-gradient(180deg, ${t.c}, ${t.a}); }
  86%, 100% { background: #1e293b; }
}
.${c} .b5 { animation-name: ${c}-weak; }
@keyframes ${c}-weak {
  0%, 100% { background: #1e293b; }
}
.${c} span {
  align-self: center;
  margin-left: 0.35rem;
  font-size: 0.62rem;
  font-weight: 650;
  letter-spacing: 0.06em;
  color: #64748b;
}`
    add(mk({
      name: `${t.name} Signal Bars`,
      category: 'Progress & Meters',
      description: `Five-step strength meter that lights bottom-up on a stagger and leaves the tallest bar dark, which is what four-of-five actually looks like on a device.`,
      html, css,
      tags: ['progress', 'signal', 'bars', 'strength', 'meter', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SCROLL & STICKY — infinite scroll sentinel  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-scroll-sentinel-${g.name}`)
    const html = `<div class="${c}"><div class="rw"><i></i><b></b></div><div class="rw"><i></i><b></b></div><div class="rw"><i></i><b></b></div><div class="sen"><i class="sp"></i>Loading more</div></div>`
    const css = `.${c} {
  width: 234px;
  height: 152px;
  overflow-y: auto;
  padding: 0.5rem;
  border-radius: 0.55rem;
  background: #0b1120;
  border: 1px solid #1e293b;
  scrollbar-width: thin;
  scrollbar-color: ${g.b} #111827;
}
.${c}::-webkit-scrollbar { width: 6px; }
.${c}::-webkit-scrollbar-track { background: #111827; border-radius: 3px; }
.${c}::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: linear-gradient(180deg, ${g.a}, ${g.b});
}
.${c} .rw {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.45rem;
  border-radius: 0.4rem;
  transition: background 0.16s ease;
}
.${c} .rw:hover { background: #131f38; }
.${c} .rw i {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 0.35rem;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c} .rw b {
  flex: 1;
  height: 8px;
  border-radius: 3px;
  background: #1e293b;
}
.${c} .sen {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.75rem 0 0.5rem;
  font-size: 0.7rem;
  color: #475569;
}
.${c} .sp {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid #1e293b;
  border-top-color: ${g.a};
  animation: ${c}-spin 0.8s linear infinite;
}
@keyframes ${c}-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}`
    add(mk({
      name: `${g.name} Scroll Sentinel`,
      category: 'Scroll & Sticky',
      description: `List whose last child is a loading marker rather than a button, positioned so it enters the viewport a little before the content runs out and the next page can be fetched.`,
      html, css,
      tags: ['scroll', 'infinite', 'sentinel', 'pagination', 'loading', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SCROLL & STICKY — pull to refresh  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-scroll-pull-${t.name}`)
    const html = `<div class="${c}"><div class="ind"><i class="ring"></i></div><div class="sheet"><span class="rw"></span><span class="rw s"></span><span class="rw"></span><span class="rw s"></span></div></div>`
    const css = `.${c} {
  position: relative;
  width: 218px;
  height: 152px;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #060913;
  border: 1px solid #1e293b;
}
.${c} .ind {
  position: absolute;
  left: 50%;
  top: 12px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin-left: -15px;
  border-radius: 50%;
  background: #111827;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.28s ease, transform 0.28s ease;
}
.${c}:hover .ind { opacity: 1; transform: scale(1); }
.${c} .ring {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2px solid #1e293b;
  border-top-color: ${t.a};
  border-right-color: ${t.b};
  animation: ${c}-spin 0.9s linear infinite;
}
@keyframes ${c}-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.${c} .sheet {
  display: grid;
  gap: 0.55rem;
  padding: 0.85rem 0.8rem;
  border-radius: 0.6rem;
  background: #0f172a;
  transition: transform 0.34s cubic-bezier(0.34, 1.25, 0.64, 1);
}
.${c}:hover .sheet { transform: translateY(52px); }
.${c} .rw {
  height: 9px;
  border-radius: 3px;
  background: #1e293b;
}
.${c} .rw.s {
  width: 58%;
  background: linear-gradient(90deg, ${t.b}, ${t.c});
  opacity: 0.5;
}`
    add(mk({
      name: `${t.name} Pull to Refresh`,
      category: 'Scroll & Sticky',
      description: `Content sheet dragged down past its own top edge to expose a spinner parked behind it, the indicator scaling up from the gap rather than being pushed along by the sheet.`,
      html, css,
      tags: ['scroll', 'pull to refresh', 'overscroll', 'mobile', 'gesture', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SKELETONS & SHIMMERS — form skeleton  (12)
   *  Note: Skeletons were flagged as thinning before this wave.
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-skel-form-${g.name}`)
    const html = `<div class="${c}"><i class="lb"></i><i class="fd"></i><i class="lb s"></i><i class="fd"></i><div class="rw"><i class="fd h"></i><i class="fd h"></i></div><i class="bt"></i></div>`
    const css = `.${c} {
  display: grid;
  gap: 0.4rem;
  width: 234px;
  padding: 0.85rem 0.8rem;
  border-radius: 0.6rem;
  background: #0f172a;
  border: 1px solid #1e293b;
}
.${c} i {
  display: block;
  border-radius: 0.3rem;
  background: linear-gradient(100deg, #1e293b 30%, rgba(${rgbOf(g.a)}, 0.28) 50%, #1e293b 70%);
  background-size: 220% 100%;
  animation: ${c}-shim 1.5s ease-in-out infinite;
}
@keyframes ${c}-shim {
  0%   { background-position: 140% 0; }
  100% { background-position: -40% 0; }
}
.${c} .lb { width: 34%; height: 8px; }
.${c} .lb.s { width: 44%; margin-top: 0.35rem; }
.${c} .fd { height: 30px; border-radius: 0.4rem; }
.${c} .rw { display: flex; gap: 0.45rem; margin-top: 0.35rem; }
.${c} .fd.h { flex: 1; }
.${c} .bt {
  height: 32px;
  margin-top: 0.5rem;
  border-radius: 0.4rem;
  background: linear-gradient(100deg, #1e293b 30%, rgba(${rgbOf(g.b)}, 0.4) 50%, #1e293b 70%);
  background-size: 220% 100%;
  animation: ${c}-shim 1.5s ease-in-out infinite;
}`
    add(mk({
      name: `${g.name} Form Skeleton`,
      category: 'Skeletons & Shimmers',
      description: `Placeholder shaped to the form it precedes — short label blocks over taller field blocks, a split row, and a submit bar carrying a warmer sweep than the fields above it.`,
      html, css,
      tags: ['skeleton', 'form', 'shimmer', 'placeholder', 'loading', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SKELETONS & SHIMMERS — kanban column skeleton  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-skel-kanban-${t.name}`)
    const html = `<div class="${c}"><div class="col"><i class="hd"></i><i class="ct tall"></i><i class="ct"></i></div><div class="col"><i class="hd"></i><i class="ct"></i><i class="ct tall"></i></div><div class="col"><i class="hd"></i><i class="ct"></i></div></div>`
    const css = `.${c} {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.45rem;
  width: 250px;
  padding: 0.6rem;
  border-radius: 0.6rem;
  background: #0b1120;
  border: 1px solid #1e293b;
}
.${c} .col {
  display: grid;
  gap: 0.4rem;
  align-content: start;
  padding: 0.4rem;
  border-radius: 0.45rem;
  background: #0f172a;
}
.${c} i {
  display: block;
  border-radius: 0.28rem;
  background: linear-gradient(100deg, #1e293b 32%, rgba(${rgbOf(t.b)}, 0.3) 50%, #1e293b 68%);
  background-size: 240% 100%;
  animation: ${c}-shim 1.7s ease-in-out infinite;
}
@keyframes ${c}-shim {
  0%   { background-position: 150% 0; }
  100% { background-position: -50% 0; }
}
.${c} .hd { height: 7px; width: 62%; margin-bottom: 0.15rem; }
.${c} .ct { height: 26px; }
.${c} .ct.tall { height: 40px; }
.${c} .col:nth-child(2) i { animation-delay: 0.18s; }
.${c} .col:nth-child(3) i { animation-delay: 0.36s; }`
    add(mk({
      name: `${t.name} Kanban Skeleton`,
      category: 'Skeletons & Shimmers',
      description: `Three-column board placeholder with uneven card heights and a per-column sweep delay, so the loading state carries the same ragged rhythm the real board will.`,
      html, css,
      tags: ['skeleton', 'kanban', 'board', 'columns', 'shimmer', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SLIDERS & CAROUSELS — crossfade slideshow  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-slider-crossfade-${g.name}`)
    const html = `<div class="${c}"><i class="s1"></i><i class="s2"></i><i class="s3"></i><div class="dots"><b></b><b></b><b></b></div></div>`
    const css = `.${c} {
  position: relative;
  width: 236px;
  height: 140px;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #0b1120;
}
.${c} i {
  position: absolute;
  inset: 0;
  opacity: 0;
  animation: ${c}-fade 9s ease-in-out infinite;
}
.${c} .s1 {
  background: radial-gradient(70% 90% at 25% 20%, ${g.a}, transparent 70%), linear-gradient(140deg, ${g.b}, #0b1120);
}
.${c} .s2 {
  background: radial-gradient(70% 90% at 75% 30%, ${g.b}, transparent 70%), linear-gradient(200deg, ${g.a}, #0b1120);
  animation-delay: 3s;
}
.${c} .s3 {
  background: radial-gradient(80% 80% at 50% 80%, ${g.a}, transparent 68%), linear-gradient(90deg, ${g.b}, #0b1120);
  animation-delay: 6s;
}
@keyframes ${c}-fade {
  0%      { opacity: 0; }
  6%, 30% { opacity: 1; }
  36%     { opacity: 0; }
  100%    { opacity: 0; }
}
.${c} .dots {
  position: absolute;
  left: 50%;
  bottom: 0.6rem;
  display: flex;
  gap: 0.32rem;
  transform: translateX(-50%);
}
.${c} .dots b {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(248,250,252,0.35);
  animation: ${c}-dot 9s ease-in-out infinite;
}
.${c} .dots b:nth-child(2) { animation-delay: 3s; }
.${c} .dots b:nth-child(3) { animation-delay: 6s; }
@keyframes ${c}-dot {
  0%      { background: rgba(248,250,252,0.35); width: 6px; }
  6%, 30% { background: #f8fafc; width: 14px; }
  36%     { background: rgba(248,250,252,0.35); width: 6px; }
  100%    { background: rgba(248,250,252,0.35); width: 6px; }
}`
    add(mk({
      name: `${g.name} Crossfade Slideshow`,
      category: 'Sliders & Carousels',
      description: `Slides stacked in place and dissolved between rather than translated, which keeps a full-bleed image from ever showing an edge, with the active dot stretching to a pill.`,
      html, css,
      tags: ['carousel', 'crossfade', 'slideshow', 'dissolve', 'dots', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SLIDERS & CAROUSELS — histogram range filter  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-slider-histogram-${t.name}`)
    const html = `<div class="${c}"><div class="hist"><i style="--h:22%"></i><i style="--h:40%"></i><i class="in" style="--h:66%"></i><i class="in" style="--h:92%"></i><i class="in" style="--h:78%"></i><i class="in" style="--h:54%"></i><i style="--h:34%"></i><i style="--h:18%"></i></div><div class="track"><i class="sel"></i><b class="k1"></b><b class="k2"></b></div><div class="lab"><span>$40</span><span>$180</span></div></div>`
    const css = `.${c} {
  width: 236px;
  padding: 0.6rem 0.65rem 0.5rem;
  border-radius: 0.55rem;
  background: #0f172a;
  border: 1px solid #1e293b;
}
.${c} .hist {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 52px;
}
.${c} .hist i {
  flex: 1;
  height: var(--h);
  border-radius: 2px 2px 0 0;
  background: #1e293b;
  transition: background 0.24s ease;
}
.${c} .hist .in { background: linear-gradient(180deg, ${t.b}, ${t.a}); }
.${c}:hover .hist i { background: #273449; }
.${c}:hover .hist .in { background: linear-gradient(180deg, ${t.c}, ${t.b}); }
.${c} .track {
  position: relative;
  height: 4px;
  margin: 0.5rem 0 0.45rem;
  border-radius: 2px;
  background: #1e293b;
}
.${c} .sel {
  position: absolute;
  left: 24%;
  right: 24%;
  top: 0;
  bottom: 0;
  border-radius: 2px;
  background: linear-gradient(90deg, ${t.a}, ${t.c});
}
.${c} .track b {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  margin-top: -7px;
  border-radius: 50%;
  background: #f8fafc;
  box-shadow: 0 2px 6px rgba(0,0,0,0.5);
  cursor: grab;
  transition: transform 0.18s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} .k1 { left: 24%;  margin-left: -7px; }
.${c} .k2 { right: 24%; margin-right: -7px; }
.${c} .track b:hover { transform: scale(1.2); }
.${c} .lab {
  display: flex;
  justify-content: space-between;
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
  color: #94a3b8;
}`
    add(mk({
      name: `${t.name} Histogram Range`,
      category: 'Sliders & Carousels',
      description: `Two-handle range sitting under a distribution of the values it filters, bars inside the selection lit and the rest left grey so the user can see where the results actually are.`,
      html, css,
      tags: ['slider', 'range', 'histogram', 'filter', 'price', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TABLES & DATA GRIDS — grouped rows with subtotals  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-table-grouped-${g.name}`)
    const html = `<table class="${c}"><tbody><tr class="gr"><td><i class="cv"></i>North America</td><td>$48,200</td></tr><tr><td>Direct</td><td>$21,400</td></tr><tr><td>Partner</td><td>$26,800</td></tr><tr class="gr"><td><i class="cv"></i>EMEA</td><td>$31,750</td></tr><tr><td>Direct</td><td>$31,750</td></tr></tbody></table>`
    const css = `.${c} {
  width: 250px;
  border-collapse: collapse;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #0b1120;
  font-size: 0.73rem;
  color: #cbd5e1;
}
.${c} td {
  padding: 0.42rem 0.6rem;
  border-bottom: 1px solid #131f38;
}
.${c} td:last-child {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.${c} tr:not(.gr) td:first-child { padding-left: 1.55rem; color: #94a3b8; }
.${c} tr:not(.gr):hover td { background: #131f38; }
.${c} .gr td {
  font-weight: 650;
  color: #f1f5f9;
  background: linear-gradient(90deg, rgba(${rgbOf(g.a)}, 0.16), rgba(${rgbOf(g.b)}, 0.06));
  border-bottom: 1px solid rgba(${rgbOf(g.b)}, 0.3);
  cursor: pointer;
}
.${c} .gr td:last-child { color: ${g.a}; }
.${c} .cv {
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-right: 0.5rem;
  border-right: 1.5px solid ${g.b};
  border-bottom: 1.5px solid ${g.b};
  transform: rotate(45deg) translateY(-1px);
  transition: transform 0.24s ease;
}
.${c} .gr:hover .cv { transform: rotate(-135deg) translateY(-1px); }`
    add(mk({
      name: `${g.name} Grouped Rows`,
      category: 'Tables & Data Grids',
      description: `Collapsible group headers carrying their own subtotal, tinted across the row so a header never gets mistaken for data, with children indented under a disclosure caret.`,
      html, css,
      tags: ['table', 'grouped', 'subtotal', 'collapse', 'report', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TABLES & DATA GRIDS — inline edit grid  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-table-inline-${t.name}`)
    const html = `<table class="${c}"><thead><tr><th>SKU</th><th>Stock</th><th>Price</th></tr></thead><tbody><tr><td>HL-104</td><td>28</td><td class="ed">$34.00<i class="car"></i></td></tr><tr><td>HL-220</td><td>7</td><td>$18.50</td></tr><tr><td>HL-318</td><td>142</td><td>$92.00</td></tr></tbody></table>`
    const css = `.${c} {
  width: 244px;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #0b1120;
  border: 1px solid #1e293b;
  font-size: 0.73rem;
}
.${c} th {
  padding: 0.42rem 0.6rem;
  text-align: left;
  font-size: 0.62rem;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
  background: #0f172a;
  border-bottom: 1px solid #1e293b;
}
.${c} td {
  padding: 0.42rem 0.6rem;
  color: #cbd5e1;
  border-bottom: 1px solid #131f38;
  cursor: text;
  transition: box-shadow 0.16s ease, background 0.16s ease;
}
.${c} tr:last-child td { border-bottom: none; }
.${c} th:not(:first-child),
.${c} td:not(:first-child) {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.${c} td:hover {
  background: #131f38;
  box-shadow: inset 0 0 0 1px #334155;
}
.${c} .ed {
  position: relative;
  background: #0f172a;
  box-shadow: inset 0 0 0 1.5px ${t.b}, 0 0 0 3px rgba(${rgbOf(t.b)}, 0.14);
  color: #f8fafc;
}
.${c} .car {
  display: inline-block;
  width: 1.5px;
  height: 12px;
  margin-left: 1px;
  vertical-align: -2px;
  background: ${t.c};
  animation: ${c}-blink 1.1s steps(2) infinite;
}
@keyframes ${c}-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`
    add(mk({
      name: `${t.name} Inline Edit Grid`,
      category: 'Tables & Data Grids',
      description: `Spreadsheet-style cells that outline under the pointer and drop into an editing state in place, so committing a value never costs a dialog or a round trip to a detail page.`,
      html, css,
      tags: ['table', 'inline edit', 'grid', 'spreadsheet', 'cell', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TEXT — variable weight on hover  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-text-weight-${g.name}`)
    const html = `<h3 class="${c}"><span>V</span><span>A</span><span>R</span><span>I</span><span>A</span><span>B</span><span>L</span><span>E</span></h3>`
    const css = `.${c} {
  display: flex;
  gap: 0.02em;
  margin: 0;
  padding: 0.4rem 0;
  font-size: 2rem;
  letter-spacing: 0.01em;
}
.${c} span {
  font-weight: 300;
  color: #475569;
  transform-origin: 50% 100%;
  transition: font-weight 0.3s ease, color 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c}:hover span {
  font-weight: 800;
  transform: translateY(-3px) scaleY(1.06);
  background: linear-gradient(180deg, ${g.a}, ${g.b});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.${c} span:nth-child(1) { transition-delay: 0s; }
.${c} span:nth-child(2) { transition-delay: 0.035s; }
.${c} span:nth-child(3) { transition-delay: 0.07s; }
.${c} span:nth-child(4) { transition-delay: 0.105s; }
.${c} span:nth-child(5) { transition-delay: 0.14s; }
.${c} span:nth-child(6) { transition-delay: 0.175s; }
.${c} span:nth-child(7) { transition-delay: 0.21s; }
.${c} span:nth-child(8) { transition-delay: 0.245s; }`
    add(mk({
      name: `${g.name} Variable Weight`,
      category: 'Text',
      description: `Letters travelling from light to heavy on a per-character delay, picking up a vertical gradient as they thicken so the wave of weight is also a wave of colour.`,
      html, css,
      tags: ['text', 'variable font', 'weight', 'stagger', 'headline', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TEXT — scramble decode  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-text-scramble-${t.name}`)
    const html = `<div class="${c}"><span class="w"><i class="a">D</i><i class="b">#</i></span><span class="w"><i class="a">E</i><i class="b">%</i></span><span class="w"><i class="a">C</i><i class="b">@</i></span><span class="w"><i class="a">O</i><i class="b">&amp;</i></span><span class="w"><i class="a">D</i><i class="b">$</i></span><span class="w"><i class="a">E</i><i class="b">*</i></span><span class="w"><i class="a">D</i><i class="b">?</i></span></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.06em;
  padding: 0.5rem 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.6rem;
  font-weight: 700;
}
.${c} .w {
  position: relative;
  display: inline-block;
  width: 0.72em;
  height: 1.3em;
}
.${c} i {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-style: normal;
}
.${c} .a {
  background: linear-gradient(160deg, ${t.a}, ${t.b}, ${t.c});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  opacity: 0;
  animation: ${c}-lock 2.8s steps(1) infinite;
}
.${c} .b {
  color: #334155;
  opacity: 1;
  animation: ${c}-noise 2.8s steps(1) infinite;
}
@keyframes ${c}-lock {
  0%, 14%   { opacity: 0; }
  30%, 100% { opacity: 1; }
}
@keyframes ${c}-noise {
  0%, 14%   { opacity: 1; transform: translateY(0); }
  30%, 100% { opacity: 0; transform: translateY(-2px); }
}
.${c} .w:nth-child(2) i { animation-delay: 0.1s; }
.${c} .w:nth-child(3) i { animation-delay: 0.2s; }
.${c} .w:nth-child(4) i { animation-delay: 0.3s; }
.${c} .w:nth-child(5) i { animation-delay: 0.4s; }
.${c} .w:nth-child(6) i { animation-delay: 0.5s; }
.${c} .w:nth-child(7) i { animation-delay: 0.6s; }`
    add(mk({
      name: `${t.name} Scramble Decode`,
      category: 'Text',
      description: `Each slot holds a junk glyph and its real character stacked, swapping on a stepped keyframe left to right so the line resolves the way a cipher does rather than typing out.`,
      html, css,
      tags: ['text', 'scramble', 'decode', 'glitch', 'monospace', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TIMELINES & STEPS — branching commit graph  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-timeline-branch-${g.name}`)
    const html = `<div class="${c}"><div class="rw"><i class="gx main"></i><span>Init catalog</span></div><div class="rw"><i class="gx fork"></i><span>Branch: v9 wave</span></div><div class="rw"><i class="gx side"></i><span>Add radar chart</span></div><div class="rw"><i class="gx merge"></i><span>Merge to main</span></div></div>`
    const css = `.${c} {
  display: grid;
  gap: 0;
  width: 238px;
  padding: 0.55rem 0.6rem;
  border-radius: 0.55rem;
  background: #0b1120;
  border: 1px solid #1e293b;
}
.${c} .rw {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  height: 34px;
}
.${c} .gx {
  position: relative;
  flex: none;
  width: 26px;
  height: 34px;
}
.${c} .gx::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: ${g.b};
}
.${c} .rw:first-child .gx::before { top: 50%; }
.${c} .rw:last-child .gx::before  { bottom: 50%; }
.${c} .gx::after {
  content: '';
  position: absolute;
  left: 1px;
  top: 50%;
  width: 10px;
  height: 10px;
  margin-top: -5px;
  border-radius: 50%;
  background: #0b1120;
  box-shadow: inset 0 0 0 2.5px ${g.a};
}
.${c} .fork::after,
.${c} .merge::after { box-shadow: inset 0 0 0 2.5px ${g.b}; }
.${c} .fork {
  background:
    linear-gradient(${g.a}, ${g.a}) no-repeat 6px 50% / 14px 2px,
    linear-gradient(${g.a}, ${g.a}) no-repeat 18px 50% / 2px 17px;
}
.${c} .side::after {
  left: 13px;
  box-shadow: inset 0 0 0 2.5px ${g.a};
}
.${c} .side {
  background: linear-gradient(${g.a}, ${g.a}) no-repeat 18px 0 / 2px 34px;
}
.${c} .merge {
  background:
    linear-gradient(${g.a}, ${g.a}) no-repeat 18px 0 / 2px 17px,
    linear-gradient(${g.a}, ${g.a}) no-repeat 6px 50% / 14px 2px;
}
.${c} span {
  font-size: 0.74rem;
  color: #94a3b8;
  transition: color 0.18s ease;
}
.${c} .rw:hover span { color: #e2e8f0; }`
    add(mk({
      name: `${g.name} Commit Graph`,
      category: 'Timelines & Steps',
      description: `Branch-and-merge history drawn with positioned gradient segments instead of SVG, so the fork stub, the parallel lane and the merge elbow are each one background layer.`,
      html, css,
      tags: ['timeline', 'git', 'branch', 'merge', 'commit', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TIMELINES & STEPS — day agenda  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-timeline-agenda-${t.name}`)
    const html = `<div class="${c}"><div class="hr"><span>09</span><i class="ev a">Standup</i></div><div class="hr"><span>10</span><i class="ev b">Design review</i></div><div class="hr"><span>11</span></div><div class="hr now"><span>12</span><i class="ev c">Lunch &amp; learn</i></div></div>`
    const css = `.${c} {
  width: 238px;
  padding: 0.5rem 0.6rem;
  border-radius: 0.55rem;
  background: #0b1120;
  border: 1px solid #1e293b;
}
.${c} .hr {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  height: 32px;
  border-top: 1px solid #131f38;
}
.${c} .hr:first-child { border-top: none; }
.${c} .hr > span {
  flex: none;
  width: 18px;
  font-size: 0.63rem;
  font-variant-numeric: tabular-nums;
  color: #475569;
}
.${c} .ev {
  flex: 1;
  padding: 0.26rem 0.5rem;
  border-radius: 0.3rem;
  border-left: 2.5px solid;
  font-size: 0.71rem;
  font-style: normal;
  color: #e2e8f0;
  cursor: pointer;
  transition: transform 0.18s ease, filter 0.18s ease;
}
.${c} .ev:hover { transform: translateX(2px); filter: brightness(1.15); }
.${c} .ev.a { border-color: ${t.a}; background: rgba(${rgbOf(t.a)}, 0.16); }
.${c} .ev.b { border-color: ${t.b}; background: rgba(${rgbOf(t.b)}, 0.16); }
.${c} .ev.c { border-color: ${t.c}; background: rgba(${rgbOf(t.c)}, 0.16); }
.${c} .now::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1.5px;
  background: ${t.a};
  box-shadow: 0 0 8px rgba(${rgbOf(t.a)}, 0.7);
}
.${c} .now::after {
  content: '';
  position: absolute;
  left: -3px;
  top: -3px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${t.a};
}`
    add(mk({
      name: `${t.name} Day Agenda`,
      category: 'Timelines & Steps',
      description: `Hour rail with events sitting in the slots they occupy and an empty hour left visibly empty, the current-time rule crossing the whole column with a dot on the gutter.`,
      html, css,
      tags: ['timeline', 'agenda', 'calendar', 'schedule', 'day view', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOGGLES & SWITCHES — indeterminate parent checkbox  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-toggle-indeterminate-${g.name}`)
    const html = `<div class="${c}"><label class="pa"><i class="bx mixed"><b></b></i>Select all<em>2 of 3</em></label><label class="ch"><i class="bx on"><b></b></i>Buttons</label><label class="ch"><i class="bx on"><b></b></i>Cards</label><label class="ch"><i class="bx"><b></b></i>Loaders</label></div>`
    const css = `.${c} {
  display: grid;
  gap: 0.1rem;
  width: 214px;
  padding: 0.5rem 0.6rem;
  border-radius: 0.55rem;
  background: #0f172a;
  border: 1px solid #1e293b;
}
.${c} label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.32rem 0.15rem;
  font-size: 0.76rem;
  color: #cbd5e1;
  cursor: pointer;
}
.${c} .pa {
  padding-bottom: 0.45rem;
  margin-bottom: 0.15rem;
  border-bottom: 1px solid #1e293b;
  font-weight: 600;
  color: #f1f5f9;
}
.${c} .ch { padding-left: 1.1rem; }
.${c} .bx {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 17px;
  height: 17px;
  border-radius: 0.3rem;
  border: 1.6px solid #334155;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.${c} .bx b {
  width: 8px;
  height: 4.5px;
  border-left: 2px solid #0b1120;
  border-bottom: 2px solid #0b1120;
  transform: rotate(-45deg) scale(0);
  transition: transform 0.22s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.${c} .bx.on {
  border-color: transparent;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c} .bx.on b { transform: rotate(-45deg) scale(1); }
.${c} .bx.mixed {
  border-color: transparent;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c} .bx.mixed b {
  width: 9px;
  height: 0;
  border-left: none;
  border-bottom: 2.2px solid #0b1120;
  border-radius: 1px;
  transform: rotate(0deg) scale(1);
}
.${c} em {
  margin-left: auto;
  font-style: normal;
  font-size: 0.65rem;
  color: ${g.b};
}
.${c} label:hover .bx { border-color: ${g.b}; }`
    add(mk({
      name: `${g.name} Indeterminate Parent`,
      category: 'Toggles & Switches',
      description: `Parent control in the mixed state its children actually put it in — the tick collapsed to a dash rather than swapped for a different glyph — with the tally spelled out beside it.`,
      html, css,
      tags: ['toggle', 'checkbox', 'indeterminate', 'select all', 'tristate', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOGGLES & SWITCHES — power button  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-toggle-power-${t.name}`)
    const html = `<button class="${c}"><i class="ring"></i><i class="bar"></i></button>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 74px;
  height: 74px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: #111827;
  box-shadow: inset 0 0 0 1px #1f2937, 0 6px 18px rgba(0,0,0,0.4);
  transition: box-shadow 0.32s ease, background 0.32s ease;
}
.${c} .ring {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid #475569;
  border-top-color: transparent;
  transform: rotate(0deg);
  transition: border-color 0.32s ease, box-shadow 0.32s ease;
}
.${c} .bar {
  position: absolute;
  top: 17px;
  width: 3px;
  height: 17px;
  border-radius: 2px;
  background: #475569;
  transition: background 0.32s ease, box-shadow 0.32s ease;
}
.${c}:hover {
  background: #0d1424;
  box-shadow: inset 0 0 0 1px rgba(${rgbOf(t.b)}, 0.5), 0 0 26px rgba(${rgbOf(t.a)}, 0.35);
}
.${c}:hover .ring {
  border-color: ${t.b};
  border-top-color: transparent;
  box-shadow: 0 0 14px rgba(${rgbOf(t.b)}, 0.6);
}
.${c}:hover .bar {
  background: ${t.a};
  box-shadow: 0 0 12px rgba(${rgbOf(t.a)}, 0.8);
}`
    add(mk({
      name: `${t.name} Power Button`,
      category: 'Toggles & Switches',
      description: `IEC power glyph as the control itself, the broken ring and its stem lighting together and the housing picking up an ambient glow so the off state is unmistakably dead.`,
      html, css,
      tags: ['toggle', 'power', 'switch', 'glyph', 'glow', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOOLTIPS & POPOVERS — glossary definition  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v9-tip-glossary-${g.name}`)
    const html = `<p class="${c}">Every effect ships with a <span class="tm">specificity<i class="df"><b>specificity</b>The weight a selector carries when two rules set the same property.<em>CSS · cascade</em></i></span> budget.</p>`
    const css = `.${c} {
  position: relative;
  width: 244px;
  margin: 0;
  padding: 2.5rem 0 0.4rem;
  font-size: 0.82rem;
  line-height: 1.6;
  color: #cbd5e1;
}
.${c} .tm {
  position: relative;
  color: #f1f5f9;
  border-bottom: 1.5px dotted ${g.b};
  cursor: help;
}
.${c} .df {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 9px);
  display: grid;
  gap: 0.22rem;
  width: 196px;
  padding: 0.55rem 0.6rem;
  border-radius: 0.5rem;
  background: #111827;
  border: 1px solid #1f2937;
  box-shadow: 0 14px 32px rgba(0,0,0,0.55);
  font-size: 0.71rem;
  font-style: normal;
  line-height: 1.5;
  color: #94a3b8;
  opacity: 0;
  transform: translate(-50%, 5px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.${c} .tm:hover .df { opacity: 1; transform: translate(-50%, 0); }
.${c} .df b {
  font-size: 0.76rem;
  font-weight: 650;
  background: linear-gradient(100deg, ${g.a}, ${g.b});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.${c} .df em {
  font-style: normal;
  font-size: 0.62rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #475569;
}
.${c} .df::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -5px;
  width: 9px;
  height: 9px;
  margin-left: -4.5px;
  background: #111827;
  border-right: 1px solid #1f2937;
  border-bottom: 1px solid #1f2937;
  transform: rotate(45deg);
}`
    add(mk({
      name: `${g.name} Glossary Popover`,
      category: 'Tooltips & Popovers',
      description: `Dotted term in running text that opens a definition card rather than a one-line tip, with the headword repeated and a category line so it reads as an entry, not a hint.`,
      html, css,
      tags: ['tooltip', 'glossary', 'definition', 'inline', 'help', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOOLTIPS & POPOVERS — mini calendar  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v9-tip-calendar-${t.name}`)
    const html = `<div class="${c}"><button class="tg">Aug 14, 2026</button><div class="cal"><div class="hd"><i class="pv"></i><b>August 2026</b><i class="nx"></i></div><div class="dow"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div><div class="gd"><span class="mu">27</span><span class="mu">28</span><span class="mu">29</span><span class="mu">30</span><span class="mu">31</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span><span>13</span><span class="on">14</span><span>15</span><span>16</span></div></div></div>`
    const css = `.${c} {
  position: relative;
  width: 196px;
  padding-bottom: 168px;
}
.${c} .tg {
  width: 100%;
  padding: 0.45rem 0.6rem;
  border-radius: 0.45rem;
  background: #111827;
  border: 1px solid #1f2937;
  font-size: 0.76rem;
  color: #e2e8f0;
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.${c}:hover .tg { border-color: ${t.b}; }
.${c} .cal {
  position: absolute;
  left: 0;
  right: 0;
  top: 44px;
  padding: 0.5rem;
  border-radius: 0.55rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  box-shadow: 0 16px 36px rgba(0,0,0,0.55);
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.${c}:hover .cal { opacity: 1; transform: none; pointer-events: auto; }
.${c} .hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.1rem 0.4rem;
}
.${c} .hd b { font-size: 0.72rem; font-weight: 650; color: #f1f5f9; }
.${c} .pv,
.${c} .nx {
  width: 6px;
  height: 6px;
  border-top: 1.5px solid #64748b;
  border-left: 1.5px solid #64748b;
  cursor: pointer;
}
.${c} .pv { transform: rotate(-45deg); }
.${c} .nx { transform: rotate(135deg); }
.${c} .dow,
.${c} .gd {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}
.${c} .dow span {
  padding: 0.2rem 0;
  text-align: center;
  font-size: 0.58rem;
  font-weight: 650;
  color: #475569;
}
.${c} .gd span {
  display: grid;
  place-items: center;
  height: 21px;
  border-radius: 0.28rem;
  font-size: 0.66rem;
  font-variant-numeric: tabular-nums;
  color: #cbd5e1;
  cursor: pointer;
  transition: background 0.14s ease;
}
.${c} .gd span:hover { background: #1e293b; }
.${c} .gd .mu { color: #334155; }
.${c} .gd .on {
  font-weight: 700;
  color: #0b1120;
  background: linear-gradient(135deg, ${t.b}, ${t.c});
}`
    add(mk({
      name: `${t.name} Calendar Popover`,
      category: 'Tooltips & Popovers',
      description: `Date field opening a month grid anchored beneath it, leading days from the previous month dimmed rather than blank so the week rows stay aligned to their columns.`,
      html, css,
      tags: ['popover', 'calendar', 'date picker', 'month', 'grid', t.name.toLowerCase()],
    }))
  }
}
