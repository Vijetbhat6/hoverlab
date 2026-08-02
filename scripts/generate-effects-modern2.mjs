// scripts/generate-effects-modern2.mjs
//
// Third wave, part two — new TEMPLATES inside the remaining categories.
// See generate-effects-modern.mjs for the rationale and the shared
// helpers; this file covers:
//
//   Toggles & Switches   Tooltips & Popovers   Skeletons & Shimmers
//   Entrance Animations  Borders & Outlines    Progress & Meters
//   Avatars & Images     Modals & Overlays     Alerts & Toasts
//   Accordions & Tabs    3D & Perspective      Glow & Neon
//   Patterns & Textures  Masks & Clip Paths    Charts & Data
//   Timelines & Steps

import { rgbOf, NOISE, gradientRing } from './generate-effects-modern.mjs'

export function generateModern2(ctx) {
  const { PALETTES, GRADPAIRS, TRIOS, cls, mk, add } = ctx

  /* ============================================================
   *  TOGGLES & SWITCHES  (+29)
   * ========================================================== */

  // 1. Segmented theme toggle — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mtg-theme-${g.name}`)
    const html = `<div class="${c}"><i class="thumb"></i><span class="sun"></span><span class="moon"></span></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  gap: 0.15rem;
  padding: 0.22rem;
  border-radius: 999px;
  background: #0b1120;
  border: 1px solid rgba(255,255,255,0.1);
  cursor: pointer;
}
.${c} .thumb {
  position: absolute;
  top: 0.22rem;
  left: 0.22rem;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 3px 10px rgba(${rgbOf(g.a)}, 0.5);
  animation: ${c}-slide 4s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}
.${c} span {
  position: relative;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
}
.${c} .sun {
  --dot: #0b1120;
}
.${c} .sun::before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f8fafc;
  box-shadow: 0 0 0 2px rgba(248,250,252,0.25);
}
.${c} .moon::before {
  content: '';
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #94a3b8;
  box-shadow: inset -4px -2px 0 0 #0b1120;
}
@keyframes ${c}-slide {
  0%, 42%   { transform: translateX(0); }
  50%, 92%  { transform: translateX(31px); }
  100%      { transform: translateX(0); }
}`
    add(mk({
      name: `${g.name} Theme Toggle`,
      category: 'Toggles & Switches',
      description: `Two-position light/dark switch with a ${g.name.toLowerCase()} thumb that springs between the sun and moon.`,
      html, css,
      tags: ['toggle', 'theme', 'dark-mode', 'segmented', 'spring', g.name.toLowerCase()],
    }))
  }

  // 2. Draw-in checkbox — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mtg-check-${pal.name}`)
    const html = `<label class="${c}"><input type="checkbox" checked><span class="box"></span>Remember me</label>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.85rem;
  color: #cbd5e1;
  cursor: pointer;
  user-select: none;
}
.${c} input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.${c} .box {
  position: relative;
  width: 18px;
  height: 18px;
  border-radius: 0.35rem;
  background: #0b1120;
  border: 1.5px solid rgba(255,255,255,0.18);
  transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}
.${c} .box::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 4px;
  height: 9px;
  border: 2px solid #fff;
  border-top: 0;
  border-left: 0;
  transform: rotate(45deg) scale(0);
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c} input:checked + .box {
  background: ${pal.p};
  border-color: ${pal.p};
  box-shadow: 0 0 0 4px rgba(${pal.rgb}, 0.18);
}
.${c} input:checked + .box::after { transform: rotate(45deg) scale(1); }
.${c} input:focus-visible + .box { box-shadow: 0 0 0 4px rgba(${pal.rgb}, 0.4); }`
    add(mk({
      name: `${pal.name} Draw-In Checkbox`,
      category: 'Toggles & Switches',
      description: `Real <input type="checkbox"> styled with a ${pal.name.toLowerCase()} fill and a checkmark that springs in — keyboard focus included.`,
      html, css,
      tags: ['toggle', 'checkbox', 'form', 'focus-visible', 'a11y', pal.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOOLTIPS & POPOVERS  (+29)
   * ========================================================== */

  // 3. Glass tooltip — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mtt-glass-${g.name}`)
    const html = `<div class="${c}" data-tip="Copy to clipboard"><button>Hover me</button></div>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding-top: 42px;
}
.${c} button {
  padding: 0.5rem 1.1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #e2e8f0;
  border-radius: 0.5rem;
  border: 1px solid rgba(255,255,255,0.12);
  background: #0b1120;
  cursor: pointer;
}
.${c}::before {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% - 34px);
  left: 50%;
  transform: translate(-50%, 6px);
  white-space: nowrap;
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #f1f5f9;
  border-radius: 0.45rem;
  background: rgba(15,23,42,0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(${rgbOf(g.a)}, 0.45);
  box-shadow: 0 10px 26px rgba(0,0,0,0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.${c}::after {
  content: '';
  position: absolute;
  bottom: calc(100% - 28px);
  left: 50%;
  width: 8px;
  height: 8px;
  transform: translate(-50%, 6px) rotate(45deg);
  background: rgba(15,23,42,0.85);
  border-right: 1px solid rgba(${rgbOf(g.a)}, 0.45);
  border-bottom: 1px solid rgba(${rgbOf(g.a)}, 0.45);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.${c}:hover::before,
.${c}:focus-within::before { opacity: 1; transform: translate(-50%, 0); }
.${c}:hover::after,
.${c}:focus-within::after  { opacity: 1; transform: translate(-50%, 0) rotate(45deg); }`
    add(mk({
      name: `${g.name} Glass Tooltip`,
      category: 'Tooltips & Popovers',
      description: `Frosted tooltip with a ${g.name.toLowerCase()} hairline and a real arrow, driven by data-attr — appears on focus as well as hover.`,
      html, css,
      tags: ['tooltip', 'glass', 'arrow', 'focus-within', 'attr', g.name.toLowerCase()],
    }))
  }

  // 4. Rich hover card — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mtt-rich-${pal.name}`)
    const html = `<div class="${c}"><a>@hoverlab</a><div class="pop"><span class="av">H</span><strong>Hoverlab</strong><p>2,500+ pure-CSS effects.</p><em>1.2k followers</em></div></div>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding-bottom: 130px;
}
.${c} > a {
  font-size: 0.9rem;
  font-weight: 600;
  color: ${pal.a};
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: rgba(${pal.rgb}, 0.4);
}
.${c} .pop {
  position: absolute;
  top: 28px;
  left: 0;
  width: 200px;
  padding: 0.85rem;
  border-radius: 0.7rem;
  background: #0b1120;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 18px 44px rgba(0,0,0,0.55);
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
  transform-origin: top left;
  pointer-events: none;
  transition: opacity 0.24s ease, transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}
.${c} .av {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  margin-bottom: 0.5rem;
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(140deg, ${pal.p}, ${pal.a});
}
.${c} strong { display: block; font-size: 0.85rem; color: #f1f5f9; }
.${c} p { margin: 0.2rem 0 0.45rem; font-size: 0.76rem; color: #7c8aa5; }
.${c} em { font-style: normal; font-size: 0.72rem; color: ${pal.a}; }
.${c}:hover .pop,
.${c}:focus-within .pop { opacity: 1; transform: translateY(0) scale(1); }`
    add(mk({
      name: `${pal.name} Rich Hover Card`,
      category: 'Tooltips & Popovers',
      description: `Profile preview popover with avatar, bio and stat, easing open from its top-left corner in ${pal.name.toLowerCase()}.`,
      html, css,
      tags: ['popover', 'hover-card', 'profile', 'preview', pal.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SKELETONS & SHIMMERS  (+29)
   * ========================================================== */

  // 5. Composite card skeleton — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`msk-card-${pal.name}`)
    const html = `<div class="${c}"><div class="row"><span class="av"></span><span class="ln w60"></span></div><span class="ln"></span><span class="ln w80"></span><span class="ln w40"></span></div>`
    const css = `.${c} {
  width: 230px;
  padding: 1rem;
  border-radius: 0.75rem;
  background: #0b1120;
  border: 1px solid rgba(255,255,255,0.07);
}
.${c} .row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.9rem;
}
.${c} .av,
.${c} .ln {
  display: block;
  border-radius: 0.4rem;
  background:
    linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(${pal.rgb}, 0.22) 45%, rgba(255,255,255,0.05) 90%)
    0 0 / 220% 100%;
  animation: ${c}-wave 1.5s ease-in-out infinite;
}
.${c} .av { flex: none; width: 34px; height: 34px; border-radius: 50%; }
.${c} .ln { height: 10px; margin-bottom: 0.55rem; }
.${c} .row .ln { margin: 0; }
.${c} .w60 { width: 60%; }
.${c} .w80 { width: 80%; }
.${c} .w40 { width: 40%; margin-bottom: 0; }
@keyframes ${c}-wave {
  to { background-position: -220% 0; }
}`
    add(mk({
      name: `${pal.name} Card Skeleton`,
      category: 'Skeletons & Shimmers',
      description: `Full card placeholder — avatar, heading and three text lines — sweeping ${pal.name.toLowerCase()} in one shared animation.`,
      html, css,
      tags: ['skeleton', 'placeholder', 'loading', 'card', 'shimmer', pal.name.toLowerCase()],
    }))
  }

  // 6. Wave shimmer block — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`msk-wave-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  position: relative;
  overflow: hidden;
  width: 220px;
  height: 96px;
  border-radius: 0.7rem;
  background: rgba(255,255,255,0.05);
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(${rgbOf(g.a)}, 0.22) 45%,
    rgba(${rgbOf(g.b)}, 0.3) 55%,
    transparent
  );
  animation: ${c}-sweep 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes ${c}-sweep {
  to { transform: translateX(100%); }
}`
    add(mk({
      name: `${g.name} Wave Shimmer`,
      category: 'Skeletons & Shimmers',
      description: `Media placeholder with a single ${g.name.toLowerCase()} highlight crossing it — transform-only, so it stays on the compositor.`,
      html, css,
      tags: ['skeleton', 'shimmer', 'wave', 'placeholder', 'performance', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ENTRANCE ANIMATIONS  (+41)
   * ========================================================== */

  // 7. Blur + scale entrance — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`men-blur-${pal.name}`)
    const html = `<div class="${c}">Now available</div>`
    const css = `.${c} {
  padding: 0.9rem 1.4rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
  border-radius: 0.7rem;
  background: rgba(${pal.rgb}, 0.14);
  border: 1px solid rgba(${pal.rgb}, 0.4);
  box-shadow: 0 12px 32px rgba(${pal.rgb}, 0.2);
  animation: ${c}-in 0.85s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes ${c}-in {
  0%   { opacity: 0; filter: blur(10px); transform: scale(0.94) translateY(12px); }
  100% { opacity: 1; filter: blur(0);    transform: scale(1) translateY(0); }
}`
    add(mk({
      name: `${pal.name} Blur Scale Entrance`,
      category: 'Entrance Animations',
      description: `Element that resolves out of a blur while settling into place — softer than a plain fade-up, and the current house style.`,
      html, css,
      tags: ['entrance', 'blur', 'scale', 'reveal', pal.name.toLowerCase()],
    }))
  }

  // 8. Staggered list entrance — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`men-stagger-${g.name}`)
    const html = `<ul class="${c}"><li>Connect a repository</li><li>Pick a framework</li><li>Deploy</li><li>Add a domain</li></ul>`
    const css = `.${c} {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 220px;
}
.${c} li {
  position: relative;
  padding: 0.5rem 0.75rem 0.5rem 1.6rem;
  margin-bottom: 0.35rem;
  font-size: 0.82rem;
  color: #cbd5e1;
  border-radius: 0.5rem;
  background: rgba(255,255,255,0.04);
  animation: ${c}-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.${c} li::before {
  content: '';
  position: absolute;
  left: 0.7rem;
  top: 50%;
  width: 6px;
  height: 6px;
  margin-top: -3px;
  border-radius: 50%;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
}
.${c} li:nth-child(1) { animation-delay: 0.05s; }
.${c} li:nth-child(2) { animation-delay: 0.15s; }
.${c} li:nth-child(3) { animation-delay: 0.25s; }
.${c} li:nth-child(4) { animation-delay: 0.35s; }
@keyframes ${c}-in {
  from { opacity: 0; transform: translateY(10px); }
}`
    add(mk({
      name: `${g.name} Staggered List`,
      category: 'Entrance Animations',
      description: `List whose rows arrive 100ms apart with ${g.name.toLowerCase()} markers — stagger by nth-child, no animation library.`,
      html, css,
      tags: ['entrance', 'stagger', 'list', 'nth-child', 'sequence', g.name.toLowerCase()],
    }))
  }

  // 9. Clip-path curtain reveal — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`men-curtain-${g.name}`)
    const html = `<h3 class="${c}">Introducing v2</h3>`
    const css = `.${c} {
  margin: 0;
  padding: 0.7rem 1.2rem;
  font-size: 1.15rem;
  font-weight: 800;
  color: #fff;
  border-radius: 0.6rem;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  animation: ${c}-reveal 1s cubic-bezier(0.65, 0, 0.35, 1) both;
}
@keyframes ${c}-reveal {
  0%   { clip-path: inset(0 0 100% 0); opacity: 0; }
  100% { clip-path: inset(0 0 0 0);    opacity: 1; }
}`
    add(mk({
      name: `${g.name} Curtain Reveal`,
      category: 'Entrance Animations',
      description: `${g.name} banner uncovered top-to-bottom by an animated clip-path inset — no wrapper element needed.`,
      html, css,
      tags: ['entrance', 'clip-path', 'reveal', 'curtain', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BORDERS & OUTLINES  (+24)
   * ========================================================== */

  // 10. Masked 1px gradient ring — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mbd-ring-${g.name}`)
    const html = `<div class="${c}"><strong>Hairline ring</strong><p>1px gradient, correct on every corner.</p></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  padding: 1rem 1.1rem;
  border-radius: 0.85rem;
  background: #0b1120;
}
${gradientRing(`.${c}::before`, g.a, g.b, 1)}
.${c} strong { position: relative; font-size: 0.9rem; color: #f1f5f9; }
.${c} p { position: relative; margin: 0.3rem 0 0; font-size: 0.78rem; color: #7c8aa5; }`
    add(mk({
      name: `${g.name} Hairline Gradient Ring`,
      category: 'Borders & Outlines',
      description: `The modern gradient border: painted on a pseudo-element and masked to a 1px ${g.name.toLowerCase()} ring, so the radius stays true.`,
      html, css,
      tags: ['border', 'gradient-border', 'mask-composite', 'hairline', '1px', g.name.toLowerCase()],
    }))
  }

  // 11. Traveling beam border — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mbd-beam-${g.name}`)
    const html = `<div class="${c}"><span>Building…</span></div>`
    const css = `@property --${c}-a {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.${c} {
  position: relative;
  padding: 1px;
  border-radius: 0.75rem;
  background: conic-gradient(
    from var(--${c}-a),
    rgba(255,255,255,0.07) 0 72%,
    ${g.a} 86%,
    ${g.b} 94%,
    rgba(255,255,255,0.07) 100%
  );
  animation: ${c}-run 2.6s linear infinite;
}
.${c} span {
  display: block;
  padding: 0.7rem 1.3rem;
  font-size: 0.86rem;
  font-weight: 600;
  color: #cbd5e1;
  background: #0b1120;
  border-radius: calc(0.75rem - 1px);
}
@keyframes ${c}-run {
  to { --${c}-a: 360deg; }
}`
    add(mk({
      name: `${g.name} Beam Border`,
      category: 'Borders & Outlines',
      description: `A ${g.name.toLowerCase()} light packet chasing the border. Uses @property so the conic angle is a real animatable value, not a transform hack.`,
      html, css,
      tags: ['border', 'beam', 'at-property', 'conic', 'animated', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PROGRESS & METERS  (+20)
   * ========================================================== */

  // 12. Top page-load bar — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mpg-top-${g.name}`)
    const html = `<div class="${c}"><span></span></div>`
    const css = `.${c} {
  position: relative;
  width: 250px;
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
}
.${c} span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  box-shadow: 0 0 10px rgba(${rgbOf(g.a)}, 0.9), 0 0 20px rgba(${rgbOf(g.b)}, 0.5);
  animation: ${c}-load 3.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}
@keyframes ${c}-load {
  0%   { width: 0;    opacity: 1; }
  70%  { width: 88%;  opacity: 1; }
  92%  { width: 100%; opacity: 1; }
  100% { width: 100%; opacity: 0; }
}`
    add(mk({
      name: `${g.name} Route Progress Bar`,
      category: 'Progress & Meters',
      description: `The thin ${g.name.toLowerCase()} bar that rides the top of the viewport during a route change — races ahead, then fades at 100%.`,
      html, css,
      tags: ['progress', 'top-bar', 'route', 'navigation', 'nprogress', g.name.toLowerCase()],
    }))
  }

  // 13. Stacked segment bar — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`mpg-stack-${t.name}`)
    const html = `<div class="${c}"><div class="bar"><i class="a"></i><i class="b"></i><i class="c"></i></div><ul><li><em></em>Images</li><li><em></em>Video</li><li><em></em>Other</li></ul></div>`
    const css = `.${c} {
  width: 235px;
}
.${c} .bar {
  display: flex;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255,255,255,0.06);
}
.${c} .bar i {
  height: 100%;
  animation: ${c}-grow 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.${c} .bar .a { width: 46%; background: ${t.a}; }
.${c} .bar .b { width: 30%; background: ${t.b}; animation-delay: 0.1s; }
.${c} .bar .c { width: 16%; background: ${t.c}; animation-delay: 0.2s; }
.${c} ul {
  display: flex;
  gap: 0.85rem;
  list-style: none;
  margin: 0.6rem 0 0;
  padding: 0;
  font-size: 0.72rem;
  color: #7c8aa5;
}
.${c} li { display: flex; align-items: center; gap: 0.3rem; }
.${c} li em { width: 7px; height: 7px; border-radius: 2px; }
.${c} li:nth-child(1) em { background: ${t.a}; }
.${c} li:nth-child(2) em { background: ${t.b}; }
.${c} li:nth-child(3) em { background: ${t.c}; }
@keyframes ${c}-grow {
  from { transform: scaleX(0); transform-origin: left; }
}`
    add(mk({
      name: `${t.name} Stacked Usage Bar`,
      category: 'Progress & Meters',
      description: `Storage-breakdown bar in ${t.name.toLowerCase()} with a legend — segments grow left-to-right in sequence.`,
      html, css,
      tags: ['progress', 'stacked', 'usage', 'legend', 'breakdown', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  AVATARS & IMAGES  (+29)
   * ========================================================== */

  // 14. Presence-indicator avatar — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mav-presence-${pal.name}`)
    const html = `<div class="${c}"><span class="face">MK</span><i class="dot"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 52px;
  height: 52px;
}
.${c} .face {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(140deg, ${pal.p}, ${pal.a});
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.3);
}
.${c} .dot {
  position: absolute;
  right: 1px;
  bottom: 1px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #22c55e;
  border: 2.5px solid #0b1120;
}
.${c} .dot::after {
  content: '';
  position: absolute;
  inset: -2.5px;
  border-radius: 50%;
  border: 2px solid #22c55e;
  animation: ${c}-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes ${c}-ping {
  0%   { transform: scale(1);   opacity: 0.8; }
  100% { transform: scale(1.9); opacity: 0; }
}`
    add(mk({
      name: `${pal.name} Presence Avatar`,
      category: 'Avatars & Images',
      description: `${pal.name} avatar with an online dot that emits a ring — the presence pattern every collaborative app ships.`,
      html, css,
      tags: ['avatar', 'presence', 'online', 'status', 'ping', pal.name.toLowerCase()],
    }))
  }

  // 15. Media card with gradient scrim — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mav-media-${g.name}`)
    const html = `<figure class="${c}"><div class="img"></div><figcaption><span class="tag">Guide</span><strong>Designing for dark mode</strong></figcaption></figure>`
    const css = `.${c} {
  position: relative;
  width: 215px;
  height: 145px;
  margin: 0;
  overflow: hidden;
  border-radius: 0.8rem;
  cursor: pointer;
}
.${c} .img {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.${c} .img::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: ${NOISE};
  opacity: 0.18;
  mix-blend-mode: overlay;
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(2,6,23,0.9) 0%, rgba(2,6,23,0.15) 55%, transparent 100%);
}
.${c} figcaption {
  position: absolute;
  left: 0.85rem;
  right: 0.85rem;
  bottom: 0.8rem;
  z-index: 1;
}
.${c} .tag {
  display: inline-block;
  margin-bottom: 0.35rem;
  padding: 0.1rem 0.45rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #0b1120;
  background: #fff;
  border-radius: 999px;
}
.${c} strong {
  display: block;
  font-size: 0.88rem;
  line-height: 1.35;
  color: #fff;
}
.${c}:hover .img { transform: scale(1.07); }`
    add(mk({
      name: `${g.name} Media Card`,
      category: 'Avatars & Images',
      description: `Editorial thumbnail with a grain-textured ${g.name.toLowerCase()} image, bottom scrim and eyebrow tag — swap the gradient for an <img>.`,
      html, css,
      tags: ['image', 'media', 'scrim', 'grain', 'blog', 'thumbnail', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MODALS & OVERLAYS  (+29)
   * ========================================================== */

  // 16. Command palette — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mmd-cmdk-${g.name}`)
    const html = `<div class="${c}"><div class="bar"><span class="ic"></span><input placeholder="Type a command…" readonly><kbd>esc</kbd></div><ul><li class="on">Go to dashboard</li><li>Create project</li><li>Invite teammate</li></ul></div>`
    const css = `.${c} {
  width: 245px;
  border-radius: 0.8rem;
  overflow: hidden;
  background: rgba(11,17,32,0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 26px 60px rgba(0,0,0,0.6);
  animation: ${c}-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.${c} .bar {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.65rem 0.7rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.${c} .ic {
  flex: none;
  width: 12px;
  height: 12px;
  border: 2px solid ${g.a};
  border-radius: 50%;
  position: relative;
}
.${c} .ic::after {
  content: '';
  position: absolute;
  right: -5px;
  bottom: -4px;
  width: 6px;
  height: 2px;
  border-radius: 2px;
  background: ${g.a};
  transform: rotate(45deg);
}
.${c} input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: none;
  font-size: 0.83rem;
  color: #e2e8f0;
}
.${c} input::placeholder { color: #475569; }
.${c} kbd {
  padding: 0.1rem 0.35rem;
  font-family: inherit;
  font-size: 0.62rem;
  color: #94a3b8;
  border-radius: 0.25rem;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
}
.${c} ul { list-style: none; margin: 0; padding: 0.35rem; }
.${c} li {
  padding: 0.45rem 0.6rem;
  font-size: 0.8rem;
  color: #94a3b8;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} li:hover { color: #e2e8f0; background: rgba(255,255,255,0.06); }
.${c} li.on {
  color: #fff;
  background: linear-gradient(90deg, rgba(${rgbOf(g.a)}, 0.3), rgba(${rgbOf(g.b)}, 0.14));
  box-shadow: inset 2px 0 0 ${g.a};
}
@keyframes ${c}-in {
  from { opacity: 0; transform: translateY(-8px) scale(0.98); }
}`
    add(mk({
      name: `${g.name} Command Palette`,
      category: 'Modals & Overlays',
      description: `⌘K palette on a blurred panel with a ${g.name.toLowerCase()} selected row — the navigation surface every dev tool now ships.`,
      html, css,
      tags: ['modal', 'command-palette', 'cmdk', 'search', 'glass', g.name.toLowerCase()],
    }))
  }

  // 17. Destructive confirm sheet — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mmd-confirm-${pal.name}`)
    const html = `<div class="${c}"><span class="ic">!</span><strong>Delete project?</strong><p>This removes all deployments and cannot be undone.</p><div class="row"><button class="ghost">Cancel</button><button class="go">Delete</button></div></div>`
    const css = `.${c} {
  position: relative;
  width: 235px;
  padding: 1.15rem 1.1rem 1.05rem;
  border-radius: 0.9rem;
  background: #0b1120;
  box-shadow: 0 26px 60px rgba(0,0,0,0.6);
  animation: ${c}-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}
${gradientRing(`.${c}::before`, `rgba(${pal.rgb}, 0.6)`, 'rgba(255,255,255,0.06)', 1)}
.${c} .ic {
  position: relative;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  margin-bottom: 0.65rem;
  font-weight: 800;
  color: ${pal.a};
  border-radius: 50%;
  background: rgba(${pal.rgb}, 0.16);
  box-shadow: 0 0 0 5px rgba(${pal.rgb}, 0.08);
}
.${c} strong { position: relative; font-size: 0.92rem; color: #f1f5f9; }
.${c} p { position: relative; margin: 0.3rem 0 0.9rem; font-size: 0.77rem; line-height: 1.5; color: #7c8aa5; }
.${c} .row { position: relative; display: flex; gap: 0.5rem; }
.${c} button {
  flex: 1;
  padding: 0.45rem;
  font-size: 0.79rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: filter 0.2s ease, background 0.2s ease;
}
.${c} .ghost {
  color: #cbd5e1;
  border: 1px solid rgba(255,255,255,0.14);
  background: transparent;
}
.${c} .ghost:hover { background: rgba(255,255,255,0.06); }
.${c} .go {
  color: #fff;
  border: none;
  background: ${pal.p};
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.25);
}
.${c} .go:hover { filter: brightness(1.1); }
@keyframes ${c}-in {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
}`
    add(mk({
      name: `${pal.name} Confirm Dialog`,
      category: 'Modals & Overlays',
      description: `Destructive-action confirm with a ${pal.name.toLowerCase()} ring, warning glyph, and a ghost/solid button pair.`,
      html, css,
      tags: ['modal', 'confirm', 'destructive', 'dialog', 'gradient-border', pal.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ALERTS & TOASTS  (+29)
   * ========================================================== */

  // 18. Stacked toast group — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mal-stack-${g.name}`)
    const html = `<div class="${c}"><div class="t t3"></div><div class="t t2"></div><div class="t t1"><i></i><p>Build succeeded</p></div></div>`
    const css = `.${c} {
  position: relative;
  width: 225px;
  height: 78px;
}
.${c} .t {
  position: absolute;
  left: 0;
  right: 0;
  border-radius: 0.6rem;
  background: rgba(15,23,42,0.94);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 12px 30px rgba(0,0,0,0.45);
}
.${c} .t1 {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  bottom: 0;
  padding: 0.65rem 0.8rem;
  z-index: 3;
  animation: ${c}-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.${c} .t2 {
  bottom: 9px;
  height: 34px;
  transform: scale(0.94);
  opacity: 0.7;
  z-index: 2;
}
.${c} .t3 {
  bottom: 17px;
  height: 34px;
  transform: scale(0.88);
  opacity: 0.4;
  z-index: 1;
}
.${c} i {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 0 9px rgba(${rgbOf(g.a)}, 0.9);
}
.${c} p { margin: 0; font-size: 0.82rem; font-weight: 600; color: #e2e8f0; }
@keyframes ${c}-in {
  from { opacity: 0; transform: translateY(14px); }
}`
    add(mk({
      name: `${g.name} Toast Stack`,
      category: 'Alerts & Toasts',
      description: `Three toasts collapsed into a depth stack with the newest in front — the sonner-style notification pile, in ${g.name.toLowerCase()}.`,
      html, css,
      tags: ['toast', 'stack', 'notification', 'depth', 'sonner', g.name.toLowerCase()],
    }))
  }

  // 19. Top announcement banner — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mal-banner-${pal.name}`)
    const html = `<div class="${c}"><p>v2 is out — <a>read the announcement</a></p></div>`
    const css = `.${c} {
  position: relative;
  width: 250px;
  padding: 0.6rem 0.9rem;
  text-align: center;
  border-radius: 0.55rem;
  overflow: hidden;
  background: rgba(${pal.rgb}, 0.1);
}
.${c}::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, ${pal.p}, ${pal.a}, transparent);
  animation: ${c}-scan 3.4s ease-in-out infinite;
}
.${c} p { margin: 0; font-size: 0.79rem; color: #cbd5e1; }
.${c} a {
  color: ${pal.a};
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}
@keyframes ${c}-scan {
  0%, 100% { opacity: 0.35; transform: translateX(-15%); }
  50%      { opacity: 1;    transform: translateX(15%); }
}`
    add(mk({
      name: `${pal.name} Announcement Banner`,
      category: 'Alerts & Toasts',
      description: `Site-wide banner with a ${pal.name.toLowerCase()} light sweeping along its top edge — attention without a modal.`,
      html, css,
      tags: ['alert', 'banner', 'announcement', 'marketing', pal.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ACCORDIONS & TABS  (+29)
   * ========================================================== */

  // 20. Vertical tabs with rail — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mac-vtabs-${pal.name}`)
    const html = `<div class="${c}"><a>General</a><a class="on">Billing</a><a>Members</a><a>Webhooks</a></div>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  width: 165px;
  padding-left: 2px;
  border-left: 2px solid rgba(255,255,255,0.08);
}
.${c} a {
  position: relative;
  padding: 0.5rem 0.75rem;
  font-size: 0.83rem;
  font-weight: 500;
  color: #7c8aa5;
  border-radius: 0 0.4rem 0.4rem 0;
  cursor: pointer;
  transition: color 0.22s ease, background 0.22s ease;
}
.${c} a::before {
  content: '';
  position: absolute;
  left: -2px;
  top: 50%;
  width: 2px;
  height: 0;
  border-radius: 2px;
  background: ${pal.p};
  box-shadow: 0 0 10px ${pal.p};
  transform: translateY(-50%);
  transition: height 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.${c} a:hover { color: #cbd5e1; background: rgba(255,255,255,0.04); }
.${c} a.on {
  color: #f1f5f9;
  font-weight: 600;
  background: rgba(${pal.rgb}, 0.1);
}
.${c} a.on::before,
.${c} a:hover::before { height: 60%; }`
    add(mk({
      name: `${pal.name} Vertical Tabs`,
      category: 'Accordions & Tabs',
      description: `Settings-page sidebar tabs where a glowing ${pal.name.toLowerCase()} marker grows out of the rail beside the active item.`,
      html, css,
      tags: ['tabs', 'vertical', 'sidebar', 'settings', 'rail', pal.name.toLowerCase()],
    }))
  }

  // 21. Icon tabs with glass indicator — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mac-icontabs-${g.name}`)
    const html = `<div class="${c}"><a class="on"><i class="sq"></i>Grid</a><a><i class="ln"></i>List</a><a><i class="ci"></i>Map</a></div>`
    const css = `.${c} {
  display: inline-flex;
  gap: 0.2rem;
  padding: 0.28rem;
  border-radius: 0.65rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
}
.${c} a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  font-size: 0.79rem;
  font-weight: 600;
  color: #7c8aa5;
  border-radius: 0.45rem;
  cursor: pointer;
  transition: color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease;
}
.${c} i {
  width: 11px;
  height: 11px;
  border: 1.5px solid currentColor;
}
.${c} i.sq { border-radius: 2px; }
.${c} i.ln { height: 3px; border-width: 1.5px 0; }
.${c} i.ci { border-radius: 50%; }
.${c} a:hover { color: #cbd5e1; }
.${c} a.on {
  color: #fff;
  background: linear-gradient(140deg, rgba(${rgbOf(g.a)}, 0.9), rgba(${rgbOf(g.b)}, 0.75));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.28),
    0 4px 14px rgba(${rgbOf(g.a)}, 0.42);
}`
    add(mk({
      name: `${g.name} Icon View Tabs`,
      category: 'Accordions & Tabs',
      description: `View-mode switcher with CSS-drawn icons and a ${g.name.toLowerCase()} lit indicator on the selected mode.`,
      html, css,
      tags: ['tabs', 'icons', 'view-switcher', 'segmented', 'toolbar', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  3D & PERSPECTIVE  (+20)
   * ========================================================== */

  // 22. Layered card stack — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`m3-stack-${g.name}`)
    const html = `<div class="${c}"><i class="l3"></i><i class="l2"></i><div class="top"><strong>Design tokens</strong><p>3 files changed</p></div></div>`
    const css = `.${c} {
  position: relative;
  width: 200px;
  height: 112px;
  cursor: pointer;
}
.${c} i,
.${c} .top {
  position: absolute;
  inset: 0;
  border-radius: 0.8rem;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
.${c} .l3 {
  background: rgba(255,255,255,0.05);
  transform: translateY(14px) scale(0.9);
}
.${c} .l2 {
  background: rgba(255,255,255,0.09);
  transform: translateY(7px) scale(0.95);
}
.${c} .top {
  padding: 1rem;
  color: #fff;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 16px 36px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25);
}
.${c} strong { font-size: 0.92rem; }
.${c} p { margin: 0.25rem 0 0; font-size: 0.76rem; opacity: 0.85; }
.${c}:hover .l2 { transform: translateY(11px) rotate(-3deg) scale(0.96); }
.${c}:hover .l3 { transform: translateY(21px) rotate(3.5deg) scale(0.92); }
.${c}:hover .top { transform: translateY(-4px); }`
    add(mk({
      name: `${g.name} Card Stack`,
      category: '3D & Perspective',
      description: `Stack of ${g.name.toLowerCase()} cards that fans out on hover — depth from layering, not perspective, so it stays crisp.`,
      html, css,
      tags: ['3d', 'stack', 'layers', 'depth', 'hover', g.name.toLowerCase()],
    }))
  }

  // 23. Isometric tile — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`m3-iso-${t.name}`)
    const html = `<div class="${c}"><div class="plate p3"></div><div class="plate p2"></div><div class="plate p1"></div></div>`
    const css = `.${c} {
  width: 150px;
  height: 130px;
  display: grid;
  place-items: center;
  perspective: 900px;
}
.${c} .plate {
  position: absolute;
  width: 92px;
  height: 92px;
  border-radius: 0.6rem;
  transform: rotateX(56deg) rotateZ(45deg) translateZ(var(--z, 0px));
  box-shadow: 0 12px 26px rgba(0,0,0,0.4);
  animation: ${c}-hover 4.5s ease-in-out infinite alternate;
}
.${c} .p1 { --z: 34px; background: ${t.a}; }
.${c} .p2 { --z: 12px; background: ${t.b}; animation-delay: -1.5s; }
.${c} .p3 { --z: -10px; background: ${t.c}; animation-delay: -3s; }
@keyframes ${c}-hover {
  from { transform: rotateX(56deg) rotateZ(45deg) translateZ(var(--z)); }
  to   { transform: rotateX(56deg) rotateZ(45deg) translateZ(calc(var(--z) + 12px)); }
}`
    add(mk({
      name: `${t.name} Isometric Stack`,
      category: '3D & Perspective',
      description: `Three ${t.name.toLowerCase()} plates floating in isometric projection, each drifting on its own offset.`,
      html, css,
      tags: ['3d', 'isometric', 'layers', 'perspective', 'float', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  GLOW & NEON  (+24)
   * ========================================================== */

  // 24. Ambient glow card — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mgl-ambient-${g.name}`)
    const html = `<div class="${c}"><span class="halo"></span><div class="body"><strong>Ambient glow</strong><p>A blurred copy of the card, behind the card.</p></div></div>`
    const css = `.${c} {
  position: relative;
  width: 215px;
}
.${c} .halo {
  position: absolute;
  inset: 6px;
  border-radius: 0.9rem;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  filter: blur(22px);
  opacity: 0.55;
  transition: opacity 0.4s ease, filter 0.4s ease;
}
.${c} .body {
  position: relative;
  padding: 1.05rem 1.1rem;
  border-radius: 0.9rem;
  background: #0b1120;
  border: 1px solid rgba(255,255,255,0.1);
}
.${c} strong { font-size: 0.92rem; color: #f1f5f9; }
.${c} p { margin: 0.3rem 0 0; font-size: 0.77rem; line-height: 1.5; color: #7c8aa5; }
.${c}:hover .halo { opacity: 0.9; filter: blur(28px); }`
    add(mk({
      name: `${g.name} Ambient Glow Card`,
      category: 'Glow & Neon',
      description: `Card sitting above a blurred ${g.name.toLowerCase()} duplicate of itself — soft ambient light instead of a hard neon outline.`,
      html, css,
      tags: ['glow', 'ambient', 'card', 'blur', 'halo', g.name.toLowerCase()],
    }))
  }

  // 25. Aurora glow CTA — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mgl-cta-${g.name}`)
    const html = `<div class="${c}"><span class="aur"></span><button>Try it free</button></div>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
}
.${c} .aur {
  position: absolute;
  inset: -6px;
  border-radius: 999px;
  background: conic-gradient(from 0deg, ${g.a}, ${g.b}, ${g.a});
  filter: blur(14px);
  opacity: 0.7;
  animation: ${c}-spin 4s linear infinite;
}
.${c} button {
  position: relative;
  padding: 0.65rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0b1120;
  background: #f8fafc;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.${c} button:hover { transform: translateY(-1px); }
.${c} button:active { transform: translateY(0); }
@keyframes ${c}-spin { to { transform: rotate(1turn); } }`
    add(mk({
      name: `${g.name} Aurora CTA`,
      category: 'Glow & Neon',
      description: `Light button orbited by a blurred ${g.name.toLowerCase()} conic aura — high contrast on the button, all the color around it.`,
      html, css,
      tags: ['glow', 'cta', 'aurora', 'conic', 'button', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PATTERNS & TEXTURES  (+34)
   * ========================================================== */

  // 26. Grain panel — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mpt-grain-${pal.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  position: relative;
  overflow: hidden;
  width: 240px;
  height: 150px;
  border-radius: 0.7rem;
  background: linear-gradient(160deg, ${pal.p}, ${pal.a});
}
.${c}::after {
  content: '';
  position: absolute;
  inset: -50%;
  background-image: ${NOISE};
  opacity: 0.24;
  mix-blend-mode: overlay;
  animation: ${c}-grain 0.6s steps(4) infinite;
}
@keyframes ${c}-grain {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(-4%, 3%); }
  50%  { transform: translate(3%, -4%); }
  75%  { transform: translate(-3%, -3%); }
  100% { transform: translate(0, 0); }
}`
    add(mk({
      name: `${pal.name} Film Grain Panel`,
      category: 'Patterns & Textures',
      description: `${pal.name} surface under animated film grain — hides gradient banding and adds the analog texture flat color lacks.`,
      html, css,
      tags: ['pattern', 'grain', 'noise', 'film', 'texture', 'banding', pal.name.toLowerCase()],
    }))
  }

  // 27. Radial-fade dot field — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mpt-dotfade-${pal.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 150px;
  border-radius: 0.7rem;
  background-color: #050914;
  background-image: radial-gradient(rgba(${pal.rgb}, 0.65) 1.2px, transparent 1.2px);
  background-size: 16px 16px;
  -webkit-mask-image: radial-gradient(ellipse 60% 60% at 50% 45%, #000 20%, transparent 75%);
  mask-image: radial-gradient(ellipse 60% 60% at 50% 45%, #000 20%, transparent 75%);
}`
    add(mk({
      name: `${pal.name} Fading Dot Field`,
      category: 'Patterns & Textures',
      description: `${pal.name} dot field dissolved at the edges by a radial mask — the section background that never competes with the text on it.`,
      html, css,
      tags: ['pattern', 'dots', 'mask', 'fade', 'hero', 'background', pal.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MASKS & CLIP PATHS  (+20)
   * ========================================================== */

  // 28. Ticket notch — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mmk-ticket-${g.name}`)
    const html = `<div class="${c}"><strong>ADMIT ONE</strong><p>Row F · Seat 12</p></div>`
    const css = `.${c} {
  width: 200px;
  padding: 1.1rem 1.2rem;
  color: #fff;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  -webkit-mask:
    radial-gradient(circle 11px at 0 50%, transparent 98%, #000 100%),
    radial-gradient(circle 11px at 100% 50%, transparent 98%, #000 100%);
  -webkit-mask-composite: source-in;
  mask:
    radial-gradient(circle 11px at 0 50%, transparent 98%, #000 100%),
    radial-gradient(circle 11px at 100% 50%, transparent 98%, #000 100%);
  mask-composite: intersect;
}
.${c} strong {
  display: block;
  font-size: 0.95rem;
  letter-spacing: 0.14em;
}
.${c} p {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  opacity: 0.85;
  border-top: 1px dashed rgba(255,255,255,0.45);
  padding-top: 0.35rem;
}`
    add(mk({
      name: `${g.name} Ticket Notch`,
      category: 'Masks & Clip Paths',
      description: `Coupon/ticket shape with circular bites cut from both edges — two radial masks intersected, no SVG.`,
      html, css,
      tags: ['mask', 'ticket', 'coupon', 'notch', 'mask-composite', g.name.toLowerCase()],
    }))
  }

  // 29. Scroll-fade list — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`mmk-fadelist-${t.name}`)
    const html = `<div class="${c}"><ul><li>Continuous deployment</li><li>Preview environments</li><li>Edge caching</li><li>Instant rollbacks</li><li>Analytics</li></ul></div>`
    const css = `.${c} {
  width: 210px;
  height: 118px;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 22%, #000 72%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 22%, #000 72%, transparent);
}
.${c} ul {
  list-style: none;
  margin: 0;
  padding: 0;
  animation: ${c}-roll 9s linear infinite;
}
.${c} li {
  padding: 0.42rem 0.6rem;
  font-size: 0.83rem;
  font-weight: 600;
  color: ${t.b};
}
.${c} li:nth-child(even) { color: ${t.c}; }
@keyframes ${c}-roll {
  from { transform: translateY(0); }
  to   { transform: translateY(-50%); }
}`
    add(mk({
      name: `${t.name} Fade-Edge List`,
      category: 'Masks & Clip Paths',
      description: `Auto-scrolling list whose top and bottom dissolve into the page via mask-image — no hard cut, no wrapper gradients.`,
      html, css,
      tags: ['mask', 'mask-image', 'fade', 'scroll', 'list', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CHARTS & DATA  (+37)
   * ========================================================== */

  // 30. Semicircle gauge — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mch-gauge-${g.name}`)
    const html = `<div class="${c}"><span class="v">78</span><span class="l">Score</span></div>`
    const css = `.${c} {
  position: relative;
  width: 140px;
  height: 86px;
  overflow: hidden;
  text-align: center;
}
.${c}::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: conic-gradient(
    from 270deg,
    ${g.a} 0deg 70deg,
    ${g.b} 70deg 140deg,
    rgba(255,255,255,0.08) 140deg 180deg,
    transparent 180deg 360deg
  );
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 15px), #000 calc(100% - 14px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 15px), #000 calc(100% - 14px));
  animation: ${c}-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.${c} .v {
  position: absolute;
  left: 0;
  right: 0;
  top: 38px;
  font-size: 1.6rem;
  font-weight: 800;
  color: #f8fafc;
}
.${c} .l {
  position: absolute;
  left: 0;
  right: 0;
  top: 66px;
  font-size: 0.68rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #64748b;
}
@keyframes ${c}-in {
  from { transform: rotate(-90deg); opacity: 0; }
  to   { transform: rotate(0);      opacity: 1; }
}`
    add(mk({
      name: `${g.name} Semicircle Gauge`,
      category: 'Charts & Data',
      description: `Half-dial score gauge in ${g.name.toLowerCase()}, drawn from one conic gradient and cut to an arc with a radial mask.`,
      html, css,
      tags: ['chart', 'gauge', 'dial', 'score', 'conic', 'mask', g.name.toLowerCase()],
    }))
  }

  // 31. Grouped column chart — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`mch-group-${t.name}`)
    const html = `<div class="${c}"><div class="g"><i style="--h:60%"></i><i style="--h:40%"></i></div><div class="g"><i style="--h:82%"></i><i style="--h:55%"></i></div><div class="g"><i style="--h:47%"></i><i style="--h:70%"></i></div><div class="g"><i style="--h:90%"></i><i style="--h:62%"></i></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 118px;
  padding: 0.85rem;
  border-radius: 0.7rem;
  background: #0b1120;
  border: 1px solid rgba(255,255,255,0.07);
}
.${c} .g {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 100%;
}
.${c} i {
  width: 11px;
  height: var(--h);
  border-radius: 3px 3px 1px 1px;
  transform-origin: bottom;
  animation: ${c}-grow 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.${c} .g i:nth-child(1) { background: linear-gradient(180deg, ${t.b}, ${t.a}); }
.${c} .g i:nth-child(2) { background: linear-gradient(180deg, ${t.c}, ${t.b}); opacity: 0.65; }
.${c} .g:nth-child(2) i { animation-delay: 0.08s; }
.${c} .g:nth-child(3) i { animation-delay: 0.16s; }
.${c} .g:nth-child(4) i { animation-delay: 0.24s; }
@keyframes ${c}-grow {
  from { transform: scaleY(0); }
}`
    add(mk({
      name: `${t.name} Grouped Columns`,
      category: 'Charts & Data',
      description: `Two-series comparison chart in ${t.name.toLowerCase()}; bar heights are a --h custom property, so the markup carries the data.`,
      html, css,
      tags: ['chart', 'columns', 'grouped', 'comparison', 'custom-property', t.name.toLowerCase()],
    }))
  }

  // 32. Trend row list — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mch-trend-${pal.name}`)
    const html = `<ul class="${c}"><li><span>/pricing</span><i style="--w:82%"></i><b>4.2k</b></li><li><span>/docs</span><i style="--w:61%"></i><b>3.1k</b></li><li><span>/blog</span><i style="--w:34%"></i><b>1.7k</b></li></ul>`
    const css = `.${c} {
  list-style: none;
  margin: 0;
  padding: 0.85rem;
  width: 235px;
  border-radius: 0.7rem;
  background: #0b1120;
  border: 1px solid rgba(255,255,255,0.07);
}
.${c} li {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: 0.4rem;
  overflow: hidden;
}
.${c} i {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--w);
  background: rgba(${pal.rgb}, 0.16);
  border-left: 2px solid ${pal.p};
  animation: ${c}-grow 1s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.${c} li:nth-child(2) i { animation-delay: 0.1s; }
.${c} li:nth-child(3) i { animation-delay: 0.2s; }
.${c} span { position: relative; font-size: 0.79rem; color: #cbd5e1; }
.${c} b { position: relative; font-size: 0.76rem; color: ${pal.a}; }
@keyframes ${c}-grow {
  from { transform: scaleX(0); transform-origin: left; }
}`
    add(mk({
      name: `${pal.name} Trend Rows`,
      category: 'Charts & Data',
      description: `Top-pages analytics list where each row's ${pal.name.toLowerCase()} bar is the value — the density every dashboard sidebar needs.`,
      html, css,
      tags: ['chart', 'analytics', 'rows', 'bar', 'dashboard', 'top-list', pal.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TIMELINES & STEPS  (+20)
   * ========================================================== */

  // 33. Icon step list — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mtl-icon-${g.name}`)
    const html = `<ol class="${c}"><li class="done"><i></i><div><strong>Repository connected</strong><span>2 min ago</span></div></li><li class="now"><i></i><div><strong>Building</strong><span>running…</span></div></li><li><i></i><div><strong>Deploy</strong><span>queued</span></div></li></ol>`
    const css = `.${c} {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 215px;
}
.${c} li {
  position: relative;
  display: flex;
  gap: 0.7rem;
  padding-bottom: 1rem;
}
.${c} li:last-child { padding-bottom: 0; }
.${c} li::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 22px;
  bottom: 0;
  width: 2px;
  background: rgba(255,255,255,0.1);
}
.${c} li:last-child::before { display: none; }
.${c} li.done::before { background: linear-gradient(180deg, ${g.a}, ${g.b}); }
.${c} i {
  position: relative;
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #0b1120;
  border: 2px solid rgba(255,255,255,0.14);
}
.${c} li.done i {
  border-color: transparent;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
}
.${c} li.done i::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 3px;
  width: 4px;
  height: 8px;
  border: 2px solid #fff;
  border-top: 0;
  border-left: 0;
  transform: rotate(42deg);
}
.${c} li.now i {
  border-color: ${g.a};
  animation: ${c}-pulse 1.6s ease-in-out infinite;
}
.${c} strong { display: block; font-size: 0.82rem; color: #e2e8f0; }
.${c} span { font-size: 0.72rem; color: #64748b; }
@keyframes ${c}-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(${rgbOf(g.a)}, 0.45); }
  50%      { box-shadow: 0 0 0 6px rgba(${rgbOf(g.a)}, 0); }
}`
    add(mk({
      name: `${g.name} Deploy Timeline`,
      category: 'Timelines & Steps',
      description: `Build log timeline with ${g.name.toLowerCase()} completed nodes, CSS-drawn checkmarks and a pulsing current step.`,
      html, css,
      tags: ['timeline', 'steps', 'deploy', 'log', 'status', g.name.toLowerCase()],
    }))
  }

  // 34. Roadmap milestones — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`mtl-road-${t.name}`)
    const html = `<div class="${c}"><div class="rail"></div><div class="ms"><i></i><b>Q1</b><span>Beta</span></div><div class="ms"><i></i><b>Q2</b><span>GA</span></div><div class="ms"><i></i><b>Q3</b><span>Teams</span></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  justify-content: space-between;
  width: 240px;
  padding-top: 6px;
}
.${c} .rail {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 12px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, ${t.a}, ${t.b}, ${t.c});
}
.${c} .ms {
  position: relative;
  flex: 1;
  text-align: center;
}
.${c} i {
  display: block;
  width: 13px;
  height: 13px;
  margin: 0 auto 0.5rem;
  border-radius: 50%;
  background: #0b1120;
  animation: ${c}-pop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.${c} .ms:nth-child(2) i { box-shadow: 0 0 0 3px ${t.a}; }
.${c} .ms:nth-child(3) i { box-shadow: 0 0 0 3px ${t.b}; animation-delay: 0.12s; }
.${c} .ms:nth-child(4) i { box-shadow: 0 0 0 3px ${t.c}; animation-delay: 0.24s; }
.${c} b { display: block; font-size: 0.78rem; color: #e2e8f0; }
.${c} span { font-size: 0.7rem; color: #64748b; }
@keyframes ${c}-pop {
  from { transform: scale(0); }
}`
    add(mk({
      name: `${t.name} Roadmap Milestones`,
      category: 'Timelines & Steps',
      description: `Horizontal roadmap with a ${t.name.toLowerCase()} rail and milestone nodes that pop in one after another.`,
      html, css,
      tags: ['timeline', 'roadmap', 'milestones', 'horizontal', 'product', t.name.toLowerCase()],
    }))
  }
}
