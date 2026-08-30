// scripts/generate-effects-v13-e.mjs
//
// Thirteenth wave, part E: Patterns & Textures (4), Masks & Clip Paths
// (4), Charts & Data (6), Timelines & Steps (6).
//
// Shape-budget group: Patterns and Masks sit in "thinning"; Charts and
// Timelines are in the group that is still genuinely short of shapes,
// which is why they get six each rather than four.
//
//   Patterns   — houndstooth, concentric squares, confetti, diamond plate
//   Masks      — shield, puzzle piece, film strip, gear medallion
//   Charts     — quadrant scatter, box plot, sankey, slope, bubble, cohort
//   Timelines  — metro line, estimated checklist, media timeline,
//                process cycle, approval chain, journey path
//
// Pattern tiles follow the 240x140 rounded-tile convention.

export function generateV13E(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Patterns & Textures                                                 */
  /* ------------------------------------------------------------------ */

  /* PT1. Houndstooth */
  {
    const c = cls('v13-pt-houndstooth')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  background-color: #e2e8f0;
  background-image:
    linear-gradient(-45deg, #0f172a 25%, transparent 25%, transparent 75%, #0f172a 75%),
    linear-gradient(-45deg, #0f172a 25%, transparent 25%, transparent 75%, #0f172a 75%),
    linear-gradient(45deg, #0f172a 17%, transparent 17%, transparent 25%, #0f172a 25%, #0f172a 36%, transparent 36%, transparent 64%, #0f172a 64%, #0f172a 75%, transparent 75%, transparent 83%, #0f172a 83%),
    linear-gradient(45deg, #0f172a 17%, transparent 17%, transparent 25%, #0f172a 25%, #0f172a 36%, transparent 36%, transparent 64%, #0f172a 64%, #0f172a 75%, transparent 75%, transparent 83%, #0f172a 83%);
  background-size: 28px 28px;
  background-position: 0 0, 14px 14px, 0 0, 14px 14px;
  box-shadow: 0 0 0 1px rgba(226,232,240,0.25);
}`
    add(mk({
      name: 'Houndstooth Weave',
      category: 'Patterns & Textures',
      description: 'Classic houndstooth check woven from four offset diagonal gradients, slate teeth on a bone-white ground.',
      html, css,
      tags: ['houndstooth', 'check', 'textile', 'monochrome', 'classic'],
    }))
  }

  /* PT2. Concentric squares — op-art rings drawn as spreading shadows */
  {
    const c = cls('v13-pt-concentric')
    const html = `<div class="${c}"><i></i></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #12081c;
  box-shadow: 0 0 0 1px rgba(168,85,247,0.3);
}
.${c} i {
  display: block;
  width: 12px;
  height: 12px;
  background: #f0abfc;
  box-shadow:
    0 0 0 8px #12081c, 0 0 0 16px #c084fc,
    0 0 0 24px #12081c, 0 0 0 32px #a855f7,
    0 0 0 40px #12081c, 0 0 0 48px #9333ea,
    0 0 0 56px #12081c, 0 0 0 64px #7e22ce,
    0 0 0 72px #12081c, 0 0 0 80px #6b21a8,
    0 0 0 88px #12081c, 0 0 0 96px #581c87;
  animation: ${c}-breathe 7s ease-in-out infinite;
}
@keyframes ${c}-breathe {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50%      { transform: rotate(45deg) scale(1.12); }
}`
    add(mk({
      name: 'Concentric Squares',
      category: 'Patterns & Textures',
      description: 'Op-art squares nesting outward in deepening violet, drawn entirely from spreading box shadows and turning as they breathe.',
      html, css,
      tags: ['op-art', 'concentric', 'squares', 'box-shadow', 'violet'],
    }))
  }

  /* PT3. Confetti sprinkle — flecks at mixed angles over a dark ground */
  {
    const c = cls('v13-pt-confetti')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  overflow: hidden;
  background: linear-gradient(160deg, #131a2b, #0b1120);
  box-shadow: inset 0 0 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(148,163,184,0.2);
}
.${c} i {
  position: absolute;
  width: 10px;
  height: 4px;
  border-radius: 2px;
}
.${c} i:nth-child(1)  { left: 6%;  top: 14%; transform: rotate(24deg);   background: #f472b6; }
.${c} i:nth-child(2)  { left: 22%; top: 8%;  transform: rotate(-52deg);  background: #38bdf8; }
.${c} i:nth-child(3)  { left: 38%; top: 22%; transform: rotate(72deg);   background: #fbbf24; }
.${c} i:nth-child(4)  { left: 55%; top: 10%; transform: rotate(-14deg);  background: #34d399; }
.${c} i:nth-child(5)  { left: 71%; top: 18%; transform: rotate(41deg);   background: #c084fc; }
.${c} i:nth-child(6)  { left: 87%; top: 6%;  transform: rotate(-68deg);  background: #fb7185; }
.${c} i:nth-child(7)  { left: 12%; top: 40%; transform: rotate(-33deg);  background: #a3e635; }
.${c} i:nth-child(8)  { left: 30%; top: 50%; transform: rotate(58deg);   background: #38bdf8; }
.${c} i:nth-child(9)  { left: 47%; top: 42%; transform: rotate(-7deg);   background: #f472b6; }
.${c} i:nth-child(10) { left: 63%; top: 54%; transform: rotate(80deg);   background: #fbbf24; }
.${c} i:nth-child(11) { left: 80%; top: 44%; transform: rotate(-45deg);  background: #34d399; }
.${c} i:nth-child(12) { left: 8%;  top: 72%; transform: rotate(63deg);   background: #c084fc; }
.${c} i:nth-child(13) { left: 26%; top: 84%; transform: rotate(-21deg);  background: #fb7185; }
.${c} i:nth-child(14) { left: 45%; top: 76%; transform: rotate(37deg);   background: #38bdf8; }
.${c} i:nth-child(15) { left: 66%; top: 86%; transform: rotate(-74deg);  background: #a3e635; }
.${c} i:nth-child(16) { left: 85%; top: 74%; transform: rotate(16deg);   background: #fbbf24; }`
    add(mk({
      name: 'Confetti Sprinkle',
      category: 'Patterns & Textures',
      description: 'Sixteen coloured paper flecks scattered at unrepeating angles across a dark ground, for a celebratory surface texture.',
      html, css,
      tags: ['confetti', 'sprinkle', 'flecks', 'party', 'scatter'],
    }))
  }

  /* PT4. Diamond plate — metal tread */
  {
    const c = cls('v13-pt-tread')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  background-color: #2b3140;
  background-image:
    linear-gradient(135deg, rgba(255,255,255,0.28) 0 6px, transparent 6px 12px),
    linear-gradient(45deg, rgba(0,0,0,0.4) 0 6px, transparent 6px 12px),
    linear-gradient(135deg, rgba(0,0,0,0.35) 0 6px, transparent 6px 12px),
    linear-gradient(45deg, rgba(255,255,255,0.22) 0 6px, transparent 6px 12px),
    linear-gradient(180deg, #3b4252, #232936);
  background-size: 24px 24px, 24px 24px, 24px 24px, 24px 24px, 100% 100%;
  background-position: 0 0, 0 0, 12px 12px, 12px 12px, 0 0;
  box-shadow: inset 0 0 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(148,163,184,0.3);
}`
    add(mk({
      name: 'Diamond Plate',
      category: 'Patterns & Textures',
      description: 'Brushed metal tread plate with raised diamond studs picked out by paired highlight and shadow gradients.',
      html, css,
      tags: ['metal', 'tread', 'diamond-plate', 'industrial', 'texture'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Masks & Clip Paths                                                  */
  /* ------------------------------------------------------------------ */

  /* MK1. Shield clip */
  {
    const c = cls('v13-mk-shield')
    const html = `<div class="${c}"><span>✓</span></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 96px;
  height: 116px;
  background: linear-gradient(160deg, #34d399, #0f766e 60%, #0b3d38);
  clip-path: polygon(50% 0%, 100% 16%, 100% 60%, 50% 100%, 0% 60%, 0% 16%);
  transition: transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1), filter 0.35s ease;
}
.${c} span {
  font-size: 2.2rem;
  color: #042f2e;
  text-shadow: 0 1px 0 rgba(255,255,255,0.35);
}
.${c}:hover { transform: scale(1.06); filter: drop-shadow(0 10px 20px rgba(16,185,129,0.4)); }`
    add(mk({
      name: 'Shield Clip Tile',
      category: 'Masks & Clip Paths',
      description: 'Gradient panel clipped to a six-point heraldic shield that scales up and casts a coloured drop shadow on hover.',
      html, css,
      tags: ['shield', 'clip-path', 'badge', 'security', 'polygon'],
    }))
  }

  /* MK2. Puzzle piece — a tile with a knob and a socket */
  {
    const c = cls('v13-mk-puzzle')
    const html = `<div class="${c}"><i class="a"></i><i class="b"></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
}
.${c} i {
  display: block;
  height: 74px;
  transition: transform 0.4s cubic-bezier(0.65, 0, 0.35, 1);
}
.${c} .a {
  width: 88px;
  background: linear-gradient(140deg, #60a5fa, #2563eb);
  -webkit-mask:
    linear-gradient(#000, #000) 0 0 / 74px 100% no-repeat,
    radial-gradient(circle 13px at 74px 50%, #000 98%, transparent 100%);
  mask:
    linear-gradient(#000, #000) 0 0 / 74px 100% no-repeat,
    radial-gradient(circle 13px at 74px 50%, #000 98%, transparent 100%);
}
.${c} .b {
  width: 74px;
  margin-left: -14px;
  background: linear-gradient(140deg, #f472b6, #be185d);
  -webkit-mask: radial-gradient(circle 14px at 0 50%, transparent 98%, #000 100%);
  mask: radial-gradient(circle 14px at 0 50%, transparent 98%, #000 100%);
}
.${c}:hover .a { transform: translateX(-10px) rotate(-4deg); }
.${c}:hover .b { transform: translateX(10px) rotate(4deg); }`
    add(mk({
      name: 'Puzzle Piece Tile',
      category: 'Masks & Clip Paths',
      description: 'Two jigsaw halves — one with a knob, one with the matching socket cut out by a radial mask — that pull apart on hover.',
      html, css,
      tags: ['puzzle', 'jigsaw', 'mask', 'interlock', 'radial'],
    }))
  }

  /* MK3. Film strip — sprocket holes punched down both edges */
  {
    const c = cls('v13-mk-filmstrip')
    const html = `<div class="${c}"><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 232px;
  height: 96px;
  padding: 14px 6px;
  background: #14151c;
  -webkit-mask:
    radial-gradient(circle 4px at 50% 0, transparent 96%, #000 100%) 0 0 / 16px 12px repeat-x,
    radial-gradient(circle 4px at 50% 100%, transparent 96%, #000 100%) 0 100% / 16px 12px repeat-x,
    linear-gradient(#000, #000) 0 12px / 100% calc(100% - 24px) no-repeat;
  mask:
    radial-gradient(circle 4px at 50% 0, transparent 96%, #000 100%) 0 0 / 16px 12px repeat-x,
    radial-gradient(circle 4px at 50% 100%, transparent 96%, #000 100%) 0 100% / 16px 12px repeat-x,
    linear-gradient(#000, #000) 0 12px / 100% calc(100% - 24px) no-repeat;
}
.${c} i {
  flex: 1;
  height: 100%;
  border-radius: 2px;
  filter: saturate(0.85);
  transition: filter 0.3s ease, transform 0.3s ease;
}
.${c} i:nth-child(1) { background: linear-gradient(150deg, #fb7185, #7c2d12); }
.${c} i:nth-child(2) { background: linear-gradient(150deg, #38bdf8, #1e3a8a); }
.${c} i:nth-child(3) { background: linear-gradient(150deg, #a3e635, #14532d); }
.${c} i:hover { filter: saturate(1.4) brightness(1.1); transform: scale(1.03); }`
    add(mk({
      name: 'Film Strip Mask',
      category: 'Masks & Clip Paths',
      description: 'Frame strip with sprocket holes punched along both edges by a repeating radial mask, each frame brightening on hover.',
      html, css,
      tags: ['film', 'sprockets', 'mask', 'strip', 'frames'],
    }))
  }

  /* MK4. Gear medallion — a teeth ring masked out behind a solid face */
  {
    const c = cls('v13-mk-medallion')
    const html = `<div class="${c}"><span>RK</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 118px;
  height: 118px;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 200deg, #fbbf24, #f472b6, #818cf8, #34d399, #fbbf24);
  -webkit-mask: repeating-conic-gradient(from 0deg, #000 0 8deg, transparent 8deg 16deg);
  mask: repeating-conic-gradient(from 0deg, #000 0 8deg, transparent 8deg 16deg);
  animation: ${c}-turn 18s linear infinite;
}
.${c} span {
  position: relative;
  display: grid;
  place-items: center;
  width: 86px;
  height: 86px;
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e1b4b;
  background: conic-gradient(from 200deg, #fbbf24, #f472b6, #818cf8, #34d399, #fbbf24);
  border-radius: 50%;
  box-shadow: 0 0 0 3px #0b1020;
}
@keyframes ${c}-turn { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`
    add(mk({
      name: 'Gear Medallion Frame',
      category: 'Masks & Clip Paths',
      description: 'Rainbow disc with a ring of radial teeth masked out of the layer behind it, the teeth turning slowly around a still face.',
      html, css,
      tags: ['medallion', 'teeth', 'conic-mask', 'frame', 'rotate'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Charts & Data                                                       */
  /* ------------------------------------------------------------------ */

  /* CH1. Quadrant scatter */
  {
    const c = cls('v13-ch-quadrant')
    const html = `<div class="${c}"><div class="p"><i style="--x:22%;--y:70%"></i><i style="--x:36%;--y:34%"></i><i class="hi" style="--x:72%;--y:24%"></i><i style="--x:64%;--y:58%"></i><i style="--x:82%;--y:44%"></i><i style="--x:15%;--y:28%"></i><i style="--x:48%;--y:80%"></i><i class="hi" style="--x:88%;--y:16%"></i></div><div class="ax"><span>reach</span><span>impact →</span></div></div>`
    const css = `.${c} {
  width: 220px;
  font-size: 0.62rem;
  color: #64748b;
}
.${c} .p {
  position: relative;
  height: 118px;
  border: 1px solid #253049;
  border-radius: 0.4rem;
  background:
    linear-gradient(90deg, transparent 49.6%, rgba(148,163,184,0.35) 49.6% 50.4%, transparent 50.4%),
    linear-gradient(180deg, transparent 49.6%, rgba(148,163,184,0.35) 49.6% 50.4%, transparent 50.4%),
    radial-gradient(80% 80% at 85% 15%, rgba(52,211,153,0.12), transparent 70%),
    #0d1424;
}
.${c} i {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: 9px;
  height: 9px;
  margin: -4.5px 0 0 -4.5px;
  border-radius: 50%;
  background: #60a5fa;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.${c} .hi { background: #34d399; }
.${c} i:hover { transform: scale(1.7); box-shadow: 0 0 0 3px rgba(96,165,250,0.25); }
.${c} .ax { display: flex; justify-content: space-between; margin-top: 0.3rem; }`
    add(mk({
      name: 'Quadrant Scatter',
      category: 'Charts & Data',
      description: 'Two-by-two scatter plot with crosshair axes and a tinted winning quadrant, points swelling under the cursor.',
      html, css,
      tags: ['scatter', 'quadrant', 'matrix', 'plot', 'prioritisation'],
    }))
  }

  /* CH2. Box plot rows */
  {
    const c = cls('v13-ch-boxplot')
    const html = `<div class="${c}"><div><span>p50</span><em style="--a:12%;--b:34%;--d:58%;--e:78%;--m:46%"></em></div><div><span>p75</span><em style="--a:20%;--b:44%;--d:66%;--e:88%;--m:58%"></em></div><div><span>p90</span><em style="--a:30%;--b:52%;--d:74%;--e:94%;--m:62%"></em></div></div>`
    const css = `.${c} {
  width: 226px;
  display: grid;
  gap: 0.75rem;
  font-size: 0.65rem;
  color: #94a3b8;
}
.${c} > div { display: grid; grid-template-columns: 26px 1fr; align-items: center; gap: 0.5rem; }
.${c} em {
  position: relative;
  display: block;
  height: 18px;
}
.${c} em::before {
  content: '';
  position: absolute;
  top: 50%;
  left: var(--a);
  right: calc(100% - var(--e));
  height: 1px;
  background: #475569;
}
.${c} em::after {
  content: '';
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: var(--b);
  right: calc(100% - var(--d));
  background: rgba(56,189,248,0.25);
  border: 1px solid #38bdf8;
  border-radius: 2px;
  transition: background 0.25s ease;
}
.${c} > div:hover em::after { background: rgba(56,189,248,0.45); }
.${c} span { text-align: right; color: #64748b; }`
    add(mk({
      name: 'Box Plot Rows',
      category: 'Charts & Data',
      description: 'Horizontal box-and-whisker rows showing the interquartile box against its full range, one row per percentile band.',
      html, css,
      tags: ['box-plot', 'whisker', 'distribution', 'percentile', 'statistics'],
    }))
  }

  /* CH3. Sankey flow */
  {
    const c = cls('v13-ch-sankey')
    const html = `<div class="${c}"><div class="l"><i class="a"></i><i class="b"></i></div><div class="f"><span class="f1"></span><span class="f2"></span><span class="f3"></span></div><div class="r"><i class="d"></i><i class="e"></i><i class="g"></i></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: stretch;
  width: 224px;
  height: 118px;
}
.${c} .l, .${c} .r { display: flex; flex-direction: column; gap: 6px; width: 12px; }
.${c} .l i, .${c} .r i { border-radius: 2px; }
.${c} .a { flex: 6; background: #38bdf8; }
.${c} .b { flex: 4; background: #a78bfa; }
.${c} .d { flex: 4; background: #34d399; }
.${c} .e { flex: 3; background: #fbbf24; }
.${c} .g { flex: 3; background: #f472b6; }
.${c} .f { position: relative; flex: 1; }
.${c} .f span {
  position: absolute;
  left: 0;
  right: 0;
  transition: opacity 0.25s ease;
}
.${c} .f1 {
  top: 4%;
  height: 34%;
  background: linear-gradient(90deg, rgba(56,189,248,0.55), rgba(52,211,153,0.55));
  clip-path: polygon(0 0, 100% 18%, 100% 100%, 0 100%);
}
.${c} .f2 {
  top: 38%;
  height: 26%;
  background: linear-gradient(90deg, rgba(56,189,248,0.45), rgba(251,191,36,0.5));
  clip-path: polygon(0 0, 100% 6%, 100% 96%, 0 100%);
}
.${c} .f3 {
  top: 62%;
  height: 34%;
  background: linear-gradient(90deg, rgba(167,139,250,0.5), rgba(244,114,182,0.5));
  clip-path: polygon(0 4%, 100% 0, 100% 92%, 0 100%);
}
.${c}:hover .f span { opacity: 0.5; }
.${c} .f span:hover { opacity: 1; }`
    add(mk({
      name: 'Flow Sankey',
      category: 'Charts & Data',
      description: 'Two source bands feeding three destinations through tapered gradient ribbons, the others dimming as one flow is hovered.',
      html, css,
      tags: ['sankey', 'flow', 'ribbon', 'allocation', 'clip-path'],
    }))
  }

  /* CH4. Slope chart */
  {
    const c = cls('v13-ch-slope')
    const html = `<div class="${c}"><div class="p"><i class="a"></i><i class="b"></i><i class="d"></i></div><div class="ax"><span>2024</span><span>2025</span></div></div>`
    const css = `.${c} {
  width: 214px;
  font-size: 0.63rem;
  color: #64748b;
}
.${c} .p {
  position: relative;
  height: 112px;
  padding: 0 2px;
  border-left: 1px solid #253049;
  border-right: 1px solid #253049;
}
.${c} i {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 2px;
  transform-origin: left center;
  transition: filter 0.25s ease;
}
.${c} i::before,
.${c} i::after {
  content: '';
  position: absolute;
  top: -3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: inherit;
}
.${c} i::before { left: -4px; }
.${c} i::after { right: -4px; }
.${c} .a { top: 76px;  background: #34d399; transform: rotate(-16deg); }
.${c} .b { top: 46px;  background: #38bdf8; transform: rotate(-6deg); }
.${c} .d { top: 22px;  background: #f87171; transform: rotate(11deg); }
.${c} .p:hover i { filter: brightness(0.6); }
.${c} .p i:hover { filter: brightness(1.25); }
.${c} .ax { display: flex; justify-content: space-between; margin-top: 0.35rem; }`
    add(mk({
      name: 'Slope Chart',
      category: 'Charts & Data',
      description: 'Before-and-after slope lines with a dot at each end, showing which series rose and which fell between two periods.',
      html, css,
      tags: ['slope', 'comparison', 'two-point', 'trend', 'lines'],
    }))
  }

  /* CH5. Bubble chart */
  {
    const c = cls('v13-ch-bubble')
    const html = `<div class="${c}"><i style="--x:18%;--y:62%;--s:26px" class="a"></i><i style="--x:42%;--y:38%;--s:40px" class="b"></i><i style="--x:68%;--y:66%;--s:32px" class="d"></i><i style="--x:83%;--y:32%;--s:20px" class="e"></i><i style="--x:30%;--y:80%;--s:16px" class="f"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  height: 124px;
  border-radius: 0.5rem;
  background:
    repeating-linear-gradient(0deg, rgba(148,163,184,0.09) 0 1px, transparent 1px 24px),
    repeating-linear-gradient(90deg, rgba(148,163,184,0.09) 0 1px, transparent 1px 28px),
    #0d1424;
  box-shadow: 0 0 0 1px #253049;
}
.${c} i {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: var(--s);
  height: var(--s);
  margin: calc(var(--s) / -2) 0 0 calc(var(--s) / -2);
  border-radius: 50%;
  mix-blend-mode: screen;
  transition: transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} .a { background: rgba(56,189,248,0.6);  border: 1px solid #38bdf8; }
.${c} .b { background: rgba(167,139,250,0.55); border: 1px solid #a78bfa; }
.${c} .d { background: rgba(52,211,153,0.55);  border: 1px solid #34d399; }
.${c} .e { background: rgba(251,191,36,0.55);  border: 1px solid #fbbf24; }
.${c} .f { background: rgba(244,114,182,0.55); border: 1px solid #f472b6; }
.${c} i:hover { transform: scale(1.18); }`
    add(mk({
      name: 'Bubble Chart',
      category: 'Charts & Data',
      description: 'Scatter of translucent bubbles sized by a third measure, screen-blended over a faint plot grid so overlaps read as brighter.',
      html, css,
      tags: ['bubble', 'scatter', 'size', 'blend', 'three-measure'],
    }))
  }

  /* CH6. Cohort grid */
  {
    const c = cls('v13-ch-cohort')
    const html = `<div class="${c}"><div class="hd"><span></span><b>W0</b><b>W1</b><b>W2</b><b>W3</b></div><div class="rw"><span>Jan</span><i class="l5"></i><i class="l4"></i><i class="l3"></i><i class="l2"></i></div><div class="rw"><span>Feb</span><i class="l5"></i><i class="l4"></i><i class="l2"></i><i class="l1"></i></div><div class="rw"><span>Mar</span><i class="l5"></i><i class="l3"></i><i class="l2"></i><i class="l0"></i></div><div class="rw"><span>Apr</span><i class="l5"></i><i class="l3"></i><i class="l1"></i><i class="l0"></i></div></div>`
    const css = `.${c} {
  display: grid;
  gap: 3px;
  width: 216px;
  font-size: 0.6rem;
  color: #64748b;
}
.${c} .hd, .${c} .rw {
  display: grid;
  grid-template-columns: 26px repeat(4, 1fr);
  gap: 3px;
  align-items: center;
}
.${c} b { text-align: center; font-weight: 500; color: #64748b; }
.${c} .rw span { color: #94a3b8; }
.${c} i {
  display: block;
  height: 20px;
  border-radius: 3px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.${c} .l5 { background: #0ea5e9; }
.${c} .l4 { background: rgba(14,165,233,0.72); }
.${c} .l3 { background: rgba(14,165,233,0.52); }
.${c} .l2 { background: rgba(14,165,233,0.34); }
.${c} .l1 { background: rgba(14,165,233,0.18); }
.${c} .l0 { background: rgba(148,163,184,0.1); }
.${c} i:hover { transform: scale(1.1); box-shadow: 0 0 0 1px #7dd3fc; }`
    add(mk({
      name: 'Cohort Grid',
      category: 'Charts & Data',
      description: 'Retention cohort table where each signup month is a row and colour intensity falls off week by week across it.',
      html, css,
      tags: ['cohort', 'retention', 'heatmap', 'table', 'weeks'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Timelines & Steps                                                   */
  /* ------------------------------------------------------------------ */

  /* TL1. Metro line — interchange stops along a coloured route */
  {
    const c = cls('v13-tl-metro')
    const html = `<div class="${c}"><div class="ln"></div><div class="st done"><i></i><b>Draft</b></div><div class="st done ix"><i></i><b>Review</b></div><div class="st now"><i></i><b>Build</b></div><div class="st"><i></i><b>Ship</b></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  justify-content: space-between;
  width: 240px;
  padding: 0 4px;
}
.${c} .ln {
  position: absolute;
  left: 14px;
  right: 14px;
  top: 9px;
  height: 5px;
  border-radius: 3px;
  background: linear-gradient(90deg, #38bdf8 0 62%, rgba(148,163,184,0.25) 62% 100%);
}
.${c} .st {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0.4rem;
  width: 52px;
}
.${c} i {
  width: 13px;
  height: 13px;
  margin-top: 5px;
  border-radius: 50%;
  background: #0b1020;
  border: 3px solid #475569;
  transition: transform 0.25s ease, border-color 0.25s ease;
}
.${c} .done i { border-color: #38bdf8; }
.${c} .ix i { width: 17px; height: 17px; margin-top: 3px; border-width: 4px; }
.${c} .now i {
  border-color: #38bdf8;
  background: #38bdf8;
  box-shadow: 0 0 0 4px rgba(56,189,248,0.2);
}
.${c} b { font-size: 0.63rem; font-weight: 500; color: #64748b; }
.${c} .done b, .${c} .now b { color: #cbd5e1; }
.${c} .st:hover i { transform: scale(1.2); }`
    add(mk({
      name: 'Metro Line Steps',
      category: 'Timelines & Steps',
      description: 'Transit-map progress line where stops are ring stations, interchanges are drawn larger and the live stop carries a halo.',
      html, css,
      tags: ['metro', 'transit', 'stops', 'progress', 'route'],
    }))
  }

  /* TL2. Estimated checklist — steps carrying their own time budget */
  {
    const c = cls('v13-tl-estimate')
    const html = `<div class="${c}"><div class="s done"><i>✓</i><b>Clone the repo</b><em>1 min</em></div><div class="s done"><i>✓</i><b>Install deps</b><em>3 min</em></div><div class="s now"><i></i><b>Run the seed script</b><em>~4 min</em></div><div class="s"><i></i><b>Open the dashboard</b><em>1 min</em></div></div>`
    const css = `.${c} {
  width: 240px;
  display: grid;
  gap: 0.1rem;
  font-size: 0.72rem;
  color: #cbd5e1;
}
.${c} .s {
  position: relative;
  display: grid;
  grid-template-columns: 20px 1fr auto;
  align-items: center;
  gap: 0.55rem;
  padding: 0.4rem 0.5rem;
  border-radius: 0.4rem;
  transition: background 0.2s ease;
}
.${c} .s:hover { background: #16203a; }
.${c} .s::after {
  content: '';
  position: absolute;
  left: 19px;
  top: 100%;
  width: 2px;
  height: 0.1rem;
  background: #29344d;
}
.${c} .s:last-child::after { display: none; }
.${c} i {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  font-size: 0.65rem;
  font-style: normal;
  border-radius: 50%;
  border: 2px solid #334155;
  color: #052e16;
}
.${c} .done i { background: #34d399; border-color: #34d399; }
.${c} .now i {
  border-color: #38bdf8;
  border-right-color: transparent;
  animation: ${c}-spin 1.1s linear infinite;
}
.${c} b { font-weight: 500; }
.${c} .done b { color: #64748b; text-decoration: line-through; }
.${c} .now b { color: #f1f5f9; }
.${c} em {
  font-style: normal;
  font-size: 0.63rem;
  color: #64748b;
  background: #16203a;
  border-radius: 999px;
  padding: 0.1rem 0.4rem;
}
@keyframes ${c}-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`
    add(mk({
      name: 'Estimated Checklist',
      category: 'Timelines & Steps',
      description: 'Setup checklist where each step carries its own time estimate and the running step spins a partial ring instead of a tick.',
      html, css,
      tags: ['checklist', 'estimate', 'setup', 'spinner', 'onboarding'],
    }))
  }

  /* TL3. Media timeline — thumbnails alternating down a rail */
  {
    const c = cls('v13-tl-media')
    const html = `<div class="${c}"><div class="e"><i class="a"></i><div><b>Kickoff</b><small>Mar 2</small></div></div><div class="e"><i class="b"></i><div><b>Alpha build</b><small>Apr 18</small></div></div><div class="e"><i class="d"></i><div><b>Launch</b><small>Jun 9</small></div></div></div>`
    const css = `.${c} {
  position: relative;
  width: 224px;
  display: grid;
  gap: 0.55rem;
  padding-left: 0.9rem;
}
.${c}::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: linear-gradient(#38bdf8, #a78bfa);
}
.${c} .e {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.${c} .e::before {
  content: '';
  position: absolute;
  left: -0.9rem;
  top: 50%;
  width: 8px;
  height: 8px;
  margin-top: -4px;
  border-radius: 50%;
  background: #0b1020;
  border: 2px solid #7dd3fc;
}
.${c} i {
  flex: none;
  width: 46px;
  height: 34px;
  border-radius: 0.35rem;
  transition: transform 0.28s ease, box-shadow 0.28s ease;
}
.${c} .a { background: linear-gradient(140deg, #fbbf24, #b45309); }
.${c} .b { background: linear-gradient(140deg, #38bdf8, #1d4ed8); }
.${c} .d { background: linear-gradient(140deg, #f472b6, #7e22ce); }
.${c} b { display: block; font-size: 0.76rem; color: #e2e8f0; }
.${c} small { font-size: 0.63rem; color: #64748b; }
.${c} .e:hover i { transform: scale(1.1) rotate(-2deg); box-shadow: 0 8px 18px rgba(0,0,0,0.5); }`
    add(mk({
      name: 'Media Timeline',
      category: 'Timelines & Steps',
      description: 'Milestone rail where every entry carries a thumbnail beside its label, the image tilting and lifting as the row is hovered.',
      html, css,
      tags: ['timeline', 'media', 'thumbnails', 'milestones', 'rail'],
    }))
  }

  /* TL4. Process cycle — four stages arranged around a ring */
  {
    const c = cls('v13-tl-cycle')
    const html = `<div class="${c}"><b>Loop</b><span class="n">Plan</span><span class="e">Build</span><span class="s">Ship</span><span class="w">Learn</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 128px;
  height: 128px;
  border-radius: 50%;
  border: 2px dashed #29344d;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #22d3ee;
  border-right-color: #6366f1;
  animation: ${c}-orbit 5s linear infinite;
}
.${c} b {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #64748b;
}
.${c} span {
  position: absolute;
  padding: 0.22rem 0.6rem;
  font-size: 0.68rem;
  color: #e2e8f0;
  background: #16203a;
  border: 1px solid #29344d;
  border-radius: 999px;
  transition: border-color 0.2s ease, color 0.2s ease, transform 0.25s ease;
}
.${c} .n { top: -12px; left: 50%; transform: translateX(-50%); }
.${c} .s { bottom: -12px; left: 50%; transform: translateX(-50%); }
.${c} .e { right: -22px; top: 50%; transform: translateY(-50%); }
.${c} .w { left: -24px; top: 50%; transform: translateY(-50%); }
.${c} .n:hover, .${c} .s:hover { transform: translateX(-50%) scale(1.08); }
.${c} .e:hover, .${c} .w:hover { transform: translateY(-50%) scale(1.08); }
.${c} span:hover { border-color: #22d3ee; color: #a5f3fc; }
@keyframes ${c}-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`
    add(mk({
      name: 'Process Cycle Ring',
      category: 'Timelines & Steps',
      description: 'Four stage pills pinned around a dashed circle with a coloured arc orbiting it, for a process that never really ends.',
      html, css,
      tags: ['cycle', 'ring', 'process', 'loop', 'orbit'],
    }))
  }

  /* TL5. Approval chain — avatars strung along a signature line */
  {
    const c = cls('v13-tl-approval')
    const html = `<div class="${c}"><div class="s ok"><span>AL</span><b>Signed</b></div><div class="s ok"><span>MT</span><b>Signed</b></div><div class="s wait"><span>JO</span><b>Waiting</b></div><div class="s"><span>RK</span><b>Queued</b></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  justify-content: space-between;
  width: 236px;
  padding: 0 2px;
}
.${c}::before {
  content: '';
  position: absolute;
  left: 20px;
  right: 20px;
  top: 17px;
  height: 2px;
  background: linear-gradient(90deg, #34d399 0 42%, #fbbf24 42% 62%, rgba(148,163,184,0.25) 62% 100%);
}
.${c} .s {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0.3rem;
  width: 52px;
}
.${c} span {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  font-size: 0.65rem;
  font-weight: 700;
  color: #cbd5e1;
  background: #1e293b;
  border: 2px solid #475569;
  border-radius: 50%;
  transition: transform 0.25s ease;
}
.${c} .ok span { border-color: #34d399; color: #6ee7b7; }
.${c} .wait span {
  border-color: #fbbf24;
  color: #fcd34d;
  animation: ${c}-wait 1.8s ease-in-out infinite;
}
.${c} b { font-size: 0.6rem; font-weight: 500; color: #64748b; }
.${c} .ok b { color: #34d399; }
.${c} .wait b { color: #fbbf24; }
.${c} .s:hover span { transform: translateY(-3px); }
@keyframes ${c}-wait {
  0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.5); }
  60%      { box-shadow: 0 0 0 6px rgba(251,191,36,0); }
}`
    add(mk({
      name: 'Approval Chain',
      category: 'Timelines & Steps',
      description: 'Sign-off chain of avatars along a line that changes colour as it passes each approver, the pending one pulsing amber.',
      html, css,
      tags: ['approval', 'sign-off', 'chain', 'avatars', 'workflow'],
    }))
  }

  /* TL6. Journey path — steps threaded along an S-shaped route */
  {
    const c = cls('v13-tl-journey')
    const html = `<div class="${c}"><div class="r r1"></div><div class="r r2"></div><div class="p p1"><i>1</i><b>Discover</b></div><div class="p p2"><i>2</i><b>Trial</b></div><div class="p p3"><i>3</i><b>Adopt</b></div><div class="p p4"><i>4</i><b>Advocate</b></div></div>`
    const css = `.${c} {
  position: relative;
  width: 236px;
  height: 130px;
}
.${c} .r {
  position: absolute;
  left: 26px;
  right: 26px;
  height: 44px;
  border: 2px dashed #334155;
}
.${c} .r1 { top: 20px; border-bottom: none; border-radius: 24px 24px 0 0; border-left: none; }
.${c} .r2 { top: 62px; border-top: none; border-radius: 0 0 24px 24px; border-right: none; }
.${c} .p {
  position: absolute;
  display: grid;
  justify-items: center;
  gap: 0.2rem;
}
.${c} .p1 { left: 6px;  top: 6px; }
.${c} .p2 { right: 6px; top: 6px; }
.${c} .p3 { right: 6px; bottom: 6px; }
.${c} .p4 { left: 6px;  bottom: 6px; }
.${c} i {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  font-style: normal;
  font-size: 0.7rem;
  font-weight: 700;
  color: #0b1020;
  background: linear-gradient(140deg, #a5f3fc, #22d3ee);
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(34,211,238,0.14);
  transition: transform 0.25s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.${c} b { font-size: 0.62rem; color: #94a3b8; }
.${c} .p:hover i { transform: scale(1.15); }
.${c} .p:hover b { color: #e2e8f0; }`
    add(mk({
      name: 'Journey Path Steps',
      category: 'Timelines & Steps',
      description: 'Four numbered stages threaded around a dashed S-shaped route, so the journey doubles back instead of running in a straight line.',
      html, css,
      tags: ['journey', 'path', 'serpentine', 'stages', 'lifecycle'],
    }))
  }
}
