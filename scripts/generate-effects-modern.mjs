// scripts/generate-effects-modern.mjs
//
// Third wave: new TEMPLATES inside the existing categories, rather than
// new categories.
//
// The first two waves covered the classic vocabulary (solid buttons,
// spinners, fade-ups). This wave is the vocabulary that product UI
// actually uses right now — the Linear / Vercel / Stripe / Apple house
// style — chosen for techniques that are structural rather than
// fashionable, so they age like `border-radius` rather than like
// skeuomorphic bevels:
//
//   · 1px gradient borders via mask-composite
//   · inner top highlights (`inset 0 1px 0`) for lit-from-above depth
//   · sheen / beam sweeps instead of pulsing glows
//   · grain over gradients to kill banding
//   · radial mask fades on grids and rails
//   · background-clip: text for gradient and sweep type
//   · spring easing and 1–2px hover lifts, not 3D flips
//
// Covers: Buttons, Loaders, Cards, Text, Backgrounds, Inputs & Hover,
// Navigation & Menus, Dividers & Separators, Badges & Tags.
// The remaining categories are in generate-effects-modern2.mjs.
//
// Tokens and helpers come from generate-effects.mjs so all waves share one
// id sequence and one palette. Everything assumes a DARK preview surface.

/** '#f43f5e' -> '244,63,94'. */
export const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')

/**
 * Inline SVG turbulence, used as a grain overlay.
 *
 * Large flat gradients band badly on 8-bit displays; a few percent of
 * noise on top hides it completely. It's a data URI rather than a file so
 * every snippet stays copy-paste standalone — no asset to also download.
 */
export const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/**
 * The modern 1px gradient border: paint the gradient on a pseudo-element,
 * then mask out everything but the padding ring.
 *
 * This replaced `border-image` and the old double-background trick because
 * it's the only approach that keeps `border-radius` correct on all four
 * corners. `sel` is the full selector to attach the ring to.
 */
export function gradientRing(sel, from, to, width = 1, extra = '') {
  return `${sel} {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: ${width}px;
  background: linear-gradient(${from}, ${to});
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  pointer-events: none;${extra ? '\n  ' + extra : ''}
}`
}

export function generateModern(ctx) {
  const { PALETTES, GRADPAIRS, TRIOS, cls, mk, add } = ctx

  /* ============================================================
   *  BUTTONS  (+82)
   * ========================================================== */

  // 1. Sheen sweep button — 12 pairs × 2 sizes = 24
  for (const g of GRADPAIRS) {
    for (const sz of ['MD', 'LG']) {
      const c = cls(`mb-sheen-${g.name}-${sz}`)
      const pad = sz === 'MD' ? '0.6rem 1.3rem' : '0.8rem 1.7rem'
      const fs = sz === 'MD' ? '0.9rem' : '1.02rem'
      const html = `<button class="${c}">Get started</button>`
      const css = `.${c} {
  position: relative;
  overflow: hidden;
  padding: ${pad};
  font-size: ${fs};
  font-weight: 600;
  color: #fff;
  border: none;
  border-radius: 0.65rem;
  cursor: pointer;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.25),
    0 6px 18px rgba(${rgbOf(g.a)}, 0.32);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.${c}::after {
  content: '';
  position: absolute;
  top: 0;
  left: -60%;
  width: 38%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
  transform: skewX(-20deg);
  animation: ${c}-sheen 3.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
.${c}:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.3),
    0 10px 26px rgba(${rgbOf(g.a)}, 0.42);
}
.${c}:active { transform: translateY(0); }
@keyframes ${c}-sheen {
  0%        { left: -60%; }
  55%, 100% { left: 120%; }
}`
      add(mk({
        name: `${g.name} Sheen Button (${sz})`,
        category: 'Buttons',
        description: `${g.name} CTA with a lit top edge and a highlight that sweeps across on a slow loop.`,
        html, css,
        tags: ['button', 'sheen', 'shine', 'cta', 'gradient', g.name.toLowerCase(), sz.toLowerCase()],
      }))
    }
  }

  // 2. Gradient-ring ghost button — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mb-ring-${g.name}`)
    const html = `<button class="${c}">Documentation</button>`
    const css = `.${c} {
  position: relative;
  padding: 0.65rem 1.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
  background: #0b1120;
  border: none;
  border-radius: 0.65rem;
  cursor: pointer;
  transition: color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
}
${gradientRing(`.${c}::before`, g.a, g.b, 1)}
.${c}:hover {
  color: #fff;
  background: rgba(${rgbOf(g.a)}, 0.1);
  box-shadow: 0 0 26px rgba(${rgbOf(g.a)}, 0.28);
}`
    add(mk({
      name: `${g.name} Gradient Ring Button`,
      category: 'Buttons',
      description: `Ghost button with a true 1px ${g.name.toLowerCase()} gradient border — masked, so every corner radius stays clean.`,
      html, css,
      tags: ['button', 'ghost', 'gradient-border', 'mask', 'outline', g.name.toLowerCase()],
    }))
  }

  // 3. Glass button with inner highlight — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mb-glass-${pal.name}`)
    const html = `<button class="${c}">Continue</button>`
    const css = `.${c} {
  padding: 0.62rem 1.35rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #e8ecf5;
  cursor: pointer;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.14);
  background: linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.04));
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.28),
    0 8px 22px rgba(0,0,0,0.4);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.18s ease;
}
.${c}:hover {
  transform: translateY(-1px);
  border-color: rgba(${pal.rgb}, 0.6);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.36),
    0 10px 28px rgba(0,0,0,0.5),
    0 0 26px rgba(${pal.rgb}, 0.35);
}
.${c}:active { transform: translateY(0); }`
    add(mk({
      name: `${pal.name} Glass Button`,
      category: 'Buttons',
      description: `Translucent button lit from above, picking up a ${pal.name.toLowerCase()} edge and halo on hover.`,
      html, css,
      tags: ['button', 'glass', 'frosted', 'backdrop-filter', 'inner-highlight', pal.name.toLowerCase()],
    }))
  }

  // 4. Arrow-slide button — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mb-arrow-${g.name}`)
    const html = `<button class="${c}">Start building<span class="ar">&#8594;</span></button>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.62rem 1.3rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  border: none;
  border-radius: 0.6rem;
  cursor: pointer;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.24), 0 6px 18px rgba(${rgbOf(g.a)}, 0.3);
  transition: box-shadow 0.25s ease, transform 0.18s ease;
}
.${c} .ar {
  display: inline-block;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.${c}:hover {
  transform: translateY(-1px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 10px 26px rgba(${rgbOf(g.a)}, 0.4);
}
.${c}:hover .ar { transform: translateX(5px); }`
    add(mk({
      name: `${g.name} Arrow Slide Button`,
      category: 'Buttons',
      description: `The standard product CTA: ${g.name.toLowerCase()} fill, and the arrow eases forward on hover.`,
      html, css,
      tags: ['button', 'arrow', 'cta', 'micro-interaction', g.name.toLowerCase()],
    }))
  }

  // 5. Inline loading state — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mb-load-${pal.name}`)
    const html = `<button class="${c}"><span class="sp"></span>Deploying</button>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1.25rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: #e2e8f0;
  border-radius: 0.6rem;
  border: 1px solid rgba(${pal.rgb}, 0.4);
  background: rgba(${pal.rgb}, 0.12);
  cursor: progress;
}
.${c} .sp {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(${pal.rgb}, 0.28);
  border-top-color: ${pal.p};
  animation: ${c}-spin 0.7s linear infinite;
}
@keyframes ${c}-spin { to { transform: rotate(1turn); } }`
    add(mk({
      name: `${pal.name} Loading Button`,
      category: 'Buttons',
      description: `The pending state a submit button needs: ${pal.name.toLowerCase()} tint, inline spinner, progress cursor.`,
      html, css,
      tags: ['button', 'loading', 'pending', 'spinner', 'state', pal.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  LOADERS  (+41)
   * ========================================================== */

  // 6. Masked conic ring — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`ml-conic-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: conic-gradient(from 0turn, transparent 0 25%, ${g.a} 70%, ${g.b} 100%);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px));
  animation: ${c}-spin 0.9s linear infinite;
}
@keyframes ${c}-spin { to { transform: rotate(1turn); } }`
    add(mk({
      name: `${g.name} Conic Ring Spinner`,
      category: 'Loaders',
      description: `Thin ${g.name.toLowerCase()} arc spinner — one element, drawn by a conic gradient and cut to a ring with a radial mask.`,
      html, css,
      tags: ['loader', 'spinner', 'conic', 'mask', 'single-element', g.name.toLowerCase()],
    }))
  }

  // 7. Audio-style equalizer bars — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`ml-eq-${pal.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 34px;
}
.${c} i {
  width: 4px;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(180deg, ${pal.s}, ${pal.p});
  transform-origin: center;
  animation: ${c}-bounce 1.1s ease-in-out infinite;
}
.${c} i:nth-child(2) { animation-delay: 0.12s; }
.${c} i:nth-child(3) { animation-delay: 0.24s; }
.${c} i:nth-child(4) { animation-delay: 0.36s; }
.${c} i:nth-child(5) { animation-delay: 0.48s; }
@keyframes ${c}-bounce {
  0%, 100% { transform: scaleY(0.3); opacity: 0.6; }
  50%      { transform: scaleY(1);   opacity: 1; }
}`
    add(mk({
      name: `${pal.name} Equalizer Loader`,
      category: 'Loaders',
      description: `Five ${pal.name.toLowerCase()} bars pumping out of phase — the compact "still working" indicator for inline use.`,
      html, css,
      tags: ['loader', 'equalizer', 'bars', 'audio', 'inline', pal.name.toLowerCase()],
    }))
  }

  // 8. Morphing dot trio — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`ml-dots-${g.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 7px;
}
.${c} i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  animation: ${c}-morph 1.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
.${c} i:nth-child(2) { animation-delay: 0.16s; }
.${c} i:nth-child(3) { animation-delay: 0.32s; }
@keyframes ${c}-morph {
  0%, 100% { transform: scale(0.65); opacity: 0.45; }
  40%      { transform: scale(1.15); opacity: 1; }
}`
    add(mk({
      name: `${g.name} Morphing Dots`,
      category: 'Loaders',
      description: `Three ${g.name.toLowerCase()} dots swelling in sequence — the quietest loader that still reads as motion.`,
      html, css,
      tags: ['loader', 'dots', 'subtle', 'inline', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CARDS  (+56)
   * ========================================================== */

  // 9. Bento metric tile — 12 pairs × 2 sizes = 24
  for (const g of GRADPAIRS) {
    for (const sz of ['MD', 'LG']) {
      const c = cls(`mc-bento-${g.name}-${sz}`)
      const w = sz === 'MD' ? 210 : 250
      const html = `<div class="${c}"><span class="k">Analytics</span><strong>2.4M</strong><p>events this month</p></div>`
      const css = `.${c} {
  position: relative;
  overflow: hidden;
  width: ${w}px;
  padding: 1.1rem 1.15rem 1.2rem;
  border-radius: 1rem;
  background: linear-gradient(180deg, #131a2b, #0b1120);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.07),
    0 18px 40px rgba(0,0,0,0.45);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
}
${gradientRing(`.${c}::before`, 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.03)', 1)}
.${c}::after {
  content: '';
  position: absolute;
  top: -55%;
  right: -30%;
  width: 210px;
  height: 210px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(${rgbOf(g.a)}, 0.32), transparent 65%);
  pointer-events: none;
  transition: opacity 0.35s ease;
  opacity: 0.85;
}
.${c} .k {
  position: relative;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: ${g.b};
}
.${c} strong {
  position: relative;
  display: block;
  margin: 0.4rem 0 0.15rem;
  font-size: ${sz === 'MD' ? '1.7rem' : '2rem'};
  line-height: 1.1;
  color: #f8fafc;
}
.${c} p {
  position: relative;
  margin: 0;
  font-size: 0.78rem;
  color: #7c8aa5;
}
.${c}:hover {
  transform: translateY(-3px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.1),
    0 26px 56px rgba(0,0,0,0.55);
}
.${c}:hover::after { opacity: 1; }`
      add(mk({
        name: `${g.name} Bento Metric Tile (${sz})`,
        category: 'Cards',
        description: `Dashboard tile with a hairline ring, a lit top edge and a ${g.name.toLowerCase()} corner bloom — the bento-grid unit.`,
        html, css,
        tags: ['card', 'bento', 'metric', 'dashboard', 'gradient-border', g.name.toLowerCase(), sz.toLowerCase()],
      }))
    }
  }

  // 10. Grain-over-gradient card — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`mc-grain-${t.name}`)
    const html = `<div class="${c}"><h4>${t.name}</h4><p>Grain keeps large gradients from banding.</p></div>`
    const css = `.${c} {
  position: relative;
  overflow: hidden;
  width: 220px;
  padding: 1.2rem;
  border-radius: 0.9rem;
  color: #fff;
  background: linear-gradient(145deg, ${t.a}, ${t.b} 55%, ${t.c});
  box-shadow: 0 18px 44px rgba(0,0,0,0.4);
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: ${NOISE};
  opacity: 0.16;
  mix-blend-mode: overlay;
  pointer-events: none;
}
.${c} h4 { position: relative; margin: 0 0 0.35rem; font-size: 1.05rem; }
.${c} p  { position: relative; margin: 0; font-size: 0.8rem; line-height: 1.5; opacity: 0.9; }`
    add(mk({
      name: `${t.name} Grain Card`,
      category: 'Cards',
      description: `${t.name} gradient card with an inline SVG noise overlay — the fix for gradient banding on 8-bit displays.`,
      html, css,
      tags: ['card', 'grain', 'noise', 'texture', 'gradient', 'banding', t.name.toLowerCase()],
    }))
  }

  // 11. Spotlight hover card — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mc-spot-${g.name}`)
    const html = `<div class="${c}"><h4>Edge network</h4><p>Deploy to 30 regions in one command.</p></div>`
    const css = `.${c} {
  position: relative;
  overflow: hidden;
  width: 220px;
  padding: 1.2rem;
  border-radius: 0.9rem;
  background: #0b1120;
  border: 1px solid rgba(255,255,255,0.08);
  transition: border-color 0.35s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.${c}::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: radial-gradient(320px circle at 50% 0%, rgba(${rgbOf(g.a)}, 0.22), transparent 60%);
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}
.${c} h4 { position: relative; margin: 0 0 0.4rem; font-size: 0.98rem; color: #f1f5f9; }
.${c} p  { position: relative; margin: 0; font-size: 0.8rem; line-height: 1.55; color: #7c8aa5; }
.${c}:hover {
  transform: translateY(-2px);
  border-color: rgba(${rgbOf(g.a)}, 0.45);
}
.${c}:hover::before { opacity: 1; }`
    add(mk({
      name: `${g.name} Spotlight Card`,
      category: 'Cards',
      description: `Feature card that lights a ${g.name.toLowerCase()} spotlight behind its top edge on hover — no pointer tracking, no JavaScript.`,
      html, css,
      tags: ['card', 'spotlight', 'hover', 'radial', 'feature', g.name.toLowerCase()],
    }))
  }

  // 12. Highlighted pricing card — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mc-price-${g.name}`)
    const html = `<div class="${c}"><span class="tag">Most popular</span><h4>Pro</h4><div class="p"><b>$24</b><em>/mo</em></div><ul><li>Unlimited projects</li><li>Priority support</li></ul><button>Choose Pro</button></div>`
    const css = `.${c} {
  position: relative;
  width: 210px;
  padding: 1.3rem 1.2rem 1.2rem;
  border-radius: 1rem;
  background: linear-gradient(180deg, #121a2c, #0b1120);
  box-shadow: 0 20px 46px rgba(0,0,0,0.45);
}
${gradientRing(`.${c}::before`, g.a, g.b, 1)}
.${c} .tag {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.18rem 0.6rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
  border-radius: 999px;
  white-space: nowrap;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  box-shadow: 0 4px 12px rgba(${rgbOf(g.a)}, 0.45);
}
.${c} h4 { margin: 0.3rem 0 0.2rem; font-size: 0.9rem; color: #94a3b8; }
.${c} .p { display: flex; align-items: baseline; gap: 0.2rem; }
.${c} .p b { font-size: 1.9rem; color: #f8fafc; }
.${c} .p em { font-style: normal; font-size: 0.78rem; color: #64748b; }
.${c} ul {
  list-style: none;
  margin: 0.85rem 0 1rem;
  padding: 0;
  font-size: 0.76rem;
  color: #94a3b8;
}
.${c} li { position: relative; padding-left: 1.05rem; margin-bottom: 0.35rem; }
.${c} li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.34rem;
  width: 5px;
  height: 9px;
  border: 2px solid ${g.b};
  border-top: 0;
  border-left: 0;
  transform: rotate(40deg);
}
.${c} button {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #fff;
  border: none;
  border-radius: 0.55rem;
  cursor: pointer;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.24);
  transition: filter 0.2s ease;
}
.${c} button:hover { filter: brightness(1.1); }`
    add(mk({
      name: `${g.name} Featured Pricing Card`,
      category: 'Cards',
      description: `The highlighted tier in a pricing table: ${g.name.toLowerCase()} gradient ring, floating badge, CSS-drawn checkmarks.`,
      html, css,
      tags: ['card', 'pricing', 'plan', 'saas', 'featured', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TEXT  (+75)
   * ========================================================== */

  // 13. Animated gradient shine heading — 12 pairs × 2 sizes = 24
  for (const g of GRADPAIRS) {
    for (const sz of ['MD', 'LG']) {
      const c = cls(`mt-shine-${g.name}-${sz}`)
      const fs = sz === 'MD' ? '1.7rem' : '2.4rem'
      const html = `<h2 class="${c}">Ship faster</h2>`
      const css = `.${c} {
  margin: 0;
  font-size: ${fs};
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(
    100deg,
    #94a3b8 0%, #f8fafc 22%, ${g.a} 42%,
    ${g.b} 58%, #f8fafc 78%, #94a3b8 100%
  );
  background-size: 250% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ${c}-shine 5s linear infinite;
}
@keyframes ${c}-shine {
  to { background-position: 250% center; }
}`
      add(mk({
        name: `${g.name} Shine Heading (${sz})`,
        category: 'Text',
        description: `Hero headline with light travelling through the letters — background-clip: text over a moving ${g.name.toLowerCase()} gradient.`,
        html, css,
        tags: ['text', 'gradient', 'shine', 'heading', 'background-clip', g.name.toLowerCase(), sz.toLowerCase()],
      }))
    }
  }

  // 14. Blur-in reveal — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mt-blurin-${pal.name}`)
    const html = `<h2 class="${c}">Focus</h2>`
    const css = `.${c} {
  margin: 0;
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: ${pal.a};
  animation: ${c}-in 1.1s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes ${c}-in {
  0%   { opacity: 0; filter: blur(14px); transform: translateY(10px) scale(0.98); letter-spacing: 0.1em; }
  100% { opacity: 1; filter: blur(0);    transform: translateY(0) scale(1);       letter-spacing: -0.01em; }
}`
    add(mk({
      name: `${pal.name} Blur-In Heading`,
      category: 'Text',
      description: `${pal.name} headline that resolves out of a blur while its tracking tightens — the current default for hero copy.`,
      html, css,
      tags: ['text', 'blur', 'reveal', 'entrance', 'heading', pal.name.toLowerCase()],
    }))
  }

  // 15. Hover fill sweep — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mt-fill-${pal.name}`)
    const html = `<span class="${c}">Hover to fill</span>`
    const css = `.${c} {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  cursor: pointer;
  background: linear-gradient(90deg, ${pal.p}, ${pal.a}) no-repeat left center / 0% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  /* Muted, not disabled — the resting state still has to be readable. */
  color: #8b9ab4;
  transition: background-size 0.5s cubic-bezier(0.16, 1, 0.3, 1), color 0.5s ease;
}
.${c}:hover {
  background-size: 100% 100%;
  color: transparent;
}`
    add(mk({
      name: `${pal.name} Fill Sweep Text`,
      category: 'Text',
      description: `Muted type that floods with ${pal.name.toLowerCase()} left-to-right on hover, by animating background-size behind clipped text.`,
      html, css,
      tags: ['text', 'hover', 'fill', 'sweep', 'background-clip', pal.name.toLowerCase()],
    }))
  }

  // 16. Underline draw link — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mt-underline-${pal.name}`)
    const html = `<a class="${c}" href="#">Read the changelog</a>`
    const css = `.${c} {
  font-size: 1rem;
  font-weight: 600;
  color: #e2e8f0;
  text-decoration: none;
  padding-bottom: 3px;
  background: linear-gradient(90deg, ${pal.p}, ${pal.s}) no-repeat left bottom / 0% 2px;
  transition: background-size 0.35s cubic-bezier(0.16, 1, 0.3, 1), color 0.35s ease;
}
.${c}:hover,
.${c}:focus-visible {
  color: #fff;
  background-size: 100% 2px;
}`
    add(mk({
      name: `${pal.name} Underline Draw Link`,
      category: 'Text',
      description: `Inline link whose ${pal.name.toLowerCase()} rule draws in from the left. Responds to keyboard focus as well as hover.`,
      html, css,
      tags: ['text', 'link', 'underline', 'hover', 'focus-visible', 'a11y', pal.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BACKGROUNDS  (+45)
   * ========================================================== */

  // 17. Radial-fade grid — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mg-grid-${pal.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 250px;
  height: 160px;
  border-radius: 0.8rem;
  background-color: #050914;
  background-image:
    linear-gradient(rgba(${pal.rgb}, 0.42) 1px, transparent 1px),
    linear-gradient(90deg, rgba(${pal.rgb}, 0.42) 1px, transparent 1px);
  background-size: 26px 26px;
  -webkit-mask-image: radial-gradient(ellipse 75% 75% at 50% 42%, #000 35%, transparent 82%);
  mask-image: radial-gradient(ellipse 75% 75% at 50% 42%, #000 35%, transparent 82%);
}`
    add(mk({
      name: `${pal.name} Fading Grid`,
      category: 'Backgrounds',
      description: `The hero grid pattern: a ${pal.name.toLowerCase()} rule grid dissolved at the edges by a radial mask so it never fights the content.`,
      html, css,
      tags: ['background', 'grid', 'mask', 'hero', 'fade', pal.name.toLowerCase()],
    }))
  }

  // 18. Grainy aurora — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`mg-aurora-${t.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  position: relative;
  overflow: hidden;
  width: 250px;
  height: 160px;
  border-radius: 0.8rem;
  background-color: #050914;
  background-image:
    radial-gradient(ellipse 60% 50% at 20% 25%, rgba(${rgbOf(t.a)}, 0.55), transparent 70%),
    radial-gradient(ellipse 55% 55% at 80% 30%, rgba(${rgbOf(t.b)}, 0.5), transparent 70%),
    radial-gradient(ellipse 70% 60% at 50% 95%, rgba(${rgbOf(t.c)}, 0.45), transparent 70%);
  background-size: 180% 180%, 170% 170%, 190% 190%;
  animation: ${c}-drift 16s ease-in-out infinite alternate;
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: ${NOISE};
  opacity: 0.2;
  mix-blend-mode: overlay;
}
@keyframes ${c}-drift {
  0%   { background-position: 0% 0%, 100% 0%, 50% 100%; }
  100% { background-position: 30% 20%, 70% 30%, 40% 70%; }
}`
    add(mk({
      name: `${t.name} Grainy Aurora`,
      category: 'Backgrounds',
      description: `Slow-drifting ${t.name.toLowerCase()} light pools under a grain layer — the current default for dark hero sections.`,
      html, css,
      tags: ['background', 'aurora', 'mesh', 'grain', 'noise', 'hero', t.name.toLowerCase()],
    }))
  }

  // 19. Conic beam spotlight — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mg-beam-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  position: relative;
  overflow: hidden;
  width: 250px;
  height: 160px;
  border-radius: 0.8rem;
  background: #050914;
}
/* A blurred tapering shaft pinned to the top edge, swinging about its own
   origin — a conic gradient would put the cone's apex off-canvas. */
.${c}::before {
  content: '';
  position: absolute;
  top: -24px;
  left: 50%;
  width: 120px;
  height: 240px;
  transform-origin: 50% 0;
  transform: translateX(-50%) rotate(-15deg);
  background: linear-gradient(
    180deg,
    rgba(${rgbOf(g.a)}, 0.85),
    rgba(${rgbOf(g.b)}, 0.35) 45%,
    transparent 82%
  );
  filter: blur(26px);
  animation: ${c}-sway 9s ease-in-out infinite alternate;
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: ${NOISE};
  opacity: 0.18;
  mix-blend-mode: overlay;
}
@keyframes ${c}-sway {
  from { transform: translateX(-50%) rotate(-15deg); }
  to   { transform: translateX(-50%) rotate(15deg); }
}`
    add(mk({
      name: `${g.name} Beam Spotlight`,
      category: 'Backgrounds',
      description: `A wide ${g.name.toLowerCase()} beam sweeping down from above the fold, softened with grain.`,
      html, css,
      tags: ['background', 'beam', 'spotlight', 'conic', 'hero', g.name.toLowerCase()],
    }))
  }

  // 20. Floating glow orbs — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`mg-orbs-${t.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  overflow: hidden;
  width: 250px;
  height: 160px;
  border-radius: 0.8rem;
  background: #050914;
  filter: blur(0.5px);
}
.${c} i {
  position: absolute;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  filter: blur(34px);
  opacity: 0.75;
  animation: ${c}-float 12s ease-in-out infinite alternate;
}
.${c} i:nth-child(1) { background: ${t.a}; top: -30px; left: -20px; }
.${c} i:nth-child(2) { background: ${t.b}; top: 20px; right: -30px; animation-delay: -4s; }
.${c} i:nth-child(3) { background: ${t.c}; bottom: -50px; left: 40%; animation-delay: -8s; }
@keyframes ${c}-float {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(18px, -14px) scale(1.15); }
}`
    add(mk({
      name: `${t.name} Floating Orbs`,
      category: 'Backgrounds',
      description: `Three heavily blurred ${t.name.toLowerCase()} orbs drifting behind the content — a mesh gradient you can actually animate.`,
      html, css,
      tags: ['background', 'orbs', 'blur', 'mesh', 'ambient', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  INPUTS & HOVER  (+46)
   * ========================================================== */

  // 21. Focus-ring field — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mi-focus-${pal.name}`)
    const html = `<label class="${c}"><span>Email</span><input type="email" placeholder="you@company.com"></label>`
    const css = `.${c} {
  display: block;
  width: 230px;
}
.${c} span {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
  transition: color 0.25s ease;
}
.${c} input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  font-size: 0.88rem;
  color: #e2e8f0;
  background: #0b1120;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.55rem;
  outline: none;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}
.${c} input::placeholder { color: #475569; }
.${c} input:hover { border-color: rgba(255,255,255,0.18); }
.${c} input:focus {
  background: rgba(${pal.rgb}, 0.06);
  border-color: ${pal.p};
  box-shadow: 0 0 0 3px rgba(${pal.rgb}, 0.22);
}
.${c}:focus-within span { color: ${pal.a}; }`
    add(mk({
      name: `${pal.name} Focus Ring Field`,
      category: 'Inputs & Hover',
      description: `Text field with a 3px ${pal.name.toLowerCase()} focus ring and a label that lights via :focus-within. Keeps a visible focus state instead of removing it.`,
      html, css,
      tags: ['input', 'focus', 'ring', 'focus-within', 'form', 'a11y', pal.name.toLowerCase()],
    }))
  }

  // 22. Search field with kbd hint — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mi-search-${g.name}`)
    const html = `<div class="${c}"><span class="ic"></span><input placeholder="Search docs…"><kbd>&#8984;K</kbd></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 240px;
  padding: 0.5rem 0.55rem 0.5rem 0.75rem;
  border-radius: 0.65rem;
  background: #0b1120;
  border: 1px solid rgba(255,255,255,0.1);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.${c} .ic {
  flex: none;
  width: 13px;
  height: 13px;
  border: 2px solid #64748b;
  border-radius: 50%;
  position: relative;
  transition: border-color 0.25s ease;
}
.${c} .ic::after {
  content: '';
  position: absolute;
  right: -5px;
  bottom: -4px;
  width: 6px;
  height: 2px;
  border-radius: 2px;
  background: #64748b;
  transform: rotate(45deg);
  transition: background 0.25s ease;
}
.${c} input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: none;
  font-size: 0.86rem;
  color: #e2e8f0;
}
.${c} input::placeholder { color: #475569; }
.${c} kbd {
  flex: none;
  padding: 0.12rem 0.38rem;
  font-family: inherit;
  font-size: 0.68rem;
  font-weight: 600;
  color: #94a3b8;
  border-radius: 0.3rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.4);
}
.${c}:focus-within {
  border-color: ${g.a};
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.a)}, 0.2);
}
.${c}:focus-within .ic { border-color: ${g.b}; }
.${c}:focus-within .ic::after { background: ${g.b}; }`
    add(mk({
      name: `${g.name} Command Search Field`,
      category: 'Inputs & Hover',
      description: `Search input with a CSS-drawn magnifier and a ⌘K keycap hint, lighting ${g.name.toLowerCase()} on focus.`,
      html, css,
      tags: ['input', 'search', 'kbd', 'command-palette', 'shortcut', g.name.toLowerCase()],
    }))
  }

  // 23. Dropzone — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mi-drop-${pal.name}`)
    const html = `<div class="${c}"><span class="ar"></span><strong>Drop files</strong><p>or click to browse</p></div>`
    const css = `.${c} {
  width: 210px;
  padding: 1.3rem 1rem;
  text-align: center;
  cursor: pointer;
  border-radius: 0.8rem;
  border: 2px dashed rgba(${pal.rgb}, 0.35);
  background: rgba(${pal.rgb}, 0.04);
  transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease;
}
.${c} .ar {
  display: block;
  width: 12px;
  height: 12px;
  margin: 0 auto 0.7rem;
  border: 2px solid ${pal.p};
  border-right: 0;
  border-bottom: 0;
  transform: rotate(45deg);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.${c} strong { display: block; font-size: 0.88rem; color: #e2e8f0; }
.${c} p { margin: 0.2rem 0 0; font-size: 0.75rem; color: #64748b; }
.${c}:hover {
  border-color: ${pal.p};
  background: rgba(${pal.rgb}, 0.1);
  transform: translateY(-2px);
}
.${c}:hover .ar { transform: rotate(45deg) translate(2px, 2px); }`
    add(mk({
      name: `${pal.name} Upload Dropzone`,
      category: 'Inputs & Hover',
      description: `Dashed ${pal.name.toLowerCase()} dropzone that tints and lifts on hover, with a CSS-drawn upload arrow.`,
      html, css,
      tags: ['input', 'dropzone', 'upload', 'file', 'dashed', pal.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  NAVIGATION & MENUS  (+46)
   * ========================================================== */

  // 24. Floating glass dock — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mn-dock-${g.name}`)
    const html = `<nav class="${c}"><i></i><i></i><i class="on"></i><i></i><i></i></nav>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.75rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.22),
    0 16px 40px rgba(0,0,0,0.5);
}
.${c} i {
  width: 26px;
  height: 26px;
  border-radius: 0.55rem;
  background: rgba(255,255,255,0.12);
  cursor: pointer;
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.28s ease, box-shadow 0.28s ease;
}
.${c} i.on {
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 4px 14px rgba(${rgbOf(g.a)}, 0.5);
}
.${c} i:hover {
  transform: translateY(-6px) scale(1.18);
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 8px 20px rgba(${rgbOf(g.a)}, 0.5);
}`
    add(mk({
      name: `${g.name} Floating Dock`,
      category: 'Navigation & Menus',
      description: `Frosted floating dock whose icons spring up and take on the ${g.name.toLowerCase()} gradient under the pointer.`,
      html, css,
      tags: ['nav', 'dock', 'glass', 'floating', 'backdrop-filter', g.name.toLowerCase()],
    }))
  }

  // 25. Blurred pill navbar — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mn-pillbar-${pal.name}`)
    const html = `<nav class="${c}"><a class="on">Product</a><a>Docs</a><a>Pricing</a></nav>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.3rem;
  border-radius: 999px;
  background: rgba(11,17,32,0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 30px rgba(0,0,0,0.4);
}
.${c} a {
  padding: 0.42rem 0.95rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #94a3b8;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.22s ease, background 0.22s ease;
}
.${c} a:hover { color: #e2e8f0; background: rgba(255,255,255,0.06); }
.${c} a.on {
  color: #fff;
  background: rgba(${pal.rgb}, 0.22);
  box-shadow: inset 0 0 0 1px rgba(${pal.rgb}, 0.5);
}`
    add(mk({
      name: `${pal.name} Blurred Pill Nav`,
      category: 'Navigation & Menus',
      description: `Sticky-header pill navigation on a blurred translucent bar, with a ${pal.name.toLowerCase()} active state.`,
      html, css,
      tags: ['nav', 'navbar', 'pill', 'sticky', 'backdrop-filter', pal.name.toLowerCase()],
    }))
  }

  // 26. Breadcrumb trail — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mn-crumb-${pal.name}`)
    const html = `<nav class="${c}"><a>Docs</a><a>Guides</a><a class="on">Deploying</a></nav>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
}
.${c} a {
  position: relative;
  padding: 0.2rem 0.5rem;
  color: #64748b;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: color 0.22s ease, background 0.22s ease;
}
.${c} a + a { margin-left: 1rem; }
.${c} a + a::before {
  content: '';
  position: absolute;
  left: -0.85rem;
  top: 50%;
  width: 5px;
  height: 5px;
  border: 1.5px solid #334155;
  border-left: 0;
  border-bottom: 0;
  transform: translateY(-50%) rotate(45deg);
}
.${c} a:hover { color: #e2e8f0; background: rgba(255,255,255,0.06); }
.${c} a.on { color: ${pal.a}; font-weight: 600; }`
    add(mk({
      name: `${pal.name} Breadcrumb Trail`,
      category: 'Navigation & Menus',
      description: `Docs breadcrumb with CSS-drawn chevrons and a ${pal.name.toLowerCase()} current page.`,
      html, css,
      tags: ['nav', 'breadcrumb', 'docs', 'trail', pal.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  DIVIDERS & SEPARATORS  (+29)
   * ========================================================== */

  // 27. Labelled fade rule — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`md-label-${pal.name}`)
    const html = `<div class="${c}"><span>or continue with</span></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 250px;
}
.${c}::before,
.${c}::after {
  content: '';
  flex: 1;
  height: 1px;
}
.${c}::before { background: linear-gradient(90deg, transparent, rgba(${pal.rgb}, 0.55)); }
.${c}::after  { background: linear-gradient(90deg, rgba(${pal.rgb}, 0.55), transparent); }
.${c} span {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
  white-space: nowrap;
}`
    add(mk({
      name: `${pal.name} Labelled Divider`,
      category: 'Dividers & Separators',
      description: `The "or continue with" rule: ${pal.name.toLowerCase()} lines fading out from a centered label.`,
      html, css,
      tags: ['divider', 'label', 'auth', 'fade', 'rule', pal.name.toLowerCase()],
    }))
  }

  // 28. Traveling beam rule — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`md-beam-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  position: relative;
  width: 250px;
  height: 1px;
  overflow: hidden;
  background: rgba(255,255,255,0.1);
}
.${c}::after {
  content: '';
  position: absolute;
  top: 0;
  left: -40%;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, ${g.a}, ${g.b}, transparent);
  box-shadow: 0 0 12px rgba(${rgbOf(g.a)}, 0.8);
  animation: ${c}-run 2.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes ${c}-run {
  0%        { left: -40%; }
  60%, 100% { left: 100%; }
}`
    add(mk({
      name: `${g.name} Beam Divider`,
      category: 'Dividers & Separators',
      description: `Hairline rule with a ${g.name.toLowerCase()} light packet running along it — a section break with a pulse.`,
      html, css,
      tags: ['divider', 'beam', 'animated', 'hairline', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BADGES & TAGS  (+46)
   * ========================================================== */

  // 29. Status dot badge — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mbg-status-${pal.name}`)
    const html = `<span class="${c}"><i></i>Operational</span>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.22rem 0.65rem 0.22rem 0.5rem;
  font-size: 0.74rem;
  font-weight: 600;
  border-radius: 999px;
  color: ${pal.a};
  background: color-mix(in srgb, ${pal.p} 14%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, ${pal.p} 32%, transparent);
}
.${c} i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${pal.p};
  box-shadow: 0 0 8px ${pal.p};
}`
    add(mk({
      name: `${pal.name} Status Badge`,
      category: 'Badges & Tags',
      description: `Status pill tinted with color-mix() from one ${pal.name.toLowerCase()} value — change the base color and the fill and border follow.`,
      html, css,
      tags: ['badge', 'status', 'dot', 'color-mix', 'pill', pal.name.toLowerCase()],
    }))
  }

  // 30. Removable chip — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mbg-chip-${g.name}`)
    const html = `<span class="${c}">design-systems<button aria-label="Remove">&#215;</button></span>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.28rem 0.35rem 0.28rem 0.7rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: #e2e8f0;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  transition: border-color 0.22s ease, background 0.22s ease;
}
.${c} button {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  padding: 0;
  font-size: 0.8rem;
  line-height: 1;
  color: #94a3b8;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: rgba(255,255,255,0.08);
  transition: background 0.22s ease, color 0.22s ease, transform 0.22s ease;
}
.${c}:hover {
  border-color: rgba(${rgbOf(g.a)}, 0.5);
  background: rgba(${rgbOf(g.a)}, 0.1);
}
.${c} button:hover {
  color: #fff;
  transform: rotate(90deg);
  background: linear-gradient(140deg, ${g.a}, ${g.b});
}`
    add(mk({
      name: `${g.name} Removable Chip`,
      category: 'Badges & Tags',
      description: `Filter chip with a dismiss button that spins and fills ${g.name.toLowerCase()} on hover.`,
      html, css,
      tags: ['badge', 'chip', 'tag', 'removable', 'filter', g.name.toLowerCase()],
    }))
  }

  // 31. Keycap — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mbg-kbd-${pal.name}`)
    const html = `<span class="${c}"><kbd>&#8984;</kbd><kbd>K</kbd></span>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.${c} kbd {
  display: grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  padding: 0 0.35rem;
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: 600;
  color: #cbd5e1;
  border-radius: 0.35rem;
  background: linear-gradient(180deg, #1e293b, #131b2e);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.14),
    0 2px 0 #0a0f1c,
    0 3px 6px rgba(0,0,0,0.5);
  transition: transform 0.1s ease, box-shadow 0.1s ease, color 0.2s ease;
}
.${c} kbd:hover {
  color: ${pal.a};
  transform: translateY(2px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.14),
    0 0 0 #0a0f1c,
    0 1px 3px rgba(0,0,0,0.5);
}`
    add(mk({
      name: `${pal.name} Keycap Badge`,
      category: 'Badges & Tags',
      description: `Physical-looking keyboard shortcut caps that depress on hover and read ${pal.name.toLowerCase()} when active.`,
      html, css,
      tags: ['badge', 'kbd', 'keycap', 'shortcut', 'command-palette', pal.name.toLowerCase()],
    }))
  }
}
