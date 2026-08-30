// scripts/generate-effects-v13-c.mjs
//
// Thirteenth wave, part C: Tooltips & Popovers, Entrance Animations,
// Avatars & Images, Modals & Overlays. Four designs each.
//
// Shape-budget group: "thinning" for all four.
//
//   Tooltips  — copy hint, notification popover, selection toolbar,
//               price breakdown
//   Entrance  — radial fan, roll-in, shutter split, wave columns
//   Avatars   — initials, ken burns, gallery dim, cover banner
//   Modals    — type-to-confirm, settings, success, shortcut sheet
//
// Entrance animations run once with `both`, matching the rest of that
// category — they are entrances, not loops.

export function generateV13C(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Tooltips & Popovers                                                 */
  /* ------------------------------------------------------------------ */

  /* TT1. Copy hint — a token whose tooltip changes wording while pressed */
  {
    const c = cls('v13-tt-copyhint')
    const html = `<span class="${c}"><code>npx hoverlab add glow-pill</code><em class="a">Click to copy</em><em class="b">Copied ✓</em></span>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding: 0.4rem 0.7rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  color: #c7d2fe;
  background: #161f38;
  border: 1px solid #2b3a5c;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.${c} em {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translate(-50%, 4px);
  padding: 0.22rem 0.5rem;
  font-family: system-ui, sans-serif;
  font-style: normal;
  font-size: 0.66rem;
  white-space: nowrap;
  border-radius: 0.3rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.22s ease;
}
.${c} em::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -4px;
  border: 4px solid transparent;
}
.${c} .a { background: #e2e8f0; color: #0f172a; }
.${c} .a::after { border-top-color: #e2e8f0; }
.${c} .b { background: #34d399; color: #052e16; font-weight: 600; }
.${c} .b::after { border-top-color: #34d399; }
.${c}:hover { border-color: #4f46e5; background: #1b2542; }
.${c}:hover .a { opacity: 1; transform: translate(-50%, 0); }
.${c}:active .a { opacity: 0; transform: translate(-50%, -4px); }
.${c}:active .b { opacity: 1; transform: translate(-50%, 0); }`
    add(mk({
      name: 'Copy Hint Tooltip',
      category: 'Tooltips & Popovers',
      description: 'Command token whose tooltip reads "click to copy" on hover and swaps for a green confirmation while the press is held.',
      html, css,
      tags: ['tooltip', 'copy', 'swap', 'code', 'confirm'],
    }))
  }

  /* TT2. Notification popover — a bell with an unread list beneath it */
  {
    const c = cls('v13-tt-notif')
    const html = `<div class="${c}"><button><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 15V10a6 6 0 10-12 0v5l-2 3h16z"/><path d="M10 21h4"/></svg><i>3</i></button><div class="p"><b>Notifications</b><a class="u"><span></span><div>Deploy finished<small>2 min ago</small></div></a><a class="u"><span></span><div>New comment on #418<small>18 min ago</small></div></a><a><span></span><div>Invoice paid<small>Yesterday</small></div></a></div></div>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding-bottom: 0.2rem;
}
.${c} button {
  position: relative;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: #cbd5e1;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.${c} button i {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 16px;
  height: 16px;
  font-style: normal;
  font-size: 0.6rem;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  color: #fff;
  background: #ef4444;
  border: 2px solid #0b1020;
  border-radius: 999px;
}
.${c} button:hover { background: #334155; color: #fff; }
.${c} .p {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 196px;
  padding: 0.5rem;
  background: #131a2b;
  border: 1px solid #253049;
  border-radius: 0.6rem;
  box-shadow: 0 18px 36px rgba(0,0,0,0.5);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-6px);
  transition: opacity 0.2s ease, transform 0.24s ease, visibility 0.24s;
}
.${c} .p b {
  display: block;
  padding: 0 0.35rem 0.4rem;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}
.${c} .p a {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  padding: 0.35rem;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: background 0.16s ease;
}
.${c} .p a span {
  flex: none;
  width: 6px;
  height: 6px;
  margin-top: 5px;
  border-radius: 50%;
  background: transparent;
}
.${c} .p .u span { background: #38bdf8; }
.${c} .p a div { display: grid; font-size: 0.72rem; color: #e2e8f0; }
.${c} .p a small { font-size: 0.62rem; color: #64748b; }
.${c} .p a:hover { background: #1c2740; }
.${c}:hover .p { opacity: 1; visibility: visible; transform: translateY(0); }`
    add(mk({
      name: 'Notification Popover',
      category: 'Tooltips & Popovers',
      description: 'Bell button with an unread count badge that opens a right-aligned panel of notifications, unread rows marked by a blue dot.',
      html, css,
      tags: ['notifications', 'bell', 'popover', 'badge', 'list'],
    }))
  }

  /* TT3. Selection toolbar — a formatting bubble over highlighted text */
  {
    const c = cls('v13-tt-selection')
    const html = `<p class="${c}">Drag across <mark>this phrase<span class="tb"><b>B</b><i>I</i><u>U</u><em>🔗</em><s>“”</s></span></mark> to format it.</p>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  margin: 0;
  padding: 1.6rem 0 0;
  font-size: 0.82rem;
  line-height: 1.6;
  color: #cbd5e1;
}
.${c} mark {
  position: relative;
  color: #e0f2fe;
  background: rgba(56,189,248,0.28);
  border-radius: 2px;
  padding: 0 1px;
}
.${c} .tb {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 3px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.45rem;
  box-shadow: 0 10px 24px rgba(0,0,0,0.55);
  transform: translate(-50%, 6px) scale(0.94);
  transform-origin: bottom center;
  opacity: 0;
  transition: opacity 0.18s ease, transform 0.24s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} .tb::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border: 5px solid transparent;
  border-top-color: #334155;
}
.${c} .tb > * {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  font-size: 0.7rem;
  font-style: normal;
  text-decoration: none;
  color: #94a3b8;
  border-radius: 0.3rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.${c} .tb b { font-weight: 800; }
.${c} .tb i { font-family: Georgia, serif; font-style: italic; }
.${c} .tb u { text-decoration: underline; }
.${c} .tb > *:hover { background: #1e293b; color: #f1f5f9; }
.${c}:hover .tb,
.${c} mark:hover .tb { opacity: 1; transform: translate(-50%, 0) scale(1); }`
    add(mk({
      name: 'Selection Toolbar',
      category: 'Tooltips & Popovers',
      description: 'Floating format bubble that pops above a highlighted phrase with bold, italic, underline, link and quote controls.',
      html, css,
      tags: ['selection', 'toolbar', 'bubble', 'editor', 'format'],
    }))
  }

  /* TT4. Breakdown popover — hovering a total itemises it */
  {
    const c = cls('v13-tt-breakdown')
    const html = `<span class="${c}"><b>$116.40</b><div class="p"><div><span>Pro licence</span><em>$79.00</em></div><div><span>Extra seats × 2</span><em>$18.00</em></div><div><span>VAT 20%</span><em>$19.40</em></div><hr><div class="t"><span>Total</span><em>$116.40</em></div></div></span>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding-bottom: 2px;
  border-bottom: 1px dashed #64748b;
  cursor: help;
}
.${c} > b {
  font-size: 1.05rem;
  font-weight: 700;
  color: #f1f5f9;
}
.${c} .p {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  width: 178px;
  padding: 0.6rem 0.7rem;
  font-size: 0.72rem;
  color: #cbd5e1;
  background: #111a2e;
  border: 1px solid #29344d;
  border-radius: 0.55rem;
  box-shadow: 0 16px 32px rgba(0,0,0,0.5);
  opacity: 0;
  visibility: hidden;
  transform: translate(-50%, 6px);
  transition: opacity 0.2s ease, transform 0.26s cubic-bezier(0.34, 1.3, 0.64, 1), visibility 0.26s;
}
.${c} .p::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -6px;
  border: 6px solid transparent;
  border-top-color: #29344d;
}
.${c} .p div { display: flex; justify-content: space-between; padding: 0.12rem 0; }
.${c} .p em { font-style: normal; color: #e2e8f0; }
.${c} .p span { color: #94a3b8; }
.${c} .p hr { border: none; border-top: 1px solid #29344d; margin: 0.4rem 0; }
.${c} .p .t span,
.${c} .p .t em { color: #7dd3fc; font-weight: 700; }
.${c}:hover .p { opacity: 1; visibility: visible; transform: translate(-50%, 0); }`
    add(mk({
      name: 'Breakdown Popover',
      category: 'Tooltips & Popovers',
      description: 'Dashed-underlined total that opens an itemised popover of line charges and tax, with the grand total repeated at the foot.',
      html, css,
      tags: ['popover', 'breakdown', 'pricing', 'itemised', 'help'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Entrance Animations                                                 */
  /* ------------------------------------------------------------------ */

  /* EN1. Radial fan — chips swing out around a shared pivot */
  {
    const c = cls('v13-ent-fan')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><b>+</b></div>`
    const css = `.${c} {
  position: relative;
  width: 150px;
  height: 110px;
  display: grid;
  place-items: end center;
}
.${c} b {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  font-size: 1.2rem;
  color: #0f172a;
  background: #f8fafc;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.${c} i {
  position: absolute;
  bottom: 8px;
  left: 50%;
  width: 26px;
  height: 26px;
  margin-left: -13px;
  border-radius: 50%;
  transform-origin: 50% 100%;
  animation: ${c}-fan 0.75s cubic-bezier(0.34, 1.4, 0.64, 1) both;
}
.${c} i:nth-child(1) { background: #f472b6; --a: -68deg; --d: 62px; animation-delay: 0.04s; }
.${c} i:nth-child(2) { background: #fbbf24; --a: -34deg; --d: 70px; animation-delay: 0.10s; }
.${c} i:nth-child(3) { background: #34d399; --a: 0deg;   --d: 74px; animation-delay: 0.16s; }
.${c} i:nth-child(4) { background: #38bdf8; --a: 34deg;  --d: 70px; animation-delay: 0.22s; }
.${c} i:nth-child(5) { background: #a78bfa; --a: 68deg;  --d: 62px; animation-delay: 0.28s; }
@keyframes ${c}-fan {
  0%   { opacity: 0; transform: rotate(0deg) translateY(0) scale(0.4); }
  100% { opacity: 1; transform: rotate(var(--a)) translateY(calc(var(--d) * -1)) scale(1); }
}`
    add(mk({
      name: 'Radial Fan Entrance',
      category: 'Entrance Animations',
      description: 'Coloured chips swing out one after another from behind a central button, arriving on an arc above it.',
      html, css,
      tags: ['fan', 'radial', 'stagger', 'arc', 'speed-dial'],
    }))
  }

  /* EN2. Roll in — the panel rolls in from the side while unrotating */
  {
    const c = cls('v13-ent-roll')
    const html = `<div class="${c}"><span></span><div><b>Rolled in</b><small>360° on the way</small></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 208px;
  padding: 0.7rem 0.85rem;
  background: #151d31;
  border: 1px solid #29344d;
  border-radius: 0.65rem;
  color: #cbd5e1;
  animation: ${c}-roll 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.${c} span {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: conic-gradient(#f97316, #fbbf24, #f97316);
}
.${c} b { display: block; font-size: 0.82rem; color: #f1f5f9; }
.${c} small { font-size: 0.66rem; color: #64748b; }
@keyframes ${c}-roll {
  0%   { opacity: 0; transform: translateX(-130px) rotate(-300deg); }
  70%  { opacity: 1; }
  100% { opacity: 1; transform: translateX(0) rotate(0deg); }
}`
    add(mk({
      name: 'Roll In Entrance',
      category: 'Entrance Animations',
      description: 'Panel that rolls in from the left, spinning almost a full turn before it settles level.',
      html, css,
      tags: ['roll', 'rotate', 'slide', 'entrance', 'panel'],
    }))
  }

  /* EN3. Shutter split — two halves part to uncover the content */
  {
    const c = cls('v13-ent-shutter')
    const html = `<div class="${c}"><b>REVEALED</b><i class="t"></i><i class="b"></i></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 200px;
  height: 92px;
  overflow: hidden;
  background: #101728;
  border: 1px solid #29344d;
  border-radius: 0.6rem;
}
.${c} b {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: #7dd3fc;
  opacity: 0;
  animation: ${c}-in 0.5s ease 0.45s both;
}
.${c} i {
  position: absolute;
  left: 0;
  right: 0;
  height: 50%;
  background: #1e293b;
  border-bottom: 1px solid #38bdf8;
}
.${c} .t { top: 0; animation: ${c}-up 0.7s cubic-bezier(0.7, 0, 0.2, 1) 0.25s both; }
.${c} .b { bottom: 0; border-bottom: none; border-top: 1px solid #38bdf8; animation: ${c}-down 0.7s cubic-bezier(0.7, 0, 0.2, 1) 0.25s both; }
@keyframes ${c}-up   { 0% { transform: translateY(0); } 100% { transform: translateY(-101%); } }
@keyframes ${c}-down { 0% { transform: translateY(0); } 100% { transform: translateY(101%); } }
@keyframes ${c}-in   { 0% { opacity: 0; letter-spacing: 0.5em; } 100% { opacity: 1; letter-spacing: 0.16em; } }`
    add(mk({
      name: 'Shutter Split Entrance',
      category: 'Entrance Animations',
      description: 'A panel closed by two lit shutters that part vertically, the heading tightening its letter-spacing as it appears behind them.',
      html, css,
      tags: ['shutter', 'split', 'reveal', 'curtain', 'heading'],
    }))
  }

  /* EN4. Wave columns — bars rise in a travelling order, not left to right */
  {
    const c = cls('v13-ent-wavecol')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: flex-end;
  gap: 7px;
  height: 96px;
  padding: 0 4px;
}
.${c} i {
  display: block;
  width: 16px;
  border-radius: 4px 4px 2px 2px;
  background: linear-gradient(180deg, #a78bfa, #6366f1);
  transform-origin: bottom;
  animation: ${c}-rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.${c} i:nth-child(1) { height: 34px; animation-delay: 0.00s; }
.${c} i:nth-child(2) { height: 56px; animation-delay: 0.16s; }
.${c} i:nth-child(3) { height: 78px; animation-delay: 0.32s; }
.${c} i:nth-child(4) { height: 92px; animation-delay: 0.24s; }
.${c} i:nth-child(5) { height: 70px; animation-delay: 0.08s; }
.${c} i:nth-child(6) { height: 48px; animation-delay: 0.20s; }
.${c} i:nth-child(7) { height: 30px; animation-delay: 0.36s; }
@keyframes ${c}-rise {
  0%   { opacity: 0; transform: scaleY(0.05) translateY(10px); }
  100% { opacity: 1; transform: scaleY(1) translateY(0); }
}`
    add(mk({
      name: 'Wave Column Rise',
      category: 'Entrance Animations',
      description: 'Bar columns growing up from the baseline in a scattered order rather than left to right, so the group arrives as a wave.',
      html, css,
      tags: ['columns', 'rise', 'stagger', 'wave', 'chart'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Avatars & Images                                                    */
  /* ------------------------------------------------------------------ */

  /* AV1. Initials — text fallback avatars with per-person hue */
  {
    const c = cls('v13-av-initials')
    const html = `<div class="${c}"><span class="a">RK</span><span class="b">MT</span><span class="d">JO</span><span class="e">+7</span></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.45rem;
}
.${c} span {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  border-radius: 0.85rem;
  cursor: default;
  transition: transform 0.25s cubic-bezier(0.34, 1.5, 0.64, 1), border-radius 0.25s ease, box-shadow 0.25s ease;
}
.${c} .a { color: #082f49; background: linear-gradient(140deg, #7dd3fc, #38bdf8); }
.${c} .b { color: #4a044e; background: linear-gradient(140deg, #f5d0fe, #e879f9); }
.${c} .d { color: #052e16; background: linear-gradient(140deg, #bbf7d0, #4ade80); }
.${c} .e { color: #cbd5e1; background: #263248; border: 1px dashed #475569; }
.${c} span:hover {
  transform: translateY(-4px);
  border-radius: 50%;
  box-shadow: 0 8px 18px rgba(0,0,0,0.45);
}`
    add(mk({
      name: 'Initials Avatar',
      category: 'Avatars & Images',
      description: 'Squircle initial avatars in per-person gradients, each rounding to a full circle and lifting when hovered.',
      html, css,
      tags: ['initials', 'fallback', 'squircle', 'gradient', 'team'],
    }))
  }

  /* AV2. Ken Burns — a slow pan and zoom over a tile */
  {
    const c = cls('v13-av-kenburns')
    const html = `<figure class="${c}"><i></i><figcaption>Harbour, 6:12am</figcaption></figure>`
    const css = `.${c} {
  position: relative;
  width: 210px;
  height: 128px;
  margin: 0;
  border-radius: 0.7rem;
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(148,163,184,0.2);
}
.${c} i {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 60% at 25% 30%, rgba(251,191,36,0.7), transparent 60%),
    radial-gradient(70% 70% at 80% 70%, rgba(56,189,248,0.6), transparent 60%),
    linear-gradient(160deg, #1e1b4b, #0f172a 55%, #172554);
  transform-origin: 30% 40%;
  animation: ${c}-pan 14s ease-in-out infinite alternate;
}
.${c} figcaption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1.4rem 0.7rem 0.55rem;
  font-size: 0.7rem;
  color: #e2e8f0;
  background: linear-gradient(transparent, rgba(2,6,23,0.85));
}
@keyframes ${c}-pan {
  0%   { transform: scale(1.02) translate(0, 0); }
  100% { transform: scale(1.28) translate(-4%, 3%); }
}`
    add(mk({
      name: 'Ken Burns Tile',
      category: 'Avatars & Images',
      description: 'Image tile under a slow Ken Burns pan and zoom that reverses at each end, with a gradient caption pinned to the foot.',
      html, css,
      tags: ['ken-burns', 'pan', 'zoom', 'caption', 'documentary'],
    }))
  }

  /* AV3. Gallery dim — hovering one tile dims the rest of the grid */
  {
    const c = cls('v13-av-gallerydim')
    const html = `<div class="${c}"><i class="a"></i><i class="b"></i><i class="d"></i><i class="e"></i><i class="f"></i><i class="g"></i></div>`
    const css = `.${c} {
  display: grid;
  grid-template-columns: repeat(3, 64px);
  grid-auto-rows: 56px;
  gap: 6px;
}
.${c} i {
  display: block;
  border-radius: 0.5rem;
  transition: filter 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}
.${c} .a { background: linear-gradient(140deg, #f472b6, #be185d); }
.${c} .b { background: linear-gradient(140deg, #38bdf8, #0369a1); }
.${c} .d { background: linear-gradient(140deg, #fbbf24, #b45309); }
.${c} .e { background: linear-gradient(140deg, #34d399, #047857); }
.${c} .f { background: linear-gradient(140deg, #a78bfa, #6d28d9); }
.${c} .g { background: linear-gradient(140deg, #94a3b8, #334155); }
.${c}:hover i { filter: grayscale(0.85) brightness(0.5); }
.${c} i:hover {
  filter: none;
  transform: scale(1.12);
  box-shadow: 0 10px 24px rgba(0,0,0,0.55);
  z-index: 1;
}`
    add(mk({
      name: 'Gallery Dim Spotlight',
      category: 'Avatars & Images',
      description: 'Thumbnail grid where hovering anywhere greys the whole set, and the tile under the cursor keeps its colour and grows.',
      html, css,
      tags: ['gallery', 'dim', 'spotlight', 'grid', 'grayscale'],
    }))
  }

  /* AV4. Cover banner — an avatar straddling the edge of a cover image */
  {
    const c = cls('v13-av-cover')
    const html = `<div class="${c}"><div class="c"></div><div class="a"></div><div class="m"><b>Rae Kimura</b><small>Design engineer · Kyoto</small></div></div>`
    const css = `.${c} {
  width: 214px;
  background: #131a2b;
  border: 1px solid #253049;
  border-radius: 0.7rem;
  overflow: hidden;
  text-align: center;
}
.${c} .c {
  height: 62px;
  background:
    radial-gradient(70% 120% at 20% 0%, #f472b6, transparent 60%),
    radial-gradient(70% 120% at 90% 20%, #38bdf8, transparent 65%),
    linear-gradient(120deg, #4c1d95, #0f172a);
  background-size: 130% 130%;
  transition: background-position 0.6s ease, filter 0.4s ease;
}
.${c} .a {
  width: 52px;
  height: 52px;
  margin: -26px auto 0;
  border-radius: 50%;
  background: linear-gradient(150deg, #fbbf24, #f97316);
  border: 3px solid #131a2b;
  transition: transform 0.35s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.${c} .m { padding: 0.4rem 0.7rem 0.85rem; }
.${c} b { display: block; font-size: 0.84rem; color: #f1f5f9; }
.${c} small { font-size: 0.66rem; color: #64748b; }
.${c}:hover .c { background-position: 100% 100%; filter: saturate(1.2); }
.${c}:hover .a { transform: scale(1.08) translateY(-2px); }`
    add(mk({
      name: 'Cover Banner Avatar',
      category: 'Avatars & Images',
      description: 'Profile header with a gradient cover that shifts on hover while the circular avatar straddling its edge lifts and grows.',
      html, css,
      tags: ['cover', 'banner', 'profile', 'avatar', 'header'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Modals & Overlays                                                   */
  /* ------------------------------------------------------------------ */

  /* MO1. Type-to-confirm — destructive dialog gated on typing a name */
  {
    const c = cls('v13-mo-typeconfirm')
    const html = `<div class="${c}"><b>Delete project</b><p>Type <code>atlas-web</code> to confirm.</p><input type="text" placeholder="atlas-web" /><div class="r"><em>Cancel</em><button>Delete forever</button></div></div>`
    const css = `.${c} {
  width: 226px;
  padding: 0.9rem;
  background: #150f14;
  border: 1px solid #4c1d24;
  border-radius: 0.7rem;
  box-shadow: 0 20px 44px rgba(0,0,0,0.6);
  color: #fecdd3;
}
.${c} b { display: block; font-size: 0.9rem; color: #fda4af; }
.${c} p { margin: 0.3rem 0 0.5rem; font-size: 0.7rem; line-height: 1.45; color: #cbb0b4; }
.${c} code { font-family: ui-monospace, monospace; color: #fecdd3; background: rgba(244,63,94,0.14); padding: 0 3px; border-radius: 3px; }
.${c} input {
  width: 100%;
  padding: 0.4rem 0.55rem;
  font: inherit;
  font-family: ui-monospace, monospace;
  font-size: 0.74rem;
  color: #fff1f2;
  background: #1d1116;
  border: 1px solid #4c1d24;
  border-radius: 0.4rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c} input::placeholder { color: #7f4a55; }
.${c} input:focus { border-color: #f43f5e; box-shadow: 0 0 0 3px rgba(244,63,94,0.16); }
.${c} .r { display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; margin-top: 0.7rem; }
.${c} em { font-style: normal; font-size: 0.72rem; color: #a1858b; cursor: pointer; }
.${c} em:hover { color: #fecdd3; }
.${c} button {
  padding: 0.36rem 0.7rem;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 600;
  color: #7f1d1d;
  background: #6b2130;
  border: none;
  border-radius: 0.4rem;
  cursor: not-allowed;
  transition: background 0.25s ease, color 0.25s ease;
}
.${c} input:focus ~ .r button { background: #e11d48; color: #fff; cursor: pointer; }
.${c} input:focus ~ .r button:hover { background: #f43f5e; }`
    add(mk({
      name: 'Type-to-Confirm Dialog',
      category: 'Modals & Overlays',
      description: 'Destructive dialog whose delete button stays disabled and dull until the confirmation field is engaged, then turns live red.',
      html, css,
      tags: ['confirm', 'destructive', 'dialog', 'gated', 'danger'],
    }))
  }

  /* MO2. Settings modal — a sidebar of sections beside a pane */
  {
    const c = cls('v13-mo-settings')
    const html = `<div class="${c}"><aside><a class="on">General</a><a>Members</a><a>Billing</a><a>API</a></aside><section><b>General</b><label><span>Workspace name</span><i>Atlas</i></label><label><span>Region</span><i>eu-west-2</i></label><div class="s"><span>Public profile</span><u></u></div></section></div>`
    const css = `.${c} {
  display: flex;
  width: 254px;
  background: #131a2b;
  border: 1px solid #253049;
  border-radius: 0.7rem;
  overflow: hidden;
  box-shadow: 0 22px 46px rgba(0,0,0,0.55);
  font-size: 0.72rem;
  color: #cbd5e1;
}
.${c} aside {
  flex: none;
  width: 78px;
  display: grid;
  align-content: start;
  gap: 1px;
  padding: 0.45rem 0.3rem;
  background: #0f1626;
  border-right: 1px solid #253049;
}
.${c} aside a {
  padding: 0.32rem 0.45rem;
  border-radius: 0.3rem;
  color: #94a3b8;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} aside a:hover { background: #1a2437; color: #e2e8f0; }
.${c} aside .on { background: #1e293b; color: #7dd3fc; }
.${c} section { flex: 1; padding: 0.6rem 0.7rem 0.75rem; }
.${c} section b { display: block; font-size: 0.8rem; color: #f1f5f9; margin-bottom: 0.5rem; }
.${c} label { display: grid; gap: 2px; margin-bottom: 0.45rem; }
.${c} label span { font-size: 0.62rem; color: #64748b; }
.${c} label i {
  display: block;
  padding: 0.28rem 0.45rem;
  font-style: normal;
  color: #e2e8f0;
  background: #0f1626;
  border: 1px solid #29344d;
  border-radius: 0.3rem;
}
.${c} .s { display: flex; align-items: center; justify-content: space-between; margin-top: 0.55rem; }
.${c} .s u {
  position: relative;
  width: 30px;
  height: 17px;
  border-radius: 999px;
  background: #34d399;
  cursor: pointer;
}
.${c} .s u::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 15px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.24s ease;
}
.${c} .s u:hover::after { left: 13px; }`
    add(mk({
      name: 'Settings Modal',
      category: 'Modals & Overlays',
      description: 'Two-pane settings dialog with a section rail on the left and the active pane on the right, fields and a switch included.',
      html, css,
      tags: ['settings', 'modal', 'two-pane', 'sidebar', 'preferences'],
    }))
  }

  /* MO3. Success modal — a drawn tick with a halo that keeps breathing */
  {
    const c = cls('v13-mo-success')
    const html = `<div class="${c}"><div class="k"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 7"/></svg></div><b>Payment received</b><p>Your Pro licence is active.</p><button>Nice</button></div>`
    const css = `.${c} {
  width: 210px;
  padding: 0.85rem 0.9rem 0.8rem;
  text-align: center;
  background: #0f1a17;
  border: 1px solid #1f4038;
  border-radius: 0.8rem;
  box-shadow: 0 22px 46px rgba(0,0,0,0.55);
  color: #d1fae5;
}
.${c} .k {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin: 0 auto 0.5rem;
  color: #052e16;
  background: #34d399;
  border-radius: 50%;
}
.${c} .k::before {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid rgba(52,211,153,0.5);
  animation: ${c}-halo 2.4s ease-out infinite;
}
.${c} b { display: block; font-size: 0.9rem; color: #a7f3d0; }
.${c} p { margin: 0.25rem 0 0.6rem; font-size: 0.7rem; line-height: 1.4; color: #6ee7b7; }
.${c} button {
  width: 100%;
  padding: 0.42rem 0;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  color: #052e16;
  background: #34d399;
  border: none;
  border-radius: 0.45rem;
  cursor: pointer;
  transition: background 0.2s ease;
}
.${c} button:hover { background: #6ee7b7; }
@keyframes ${c}-halo {
  0%       { transform: scale(0.85); opacity: 0.9; }
  70%,100% { transform: scale(1.35); opacity: 0; }
}`
    add(mk({
      name: 'Success Modal',
      category: 'Modals & Overlays',
      description: 'Confirmation dialog centred on a green tick disc that keeps sending a soft halo outward, with a single dismiss action.',
      html, css,
      tags: ['success', 'confirmation', 'tick', 'halo', 'dialog'],
    }))
  }

  /* MO4. Shortcut overlay — a keyboard cheatsheet dropped over the page */
  {
    const c = cls('v13-mo-shortcuts')
    const html = `<div class="${c}"><div class="h"><b>Keyboard shortcuts</b><kbd>esc</kbd></div><div class="r"><span>Command palette</span><div><kbd>⌘</kbd><kbd>K</kbd></div></div><div class="r"><span>Search effects</span><div><kbd>/</kbd></div></div><div class="r"><span>Copy CSS</span><div><kbd>⌘</kbd><kbd>⇧</kbd><kbd>C</kbd></div></div><div class="r"><span>Toggle theme</span><div><kbd>T</kbd></div></div></div>`
    const css = `.${c} {
  width: 236px;
  padding: 0.65rem 0.75rem 0.75rem;
  background: rgba(15,23,42,0.92);
  backdrop-filter: blur(8px);
  border: 1px solid #334155;
  border-radius: 0.7rem;
  box-shadow: 0 22px 48px rgba(0,0,0,0.6);
  color: #cbd5e1;
  font-size: 0.73rem;
}
.${c} .h {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.45rem;
  margin-bottom: 0.4rem;
  border-bottom: 1px solid #253049;
}
.${c} .h b { font-size: 0.8rem; color: #f1f5f9; }
.${c} .r {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.24rem 0.2rem;
  border-radius: 0.3rem;
  transition: background 0.16s ease;
}
.${c} .r:hover { background: #1c2740; }
.${c} .r div { display: flex; gap: 3px; }
.${c} kbd {
  display: inline-block;
  min-width: 18px;
  padding: 1px 5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.66rem;
  text-align: center;
  color: #e2e8f0;
  background: #1e293b;
  border: 1px solid #3b4a63;
  border-bottom-width: 2px;
  border-radius: 0.28rem;
}`
    add(mk({
      name: 'Shortcut Overlay',
      category: 'Modals & Overlays',
      description: 'Frosted cheatsheet panel listing keyboard shortcuts as keycaps, rows highlighting as the pointer runs down the list.',
      html, css,
      tags: ['shortcuts', 'keycaps', 'overlay', 'cheatsheet', 'frosted'],
    }))
  }
}
