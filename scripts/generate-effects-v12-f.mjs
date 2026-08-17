// scripts/generate-effects-v12-f.mjs
//
// Twelfth wave, part F: Glow & Neon, Patterns & Textures, Masks & Clip
// Paths, Charts & Data. Same rule as v11 — ONE entry per distinct
// design, no colorway or size stamping. Six designs per category, each a
// different mechanic from everything already in the catalog for that
// category.
//
//   Glow & Neon         — wireframe cube, underline link, ripple rings,
//                         laser scanner, sweep border, marker highlight
//   Patterns & Textures — zigzag chevrons, ripple rings, cross-hatch,
//                         carbon fiber, moire lines, sunburst rays
//   Masks & Clip Paths  — diamond reveal grid, torn paper edge, heart
//                         mask tile, gradient frame mask, blind slats,
//                         sliced text
//   Charts & Data       — step area chart, activity rings, histogram,
//                         lollipop chart, dumbbell chart, composition bar
//
// Constraints inherited from the assembly guard: infinite keyframes rest
// at their 100% stop, no position:absolute on the root, visible at rest
// on the dark preview surface, root ≤ ~260×150.

export function generateV12F(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Glow & Neon                                                         */
  /* ------------------------------------------------------------------ */

  /* 1. Neon wireframe cube — six glowing outline faces turning in 3D */
  {
    const c = cls('v12-gn-cube')
    const html = `<div class="${c}"><div class="cube"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 500px;
}
.${c} .cube {
  position: relative;
  width: 64px;
  height: 64px;
  transform-style: preserve-3d;
  animation: ${c}-spin 8s linear infinite;
}
.${c} .cube i {
  position: absolute;
  inset: 0;
  border: 2px solid #818cf8;
  background: rgba(99,102,241,0.08);
  box-shadow: 0 0 10px rgba(99,102,241,0.7), inset 0 0 10px rgba(99,102,241,0.5);
}
.${c} .cube i:nth-child(1) { transform: translateZ(32px); }
.${c} .cube i:nth-child(2) { transform: rotateY(180deg) translateZ(32px); }
.${c} .cube i:nth-child(3) { transform: rotateY(90deg) translateZ(32px); }
.${c} .cube i:nth-child(4) { transform: rotateY(-90deg) translateZ(32px); }
.${c} .cube i:nth-child(5) { transform: rotateX(90deg) translateZ(32px); }
.${c} .cube i:nth-child(6) { transform: rotateX(-90deg) translateZ(32px); }
@keyframes ${c}-spin {
  0% { transform: rotateX(-24deg) rotateY(0deg); }
  100% { transform: rotateX(-24deg) rotateY(360deg); }
}`
    add(mk({
      name: 'Neon Wireframe Cube',
      category: 'Glow & Neon',
      description: 'A slowly turning 3D cube drawn from six glowing indigo outline faces.',
      html, css,
      tags: ['neon', 'cube', '3d', 'wireframe', 'glow'],
    }))
  }

  /* 2. Neon underline link — a glowing underline sweeps in on hover */
  {
    const c = cls('v12-gn-underline')
    const html = `<a class="${c}" href="#">Explore the archive</a>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding: 0.35rem 0.1rem;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #c4b5fd;
  text-decoration: none;
  text-shadow: 0 0 6px rgba(139,92,246,0.5);
  transition: color 0.3s ease, text-shadow 0.3s ease;
}
.${c}::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 3px;
  border-radius: 2px;
  background: #8b5cf6;
  box-shadow: 0 0 8px #8b5cf6, 0 0 18px rgba(139,92,246,0.7);
  transform: scaleX(0.18);
  transform-origin: left center;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c}:hover { color: #fff; text-shadow: 0 0 10px #8b5cf6, 0 0 22px rgba(139,92,246,0.7); }
.${c}:hover::after { transform: scaleX(1); }`
    add(mk({
      name: 'Neon Underline Link',
      category: 'Glow & Neon',
      description: 'Text link whose short glowing violet underline sweeps to full width and brightens the label on hover.',
      html, css,
      tags: ['neon', 'link', 'underline', 'glow', 'hover'],
    }))
  }

  /* 3. Neon ripple rings — glowing rings expand from a bright core */
  {
    const c = cls('v12-gn-ripple')
    const html = `<div class="${c}"><i></i><i></i><i></i><b></b></div>`
    const css = `.${c} {
  position: relative;
  width: 140px;
  height: 140px;
}
.${c} b {
  position: absolute;
  left: 50%; top: 50%;
  width: 14px; height: 14px;
  margin: -7px 0 0 -7px;
  border-radius: 50%;
  background: #22d3ee;
  box-shadow: 0 0 10px #22d3ee, 0 0 24px #06b6d4;
}
.${c} i {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid #22d3ee;
  box-shadow: 0 0 10px rgba(6,182,212,0.7), inset 0 0 10px rgba(6,182,212,0.4);
  animation: ${c}-ring 2.4s ease-out infinite;
}
.${c} i:nth-child(2) { animation-delay: 0.8s; }
.${c} i:nth-child(3) { animation-delay: 1.6s; }
@keyframes ${c}-ring {
  0% { transform: scale(0.15); opacity: 1; }
  100% { transform: scale(1); opacity: 0.35; }
}`
    add(mk({
      name: 'Neon Ripple Rings',
      category: 'Glow & Neon',
      description: 'Concentric cyan neon rings pulse outward from a glowing core like a sonar ping.',
      html, css,
      tags: ['neon', 'ripple', 'rings', 'pulse', 'sonar'],
    }))
  }

  /* 4. Neon laser scanner — a red beam sweeps up and down a barcode */
  {
    const c = cls('v12-gn-scanner')
    const html = `<div class="${c}"><span class="code"></span><span class="beam"></span></div>`
    const css = `.${c} {
  position: relative;
  width: 200px;
  height: 110px;
  border-radius: 0.6rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  overflow: hidden;
}
.${c} .code {
  position: absolute;
  inset: 22px 28px;
  background: repeating-linear-gradient(90deg,
    #e2e8f0 0 3px, transparent 3px 6px,
    #e2e8f0 6px 8px, transparent 8px 13px,
    #e2e8f0 13px 17px, transparent 17px 20px);
  opacity: 0.85;
}
.${c} .beam {
  position: absolute;
  left: 12px; right: 12px;
  top: 12px;
  height: 2px;
  background: #fb7185;
  box-shadow: 0 0 6px #f43f5e, 0 0 16px #f43f5e, 0 0 32px rgba(244,63,94,0.7);
  animation: ${c}-scan 2.2s ease-in-out infinite;
}
@keyframes ${c}-scan {
  0% { top: 12px; }
  50% { top: 96px; }
  100% { top: 12px; }
}`
    add(mk({
      name: 'Neon Laser Scanner',
      category: 'Glow & Neon',
      description: 'A glowing red laser line sweeps up and down across a barcode panel.',
      html, css,
      tags: ['neon', 'laser', 'scanner', 'barcode', 'sweep'],
    }))
  }

  /* 5. Neon sweep border — a glowing comet circles the card edge */
  {
    const c = cls('v12-gn-sweep')
    const html = `<div class="${c}"><span>Live</span></div>`
    const css = `.${c} {
  position: relative;
  width: 200px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.8rem;
  overflow: hidden;
  color: #f5d0fe;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  box-shadow: 0 0 22px rgba(217,70,239,0.3);
}
.${c}::before {
  content: '';
  position: absolute;
  left: 50%; top: 50%;
  width: 260px; height: 260px;
  margin: -130px 0 0 -130px;
  background: conic-gradient(from 0deg, transparent 0 250deg, #d946ef 320deg, #fff 360deg);
  animation: ${c}-turn 3s linear infinite;
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 0.65rem;
  background: #0b1020;
  box-shadow: inset 0 0 18px rgba(217,70,239,0.25);
}
.${c} span {
  position: relative;
  z-index: 1;
  text-shadow: 0 0 10px #d946ef;
}
@keyframes ${c}-turn {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`
    add(mk({
      name: 'Neon Sweep Border',
      category: 'Glow & Neon',
      description: 'A fuchsia comet tail orbits the border of a dark card, leaving a glowing trail as it goes.',
      html, css,
      tags: ['neon', 'border', 'sweep', 'conic', 'orbit'],
    }))
  }

  /* 6. Neon marker highlight — glowing highlighter fills behind text */
  {
    const c = cls('v12-gn-marker')
    const html = `<p class="${c}"><span>Highlight the key phrase</span> in a sentence.</p>`
    const css = `.${c} {
  max-width: 240px;
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.6;
  color: #e2e8f0;
  cursor: default;
}
.${c} span {
  padding: 0 0.15em;
  color: #fde68a;
  text-shadow: 0 0 6px rgba(245,158,11,0.5);
  background-image: linear-gradient(120deg, rgba(245,158,11,0.9), rgba(251,191,36,0.9));
  background-repeat: no-repeat;
  background-size: 100% 0.28em;
  background-position: 0 92%;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transition: background-size 0.4s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s ease, text-shadow 0.3s ease;
}
.${c}:hover span {
  color: #1c1917;
  text-shadow: none;
  background-size: 100% 92%;
}
.${c}:hover { filter: drop-shadow(0 0 10px rgba(245,158,11,0.55)); }`
    add(mk({
      name: 'Neon Marker Highlight',
      category: 'Glow & Neon',
      description: 'A thin amber neon underline swells into a full glowing highlighter stroke behind the phrase on hover.',
      html, css,
      tags: ['neon', 'highlight', 'marker', 'text', 'hover'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Patterns & Textures                                                 */
  /* ------------------------------------------------------------------ */

  /* 7. Zigzag chevrons — classic four-gradient chevron stripe */
  {
    const c = cls('v12-pt-zigzag')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 140px;
  border-radius: 0.6rem;
  background-color: #0f172a;
  background-image:
    linear-gradient(135deg, #14b8a6 25%, transparent 25%),
    linear-gradient(225deg, #14b8a6 25%, transparent 25%),
    linear-gradient(315deg, #14b8a6 25%, transparent 25%),
    linear-gradient(45deg, #14b8a6 25%, transparent 25%);
  background-position: -16px 0, -16px 0, 0 0, 0 0;
  background-size: 32px 32px;
  transition: background-position 0.6s ease, filter 0.4s ease;
}
.${c}:hover { background-position: -8px 0, -8px 0, 8px 0, 8px 0; filter: brightness(1.15); }`
    add(mk({
      name: 'Zigzag Chevron Pattern',
      category: 'Patterns & Textures',
      description: 'Teal zigzag chevron stripes built from four layered gradients that slide sideways on hover.',
      html, css,
      tags: ['pattern', 'zigzag', 'chevron', 'stripes'],
    }))
  }

  /* 8. Ripple rings — concentric repeating radial rings */
  {
    const c = cls('v12-pt-rings')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 140px;
  border-radius: 0.6rem;
  background:
    repeating-radial-gradient(circle at 30% 60%, #0ea5e9 0 2px, transparent 2px 16px),
    repeating-radial-gradient(circle at 85% 20%, rgba(14,165,233,0.55) 0 2px, transparent 2px 22px),
    #0f172a;
  transition: filter 0.4s ease;
}
.${c}:hover { filter: brightness(1.3) saturate(1.2); }`
    add(mk({
      name: 'Ripple Ring Pattern',
      category: 'Patterns & Textures',
      description: 'Two sets of concentric sky-blue rings overlap like raindrops on water, brightening on hover.',
      html, css,
      tags: ['pattern', 'rings', 'ripple', 'radial'],
    }))
  }

  /* 9. Cross-hatch — two diagonal line sets that tighten on hover */
  {
    const c = cls('v12-pt-hatch')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 140px;
  border-radius: 0.6rem;
  border: 1px solid rgba(132,204,22,0.4);
  background:
    repeating-linear-gradient(45deg, rgba(132,204,22,0.75) 0 1px, transparent 1px 12px),
    repeating-linear-gradient(-45deg, rgba(132,204,22,0.75) 0 1px, transparent 1px 12px),
    #0f172a;
  background-size: 100% 100%;
  transition: background-size 0.5s ease, box-shadow 0.4s ease;
}
.${c}:hover {
  background-size: 60% 60%, 60% 60%, 100% 100%;
  box-shadow: 0 0 20px rgba(132,204,22,0.25);
}`
    add(mk({
      name: 'Cross Hatch Pattern',
      category: 'Patterns & Textures',
      description: 'Lime cross-hatched pen strokes at 45 degrees; the weave tightens as the tiles shrink on hover.',
      html, css,
      tags: ['pattern', 'crosshatch', 'lines', 'diagonal'],
    }))
  }

  /* 10. Carbon fiber — woven radial dots with a highlight offset */
  {
    const c = cls('v12-pt-carbon')
    const html = `<div class="${c}"><span>CARBON</span></div>`
    const css = `.${c} {
  width: 240px;
  height: 140px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 0.75rem;
  box-sizing: border-box;
  border-radius: 0.6rem;
  background:
    radial-gradient(#000 15%, transparent 16%) 0 0,
    radial-gradient(#000 15%, transparent 16%) 8px 8px,
    radial-gradient(rgba(255,255,255,0.12) 15%, transparent 20%) 0 1px,
    radial-gradient(rgba(255,255,255,0.12) 15%, transparent 20%) 8px 9px,
    #1f2937;
  background-size: 16px 16px;
  box-shadow: inset 0 0 40px rgba(0,0,0,0.6);
  transition: box-shadow 0.4s ease;
}
.${c} span {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  color: #34d399;
  text-shadow: 0 0 6px rgba(16,185,129,0.6);
}
.${c}:hover { box-shadow: inset 0 0 40px rgba(0,0,0,0.6), 0 0 0 2px #10b981; }`
    add(mk({
      name: 'Carbon Fiber Weave',
      category: 'Patterns & Textures',
      description: 'Dark carbon-fiber weave texture from offset radial dots with a faint highlight, tagged with an emerald label.',
      html, css,
      tags: ['pattern', 'carbon', 'fiber', 'texture', 'weave'],
    }))
  }

  /* 11. Moire lines — two fine line grids interfere; hover twists them */
  {
    const c = cls('v12-pt-moire')
    const html = `<div class="${c}"><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 140px;
  border-radius: 0.6rem;
  overflow: hidden;
  background: #0f172a;
}
.${c} i {
  position: absolute;
  left: -40%; top: -40%;
  width: 180%; height: 180%;
  background: repeating-linear-gradient(90deg, rgba(167,139,250,0.85) 0 1px, transparent 1px 5px);
  transition: transform 0.7s ease;
}
.${c} i:nth-child(2) { transform: rotate(4deg); }
.${c}:hover i:nth-child(1) { transform: rotate(-6deg); }
.${c}:hover i:nth-child(2) { transform: rotate(10deg); }`
    add(mk({
      name: 'Moire Interference',
      category: 'Patterns & Textures',
      description: 'Two fine violet line screens overlap at a slight angle to form moire waves that shift as they twist on hover.',
      html, css,
      tags: ['pattern', 'moire', 'lines', 'interference'],
    }))
  }

  /* 12. Sunburst rays — repeating conic rays turning slowly */
  {
    const c = cls('v12-pt-sunburst')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 140px;
  border-radius: 0.6rem;
  overflow: hidden;
  background: #0f172a;
}
.${c}::before {
  content: '';
  position: absolute;
  left: 50%; top: 50%;
  width: 320px; height: 320px;
  margin: -160px 0 0 -160px;
  background: repeating-conic-gradient(from 0deg, rgba(245,158,11,0.85) 0 9deg, transparent 9deg 18deg);
  animation: ${c}-turn 24s linear infinite;
}
.${c}::after {
  content: '';
  position: absolute;
  left: 50%; top: 50%;
  width: 28px; height: 28px;
  margin: -14px 0 0 -14px;
  border-radius: 50%;
  background: #fbbf24;
  box-shadow: 0 0 18px rgba(245,158,11,0.8);
}
@keyframes ${c}-turn {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`
    add(mk({
      name: 'Sunburst Rays',
      category: 'Patterns & Textures',
      description: 'Amber sunburst rays from a repeating conic gradient rotate slowly around a glowing centre disc.',
      html, css,
      tags: ['pattern', 'sunburst', 'rays', 'conic', 'rotate'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Masks & Clip Paths                                                  */
  /* ------------------------------------------------------------------ */

  /* 13. Diamond reveal grid — diamond-clipped tiles square off on hover */
  {
    const c = cls('v12-mk-diamond')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: grid;
  grid-template-columns: repeat(4, 50px);
  grid-auto-rows: 50px;
  gap: 4px;
  cursor: pointer;
}
.${c} i {
  display: block;
  background: linear-gradient(135deg, #818cf8, #4f46e5);
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  transition: clip-path 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} i:nth-child(odd) { transition-delay: 0.08s; }
.${c}:hover i { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }`
    add(mk({
      name: 'Diamond Reveal Grid',
      category: 'Masks & Clip Paths',
      description: 'A grid of indigo tiles clipped to diamonds that expand into full squares on hover, revealing the whole surface.',
      html, css,
      tags: ['clip-path', 'diamond', 'grid', 'reveal', 'hover'],
    }))
  }

  /* 14. Torn paper edge — jagged polygon bottom edge on a card */
  {
    const c = cls('v12-mk-torn')
    const html = `<div class="${c}"><b>RECEIPT</b><span>Total &nbsp; $42.00</span></div>`
    const css = `.${c} {
  width: 200px;
  height: 120px;
  padding: 0.9rem 1rem 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  color: #451a03;
  background: linear-gradient(180deg, #fde68a, #fbbf24);
  clip-path: polygon(0 0, 100% 0, 100% 84%, 94% 92%, 88% 82%, 81% 94%, 74% 84%, 67% 96%, 60% 85%, 52% 95%, 45% 83%, 38% 94%, 31% 84%, 24% 96%, 17% 85%, 10% 93%, 4% 84%, 0 92%);
  transition: transform 0.35s ease, clip-path 0.35s ease;
}
.${c} b { font-size: 0.7rem; letter-spacing: 0.3em; }
.${c} span { font-size: 0.85rem; font-family: ui-monospace, monospace; }
.${c}:hover { transform: rotate(-2deg); clip-path: polygon(0 0, 100% 0, 100% 88%, 94% 96%, 88% 86%, 81% 98%, 74% 88%, 67% 100%, 60% 89%, 52% 99%, 45% 87%, 38% 98%, 31% 88%, 24% 100%, 17% 89%, 10% 97%, 4% 88%, 0 96%); }`
    add(mk({
      name: 'Torn Paper Edge',
      category: 'Masks & Clip Paths',
      description: 'An amber receipt card whose bottom edge is clipped into a ragged torn-paper polygon that stretches on hover.',
      html, css,
      tags: ['clip-path', 'torn', 'paper', 'receipt', 'edge'],
    }))
  }

  /* 15. Heart mask tile — SVG mask cuts a gradient into a heart */
  {
    const c = cls('v12-mk-heart')
    const heart = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 21s-7-4.6-9.5-9C.6 8.6 2.4 4 6.5 4c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 4.1 0 5.9 4.6 4 8-2.5 4.4-9.5 9-9.5 9z'/%3E%3C/svg%3E\")"
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 130px;
  height: 130px;
  background: linear-gradient(135deg, #fb7185, #e11d48 60%, #9f1239);
  -webkit-mask: ${heart} center / contain no-repeat;
  mask: ${heart} center / contain no-repeat;
  cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.35s ease;
}
.${c}:hover { transform: scale(1.12); filter: brightness(1.15); }`
    add(mk({
      name: 'Heart Mask Tile',
      category: 'Masks & Clip Paths',
      description: 'A rose gradient masked into a heart by an inline SVG path, popping larger with a springy hover.',
      html, css,
      tags: ['mask', 'heart', 'svg', 'shape', 'gradient'],
    }))
  }

  /* 16. Gradient frame mask — mask-composite carves a hollow border */
  {
    const c = cls('v12-mk-frame')
    const html = `<div class="${c}"><span>Masked frame</span></div>`
    const css = `.${c} {
  position: relative;
  width: 200px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.8rem;
  color: #99f6e4;
  font-size: 0.95rem;
  font-weight: 600;
  background: rgba(20,184,166,0.05);
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 4px;
  border-radius: inherit;
  background: linear-gradient(90deg, #14b8a6, #0f172a 40%, #14b8a6 60%, #5eead4);
  background-size: 250% 100%;
  background-position: 100% 0;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  transition: background-position 0.8s ease, padding 0.3s ease;
}
.${c}:hover::before { background-position: 0 0; padding: 7px; }`
    add(mk({
      name: 'Gradient Frame Mask',
      category: 'Masks & Clip Paths',
      description: 'A hollow teal gradient frame carved with mask-composite that thickens and slides its gradient on hover.',
      html, css,
      tags: ['mask', 'composite', 'frame', 'border', 'gradient'],
    }))
  }

  /* 17. Blind slats — inset clip-paths open like venetian blinds */
  {
    const c = cls('v12-mk-blinds')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  height: 120px;
  border-radius: 0.6rem;
  overflow: hidden;
  background: linear-gradient(135deg, #22d3ee, #0891b2 50%, #164e63);
  cursor: pointer;
}
.${c} i {
  position: absolute;
  left: 0; right: 0;
  height: 20px;
  background: #0b1020;
  clip-path: inset(0 0 45% 0);
  transition: clip-path 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} i:nth-child(1) { top: 0; }
.${c} i:nth-child(2) { top: 20px; transition-delay: 0.04s; }
.${c} i:nth-child(3) { top: 40px; transition-delay: 0.08s; }
.${c} i:nth-child(4) { top: 60px; transition-delay: 0.12s; }
.${c} i:nth-child(5) { top: 80px; transition-delay: 0.16s; }
.${c} i:nth-child(6) { top: 100px; transition-delay: 0.2s; }
.${c}:hover i { clip-path: inset(0 0 100% 0); }`
    add(mk({
      name: 'Blind Slat Reveal',
      category: 'Masks & Clip Paths',
      description: 'Dark slats clipped with inset() cover half of a cyan panel; on hover they thin away in sequence like opening blinds.',
      html, css,
      tags: ['clip-path', 'inset', 'blinds', 'slats', 'reveal'],
    }))
  }

  /* 18. Sliced text — text split top/bottom by inset clips, halves shear */
  {
    const c = cls('v12-mk-slice')
    const html = `<div class="${c}"><span>SLICED</span><span>SLICED</span></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  height: 70px;
  cursor: pointer;
}
.${c} span {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.6rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: #f0abfc;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} span:nth-child(1) { clip-path: inset(0 0 52% 0); }
.${c} span:nth-child(2) { clip-path: inset(48% 0 0 0); color: #d946ef; }
.${c}:hover span:nth-child(1) { transform: translateX(-8px); }
.${c}:hover span:nth-child(2) { transform: translateX(8px); }`
    add(mk({
      name: 'Sliced Text Shear',
      category: 'Masks & Clip Paths',
      description: 'A word duplicated and clipped into top and bottom halves; on hover the halves shear apart in opposite directions.',
      html, css,
      tags: ['clip-path', 'text', 'slice', 'shear', 'hover'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Charts & Data                                                       */
  /* ------------------------------------------------------------------ */

  /* 19. Step area chart — staircase polygon area with axis labels */
  {
    const c = cls('v12-ch-step')
    const html = `<div class="${c}"><b>Active users</b><div class="plot"><i class="line"></i><i class="cover"></i><i class="area"></i></div><div class="x"><span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span></div></div>`
    const css = `.${c} {
  width: 220px;
  color: #cbd5e1;
  font-size: 0.65rem;
}
.${c} b { display: block; margin-bottom: 4px; font-size: 0.75rem; color: #e2e8f0; }
.${c} .plot {
  position: relative;
  height: 90px;
  border-left: 1px solid #334155;
  border-bottom: 1px solid #334155;
  background: repeating-linear-gradient(0deg, transparent 0 21px, rgba(148,163,184,0.15) 21px 22px);
  overflow: hidden;
}
.${c} .plot i {
  position: absolute;
  inset: 0;
  clip-path: polygon(0 70%, 12% 70%, 12% 55%, 25% 55%, 25% 62%, 38% 62%, 38% 40%, 50% 40%, 50% 48%, 62% 48%, 62% 28%, 75% 28%, 75% 34%, 88% 34%, 88% 12%, 100% 12%, 100% 100%, 0 100%);
}
.${c} .line { background: #38bdf8; box-shadow: 0 0 10px rgba(56,189,248,0.6); }
.${c} .cover { background: #0b1020; transform: translate(2px, 3px); }
.${c} .area { background: linear-gradient(180deg, rgba(14,165,233,0.45), rgba(14,165,233,0.03)); transform: translate(2px, 3px); }
.${c} .x { display: flex; justify-content: space-between; margin-top: 3px; padding-left: 2px; }
.${c} .plot { transition: filter 0.3s ease; }
.${c}:hover .plot { filter: brightness(1.2); }`
    add(mk({
      name: 'Step Area Chart',
      category: 'Charts & Data',
      description: 'A staircase step chart drawn as a clip-path polygon over a gridded plot area, with a sky-blue area fill and day labels.',
      html, css,
      tags: ['chart', 'step', 'area', 'clip-path', 'timeseries'],
    }))
  }

  /* 20. Activity rings — three concentric conic rings with a legend */
  {
    const c = cls('v12-ch-rings')
    const html = `<div class="${c}"><div class="rings"><i></i><i></i><i></i></div><ul><li><b></b>Move <em>78%</em></li><li><b></b>Exercise <em>55%</em></li><li><b></b>Stand <em>92%</em></li></ul></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #e2e8f0;
  font-size: 0.75rem;
}
.${c} .rings { position: relative; width: 120px; height: 120px; }
.${c} .rings i {
  position: absolute;
  border-radius: 50%;
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 13px), #000 calc(100% - 12px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 13px), #000 calc(100% - 12px));
  transition: filter 0.3s ease;
}
.${c} .rings i:nth-child(1) { inset: 0; background: conic-gradient(#ec4899 0 78%, rgba(236,72,153,0.2) 0); }
.${c} .rings i:nth-child(2) { inset: 17px; background: conic-gradient(#84cc16 0 55%, rgba(132,204,22,0.2) 0); }
.${c} .rings i:nth-child(3) { inset: 34px; background: conic-gradient(#06b6d4 0 92%, rgba(6,182,212,0.2) 0); }
.${c} ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.45rem; }
.${c} li { display: flex; align-items: center; gap: 0.4rem; white-space: nowrap; }
.${c} li b { width: 10px; height: 10px; border-radius: 50%; }
.${c} li:nth-child(1) b { background: #ec4899; }
.${c} li:nth-child(2) b { background: #84cc16; }
.${c} li:nth-child(3) b { background: #06b6d4; }
.${c} li em { font-style: normal; color: #94a3b8; }
.${c}:hover .rings i { filter: brightness(1.2) drop-shadow(0 0 4px currentColor); }`
    add(mk({
      name: 'Activity Rings Chart',
      category: 'Charts & Data',
      description: 'Three nested progress rings built from conic gradients and radial masks, with a colour-keyed legend showing each percentage.',
      html, css,
      tags: ['chart', 'rings', 'progress', 'conic', 'legend'],
    }))
  }

  /* 21. Histogram — bell-shaped bins with a dashed mean marker */
  {
    const c = cls('v12-ch-histogram')
    const html = `<div class="${c}"><b>Response time (ms)</b><div class="bins"><i style="--h:18%"></i><i style="--h:32%"></i><i style="--h:55%"></i><i style="--h:80%"></i><i style="--h:100%"></i><i style="--h:84%"></i><i style="--h:58%"></i><i style="--h:30%"></i><i style="--h:14%"></i><em></em></div><div class="x"><span>0</span><span>200</span><span>400</span><span>600</span></div></div>`
    const css = `.${c} {
  width: 220px;
  color: #cbd5e1;
  font-size: 0.65rem;
}
.${c} b { display: block; margin-bottom: 4px; font-size: 0.75rem; color: #e2e8f0; }
.${c} .bins {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 90px;
  border-bottom: 1px solid #334155;
}
.${c} .bins i {
  flex: 1;
  height: var(--h);
  background: linear-gradient(180deg, #a78bfa, #7c3aed);
  border-radius: 2px 2px 0 0;
  transition: filter 0.3s ease, transform 0.3s ease;
}
.${c} .bins em {
  position: absolute;
  left: 50%; top: 0; bottom: 0;
  border-left: 1px dashed #f5f3ff;
}
.${c} .bins em::after {
  content: 'mean';
  position: absolute;
  top: -2px; left: 4px;
  font-size: 0.6rem;
  font-style: normal;
  color: #e9d5ff;
}
.${c} .x { display: flex; justify-content: space-between; margin-top: 3px; }
.${c}:hover .bins i { filter: brightness(1.15); }
.${c}:hover .bins i:nth-child(5) { transform: scaleY(1.04); transform-origin: bottom; }`
    add(mk({
      name: 'Histogram Bins',
      category: 'Charts & Data',
      description: 'A violet histogram of nine bell-shaped bins over a baseline with a dashed mean marker and axis ticks.',
      html, css,
      tags: ['chart', 'histogram', 'distribution', 'bins', 'bars'],
    }))
  }

  /* 22. Lollipop chart — thin stems ending in dots, ranked rows */
  {
    const c = cls('v12-ch-lollipop')
    const html = `<div class="${c}"><div><span>Search</span><i style="--w:88%"></i><em>88</em></div><div><span>Social</span><i style="--w:64%"></i><em>64</em></div><div><span>Email</span><i style="--w:47%"></i><em>47</em></div><div><span>Direct</span><i style="--w:35%"></i><em>35</em></div><div><span>Ads</span><i style="--w:22%"></i><em>22</em></div></div>`
    const css = `.${c} {
  width: 230px;
  display: grid;
  gap: 0.55rem;
  color: #cbd5e1;
  font-size: 0.7rem;
}
.${c} > div {
  display: grid;
  grid-template-columns: 44px 1fr 24px;
  align-items: center;
  gap: 0.5rem;
}
.${c} i {
  position: relative;
  display: block;
  height: 2px;
  width: var(--w);
  background: rgba(249,115,22,0.6);
  transition: width 0.4s ease;
}
.${c} i::after {
  content: '';
  position: absolute;
  right: -5px; top: -4px;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #f97316;
  box-shadow: 0 0 0 2px #0b1020;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.${c} em { font-style: normal; text-align: right; color: #fdba74; }
.${c} > div:hover i::after { transform: scale(1.5); box-shadow: 0 0 0 2px #0b1020, 0 0 10px #f97316; }`
    add(mk({
      name: 'Lollipop Chart',
      category: 'Charts & Data',
      description: 'Ranked lollipop chart with orange stems ending in a dot marker, category labels on the left and values on the right.',
      html, css,
      tags: ['chart', 'lollipop', 'ranked', 'dots', 'rows'],
    }))
  }

  /* 23. Dumbbell chart — two dots per row joined by a range bar */
  {
    const c = cls('v12-ch-dumbbell')
    const html = `<div class="${c}"><b><i class="a"></i>2023 <i class="b"></i>2024</b><div><span>North</span><em style="--l:30%;--r:72%"></em></div><div><span>South</span><em style="--l:22%;--r:48%"></em></div><div><span>East</span><em style="--l:55%;--r:84%"></em></div><div><span>West</span><em style="--l:40%;--r:58%"></em></div></div>`
    const css = `.${c} {
  width: 230px;
  display: grid;
  gap: 0.55rem;
  color: #cbd5e1;
  font-size: 0.7rem;
}
.${c} b { display: flex; align-items: center; gap: 0.35rem; font-weight: 500; color: #94a3b8; }
.${c} b i { width: 8px; height: 8px; border-radius: 50%; margin-left: 0.4rem; }
.${c} b i:first-child { margin-left: 0; }
.${c} b .a { background: #64748b; }
.${c} b .b { background: #10b981; }
.${c} > div {
  display: grid;
  grid-template-columns: 40px 1fr;
  align-items: center;
  gap: 0.5rem;
}
.${c} em {
  position: relative;
  display: block;
  height: 10px;
  background: repeating-linear-gradient(90deg, rgba(148,163,184,0.15) 0 1px, transparent 1px 25%);
}
.${c} em::before {
  content: '';
  position: absolute;
  top: 3px;
  left: var(--l);
  width: calc(var(--r) - var(--l));
  height: 4px;
  background: linear-gradient(90deg, #64748b, #10b981);
  border-radius: 2px;
}
.${c} em::after {
  content: '';
  position: absolute;
  top: 0;
  left: calc(var(--r) - 5px);
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: calc(var(--l) - var(--r)) 0 0 0 #64748b;
  transition: transform 0.3s ease;
}
.${c} > div:hover em::after { transform: scale(1.3); }`
    add(mk({
      name: 'Dumbbell Chart',
      category: 'Charts & Data',
      description: 'Dumbbell range chart: each row joins a grey start dot to an emerald end dot with a gradient bar, showing year-over-year change.',
      html, css,
      tags: ['chart', 'dumbbell', 'range', 'comparison', 'rows'],
    }))
  }

  /* 24. Composition bar — a single 100% stacked bar with legend chips */
  {
    const c = cls('v12-ch-composition')
    const html = `<div class="${c}"><b>Storage used <em>82 GB of 128</em></b><div class="bar"><i style="--w:38%"></i><i style="--w:24%"></i><i style="--w:14%"></i><i style="--w:8%"></i></div><ul><li>Photos 38%</li><li>Video 24%</li><li>Docs 14%</li><li>Apps 8%</li></ul></div>`
    const css = `.${c} {
  width: 230px;
  color: #cbd5e1;
  font-size: 0.7rem;
}
.${c} b { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.4rem; font-size: 0.8rem; color: #e2e8f0; }
.${c} b em { font-style: normal; font-size: 0.65rem; color: #94a3b8; }
.${c} .bar {
  display: flex;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
  background: #1e293b;
}
.${c} .bar i {
  width: var(--w);
  transition: filter 0.3s ease, transform 0.3s ease;
}
.${c} .bar i:nth-child(1) { background: #6366f1; }
.${c} .bar i:nth-child(2) { background: #818cf8; }
.${c} .bar i:nth-child(3) { background: #a5b4fc; }
.${c} .bar i:nth-child(4) { background: #c7d2fe; }
.${c} ul { list-style: none; margin: 0.5rem 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.3rem 0.8rem; }
.${c} li { display: flex; align-items: center; gap: 0.3rem; }
.${c} li::before { content: ''; width: 8px; height: 8px; border-radius: 2px; }
.${c} li:nth-child(1)::before { background: #6366f1; }
.${c} li:nth-child(2)::before { background: #818cf8; }
.${c} li:nth-child(3)::before { background: #a5b4fc; }
.${c} li:nth-child(4)::before { background: #c7d2fe; }
.${c} .bar i:hover { filter: brightness(1.2); transform: scaleY(1.25); }`
    add(mk({
      name: 'Composition Bar',
      category: 'Charts & Data',
      description: 'A single stacked 100% bar split into indigo-tinted segments with a header total and a colour-keyed legend of percentages.',
      html, css,
      tags: ['chart', 'stacked', 'composition', 'bar', 'legend'],
    }))
  }
}
