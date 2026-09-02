// scripts/generate-effects-v14-g.mjs
//
// Fourteenth wave, part G: Micro-interactions (6), Filters & Blend
// Modes (4), Dividers & Separators (4), Badges & Tags (4).
//
// Micro-interactions is the category still genuinely short of shapes, so
// it takes six. Dividers & Separators and Badges & Tags are the two that
// scripts/check-catalog-focus.mts has sealed as shape-exhausted; the
// owner overruled that seal (every category gets covered, the baseline is
// re-accepted with --update downstream), but the seal is a fair warning
// that the obvious nouns are gone there. So the eight designs in those
// two groups were picked to be *structural* — they carry content, respond
// to state or change shape — rather than a fifth style of horizontal rule
// or a sixth pill.
//
//   Micro    — quantity odometer, segmented thumb that previews the move,
//              hold-to-confirm ring, hamburger→X morph, day/night switch,
//              table sort header
//   Filters  — ambient glow bled from a blurred duplicate, holographic
//              foil in color-dodge/hard-light, plus-lighter crossfade,
//              peer desaturation across a thumbnail strip
//   Dividers — the insert-block gap, a split-pane grip, a real
//              `column-rule` between flowing columns, a branch merge
//   Badges   — overflow group that unrolls its hidden tags, interlocking
//              chevron path tags, a checkable filter set that grows a
//              Clear chip, a graded A–E scale badge
//
// Assembly constraints as ever: roots visible at rest, never
// position:absolute on a root, infinite keyframes resting sensibly at
// their 100% stop, everything inside a ~300x180 dark preview.

export function generateV14G(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Micro-interactions                                                  */
  /* ------------------------------------------------------------------ */

  /* MI1. Quantity stepper — the digit rolls like an odometer wheel */
  {
    const c = cls('v14-mi-stepper')
    const html = `<div class="${c}"><button class="mn">−</button><span class="w"><span class="s"><b>1</b><b>2</b><b>3</b><b>4</b></span></span><button class="pl">+</button></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px;
  background: #131c31;
  border: 1px solid #253049;
  border-radius: 0.7rem;
  transition: border-color 0.25s ease;
}
.${c} button {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 0.5rem;
  background: #1b2740;
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
}
.${c} button:hover { background: #2563eb; color: #fff; }
.${c} button:active { transform: scale(0.88); }
.${c} .w {
  display: block;
  width: 38px;
  height: 26px;
  overflow: hidden;
}
.${c} .s {
  display: block;
  transform: translateY(-26px);
  transition: transform 0.34s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.${c} .s b {
  display: block;
  height: 26px;
  line-height: 26px;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 700;
  color: #e2e8f0;
  font-variant-numeric: tabular-nums;
}
.${c}:hover { border-color: #33507f; }
.${c}:has(.pl:hover) .s { transform: translateY(-52px); }
.${c}:has(.mn:hover) .s { transform: translateY(0); }`
    add(mk({
      name: 'Quantity Odometer Stepper',
      category: 'Micro-interactions',
      description: 'Quantity stepper whose figure lives on a vertical strip, so pointing at plus or minus rolls the next number up into the window like an odometer wheel before you have even clicked.',
      html, css,
      tags: ['stepper', 'quantity', 'odometer', 'roll', 'preview'],
    }))
  }

  /* MI2. Segmented control — the thumb previews the segment you point at */
  {
    const c = cls('v14-mi-segment')
    const html = `<div class="${c}"><span class="th"></span><label><input type="radio" name="${c}" checked /><b>Day</b></label><label><input type="radio" name="${c}" /><b>Week</b></label><label><input type="radio" name="${c}" /><b>Month</b></label></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 72px);
  padding: 4px;
  background: #131c31;
  border: 1px solid #253049;
  border-radius: 999px;
}
.${c} .th {
  position: absolute;
  left: 4px;
  top: 4px;
  bottom: 4px;
  width: 72px;
  border-radius: 999px;
  background: linear-gradient(180deg, #3b82f6, #2563eb);
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.45);
  transition: transform 0.34s cubic-bezier(0.5, 1.4, 0.5, 1);
}
.${c} label {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  height: 28px;
  cursor: pointer;
}
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} b {
  font-size: 0.75rem;
  font-weight: 600;
  color: #8fa3c0;
  transition: color 0.25s ease;
}
.${c}:has(label:nth-child(2) input:checked) .th { transform: translateX(0); }
.${c}:has(label:nth-child(3) input:checked) .th { transform: translateX(72px); }
.${c}:has(label:nth-child(4) input:checked) .th { transform: translateX(144px); }
.${c} label:has(input:checked) b { color: #ffffff; }
.${c}:hover:has(label:nth-child(2):hover) .th { transform: translateX(0); }
.${c}:hover:has(label:nth-child(3):hover) .th { transform: translateX(72px); }
.${c}:hover:has(label:nth-child(4):hover) .th { transform: translateX(144px); }
.${c} label:hover b { color: #e2e8f0; }`
    add(mk({
      name: 'Segment Thumb Preview',
      category: 'Micro-interactions',
      description: 'Segmented range control whose blue thumb slides under whichever label you point at, previewing the choice on an overshoot curve and settling back on the checked segment when the cursor leaves.',
      html, css,
      tags: ['segmented', 'thumb', 'slide', 'preview', 'radio'],
    }))
  }

  /* MI3. Hold to confirm — a conic ring fills for as long as you press */
  {
    const c = cls('v14-mi-hold')
    const html = `<button class="${c}"><span class="r"><i></i><u></u></span><span class="lb"><b>Delete workspace</b><em>press and hold</em></span></button>`
    const css = `@property --${c}-p {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}
.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.9rem 0.45rem 0.5rem;
  background: #1a1119;
  border: 1px solid #4c1d24;
  border-radius: 0.7rem;
  cursor: pointer;
  transition: border-color 0.25s ease, background 0.25s ease;
}
.${c} .r {
  --${c}-p: 0%;
  position: relative;
  display: block;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: conic-gradient(from -90deg, #ef4444 var(--${c}-p), rgba(148, 163, 184, 0.16) 0);
  transition: --${c}-p 0.3s linear;
}
.${c} .r i {
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: #1a1119;
}
.${c} .r i::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 12px;
  width: 11px;
  height: 11px;
  margin-left: -5.5px;
  border: 1.5px solid #fca5a5;
  border-top: none;
  border-radius: 0 0 2px 2px;
}
.${c} .r i::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 9px;
  width: 15px;
  height: 1.5px;
  margin-left: -7.5px;
  background: #fca5a5;
}
.${c} .r u {
  position: absolute;
  left: 50%;
  top: 6px;
  width: 7px;
  height: 2.5px;
  margin-left: -3.5px;
  background: #fca5a5;
  border-radius: 1px 1px 0 0;
}
.${c} .lb { display: grid; justify-items: start; gap: 1px; }
.${c} b { font-size: 0.78rem; font-weight: 600; color: #fecaca; }
.${c} em {
  font-style: normal;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9a6b70;
  transition: color 0.2s ease;
}
.${c}:hover { border-color: #7f1d1d; background: #22141c; }
.${c}:hover em { color: #f87171; }
.${c}:active .r { animation: ${c}-fill 1.6s linear forwards; }
.${c}:active em { color: #fecaca; }
@keyframes ${c}-fill {
  from { --${c}-p: 0%; }
  to   { --${c}-p: 100%; }
}`
    add(mk({
      name: 'Hold To Confirm Ring',
      category: 'Micro-interactions',
      description: 'Destructive button guarded by a hold: the red conic ring around the bin sweeps from empty to full over the second and a half you keep the pointer down, and drains back if you let go early.',
      html, css,
      tags: ['hold', 'confirm', 'ring', 'conic', 'destructive'],
    }))
  }

  /* MI4. Menu morph — three bars fold into a cross on approach */
  {
    const c = cls('v14-mi-menu')
    const html = `<button class="${c}"><span class="ic"><i></i><i></i><i></i></span><span class="tx"><b>Menu</b><b>Close</b></span></button>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.95rem 0.45rem 0.75rem;
  background: #131c31;
  border: 1px solid #253049;
  border-radius: 0.6rem;
  cursor: pointer;
  transition: background 0.25s ease, border-color 0.25s ease;
}
.${c} .ic {
  position: relative;
  display: block;
  width: 20px;
  height: 16px;
}
.${c} .ic i {
  position: absolute;
  left: 0;
  width: 20px;
  height: 2px;
  border-radius: 2px;
  background: #cbd5e1;
  transition: transform 0.35s cubic-bezier(0.6, -0.25, 0.3, 1.4), opacity 0.2s ease, background 0.25s ease;
}
.${c} .ic i:nth-child(1) { top: 0; }
.${c} .ic i:nth-child(2) { top: 7px; }
.${c} .ic i:nth-child(3) { top: 14px; }
.${c} .tx { display: grid; }
.${c} .tx b {
  grid-area: 1 / 1;
  font-size: 0.78rem;
  font-weight: 600;
  color: #cbd5e1;
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.${c} .tx b:nth-child(2) { opacity: 0; transform: translateY(7px); }
.${c}:hover { background: #1b2740; border-color: #33507f; }
.${c}:hover .ic i { background: #93c5fd; }
.${c}:hover .ic i:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.${c}:hover .ic i:nth-child(2) { opacity: 0; transform: scaleX(0.15); }
.${c}:hover .ic i:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
.${c}:hover .tx b:nth-child(1) { opacity: 0; transform: translateY(-7px); }
.${c}:hover .tx b:nth-child(2) { opacity: 1; transform: translateY(0); }`
    add(mk({
      name: 'Menu Bars Morph',
      category: 'Micro-interactions',
      description: 'Menu button whose three stacked bars converge and rotate into a cross as the middle bar squeezes out of existence, the caption swapping from Menu to Close on the same beat.',
      html, css,
      tags: ['hamburger', 'morph', 'cross', 'menu', 'rotate'],
    }))
  }

  /* MI5. Day/night switch — the sun slides across and a bite makes a moon */
  {
    const c = cls('v14-mi-theme')
    const html = `<label class="${c}"><input type="checkbox" /><span class="tr"><i class="st a"></i><i class="st b"></i><i class="st d"></i><span class="kn"></span></span><em>Dark mode</em></label>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
}
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} .tr {
  position: relative;
  display: block;
  width: 62px;
  height: 32px;
  border-radius: 999px;
  overflow: hidden;
  background: linear-gradient(180deg, #172554, #0b1220);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6);
}
.${c} .tr::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #7dd3fc, #38bdf8);
  transition: opacity 0.4s ease;
}
.${c} .st {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #e2e8f0;
  opacity: 0;
  transition: opacity 0.4s ease 0.1s;
}
.${c} .st.a { left: 12px; top: 8px; }
.${c} .st.b { left: 20px; top: 20px; width: 2px; height: 2px; }
.${c} .st.d { left: 30px; top: 11px; width: 2px; height: 2px; }
.${c} .kn {
  position: absolute;
  left: 3px;
  top: 3px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fbbf24;
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.75);
  transition: transform 0.45s cubic-bezier(0.5, 1.4, 0.5, 1), background 0.4s ease, box-shadow 0.4s ease;
}
.${c} .kn::after {
  content: '';
  position: absolute;
  top: -5px;
  right: -5px;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background: #101c36;
  transform: scale(0);
  transform-origin: 72% 28%;
  transition: transform 0.45s cubic-bezier(0.5, 1.4, 0.5, 1);
}
.${c} em {
  font-style: normal;
  font-size: 0.78rem;
  color: #94a3b8;
  transition: color 0.3s ease;
}
.${c}:hover .kn { box-shadow: 0 0 16px rgba(251, 191, 36, 0.9); }
.${c}:hover em { color: #e2e8f0; }
.${c} input:checked ~ .tr::before { opacity: 0; }
.${c} input:checked ~ .tr .st { opacity: 1; }
.${c} input:checked ~ .tr .kn {
  transform: translateX(30px);
  background: #e2e8f0;
  box-shadow: 0 0 12px rgba(226, 232, 240, 0.5);
}
.${c} input:checked ~ .tr .kn::after { transform: scale(1); }
.${c}:hover input:checked ~ .tr .kn { box-shadow: 0 0 18px rgba(226, 232, 240, 0.65); }`
    add(mk({
      name: 'Day Night Switch',
      category: 'Micro-interactions',
      description: 'Theme toggle where the amber sun travels across the track, cools to pale grey and has a bite taken out of it by an offset disc so it lands as a crescent moon over a sky that has meanwhile filled with stars.',
      html, css,
      tags: ['theme', 'toggle', 'sun', 'crescent', 'checkbox'],
    }))
  }

  /* MI6. Sort header — a ghost caret appears over the column you point at */
  {
    const c = cls('v14-mi-sort')
    const html = `<div class="${c}"><span class="h"><b>Customer</b><i></i></span><span class="h"><b>Region</b><i></i></span><span class="h on"><b>Revenue</b><i></i></span></div>`
    const css = `.${c} {
  display: grid;
  grid-template-columns: 92px 74px 82px;
  width: 248px;
  padding: 0 0.2rem;
  background: #131c31;
  border: 1px solid #253049;
  border-bottom-width: 2px;
  border-radius: 0.5rem 0.5rem 0 0;
}
.${c} .h {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  height: 38px;
  padding: 0 0.45rem;
  font-size: 0.72rem;
  cursor: pointer;
  border-radius: 0.4rem 0.4rem 0 0;
  transition: background 0.2s ease;
}
.${c} .h b { font-weight: 600; color: #8fa3c0; transition: color 0.2s ease; }
.${c} .h i {
  display: block;
  width: 9px;
  height: 6px;
  background: #64748b;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  opacity: 0;
  transform: translateY(3px);
  transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.34, 1.5, 0.64, 1), background 0.2s ease;
}
.${c} .h::after {
  content: '';
  position: absolute;
  left: 0.45rem;
  right: 0.45rem;
  bottom: -2px;
  height: 2px;
  background: #3b82f6;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.28s ease;
}
.${c} .h.on b { color: #e2e8f0; }
.${c} .h.on i { opacity: 1; transform: translateY(0); background: #60a5fa; }
.${c} .h.on::after { transform: scaleX(1); }
.${c} .h:hover { background: #1b2740; }
.${c} .h:hover b { color: #e2e8f0; }
.${c} .h:hover i { opacity: 0.55; transform: translateY(0); }
.${c} .h.on:hover i { opacity: 1; }
.${c} .h:active i { transform: rotate(180deg); opacity: 1; background: #60a5fa; }`
    add(mk({
      name: 'Sort Header Caret',
      category: 'Micro-interactions',
      description: 'Table header row where pointing at a column raises a half-lit caret to show it can be sorted, the live column keeping a solid caret and a blue underline, and pressing flips the caret end over end.',
      html, css,
      tags: ['table', 'sort', 'caret', 'header', 'hover'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Filters & Blend Modes                                               */
  /* ------------------------------------------------------------------ */

  /* FB1. Ambient glow — a blurred duplicate used as a light source */
  {
    const c = cls('v14-fb-glow')
    const html = `<div class="${c}"><span class="w"><i class="g"></i><i class="a"></i></span><span class="t"><small>NOW PLAYING</small><b>Neon Districts</b><em>Yumi Nakagawa</em></span></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 250px;
  padding: 0.85rem;
  background: #111a2e;
  border: 1px solid #22304d;
  border-radius: 0.8rem;
  overflow: hidden;
}
.${c} .w {
  position: relative;
  flex: none;
  width: 82px;
  height: 82px;
}
.${c} .g,
.${c} .a {
  position: absolute;
  inset: 0;
  border-radius: 0.7rem;
  background:
    radial-gradient(70% 70% at 22% 24%, #f472b6, transparent 60%),
    radial-gradient(70% 70% at 78% 30%, #fbbf24, transparent 55%),
    radial-gradient(80% 80% at 50% 92%, #22d3ee, transparent 60%),
    linear-gradient(150deg, #4338ca, #0f172a);
}
.${c} .g {
  filter: blur(13px) saturate(2.4);
  transform: translateY(8px) scale(1.02);
  opacity: 0.85;
  transition: filter 0.45s ease, transform 0.45s ease, opacity 0.45s ease;
}
.${c} .a {
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.55);
  transition: transform 0.45s ease;
}
.${c} .t { display: grid; gap: 2px; }
.${c} small {
  font-size: 0.55rem;
  letter-spacing: 0.16em;
  color: #64748b;
}
.${c} b { font-size: 0.85rem; color: #f1f5f9; }
.${c} em { font-style: normal; font-size: 0.7rem; color: #94a3b8; }
.${c}:hover .g {
  filter: blur(20px) saturate(2.8);
  transform: translateY(13px) scale(1.16);
  opacity: 1;
}
.${c}:hover .a { transform: translateY(-2px); }`
    add(mk({
      name: 'Ambient Glow Bleed',
      category: 'Filters & Blend Modes',
      description: 'Now-playing card that lights itself: a second copy of the artwork sits behind the first under a heavy blur and a saturation boost, so the sleeve bleeds its own colour onto the card, spreading further on hover.',
      html, css,
      tags: ['blur', 'saturate', 'ambient', 'glow', 'duplicate'],
    }))
  }

  /* FB2. Holo foil — rainbow stripes in color-dodge under a hard-light sheen */
  {
    const c = cls('v14-fb-foil')
    const html = `<div class="${c}"><i class="f"></i><i class="s"></i><span class="lb"><b>HOLO</b><em>014 / 250</em></span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  align-content: end;
  width: 176px;
  height: 116px;
  padding: 0.7rem;
  border-radius: 0.7rem;
  overflow: hidden;
  isolation: isolate;
  background:
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.035) 0 6px, transparent 6px 12px),
    linear-gradient(160deg, #1e293b, #0b1120);
  border: 1px solid #33415c;
}
.${c} .f {
  position: absolute;
  inset: -25%;
  background: repeating-linear-gradient(
    115deg,
    #ff5ea2 0 6%,
    #ffe45e 11%,
    #5eff9d 16%,
    #5ecbff 22%,
    #c05eff 28%,
    #ff5ea2 34%
  );
  filter: blur(5px);
  mix-blend-mode: color-dodge;
  opacity: 0.32;
  transform: translateX(-5%);
  transition: transform 0.55s ease, opacity 0.45s ease;
}
.${c} .s {
  position: absolute;
  inset: -25%;
  background: linear-gradient(
    115deg,
    transparent 38%,
    rgba(255, 255, 255, 0.42) 48%,
    rgba(255, 255, 255, 0.06) 54%,
    transparent 62%
  );
  mix-blend-mode: hard-light;
  transform: translateX(-14%);
  transition: transform 0.6s ease;
}
.${c} .lb { position: relative; z-index: 1; }
.${c} b {
  display: block;
  font-size: 1.15rem;
  font-weight: 900;
  letter-spacing: 0.22em;
  color: #f8fafc;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}
.${c} em {
  font-style: normal;
  font-size: 0.6rem;
  letter-spacing: 0.18em;
  color: rgba(226, 232, 240, 0.75);
}
.${c}:hover .f { transform: translateX(6%); opacity: 0.55; }
.${c}:hover .s { transform: translateX(16%); }`
    add(mk({
      name: 'Color Dodge Foil Tilt',
      category: 'Filters & Blend Modes',
      description: 'Collector card finished in holographic foil: blurred rainbow stripes composited in color-dodge over the dark stock with a hard-light sheen above them, both sliding the other way as the card is hovered so the foil appears to tilt.',
      html, css,
      tags: ['color-dodge', 'hard-light', 'holographic', 'foil', 'sheen'],
    }))
  }

  /* FB3. Plus-lighter crossfade — a dissolve that never dips to grey */
  {
    const c = cls('v14-fb-plus')
    const html = `<div class="${c}"><i class="p1"></i><i class="p2"></i><span>plus-lighter</span></div>`
    const css = `.${c} {
  position: relative;
  width: 210px;
  height: 118px;
  border-radius: 0.7rem;
  overflow: hidden;
  isolation: isolate;
  background: #05070f;
  border: 1px solid #22304d;
}
.${c} i {
  position: absolute;
  inset: 0;
  mix-blend-mode: plus-lighter;
}
.${c} .p1 {
  background:
    radial-gradient(circle at 28% 36%, #f43f5e 0 16%, transparent 18%),
    radial-gradient(circle at 60% 62%, #6366f1 0 22%, transparent 24%),
    radial-gradient(circle at 82% 28%, #22d3ee 0 13%, transparent 15%),
    linear-gradient(150deg, #14133a, #04060d);
  opacity: 1;
  animation: ${c}-a 6s ease-in-out infinite;
}
.${c} .p2 {
  background:
    repeating-radial-gradient(circle at 50% 50%, #0ea5e9 0 6px, transparent 6px 16px),
    linear-gradient(60deg, #3b0764, #04060d);
  opacity: 0;
  animation: ${c}-b 6s ease-in-out infinite;
}
.${c} span {
  position: absolute;
  left: 0.6rem;
  bottom: 0.5rem;
  z-index: 1;
  padding: 0.1rem 0.4rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.58rem;
  color: #cbd5e1;
  background: rgba(2, 6, 23, 0.6);
  border-radius: 3px;
}
.${c}:hover .p1,
.${c}:hover .p2 { animation-play-state: paused; }
@keyframes ${c}-a {
  0%   { opacity: 1; }
  42%  { opacity: 0; }
  58%  { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes ${c}-b {
  0%   { opacity: 0; }
  42%  { opacity: 1; }
  58%  { opacity: 1; }
  100% { opacity: 0; }
}`
    add(mk({
      name: 'Plus Lighter Crossfade',
      category: 'Filters & Blend Modes',
      description: 'Two artwork plates dissolve back and forth in plus-lighter blending, so instead of the usual muddy dip in the middle the overlap adds light and the halfway frame is the brightest one; hovering pauses the dissolve wherever it stands.',
      html, css,
      tags: ['plus-lighter', 'crossfade', 'dissolve', 'additive', 'blend'],
    }))
  }

  /* FB4. Peer dim — hovering one thumbnail desaturates all its siblings */
  {
    const c = cls('v14-fb-peer')
    const html = `<div class="${c}"><figure class="t1"></figure><figure class="t2"></figure><figure class="t3"></figure><figure class="t4"></figure><figure class="t5"></figure></div>`
    const css = `.${c} {
  display: flex;
  gap: 7px;
  padding: 8px;
  background: #101a2e;
  border: 1px solid #22304d;
  border-radius: 0.6rem;
}
.${c} figure {
  margin: 0;
  width: 42px;
  height: 84px;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: filter 0.35s ease, transform 0.35s ease;
}
.${c} .t1 { background: linear-gradient(160deg, #f97316, #be123c); }
.${c} .t2 { background: linear-gradient(160deg, #22d3ee, #1d4ed8); }
.${c} .t3 { background: linear-gradient(160deg, #a3e635, #047857); }
.${c} .t4 { background: linear-gradient(160deg, #f0abfc, #6d28d9); }
.${c} .t5 { background: linear-gradient(160deg, #fde68a, #b45309); }
.${c}:hover figure {
  filter: grayscale(1) brightness(0.55);
  transform: scale(0.94);
}
.${c} figure:hover {
  filter: saturate(1.4) contrast(1.08);
  transform: scale(1.09);
}`
    add(mk({
      name: 'Peer Desaturate Strip',
      category: 'Filters & Blend Modes',
      description: 'Filmstrip of colour cards where touching any one of them drains the colour out of every other card and dims it, while the card under the cursor gains saturation and contrast and steps forward.',
      html, css,
      tags: ['grayscale', 'saturate', 'siblings', 'focus', 'strip'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Dividers & Separators                                               */
  /* ------------------------------------------------------------------ */

  /* DV1. Insert gap — the hairline between rows becomes an insert control */
  {
    const c = cls('v14-dv-insert')
    const html = `<div class="${c}"><div class="row">Introduction</div><div class="gap"><span class="ln"></span><span class="btn"><i></i><i></i></span><em>Insert block</em></div><div class="row">Method</div></div>`
    const css = `.${c} {
  width: 246px;
  padding: 0.2rem 0;
}
.${c} .row {
  padding: 0.5rem 0.7rem;
  font-size: 0.78rem;
  color: #cbd5e1;
  background: #131c31;
  border: 1px solid #253049;
  border-radius: 0.45rem;
}
.${c} .gap {
  position: relative;
  display: flex;
  align-items: center;
  height: 26px;
  cursor: copy;
}
.${c} .ln {
  position: absolute;
  left: 26px;
  right: 0;
  height: 0;
  border-top: 1px solid #1e293b;
  transition: border-color 0.25s ease, border-top-style 0.25s ease;
}
.${c} .btn {
  position: relative;
  width: 18px;
  height: 18px;
  margin-left: 1px;
  border-radius: 50%;
  background: #1b2740;
  border: 1px solid #2c3d5f;
  transform: scale(0.6);
  opacity: 0;
  transition: transform 0.28s cubic-bezier(0.34, 1.6, 0.64, 1), opacity 0.22s ease, background 0.25s ease;
}
.${c} .btn i {
  position: absolute;
  left: 50%;
  top: 50%;
  background: #93c5fd;
  border-radius: 1px;
}
.${c} .btn i:nth-child(1) { width: 8px; height: 1.5px; margin: -0.75px 0 0 -4px; }
.${c} .btn i:nth-child(2) { width: 1.5px; height: 8px; margin: -4px 0 0 -0.75px; }
.${c} em {
  position: absolute;
  left: 28px;
  font-style: normal;
  font-size: 0.62rem;
  letter-spacing: 0.04em;
  color: #60a5fa;
  background: #0f172a;
  padding: 0 6px;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.${c} .gap:hover .ln { border-top: 1px dashed #3b82f6; }
.${c} .gap:hover .btn { transform: scale(1); opacity: 1; background: #1e3a8a; }
.${c} .gap:hover em { opacity: 1; transform: translateX(0); }`
    add(mk({
      name: 'Insert Gap Divider',
      category: 'Dividers & Separators',
      description: 'The hairline sitting in the gap between two blocks turns into a working control when you reach for it: the rule goes blue and dashed, a plus button springs up at its left end and an Insert block label slides out from behind it.',
      html, css,
      tags: ['insert', 'gap', 'hairline', 'affordance', 'editor'],
    }))
  }

  /* DV2. Split pane — a grabbable splitter between two panes */
  {
    const c = cls('v14-dv-split')
    const html = `<div class="${c}"><div class="pn"><b>Editor</b><p>const total = items<br />&nbsp;&nbsp;.reduce(sum, 0)</p></div><div class="sp"><i></i></div><div class="pn r"><b>Preview</b><p>Total: 128 items</p></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: stretch;
  width: 254px;
  height: 116px;
  background: #101a2e;
  border: 1px solid #22304d;
  border-radius: 0.55rem;
  overflow: hidden;
}
.${c} .pn {
  flex: 1;
  min-width: 0;
  padding: 0.55rem 0.6rem;
}
.${c} .pn b {
  display: block;
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
}
.${c} .pn p {
  margin: 0.35rem 0 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.6rem;
  line-height: 1.5;
  color: #94a3b8;
}
.${c} .pn.r p { font-family: inherit; color: #cbd5e1; }
.${c} .sp {
  position: relative;
  flex: none;
  width: 9px;
  background: #1a2540;
  border-left: 1px solid #22304d;
  border-right: 1px solid #22304d;
  cursor: col-resize;
  transition: background 0.22s ease, box-shadow 0.22s ease;
}
.${c} .sp i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 3px;
  height: 3px;
  margin: -1.5px 0 0 -1.5px;
  border-radius: 50%;
  background: #475569;
  box-shadow: 0 -8px 0 #475569, 0 8px 0 #475569;
  transition: background 0.22s ease, box-shadow 0.22s ease, transform 0.28s cubic-bezier(0.34, 1.6, 0.64, 1);
}
.${c} .sp::before,
.${c} .sp::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 5px;
  height: 8px;
  margin-top: -4px;
  background: #60a5fa;
  opacity: 0;
  transition: opacity 0.22s ease, transform 0.28s ease;
}
.${c} .sp::before {
  right: 12px;
  clip-path: polygon(100% 0, 100% 100%, 0 50%);
  transform: translateX(6px);
}
.${c} .sp::after {
  left: 12px;
  clip-path: polygon(0 0, 0 100%, 100% 50%);
  transform: translateX(-6px);
}
.${c} .sp:hover {
  background: #1e3a8a;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.45);
}
.${c} .sp:hover i {
  background: #bfdbfe;
  box-shadow: 0 -8px 0 #bfdbfe, 0 8px 0 #bfdbfe;
  transform: scaleY(1.6);
}
.${c} .sp:hover::before,
.${c} .sp:hover::after { opacity: 1; transform: translateX(0); }`
    add(mk({
      name: 'Split Pane Grip',
      category: 'Dividers & Separators',
      description: 'The separator holding an editor and its preview apart is a working splitter: reaching for the nine-pixel channel lights it blue, stretches its three grip dots and pushes a pair of arrowheads out into each pane to say which way it drags.',
      html, css,
      tags: ['splitter', 'pane', 'grip', 'resize', 'vertical'],
    }))
  }

  /* DV3. Column rule — the divider generated by the multi-column layout */
  {
    const c = cls('v14-dv-column')
    const html = `<div class="${c}"><p>Every rule on this page is drawn by the layout itself. The gutter is a column gap, and the line inside it is a column-rule, so it arrives with the text and leaves with it.</p><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 250px;
  padding: 0.6rem 0.7rem;
  background: #111a2e;
  border: 1px solid #22304d;
  border-radius: 0.5rem;
}
.${c} p {
  margin: 0;
  columns: 2;
  column-gap: 22px;
  column-rule: 1px solid #2c3d5f;
  font-size: 0.62rem;
  line-height: 1.65;
  text-align: justify;
  hyphens: auto;
  color: #94a3b8;
  transition: column-rule-color 0.3s ease, color 0.3s ease;
}
.${c} p::first-letter {
  font-size: 1.25rem;
  font-weight: 700;
  color: #e2e8f0;
}
.${c} i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7px;
  height: 7px;
  margin: -3.5px 0 0 -3.5px;
  background: #22304d;
  border: 1px solid #111a2e;
  transform: rotate(45deg);
  transition: background 0.3s ease, transform 0.4s ease;
}
.${c}:hover p { column-rule-color: #60a5fa; color: #cbd5e1; }
.${c}:hover i { background: #60a5fa; transform: rotate(135deg) scale(1.2); }`
    add(mk({
      name: 'Column Rule Divider',
      category: 'Dividers & Separators',
      description: 'A separator that is not an element at all: text flowing through a two-column layout is split by its own column-rule down the gutter, pinned at the middle by a small diamond node that turns and lights up with the rule on hover.',
      html, css,
      tags: ['column-rule', 'gutter', 'multicolumn', 'editorial', 'vertical'],
    }))
  }

  /* DV4. Branch merge — two lines curve together into one trunk */
  {
    const c = cls('v14-dv-merge')
    const html = `<div class="${c}"><i class="ba"></i><i class="bb"></i><i class="ea"></i><i class="eb"></i><i class="tk"></i><span class="da"></span><span class="db"></span><span class="node"></span><span class="tip"></span><em class="la">feature</em><em class="lb">main</em><b>merged</b></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 132px;
  background: #111a2e;
  border: 1px solid #22304d;
  border-radius: 0.55rem;
}
.${c} i,
.${c} span {
  position: absolute;
  display: block;
}
.${c} .ba { left: 58px; top: 22px; width: 2px; height: 26px; background: #38bdf8; }
.${c} .bb { left: 158px; top: 22px; width: 2px; height: 26px; background: #a78bfa; }
.${c} .ea {
  left: 58px;
  top: 48px;
  width: 52px;
  height: 26px;
  border-left: 2px solid #38bdf8;
  border-bottom: 2px solid #38bdf8;
  border-bottom-left-radius: 16px;
}
.${c} .eb {
  left: 108px;
  top: 48px;
  width: 52px;
  height: 26px;
  border-right: 2px solid #a78bfa;
  border-bottom: 2px solid #a78bfa;
  border-bottom-right-radius: 16px;
}
.${c} .tk { left: 108px; top: 74px; width: 2px; height: 34px; background: #64748b; }
.${c} .tip {
  left: 105px;
  top: 105px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #64748b;
}
.${c} .da,
.${c} .db {
  width: 9px;
  height: 9px;
  top: 18px;
  border-radius: 50%;
  border: 2px solid #0f172a;
}
.${c} .da { left: 54px; background: #38bdf8; }
.${c} .db { left: 154px; background: #a78bfa; }
.${c} .node {
  left: 101px;
  top: 67px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0f172a;
  border: 2px solid #94a3b8;
  animation: ${c}-node 2.6s ease-in-out infinite;
}
.${c} em {
  position: absolute;
  top: 4px;
  font-style: normal;
  font-size: 0.6rem;
  letter-spacing: 0.02em;
}
.${c} .la { left: 30px; color: #7dd3fc; }
.${c} .lb { left: 140px; color: #c4b5fd; }
.${c} b {
  position: absolute;
  left: 126px;
  top: 81px;
  padding: 0.1rem 0.4rem;
  font-size: 0.6rem;
  font-weight: 600;
  color: #cbd5e1;
  background: #1b2740;
  border: 1px solid #2c3d5f;
  border-radius: 999px;
}
.${c}:hover .ba,
.${c}:hover .ea { border-color: #7dd3fc; background-color: #7dd3fc; }
.${c}:hover .bb,
.${c}:hover .eb { border-color: #c4b5fd; background-color: #c4b5fd; }
.${c}:hover .node { border-color: #e2e8f0; }
@keyframes ${c}-node {
  0%, 100% { box-shadow: 0 0 0 0 rgba(148, 163, 184, 0.45); }
  55%      { box-shadow: 0 0 0 7px rgba(148, 163, 184, 0); }
}`
    add(mk({
      name: 'Branch Merge Divider',
      category: 'Dividers & Separators',
      description: 'Section separator drawn as a merge in a commit graph: two coloured branch lines drop from their labelled tips, curve inward through rounded elbows and join at a pulsing node before continuing as a single grey trunk below.',
      html, css,
      tags: ['branch', 'merge', 'graph', 'junction', 'timeline'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Badges & Tags                                                       */
  /* ------------------------------------------------------------------ */

  /* BD1. Overflow group — the +N chip unrolls the tags hiding behind it */
  {
    const c = cls('v14-bd-overflow')
    const html = `<div class="${c}"><span class="t">design</span><span class="t">css</span><span class="t h h1">motion</span><span class="t h h2">a11y</span><span class="t h h3">docs</span><span class="n">+3</span></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  background: #131c31;
  border: 1px solid #253049;
  border-radius: 999px;
}
.${c} .t {
  display: block;
  padding: 0.22rem 0.55rem;
  font-size: 0.68rem;
  color: #cbd5e1;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 999px;
  white-space: nowrap;
}
.${c} .h {
  max-width: 0;
  padding-left: 0;
  padding-right: 0;
  border-width: 0;
  opacity: 0;
  overflow: hidden;
  transform: translateX(-10px);
  transition: max-width 0.34s ease, padding 0.34s ease, opacity 0.24s ease, transform 0.34s ease, border-width 0.34s ease;
}
.${c} .n {
  display: block;
  padding: 0.22rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: #93c5fd;
  background: #1e3a8a;
  border-radius: 999px;
  cursor: pointer;
  transition: max-width 0.34s ease, padding 0.3s ease, opacity 0.2s ease, background 0.2s ease;
  max-width: 60px;
  overflow: hidden;
  white-space: nowrap;
}
.${c}:hover .h {
  max-width: 74px;
  padding-left: 0.55rem;
  padding-right: 0.55rem;
  border-width: 1px;
  opacity: 1;
  transform: translateX(0);
}
.${c}:hover .h1 { transition-delay: 0s; }
.${c}:hover .h2 { transition-delay: 0.06s; }
.${c}:hover .h3 { transition-delay: 0.12s; }
.${c}:hover .n {
  max-width: 0;
  padding-left: 0;
  padding-right: 0;
  opacity: 0;
}`
    add(mk({
      name: 'Overflow Tag Group',
      category: 'Badges & Tags',
      description: 'Truncated tag list where the +3 counter is not just a count: hovering the group collapses the counter to nothing and unrolls the three hidden tags out of the same space one after another, each widening from zero.',
      html, css,
      tags: ['tags', 'overflow', 'expand', 'stagger', 'counter'],
    }))
  }

  /* BD2. Chevron path — notched tags that interlock into a breadcrumb */
  {
    const c = cls('v14-bd-path')
    const html = `<div class="${c}"><span class="s f">Workspace</span><span class="s">Reports</span><span class="s">Q3</span></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  padding: 4px;
  background: #101a2e;
  border: 1px solid #22304d;
  border-radius: 0.45rem;
}
.${c} .s {
  display: block;
  height: 26px;
  padding: 0 0.85rem 0 1.1rem;
  margin-left: -9px;
  font-size: 0.68rem;
  line-height: 26px;
  color: #94a3b8;
  background: #1e293b;
  clip-path: polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%, 9px 50%);
  cursor: pointer;
  transition: background 0.22s ease, color 0.22s ease;
}
.${c} .s.f {
  margin-left: 0;
  padding-left: 0.75rem;
  border-radius: 0.3rem 0 0 0.3rem;
  clip-path: polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%);
}
.${c} .s:last-child { color: #e2e8f0; background: #24334d; }
.${c} .s:hover,
.${c} .s:has(~ .s:hover) {
  background: #1d4ed8;
  color: #eff6ff;
}
.${c} .s:hover { background: #2563eb; }`
    add(mk({
      name: 'Chevron Path Tags',
      category: 'Badges & Tags',
      description: 'Location tags cut with a chevron point on one end and a matching notch on the other so they interlock into a single path strip, and pointing at any segment lights it and every segment leading up to it in blue.',
      html, css,
      tags: ['breadcrumb', 'chevron', 'clip-path', 'interlock', 'path'],
    }))
  }

  /* BD3. Filter set — checkable chips that summon a Clear chip via :has */
  {
    const c = cls('v14-bd-filterset')
    const html = `<div class="${c}"><label class="ch"><input type="checkbox" checked /><i></i><b>Open</b></label><label class="ch"><input type="checkbox" /><i></i><b>Mine</b></label><label class="ch"><input type="checkbox" checked /><i></i><b>Urgent</b></label><span class="cl">Clear</span></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  background: #131c31;
  border: 1px solid #253049;
  border-radius: 0.6rem;
}
.${c} .ch {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 0.6rem;
  font-size: 0.68rem;
  color: #94a3b8;
  background: #1b2740;
  border: 1px solid #2c3d5f;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.22s ease, border-color 0.22s ease, color 0.22s ease, transform 0.2s ease;
}
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} .ch i {
  display: block;
  width: 0;
  height: 9px;
  margin-right: 0;
  border-right: 2px solid #0b1220;
  border-bottom: 2px solid #0b1220;
  transform: rotate(45deg) scale(0.4);
  opacity: 0;
  transition: width 0.22s ease, margin 0.22s ease, opacity 0.2s ease, transform 0.28s cubic-bezier(0.34, 1.7, 0.64, 1);
}
.${c} .ch:has(input:checked) {
  color: #0b1220;
  background: #7dd3fc;
  border-color: #7dd3fc;
}
.${c} .ch:has(input:checked) i {
  width: 5px;
  margin-right: 6px;
  opacity: 1;
  transform: rotate(45deg) scale(1);
}
.${c} .ch:hover { transform: translateY(-1px); border-color: #38bdf8; }
.${c} .cl {
  display: block;
  max-width: 0;
  padding: 0.22rem 0;
  font-size: 0.66rem;
  color: #f87171;
  white-space: nowrap;
  overflow: hidden;
  opacity: 0;
  cursor: pointer;
  transition: max-width 0.3s ease, opacity 0.25s ease, padding 0.3s ease;
}
.${c}:has(input:checked) .cl {
  max-width: 60px;
  padding: 0.22rem 0.3rem;
  opacity: 1;
}
.${c} .cl:hover { text-decoration: underline; }`
    add(mk({
      name: 'Filter Chip Set',
      category: 'Badges & Tags',
      description: 'Set of chips that carry their own state: a checked chip flips to solid sky and slides a tick out from its left edge, and the moment any chip in the set is checked a Clear link widens into being at the end of the row.',
      html, css,
      tags: ['filter', 'chips', 'checkbox', 'state', 'clear'],
    }))
  }

  /* BD4. Grade badge — the letter sits on the A-E scale it was cut from */
  {
    const c = cls('v14-bd-grade')
    const html = `<div class="${c}"><span class="hd">Eco score</span><span class="sc"><i class="g1">A</i><i class="g2">B</i><i class="g3 on">C</i><i class="g4">D</i><i class="g5">E</i></span></div>`
    const css = `.${c} {
  display: inline-grid;
  gap: 6px;
  padding: 0.5rem 0.6rem 0.6rem;
  background: #111a2e;
  border: 1px solid #22304d;
  border-radius: 0.55rem;
}
.${c} .hd {
  font-size: 0.58rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #64748b;
}
.${c} .sc {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 46px;
}
.${c} i {
  display: grid;
  place-items: center;
  width: 26px;
  height: 22px;
  font-style: normal;
  font-size: 0.66rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.55);
  border-radius: 0.25rem;
  filter: saturate(0.35) brightness(0.7);
  transition: filter 0.3s ease, height 0.3s ease, width 0.3s ease, color 0.3s ease;
}
.${c} .g1 { background: #22c55e; }
.${c} .g2 { background: #84cc16; }
.${c} .g3 { background: #facc15; }
.${c} .g4 { background: #f97316; }
.${c} .g5 { background: #ef4444; }
.${c} i.on {
  position: relative;
  width: 34px;
  height: 40px;
  font-size: 1.05rem;
  color: #0b1220;
  filter: none;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);
}
.${c} i.on::after {
  content: '';
  position: absolute;
  left: 50%;
  top: -7px;
  width: 0;
  height: 0;
  margin-left: -4px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid #facc15;
}
.${c}:hover i { filter: saturate(0.6) brightness(0.85); }
.${c}:hover i.on { filter: none; height: 44px; }`
    add(mk({
      name: 'Grade Scale Badge',
      category: 'Badges & Tags',
      description: 'Rating badge that shows the whole A-to-E scale rather than a single letter: the four grades this item did not earn stay short and desaturated while the awarded grade grows tall, keeps its full colour and takes a marker above it.',
      html, css,
      tags: ['grade', 'scale', 'rating', 'eco', 'segments'],
    }))
  }
}
