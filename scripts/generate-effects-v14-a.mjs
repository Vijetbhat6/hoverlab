// scripts/generate-effects-v14-a.mjs
//
// Fourteenth wave, part A: Buttons, Loaders, Cards, Text.
// Four designs per category, one entry each — no colorway or size
// stamping (the Customize panel re-tokens anything).
//
// Shape-budget group for these four: "thinning" — real shapes remain but
// each takes a longer search, so every pick here is a *mechanism*: a
// physical metaphor, a layout transformation or a state machine, never
// another glow and never another slide.
//
//   Buttons — perforated tear-off stub, single button morphing into a
//             quantity stepper, 3D rocker switch in a socket, two jigsaw
//             halves interlocking tab-into-notch
//   Loaders — meshing gear train, abacus beads queueing along rails,
//             crank-slider piston in a cylinder, packet routed around a
//             PCB trace into a chip
//   Cards   — card riding out of a wallet sleeve, note swinging on its
//             pin, dimensioned blueprint drawing, cassette with spooling
//             reels
//   Text    — stencil plate lifting off the sprayed word, concertina
//             ribbon unfolding, sheet shredded into vertical strips,
//             rubber stamp striking the page
//
// Assembly constraints: roots visible at rest, no position:absolute on a
// root, infinite keyframes rest sensibly at their 100% stop (the
// reduced-motion guard freezes them there), everything fits a ~300x180
// dark preview.

export function generateV14A(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Buttons                                                             */
  /* ------------------------------------------------------------------ */

  /* B1. Perforated tear — the voucher stub folds down along a dotted
        perforation and the redeemed state is printed underneath it */
  {
    const c = cls('v14-btn-tear')
    const html = `<button class="${c}"><span class="body">Redeem voucher</span><span class="done">Redeemed ✓</span><span class="stub">tear along the dots</span></button>`
    const css = `.${c} {
  position: relative;
  display: block;
  width: 13rem;
  padding: 0;
  font-family: inherit;
  color: #e2e8f0;
  background: #1b2437;
  border: 1px solid #3b4a68;
  border-radius: 0.5rem;
  cursor: pointer;
  overflow: hidden;
  perspective: 320px;
}
.${c} .body {
  display: block;
  padding: 0.85rem 1rem 0.75rem;
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.${c} .done {
  display: block;
  padding: 0.42rem 1rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #052e16;
  background: linear-gradient(180deg, #4ade80, #22c55e);
}
.${c} .stub {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: block;
  padding: 0.42rem 1rem;
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  color: #7c8aa5;
  background: #131b2b;
  border-top: 2px dotted #46587a;
  transform-origin: top center;
  transform: rotateX(0deg);
  transition: transform 0.45s cubic-bezier(0.6, 0, 0.35, 1), opacity 0.35s ease 0.1s;
}
.${c}:hover { border-color: #22c55e; }
.${c}:hover .stub { transform: rotateX(-84deg); opacity: 0; }
.${c}:active { transform: translateY(1px); }`
    add(mk({
      name: 'Perforated Tear Button',
      category: 'Buttons',
      description: 'Voucher button whose lower stub is joined by a dotted perforation and folds away on a hinge when hovered, uncovering the redeemed bar printed beneath it.',
      html, css,
      tags: ['tear-off', 'perforation', 'hinge', 'stub', 'voucher'],
    }))
  }

  /* B2. Quantity morph — one wide button rearranges into a three-part
        stepper; the label collapses and the two controls grow from zero */
  {
    const c = cls('v14-btn-stepper')
    const html = `<div class="${c}"><button class="k minus">−</button><span class="lbl">Add to cart</span><span class="qty">1</span><button class="k plus">+</button></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: stretch;
  height: 2.6rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0b1220;
  background: linear-gradient(180deg, #7dd3fc, #38bdf8);
  border-radius: 0.55rem;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(56, 189, 248, 0.22);
}
.${c} .k {
  flex: 0 0 0;
  width: 0;
  padding: 0;
  font: inherit;
  font-size: 1.1rem;
  line-height: 1;
  color: #0b1220;
  background: rgba(255, 255, 255, 0.35);
  border: none;
  opacity: 0;
  cursor: pointer;
  transition: flex-basis 0.35s cubic-bezier(0.22, 1, 0.36, 1), width 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease;
}
.${c} .lbl {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 9rem;
  padding: 0 1.1rem;
  white-space: nowrap;
  overflow: hidden;
  transition: max-width 0.35s cubic-bezier(0.22, 1, 0.36, 1), padding 0.35s ease, opacity 0.2s ease;
}
.${c} .qty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0;
  overflow: hidden;
  font-variant-numeric: tabular-nums;
  opacity: 0;
  transition: width 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease 0.1s;
}
.${c}:hover .k { flex-basis: 2.4rem; width: 2.4rem; opacity: 1; }
.${c}:hover .lbl { max-width: 0; padding: 0; opacity: 0; }
.${c}:hover .qty { width: 3.1rem; opacity: 1; }
.${c} .k:hover { background: rgba(255, 255, 255, 0.6); }`
    add(mk({
      name: 'Quantity Stepper Button',
      category: 'Buttons',
      description: 'Single add-to-cart button that rearranges its own layout on hover: the label collapses to nothing while a minus key, a count and a plus key grow out of the ends to form a stepper.',
      html, css,
      tags: ['stepper', 'morph', 'layout', 'quantity', 'segmented'],
    }))
  }

  /* B3. Rocker switch — a real two-face rocker on a perspective, tipping
        from OFF to ON inside a moulded socket */
  {
    const c = cls('v14-btn-rocker')
    const html = `<div class="${c}"><span class="rock"><i class="o">O</i><i class="i">I</i></span><span class="cap">power</span></div>`
    const css = `.${c} {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.6rem 0.45rem;
  background: #222a3a;
  border: 1px solid #3a465e;
  border-radius: 0.6rem;
  cursor: pointer;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.55);
  perspective: 260px;
}
.${c} .rock {
  display: flex;
  width: 5.4rem;
  height: 2.5rem;
  border-radius: 0.28rem;
  background: linear-gradient(180deg, #f1f5f9 0%, #b8c2d0 55%, #4b5768 100%);
  transform: rotateX(26deg);
  transform-origin: center center;
  transform-style: preserve-3d;
  box-shadow: 0 7px 12px rgba(0, 0, 0, 0.6), inset 0 -3px 0 rgba(0, 0, 0, 0.35);
  transition: transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1), background 0.28s ease, box-shadow 0.28s ease;
}
.${c} .rock i {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  transition: color 0.28s ease, opacity 0.28s ease;
}
.${c} .rock .i { opacity: 0.35; }
.${c} .cap {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #64748b;
  transition: color 0.28s ease;
}
.${c}:hover .rock {
  transform: rotateX(-26deg);
  background: linear-gradient(180deg, #15803d 0%, #4ade80 45%, #bbf7d0 100%);
  box-shadow: 0 -5px 12px rgba(0, 0, 0, 0.55), inset 0 3px 0 rgba(0, 0, 0, 0.3);
}
.${c}:hover .rock .o { opacity: 0.3; }
.${c}:hover .rock .i { opacity: 1; color: #052e16; }
.${c}:hover .cap { color: #4ade80; }
.${c}:active .rock { transform: rotateX(-22deg) scale(0.99); }`
    add(mk({
      name: 'Rocker Switch Button',
      category: 'Buttons',
      description: 'Hardware rocker sunk into a moulded socket that tips on a perspective from the O side to the I side, its face turning green as the switch takes the ON position.',
      html, css,
      tags: ['rocker', 'switch', '3d', 'toggle', 'hardware'],
    }))
  }

  /* B4. Jigsaw join — the two halves carry a tab and a matching notch and
        slide together until the word reads whole */
  {
    const c = cls('v14-btn-jigsaw')
    const html = `<button class="${c}"><span class="l">Con</span><span class="r">nect</span></button>`
    const css = `.${c} {
  display: inline-flex;
  align-items: stretch;
  padding: 0.35rem 0.75rem;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  background: #10192b;
  border: 1px dashed #33415c;
  border-radius: 0.7rem;
  cursor: pointer;
}
.${c} .l,
.${c} .r {
  display: flex;
  align-items: center;
  height: 2.3rem;
  color: #0b1220;
  transition: transform 0.42s cubic-bezier(0.34, 1.35, 0.64, 1);
}
.${c} .l {
  position: relative;
  padding: 0 0.35rem 0 0.95rem;
  background: linear-gradient(180deg, #a5b4fc, #6366f1);
  border-radius: 0.4rem 0 0 0.4rem;
  transform: translateX(-11px);
}
.${c} .l::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -10px;
  width: 21px;
  height: 21px;
  margin-top: -10.5px;
  border-radius: 50%;
  background: #7f88f3;
}
.${c} .r {
  padding: 0 0.95rem 0 0.5rem;
  background: linear-gradient(180deg, #a5b4fc, #6366f1);
  border-radius: 0 0.4rem 0.4rem 0;
  transform: translateX(11px);
  -webkit-mask-image: radial-gradient(circle 9px at 0 50%, transparent 0 98%, #000 99%);
  mask-image: radial-gradient(circle 9px at 0 50%, transparent 0 98%, #000 99%);
}
.${c}:hover .l,
.${c}:hover .r { transform: translateX(0); }
.${c}:hover { border-color: #6366f1; border-style: solid; }
.${c}:active .l { transform: translateX(-2px); }
.${c}:active .r { transform: translateX(2px); }`
    add(mk({
      name: 'Jigsaw Join Button',
      category: 'Buttons',
      description: 'Button split into two puzzle halves sitting apart in a dashed tray, one carrying a round tab and the other a masked notch, which slide together on hover until the tab seats and the word reads whole.',
      html, css,
      tags: ['puzzle', 'interlock', 'mask', 'notch', 'join'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Loaders                                                             */
  /* ------------------------------------------------------------------ */

  /* L1. Gear train — two toothed wheels, cut from a repeating conic
        gradient clipped to the rim, meshing and counter-rotating */
  {
    const c = cls('v14-load-gears')
    const html = `<div class="${c}"><i class="g1"></i><i class="g2"></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
}
.${c} i {
  display: block;
  border-radius: 50%;
}
.${c} .g1 {
  width: 58px;
  height: 58px;
  background:
    radial-gradient(circle at 50% 22%, #0f172a 0 3px, rgba(0,0,0,0) 3.5px),
    radial-gradient(circle at 50% 50%, #0f172a 0 7px, rgba(0,0,0,0) 7.5px),
    radial-gradient(circle at 50% 50%, #38bdf8 0 21px, rgba(0,0,0,0) 21.5px),
    repeating-conic-gradient(from 0deg, #38bdf8 0 9deg, rgba(0,0,0,0) 9deg 22.5deg);
  animation: ${c}-cw 2.4s linear infinite;
}
.${c} .g2 {
  width: 42px;
  height: 42px;
  margin-left: -9px;
  margin-top: 26px;
  background:
    radial-gradient(circle at 50% 26%, #0f172a 0 2.5px, rgba(0,0,0,0) 3px),
    radial-gradient(circle at 50% 50%, #0f172a 0 5px, rgba(0,0,0,0) 5.5px),
    radial-gradient(circle at 50% 50%, #f59e0b 0 15px, rgba(0,0,0,0) 15.5px),
    repeating-conic-gradient(from 12deg, #f59e0b 0 10deg, rgba(0,0,0,0) 10deg 24deg);
  animation: ${c}-ccw 1.75s linear infinite;
}
@keyframes ${c}-cw {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes ${c}-ccw {
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
}`
    add(mk({
      name: 'Gear Train Loader',
      category: 'Loaders',
      description: 'Two toothed wheels with hubs and bolt holes sit meshed at the rim and turn against each other, the smaller amber gear running faster in the opposite direction.',
      html, css,
      tags: ['gears', 'mesh', 'machine', 'rotate', 'teeth'],
    }))
  }

  /* L2. Abacus — beads slide down each rail one after another and queue
        against the right post, then run back to the start */
  {
    const c = cls('v14-load-abacus')
    const html = `<div class="${c}"><div class="row"><i></i><i></i><i></i><i></i><i></i></div><div class="row"><i></i><i></i><i></i><i></i><i></i></div><div class="row"><i></i><i></i><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 10px 11px;
  background: #101728;
  border: 3px solid #4b5a76;
  border-radius: 5px;
}
.${c} .row {
  position: relative;
  display: flex;
  gap: 3px;
  width: 150px;
  height: 14px;
}
.${c} .row::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  margin-top: -1px;
  background: rgba(148, 163, 184, 0.32);
}
.${c} i {
  position: relative;
  display: block;
  width: 13px;
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(180deg, #7dd3fc, #0284c7);
  box-shadow: inset 0 -2px 3px rgba(0, 0, 0, 0.3);
  animation-name: ${c}-count;
  animation-timing-function: cubic-bezier(0.5, 0, 0.3, 1);
  animation-iteration-count: infinite;
}
.${c} .row:nth-child(1) i { animation-duration: 2.4s; }
.${c} .row:nth-child(2) i { animation-duration: 2.9s; }
.${c} .row:nth-child(3) i { animation-duration: 3.4s; }
.${c} i:nth-child(5) { animation-delay: 0s; }
.${c} i:nth-child(4) { animation-delay: 0.16s; }
.${c} i:nth-child(3) { animation-delay: 0.32s; }
.${c} i:nth-child(2) { animation-delay: 0.48s; }
.${c} i:nth-child(1) { animation-delay: 0.64s; }
@keyframes ${c}-count {
  0%, 6%    { transform: translateX(0); }
  30%, 62%  { transform: translateX(70px); }
  86%, 100% { transform: translateX(0); }
}`
    add(mk({
      name: 'Abacus Count Loader',
      category: 'Loaders',
      description: 'Framed abacus whose beads slide along three rails one at a time, queueing against the far post before the whole row runs back to be counted again.',
      html, css,
      tags: ['abacus', 'beads', 'rails', 'count', 'sequence'],
    }))
  }

  /* L3. Piston — a crank-slider: the flywheel turns, the connecting rod
        swings and translates, the piston reciprocates in its cylinder */
  {
    const c = cls('v14-load-piston')
    const html = `<div class="${c}"><span class="cyl"><i class="pis"></i></span><span class="rod"></span><span class="crank"><b></b></span></div>`
    const css = `.${c} {
  position: relative;
  width: 152px;
  height: 62px;
}
.${c} .cyl {
  position: absolute;
  left: 0;
  top: 16px;
  width: 70px;
  height: 30px;
  background: linear-gradient(180deg, #1c2740, #0b1120 60%, #1c2740);
  border: 2px solid #64748b;
  border-right: none;
  border-radius: 6px 0 0 6px;
  overflow: hidden;
}
.${c} .pis {
  display: block;
  width: 20px;
  height: 100%;
  margin-left: 4px;
  border-radius: 2px;
  background:
    linear-gradient(0deg, rgba(0,0,0,0) 0 6px, #475569 6px 8px, rgba(0,0,0,0) 8px 20px, #475569 20px 22px, rgba(0,0,0,0) 22px),
    linear-gradient(180deg, #f1f5f9, #64748b);
  animation: ${c}-stroke 1.6s ease-in-out infinite;
}
.${c} .rod {
  position: absolute;
  left: 24px;
  top: 28px;
  width: 74px;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(180deg, #cbd5e1, #7c8aa5);
  transform-origin: left center;
  animation: ${c}-rod 1.6s ease-in-out infinite;
}
.${c} .crank {
  position: absolute;
  left: 98px;
  top: 11px;
  width: 40px;
  height: 40px;
  border: 3px solid #f59e0b;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, #1e293b 0 6px, rgba(0,0,0,0) 6.5px), rgba(245, 158, 11, 0.16);
  animation: ${c}-spin 1.6s linear infinite;
}
.${c} .crank b {
  position: absolute;
  top: 50%;
  right: 0;
  width: 9px;
  height: 9px;
  margin-top: -4.5px;
  border-radius: 50%;
  background: #fcd34d;
}
@keyframes ${c}-stroke {
  0%, 100% { transform: translateX(40px); }
  50%      { transform: translateX(0); }
}
@keyframes ${c}-rod {
  0%, 100% { transform: translateX(40px) rotate(0deg); }
  25%      { transform: translateX(20px) rotate(9deg); }
  50%      { transform: translateX(0) rotate(0deg); }
  75%      { transform: translateX(20px) rotate(-9deg); }
}
@keyframes ${c}-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}`
    add(mk({
      name: 'Piston Pump Loader',
      category: 'Loaders',
      description: 'Crank-slider engine in miniature: an amber flywheel turns a pin, the connecting rod swings and slides with it, and the piston strokes back and forth inside its cylinder.',
      html, css,
      tags: ['piston', 'crank', 'engine', 'reciprocate', 'machine'],
    }))
  }

  /* L4. Circuit trace — a packet routed around a board trace and into the
        chip in the middle; the loop is closed so the cycle wraps cleanly */
  {
    const c = cls('v14-load-trace')
    const html = `<div class="${c}"><span class="trace"></span><span class="chip">SoC</span><span class="pkt"></span></div>`
    const css = `.${c} {
  position: relative;
  width: 172px;
  height: 88px;
  background:
    repeating-linear-gradient(90deg, rgba(56,189,248,0.06) 0 1px, rgba(0,0,0,0) 1px 11px),
    repeating-linear-gradient(0deg, rgba(56,189,248,0.06) 0 1px, rgba(0,0,0,0) 1px 11px),
    #0a1220;
  border: 1px solid #1c3a52;
  border-radius: 6px;
}
.${c} .trace {
  position: absolute;
  left: 14px;
  top: 14px;
  width: 142px;
  height: 58px;
  border: 2px solid rgba(56, 189, 248, 0.32);
  border-radius: 3px;
}
.${c} .trace::before,
.${c} .trace::after {
  content: '';
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1e4b6b;
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.35);
}
.${c} .trace::before { left: -4px; top: -4px; }
.${c} .trace::after { right: -4px; bottom: -4px; }
.${c} .chip {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 52px;
  height: 26px;
  margin: -13px 0 0 -26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #7dd3fc;
  background: #111c2e;
  border: 1px solid #2c4a68;
  border-radius: 3px;
  box-shadow: -6px 0 0 -4px #64748b, 6px 0 0 -4px #64748b;
}
.${c} .pkt {
  position: absolute;
  left: 10px;
  top: 10px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #67e8f9;
  box-shadow: 0 0 10px 2px rgba(103, 232, 249, 0.65);
  animation: ${c}-route 2.6s linear infinite;
}
@keyframes ${c}-route {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(142px, 0); }
  50%  { transform: translate(142px, 58px); }
  75%  { transform: translate(0, 58px); }
  100% { transform: translate(0, 0); }
}`
    add(mk({
      name: 'Circuit Trace Loader',
      category: 'Loaders',
      description: 'A glowing packet runs the rectangular copper trace of a small board, turning each corner in sequence around the chip package sitting at the centre.',
      html, css,
      tags: ['circuit', 'trace', 'packet', 'board', 'route'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Cards                                                               */
  /* ------------------------------------------------------------------ */

  /* C1. Wallet sleeve — the card sits tucked in a pocket with a thumb
        notch and rides up out of it on hover */
  {
    const c = cls('v14-card-sleeve')
    const html = `<div class="${c}"><div class="crd"><b>Ocean Pro</b><code>4919 •••• •••• 2043</code><small>VALID THRU 09 / 29</small></div><div class="slv"><span>slide out</span></div></div>`
    const css = `.${c} {
  position: relative;
  width: 226px;
  height: 140px;
  background: #0d1424;
  border: 1px solid #232d44;
  border-radius: 0.7rem;
  overflow: hidden;
  transition: box-shadow 0.35s ease;
}
.${c} .crd {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 10px;
  height: 98px;
  padding: 0.6rem 0.7rem;
  border-radius: 0.55rem;
  background: linear-gradient(135deg, #1d4ed8, #0ea5e9 60%, #22d3ee);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.45);
  transform: translateY(40px);
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.${c} .crd b { display: block; font-size: 0.78rem; letter-spacing: 0.14em; text-transform: uppercase; color: #e0f2fe; }
.${c} .crd code { display: block; margin-top: 0.55rem; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.8rem; letter-spacing: 0.04em; color: #f0f9ff; }
.${c} .crd small { display: block; margin-top: 0.2rem; font-size: 0.58rem; letter-spacing: 0.1em; color: rgba(224, 242, 254, 0.75); }
.${c} .slv {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 64px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 0.5rem;
  background: linear-gradient(180deg, #1b2435, #0f1626);
  box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.3);
  -webkit-mask-image: radial-gradient(circle 20px at 50% 0, rgba(0,0,0,0) 0 99%, #000 100%);
  mask-image: radial-gradient(circle 20px at 50% 0, rgba(0,0,0,0) 0 99%, #000 100%);
}
.${c} .slv span { font-size: 0.58rem; letter-spacing: 0.22em; text-transform: uppercase; color: #64748b; }
.${c}:hover { box-shadow: 0 16px 34px rgba(0, 0, 0, 0.5); }
.${c}:hover .crd { transform: translateY(0); }`
    add(mk({
      name: 'Wallet Sleeve Card',
      category: 'Cards',
      description: 'A payment card tucked into a pocket with a semicircular thumb notch cut out of its top edge, riding up out of the sleeve on hover to show the full number.',
      html, css,
      tags: ['sleeve', 'pocket', 'slide-out', 'mask', 'wallet'],
    }))
  }

  /* C2. Pinned note — the whole card pivots about the pin head, which is
        the transform-origin, so it swings rather than tilts */
  {
    const c = cls('v14-card-pin')
    const html = `<div class="${c}"><b>Buy milk, ship v14</b><p>Pinned to the board on Tuesday. Nudge it and it swings.</p></div>`
    const css = `.${c} {
  position: relative;
  width: 196px;
  padding: 1.5rem 0.95rem 0.9rem;
  color: #453d1c;
  background:
    repeating-linear-gradient(180deg, rgba(120, 100, 40, 0.14) 0 1px, rgba(0,0,0,0) 1px 17px),
    linear-gradient(160deg, #fef9c3, #fde68a);
  border-radius: 2px;
  transform-origin: 50% 9px;
  transform: rotate(-2.4deg);
  box-shadow: 4px 8px 16px rgba(0, 0, 0, 0.45);
  transition: transform 0.65s cubic-bezier(0.28, 1.5, 0.55, 1), box-shadow 0.4s ease;
}
.${c}::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 50%;
  width: 13px;
  height: 13px;
  margin-left: -6.5px;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, #fca5a5 0 3px, #dc2626 55%, #7f1d1d 100%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
.${c} b { display: block; font-size: 0.85rem; }
.${c} p { margin: 0.35rem 0 0; font-size: 0.72rem; line-height: 1.45; color: #6b5f2c; }
.${c}:hover {
  transform: rotate(3deg);
  box-shadow: 6px 12px 22px rgba(0, 0, 0, 0.5);
}`
    add(mk({
      name: 'Pinned Note Card',
      category: 'Cards',
      description: 'Ruled paper note held by a single push pin, pivoting about the pin head as its transform origin so it swings past level and settles rather than tilting in place.',
      html, css,
      tags: ['pin', 'swing', 'pivot', 'paper', 'corkboard'],
    }))
  }

  /* C3. Blueprint — a drafting sheet; the dimension lines measure the part
        on hover, extending from their witness marks */
  {
    const c = cls('v14-card-blueprint')
    const html = `<div class="${c}"><span class="part"></span><span class="dw"></span><em class="lw">96.0</em><span class="dh"></span><em class="lh">46.0</em><span class="tb"><b>BRACKET-04</b><i>REV C · 1:1</i></span></div>`
    const css = `.${c} {
  position: relative;
  width: 236px;
  height: 142px;
  background:
    repeating-linear-gradient(90deg, rgba(125, 211, 252, 0.12) 0 1px, rgba(0,0,0,0) 1px 12px),
    repeating-linear-gradient(0deg, rgba(125, 211, 252, 0.12) 0 1px, rgba(0,0,0,0) 1px 12px),
    #072a4a;
  border: 1px solid #0e4a78;
  border-radius: 3px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #bae6fd;
}
.${c} .part {
  position: absolute;
  left: 30px;
  top: 26px;
  width: 118px;
  height: 56px;
  border: 2px solid #7dd3fc;
  border-radius: 3px 14px 3px 3px;
  background: repeating-linear-gradient(45deg, rgba(125, 211, 252, 0.12) 0 2px, rgba(0,0,0,0) 2px 7px);
  transition: border-color 0.35s ease, box-shadow 0.35s ease;
}
.${c} .dw {
  position: absolute;
  left: 30px;
  top: 98px;
  width: 118px;
  height: 1px;
  background: #38bdf8;
  transform: scaleX(0.06);
  transform-origin: left center;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.${c} .dw::before,
.${c} .dw::after {
  content: '';
  position: absolute;
  top: -4px;
  width: 1px;
  height: 9px;
  background: #38bdf8;
}
.${c} .dw::before { left: 0; }
.${c} .dw::after { right: 0; }
.${c} .lw {
  position: absolute;
  left: 74px;
  top: 103px;
  font-size: 0.6rem;
  font-style: normal;
  color: #e0f2fe;
  background: #072a4a;
  padding: 0 3px;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s ease 0.28s;
}
.${c} .dh {
  position: absolute;
  left: 162px;
  top: 26px;
  width: 1px;
  height: 56px;
  background: #38bdf8;
  transform: scaleY(0.06);
  transform-origin: center top;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.12s;
}
.${c} .dh::before,
.${c} .dh::after {
  content: '';
  position: absolute;
  left: -4px;
  width: 9px;
  height: 1px;
  background: #38bdf8;
}
.${c} .dh::before { top: 0; }
.${c} .dh::after { bottom: 0; }
.${c} .lh {
  position: absolute;
  left: 170px;
  top: 54px;
  font-size: 0.6rem;
  font-style: normal;
  color: #e0f2fe;
  background: #072a4a;
  padding: 0 3px;
  opacity: 0;
  transition: opacity 0.3s ease 0.38s;
}
.${c} .tb {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 0.25rem 0.45rem;
  text-align: right;
  border: 1px solid #1e6ba3;
  background: rgba(3, 26, 46, 0.7);
}
.${c} .tb b { display: block; font-size: 0.6rem; letter-spacing: 0.08em; color: #e0f2fe; }
.${c} .tb i { display: block; font-style: normal; font-size: 0.52rem; color: #7dd3fc; }
.${c}:hover .part { border-color: #f0f9ff; box-shadow: 0 0 14px rgba(125, 211, 252, 0.3); }
.${c}:hover .dw { transform: scaleX(1); }
.${c}:hover .dh { transform: scaleY(1); }
.${c}:hover .lw,
.${c}:hover .lh { opacity: 1; }`
    add(mk({
      name: 'Blueprint Spec Card',
      category: 'Cards',
      description: 'Drafting sheet on gridded blueprint paper with a hatched part and a title block, whose width and height dimension lines extend from their witness ticks and print their measurements when hovered.',
      html, css,
      tags: ['blueprint', 'dimension', 'drafting', 'grid', 'technical'],
    }))
  }

  /* C4. Cassette — two reels spin while the wound tape moves from one hub
        to the other, the ring thickness swapping over a long cycle */
  {
    const c = cls('v14-card-cassette')
    const html = `<div class="${c}"><div class="lbl"><b>Side A · Night Drive</b><u></u><u></u></div><div class="win"><span class="reel r1"><i></i></span><span class="tape"></span><span class="reel r2"><i></i></span></div></div>`
    const css = `.${c} {
  width: 218px;
  padding: 9px;
  background:
    radial-gradient(circle at 9px 9px, #0b1220 0 2px, rgba(0,0,0,0) 2.5px),
    radial-gradient(circle at calc(100% - 9px) 9px, #0b1220 0 2px, rgba(0,0,0,0) 2.5px),
    radial-gradient(circle at 9px calc(100% - 9px), #0b1220 0 2px, rgba(0,0,0,0) 2.5px),
    radial-gradient(circle at calc(100% - 9px) calc(100% - 9px), #0b1220 0 2px, rgba(0,0,0,0) 2.5px),
    linear-gradient(180deg, #33405a, #1a2233);
  border: 1px solid #4b5a76;
  border-radius: 6px;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.45);
}
.${c} .lbl {
  padding: 0.4rem 0.5rem 0.45rem;
  background: linear-gradient(180deg, #f8fafc, #e2e8f0);
  border-radius: 2px;
}
.${c} .lbl b { display: block; font-size: 0.68rem; color: #1e293b; }
.${c} .lbl u { display: block; height: 1px; margin-top: 6px; background: #94a3b8; text-decoration: none; }
.${c} .lbl u:last-child { width: 60%; }
.${c} .win {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  margin-top: 8px;
  padding: 0 12px;
  background: #0b101c;
  border: 1px solid #263149;
  border-radius: 3px;
}
.${c} .tape {
  position: absolute;
  left: 34px;
  right: 34px;
  top: 50%;
  height: 3px;
  margin-top: -1.5px;
  background: #4a3520;
}
.${c} .reel {
  position: relative;
  z-index: 1;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 9px solid #6b4b28;
  background: #1e293b;
  animation: ${c}-wind 9s linear infinite alternate;
}
.${c} .r2 { border-width: 4px; animation-direction: alternate-reverse; }
.${c} .reel i {
  position: absolute;
  inset: -9px;
  margin: auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background:
    linear-gradient(90deg, rgba(0,0,0,0) 0 7px, #cbd5e1 7px 11px, rgba(0,0,0,0) 11px),
    linear-gradient(0deg, rgba(0,0,0,0) 0 7px, #cbd5e1 7px 11px, rgba(0,0,0,0) 11px),
    #94a3b8;
  animation: ${c}-spin 2.6s linear infinite;
}
@keyframes ${c}-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes ${c}-wind {
  from { border-width: 9px; }
  to   { border-width: 4px; }
}`
    add(mk({
      name: 'Cassette Tape Card',
      category: 'Cards',
      description: 'Compact cassette with a written label and a window onto two spoked hubs that turn continuously while the wound tape thickens on one reel and thins on the other.',
      html, css,
      tags: ['cassette', 'reels', 'spool', 'retro', 'spin'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Text                                                                */
  /* ------------------------------------------------------------------ */

  /* T1. Stencil plate — the metal plate covering the sprayed word peels
        off the page and takes its cut letters with it */
  {
    const c = cls('v14-text-stencil')
    const html = `<div class="${c}"><span class="spray">FREIGHT</span><span class="plate">FREIGHT</span></div>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}
.${c} .spray {
  display: block;
  padding: 0.1em 0.1em;
  background-image:
    radial-gradient(rgba(15, 23, 42, 0.5) 30%, rgba(0,0,0,0) 32%),
    linear-gradient(180deg, #fbbf24, #ea580c);
  background-size: 3px 3px, 100% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 6px rgba(251, 146, 60, 0.35));
}
.${c} .plate {
  position: absolute;
  top: -8px;
  bottom: -8px;
  left: -14px;
  right: -14px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  color: #0f172a;
  background:
    radial-gradient(circle at 8px 8px, #64748b 0 2px, rgba(0,0,0,0) 2.5px),
    radial-gradient(circle at calc(100% - 8px) 8px, #64748b 0 2px, rgba(0,0,0,0) 2.5px),
    radial-gradient(circle at 8px calc(100% - 8px), #64748b 0 2px, rgba(0,0,0,0) 2.5px),
    radial-gradient(circle at calc(100% - 8px) calc(100% - 8px), #64748b 0 2px, rgba(0,0,0,0) 2.5px),
    linear-gradient(155deg, #e2e8f0, #94a3b8);
  border-radius: 4px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.5);
  transition: transform 0.55s cubic-bezier(0.5, 0, 0.35, 1), opacity 0.5s ease 0.05s;
}
.${c}:hover .plate {
  transform: translate(26px, -22px) rotate(-6deg);
  opacity: 0;
}`
    add(mk({
      name: 'Stencil Plate Text',
      category: 'Text',
      description: 'A riveted metal stencil with the word cut out of it lies over the page, then lifts away on hover to reveal the grainy sprayed paint that went through the openings.',
      html, css,
      tags: ['stencil', 'spray', 'plate', 'reveal', 'industrial'],
    }))
  }

  /* T2. Folded ribbon — each letter sits on its own facet of a concertina,
        alternately pitched away from and toward the reader */
  {
    const c = cls('v14-text-ribbon')
    const html = `<h3 class="${c}"><span>F</span><span>O</span><span>L</span><span>D</span><span>E</span><span>D</span></h3>`
    const css = `.${c} {
  display: inline-flex;
  margin: 0;
  perspective: 460px;
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}
.${c} span {
  display: block;
  padding: 0.42em 0.24em;
  color: #f0f9ff;
  background: linear-gradient(180deg, #38bdf8, #0369a1);
  transition: transform 0.5s cubic-bezier(0.34, 1.3, 0.64, 1), filter 0.5s ease;
}
.${c} span:nth-child(odd) { transform: rotateX(52deg); filter: brightness(1.25); }
.${c} span:nth-child(even) { transform: rotateX(-52deg); filter: brightness(0.6); }
.${c} span:nth-child(1) { transition-delay: 0s; }
.${c} span:nth-child(2) { transition-delay: 0.05s; }
.${c} span:nth-child(3) { transition-delay: 0.1s; }
.${c} span:nth-child(4) { transition-delay: 0.15s; }
.${c} span:nth-child(5) { transition-delay: 0.2s; }
.${c} span:nth-child(6) { transition-delay: 0.25s; }
.${c}:hover span { transform: rotateX(0deg); filter: brightness(1); }`
    add(mk({
      name: 'Folded Ribbon Text',
      category: 'Text',
      description: 'The word is printed across a concertina strip, every letter on a facet pitched alternately away from and toward the reader, and the pleats open out flat one after another on hover.',
      html, css,
      tags: ['fold', 'concertina', 'facets', 'perspective', 'unfold'],
    }))
  }

  /* T3. Shredded — eight clipped copies of the same sheet tile into one,
        then drop out of register like cut strips */
  {
    const c = cls('v14-text-shred')
    const html = `<div class="${c}"><span>SHREDDED</span><span>SHREDDED</span><span>SHREDDED</span><span>SHREDDED</span><span>SHREDDED</span><span>SHREDDED</span><span>SHREDDED</span><span>SHREDDED</span></div>`
    const css = `.${c} {
  position: relative;
  width: 216px;
  height: 62px;
  background: rgba(2, 6, 23, 0.55);
}
.${c} span {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #0f172a;
  background: linear-gradient(180deg, #f8fafc, #cbd5e1);
  transform-origin: top center;
  transition: transform 0.55s cubic-bezier(0.36, 0, 0.66, -0.3), opacity 0.55s ease;
}
.${c} span:nth-child(1) { clip-path: inset(0 87.5% 0 0); }
.${c} span:nth-child(2) { clip-path: inset(0 75% 0 12.5%); }
.${c} span:nth-child(3) { clip-path: inset(0 62.5% 0 25%); }
.${c} span:nth-child(4) { clip-path: inset(0 50% 0 37.5%); }
.${c} span:nth-child(5) { clip-path: inset(0 37.5% 0 50%); }
.${c} span:nth-child(6) { clip-path: inset(0 25% 0 62.5%); }
.${c} span:nth-child(7) { clip-path: inset(0 12.5% 0 75%); }
.${c} span:nth-child(8) { clip-path: inset(0 0 0 87.5%); }
.${c}:hover span:nth-child(1) { transform: translate(-3px, 30px) rotate(-4deg); opacity: 0.5; }
.${c}:hover span:nth-child(2) { transform: translate(1px, 11px) rotate(2deg); opacity: 0.75; }
.${c}:hover span:nth-child(3) { transform: translate(-2px, 44px) rotate(-2deg); opacity: 0.3; }
.${c}:hover span:nth-child(4) { transform: translate(2px, 22px) rotate(3deg); opacity: 0.62; }
.${c}:hover span:nth-child(5) { transform: translate(-1px, 51px) rotate(-5deg); opacity: 0.22; }
.${c}:hover span:nth-child(6) { transform: translate(3px, 16px) rotate(2deg); opacity: 0.68; }
.${c}:hover span:nth-child(7) { transform: translate(-2px, 38px) rotate(-3deg); opacity: 0.4; }
.${c}:hover span:nth-child(8) { transform: translate(1px, 26px) rotate(5deg); opacity: 0.55; }`
    add(mk({
      name: 'Shredded Text',
      category: 'Text',
      description: 'A printed sheet made of eight vertically clipped copies that sit in perfect register until hover, when the strips slide out of line at different depths and angles like paper through a shredder.',
      html, css,
      tags: ['shred', 'strips', 'clip-path', 'paper', 'destroy'],
    }))
  }

  /* T4. Rubber stamp — a faint ghost impression that lands hard, square
        and inked, with a distress mask over the whole mark */
  {
    const c = cls('v14-text-stamp')
    const html = `<span class="${c}">Approved</span>`
    const css = `.${c} {
  display: inline-block;
  padding: 0.5rem 1rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #f43f5e;
  border: 3px solid #f43f5e;
  border-radius: 4px;
  box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.35);
  -webkit-mask-image: repeating-linear-gradient(29deg, #000 0 7px, rgba(0, 0, 0, 0.68) 7px 8.5px);
  mask-image: repeating-linear-gradient(29deg, #000 0 7px, rgba(0, 0, 0, 0.68) 7px 8.5px);
  opacity: 0.3;
  transform: rotate(-9deg) scale(1.18);
  filter: blur(0.7px);
  transition: transform 0.26s cubic-bezier(0.2, 0.9, 0.28, 1.5), opacity 0.18s ease, filter 0.22s ease, text-shadow 0.3s ease;
}
.${c}:hover {
  opacity: 1;
  transform: rotate(-4deg) scale(1);
  filter: blur(0);
  text-shadow: 0 0 7px rgba(244, 63, 94, 0.45);
}`
    add(mk({
      name: 'Rubber Stamp Text',
      category: 'Text',
      description: 'A ghost impression hanging above the page that slams down square on hover, snapping into focus as a hard inked mark with a distressed rubber texture masked across it.',
      html, css,
      tags: ['stamp', 'ink', 'impact', 'distress', 'mask'],
    }))
  }
}
