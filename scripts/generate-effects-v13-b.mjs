// scripts/generate-effects-v13-b.mjs
//
// Thirteenth wave, part B: Backgrounds, Inputs & Hover,
// Navigation & Menus, Toggles & Switches. Four designs each.
//
// Shape-budget group: "thinning" for all four — the obvious nouns are
// gone, so each entry is picked against the existing list rather than
// invented freely:
//
//   Backgrounds — aurora curtain, grid pulse, diagonal scan, snowfall
//   Inputs      — counter ring, focus toolbar, copy field, rotating hint
//   Navigation  — drawer toggle, flyout submenu, app grid, expanding rail
//   Toggles     — label track, liquid checkbox, multi-select chips, mute
//
// Background tiles follow the 240x140 rounded-tile convention the rest
// of that category uses. Roots stay visible at rest and no root is
// position:absolute.

export function generateV13B(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Backgrounds                                                         */
  /* ------------------------------------------------------------------ */

  /* BG1. Aurora curtain — vertical ribbons of light shifting height */
  {
    const c = cls('v13-bg-curtain')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  width: 240px;
  height: 140px;
  padding: 0 10px;
  border-radius: 0.75rem;
  overflow: hidden;
  background: linear-gradient(#020617, #071a2b);
  box-shadow: inset 0 -30px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(56,189,248,0.25);
}
.${c} i {
  flex: 1;
  height: 70%;
  border-radius: 40% 40% 0 0;
  background: linear-gradient(180deg, rgba(52,211,153,0) 0%, rgba(52,211,153,0.55) 45%, rgba(56,189,248,0.85) 100%);
  filter: blur(6px);
  transform-origin: bottom;
  animation: ${c}-sway 6s ease-in-out infinite;
}
.${c} i:nth-child(2) { animation-delay: -0.9s; background: linear-gradient(180deg, rgba(167,139,250,0) 0%, rgba(167,139,250,0.5) 45%, rgba(56,189,248,0.8) 100%); }
.${c} i:nth-child(3) { animation-delay: -1.8s; }
.${c} i:nth-child(4) { animation-delay: -2.7s; background: linear-gradient(180deg, rgba(244,114,182,0) 0%, rgba(244,114,182,0.4) 45%, rgba(129,140,248,0.8) 100%); }
.${c} i:nth-child(5) { animation-delay: -3.6s; }
.${c} i:nth-child(6) { animation-delay: -4.5s; }
@keyframes ${c}-sway {
  0%, 100% { transform: scaleY(1) translateY(0); opacity: 0.75; }
  35%      { transform: scaleY(1.35) translateY(-6px); opacity: 1; }
  70%      { transform: scaleY(0.8) translateY(4px); opacity: 0.6; }
}`
    add(mk({
      name: 'Aurora Curtain Bands',
      category: 'Backgrounds',
      description: 'Blurred vertical ribbons of green and violet light that stretch and settle out of phase, like an aurora curtain over a dark horizon.',
      html, css,
      tags: ['aurora', 'curtain', 'ribbons', 'blur', 'night'],
    }))
  }

  /* BG2. Grid pulse — a lattice whose cells brighten in a travelling wave */
  {
    const c = cls('v13-bg-gridpulse')
    const html = `<div class="${c}"><span></span></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  overflow: hidden;
  background-color: #0b1120;
  background-image:
    linear-gradient(90deg, rgba(99,102,241,0.28) 1px, transparent 1px),
    linear-gradient(rgba(99,102,241,0.28) 1px, transparent 1px);
  background-size: 24px 24px;
  box-shadow: 0 0 0 1px rgba(99,102,241,0.3);
}
.${c} span {
  position: absolute;
  inset: -40%;
  background: radial-gradient(circle at 50% 50%, rgba(129,140,248,0.55) 0%, rgba(129,140,248,0.12) 32%, transparent 60%);
  animation: ${c}-sweep 5s ease-in-out infinite;
}
@keyframes ${c}-sweep {
  0%   { transform: translate(-18%, -14%) scale(0.7); }
  50%  { transform: translate(16%, 12%) scale(1.05); }
  100% { transform: translate(-18%, -14%) scale(0.7); }
}`
    add(mk({
      name: 'Grid Pulse Field',
      category: 'Backgrounds',
      description: 'Indigo lattice with a soft radial pulse wandering behind it, lighting different cells of the grid as it passes.',
      html, css,
      tags: ['grid', 'pulse', 'lattice', 'glow', 'wander'],
    }))
  }

  /* BG3. Diagonal scan — a bright bar sweeping across a hatched field */
  {
    const c = cls('v13-bg-scan')
    const html = `<div class="${c}"><span></span></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  overflow: hidden;
  background-color: #0f172a;
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(148,163,184,0.10) 0 2px,
    transparent 2px 10px
  );
  box-shadow: 0 0 0 1px rgba(148,163,184,0.2);
}
.${c} span {
  position: absolute;
  top: -60%;
  bottom: -60%;
  left: -30%;
  width: 60px;
  background: linear-gradient(90deg, transparent, rgba(56,189,248,0.55), rgba(224,242,254,0.9), rgba(56,189,248,0.55), transparent);
  filter: blur(3px);
  transform: rotate(18deg);
  animation: ${c}-pass 3.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes ${c}-pass {
  0%       { left: -30%; opacity: 0; }
  12%      { opacity: 1; }
  70%      { opacity: 1; }
  85%, 100% { left: 105%; opacity: 0; }
}`
    add(mk({
      name: 'Diagonal Scan Sweep',
      category: 'Backgrounds',
      description: 'Hatched dark field crossed at an angle by a soft blue scanning bar that fades in at one edge and out at the other.',
      html, css,
      tags: ['scan', 'sweep', 'hatch', 'beam', 'diagonal'],
    }))
  }

  /* BG4. Snowfall — three layers of drifting flakes at different depths */
  {
    const c = cls('v13-bg-snow')
    const html = `<div class="${c}"><i class="a"></i><i class="b"></i><i class="d"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  overflow: hidden;
  background: linear-gradient(180deg, #0f172a, #1e293b);
  box-shadow: 0 0 0 1px rgba(226,232,240,0.18);
}
.${c} i {
  position: absolute;
  left: 0;
  right: 0;
  top: -100%;
  height: 200%;
  background-repeat: repeat;
}
.${c} .a {
  background-image: radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1.5px);
  background-size: 34px 34px;
  animation: ${c}-fall 7s linear infinite;
}
.${c} .b {
  background-image: radial-gradient(circle, rgba(255,255,255,0.6) 1.5px, transparent 2px);
  background-size: 52px 52px;
  background-position: 12px 0;
  animation: ${c}-fall 11s linear infinite;
}
.${c} .d {
  background-image: radial-gradient(circle, rgba(255,255,255,0.35) 2px, transparent 2.5px);
  background-size: 78px 78px;
  background-position: 30px 0;
  animation: ${c}-fall 16s linear infinite;
  filter: blur(1px);
}
@keyframes ${c}-fall {
  from { transform: translateY(0); }
  to   { transform: translateY(50%); }
}`
    add(mk({
      name: 'Snowfall Drift',
      category: 'Backgrounds',
      description: 'Three parallax layers of white flakes falling at different speeds and sizes, the furthest layer blurred for depth.',
      html, css,
      tags: ['snow', 'parallax', 'falling', 'winter', 'layers'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Inputs & Hover                                                      */
  /* ------------------------------------------------------------------ */

  /* IN1. Counter ring — a conic budget ring beside a length-limited field */
  {
    const c = cls('v13-in-counterring')
    const html = `<label class="${c}"><input type="text" value="Ship it on Friday" /><span><b>132</b></span></label>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 250px;
  padding: 0.45rem 0.5rem 0.45rem 0.85rem;
  background: #111827;
  border: 1px solid #334155;
  border-radius: 0.6rem;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.${c} input {
  flex: 1;
  min-width: 0;
  font: inherit;
  font-size: 0.82rem;
  color: #e2e8f0;
  background: none;
  border: none;
  outline: none;
}
.${c} input::placeholder { color: #64748b; }
.${c} span {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: conic-gradient(#22d3ee 0 62%, rgba(148,163,184,0.22) 62% 100%);
  transition: background 0.3s ease;
}
.${c} span::before {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #111827;
}
.${c} span b {
  position: relative;
  font-size: 0.6rem;
  font-weight: 600;
  color: #67e8f9;
}
.${c}:focus-within { border-color: #22d3ee; box-shadow: 0 0 0 3px rgba(34,211,238,0.16); }
.${c}:focus-within span { background: conic-gradient(#22d3ee 0 78%, rgba(148,163,184,0.22) 78% 100%); }`
    add(mk({
      name: 'Counter Ring Field',
      category: 'Inputs & Hover',
      description: 'Text field with a conic character-budget ring in the trailing slot, filling further as the field takes focus.',
      html, css,
      tags: ['counter', 'ring', 'conic', 'limit', 'field'],
    }))
  }

  /* IN2. Focus toolbar — a formatting bar unfolds when the textarea focuses */
  {
    const c = cls('v13-in-toolbar')
    const html = `<div class="${c}"><div class="t"><b>B</b><i>I</i><u>U</u><s>S</s><span>&lt;/&gt;</span></div><textarea rows="2">Notes for the release…</textarea></div>`
    const css = `.${c} {
  width: 250px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.6rem;
  overflow: hidden;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.${c} .t {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0 0.5rem;
  max-height: 0;
  opacity: 0;
  border-bottom: 1px solid transparent;
  background: #131c31;
  transition: max-height 0.28s ease, opacity 0.2s ease, padding 0.28s ease, border-color 0.28s ease;
}
.${c} .t > * {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  font-size: 0.72rem;
  font-style: normal;
  color: #94a3b8;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.${c} .t > *:hover { background: #1e293b; color: #e2e8f0; }
.${c} .t b { font-weight: 800; }
.${c} .t i { font-style: italic; font-family: Georgia, serif; }
.${c} .t span { font-family: ui-monospace, monospace; font-size: 0.6rem; }
.${c} textarea {
  display: block;
  width: 100%;
  padding: 0.6rem 0.7rem;
  font: inherit;
  font-size: 0.8rem;
  line-height: 1.5;
  color: #e2e8f0;
  background: none;
  border: none;
  outline: none;
  resize: none;
}
.${c}:focus-within { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(129,140,248,0.16); }
.${c}:focus-within .t { max-height: 34px; opacity: 1; padding: 0.3rem 0.5rem; border-bottom-color: #253049; }`
    add(mk({
      name: 'Focus Toolbar Textarea',
      category: 'Inputs & Hover',
      description: 'Comment box that keeps its formatting toolbar folded away until the textarea is focused, when the bar unrolls above it.',
      html, css,
      tags: ['textarea', 'toolbar', 'focus-within', 'unfold', 'editor'],
    }))
  }

  /* IN3. Copy field — read-only value with a button that swaps to a tick */
  {
    const c = cls('v13-in-copy')
    const html = `<div class="${c}"><code>hvr_live_8f31c2a9</code><button><span class="i">Copy</span><span class="o">✓ Copied</span></button></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 252px;
  padding: 0.35rem 0.35rem 0.35rem 0.7rem;
  background: #0b1220;
  border: 1px dashed #334155;
  border-radius: 0.6rem;
  transition: border-color 0.25s ease;
}
.${c} code {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.74rem;
  color: #a5b4fc;
}
.${c} button {
  position: relative;
  flex: none;
  width: 76px;
  height: 26px;
  overflow: hidden;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  color: #cbd5e1;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.${c} button span {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  transition: transform 0.28s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.2s ease;
}
.${c} button .o { transform: translateY(100%); opacity: 0; color: #6ee7b7; }
.${c} button:hover { border-color: #475569; background: #243146; }
.${c} button:active .i { transform: translateY(-100%); opacity: 0; }
.${c} button:active .o { transform: translateY(0); opacity: 1; }
.${c}:hover { border-color: #4f46e5; }`
    add(mk({
      name: 'Copy Field',
      category: 'Inputs & Hover',
      description: 'Read-only key field with a trailing button whose label rolls up to a green confirmation while it is held.',
      html, css,
      tags: ['copy', 'clipboard', 'readonly', 'roll', 'api-key'],
    }))
  }

  /* IN4. Rotating hint — the placeholder cycles through example queries */
  {
    const c = cls('v13-in-hint')
    const html = `<label class="${c}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span class="h"><i>gradient buttons</i><i>glass cards</i><i>neon text</i></span><input type="text" /></label>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 250px;
  padding: 0.6rem 0.85rem;
  color: #64748b;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 999px;
  overflow: hidden;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.${c} svg { flex: none; }
.${c} .h {
  position: relative;
  flex: 1;
  height: 1.15rem;
  overflow: hidden;
  font-size: 0.8rem;
}
.${c} .h i {
  position: absolute;
  left: 0;
  right: 0;
  font-style: normal;
  color: #64748b;
  opacity: 0;
  animation: ${c}-cycle 9s ease-in-out infinite;
}
.${c} .h i:nth-child(1) { animation-delay: 0s; }
.${c} .h i:nth-child(2) { animation-delay: 3s; }
.${c} .h i:nth-child(3) { animation-delay: 6s; }
.${c} input {
  position: absolute;
  inset: 0;
  padding: 0 0.85rem 0 2.1rem;
  font: inherit;
  font-size: 0.8rem;
  color: #e2e8f0;
  background: none;
  border: none;
  outline: none;
}
.${c}:focus-within { border-color: #34d399; box-shadow: 0 0 0 3px rgba(52,211,153,0.14); }
.${c}:focus-within .h { opacity: 0.35; }
@keyframes ${c}-cycle {
  0%          { transform: translateY(110%); opacity: 0; }
  5%, 28%     { transform: translateY(0); opacity: 1; }
  33%, 100%   { transform: translateY(-110%); opacity: 0; }
}`
    add(mk({
      name: 'Rotating Hint Field',
      category: 'Inputs & Hover',
      description: 'Search pill whose placeholder scrolls through example queries on a loop and dims out of the way once you focus it.',
      html, css,
      tags: ['search', 'placeholder', 'rotate', 'hints', 'pill'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Navigation & Menus                                                  */
  /* ------------------------------------------------------------------ */

  /* NAV1. Drawer toggle — a checkbox-driven slide-out panel */
  {
    const c = cls('v13-nav-drawer')
    const html = `<div class="${c}"><input type="checkbox" id="${c}-t" /><label for="${c}-t"><i></i><i></i><i></i></label><nav><a>Overview</a><a>Effects</a><a>Blocks</a><a>Pricing</a></nav></div>`
    const css = `.${c} {
  position: relative;
  width: 236px;
  height: 150px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 0.7rem;
  overflow: hidden;
}
.${c} input { position: absolute; opacity: 0; pointer-events: none; }
.${c} label {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  z-index: 2;
  display: grid;
  gap: 4px;
  width: 30px;
  padding: 7px 5px;
  background: #1e293b;
  border-radius: 0.4rem;
  cursor: pointer;
}
.${c} label i {
  display: block;
  height: 2px;
  background: #e2e8f0;
  border-radius: 2px;
  transition: transform 0.3s ease, opacity 0.2s ease;
}
.${c} nav {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 130px;
  display: grid;
  align-content: start;
  gap: 0.1rem;
  padding: 3rem 0.5rem 0.5rem;
  background: #16213a;
  border-right: 1px solid #253049;
  transform: translateX(-100%);
  transition: transform 0.36s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} nav a {
  padding: 0.35rem 0.5rem;
  font-size: 0.76rem;
  color: #94a3b8;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}
.${c} nav a:hover { background: #1e293b; color: #f1f5f9; }
.${c} input:checked ~ nav { transform: translateX(0); }
.${c} input:checked ~ label i:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.${c} input:checked ~ label i:nth-child(2) { opacity: 0; }
.${c} input:checked ~ label i:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }`
    add(mk({
      name: 'Drawer Toggle Nav',
      category: 'Navigation & Menus',
      description: 'Hamburger button that morphs into a close icon while sliding a navigation drawer in from the left, driven entirely by a checkbox.',
      html, css,
      tags: ['drawer', 'hamburger', 'checkbox', 'slide', 'mobile'],
    }))
  }

  /* NAV2. Flyout submenu — a second level opens to the right on hover */
  {
    const c = cls('v13-nav-flyout')
    const html = `<ul class="${c}"><li>Dashboard</li><li class="p">Workspace<span>›</span><ul><li>Members</li><li>Billing</li><li>Tokens</li></ul></li><li>Settings</li></ul>`
    const css = `.${c} {
  position: relative;
  width: 132px;
  margin: 0;
  padding: 0.3rem;
  list-style: none;
  background: #131a2b;
  border: 1px solid #253049;
  border-radius: 0.55rem;
  box-shadow: 0 14px 30px rgba(0,0,0,0.45);
  font-size: 0.76rem;
  color: #cbd5e1;
}
.${c} > li {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.55rem;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} > li:hover { background: #4f46e5; color: #fff; }
.${c} .p > span { transition: transform 0.2s ease; }
.${c} .p:hover > span { transform: translateX(2px); }
.${c} ul {
  position: absolute;
  top: -0.3rem;
  left: 100%;
  margin: 0 0 0 6px;
  padding: 0.3rem;
  list-style: none;
  width: 104px;
  background: #131a2b;
  border: 1px solid #253049;
  border-radius: 0.55rem;
  box-shadow: 0 14px 30px rgba(0,0,0,0.5);
  opacity: 0;
  visibility: hidden;
  transform: translateX(-6px);
  transition: opacity 0.2s ease, transform 0.24s ease, visibility 0.24s;
}
.${c} ul li {
  padding: 0.35rem 0.5rem;
  color: #cbd5e1;
  border-radius: 0.3rem;
  transition: background 0.16s ease;
}
.${c} ul li:hover { background: #1e293b; }
.${c} .p:hover > ul { opacity: 1; visibility: visible; transform: translateX(0); }`
    add(mk({
      name: 'Flyout Submenu',
      category: 'Navigation & Menus',
      description: 'Menu row with a chevron that opens a second-level panel alongside it, sliding in from behind the parent on hover.',
      html, css,
      tags: ['submenu', 'flyout', 'nested', 'menu', 'hover'],
    }))
  }

  /* NAV3. App grid — a launcher of app tiles behind a dotted trigger */
  {
    const c = cls('v13-nav-appgrid')
    const html = `<div class="${c}"><button><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></button><div class="g"><a><span class="a"></span>Docs</a><a><span class="b"></span>Mail</a><a><span class="d"></span>Drive</a><a><span class="e"></span>Chat</a><a><span class="f"></span>Board</a><a><span class="h"></span>More</a></div></div>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding-bottom: 0.2rem;
}
.${c} button {
  display: grid;
  grid-template-columns: repeat(3, 4px);
  gap: 3px;
  padding: 7px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.45rem;
  cursor: pointer;
  transition: background 0.2s ease;
}
.${c} button i { display: block; width: 4px; height: 4px; border-radius: 50%; background: #cbd5e1; }
.${c} button:hover { background: #334155; }
.${c} .g {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  display: grid;
  grid-template-columns: repeat(3, 58px);
  gap: 0.25rem;
  padding: 0.5rem;
  background: #131a2b;
  border: 1px solid #253049;
  border-radius: 0.6rem;
  box-shadow: 0 16px 34px rgba(0,0,0,0.5);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-6px) scale(0.96);
  transform-origin: top left;
  transition: opacity 0.2s ease, transform 0.24s cubic-bezier(0.34, 1.4, 0.64, 1), visibility 0.24s;
}
.${c} .g a {
  display: grid;
  justify-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.2rem;
  font-size: 0.63rem;
  color: #94a3b8;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} .g a span { width: 20px; height: 20px; border-radius: 6px; }
.${c} .g .a { background: linear-gradient(135deg, #38bdf8, #0284c7); }
.${c} .g .b { background: linear-gradient(135deg, #f472b6, #db2777); }
.${c} .g .d { background: linear-gradient(135deg, #fbbf24, #d97706); }
.${c} .g .e { background: linear-gradient(135deg, #34d399, #059669); }
.${c} .g .f { background: linear-gradient(135deg, #a78bfa, #7c3aed); }
.${c} .g .h { background: linear-gradient(135deg, #94a3b8, #475569); }
.${c} .g a:hover { background: #1e293b; color: #f1f5f9; }
.${c}:hover .g { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }`
    add(mk({
      name: 'App Grid Menu',
      category: 'Navigation & Menus',
      description: 'Nine-dot launcher button that springs open a grid of coloured app tiles anchored to its top-left corner.',
      html, css,
      tags: ['launcher', 'grid', 'apps', 'dropdown', 'tiles'],
    }))
  }

  /* NAV4. Expanding rail — an icon rail that widens to show labels */
  {
    const c = cls('v13-nav-rail')
    const html = `<nav class="${c}"><a><i class="h"></i><span>Home</span></a><a class="on"><i class="s"></i><span>Search</span></a><a><i class="b"></i><span>Library</span></a><a><i class="g"></i><span>Settings</span></a></nav>`
    const css = `.${c} {
  display: grid;
  align-content: start;
  gap: 0.2rem;
  width: 52px;
  padding: 0.45rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 0.7rem;
  overflow: hidden;
  transition: width 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} a {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.42rem 0.5rem;
  border-radius: 0.45rem;
  color: #94a3b8;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.18s ease, color 0.18s ease;
}
.${c} a i {
  flex: none;
  width: 15px;
  height: 15px;
  border-radius: 4px;
  background: currentColor;
  opacity: 0.85;
}
.${c} .s { border-radius: 50%; }
.${c} .b { clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%); }
.${c} .g { clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); }
.${c} a span {
  font-size: 0.75rem;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.2s ease, transform 0.28s ease;
}
.${c} a:hover { background: #1e293b; color: #e2e8f0; }
.${c} .on { background: #1d283d; color: #7dd3fc; }
.${c}:hover { width: 142px; }
.${c}:hover a span { opacity: 1; transform: translateX(0); }`
    add(mk({
      name: 'Expanding Sidebar Rail',
      category: 'Navigation & Menus',
      description: 'Narrow icon rail that widens on hover to bring its labels in from the left, keeping the active row highlighted throughout.',
      html, css,
      tags: ['sidebar', 'rail', 'expand', 'icons', 'labels'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Toggles & Switches                                                  */
  /* ------------------------------------------------------------------ */

  /* TG1. Label track — ON/OFF words scroll inside the track */
  {
    const c = cls('v13-tg-labeltrack')
    const html = `<label class="${c}"><input type="checkbox" checked /><span class="t"><b>ON</b><b>OFF</b><i></i></span></label>`
    const css = `.${c} {
  display: inline-flex;
  cursor: pointer;
}
.${c} input { position: absolute; opacity: 0; pointer-events: none; }
.${c} .t {
  position: relative;
  display: block;
  width: 78px;
  height: 32px;
  border-radius: 999px;
  background: #334155;
  overflow: hidden;
  transition: background 0.3s ease;
}
.${c} .t b {
  position: absolute;
  top: 0;
  width: 46px;
  line-height: 32px;
  text-align: center;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  transition: transform 0.34s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.24s ease;
}
.${c} .t b:nth-child(1) { left: 0; color: #052e16; transform: translateX(0); opacity: 0; }
.${c} .t b:nth-child(2) { right: 0; color: #cbd5e1; transform: translateX(0); opacity: 1; }
.${c} .t i {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #f8fafc;
  box-shadow: 0 2px 6px rgba(0,0,0,0.45);
  transition: transform 0.34s cubic-bezier(0.65, 0, 0.35, 1);
}
.${c} input:checked + .t { background: #22c55e; }
.${c} input:checked + .t b:nth-child(1) { opacity: 1; }
.${c} input:checked + .t b:nth-child(2) { opacity: 0; transform: translateX(14px); }
.${c} input:checked + .t i { transform: translateX(46px); }`
    add(mk({
      name: 'Label Track Switch',
      category: 'Toggles & Switches',
      description: 'Wide switch that carries the words ON and OFF inside its track, each sliding out of view as the knob takes its place.',
      html, css,
      tags: ['switch', 'label', 'track', 'on-off', 'slide'],
    }))
  }

  /* TG2. Liquid checkbox — the box floods with a wavy fill when ticked */
  {
    const c = cls('v13-tg-liquid')
    const html = `<label class="${c}"><input type="checkbox" checked /><span class="b"><em></em><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 7"/></svg></span><span class="l">Sync offline copies</span></label>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.82rem;
  color: #cbd5e1;
  cursor: pointer;
}
.${c} input { position: absolute; opacity: 0; pointer-events: none; }
.${c} .b {
  position: relative;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 0.45rem;
  border: 2px solid #475569;
  overflow: hidden;
  color: #06251c;
  transition: border-color 0.3s ease;
}
.${c} .b em {
  position: absolute;
  left: -50%;
  right: -50%;
  bottom: 0;
  height: 200%;
  background: #2dd4bf;
  border-radius: 42% 45% 0 0;
  transform: translateY(100%) rotate(0deg);
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .b svg {
  position: relative;
  opacity: 0;
  transform: scale(0.5);
  transition: opacity 0.2s ease 0.18s, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.18s;
}
.${c} input:checked + .b { border-color: #2dd4bf; }
.${c} input:checked + .b em { transform: translateY(50%) rotate(180deg); animation: ${c}-slosh 4s ease-in-out infinite; }
.${c} input:checked + .b svg { opacity: 1; transform: scale(1); }
@keyframes ${c}-slosh {
  0%   { transform: translateY(50%) rotate(180deg); }
  50%  { transform: translateY(48%) rotate(200deg); }
  100% { transform: translateY(50%) rotate(180deg); }
}`
    add(mk({
      name: 'Liquid Fill Checkbox',
      category: 'Toggles & Switches',
      description: 'Checkbox that floods with teal liquid rising on a curved surface, the tick springing in once the box is full.',
      html, css,
      tags: ['checkbox', 'liquid', 'fill', 'wave', 'tick'],
    }))
  }

  /* TG3. Multi-select chips — a row of chips that latch on when picked */
  {
    const c = cls('v13-tg-chips')
    const html = `<div class="${c}"><label><input type="checkbox" checked /><span>Motion</span></label><label><input type="checkbox" /><span>Glass</span></label><label><input type="checkbox" checked /><span>Neon</span></label><label><input type="checkbox" /><span>Retro</span></label></div>`
    const css = `.${c} {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  width: 220px;
}
.${c} input { position: absolute; opacity: 0; pointer-events: none; }
.${c} label { cursor: pointer; }
.${c} span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.32rem 0.75rem;
  font-size: 0.75rem;
  color: #94a3b8;
  background: #16203a;
  border: 1px solid #2b3852;
  border-radius: 999px;
  transition: background 0.22s ease, color 0.22s ease, border-color 0.22s ease, padding 0.22s ease;
}
.${c} span::before {
  content: '✓';
  width: 0;
  overflow: hidden;
  font-size: 0.7rem;
  opacity: 0;
  transition: width 0.22s ease, opacity 0.18s ease;
}
.${c} label:hover span { border-color: #475569; color: #cbd5e1; }
.${c} input:checked + span {
  color: #052e16;
  background: #4ade80;
  border-color: #4ade80;
}
.${c} input:checked + span::before { width: 0.8em; opacity: 1; }`
    add(mk({
      name: 'Multi-Select Chips',
      category: 'Toggles & Switches',
      description: 'Row of filter chips that flip to a solid green pill and grow a tick from nothing as each one is selected.',
      html, css,
      tags: ['chips', 'multi-select', 'filter', 'checkbox', 'tick'],
    }))
  }

  /* TG4. Mute toggle — sound bars collapse and a slash strikes through */
  {
    const c = cls('v13-tg-mute')
    const html = `<label class="${c}"><input type="checkbox" /><span class="s"><b></b><i></i><i></i><i></i><u></u></span></label>`
    const css = `.${c} {
  display: inline-flex;
  cursor: pointer;
}
.${c} input { position: absolute; opacity: 0; pointer-events: none; }
.${c} .s {
  position: relative;
  display: flex;
  align-items: center;
  gap: 3px;
  width: 62px;
  height: 42px;
  padding: 0 0.6rem;
  background: #172033;
  border: 1px solid #2b3852;
  border-radius: 0.6rem;
  transition: background 0.25s ease, border-color 0.25s ease;
}
.${c} .s b {
  flex: none;
  width: 8px;
  height: 12px;
  background: #7dd3fc;
  clip-path: polygon(0 30%, 45% 30%, 100% 0, 100% 100%, 45% 70%, 0 70%);
  transition: background 0.25s ease;
}
.${c} .s i {
  display: block;
  width: 3px;
  border-radius: 2px;
  background: #38bdf8;
  animation: ${c}-eq 1s ease-in-out infinite;
}
.${c} .s i:nth-child(2) { height: 10px; animation-delay: 0s; }
.${c} .s i:nth-child(3) { height: 16px; animation-delay: 0.18s; }
.${c} .s i:nth-child(4) { height: 8px;  animation-delay: 0.36s; }
.${c} .s u {
  position: absolute;
  left: 8px;
  right: 8px;
  top: 50%;
  height: 2px;
  background: #f87171;
  border-radius: 2px;
  transform: rotate(-28deg) scaleX(0);
  transform-origin: left center;
  transition: transform 0.28s cubic-bezier(0.65, 0, 0.35, 1);
}
@keyframes ${c}-eq {
  0%, 100% { transform: scaleY(1); }
  50%      { transform: scaleY(0.45); }
}
.${c} input:checked + .s { background: #1a1416; border-color: #4c2226; }
.${c} input:checked + .s b { background: #64748b; }
.${c} input:checked + .s i { animation: none; transform: scaleY(0.25); background: #475569; }
.${c} input:checked + .s u { transform: rotate(-28deg) scaleX(1); }`
    add(mk({
      name: 'Mute Toggle',
      category: 'Toggles & Switches',
      description: 'Speaker control whose equaliser bars bounce while sound is on, then flatten as a red slash strikes across on mute.',
      html, css,
      tags: ['mute', 'sound', 'equalizer', 'slash', 'audio'],
    }))
  }
}
