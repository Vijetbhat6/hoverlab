// scripts/generate-effects-v14-h.mjs
//
// Fourteenth wave, part H: Skeletons & Shimmers, Borders & Outlines,
// Progress & Meters, Scroll & Sticky. Four designs each, 16 in total.
//
// WHY THIS EXISTS DESPITE THE SEAL
//
// scripts/check-catalog-focus.mts still marks all four of these categories
// SEALED — shape-exhausted, grow blocks instead. That reading is fair (the
// obvious forms really are gone), but the owner overruled it again: the
// catalog grows evenly across all 32 categories, and the baseline is
// re-accepted downstream with `--update` as a deliberate, diffable act.
// The SEALED reasons in that script are left unedited.
//
// So these 16 were picked *against* the exhausted lists rather than invented
// freely, and each one is a mechanic its category does not already own:
//
//   Skeletons — a toast stack in perspective, a three-pane mail client, a
//               product detail page, and a placeholder that TYPES itself in
//               behind a caret instead of shimmering
//   Borders   — a striped hazard band, a folded-back dog ear, a punched
//               ledger margin, and a callout whose tail keeps the hairline
//               continuous while it walks along the edge
//   Progress  — an hourglass draining, an odometer wheel, a hundred-cell
//               waffle, and a signed centre-zero variance bar
//   Scroll    — a two-axis frozen grid corner, cards piling at the bottom on
//               staggered sticky offsets, parallax layers on a scroll
//               timeline, and a delivery spine that ticks off milestones as
//               they cross a fixed read line
//
// Every Scroll & Sticky entry renders its own scroll container inside the
// preview cell, so the mechanism is visible without a page to scroll.
//
// Same assembly constraints as the rest of the wave: roots visible at rest,
// no position:absolute on a root, infinite keyframes resting sensibly at
// their 100% stop, everything fitting a ~300x180 dark preview.

export function generateV14H(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Skeletons & Shimmers                                                */
  /* ------------------------------------------------------------------ */

  /* SK1. Toast stack — three notifications piled in perspective */
  {
    const c = cls('v14-sk-toaststack')
    const html = `<div class="${c}"><i class="b3"></i><i class="b2"></i><div class="fr"><i class="ic"></i><div class="tx"><b></b><u></u></div><i class="x"></i></div></div>`
    const css = `.${c} {
  position: relative;
  width: 232px;
  height: 86px;
  font-family: system-ui, sans-serif;
}
.${c} i.b3,
.${c} i.b2 {
  position: absolute;
  left: 50%;
  border-radius: 0.6rem;
  background: #18233f;
  border: 1px solid #2c3a58;
  transition: transform 0.35s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.${c} i.b3 {
  top: 0;
  width: 74%;
  height: 34px;
  opacity: 0.55;
  transform: translateX(-50%);
}
.${c} i.b2 {
  top: 12px;
  width: 87%;
  height: 36px;
  opacity: 0.85;
  transform: translateX(-50%);
}
.${c} .fr {
  position: absolute;
  left: 0;
  top: 26px;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  height: 60px;
  padding: 0.7rem;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #1a2540;
  border: 1px solid #2c3a58;
  box-shadow: 0 8px 18px rgba(0,0,0,0.45);
}
.${c} .fr .ic {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 0.5rem;
  background: #2a3b5f;
}
.${c} .fr .tx {
  flex: 1;
  display: grid;
  gap: 7px;
}
.${c} .fr b {
  display: block;
  width: 58%;
  height: 8px;
  border-radius: 4px;
  background: #33456b;
}
.${c} .fr u {
  display: block;
  width: 92%;
  height: 6px;
  border-radius: 3px;
  background: #253654;
}
.${c} .fr .x {
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: #253654;
}
.${c} .fr::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 24%, rgba(148,197,255,0.12) 50%, transparent 76%);
  animation: ${c}-sweep 1.7s ease-in-out infinite;
}
.${c}:hover i.b3 { transform: translateX(-50%) translateY(-8px); }
.${c}:hover i.b2 { transform: translateX(-50%) translateY(-4px); }
@keyframes ${c}-sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}`
    add(mk({
      name: 'Toast Stack Skeleton',
      category: 'Skeletons & Shimmers',
      description: 'Notification stack placeholder with two dimmed toasts peeking out behind the front card, whose icon, title and body bars carry the sweep; hovering fans the pile apart.',
      html, css,
      tags: ['toast', 'notification', 'stack', 'skeleton', 'sweep'],
    }))
  }

  /* SK2. Mail client — the three-pane inbox wireframe */
  {
    const c = cls('v14-sk-mail')
    const rows = ['on', '', '', ''].map((k) => `<div class="rw ${k}"><b></b><u></u></div>`).join('')
    const html = `<div class="${c}"><div class="rail"><i class="lg"></i><i></i><i></i><i></i><i></i></div><div class="list">${rows}</div><div class="rd"><div class="hd"><i class="av"></i><div><b></b><u></u></div></div><p></p><p></p><p class="s"></p><p></p><p class="s"></p></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  width: 258px;
  height: 144px;
  overflow: hidden;
  border-radius: 0.55rem;
  background: #0f1626;
  border: 1px solid #253049;
  font-family: system-ui, sans-serif;
}
.${c} .rail {
  flex: none;
  display: grid;
  gap: 10px;
  align-content: start;
  justify-items: center;
  width: 34px;
  padding: 9px 0;
  background: #0c1220;
  border-right: 1px solid #1e2a44;
}
.${c} .rail i {
  width: 18px;
  height: 7px;
  border-radius: 3px;
  background: #1e293b;
}
.${c} .rail i.lg {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: #2a3b5f;
}
.${c} .list {
  flex: none;
  display: grid;
  gap: 9px;
  align-content: start;
  width: 82px;
  padding: 9px 7px;
  border-right: 1px solid #1e2a44;
}
.${c} .list .rw {
  display: grid;
  gap: 5px;
  padding: 3px 4px;
  border-radius: 0.25rem;
}
.${c} .list .rw.on {
  background: #1c2c4d;
  box-shadow: inset 2px 0 0 #38bdf8;
}
.${c} .list b {
  display: block;
  width: 68%;
  height: 6px;
  border-radius: 3px;
  background: #33456b;
}
.${c} .list u {
  display: block;
  width: 100%;
  height: 5px;
  border-radius: 3px;
  background: #1e293b;
}
.${c} .rd {
  flex: 1;
  display: grid;
  gap: 8px;
  align-content: start;
  padding: 10px;
}
.${c} .rd .hd {
  display: flex;
  align-items: center;
  gap: 7px;
}
.${c} .rd .hd > div {
  flex: 1;
  display: grid;
  gap: 5px;
}
.${c} .rd .av {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #2a3b5f;
}
.${c} .rd b {
  display: block;
  width: 72%;
  height: 7px;
  border-radius: 3px;
  background: #33456b;
}
.${c} .rd u {
  display: block;
  width: 46%;
  height: 5px;
  border-radius: 3px;
  background: #1e293b;
}
.${c} .rd p {
  margin: 0;
  height: 6px;
  border-radius: 3px;
  background: #1a2437;
}
.${c} .rd p.s { width: 74%; }
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 28%, rgba(148,197,255,0.09) 50%, transparent 72%);
  animation: ${c}-sweep 2s ease-in-out infinite;
}
@keyframes ${c}-sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}`
    add(mk({
      name: 'Mail Client Skeleton',
      category: 'Skeletons & Shimmers',
      description: 'Three-pane inbox placeholder — an icon rail, a message list with one row already marked as selected, and a reading pane with a sender block and ragged body lines — under one sweep across all three panes.',
      html, css,
      tags: ['mail', 'inbox', 'three-pane', 'skeleton', 'wireframe'],
    }))
  }

  /* SK3. Product detail — hero, thumb strip, price and buy column */
  {
    const c = cls('v14-sk-product')
    const html = `<div class="${c}"><div class="lf"><i class="hero"></i><div class="th"><i></i><i></i><i></i><i></i></div></div><div class="rt"><b class="t1"></b><b class="t2"></b><div class="st"><i></i><i></i><i></i><i></i><i></i></div><b class="pr"></b><div class="ch"><i></i><i></i><i></i></div><b class="bt"></b></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  gap: 12px;
  width: 256px;
  height: 138px;
  overflow: hidden;
  font-family: system-ui, sans-serif;
}
.${c} .lf {
  flex: none;
  display: grid;
  gap: 8px;
  align-content: start;
  width: 102px;
}
.${c} .hero {
  height: 96px;
  border-radius: 0.55rem;
  background: linear-gradient(150deg, #223353, #17223a);
}
.${c} .th {
  display: flex;
  gap: 6px;
}
.${c} .th i {
  width: 21px;
  height: 21px;
  border-radius: 0.3rem;
  background: #1a2540;
}
.${c} .th i:first-child {
  background: #24365a;
  box-shadow: inset 0 0 0 1px #3b5280;
}
.${c} .rt {
  flex: 1;
  display: grid;
  gap: 8px;
  align-content: start;
}
.${c} .rt b {
  display: block;
  border-radius: 4px;
}
.${c} .t1 { width: 94%; height: 9px; background: #33456b; }
.${c} .t2 { width: 60%; height: 9px; background: #263551; }
.${c} .st { display: flex; gap: 4px; }
.${c} .st i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: #3f4d2a;
}
.${c} .st i:nth-child(-n+4) { background: #a3852c; }
.${c} .pr {
  width: 52%;
  height: 15px;
  border-radius: 4px;
  background: linear-gradient(90deg, #14532d, #1d6b3c);
}
.${c} .ch { display: flex; gap: 6px; }
.${c} .ch i {
  width: 28px;
  height: 15px;
  border-radius: 999px;
  background: #1a2540;
  box-shadow: inset 0 0 0 1px #2c3a58;
}
.${c} .bt {
  width: 100%;
  height: 22px;
  border-radius: 0.4rem;
  background: linear-gradient(90deg, #1e3a8a, #2b4fa8);
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 26%, rgba(148,197,255,0.11) 50%, transparent 74%);
  animation: ${c}-sweep 1.9s ease-in-out infinite;
}
@keyframes ${c}-sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}`
    add(mk({
      name: 'Product Detail Skeleton',
      category: 'Skeletons & Shimmers',
      description: 'Product page placeholder holding its real shape — hero image over a thumbnail strip on the left, title lines, a rating row, a green price block, size chips and a full-width buy bar on the right.',
      html, css,
      tags: ['product', 'ecommerce', 'skeleton', 'gallery', 'buy'],
    }))
  }

  /* SK4. Typewriter fill — lines written in behind a caret, not shimmered */
  {
    const c = cls('v14-sk-typewriter')
    const lines = [92, 100, 100, 78, 88]
    const html = `<div class="${c}"><div class="hd"><i></i><span></span></div>${lines
      .map((w, i) => `<div class="ln l${i + 1}"><i></i></div>`)
      .join('')}</div>`
    const css = `.${c} {
  display: grid;
  gap: 9px;
  width: 236px;
  padding: 0.85rem 0.9rem 1rem;
  border-radius: 0.6rem;
  background: #101a2e;
  border: 1px solid #253049;
  font-family: system-ui, sans-serif;
}
.${c} .hd {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2px;
}
.${c} .hd i {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #2a3b5f;
}
.${c} .hd span {
  display: block;
  width: 96px;
  height: 8px;
  border-radius: 4px;
  background: #33456b;
}
.${c} .ln { height: 8px; }
${lines.map((w, i) => `.${c} .l${i + 1} { width: ${w}%; }`).join('\n')}
.${c} .ln i {
  position: relative;
  display: block;
  width: 0;
  height: 100%;
  border-radius: 4px;
  background: #24344f;
  animation: ${c}-type 3s linear infinite;
}
.${c} .ln i::after {
  content: '';
  position: absolute;
  right: -4px;
  top: -2px;
  width: 2px;
  height: calc(100% + 4px);
  border-radius: 1px;
  background: #38bdf8;
  opacity: 0;
  animation: ${c}-caret 3s linear infinite;
}
${lines
  .map((w, i) => `.${c} .l${i + 1} i, .${c} .l${i + 1} i::after { animation-delay: ${(i * 0.42).toFixed(2)}s; }`)
  .join('\n')}
@keyframes ${c}-type {
  0% { width: 0; }
  13% { width: 100%; }
  100% { width: 100%; }
}
@keyframes ${c}-caret {
  0% { opacity: 1; }
  13% { opacity: 1; }
  14% { opacity: 0; }
  100% { opacity: 0; }
}`
    add(mk({
      name: 'Typewriter Fill Skeleton',
      category: 'Skeletons & Shimmers',
      description: 'Text placeholder that writes itself in rather than shimmering — each bar grows from zero width behind a blue caret that hands off to the line below, so the card fills top to bottom like typed copy.',
      html, css,
      tags: ['typewriter', 'caret', 'skeleton', 'placeholder', 'sequential'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Borders & Outlines                                                  */
  /* ------------------------------------------------------------------ */

  /* BO1. Hazard tape — a wide striped band as the border, crawling */
  {
    const c = cls('v14-bo-hazard')
    const html = `<div class="${c}"><span><b>Deploy locked</b><em>main is frozen</em></span></div>`
    const css = `.${c} {
  position: relative;
  width: 234px;
  padding: 1.5rem 1.4rem;
  border-radius: 0.35rem;
  font-family: system-ui, sans-serif;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 0.35rem;
  background: repeating-linear-gradient(45deg, #facc15 0 9px, #171410 9px 18px);
  animation: ${c}-crawl 1.4s linear infinite;
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 0.15rem;
  background: #12182a;
  box-shadow: inset 0 0 0 1px rgba(250,204,21,0.28);
}
.${c} span {
  position: relative;
  z-index: 1;
  display: block;
}
.${c} b {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #fde68a;
}
.${c} em {
  display: block;
  margin-top: 0.15rem;
  font-style: normal;
  font-size: 0.62rem;
  color: #94a3b8;
}
@keyframes ${c}-crawl {
  0% { background-position: 0 0; }
  100% { background-position: 25.46px 0; }
}`
    add(mk({
      name: 'Hazard Tape Border',
      category: 'Borders & Outlines',
      description: 'Warning panel edged with a twelve-pixel band of diagonal caution stripes that crawl continuously around the box, the dark plate inset inside it carrying a faint amber keyline.',
      html, css,
      tags: ['hazard', 'caution', 'stripes', 'warning', 'band'],
    }))
  }

  /* BO2. Dog ear — one corner folded back over the frame */
  {
    const c = cls('v14-bo-dogear')
    const html = `<div class="${c}"><b>Field notes</b><u></u><u class="s"></u><i class="fl"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 214px;
  height: 108px;
  padding: 0.85rem 1rem;
  border: 1px solid #34507d;
  border-radius: 0.4rem 0.4rem 0 0.4rem;
  background: #111a2e;
  font-family: system-ui, sans-serif;
}
.${c} b {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #cbd5e1;
}
.${c} u {
  display: block;
  width: 100%;
  height: 6px;
  margin-top: 0.6rem;
  border-radius: 3px;
  background: #1e293b;
}
.${c} u.s { width: 64%; }
.${c} .fl {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 34px;
  height: 34px;
  background:
    linear-gradient(to bottom right, transparent 0 calc(50% - 0.8px), #6d94c9 calc(50% - 0.8px) calc(50% + 0.8px), transparent calc(50% + 0.8px) 100%),
    linear-gradient(to bottom right, transparent 0 50%, rgba(0,0,0,0.5) 50% 60%, transparent 60% 100%),
    linear-gradient(to bottom right, transparent 0 50%, #27395e 50% 100%);
  box-shadow: inset -1px 0 0 #34507d, inset 0 -1px 0 #34507d;
  transition: width 0.3s ease, height 0.3s ease;
}
.${c}:hover .fl {
  width: 48px;
  height: 48px;
}`
    add(mk({
      name: 'Dog-Eared Frame',
      category: 'Borders & Outlines',
      description: 'Outlined note whose bottom-right corner is folded back, the flap painting over the frame so the diagonal becomes the new hairline edge, and peeling further open on hover.',
      html, css,
      tags: ['dog-ear', 'fold', 'corner', 'paper', 'frame'],
    }))
  }

  /* BO3. Punched ledger — a bound page edge as the frame */
  {
    const c = cls('v14-bo-ledger')
    const html = `<div class="${c}"><i class="hl"></i><span><b>Ledger</b><u></u><u class="s"></u><u></u></span></div>`
    const css = `.${c} {
  position: relative;
  width: 234px;
  height: 122px;
  padding: 0.75rem 0.8rem 0.75rem 2.6rem;
  border: 1px solid #2c3a58;
  border-radius: 0.2rem 0.4rem 0.4rem 0.2rem;
  background-color: #101a2c;
  background-image: repeating-linear-gradient(180deg, transparent 0 21px, rgba(148,163,184,0.16) 21px 22px);
  background-position: 34px 6px;
  background-size: calc(100% - 42px) 100%;
  background-repeat: no-repeat;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  font-family: system-ui, sans-serif;
}
.${c}::before {
  content: '';
  position: absolute;
  left: 33px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #be123c;
  opacity: 0.75;
}
.${c} .hl {
  position: absolute;
  left: 11px;
  top: 20px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #070b14;
  box-shadow:
    inset 0 1px 2px rgba(0,0,0,0.9),
    0 0 0 1px #2c3a58,
    0 34px 0 0 #070b14,
    0 34px 0 1px #2c3a58,
    0 68px 0 0 #070b14,
    0 68px 0 1px #2c3a58;
}
.${c} span {
  position: relative;
  display: block;
}
.${c} b {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #cbd5e1;
  line-height: 21px;
}
.${c} u {
  display: block;
  width: 100%;
  height: 6px;
  margin-top: 16px;
  border-radius: 3px;
  background: #1c2740;
}
.${c} u:first-of-type { margin-top: 9px; }
.${c} u.s { width: 58%; }
.${c}:hover {
  transform: translateX(4px);
  box-shadow: -4px 0 10px rgba(0,0,0,0.45);
}`
    add(mk({
      name: 'Punched Ledger Frame',
      category: 'Borders & Outlines',
      description: 'Panel framed as a page torn from a binder — three punched holes cut down the left edge from one stacked box-shadow, a red margin rule beside them and faint horizontal rules across the plate, sliding free of the rings on hover.',
      html, css,
      tags: ['ledger', 'binder', 'punched', 'margin', 'page'],
    }))
  }

  /* BO4. Callout tail — the hairline stays continuous around the pointer */
  {
    const c = cls('v14-bo-callout')
    const html = `<div class="${c}"><b>Keyboard shortcut</b><em>Press ⌘K to search</em><i class="tl"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 216px;
  margin-bottom: 10px;
  padding: 0.6rem 0.75rem 0.65rem;
  border: 1px solid #3f6ea8;
  border-radius: 0.5rem;
  background: #101c33;
  font-family: system-ui, sans-serif;
}
.${c} b {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #e2e8f0;
}
.${c} em {
  display: block;
  margin-top: 0.15rem;
  font-style: normal;
  font-size: 0.63rem;
  color: #7dd3fc;
}
.${c} .tl {
  position: absolute;
  left: 22px;
  bottom: -7px;
  width: 12px;
  height: 12px;
  background: #101c33;
  border-right: 1px solid #3f6ea8;
  border-bottom: 1px solid #3f6ea8;
  border-bottom-right-radius: 2px;
  transform: rotate(45deg);
  transition: left 0.45s cubic-bezier(0.65, 0, 0.35, 1);
}
.${c}:hover .tl { left: 180px; }`
    add(mk({
      name: 'Callout Tail Frame',
      category: 'Borders & Outlines',
      description: 'Tooltip outline whose pointer is a rotated square carrying two of the four border sides, its fill blanking the panel stroke behind it so the hairline runs unbroken into the tail — which slides the length of the edge on hover.',
      html, css,
      tags: ['callout', 'tooltip', 'tail', 'pointer', 'outline'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Progress & Meters                                                   */
  /* ------------------------------------------------------------------ */

  /* PR1. Hourglass — the reading is the sand still in the top bulb */
  {
    const c = cls('v14-pr-hourglass')
    const html = `<div class="${c}"><div class="gl"><i class="cap"></i><div class="tp"><i></i></div><i class="st"></i><div class="bt"><i></i></div><i class="cap b"></i></div><span>4:12 left</span></div>`
    const css = `.${c} {
  display: grid;
  justify-items: center;
  gap: 0.4rem;
  padding: 0.7rem 1.1rem 0.6rem;
  border-radius: 0.6rem;
  background: #101a2e;
  border: 1px solid #253049;
  font-family: system-ui, sans-serif;
}
.${c} .gl {
  position: relative;
  width: 66px;
  height: 106px;
  transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
}
.${c} .gl::before,
.${c} .gl::after {
  content: '';
  position: absolute;
  top: 2px;
  bottom: 2px;
  width: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, #475569, #334155);
}
.${c} .gl::before { left: -5px; }
.${c} .gl::after { right: -5px; }
.${c} .cap {
  position: absolute;
  left: -6px;
  width: 78px;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(180deg, #64748b, #334155);
}
.${c} .cap { top: 0; }
.${c} .cap.b { top: auto; bottom: 0; }
.${c} .tp,
.${c} .bt {
  position: absolute;
  left: 0;
  width: 66px;
  height: 47px;
  overflow: hidden;
  background: rgba(148,163,184,0.10);
}
.${c} .tp {
  top: 6px;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}
.${c} .bt {
  bottom: 6px;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}
.${c} .tp i {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  background: linear-gradient(180deg, #fbbf24, #d97706);
  animation: ${c}-drain 6s linear infinite;
}
.${c} .bt i {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 6%;
  background: linear-gradient(180deg, #f59e0b, #b45309);
  animation: ${c}-heap 6s linear infinite;
}
.${c} .st {
  position: absolute;
  left: 50%;
  top: 44px;
  width: 2px;
  height: 26px;
  margin-left: -1px;
  background: repeating-linear-gradient(180deg, #fbbf24 0 3px, transparent 3px 7px);
  animation: ${c}-fall 0.32s linear infinite;
}
.${c} span {
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
  color: #fcd34d;
}
.${c}:hover .gl { transform: rotate(180deg); }
@keyframes ${c}-drain {
  0% { height: 100%; }
  100% { height: 22%; }
}
@keyframes ${c}-heap {
  0% { height: 6%; }
  100% { height: 78%; }
}
@keyframes ${c}-fall {
  0% { background-position: 0 0; }
  100% { background-position: 0 7px; }
}`
    add(mk({
      name: 'Hourglass Timer Meter',
      category: 'Progress & Meters',
      description: 'Remaining time read as sand rather than a bar — the level in the top cone drops while the heap in the bottom one builds, with a dashed grain stream falling through the waist and the whole glass turning over on hover.',
      html, css,
      tags: ['hourglass', 'timer', 'sand', 'countdown', 'meter'],
    }))
  }

  /* PR2. Odometer — mechanical wheels, the units one still turning */
  {
    const c = cls('v14-pr-odometer')
    const digits = '0123456789'
      .split('')
      .map((d) => `<em>${d}</em>`)
      .join('')
    const win = (v, roll) =>
      `<div class="d${roll ? ' rl' : ''}"${roll ? '' : ` style="--v:${v}"`}><u>${digits}<em>0</em></u></div>`
    const html = `<div class="${c}"><span class="lb">Requests today</span><div class="wr">${win(0)}${win(4)}${win(8)}${win(2)}${win(0, true)}</div></div>`
    const css = `.${c} {
  display: grid;
  justify-items: center;
  gap: 0.45rem;
  padding: 0.7rem 0.8rem 0.75rem;
  border-radius: 0.6rem;
  background: #101a2e;
  border: 1px solid #253049;
  font-family: system-ui, sans-serif;
}
.${c} .lb {
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
}
.${c} .wr {
  display: flex;
  gap: 3px;
  padding: 4px;
  border-radius: 0.35rem;
  background: #05080f;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.9), 0 0 0 1px #29354d;
}
.${c} .d {
  position: relative;
  width: 22px;
  height: 30px;
  overflow: hidden;
  border-radius: 0.15rem;
  background: #161d2b;
}
.${c} .d::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  background: linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 34%, rgba(0,0,0,0) 66%, rgba(0,0,0,0.75) 100%);
}
.${c} .d u {
  display: block;
  text-decoration: none;
  transform: translateY(calc(var(--v, 0) * -30px));
}
.${c} .d em {
  display: block;
  height: 30px;
  font-style: normal;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 30px;
  text-align: center;
  color: #e2e8f0;
  font-variant-numeric: tabular-nums;
}
.${c} .d.rl {
  background: #2a0d12;
}
.${c} .d.rl em { color: #fca5a5; }
.${c} .d.rl u {
  animation: ${c}-roll 1.6s linear infinite;
}
@keyframes ${c}-roll {
  0% { transform: translateY(0); }
  100% { transform: translateY(-300px); }
}`
    add(mk({
      name: 'Odometer Counter Meter',
      category: 'Progress & Meters',
      description: 'Running total shown on a mechanical counter — five digit wheels behind a shaded bezel, the four higher ones holding their reading while the red units wheel turns continuously through a strip that ends on a duplicate zero so the loop never jumps.',
      html, css,
      tags: ['odometer', 'counter', 'digits', 'mechanical', 'total'],
    }))
  }

  /* PR3. Waffle grid — one cell per percent */
  {
    const c = cls('v14-pr-waffle')
    const html = `<div class="${c}"><div class="gd">${'<i></i>'.repeat(100)}</div><div class="rd"><b>68<small>%</small></b><span>of quota</span><em>hover: +7</em></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.6rem;
  background: #101a2e;
  border: 1px solid #253049;
  font-family: system-ui, sans-serif;
}
.${c} .gd {
  flex: none;
  display: grid;
  grid-template-columns: repeat(10, 8px);
  gap: 2px;
}
.${c} .gd i {
  width: 8px;
  height: 8px;
  border-radius: 1px;
  background: #1c2740;
  transition: background 0.25s ease;
}
.${c} .gd i:nth-child(-n+68) {
  background: linear-gradient(160deg, #38bdf8, #6366f1);
}
.${c}:hover .gd i:nth-child(-n+75) {
  background: linear-gradient(160deg, #38bdf8, #6366f1);
}
.${c}:hover .gd i:nth-child(n+69):nth-child(-n+75) {
  background: #a5b4fc;
}
.${c} .rd {
  display: grid;
  gap: 0.1rem;
}
.${c} .rd b {
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1;
  color: #e2e8f0;
  font-variant-numeric: tabular-nums;
}
.${c} .rd small {
  font-size: 0.7rem;
  color: #64748b;
}
.${c} .rd span {
  font-size: 0.62rem;
  color: #94a3b8;
}
.${c} .rd em {
  margin-top: 0.2rem;
  font-style: normal;
  font-size: 0.56rem;
  letter-spacing: 0.04em;
  color: #475569;
}`
    add(mk({
      name: 'Waffle Grid Meter',
      category: 'Progress & Meters',
      description: 'Percentage drawn as a hundred-cell waffle, one square per point, sixty-eight of them lit in a blue-to-indigo run that stops part way through a row; hovering lights the next seven in a paler tint to preview the charge.',
      html, css,
      tags: ['waffle', 'grid', 'percent', 'quota', 'unit-chart'],
    }))
  }

  /* PR4. Variance — a signed reading either side of a zero line */
  {
    const c = cls('v14-pr-variance')
    const html = `<div class="${c}"><div class="hd"><span>Spend vs plan</span><span class="vl"><b class="a">+6.2%</b><b class="b">-3.4%</b></span></div><div class="tr"><i class="neg"></i><i class="pos"></i><i class="zero"></i><i class="tg"></i></div><div class="sc"><span>-20%</span><span>0</span><span>+20%</span></div></div>`
    const css = `.${c} {
  display: grid;
  gap: 0.45rem;
  width: 236px;
  padding: 0.7rem 0.75rem 0.75rem;
  border-radius: 0.6rem;
  background: #101a2e;
  border: 1px solid #253049;
  font-family: system-ui, sans-serif;
}
.${c} .hd {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 0.66rem;
  color: #94a3b8;
}
.${c} .vl {
  position: relative;
  display: block;
  width: 56px;
  height: 1em;
}
.${c} .vl b {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 0.8rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  transition: opacity 0.3s ease;
}
.${c} .vl .a { color: #fbbf24; opacity: 1; }
.${c} .vl .b { color: #34d399; opacity: 0; }
.${c} .tr {
  position: relative;
  height: 12px;
  border-radius: 6px;
  background: #1a2540;
  box-shadow: inset 0 0 0 1px #263551;
}
.${c} .tr i {
  position: absolute;
  top: 0;
  bottom: 0;
}
.${c} .pos {
  left: 50%;
  width: 15.5%;
  border-radius: 0 6px 6px 0;
  background: linear-gradient(90deg, #b45309, #fbbf24);
  transition: width 0.35s cubic-bezier(0.65, 0, 0.35, 1);
}
.${c} .neg {
  right: 50%;
  width: 0;
  border-radius: 6px 0 0 6px;
  background: linear-gradient(270deg, #047857, #34d399);
  transition: width 0.35s cubic-bezier(0.65, 0, 0.35, 1);
}
.${c} .zero {
  left: 50%;
  top: -4px;
  bottom: -4px;
  width: 1px;
  background: #94a3b8;
}
.${c} .tg {
  left: 70%;
  top: -4px;
  bottom: -4px;
  width: 0;
  border-left: 2px dashed #e2e8f0;
  opacity: 0.7;
}
.${c} .sc {
  display: flex;
  justify-content: space-between;
  font-size: 0.55rem;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
.${c}:hover .pos { width: 0; }
.${c}:hover .neg { width: 8.5%; }
.${c}:hover .vl .a { opacity: 0; }
.${c}:hover .vl .b { opacity: 1; }`
    add(mk({
      name: 'Variance Meter',
      category: 'Progress & Meters',
      description: 'Signed deviation read from a centre zero rather than from the left edge — the amber fill runs right of the line for over-plan and a green one runs left for under, with a dashed target marker and a readout that swaps sign as the value crosses on hover.',
      html, css,
      tags: ['variance', 'diverging', 'centre-zero', 'budget', 'signed'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Scroll & Sticky                                                     */
  /* ------------------------------------------------------------------ */

  /* SC1. Frozen corner — header row and first column pinned at once */
  {
    const c = cls('v14-sc-frozen')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May']
    const metrics = ['Sessions', 'Signups', 'Trials', 'Paid', 'Churn', 'MRR', 'Refunds', 'Tickets']
    const head = `<div class="ce cn">Metric</div>${months.map((m) => `<div class="ce hd">${m}</div>`).join('')}`
    const body = metrics
      .map(
        (m, r) =>
          `<div class="ce lb">${m}</div>${months
            .map((_, i) => `<div class="ce">${(r + 1) * 137 + i * 41}</div>`)
            .join('')}`,
      )
      .join('')
    const html = `<div class="${c}"><div class="gr">${head}${body}</div></div>`
    const css = `.${c} {
  width: 254px;
  height: 146px;
  overflow: auto;
  border-radius: 0.55rem;
  background: #0f1626;
  border: 1px solid #253049;
  font-family: system-ui, sans-serif;
  scrollbar-width: thin;
  scrollbar-color: #38bdf8 rgba(148,163,184,0.14);
}
.${c}::-webkit-scrollbar { width: 6px; height: 6px; }
.${c}::-webkit-scrollbar-thumb { background: #38bdf8; border-radius: 3px; }
.${c}::-webkit-scrollbar-track { background: rgba(148,163,184,0.14); }
.${c} .gr {
  display: grid;
  grid-template-columns: 74px repeat(5, 62px);
  width: max-content;
}
.${c} .ce {
  height: 26px;
  padding: 0 0.5rem;
  display: flex;
  align-items: center;
  font-size: 0.6rem;
  color: #cbd5e1;
  font-variant-numeric: tabular-nums;
  border-bottom: 1px solid #1a2437;
  white-space: nowrap;
}
.${c} .hd {
  position: sticky;
  top: 0;
  z-index: 2;
  font-weight: 600;
  color: #7dd3fc;
  background: #16223c;
  box-shadow: 0 1px 0 #2c3a58;
}
.${c} .lb {
  position: sticky;
  left: 0;
  z-index: 1;
  font-weight: 600;
  color: #e2e8f0;
  background: #131d33;
  box-shadow: 1px 0 0 #2c3a58;
}
.${c} .cn {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 3;
  font-weight: 600;
  color: #7dd3fc;
  background: #1b2a49;
  box-shadow: 1px 0 0 #2c3a58, 0 1px 0 #2c3a58;
}`
    add(mk({
      name: 'Frozen Grid Corner',
      category: 'Scroll & Sticky',
      description: 'Data grid frozen on both axes at once — the header row sticks to the top, the metric column sticks to the left, and the corner cell carries both offsets with a higher stacking order so it never slips under either.',
      html, css,
      tags: ['sticky', 'table', 'frozen', 'two-axis', 'grid'],
    }))
  }

  /* SC2. Sticky pile — cards clamped to staggered bottom offsets */
  {
    const c = cls('v14-sc-pile')
    const cards = [
      ['01', 'Plan the release', '#38bdf8'],
      ['02', 'Cut the branch', '#818cf8'],
      ['03', 'Run the suite', '#f472b6'],
      ['04', 'Ship it', '#34d399'],
    ]
    const html = `<div class="${c}"><div class="in">${cards
      .map(
        ([n, t, col], i) =>
          `<div class="cd c${i + 1}" style="--k:${col}"><p><span>${n}</span><b>${t}</b></p><u></u><u class="s"></u></div>`,
      )
      .join('')}<div class="sp"></div></div></div>`
    const css = `.${c} {
  width: 244px;
  height: 146px;
  overflow-y: auto;
  border-radius: 0.55rem;
  background: #0c1220;
  border: 1px solid #253049;
  font-family: system-ui, sans-serif;
  scrollbar-width: thin;
  scrollbar-color: #38bdf8 rgba(148,163,184,0.14);
}
.${c}::-webkit-scrollbar { width: 6px; }
.${c}::-webkit-scrollbar-thumb { background: #38bdf8; border-radius: 3px; }
.${c}::-webkit-scrollbar-track { background: rgba(148,163,184,0.14); }
.${c} .in {
  padding: 8px 9px;
}
.${c} .cd {
  position: sticky;
  height: 58px;
  margin-bottom: 18px;
  padding: 0.4rem 0.6rem 0.5rem;
  border-radius: 0.5rem;
  background: #16203a;
  border: 1px solid #2c3a58;
  border-top: 3px solid var(--k);
  box-shadow: 0 -7px 16px rgba(0,0,0,0.62);
}
.${c} .c1 { bottom: 78px; }
.${c} .c2 { bottom: 54px; }
.${c} .c3 { bottom: 30px; }
.${c} .c4 { bottom: 6px; }
.${c} .cd p {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin: 0;
  line-height: 15px;
}
.${c} .cd span {
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  color: var(--k);
}
.${c} .cd b {
  font-size: 0.72rem;
  font-weight: 600;
  color: #e2e8f0;
}
.${c} .cd u {
  display: block;
  width: 84%;
  height: 5px;
  margin-top: 0.45rem;
  border-radius: 3px;
  background: #253654;
}
.${c} .cd u.s { width: 56%; }
.${c} .sp { height: 30px; }`
    add(mk({
      name: 'Sticky Card Pile',
      category: 'Scroll & Sticky',
      description: 'Steps that clamp to four staggered bottom offsets, so at rest they sit piled at the foot of the scroller with twenty pixels of each showing and peel away one by one as the list scrolls past them.',
      html, css,
      tags: ['sticky', 'stack', 'pile', 'cards', 'staggered'],
    }))
  }

  /* SC3. Parallax layers — a scroll timeline moving three depths */
  {
    const c = cls('v14-sc-parallax')
    const html = `<div class="${c}"><div class="sky"><i class="sun"></i><i class="far"></i><i class="mid"></i><i class="near"></i></div><div class="bd"><div class="cd"><b>Above the fold</b><u></u><u class="s"></u></div><p></p><p></p><p class="s"></p><p></p><p></p><p class="s"></p></div></div>`
    const css = `.${c} {
  position: relative;
  width: 246px;
  height: 146px;
  overflow-y: auto;
  border-radius: 0.55rem;
  background: linear-gradient(180deg, #10203f, #0a132a);
  border: 1px solid #253049;
  font-family: system-ui, sans-serif;
  scrollbar-width: none;
}
.${c}::-webkit-scrollbar { display: none; }
.${c} .sky {
  position: sticky;
  top: 0;
  z-index: 0;
  height: 146px;
  margin-bottom: -146px;
  overflow: hidden;
  background: linear-gradient(180deg, #142a52 0%, #1e3a63 55%, #2a4a72 100%);
}
.${c} .sky i {
  position: absolute;
  animation-timing-function: linear;
  animation-fill-mode: both;
  animation-timeline: scroll(nearest block);
}
.${c} .sky i.far,
.${c} .sky i.mid,
.${c} .sky i.near {
  left: -10%;
  width: 120%;
}
.${c} .sky i.sun {
  left: 62%;
  top: 14px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fcd34d;
  box-shadow: 0 0 22px rgba(252,211,77,0.45);
  animation-name: ${c}-p1;
}
.${c} .far {
  top: 54px;
  height: 92px;
  background: #2b4a79;
  clip-path: polygon(0 46%, 16% 16%, 33% 44%, 52% 8%, 71% 40%, 88% 20%, 100% 44%, 100% 100%, 0 100%);
  animation-name: ${c}-p2;
}
.${c} .mid {
  top: 78px;
  height: 90px;
  background: #1c3559;
  clip-path: polygon(0 52%, 22% 20%, 44% 50%, 66% 22%, 86% 48%, 100% 30%, 100% 100%, 0 100%);
  animation-name: ${c}-p3;
}
.${c} .near {
  top: 106px;
  height: 90px;
  background: #0d1c33;
  clip-path: polygon(0 44%, 26% 12%, 55% 42%, 78% 16%, 100% 40%, 100% 100%, 0 100%);
  animation-name: ${c}-p4;
}
.${c} .bd {
  position: relative;
  z-index: 1;
  padding: 96px 12px 14px;
}
.${c} .cd {
  padding: 0.55rem 0.65rem 0.6rem;
  border-radius: 0.5rem;
  background: rgba(10,16,32,0.86);
  border: 1px solid #2c3a58;
  backdrop-filter: blur(2px);
}
.${c} .cd b {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #e2e8f0;
}
.${c} .cd u {
  display: block;
  width: 100%;
  height: 5px;
  margin-top: 0.4rem;
  border-radius: 3px;
  background: #2c3a58;
}
.${c} .cd u.s { width: 62%; }
.${c} .bd p {
  margin: 10px 0 0;
  height: 6px;
  border-radius: 3px;
  background: #1c2740;
}
.${c} .bd p.s { width: 66%; }
@keyframes ${c}-p1 { to { transform: translateY(-6px); } }
@keyframes ${c}-p2 { to { transform: translateY(-14px); } }
@keyframes ${c}-p3 { to { transform: translateY(-36px); } }
@keyframes ${c}-p4 { to { transform: translateY(-72px); } }`
    add(mk({
      name: 'Parallax Depth Scroller',
      category: 'Scroll & Sticky',
      description: 'Three ridge layers and a sun pinned behind the copy, each one driven by the scroller’s own scroll timeline at a different rate, so the near ridge travels five times further than the far one as the article moves over them.',
      html, css,
      tags: ['parallax', 'scroll-timeline', 'layers', 'depth', 'sticky'],
    }))
  }

  /* SC4. Delivery spine — milestones tick off as they cross a read line */
  {
    const c = cls('v14-sc-spine')
    const steps = [
      ['Order placed', '09:12'],
      ['Payment cleared', '09:14'],
      ['Packed at depot', '11:40'],
      ['In transit', '14:02'],
      ['Out for delivery', '07:35'],
      ['Delivered', '—'],
    ]
    const html = `<div class="${c}"><div class="in"><i class="rl"></i>${steps
      .map(([t, at]) => `<div class="ev"><i class="dt"></i><b>${t}</b><span>${at}</span></div>`)
      .join('')}</div></div>`
    const css = `.${c} {
  width: 246px;
  height: 146px;
  overflow-y: auto;
  border-radius: 0.55rem;
  background: #0f1626;
  border: 1px solid #253049;
  font-family: system-ui, sans-serif;
  scrollbar-width: none;
}
.${c}::-webkit-scrollbar { display: none; }
.${c} .in {
  position: relative;
  padding: 12px 12px 14px 34px;
}
.${c} .in::before,
.${c} .in::after {
  content: '';
  position: absolute;
  left: 17px;
  top: 18px;
  bottom: 20px;
  width: 2px;
  border-radius: 1px;
}
.${c} .in::before { background: #1e293b; }
.${c} .in::after {
  background: linear-gradient(180deg, #38bdf8, #818cf8);
  transform-origin: top;
  transform: scaleY(0.08);
  animation: ${c}-fill linear both;
  animation-timeline: scroll(nearest block);
}
.${c} .rl {
  position: sticky;
  top: 80px;
  z-index: 2;
  display: block;
  height: 0;
  margin: 0 -12px -1px -34px;
  border-top: 1px dashed rgba(56,189,248,0.35);
}
.${c} .ev {
  position: relative;
  min-height: 34px;
  padding-bottom: 10px;
}
.${c} .dt {
  position: absolute;
  left: -23px;
  top: 3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #0f1626;
  box-shadow: inset 0 0 0 2px #334155;
  animation: ${c}-tick linear both;
  animation-timeline: view(block);
  animation-range: cover 33% cover 43%;
}
.${c} .ev b {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  color: #cbd5e1;
}
.${c} .ev span {
  display: block;
  font-size: 0.58rem;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
@keyframes ${c}-fill {
  from { transform: scaleY(0.08); }
  to { transform: scaleY(1); }
}
@keyframes ${c}-tick {
  from { background: #0f1626; box-shadow: inset 0 0 0 2px #334155; }
  to { background: #38bdf8; box-shadow: inset 0 0 0 2px #38bdf8, 0 0 10px rgba(56,189,248,0.6); }
}`
    add(mk({
      name: 'Scroll Spine Timeline',
      category: 'Scroll & Sticky',
      description: 'Delivery tracker whose spine fills from the scroller’s own scroll timeline while each milestone dot lights on its own view timeline as it crosses the dashed read line pinned across the pane.',
      html, css,
      tags: ['scroll-timeline', 'view-timeline', 'timeline', 'milestones', 'sticky'],
    }))
  }
}
