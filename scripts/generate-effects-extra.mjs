// scripts/generate-effects-extra.mjs
//
// Second-wave effect generators. Everything here produces the twelve
// categories added after the original thirteen:
//
//   Borders & Outlines      Progress & Meters     Avatars & Images
//   Modals & Overlays       Alerts & Toasts       Accordions & Tabs
//   3D & Perspective        Glow & Neon           Patterns & Textures
//   Masks & Clip Paths      Charts & Data         Timelines & Steps
//
// It lives in its own file purely for readability — generate-effects.mjs
// was already 1,800 lines. The design tokens (palettes, gradient pairs,
// trios, neutrals, sizes) and the `cls` / `mk` / `add` helpers are owned
// by the main generator and passed in, so both waves share one id
// sequence and one set of colors.
//
// Every effect assumes a DARK preview surface (mk defaults darkSurface
// to true), so text defaults to light and backgrounds to slate/near-black.

/** '#f43f5e' -> '244,63,94' — for rgba() shadows and glows. */
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')

export function generateExtra(ctx) {
  const { PALETTES, GRADPAIRS, TRIOS, cls, mk, add } = ctx

  /* ============================================================
   *  BORDERS & OUTLINES  (~82)
   * ========================================================== */

  // 1. Conic gradient rotating border — 12 pairs × 2 sizes = 24
  for (const g of GRADPAIRS) {
    for (const sz of ['MD', 'LG']) {
      const c = cls(`bd-conic-${g.name}-${sz}`)
      const pad = sz === 'MD' ? '0.75rem 1.3rem' : '1rem 1.7rem'
      const fs = sz === 'MD' ? '0.9rem' : '1.05rem'
      const html = `<div class="${c}"><span>Gradient border</span></div>`
      const css = `.${c} {
  position: relative;
  display: inline-block;
  padding: 2px;
  border-radius: 0.7rem;
  overflow: hidden;
  background: #1e293b;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: -100%;
  background: conic-gradient(from 0turn, transparent 0 55%, ${g.a} 75%, ${g.b} 100%);
  animation: ${c}-spin 3s linear infinite;
}
.${c} > span {
  position: relative;
  display: block;
  padding: ${pad};
  font-size: ${fs};
  font-weight: 600;
  color: #e2e8f0;
  background: #0f172a;
  border-radius: calc(0.7rem - 2px);
}
@keyframes ${c}-spin { to { transform: rotate(1turn); } }`
      add(mk({
        name: `${g.name} Conic Border (${sz})`,
        category: 'Borders & Outlines',
        description: `A ${g.name.toLowerCase()} light sweeps continuously around the border edge.`,
        html, css,
        tags: ['border', 'conic', 'gradient', 'animated', g.name.toLowerCase(), sz.toLowerCase()],
      }))
    }
  }

  // 2. Marching-ants dashed border — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`bd-ants-${pal.name}`)
    const html = `<div class="${c}">Drop files here</div>`
    const css = `.${c} {
  padding: 1.1rem 1.6rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
  border-radius: 0.5rem;
  background-color: #0f172a;
  background-image:
    linear-gradient(90deg, ${pal.p} 50%, transparent 0),
    linear-gradient(90deg, ${pal.p} 50%, transparent 0),
    linear-gradient(0deg, ${pal.p} 50%, transparent 0),
    linear-gradient(0deg, ${pal.p} 50%, transparent 0);
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  background-size: 16px 2px, 16px 2px, 2px 16px, 2px 16px;
  background-position: 0 0, 0 100%, 0 0, 100% 0;
  animation: ${c}-ants 0.5s linear infinite;
}
@keyframes ${c}-ants {
  to { background-position: 16px 0, -16px 100%, 0 -16px, 100% 16px; }
}`
    add(mk({
      name: `${pal.name} Marching Ants Border`,
      category: 'Borders & Outlines',
      description: `Dashed ${pal.name.toLowerCase()} outline whose dashes crawl around the box — the classic dropzone cue.`,
      html, css,
      tags: ['border', 'dashed', 'marching-ants', 'dropzone', pal.name.toLowerCase()],
    }))
  }

  // 3. Corner brackets that expand on hover — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`bd-corner-${pal.name}`)
    const html = `<div class="${c}">Hover me</div>`
    const css = `.${c} {
  position: relative;
  padding: 1.3rem 2rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #e2e8f0;
  background: #0f172a;
}
.${c}::before,
.${c}::after {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  border: 2px solid ${pal.p};
  transition: width 0.35s ease, height 0.35s ease;
}
.${c}::before { top: 0; left: 0; border-right: 0; border-bottom: 0; }
.${c}::after  { bottom: 0; right: 0; border-left: 0; border-top: 0; }
.${c}:hover::before,
.${c}:hover::after {
  width: calc(100% - 4px);
  height: calc(100% - 4px);
}`
    add(mk({
      name: `${pal.name} Corner Bracket Border`,
      category: 'Borders & Outlines',
      description: `Two ${pal.name.toLowerCase()} corner brackets that grow into a full frame on hover.`,
      html, css,
      tags: ['border', 'corner', 'bracket', 'hover', pal.name.toLowerCase()],
    }))
  }

  // 4. Outline-offset glow on hover — 12 pairs × 2 sizes = 24
  for (const g of GRADPAIRS) {
    for (const sz of ['MD', 'LG']) {
      const c = cls(`bd-outline-${g.name}-${sz}`)
      const pad = sz === 'MD' ? '0.7rem 1.3rem' : '0.95rem 1.7rem'
      const fs = sz === 'MD' ? '0.9rem' : '1.05rem'
      const html = `<button class="${c}">Focus ring</button>`
      const css = `.${c} {
  padding: ${pad};
  font-size: ${fs};
  font-weight: 600;
  color: #fff;
  border: none;
  cursor: pointer;
  border-radius: 0.6rem;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  outline: 2px solid rgba(${rgbOf(g.a)}, 0.5);
  outline-offset: 2px;
  transition: outline-offset 0.3s ease, box-shadow 0.3s ease;
}
.${c}:hover,
.${c}:focus-visible {
  outline-offset: 8px;
  box-shadow: 0 0 32px rgba(${rgbOf(g.a)}, 0.45);
}`
      add(mk({
        name: `${g.name} Expanding Outline (${sz})`,
        category: 'Borders & Outlines',
        description: `Outline pushes away from the button and blooms into a ${g.name.toLowerCase()} glow on hover or keyboard focus.`,
        html, css,
        tags: ['border', 'outline', 'focus', 'glow', g.name.toLowerCase(), sz.toLowerCase()],
      }))
    }
  }

  /* ============================================================
   *  PROGRESS & METERS  (~83)
   * ========================================================== */

  // 1. Animated striped bar — 17 palettes × 2 sizes = 34
  for (const pal of PALETTES) {
    for (const sz of ['SM', 'MD']) {
      const c = cls(`pg-stripe-${pal.name}-${sz}`)
      const h = sz === 'SM' ? 8 : 14
      const html = `<div class="${c}"><span></span></div>`
      const css = `.${c} {
  width: 220px;
  height: ${h}px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
}
.${c} span {
  display: block;
  width: 68%;
  height: 100%;
  border-radius: inherit;
  background-color: ${pal.p};
  background-image: linear-gradient(
    45deg,
    rgba(255,255,255,0.22) 25%, transparent 25%,
    transparent 50%, rgba(255,255,255,0.22) 50%,
    rgba(255,255,255,0.22) 75%, transparent 75%
  );
  background-size: ${h * 2}px ${h * 2}px;
  animation: ${c}-move 0.8s linear infinite;
  box-shadow: 0 0 12px rgba(${pal.rgb}, 0.5);
}
@keyframes ${c}-move {
  to { background-position: ${h * 2}px 0; }
}`
      add(mk({
        name: `${pal.name} Striped Progress (${sz})`,
        category: 'Progress & Meters',
        description: `${pal.name} progress bar with diagonal stripes scrolling to signal ongoing work.`,
        html, css,
        tags: ['progress', 'bar', 'striped', pal.name.toLowerCase(), sz.toLowerCase()],
      }))
    }
  }

  // 2. Indeterminate sweep bar — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`pg-indet-${g.name}`)
    const html = `<div class="${c}"><span></span></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  height: 5px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
}
.${c} span {
  position: absolute;
  inset: 0 auto 0 0;
  width: 40%;
  border-radius: inherit;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  animation: ${c}-sweep 1.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
@keyframes ${c}-sweep {
  0%   { left: -40%; }
  100% { left: 100%; }
}`
    add(mk({
      name: `${g.name} Indeterminate Bar`,
      category: 'Progress & Meters',
      description: `Loading bar with an unknown duration — a ${g.name.toLowerCase()} segment sweeps across the track.`,
      html, css,
      tags: ['progress', 'indeterminate', 'loading', g.name.toLowerCase()],
    }))
  }

  // 3. Conic ring progress — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`pg-ring-${pal.name}`)
    const html = `<div class="${c}"><span>72%</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: conic-gradient(${pal.p} 0turn, ${pal.s} 0.72turn, rgba(255,255,255,0.08) 0.72turn 1turn);
  animation: ${c}-fill 1.4s cubic-bezier(0.65, 0, 0.35, 1) both;
  filter: drop-shadow(0 0 10px rgba(${pal.rgb}, 0.4));
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 9px;
  border-radius: 50%;
  background: #0f172a;
}
.${c} span {
  position: relative;
  font-size: 1rem;
  font-weight: 700;
  color: ${pal.a};
}
@keyframes ${c}-fill {
  from { background: conic-gradient(${pal.p} 0turn, ${pal.s} 0turn, rgba(255,255,255,0.08) 0turn 1turn); }
}`
    add(mk({
      name: `${pal.name} Ring Progress`,
      category: 'Progress & Meters',
      description: `Circular ${pal.name.toLowerCase()} progress ring built from a single conic-gradient, with the value in the middle.`,
      html, css,
      tags: ['progress', 'ring', 'circular', 'conic', pal.name.toLowerCase()],
    }))
  }

  // 4. Segmented step meter — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`pg-seg-${g.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: flex;
  gap: 6px;
}
.${c} i {
  width: 34px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.1);
  animation: ${c}-fill 2s ease-in-out infinite;
}
.${c} i:nth-child(1) { animation-delay: 0s; }
.${c} i:nth-child(2) { animation-delay: 0.15s; }
.${c} i:nth-child(3) { animation-delay: 0.3s; }
.${c} i:nth-child(4) { animation-delay: 0.45s; }
.${c} i:nth-child(5) { animation-delay: 0.6s; }
@keyframes ${c}-fill {
  0%, 100% { background: rgba(255,255,255,0.1); box-shadow: none; }
  35%, 70% { background: linear-gradient(90deg, ${g.a}, ${g.b}); box-shadow: 0 0 10px rgba(${rgbOf(g.a)}, 0.5); }
}`
    add(mk({
      name: `${g.name} Segmented Meter`,
      category: 'Progress & Meters',
      description: `Five segments light up in sequence in ${g.name.toLowerCase()} — good for multi-step or signal-strength meters.`,
      html, css,
      tags: ['progress', 'segmented', 'steps', 'meter', g.name.toLowerCase()],
    }))
  }

  // 5. Labelled gradient meter — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`pg-meter-${t.name}`)
    const html = `<div class="${c}"><div class="row"><span>Storage</span><b>62%</b></div><div class="track"><span></span></div></div>`
    const css = `.${c} {
  width: 240px;
  padding: 0.9rem 1rem;
  border-radius: 0.7rem;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.08);
}
.${c} .row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 0.55rem;
}
.${c} .row b { color: ${t.b}; }
.${c} .track {
  height: 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.07);
  overflow: hidden;
}
.${c} .track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, ${t.a}, ${t.b}, ${t.c});
  animation: ${c}-grow 1.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes ${c}-grow {
  from { width: 0; }
  to   { width: 62%; }
}`
    add(mk({
      name: `${t.name} Labelled Meter`,
      category: 'Progress & Meters',
      description: `Usage meter with a label row and a ${t.name.toLowerCase()} tri-color fill that animates from zero.`,
      html, css,
      tags: ['progress', 'meter', 'usage', 'label', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  AVATARS & IMAGES  (~78)
   * ========================================================== */

  // 1. Glow-ring avatar — 17 palettes × 2 sizes = 34
  for (const pal of PALETTES) {
    for (const sz of ['MD', 'LG']) {
      const c = cls(`av-glow-${pal.name}-${sz}`)
      const s = sz === 'MD' ? 56 : 76
      const html = `<div class="${c}">AB</div>`
      const css = `.${c} {
  display: grid;
  place-items: center;
  width: ${s}px;
  height: ${s}px;
  border-radius: 50%;
  font-size: ${sz === 'MD' ? '1rem' : '1.35rem'};
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
  background: linear-gradient(140deg, ${pal.p}, ${pal.a});
  box-shadow: 0 0 0 3px rgba(${pal.rgb}, 0.25), 0 8px 22px rgba(${pal.rgb}, 0.35);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  cursor: pointer;
}
.${c}:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 0 6px rgba(${pal.rgb}, 0.2), 0 14px 30px rgba(${pal.rgb}, 0.45);
}`
      add(mk({
        name: `${pal.name} Glow Avatar (${sz})`,
        category: 'Avatars & Images',
        description: `Initials avatar with a soft ${pal.name.toLowerCase()} halo that widens on hover.`,
        html, css,
        tags: ['avatar', 'initials', 'glow', 'ring', pal.name.toLowerCase(), sz.toLowerCase()],
      }))
    }
  }

  // 2. Rotating gradient ring avatar — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`av-ring-${g.name}`)
    const html = `<div class="${c}"><span>JD</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: conic-gradient(${g.a}, ${g.b}, ${g.a});
  animation: ${c}-spin 3s linear infinite;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: #0f172a;
}
.${c} span {
  position: relative;
  font-size: 1.1rem;
  font-weight: 700;
  color: #e2e8f0;
}
@keyframes ${c}-spin { to { transform: rotate(1turn); } }`
    add(mk({
      name: `${g.name} Spinning Ring Avatar`,
      category: 'Avatars & Images',
      description: `Avatar wrapped in a rotating ${g.name.toLowerCase()} conic ring — the "story" ring pattern, in pure CSS.`,
      html, css,
      tags: ['avatar', 'ring', 'conic', 'story', g.name.toLowerCase()],
    }))
  }

  // 3. Image tile with zoom + caption reveal — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`im-zoom-${g.name}`)
    const html = `<figure class="${c}"><div class="img"></div><figcaption>${g.name} Trail</figcaption></figure>`
    const css = `.${c} {
  position: relative;
  width: 200px;
  height: 140px;
  margin: 0;
  border-radius: 0.8rem;
  overflow: hidden;
  cursor: pointer;
}
.${c} .img {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.75), transparent 60%);
  opacity: 0;
  transition: opacity 0.4s ease;
}
.${c} figcaption {
  position: absolute;
  left: 0.9rem;
  bottom: 0.8rem;
  z-index: 1;
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  transform: translateY(14px);
  opacity: 0;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
}
.${c}:hover .img { transform: scale(1.12); }
.${c}:hover::after { opacity: 1; }
.${c}:hover figcaption { transform: translateY(0); opacity: 1; }`
    add(mk({
      name: `${g.name} Zoom Caption Tile`,
      category: 'Avatars & Images',
      description: `Image tile that zooms under a darkening scrim while the caption slides up — swap the gradient for your own <img>.`,
      html, css,
      tags: ['image', 'zoom', 'caption', 'overlay', 'gallery', g.name.toLowerCase()],
    }))
  }

  // 4. Grayscale → color on hover — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`im-desat-${t.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 180px;
  height: 120px;
  border-radius: 0.7rem;
  background: linear-gradient(120deg, ${t.a}, ${t.b}, ${t.c});
  filter: grayscale(1) contrast(1.1);
  transition: filter 0.5s ease, transform 0.5s ease;
  cursor: pointer;
}
.${c}:hover {
  filter: grayscale(0) contrast(1);
  transform: scale(1.03);
}`
    add(mk({
      name: `${t.name} Desaturate Reveal`,
      category: 'Avatars & Images',
      description: `Media tile that sits in grayscale until hover, then restores full ${t.name.toLowerCase()} color.`,
      html, css,
      tags: ['image', 'grayscale', 'filter', 'hover', t.name.toLowerCase()],
    }))
  }

  // 5. Overlapping avatar group — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`av-stack-${g.name}`)
    const html = `<div class="${c}"><span>A</span><span>B</span><span>C</span><span class="more">+7</span></div>`
    const css = `.${c} {
  display: flex;
}
.${c} span {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-left: -12px;
  border-radius: 50%;
  border: 2px solid #0f172a;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  transition: transform 0.25s ease, margin 0.25s ease;
  cursor: pointer;
}
.${c} span:first-child { margin-left: 0; }
.${c} span.more {
  background: #1e293b;
  color: #94a3b8;
}
.${c}:hover span { margin-left: 4px; }
.${c}:hover span:first-child { margin-left: 0; }
.${c} span:hover { transform: translateY(-4px); }`
    add(mk({
      name: `${g.name} Avatar Stack`,
      category: 'Avatars & Images',
      description: `Overlapping avatar group in ${g.name.toLowerCase()} that fans out on hover, with an overflow chip.`,
      html, css,
      tags: ['avatar', 'group', 'stack', 'overlap', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MODALS & OVERLAYS  (~61)
   * ========================================================== */

  // 1. Blurred backdrop dialog — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`md-blur-${g.name}`)
    const html = `<div class="${c}"><div class="sheet"><h4>Confirm</h4><p>This can't be undone.</p><button>Continue</button></div></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 260px;
  height: 170px;
  border-radius: 0.8rem;
  overflow: hidden;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  background: rgba(2, 6, 23, 0.55);
  animation: ${c}-fade 0.4s ease both;
}
.${c} .sheet {
  position: relative;
  width: 190px;
  padding: 1rem;
  border-radius: 0.7rem;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  animation: ${c}-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.${c} h4 { margin: 0 0 0.3rem; font-size: 0.95rem; color: #f1f5f9; }
.${c} p  { margin: 0 0 0.8rem; font-size: 0.8rem; color: #94a3b8; }
.${c} button {
  width: 100%;
  padding: 0.45rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  border: none;
  border-radius: 0.45rem;
  cursor: pointer;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
}
@keyframes ${c}-fade { from { opacity: 0; } }
@keyframes ${c}-in {
  from { opacity: 0; transform: translateY(14px) scale(0.96); }
}`
    add(mk({
      name: `${g.name} Blur Backdrop Dialog`,
      category: 'Modals & Overlays',
      description: `Dialog over a frosted ${g.name.toLowerCase()} backdrop; the scrim fades while the sheet lifts in.`,
      html, css,
      tags: ['modal', 'dialog', 'backdrop', 'blur', 'glass', g.name.toLowerCase()],
    }))
  }

  // 2. Bottom sheet slide-up — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`md-sheet-${pal.name}`)
    const html = `<div class="${c}"><div class="sheet"><i></i><strong>Share</strong><p>Pick a destination</p></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: flex-end;
  width: 220px;
  height: 170px;
  border-radius: 0.8rem;
  overflow: hidden;
  background: #020617;
}
.${c} .sheet {
  width: 100%;
  padding: 0.9rem 1rem 1.1rem;
  text-align: center;
  border-radius: 0.9rem 0.9rem 0 0;
  background: #0f172a;
  border-top: 2px solid ${pal.p};
  box-shadow: 0 -14px 40px rgba(${pal.rgb}, 0.28);
  animation: ${c}-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.${c} i {
  display: block;
  width: 36px;
  height: 4px;
  margin: 0 auto 0.7rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.25);
}
.${c} strong { font-size: 0.9rem; color: #f1f5f9; }
.${c} p { margin: 0.2rem 0 0; font-size: 0.78rem; color: ${pal.a}; }
@keyframes ${c}-up {
  from { transform: translateY(100%); }
}`
    add(mk({
      name: `${pal.name} Bottom Sheet`,
      category: 'Modals & Overlays',
      description: `Mobile-style bottom sheet with a grab handle and a ${pal.name.toLowerCase()} accent, sliding up from the edge.`,
      html, css,
      tags: ['modal', 'sheet', 'drawer', 'mobile', 'slide-up', pal.name.toLowerCase()],
    }))
  }

  // 3. Spring scale-in dialog — 12 pairs × 2 sizes = 24
  for (const g of GRADPAIRS) {
    for (const sz of ['MD', 'LG']) {
      const c = cls(`md-pop-${g.name}-${sz}`)
      const w = sz === 'MD' ? 190 : 230
      const html = `<div class="${c}"><span class="badge">!</span><strong>Heads up</strong><p>Your trial ends in 3 days.</p></div>`
      const css = `.${c} {
  width: ${w}px;
  padding: 1.1rem 1rem 1rem;
  text-align: center;
  border-radius: 0.9rem;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 24px 60px rgba(0,0,0,0.5);
  animation: ${c}-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.${c} .badge {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  margin: 0 auto 0.6rem;
  border-radius: 50%;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 0 0 6px rgba(${rgbOf(g.a)}, 0.16);
}
.${c} strong { font-size: 0.95rem; color: #f1f5f9; }
.${c} p { margin: 0.3rem 0 0; font-size: 0.8rem; color: #94a3b8; }
@keyframes ${c}-pop {
  from { opacity: 0; transform: scale(0.7); }
}`
      add(mk({
        name: `${g.name} Spring Dialog (${sz})`,
        category: 'Modals & Overlays',
        description: `Alert dialog that springs in past its final size, topped with a ${g.name.toLowerCase()} badge.`,
        html, css,
        tags: ['modal', 'dialog', 'spring', 'popup', g.name.toLowerCase(), sz.toLowerCase()],
      }))
    }
  }

  // 4. Spotlight vignette overlay — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`md-spot-${t.name}`)
    const html = `<div class="${c}"><span>Step 1 of 4</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: end center;
  width: 230px;
  height: 150px;
  padding-bottom: 1rem;
  border-radius: 0.8rem;
  overflow: hidden;
  background: linear-gradient(120deg, ${t.a}, ${t.b}, ${t.c});
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle 46px at 50% 38%, transparent 0 46px, rgba(2,6,23,0.82) 48px);
  animation: ${c}-pulse 2.4s ease-in-out infinite;
}
.${c} span {
  position: relative;
  font-size: 0.78rem;
  font-weight: 600;
  color: #e2e8f0;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: rgba(15,23,42,0.85);
}
@keyframes ${c}-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.06); }
}`
    add(mk({
      name: `${t.name} Spotlight Overlay`,
      category: 'Modals & Overlays',
      description: `Product-tour spotlight: everything dims except a breathing circular cutout over the ${t.name.toLowerCase()} surface.`,
      html, css,
      tags: ['overlay', 'spotlight', 'onboarding', 'tour', 'vignette', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ALERTS & TOASTS  (~58)
   * ========================================================== */

  // 1. Left-accent alert — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`al-accent-${pal.name}`)
    const html = `<div class="${c}"><strong>Saved</strong><p>Your changes are live.</p></div>`
    const css = `.${c} {
  width: 230px;
  padding: 0.75rem 0.9rem;
  border-radius: 0.5rem;
  background: rgba(${pal.rgb}, 0.1);
  border-left: 3px solid ${pal.p};
  animation: ${c}-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.${c} strong { font-size: 0.85rem; color: ${pal.a}; }
.${c} p { margin: 0.2rem 0 0; font-size: 0.78rem; color: #cbd5e1; }
@keyframes ${c}-in {
  from { opacity: 0; transform: translateX(-12px); }
}`
    add(mk({
      name: `${pal.name} Accent Alert`,
      category: 'Alerts & Toasts',
      description: `Inline alert with a ${pal.name.toLowerCase()} accent rail and a tinted background wash.`,
      html, css,
      tags: ['alert', 'inline', 'accent', 'notice', pal.name.toLowerCase()],
    }))
  }

  // 2. Filled gradient toast — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`al-toast-${g.name}`)
    const html = `<div class="${c}"><span class="dot"></span><p>Deployment finished</p></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 230px;
  padding: 0.7rem 0.9rem;
  border-radius: 0.6rem;
  color: #fff;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  box-shadow: 0 12px 30px rgba(${rgbOf(g.a)}, 0.35);
  animation: ${c}-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.${c} .dot {
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #fff;
  animation: ${c}-blink 1.4s ease-in-out infinite;
}
.${c} p { margin: 0; font-size: 0.82rem; font-weight: 600; }
@keyframes ${c}-in {
  from { opacity: 0; transform: translateY(-14px) scale(0.95); }
}
@keyframes ${c}-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}`
    add(mk({
      name: `${g.name} Gradient Toast`,
      category: 'Alerts & Toasts',
      description: `Solid ${g.name.toLowerCase()} toast that drops in with a spring and keeps a blinking status dot.`,
      html, css,
      tags: ['toast', 'notification', 'gradient', g.name.toLowerCase()],
    }))
  }

  // 3. Glass toast with countdown bar — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`al-count-${g.name}`)
    const html = `<div class="${c}"><p>Copied to clipboard</p><span></span></div>`
    const css = `.${c} {
  position: relative;
  width: 230px;
  padding: 0.75rem 0.9rem 0.9rem;
  border-radius: 0.6rem;
  overflow: hidden;
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: 0 14px 34px rgba(0,0,0,0.35);
}
.${c} p { margin: 0; font-size: 0.82rem; font-weight: 600; color: #e2e8f0; }
.${c} span {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  transform-origin: left;
  animation: ${c}-tick 4s linear infinite;
}
@keyframes ${c}-tick {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}`
    add(mk({
      name: `${g.name} Countdown Toast`,
      category: 'Alerts & Toasts',
      description: `Frosted toast with a ${g.name.toLowerCase()} bar draining along the bottom to show time until dismiss.`,
      html, css,
      tags: ['toast', 'glass', 'countdown', 'timer', g.name.toLowerCase()],
    }))
  }

  // 4. Pulsing status alert — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`al-pulse-${pal.name}`)
    const html = `<div class="${c}"><span class="ping"></span><p>Live — 42 viewers</p></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.9rem 0.5rem 0.8rem;
  border-radius: 999px;
  background: #0f172a;
  border: 1px solid rgba(${pal.rgb}, 0.35);
}
.${c} .ping {
  position: relative;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${pal.p};
}
.${c} .ping::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: ${pal.p};
  animation: ${c}-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
}
.${c} p { margin: 0; font-size: 0.8rem; font-weight: 600; color: #e2e8f0; }
@keyframes ${c}-ping {
  0%   { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(3); opacity: 0; }
}`
    add(mk({
      name: `${pal.name} Live Status Pill`,
      category: 'Alerts & Toasts',
      description: `Status pill with a ${pal.name.toLowerCase()} dot that emits an expanding ping ring.`,
      html, css,
      tags: ['alert', 'status', 'pill', 'ping', 'live', pal.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ACCORDIONS & TABS  (~58)
   * ========================================================== */

  // 1. Underline tabs — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`tb-underline-${pal.name}`)
    const html = `<div class="${c}"><a class="on">Overview</a><a>Activity</a><a>Settings</a></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.${c} a {
  position: relative;
  padding: 0.55rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.25s ease;
}
.${c} a::after {
  content: '';
  position: absolute;
  left: 0.9rem;
  right: 0.9rem;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: ${pal.p};
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.${c} a:hover { color: #e2e8f0; }
.${c} a:hover::after,
.${c} a.on::after { transform: scaleX(1); }
.${c} a.on { color: ${pal.a}; }`
    add(mk({
      name: `${pal.name} Underline Tabs`,
      category: 'Accordions & Tabs',
      description: `Tab row where a ${pal.name.toLowerCase()} underline scales out from the center of the active item.`,
      html, css,
      tags: ['tabs', 'underline', 'nav', pal.name.toLowerCase()],
    }))
  }

  // 2. Pill tabs — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`tb-pill-${g.name}`)
    const html = `<div class="${c}"><a class="on">Day</a><a>Week</a><a>Month</a></div>`
    const css = `.${c} {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
}
.${c} a {
  padding: 0.4rem 0.95rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
}
.${c} a:hover { color: #e2e8f0; }
.${c} a.on {
  color: #fff;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  box-shadow: 0 4px 14px rgba(${rgbOf(g.a)}, 0.4);
}`
    add(mk({
      name: `${g.name} Pill Tabs`,
      category: 'Accordions & Tabs',
      description: `Compact pill tab group; the active tab carries the ${g.name.toLowerCase()} gradient and a matching shadow.`,
      html, css,
      tags: ['tabs', 'pill', 'segmented', g.name.toLowerCase()],
    }))
  }

  // 3. Sliding segmented control — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`tb-slide-${g.name}`)
    const html = `<div class="${c}"><i></i><a>Left</a><a>Center</a><a>Right</a></div>`
    const css = `.${c} {
  position: relative;
  display: inline-flex;
  padding: 0.25rem;
  border-radius: 0.6rem;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.08);
}
.${c} i {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: 74px;
  height: calc(100% - 0.5rem);
  border-radius: 0.45rem;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  box-shadow: 0 4px 12px rgba(${rgbOf(g.a)}, 0.4);
  animation: ${c}-slide 4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
.${c} a {
  position: relative;
  width: 74px;
  text-align: center;
  padding: 0.42rem 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #e2e8f0;
  cursor: pointer;
}
@keyframes ${c}-slide {
  0%, 22%   { transform: translateX(0); }
  33%, 55%  { transform: translateX(74px); }
  66%, 88%  { transform: translateX(148px); }
  100%      { transform: translateX(0); }
}`
    add(mk({
      name: `${g.name} Sliding Segments`,
      category: 'Accordions & Tabs',
      description: `Segmented control with a ${g.name.toLowerCase()} thumb that glides between the three options.`,
      html, css,
      tags: ['tabs', 'segmented', 'slider', 'indicator', g.name.toLowerCase()],
    }))
  }

  // 4. Native <details> accordion — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`ac-details-${pal.name}`)
    const html = `<details class="${c}" open><summary>What is included?</summary><p>Every effect, forever, with no attribution required.</p></details>`
    const css = `.${c} {
  width: 240px;
  border-radius: 0.6rem;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.08);
  overflow: hidden;
}
.${c} summary {
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #e2e8f0;
  cursor: pointer;
  transition: background 0.25s ease;
}
.${c} summary::-webkit-details-marker { display: none; }
.${c} summary::after {
  content: '+';
  font-size: 1.1rem;
  line-height: 1;
  color: ${pal.p};
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.${c}[open] summary::after { transform: rotate(135deg); }
.${c} summary:hover { background: rgba(${pal.rgb}, 0.1); }
.${c} p {
  margin: 0;
  padding: 0 0.9rem 0.85rem;
  font-size: 0.78rem;
  line-height: 1.5;
  color: #94a3b8;
  border-top: 1px solid rgba(${pal.rgb}, 0.2);
  padding-top: 0.7rem;
  animation: ${c}-open 0.35s ease both;
}
@keyframes ${c}-open {
  from { opacity: 0; transform: translateY(-6px); }
}`
    add(mk({
      name: `${pal.name} Details Accordion`,
      category: 'Accordions & Tabs',
      description: `Accessible <details> accordion — no JavaScript — with a ${pal.name.toLowerCase()} plus icon that rotates into a cross.`,
      html, css,
      tags: ['accordion', 'details', 'faq', 'disclosure', 'no-js', pal.name.toLowerCase()],
    }))
  }
}
