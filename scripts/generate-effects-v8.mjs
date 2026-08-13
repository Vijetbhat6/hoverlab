// scripts/generate-effects-v8.mjs
//
// Eighth wave: a third pair of template families per category — twenty
// more each, 640 in total, on top of the 1,280 that v6 and v7 added.
//
// Where the shapes came from, since the obvious ones are long gone:
//
//   v6 took the missing basics and v7 took the second tier. What was
//   left divides into two kinds of gap. The first is *composite* shapes —
//   controls the catalog can nearly express but not in one piece: a
//   combobox is a tag input plus a dropdown, a speed dial is a button
//   plus a radial menu, a swipe row is a list item plus a revealed
//   action tray. The second is *domain* shapes the catalog had no reason
//   to draw until now: candlesticks, halftone screens, an ECG trace, a
//   thermal map.
//
//   Both kinds are still shapes rather than colorways, which is the bar
//   every wave has been held to. But this is the wave where a few
//   categories — Dividers, Badges, Skeletons — are working with what is
//   left rather than what is missing, and that is worth knowing when
//   reading the results.
//
// Same arithmetic throughout: `GRADPAIRS` (12) + `TRIOS` (8) = 20 per
// category. Tokens and helpers from generate-effects.mjs, dark preview
// surface, guards applied at assembly.

import { rgbOf } from './generate-effects-modern.mjs'

export function generateV8(ctx) {
  const { GRADPAIRS, TRIOS, cls, mk, add } = ctx

  /* ============================================================
   *  BUTTONS — floating action speed dial  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-btn-dial-${g.name}`)
    const html = `<div class="${c}"><button class="a a1"></button><button class="a a2"></button><button class="a a3"></button><button class="fab"><i></i><i></i></button></div>`
    const css = `.${c} {
  position: relative;
  width: 150px;
  height: 118px;
}
.${c} .fab {
  position: absolute;
  right: 0;
  bottom: 0;
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 8px 22px rgba(${rgbOf(g.a)}, 0.45);
  transition: transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} .fab i {
  position: absolute;
  border-radius: 1px;
  background: #0b1120;
  transition: transform 0.28s ease;
}
.${c} .fab i:first-child { width: 17px; height: 2.5px; }
.${c} .fab i:last-child  { width: 2.5px; height: 17px; }
.${c} .a {
  position: absolute;
  right: 11px;
  bottom: 11px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: #1e293b;
  box-shadow: inset 0 0 0 1px ${g.b};
  opacity: 0;
  transition: transform 0.32s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.22s ease;
}
.${c}:hover .fab { transform: rotate(135deg); }
.${c}:hover .a { opacity: 1; }
.${c}:hover .a1 { transform: translate(0, -62px); }
.${c}:hover .a2 { transform: translate(-44px, -44px); }
.${c}:hover .a3 { transform: translate(-62px, 0); }`
    add(mk({
      name: `${g.name} Speed Dial`,
      category: 'Buttons',
      description: `Floating action whose plus rotates into a cross while three satellites fan out along a quarter arc, each on its own translate.`,
      html, css,
      tags: ['button', 'fab', 'speed dial', 'radial', 'actions', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BUTTONS — icon toolbar group  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-btn-toolbar-${t.name}`)
    const html = `<div class="${c}"><button class="on"><i class="b"></i></button><button><i class="i"></i></button><button><i class="u"></i></button><span></span><button><i class="l"></i></button><button><i class="cn"></i></button></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.25rem;
  border-radius: 0.5rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 0.35rem;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.${c} button:hover { background: #1e293b; color: #e2e8f0; }
.${c} .on {
  color: #0b1120;
  background: linear-gradient(140deg, ${t.a}, ${t.b});
}
.${c} span {
  width: 1px;
  height: 18px;
  margin: 0 0.25rem;
  background: #1f2937;
}
.${c} i {
  display: block;
  font-style: normal;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1;
}
.${c} .b::after { content: 'B'; }
.${c} .i::after { content: 'I'; font-style: italic; }
.${c} .u::after { content: 'U'; text-decoration: underline; }
.${c} .l {
  width: 13px;
  height: 9px;
  background:
    linear-gradient(currentColor 0 0) 0 0/100% 1.5px no-repeat,
    linear-gradient(currentColor 0 0) 0 50%/70% 1.5px no-repeat,
    linear-gradient(currentColor 0 0) 0 100%/100% 1.5px no-repeat;
}
.${c} .cn {
  width: 13px;
  height: 9px;
  background:
    linear-gradient(currentColor 0 0) 50% 0/100% 1.5px no-repeat,
    linear-gradient(currentColor 0 0) 50% 50%/60% 1.5px no-repeat,
    linear-gradient(currentColor 0 0) 50% 100%/100% 1.5px no-repeat;
}`
    add(mk({
      name: `${t.name} Icon Toolbar`,
      category: 'Buttons',
      description: `Formatting cluster with a hairline separating groups, the alignment glyphs drawn from three background gradients rather than an icon font.`,
      html, css,
      tags: ['button', 'toolbar', 'group', 'editor', 'icons', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  LOADERS — chat typing indicator  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-load-typing-${g.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0.75rem 0.95rem;
  border-radius: 1rem 1rem 1rem 0.2rem;
  background: #1e293b;
}
.${c}::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 10px;
  height: 10px;
  background: #1e293b;
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
}
.${c} i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  animation: ${c}-bob 1.3s ease-in-out infinite;
}
.${c} i:nth-child(2) { animation-delay: 0.16s; }
.${c} i:nth-child(3) { animation-delay: 0.32s; }
@keyframes ${c}-bob {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
  30%           { transform: translateY(-6px); opacity: 1; }
}`
    add(mk({
      name: `${g.name} Typing Indicator`,
      category: 'Loaders',
      description: `Chat bubble with a clipped tail and three dots bobbing on a rolling delay, resting for most of the cycle so it does not read as frantic.`,
      html, css,
      tags: ['loader', 'typing', 'chat', 'dots', 'bubble', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  LOADERS — build log with step ticks  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-load-build-${t.name}`)
    const html = `<div class="${c}"><div class="l done"><i></i>Install dependencies</div><div class="l done"><i></i>Type check</div><div class="l now"><i></i>Bundle assets</div><div class="l"><i></i>Deploy</div></div>`
    const css = `.${c} {
  width: 262px;
  padding: 0.8rem 0.9rem;
  border-radius: 0.6rem;
  background: #0d1424;
  border: 1px solid #1f2937;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.74rem;
}
.${c} .l {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.22rem 0;
  color: #475569;
}
.${c} .l i {
  position: relative;
  flex: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px #334155;
}
.${c} .done { color: #94a3b8; }
.${c} .done i {
  background: ${t.a};
  box-shadow: none;
}
.${c} .done i::after {
  content: '';
  position: absolute;
  left: 4.5px;
  top: 2px;
  width: 3px;
  height: 6px;
  border: solid #0b1120;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}
.${c} .now { color: ${t.b}; }
.${c} .now i {
  border: 1.5px solid transparent;
  border-top-color: ${t.b};
  box-shadow: none;
  animation: ${c}-spin 0.75s linear infinite;
}
@keyframes ${c}-spin {
  to { transform: rotate(360deg); }
}`
    add(mk({
      name: `${t.name} Build Log`,
      category: 'Loaders',
      description: `Pipeline steps in monospace with completed ticks, one spinner on the running line, and pending steps dimmed rather than hidden.`,
      html, css,
      tags: ['loader', 'build', 'steps', 'ci', 'log', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CARDS — event card with a date block  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-card-event-${g.name}`)
    const html = `<article class="${c}"><time><b>14</b><span>MAR</span></time><div class="body"><b>Design systems meetup</b><span>18:30 · Shoreditch Works</span><em>32 going</em></div></article>`
    const css = `.${c} {
  display: flex;
  gap: 0.85rem;
  width: 272px;
  padding: 0.85rem;
  border-radius: 0.7rem;
  background: #111827;
  border: 1px solid #1f2937;
  transition: border-color 0.22s ease, transform 0.22s ease;
}
.${c}:hover {
  border-color: rgba(${rgbOf(g.a)}, 0.5);
  transform: translateX(3px);
}
.${c} time {
  flex: none;
  display: grid;
  place-items: center;
  align-content: center;
  width: 54px;
  height: 60px;
  border-radius: 0.5rem;
  background: linear-gradient(150deg, ${g.a}, ${g.b});
}
.${c} time b {
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1;
  color: #0b1120;
  font-variant-numeric: tabular-nums;
}
.${c} time span {
  margin-top: 0.15rem;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(11,17,32,0.7);
}
.${c} .body { min-width: 0; }
.${c} .body b {
  display: block;
  font-size: 0.85rem;
  color: #f1f5f9;
}
.${c} .body span {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.73rem;
  color: #64748b;
}
.${c} em {
  display: inline-block;
  margin-top: 0.45rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-style: normal;
  font-size: 0.66rem;
  font-weight: 600;
  color: ${g.b};
  background: rgba(${rgbOf(g.a)}, 0.12);
}`
    add(mk({
      name: `${g.name} Event Card`,
      category: 'Cards',
      description: `Listing led by a tear-off date block in a real \`<time>\`, so the day and month are one semantic unit rather than two decorated spans.`,
      html, css,
      tags: ['card', 'event', 'date', 'listing', 'calendar', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CARDS — notification card with an unread rail  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-card-notify-${t.name}`)
    const html = `<div class="${c}"><div class="n unread"><i>AW</i><div><b>Ada</b> requested review on <em>#482</em><span>4 min ago</span></div><u></u></div><div class="n"><i>JK</i><div><b>Jonas</b> approved your PR<span>2 hours ago</span></div></div></div>`
    const css = `.${c} {
  width: 280px;
  border-radius: 0.65rem;
  overflow: hidden;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} .n {
  position: relative;
  display: flex;
  gap: 0.65rem;
  padding: 0.75rem 0.85rem 0.75rem 0.9rem;
  transition: background 0.16s ease;
}
.${c} .n + .n { border-top: 1px solid #1f2937; }
.${c} .n:hover { background: #151f36; }
.${c} .unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(${t.a}, ${t.b});
}
.${c} .unread { background: rgba(${rgbOf(t.a)}, 0.05); }
.${c} i {
  flex: none;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-style: normal;
  font-size: 0.64rem;
  font-weight: 700;
  color: #0b1120;
  background: linear-gradient(140deg, ${t.b}, ${t.c});
}
.${c} div div, .${c} .n > div {
  flex: 1;
  font-size: 0.76rem;
  line-height: 1.45;
  color: #94a3b8;
}
.${c} b { color: #e2e8f0; font-weight: 600; }
.${c} em {
  font-style: normal;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  color: ${t.b};
}
.${c} span {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.67rem;
  color: #475569;
}
.${c} u {
  flex: none;
  align-self: center;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${t.a};
  box-shadow: 0 0 8px ${t.a};
}`
    add(mk({
      name: `${t.name} Notification Card`,
      category: 'Cards',
      description: `Inbox rows where unread state is carried by a left rail, a faint tint and a dot at once, so it survives being skimmed at any zoom.`,
      html, css,
      tags: ['card', 'notification', 'inbox', 'unread', 'feed', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TEXT — kinetic wave letters  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-text-kinetic-${g.name}`)
    const html = `<span class="${c}"><i>F</i><i>L</i><i>O</i><i>A</i><i>T</i><i>I</i><i>N</i><i>G</i></span>`
    const css = `.${c} {
  display: inline-flex;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}
.${c} i {
  display: inline-block;
  font-style: normal;
  background: linear-gradient(180deg, ${g.a}, ${g.b});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ${c}-bob 2.2s ease-in-out infinite;
}
.${c} i:nth-child(1) { animation-delay: 0s; }
.${c} i:nth-child(2) { animation-delay: 0.09s; }
.${c} i:nth-child(3) { animation-delay: 0.18s; }
.${c} i:nth-child(4) { animation-delay: 0.27s; }
.${c} i:nth-child(5) { animation-delay: 0.36s; }
.${c} i:nth-child(6) { animation-delay: 0.45s; }
.${c} i:nth-child(7) { animation-delay: 0.54s; }
.${c} i:nth-child(8) { animation-delay: 0.63s; }
@keyframes ${c}-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-9px); }
}`
    add(mk({
      name: `${g.name} Kinetic Letters`,
      category: 'Text',
      description: `Characters riding one sine on a fixed phase offset, so the word ripples continuously instead of bouncing as a block.`,
      html, css,
      tags: ['text', 'kinetic', 'wave', 'letters', 'bounce', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TEXT — redacted reveal  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-text-redact-${t.name}`)
    const html = `<p class="${c}">The location was <span>Bletchley Park</span> and the date was <span>4 June</span>.</p>`
    const css = `.${c} {
  margin: 0;
  max-width: 280px;
  font-size: 0.95rem;
  line-height: 1.75;
  color: #94a3b8;
}
.${c} span {
  position: relative;
  color: #e2e8f0;
  cursor: pointer;
}
.${c} span::after {
  content: '';
  position: absolute;
  left: -0.15em;
  right: -0.15em;
  top: 0.05em;
  bottom: 0.05em;
  border-radius: 0.12em;
  background: linear-gradient(90deg, ${t.a}, ${t.b});
  transform-origin: right;
  transition: transform 0.35s cubic-bezier(0.65, 0, 0.35, 1);
}
.${c} span:hover::after,
.${c} span:focus-within::after {
  transform: scaleX(0);
}
.${c} span:nth-of-type(2)::after {
  background: linear-gradient(90deg, ${t.b}, ${t.c});
}`
    add(mk({
      name: `${t.name} Redacted Text`,
      category: 'Text',
      description: `Classified bars that wipe away from the right on hover, the words underneath present in the DOM the whole time so they stay selectable and searchable.`,
      html, css,
      tags: ['text', 'redacted', 'spoiler', 'reveal', 'hover', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BACKGROUNDS — drifting bokeh field  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-bg-bokeh-${g.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 100%;
  height: 185px;
  overflow: hidden;
  border-radius: 0.7rem;
  background: radial-gradient(circle at 30% 20%, #16203a, #0b1120 70%);
}
.${c} i {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  animation: ${c}-float 16s ease-in-out infinite;
}
.${c} i:nth-child(1) { width: 44px; height: 44px; left: 8%;  top: 62%; background: rgba(${rgbOf(g.a)}, 0.4); animation-delay: 0s; }
.${c} i:nth-child(2) { width: 26px; height: 26px; left: 28%; top: 30%; background: rgba(${rgbOf(g.b)}, 0.5); animation-delay: -3s; }
.${c} i:nth-child(3) { width: 60px; height: 60px; left: 48%; top: 70%; background: rgba(${rgbOf(g.a)}, 0.28); animation-delay: -6s; }
.${c} i:nth-child(4) { width: 18px; height: 18px; left: 66%; top: 24%; background: rgba(${rgbOf(g.b)}, 0.6); animation-delay: -9s; }
.${c} i:nth-child(5) { width: 34px; height: 34px; left: 80%; top: 56%; background: rgba(${rgbOf(g.a)}, 0.42); animation-delay: -12s; }
.${c} i:nth-child(6) { width: 22px; height: 22px; left: 92%; top: 18%; background: rgba(${rgbOf(g.b)}, 0.45); animation-delay: -15s; }
@keyframes ${c}-float {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.65; }
  33%      { transform: translate(18px, -32px) scale(1.14); opacity: 1; }
  66%      { transform: translate(-14px, -18px) scale(0.9); opacity: 0.5; }
}`
    add(mk({
      name: `${g.name} Bokeh Field`,
      category: 'Backgrounds',
      description: `Out-of-focus orbs on one keyframe with negative delays, so the six start mid-cycle and the field is already in motion on first paint.`,
      html, css,
      tags: ['background', 'bokeh', 'particles', 'float', 'ambient', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BACKGROUNDS — CRT scanline static  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-bg-crt-${t.name}`)
    const html = `<div class="${c}"><i class="tint"></i><i class="lines"></i><i class="sweep"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 100%;
  height: 185px;
  overflow: hidden;
  border-radius: 0.7rem;
  background: #06080f;
}
.${c} i { position: absolute; inset: 0; }
.${c} .tint {
  background: radial-gradient(ellipse at 50% 50%, rgba(${rgbOf(t.a)}, 0.22), transparent 68%),
              radial-gradient(ellipse at 20% 80%, rgba(${rgbOf(t.b)}, 0.16), transparent 60%);
}
.${c} .lines {
  background: repeating-linear-gradient(180deg, rgba(0,0,0,0.55) 0 1px, transparent 1px 3px);
}
.${c} .sweep {
  background: linear-gradient(180deg, transparent, rgba(${rgbOf(t.c)}, 0.16) 45%, rgba(${rgbOf(t.c)}, 0.3) 50%, rgba(${rgbOf(t.c)}, 0.16) 55%, transparent);
  height: 42%;
  animation: ${c}-roll 4.5s linear infinite;
}
@keyframes ${c}-roll {
  from { transform: translateY(-100%); }
  to   { transform: translateY(340%); }
}`
    add(mk({
      name: `${t.name} CRT Static`,
      category: 'Backgrounds',
      description: `Phosphor tint under hard scanlines with a soft band rolling through, the three layers separate so each can be tuned without touching the others.`,
      html, css,
      tags: ['background', 'crt', 'scanlines', 'retro', 'glitch', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  INPUTS & HOVER — amount field with a unit select  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-input-amount-${g.name}`)
    const html = `<div class="${c}"><span class="sym">$</span><input value="1,280.00" readonly><div class="unit">USD<i></i></div></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  width: 268px;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  background: #111827;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.${c}:focus-within {
  border-color: ${g.a};
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.a)}, 0.18);
}
.${c} .sym {
  padding-left: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
}
.${c} input {
  flex: 1;
  min-width: 0;
  padding: 0.6rem 0.5rem;
  border: none;
  outline: none;
  background: transparent;
  color: #f1f5f9;
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.${c} .unit {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  align-self: stretch;
  padding: 0 0.75rem;
  border-left: 1px solid #334155;
  font-size: 0.78rem;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.16s ease, background 0.16s ease;
}
.${c} .unit:hover {
  color: ${g.b};
  background: rgba(${rgbOf(g.a)}, 0.08);
}
.${c} .unit i {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid currentColor;
}`
    add(mk({
      name: `${g.name} Amount Field`,
      category: 'Inputs & Hover',
      description: `Currency input with a fixed symbol and a unit picker sharing the box, the figure in tabular numerals so the caret does not shift as digits change.`,
      html, css,
      tags: ['input', 'amount', 'currency', 'money', 'unit', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  INPUTS & HOVER — search with a scope selector  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-input-scope-${t.name}`)
    const html = `<div class="${c}"><div class="scope">All<i></i></div><input placeholder="Search the workspace…" readonly><kbd>⌘K</kbd></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  width: 290px;
  border: 1px solid #334155;
  border-radius: 0.55rem;
  background: #111827;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.${c}:focus-within {
  border-color: ${t.a};
  box-shadow: 0 0 0 3px rgba(${rgbOf(t.a)}, 0.16);
}
.${c} .scope {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  align-self: stretch;
  padding: 0 0.7rem;
  border-right: 1px solid #334155;
  font-size: 0.76rem;
  font-weight: 600;
  color: ${t.b};
  cursor: pointer;
  transition: background 0.16s ease;
}
.${c} .scope:hover { background: rgba(${rgbOf(t.b)}, 0.1); }
.${c} .scope i {
  width: 0;
  height: 0;
  border-left: 3.5px solid transparent;
  border-right: 3.5px solid transparent;
  border-top: 4.5px solid currentColor;
}
.${c} input {
  flex: 1;
  min-width: 0;
  padding: 0.6rem 0.6rem;
  border: none;
  outline: none;
  background: transparent;
  color: #f1f5f9;
  font-size: 0.82rem;
}
.${c} input::placeholder { color: #475569; }
.${c} kbd {
  margin-right: 0.55rem;
  padding: 0.12rem 0.35rem;
  border: 1px solid #334155;
  border-bottom-width: 2px;
  border-radius: 0.25rem;
  font-family: inherit;
  font-size: 0.66rem;
  color: #64748b;
}`
    add(mk({
      name: `${t.name} Scoped Search`,
      category: 'Inputs & Hover',
      description: `Search bar with a leading scope menu and a trailing key hint, all three sharing one focus ring so the control reads as a single field.`,
      html, css,
      tags: ['input', 'search', 'scope', 'filter', 'command', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  NAVIGATION & MENUS — app bar with inline search  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-nav-appbar-${g.name}`)
    const html = `<header class="${c}"><b><i></i>Northwind</b><div class="s">Search…</div><nav><a href="#" class="on">Home</a><a href="#">Docs</a></nav><span class="av">AW</span></header>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 296px;
  padding: 0.55rem 0.7rem;
  border-radius: 0.6rem;
  background: rgba(17,24,39,0.9);
  border: 1px solid #1f2937;
  backdrop-filter: blur(10px);
}
.${c} b {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #f1f5f9;
}
.${c} b i {
  width: 18px;
  height: 18px;
  border-radius: 0.3rem;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
}
.${c} .s {
  flex: 1;
  min-width: 0;
  padding: 0.3rem 0.55rem;
  border: 1px solid #334155;
  border-radius: 0.35rem;
  font-size: 0.72rem;
  color: #475569;
  cursor: text;
  transition: border-color 0.16s ease, color 0.16s ease;
}
.${c} .s:hover { border-color: ${g.a}; color: #94a3b8; }
.${c} nav { display: flex; gap: 0.15rem; }
.${c} a {
  padding: 0.25rem 0.45rem;
  border-radius: 0.3rem;
  font-size: 0.73rem;
  color: #64748b;
  text-decoration: none;
  transition: color 0.16s ease, background 0.16s ease;
}
.${c} a:hover { color: #cbd5e1; background: #1e293b; }
.${c} a.on { color: ${g.b}; background: rgba(${rgbOf(g.a)}, 0.12); }
.${c} .av {
  flex: none;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-size: 0.6rem;
  font-weight: 700;
  color: #0b1120;
  background: linear-gradient(140deg, ${g.b}, ${g.a});
}`
    add(mk({
      name: `${g.name} App Bar`,
      category: 'Navigation & Menus',
      description: `Compact product header carrying mark, search, links and account in one blurred row, the search flexing so the ends stay pinned at any width.`,
      html, css,
      tags: ['nav', 'app bar', 'header', 'search', 'toolbar', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  NAVIGATION & MENUS — wizard progress header  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-nav-wizard-${t.name}`)
    const html = `<nav class="${c}"><a href="#" class="done">Account</a><a href="#" class="done">Workspace</a><a href="#" class="on">Billing</a><a href="#">Invite</a></nav>`
    const css = `.${c} {
  display: flex;
  width: 292px;
  border-radius: 0.55rem;
  overflow: hidden;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} a {
  position: relative;
  flex: 1;
  padding: 0.6rem 0.35rem 0.6rem 0.75rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
  text-decoration: none;
  text-align: center;
  transition: color 0.18s ease, background 0.18s ease;
}
.${c} a:not(:last-child)::after {
  content: '';
  position: absolute;
  right: -9px;
  top: 50%;
  z-index: 1;
  width: 17px;
  height: 17px;
  margin-top: -8.5px;
  background: inherit;
  border-right: 1px solid #1f2937;
  border-top: 1px solid #1f2937;
  transform: rotate(45deg);
}
.${c} .done {
  color: #0b1120;
  background: ${t.a};
}
.${c} .on {
  color: #0b1120;
  background: ${t.b};
}
.${c} a:last-child { background: #111827; }
.${c} a:hover:not(.done):not(.on) { color: #94a3b8; }`
    add(mk({
      name: `${t.name} Wizard Header`,
      category: 'Navigation & Menus',
      description: `Segmented flow header where each step's arrow is a rotated square inheriting its own background, so the notch always matches the segment behind it.`,
      html, css,
      tags: ['nav', 'wizard', 'steps', 'breadcrumb', 'onboarding', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  DIVIDERS & SEPARATORS — rule with a badged icon  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-div-badge-${g.name}`)
    const html = `<div class="${c}"><i></i></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 300px;
  height: 40px;
}
.${c}::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(${rgbOf(g.a)}, 0.6) 30%, rgba(${rgbOf(g.b)}, 0.6) 70%, transparent);
}
.${c} i {
  position: relative;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #0b1120;
  box-shadow: inset 0 0 0 1px rgba(${rgbOf(g.a)}, 0.4);
}
.${c} i::after {
  content: '';
  width: 13px;
  height: 13px;
  border-radius: 0.25rem;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  transform: rotate(45deg);
}`
    add(mk({
      name: `${g.name} Badged Divider`,
      category: 'Dividers & Separators',
      description: `Section rule broken by a ringed medallion, the inner diamond rotated so the ornament reads as deliberate rather than as a dot.`,
      html, css,
      tags: ['divider', 'badge', 'icon', 'ornament', 'section', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  DIVIDERS & SEPARATORS — slanted section transition  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-div-slant-${t.name}`)
    const html = `<div class="${c}"><i class="top"></i><i class="bot"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 300px;
  height: 96px;
  overflow: hidden;
  border-radius: 0.4rem;
}
.${c} i {
  position: absolute;
  left: 0;
  right: 0;
}
.${c} .top {
  top: 0;
  height: 60%;
  background: linear-gradient(90deg, ${t.a}, ${t.b});
  clip-path: polygon(0 0, 100% 0, 100% 62%, 0 100%);
}
.${c} .bot {
  bottom: 0;
  height: 60%;
  background: linear-gradient(90deg, ${t.b}, ${t.c});
  clip-path: polygon(0 100%, 100% 100%, 100% 38%, 0 0);
}`
    add(mk({
      name: `${t.name} Slant Transition`,
      category: 'Dividers & Separators',
      description: `Two bands with mirrored diagonal cuts meeting on one line, so the seam between sections is an angle rather than a horizontal rule.`,
      html, css,
      tags: ['divider', 'slant', 'diagonal', 'section', 'transition', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BADGES & TAGS — level badge with a progress ring  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-badge-level-${g.name}`)
    const html = `<span class="${c}"><i><b>7</b></i><span class="txt">Level 7<em>620 / 900 XP</em></span></span>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.9rem 0.45rem 0.45rem;
  border-radius: 999px;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} i {
  position: relative;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: conic-gradient(${g.a} 0turn 0.69turn, rgba(148,163,184,0.2) 0.69turn 1turn);
}
.${c} i::before {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: #111827;
}
.${c} b {
  position: relative;
  font-size: 0.76rem;
  font-weight: 800;
  color: ${g.b};
}
.${c} .txt {
  display: block;
  font-size: 0.76rem;
  font-weight: 600;
  color: #e2e8f0;
  line-height: 1.25;
}
.${c} em {
  display: block;
  font-style: normal;
  font-size: 0.65rem;
  font-weight: 500;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}`
    add(mk({
      name: `${g.name} Level Badge`,
      category: 'Badges & Tags',
      description: `Rank chip whose ring is a conic gradient showing progress to the next tier, with the raw figures underneath in tabular numerals.`,
      html, css,
      tags: ['badge', 'level', 'xp', 'progress', 'gamification', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BADGES & TAGS — category pill with a leading dot  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-badge-category-${t.name}`)
    const html = `<div class="${c}"><a href="#" class="p1"><i></i>Engineering</a><a href="#" class="p2"><i></i>Design</a><a href="#" class="p3"><i></i>Ops</a></div>`
    const css = `.${c} {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.${c} a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #334155;
  font-size: 0.74rem;
  font-weight: 500;
  color: #94a3b8;
  text-decoration: none;
  transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
}
.${c} i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  transition: box-shadow 0.18s ease;
}
.${c} .p1 i { background: ${t.a}; }
.${c} .p2 i { background: ${t.b}; }
.${c} .p3 i { background: ${t.c}; }
.${c} .p1:hover { border-color: ${t.a}; color: ${t.a}; background: rgba(${rgbOf(t.a)}, 0.1); }
.${c} .p2:hover { border-color: ${t.b}; color: ${t.b}; background: rgba(${rgbOf(t.b)}, 0.1); }
.${c} .p3:hover { border-color: ${t.c}; color: ${t.c}; background: rgba(${rgbOf(t.c)}, 0.1); }
.${c} a:hover i { box-shadow: 0 0 8px currentColor; }`
    add(mk({
      name: `${t.name} Category Pills`,
      category: 'Badges & Tags',
      description: `Taxonomy links keyed by a colour dot rather than a filled background, so a row of them stays readable instead of turning into a paint chart.`,
      html, css,
      tags: ['badge', 'category', 'pill', 'tag', 'filter', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOGGLES & SWITCHES — switch with track glyphs  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-toggle-glyph-${g.name}`)
    const html = `<label class="${c}"><input type="checkbox" checked><span><b class="y"></b><b class="n"></b><i></i></span></label>`
    const css = `.${c} {
  display: inline-block;
  cursor: pointer;
}
.${c} input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.${c} span {
  position: relative;
  display: block;
  width: 62px;
  height: 32px;
  border-radius: 999px;
  background: #334155;
  transition: background 0.25s ease;
}
.${c} b {
  position: absolute;
  top: 50%;
  width: 11px;
  height: 11px;
  margin-top: -5.5px;
  transition: opacity 0.25s ease;
}
.${c} .y {
  left: 9px;
  opacity: 0;
}
.${c} .y::after {
  content: '';
  position: absolute;
  left: 3px;
  width: 4px;
  height: 8px;
  border: solid #0b1120;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.${c} .n {
  right: 9px;
  opacity: 1;
}
.${c} .n::before,
.${c} .n::after {
  content: '';
  position: absolute;
  top: 4.5px;
  width: 11px;
  height: 2px;
  border-radius: 1px;
  background: #94a3b8;
}
.${c} .n::before { transform: rotate(45deg); }
.${c} .n::after  { transform: rotate(-45deg); }
.${c} i {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e2e8f0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  transition: transform 0.26s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} input:checked + span { background: linear-gradient(90deg, ${g.a}, ${g.b}); }
.${c} input:checked + span .y { opacity: 1; }
.${c} input:checked + span .n { opacity: 0; }
.${c} input:checked + span i { transform: translateX(30px); }
.${c} input:focus-visible + span { box-shadow: 0 0 0 3px rgba(${rgbOf(g.b)}, 0.35); }`
    add(mk({
      name: `${g.name} Glyph Switch`,
      category: 'Toggles & Switches',
      description: `Track carrying a tick and a cross drawn from borders, cross-faded so state is legible without relying on colour alone.`,
      html, css,
      tags: ['toggle', 'switch', 'glyph', 'check', 'accessible', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOGGLES & SWITCHES — checkbox list with select-all  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-toggle-list-${t.name}`)
    const html = `<div class="${c}"><label class="all"><input type="checkbox" checked><span class="bx mixed"></span>Select all</label><label><input type="checkbox" checked><span class="bx"></span>Deploy previews</label><label><input type="checkbox" checked><span class="bx"></span>Weekly digest</label><label><input type="checkbox"><span class="bx"></span>Marketing</label></div>`
    const css = `.${c} {
  width: 244px;
  padding: 0.5rem;
  border-radius: 0.55rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} label {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.4rem 0.45rem;
  border-radius: 0.35rem;
  font-size: 0.79rem;
  color: #cbd5e1;
  cursor: pointer;
  transition: background 0.15s ease;
}
.${c} label:hover { background: #1a2234; }
.${c} .all {
  margin-bottom: 0.3rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #1f2937;
  border-radius: 0.35rem 0.35rem 0 0;
  font-weight: 600;
  color: #94a3b8;
}
.${c} input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.${c} .bx {
  position: relative;
  flex: none;
  width: 17px;
  height: 17px;
  border: 2px solid #475569;
  border-radius: 0.28rem;
  transition: background 0.18s ease, border-color 0.18s ease;
}
.${c} .bx::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 0.5px;
  width: 4px;
  height: 8px;
  border: solid #0b1120;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) scale(0);
  transition: transform 0.2s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.${c} input:checked + .bx {
  background: linear-gradient(135deg, ${t.a}, ${t.b});
  border-color: ${t.a};
}
.${c} input:checked + .bx::after { transform: rotate(45deg) scale(1); }
.${c} .mixed::after {
  left: 2.5px;
  top: 5.5px;
  width: 8px;
  height: 0;
  border-width: 0 0 2px 0;
  transform: rotate(0deg) scale(1);
}
.${c} input:focus-visible + .bx {
  box-shadow: 0 0 0 3px rgba(${rgbOf(t.c)}, 0.3);
}`
    add(mk({
      name: `${t.name} Checkbox List`,
      category: 'Toggles & Switches',
      description: `Grouped options under a select-all whose indeterminate state is a bar rather than a tick, the one case a checkbox has three readings.`,
      html, css,
      tags: ['toggle', 'checkbox', 'list', 'select all', 'indeterminate', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOOLTIPS & POPOVERS — chart crosshair readout  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-tip-crosshair-${g.name}`)
    const html = `<div class="${c}"><i class="area"></i><i class="line"></i><b class="dot"></b><div class="read"><em>Thu 14</em><strong>4,812</strong></div></div>`
    const css = `.${c} {
  position: relative;
  width: 272px;
  height: 132px;
  padding: 0.7rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
  overflow: hidden;
}
.${c} .area {
  position: absolute;
  inset: 0.7rem;
  background: linear-gradient(180deg, rgba(${rgbOf(g.a)}, 0.4), transparent);
  clip-path: polygon(0 70%, 18% 55%, 36% 62%, 54% 34%, 72% 44%, 88% 20%, 100% 28%, 100% 100%, 0 100%);
}
.${c} .line {
  position: absolute;
  top: 0.7rem;
  bottom: 0.7rem;
  left: 54%;
  width: 1px;
  background: repeating-linear-gradient(180deg, ${g.b} 0 4px, transparent 4px 8px);
}
.${c} .dot {
  position: absolute;
  left: 54%;
  top: 44%;
  width: 9px;
  height: 9px;
  margin: -4.5px 0 0 -4.5px;
  border-radius: 50%;
  background: ${g.b};
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.b)}, 0.25);
}
.${c} .read {
  position: absolute;
  left: 54%;
  top: 0.7rem;
  transform: translateX(-50%);
  padding: 0.35rem 0.55rem;
  border-radius: 0.35rem;
  text-align: center;
  background: #0b1120;
  border: 1px solid rgba(${rgbOf(g.a)}, 0.4);
  box-shadow: 0 6px 18px rgba(0,0,0,0.5);
}
.${c} em {
  display: block;
  font-style: normal;
  font-size: 0.62rem;
  color: #64748b;
}
.${c} strong {
  display: block;
  font-size: 0.8rem;
  color: ${g.b};
  font-variant-numeric: tabular-nums;
}`
    add(mk({
      name: `${g.name} Crosshair Readout`,
      category: 'Tooltips & Popovers',
      description: `Chart hover state as one unit — dashed guide, marker dot and a value card pinned above the same x position, so the three never drift apart.`,
      html, css,
      tags: ['tooltip', 'chart', 'crosshair', 'readout', 'data', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOOLTIPS & POPOVERS — quick reaction picker  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-tip-picker-${t.name}`)
    const html = `<div class="${c}"><button class="trigger">React</button><div class="tray"><i class="r1"></i><i class="r2"></i><i class="r3"></i><i class="r4"></i><i class="r5"></i></div></div>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding-top: 2.6rem;
}
.${c} .trigger {
  padding: 0.42rem 0.95rem;
  border: 1px solid #334155;
  border-radius: 0.4rem;
  background: #111827;
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease;
}
.${c}:hover .trigger { border-color: ${t.a}; color: ${t.b}; }
.${c} .tray {
  position: absolute;
  top: 0;
  left: 50%;
  display: flex;
  gap: 0.3rem;
  padding: 0.35rem 0.45rem;
  transform: translate(-50%, 6px);
  border-radius: 999px;
  background: #0b1120;
  border: 1px solid #1f2937;
  box-shadow: 0 10px 26px rgba(0,0,0,0.55);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
}
.${c}:hover .tray,
.${c}:focus-within .tray {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, 0);
}
.${c} .tray i {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.34, 1.6, 0.64, 1);
}
.${c} .tray i:hover { transform: translateY(-4px) scale(1.22); }
.${c} .r1 { background: linear-gradient(140deg, ${t.a}, ${t.b}); }
.${c} .r2 { background: linear-gradient(140deg, ${t.b}, ${t.c}); }
.${c} .r3 { background: linear-gradient(140deg, ${t.c}, ${t.a}); }
.${c} .r4 { background: linear-gradient(140deg, ${t.a}, ${t.c}); }
.${c} .r5 { background: linear-gradient(140deg, ${t.b}, ${t.a}); }`
    add(mk({
      name: `${t.name} Reaction Picker`,
      category: 'Tooltips & Popovers',
      description: `Tray that floats above its trigger on hover or focus, each option popping on an overshoot so the row feels physical rather than a menu.`,
      html, css,
      tags: ['popover', 'reactions', 'picker', 'tray', 'emoji', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SKELETONS & SHIMMERS — gallery grid placeholder  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-skel-gallery-${g.name}`)
    const html = `<div class="${c}"><i class="w"></i><i></i><i></i><i></i><i class="w"></i><i></i></div>`
    const css = `.${c} {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  width: 280px;
  padding: 0.7rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} i {
  height: 62px;
  border-radius: 0.35rem;
  background: linear-gradient(115deg, #1e293b 22%, rgba(${rgbOf(g.a)}, 0.32) 42%, #1e293b 62%);
  background-size: 260% 100%;
  animation: ${c}-sweep 1.65s linear infinite;
}
.${c} .w { grid-column: span 2; }
.${c} i:nth-child(2) { animation-delay: 0.08s; }
.${c} i:nth-child(3) { animation-delay: 0.16s; }
.${c} i:nth-child(4) { animation-delay: 0.24s; }
.${c} i:nth-child(5) { animation-delay: 0.32s; }
.${c} i:nth-child(6) { animation-delay: 0.4s; }
@keyframes ${c}-sweep {
  to { background-position: -260% 0; }
}`
    add(mk({
      name: `${g.name} Gallery Skeleton`,
      category: 'Skeletons & Shimmers',
      description: `Mixed-span grid placeholder, the wide cells breaking the rhythm so the loading state reads as a real masonry rather than a uniform block.`,
      html, css,
      tags: ['skeleton', 'gallery', 'grid', 'masonry', 'loading', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SKELETONS & SHIMMERS — comment thread placeholder  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-skel-thread-${t.name}`)
    const html = `<div class="${c}"><div class="cm"><i class="av"></i><div><i class="n"></i><i class="l"></i><i class="s"></i></div></div><div class="cm in"><i class="av"></i><div><i class="n"></i><i class="l"></i></div></div></div>`
    const css = `.${c} {
  width: 278px;
  padding: 0.8rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} .cm {
  display: flex;
  gap: 0.6rem;
}
.${c} .cm + .cm { margin-top: 0.85rem; }
.${c} .in { margin-left: 1.6rem; padding-left: 0.7rem; border-left: 2px solid #1f2937; }
.${c} .cm > div { flex: 1; }
.${c} i {
  display: block;
  border-radius: 0.25rem;
  background: linear-gradient(105deg, #1e293b 24%, rgba(${rgbOf(t.a)}, 0.3) 44%, #1e293b 64%);
  background-size: 250% 100%;
  animation: ${c}-glide 1.7s linear infinite;
}
.${c} .av { flex: none; width: 28px; height: 28px; border-radius: 50%; }
.${c} .n { width: 42%; height: 9px; }
.${c} .l { height: 8px; margin-top: 0.45rem; animation-delay: 0.1s; }
.${c} .s { width: 66%; height: 8px; margin-top: 0.4rem; animation-delay: 0.2s; }
@keyframes ${c}-glide {
  to { background-position: -250% 0; }
}`
    add(mk({
      name: `${t.name} Thread Skeleton`,
      category: 'Skeletons & Shimmers',
      description: `Comment placeholders with a nested reply indented behind a rule, so the shape of the conversation is visible before any text arrives.`,
      html, css,
      tags: ['skeleton', 'comments', 'thread', 'reply', 'loading', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ENTRANCE ANIMATIONS — unfold expand  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-enter-unfold-${g.name}`)
    const html = `<div class="${c}"><b>Details</b><div class="body"><i></i><i></i><i class="s"></i></div></div>`
    const css = `.${c} {
  width: 232px;
  padding: 0.75rem 0.85rem;
  border-radius: 0.55rem;
  background: #111827;
  border: 1px solid #1f2937;
  overflow: hidden;
}
.${c} b {
  display: block;
  font-size: 0.82rem;
  color: ${g.b};
}
.${c} .body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  animation: ${c}-open 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
.${c} .body > * { min-height: 0; }
.${c} i {
  display: block;
  height: 9px;
  margin-top: 0.55rem;
  border-radius: 999px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  opacity: 0.4;
}
.${c} .s { width: 58%; }
@keyframes ${c}-open {
  0%, 8%   { grid-template-rows: 0fr; }
  36%, 78% { grid-template-rows: 1fr; }
  100%     { grid-template-rows: 0fr; }
}`
    add(mk({
      name: `${g.name} Unfold Expand`,
      category: 'Entrance Animations',
      description: `Height animated with \`grid-template-rows\` from 0fr to 1fr — the one technique that transitions to intrinsic height without a hardcoded max-height.`,
      html, css,
      tags: ['entrance', 'expand', 'unfold', 'grid', 'reveal', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ENTRANCE ANIMATIONS — venetian blind reveal  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-enter-blinds-${t.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i><b>REVEAL</b></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 228px;
  height: 132px;
  overflow: hidden;
  border-radius: 0.55rem;
  background: linear-gradient(140deg, ${t.a}, ${t.b}, ${t.c});
}
.${c} i {
  position: absolute;
  left: 0;
  right: 0;
  height: 16.67%;
  background: #0b1120;
  transform-origin: top;
  animation: ${c}-slat 3.6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
.${c} i:nth-child(1) { top: 0;      animation-delay: 0s; }
.${c} i:nth-child(2) { top: 16.67%; animation-delay: 0.08s; }
.${c} i:nth-child(3) { top: 33.34%; animation-delay: 0.16s; }
.${c} i:nth-child(4) { top: 50%;    animation-delay: 0.24s; }
.${c} i:nth-child(5) { top: 66.67%; animation-delay: 0.32s; }
.${c} i:nth-child(6) { top: 83.34%; animation-delay: 0.4s; }
.${c} b {
  position: relative;
  z-index: 1;
  font-size: 1.05rem;
  font-weight: 900;
  letter-spacing: 0.24em;
  color: #0b1120;
}
@keyframes ${c}-slat {
  0%, 8%   { transform: scaleY(1); }
  44%, 80% { transform: scaleY(0); }
  100%     { transform: scaleY(1); }
}`
    add(mk({
      name: `${t.name} Blind Reveal`,
      category: 'Entrance Animations',
      description: `Six slats collapsing on a stagger from their top edge, so the surface behind is uncovered in bands rather than by a single wipe.`,
      html, css,
      tags: ['entrance', 'blinds', 'slats', 'reveal', 'stagger', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BORDERS & OUTLINES — growing underline keyline  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-border-underline-${g.name}`)
    const html = `<a href="#" class="${c}">Read the changelog</a>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding: 0.35rem 0.15rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.25s ease;
}
.${c}::before,
.${c}::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  border-radius: 1px;
}
.${c}::before {
  width: 100%;
  background: #1e293b;
}
.${c}::after {
  width: 100%;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.35s cubic-bezier(0.65, 0, 0.35, 1);
}
.${c}:hover { color: #f1f5f9; }
.${c}:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}`
    add(mk({
      name: `${g.name} Underline Keyline`,
      category: 'Borders & Outlines',
      description: `Rule that draws left-to-right on enter and retracts to the right on leave, by flipping \`transform-origin\` between the two states.`,
      html, css,
      tags: ['border', 'underline', 'link', 'hover', 'keyline', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BORDERS & OUTLINES — inset glow ring  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-border-inset-${t.name}`)
    const html = `<div class="${c}"><span>Selected</span></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 196px;
  height: 96px;
  border-radius: 0.6rem;
  background: #0f172a;
  box-shadow:
    inset 0 0 0 1px rgba(${rgbOf(t.a)}, 0.55),
    inset 0 0 18px rgba(${rgbOf(t.a)}, 0.2),
    0 0 0 0 rgba(${rgbOf(t.b)}, 0.35);
  transition: box-shadow 0.3s ease;
}
.${c} span {
  font-size: 0.84rem;
  font-weight: 600;
  color: ${t.b};
  transition: color 0.3s ease;
}
.${c}:hover {
  box-shadow:
    inset 0 0 0 1px ${t.b},
    inset 0 0 26px rgba(${rgbOf(t.b)}, 0.3),
    0 0 0 4px rgba(${rgbOf(t.c)}, 0.18);
}
.${c}:hover span { color: ${t.c}; }`
    add(mk({
      name: `${t.name} Inset Glow Ring`,
      category: 'Borders & Outlines',
      description: `Selection state built entirely from stacked box-shadows — hairline, inner bloom and outer halo — so nothing about the element's size changes.`,
      html, css,
      tags: ['border', 'inset', 'glow', 'selected', 'ring', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PROGRESS & METERS — vertical thermometer  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-prog-thermo-${g.name}`)
    const html = `<div class="${c}"><div class="tube"><i></i></div><div class="ticks"><span>100</span><span>50</span><span>0</span></div></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: stretch;
  gap: 0.55rem;
  height: 132px;
}
.${c} .tube {
  position: relative;
  width: 16px;
  border-radius: 999px;
  overflow: hidden;
  background: #1e293b;
  box-shadow: inset 0 0 0 1px #334155;
}
.${c} .tube i {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 68%;
  border-radius: 999px;
  background: linear-gradient(180deg, ${g.b}, ${g.a});
  animation: ${c}-rise 3.4s ease-in-out infinite alternate;
}
.${c} .ticks {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.${c} .ticks span {
  font-size: 0.63rem;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
@keyframes ${c}-rise {
  from { height: 46%; }
  to   { height: 78%; }
}`
    add(mk({
      name: `${g.name} Thermometer Meter`,
      category: 'Progress & Meters',
      description: `Vertical gauge with a scale beside it, the column anchored to the bottom so it fills upward the way a reading actually behaves.`,
      html, css,
      tags: ['meter', 'thermometer', 'vertical', 'gauge', 'scale', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PROGRESS & METERS — labelled skill bars  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-prog-skills-${t.name}`)
    const html = `<div class="${c}"><div class="r"><span>TypeScript</span><em>92%</em><i class="b1"></i></div><div class="r"><span>Rust</span><em>68%</em><i class="b2"></i></div><div class="r"><span>Go</span><em>45%</em><i class="b3"></i></div></div>`
    const css = `.${c} {
  width: 272px;
  padding: 0.9rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} .r {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.25rem 0.5rem;
}
.${c} .r + .r { margin-top: 0.8rem; }
.${c} span { font-size: 0.76rem; color: #cbd5e1; }
.${c} em {
  font-style: normal;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
.${c} i {
  grid-column: 1 / -1;
  display: block;
  height: 7px;
  border-radius: 999px;
  background: #1e293b;
  overflow: hidden;
}
.${c} i::after {
  content: '';
  display: block;
  height: 100%;
  border-radius: 999px;
  transform-origin: left;
  animation: ${c}-fill 2.6s cubic-bezier(0.2, 0.8, 0.3, 1) infinite alternate;
}
.${c} .b1::after { width: 92%; background: linear-gradient(90deg, ${t.a}, ${t.b}); }
.${c} .b2::after { width: 68%; background: linear-gradient(90deg, ${t.b}, ${t.c}); animation-delay: 0.1s; }
.${c} .b3::after { width: 45%; background: linear-gradient(90deg, ${t.c}, ${t.a}); animation-delay: 0.2s; }
@keyframes ${c}-fill {
  from { transform: scaleX(0.86); }
  to   { transform: scaleX(1); }
}`
    add(mk({
      name: `${t.name} Skill Bars`,
      category: 'Progress & Meters',
      description: `Labelled proficiency rows on a two-column grid so the name and the figure sit on one line with the track spanning both beneath.`,
      html, css,
      tags: ['meter', 'skills', 'bars', 'proficiency', 'resume', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  AVATARS & IMAGES — hover action overlay  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-img-actions-${g.name}`)
    const html = `<figure class="${c}"><i class="shot"></i><div class="acts"><button class="a1"></button><button class="a2"></button><button class="a3"></button></div></figure>`
    const css = `.${c} {
  position: relative;
  width: 200px;
  height: 138px;
  margin: 0;
  overflow: hidden;
  border-radius: 0.6rem;
}
.${c} .shot {
  display: block;
  width: 100%;
  height: 100%;
  background: linear-gradient(150deg, ${g.a}, ${g.b});
  transition: transform 0.4s ease, filter 0.4s ease;
}
.${c}:hover .shot {
  transform: scale(1.07);
  filter: brightness(0.55);
}
.${c} .acts {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.${c} button {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: rgba(248,250,252,0.94);
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1), background 0.18s ease;
}
.${c}:hover button { opacity: 1; transform: translateY(0); }
.${c} .a2 { transition-delay: 0.05s; }
.${c} .a3 { transition-delay: 0.1s; }
.${c} button:hover { background: ${g.b}; }`
    add(mk({
      name: `${g.name} Action Overlay`,
      category: 'Avatars & Images',
      description: `Media tile whose controls rise into a dimmed frame on a stagger, using \`transition-delay\` so the sequence costs no keyframes.`,
      html, css,
      tags: ['image', 'overlay', 'actions', 'hover', 'gallery', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  AVATARS & IMAGES — two-up image collage  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-img-collage-${t.name}`)
    const html = `<div class="${c}"><i class="big"></i><i class="s1"></i><i class="s2"></i></div>`
    const css = `.${c} {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  grid-template-rows: repeat(2, 1fr);
  gap: 0.4rem;
  width: 244px;
  height: 148px;
}
.${c} i {
  border-radius: 0.45rem;
  transition: transform 0.3s cubic-bezier(0.34, 1.3, 0.64, 1), filter 0.3s ease;
}
.${c} .big {
  grid-row: span 2;
  background: linear-gradient(150deg, ${t.a}, ${t.b});
}
.${c} .s1 { background: linear-gradient(150deg, ${t.b}, ${t.c}); }
.${c} .s2 { background: linear-gradient(150deg, ${t.c}, ${t.a}); }
.${c} i:hover {
  transform: scale(1.05);
  filter: brightness(1.12);
  z-index: 1;
}`
    add(mk({
      name: `${t.name} Image Collage`,
      category: 'Avatars & Images',
      description: `Asymmetric three-up where the hero spans both rows, each tile lifting independently so the grid never reflows on hover.`,
      html, css,
      tags: ['image', 'collage', 'grid', 'gallery', 'masonry', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MODALS & OVERLAYS — corner slide-up promo  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-modal-corner-${g.name}`)
    const html = `<div class="${c}"><i class="art"></i><div class="body"><b>New: saved views</b><p>Pin a filter set and it waits for you next time.</p><button>Take a look</button></div><button class="x">×</button></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  gap: 0.7rem;
  width: 278px;
  padding: 0.8rem;
  border-radius: 0.7rem;
  background: #111827;
  border: 1px solid #1f2937;
  box-shadow: 0 18px 42px rgba(0,0,0,0.55);
  animation: ${c}-in 4.5s cubic-bezier(0.32, 0.72, 0, 1) infinite;
}
.${c} .art {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 0.5rem;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
}
.${c} .body { flex: 1; min-width: 0; }
.${c} b {
  display: block;
  font-size: 0.82rem;
  color: #f1f5f9;
}
.${c} p {
  margin: 0.25rem 0 0;
  font-size: 0.73rem;
  line-height: 1.5;
  color: #94a3b8;
}
.${c} .body button {
  margin-top: 0.6rem;
  padding: 0.3rem 0.75rem;
  border: none;
  border-radius: 0.35rem;
  font-size: 0.73rem;
  font-weight: 600;
  color: #0b1120;
  cursor: pointer;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}
.${c} .x {
  position: absolute;
  top: 0.45rem;
  right: 0.5rem;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  color: #475569;
  font-size: 0.95rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}
.${c} .x:hover { color: #cbd5e1; background: #1e293b; }
@keyframes ${c}-in {
  0%, 6%   { opacity: 0; transform: translateY(26px); }
  22%, 84% { opacity: 1; transform: translateY(0); }
  100%     { opacity: 0; transform: translateY(14px); }
}`
    add(mk({
      name: `${g.name} Corner Promo`,
      category: 'Modals & Overlays',
      description: `Non-blocking announcement that slides up from the corner with its own dismiss, the pattern for news that does not deserve a modal.`,
      html, css,
      tags: ['modal', 'promo', 'corner', 'announcement', 'slide', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MODALS & OVERLAYS — blocking loading veil  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-modal-veil-${t.name}`)
    const html = `<div class="${c}"><div class="content"><i></i><i></i><i class="s"></i></div><div class="veil"><b></b><span>Saving changes…</span></div></div>`
    const css = `.${c} {
  position: relative;
  width: 268px;
  height: 150px;
  padding: 0.9rem;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} .content i {
  display: block;
  height: 11px;
  margin-bottom: 0.7rem;
  border-radius: 999px;
  background: #1e293b;
}
.${c} .content .s { width: 62%; }
.${c} .veil {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.7rem;
  background: rgba(11,17,32,0.65);
  backdrop-filter: blur(3px);
}
.${c} b {
  display: block;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid rgba(${rgbOf(t.a)}, 0.22);
  border-top-color: ${t.a};
  animation: ${c}-spin 0.8s linear infinite;
}
.${c} span {
  font-size: 0.77rem;
  color: ${t.b};
}
@keyframes ${c}-spin {
  to { transform: rotate(360deg); }
}`
    add(mk({
      name: `${t.name} Loading Veil`,
      category: 'Modals & Overlays',
      description: `Blocking overlay scoped to one panel rather than the page, blurring the content behind so it is clearly still there but not interactive.`,
      html, css,
      tags: ['modal', 'loading', 'overlay', 'veil', 'blocking', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ALERTS & TOASTS — success toast with a drawn tick  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-alert-success-${g.name}`)
    const html = `<div class="${c}" role="status"><i></i><div><b>Deployed to production</b><span>Build 4,812 · 38 seconds</span></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 288px;
  padding: 0.8rem 0.9rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid rgba(${rgbOf(g.a)}, 0.4);
  box-shadow: 0 12px 30px rgba(0,0,0,0.45);
}
.${c} i {
  position: relative;
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
}
.${c} i::after {
  content: '';
  position: absolute;
  left: 11px;
  top: 7px;
  width: 5px;
  height: 11px;
  border: solid #0b1120;
  border-width: 0 2.5px 2.5px 0;
  transform-origin: bottom right;
  transform: rotate(45deg) scale(0);
  animation: ${c}-draw 3s cubic-bezier(0.34, 1.5, 0.64, 1) infinite;
}
.${c} b {
  display: block;
  font-size: 0.8rem;
  color: #f1f5f9;
}
.${c} span {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.7rem;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
@keyframes ${c}-draw {
  0%, 10%  { transform: rotate(45deg) scale(0); }
  32%, 86% { transform: rotate(45deg) scale(1); }
  100%     { transform: rotate(45deg) scale(0); }
}`
    add(mk({
      name: `${g.name} Success Toast`,
      category: 'Alerts & Toasts',
      description: `Confirmation whose tick springs in from its own corner on an overshoot, so the mark lands rather than simply appearing.`,
      html, css,
      tags: ['toast', 'success', 'check', 'deploy', 'confirmation', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ALERTS & TOASTS — connection status bar  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-alert-conn-${t.name}`)
    const html = `<div class="${c}" role="status"><i></i><span>Reconnecting to the server…</span><button>Retry</button></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 292px;
  padding: 0.6rem 0.8rem;
  border-radius: 0.5rem;
  background: rgba(${rgbOf(t.a)}, 0.12);
  border: 1px solid rgba(${rgbOf(t.a)}, 0.35);
}
.${c} i {
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${t.a};
  box-shadow: 0 0 0 0 rgba(${rgbOf(t.a)}, 0.55);
  animation: ${c}-ping 1.8s ease-out infinite;
}
.${c} span {
  flex: 1;
  font-size: 0.77rem;
  color: ${t.b};
}
.${c} button {
  padding: 0.2rem 0.6rem;
  border: 1px solid rgba(${rgbOf(t.b)}, 0.5);
  border-radius: 0.3rem;
  background: transparent;
  color: ${t.b};
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} button:hover { background: ${t.b}; color: #0b1120; }
@keyframes ${c}-ping {
  70%, 100% { box-shadow: 0 0 0 9px rgba(${rgbOf(t.a)}, 0); }
}`
    add(mk({
      name: `${t.name} Connection Bar`,
      category: 'Alerts & Toasts',
      description: `Persistent network notice with a pinging indicator and a manual retry, sized as a bar rather than a toast because it does not auto-dismiss.`,
      html, css,
      tags: ['alert', 'connection', 'offline', 'status', 'retry', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ACCORDIONS & TABS — icon accordion with chevron  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-acc-icon-${g.name}`)
    const html = `<div class="${c}"><details open><summary><i class="ic"></i>Billing<em></em></summary><p>Cards, invoices and the VAT number on your receipts.</p></details><details><summary><i class="ic"></i>Security<em></em></summary><p>Two-factor, sessions and recovery codes.</p></details></div>`
    const css = `.${c} {
  width: 288px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.${c} details {
  border-radius: 0.55rem;
  overflow: hidden;
  background: #111827;
  border: 1px solid #1f2937;
  transition: border-color 0.2s ease;
}
.${c} details[open] { border-color: rgba(${rgbOf(g.a)}, 0.45); }
.${c} summary {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.8rem;
  font-size: 0.83rem;
  font-weight: 600;
  color: #cbd5e1;
  cursor: pointer;
  list-style: none;
}
.${c} summary::-webkit-details-marker { display: none; }
.${c} .ic {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 0.35rem;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  opacity: 0.55;
  transition: opacity 0.2s ease;
}
.${c} details[open] .ic { opacity: 1; }
.${c} em {
  flex: none;
  margin-left: auto;
  width: 8px;
  height: 8px;
  border-right: 2px solid ${g.b};
  border-bottom: 2px solid ${g.b};
  transform: rotate(45deg) translate(-2px, -2px);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} details[open] em {
  transform: rotate(225deg) translate(-2px, -2px);
}
.${c} p {
  margin: 0;
  padding: 0 0.8rem 0.8rem 2.2rem;
  font-size: 0.76rem;
  line-height: 1.55;
  color: #94a3b8;
}`
    add(mk({
      name: `${g.name} Icon Accordion`,
      category: 'Accordions & Tabs',
      description: `Separated disclosure cards where the icon brightens and the chevron flips on open, both keyed off \`[open]\` rather than a toggled class.`,
      html, css,
      tags: ['accordion', 'icon', 'chevron', 'settings', 'details', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ACCORDIONS & TABS — scrollable tab bar with fades  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-tabs-scroll-${t.name}`)
    const html = `<div class="${c}"><div class="rail"><a href="#" class="on">Overview</a><a href="#">Activity</a><a href="#">Members</a><a href="#">Integrations</a><a href="#">Audit log</a><a href="#">Danger</a></div></div>`
    const css = `.${c} {
  position: relative;
  width: 288px;
}
.${c}::before,
.${c}::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 6px;
  width: 26px;
  z-index: 1;
  pointer-events: none;
}
.${c}::before {
  left: 0;
  background: linear-gradient(90deg, #0b1120, transparent);
}
.${c}::after {
  right: 0;
  background: linear-gradient(270deg, #0b1120, transparent);
}
.${c} .rail {
  display: flex;
  gap: 0.15rem;
  overflow-x: auto;
  padding-bottom: 6px;
  border-bottom: 1px solid #1f2937;
  scrollbar-width: none;
}
.${c} .rail::-webkit-scrollbar { display: none; }
.${c} a {
  position: relative;
  flex: none;
  padding: 0.45rem 0.7rem;
  font-size: 0.79rem;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
  text-decoration: none;
  transition: color 0.18s ease;
}
.${c} a::after {
  content: '';
  position: absolute;
  left: 0.6rem;
  right: 0.6rem;
  bottom: -7px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, ${t.a}, ${t.b});
  transform: scaleX(0);
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} a:hover { color: #cbd5e1; }
.${c} a.on { color: ${t.b}; }
.${c} a.on::after { transform: scaleX(1); }`
    add(mk({
      name: `${t.name} Scrollable Tabs`,
      category: 'Accordions & Tabs',
      description: `Overflowing tab strip with gradient masks at both ends, so a cut-off label reads as scrollable rather than as a rendering fault.`,
      html, css,
      tags: ['tabs', 'scroll', 'overflow', 'fade', 'horizontal', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  3D & PERSPECTIVE — page turn  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-3d-page-${g.name}`)
    const html = `<div class="${c}"><i class="left"></i><i class="right"></i><i class="turn"></i></div>`
    const css = `.${c} {
  display: flex;
  width: 216px;
  height: 138px;
  perspective: 900px;
}
.${c} i {
  flex: 1;
  border-radius: 0.2rem;
}
.${c} .left {
  background: linear-gradient(90deg, #1e293b, #0f172a);
  border-radius: 0.4rem 0.1rem 0.1rem 0.4rem;
}
.${c} .right {
  background: linear-gradient(90deg, #0f172a, #1e293b);
  border-radius: 0.1rem 0.4rem 0.4rem 0.1rem;
}
.${c} .turn {
  position: absolute;
  left: 50%;
  width: 108px;
  height: 138px;
  border-radius: 0.1rem 0.4rem 0.4rem 0.1rem;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  transform-origin: left center;
  box-shadow: 0 8px 22px rgba(0,0,0,0.5);
  animation: ${c}-flip 4s cubic-bezier(0.55, 0, 0.35, 1) infinite;
}
@keyframes ${c}-flip {
  0%, 12%  { transform: rotateY(0deg); filter: brightness(1); }
  50%      { transform: rotateY(-95deg); filter: brightness(0.55); }
  88%, 100%{ transform: rotateY(-180deg); filter: brightness(0.35); }
}`
    add(mk({
      name: `${g.name} Page Turn`,
      category: '3D & Perspective',
      description: `Leaf hinged on the spine and swept through 180 degrees, darkening as it passes edge-on so the sheet reads as having two sides.`,
      html, css,
      tags: ['3d', 'page turn', 'book', 'flip', 'perspective', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  3D & PERSPECTIVE — spinning pyramid  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-3d-pyramid-${t.name}`)
    const html = `<div class="${c}"><div class="p"><i></i><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 100%;
  height: 168px;
  perspective: 700px;
}
.${c} .p {
  position: relative;
  width: 90px;
  height: 90px;
  transform-style: preserve-3d;
  animation: ${c}-spin 9s linear infinite;
}
.${c} i {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 0;
  height: 0;
  border-left: 45px solid transparent;
  border-right: 45px solid transparent;
  border-bottom: 78px solid;
  transform-origin: bottom center;
}
.${c} i:nth-child(1) { border-bottom-color: ${t.a}; transform: rotateY(0deg)   rotateX(20deg); }
.${c} i:nth-child(2) { border-bottom-color: ${t.b}; transform: rotateY(90deg)  rotateX(20deg); }
.${c} i:nth-child(3) { border-bottom-color: ${t.c}; transform: rotateY(180deg) rotateX(20deg); }
.${c} i:nth-child(4) { border-bottom-color: ${t.a}; transform: rotateY(270deg) rotateX(20deg); }
@keyframes ${c}-spin {
  to { transform: rotateY(360deg); }
}`
    add(mk({
      name: `${t.name} Spinning Pyramid`,
      category: '3D & Perspective',
      description: `Four CSS triangles hinged at a shared base and splayed by quarter turns, tilted so the solid closes rather than reading as loose fins.`,
      html, css,
      tags: ['3d', 'pyramid', 'rotate', 'geometry', 'perspective', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  GLOW & NEON — ECG heartbeat trace  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-neon-ecg-${g.name}`)
    const html = `<div class="${c}"><i class="trace"></i><b class="blip"></b></div>`
    const css = `.${c} {
  position: relative;
  width: 100%;
  height: 108px;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #06080f;
  border: 1px solid rgba(${rgbOf(g.a)}, 0.22);
}
.${c} .trace {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: ${g.a};
  box-shadow: 0 0 8px ${g.a};
  clip-path: polygon(
    0 40%, 24% 40%, 27% 0, 30% 100%, 33% 20%, 36% 40%,
    58% 40%, 61% 0, 64% 100%, 67% 20%, 70% 40%, 100% 40%
  );
  transform: scaleY(14);
}
.${c} .blip {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 46px;
  background: linear-gradient(90deg, transparent, rgba(${rgbOf(g.b)}, 0.28));
  animation: ${c}-sweep 2.6s linear infinite;
}
@keyframes ${c}-sweep {
  from { transform: translateX(-46px); }
  to   { transform: translateX(340px); }
}`
    add(mk({
      name: `${g.name} ECG Trace`,
      category: 'Glow & Neon',
      description: `Heartbeat line cut from a clip-path polygon and scaled vertically, with a sweeping gain band passing over it like a monitor refresh.`,
      html, css,
      tags: ['neon', 'ecg', 'heartbeat', 'monitor', 'medical', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  GLOW & NEON — breathing halo pill  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-neon-halo-${t.name}`)
    const html = `<span class="${c}"><i></i>Live now</span>`
    const css = `.${c} {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 1.1rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #0b1120;
  background: linear-gradient(90deg, ${t.a}, ${t.b});
  isolation: isolate;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: -3px;
  z-index: -1;
  border-radius: 999px;
  background: linear-gradient(90deg, ${t.a}, ${t.b}, ${t.c});
  filter: blur(9px);
  opacity: 0.55;
  animation: ${c}-breathe 2.8s ease-in-out infinite;
}
.${c} i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0b1120;
  animation: ${c}-blink 2.8s ease-in-out infinite;
}
@keyframes ${c}-breathe {
  50% { opacity: 1; filter: blur(14px); }
}
@keyframes ${c}-blink {
  50% { opacity: 0.35; }
}`
    add(mk({
      name: `${t.name} Halo Pill`,
      category: 'Glow & Neon',
      description: `Status chip sitting over a blurred copy of itself, the halo breathing on the same cycle as the dot so the two read as one pulse.`,
      html, css,
      tags: ['neon', 'glow', 'halo', 'live', 'status', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PATTERNS & TEXTURES — argyle diamond lattice  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-pat-argyle-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 100%;
  height: 180px;
  border-radius: 0.7rem;
  background-color: #0b1120;
  background-image:
    linear-gradient(45deg, rgba(${rgbOf(g.a)}, 0.22) 25%, transparent 25%, transparent 75%, rgba(${rgbOf(g.a)}, 0.22) 75%),
    linear-gradient(45deg, rgba(${rgbOf(g.a)}, 0.22) 25%, transparent 25%, transparent 75%, rgba(${rgbOf(g.a)}, 0.22) 75%),
    repeating-linear-gradient(45deg, rgba(${rgbOf(g.b)}, 0.4) 0 1px, transparent 1px 28px),
    repeating-linear-gradient(-45deg, rgba(${rgbOf(g.b)}, 0.4) 0 1px, transparent 1px 28px);
  background-size: 56px 56px, 56px 56px, 100% 100%, 100% 100%;
  background-position: 0 0, 28px 28px, 0 0, 0 0;
}`
    add(mk({
      name: `${g.name} Argyle Lattice`,
      category: 'Patterns & Textures',
      description: `Offset diamond blocks crossed by two thin repeating diagonals, which is what separates argyle from a plain checkerboard on the bias.`,
      html, css,
      tags: ['pattern', 'argyle', 'diamond', 'lattice', 'textile', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PATTERNS & TEXTURES — terrazzo speckle  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-pat-terrazzo-${t.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 100%;
  height: 180px;
  border-radius: 0.7rem;
  background-color: #131c33;
  background-image:
    radial-gradient(ellipse 7px 4px at 12% 22%, ${t.a} 96%, transparent),
    radial-gradient(ellipse 5px 8px at 38% 64%, ${t.b} 96%, transparent),
    radial-gradient(ellipse 9px 5px at 68% 30%, ${t.c} 96%, transparent),
    radial-gradient(ellipse 4px 6px at 85% 72%, ${t.a} 96%, transparent),
    radial-gradient(ellipse 6px 5px at 24% 84%, ${t.c} 96%, transparent),
    radial-gradient(ellipse 5px 5px at 56% 12%, ${t.b} 96%, transparent),
    radial-gradient(ellipse 7px 4px at 92% 44%, ${t.b} 96%, transparent);
  background-size: 118px 118px;
}`
    add(mk({
      name: `${t.name} Terrazzo`,
      category: 'Patterns & Textures',
      description: `Seven elliptical chips at irregular positions inside one tile, sized differently so the repeat is much harder to spot than a regular grid.`,
      html, css,
      tags: ['pattern', 'terrazzo', 'speckle', 'chips', 'texture', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MASKS & CLIP PATHS — arch window frame  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-mask-arch-${g.name}`)
    const html = `<div class="${c}"><i></i><span>Atelier</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: end center;
  width: 168px;
  height: 190px;
  padding-bottom: 1.1rem;
  border-radius: 84px 84px 0.5rem 0.5rem;
  overflow: hidden;
  background: linear-gradient(170deg, ${g.a}, ${g.b});
}
.${c} i {
  position: absolute;
  inset: 9px;
  border-radius: 76px 76px 0.3rem 0.3rem;
  box-shadow: inset 0 0 0 1.5px rgba(11,17,32,0.35);
}
.${c} span {
  position: relative;
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #0b1120;
}`
    add(mk({
      name: `${g.name} Arch Window`,
      category: 'Masks & Clip Paths',
      description: `Rounded arch cut with asymmetric border-radius rather than a clip-path, so the inner keyline can follow the same curve at an inset.`,
      html, css,
      tags: ['mask', 'arch', 'window', 'frame', 'editorial', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MASKS & CLIP PATHS — diagonal two-tone split  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-mask-split-${t.name}`)
    const html = `<div class="${c}"><i class="a"><b>BEFORE</b></i><i class="b"><b>AFTER</b></i></div>`
    const css = `.${c} {
  position: relative;
  width: 244px;
  height: 138px;
  overflow: hidden;
  border-radius: 0.6rem;
}
.${c} i {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}
.${c} .a {
  background: linear-gradient(140deg, #1e293b, #0f172a);
  clip-path: polygon(0 0, 62% 0, 38% 100%, 0 100%);
}
.${c} .b {
  background: linear-gradient(140deg, ${t.a}, ${t.b}, ${t.c});
  clip-path: polygon(64% 0, 100% 0, 100% 100%, 40% 100%);
}
.${c} .a b { color: #64748b; transform: translateX(-22%); }
.${c} .b b { color: #0b1120; transform: translateX(20%); }
.${c} b {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.18em;
}`
    add(mk({
      name: `${t.name} Diagonal Split`,
      category: 'Masks & Clip Paths',
      description: `Two panels cut on complementary diagonals with a deliberate gap between them, the labels nudged off-centre so neither straddles the seam.`,
      html, css,
      tags: ['clip-path', 'split', 'diagonal', 'compare', 'two-tone', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CHARTS & DATA — candlestick series  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-chart-candle-${g.name}`)
    const html = `<div class="${c}"><i class="up" style="--t:12%;--h:34%;--b:22%"></i><i class="dn" style="--t:6%;--h:28%;--b:38%"></i><i class="up" style="--t:22%;--h:40%;--b:14%"></i><i class="up" style="--t:8%;--h:30%;--b:30%"></i><i class="dn" style="--t:16%;--h:36%;--b:20%"></i><i class="up" style="--t:4%;--h:46%;--b:26%"></i><i class="dn" style="--t:20%;--h:24%;--b:34%"></i><i class="up" style="--t:10%;--h:42%;--b:18%"></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: stretch;
  gap: 7px;
  width: 282px;
  height: 128px;
  padding: 0.85rem;
  border-radius: 0.6rem;
  background: #0d1424;
  border: 1px solid #1f2937;
}
.${c} i {
  position: relative;
  flex: 1;
}
.${c} i::before {
  content: '';
  position: absolute;
  left: 50%;
  top: var(--t);
  bottom: var(--b);
  width: 1px;
  margin-left: -0.5px;
  background: currentColor;
  opacity: 0.7;
}
.${c} i::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--t) + 6%);
  height: var(--h);
  border-radius: 1px;
  background: currentColor;
}
.${c} .up { color: ${g.a}; }
.${c} .dn { color: ${g.b}; opacity: 0.75; }`
    add(mk({
      name: `${g.name} Candlestick Chart`,
      category: 'Charts & Data',
      description: `OHLC bars where each candle's wick and body come from custom properties on the element, so the data lives in the markup and the CSS stays one rule.`,
      html, css,
      tags: ['chart', 'candlestick', 'ohlc', 'finance', 'trading', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CHARTS & DATA — small-multiple donut row  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-chart-donuts-${t.name}`)
    const html = `<div class="${c}"><div class="d"><i class="d1"><b>78%</b></i><span>CPU</span></div><div class="d"><i class="d2"><b>41%</b></i><span>Memory</span></div><div class="d"><i class="d3"><b>92%</b></i><span>Disk</span></div></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.9rem;
  padding: 0.9rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} .d { text-align: center; }
.${c} i {
  position: relative;
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border-radius: 50%;
}
.${c} i::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: #111827;
}
.${c} .d1 { background: conic-gradient(${t.a} 0turn 0.78turn, rgba(148,163,184,0.16) 0.78turn 1turn); }
.${c} .d2 { background: conic-gradient(${t.b} 0turn 0.41turn, rgba(148,163,184,0.16) 0.41turn 1turn); }
.${c} .d3 { background: conic-gradient(${t.c} 0turn 0.92turn, rgba(148,163,184,0.16) 0.92turn 1turn); }
.${c} b {
  position: relative;
  font-size: 0.7rem;
  font-weight: 700;
  color: #e2e8f0;
  font-variant-numeric: tabular-nums;
}
.${c} span {
  display: block;
  margin-top: 0.45rem;
  font-size: 0.66rem;
  color: #64748b;
}`
    add(mk({
      name: `${t.name} Donut Row`,
      category: 'Charts & Data',
      description: `Three small multiples sharing one scale, so utilisation across resources is comparable at a glance rather than three separate readings.`,
      html, css,
      tags: ['chart', 'donut', 'small multiples', 'utilisation', 'metrics', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TIMELINES & STEPS — horizontal milestone track  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-time-milestone-${g.name}`)
    const html = `<ol class="${c}"><li class="done"><b></b><span>Kickoff</span><em>4 Jan</em></li><li class="done"><b></b><span>Alpha</span><em>18 Feb</em></li><li class="now"><b></b><span>Beta</span><em>14 Mar</em></li><li><b></b><span>GA</span><em>2 May</em></li></ol>`
    const css = `.${c} {
  position: relative;
  display: flex;
  width: 292px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.${c}::before {
  content: '';
  position: absolute;
  left: 12%;
  right: 12%;
  top: 6px;
  height: 2px;
  background: #1e293b;
}
.${c} li {
  position: relative;
  flex: 1;
  text-align: center;
}
.${c} b {
  position: relative;
  z-index: 1;
  display: block;
  width: 13px;
  height: 13px;
  margin: 0 auto;
  border-radius: 50%;
  background: #0b1120;
  box-shadow: inset 0 0 0 2px #334155;
}
.${c} .done b {
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 0 0 3px #0b1120;
}
.${c} .now b {
  background: #0b1120;
  box-shadow: inset 0 0 0 2px ${g.b}, 0 0 0 3px #0b1120, 0 0 0 6px rgba(${rgbOf(g.b)}, 0.2);
  animation: ${c}-pulse 2.1s ease-in-out infinite;
}
.${c} .done:not(:last-child)::after,
.${c} .now:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 6px;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}
.${c} .now:not(:last-child)::after { width: 50%; }
.${c} span {
  display: block;
  margin-top: 0.55rem;
  font-size: 0.73rem;
  font-weight: 600;
  color: #64748b;
}
.${c} .done span, .${c} .now span { color: #e2e8f0; }
.${c} em {
  display: block;
  margin-top: 0.1rem;
  font-style: normal;
  font-size: 0.64rem;
  color: #475569;
}
@keyframes ${c}-pulse {
  50% { box-shadow: inset 0 0 0 2px ${g.b}, 0 0 0 3px #0b1120, 0 0 0 10px rgba(${rgbOf(g.b)}, 0.04); }
}`
    add(mk({
      name: `${g.name} Milestone Track`,
      category: 'Timelines & Steps',
      description: `Roadmap where the current stage fills only half its connector, so "in progress" is visible on the rail rather than only in the node styling.`,
      html, css,
      tags: ['timeline', 'milestones', 'roadmap', 'horizontal', 'dates', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TIMELINES & STEPS — release changelog list  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-time-release-${t.name}`)
    const html = `<ol class="${c}"><li><i>v2.4.0</i><div><b>Saved views</b><span>Pin a filter set across sessions.</span></div></li><li><i>v2.3.1</i><div><b>Auth redirect fix</b><span>SSO no longer loops on expiry.</span></div></li></ol>`
    const css = `.${c} {
  width: 288px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.${c} li {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0;
}
.${c} li + li { border-top: 1px solid #1f2937; }
.${c} i {
  flex: none;
  align-self: flex-start;
  padding: 0.15rem 0.45rem;
  border-radius: 0.25rem;
  font-style: normal;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  font-weight: 600;
  color: #0b1120;
  background: linear-gradient(90deg, ${t.a}, ${t.b});
}
.${c} li + li i {
  color: ${t.c};
  background: rgba(${rgbOf(t.c)}, 0.14);
}
.${c} b {
  display: block;
  font-size: 0.8rem;
  color: #f1f5f9;
}
.${c} span {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.73rem;
  line-height: 1.5;
  color: #94a3b8;
}`
    add(mk({
      name: `${t.name} Release List`,
      category: 'Timelines & Steps',
      description: `Changelog entries with the version as a monospace tag, the latest highlighted so "what shipped most recently" is answerable without reading dates.`,
      html, css,
      tags: ['timeline', 'changelog', 'release', 'version', 'updates', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TABLES & DATA GRIDS — table with sparkline cells  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-table-spark-${g.name}`)
    const html = `<table class="${c}"><thead><tr><th>Metric</th><th>7-day</th><th>Now</th></tr></thead><tbody><tr><td>Sign-ups</td><td><i><b></b><b></b><b></b><b></b><b></b><b></b></i></td><td>412</td></tr><tr><td>Churn</td><td><i class="dn"><b></b><b></b><b></b><b></b><b></b><b></b></i></td><td>0.8%</td></tr><tr><td>MRR</td><td><i><b></b><b></b><b></b><b></b><b></b><b></b></i></td><td>$48k</td></tr></tbody></table>`
    const css = `.${c} {
  width: 292px;
  border-collapse: collapse;
  font-size: 0.76rem;
  border-radius: 0.55rem;
  overflow: hidden;
  background: #111827;
  box-shadow: 0 0 0 1px #1f2937;
}
.${c} th {
  padding: 0.55rem 0.75rem;
  text-align: left;
  font-size: 0.66rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  background: #0f172a;
  border-bottom: 1px solid #1f2937;
}
.${c} th:last-child, .${c} td:last-child { text-align: right; }
.${c} td {
  padding: 0.5rem 0.75rem;
  color: #cbd5e1;
  border-bottom: 1px solid #1f2937;
  font-variant-numeric: tabular-nums;
}
.${c} tr:last-child td { border-bottom: none; }
.${c} tbody tr:hover td { background: rgba(${rgbOf(g.a)}, 0.06); }
.${c} i {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 20px;
}
.${c} i b {
  flex: 1;
  border-radius: 1px;
  background: ${g.a};
}
.${c} i b:nth-child(1) { height: 40%; }
.${c} i b:nth-child(2) { height: 62%; }
.${c} i b:nth-child(3) { height: 48%; }
.${c} i b:nth-child(4) { height: 78%; }
.${c} i b:nth-child(5) { height: 66%; }
.${c} i b:nth-child(6) { height: 100%; }
.${c} .dn b { background: ${g.b}; opacity: 0.7; }
.${c} .dn b:nth-child(1) { height: 100%; }
.${c} .dn b:nth-child(2) { height: 82%; }
.${c} .dn b:nth-child(3) { height: 88%; }
.${c} .dn b:nth-child(4) { height: 60%; }
.${c} .dn b:nth-child(5) { height: 52%; }
.${c} .dn b:nth-child(6) { height: 34%; }`
    add(mk({
      name: `${g.name} Sparkline Table`,
      category: 'Tables & Data Grids',
      description: `Trend column drawn inline per row, so direction and current value sit on the same line instead of in a chart somewhere else on the page.`,
      html, css,
      tags: ['table', 'sparkline', 'trend', 'metrics', 'inline chart', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TABLES & DATA GRIDS — empty state table  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-table-empty-${t.name}`)
    const html = `<div class="${c}"><table><thead><tr><th>Invoice</th><th>Status</th><th>Amount</th></tr></thead></table><div class="empty"><i></i><b>No invoices yet</b><span>They will appear here after your first charge.</span><button>Create one</button></div></div>`
    const css = `.${c} {
  width: 292px;
  border-radius: 0.6rem;
  overflow: hidden;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} table {
  width: 100%;
  border-collapse: collapse;
}
.${c} th {
  padding: 0.55rem 0.75rem;
  text-align: left;
  font-size: 0.66rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  background: #0f172a;
  border-bottom: 1px solid #1f2937;
}
.${c} .empty {
  padding: 1.6rem 1rem 1.4rem;
  text-align: center;
}
.${c} i {
  position: relative;
  display: block;
  width: 40px;
  height: 48px;
  margin: 0 auto 0.8rem;
  border-radius: 0.2rem 0.5rem 0.3rem 0.3rem;
  background: rgba(${rgbOf(t.a)}, 0.14);
  box-shadow: inset 0 0 0 1.5px rgba(${rgbOf(t.a)}, 0.4);
}
.${c} i::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 14px;
  height: 14px;
  background: #111827;
  clip-path: polygon(0 0, 100% 100%, 100% 0);
}
.${c} b {
  display: block;
  font-size: 0.84rem;
  color: #e2e8f0;
}
.${c} span {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.74rem;
  line-height: 1.5;
  color: #64748b;
}
.${c} button {
  margin-top: 0.9rem;
  padding: 0.4rem 1rem;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: #0b1120;
  cursor: pointer;
  background: linear-gradient(90deg, ${t.b}, ${t.c});
}`
    add(mk({
      name: `${t.name} Empty Table`,
      category: 'Tables & Data Grids',
      description: `Zero-row state that keeps the header so the columns still teach what will appear, with one action rather than a bare "no data" line.`,
      html, css,
      tags: ['table', 'empty state', 'zero data', 'placeholder', 'cta', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FORMS & VALIDATION — multi-select combobox  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-form-combo-${g.name}`)
    const html = `<div class="${c}"><label>Assignees</label><div class="field"><span class="chip">AW<b>×</b></span><span class="chip">PR<b>×</b></span><input placeholder="Add…" readonly><i></i></div><div class="menu"><a href="#"><u></u>Jonas Krieg</a><a href="#"><u></u>Mira Osei</a><a href="#"><u></u>Tom Byrne</a></div></div>`
    const css = `.${c} {
  position: relative;
  width: 280px;
}
.${c} label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #cbd5e1;
}
.${c} .field {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 1.8rem 0.45rem 0.5rem;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  background: #111827;
  cursor: text;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.${c}:hover .field { border-color: #475569; }
.${c} .field:focus-within {
  border-color: ${g.a};
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.a)}, 0.16);
}
.${c} .chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.14rem 0.28rem 0.14rem 0.45rem;
  border-radius: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #0b1120;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c} .chip b {
  display: grid;
  place-items: center;
  width: 13px;
  height: 13px;
  border-radius: 0.15rem;
  cursor: pointer;
  background: rgba(11,17,32,0.2);
}
.${c} input {
  flex: 1;
  min-width: 60px;
  border: none;
  outline: none;
  background: transparent;
  color: #e2e8f0;
  font-size: 0.78rem;
}
.${c} .field > i {
  position: absolute;
  right: 0.65rem;
  top: 2.05rem;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid #475569;
}
.${c} .menu {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  margin-top: 0.3rem;
  padding: 0.25rem;
  border-radius: 0.45rem;
  background: #0f172a;
  border: 1px solid #1f2937;
  box-shadow: 0 14px 32px rgba(0,0,0,0.55);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
}
.${c}:focus-within .menu,
.${c}:hover .menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.${c} .menu a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.45rem;
  border-radius: 0.3rem;
  font-size: 0.76rem;
  color: #cbd5e1;
  text-decoration: none;
  transition: background 0.14s ease;
}
.${c} .menu a:hover { background: rgba(${rgbOf(g.a)}, 0.14); }
.${c} u {
  width: 15px;
  height: 15px;
  border: 1.5px solid #475569;
  border-radius: 0.22rem;
}`
    add(mk({
      name: `${g.name} Multi Combobox`,
      category: 'Forms & Validation',
      description: `Chips, a typeahead and an option list in one control, the menu opening on \`:focus-within\` so it survives tabbing into the field.`,
      html, css,
      tags: ['form', 'combobox', 'multiselect', 'chips', 'dropdown', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FORMS & VALIDATION — date range field pair  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-form-range-${t.name}`)
    const html = `<div class="${c}"><label>Reporting period</label><div class="pair"><div class="f"><span>From</span><input value="01 Mar 2026" readonly></div><i></i><div class="f"><span>To</span><input value="31 Mar 2026" readonly></div></div><div class="presets"><button class="on">30d</button><button>90d</button><button>YTD</button></div></div>`
    const css = `.${c} {
  width: 288px;
}
.${c} > label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #cbd5e1;
}
.${c} .pair {
  display: flex;
  align-items: center;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  background: #111827;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.${c} .pair:focus-within {
  border-color: ${t.a};
  box-shadow: 0 0 0 3px rgba(${rgbOf(t.a)}, 0.16);
}
.${c} .f {
  flex: 1;
  min-width: 0;
  padding: 0.4rem 0.6rem;
}
.${c} .f span {
  display: block;
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #475569;
}
.${c} .f input {
  width: 100%;
  margin-top: 0.1rem;
  border: none;
  outline: none;
  background: transparent;
  color: #f1f5f9;
  font-size: 0.8rem;
  font-weight: 600;
}
.${c} .pair > i {
  flex: none;
  width: 11px;
  height: 1.5px;
  border-radius: 1px;
  background: #475569;
}
.${c} .presets {
  display: flex;
  gap: 0.3rem;
  margin-top: 0.5rem;
}
.${c} .presets button {
  padding: 0.22rem 0.6rem;
  border: 1px solid #334155;
  border-radius: 0.3rem;
  background: transparent;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.16s ease, color 0.16s ease, background 0.16s ease;
}
.${c} .presets button:hover { border-color: ${t.b}; color: ${t.b}; }
.${c} .presets .on {
  border-color: transparent;
  color: #0b1120;
  background: linear-gradient(90deg, ${t.a}, ${t.b});
}`
    add(mk({
      name: `${t.name} Date Range`,
      category: 'Forms & Validation',
      description: `Two dates joined by an en-dash inside one focus ring, with quick presets underneath because most range picks are a common span, not an arbitrary one.`,
      html, css,
      tags: ['form', 'date range', 'picker', 'presets', 'filter', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SCROLL & STICKY — sticky table of contents  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-scroll-toc-${g.name}`)
    const html = `<div class="${c}"><nav><a href="#" class="on">Introduction</a><a href="#">Installation</a><a href="#">Configuration</a><a href="#">Deploying</a></nav><div class="body"><i></i><i class="s"></i><i></i><i></i><i class="s"></i><i></i><i></i></div></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.9rem;
  width: 292px;
  height: 172px;
  padding: 0.85rem;
  overflow-y: auto;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
  scrollbar-width: none;
}
.${c}::-webkit-scrollbar { display: none; }
.${c} nav {
  position: sticky;
  top: 0;
  flex: none;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  width: 106px;
}
.${c} a {
  position: relative;
  padding: 0.25rem 0 0.25rem 0.6rem;
  font-size: 0.71rem;
  color: #64748b;
  text-decoration: none;
  border-left: 2px solid #1e293b;
  transition: color 0.18s ease, border-color 0.18s ease;
}
.${c} a:hover { color: #cbd5e1; border-color: #475569; }
.${c} a.on {
  color: ${g.b};
  border-color: ${g.a};
  font-weight: 600;
}
.${c} .body { flex: 1; }
.${c} .body i {
  display: block;
  height: 10px;
  margin-bottom: 0.65rem;
  border-radius: 999px;
  background: #1e293b;
}
.${c} .body .s { width: 58%; }`
    add(mk({
      name: `${g.name} Sticky Contents`,
      category: 'Scroll & Sticky',
      description: `Document outline pinned beside scrolling body copy, the active entry marked by a coloured left rule so the position reads without a filled background.`,
      html, css,
      tags: ['scroll', 'sticky', 'toc', 'contents', 'docs', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SCROLL & STICKY — top reading progress bar  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-scroll-progress-${t.name}`)
    const html = `<div class="${c}"><div class="bar"><i></i></div><div class="body"><i></i><i class="s"></i><i></i><i></i><i class="s"></i><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  position: relative;
  width: 288px;
  height: 168px;
  overflow-y: auto;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
  scrollbar-width: none;
}
.${c}::-webkit-scrollbar { display: none; }
.${c} .bar {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 3px;
  background: #1e293b;
}
.${c} .bar i {
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: left;
  background: linear-gradient(90deg, ${t.a}, ${t.b}, ${t.c});
  animation: ${c}-read 5s ease-in-out infinite alternate;
}
.${c} .body { padding: 0.9rem; }
.${c} .body i {
  display: block;
  height: 10px;
  margin-bottom: 0.7rem;
  border-radius: 999px;
  background: #1e293b;
}
.${c} .body .s { width: 62%; }
@keyframes ${c}-read {
  from { transform: scaleX(0.08); }
  to   { transform: scaleX(1); }
}`
    add(mk({
      name: `${t.name} Reading Bar`,
      category: 'Scroll & Sticky',
      description: `Progress rail stuck to the top of its own scroller, scaled rather than resized so the indicator animates without triggering layout.`,
      html, css,
      tags: ['scroll', 'progress', 'reading', 'sticky', 'article', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SLIDERS & CAROUSELS — vertical level slider  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-slider-vert-${g.name}`)
    const html = `<div class="${c}"><em>72</em><div class="track"><i></i><b></b></div><span></span></div>`
    const css = `.${c} {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 0.9rem 0.7rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} em {
  font-style: normal;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${g.b};
  font-variant-numeric: tabular-nums;
}
.${c} .track {
  position: relative;
  width: 8px;
  height: 118px;
  border-radius: 999px;
  background: #1e293b;
}
.${c} .track i {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 72%;
  border-radius: 999px;
  background: linear-gradient(180deg, ${g.b}, ${g.a});
}
.${c} b {
  position: absolute;
  left: 50%;
  bottom: 72%;
  width: 18px;
  height: 18px;
  margin: 0 0 -9px -9px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 3px solid ${g.a};
  cursor: grab;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}
.${c} b:hover {
  transform: scale(1.16);
  box-shadow: 0 0 0 6px rgba(${rgbOf(g.a)}, 0.18);
}
.${c} span {
  width: 15px;
  height: 12px;
  background: ${g.b};
  clip-path: polygon(0 30%, 45% 30%, 100% 0, 100% 100%, 45% 70%, 0 70%);
}`
    add(mk({
      name: `${g.name} Vertical Slider`,
      category: 'Sliders & Carousels',
      description: `Level control filling upward with the handle anchored to the fill's top edge, so value and thumb cannot drift apart at any height.`,
      html, css,
      tags: ['slider', 'vertical', 'volume', 'level', 'control', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SLIDERS & CAROUSELS — auto testimonial slider  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-slider-auto-${t.name}`)
    const html = `<div class="${c}"><div class="stage"><blockquote>Shipped in a weekend.</blockquote><blockquote>The defaults are right.</blockquote><blockquote>Our designers stopped filing tickets.</blockquote></div><div class="bars"><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  width: 282px;
  padding: 0.9rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} .stage {
  position: relative;
  height: 62px;
}
.${c} blockquote {
  position: absolute;
  inset: 0;
  margin: 0;
  display: grid;
  place-items: center;
  text-align: center;
  font-size: 0.86rem;
  line-height: 1.5;
  color: #cbd5e1;
  opacity: 0;
  animation: ${c}-cycle 12s ease-in-out infinite;
}
.${c} blockquote:nth-child(1) { animation-delay: 0s; }
.${c} blockquote:nth-child(2) { animation-delay: 4s; }
.${c} blockquote:nth-child(3) { animation-delay: 8s; }
.${c} .bars {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.75rem;
}
.${c} .bars i {
  position: relative;
  flex: 1;
  height: 3px;
  border-radius: 2px;
  overflow: hidden;
  background: #1e293b;
}
.${c} .bars i::after {
  content: '';
  position: absolute;
  inset: 0;
  transform-origin: left;
  background: linear-gradient(90deg, ${t.a}, ${t.b}, ${t.c});
  animation: ${c}-fill 12s linear infinite;
}
.${c} .bars i:nth-child(1)::after { animation-delay: 0s; }
.${c} .bars i:nth-child(2)::after { animation-delay: 4s; }
.${c} .bars i:nth-child(3)::after { animation-delay: 8s; }
@keyframes ${c}-cycle {
  0%, 2%    { opacity: 0; transform: translateY(7px); }
  6%, 30%   { opacity: 1; transform: translateY(0); }
  34%, 100% { opacity: 0; transform: translateY(-7px); }
}
@keyframes ${c}-fill {
  0%       { transform: scaleX(0); }
  33%      { transform: scaleX(1); }
  34%, 100%{ transform: scaleX(0); }
}`
    add(mk({
      name: `${t.name} Auto Testimonials`,
      category: 'Sliders & Carousels',
      description: `Quotes cross-fading on a shared twelve-second cycle with progress bars filling in lockstep, so the indicator is the timer rather than a separate loop.`,
      html, css,
      tags: ['carousel', 'testimonials', 'auto', 'progress', 'rotate', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ICONS & SHAPES — trophy award  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-icon-trophy-${g.name}`)
    const html = `<div class="${c}"><i class="cup"></i><i class="stem"></i><i class="base"></i></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 84px;
  height: 92px;
}
.${c} .cup {
  position: absolute;
  top: 12px;
  width: 44px;
  height: 38px;
  border-radius: 0 0 22px 22px;
  background: linear-gradient(160deg, ${g.a}, ${g.b});
  transition: transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} .cup::before,
.${c} .cup::after {
  content: '';
  position: absolute;
  top: 3px;
  width: 14px;
  height: 18px;
  border: 3px solid ${g.b};
  border-radius: 0 9px 9px 0;
}
.${c} .cup::before { left: -15px; transform: scaleX(-1); border-radius: 0 9px 9px 0; }
.${c} .cup::after  { right: -15px; }
.${c} .stem {
  position: absolute;
  top: 50px;
  width: 9px;
  height: 16px;
  background: ${g.b};
}
.${c} .base {
  position: absolute;
  top: 66px;
  width: 40px;
  height: 9px;
  border-radius: 0.2rem;
  background: linear-gradient(90deg, ${g.b}, ${g.a});
}
.${c}:hover .cup { transform: translateY(-4px) rotate(-4deg); }`
    add(mk({
      name: `${g.name} Trophy Icon`,
      category: 'Icons & Shapes',
      description: `Cup, stem and plinth as three elements with the handles as mirrored pseudo-elements, so the whole award is drawn without an image.`,
      html, css,
      tags: ['icon', 'trophy', 'award', 'css art', 'achievement', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ICONS & SHAPES — shield with a lock  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-icon-shield-${t.name}`)
    const html = `<div class="${c}"><i class="sh"><b class="shackle"></b><b class="body"></b></i></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 82px;
  height: 88px;
}
.${c} .sh {
  position: relative;
  display: grid;
  place-items: center;
  width: 58px;
  height: 70px;
  background: linear-gradient(160deg, ${t.a}, ${t.b});
  clip-path: polygon(50% 0, 100% 16%, 100% 58%, 50% 100%, 0 58%, 0 16%);
  transition: filter 0.25s ease;
}
.${c} .sh::before {
  content: '';
  position: absolute;
  inset: 4px;
  background: #0b1120;
  clip-path: polygon(50% 0, 100% 16%, 100% 58%, 50% 100%, 0 58%, 0 16%);
}
.${c} .shackle {
  position: relative;
  z-index: 1;
  width: 14px;
  height: 9px;
  margin-bottom: -1px;
  border: 2.5px solid ${t.c};
  border-bottom: none;
  border-radius: 7px 7px 0 0;
}
.${c} .body {
  position: relative;
  z-index: 1;
  width: 22px;
  height: 16px;
  border-radius: 0.2rem;
  background: ${t.c};
}
.${c}:hover .sh { filter: brightness(1.15) saturate(1.15); }`
    add(mk({
      name: `${t.name} Security Shield`,
      category: 'Icons & Shapes',
      description: `Shield outline made by clipping a filled shape and an inset dark copy to the same polygon, with a padlock drawn from two children.`,
      html, css,
      tags: ['icon', 'shield', 'security', 'lock', 'css art', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MICRO-INTERACTIONS — drag handle with grip  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-micro-drag-${g.name}`)
    const html = `<div class="${c}"><span class="grip"></span><b>Reorder me</b><em>⌘↑↓</em></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 258px;
  padding: 0.65rem 0.8rem;
  border-radius: 0.5rem;
  background: #111827;
  border: 1px solid #1f2937;
  cursor: grab;
  transition: transform 0.2s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.2s ease, border-color 0.2s ease;
}
.${c}:hover {
  transform: translateY(-2px);
  border-color: rgba(${rgbOf(g.a)}, 0.5);
  box-shadow: 0 10px 24px rgba(0,0,0,0.4);
}
.${c}:active {
  cursor: grabbing;
  transform: scale(0.99) rotate(-0.6deg);
}
.${c} .grip {
  flex: none;
  width: 10px;
  height: 16px;
  background:
    radial-gradient(circle, #475569 45%, transparent 46%) 0 0/5px 5px repeat;
  transition: background-image 0.2s ease;
}
.${c}:hover .grip {
  background-image: radial-gradient(circle, ${g.b} 45%, transparent 46%);
}
.${c} b {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  color: #cbd5e1;
}
.${c} em {
  font-style: normal;
  font-size: 0.68rem;
  color: #475569;
}`
    add(mk({
      name: `${g.name} Drag Handle`,
      category: 'Micro-interactions',
      description: `Sortable row whose dotted grip lights on hover and tilts fractionally while held, the cursor switching from grab to grabbing to confirm the state.`,
      html, css,
      tags: ['micro', 'drag', 'handle', 'sortable', 'grip', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MICRO-INTERACTIONS — swipe-to-action row  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-micro-swipe-${t.name}`)
    const html = `<div class="${c}"><div class="tray"><span class="ar">Archive</span><span class="dl">Delete</span></div><div class="row"><i></i><b>Weekly digest</b><em>2h</em></div></div>`
    const css = `.${c} {
  position: relative;
  width: 276px;
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: grab;
}
.${c} .tray {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: flex-end;
}
.${c} .tray span {
  display: grid;
  place-items: center;
  width: 68px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #0b1120;
}
.${c} .ar { background: ${t.b}; }
.${c} .dl { background: ${t.a}; }
.${c} .row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 0.85rem;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 0.5rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c}:hover .row { transform: translateX(-136px); }
.${c} .row i {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(140deg, ${t.b}, ${t.c});
}
.${c} b {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  color: #cbd5e1;
}
.${c} em {
  font-style: normal;
  font-size: 0.68rem;
  color: #475569;
}`
    add(mk({
      name: `${t.name} Swipe Actions`,
      category: 'Micro-interactions',
      description: `List row sliding aside to expose the actions parked behind it, the destructive option furthest out so it takes the longest travel to reach.`,
      html, css,
      tags: ['micro', 'swipe', 'actions', 'list', 'mobile', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FILTERS & BLEND MODES — halftone dot screen  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v8-filter-halftone-${g.name}`)
    const html = `<div class="${c}"><i class="art"></i><i class="dots"></i><span>PRINT</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 232px;
  height: 138px;
  overflow: hidden;
  border-radius: 0.55rem;
  background: #0b1120;
  isolation: isolate;
}
.${c} i { position: absolute; inset: 0; }
.${c} .art {
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c} .dots {
  background-image: radial-gradient(circle, #0b1120 1.6px, transparent 1.7px);
  background-size: 6px 6px;
  mix-blend-mode: normal;
  transition: background-size 0.4s ease;
}
.${c}:hover .dots { background-size: 10px 10px; }
.${c} span {
  position: relative;
  z-index: 1;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.24em;
  color: #0b1120;
  mix-blend-mode: overlay;
}`
    add(mk({
      name: `${g.name} Halftone Screen`,
      category: 'Filters & Blend Modes',
      description: `Repeating dot mask over a gradient, the cell size growing on hover so the screen coarsens the way a print separation would.`,
      html, css,
      tags: ['filter', 'halftone', 'print', 'dots', 'screen', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FILTERS & BLEND MODES — thermal false colour  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v8-filter-thermal-${t.name}`)
    const html = `<div class="${c}"><i class="heat"></i><i class="scan"></i><span>32.4°C</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: end start;
  width: 236px;
  height: 140px;
  padding: 0.6rem 0.7rem;
  overflow: hidden;
  border-radius: 0.55rem;
  background: #06080f;
  isolation: isolate;
}
.${c} i { position: absolute; inset: 0; }
.${c} .heat {
  background:
    radial-gradient(circle at 34% 40%, ${t.c} 0%, ${t.b} 18%, ${t.a} 34%, transparent 55%),
    radial-gradient(circle at 68% 66%, ${t.b} 0%, ${t.a} 22%, transparent 48%),
    linear-gradient(140deg, #0d1a3a, #06080f);
  filter: saturate(1.5) contrast(1.25);
}
.${c} .scan {
  background: repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px);
  mix-blend-mode: overlay;
}
.${c} span {
  position: relative;
  z-index: 1;
  padding: 0.15rem 0.4rem;
  border-radius: 0.2rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  color: #f8fafc;
  background: rgba(6,8,15,0.7);
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 40px rgba(0,0,0,0.7);
  pointer-events: none;
}`
    add(mk({
      name: `${t.name} Thermal Map`,
      category: 'Filters & Blend Modes',
      description: `False-colour heat field from stacked radial gradients under an overlay scanline grid, with a monospace readout for the instrument look.`,
      html, css,
      tags: ['filter', 'thermal', 'heatmap', 'infrared', 'false colour', t.name.toLowerCase()],
    }))
  }
}
