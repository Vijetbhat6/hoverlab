// scripts/generate-effects-v12-a.mjs
//
// Twelfth wave, part A: Buttons, Loaders, Cards, Text. Six designs per
// category, one entry per design — same discipline as v11 (no colorway
// or size stamping; the Customize panel re-tokens anything).
//
// Every design here is picked to be a different mechanic from what the
// thinned catalog already carries in its category:
//
//   Buttons — blinds fill, hazard stripes, echo rings, icon flip,
//             marquee label, fan stack
//   Loaders — sliding squares, helix, radar sweep, coin flip,
//             rolling ball, ping ripple
//   Cards   — flip reveal, ticket stub, caption slide, terminal,
//             folder tab, holo foil
//   Text    — glitch, long shadow, split slide, circled, mirror,
//             letterpress
//
// Constraints inherited from the assembly guard: roots visible at rest,
// no position:absolute on roots, infinite keyframes rest sensibly at
// their 100% stop, everything fits a ~300x180 dark preview.

export function generateV12A(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Buttons                                                             */
  /* ------------------------------------------------------------------ */

  /* B1. Blinds fill — five vertical slats grow to flood the button */
  {
    const c = cls('v12-btn-blinds')
    const html = `<button class="${c}"><span>Open up</span></button>`
    const css = `.${c} {
  position: relative;
  padding: 0.65rem 1.7rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #5eead4;
  background: transparent;
  border: 2px solid #14b8a6;
  border-radius: 0.5rem;
  cursor: pointer;
  overflow: hidden;
  isolation: isolate;
}
.${c} span { position: relative; z-index: 1; transition: color 0.35s ease; }
.${c}::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(#14b8a6, #14b8a6),
    linear-gradient(#14b8a6, #14b8a6),
    linear-gradient(#14b8a6, #14b8a6),
    linear-gradient(#14b8a6, #14b8a6),
    linear-gradient(#14b8a6, #14b8a6);
  background-repeat: no-repeat;
  background-size: 0% 100%;
  background-position: 0% 0, 25% 0, 50% 0, 75% 0, 100% 0;
  transition: background-size 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c}:hover::before { background-size: 21% 100%; }
.${c}:hover span { color: #042f2e; }`
    add(mk({
      name: 'Blinds Fill Button',
      category: 'Buttons',
      description: 'Outline button whose background fills in as five vertical window blinds that widen until they meet.',
      html, css,
      tags: ['blinds', 'slats', 'fill', 'outline', 'hover-fill'],
    }))
  }

  /* B2. Hazard stripes — diagonal warning stripes start marching on hover */
  {
    const c = cls('v12-btn-hazard')
    const html = `<button class="${c}"><span>Danger zone</span></button>`
    const css = `.${c} {
  position: relative;
  padding: 0.7rem 1.6rem;
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #1c1917;
  background: #f59e0b;
  border: 2px solid #1c1917;
  border-radius: 0.35rem;
  cursor: pointer;
  overflow: hidden;
}
.${c} span { position: relative; z-index: 1; }
.${c}::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(-45deg, transparent 0 12px, rgba(28,25,23,0.9) 12px 24px);
  background-size: 34px 34px;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.${c}:hover::before {
  opacity: 1;
  animation: ${c}-march 0.6s linear infinite;
}
.${c}:hover span { color: #fef3c7; text-shadow: 0 1px 0 #1c1917, 0 0 6px #1c1917; }
@keyframes ${c}-march {
  from { background-position: 0 0; }
  to { background-position: 34px 0; }
}`
    add(mk({
      name: 'Hazard Stripe Button',
      category: 'Buttons',
      description: 'Amber warning button that reveals marching diagonal hazard stripes while hovered.',
      html, css,
      tags: ['hazard', 'stripes', 'warning', 'marching', 'danger'],
    }))
  }

  /* B3. Echo rings — two outline echoes push outward and fade on hover */
  {
    const c = cls('v12-btn-echo')
    const html = `<button class="${c}"><span>Broadcast</span></button>`
    const css = `.${c} {
  position: relative;
  padding: 0.65rem 1.6rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  background: #8b5cf6;
  border: none;
  border-radius: 999px;
  cursor: pointer;
}
.${c} span { position: relative; z-index: 1; }
.${c}::before,
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid #a78bfa;
  border-radius: inherit;
  opacity: 0;
  transform: scale(1);
  pointer-events: none;
}
.${c}:hover { background: #7c3aed; }
.${c}:hover::before, .${c}:hover::after { animation: ${c}-echo 0.8s ease-out forwards; }
.${c}:hover::after { animation-delay: 0.16s; }
@keyframes ${c}-echo {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.4, 2.1); opacity: 0; }
}`
    add(mk({
      name: 'Echo Ring Button',
      category: 'Buttons',
      description: 'Pill button that emits two outline echoes rippling outward and fading when hovered.',
      html, css,
      tags: ['echo', 'ring', 'sonar', 'pill', 'ripple-out'],
    }))
  }

  /* B4. Icon flip — a tiny cube in the icon slot flips from bolt to check */
  {
    const c = cls('v12-btn-iconflip')
    const html = `<button class="${c}"><i><b>⚡</b><b>✓</b></i><span>Deploy</span></button>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1.3rem 0.6rem 0.8rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #ecfdf5;
  background: #064e3b;
  border: 1px solid #10b981;
  border-radius: 0.6rem;
  cursor: pointer;
  transition: background 0.3s ease;
}
.${c} i {
  position: relative;
  width: 26px;
  height: 26px;
  perspective: 120px;
  font-style: normal;
}
.${c} b {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 0.4rem;
  backface-visibility: hidden;
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} b:first-child { background: #10b981; color: #022c22; transform: rotateX(0deg); }
.${c} b:last-child { background: #a7f3d0; color: #064e3b; transform: rotateX(-180deg); }
.${c}:hover { background: #065f46; }
.${c}:hover b:first-child { transform: rotateX(180deg); }
.${c}:hover b:last-child { transform: rotateX(0deg); }`
    add(mk({
      name: 'Icon Flip Button',
      category: 'Buttons',
      description: 'Button whose icon tile flips over like a coin on hover to reveal a checkmark on its back face.',
      html, css,
      tags: ['icon', 'flip', '3d', 'check', 'rotate'],
    }))
  }

  /* B5. Marquee label — the label turns into a scrolling ticker on hover */
  {
    const c = cls('v12-btn-marquee')
    const html = `<button class="${c}"><span>Now streaming</span><em><b>Now streaming · Live · Now streaming · Live · </b><b>Now streaming · Live · Now streaming · Live · </b></em></button>`
    const css = `.${c} {
  position: relative;
  width: 170px;
  height: 44px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #fdf4ff;
  background: #d946ef;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  overflow: hidden;
}
.${c} span {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.${c} em {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  white-space: nowrap;
  font-style: normal;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.${c} b { padding-right: 0; }
.${c}:hover span { opacity: 0; transform: translateY(-8px); }
.${c}:hover em { opacity: 1; }
.${c}:hover b { animation: ${c}-tick 5s linear infinite; }
@keyframes ${c}-tick {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}`
    add(mk({
      name: 'Marquee Label Button',
      category: 'Buttons',
      description: 'The static label lifts away on hover and a looping ticker of text scrolls across the button instead.',
      html, css,
      tags: ['marquee', 'ticker', 'scroll', 'label', 'live'],
    }))
  }

  /* B6. Fan stack — three colored sheets behind the button fan out */
  {
    const c = cls('v12-btn-fan')
    const html = `<span class="${c}"><i></i><i></i><button>Browse deck</button></span>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
}
.${c} button {
  position: relative;
  z-index: 2;
  padding: 0.65rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  background: #f43f5e;
  border: none;
  border-radius: 0.55rem;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(244,63,94,0.35);
  transition: transform 0.35s ease;
}
.${c} i {
  position: absolute;
  inset: 0;
  border-radius: 0.55rem;
  transform-origin: 20% 120%;
  transition: transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} i:nth-child(1) { background: #fb7185; z-index: 1; }
.${c} i:nth-child(2) { background: #fda4af; z-index: 0; }
.${c}:hover i:nth-child(1) { transform: rotate(-9deg) translate(2px, -3px); }
.${c}:hover i:nth-child(2) { transform: rotate(-18deg) translate(4px, -6px); }
.${c}:hover button { transform: rotate(3deg); }`
    add(mk({
      name: 'Fan Stack Button',
      category: 'Buttons',
      description: 'A button sitting on a stack of colored sheets that fan out behind it like a hand of cards on hover.',
      html, css,
      tags: ['fan', 'stack', 'cards', 'layers', 'rotate'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Loaders                                                             */
  /* ------------------------------------------------------------------ */

  /* L1. Sliding squares — three tiles chase around a 2×2 grid */
  {
    const c = cls('v12-ld-tiles')
    const html = `<div class="${c}"><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 56px;
  height: 56px;
}
.${c} i {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 5px;
  background: #6366f1;
  animation: ${c}-slide 2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
.${c} i { top: 0; left: 0; }
.${c} i:nth-child(2) { animation-delay: -0.5s; background: #818cf8; }
.${c} i:nth-child(3) { animation-delay: -1s; background: #a5b4fc; }
@keyframes ${c}-slide {
  0%, 20% { transform: translate(0, 0); }
  25%, 45% { transform: translate(32px, 0); }
  50%, 70% { transform: translate(32px, 32px); }
  75%, 95% { transform: translate(0, 32px); }
  100% { transform: translate(0, 0); }
}`
    add(mk({
      name: 'Sliding Tiles Loader',
      category: 'Loaders',
      description: 'Three square tiles slide around a two-by-two grid, always leaving one empty slot like a sliding puzzle.',
      html, css,
      tags: ['tiles', 'squares', 'grid', 'puzzle', 'slide'],
    }))
  }

  /* L2. Helix — two strands of dots weave past each other */
  {
    const c = cls('v12-ld-helix')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
}
.${c} i {
  position: relative;
  width: 8px;
  height: 40px;
}
.${c} i::before,
.${c} i::after {
  content: '';
  position: absolute;
  left: 0;
  top: 16px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: ${c}-weave 1.4s ease-in-out infinite;
}
.${c} i::before { background: #14b8a6; }
.${c} i::after { background: #99f6e4; animation-delay: -0.7s; }
.${c} i:nth-child(2)::before { animation-delay: -0.14s; } .${c} i:nth-child(2)::after { animation-delay: -0.84s; }
.${c} i:nth-child(3)::before { animation-delay: -0.28s; } .${c} i:nth-child(3)::after { animation-delay: -0.98s; }
.${c} i:nth-child(4)::before { animation-delay: -0.42s; } .${c} i:nth-child(4)::after { animation-delay: -1.12s; }
.${c} i:nth-child(5)::before { animation-delay: -0.56s; } .${c} i:nth-child(5)::after { animation-delay: -1.26s; }
.${c} i:nth-child(6)::before { animation-delay: -0.7s; } .${c} i:nth-child(6)::after { animation-delay: -1.4s; }
.${c} i:nth-child(7)::before { animation-delay: -0.84s; } .${c} i:nth-child(7)::after { animation-delay: -0.14s; }
.${c} i:nth-child(8)::before { animation-delay: -0.98s; } .${c} i:nth-child(8)::after { animation-delay: -0.28s; }
.${c} i:nth-child(9)::before { animation-delay: -1.12s; } .${c} i:nth-child(9)::after { animation-delay: -0.42s; }
.${c} i:nth-child(10)::before { animation-delay: -1.26s; } .${c} i:nth-child(10)::after { animation-delay: -0.56s; }
@keyframes ${c}-weave {
  0% { transform: translateY(-14px) scale(1); z-index: 1; }
  25% { transform: translateY(0) scale(0.6); }
  50% { transform: translateY(14px) scale(1); z-index: 0; }
  75% { transform: translateY(0) scale(0.6); }
  100% { transform: translateY(-14px) scale(1); }
}`
    add(mk({
      name: 'Helix Strand Loader',
      category: 'Loaders',
      description: 'Two rows of dots weave over and under each other in a sine wave like a rotating DNA helix.',
      html, css,
      tags: ['helix', 'dna', 'weave', 'dots', 'wave'],
    }))
  }

  /* L3. Radar sweep — a conic beam rotates over a ringed scope with blips */
  {
    const c = cls('v12-ld-radar')
    const html = `<div class="${c}"><i></i><i></i><b></b></div>`
    const css = `.${c} {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  border: 1.5px solid rgba(16,185,129,0.6);
  background:
    linear-gradient(rgba(16,185,129,0.35), rgba(16,185,129,0.35)) 50% 0 / 1px 100% no-repeat,
    linear-gradient(rgba(16,185,129,0.35), rgba(16,185,129,0.35)) 0 50% / 100% 1px no-repeat,
    radial-gradient(circle, transparent 0 25px, rgba(16,185,129,0.4) 25px 26px, transparent 26px);
  overflow: hidden;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0 250deg, rgba(16,185,129,0.05) 250deg, rgba(16,185,129,0.75) 360deg);
  animation: ${c}-sweep 2.4s linear infinite;
}
.${c} i {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6ee7b7;
  box-shadow: 0 0 6px #34d399;
  animation: ${c}-blip 2.4s linear infinite;
}
.${c} i:nth-child(1) { top: 20px; left: 54px; animation-delay: -1.9s; }
.${c} i:nth-child(2) { top: 56px; left: 26px; animation-delay: -0.9s; }
.${c} b {
  position: absolute;
  top: 50%; left: 50%;
  width: 4px; height: 4px;
  margin: -2px 0 0 -2px;
  border-radius: 50%;
  background: #a7f3d0;
}
@keyframes ${c}-sweep { to { transform: rotate(360deg); } }
@keyframes ${c}-blip {
  0%, 8% { opacity: 1; transform: scale(1); }
  60%, 100% { opacity: 0.15; transform: scale(0.7); }
}`
    add(mk({
      name: 'Radar Sweep Loader',
      category: 'Loaders',
      description: 'A green radar scope with a rotating sweep beam that lights up two blips as it passes over them.',
      html, css,
      tags: ['radar', 'sweep', 'scope', 'conic', 'blip'],
    }))
  }

  /* L4. Coin flip — a two-faced coin spins around its vertical axis */
  {
    const c = cls('v12-ld-coin')
    const html = `<div class="${c}"><i>$</i><i>¢</i></div>`
    const css = `.${c} {
  position: relative;
  width: 56px;
  height: 56px;
  perspective: 300px;
}
.${c} i {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font: 700 1.5rem/1 ui-monospace, monospace;
  font-style: normal;
  color: #78350f;
  background: radial-gradient(circle at 35% 30%, #fde68a, #f59e0b 65%, #b45309);
  box-shadow: inset 0 0 0 4px rgba(120,53,15,0.35);
  backface-visibility: hidden;
  animation: ${c}-spin 1.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
.${c} i:last-child {
  color: #fef3c7;
  background: radial-gradient(circle at 35% 30%, #fbbf24, #d97706 65%, #92400e);
  transform: rotateY(180deg);
  animation-name: ${c}-spin2;
}
@keyframes ${c}-spin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
@keyframes ${c}-spin2 { from { transform: rotateY(180deg); } to { transform: rotateY(540deg); } }`
    add(mk({
      name: 'Coin Flip Loader',
      category: 'Loaders',
      description: 'A gold coin with two different faces spins continuously around its vertical axis.',
      html, css,
      tags: ['coin', 'flip', '3d', 'spin', 'gold'],
    }))
  }

  /* L5. Rolling ball — a ball rolls along a track and back, squashing at the ends */
  {
    const c = cls('v12-ld-roll')
    const html = `<div class="${c}"><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 140px;
  height: 36px;
  border-bottom: 2px solid rgba(249,115,22,0.45);
}
.${c} i {
  position: absolute;
  left: 0;
  bottom: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background:
    linear-gradient(90deg, transparent 0 46%, #7c2d12 46% 54%, transparent 54%),
    linear-gradient(0deg, transparent 0 46%, #7c2d12 46% 54%, transparent 54%),
    #f97316;
  animation: ${c}-roll 1.6s ease-in-out infinite;
}
@keyframes ${c}-roll {
  0% { transform: translateX(0) rotate(0deg) scale(1); }
  10% { transform: translateX(0) rotate(0deg) scale(1.15, 0.85); }
  50% { transform: translateX(116px) rotate(540deg) scale(1); }
  60% { transform: translateX(116px) rotate(540deg) scale(1.15, 0.85); }
  100% { transform: translateX(0) rotate(0deg) scale(1); }
}`
    add(mk({
      name: 'Rolling Ball Loader',
      category: 'Loaders',
      description: 'A patterned ball rolls back and forth along a rail, squashing briefly each time it hits an end.',
      html, css,
      tags: ['ball', 'roll', 'rail', 'squash', 'bounce'],
    }))
  }

  /* L6. Ping ripple — rings expand outward from a steady center dot */
  {
    const c = cls('v12-ld-ping')
    const html = `<div class="${c}"><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 72px;
  height: 72px;
}
.${c}::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 14px; height: 14px;
  margin: -7px 0 0 -7px;
  border-radius: 50%;
  background: #06b6d4;
  box-shadow: 0 0 10px #22d3ee;
}
.${c} i {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid #22d3ee;
  opacity: 0;
  animation: ${c}-ping 2.1s cubic-bezier(0, 0.5, 0.5, 1) infinite;
}
.${c} i:nth-child(2) { animation-delay: -0.7s; }
.${c} i:nth-child(3) { animation-delay: -1.4s; }
@keyframes ${c}-ping {
  0% { transform: scale(0.2); opacity: 0.9; }
  100% { transform: scale(1); opacity: 0.12; }
}`
    add(mk({
      name: 'Ping Ripple Loader',
      category: 'Loaders',
      description: 'Concentric rings ripple outward from a glowing center dot and fade as they reach the edge.',
      html, css,
      tags: ['ping', 'ripple', 'rings', 'sonar', 'pulse'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Cards                                                               */
  /* ------------------------------------------------------------------ */

  /* C1. Flip reveal — the whole card turns over to its back face */
  {
    const c = cls('v12-card-flip')
    const html = `<div class="${c}"><div class="in"><div class="face f"><b>Design Systems</b><span>Hover to flip</span></div><div class="face b"><b>Back face</b><span>Tokens · Components · Docs</span></div></div></div>`
    const css = `.${c} {
  width: 200px;
  height: 120px;
  perspective: 700px;
}
.${c} .in {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c}:hover .in { transform: rotateY(180deg); }
.${c} .face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 1rem 1.1rem;
  border-radius: 0.8rem;
  backface-visibility: hidden;
  font-family: system-ui, sans-serif;
}
.${c} .f { background: #1e1b4b; border: 1px solid #4338ca; color: #e0e7ff; }
.${c} .b { background: #6366f1; color: #fff; transform: rotateY(180deg); }
.${c} b { font-size: 1rem; font-weight: 700; }
.${c} span { font-size: 0.75rem; opacity: 0.8; }`
    add(mk({
      name: 'Flip Reveal Card',
      category: 'Cards',
      description: 'A card that rotates around its vertical axis on hover to show a solid-colored back face.',
      html, css,
      tags: ['flip', '3d', 'reveal', 'back-face', 'rotate'],
    }))
  }

  /* C2. Ticket stub — perforated tear line and semicircle notches */
  {
    const c = cls('v12-card-ticket')
    const html = `<div class="${c}"><div class="main"><small>ADMIT ONE</small><b>Late Show</b><span>Row F · Seat 12</span></div><div class="stub"><b>F12</b></div></div>`
    const css = `.${c} {
  display: flex;
  width: 230px;
  height: 96px;
  font-family: system-ui, sans-serif;
  color: #451a03;
  filter: drop-shadow(0 6px 12px rgba(0,0,0,0.4));
}
.${c} .main, .${c} .stub {
  position: relative;
  background: #fbbf24;
}
.${c} .main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.6rem 1rem;
  border-radius: 0.6rem 0 0 0.6rem;
  background:
    radial-gradient(circle at 100% 0, transparent 8px, #fbbf24 8.5px) top right / 50% 51% no-repeat,
    radial-gradient(circle at 100% 100%, transparent 8px, #fbbf24 8.5px) bottom right / 50% 51% no-repeat,
    linear-gradient(#fbbf24, #fbbf24) left / 50% 100% no-repeat;
}
.${c} .main::after {
  content: '';
  position: absolute;
  right: -1px;
  top: 12px;
  bottom: 12px;
  border-right: 2px dashed rgba(69,26,3,0.45);
}
.${c} .stub {
  width: 64px;
  display: grid;
  place-items: center;
  border-radius: 0 0.6rem 0.6rem 0;
  background:
    radial-gradient(circle at 0 0, transparent 8px, #f59e0b 8.5px) top left / 50% 51% no-repeat,
    radial-gradient(circle at 0 100%, transparent 8px, #f59e0b 8.5px) bottom left / 50% 51% no-repeat,
    linear-gradient(#f59e0b, #f59e0b) right / 50% 100% no-repeat;
  transform-origin: 0 100%;
  transition: transform 0.4s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.${c}:hover .stub { transform: rotate(6deg) translateX(6px); }
.${c} small { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.2em; opacity: 0.85; }
.${c} .main b { font-size: 1.05rem; font-weight: 800; }
.${c} .stub b { font-size: 1.1rem; font-weight: 800; }
.${c} span { font-size: 0.72rem; opacity: 0.8; }`
    add(mk({
      name: 'Ticket Stub Card',
      category: 'Cards',
      description: 'An event ticket with notched edges and a perforated line whose stub tears away slightly on hover.',
      html, css,
      tags: ['ticket', 'stub', 'perforated', 'notch', 'event'],
    }))
  }

  /* C3. Caption slide — image card whose caption slides up over the picture */
  {
    const c = cls('v12-card-caption')
    const html = `<div class="${c}"><div class="cap"><b>Coral Reef</b><span>Photo essay · 12 shots</span></div></div>`
    const css = `.${c} {
  position: relative;
  width: 200px;
  height: 130px;
  border-radius: 0.8rem;
  overflow: hidden;
  background:
    radial-gradient(circle at 25% 30%, #fb7185 0 18%, transparent 19%),
    radial-gradient(circle at 70% 60%, #fda4af 0 24%, transparent 25%),
    radial-gradient(circle at 85% 20%, #fecdd3 0 10%, transparent 11%),
    linear-gradient(160deg, #9f1239, #4c0519);
  font-family: system-ui, sans-serif;
  color: #fff;
  box-shadow: 0 8px 20px rgba(0,0,0,0.4);
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.75), transparent 60%);
  transition: opacity 0.35s ease;
}
.${c} .cap {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  padding: 0.75rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transform: translateY(calc(100% - 2.6rem));
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} b { font-size: 0.95rem; font-weight: 700; line-height: 1.6rem; }
.${c} span {
  font-size: 0.75rem;
  opacity: 0;
  background: #f43f5e;
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: 999px;
  transition: opacity 0.3s ease 0.15s;
}
.${c}:hover .cap { transform: translateY(0); }
.${c}:hover span { opacity: 1; }
.${c}:hover::before { opacity: 1; background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2)); }`
    add(mk({
      name: 'Caption Slide Card',
      category: 'Cards',
      description: 'A media card where only the title peeks up from the bottom until hover slides the full caption into view.',
      html, css,
      tags: ['media', 'caption', 'slide', 'overlay', 'image'],
    }))
  }

  /* C4. Terminal — mock terminal window with traffic lights and a blinking cursor */
  {
    const c = cls('v12-card-term')
    const html = `<div class="${c}"><header><i></i><i></i><i></i><span>zsh</span></header><pre>$ npm run build\n<em>✓ compiled in 1.2s</em>\n$ <b></b></pre></div>`
    const css = `.${c} {
  width: 220px;
  border-radius: 0.6rem;
  overflow: hidden;
  background: #0f172a;
  border: 1px solid #1e293b;
  box-shadow: 0 10px 24px rgba(0,0,0,0.5);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.${c} header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  background: #1e293b;
}
.${c} header i { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; }
.${c} header i:nth-child(2) { background: #f59e0b; }
.${c} header i:nth-child(3) { background: #10b981; }
.${c} header span { margin-left: auto; font-size: 0.65rem; color: #94a3b8; }
.${c} pre {
  margin: 0;
  padding: 0.7rem 0.8rem;
  font-size: 0.72rem;
  line-height: 1.6;
  color: #cbd5e1;
  white-space: pre;
}
.${c} em { font-style: normal; color: #34d399; }
.${c} b {
  display: inline-block;
  width: 7px;
  height: 0.85rem;
  vertical-align: -2px;
  background: #34d399;
}
.${c}:hover { border-color: #10b981; box-shadow: 0 10px 24px rgba(0,0,0,0.5), 0 0 0 3px rgba(16,185,129,0.2); }
.${c}:hover b { animation: ${c}-blink 0.9s steps(1) infinite; }
@keyframes ${c}-blink { 0%, 49% { opacity: 1; } 50%, 99% { opacity: 0; } 100% { opacity: 1; } }`
    add(mk({
      name: 'Terminal Window Card',
      category: 'Cards',
      description: 'A mock terminal card with traffic-light dots and a prompt whose cursor starts blinking on hover.',
      html, css,
      tags: ['terminal', 'console', 'code', 'window', 'cursor'],
    }))
  }

  /* C5. Folder tab — a manila folder whose paper slides up on hover */
  {
    const c = cls('v12-card-folder')
    const html = `<div class="${c}"><i class="tab"></i><div class="paper"><b>Q3 Report</b><span>4 files</span></div><div class="front">Projects</div></div>`
    const css = `.${c} {
  position: relative;
  width: 200px;
  height: 124px;
  font-family: system-ui, sans-serif;
}
.${c} .tab {
  position: absolute;
  top: 0;
  left: 0;
  width: 78px;
  height: 22px;
  border-radius: 0.5rem 0.5rem 0 0;
  background: #0369a1;
}
.${c} .paper {
  position: absolute;
  left: 14px;
  right: 14px;
  top: 24px;
  bottom: 12px;
  padding: 0.45rem 0.8rem;
  border-radius: 0.4rem 0.4rem 0 0;
  background: #f8fafc;
  color: #0f172a;
  box-shadow: 0 -2px 6px rgba(0,0,0,0.25);
  transition: transform 0.4s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.${c} .paper b { display: block; font-size: 0.85rem; font-weight: 700; }
.${c} .paper span { font-size: 0.7rem; color: #64748b; }
.${c} .front {
  position: absolute;
  left: 0;
  right: 0;
  top: 56px;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  padding: 0.7rem 0.9rem;
  border-radius: 0 0.5rem 0.5rem 0.5rem;
  background: linear-gradient(180deg, #0ea5e9, #0284c7);
  color: #e0f2fe;
  font-size: 0.85rem;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(0,0,0,0.4);
  transform-origin: 50% 100%;
  transition: transform 0.4s ease;
}
.${c}:hover .paper { transform: translateY(-22px); }
.${c}:hover .front { transform: perspective(300px) rotateX(-8deg); }`
    add(mk({
      name: 'Folder Tab Card',
      category: 'Cards',
      description: 'A tabbed folder card that tips its front open on hover while the paper inside slides up out of it.',
      html, css,
      tags: ['folder', 'tab', 'paper', 'files', 'open'],
    }))
  }

  /* C6. Holo foil — iridescent foil sheen that shifts and brightens on hover */
  {
    const c = cls('v12-card-holo')
    const html = `<div class="${c}"><b>HOLO</b><span>Rare · 001/100</span></div>`
    const css = `.${c} {
  position: relative;
  width: 150px;
  height: 130px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
  padding: 0.9rem;
  border-radius: 0.8rem;
  overflow: hidden;
  background: linear-gradient(135deg, #3b0764, #1e1b4b);
  border: 1px solid rgba(217,70,239,0.5);
  color: #fdf4ff;
  font-family: system-ui, sans-serif;
  box-shadow: 0 8px 20px rgba(0,0,0,0.45);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: -40%;
  background: linear-gradient(115deg,
    transparent 20%, rgba(217,70,239,0.55) 30%, rgba(34,211,238,0.55) 38%,
    rgba(250,204,21,0.55) 46%, rgba(217,70,239,0.55) 54%, transparent 64%);
  background-size: 200% 200%;
  background-position: 100% 0;
  mix-blend-mode: screen;
  opacity: 0.55;
  transition: background-position 0.7s ease, opacity 0.4s ease;
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px);
  opacity: 0.4;
  pointer-events: none;
}
.${c} b { position: relative; font-size: 1.3rem; font-weight: 900; letter-spacing: 0.15em; }
.${c} span { position: relative; font-size: 0.7rem; opacity: 0.8; }
.${c}:hover { transform: rotate(-2deg) scale(1.03); box-shadow: 0 14px 30px rgba(217,70,239,0.35); }
.${c}:hover::before { background-position: 0 100%; opacity: 1; }`
    add(mk({
      name: 'Holo Foil Card',
      category: 'Cards',
      description: 'A trading-card style tile whose iridescent foil sheen slides across and brightens when hovered.',
      html, css,
      tags: ['holographic', 'foil', 'iridescent', 'trading-card', 'sheen'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Text                                                                */
  /* ------------------------------------------------------------------ */

  /* T1. Glitch — offset color-split copies jitter through clip slices on hover */
  {
    const c = cls('v12-txt-glitch')
    const html = `<span class="${c}" data-t="GLITCH">GLITCH</span>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  font: 900 2.4rem/1 system-ui, sans-serif;
  letter-spacing: 0.06em;
  color: #e2e8f0;
  cursor: default;
}
.${c}::before,
.${c}::after {
  content: attr(data-t);
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
}
.${c}::before { color: #06b6d4; }
.${c}::after { color: #f43f5e; }
.${c}:hover::before { opacity: 0.9; animation: ${c}-a 0.5s steps(2, end) infinite; }
.${c}:hover::after { opacity: 0.9; animation: ${c}-b 0.6s steps(2, end) infinite; }
@keyframes ${c}-a {
  0% { clip-path: inset(0 0 70% 0); transform: translate(-4px, -1px); }
  33% { clip-path: inset(40% 0 30% 0); transform: translate(3px, 1px); }
  66% { clip-path: inset(75% 0 0 0); transform: translate(-3px, 0); }
  100% { clip-path: inset(10% 0 60% 0); transform: translate(3px, -1px); }
}
@keyframes ${c}-b {
  0% { clip-path: inset(60% 0 0 0); transform: translate(4px, 1px); }
  33% { clip-path: inset(0 0 65% 0); transform: translate(-3px, -1px); }
  66% { clip-path: inset(30% 0 40% 0); transform: translate(3px, 1px); }
  100% { clip-path: inset(70% 0 5% 0); transform: translate(-3px, 0); }
}`
    add(mk({
      name: 'Glitch Text',
      category: 'Text',
      description: 'Bold heading that splits into cyan and red offset slices jittering like a broken signal on hover.',
      html, css,
      tags: ['glitch', 'rgb-split', 'clip-path', 'jitter', 'heading'],
    }))
  }

  /* T2. Long shadow — layered text-shadow extrudes the heading on hover */
  {
    const c = cls('v12-txt-longshadow')
    const html = `<span class="${c}">DEPTH</span>`
    const css = `.${c} {
  display: inline-block;
  font: 900 2.6rem/1 system-ui, sans-serif;
  letter-spacing: 0.04em;
  color: #a5b4fc;
  cursor: default;
  text-shadow: 1px 1px 0 #4338ca, 2px 2px 0 #4338ca, 3px 3px 0 #3730a3;
  transition: text-shadow 0.35s ease, transform 0.35s ease, color 0.35s ease;
}
.${c}:hover {
  color: #eef2ff;
  transform: translate(-3px, -3px);
  text-shadow:
    1px 1px 0 #4f46e5, 2px 2px 0 #4f46e5, 3px 3px 0 #4338ca, 4px 4px 0 #4338ca,
    5px 5px 0 #3730a3, 6px 6px 0 #3730a3, 7px 7px 0 #312e81, 8px 8px 0 #312e81,
    9px 9px 0 #1e1b4b, 10px 10px 0 #1e1b4b;
}`
    add(mk({
      name: 'Long Shadow Text',
      category: 'Text',
      description: 'A heading with a stacked flat shadow that extrudes into a long 3D block as it lifts on hover.',
      html, css,
      tags: ['long-shadow', 'extrude', '3d', 'heading', 'flat'],
    }))
  }

  /* T3. Split slide — top and bottom halves of the text slide apart on hover */
  {
    const c = cls('v12-txt-split')
    const html = `<span class="${c}" data-t="SPLIT">SPLIT</span>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  font: 900 2.6rem/1 system-ui, sans-serif;
  letter-spacing: 0.08em;
  color: transparent;
  cursor: default;
}
.${c}::before,
.${c}::after {
  content: attr(data-t);
  position: absolute;
  inset: 0;
  color: #fbbf24;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c}::before { clip-path: inset(0 0 50% 0); }
.${c}::after { clip-path: inset(50% 0 0 0); color: #f59e0b; }
.${c}:hover::before { transform: translate(-6px, -4px); }
.${c}:hover::after { transform: translate(6px, 4px); }`
    add(mk({
      name: 'Split Slide Text',
      category: 'Text',
      description: 'Heading cut horizontally through the middle whose upper and lower halves shear apart on hover.',
      html, css,
      tags: ['split', 'halves', 'clip-path', 'shear', 'heading'],
    }))
  }

  /* T4. Circled — a hand-drawn ellipse draws itself around the word on hover */
  {
    const c = cls('v12-txt-circle')
    const html = `<span class="${c}">important<svg viewBox="0 0 120 50" preserveAspectRatio="none"><path d="M12 32 C 5 8, 118 2, 112 24 C 118 46, 10 50, 8 30 C 6 20, 30 10, 60 12" fill="none" stroke="#84cc16" stroke-width="3" stroke-linecap="round"/></svg></span>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding: 0.35rem 0.8rem;
  font: 600 1.5rem/1.2 system-ui, sans-serif;
  color: #e2e8f0;
  cursor: default;
}
.${c} svg {
  position: absolute;
  inset: -6px -8px;
  width: calc(100% + 16px);
  height: calc(100% + 12px);
  overflow: visible;
  pointer-events: none;
}
.${c} path {
  stroke-dasharray: 340;
  stroke-dashoffset: 340;
  transition: stroke-dashoffset 0.7s ease-in-out;
}
.${c}:hover path { stroke-dashoffset: 0; }`
    add(mk({
      name: 'Circled Text',
      category: 'Text',
      description: 'A word that gets a hand-drawn ellipse sketched around it in a single looping stroke on hover.',
      html, css,
      tags: ['circle', 'hand-drawn', 'annotate', 'stroke', 'emphasis'],
    }))
  }

  /* T5. Mirror — a faded flipped reflection sits beneath the word and lifts on hover */
  {
    const c = cls('v12-txt-mirror')
    const html = `<span class="${c}" data-t="REFLECT">REFLECT</span>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  font: 900 2.2rem/1 system-ui, sans-serif;
  letter-spacing: 0.06em;
  color: #7dd3fc;
  cursor: default;
  transition: transform 0.35s ease;
}
.${c}::after {
  content: attr(data-t);
  position: absolute;
  left: 0;
  top: 100%;
  color: #7dd3fc;
  transform: scaleY(-1) translateY(-4px);
  transform-origin: 50% 0;
  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 70%);
  mask-image: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 70%);
  transition: transform 0.35s ease, opacity 0.35s ease;
  filter: blur(0.5px);
}
.${c}:hover { transform: translateY(-4px); }
.${c}:hover::after { transform: scaleY(-1) translateY(-14px); }`
    add(mk({
      name: 'Mirror Reflection Text',
      category: 'Text',
      description: 'A word with a fading upside-down reflection below it, both drifting apart when hovered.',
      html, css,
      tags: ['mirror', 'reflection', 'mask', 'flip', 'heading'],
    }))
  }

  /* T6. Letterpress — text pressed into the surface, the light shifts on hover */
  {
    const c = cls('v12-txt-press')
    const html = `<span class="${c}">Letterpress</span>`
    const css = `.${c} {
  display: inline-block;
  padding: 0.6rem 1.2rem;
  border-radius: 0.6rem;
  font: 800 1.9rem/1 system-ui, sans-serif;
  letter-spacing: 0.02em;
  color: #3b0764;
  background: linear-gradient(180deg, #7c3aed, #5b21b6);
  text-shadow: 0 1px 0 rgba(221,214,254,0.6), 0 -1px 0 rgba(0,0,0,0.55);
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.5), 0 1px 0 rgba(196,181,253,0.25);
  cursor: default;
  transition: text-shadow 0.35s ease, color 0.35s ease;
}
.${c}:hover {
  color: #f5f3ff;
  text-shadow: 0 -1px 0 rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.15), 0 0 12px rgba(196,181,253,0.8);
}`
    add(mk({
      name: 'Letterpress Text',
      category: 'Text',
      description: 'Text debossed into a violet plate with an edge highlight that lights up on hover.',
      html, css,
      tags: ['letterpress', 'deboss', 'inset', 'engraved', 'shadow'],
    }))
  }
}
