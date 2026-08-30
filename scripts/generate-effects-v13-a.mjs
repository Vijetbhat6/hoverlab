// scripts/generate-effects-v13-a.mjs
//
// Thirteenth wave, part A: Buttons, Loaders, Cards, Text.
// Four designs per category, one entry each — no colorway or size
// stamping (the Customize panel re-tokens anything).
//
// Shape-budget group for these four: "thinning" — real shapes remain,
// but each one takes a longer search than the wave before. Picked so
// no design repeats a mechanic already in the thinned catalog:
//
//   Buttons — sliding door, pixel dissolve, soft emboss, tape label
//   Loaders — domino fall, snake grid, tick spinner, stacking blocks
//   Cards   — dog-ear, receipt, expanding detail, mesh header
//   Text    — wave letters, ransom note, dot matrix, sparkle
//
// Assembly constraints: roots visible at rest, no position:absolute on
// a root, infinite keyframes rest sensibly at their 100% stop (the
// reduced-motion guard freezes them there), everything fits a ~300x180
// dark preview.

export function generateV13A(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Buttons                                                             */
  /* ------------------------------------------------------------------ */

  /* B1. Sliding door — the label splits down the middle and slides apart
        to show a second label underneath */
  {
    const c = cls('v13-btn-door')
    const html = `<button class="${c}"><span class="l">Sub</span><span class="r">scribe</span><em>Let's go →</em></button>`
    const css = `.${c} {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 11rem;
  padding: 0.7rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f8fafc;
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 0.6rem;
  cursor: pointer;
  overflow: hidden;
}
.${c} .l,
.${c} .r {
  position: relative;
  z-index: 2;
  background: #1e293b;
  padding: 0.7rem 0;
  transition: transform 0.4s cubic-bezier(0.65, 0, 0.35, 1);
}
.${c} .l { transform: translateX(0); padding-left: 1.2rem; margin-left: -1.2rem; }
.${c} .r { transform: translateX(0); padding-right: 1.2rem; margin-right: -1.2rem; }
.${c} em {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  font-weight: 600;
  color: #34d399;
  opacity: 0;
  transform: scale(0.9);
  transition: opacity 0.3s ease 0.1s, transform 0.4s ease 0.05s;
}
.${c}:hover .l { transform: translateX(-110%); }
.${c}:hover .r { transform: translateX(110%); }
.${c}:hover em { opacity: 1; transform: scale(1); }
.${c}:hover { border-color: #34d399; }`
    add(mk({
      name: 'Sliding Door Button',
      category: 'Buttons',
      description: 'Button whose label splits at the centre and slides out to both sides like a pair of doors, revealing a second call to action behind it.',
      html, css,
      tags: ['split', 'doors', 'slide', 'label-swap', 'reveal'],
    }))
  }

  /* B2. Pixel dissolve — the fill arrives as a coarse dither grid that
        tightens into a solid block */
  {
    const c = cls('v13-btn-pixel')
    const html = `<button class="${c}"><span>Materialise</span></button>`
    const css = `.${c} {
  position: relative;
  padding: 0.7rem 1.7rem;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #a5b4fc;
  background: #14162b;
  border: 2px solid #4f46e5;
  border-radius: 0.35rem;
  cursor: pointer;
  overflow: hidden;
}
.${c} span { position: relative; z-index: 1; transition: color 0.35s ease 0.1s; }
.${c}::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(#4f46e5 55%, transparent 56%);
  background-size: 14px 14px;
  background-position: 0 0;
  opacity: 0;
  transform: scale(1.4);
  transition: opacity 0.25s ease, background-size 0.45s steps(6), transform 0.45s ease;
}
.${c}:hover::before {
  opacity: 1;
  background-size: 3px 3px;
  transform: scale(1);
}
.${c}:hover span { color: #eef2ff; }
.${c}:active { transform: translateY(1px); }`
    add(mk({
      name: 'Pixel Dissolve Button',
      category: 'Buttons',
      description: 'Outline button whose fill materialises as a coarse dot grid that steps down to a solid block, like a low-resolution image resolving.',
      html, css,
      tags: ['pixel', 'dither', 'dissolve', 'steps', 'retro'],
    }))
  }

  /* B3. Soft emboss — neumorphic raise that presses into the surface */
  {
    const c = cls('v13-btn-emboss')
    const html = `<button class="${c}">Press me</button>`
    const css = `.${c} {
  padding: 0.8rem 1.9rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #cbd5e1;
  background: #262b3a;
  border: none;
  border-radius: 0.9rem;
  cursor: pointer;
  box-shadow:
    -5px -5px 12px rgba(255,255,255,0.06),
    6px 6px 14px rgba(0,0,0,0.55);
  transition: box-shadow 0.25s ease, color 0.25s ease, transform 0.15s ease;
}
.${c}:hover {
  color: #f1f5f9;
  box-shadow:
    -7px -7px 16px rgba(255,255,255,0.08),
    8px 8px 20px rgba(0,0,0,0.6);
}
.${c}:active {
  transform: translateY(1px);
  color: #94a3b8;
  box-shadow:
    inset -4px -4px 10px rgba(255,255,255,0.05),
    inset 5px 5px 12px rgba(0,0,0,0.6);
}`
    add(mk({
      name: 'Soft Emboss Button',
      category: 'Buttons',
      description: 'Neumorphic button moulded out of the surface by paired light and dark shadows, which invert so it presses inward when held.',
      html, css,
      tags: ['neumorphic', 'emboss', 'soft-ui', 'shadow', 'press'],
    }))
  }

  /* B4. Tape label — masking tape stuck on at an angle, straightens on hover */
  {
    const c = cls('v13-btn-tape')
    const html = `<button class="${c}"><span>Stick it</span></button>`
    const css = `.${c} {
  padding: 0.75rem 2.4rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #422006;
  background:
    repeating-linear-gradient(115deg, rgba(255,255,255,0.24) 0 5px, rgba(255,255,255,0) 5px 13px),
    linear-gradient(180deg, #fde68a, #fcd34d);
  border: none;
  cursor: pointer;
  transform: rotate(-2.5deg);
  filter: drop-shadow(0 5px 12px rgba(0,0,0,0.5));
  clip-path: polygon(
    6px 0%, 100% 0%, calc(100% - 5px) 12%, 100% 25%,
    calc(100% - 6px) 38%, 100% 52%, calc(100% - 4px) 66%,
    100% 80%, calc(100% - 6px) 100%, 5px 100%, 0 86%,
    6px 72%, 1px 58%, 5px 44%, 0 30%, 6px 16%
  );
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease;
}
.${c} span { display: block; }
.${c}:hover {
  transform: rotate(0deg) scale(1.04);
  filter: drop-shadow(0 9px 18px rgba(0,0,0,0.55));
}
.${c}:active { transform: rotate(-1deg) scale(0.99); }`
    add(mk({
      name: 'Tape Label Button',
      category: 'Buttons',
      description: 'Strip of masking tape stuck on askew, its ends torn into a ragged clip-path and its surface crossed by a woven sheen, springing straight when hovered.',
      html, css,
      tags: ['tape', 'sticker', 'skew', 'torn', 'clip-path'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Loaders                                                             */
  /* ------------------------------------------------------------------ */

  /* L1. Domino fall — upright bars tip into each other along the row */
  {
    const c = cls('v13-load-domino')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: flex-end;
  gap: 9px;
  height: 46px;
  padding-bottom: 3px;
  border-bottom: 2px solid rgba(148,163,184,0.35);
}
.${c} i {
  display: block;
  width: 7px;
  height: 34px;
  border-radius: 2px;
  background: linear-gradient(180deg, #38bdf8, #0284c7);
  transform-origin: bottom left;
  animation: ${c}-tip 1.6s ease-in-out infinite;
}
.${c} i:nth-child(2) { animation-delay: 0.12s; }
.${c} i:nth-child(3) { animation-delay: 0.24s; }
.${c} i:nth-child(4) { animation-delay: 0.36s; }
.${c} i:nth-child(5) { animation-delay: 0.48s; }
@keyframes ${c}-tip {
  0%, 8%   { transform: rotate(0deg); }
  30%, 62% { transform: rotate(62deg); }
  84%, 100% { transform: rotate(0deg); }
}`
    add(mk({
      name: 'Domino Fall Loader',
      category: 'Loaders',
      description: 'Row of upright bars that tip over one after another along a floor line, then stand back up to run again.',
      html, css,
      tags: ['domino', 'tip', 'sequence', 'bars', 'loop'],
    }))
  }

  /* L2. Snake grid — a lit cell runs the perimeter of a 3x3 grid */
  {
    const c = cls('v13-load-snake')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><b></b><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: grid;
  grid-template-columns: repeat(3, 14px);
  grid-auto-rows: 14px;
  gap: 5px;
}
.${c} i,
.${c} b {
  display: block;
  border-radius: 3px;
  background: rgba(45,212,191,0.16);
}
.${c} b { background: rgba(45,212,191,0.05); }
.${c} i { animation: ${c}-lit 1.6s linear infinite; }
.${c} i:nth-child(1) { animation-delay: 0s; }
.${c} i:nth-child(2) { animation-delay: 0.2s; }
.${c} i:nth-child(3) { animation-delay: 0.4s; }
.${c} i:nth-child(6) { animation-delay: 0.6s; }
.${c} i:nth-child(9) { animation-delay: 0.8s; }
.${c} i:nth-child(8) { animation-delay: 1s; }
.${c} i:nth-child(7) { animation-delay: 1.2s; }
.${c} i:nth-child(4) { animation-delay: 1.4s; }
@keyframes ${c}-lit {
  0%, 24% { background: #2dd4bf; box-shadow: 0 0 10px rgba(45,212,191,0.7); }
  40%, 100% { background: rgba(45,212,191,0.16); box-shadow: none; }
}`
    add(mk({
      name: 'Snake Grid Loader',
      category: 'Loaders',
      description: 'Three-by-three grid of tiles where a lit cell travels the outer ring, leaving a short glowing tail behind it.',
      html, css,
      tags: ['grid', 'snake', 'perimeter', 'cells', 'chase'],
    }))
  }

  /* L3. Tick spinner — twelve tapered ticks fading around a circle */
  {
    const c = cls('v13-load-tick')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 46px;
  height: 46px;
}
.${c} i {
  position: absolute;
  top: 2px;
  left: 50%;
  width: 3px;
  height: 11px;
  margin-left: -1.5px;
  border-radius: 2px;
  background: #e2e8f0;
  transform-origin: 50% 21px;
  opacity: 0.15;
  animation: ${c}-fade 1.08s linear infinite;
}
.${c} i:nth-child(1)  { transform: rotate(0deg);   animation-delay: -1.08s; }
.${c} i:nth-child(2)  { transform: rotate(30deg);  animation-delay: -0.99s; }
.${c} i:nth-child(3)  { transform: rotate(60deg);  animation-delay: -0.90s; }
.${c} i:nth-child(4)  { transform: rotate(90deg);  animation-delay: -0.81s; }
.${c} i:nth-child(5)  { transform: rotate(120deg); animation-delay: -0.72s; }
.${c} i:nth-child(6)  { transform: rotate(150deg); animation-delay: -0.63s; }
.${c} i:nth-child(7)  { transform: rotate(180deg); animation-delay: -0.54s; }
.${c} i:nth-child(8)  { transform: rotate(210deg); animation-delay: -0.45s; }
.${c} i:nth-child(9)  { transform: rotate(240deg); animation-delay: -0.36s; }
.${c} i:nth-child(10) { transform: rotate(270deg); animation-delay: -0.27s; }
.${c} i:nth-child(11) { transform: rotate(300deg); animation-delay: -0.18s; }
.${c} i:nth-child(12) { transform: rotate(330deg); animation-delay: -0.09s; }
@keyframes ${c}-fade {
  0%   { opacity: 1; }
  100% { opacity: 0.15; }
}`
    add(mk({
      name: 'Tick Spinner Loader',
      category: 'Loaders',
      description: 'Twelve radial ticks around a circle, each fading out in turn so a bright head appears to sweep the dial.',
      html, css,
      tags: ['spinner', 'ticks', 'radial', 'fade', 'system'],
    }))
  }

  /* L4. Stacking blocks — blocks drop in to build a tower, then clear
        it again. Each block gets its own keyframes rather than a shared
        set plus animation-delay: with delays the four cycles wrap at
        different moments and the tower is never whole, which reads as a
        stack with holes in it. One timeline, four scripts, no gaps. */
  {
    const c = cls('v13-load-stack')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 40px;
  height: 56px;
}
.${c} i {
  position: absolute;
  left: 0;
  display: block;
  width: 40px;
  height: 11px;
  border-radius: 2px;
  opacity: 0;
  animation-duration: 2.2s;
  animation-timing-function: cubic-bezier(0.5, 0, 0.75, 0);
  animation-iteration-count: infinite;
}
.${c} i:nth-child(1) { bottom: 0;    background: #f59e0b; animation-name: ${c}-a; }
.${c} i:nth-child(2) { bottom: 14px; background: #fbbf24; animation-name: ${c}-b; }
.${c} i:nth-child(3) { bottom: 28px; background: #fcd34d; animation-name: ${c}-c; }
.${c} i:nth-child(4) { bottom: 42px; background: #fde68a; animation-name: ${c}-d; }
@keyframes ${c}-a {
  0%       { opacity: 0; transform: translateY(-52px); }
  12%      { opacity: 1; transform: translateY(0) scaleY(0.72); }
  16%, 84% { opacity: 1; transform: translateY(0) scaleY(1); }
  92%,100% { opacity: 0; transform: translateY(0) scaleY(1); }
}
@keyframes ${c}-b {
  0%, 8%   { opacity: 0; transform: translateY(-52px); }
  20%      { opacity: 1; transform: translateY(0) scaleY(0.72); }
  24%, 86% { opacity: 1; transform: translateY(0) scaleY(1); }
  94%,100% { opacity: 0; transform: translateY(0) scaleY(1); }
}
@keyframes ${c}-c {
  0%, 16%  { opacity: 0; transform: translateY(-52px); }
  28%      { opacity: 1; transform: translateY(0) scaleY(0.72); }
  32%, 88% { opacity: 1; transform: translateY(0) scaleY(1); }
  96%,100% { opacity: 0; transform: translateY(0) scaleY(1); }
}
@keyframes ${c}-d {
  0%, 24%  { opacity: 0; transform: translateY(-52px); }
  36%      { opacity: 1; transform: translateY(0) scaleY(0.72); }
  40%, 90% { opacity: 1; transform: translateY(0) scaleY(1); }
  98%,100% { opacity: 0; transform: translateY(0) scaleY(1); }
}`
    add(mk({
      name: 'Stacking Blocks Loader',
      category: 'Loaders',
      description: 'Amber blocks fall one by one and squash on landing to build a small tower, which holds a beat and then clears to start again.',
      html, css,
      tags: ['blocks', 'stack', 'drop', 'squash', 'build'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Cards                                                               */
  /* ------------------------------------------------------------------ */

  /* C1. Dog-ear — the top-right corner curls back to show a colour beneath */
  {
    const c = cls('v13-card-dogear')
    const html = `<div class="${c}"><h4>Field notes</h4><p>Turned down at the corner so you can find it again.</p><span></span></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  padding: 1rem 1rem 1.1rem;
  background: #1c2333;
  border: 1px solid #2f3a52;
  border-radius: 0.6rem 0 0.6rem 0.6rem;
  color: #cbd5e1;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.${c} h4 { margin: 0 0 0.35rem; font-size: 0.9rem; color: #f1f5f9; }
.${c} p { margin: 0; font-size: 0.75rem; line-height: 1.5; color: #94a3b8; }
.${c} span {
  position: absolute;
  top: 0;
  right: 0;
  width: 26px;
  height: 26px;
  background: linear-gradient(225deg, #0b1020 0 50%, #f472b6 50% 100%);
  border-bottom-left-radius: 4px;
  box-shadow: -2px 2px 6px rgba(0,0,0,0.45);
  transition: width 0.3s ease, height 0.3s ease;
}
.${c}:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(0,0,0,0.4); }
.${c}:hover span { width: 40px; height: 40px; }`
    add(mk({
      name: 'Dog-Ear Card',
      category: 'Cards',
      description: 'Note card with its top-right corner turned down to a coloured underside, the fold growing larger as the card lifts on hover.',
      html, css,
      tags: ['fold', 'corner', 'dog-ear', 'note', 'lift'],
    }))
  }

  /* C2. Receipt — monospace till roll with a torn zigzag bottom edge */
  {
    const c = cls('v13-card-receipt')
    const html = `<div class="${c}"><b>HOVERLAB</b><div><span>Pro licence</span><em>79.00</em></div><div><span>Seats × 2</span><em>18.00</em></div><div><span>VAT</span><em>19.40</em></div><hr><div class="t"><span>TOTAL</span><em>116.40</em></div><p>····· THANK YOU ·····</p></div>`
    const css = `.${c} {
  position: relative;
  width: 190px;
  padding: 0.9rem 0.9rem 1.4rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  color: #1f2937;
  background: #f8fafc;
  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
  clip-path: polygon(
    0 0, 100% 0, 100% calc(100% - 9px),
    95% 100%, 90% calc(100% - 9px), 85% 100%, 80% calc(100% - 9px),
    75% 100%, 70% calc(100% - 9px), 65% 100%, 60% calc(100% - 9px),
    55% 100%, 50% calc(100% - 9px), 45% 100%, 40% calc(100% - 9px),
    35% 100%, 30% calc(100% - 9px), 25% 100%, 20% calc(100% - 9px),
    15% 100%, 10% calc(100% - 9px), 5% 100%, 0 calc(100% - 9px)
  );
}
.${c} b { display: block; text-align: center; letter-spacing: 0.22em; margin-bottom: 0.6rem; }
.${c} div { display: flex; justify-content: space-between; padding: 0.12rem 0; }
.${c} em { font-style: normal; }
.${c} hr { border: none; border-top: 1px dashed #94a3b8; margin: 0.45rem 0; }
.${c} .t { font-weight: 700; }
.${c} p { margin: 0.6rem 0 0; text-align: center; font-size: 0.6rem; color: #64748b; }`
    add(mk({
      name: 'Receipt Card',
      category: 'Cards',
      description: 'Paper till receipt in monospace with dashed rules, a totals line and a zigzag torn edge cut into the bottom by a mask.',
      html, css,
      tags: ['receipt', 'paper', 'monospace', 'torn', 'invoice'],
      darkSurface: true,
    }))
  }

  /* C3. Expanding detail — a hidden action row unrolls from the bottom */
  {
    const c = cls('v13-card-detail')
    const html = `<div class="${c}"><div class="h"><i></i><div><b>Runtime</b><small>eu-west-2</small></div><u>live</u></div><p>Serving 1.2k req/min at p95 118 ms.</p><div class="a"><button>Logs</button><button>Restart</button><button>Scale</button></div></div>`
    const css = `.${c} {
  width: 232px;
  background: #151b2b;
  border: 1px solid #29344a;
  border-radius: 0.7rem;
  overflow: hidden;
  color: #cbd5e1;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.${c} .h { display: flex; align-items: center; gap: 0.55rem; padding: 0.8rem 0.85rem 0.5rem; }
.${c} .h i {
  width: 26px; height: 26px; border-radius: 8px; flex: none;
  background: linear-gradient(135deg, #22d3ee, #6366f1);
}
.${c} .h div { flex: 1; display: grid; }
.${c} b { font-size: 0.82rem; color: #f1f5f9; }
.${c} small { font-size: 0.65rem; color: #64748b; }
.${c} u {
  text-decoration: none;
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #34d399;
  border: 1px solid rgba(52,211,153,0.4);
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
}
.${c} p { margin: 0; padding: 0 0.85rem 0.8rem; font-size: 0.72rem; color: #94a3b8; }
.${c} .a {
  display: flex;
  gap: 0.4rem;
  padding: 0 0.85rem;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.35s ease, opacity 0.25s ease, padding 0.35s ease;
}
.${c} .a button {
  flex: 1;
  padding: 0.35rem 0;
  font-size: 0.68rem;
  color: #cbd5e1;
  background: #1e2740;
  border: 1px solid #2f3c58;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.${c} .a button:hover { background: #6366f1; color: #fff; border-color: #6366f1; }
.${c}:hover { border-color: #4f46e5; box-shadow: 0 14px 30px rgba(0,0,0,0.45); }
.${c}:hover .a { max-height: 60px; opacity: 1; padding-bottom: 0.85rem; }`
    add(mk({
      name: 'Expanding Detail Card',
      category: 'Cards',
      description: 'Service card that keeps its action row rolled away until hover, when the footer unrolls to reveal three controls.',
      html, css,
      tags: ['expand', 'actions', 'footer', 'hover-reveal', 'status'],
    }))
  }

  /* C4. Mesh header — a drifting multi-point gradient panel above the copy */
  {
    const c = cls('v13-card-mesh')
    const html = `<div class="${c}"><div class="m"><span>New</span></div><div class="b"><b>Gradient meshes</b><p>Four radial stops drifting against each other, clipped to the header.</p></div></div>`
    const css = `.${c} {
  width: 226px;
  border-radius: 0.8rem;
  overflow: hidden;
  background: #131826;
  border: 1px solid #262f45;
  color: #cbd5e1;
}
.${c} .m {
  position: relative;
  height: 84px;
  background:
    radial-gradient(60% 80% at 15% 20%, #f472b6 0%, transparent 60%),
    radial-gradient(55% 70% at 85% 25%, #38bdf8 0%, transparent 60%),
    radial-gradient(70% 90% at 70% 90%, #a78bfa 0%, transparent 60%),
    radial-gradient(60% 70% at 20% 85%, #34d399 0%, transparent 60%),
    #1e1b4b;
  background-size: 180% 180%;
  animation: ${c}-drift 9s ease-in-out infinite;
}
.${c} .m span {
  position: absolute;
  top: 0.5rem;
  left: 0.6rem;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #0f172a;
  background: rgba(255,255,255,0.85);
  border-radius: 999px;
  padding: 0.14rem 0.5rem;
}
.${c} .b { padding: 0.75rem 0.85rem 0.9rem; }
.${c} b { display: block; font-size: 0.85rem; color: #f1f5f9; margin-bottom: 0.3rem; }
.${c} p { margin: 0; font-size: 0.72rem; line-height: 1.5; color: #94a3b8; }
@keyframes ${c}-drift {
  0%   { background-position: 0% 50%, 100% 50%, 50% 100%, 0% 0%; }
  50%  { background-position: 100% 20%, 0% 80%, 20% 0%, 80% 100%; }
  100% { background-position: 0% 50%, 100% 50%, 50% 100%, 0% 0%; }
}`
    add(mk({
      name: 'Mesh Header Card',
      category: 'Cards',
      description: 'Content card topped by a four-point mesh gradient whose colour blobs drift slowly against each other behind a pill label.',
      html, css,
      tags: ['mesh', 'gradient', 'header', 'drift', 'blobs'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Text                                                                */
  /* ------------------------------------------------------------------ */

  /* T1. Wave letters — each letter bobs on a delayed sine */
  {
    const c = cls('v13-text-wave')
    const html = `<h3 class="${c}"><span>f</span><span>l</span><span>o</span><span>a</span><span>t</span><span>i</span><span>n</span><span>g</span></h3>`
    const css = `.${c} {
  display: flex;
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #7dd3fc;
}
.${c} span {
  display: inline-block;
  animation: ${c}-bob 2.2s ease-in-out infinite;
}
.${c} span:nth-child(1) { animation-delay: 0s; }
.${c} span:nth-child(2) { animation-delay: 0.09s; }
.${c} span:nth-child(3) { animation-delay: 0.18s; }
.${c} span:nth-child(4) { animation-delay: 0.27s; }
.${c} span:nth-child(5) { animation-delay: 0.36s; }
.${c} span:nth-child(6) { animation-delay: 0.45s; }
.${c} span:nth-child(7) { animation-delay: 0.54s; }
.${c} span:nth-child(8) { animation-delay: 0.63s; }
@keyframes ${c}-bob {
  0%, 100% { transform: translateY(0); color: #7dd3fc; }
  50%      { transform: translateY(-9px); color: #f0abfc; }
}`
    add(mk({
      name: 'Wave Letters Text',
      category: 'Text',
      description: 'Heading whose letters rise and fall on a delayed sine so a wave travels through the word, shifting hue at the crest.',
      html, css,
      tags: ['wave', 'letters', 'bob', 'stagger', 'heading'],
    }))
  }

  /* T2. Ransom note — every letter its own cut-out scrap */
  {
    const c = cls('v13-text-ransom')
    const html = `<h3 class="${c}"><span>C</span><span>U</span><span>T</span><span> </span><span>U</span><span>P</span></h3>`
    const css = `.${c} {
  display: flex;
  gap: 3px;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
}
.${c} span {
  display: inline-block;
  padding: 0.12em 0.22em;
  background: #e2e8f0;
  color: #0f172a;
  box-shadow: 0 2px 6px rgba(0,0,0,0.5);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c} span:nth-child(1) { transform: rotate(-6deg);  background: #fde047; font-family: Georgia, serif; }
.${c} span:nth-child(2) { transform: rotate(4deg);   background: #f8fafc; font-family: ui-monospace, monospace; }
.${c} span:nth-child(3) { transform: rotate(-3deg);  background: #fca5a5; }
.${c} span:nth-child(4) { background: transparent; box-shadow: none; width: 0.25em; }
.${c} span:nth-child(5) { transform: rotate(7deg);   background: #a5b4fc; font-family: Georgia, serif; }
.${c} span:nth-child(6) { transform: rotate(-5deg);  background: #86efac; font-family: ui-monospace, monospace; }
.${c}:hover span:nth-child(1) { transform: rotate(3deg) translateY(-3px); }
.${c}:hover span:nth-child(2) { transform: rotate(-5deg) translateY(2px); }
.${c}:hover span:nth-child(3) { transform: rotate(6deg) translateY(-2px); }
.${c}:hover span:nth-child(5) { transform: rotate(-4deg) translateY(3px); }
.${c}:hover span:nth-child(6) { transform: rotate(5deg) translateY(-3px); }`
    add(mk({
      name: 'Ransom Note Text',
      category: 'Text',
      description: 'Each letter is its own pasted scrap with a different typeface, paper colour and tilt, all re-shuffling on hover.',
      html, css,
      tags: ['ransom', 'collage', 'cutout', 'rotate', 'mixed-type'],
    }))
  }

  /* T3. Dot matrix — the heading painted as an LED dot screen */
  {
    const c = cls('v13-text-matrix')
    const html = `<h3 class="${c}" data-t="DOT MATRIX">DOT MATRIX</h3>`
    const css = `.${c} {
  position: relative;
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: rgba(148,163,184,0.14);
}
.${c}::before {
  content: attr(data-t);
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #fb923c 42%, transparent 46%);
  background-size: 4px 4px;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  filter: drop-shadow(0 0 6px rgba(251,146,60,0.55));
  animation: ${c}-scan 3.2s linear infinite;
}
@keyframes ${c}-scan {
  from { background-position: 0 0; }
  to   { background-position: 0 40px; }
}`
    add(mk({
      name: 'Dot Matrix Text',
      category: 'Text',
      description: 'Heading rendered as an amber LED dot screen, the dot grid drifting slowly downward inside the letterforms.',
      html, css,
      tags: ['dot-matrix', 'led', 'background-clip', 'monospace', 'sign'],
    }))
  }

  /* T4. Sparkle heading — four-point stars twinkle around the words */
  {
    const c = cls('v13-text-sparkle')
    const html = `<h3 class="${c}">Made special<i></i><i></i><i></i></h3>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  margin: 0;
  padding: 0.2rem 1.2rem 0.2rem 0.4rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fef3c7;
  text-shadow: 0 0 18px rgba(251,191,36,0.35);
}
.${c} i {
  position: absolute;
  width: 14px;
  height: 14px;
  background: #fde047;
  clip-path: polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%);
  transform: scale(0);
  animation: ${c}-twinkle 2.4s ease-in-out infinite;
}
.${c} i:nth-child(1) { top: -6px;  left: 2px;    animation-delay: 0s; }
.${c} i:nth-child(2) { top: 6px;   right: 0;     animation-delay: 0.6s; width: 10px; height: 10px; }
.${c} i:nth-child(3) { bottom: -4px; right: 22px; animation-delay: 1.3s; width: 8px; height: 8px; }
@keyframes ${c}-twinkle {
  0%, 70%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
  20%           { transform: scale(1) rotate(35deg); opacity: 1; }
  45%           { transform: scale(0.6) rotate(70deg); opacity: 0.7; }
}`
    add(mk({
      name: 'Sparkle Heading',
      category: 'Text',
      description: 'Warm heading with three clip-path stars that twinkle in and out around the words on staggered delays.',
      html, css,
      tags: ['sparkle', 'stars', 'twinkle', 'heading', 'magic'],
    }))
  }
}
