// scripts/generate-effects-v14-b.mjs
//
// Fourteenth wave, part B: Backgrounds, Inputs & Hover,
// Navigation & Menus, Toggles & Switches. Four designs each.
//
// Shape-budget group: "thinning" for all four — every remaining shape has
// to be a mechanism rather than a hue, so each entry below is picked for a
// physical metaphor, a layout transformation or a state machine:
//
//   Backgrounds — circuit traces carrying a pulse, a Truchet arc maze,
//                 an over-under basket weave, rotating venetian slats
//   Inputs      — a card that flips to its CVC face, a compare wipe,
//                 a peeling paper corner, a 3D drum picker
//   Navigation  — folder tabs merging into their pane, a rotating cube,
//                 a master/detail push stack, a disclosure file tree
//   Toggles     — slide-to-confirm, a pull-chain lamp, a hinged safety
//                 cover, two meshed gears
//
// Roots stay visible at rest, none is position:absolute, background tiles
// keep to the 240px-wide rounded-tile convention, and every infinite
// keyframe rests on a sensible 100% stop.

export function generateV14B(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Backgrounds                                                         */
  /* ------------------------------------------------------------------ */

  /* BG1. Circuit board — right-angle copper traces with current pulses */
  {
    const c = cls('v14-bg-circuit')
    const html = `<div class="${c}"><b class="ic"></b><i class="t1"></i><i class="t2"></i><i class="t3"></i><i class="t4"></i><u class="p1"></u><u class="p2"></u><u class="p3"></u><u class="p4"></u><s class="s1"></s><s class="s2"></s><s class="s3"></s></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  overflow: hidden;
  background-color: #04141d;
  background-image: radial-gradient(rgba(56,189,248,0.13) 1px, transparent 1.6px);
  background-size: 16px 16px;
  box-shadow: inset 0 0 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(14,116,144,0.5);
}
.${c} .ic {
  position: absolute;
  left: 96px;
  top: 52px;
  width: 48px;
  height: 36px;
  border-radius: 3px;
  background: linear-gradient(160deg, #0d3140, #07202b);
  box-shadow: inset 0 0 0 1px rgba(34,211,238,0.35);
}
.${c} .ic::before, .${c} .ic::after {
  content: '';
  position: absolute;
  top: 4px;
  width: 8px;
  height: 28px;
  background: repeating-linear-gradient(180deg, #0e7490 0 4px, transparent 4px 9px);
}
.${c} .ic::before { left: -8px; }
.${c} .ic::after { right: -8px; }
.${c} i {
  position: absolute;
  border-color: #0e7490;
  border-style: solid;
  border-width: 0;
}
.${c} .t1 {
  left: 22px;
  top: 34px;
  width: 74px;
  height: 74px;
  border-left-width: 2px;
  border-top-width: 2px;
  border-top-left-radius: 14px;
}
.${c} .t2 { left: 144px; top: 60px; width: 72px; height: 2px; background: #0e7490; }
.${c} .t3 {
  left: 144px;
  top: 78px;
  width: 60px;
  height: 40px;
  border-top-width: 2px;
  border-right-width: 2px;
  border-top-right-radius: 14px;
}
.${c} .t4 { left: 22px; top: 106px; width: 118px; height: 2px; background: #0e7490; }
.${c} u {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #06232e;
  box-shadow: 0 0 0 2px #22d3ee;
}
.${c} .p1 { left: 91px; top: 30px; }
.${c} .p2 { left: 211px; top: 56px; }
.${c} .p3 { left: 199px; top: 113px; }
.${c} .p4 { left: 135px; top: 102px; }
.${c} s {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cffafe;
  box-shadow: 0 0 9px 3px rgba(34,211,238,0.85);
  opacity: 0;
}
.${c} .s1 { animation: ${c}-a 3.6s ease-in-out infinite; }
.${c} .s2 { animation: ${c}-b 3.6s ease-in-out infinite -1.2s; }
.${c} .s3 { animation: ${c}-d 3.6s ease-in-out infinite -2.4s; }
@keyframes ${c}-a {
  0%        { left: 20px; top: 100px; opacity: 0; }
  10%       { left: 20px; top: 90px;  opacity: 1; }
  45%       { left: 20px; top: 32px;  opacity: 1; }
  88%, 100% { left: 93px; top: 32px;  opacity: 1; }
}
@keyframes ${c}-b {
  0%        { left: 201px; top: 110px; opacity: 0; }
  10%       { left: 201px; top: 104px; opacity: 1; }
  50%       { left: 201px; top: 76px;  opacity: 1; }
  90%, 100% { left: 146px; top: 76px;  opacity: 1; }
}
@keyframes ${c}-d {
  0%        { left: 214px; top: 58px; opacity: 0; }
  12%       { left: 206px; top: 58px; opacity: 1; }
  90%, 100% { left: 146px; top: 58px; opacity: 1; }
}`
    add(mk({
      name: 'Circuit Trace Board',
      category: 'Backgrounds',
      description: 'A printed-circuit field of right-angle copper traces, solder pads and a pinned chip, with bright current pulses that run each trace and stop on the pad at its end.',
      html, css,
      tags: ['circuit', 'pcb', 'traces', 'pulse', 'tech'],
    }))
  }

  /* BG2. Truchet maze — quarter-arc tiles joining into continuous loops */
  {
    const c = cls('v14-bg-truchet')
    const cells = Array.from({ length: 18 }, () => '<i></i>').join('')
    const flipped = [1, 3, 4, 8, 9, 11, 14, 16, 17]
    const flipSel = flipped.map((n) => `.${c} i:nth-child(${n})`).join(', ')
    const delays = Array.from({ length: 18 }, (_, i) => {
      const d = ((i % 6) + Math.floor(i / 6)) * 0.42
      return `.${c} i:nth-child(${i + 1})::before, .${c} i:nth-child(${i + 1})::after { animation-delay: -${d.toFixed(2)}s; }`
    }).join('\n')
    const html = `<div class="${c}">${cells}</div>`
    const css = `.${c} {
  display: grid;
  grid-template-columns: repeat(6, 40px);
  grid-auto-rows: 40px;
  width: 240px;
  height: 120px;
  border-radius: 0.75rem;
  overflow: hidden;
  background: radial-gradient(circle at 30% 20%, #10243b, #050b16 75%);
  box-shadow: 0 0 0 1px rgba(56,189,248,0.25);
}
.${c} i {
  position: relative;
  display: block;
  overflow: hidden;
}
.${c} i::before, .${c} i::after {
  content: '';
  position: absolute;
  width: 43px;
  height: 43px;
  border: 3px solid rgba(56,189,248,0.28);
  border-radius: 50%;
  animation: ${c}-flow 7.6s ease-in-out infinite;
}
.${c} i::before { left: -21.5px; top: -21.5px; }
.${c} i::after { right: -21.5px; bottom: -21.5px; }
${flipSel} { transform: rotate(90deg); }
${delays}
@keyframes ${c}-flow {
  0%, 100% { border-color: rgba(56,189,248,0.28); }
  46%      { border-color: rgba(165,243,252,0.95); }
}`
    add(mk({
      name: 'Truchet Arc Maze',
      category: 'Backgrounds',
      description: 'Quarter-circle arcs tiled in two alternating orientations so their ends meet across every cell edge, forming one continuous looping labyrinth that a wave of brightness travels through diagonally.',
      tags: ['truchet', 'maze', 'arcs', 'tiling', 'labyrinth'],
      html, css,
    }))
  }

  /* BG3. Basket weave — warp and weft ribbons passing over and under */
  {
    const c = cls('v14-bg-weave')
    const html = `<div class="${c}"><span class="w"><b class="v"></b><b class="h"></b><b class="v ov"></b></span></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #060e1a;
  box-shadow: inset 0 0 26px rgba(0,0,0,0.75), 0 0 0 1px rgba(148,163,184,0.2);
}
.${c} .w {
  position: absolute;
  left: -40px;
  top: -40px;
  width: 320px;
  height: 220px;
  animation: ${c}-drift 16s linear infinite;
}
.${c} b {
  position: absolute;
  inset: 0;
  display: block;
}
.${c} .h {
  background: repeating-linear-gradient(180deg,
    #0a1e33 0 1px,
    #1d4f7c 1px 8px,
    #163d61 8px 20px,
    #0b2036 20px 23px,
    transparent 23px 40px);
}
.${c} .v {
  background: repeating-linear-gradient(90deg,
    #0c2036 0 1px,
    #2b6fa8 1px 8px,
    #1f5583 8px 20px,
    #0d2540 20px 23px,
    transparent 23px 40px);
}
.${c} .ov {
  -webkit-mask-image: repeating-conic-gradient(#000 0% 25%, transparent 0% 50%);
  -webkit-mask-size: 80px 80px;
  mask-image: repeating-conic-gradient(#000 0% 25%, transparent 0% 50%);
  mask-size: 80px 80px;
}
@keyframes ${c}-drift {
  from { transform: translate(0, 0); }
  to   { transform: translate(40px, 40px); }
}`
    add(mk({
      name: 'Basket Weave Ribbons',
      category: 'Backgrounds',
      description: 'Horizontal and vertical ribbons crossing in a real over-under basket weave, the vertical strand masked in a checkerboard so it dives beneath the horizontal one at every other junction while the whole cloth creeps diagonally.',
      html, css,
      tags: ['weave', 'basket', 'ribbons', 'over-under', 'fabric'],
    }))
  }

  /* BG4. Venetian blinds — slats rotating open over a lit window */
  {
    const c = cls('v14-bg-blinds')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  overflow: hidden;
  perspective: 460px;
  background:
    radial-gradient(circle at 76% 30%, #fef9c3 0 15px, rgba(254,240,138,0.55) 15px 21px, transparent 34px),
    linear-gradient(180deg, #0c4a6e 0%, #0284c7 52%, #7dd3fc 100%);
  box-shadow: inset 0 0 0 1px rgba(148,163,184,0.25);
}
.${c} i {
  flex: 1;
  display: block;
  transform-origin: center center;
  background: linear-gradient(180deg, #9fb0c6 0%, #8496ae 34%, #6c7e97 68%, #55647c 100%);
  border-top: 1px solid rgba(241,245,249,0.6);
  border-bottom: 1px solid rgba(15,23,42,0.7);
  animation: ${c}-tilt 5.4s ease-in-out infinite;
}
.${c} i:nth-child(2) { animation-delay: -0.16s; }
.${c} i:nth-child(3) { animation-delay: -0.32s; }
.${c} i:nth-child(4) { animation-delay: -0.48s; }
.${c} i:nth-child(5) { animation-delay: -0.64s; }
.${c} i:nth-child(6) { animation-delay: -0.8s; }
.${c} i:nth-child(7) { animation-delay: -0.96s; }
@keyframes ${c}-tilt {
  0%, 100% { transform: rotateX(-64deg); filter: brightness(1.3); }
  42%      { transform: rotateX(0deg);   filter: brightness(0.85); }
}`
    add(mk({
      name: 'Venetian Blind Slats',
      category: 'Backgrounds',
      description: 'Seven slats hinged on their own horizontal axes that tilt shut and swing open again one after another, letting a lit sky and its low sun show through the gaps as they turn.',
      html, css,
      tags: ['blinds', 'slats', 'rotate', 'window', 'perspective'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Inputs & Hover                                                      */
  /* ------------------------------------------------------------------ */

  /* IN1. Card flip — the security-code field turns the card to its back */
  {
    const c = cls('v14-in-cardflip')
    const html = `<div class="${c}"><div class="s"><div class="f"><i class="chip"></i><b>4242&nbsp;&nbsp;4242&nbsp;&nbsp;4242&nbsp;&nbsp;4242</b><em>A. NAKAMURA<u>08/29</u></em></div><div class="b"><i class="mag"></i><span class="sig">731</span><em class="hint">security code</em></div></div><label class="r"><span>CVC</span><input type="text" value="731" /></label></div>`
    const css = `.${c} {
  display: grid;
  gap: 0.5rem;
  width: 196px;
  perspective: 800px;
}
.${c} .s {
  position: relative;
  height: 100px;
  transform-style: preserve-3d;
  transition: transform 0.62s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .f, .${c} .b {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 0.6rem;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}
.${c} .f {
  padding: 0.55rem 0.7rem;
  background: linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 55%, #22d3ee 100%);
}
.${c} .b {
  transform: rotateY(180deg);
  background: linear-gradient(135deg, #1e293b, #0b1220);
}
.${c} .chip {
  display: block;
  width: 26px;
  height: 19px;
  border-radius: 3px;
  background: linear-gradient(140deg, #fde68a, #b45309);
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.25);
}
.${c} .f b {
  display: block;
  margin-top: 1.4rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.66rem;
  letter-spacing: 0.02em;
  color: #f0f9ff;
}
.${c} .f em {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-style: normal;
  font-size: 0.55rem;
  letter-spacing: 0.08em;
  color: rgba(240,249,255,0.85);
}
.${c} .mag { display: block; height: 26px; margin-top: 0.6rem; background: #020617; }
.${c} .sig {
  display: block;
  width: 96px;
  margin: 0.6rem 0.7rem 0 auto;
  padding: 0.15rem 0.4rem;
  text-align: right;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  color: #0f172a;
  background: repeating-linear-gradient(90deg, #e2e8f0 0 6px, #cbd5e1 6px 12px);
  border-radius: 2px;
}
.${c} .hint {
  display: block;
  margin: 0.25rem 0.7rem 0;
  text-align: right;
  font-style: normal;
  font-size: 0.5rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}
.${c} .r {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.3rem 0.55rem;
  background: #0b1220;
  border: 1px solid #334155;
  border-radius: 0.45rem;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.${c} .r span {
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  color: #64748b;
}
.${c} .r input {
  width: 100%;
  min-width: 0;
  font: inherit;
  font-size: 0.78rem;
  letter-spacing: 0.2em;
  color: #e2e8f0;
  background: none;
  border: none;
  outline: none;
}
.${c}:hover .r, .${c}:focus-within .r { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.16); }
.${c}:hover .s, .${c}:focus-within .s { transform: rotateY(180deg); }`
    add(mk({
      name: 'Card Flip CVC Field',
      category: 'Inputs & Hover',
      description: 'A payment form whose card preview turns a half rotation onto its magnetic-stripe back the moment the security-code field is reached, so the number you are being asked for is the one facing you.',
      html, css,
      tags: ['payment', 'flip', '3d', 'cvc', 'field'],
    }))
  }

  /* IN2. Compare wipe — a divider sweeps between before and after */
  {
    const c = cls('v14-in-compare')
    const html = `<div class="${c}"><div class="a"><i></i><i></i><i></i><b>AFTER</b></div><div class="b"><i></i><i></i><i></i><b>BEFORE</b></div><span class="d"><em>&#8942;</em></span></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 140px;
  border-radius: 0.7rem;
  overflow: hidden;
  background: #0b1220;
  box-shadow: 0 0 0 1px rgba(148,163,184,0.22);
}
.${c} .a, .${c} .b {
  position: absolute;
  inset: 0;
  padding: 0.85rem 0.9rem;
}
.${c} .a { background: linear-gradient(140deg, #0f766e 0%, #0ea5e9 60%, #6366f1 100%); }
.${c} .b {
  background: #111827;
  clip-path: inset(0 50% 0 0);
  transition: clip-path 0.55s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} i {
  display: block;
  height: 10px;
  margin-bottom: 8px;
  border-radius: 3px;
}
.${c} .a i { background: rgba(255,255,255,0.9); box-shadow: 0 2px 8px rgba(15,23,42,0.35); }
.${c} .a i:nth-child(1) { width: 62%; height: 16px; }
.${c} .a i:nth-child(2) { width: 88%; opacity: 0.75; }
.${c} .a i:nth-child(3) { width: 70%; opacity: 0.6; }
.${c} .b i { border: 1px dashed #475569; background: repeating-linear-gradient(45deg, #1e293b 0 4px, #172033 4px 8px); }
.${c} .b i:nth-child(1) { width: 62%; height: 16px; }
.${c} .b i:nth-child(2) { width: 88%; }
.${c} .b i:nth-child(3) { width: 70%; }
.${c} b {
  position: absolute;
  bottom: 10px;
  padding: 0.15rem 0.45rem;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  border-radius: 999px;
}
.${c} .a b { right: 10px; color: #082f49; background: rgba(255,255,255,0.9); }
.${c} .b b { left: 10px; color: #94a3b8; background: #1e293b; }
.${c} .d {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  margin-left: -1px;
  background: #e2e8f0;
  box-shadow: 0 0 12px rgba(15,23,42,0.7);
  transition: left 0.55s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .d em {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin: -12px 0 0 -12px;
  font-style: normal;
  font-size: 0.8rem;
  color: #0f172a;
  background: #e2e8f0;
  border-radius: 50%;
  box-shadow: 0 3px 8px rgba(0,0,0,0.5);
}
.${c}:hover .b { clip-path: inset(0 94% 0 0); }
.${c}:hover .d { left: 6%; }`
    add(mk({
      name: 'Compare Wipe Tile',
      category: 'Inputs & Hover',
      description: 'Two versions of the same layout stacked in one frame with a draggable-looking divider between them, which sweeps to the left edge on hover and wipes the greyed-out before state off the finished design.',
      html, css,
      tags: ['compare', 'before-after', 'wipe', 'divider', 'reveal'],
    }))
  }

  /* IN3. Peeling corner — the sheet lifts to show what is filed beneath */
  {
    const c = cls('v14-in-peel')
    const html = `<div class="${c}"><div class="u"><b>&#9733;</b><span>Saved</span></div><div class="s"><b>Aurora Panel</b><i></i><i></i><em>components / surface</em></div><i class="c"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 210px;
  height: 132px;
  border-radius: 0.7rem;
  overflow: hidden;
  background: #0b1220;
  box-shadow: 0 0 0 1px rgba(148,163,184,0.2);
}
.${c} .u {
  position: absolute;
  inset: 0;
  display: grid;
  align-content: end;
  justify-items: end;
  gap: 0.15rem;
  padding: 0.75rem 0.85rem;
  text-align: right;
  background: linear-gradient(135deg, #134e4a 0%, #0e7490 100%);
}
.${c} .u b { font-size: 0.9rem; line-height: 1; color: #ccfbf1; }
.${c} .u span { font-size: 0.66rem; letter-spacing: 0.06em; color: rgba(204,251,241,0.85); }
.${c} .s {
  position: absolute;
  inset: 0;
  padding: 0.8rem 0.9rem;
  background: linear-gradient(160deg, #1b2540, #131c31);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%);
  transition: clip-path 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .s b { display: block; font-size: 0.82rem; color: #e2e8f0; }
.${c} .s i {
  display: block;
  height: 7px;
  margin-top: 10px;
  border-radius: 3px;
  background: #27334d;
}
.${c} .s i:nth-of-type(1) { width: 78%; }
.${c} .s i:nth-of-type(2) { width: 56%; }
.${c} .s em {
  position: absolute;
  left: 0.9rem;
  bottom: 0.75rem;
  font-style: normal;
  font-size: 0.62rem;
  color: #64748b;
}
.${c} .c {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 20px;
  height: 20px;
  clip-path: polygon(0 0, 100% 0, 0 100%);
  background: linear-gradient(135deg, #475569 0%, #94a3b8 42%, #e2e8f0 78%, #f8fafc 100%);
  transition: width 0.45s cubic-bezier(0.4, 0, 0.2, 1), height 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c}:hover .s { clip-path: polygon(0 0, 100% 0, 100% calc(100% - 82px), calc(100% - 82px) 100%, 0 100%); }
.${c}:hover .c { width: 82px; height: 82px; }`
    add(mk({
      name: 'Peeling Corner Tile',
      category: 'Inputs & Hover',
      description: 'A card with a dog-eared corner that peels further back on hover, the folded flap turning over to show the pale reverse of the sheet while the teal saved-to-library mark filed beneath it is uncovered.',
      html, css,
      tags: ['peel', 'corner', 'paper', 'reveal', 'fold'],
    }))
  }

  /* IN4. Drum picker — a value wheel curving away on a 3D cylinder */
  {
    const c = cls('v14-in-drum')
    const html = `<label class="${c}"><span class="k">Duration</span><span class="w"><i class="band"></i><span class="d"><span>5 min</span><span>10 min</span><span>15 min</span><span>30 min</span><span>45 min</span><span>60 min</span><span>90 min</span></span><i class="fade"></i></span></label>`
    const css = `.${c} {
  display: grid;
  gap: 0.35rem;
  width: 132px;
  cursor: pointer;
}
.${c} .k {
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
}
.${c} .w {
  position: relative;
  display: block;
  height: 108px;
  overflow: hidden;
  border: 1px solid #334155;
  border-radius: 0.55rem;
  background: #0b1220;
  perspective: 420px;
}
.${c} .band {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 43px;
  height: 22px;
  border-top: 1px solid rgba(56,189,248,0.6);
  border-bottom: 1px solid rgba(56,189,248,0.6);
  background: rgba(56,189,248,0.09);
}
.${c} .d {
  position: absolute;
  inset: 0;
  display: block;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .d > span {
  position: absolute;
  left: 0;
  right: 0;
  top: 43px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  font-size: 0.78rem;
  color: #7c8aa0;
  backface-visibility: hidden;
  transition: color 0.3s ease, font-weight 0.3s ease;
}
.${c} .d > span:nth-child(1) { transform: rotateX(-60deg) translateZ(62px); }
.${c} .d > span:nth-child(2) { transform: rotateX(-40deg) translateZ(62px); }
.${c} .d > span:nth-child(3) { transform: rotateX(-20deg) translateZ(62px); }
.${c} .d > span:nth-child(4) { transform: rotateX(0deg) translateZ(62px); }
.${c} .d > span:nth-child(5) { transform: rotateX(20deg) translateZ(62px); }
.${c} .d > span:nth-child(6) { transform: rotateX(40deg) translateZ(62px); }
.${c} .d > span:nth-child(7) { transform: rotateX(60deg) translateZ(62px); }
.${c} .d > span:nth-child(4) { color: #e2e8f0; font-weight: 600; }
.${c} .fade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, #0b1220 0%, rgba(11,18,32,0) 34%, rgba(11,18,32,0) 66%, #0b1220 100%);
}
.${c}:hover .w { border-color: #38bdf8; }
.${c}:hover .d { transform: rotateX(-20deg); }
.${c}:hover .d > span:nth-child(4) { color: #7c8aa0; font-weight: 400; }
.${c}:hover .d > span:nth-child(5) { color: #e2e8f0; font-weight: 600; }`
    add(mk({
      name: 'Drum Wheel Picker Field',
      category: 'Inputs & Hover',
      description: 'A value picker whose options are pasted around a real cylinder in three dimensions, curving away above and below the selection band and rolling one notch to the next value on hover.',
      html, css,
      tags: ['picker', 'wheel', 'drum', '3d', 'select'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Navigation & Menus                                                  */
  /* ------------------------------------------------------------------ */

  /* NAV1. Folder tabs — the active tab welds itself onto the pane */
  {
    const c = cls('v14-nav-folder')
    const html = `<div class="${c}"><div class="ts"><a class="t on">Overview</a><a class="t">Assets</a><a class="t">History</a><a class="t">Share</a></div><div class="pn"><b>Overview</b><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  position: relative;
  width: 252px;
  font-size: 0.72rem;
}
.${c} .ts {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  padding-left: 10px;
}
.${c} .t {
  position: relative;
  z-index: 1;
  padding: 0.3rem 0.55rem 0.4rem;
  color: #8ea0ba;
  background: #141d33;
  border: 1px solid #253049;
  border-bottom: none;
  border-radius: 0.5rem 0.5rem 0 0;
  transform: translateY(5px);
  cursor: pointer;
  transition: transform 0.22s ease, background 0.22s ease, color 0.22s ease;
}
.${c} .t:hover { z-index: 2; transform: translateY(1px); background: #1b263f; color: #cbd5e1; }
.${c} .on {
  z-index: 3;
  color: #e2e8f0;
  background: #1b263f;
  border-top: 2px solid #38bdf8;
  transform: translateY(0);
}
.${c} .on::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: #1b263f;
}
.${c} .pn {
  position: relative;
  z-index: 2;
  height: 78px;
  padding: 0.6rem 0.75rem;
  background: #1b263f;
  border: 1px solid #253049;
  border-radius: 0 0.5rem 0.5rem 0.5rem;
}
.${c} .pn b { display: block; font-size: 0.78rem; color: #e2e8f0; }
.${c} .pn i {
  display: block;
  height: 7px;
  margin-top: 9px;
  border-radius: 3px;
  background: #27334d;
}
.${c} .pn i:nth-of-type(1) { width: 84%; }
.${c} .pn i:nth-of-type(2) { width: 62%; }
.${c} .pn i:nth-of-type(3) { width: 40%; }`
    add(mk({
      name: 'Folder Tab Stack',
      category: 'Navigation & Menus',
      description: 'Manila-folder tabs stacked at different depths where the selected one rises to the front and paints over the pane border so tab and panel read as a single sheet, while the others sit sunk behind until hovered.',
      html, css,
      tags: ['tabs', 'folder', 'stack', 'panel', 'z-index'],
    }))
  }

  /* NAV2. Cube nav — sections on the faces of a rotating solid */
  {
    const c = cls('v14-nav-cube')
    const html = `<div class="${c}"><div class="cb"><span class="fr"><b>&#9678;</b>Overview</span><span class="ri"><b>&#9635;</b>Projects</span><span class="bk"><b>&#9737;</b>Team</span><span class="le"><b>&#9993;</b>Contact</span><span class="tp"></span></div></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 168px;
  height: 152px;
  perspective: 620px;
  background: radial-gradient(ellipse at 50% 84%, rgba(56,189,248,0.22), transparent 62%);
}
.${c} .cb {
  position: relative;
  width: 94px;
  height: 94px;
  transform-style: preserve-3d;
  transform: rotateX(-14deg) rotateY(-26deg);
  transition: transform 0.72s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .cb span {
  position: absolute;
  inset: 0;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  color: #e2e8f0;
  background: linear-gradient(150deg, rgba(30,41,59,0.96), rgba(12,20,36,0.96));
  border: 1px solid rgba(56,189,248,0.45);
  border-radius: 0.35rem;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.${c} .cb b { font-size: 1.1rem; font-weight: 400; color: #7dd3fc; }
.${c} .fr { transform: translateZ(47px); }
.${c} .ri { transform: rotateY(90deg) translateZ(47px); }
.${c} .bk { transform: rotateY(180deg) translateZ(47px); }
.${c} .le { transform: rotateY(-90deg) translateZ(47px); }
.${c} .tp {
  transform: rotateX(90deg) translateZ(47px);
  background: linear-gradient(150deg, rgba(56,189,248,0.3), rgba(30,41,59,0.9));
}
.${c}:hover .cb { transform: rotateX(-14deg) rotateY(-116deg); }`
    add(mk({
      name: 'Cube Face Nav',
      category: 'Navigation & Menus',
      description: 'A menu printed on the four sides of a solid cube standing on a lit floor, which turns a full quarter on hover so the next section swings round to face you and the current one rotates away.',
      html, css,
      tags: ['cube', '3d', 'rotate', 'menu', 'faces'],
    }))
  }

  /* NAV3. Push stack — the detail view shoves the list off to the left */
  {
    const c = cls('v14-nav-push')
    const html = `<div class="${c}"><div class="l"><b>Workspace</b><a>Members<span>&#8250;</span></a><a>Billing<span>&#8250;</span></a><a>API tokens<span>&#8250;</span></a></div><div class="dt"><b><em>&#8249;</em>Members</b><a>Ada Lovelace</a><a>Grace Hopper</a><a>Alan Turing</a></div></div>`
    const css = `.${c} {
  position: relative;
  width: 226px;
  height: 134px;
  overflow: hidden;
  background: #0f172a;
  border: 1px solid #253049;
  border-radius: 0.7rem;
}
.${c} .l, .${c} .dt {
  position: absolute;
  inset: 0;
  padding: 0.5rem 0.55rem;
  transition: transform 0.42s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.32s ease, filter 0.32s ease;
}
.${c} .dt {
  background: #141d33;
  border-left: 1px solid #2b3852;
  box-shadow: -12px 0 22px rgba(0,0,0,0.5);
  transform: translateX(101%);
}
.${c} b {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0 0.35rem 0.35rem;
  font-size: 0.72rem;
  color: #e2e8f0;
  border-bottom: 1px solid #253049;
}
.${c} b em { font-style: normal; font-size: 1rem; color: #38bdf8; }
.${c} a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.15rem;
  padding: 0.3rem 0.35rem;
  font-size: 0.74rem;
  color: #94a3b8;
  border-radius: 0.3rem;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} a:hover { background: #1e293b; color: #f1f5f9; }
.${c} a span { color: #475569; }
.${c}:hover .l { transform: translateX(-26%); opacity: 0.3; filter: blur(1px); }
.${c}:hover .dt { transform: translateX(0); }`
    add(mk({
      name: 'Push Detail Stack',
      category: 'Navigation & Menus',
      description: 'A master list that slides a short way left and dims as the detail panel it points at pushes in from the right edge with a back chevron, the two levels moving together like a phone navigation stack.',
      html, css,
      tags: ['master-detail', 'push', 'stack', 'drilldown', 'panel'],
    }))
  }

  /* NAV4. File tree — a disclosure branch unfolding along its guide line */
  {
    const c = cls('v14-nav-tree')
    const html = `<nav class="${c}"><div class="r op"><i class="cv"></i><i class="fd"></i>src</div><div class="ch"><div class="r"><i class="fl"></i>index.tsx</div><div class="r ac"><i class="fl"></i>app.tsx</div></div><div class="r cl"><i class="cv"></i><i class="fd"></i>components</div><div class="ch fold"><div class="r"><i class="fl"></i>card.tsx</div><div class="r"><i class="fl"></i>nav.tsx</div></div><div class="r"><i class="fl"></i>readme.md</div></nav>`
    const css = `.${c} {
  width: 190px;
  padding: 0.45rem 0.5rem;
  font-size: 0.72rem;
  background: #0d1526;
  border: 1px solid #253049;
  border-radius: 0.55rem;
}
.${c} .r {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  height: 20px;
  padding: 0 0.3rem;
  color: #94a3b8;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} .r:hover { background: #172033; color: #e2e8f0; }
.${c} .ac { color: #7dd3fc; background: #16243c; }
.${c} .cv {
  width: 7px;
  height: 8px;
  background: #64748b;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
  transition: transform 0.28s ease;
}
.${c} .op .cv { transform: rotate(90deg); }
.${c} .fd {
  width: 13px;
  height: 10px;
  border-radius: 1px 2px 2px 2px;
  background: #38bdf8;
  clip-path: polygon(0 0, 46% 0, 58% 22%, 100% 22%, 100% 100%, 0 100%);
}
.${c} .fl {
  width: 10px;
  height: 12px;
  background: #475569;
  clip-path: polygon(0 0, 68% 0, 100% 28%, 100% 100%, 0 100%);
}
.${c} .ch {
  margin-left: 0.62rem;
  padding-left: 0.5rem;
  border-left: 1px solid #253049;
}
.${c} .fold {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.34s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.24s ease;
}
.${c}:hover .cl .cv { transform: rotate(90deg); }
.${c}:hover .fold { max-height: 42px; opacity: 1; }`
    add(mk({
      name: 'Disclosure Tree Nav',
      category: 'Navigation & Menus',
      description: 'A file tree with indent guide lines down each branch, where the collapsed folder turns its caret a quarter and rolls its children open along the guide while the tree grows to make room.',
      html, css,
      tags: ['tree', 'explorer', 'disclosure', 'folders', 'expand'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Toggles & Switches                                                  */
  /* ------------------------------------------------------------------ */

  /* TG1. Slide to confirm — the knob has to travel the whole track */
  {
    const c = cls('v14-tg-slide')
    const html = `<label class="${c}"><input type="checkbox" /><span class="t"><i class="fl"></i><b class="pr">Slide to publish</b><b class="dn">Published</b><em class="kn">&#8250;</em></span></label>`
    const css = `.${c} {
  display: inline-flex;
  cursor: pointer;
}
.${c} input { position: absolute; opacity: 0; pointer-events: none; }
.${c} .t {
  position: relative;
  display: block;
  width: 212px;
  height: 44px;
  overflow: hidden;
  background: #131c31;
  border: 1px solid #2b3852;
  border-radius: 999px;
}
.${c} .fl {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #0f766e, #22c55e);
  transform: translateX(-100%);
  transition: transform 0.52s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} b {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding-left: 34px;
  font-size: 0.76rem;
  font-weight: 600;
  transition: opacity 0.28s ease;
}
.${c} .pr {
  color: transparent;
  background: linear-gradient(90deg, #5b6b83 34%, #e2e8f0 50%, #5b6b83 66%);
  background-size: 260% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ${c}-shine 2.6s linear infinite;
}
.${c} .dn { padding-left: 0; padding-right: 34px; color: #052e16; opacity: 0; }
.${c} .kn {
  position: absolute;
  top: 4px;
  left: 4px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  font-style: normal;
  font-size: 1.1rem;
  color: #0f172a;
  background: #e2e8f0;
  border-radius: 50%;
  box-shadow: 0 2px 7px rgba(0,0,0,0.55);
  transition: transform 0.52s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease 0.3s;
}
.${c} .kn::after {
  content: '\\2713';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  color: #15803d;
  opacity: 0;
  transition: opacity 0.2s ease 0.3s;
}
@keyframes ${c}-shine {
  from { background-position: 160% 0; }
  to   { background-position: -60% 0; }
}
.${c}:hover .fl, .${c} input:checked + .t .fl { transform: translateX(0); }
.${c}:hover .kn, .${c} input:checked + .t .kn { transform: translateX(168px); color: transparent; }
.${c}:hover .kn::after, .${c} input:checked + .t .kn::after { opacity: 1; }
.${c}:hover .pr, .${c} input:checked + .t .pr { opacity: 0; }
.${c}:hover .dn, .${c} input:checked + .t .dn { opacity: 1; }`
    add(mk({
      name: 'Slide To Confirm Switch',
      category: 'Toggles & Switches',
      description: 'A deliberate confirmation control whose knob has to travel the full length of the track, dragging a green fill behind it while the shimmering prompt gives way to the completed label.',
      html, css,
      tags: ['slide', 'confirm', 'knob', 'track', 'commit'],
    }))
  }

  /* TG2. Pull chain — a ball chain that stretches and lights the bulb */
  {
    const c = cls('v14-tg-pullchain')
    const html = `<label class="${c}"><input type="checkbox" /><span class="lp"><i class="pl"></i><i class="st"></i><i class="bb"></i><i class="cn"></i><i class="ch"><u></u></i></span></label>`
    const css = `.${c} {
  display: inline-flex;
  cursor: pointer;
}
.${c} input { position: absolute; opacity: 0; pointer-events: none; }
.${c} .lp {
  position: relative;
  display: block;
  width: 154px;
  height: 152px;
}
.${c} .pl {
  position: absolute;
  left: 50%;
  top: 0;
  width: 56px;
  height: 9px;
  margin-left: -28px;
  border-radius: 0 0 7px 7px;
  background: linear-gradient(180deg, #64748b, #1e293b);
}
.${c} .st {
  position: absolute;
  left: 50%;
  top: 9px;
  width: 4px;
  height: 24px;
  margin-left: -2px;
  background: #334155;
}
.${c} .bb {
  position: absolute;
  left: 50%;
  top: 33px;
  width: 36px;
  height: 46px;
  margin-left: -18px;
  border-radius: 50% 50% 46% 46% / 58% 58% 42% 42%;
  background: radial-gradient(circle at 38% 30%, #4b5768, #1a2333);
  transition: background 0.35s ease, box-shadow 0.35s ease;
}
.${c} .bb::before {
  content: '';
  position: absolute;
  left: 50%;
  top: -10px;
  width: 18px;
  height: 11px;
  margin-left: -9px;
  border-radius: 2px 2px 0 0;
  background: repeating-linear-gradient(180deg, #94a3b8 0 2px, #334155 2px 4px);
}
.${c} .bb::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 15px;
  width: 14px;
  height: 13px;
  margin-left: -7px;
  border: 2px solid #64748b;
  border-bottom: none;
  border-radius: 50% 50% 0 0;
  transition: border-color 0.35s ease;
}
.${c} .cn {
  position: absolute;
  left: 50%;
  top: 78px;
  width: 128px;
  height: 74px;
  margin-left: -64px;
  clip-path: polygon(38% 0, 62% 0, 100% 100%, 0 100%);
  background: linear-gradient(180deg, rgba(253,224,71,0.4), rgba(253,224,71,0));
  opacity: 0;
  transition: opacity 0.35s ease;
}
.${c} .ch {
  position: absolute;
  left: 50%;
  top: 44px;
  width: 3px;
  height: 50px;
  margin-left: 30px;
  background: repeating-linear-gradient(180deg, #cbd5e1 0 3px, #64748b 3px 6px);
  transform-origin: top center;
  transition: transform 0.3s cubic-bezier(0.34, 1.45, 0.64, 1);
}
.${c} .ch u {
  position: absolute;
  left: 50%;
  bottom: -10px;
  width: 10px;
  height: 12px;
  margin-left: -5px;
  border-radius: 4px;
  background: linear-gradient(180deg, #f1f5f9, #94a3b8);
}
.${c}:hover .ch, .${c} input:checked + .lp .ch { transform: scaleY(1.24); }
.${c}:hover .bb, .${c} input:checked + .lp .bb {
  background: radial-gradient(circle at 38% 30%, #fefce8, #fde047 58%, #f59e0b 100%);
  box-shadow: 0 0 30px 8px rgba(253,224,71,0.4);
}
.${c}:hover .bb::after, .${c} input:checked + .lp .bb::after { border-color: #fffbeb; }
.${c}:hover .cn, .${c} input:checked + .lp .cn { opacity: 1; }`
    add(mk({
      name: 'Pull Chain Light Switch',
      category: 'Toggles & Switches',
      description: 'A ceiling lamp with a beaded pull chain that stretches downward when you take hold of it, lighting the bulb to amber and dropping a soft cone of light onto the floor below.',
      html, css,
      tags: ['pull-chain', 'lamp', 'bulb', 'light', 'physical'],
    }))
  }

  /* TG3. Safety cover — a hinged guard that has to be lifted first */
  {
    const c = cls('v14-tg-guard')
    const html = `<label class="${c}"><input type="checkbox" /><span class="pn"><i class="sl"></i><i class="lv"></i><i class="ld"></i><b class="lb">ARMED</b><i class="cv"><s>LIFT COVER</s></i></span></label>`
    const css = `.${c} {
  display: inline-flex;
  cursor: pointer;
}
.${c} input { position: absolute; opacity: 0; pointer-events: none; }
.${c} .pn {
  position: relative;
  display: block;
  width: 168px;
  height: 100px;
  border-radius: 0.6rem;
  background: linear-gradient(180deg, #253145, #111a2b);
  border: 1px solid #3a4966;
  box-shadow: inset 0 1px 0 rgba(226,232,240,0.1);
  perspective: 520px;
}
.${c} .sl {
  position: absolute;
  left: 26px;
  top: 22px;
  width: 30px;
  height: 56px;
  border-radius: 15px;
  background: #070c16;
  box-shadow: inset 0 3px 7px rgba(0,0,0,0.85);
}
.${c} .lv {
  position: absolute;
  left: 29px;
  top: 49px;
  width: 24px;
  height: 26px;
  border-radius: 12px;
  background: linear-gradient(180deg, #e2e8f0, #64748b);
  box-shadow: 0 2px 5px rgba(0,0,0,0.6);
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .ld {
  position: absolute;
  right: 26px;
  top: 24px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3a2426;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.9);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}
.${c} .lb {
  position: absolute;
  right: 20px;
  bottom: 22px;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #55627a;
  transition: color 0.3s ease;
}
.${c} .cv {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 0.6rem;
  border: 1px solid #fca5a5;
  background: repeating-linear-gradient(135deg, #dc2626 0 9px, #991b1b 9px 18px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.5);
  transform-origin: top center;
  transform: rotateX(0deg);
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.${c} .cv s {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #fee2e2;
  text-decoration: none;
}
.${c}:hover .cv, .${c} input:checked + .pn .cv { transform: rotateX(-82deg); }
.${c}:hover .lv, .${c} input:checked + .pn .lv { transform: translateY(-26px); }
.${c}:hover .ld, .${c} input:checked + .pn .ld { background: #4ade80; box-shadow: 0 0 14px 4px rgba(74,222,128,0.55); }
.${c}:hover .lb, .${c} input:checked + .pn .lb { color: #86efac; }`
    add(mk({
      name: 'Safety Cover Switch',
      category: 'Toggles & Switches',
      description: 'A hazard-striped guard hinged along its top edge that swings up and away before the lever underneath can throw, at which point the lever rides to the top of its slot and the status lamp goes green.',
      html, css,
      tags: ['guard', 'cover', 'hinge', 'arm', 'safety'],
    }))
  }

  /* TG4. Gear mesh — two toothed wheels that engage and drive each other */
  {
    const c = cls('v14-tg-gears')
    const html = `<label class="${c}"><input type="checkbox" /><span class="mc"><i class="g1"></i><i class="g2"></i><b class="of">IDLE</b><b class="on">ENGAGED</b></span></label>`
    const css = `.${c} {
  display: inline-flex;
  cursor: pointer;
}
.${c} input { position: absolute; opacity: 0; pointer-events: none; }
.${c} .mc {
  position: relative;
  display: block;
  width: 186px;
  height: 104px;
  border-radius: 0.6rem;
  background: linear-gradient(180deg, #16203a, #0a1120);
  border: 1px solid #2b3852;
  box-shadow: inset 0 1px 0 rgba(226,232,240,0.07);
}
.${c} .g1, .${c} .g2 {
  position: absolute;
  border-radius: 50%;
  background: repeating-conic-gradient(#5c6b82 0deg 9deg, transparent 9deg 18deg);
  transition: filter 0.3s ease;
}
.${c} .g1::before, .${c} .g2::before {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 50%;
  background: linear-gradient(140deg, #58687f, #3b475c);
}
.${c} .g1::after, .${c} .g2::after {
  content: '';
  position: absolute;
  inset: 38%;
  border-radius: 50%;
  background: #0a1120;
  box-shadow: inset 0 0 0 2px #2b3852;
}
.${c} .g1 { left: 20px; top: 18px; width: 60px; height: 60px; }
.${c} .g2 { left: 69px; top: 47px; width: 44px; height: 44px; }
.${c} b {
  position: absolute;
  right: 16px;
  top: 50%;
  margin-top: -0.5rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  transition: opacity 0.28s ease;
}
.${c} .of { color: #64748b; }
.${c} .on { color: #5eead4; opacity: 0; }
@keyframes ${c}-cw  { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
@keyframes ${c}-ccw { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
.${c}:hover .g1, .${c} input:checked + .mc .g1 {
  background: repeating-conic-gradient(#22d3ee 0deg 9deg, transparent 9deg 18deg);
  animation: ${c}-cw 4.4s linear infinite;
}
.${c}:hover .g2, .${c} input:checked + .mc .g2 {
  background: repeating-conic-gradient(#22d3ee 0deg 9deg, transparent 9deg 18deg);
  animation: ${c}-ccw 3.2s linear infinite;
}
.${c}:hover .g1::before, .${c} input:checked + .mc .g1::before,
.${c}:hover .g2::before, .${c} input:checked + .mc .g2::before {
  background: linear-gradient(140deg, #0e7490, #164e63);
}
.${c}:hover .of, .${c} input:checked + .mc .of { opacity: 0; }
.${c}:hover .on, .${c} input:checked + .mc .on { opacity: 1; }`
    add(mk({
      name: 'Gear Mesh Toggle',
      category: 'Toggles & Switches',
      description: 'Two toothed wheels sitting idle in grey until the switch engages, when they take on cyan and turn against each other, the smaller one running faster as their teeth interlock.',
      html, css,
      tags: ['gears', 'mesh', 'machine', 'rotate', 'engage'],
    }))
  }
}
