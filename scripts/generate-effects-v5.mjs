// scripts/generate-effects-v5.mjs
//
// Fifth wave: one new TEMPLATE FAMILY in each of the twenty-five
// original categories.
//
// Waves one and two built the classic vocabulary, wave three built the
// current product-UI vocabulary, wave four filled the seven missing
// categories. What was left was per-category depth in a specific sense:
// patterns people reach for constantly that no existing template covered
// — the "or" divider, the removable tag, the loading button, the ticket
// stub, the wizard stepper. Each of these is a distinct SHAPE, not a
// recolor of something already in the catalog.
//
// One family per category, twelve colorways each. Tokens and helpers
// come from generate-effects.mjs. Dark preview surface throughout;
// `withMotionGuard` adds the reduced-motion block at assembly time.

import { rgbOf } from './generate-effects-modern.mjs'

export function generateV5(ctx) {
  const { PALETTES, GRADPAIRS, TRIOS, cls, mk, add } = ctx

  /* ============================================================
   *  BUTTONS — async loading state  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-btn-load-${g.name}`)
    const html = `<button class="${c}"><i></i><span>Deploying…</span></button>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.65rem 1.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0b1120;
  border: none;
  border-radius: 0.55rem;
  cursor: progress;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  box-shadow: 0 6px 20px rgba(${rgbOf(g.a)}, 0.35);
  opacity: 0.9;
}
.${c} i {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(11,17,32,0.3);
  border-top-color: #0b1120;
  animation: ${c}-spin 0.7s linear infinite;
}
.${c} span {
  animation: ${c}-fade 1.4s ease-in-out infinite;
}
@keyframes ${c}-spin {
  to { transform: rotate(360deg); }
}
@keyframes ${c}-fade {
  50% { opacity: 0.55; }
}`
    add(mk({
      name: `${g.name} Loading Button`,
      category: 'Buttons',
      description: `Busy-state ${g.name.toLowerCase()} button with an inline ring spinner and a breathing label.`,
      html, css,
      tags: ['button', 'loading', 'spinner', 'async', 'pending', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  LOADERS — masked segmented ring  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-load-ring-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0 25%, ${g.a} 60%, ${g.b} 100%);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 6px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 6px));
  animation: ${c}-spin 0.95s cubic-bezier(0.6, 0.1, 0.4, 0.9) infinite;
}
@keyframes ${c}-spin {
  to { transform: rotate(360deg); }
}`
    add(mk({
      name: `${g.name} Masked Ring Loader`,
      category: 'Loaders',
      description: `Conic ${g.name.toLowerCase()} sweep punched into a ring by a radial mask — one element, no border tricks.`,
      html, css,
      tags: ['loader', 'spinner', 'conic gradient', 'mask', 'ring', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CARDS — fanned deck  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-card-deck-${g.name}`)
    const html = `<div class="${c}"><i class="b"></i><i class="m"></i><div class="top"><b>Design review</b><span>3 files · 2 comments</span></div></div>`
    const css = `.${c} {
  position: relative;
  width: 210px;
  height: 118px;
  cursor: pointer;
}
.${c} i, .${c} .top {
  position: absolute;
  inset: 0;
  border-radius: 0.75rem;
  transition: transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} i {
  background: #131c31;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.07);
}
.${c} .b { transform: translateY(10px) scale(0.9); }
.${c} .m { transform: translateY(5px) scale(0.95); }
.${c} .top {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.2rem;
  padding: 0.9rem;
  background: linear-gradient(150deg, ${g.a}, ${g.b});
  box-shadow: 0 10px 28px rgba(${rgbOf(g.a)}, 0.35);
}
.${c} b { font-size: 0.92rem; color: #0b1120; }
.${c} span { font-size: 0.74rem; color: rgba(11,17,32,0.7); }
.${c}:hover .b { transform: translateY(20px) rotate(5deg) scale(0.9); }
.${c}:hover .m { transform: translateY(12px) rotate(-3deg) scale(0.95); }
.${c}:hover .top { transform: translateY(-4px); }`
    add(mk({
      name: `${g.name} Card Deck`,
      category: 'Cards',
      description: `Stacked ${g.name.toLowerCase()} card that fans its two layers out from underneath when hovered.`,
      html, css,
      tags: ['card', 'stack', 'deck', 'fan', 'hover', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TEXT — per-letter cascade  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-text-cascade-${g.name}`)
    const word = 'HOVERLAB'
    const spans = word.split('').map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join('')
    const html = `<div class="${c}">${spans}</div>`
    const css = `.${c} {
  display: flex;
  gap: 0.05em;
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}
.${c} span {
  display: inline-block;
  background: linear-gradient(180deg, ${g.a}, ${g.b});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ${c}-drop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: calc(var(--i) * 0.06s);
  transition: transform 0.25s cubic-bezier(0.34, 1.6, 0.64, 1);
}
.${c} span:hover { transform: translateY(-6px) scale(1.15); }
@keyframes ${c}-drop {
  from { opacity: 0; transform: translateY(-18px) rotate(-8deg); }
}`
    add(mk({
      name: `${g.name} Letter Cascade`,
      category: 'Text',
      description: `Gradient-clipped headline whose letters drop in one at a time and lift individually on hover.`,
      html, css,
      tags: ['text', 'stagger', 'per letter', 'gradient text', 'cascade', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BACKGROUNDS — drifting starfield  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-bg-stars-${g.name}`)
    const html = `<div class="${c}"><b>Deep field</b></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 250px;
  height: 150px;
  overflow: hidden;
  border-radius: 0.8rem;
  background: radial-gradient(120% 90% at 50% 110%, rgba(${rgbOf(g.a)}, 0.35), transparent 60%), #05070f;
}
.${c}::before, .${c}::after {
  content: '';
  position: absolute;
  inset: -100% 0;
  background-image:
    radial-gradient(1.5px 1.5px at 20% 12%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 68% 30%, ${g.b}, transparent),
    radial-gradient(1px 1px at 42% 62%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 84% 78%, ${g.a}, transparent),
    radial-gradient(1px 1px at 12% 88%, #fff, transparent);
  background-size: 160px 160px;
  animation: ${c}-drift 14s linear infinite;
}
.${c}::after {
  opacity: 0.5;
  background-size: 90px 90px;
  animation-duration: 24s;
  animation-direction: reverse;
}
.${c} b {
  position: relative;
  font-size: 0.95rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #e2e8f0;
  text-shadow: 0 0 16px rgba(${rgbOf(g.b)}, 0.8);
}
@keyframes ${c}-drift {
  to { transform: translateY(160px); }
}`
    add(mk({
      name: `${g.name} Starfield Drift`,
      category: 'Backgrounds',
      description: `Two parallax star layers over a ${g.name.toLowerCase()} horizon glow, drifting at different speeds.`,
      html, css,
      tags: ['background', 'stars', 'parallax', 'space', 'radial gradient', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  INPUTS & HOVER — expanding search  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-input-search-${g.name}`)
    const html = `<div class="${c}"><i></i><input placeholder="Search effects…"></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  width: 46px;
  border-radius: 999px;
  background: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
  overflow: hidden;
  cursor: text;
  transition: width 0.4s cubic-bezier(0.34, 1.2, 0.64, 1), box-shadow 0.3s ease;
}
.${c} i {
  position: relative;
  flex: none;
  width: 13px;
  height: 13px;
  margin-left: 0.15rem;
  border-radius: 50%;
  border: 2px solid ${g.a};
  transition: border-color 0.3s ease;
}
.${c} i::after {
  content: '';
  position: absolute;
  right: -5px;
  bottom: -4px;
  width: 7px;
  height: 2px;
  border-radius: 2px;
  background: ${g.a};
  transform: rotate(45deg);
}
.${c} input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: none;
  font-size: 0.85rem;
  font-family: inherit;
  color: #e2e8f0;
  opacity: 0;
  transition: opacity 0.25s ease 0.12s;
}
.${c} input::placeholder { color: #64748b; }
.${c}:hover, .${c}:focus-within {
  width: 230px;
  box-shadow: inset 0 0 0 1px ${g.a}, 0 0 0 4px rgba(${rgbOf(g.a)}, 0.15);
}
.${c}:hover input, .${c}:focus-within input { opacity: 1; }
.${c}:focus-within i { border-color: ${g.b}; }`
    add(mk({
      name: `${g.name} Expanding Search`,
      category: 'Inputs & Hover',
      description: `Icon-only field that widens into a full ${g.name.toLowerCase()} search box on hover or focus.`,
      html, css,
      tags: ['search', 'input', 'expand', 'focus-within', 'icon', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  NAVIGATION & MENUS — bottom tab bar  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-nav-tabbar-${g.name}`)
    const html = `<nav class="${c}"><a class="on"><i></i>Home</a><a><i></i>Search</a><a><i></i>Saved</a><a><i></i>You</a></nav>`
    const css = `.${c} {
  display: flex;
  gap: 0.2rem;
  padding: 0.4rem;
  border-radius: 1rem;
  background: rgba(15,23,42,0.85);
  backdrop-filter: blur(10px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 30px rgba(0,0,0,0.45);
}
.${c} a {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.45rem 0.7rem;
  font-size: 0.66rem;
  color: #64748b;
  border-radius: 0.7rem;
  cursor: pointer;
  transition: color 0.22s ease, background 0.22s ease;
}
.${c} i {
  width: 16px;
  height: 16px;
  border-radius: 0.35rem;
  background: currentColor;
  opacity: 0.55;
  transition: transform 0.28s cubic-bezier(0.34, 1.6, 0.64, 1), opacity 0.22s ease;
}
.${c} a:hover { color: #cbd5e1; background: rgba(255,255,255,0.05); }
.${c} a:hover i { transform: translateY(-2px); opacity: 0.9; }
.${c} a.on {
  color: ${g.a};
  background: rgba(${rgbOf(g.a)}, 0.14);
}
.${c} a.on i {
  opacity: 1;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  transform: translateY(-2px) scale(1.08);
}`
    add(mk({
      name: `${g.name} Bottom Tab Bar`,
      category: 'Navigation & Menus',
      description: `Frosted mobile tab bar where the active item takes a ${g.name.toLowerCase()} tint and lifts its icon.`,
      html, css,
      tags: ['navigation', 'tab bar', 'mobile', 'bottom nav', 'backdrop blur', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  DIVIDERS & SEPARATORS — label in the middle  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-div-label-${g.name}`)
    const html = `<div class="${c}"><span>or continue with</span></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 260px;
}
.${c}::before, .${c}::after {
  content: '';
  flex: 1;
  height: 1px;
}
.${c}::before { background: linear-gradient(90deg, transparent, ${g.a}); }
.${c}::after  { background: linear-gradient(90deg, ${g.b}, transparent); }
.${c} span {
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  color: #94a3b8;
  white-space: nowrap;
}`
    add(mk({
      name: `${g.name} Labelled Divider`,
      category: 'Dividers & Separators',
      description: `Flexbox "or" divider whose rules fade out from a ${g.name.toLowerCase()} center — no fixed widths.`,
      html, css,
      tags: ['divider', 'separator', 'or divider', 'label', 'flexbox', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BADGES & TAGS — removable chip  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-tag-remove-${g.name}`)
    const html = `<div class="${c}"><span>design<i></i></span><span>css<i></i></span><span>hover<i></i></span></div>`
    const css = `.${c} {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.${c} span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.28rem 0.4rem 0.28rem 0.65rem;
  font-size: 0.76rem;
  color: ${g.a};
  border-radius: 999px;
  background: rgba(${rgbOf(g.a)}, 0.12);
  box-shadow: inset 0 0 0 1px rgba(${rgbOf(g.a)}, 0.35);
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
.${c} i {
  position: relative;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(${rgbOf(g.a)}, 0.2);
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}
.${c} i::before, .${c} i::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7px;
  height: 1.5px;
  border-radius: 1px;
  background: currentColor;
}
.${c} i::before { transform: translate(-50%, -50%) rotate(45deg); }
.${c} i::after  { transform: translate(-50%, -50%) rotate(-45deg); }
.${c} span:hover {
  color: #0b1120;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  box-shadow: inset 0 0 0 1px transparent;
}
.${c} i:hover { background: rgba(11,17,32,0.25); transform: rotate(90deg); }`
    add(mk({
      name: `${g.name} Removable Tags`,
      category: 'Badges & Tags',
      description: `Filter chips with a built-in × that spins on hover, filling ${g.name.toLowerCase()} when the chip is active.`,
      html, css,
      tags: ['tag', 'chip', 'removable', 'filter', 'close', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOGGLES & SWITCHES — three-way segmented control  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-tog-seg3-${g.name}`)
    const html = `<div class="${c}"><input type="radio" name="${c}" id="${c}-a" checked><label for="${c}-a">Light</label><input type="radio" name="${c}" id="${c}-b"><label for="${c}-b">Auto</label><input type="radio" name="${c}" id="${c}-c"><label for="${c}-c">Dark</label><i class="pill"></i></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  padding: 0.25rem;
  border-radius: 999px;
  background: #0b1120;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
}
.${c} input { display: none; }
.${c} label {
  position: relative;
  z-index: 1;
  width: 66px;
  padding: 0.4rem 0;
  text-align: center;
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: color 0.25s ease;
}
.${c} .pill {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: 66px;
  height: calc(100% - 0.5rem);
  border-radius: 999px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  box-shadow: 0 4px 14px rgba(${rgbOf(g.a)}, 0.4);
  transition: transform 0.32s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} label:hover { color: #cbd5e1; }
.${c} input:checked + label { color: #0b1120; }
.${c} input:nth-of-type(2):checked ~ .pill { transform: translateX(66px); }
.${c} input:nth-of-type(3):checked ~ .pill { transform: translateX(132px); }`
    add(mk({
      name: `${g.name} Three-Way Segment`,
      category: 'Toggles & Switches',
      description: `Light / Auto / Dark segmented control with a ${g.name.toLowerCase()} pill that springs between radios.`,
      html, css,
      tags: ['segmented control', 'radio', 'theme toggle', 'sliding pill', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOOLTIPS & POPOVERS — rich popover on focus  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-pop-rich-${g.name}`)
    const html = `<div class="${c}"><button>@ada</button><div class="pop"><b>Ada Lovelace</b><span>Analytical engine, 1843</span><em>First programmer</em></div></div>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding-bottom: 0.4rem;
}
.${c} button {
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${g.a};
  background: rgba(${rgbOf(g.a)}, 0.12);
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
}
.${c} .pop {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  width: 190px;
  padding: 0.7rem 0.8rem;
  border-radius: 0.6rem;
  background: #131c31;
  box-shadow: 0 14px 34px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(${rgbOf(g.a)}, 0.3);
  opacity: 0;
  visibility: hidden;
  transform: translate(-50%, 6px) scale(0.96);
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1), visibility 0.22s;
}
.${c} .pop::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -5px;
  width: 10px;
  height: 10px;
  background: #131c31;
  transform: translateX(-50%) rotate(45deg);
  box-shadow: 1px 1px 0 rgba(${rgbOf(g.a)}, 0.3);
}
.${c} b { display: block; font-size: 0.85rem; color: #f8fafc; }
.${c} span { display: block; margin-top: 0.15rem; font-size: 0.72rem; color: #94a3b8; }
.${c} em {
  display: inline-block;
  margin-top: 0.45rem;
  padding: 0.12rem 0.45rem;
  font-size: 0.65rem;
  font-style: normal;
  color: #0b1120;
  border-radius: 999px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}
.${c}:hover .pop, .${c}:focus-within .pop {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, 0) scale(1);
}`
    add(mk({
      name: `${g.name} Profile Popover`,
      category: 'Tooltips & Popovers',
      description: `Mention chip that opens a ${g.name.toLowerCase()}-edged profile card on hover or keyboard focus.`,
      html, css,
      tags: ['popover', 'hovercard', 'profile', 'focus-within', 'mention', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SKELETONS & SHIMMERS — list row skeleton  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-skel-rows-${g.name}`)
    const row = `<div class="row"><i class="av"></i><div><b></b><s></s></div><u></u></div>`
    const html = `<div class="${c}">${row}${row}${row}</div>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  width: 250px;
  padding: 0.7rem;
  border-radius: 0.7rem;
  background: #0f172a;
}
.${c} .row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.${c} .row > div { flex: 1; }
.${c} i, .${c} b, .${c} s, .${c} u {
  display: block;
  border-radius: 0.35rem;
  background: linear-gradient(90deg, #1e293b 25%, rgba(${rgbOf(g.a)}, 0.28) 50%, #1e293b 75%);
  background-size: 300% 100%;
  animation: ${c}-shim 1.5s ease-in-out infinite;
}
.${c} .av { width: 30px; height: 30px; flex: none; border-radius: 50%; }
.${c} b { width: 70%; height: 8px; margin-bottom: 0.35rem; }
.${c} s { width: 45%; height: 7px; }
.${c} u { width: 34px; height: 16px; flex: none; border-radius: 999px; }
.${c} .row:nth-child(2) i, .${c} .row:nth-child(2) b, .${c} .row:nth-child(2) s, .${c} .row:nth-child(2) u { animation-delay: 0.12s; }
.${c} .row:nth-child(3) i, .${c} .row:nth-child(3) b, .${c} .row:nth-child(3) s, .${c} .row:nth-child(3) u { animation-delay: 0.24s; }
@keyframes ${c}-shim {
  from { background-position: 150% 0; }
  to   { background-position: -150% 0; }
}`
    add(mk({
      name: `${g.name} List Row Skeleton`,
      category: 'Skeletons & Shimmers',
      description: `Three placeholder rows — avatar, two text lines, trailing pill — sweeping ${g.name.toLowerCase()} in sequence.`,
      html, css,
      tags: ['skeleton', 'shimmer', 'list', 'placeholder', 'loading', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ENTRANCE ANIMATIONS — staggered cascade  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-ent-stagger-${g.name}`)
    const items = ['Connect a repo', 'Pick a framework', 'Set env vars', 'Deploy']
      .map((t, i) => `<li style="--i:${i}"><i></i>${t}</li>`).join('')
    const html = `<ul class="${c}">${items}</ul>`
    const css = `.${c} {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.${c} li {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.7rem;
  font-size: 0.83rem;
  color: #e2e8f0;
  border-radius: 0.5rem;
  background: #131c31;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
  animation: ${c}-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i) * 0.09s);
}
.${c} i {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.a)}, 0.15);
}
@keyframes ${c}-in {
  from { opacity: 0; transform: translateX(-14px) scale(0.97); filter: blur(3px); }
}`
    add(mk({
      name: `${g.name} Staggered Checklist`,
      category: 'Entrance Animations',
      description: `Checklist rows sliding in from the left on a per-item delay, each with a ${g.name.toLowerCase()} dot.`,
      html, css,
      tags: ['entrance', 'stagger', 'cascade', 'list', 'blur in', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BORDERS & OUTLINES — corner brackets  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-bd-corner-${g.name}`)
    const html = `<div class="${c}"><span>Scanning target</span></div>`
    const css = `.${c} {
  position: relative;
  padding: 1.1rem 1.5rem;
  font-size: 0.86rem;
  font-weight: 600;
  color: #e2e8f0;
  background: #0f172a;
  cursor: pointer;
}
.${c}::before, .${c}::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  transition: width 0.35s ease, height 0.35s ease, border-color 0.35s ease;
}
.${c}::before {
  top: 0;
  left: 0;
  border-top: 2px solid ${g.a};
  border-left: 2px solid ${g.a};
}
.${c}::after {
  right: 0;
  bottom: 0;
  border-bottom: 2px solid ${g.b};
  border-right: 2px solid ${g.b};
}
.${c}:hover::before, .${c}:hover::after {
  width: calc(100% - 2px);
  height: calc(100% - 2px);
}`
    add(mk({
      name: `${g.name} Corner Brackets`,
      category: 'Borders & Outlines',
      description: `Two ${g.name.toLowerCase()} corner brackets that grow into a complete frame when hovered.`,
      html, css,
      tags: ['border', 'corner', 'bracket', 'frame', 'hover', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PROGRESS & METERS — stacked quota bar  (12)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v5-prog-quota-${t.name}`)
    const html = `<div class="${c}"><div class="bar"><i class="a"></i><i class="b"></i><i class="c"></i></div><div class="key"><span><em></em>Builds</span><span><em></em>Bandwidth</span><span><em></em>Storage</span></div><small>68% of 100 GB used</small></div>`
    const css = `.${c} {
  width: 250px;
}
.${c} .bar {
  display: flex;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: #1e293b;
}
.${c} .bar i {
  height: 100%;
  transform-origin: left;
  animation: ${c}-grow 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.${c} .a { width: 34%; background: ${t.a}; }
.${c} .b { width: 22%; background: ${t.b}; animation-delay: 0.12s; }
.${c} .c { width: 12%; background: ${t.c}; animation-delay: 0.24s; }
.${c} .key {
  display: flex;
  gap: 0.8rem;
  margin: 0.55rem 0 0.3rem;
}
.${c} .key span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  color: #94a3b8;
}
.${c} em { width: 7px; height: 7px; border-radius: 2px; }
.${c} .key span:nth-child(1) em { background: ${t.a}; }
.${c} .key span:nth-child(2) em { background: ${t.b}; }
.${c} .key span:nth-child(3) em { background: ${t.c}; }
.${c} small { font-size: 0.72rem; color: #64748b; }
@keyframes ${c}-grow {
  from { transform: scaleX(0); }
}`
    add(mk({
      name: `${t.name} Quota Bar`,
      category: 'Progress & Meters',
      description: `Multi-segment usage meter in ${t.name.toLowerCase()} with a legend, each band growing in turn.`,
      html, css,
      tags: ['progress', 'usage', 'quota', 'stacked bar', 'legend', t.name.toLowerCase()],
    }))
  }
  for (const g of GRADPAIRS.slice(0, 4)) {
    const c = cls(`v5-prog-ring-${g.name}`)
    const html = `<div class="${c}"><b>72<i>%</i></b></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: conic-gradient(${g.a} 0turn, ${g.b} 0.72turn, #1e293b 0.72turn 1turn);
  animation: ${c}-fill 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 9px;
  border-radius: 50%;
  background: #0f172a;
}
.${c} b {
  position: relative;
  z-index: 1;
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
}
.${c} i { font-size: 0.7rem; font-style: normal; color: ${g.b}; }
@keyframes ${c}-fill {
  from { background: conic-gradient(${g.a} 0turn, ${g.b} 0turn, #1e293b 0turn 1turn); }
}`
    add(mk({
      name: `${g.name} Conic Progress Ring`,
      category: 'Progress & Meters',
      description: `Conic ${g.name.toLowerCase()} ring with a punched-out center and a numeric readout.`,
      html, css,
      tags: ['progress', 'ring', 'conic gradient', 'percentage', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  AVATARS & IMAGES — presence ring  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-av-presence-${g.name}`)
    const html = `<div class="${c}"><span class="ring"><b>AL</b></span><i class="dot"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 60px;
  height: 60px;
  cursor: pointer;
}
.${c} .ring {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  padding: 3px;
  background: conic-gradient(from 180deg, ${g.a}, ${g.b}, ${g.a});
  animation: ${c}-spin 6s linear infinite;
}
.${c} b {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  font-size: 0.95rem;
  font-weight: 700;
  color: #e2e8f0;
  background: #131c31;
  animation: ${c}-spin 6s linear infinite reverse;
}
.${c} .dot {
  position: absolute;
  right: 1px;
  bottom: 1px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 3px #0f172a;
}
.${c} .dot::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #22c55e;
  animation: ${c}-ping 2s ease-out infinite;
}
@keyframes ${c}-spin {
  to { transform: rotate(360deg); }
}
@keyframes ${c}-ping {
  to { transform: scale(2.2); opacity: 0; }
}`
    add(mk({
      name: `${g.name} Presence Avatar`,
      category: 'Avatars & Images',
      description: `Initials avatar inside a rotating ${g.name.toLowerCase()} conic ring, with a pinging online dot.`,
      html, css,
      tags: ['avatar', 'presence', 'online', 'conic ring', 'initials', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MODALS & OVERLAYS — destructive confirm  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-modal-confirm-${g.name}`)
    const html = `<div class="${c}"><div class="box"><i></i><b>Delete this project?</b><p>This removes all deployments and cannot be undone.</p><div class="row"><button class="ghost">Cancel</button><button class="danger">Delete</button></div></div></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 260px;
  padding: 0.9rem;
  border-radius: 0.9rem;
  background: rgba(2,6,23,0.6);
  backdrop-filter: blur(4px);
}
.${c} .box {
  width: 100%;
  padding: 1rem;
  text-align: center;
  border-radius: 0.75rem;
  background: #0f172a;
  box-shadow: 0 24px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.08);
  animation: ${c}-in 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) both;
}
.${c} i {
  display: block;
  width: 34px;
  height: 34px;
  margin: 0 auto 0.6rem;
  border-radius: 50%;
  background: rgba(239,68,68,0.15);
  box-shadow: inset 0 0 0 1px rgba(239,68,68,0.5);
  position: relative;
}
.${c} i::before {
  content: '!';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 1rem;
  font-weight: 800;
  color: #f87171;
}
.${c} b { font-size: 0.92rem; color: #f8fafc; }
.${c} p { margin: 0.35rem 0 0.85rem; font-size: 0.75rem; line-height: 1.45; color: #94a3b8; }
.${c} .row { display: flex; gap: 0.5rem; }
.${c} button {
  flex: 1;
  padding: 0.45rem 0;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: inherit;
  border: none;
  border-radius: 0.45rem;
  cursor: pointer;
  transition: transform 0.18s ease, filter 0.18s ease;
}
.${c} .ghost {
  color: #cbd5e1;
  background: rgba(255,255,255,0.06);
}
.${c} .danger {
  color: #0b1120;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  box-shadow: 0 4px 14px rgba(${rgbOf(g.a)}, 0.35);
}
.${c} button:hover { transform: translateY(-1px); filter: brightness(1.1); }
@keyframes ${c}-in {
  from { opacity: 0; transform: translateY(10px) scale(0.95); }
}`
    add(mk({
      name: `${g.name} Confirm Dialog`,
      category: 'Modals & Overlays',
      description: `Destructive confirmation over a blurred scrim, with a ${g.name.toLowerCase()} primary action.`,
      html, css,
      tags: ['modal', 'dialog', 'confirm', 'destructive', 'backdrop blur', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ALERTS & TOASTS — banner with dismiss  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-alert-banner-${g.name}`)
    const html = `<div class="${c}"><i></i><div><b>New region available</b><span>Deploy to syd1 with a single click.</span></div><u></u></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  width: 260px;
  padding: 0.75rem 0.9rem;
  border-radius: 0.65rem;
  background: rgba(${rgbOf(g.a)}, 0.1);
  box-shadow: inset 0 0 0 1px rgba(${rgbOf(g.a)}, 0.3);
  overflow: hidden;
}
.${c}::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, ${g.a}, ${g.b});
}
.${c} i {
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  border-radius: 50%;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  position: relative;
}
.${c} i::after {
  content: 'i';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 800;
  font-style: normal;
  color: #0b1120;
}
.${c} b { display: block; font-size: 0.82rem; color: #f8fafc; }
.${c} span { display: block; margin-top: 0.15rem; font-size: 0.73rem; color: #94a3b8; }
.${c} u {
  position: relative;
  flex: none;
  width: 16px;
  height: 16px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.${c} u::before, .${c} u::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 11px;
  height: 1.5px;
  border-radius: 1px;
  background: #e2e8f0;
}
.${c} u::before { transform: translate(-50%, -50%) rotate(45deg); }
.${c} u::after  { transform: translate(-50%, -50%) rotate(-45deg); }
.${c} u:hover { opacity: 1; transform: rotate(90deg); }`
    add(mk({
      name: `${g.name} Dismissible Banner`,
      category: 'Alerts & Toasts',
      description: `Inline announcement with a ${g.name.toLowerCase()} accent rail, info glyph and a rotating close button.`,
      html, css,
      tags: ['alert', 'banner', 'dismiss', 'notice', 'inline', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ACCORDIONS & TABS — vertical tabs  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-tab-vert-${g.name}`)
    const html = `<div class="${c}"><a class="on">Overview</a><a>Activity</a><a>Members</a><a>Billing</a><i class="ind"></i></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  width: 170px;
  padding-left: 2px;
}
.${c}::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255,255,255,0.08);
}
.${c} a {
  padding: 0.5rem 0.8rem;
  font-size: 0.84rem;
  color: #64748b;
  border-radius: 0 0.4rem 0.4rem 0;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease, padding-left 0.25s ease;
}
.${c} a:hover { color: #cbd5e1; background: rgba(255,255,255,0.04); padding-left: 1rem; }
.${c} a.on { color: ${g.a}; background: rgba(${rgbOf(g.a)}, 0.1); }
.${c} .ind {
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  height: 34px;
  border-radius: 2px;
  background: linear-gradient(180deg, ${g.a}, ${g.b});
  box-shadow: 0 0 10px rgba(${rgbOf(g.a)}, 0.7);
  animation: ${c}-travel 6s ease-in-out infinite;
}
@keyframes ${c}-travel {
  0%, 20%   { transform: translateY(0); }
  30%, 45%  { transform: translateY(34px); }
  55%, 70%  { transform: translateY(68px); }
  80%, 100% { transform: translateY(0); }
}`
    add(mk({
      name: `${g.name} Vertical Tabs`,
      category: 'Accordions & Tabs',
      description: `Side tab rail with a glowing ${g.name.toLowerCase()} indicator that travels between sections.`,
      html, css,
      tags: ['tabs', 'vertical', 'indicator', 'settings nav', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  3D & PERSPECTIVE — isometric stack  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-3d-iso-${g.name}`)
    const html = `<div class="${c}"><i class="l3"></i><i class="l2"></i><i class="l1"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 150px;
  height: 130px;
  perspective: 800px;
  cursor: pointer;
}
.${c} i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 110px;
  height: 110px;
  margin: -55px 0 0 -55px;
  border-radius: 0.7rem;
  transform-style: preserve-3d;
  transition: transform 0.5s cubic-bezier(0.34, 1.3, 0.64, 1), box-shadow 0.5s ease;
}
.${c} .l1 {
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 12px 30px rgba(${rgbOf(g.a)}, 0.4);
  transform: rotateX(52deg) rotateZ(45deg) translateZ(26px);
}
.${c} .l2 {
  background: linear-gradient(140deg, ${g.b}, ${g.a});
  opacity: 0.6;
  transform: rotateX(52deg) rotateZ(45deg) translateZ(12px);
}
.${c} .l3 {
  background: #1e293b;
  transform: rotateX(52deg) rotateZ(45deg) translateZ(0);
}
.${c}:hover .l1 { transform: rotateX(52deg) rotateZ(45deg) translateZ(48px); }
.${c}:hover .l2 { transform: rotateX(52deg) rotateZ(45deg) translateZ(24px); }`
    add(mk({
      // Collided with the m3-iso-* family in generate-effects-modern2.mjs
      // for the six token names GRADPAIRS and TRIOS share (Sunset, Ocean,
      // Forest, Berry, Fire, Mint). The two are different effects: that one
      // drifts continuously, this one pulls apart on hover — an exploded
      // view. Retired ids are aliased in src/lib/effect-aliases.ts.
      name: `${g.name} Exploded Stack`,
      category: '3D & Perspective',
      description: `Three ${g.name.toLowerCase()} planes laid out isometrically that pull apart in Z on hover.`,
      html, css,
      tags: ['3d', 'isometric', 'exploded', 'layers', 'perspective', 'stack', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  GLOW & NEON — aurora bloom behind a card  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-glow-bloom-${g.name}`)
    const html = `<div class="${c}"><div class="card"><b>Pro</b><span>$20 / month</span></div></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 200px;
  height: 130px;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 14px;
  border-radius: 1.4rem;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  filter: blur(22px);
  opacity: 0.55;
  animation: ${c}-breathe 5s ease-in-out infinite;
}
.${c} .card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 1.1rem 1.6rem;
  border-radius: 0.9rem;
  background: rgba(11,17,32,0.9);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.18);
  transition: transform 0.3s ease;
}
.${c} b { font-size: 1rem; color: #f8fafc; }
.${c} span { font-size: 0.78rem; color: ${g.b}; }
.${c}:hover .card { transform: translateY(-3px); }
@keyframes ${c}-breathe {
  50% { opacity: 0.85; filter: blur(30px); }
}`
    add(mk({
      name: `${g.name} Aurora Bloom Card`,
      category: 'Glow & Neon',
      description: `Blurred ${g.name.toLowerCase()} gradient breathing behind a dark card — glow without a single box-shadow.`,
      html, css,
      tags: ['glow', 'bloom', 'blur', 'aurora', 'pricing', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PATTERNS & TEXTURES — plus-sign grid  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-pat-plus-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 140px;
  border-radius: 0.7rem;
  background-color: #0b1120;
  background-image:
    linear-gradient(${g.a} 1.5px, transparent 1.5px),
    linear-gradient(90deg, ${g.b} 1.5px, transparent 1.5px);
  background-size: 26px 26px;
  background-position: 12px 12px;
  -webkit-mask: radial-gradient(70% 70% at 50% 50%, #000, transparent);
  mask: radial-gradient(70% 70% at 50% 50%, #000, transparent);
  animation: ${c}-pan 9s linear infinite;
}
@keyframes ${c}-pan {
  to { background-position: 38px 38px; }
}`
    add(mk({
      name: `${g.name} Plus Grid`,
      category: 'Patterns & Textures',
      description: `Crossing ${g.name.toLowerCase()} rules forming a plus lattice, masked to fade at the edges and slowly panning.`,
      html, css,
      tags: ['pattern', 'grid', 'plus', 'mask fade', 'background', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MASKS & CLIP PATHS — ticket stub  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-mask-ticket-${g.name}`)
    const html = `<div class="${c}"><div class="l"><b>HOVERLAB</b><span>Row C · Seat 14</span></div><div class="r"><b>A7</b></div></div>`
    const css = `.${c} {
  display: flex;
  width: 240px;
  height: 96px;
  border-radius: 0.7rem;
  background: linear-gradient(120deg, ${g.a}, ${g.b});
  -webkit-mask:
    radial-gradient(circle 9px at 168px 0, transparent 98%, #000) top / 100% 51% no-repeat,
    radial-gradient(circle 9px at 168px 100%, transparent 98%, #000) bottom / 100% 51% no-repeat;
  mask:
    radial-gradient(circle 9px at 168px 0, transparent 98%, #000) top / 100% 51% no-repeat,
    radial-gradient(circle 9px at 168px 100%, transparent 98%, #000) bottom / 100% 51% no-repeat;
  transition: filter 0.3s ease, transform 0.3s ease;
}
.${c} .l {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.2rem;
  padding: 0 0.9rem;
  border-right: 2px dashed rgba(11,17,32,0.35);
}
.${c} .r {
  width: 72px;
  display: grid;
  place-items: center;
}
.${c} b { font-size: 0.92rem; font-weight: 800; letter-spacing: 0.06em; color: #0b1120; }
.${c} span { font-size: 0.72rem; color: rgba(11,17,32,0.7); }
.${c} .r b { font-size: 1.3rem; }
.${c}:hover { transform: translateY(-3px); filter: brightness(1.08); }`
    add(mk({
      name: `${g.name} Ticket Stub`,
      category: 'Masks & Clip Paths',
      description: `Two radial masks bite notches out of a ${g.name.toLowerCase()} ticket, with a dashed tear line between halves.`,
      html, css,
      tags: ['mask', 'ticket', 'notch', 'coupon', 'radial mask', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CHARTS & DATA — sparkline KPI card  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-chart-spark-${g.name}`)
    const html = `<div class="${c}"><div class="head"><span>Weekly active</span><b>12,480</b><em>+8.2%</em></div><div class="spark"></div></div>`
    const css = `.${c} {
  width: 220px;
  padding: 0.85rem;
  border-radius: 0.75rem;
  background: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.07);
  overflow: hidden;
}
.${c} .head span { display: block; font-size: 0.7rem; color: #64748b; }
.${c} .head b {
  display: inline-block;
  margin: 0.15rem 0.4rem 0 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #f8fafc;
  font-variant-numeric: tabular-nums;
}
.${c} em {
  font-size: 0.7rem;
  font-style: normal;
  font-weight: 600;
  color: ${g.a};
}
.${c} .spark {
  height: 46px;
  margin-top: 0.5rem;
  border-radius: 0.35rem;
  background: linear-gradient(180deg, ${g.a} 0%, rgba(${rgbOf(g.b)}, 0.15) 100%);
  clip-path: polygon(0 72%, 12% 58%, 24% 66%, 36% 40%, 48% 50%, 60% 26%, 72% 34%, 84% 14%, 100% 22%, 100% 100%, 0 100%);
  animation: ${c}-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes ${c}-rise {
  from { transform: scaleY(0.2); transform-origin: bottom; opacity: 0; }
}`
    add(mk({
      name: `${g.name} Sparkline KPI`,
      category: 'Charts & Data',
      description: `Metric tile with a clip-path area sparkline fading from ${g.name.toLowerCase()} into the card.`,
      html, css,
      tags: ['chart', 'sparkline', 'kpi', 'clip-path', 'metric', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TIMELINES & STEPS — wizard stepper  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v5-step-wizard-${g.name}`)
    const html = `<div class="${c}"><div class="s done"><i></i><span>Cart</span></div><div class="s done"><i></i><span>Address</span></div><div class="s now"><i></i><span>Payment</span></div><div class="s"><i></i><span>Done</span></div></div>`
    const css = `.${c} {
  display: flex;
  width: 260px;
}
.${c} .s {
  position: relative;
  flex: 1;
  text-align: center;
}
.${c} .s::before {
  content: '';
  position: absolute;
  left: -50%;
  top: 10px;
  width: 100%;
  height: 2px;
  background: #1e293b;
}
.${c} .s:first-child::before { display: none; }
.${c} .done::before, .${c} .now::before {
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}
.${c} i {
  position: relative;
  z-index: 1;
  display: block;
  width: 22px;
  height: 22px;
  margin: 0 auto 0.4rem;
  border-radius: 50%;
  background: #0f172a;
  box-shadow: inset 0 0 0 2px #1e293b;
  transition: box-shadow 0.3s ease;
}
.${c} .done i {
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: none;
}
.${c} .done i::after {
  content: '';
  position: absolute;
  left: 8px;
  top: 4px;
  width: 5px;
  height: 10px;
  border: solid #0b1120;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.${c} .now i {
  box-shadow: inset 0 0 0 2px ${g.a};
  animation: ${c}-pulse 1.8s ease-in-out infinite;
}
.${c} .now i::after {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  background: ${g.a};
}
.${c} span { font-size: 0.7rem; color: #64748b; }
.${c} .done span, .${c} .now span { color: #cbd5e1; }
@keyframes ${c}-pulse {
  50% { box-shadow: inset 0 0 0 2px ${g.a}, 0 0 0 5px rgba(${rgbOf(g.a)}, 0.18); }
}`
    add(mk({
      // Named "Checkout Stepper" until it collided with the identically
      // named tl-step-* family in generate-effects-extra2.mjs — twelve
      // duplicate display names, one per gradient pair. This one is the
      // wizard variant (the section header above always said so), so it
      // takes the name it should have had. Retired ids are aliased in
      // src/lib/effect-aliases.ts so the old URLs still resolve.
      name: `${g.name} Wizard Stepper`,
      category: 'Timelines & Steps',
      description: `Four-step wizard with completed ticks, a pulsing current step and ${g.name.toLowerCase()} connector rails.`,
      html, css,
      tags: ['stepper', 'wizard', 'checkout', 'steps', 'progress', g.name.toLowerCase()],
    }))
  }
}
