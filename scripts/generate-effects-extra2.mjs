// scripts/generate-effects-extra2.mjs
//
// Second half of the second-wave generators. Split from
// generate-effects-extra.mjs only to keep each file readable; both are
// called by generate-effects.mjs with the same tokens and helpers, so
// the id sequence stays continuous across all three files.
//
// Categories here:
//   3D & Perspective    Glow & Neon         Patterns & Textures
//   Masks & Clip Paths  Charts & Data       Timelines & Steps

/** '#f43f5e' -> '244,63,94' — for rgba() shadows and glows. */
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')

/** Darken a hex color toward black by `amount` (0–1). Used for 3D side faces. */
function shade(hex, amount) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const f = (v) => Math.max(0, Math.round(v * (1 - amount)))
  return `#${[f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function generateExtra2(ctx) {
  const { PALETTES, GRADPAIRS, TRIOS, cls, mk, add } = ctx

  /* ============================================================
   *  3D & PERSPECTIVE  (~95)
   * ========================================================== */

  // 1. Chunky 3D push button — 17 palettes × 2 sizes = 34
  for (const pal of PALETTES) {
    for (const sz of ['MD', 'LG']) {
      const c = cls(`td-push-${pal.name}-${sz}`)
      const pad = sz === 'MD' ? '0.65rem 1.4rem' : '0.85rem 1.8rem'
      const fs = sz === 'MD' ? '0.95rem' : '1.1rem'
      const dark = shade(pal.p, 0.35)
      const html = `<button class="${c}">Press me</button>`
      const css = `.${c} {
  padding: ${pad};
  font-size: ${fs};
  font-weight: 700;
  color: #fff;
  border: none;
  border-radius: 0.6rem;
  cursor: pointer;
  background: ${pal.p};
  box-shadow: 0 6px 0 ${dark}, 0 10px 18px rgba(${pal.rgb}, 0.35);
  transform: translateY(0);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.${c}:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 0 ${dark}, 0 14px 24px rgba(${pal.rgb}, 0.45);
}
.${c}:active {
  transform: translateY(6px);
  box-shadow: 0 0 0 ${dark}, 0 2px 6px rgba(${pal.rgb}, 0.3);
}`
      add(mk({
        name: `${pal.name} 3D Push Button (${sz})`,
        category: '3D & Perspective',
        description: `${pal.name} button with a solid extruded edge that compresses all the way down when pressed.`,
        html, css,
        tags: ['3d', 'button', 'push', 'extrude', pal.name.toLowerCase(), sz.toLowerCase()],
      }))
    }
  }

  // 2. Perspective tilt card — 12 pairs × 2 sizes = 24
  for (const g of GRADPAIRS) {
    for (const sz of ['MD', 'LG']) {
      const c = cls(`td-tilt-${g.name}-${sz}`)
      const w = sz === 'MD' ? 180 : 220
      const html = `<div class="${c}"><div class="inner"><h4>Tilt</h4><p>Hover to rotate.</p></div></div>`
      const css = `.${c} {
  perspective: 800px;
  width: ${w}px;
}
.${c} .inner {
  padding: 1.1rem;
  border-radius: 0.8rem;
  color: #fff;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  box-shadow: 0 14px 34px rgba(0,0,0,0.35);
  transform: rotateX(0) rotateY(0);
  transform-style: preserve-3d;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s ease;
}
.${c}:hover .inner {
  transform: rotateX(10deg) rotateY(-14deg) translateZ(14px);
  box-shadow: -18px 24px 44px rgba(0,0,0,0.45);
}
.${c} h4 { margin: 0 0 0.3rem; font-size: 1rem; }
.${c} p  { margin: 0; font-size: 0.82rem; opacity: 0.85; }`
      add(mk({
        name: `${g.name} Tilt Card (${sz})`,
        category: '3D & Perspective',
        description: `${g.name} card that tilts in 3D space on hover and throws its shadow to the side.`,
        html, css,
        tags: ['3d', 'tilt', 'card', 'perspective', 'hover', g.name.toLowerCase(), sz.toLowerCase()],
      }))
    }
  }

  // 3. Flip card — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`td-flip-${g.name}`)
    const html = `<div class="${c}"><div class="inner"><div class="face front">Front</div><div class="face back">Back</div></div></div>`
    const css = `.${c} {
  perspective: 900px;
  width: 180px;
  height: 120px;
}
.${c} .inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.${c}:hover .inner { transform: rotateY(180deg); }
.${c} .face {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 0.8rem;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: 0 12px 30px rgba(0,0,0,0.35);
}
.${c} .front { background: linear-gradient(135deg, ${g.a}, ${g.b}); }
.${c} .back {
  background: linear-gradient(135deg, ${g.b}, ${g.a});
  transform: rotateY(180deg);
}`
    add(mk({
      name: `${g.name} Flip Card`,
      category: '3D & Perspective',
      description: `Card that flips 180° on hover to reveal its reverse ${g.name.toLowerCase()} face.`,
      html, css,
      tags: ['3d', 'flip', 'card', 'backface', g.name.toLowerCase()],
    }))
  }

  // 4. Rotating cube — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`td-cube-${t.name}`)
    const html = `<div class="${c}"><div class="cube"><i class="f1"></i><i class="f2"></i><i class="f3"></i><i class="f4"></i><i class="f5"></i><i class="f6"></i></div></div>`
    const css = `.${c} {
  perspective: 600px;
  width: 90px;
  height: 90px;
  display: grid;
  place-items: center;
}
.${c} .cube {
  position: relative;
  width: 56px;
  height: 56px;
  transform-style: preserve-3d;
  animation: ${c}-spin 6s linear infinite;
}
.${c} i {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(255,255,255,0.25);
  opacity: 0.85;
}
.${c} .f1 { background: ${t.a}; transform: translateZ(28px); }
.${c} .f2 { background: ${t.b}; transform: rotateY(180deg) translateZ(28px); }
.${c} .f3 { background: ${t.c}; transform: rotateY(90deg)  translateZ(28px); }
.${c} .f4 { background: ${t.a}; transform: rotateY(-90deg) translateZ(28px); }
.${c} .f5 { background: ${t.b}; transform: rotateX(90deg)  translateZ(28px); }
.${c} .f6 { background: ${t.c}; transform: rotateX(-90deg) translateZ(28px); }
@keyframes ${c}-spin {
  from { transform: rotateX(-20deg) rotateY(0); }
  to   { transform: rotateX(-20deg) rotateY(360deg); }
}`
    add(mk({
      name: `${t.name} Rotating Cube`,
      category: '3D & Perspective',
      description: `Six-faced cube in ${t.name.toLowerCase()} colors, rotating continuously with real CSS 3D transforms.`,
      html, css,
      tags: ['3d', 'cube', 'rotate', 'preserve-3d', t.name.toLowerCase()],
    }))
  }

  // 5. Layered depth text — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`td-text-${pal.name}`)
    const d1 = shade(pal.p, 0.25)
    const d2 = shade(pal.p, 0.45)
    const d3 = shade(pal.p, 0.65)
    const html = `<h2 class="${c}">DEPTH</h2>`
    const css = `.${c} {
  margin: 0;
  font-size: 2.6rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: ${pal.s};
  text-shadow:
    1px 1px 0 ${d1},
    2px 2px 0 ${d1},
    3px 3px 0 ${d2},
    4px 4px 0 ${d2},
    5px 5px 0 ${d3},
    6px 6px 12px rgba(0,0,0,0.5);
  transition: transform 0.3s ease, text-shadow 0.3s ease;
}
.${c}:hover {
  transform: translate(-3px, -3px);
  text-shadow:
    2px 2px 0 ${d1},
    4px 4px 0 ${d1},
    6px 6px 0 ${d2},
    8px 8px 0 ${d2},
    10px 10px 0 ${d3},
    12px 12px 18px rgba(0,0,0,0.55);
}`
    add(mk({
      name: `${pal.name} Layered Depth Text`,
      category: '3D & Perspective',
      description: `Stacked text-shadow layers give the headline a solid ${pal.name.toLowerCase()} extrusion that deepens on hover.`,
      html, css,
      tags: ['3d', 'text', 'extrude', 'text-shadow', 'heading', pal.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  GLOW & NEON  (~75)
   * ========================================================== */

  // 1. Neon text — 17 palettes × 2 sizes = 34
  for (const pal of PALETTES) {
    for (const sz of ['MD', 'LG']) {
      const c = cls(`gl-text-${pal.name}-${sz}`)
      const fs = sz === 'MD' ? '1.8rem' : '2.6rem'
      const html = `<h2 class="${c}">NEON</h2>`
      const css = `.${c} {
  margin: 0;
  font-size: ${fs};
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #fff;
  text-shadow:
    0 0 4px #fff,
    0 0 10px ${pal.s},
    0 0 22px ${pal.p},
    0 0 42px ${pal.p};
  animation: ${c}-hum 2.6s ease-in-out infinite;
}
@keyframes ${c}-hum {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.82; }
}`
      add(mk({
        name: `${pal.name} Neon Text (${sz})`,
        category: 'Glow & Neon',
        description: `Headline lit like a ${pal.name.toLowerCase()} neon tube, with a slow hum in the brightness.`,
        html, css,
        tags: ['neon', 'glow', 'text', 'text-shadow', pal.name.toLowerCase(), sz.toLowerCase()],
      }))
    }
  }

  // 2. Neon tube border — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`gl-box-${pal.name}`)
    const html = `<div class="${c}">OPEN</div>`
    const css = `.${c} {
  padding: 1rem 1.8rem;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: ${pal.a};
  border: 2px solid ${pal.p};
  border-radius: 0.5rem;
  background: rgba(${pal.rgb}, 0.06);
  box-shadow:
    0 0 8px rgba(${pal.rgb}, 0.7),
    0 0 24px rgba(${pal.rgb}, 0.45),
    inset 0 0 12px rgba(${pal.rgb}, 0.35);
  text-shadow: 0 0 8px rgba(${pal.rgb}, 0.9);
  transition: box-shadow 0.3s ease, color 0.3s ease;
}
.${c}:hover {
  color: #fff;
  box-shadow:
    0 0 14px rgba(${pal.rgb}, 0.9),
    0 0 44px rgba(${pal.rgb}, 0.6),
    inset 0 0 22px rgba(${pal.rgb}, 0.5);
}`
    add(mk({
      name: `${pal.name} Neon Tube Box`,
      category: 'Glow & Neon',
      description: `Sign-style box with a ${pal.name.toLowerCase()} tube border glowing inside and out.`,
      html, css,
      tags: ['neon', 'glow', 'border', 'sign', pal.name.toLowerCase()],
    }))
  }

  // 3. Pulsing glow orb — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`gl-orb-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, #fff 0 4%, ${g.a} 40%, ${g.b} 100%);
  box-shadow:
    0 0 24px rgba(${rgbOf(g.a)}, 0.65),
    0 0 60px rgba(${rgbOf(g.b)}, 0.45);
  animation: ${c}-breathe 2.8s ease-in-out infinite;
}
@keyframes ${c}-breathe {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 24px rgba(${rgbOf(g.a)}, 0.65), 0 0 60px rgba(${rgbOf(g.b)}, 0.45);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 40px rgba(${rgbOf(g.a)}, 0.85), 0 0 100px rgba(${rgbOf(g.b)}, 0.6);
  }
}`
    add(mk({
      name: `${g.name} Glow Orb`,
      category: 'Glow & Neon',
      description: `Breathing ${g.name.toLowerCase()} sphere with a specular highlight and a wide ambient bloom.`,
      html, css,
      tags: ['glow', 'orb', 'sphere', 'pulse', 'radial', g.name.toLowerCase()],
    }))
  }

  // 4. Flickering neon sign — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`gl-flicker-${g.name}`)
    const html = `<h2 class="${c}">${g.name.toUpperCase()}</h2>`
    const css = `.${c} {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #fff;
  text-shadow:
    0 0 6px ${g.a},
    0 0 18px ${g.a},
    0 0 36px ${g.b};
  animation: ${c}-flicker 4s linear infinite;
}
@keyframes ${c}-flicker {
  0%, 18%, 22%, 25%, 53%, 57%, 100% {
    opacity: 1;
    text-shadow: 0 0 6px ${g.a}, 0 0 18px ${g.a}, 0 0 36px ${g.b};
  }
  20%, 24%, 55% {
    opacity: 0.35;
    text-shadow: none;
  }
}`
    add(mk({
      name: `${g.name} Flickering Sign`,
      category: 'Glow & Neon',
      description: `Neon sign in ${g.name.toLowerCase()} that stutters and cuts out like failing tube gas.`,
      html, css,
      tags: ['neon', 'flicker', 'sign', 'retro', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PATTERNS & TEXTURES  (~66)
   * ========================================================== */

  // 1. Dot grid — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`pt-dots-${pal.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 150px;
  border-radius: 0.7rem;
  background-color: #0f172a;
  background-image: radial-gradient(rgba(${pal.rgb}, 0.55) 1.4px, transparent 1.4px);
  background-size: 18px 18px;
  background-position: 0 0;
  animation: ${c}-drift 6s linear infinite;
}
@keyframes ${c}-drift {
  to { background-position: 18px 18px; }
}`
    add(mk({
      name: `${pal.name} Dot Grid`,
      category: 'Patterns & Textures',
      description: `Evenly spaced ${pal.name.toLowerCase()} dot grid that drifts diagonally — a calm canvas background.`,
      html, css,
      tags: ['pattern', 'dots', 'grid', 'texture', pal.name.toLowerCase()],
    }))
  }

  // 2. Diagonal stripes — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`pt-stripes-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 150px;
  border-radius: 0.7rem;
  background-image: repeating-linear-gradient(
    45deg,
    ${g.a} 0 14px,
    ${g.b} 14px 28px
  );
  background-size: 40px 40px;
  animation: ${c}-slide 2.4s linear infinite;
}
@keyframes ${c}-slide {
  to { background-position: 40px 0; }
}`
    add(mk({
      name: `${g.name} Diagonal Stripes`,
      category: 'Patterns & Textures',
      description: `Barber-pole stripes in ${g.name.toLowerCase()} sliding continuously across the surface.`,
      html, css,
      tags: ['pattern', 'stripes', 'diagonal', 'barber', g.name.toLowerCase()],
    }))
  }

  // 3. Checkerboard — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`pt-check-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 150px;
  border-radius: 0.7rem;
  background-color: ${g.a};
  background-image:
    linear-gradient(45deg, ${g.b} 25%, transparent 25%, transparent 75%, ${g.b} 75%),
    linear-gradient(45deg, ${g.b} 25%, transparent 25%, transparent 75%, ${g.b} 75%);
  background-size: 28px 28px;
  background-position: 0 0, 14px 14px;
  animation: ${c}-shift 3s ease-in-out infinite alternate;
}
@keyframes ${c}-shift {
  to { background-position: 14px 0, 28px 14px; }
}`
    add(mk({
      name: `${g.name} Checkerboard`,
      category: 'Patterns & Textures',
      description: `Two-tone ${g.name.toLowerCase()} checkerboard that shuffles half a tile back and forth.`,
      html, css,
      tags: ['pattern', 'checkerboard', 'squares', 'texture', g.name.toLowerCase()],
    }))
  }

  // 4. Graph paper — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`pt-graph-${pal.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 150px;
  border-radius: 0.7rem;
  background-color: #0b1220;
  background-image:
    linear-gradient(rgba(${pal.rgb}, 0.35) 1px, transparent 1px),
    linear-gradient(90deg, rgba(${pal.rgb}, 0.35) 1px, transparent 1px),
    linear-gradient(rgba(${pal.rgb}, 0.14) 1px, transparent 1px),
    linear-gradient(90deg, rgba(${pal.rgb}, 0.14) 1px, transparent 1px);
  background-size: 60px 60px, 60px 60px, 12px 12px, 12px 12px;
}`
    add(mk({
      name: `${pal.name} Graph Paper`,
      category: 'Patterns & Textures',
      description: `Blueprint grid with ${pal.name.toLowerCase()} minor and major rules — four gradients, no images.`,
      html, css,
      tags: ['pattern', 'grid', 'graph', 'blueprint', pal.name.toLowerCase()],
    }))
  }

  // 5. Topographic waves — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`pt-topo-${t.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 150px;
  border-radius: 0.7rem;
  background-color: #0f172a;
  background-image:
    repeating-radial-gradient(circle at 20% 30%, transparent 0 12px, rgba(${rgbOf(t.a)}, 0.28) 12px 13px),
    repeating-radial-gradient(circle at 78% 72%, transparent 0 14px, rgba(${rgbOf(t.b)}, 0.24) 14px 15px),
    repeating-radial-gradient(circle at 50% 110%, transparent 0 18px, rgba(${rgbOf(t.c)}, 0.2) 18px 19px);
  animation: ${c}-breathe 8s ease-in-out infinite alternate;
}
@keyframes ${c}-breathe {
  to { background-size: 108% 108%, 112% 112%, 104% 104%; }
}`
    add(mk({
      name: `${t.name} Topographic Contours`,
      category: 'Patterns & Textures',
      description: `Contour-map rings in ${t.name.toLowerCase()} tones, slowly expanding like a breathing landscape.`,
      html, css,
      tags: ['pattern', 'topographic', 'contour', 'map', 'texture', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MASKS & CLIP PATHS  (~61)
   * ========================================================== */

  // 1. Clip-path wipe reveal on hover — 12 pairs × 2 sizes = 24
  for (const g of GRADPAIRS) {
    for (const sz of ['MD', 'LG']) {
      const c = cls(`mk-wipe-${g.name}-${sz}`)
      const w = sz === 'MD' ? 190 : 230
      const html = `<div class="${c}"><span class="base">Hover to reveal</span><span class="top">Revealed!</span></div>`
      const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: ${w}px;
  height: 76px;
  border-radius: 0.7rem;
  overflow: hidden;
  cursor: pointer;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.08);
}
.${c} span {
  grid-area: 1 / 1;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-size: 0.9rem;
  font-weight: 700;
}
.${c} .base { color: #94a3b8; }
.${c} .top {
  color: #fff;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
  transition: clip-path 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.${c}:hover .top {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}`
      add(mk({
        name: `${g.name} Clip Wipe Reveal (${sz})`,
        category: 'Masks & Clip Paths',
        description: `A ${g.name.toLowerCase()} panel wipes across via clip-path to swap the label on hover.`,
        html, css,
        tags: ['clip-path', 'mask', 'reveal', 'wipe', 'hover', g.name.toLowerCase(), sz.toLowerCase()],
      }))
    }
  }

  // 2. Edge-fade mask — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mk-fade-${pal.name}`)
    const html = `<div class="${c}"><div class="row">SHIPPING • FAST • EVERYWHERE • SHIPPING • FAST •</div></div>`
    const css = `.${c} {
  width: 230px;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
}
.${c} .row {
  display: inline-block;
  white-space: nowrap;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${pal.a};
  animation: ${c}-marquee 9s linear infinite;
}
@keyframes ${c}-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}`
    add(mk({
      name: `${pal.name} Edge-Fade Marquee`,
      category: 'Masks & Clip Paths',
      description: `Scrolling ${pal.name.toLowerCase()} ticker whose ends dissolve into the background using mask-image.`,
      html, css,
      tags: ['mask', 'mask-image', 'marquee', 'fade', 'ticker', pal.name.toLowerCase()],
    }))
  }

  // 3. Hexagon tile — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mk-hex-${g.name}`)
    const html = `<div class="${c}">HEX</div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 96px;
  height: 108px;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #fff;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease;
  cursor: pointer;
}
.${c}:hover {
  transform: rotate(30deg) scale(1.06);
  filter: brightness(1.15);
}`
    add(mk({
      name: `${g.name} Hexagon Tile`,
      category: 'Masks & Clip Paths',
      description: `Six-sided ${g.name.toLowerCase()} tile cut with clip-path that spins 30° on hover.`,
      html, css,
      tags: ['clip-path', 'hexagon', 'shape', 'polygon', g.name.toLowerCase()],
    }))
  }

  // 4. Morphing blob — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`mk-blob-${t.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 110px;
  height: 110px;
  background: linear-gradient(135deg, ${t.a}, ${t.b}, ${t.c});
  border-radius: 60% 40% 55% 45% / 45% 55% 40% 60%;
  box-shadow: 0 14px 40px rgba(${rgbOf(t.b)}, 0.35);
  animation: ${c}-morph 8s ease-in-out infinite;
}
@keyframes ${c}-morph {
  0%, 100% { border-radius: 60% 40% 55% 45% / 45% 55% 40% 60%; transform: rotate(0); }
  33%      { border-radius: 40% 60% 35% 65% / 60% 35% 65% 40%; transform: rotate(12deg); }
  66%      { border-radius: 50% 50% 65% 35% / 35% 65% 45% 55%; transform: rotate(-10deg); }
}`
    add(mk({
      name: `${t.name} Morphing Blob`,
      category: 'Masks & Clip Paths',
      description: `Organic ${t.name.toLowerCase()} blob that continuously reshapes itself through border-radius keyframes.`,
      html, css,
      tags: ['blob', 'shape', 'morph', 'organic', 'border-radius', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CHARTS & DATA  (~66)
   * ========================================================== */

  // 1. Bar chart — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`ch-bars-${pal.name}`)
    const html = `<div class="${c}"><i style="--h:45%"></i><i style="--h:72%"></i><i style="--h:38%"></i><i style="--h:90%"></i><i style="--h:61%"></i><i style="--h:78%"></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 110px;
  padding: 0.8rem;
  border-radius: 0.7rem;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.07);
}
.${c} i {
  width: 18px;
  height: var(--h);
  border-radius: 4px 4px 2px 2px;
  background: linear-gradient(180deg, ${pal.s}, ${pal.p});
  box-shadow: 0 0 12px rgba(${pal.rgb}, 0.35);
  transform-origin: bottom;
  animation: ${c}-grow 1s cubic-bezier(0.16, 1, 0.3, 1) both;
  transition: filter 0.2s ease;
}
.${c} i:nth-child(2) { animation-delay: 0.08s; }
.${c} i:nth-child(3) { animation-delay: 0.16s; }
.${c} i:nth-child(4) { animation-delay: 0.24s; }
.${c} i:nth-child(5) { animation-delay: 0.32s; }
.${c} i:nth-child(6) { animation-delay: 0.4s; }
.${c} i:hover { filter: brightness(1.3); }
@keyframes ${c}-grow {
  from { transform: scaleY(0); }
}`
    add(mk({
      name: `${pal.name} Bar Chart`,
      category: 'Charts & Data',
      description: `Six-column ${pal.name.toLowerCase()} bar chart; heights come from a --h custom property and grow in sequence.`,
      html, css,
      tags: ['chart', 'bars', 'data', 'dashboard', pal.name.toLowerCase()],
    }))
  }

  // 2. Donut chart — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`ch-donut-${g.name}`)
    const html = `<div class="${c}"><span>64%</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: conic-gradient(${g.a} 0 40%, ${g.b} 40% 64%, rgba(255,255,255,0.08) 64% 100%);
  animation: ${c}-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 22px;
  border-radius: 50%;
  background: #0f172a;
}
.${c} span {
  position: relative;
  font-size: 1.1rem;
  font-weight: 800;
  color: #f1f5f9;
}
@keyframes ${c}-in {
  from { transform: rotate(-90deg) scale(0.85); opacity: 0; }
  to   { transform: rotate(0) scale(1); opacity: 1; }
}`
    add(mk({
      name: `${g.name} Donut Chart`,
      category: 'Charts & Data',
      description: `Two-segment ${g.name.toLowerCase()} donut drawn with one conic-gradient — no SVG, no chart library.`,
      html, css,
      tags: ['chart', 'donut', 'pie', 'conic', 'data', g.name.toLowerCase()],
    }))
  }

  // 3. Sparkline area — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`ch-spark-${g.name}`)
    const html = `<div class="${c}"><div class="area"></div></div>`
    const css = `.${c} {
  width: 200px;
  height: 64px;
  padding: 0.5rem;
  border-radius: 0.6rem;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.07);
  overflow: hidden;
}
.${c} .area {
  width: 100%;
  height: 100%;
  /* Opaque at the top edge so the trend line itself reads clearly, then
     falling away to almost nothing at the baseline. */
  background: linear-gradient(180deg, ${g.a} 0 3%, rgba(${rgbOf(g.a)}, 0.45) 25%, rgba(${rgbOf(g.b)}, 0.06) 100%);
  clip-path: polygon(
    0 78%, 12% 62%, 24% 70%, 36% 40%, 48% 52%,
    60% 26%, 72% 38%, 84% 14%, 100% 30%,
    100% 100%, 0 100%
  );
  animation: ${c}-rise 1.1s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes ${c}-rise {
  from { transform: translateY(30%); opacity: 0; }
}`
    add(mk({
      name: `${g.name} Sparkline Area`,
      category: 'Charts & Data',
      description: `Compact ${g.name.toLowerCase()} area sparkline shaped entirely by a clip-path polygon.`,
      html, css,
      tags: ['chart', 'sparkline', 'area', 'clip-path', 'trend', g.name.toLowerCase()],
    }))
  }

  // 4. Stat tile with trend — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`ch-stat-${pal.name}`)
    const html = `<div class="${c}"><p>Monthly revenue</p><strong>$48,210</strong><span>▲ 12.4%</span></div>`
    const css = `.${c} {
  width: 190px;
  padding: 0.95rem 1rem;
  border-radius: 0.75rem;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
.${c} p { margin: 0; font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: #64748b; }
.${c} strong { display: block; margin: 0.35rem 0 0.3rem; font-size: 1.5rem; color: #f1f5f9; }
.${c} span {
  display: inline-block;
  padding: 0.12rem 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 999px;
  color: ${pal.a};
  background: rgba(${pal.rgb}, 0.14);
}
.${c}:hover {
  transform: translateY(-3px);
  border-color: rgba(${pal.rgb}, 0.5);
  box-shadow: 0 12px 28px rgba(${pal.rgb}, 0.2);
}`
    add(mk({
      name: `${pal.name} Stat Tile`,
      category: 'Charts & Data',
      description: `KPI tile with label, value, and a ${pal.name.toLowerCase()} delta chip that lifts on hover.`,
      html, css,
      tags: ['chart', 'stat', 'kpi', 'metric', 'dashboard', pal.name.toLowerCase()],
    }))
  }

  // 5. Heat grid — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`ch-heat-${t.name}`)
    const cells = Array.from({ length: 28 }, () => '<i></i>').join('')
    const html = `<div class="${c}">${cells}</div>`
    const css = `.${c} {
  display: grid;
  grid-template-columns: repeat(7, 14px);
  gap: 4px;
  padding: 0.8rem;
  border-radius: 0.7rem;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.07);
}
.${c} i {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: rgba(255,255,255,0.06);
  animation: ${c}-heat 3.2s ease-in-out infinite;
}
.${c} i:nth-child(3n)   { animation-delay: 0.2s; background: rgba(${rgbOf(t.a)}, 0.35); }
.${c} i:nth-child(4n)   { animation-delay: 0.4s; background: rgba(${rgbOf(t.b)}, 0.55); }
.${c} i:nth-child(5n)   { animation-delay: 0.6s; background: rgba(${rgbOf(t.c)}, 0.75); }
.${c} i:nth-child(7n)   { animation-delay: 0.8s; }
@keyframes ${c}-heat {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}`
    add(mk({
      name: `${t.name} Heat Grid`,
      category: 'Charts & Data',
      description: `Contribution-graph style grid where ${t.name.toLowerCase()} cells shimmer at different intensities.`,
      html, css,
      tags: ['chart', 'heatmap', 'grid', 'contributions', 'data', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TIMELINES & STEPS  (~41)
   * ========================================================== */

  // 1. Vertical timeline — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`tl-vert-${pal.name}`)
    const html = `<ul class="${c}"><li><strong>Ordered</strong><span>09:14</span></li><li><strong>Shipped</strong><span>11:02</span></li><li class="now"><strong>Out for delivery</strong><span>14:30</span></li></ul>`
    const css = `.${c} {
  list-style: none;
  margin: 0;
  padding: 0 0 0 1.3rem;
  width: 210px;
  border-left: 2px solid rgba(${pal.rgb}, 0.25);
}
.${c} li {
  position: relative;
  padding-bottom: 1rem;
  animation: ${c}-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.${c} li:nth-child(2) { animation-delay: 0.12s; }
.${c} li:nth-child(3) { animation-delay: 0.24s; }
.${c} li:last-child { padding-bottom: 0; }
.${c} li::before {
  content: '';
  position: absolute;
  left: calc(-1.3rem - 6px);
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #0f172a;
  border: 2px solid ${pal.p};
}
.${c} li.now::before {
  background: ${pal.p};
  box-shadow: 0 0 0 4px rgba(${pal.rgb}, 0.22);
  animation: ${c}-pulse 1.8s ease-in-out infinite;
}
.${c} strong { display: block; font-size: 0.85rem; color: #e2e8f0; }
.${c} span { font-size: 0.75rem; color: #64748b; }
@keyframes ${c}-in {
  from { opacity: 0; transform: translateX(-10px); }
}
@keyframes ${c}-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(${pal.rgb}, 0.22); }
  50%      { box-shadow: 0 0 0 9px rgba(${pal.rgb}, 0); }
}`
    add(mk({
      name: `${pal.name} Vertical Timeline`,
      category: 'Timelines & Steps',
      description: `Activity timeline with ${pal.name.toLowerCase()} nodes; entries stagger in and the current step pulses.`,
      html, css,
      tags: ['timeline', 'activity', 'vertical', 'steps', pal.name.toLowerCase()],
    }))
  }

  // 2. Horizontal stepper — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`tl-step-${g.name}`)
    const html = `<div class="${c}"><div class="s done"><i>1</i><b>Cart</b></div><div class="s done"><i>2</i><b>Address</b></div><div class="s"><i>3</i><b>Pay</b></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: flex-start;
  width: 250px;
}
.${c} .s {
  position: relative;
  flex: 1;
  text-align: center;
}
.${c} .s::before {
  content: '';
  position: absolute;
  top: 13px;
  left: -50%;
  width: 100%;
  height: 2px;
  background: rgba(255,255,255,0.12);
}
.${c} .s:first-child::before { display: none; }
.${c} .s.done::before { background: linear-gradient(90deg, ${g.a}, ${g.b}); }
.${c} i {
  position: relative;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin: 0 auto 0.35rem;
  border-radius: 50%;
  font-size: 0.75rem;
  font-style: normal;
  font-weight: 700;
  color: #64748b;
  background: #0f172a;
  border: 2px solid rgba(255,255,255,0.14);
  transition: all 0.3s ease;
}
.${c} .s.done i {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 0 0 4px rgba(${rgbOf(g.a)}, 0.18);
}
.${c} b {
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
}
.${c} .s.done b { color: #e2e8f0; }`
    add(mk({
      name: `${g.name} Checkout Stepper`,
      category: 'Timelines & Steps',
      description: `Three-stage horizontal stepper; completed stages fill with the ${g.name.toLowerCase()} gradient and connect their rails.`,
      html, css,
      tags: ['stepper', 'steps', 'checkout', 'wizard', 'progress', g.name.toLowerCase()],
    }))
  }

  // 3. Auto-advancing progress steps — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`tl-auto-${g.name}`)
    const html = `<div class="${c}"><div class="rail"><span></span></div><ul><li>Queued</li><li>Building</li><li>Live</li></ul></div>`
    const css = `.${c} {
  width: 240px;
}
.${c} .rail {
  height: 4px;
  border-radius: 999px;
  background: rgba(255,255,255,0.1);
  overflow: hidden;
}
.${c} .rail span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  box-shadow: 0 0 12px rgba(${rgbOf(g.a)}, 0.5);
  animation: ${c}-advance 4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
.${c} ul {
  display: flex;
  justify-content: space-between;
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
}
.${c} li {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  animation: ${c}-lit 4s linear infinite;
}
.${c} li:nth-child(2) { animation-delay: 1.3s; }
.${c} li:nth-child(3) { animation-delay: 2.6s; }
@keyframes ${c}-advance {
  0%   { width: 8%; }
  35%  { width: 45%; }
  70%  { width: 82%; }
  100% { width: 100%; }
}
@keyframes ${c}-lit {
  0%, 25%   { color: ${g.b}; }
  26%, 100% { color: #64748b; }
}`
    add(mk({
      name: `${g.name} Deploy Steps`,
      category: 'Timelines & Steps',
      description: `Pipeline indicator: a ${g.name.toLowerCase()} rail advances through stages while each label lights in turn.`,
      html, css,
      tags: ['steps', 'pipeline', 'deploy', 'progress', 'rail', g.name.toLowerCase()],
    }))
  }
}
