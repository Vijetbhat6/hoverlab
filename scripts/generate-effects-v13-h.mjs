// scripts/generate-effects-v13-h.mjs
//
// Thirteenth wave, part H: the six categories scripts/check-catalog-focus.mts
// had sealed — Dividers & Separators, Badges & Tags, Skeletons & Shimmers,
// Borders & Outlines, Progress & Meters, Scroll & Sticky. Four designs each,
// 24 in total, which takes the wave from 26 categories to all 32.
//
// WHY THIS EXISTS DESPITE THE SEAL
//
// The seal says those categories are shape-exhausted and the wave should go
// to blocks instead. That was a judgement call, and the owner overruled it:
// the catalog is to grow evenly across every category. check-catalog-focus
// has an escape hatch for exactly this (`--update` rewrites the baseline as
// a deliberate act that shows in a diff), and the baseline was re-accepted
// when this part landed. The SEALED reasons in that script are left in place
// unedited — they are still a fair description of how hard the search is
// here, and the next person should read them before adding a fifth kind of
// horizontal rule.
//
// So these 24 were picked against the exhausted lists rather than invented
// freely, and each one is a mechanic the category does not already own:
//
//   Dividers  — ruler ticks, barcode, cut-here line, folded crease
//   Badges    — wax seal, enamel pin, award rosette, streak flame
//   Skeletons — checkout summary, sidebar nav, radial bloom shimmer,
//               pricing cards
//   Borders   — sawtooth frame, taped corners, timer border, ornate corners
//   Progress  — milestone flags, buffered media bar, zoned scale, week streak
//   Scroll    — rail scrollbar, sticky aside, sticky new-message divider,
//               sticky media panel
//
// Same assembly constraints as the rest of the wave: roots visible at rest,
// no position:absolute on a root, infinite keyframes resting sensibly at
// their 100% stop, everything fitting a ~300x180 dark preview.

export function generateV13H(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Dividers & Separators                                               */
  /* ------------------------------------------------------------------ */

  /* DV1. Ruler ticks — a rule graduated like a measuring scale */
  {
    const c = cls('v13-dv-ruler')
    const html = `<div class="${c}"><i></i><b></b></div>`
    const css = `.${c} {
  position: relative;
  width: 250px;
  height: 22px;
}
.${c} i {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: #475569;
}
.${c} b {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 11px;
  background-image:
    linear-gradient(90deg, #64748b 1px, transparent 1px),
    linear-gradient(90deg, #94a3b8 1px, transparent 1px);
  background-size: 10px 5px, 50px 11px;
  background-repeat: repeat-x;
  background-position: 0 0, 0 0;
}`
    add(mk({
      name: 'Ruler Tick Divider',
      category: 'Dividers & Separators',
      description: 'Hairline rule graduated with minor ticks every ten pixels and a taller major tick every fifty, like the edge of a ruler.',
      html, css,
      tags: ['ruler', 'ticks', 'scale', 'graduated', 'measure'],
    }))
  }

  /* DV2. Barcode — bars of varying width standing in for a rule */
  {
    const c = cls('v13-dv-barcode')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 250px;
  height: 26px;
  background-color: transparent;
  background-image:
    linear-gradient(90deg, #e2e8f0 3px, transparent 3px),
    linear-gradient(90deg, #e2e8f0 1px, transparent 1px),
    linear-gradient(90deg, #e2e8f0 2px, transparent 2px),
    linear-gradient(90deg, #e2e8f0 1px, transparent 1px);
  background-size: 17px 100%, 11px 100%, 23px 100%, 7px 100%;
  background-position: 0 0, 4px 0, 9px 0, 13px 0;
  background-repeat: repeat-x;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
  opacity: 0.75;
}`
    add(mk({
      name: 'Barcode Divider',
      category: 'Dividers & Separators',
      description: 'Section rule drawn as a barcode of four bar widths on incommensurate spacings, faded out at both ends by a mask.',
      html, css,
      tags: ['barcode', 'bars', 'rule', 'mask-fade', 'retail'],
    }))
  }

  /* DV3. Cut here — a dashed line broken by a pair of scissors */
  {
    const c = cls('v13-dv-cut')
    const html = `<div class="${c}"><span class="s"><i></i><i></i><b></b></span></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 250px;
  color: #94a3b8;
}
.${c}::before,
.${c}::after {
  content: '';
  flex: 1;
  height: 0;
  border-top: 2px dashed #475569;
}
.${c} .s {
  position: relative;
  flex: none;
  width: 30px;
  height: 32px;
}
.${c} .s i {
  position: absolute;
  left: 14px;
  top: 0;
  width: 3px;
  height: 19px;
  border-radius: 2px;
  background: #e2e8f0;
  transform-origin: bottom center;
  transition: transform 0.3s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.${c} .s i:nth-child(1) { transform: rotate(-16deg); }
.${c} .s i:nth-child(2) { transform: rotate(16deg); }
.${c} .s i::after {
  content: '';
  position: absolute;
  left: -3.5px;
  top: 18px;
  width: 10px;
  height: 10px;
  border: 2px solid #94a3b8;
  border-radius: 50%;
}
.${c} .s b {
  position: absolute;
  left: 12.5px;
  top: 16px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cbd5e1;
  box-shadow: 0 0 0 2px #0b1020;
}
.${c}:hover .s i:nth-child(1) { transform: rotate(-32deg); }
.${c}:hover .s i:nth-child(2) { transform: rotate(32deg); }`
    add(mk({
      name: 'Cut Line Divider',
      category: 'Dividers & Separators',
      description: 'Dashed cut-here rule interrupted by a pair of scissors whose blades open a little wider when the divider is hovered.',
      html, css,
      tags: ['cut', 'scissors', 'dashed', 'coupon', 'tear'],
    }))
  }

  /* DV4. Folded crease — a paper fold with light above and shadow below */
  {
    const c = cls('v13-dv-crease')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 250px;
  height: 20px;
  background:
    linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0) 50%),
    linear-gradient(180deg, rgba(255,255,255,0) 50%, rgba(255,255,255,0.16) 54%, rgba(255,255,255,0.02) 70%, rgba(255,255,255,0) 100%);
  border-bottom: 1px solid rgba(255,255,255,0.22);
  border-top: 1px solid rgba(0,0,0,0.85);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
}`
    add(mk({
      name: 'Fold Crease Divider',
      category: 'Dividers & Separators',
      description: 'Separator built as a crease in the surface, shadow gathering above the fold and a thin catch of light below it.',
      html, css,
      tags: ['fold', 'crease', 'paper', 'shadow', 'skeuomorphic'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Badges & Tags                                                       */
  /* ------------------------------------------------------------------ */

  /* BD1. Wax seal — an embossed blob of sealing wax */
  {
    const c = cls('v13-bd-wax')
    const html = `<div class="${c}"><span>HL</span></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border-radius: 46% 54% 52% 48% / 50% 46% 54% 50%;
  background:
    radial-gradient(circle at 34% 28%, rgba(255,255,255,0.35), transparent 42%),
    radial-gradient(circle at 70% 80%, rgba(0,0,0,0.4), transparent 45%),
    #9f1239;
  box-shadow: 0 6px 14px rgba(0,0,0,0.55), inset 0 -2px 6px rgba(0,0,0,0.45);
  transition: transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.3s ease;
}
.${c} span {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #500724;
  text-shadow: 0 1px 0 rgba(255,255,255,0.22), 0 -1px 1px rgba(0,0,0,0.4);
}
.${c}:hover {
  transform: scale(1.06) rotate(-4deg);
  box-shadow: 0 10px 22px rgba(0,0,0,0.6), inset 0 -2px 6px rgba(0,0,0,0.45);
}`
    add(mk({
      name: 'Wax Seal Badge',
      category: 'Badges & Tags',
      description: 'Irregular blob of sealing wax with a highlight, an inner shadow and initials pressed into it, tilting when hovered.',
      html, css,
      tags: ['wax-seal', 'emboss', 'certified', 'skeuomorphic', 'stamp'],
    }))
  }

  /* BD2. Enamel pin — glossy fill inside a raised metal rim */
  {
    const c = cls('v13-bd-enamel')
    const html = `<div class="${c}"><b>SHIPPED</b></div>`
    const css = `.${c} {
  position: relative;
  display: inline-grid;
  place-items: center;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  background: linear-gradient(180deg, #6366f1, #4338ca);
  box-shadow:
    inset 0 0 0 2px #d4af37,
    inset 0 2px 4px rgba(255,255,255,0.4),
    inset 0 -3px 6px rgba(0,0,0,0.4),
    0 4px 10px rgba(0,0,0,0.5);
  overflow: hidden;
}
.${c} b {
  position: relative;
  z-index: 1;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: #fef9c3;
  text-shadow: 0 1px 1px rgba(0,0,0,0.5);
}
.${c}::after {
  content: '';
  position: absolute;
  top: -60%;
  left: -30%;
  width: 40%;
  height: 220%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
  transform: rotate(18deg);
  animation: ${c}-gloss 4.5s ease-in-out infinite;
}
@keyframes ${c}-gloss {
  0%, 62%  { left: -40%; }
  84%,100% { left: 120%; }
}`
    add(mk({
      name: 'Enamel Pin Badge',
      category: 'Badges & Tags',
      description: 'Hard enamel pill inside a raised gold rim, with a gloss highlight that travels across the face every few seconds.',
      html, css,
      tags: ['enamel', 'pin', 'gloss', 'metal-rim', 'collectible'],
    }))
  }

  /* BD3. Award rosette — a pleated disc over two ribbon tails */
  {
    const c = cls('v13-bd-rosette')
    const html = `<div class="${c}"><i class="l"></i><i class="r"></i><span class="d"><b>1</b></span></div>`
    const css = `.${c} {
  position: relative;
  width: 68px;
  height: 92px;
  display: grid;
  justify-items: center;
}
.${c} i {
  position: absolute;
  top: 44px;
  width: 15px;
  height: 42px;
  background: linear-gradient(180deg, #b91c1c, #7f1d1d);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%);
}
.${c} .l { left: 16px; transform: rotate(-9deg); transform-origin: top center; }
.${c} .r { right: 16px; transform: rotate(9deg); transform-origin: top center; }
.${c} .d {
  position: relative;
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: repeating-conic-gradient(from 0deg, #fbbf24 0 9deg, #f59e0b 9deg 18deg);
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  transition: transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} .d::after {
  content: '';
  position: absolute;
  inset: 9px;
  border-radius: 50%;
  background: linear-gradient(160deg, #fde68a, #f59e0b);
  box-shadow: inset 0 1px 2px rgba(255,255,255,0.6);
}
.${c} b {
  position: relative;
  z-index: 1;
  font-size: 1.25rem;
  font-weight: 800;
  color: #78350f;
}
.${c}:hover .d { transform: rotate(18deg) scale(1.05); }`
    add(mk({
      name: 'Award Rosette',
      category: 'Badges & Tags',
      description: 'Pleated prize rosette with two notched ribbon tails, the fluted disc turning slightly when the badge is hovered.',
      html, css,
      tags: ['rosette', 'award', 'ribbon', 'first-place', 'pleats'],
    }))
  }

  /* BD4. Streak flame — a count wrapped in a flame that keeps flickering */
  {
    const c = cls('v13-bd-streak')
    const html = `<div class="${c}"><span class="f"><i></i></span><b>42</b><em>day streak</em></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.75rem 0.3rem 0.5rem;
  background: linear-gradient(180deg, #2a1408, #1c0f06);
  border: 1px solid #7c2d12;
  border-radius: 999px;
  color: #fed7aa;
}
.${c} .f {
  position: relative;
  display: block;
  width: 14px;
  height: 18px;
}
.${c} .f::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50% 50% 50% 50% / 68% 68% 32% 32%;
  background: linear-gradient(180deg, #fbbf24, #ea580c 55%, #b91c1c);
  transform-origin: bottom center;
  animation: ${c}-flicker 0.9s ease-in-out infinite alternate;
}
.${c} .f i {
  position: absolute;
  left: 4px;
  bottom: 1px;
  width: 6px;
  height: 8px;
  border-radius: 50% 50% 50% 50% / 65% 65% 35% 35%;
  background: #fef3c7;
  transform-origin: bottom center;
  animation: ${c}-flicker 0.7s ease-in-out infinite alternate-reverse;
}
.${c} b { font-size: 0.85rem; font-weight: 800; color: #fdba74; }
.${c} em { font-style: normal; font-size: 0.66rem; color: #c2825a; }
@keyframes ${c}-flicker {
  from { transform: scaleY(0.92) scaleX(1.04) rotate(-3deg); }
  to   { transform: scaleY(1.08) scaleX(0.96) rotate(3deg); }
}`
    add(mk({
      name: 'Streak Flame Badge',
      category: 'Badges & Tags',
      description: 'Day-streak pill carrying a two-layer flame whose outer and inner tongues flicker against each other out of phase.',
      html, css,
      tags: ['streak', 'flame', 'gamification', 'flicker', 'count'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Skeletons & Shimmers                                                */
  /* ------------------------------------------------------------------ */

  /* SK1. Checkout summary — line items, a rule and a total */
  {
    const c = cls('v13-sk-checkout')
    const html = `<div class="${c}"><span class="h"></span><div class="r"><i></i><b></b></div><div class="r"><i></i><b></b></div><div class="r"><i></i><b></b></div><hr /><div class="r t"><i></i><b></b></div><span class="btn"></span></div>`
    const css = `.${c} {
  width: 232px;
  padding: 0.85rem 0.9rem;
  background: #131c31;
  border: 1px solid #253049;
  border-radius: 0.6rem;
}
.${c} span,
.${c} i,
.${c} b {
  display: block;
  border-radius: 4px;
  background: linear-gradient(90deg, #1e293b 25%, #334155 37%, #1e293b 63%);
  background-size: 400% 100%;
  animation: ${c}-shimmer 1.5s linear infinite;
}
.${c} .h { width: 58%; height: 12px; margin-bottom: 0.75rem; }
.${c} .r { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem; }
.${c} .r i { width: 52%; height: 9px; }
.${c} .r b { width: 44px; height: 9px; }
.${c} hr { border: none; border-top: 1px dashed #334155; margin: 0.55rem 0; }
.${c} .t i { width: 34%; height: 11px; }
.${c} .t b { width: 58px; height: 11px; }
.${c} .btn { width: 100%; height: 26px; margin-top: 0.7rem; border-radius: 0.4rem; }
@keyframes ${c}-shimmer {
  from { background-position: 100% 0; }
  to   { background-position: 0 0; }
}`
    add(mk({
      name: 'Checkout Summary Skeleton',
      category: 'Skeletons & Shimmers',
      description: 'Order summary placeholder with three charge rows, a dashed rule, a heavier total line and a full-width action block.',
      html, css,
      tags: ['checkout', 'summary', 'placeholder', 'shimmer', 'totals'],
    }))
  }

  /* SK2. Sidebar nav — a rail of icon-and-label rows */
  {
    const c = cls('v13-sk-sidebar')
    const html = `<div class="${c}"><div class="top"><span class="logo"></span><span class="name"></span></div><div class="row"><i></i><b></b></div><div class="row"><i></i><b></b></div><div class="row on"><i></i><b></b></div><div class="row"><i></i><b></b></div></div>`
    const css = `.${c} {
  width: 168px;
  padding: 0.7rem 0.6rem;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.6rem;
}
.${c} span,
.${c} i,
.${c} b {
  display: block;
  background: linear-gradient(90deg, #1e293b 25%, #334155 37%, #1e293b 63%);
  background-size: 400% 100%;
  animation: ${c}-shimmer 1.5s linear infinite;
}
.${c} .top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.8rem; }
.${c} .logo { width: 24px; height: 24px; border-radius: 7px; }
.${c} .name { width: 76px; height: 10px; border-radius: 4px; }
.${c} .row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.35rem;
  border-radius: 0.35rem;
}
.${c} .on { background: rgba(99,102,241,0.12); }
.${c} .row i { width: 14px; height: 14px; border-radius: 4px; }
.${c} .row b { height: 8px; border-radius: 4px; }
.${c} .row:nth-child(2) b { width: 62px; }
.${c} .row:nth-child(3) b { width: 48px; }
.${c} .row:nth-child(4) b { width: 70px; }
.${c} .row:nth-child(5) b { width: 40px; }
@keyframes ${c}-shimmer {
  from { background-position: 100% 0; }
  to   { background-position: 0 0; }
}`
    add(mk({
      name: 'Sidebar Nav Skeleton',
      category: 'Skeletons & Shimmers',
      description: 'Navigation rail placeholder with a brand row and four icon-and-label rows of uneven width, one of them held as the active item.',
      html, css,
      tags: ['sidebar', 'nav', 'placeholder', 'rows', 'shimmer'],
    }))
  }

  /* SK3. Radial bloom — the highlight blooms from the centre outward
        instead of sweeping across, which is the one axis the category's
        wave and pulse shimmers do not cover. */
  {
    const c = cls('v13-sk-bloom')
    const html = `<div class="${c}"><span class="a"></span><span class="b"></span><span class="d"></span><span class="e"></span><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 218px;
  padding: 0.9rem;
  background: #131c31;
  border: 1px solid #253049;
  border-radius: 0.6rem;
  overflow: hidden;
  isolation: isolate;
}
.${c} span {
  display: block;
  height: 10px;
  margin-bottom: 0.55rem;
  border-radius: 5px;
  background: #1e293b;
}
.${c} .a { width: 66%; height: 13px; }
.${c} .b { width: 100%; }
.${c} .d { width: 88%; }
.${c} .e { width: 52%; margin-bottom: 0; }
.${c} i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 320px;
  height: 320px;
  margin: -160px 0 0 -160px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(148,163,184,0.4) 0%, rgba(148,163,184,0.12) 35%, transparent 62%);
  transform: scale(0);
  animation: ${c}-bloom 2.4s ease-out infinite;
}
@keyframes ${c}-bloom {
  0%       { transform: scale(0); opacity: 0; }
  25%      { opacity: 1; }
  80%,100% { transform: scale(1); opacity: 0; }
}`
    add(mk({
      name: 'Radial Bloom Shimmer',
      category: 'Skeletons & Shimmers',
      description: 'Text placeholder lit by a highlight that blooms outward from the centre of the card rather than sweeping across it.',
      html, css,
      tags: ['shimmer', 'radial', 'bloom', 'placeholder', 'pulse'],
    }))
  }

  /* SK4. Pricing cards — three tiers with the middle one raised */
  {
    const c = cls('v13-sk-pricing')
    const html = `<div class="${c}"><div class="p"><span class="t"></span><span class="pr"></span><i></i><i></i><span class="b"></span></div><div class="p up"><span class="t"></span><span class="pr"></span><i></i><i></i><span class="b"></span></div><div class="p"><span class="t"></span><span class="pr"></span><i></i><i></i><span class="b"></span></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 7px;
}
.${c} .p {
  width: 72px;
  padding: 0.6rem 0.5rem;
  background: #131c31;
  border: 1px solid #253049;
  border-radius: 0.5rem;
}
.${c} .up {
  padding: 0.85rem 0.5rem;
  border-color: #3b4a6b;
  background: #16203a;
}
.${c} span,
.${c} i {
  display: block;
  border-radius: 4px;
  background: linear-gradient(90deg, #1e293b 25%, #334155 37%, #1e293b 63%);
  background-size: 400% 100%;
  animation: ${c}-shimmer 1.5s linear infinite;
}
.${c} .t { width: 60%; height: 8px; margin-bottom: 0.5rem; }
.${c} .pr { width: 80%; height: 16px; margin-bottom: 0.6rem; }
.${c} i { height: 6px; margin-bottom: 0.3rem; }
.${c} i:nth-of-type(1) { width: 100%; }
.${c} i:nth-of-type(2) { width: 74%; }
.${c} .b { width: 100%; height: 18px; margin-top: 0.55rem; border-radius: 0.3rem; }
@keyframes ${c}-shimmer {
  from { background-position: 100% 0; }
  to   { background-position: 0 0; }
}`
    add(mk({
      name: 'Pricing Cards Skeleton',
      category: 'Skeletons & Shimmers',
      description: 'Three-tier pricing placeholder with the middle card raised and outlined the way a recommended plan usually is.',
      html, css,
      tags: ['pricing', 'tiers', 'placeholder', 'cards', 'shimmer'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Borders & Outlines                                                  */
  /* ------------------------------------------------------------------ */

  /* BO1. Sawtooth frame — triangular teeth all the way round */
  {
    const c = cls('v13-bo-sawtooth')
    const html = `<div class="${c}"><div class="in">Postage paid</div></div>`
    const css = `.${c} {
  padding: 9px;
  background: #a5b4fc;
  -webkit-mask:
    conic-gradient(from 135deg at 50% 0, #000 0 90deg, transparent 0) 0 0 / 14px 9px repeat-x,
    conic-gradient(from -45deg at 50% 100%, #000 0 90deg, transparent 0) 0 100% / 14px 9px repeat-x,
    conic-gradient(from 45deg at 0 50%, #000 0 90deg, transparent 0) 0 0 / 9px 14px repeat-y,
    conic-gradient(from -135deg at 100% 50%, #000 0 90deg, transparent 0) 100% 0 / 9px 14px repeat-y,
    linear-gradient(#000, #000) 9px 9px / calc(100% - 18px) calc(100% - 18px) no-repeat;
  mask:
    conic-gradient(from 135deg at 50% 0, #000 0 90deg, transparent 0) 0 0 / 14px 9px repeat-x,
    conic-gradient(from -45deg at 50% 100%, #000 0 90deg, transparent 0) 0 100% / 14px 9px repeat-x,
    conic-gradient(from 45deg at 0 50%, #000 0 90deg, transparent 0) 0 0 / 9px 14px repeat-y,
    conic-gradient(from -135deg at 100% 50%, #000 0 90deg, transparent 0) 100% 0 / 9px 14px repeat-y,
    linear-gradient(#000, #000) 9px 9px / calc(100% - 18px) calc(100% - 18px) no-repeat;
  transition: filter 0.3s ease;
}
.${c} .in {
  padding: 0.8rem 1.1rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  color: #c7d2fe;
  background: #0f172a;
}
.${c}:hover { filter: drop-shadow(0 6px 14px rgba(165,180,252,0.35)); }`
    add(mk({
      name: 'Sawtooth Frame',
      category: 'Borders & Outlines',
      description: 'Panel edged with triangular teeth on all four sides, cut by four repeating conic masks the way a postage stamp is perforated.',
      html, css,
      tags: ['sawtooth', 'teeth', 'stamp', 'mask', 'frame'],
    }))
  }

  /* BO2. Taped corners — a print held down by four strips of tape */
  {
    const c = cls('v13-bo-taped')
    const html = `<div class="${c}"><div class="ph"></div><i class="t1"></i><i class="t2"></i><i class="t3"></i><i class="t4"></i></div>`
    const css = `.${c} {
  position: relative;
  padding: 8px;
  background: #f8fafc;
  box-shadow: 0 8px 20px rgba(0,0,0,0.5);
  transition: transform 0.35s ease;
}
.${c} .ph {
  width: 150px;
  height: 92px;
  background:
    radial-gradient(70% 80% at 25% 25%, #fbbf24, transparent 60%),
    linear-gradient(150deg, #6366f1, #0f172a);
}
.${c} i {
  position: absolute;
  width: 34px;
  height: 15px;
  background: rgba(226,232,240,0.55);
  border-left: 1px dashed rgba(148,163,184,0.6);
  border-right: 1px dashed rgba(148,163,184,0.6);
  box-shadow: 0 1px 3px rgba(0,0,0,0.35);
  transition: transform 0.3s ease;
}
.${c} .t1 { top: -8px;  left: -10px;  transform: rotate(-42deg); }
.${c} .t2 { top: -8px;  right: -10px; transform: rotate(42deg); }
.${c} .t3 { bottom: -8px; left: -10px;  transform: rotate(42deg); }
.${c} .t4 { bottom: -8px; right: -10px; transform: rotate(-42deg); }
.${c}:hover { transform: rotate(-1deg); }
.${c}:hover .t1 { transform: rotate(-52deg) translate(-2px, -2px); }
.${c}:hover .t2 { transform: rotate(52deg) translate(2px, -2px); }`
    add(mk({
      name: 'Taped Corner Frame',
      category: 'Borders & Outlines',
      description: 'Photographic print mounted by four translucent tape strips across its corners, the top pair peeling further out on hover.',
      html, css,
      tags: ['tape', 'corners', 'mounted', 'print', 'analog'],
      darkSurface: true,
    }))
  }

  /* BO3. Timer border — the outline fills round the box like a countdown */
  {
    const c = cls('v13-bo-timer')
    const html = `<div class="${c}"><i class="t"></i><i class="r"></i><i class="b"></i><i class="l"></i><span>Auto-saving…</span></div>`
    const css = `.${c} {
  position: relative;
  padding: 0.85rem 1.1rem;
  background: #101a2c;
  border: 2px solid #253049;
  border-radius: 0.5rem;
  color: #cbd5e1;
  font-size: 0.82rem;
}
.${c} i {
  position: absolute;
  background: #22d3ee;
  box-shadow: 0 0 8px rgba(34,211,238,0.6);
}
.${c} .t { top: -2px;    left: -2px;  height: 2px; width: 0; animation: ${c}-w 4s linear infinite; }
.${c} .r { top: -2px;    right: -2px; width: 2px; height: 0; animation: ${c}-h 4s linear 1s infinite; }
.${c} .b { bottom: -2px; right: -2px; height: 2px; width: 0; animation: ${c}-w 4s linear 2s infinite; }
.${c} .l { bottom: -2px; left: -2px;  width: 2px; height: 0; animation: ${c}-h 4s linear 3s infinite; }
.${c} span { position: relative; }
@keyframes ${c}-w {
  0%       { width: 0; }
  25%,100% { width: calc(100% + 4px); }
}
@keyframes ${c}-h {
  0%       { height: 0; }
  25%,100% { height: calc(100% + 4px); }
}`
    add(mk({
      name: 'Timer Border',
      category: 'Borders & Outlines',
      description: 'Outline that draws itself edge by edge around the panel on a four-second cycle, the way a countdown ring reads on a rectangle.',
      html, css,
      tags: ['timer', 'countdown', 'draw', 'outline', 'sequence'],
    }))
  }

  /* BO4. Ornate corners — flourished rules meeting at four corner pieces */
  {
    const c = cls('v13-bo-ornate')
    const html = `<div class="${c}"><i class="a"></i><i class="b"></i><i class="d"></i><i class="e"></i><span>Est. MMXXVI</span></div>`
    const css = `.${c} {
  position: relative;
  padding: 1.1rem 1.6rem;
  background: #120f1c;
  border: 1px solid #4c3f6b;
  outline: 1px solid #2b2340;
  outline-offset: 3px;
  color: #d8b4fe;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.86rem;
  letter-spacing: 0.16em;
}
.${c} i {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid #a855f7;
  transition: width 0.3s ease, height 0.3s ease;
}
.${c} i::after {
  content: '';
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #d8b4fe;
}
.${c} .a { top: -7px;    left: -7px;    border-right: none; border-bottom: none; }
.${c} .b { top: -7px;    right: -7px;   border-left: none;  border-bottom: none; }
.${c} .d { bottom: -7px; left: -7px;    border-right: none; border-top: none; }
.${c} .e { bottom: -7px; right: -7px;   border-left: none;  border-top: none; }
.${c} .a::after { top: -3px;    left: -3px; }
.${c} .b::after { top: -3px;    right: -3px; }
.${c} .d::after { bottom: -3px; left: -3px; }
.${c} .e::after { bottom: -3px; right: -3px; }
.${c}:hover i { width: 26px; height: 26px; }`
    add(mk({
      name: 'Ornate Corner Frame',
      category: 'Borders & Outlines',
      description: 'Double-ruled plate with flourished corner pieces finished by a bead, the corners drawing further along the rules on hover.',
      html, css,
      tags: ['ornate', 'corners', 'certificate', 'serif', 'double-rule'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Progress & Meters                                                   */
  /* ------------------------------------------------------------------ */

  /* PR1. Milestone flags — a track with reward markers along it */
  {
    const c = cls('v13-pr-milestone')
    const html = `<div class="${c}"><div class="tr"><i></i></div><span class="m hit" style="--p:25%"></span><span class="m hit" style="--p:50%"></span><span class="m" style="--p:75%"></span><span class="m" style="--p:100%"></span><div class="lb"><b>620 XP</b><em>next: 750</em></div></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  padding-top: 14px;
}
.${c} .tr {
  height: 9px;
  border-radius: 5px;
  background: rgba(148,163,184,0.2);
  overflow: hidden;
}
.${c} .tr i {
  display: block;
  width: 62%;
  height: 100%;
  border-radius: 5px;
  background: linear-gradient(90deg, #34d399, #22d3ee);
}
.${c} .m {
  position: absolute;
  top: 8px;
  left: var(--p);
  width: 3px;
  height: 21px;
  margin-left: -1.5px;
  background: #475569;
  transition: background 0.25s ease;
}
.${c} .m::after {
  content: '';
  position: absolute;
  left: 2px;
  top: -1px;
  width: 11px;
  height: 8px;
  background: #475569;
  clip-path: polygon(0 0, 100% 0, 74% 50%, 100% 100%, 0 100%);
  transition: background 0.25s ease, transform 0.25s ease;
}
.${c} .hit { background: #22d3ee; }
.${c} .hit::after { background: #22d3ee; }
.${c} .m:hover::after { transform: translateY(-2px) scale(1.15); }
.${c} .lb { display: flex; justify-content: space-between; margin-top: 0.8rem; font-size: 0.68rem; }
.${c} b { color: #a5f3fc; }
.${c} em { font-style: normal; color: #64748b; }`
    add(mk({
      name: 'Milestone Flag Bar',
      category: 'Progress & Meters',
      description: 'Progress track with pennant flags planted at each reward point, the ones already passed lit in the same colour as the fill.',
      html, css,
      tags: ['milestones', 'flags', 'rewards', 'xp', 'track'],
    }))
  }

  /* PR2. Buffered media bar — played, buffered and unloaded in one track */
  {
    const c = cls('v13-pr-buffer')
    const html = `<div class="${c}"><div class="tr"><i class="bu"></i><i class="pl"></i><span class="kn"></span></div><div class="ti"><b>1:42</b><em>4:08</em></div></div>`
    const css = `.${c} {
  width: 242px;
}
.${c} .tr {
  position: relative;
  height: 6px;
  border-radius: 3px;
  background: rgba(148,163,184,0.18);
  cursor: pointer;
}
.${c} .bu {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 74%;
  border-radius: 3px;
  background: rgba(203,213,225,0.32);
  animation: ${c}-buffer 3.5s ease-in-out infinite;
}
.${c} .pl {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 42%;
  border-radius: 3px;
  background: #f43f5e;
}
.${c} .kn {
  position: absolute;
  left: 42%;
  top: 50%;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: #f43f5e;
  box-shadow: 0 0 0 0 rgba(244,63,94,0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.${c} .tr:hover .kn { transform: scale(1.25); box-shadow: 0 0 0 6px rgba(244,63,94,0.2); }
.${c} .ti { display: flex; justify-content: space-between; margin-top: 0.45rem; font-size: 0.66rem; font-variant-numeric: tabular-nums; }
.${c} b { color: #e2e8f0; }
.${c} em { font-style: normal; color: #64748b; }
@keyframes ${c}-buffer {
  0%, 100% { width: 68%; }
  50%      { width: 86%; }
}`
    add(mk({
      name: 'Buffer Bar',
      category: 'Progress & Meters',
      description: 'Media scrubber showing three states in one track — played, buffered ahead and not yet loaded — with a knob that swells on hover.',
      html, css,
      tags: ['buffer', 'scrubber', 'media', 'playback', 'three-state'],
    }))
  }

  /* PR3. Zoned scale — a graduated strip with safe, warn and danger bands */
  {
    const c = cls('v13-pr-zones')
    const html = `<div class="${c}"><div class="sc"><i class="nd"></i></div><div class="lg"><span>0</span><span>safe</span><span>warn</span><span>120</span></div></div>`
    const css = `.${c} {
  width: 242px;
}
.${c} .sc {
  position: relative;
  height: 20px;
  border-radius: 3px;
  background: linear-gradient(90deg, #059669 0 52%, #ca8a04 52% 78%, #b91c1c 78% 100%);
  background-image:
    repeating-linear-gradient(90deg, rgba(0,0,0,0.45) 0 1px, transparent 1px 12px),
    linear-gradient(90deg, #059669 0 52%, #ca8a04 52% 78%, #b91c1c 78% 100%);
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
}
.${c} .nd {
  position: absolute;
  top: -5px;
  bottom: -5px;
  left: 64%;
  width: 3px;
  margin-left: -1.5px;
  background: #f8fafc;
  box-shadow: 0 0 6px rgba(0,0,0,0.8);
  animation: ${c}-drift 5s ease-in-out infinite;
}
.${c} .nd::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -4px;
  border: 5px solid transparent;
  border-top-color: #f8fafc;
}
.${c} .lg { display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.62rem; color: #64748b; }
@keyframes ${c}-drift {
  0%, 100% { left: 58%; }
  50%      { left: 72%; }
}`
    add(mk({
      name: 'Zone Scale Meter',
      category: 'Progress & Meters',
      description: 'Graduated pressure strip split into safe, warning and danger bands, with a pointer drifting across the reading.',
      html, css,
      tags: ['gauge', 'zones', 'scale', 'pointer', 'pressure'],
    }))
  }

  /* PR4. Week streak — seven day cells, the current one still open */
  {
    const c = cls('v13-pr-week')
    const html = `<div class="${c}"><div class="d done"><b>M</b><i></i></div><div class="d done"><b>T</b><i></i></div><div class="d done"><b>W</b><i></i></div><div class="d miss"><b>T</b><i></i></div><div class="d done"><b>F</b><i></i></div><div class="d now"><b>S</b><i></i></div><div class="d"><b>S</b><i></i></div></div>`
    const css = `.${c} {
  display: flex;
  gap: 6px;
}
.${c} .d { display: grid; justify-items: center; gap: 0.3rem; }
.${c} b { font-size: 0.6rem; font-weight: 500; color: #64748b; }
.${c} i {
  display: block;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: rgba(148,163,184,0.14);
  border: 1px solid transparent;
  transition: transform 0.2s ease;
}
.${c} .done i { background: #34d399; }
.${c} .miss i { background: rgba(248,113,113,0.18); border-color: rgba(248,113,113,0.5); }
.${c} .now i {
  background: rgba(52,211,153,0.18);
  border: 2px dashed #34d399;
  animation: ${c}-pending 2s ease-in-out infinite;
}
.${c} .d:hover i { transform: translateY(-3px); }
.${c} .done b, .${c} .now b { color: #cbd5e1; }
@keyframes ${c}-pending {
  0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.45); }
  60%      { box-shadow: 0 0 0 5px rgba(52,211,153,0); }
}`
    add(mk({
      name: 'Streak Week Meter',
      category: 'Progress & Meters',
      description: 'Seven day cells reading a week at a glance — filled for done, outlined red for missed, and a dashed pulse on the day still open.',
      html, css,
      tags: ['streak', 'week', 'habit', 'cells', 'calendar'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Scroll & Sticky                                                     */
  /* ------------------------------------------------------------------ */

  /* SC1. Rail scrollbar — a horizontal rail carrying its own indicator */
  {
    const c = cls('v13-sc-railbar')
    const html = `<div class="${c}"><div class="rl"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  width: 250px;
}
.${c} .rl {
  display: flex;
  gap: 8px;
  padding-bottom: 12px;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #6366f1 rgba(148,163,184,0.16);
}
.${c} .rl::-webkit-scrollbar { height: 5px; }
.${c} .rl::-webkit-scrollbar-track { background: rgba(148,163,184,0.16); border-radius: 3px; }
.${c} .rl::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, #6366f1, #22d3ee);
  border-radius: 3px;
}
.${c} .rl::-webkit-scrollbar-thumb:hover { filter: brightness(1.2); }
.${c} i {
  flex: none;
  width: 84px;
  height: 96px;
  border-radius: 0.5rem;
}
.${c} i:nth-child(1) { background: linear-gradient(150deg, #f472b6, #9d174d); }
.${c} i:nth-child(2) { background: linear-gradient(150deg, #38bdf8, #1e3a8a); }
.${c} i:nth-child(3) { background: linear-gradient(150deg, #34d399, #065f46); }
.${c} i:nth-child(4) { background: linear-gradient(150deg, #fbbf24, #b45309); }
.${c} i:nth-child(5) { background: linear-gradient(150deg, #a78bfa, #5b21b6); }
.${c} i:nth-child(6) { background: linear-gradient(150deg, #94a3b8, #334155); }`
    add(mk({
      name: 'Rail Scroll Bar',
      category: 'Scroll & Sticky',
      description: 'Horizontal card rail with a slim gradient scrollbar of its own beneath it, sized to the rail rather than the page.',
      html, css,
      tags: ['rail', 'scrollbar', 'horizontal', 'gradient-thumb', 'overflow'],
    }))
  }

  /* SC2. Sticky aside — a summary card that pins beside a scrolling column */
  {
    const c = cls('v13-sc-aside')
    const html = `<div class="${c}"><div class="col"><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p></div><aside><b>In this order</b><span>3 items</span><em>£116.40</em><u>Checkout</u></aside></div>`
    const css = `.${c} {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  width: 258px;
  height: 150px;
  padding: 0 2px;
  overflow-y: auto;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.5rem;
}
.${c} .col { flex: 1; display: grid; gap: 8px; padding: 8px 0 8px 8px; }
.${c} .col p {
  margin: 0;
  height: 34px;
  border-radius: 0.35rem;
  background: #1a2437;
}
.${c} aside {
  position: sticky;
  top: 8px;
  flex: none;
  width: 96px;
  margin: 8px 8px 8px 0;
  padding: 0.55rem 0.6rem 0.65rem;
  background: #16203a;
  border: 1px solid #2c3a58;
  border-radius: 0.45rem;
}
.${c} b { display: block; font-size: 0.66rem; color: #f1f5f9; }
.${c} span { display: block; font-size: 0.6rem; color: #64748b; }
.${c} em { display: block; margin-top: 0.3rem; font-style: normal; font-size: 0.86rem; font-weight: 700; color: #7dd3fc; }
.${c} u {
  display: block;
  margin-top: 0.45rem;
  padding: 0.22rem 0;
  text-align: center;
  text-decoration: none;
  font-size: 0.62rem;
  font-weight: 600;
  color: #0b1020;
  background: #38bdf8;
  border-radius: 0.3rem;
  cursor: pointer;
}`
    add(mk({
      name: 'Sticky Aside',
      category: 'Scroll & Sticky',
      description: 'Order summary pinned to the top of its column while the list beside it scrolls past, staying in reach the whole way down.',
      html, css,
      tags: ['sticky', 'aside', 'summary', 'two-column', 'checkout'],
    }))
  }

  /* SC3. Sticky new divider — an unread marker that pins as you scroll up */
  {
    const c = cls('v13-sc-newdiv')
    const html = `<div class="${c}"><div class="m me"></div><div class="m"></div><div class="m me"></div><div class="nw"><span>New messages</span></div><div class="m"></div><div class="m me"></div><div class="m"></div><div class="m"></div></div>`
    const css = `.${c} {
  width: 240px;
  height: 150px;
  padding: 8px;
  overflow-y: auto;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.5rem;
}
.${c} .m {
  height: 26px;
  margin-bottom: 7px;
  border-radius: 12px 12px 12px 3px;
  background: #1e293b;
  width: 72%;
}
.${c} .me {
  margin-left: auto;
  border-radius: 12px 12px 3px 12px;
  background: #24406b;
  width: 62%;
}
.${c} .nw {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.3rem 0 0.6rem;
  padding: 0.15rem 0;
  background: #0f1626;
}
.${c} .nw::before,
.${c} .nw::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #f43f5e;
}
.${c} .nw span {
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #fda4af;
}`
    add(mk({
      name: 'Sticky New Divider',
      category: 'Scroll & Sticky',
      description: 'Unread-messages rule in a chat log that pins to the top of the scroller so the boundary stays visible while you read past it.',
      html, css,
      tags: ['sticky', 'unread', 'chat', 'divider', 'scroller'],
    }))
  }

  /* SC4. Sticky media panel — the image holds while the text moves past */
  {
    const c = cls('v13-sc-media')
    const html = `<div class="${c}"><figure></figure><div class="tx"><p></p><p></p><p></p><p></p><p></p><p></p><p></p></div></div>`
    const css = `.${c} {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  width: 256px;
  height: 150px;
  padding: 8px;
  overflow-y: auto;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.5rem;
}
.${c} figure {
  position: sticky;
  top: 0;
  flex: none;
  width: 104px;
  height: 104px;
  margin: 0;
  border-radius: 0.5rem;
  background:
    radial-gradient(70% 80% at 30% 25%, #f472b6, transparent 60%),
    radial-gradient(70% 80% at 75% 80%, #38bdf8, transparent 60%),
    linear-gradient(150deg, #312e81, #0f172a);
}
.${c} .tx { flex: 1; display: grid; gap: 7px; }
.${c} .tx p {
  margin: 0;
  height: 9px;
  border-radius: 4px;
  background: #1e293b;
}
.${c} .tx p:nth-child(3n) { width: 74%; }
.${c} .tx p:nth-child(4n) { width: 88%; }`
    add(mk({
      name: 'Sticky Media Panel',
      category: 'Scroll & Sticky',
      description: 'Article layout where the image sticks to the top of the viewport while the copy alongside it keeps scrolling.',
      html, css,
      tags: ['sticky', 'media', 'article', 'parallax', 'two-column'],
    }))
  }
}
