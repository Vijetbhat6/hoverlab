// scripts/generate-effects-v12-d.mjs
//
// Twelfth wave, part D: Entrance Animations, Borders & Outlines,
// Progress & Meters, Avatars & Images. Six designs per category, ONE
// entry per design (no palette / size / speed stamping — the Customize
// panel handles tokens), each a different mechanic from every existing
// entry in its category.
//
// Entrance animations are finite (`animation-fill-mode: both`) and end
// fully visible — the 100% frame is the resting state, so the site's
// reduced-motion guard lands on a sensible composition. Avatars are
// drawn in CSS (initials on gradient discs); no external images.

export function generateV12D(ctx) {
  const { cls, mk, add } = ctx

  /* ───────────────────────── Entrance Animations ───────────────────────── */

  /* 1. Typewriter — text reveals letter by letter behind a blinking caret */
  {
    const c = cls('v12-ent-typewriter')
    const html = `<div class="${c}"><span class="tx">Hello, world.</span></div>`
    const css = `.${c} {
  display: inline-block;
  padding: 0.6rem 0.9rem;
  background: #0f172a;
  border: 1px solid #312e81;
  border-radius: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.05rem;
  color: #e0e7ff;
}
.${c} .tx {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  vertical-align: bottom;
  border-right: 2px solid #6366f1;
  padding-right: 2px;
  width: 13ch;
  animation: ${c}-type 1.6s steps(13, end) 0.2s both, ${c}-caret 0.7s step-end 1.8s 4 both;
}
@keyframes ${c}-type {
  from { width: 0; }
  to { width: 13ch; }
}
@keyframes ${c}-caret {
  0%, 100% { border-color: #6366f1; }
  50% { border-color: transparent; }
}`
    add(mk({
      name: 'Typewriter Entrance',
      category: 'Entrance Animations',
      description: 'Monospace line types itself out character by character behind a caret that blinks a few times and settles.',
      html, css,
      tags: ['typewriter', 'text', 'steps', 'caret', 'entrance'],
    }))
  }

  /* 2. Bounce-in badge — overshoots large, dips small, settles */
  {
    const c = cls('v12-ent-bounce')
    const html = `<div class="${c}"><span class="dot"></span>New release</div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.1rem;
  background: #f59e0b;
  color: #451a03;
  font-weight: 700;
  font-size: 0.95rem;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(245,158,11,0.35);
  animation: ${c}-in 0.9s cubic-bezier(0.215, 0.61, 0.355, 1) both;
}
.${c} .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #451a03;
}
@keyframes ${c}-in {
  0% { opacity: 0; transform: scale3d(0.3, 0.3, 1); }
  20% { transform: scale3d(1.15, 1.15, 1); }
  40% { transform: scale3d(0.9, 0.9, 1); }
  60% { opacity: 1; transform: scale3d(1.04, 1.04, 1); }
  80% { transform: scale3d(0.97, 0.97, 1); }
  100% { opacity: 1; transform: none; }
}`
    add(mk({
      name: 'Bounce-In Badge',
      category: 'Entrance Animations',
      description: 'Pill badge pops in with a springy overshoot, dips smaller and settles at its natural size.',
      html, css,
      tags: ['bounce', 'overshoot', 'badge', 'spring', 'entrance'],
    }))
  }

  /* 3. Swing-in card — rotates in from the top-left corner like a hinged sign */
  {
    const c = cls('v12-ent-swing')
    const html = `<div class="${c}"><b>Welcome back</b><span>Your workspace is ready.</span></div>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 200px;
  padding: 0.9rem 1rem;
  background: #042f2e;
  border: 1px solid #14b8a6;
  border-radius: 0.7rem;
  color: #ccfbf1;
  transform-origin: top left;
  animation: ${c}-in 1s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.${c} b { font-size: 0.95rem; }
.${c} span { font-size: 0.78rem; color: #5eead4; }
@keyframes ${c}-in {
  0% { opacity: 0; transform: rotate(-14deg) translateY(-18px); }
  55% { opacity: 1; }
  100% { opacity: 1; transform: none; }
}`
    add(mk({
      name: 'Swing-In Card',
      category: 'Entrance Animations',
      description: 'Card swings in around its top-left corner like a hinged sign, overshooting slightly before hanging level.',
      html, css,
      tags: ['swing', 'rotate', 'hinge', 'card', 'entrance'],
    }))
  }

  /* 4. Split heading — two halves slide in from opposite sides and meet */
  {
    const c = cls('v12-ent-split')
    const html = `<div class="${c}"><span class="l">Bold</span><span class="r">Move</span></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.35em;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #fff;
  overflow: hidden;
  padding: 0.2em 0.4em;
}
.${c} span {
  display: inline-block;
  animation: ${c}-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.${c} .l { color: #fb7185; }
.${c} .r { animation-name: ${c}-in-r; }
@keyframes ${c}-in {
  from { opacity: 0; transform: translateX(-120%); }
  to { opacity: 1; transform: none; }
}
@keyframes ${c}-in-r {
  from { opacity: 0; transform: translateX(120%); }
  to { opacity: 1; transform: none; }
}`
    add(mk({
      name: 'Split Heading Entrance',
      category: 'Entrance Animations',
      description: 'Two words slide in from opposite edges and lock together into a single headline.',
      html, css,
      tags: ['split', 'heading', 'slide', 'meet', 'entrance'],
    }))
  }

  /* 5. Skew slide — panel skews as it slides in, then straightens */
  {
    const c = cls('v12-ent-skew')
    const html = `<div class="${c}"><span class="k">FEATURE</span><span class="t">Realtime sync</span></div>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.8rem 1.4rem;
  background: linear-gradient(120deg, #8b5cf6, #6d28d9);
  color: #fff;
  border-radius: 0.4rem;
  box-shadow: 0 10px 30px rgba(139,92,246,0.35);
  animation: ${c}-in 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.${c} .k { font-size: 0.65rem; letter-spacing: 0.2em; opacity: 0.8; }
.${c} .t { font-size: 1.05rem; font-weight: 700; }
@keyframes ${c}-in {
  0% { opacity: 0; transform: translateX(-60px) skewX(-18deg); }
  60% { opacity: 1; transform: translateX(6px) skewX(4deg); }
  100% { opacity: 1; transform: none; }
}`
    add(mk({
      name: 'Skew Slide Entrance',
      category: 'Entrance Animations',
      description: 'Panel rushes in from the left leaning into its motion, then straightens up as it stops.',
      html, css,
      tags: ['skew', 'slide', 'panel', 'motion', 'entrance'],
    }))
  }

  /* 6. Stamp slam — drops from large and rotated, lands with a settle */
  {
    const c = cls('v12-ent-stamp')
    const html = `<div class="${c}">APPROVED</div>`
    const css = `.${c} {
  padding: 0.5rem 1.2rem;
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #10b981;
  border: 4px solid #10b981;
  border-radius: 0.5rem;
  transform: rotate(-8deg);
  mask-image: radial-gradient(circle at 30% 40%, #000 60%, rgba(0,0,0,0.75) 100%);
  animation: ${c}-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes ${c}-in {
  0% { opacity: 0; transform: scale(2.4) rotate(-20deg); }
  50% { opacity: 1; transform: scale(0.95) rotate(-7deg); }
  100% { opacity: 1; transform: scale(1) rotate(-8deg); }
}`
    add(mk({
      name: 'Stamp Slam Entrance',
      category: 'Entrance Animations',
      description: 'A rubber-stamp label drops from oversized and slams onto the surface with a tilted, inked landing.',
      html, css,
      tags: ['stamp', 'slam', 'scale', 'approved', 'entrance'],
    }))
  }

  /* ───────────────────────── Borders & Outlines ───────────────────────── */

  /* 7. Perforated ticket border — punched holes along the dashed tear line */
  {
    const c = cls('v12-bdr-perforated')
    const html = `<div class="${c}"><span class="a">ADMIT ONE</span><span class="b">Row F · Seat 12</span></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: 210px;
  padding: 0.9rem 1.2rem 0.9rem 2rem;
  background: #451a03;
  color: #fde68a;
  border: 2px dashed #f59e0b;
  border-radius: 0.6rem;
  transition: background 0.3s ease, border-color 0.3s ease;
}
.${c}::before {
  content: '';
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 14px;
  width: 0;
  border-left: 2px dashed #f59e0b;
}
.${c}::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 6px;
  width: 16px;
  background:
    radial-gradient(circle at 8px 0, #0b1020 6px, transparent 6.5px),
    radial-gradient(circle at 8px 100%, #0b1020 6px, transparent 6.5px);
  background-repeat: no-repeat;
}
.${c} .a { font-size: 0.7rem; letter-spacing: 0.25em; opacity: 0.85; }
.${c} .b { font-size: 0.95rem; font-weight: 700; }
.${c}:hover { background: #78350f; border-color: #fbbf24; }`
    add(mk({
      name: 'Perforated Ticket Border',
      category: 'Borders & Outlines',
      description: 'Dashed border with a punched perforation line and semicircular notches, so the stub reads as tearable.',
      html, css,
      tags: ['ticket', 'perforated', 'dashed', 'notch', 'border'],
    }))
  }

  /* 8. Blueprint frame — hairline frame with dimension ticks and corner crosses */
  {
    const c = cls('v12-bdr-blueprint')
    const html = `<div class="${c}"><span>240 × 120</span></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 100px;
  margin: 12px;
  color: #7dd3fc;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  border: 1px solid #0ea5e9;
  background:
    linear-gradient(#0ea5e9, #0ea5e9) 50% 0 / 40px 1px,
    linear-gradient(#0ea5e9, #0ea5e9) 50% 100% / 40px 1px,
    linear-gradient(#0ea5e9, #0ea5e9) 0 50% / 1px 40px,
    linear-gradient(#0ea5e9, #0ea5e9) 100% 50% / 1px 40px,
    repeating-linear-gradient(90deg, rgba(14,165,233,0.12) 0 1px, transparent 1px 10px),
    repeating-linear-gradient(0deg, rgba(14,165,233,0.12) 0 1px, transparent 1px 10px);
  background-repeat: no-repeat, no-repeat, no-repeat, no-repeat, repeat, repeat;
  transition: box-shadow 0.3s ease, background-color 0.3s ease;
}
.${c}::before,
.${c}::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background:
    linear-gradient(#38bdf8, #38bdf8) 50% 0 / 1px 100% no-repeat,
    linear-gradient(#38bdf8, #38bdf8) 0 50% / 100% 1px no-repeat;
}
.${c}::before { top: -6px; left: -6px; }
.${c}::after { bottom: -6px; right: -6px; }
.${c}:hover { box-shadow: 0 0 0 6px rgba(14,165,233,0.12); background-color: rgba(14,165,233,0.06); }`
    add(mk({
      name: 'Blueprint Frame',
      category: 'Borders & Outlines',
      description: 'Technical-drawing frame on faint graph lines with centre tick marks on each edge and crosshair corners.',
      html, css,
      tags: ['blueprint', 'technical', 'ticks', 'crosshair', 'border'],
    }))
  }

  /* 9. Split-tone border — two colours meet at the diagonal, swap on hover */
  {
    const c = cls('v12-bdr-splittone')
    const html = `<div class="${c}">Two-tone</div>`
    const css = `.${c} {
  padding: 1rem 2rem;
  font-weight: 600;
  color: #f5d0fe;
  background: #0b1020;
  border: 4px solid;
  border-color: #d946ef #d946ef #22d3ee #22d3ee;
  border-radius: 1rem;
  transition: border-color 0.4s ease, transform 0.4s ease;
}
.${c}:hover {
  border-color: #22d3ee #22d3ee #d946ef #d946ef;
  transform: rotate(-2deg);
}`
    add(mk({
      name: 'Split-Tone Border',
      category: 'Borders & Outlines',
      description: 'Thick rounded border coloured magenta on the top-right and cyan on the bottom-left, swapping halves on hover.',
      html, css,
      tags: ['two-tone', 'diagonal', 'thick', 'swap', 'border'],
    }))
  }

  /* 10. Zigzag receipt edge — sawtooth bottom edge cut from the paper */
  {
    const c = cls('v12-bdr-zigzag')
    const html = `<div class="${c}"><span class="r"><i>Coffee</i><i>4.50</i></span><span class="r"><i>Bagel</i><i>3.25</i></span><span class="r t"><i>Total</i><i>7.75</i></span></div>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 170px;
  padding: 0.8rem 0.9rem 1.1rem;
  background: #ecfccb;
  color: #365314;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  border-top: 3px solid #84cc16;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 8px), 95% 100%, 90% calc(100% - 8px), 85% 100%, 80% calc(100% - 8px), 75% 100%, 70% calc(100% - 8px), 65% 100%, 60% calc(100% - 8px), 55% 100%, 50% calc(100% - 8px), 45% 100%, 40% calc(100% - 8px), 35% 100%, 30% calc(100% - 8px), 25% 100%, 20% calc(100% - 8px), 15% 100%, 10% calc(100% - 8px), 5% 100%, 0 calc(100% - 8px));
  transition: transform 0.3s ease;
}
.${c} .r { display: flex; justify-content: space-between; }
.${c} .r i { font-style: normal; }
.${c} .t { border-top: 1px dashed #65a30d; margin-top: 0.2rem; padding-top: 0.25rem; font-weight: 700; }
.${c}:hover { transform: translateY(-3px) rotate(-1deg); }`
    add(mk({
      name: 'Zigzag Receipt Edge',
      category: 'Borders & Outlines',
      description: 'Receipt-style panel with a sawtooth torn bottom edge cut by clip-path and a coloured tape line on top.',
      html, css,
      tags: ['zigzag', 'receipt', 'sawtooth', 'clip-path', 'edge'],
    }))
  }

  /* 11. Stitched leather border — dashed seam set inside a solid rim */
  {
    const c = cls('v12-bdr-stitched')
    const html = `<div class="${c}">Handmade</div>`
    const css = `.${c} {
  position: relative;
  padding: 1rem 2rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #fed7aa;
  background: #7c2d12;
  border: 3px solid #431407;
  border-radius: 0.8rem;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.4), 0 6px 14px rgba(0,0,0,0.4);
  transition: transform 0.3s ease;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 5px;
  border: 2px dashed #fdba74;
  border-radius: 0.5rem;
  pointer-events: none;
  transition: inset 0.3s ease, border-color 0.3s ease;
}
.${c}:hover { transform: translateY(-2px); }
.${c}:hover::before { inset: 3px; border-color: #ffedd5; }`
    add(mk({
      name: 'Stitched Leather Border',
      category: 'Borders & Outlines',
      description: 'Solid dark rim with a pale dashed seam stitched just inside it, the seam pulling tighter to the edge on hover.',
      html, css,
      tags: ['stitched', 'leather', 'seam', 'dashed', 'border'],
    }))
  }

  /* 12. Chamfered border — cut corners kept by a layered gradient rim */
  {
    const c = cls('v12-bdr-chamfer')
    const html = `<div class="${c}"><span>Chamfered</span></div>`
    const css = `.${c} {
  position: relative;
  padding: 2px;
  background: linear-gradient(135deg, #f43f5e, #fb7185 50%, #f43f5e);
  clip-path: polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px);
  transition: filter 0.3s ease;
}
.${c} span {
  display: block;
  padding: 0.9rem 2rem;
  background: #0b1020;
  color: #fecdd3;
  font-weight: 600;
  clip-path: polygon(13px 0, calc(100% - 13px) 0, 100% 13px, 100% calc(100% - 13px), calc(100% - 13px) 100%, 13px 100%, 0 calc(100% - 13px), 0 13px);
  transition: background 0.3s ease;
}
.${c}:hover { filter: drop-shadow(0 0 8px rgba(244,63,94,0.5)); }
.${c}:hover span { background: #1f0a12; }`
    add(mk({
      name: 'Chamfered Corner Border',
      category: 'Borders & Outlines',
      description: 'Octagonal panel whose bevelled corners keep a crisp gradient rim by nesting two matching clip-paths.',
      html, css,
      tags: ['chamfer', 'octagon', 'clip-path', 'gradient', 'border'],
    }))
  }

  /* ───────────────────────── Progress & Meters ───────────────────────── */

  /* 13. Liquid tank — a rotating wave fills a rounded vessel to 60% */
  {
    const c = cls('v12-prg-tank')
    const html = `<div class="${c}"><span class="wave"></span><b>60%</b></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 3px solid #0e7490;
  background: #082f49;
  overflow: hidden;
  isolation: isolate;
}
.${c} .wave {
  position: absolute;
  left: -50%;
  top: 40%;
  width: 200%;
  height: 200%;
  background: #06b6d4;
  border-radius: 42% 45% 44% 46%;
  opacity: 0.85;
  animation: ${c}-spin 5s linear infinite;
}
.${c} b {
  position: relative;
  z-index: 1;
  font-size: 1.3rem;
  font-weight: 800;
  color: #ecfeff;
  text-shadow: 0 1px 4px rgba(8,47,73,0.7);
}
@keyframes ${c}-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`
    add(mk({
      name: 'Liquid Tank Meter',
      category: 'Progress & Meters',
      description: 'Circular vessel filled to sixty percent by a slowly rotating blob whose uneven rim reads as a lapping wave.',
      html, css,
      tags: ['liquid', 'wave', 'tank', 'fill', 'meter'],
    }))
  }

  /* 14. Chevron track — arrow-shaped segments light up in sequence */
  {
    const c = cls('v12-prg-chevron')
    const html = `<div class="${c}"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: flex;
  gap: 4px;
  padding: 0.5rem;
  background: #1c1206;
  border-radius: 0.5rem;
}
.${c} i {
  display: block;
  width: 26px;
  height: 22px;
  background: #3f2a0a;
  clip-path: polygon(0 0, 70% 0, 100% 50%, 70% 100%, 0 100%, 30% 50%);
  transition: background 0.3s ease;
}
.${c} i.on { background: #f59e0b; }
.${c}:hover i:nth-child(5),
.${c}:hover i:nth-child(6) { background: #fbbf24; }`
    add(mk({
      name: 'Chevron Track Meter',
      category: 'Progress & Meters',
      description: 'A row of arrow-shaped chevrons filled left to right, with two more lighting up on hover to preview the next step.',
      html, css,
      tags: ['chevron', 'arrows', 'segments', 'track', 'meter'],
    }))
  }

  /* 15. Radial dots — twelve dots on a ring, eight lit clockwise */
  {
    const c = cls('v12-prg-radialdots')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><b>8<small>/12</small></b></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 110px;
  height: 110px;
  color: #d1fae5;
}
.${c} b { font-size: 1.4rem; font-weight: 800; }
.${c} b small { font-size: 0.7rem; font-weight: 500; color: #6ee7b7; }
.${c} i {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  margin: -5px;
  border-radius: 50%;
  background: #064e3b;
  transform: rotate(var(--a)) translateY(-46px);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}
.${c} i:nth-child(1) { --a: 0deg; }
.${c} i:nth-child(2) { --a: 30deg; }
.${c} i:nth-child(3) { --a: 60deg; }
.${c} i:nth-child(4) { --a: 90deg; }
.${c} i:nth-child(5) { --a: 120deg; }
.${c} i:nth-child(6) { --a: 150deg; }
.${c} i:nth-child(7) { --a: 180deg; }
.${c} i:nth-child(8) { --a: 210deg; }
.${c} i:nth-child(9) { --a: 240deg; }
.${c} i:nth-child(10) { --a: 270deg; }
.${c} i:nth-child(11) { --a: 300deg; }
.${c} i:nth-child(12) { --a: 330deg; }
.${c} i:nth-child(-n+8) { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.6); }
.${c}:hover i:nth-child(9) { background: #34d399; box-shadow: 0 0 8px rgba(16,185,129,0.6); }`
    add(mk({
      name: 'Radial Dots Meter',
      category: 'Progress & Meters',
      description: 'Twelve dots arranged on a ring with eight lit clockwise around a fraction readout; hover previews the ninth.',
      html, css,
      tags: ['radial', 'dots', 'ring', 'fraction', 'meter'],
    }))
  }

  /* 16. Marker bar — slim track with a thumb and floating value bubble */
  {
    const c = cls('v12-prg-marker')
    const html = `<div class="${c}"><span class="track"><span class="fill"><span class="bubble">72%</span></span></span></div>`
    const css = `.${c} {
  display: flex;
  align-items: flex-end;
  width: 220px;
  height: 44px;
}
.${c} .track {
  position: relative;
  display: block;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #1e1b4b;
}
.${c} .fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: 72%;
  border-radius: 999px;
  background: linear-gradient(90deg, #4338ca, #6366f1);
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.${c} .fill::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -7px;
  width: 14px;
  height: 14px;
  margin-top: -7px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #6366f1;
  box-sizing: border-box;
}
.${c} .bubble {
  position: absolute;
  right: -16px;
  bottom: 14px;
  padding: 2px 7px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  background: #6366f1;
  border-radius: 0.3rem;
  white-space: nowrap;
}
.${c} .bubble::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -4px;
  margin-left: -4px;
  border: 4px solid transparent;
  border-top-color: #6366f1;
  border-bottom: 0;
}
.${c}:hover .fill { width: 88%; }`
    add(mk({
      name: 'Marker Bubble Progress',
      category: 'Progress & Meters',
      description: 'Slim progress track with a round thumb marker and a floating value bubble that ride the fill as it grows.',
      html, css,
      tags: ['marker', 'bubble', 'tooltip', 'thumb', 'progress'],
    }))
  }

  /* 17. Ticker meter — dense hairline bars, the lit run graded in colour */
  {
    const c = cls('v12-prg-ticker')
    const html = `<div class="${c}"><span class="bars"></span><span class="lbl"><i>Load</i><i>65%</i></span></div>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 220px;
  padding: 0.7rem 0.8rem;
  background: #0f172a;
  border-radius: 0.6rem;
  border: 1px solid #1e293b;
}
.${c} .bars {
  display: block;
  height: 28px;
  background:
    linear-gradient(90deg, #f43f5e 0%, #fb7185 65%, #334155 65%, #334155 100%);
  -webkit-mask: repeating-linear-gradient(90deg, #000 0 3px, transparent 3px 6px);
  mask: repeating-linear-gradient(90deg, #000 0 3px, transparent 3px 6px);
  transition: background 0.4s ease;
}
.${c}:hover .bars {
  background: linear-gradient(90deg, #f43f5e 0%, #fb7185 82%, #334155 82%, #334155 100%);
}
.${c} .lbl {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  color: #94a3b8;
}
.${c} .lbl i { font-style: normal; }
.${c} .lbl i:last-child { color: #fda4af; font-weight: 700; }`
    add(mk({
      name: 'Ticker Line Meter',
      category: 'Progress & Meters',
      description: 'Dozens of hairline bars masked from a single gradient, the lit run brightening toward its end and growing on hover.',
      html, css,
      tags: ['ticker', 'hairline', 'bars', 'mask', 'meter'],
    }))
  }

  /* 18. XP level bar — game-style progress with a level badge and shine */
  {
    const c = cls('v12-prg-xp')
    const html = `<div class="${c}"><span class="lvl">12</span><span class="track"><span class="fill"></span></span><span class="nxt">13</span></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 230px;
  padding: 0.5rem 0.6rem;
  background: #1e1033;
  border: 1px solid #4c1d95;
  border-radius: 999px;
}
.${c} .lvl,
.${c} .nxt {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 800;
  color: #fff;
  background: #8b5cf6;
  box-shadow: 0 0 10px rgba(139,92,246,0.5);
  flex: none;
}
.${c} .nxt { background: #2e1065; color: #a78bfa; box-shadow: none; }
.${c} .track {
  flex: 1;
  height: 10px;
  border-radius: 999px;
  background: #2e1065;
  overflow: hidden;
}
.${c} .fill {
  display: block;
  width: 45%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed);
  background-size: 200% 100%;
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1), background-position 0.6s ease;
}
.${c}:hover .fill { width: 78%; background-position: 100% 0; }`
    add(mk({
      name: 'XP Level Bar',
      category: 'Progress & Meters',
      description: 'Game-style experience bar bracketed by current and next level badges, gaining a chunk of XP on hover.',
      html, css,
      tags: ['xp', 'level', 'game', 'badge', 'progress'],
    }))
  }

  /* ───────────────────────── Avatars & Images ───────────────────────── */

  /* 19. Hexagon avatar — initials disc clipped to a hexagon with a rim */
  {
    const c = cls('v12-av-hex')
    const html = `<div class="${c}"><span>JD</span></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 84px;
  background: #14b8a6;
  clip-path: polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
  transition: transform 0.3s ease, background 0.3s ease;
}
.${c} span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  background: linear-gradient(135deg, #0f766e, #134e4a);
  clip-path: polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
  color: #ccfbf1;
  font-weight: 800;
  font-size: 1.4rem;
  letter-spacing: 0.04em;
}
.${c}:hover { transform: rotate(30deg) scale(1.06); background: #5eead4; }
.${c}:hover span { transform: rotate(-30deg); }`
    add(mk({
      name: 'Hexagon Avatar',
      category: 'Avatars & Images',
      description: 'Initials on a gradient hexagon with a teal rim, the tile rotating a notch on hover while the letters stay upright.',
      html, css,
      tags: ['hexagon', 'avatar', 'initials', 'clip-path', 'rim'],
    }))
  }

  /* 20. Verified avatar — check badge tucked into the corner, wiggles on hover */
  {
    const c = cls('v12-av-verified')
    const html = `<div class="${c}"><span class="disc">AR</span><span class="badge">✓</span></div>`
    const css = `.${c} {
  position: relative;
  width: 76px;
  height: 76px;
}
.${c} .disc {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: #fff;
  font-weight: 700;
  font-size: 1.3rem;
  box-shadow: 0 0 0 3px #0b1020, 0 0 0 5px #0284c7;
  transition: box-shadow 0.3s ease;
}
.${c} .badge {
  position: absolute;
  right: -4px;
  bottom: -2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #0ea5e9;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 900;
  border: 3px solid #0b1020;
  transform-origin: 50% 50%;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c}:hover .disc { box-shadow: 0 0 0 3px #0b1020, 0 0 0 5px #38bdf8, 0 0 20px rgba(14,165,233,0.5); }
.${c}:hover .badge { transform: scale(1.25) rotate(12deg); }`
    add(mk({
      name: 'Verified Check Avatar',
      category: 'Avatars & Images',
      description: 'Ringed initials avatar with a verified check badge tucked into the corner that pops larger on hover.',
      html, css,
      tags: ['verified', 'badge', 'check', 'avatar', 'ring'],
    }))
  }

  /* 21. Flip avatar — initials on the front, name and role on the back */
  {
    const c = cls('v12-av-flip')
    const html = `<div class="${c}"><span class="in"><span class="f">MK</span><span class="b">Mia<small>Design</small></span></span></div>`
    const css = `.${c} {
  width: 84px;
  height: 84px;
  perspective: 500px;
}
.${c} .in {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
}
.${c} .f,
.${c} .b {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  backface-visibility: hidden;
  color: #fff;
  font-weight: 800;
}
.${c} .f {
  font-size: 1.5rem;
  background: linear-gradient(135deg, #d946ef, #86198f);
}
.${c} .b {
  font-size: 0.95rem;
  background: #4a044e;
  border: 2px solid #d946ef;
  transform: rotateY(180deg);
}
.${c} .b small { font-size: 0.65rem; font-weight: 500; color: #f0abfc; }
.${c}:hover .in { transform: rotateY(180deg); }`
    add(mk({
      name: 'Flip Avatar',
      category: 'Avatars & Images',
      description: 'Circular avatar showing initials that flips over in 3D on hover to reveal the name and role on its back.',
      html, css,
      tags: ['flip', '3d', 'avatar', 'reveal', 'name'],
    }))
  }

  /* 22. Speaking avatar — audio-style rings ripple outward */
  {
    const c = cls('v12-av-speaking')
    const html = `<div class="${c}"><span class="disc">EL</span><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 110px;
  height: 110px;
}
.${c} .disc {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #34d399, #047857);
  color: #fff;
  font-weight: 700;
  font-size: 1.2rem;
  border: 3px solid #10b981;
}
.${c} i {
  position: absolute;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid #10b981;
  animation: ${c}-ring 1.8s ease-out infinite;
}
.${c} i:nth-child(3) { animation-delay: 0.9s; }
@keyframes ${c}-ring {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.7); opacity: 0; }
}`
    add(mk({
      name: 'Speaking Avatar',
      category: 'Avatars & Images',
      description: 'Voice-call avatar with rings that ripple outward from the disc to show the person is currently speaking.',
      html, css,
      tags: ['speaking', 'ripple', 'rings', 'avatar', 'voice'],
    }))
  }

  /* 23. Avatar name chip — pill that expands to show the role on hover */
  {
    const c = cls('v12-av-chip')
    const html = `<span class="${c}"><span class="disc">SO</span><span class="nm">Sam Ortiz</span><span class="rl">Engineering</span></span>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 4px 12px 4px 4px;
  background: #1c1917;
  border: 1px solid #44403c;
  border-radius: 999px;
  color: #fafaf9;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: default;
  transition: border-color 0.3s ease, background 0.3s ease;
}
.${c} .disc {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fb923c, #c2410c);
  font-size: 0.7rem;
  font-weight: 800;
  flex: none;
}
.${c} .rl {
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  font-size: 0.7rem;
  font-weight: 500;
  color: #fdba74;
  transition: max-width 0.4s ease, margin-left 0.4s ease;
}
.${c}:hover { border-color: #f97316; background: #292524; }
.${c}:hover .rl { max-width: 120px; margin-left: 0.15rem; }`
    add(mk({
      name: 'Avatar Name Chip',
      category: 'Avatars & Images',
      description: 'Compact avatar-and-name pill that stretches on hover to reveal the person’s team beside their name.',
      html, css,
      tags: ['chip', 'pill', 'avatar', 'name', 'expand'],
    }))
  }

  /* 24. Selectable avatar — checkbox avatar gains a ring and check on :checked */
  {
    const c = cls('v12-av-select')
    const html = `<label class="${c}"><input type="checkbox"><span class="disc">TN</span><span class="chk">✓</span></label>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  width: 76px;
  height: 76px;
  cursor: pointer;
}
.${c} input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.${c} .disc {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: linear-gradient(135deg, #818cf8, #3730a3);
  color: #fff;
  font-weight: 700;
  font-size: 1.3rem;
  box-shadow: 0 0 0 0 rgba(99,102,241,0);
  transition: box-shadow 0.25s ease, transform 0.25s ease, filter 0.25s ease;
}
.${c} .chk {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #6366f1;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 900;
  border: 3px solid #0b1020;
  transform: scale(0);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c}:hover .disc { box-shadow: 0 0 0 4px rgba(99,102,241,0.35); }
.${c} input:checked ~ .disc { box-shadow: 0 0 0 4px #6366f1; transform: scale(0.94); }
.${c} input:checked ~ .chk { transform: scale(1); }`
    add(mk({
      name: 'Selectable Avatar',
      category: 'Avatars & Images',
      description: 'Avatar wrapped in a checkbox label that shrinks inside a solid ring and sprouts a check badge when selected.',
      html, css,
      tags: ['selectable', 'checkbox', 'avatar', 'checked', 'ring'],
    }))
  }
}
