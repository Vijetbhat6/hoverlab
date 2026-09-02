// scripts/generate-effects-v14-c.mjs
//
// Fourteenth wave, part C: Tooltips & Popovers, Entrance Animations,
// Avatars & Images, Modals & Overlays. Four designs each.
//
//   Tooltips  — shared sliding tooltip on a toolbar rail, cascading
//               submenu flyout, overflow-tag counter popover, password
//               rules popover with a strength meter
//   Entrance  — iris clip-path open, four-quadrant assemble, parabolic
//               arc toss into a slot, skeleton-to-content swap
//   Avatars   — before/after compare wipe, accordion photo strip,
//               crop frame with aspect swap, paused avatar marquee
//   Modals    — cookie consent bar that expands its categories, fanning
//               toast stack, drag-and-drop zone, screen-share pill
//
// Entrance animations run once with `both` — they are entrances, not
// loops. Every panel here is built at preview-tile scale: nothing is
// taller than 152px, so no dialog outgrows the 180px detail preview.

export function generateV14C(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Tooltips & Popovers                                                 */
  /* ------------------------------------------------------------------ */

  /* TT1. Sliding rail — one tooltip pill shared by five buttons */
  {
    const c = cls('v14-tt-rail')
    const html = `<div class="${c}"><b class="k">B</b><b class="k"><i>I</i></b><b class="k">U</b><b class="k">S</b><b class="k"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7"/></svg></b><em><i>Bold</i><i>Italic</i><i>Underline</i><i>Strike</i><i>Link</i></em></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  gap: 4px;
  padding: 5px;
  background: #151d31;
  border: 1px solid #29344d;
  border-radius: 0.6rem;
  box-shadow: 0 10px 24px rgba(0,0,0,0.45);
}
.${c} .k {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #94a3b8;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}
.${c} .k i { font-style: italic; font-family: Georgia, serif; }
.${c} .k:nth-child(3) { text-decoration: underline; }
.${c} .k:nth-child(4) { text-decoration: line-through; }
.${c} .k:hover { background: #243149; color: #e2e8f0; }
.${c} em {
  position: absolute;
  bottom: calc(100% + 9px);
  left: 20px;
  display: grid;
  padding: 0.2rem 0.45rem;
  font-style: normal;
  font-size: 0.64rem;
  font-weight: 600;
  white-space: nowrap;
  color: #0f172a;
  background: #e2e8f0;
  border-radius: 0.3rem;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.16s ease;
}
.${c} em i { grid-area: 1 / 1; font-style: normal; text-align: center; opacity: 0; transition: opacity 0.14s ease; }
.${c} em::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -4px;
  border: 4px solid transparent;
  border-top-color: #e2e8f0;
}
.${c} .k:hover ~ em { opacity: 1; }
.${c} .k:nth-child(1):hover ~ em { left: 20px; }
.${c} .k:nth-child(2):hover ~ em { left: 54px; }
.${c} .k:nth-child(3):hover ~ em { left: 88px; }
.${c} .k:nth-child(4):hover ~ em { left: 122px; }
.${c} .k:nth-child(5):hover ~ em { left: 156px; }
.${c} .k:nth-child(1):hover ~ em i:nth-child(1) { opacity: 1; }
.${c} .k:nth-child(2):hover ~ em i:nth-child(2) { opacity: 1; }
.${c} .k:nth-child(3):hover ~ em i:nth-child(3) { opacity: 1; }
.${c} .k:nth-child(4):hover ~ em i:nth-child(4) { opacity: 1; }
.${c} .k:nth-child(5):hover ~ em i:nth-child(5) { opacity: 1; }`
    add(mk({
      name: 'Sliding Tooltip Rail',
      category: 'Tooltips & Popovers',
      description: 'Formatting toolbar served by a single tooltip pill that glides sideways to sit over whichever button the pointer reaches, swapping its label as it travels.',
      html, css,
      tags: ['tooltip', 'toolbar', 'shared', 'slide', 'rail'],
    }))
  }

  /* TT2. Cascading submenu — a menu row that unfolds a flyout beside it */
  {
    const c = cls('v14-tt-cascade')
    const html = `<div class="${c}"><i class="l"></i><i class="l"></i><i class="l"></i><i class="l"></i><div class="m"><span class="it">Open</span><span class="it">Rename</span><span class="it s">Share<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg><span class="sub"><span class="it">Copy link</span><span class="it">Email invite</span><span class="it">Embed code</span></span></span><span class="it d">Delete</span></div></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 134px;
  padding: 12px;
  background: #0d1424;
  border: 1px solid #1e293b;
  border-radius: 0.7rem;
  overflow: hidden;
}
.${c} .l {
  display: block;
  height: 7px;
  margin-bottom: 9px;
  border-radius: 4px;
  background: #182034;
}
.${c} .l:nth-child(1) { width: 62%; }
.${c} .l:nth-child(2) { width: 88%; }
.${c} .l:nth-child(3) { width: 74%; }
.${c} .l:nth-child(4) { width: 46%; }
.${c} .m {
  position: absolute;
  top: 14px;
  left: 12px;
  width: 116px;
  padding: 4px;
  font-size: 0.7rem;
  background: #1a2438;
  border: 1px solid #2c3a56;
  border-radius: 0.5rem;
  box-shadow: 0 16px 32px rgba(0,0,0,0.6);
}
.${c} .it {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.24rem 0.4rem;
  color: #cbd5e1;
  border-radius: 0.3rem;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} .it:hover { background: #26334d; color: #f8fafc; }
.${c} .d { color: #fb7185; }
.${c} .d:hover { background: #3a1d2a; color: #fda4af; }
.${c} .s { position: relative; }
.${c} .s svg { color: #64748b; }
.${c} .sub {
  position: absolute;
  top: -26px;
  left: calc(100% + 8px);
  width: 96px;
  padding: 4px;
  background: #1a2438;
  border: 1px solid #2c3a56;
  border-radius: 0.5rem;
  box-shadow: 0 16px 32px rgba(0,0,0,0.6);
  opacity: 0;
  transform: translateX(-8px);
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.24s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.${c} .s:hover { background: #26334d; color: #f8fafc; }
.${c} .s:hover .sub { opacity: 1; transform: translateX(0); }`
    add(mk({
      name: 'Cascading Submenu Popover',
      category: 'Tooltips & Popovers',
      description: 'Context menu laid over a page whose chevroned row unfolds a second panel sideways, the flyout sliding out from under its parent as the pointer arrives.',
      html, css,
      tags: ['menu', 'submenu', 'cascade', 'flyout', 'popover'],
    }))
  }

  /* TT3. Overflow counter — the labels that did not fit, in a popover */
  {
    const c = cls('v14-tt-overflow')
    const html = `<div class="${c}"><b>Redesign onboarding flow</b><small>Opened 3 days ago by dana</small><div class="row"><span>design</span><span>a11y</span><span class="more">+4</span></div><div class="pop"><em>4 more labels</em><u><i class="p"></i>performance</u><u><i class="g"></i>good first issue</u><u><i class="y"></i>needs triage</u><u><i class="b"></i>documentation</u></div></div>`
    const css = `.${c} {
  position: relative;
  width: 236px;
  padding: 0.7rem 0.8rem 0.75rem;
  background: #111a2c;
  border: 1px solid #253049;
  border-radius: 0.7rem;
  box-shadow: 0 16px 34px rgba(0,0,0,0.45);
}
.${c} b { display: block; font-size: 0.82rem; color: #f1f5f9; }
.${c} small { display: block; margin-top: 2px; font-size: 0.64rem; color: #64748b; }
.${c} .row { display: flex; align-items: center; gap: 5px; margin-top: 0.65rem; }
.${c} .row span {
  padding: 0.14rem 0.42rem;
  font-size: 0.62rem;
  color: #93c5fd;
  background: #1b2740;
  border: 1px solid #2f3d5e;
  border-radius: 999px;
}
.${c} .more {
  color: #c7d2fe;
  background: #2b2a6b;
  border-color: #4338ca;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.${c} .pop {
  position: absolute;
  right: 10px;
  bottom: 32px;
  width: 128px;
  padding: 0.32rem 0.35rem 0.35rem;
  background: #16203a;
  border: 1px solid #33415f;
  border-radius: 0.5rem;
  box-shadow: 0 18px 34px rgba(0,0,0,0.6);
  opacity: 0;
  transform: translateY(6px) scale(0.96);
  transform-origin: 80% 100%;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.26s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.${c} .pop em {
  display: block;
  padding: 0 0.2rem 0.22rem;
  font-style: normal;
  font-size: 0.54rem;
  line-height: 1.2;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}
.${c} .pop u {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.05rem 0.2rem;
  font-size: 0.62rem;
  line-height: 1.45;
  text-decoration: none;
  color: #cbd5e1;
}
.${c} .pop i { flex: none; width: 7px; height: 7px; border-radius: 50%; }
.${c} .pop .p { background: #f472b6; }
.${c} .pop .g { background: #34d399; }
.${c} .pop .y { background: #fbbf24; }
.${c} .pop .b { background: #38bdf8; }
.${c}:hover .more { background: #4338ca; color: #fff; }
.${c}:hover .pop { opacity: 1; transform: translateY(0) scale(1); }`
    add(mk({
      name: 'Overflow Tags Popover',
      category: 'Tooltips & Popovers',
      description: 'Issue card whose label row ends in a plus-four counter; hovering the row lifts a popover that names the four labels which did not fit, each with its colour dot.',
      html, css,
      tags: ['popover', 'labels', 'overflow', 'counter', 'chips'],
    }))
  }

  /* TT4. Password rules — a checklist popover over the next field */
  {
    const c = cls('v14-tt-pwrules')
    const html = `<div class="${c}"><span class="lb">New password</span><div class="f">••••••••••<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></svg></div><span class="lb">Confirm password</span><div class="f g"></div><div class="pop"><div class="bar"><i class="on"></i><i class="on"></i><i class="on"></i><i></i></div><em>Strength: good</em><u class="ok">At least 12 characters</u><u class="ok">One number</u><u>One symbol</u></div></div>`
    const css = `.${c} {
  position: relative;
  width: 226px;
  height: 136px;
  padding: 0.7rem 0.8rem;
  background: #111a2c;
  border: 1px solid #253049;
  border-radius: 0.7rem;
  box-shadow: 0 18px 36px rgba(0,0,0,0.5);
}
.${c} .lb { display: block; margin-bottom: 3px; font-size: 0.6rem; color: #64748b; }
.${c} .f {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 26px;
  margin-bottom: 0.55rem;
  padding: 0 0.5rem;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  color: #e2e8f0;
  background: #0d1526;
  border: 1px solid #2b3a58;
  border-radius: 0.35rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c} .f svg { color: #64748b; }
.${c} .g { opacity: 0.5; }
.${c} .pop {
  position: absolute;
  top: 54px;
  left: 12px;
  right: 12px;
  padding: 0.4rem 0.55rem 0.4rem;
  background: #16203a;
  border: 1px solid #33415f;
  border-radius: 0.5rem;
  box-shadow: 0 18px 34px rgba(0,0,0,0.65);
  opacity: 0;
  transform: translateY(-7px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.24s ease;
}
.${c} .pop::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 22px;
  border: 5px solid transparent;
  border-bottom-color: #33415f;
}
.${c} .bar { display: flex; gap: 3px; }
.${c} .bar i { flex: 1; height: 3px; border-radius: 2px; background: #2b3a58; }
.${c} .bar .on { background: #34d399; }
.${c} .pop em {
  display: block;
  margin: 0.3rem 0 0.32rem;
  font-style: normal;
  font-size: 0.6rem;
  color: #6ee7b7;
}
.${c} .pop u {
  display: block;
  position: relative;
  padding-left: 14px;
  font-size: 0.62rem;
  line-height: 1.42;
  text-decoration: none;
  color: #64748b;
}
.${c} .pop u::before {
  content: '';
  position: absolute;
  top: 6px;
  left: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3d4c6b;
}
.${c} .pop .ok { color: #cbd5e1; }
.${c} .pop .ok::before {
  top: 4px;
  left: 0;
  width: 8px;
  height: 4px;
  border: 1.6px solid #34d399;
  border-top: 0;
  border-right: 0;
  border-radius: 0;
  background: none;
  transform: rotate(-45deg);
}
.${c}:hover .f, .${c}:focus-within .f { border-color: #6366f1; }
.${c}:hover .g, .${c}:focus-within .g { border-color: #2b3a58; }
.${c}:hover .pop, .${c}:focus-within .pop { opacity: 1; transform: translateY(0); }`
    add(mk({
      name: 'Password Rules Popover',
      category: 'Tooltips & Popovers',
      description: 'Sign-up form whose password field drops a rules popover over the field below it, showing a four-segment strength meter and ticking off the requirements already met.',
      html, css,
      tags: ['popover', 'password', 'validation', 'checklist', 'form'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Entrance Animations                                                 */
  /* ------------------------------------------------------------------ */

  /* EN1. Iris open — a circular clip widens to uncover the panel */
  {
    const c = cls('v14-ent-iris')
    const html = `<div class="${c}"><div class="p"><b>Focus mode</b><small>Everything else, hidden</small></div><i class="r"></i></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 206px;
  height: 114px;
  background: #0d1424;
  border: 1px solid #24314a;
  border-radius: 0.75rem;
  overflow: hidden;
}
.${c} .p {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 3px;
  text-align: center;
  background:
    radial-gradient(90% 130% at 50% 50%, #1d4ed8 0%, #172554 55%, #0f172a 100%);
  clip-path: circle(0% at 50% 50%);
  animation: ${c}-iris 0.9s cubic-bezier(0.4, 0, 0.2, 1) both;
}
.${c} .p b {
  font-size: 0.95rem;
  color: #f8fafc;
  opacity: 0;
  animation: ${c}-in 0.45s ease 0.4s both;
}
.${c} .p small {
  font-size: 0.66rem;
  color: #93c5fd;
  opacity: 0;
  animation: ${c}-in 0.45s ease 0.52s both;
}
.${c} .r {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  margin: -15px 0 0 -15px;
  border: 2px solid #60a5fa;
  border-radius: 50%;
  animation: ${c}-ring 0.9s cubic-bezier(0.4, 0, 0.2, 1) both;
}
@keyframes ${c}-iris {
  0%   { clip-path: circle(0% at 50% 50%); }
  100% { clip-path: circle(78% at 50% 50%); }
}
@keyframes ${c}-ring {
  0%   { opacity: 0.9; transform: scale(0.2); }
  100% { opacity: 0; transform: scale(7); }
}
@keyframes ${c}-in {
  0%   { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
}`
    add(mk({
      name: 'Iris Open Entrance',
      category: 'Entrance Animations',
      description: 'Panel uncovered by a circular clip that widens from a point at its centre, a thin ring racing ahead of the opening before the heading and caption fade up inside.',
      html, css,
      tags: ['iris', 'clip-path', 'circle', 'reveal', 'entrance'],
    }))
  }

  /* EN2. Quadrant assemble — four tiles fly in and lock into a mark */
  {
    const c = cls('v14-ent-quad')
    const html = `<div class="${c}"><div class="m"><i></i><i></i><i></i><i></i></div><div class="t"><b>Atlas</b><small>build system</small></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 214px;
  padding: 0.8rem 0.9rem;
  background: #111a2c;
  border: 1px solid #253049;
  border-radius: 0.75rem;
}
.${c} .m {
  flex: none;
  display: grid;
  grid-template-columns: 30px 30px;
  grid-template-rows: 30px 30px;
  gap: 4px;
}
.${c} .m i {
  opacity: 0;
  border-radius: 8px;
  animation: ${c}-lock 0.7s cubic-bezier(0.34, 1.4, 0.64, 1) both;
}
.${c} .m i:nth-child(1) { background: #38bdf8; --tx: -64px; --ty: -52px; --rt: -120deg; animation-delay: 0.02s; }
.${c} .m i:nth-child(2) { background: #a78bfa; --tx: 64px;  --ty: -52px; --rt: 120deg;  animation-delay: 0.12s; }
.${c} .m i:nth-child(3) { background: #34d399; --tx: -64px; --ty: 52px;  --rt: 120deg;  animation-delay: 0.22s; }
.${c} .m i:nth-child(4) { background: #fbbf24; --tx: 64px;  --ty: 52px;  --rt: -120deg; animation-delay: 0.32s; }
.${c} .t b {
  display: block;
  font-size: 0.95rem;
  color: #f1f5f9;
  opacity: 0;
  animation: ${c}-slip 0.5s ease 0.46s both;
}
.${c} .t small {
  display: block;
  font-size: 0.66rem;
  color: #64748b;
  opacity: 0;
  animation: ${c}-slip 0.5s ease 0.56s both;
}
@keyframes ${c}-lock {
  0%   { opacity: 0; transform: translate(var(--tx), var(--ty)) rotate(var(--rt)) scale(0.5); }
  100% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
}
@keyframes ${c}-slip {
  0%   { opacity: 0; transform: translateX(-10px); }
  100% { opacity: 1; transform: translateX(0); }
}`
    add(mk({
      name: 'Quadrant Assemble Entrance',
      category: 'Entrance Animations',
      description: 'Four coloured tiles spin in from the corners one after another and lock together into a two-by-two logo mark, after which the wordmark slides in beside it.',
      html, css,
      tags: ['assemble', 'quadrant', 'logo', 'stagger', 'entrance'],
    }))
  }

  /* EN3. Arc toss — X and Y animate separately, giving a parabola */
  {
    const c = cls('v14-ent-arc')
    const html = `<div class="${c}"><span class="h">Backlog → Done</span><div class="sl"></div><div class="f"><i><em>Ship it</em></i></div></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  height: 96px;
  padding: 0.6rem 0.7rem;
  background: #111a2c;
  border: 1px solid #253049;
  border-radius: 0.7rem;
  overflow: hidden;
}
.${c} .h { font-size: 0.62rem; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; }
.${c} .sl {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 76px;
  height: 32px;
  border: 1px dashed #3b4a63;
  border-radius: 0.4rem;
  animation: ${c}-slot 0.3s ease 0.74s both;
}
.${c} .f {
  position: absolute;
  left: 14px;
  bottom: 15px;
  animation: ${c}-x 0.8s linear both;
}
.${c} .f i { display: block; animation: ${c}-y 0.8s cubic-bezier(0.45, 0, 0.55, 1) both; }
.${c} .f em {
  display: grid;
  place-items: center;
  width: 68px;
  height: 26px;
  font-style: normal;
  font-size: 0.7rem;
  font-weight: 600;
  color: #052e16;
  background: linear-gradient(140deg, #6ee7b7, #22d3ee);
  border-radius: 0.4rem;
  box-shadow: 0 8px 18px rgba(34,211,238,0.32);
  animation: ${c}-spin 0.8s ease-out both;
}
@keyframes ${c}-x {
  0%   { transform: translateX(0); }
  100% { transform: translateX(120px); }
}
@keyframes ${c}-y {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(-44px); }
  100% { transform: translateY(0); }
}
@keyframes ${c}-spin {
  0%   { transform: rotate(-16deg) scale(0.8); }
  70%  { transform: rotate(6deg) scale(1); }
  100% { transform: rotate(0deg) scale(1); }
}
@keyframes ${c}-slot {
  0%   { border-color: #3b4a63; box-shadow: 0 0 0 0 rgba(34,211,238,0); }
  100% { border-color: #22d3ee; box-shadow: 0 0 0 3px rgba(34,211,238,0.14); }
}`
    add(mk({
      name: 'Arc Toss Entrance',
      category: 'Entrance Animations',
      description: 'Card chip lobbed along a parabola — steady sideways travel crossed with a rise and fall — that drops into a dashed slot and lights its outline on landing.',
      html, css,
      tags: ['arc', 'toss', 'parabola', 'drop', 'entrance'],
    }))
  }

  /* EN4. Skeleton swap — placeholder bars cross-fade into real content */
  {
    const c = cls('v14-ent-skel')
    const html = `<div class="${c}"><div class="sk"><span class="av"></span><span class="l1"></span><span class="l2"></span><span class="l3"></span></div><div class="ct"><span class="av">JR</span><b>Jules Rivera</b><small>Merged 4 pull requests today</small><em>Reviewer</em></div></div>`
    const css = `.${c} {
  position: relative;
  width: 218px;
  height: 100px;
  background: #111a2c;
  border: 1px solid #253049;
  border-radius: 0.7rem;
  overflow: hidden;
}
.${c} .sk, .${c} .ct { position: absolute; inset: 12px; }
.${c} .sk { animation: ${c}-out 0.32s ease 0.42s both; }
.${c} .sk span {
  position: absolute;
  display: block;
  border-radius: 4px;
  background: linear-gradient(100deg, #1e2a42 38%, #35476b 50%, #1e2a42 62%);
  background-size: 320% 100%;
  animation: ${c}-shine 1.2s linear infinite;
}
.${c} .sk .av { top: 0; left: 0; width: 38px; height: 38px; border-radius: 50%; }
.${c} .sk .l1 { top: 6px; left: 48px; width: 96px; height: 10px; }
.${c} .sk .l2 { top: 26px; left: 48px; width: 130px; height: 8px; }
.${c} .sk .l3 { bottom: 4px; left: 0; width: 76px; height: 20px; border-radius: 999px; }
.${c} .ct { opacity: 0; animation: ${c}-in 0.36s ease 0.46s both; }
.${c} .ct .av {
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #06283d;
  background: linear-gradient(140deg, #67e8f9, #818cf8);
  border-radius: 50%;
}
.${c} .ct b { position: absolute; top: 3px; left: 48px; font-size: 0.82rem; color: #f1f5f9; }
.${c} .ct small { position: absolute; top: 23px; left: 48px; font-size: 0.66rem; color: #64748b; }
.${c} .ct em {
  position: absolute;
  bottom: 4px;
  left: 0;
  padding: 0.18rem 0.5rem;
  font-style: normal;
  font-size: 0.62rem;
  color: #a7f3d0;
  background: #123a31;
  border: 1px solid #1f6552;
  border-radius: 999px;
}
@keyframes ${c}-out { 0% { opacity: 1; } 100% { opacity: 0; } }
@keyframes ${c}-in {
  0%   { opacity: 0; transform: translateY(5px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes ${c}-shine {
  0%   { background-position: 130% 0; }
  100% { background-position: -130% 0; }
}`
    add(mk({
      name: 'Skeleton Swap Entrance',
      category: 'Entrance Animations',
      description: 'Loading card whose shimmering grey placeholder bars dissolve on cue and are replaced by the real avatar, name and badge rising a few pixels into place.',
      html, css,
      tags: ['skeleton', 'placeholder', 'shimmer', 'swap', 'entrance'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Avatars & Images                                                    */
  /* ------------------------------------------------------------------ */

  /* AV1. Compare wipe — the divider slides, uncovering the graded shot */
  {
    const c = cls('v14-av-compare')
    const html = `<div class="${c}"><div class="b"><span>BEFORE</span></div><div class="a"><span>AFTER</span></div><i class="d"><em></em></i></div>`
    const css = `.${c} {
  position: relative;
  width: 214px;
  height: 126px;
  border: 1px solid #2a3a52;
  border-radius: 0.7rem;
  overflow: hidden;
  box-shadow: 0 16px 32px rgba(0,0,0,0.45);
}
.${c} .b, .${c} .a { position: absolute; inset: 0; }
.${c} .b {
  background:
    radial-gradient(60% 80% at 25% 20%, #64748b, transparent 70%),
    radial-gradient(70% 90% at 85% 90%, #475569, transparent 70%),
    linear-gradient(160deg, #334155, #1e293b);
}
.${c} .a {
  background:
    radial-gradient(60% 80% at 25% 20%, #f472b6, transparent 70%),
    radial-gradient(70% 90% at 85% 90%, #22d3ee, transparent 70%),
    linear-gradient(160deg, #6366f1, #0f172a);
  clip-path: inset(0 58% 0 0);
  transition: clip-path 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} span {
  position: absolute;
  bottom: 8px;
  padding: 0.1rem 0.4rem;
  font-size: 0.56rem;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: #e2e8f0;
  background: rgba(2,6,23,0.55);
  border-radius: 3px;
}
.${c} .b span { right: 8px; }
.${c} .a span { left: 8px; }
.${c} .d {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 42%;
  width: 2px;
  margin-left: -1px;
  background: #e2e8f0;
  transition: left 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .d em {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  background: #e2e8f0;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
}
.${c} .d em::before, .${c} .d em::after {
  content: '';
  position: absolute;
  top: 6px;
  border: 4px solid transparent;
}
.${c} .d em::before { left: 1px; border-right-color: #0f172a; }
.${c} .d em::after { right: 1px; border-left-color: #0f172a; }
.${c} .b span { transition: opacity 0.25s ease; }
.${c}:hover .a { clip-path: inset(0 14% 0 0); }
.${c}:hover .d { left: 86%; }
.${c}:hover .b span { opacity: 0; }`
    add(mk({
      name: 'Compare Split Image',
      category: 'Avatars & Images',
      description: 'Before-and-after frame split by a draggable-looking divider that travels right on hover, wiping the flat ungraded shot away to expose the colour-graded version underneath.',
      html, css,
      tags: ['compare', 'before-after', 'divider', 'wipe', 'image'],
    }))
  }

  /* AV2. Accordion strip — the hovered slice takes the width */
  {
    const c = cls('v14-av-accordion')
    const html = `<div class="${c}"><i class="s1"><b>Dunes</b></i><i class="s2"><b>Harbour</b></i><i class="s3"><b>Canopy</b></i><i class="s4"><b>Ridge</b></i><i class="s5"><b>Tundra</b></i></div>`
    const css = `.${c} {
  display: flex;
  gap: 4px;
  width: 248px;
  height: 118px;
}
.${c} i {
  position: relative;
  flex: 1 1 0;
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: pointer;
  transition: flex-grow 0.4s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease;
}
.${c} .s1 { background: linear-gradient(160deg, #fbbf24, #b45309); }
.${c} .s2 { background: linear-gradient(160deg, #38bdf8, #1e40af); }
.${c} .s3 { background: linear-gradient(160deg, #34d399, #065f46); }
.${c} .s4 { background: linear-gradient(160deg, #f472b6, #831843); }
.${c} .s5 { background: linear-gradient(160deg, #a5b4fc, #3730a3); }
.${c} i::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(2,6,23,0.75), transparent 55%);
}
.${c} i b {
  position: absolute;
  left: 9px;
  bottom: 8px;
  z-index: 1;
  font-size: 0.72rem;
  font-style: normal;
  white-space: nowrap;
  color: #f8fafc;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.28s ease 0.08s, transform 0.32s ease 0.08s;
}
.${c}:hover i { filter: brightness(0.55) saturate(0.6); }
.${c} i:hover { flex-grow: 3.4; filter: none; }
.${c} i:hover b { opacity: 1; transform: translateY(0); }`
    add(mk({
      name: 'Accordion Photo Strip',
      category: 'Avatars & Images',
      description: 'Five narrow photo slices where the hovered one expands to more than three times its share and lights up while the rest dim, its caption rising from the bottom edge.',
      html, css,
      tags: ['accordion', 'gallery', 'strip', 'expand', 'image'],
    }))
  }

  /* AV3. Crop frame — the crop box changes aspect and the readout follows */
  {
    const c = cls('v14-av-crop')
    const html = `<div class="${c}"><div class="cr"><b></b><b></b><b></b><b></b></div><div class="rd"><i class="one">1:1 · 1080 × 1080</i><i class="two">16:9 · 1920 × 1080</i></div></div>`
    const css = `.${c} {
  position: relative;
  width: 216px;
  height: 132px;
  border-radius: 0.7rem;
  overflow: hidden;
  background:
    radial-gradient(55% 75% at 30% 25%, #fb923c, transparent 65%),
    radial-gradient(60% 80% at 78% 70%, #38bdf8, transparent 65%),
    linear-gradient(150deg, #7c3aed, #0f172a);
}
.${c} .cr {
  position: absolute;
  top: 8px;
  left: 60px;
  width: 96px;
  height: 96px;
  border: 1px solid rgba(255,255,255,0.9);
  box-shadow: 0 0 0 999px rgba(2,6,23,0.62);
  transition: top 0.45s ease, left 0.45s ease, width 0.45s ease, height 0.45s ease;
}
.${c} .cr::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 33.33%;
  width: 33.34%;
  border-left: 1px solid rgba(255,255,255,0.25);
  border-right: 1px solid rgba(255,255,255,0.25);
}
.${c} .cr::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 33.33%;
  height: 33.34%;
  border-top: 1px solid rgba(255,255,255,0.25);
  border-bottom: 1px solid rgba(255,255,255,0.25);
}
.${c} .cr b { position: absolute; width: 12px; height: 12px; border: 2px solid #f8fafc; }
.${c} .cr b:nth-child(1) { top: -1px; left: -1px; border-right: 0; border-bottom: 0; }
.${c} .cr b:nth-child(2) { top: -1px; right: -1px; border-left: 0; border-bottom: 0; }
.${c} .cr b:nth-child(3) { bottom: -1px; left: -1px; border-right: 0; border-top: 0; }
.${c} .cr b:nth-child(4) { bottom: -1px; right: -1px; border-left: 0; border-top: 0; }
.${c} .rd {
  position: absolute;
  left: 50%;
  bottom: 6px;
  z-index: 2;
  display: grid;
  padding: 0.16rem 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.6rem;
  color: #e2e8f0;
  background: rgba(2,6,23,0.75);
  border: 1px solid #334155;
  border-radius: 999px;
  transform: translateX(-50%);
}
.${c} .rd i { grid-area: 1 / 1; font-style: normal; text-align: center; white-space: nowrap; transition: opacity 0.3s ease; }
.${c} .two { opacity: 0; }
.${c}:hover .cr { top: 24px; left: 18px; width: 180px; height: 66px; }
.${c}:hover .one { opacity: 0; }
.${c}:hover .two { opacity: 1; }`
    add(mk({
      name: 'Crop Frame Image',
      category: 'Avatars & Images',
      description: 'Photo under a crop tool: corner handles and rule-of-thirds guides frame a square selection that stretches to a widescreen box on hover while the pixel readout swaps beneath it.',
      html, css,
      tags: ['crop', 'editor', 'handles', 'aspect', 'image'],
    }))
  }

  /* AV4. Avatar marquee — a looping roster band that halts under the pointer */
  {
    const c = cls('v14-av-marquee')
    const html = `<div class="${c}"><div class="w"><div class="tr"><b class="a1">AR</b><b class="a2">KP</b><b class="a3">JL</b><b class="a4">MO</b><b class="a5">TS</b><b class="a6">VN</b><b class="a1">AR</b><b class="a2">KP</b><b class="a3">JL</b><b class="a4">MO</b><b class="a5">TS</b><b class="a6">VN</b></div></div><small>2,481 members shipping today</small></div>`
    const css = `.${c} {
  width: 250px;
  padding: 0.7rem 0 0.6rem;
  text-align: center;
  background: #111a2c;
  border: 1px solid #253049;
  border-radius: 0.7rem;
  overflow: hidden;
}
.${c} .w {
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
  overflow: hidden;
}
.${c} .tr {
  display: flex;
  width: max-content;
  animation: ${c}-run 12s linear infinite;
}
.${c} .tr b {
  display: grid;
  place-items: center;
  flex: none;
  width: 38px;
  height: 38px;
  margin-right: 10px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #041225;
  border-radius: 50%;
  border: 2px solid #1b2740;
  transition: transform 0.3s ease, border-color 0.3s ease;
}
.${c} .a1 { background: linear-gradient(140deg, #67e8f9, #0ea5e9); }
.${c} .a2 { background: linear-gradient(140deg, #fcd34d, #f97316); }
.${c} .a3 { background: linear-gradient(140deg, #86efac, #16a34a); }
.${c} .a4 { background: linear-gradient(140deg, #f9a8d4, #db2777); }
.${c} .a5 { background: linear-gradient(140deg, #c4b5fd, #6d28d9); }
.${c} .a6 { background: linear-gradient(140deg, #fda4af, #e11d48); }
.${c} small { display: block; margin-top: 0.55rem; font-size: 0.64rem; color: #64748b; }
.${c}:hover .tr { animation-play-state: paused; }
.${c}:hover .tr b { transform: scale(1.06); border-color: #38bdf8; }
@keyframes ${c}-run {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}`
    add(mk({
      name: 'Avatar Marquee Row',
      category: 'Avatars & Images',
      description: 'Band of member avatars that scrolls endlessly behind a soft fade at each edge, freezing under the pointer while every face grows and takes a blue rim.',
      html, css,
      tags: ['avatar', 'marquee', 'roster', 'scroll', 'pause'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Modals & Overlays                                                   */
  /* ------------------------------------------------------------------ */

  /* MO1. Consent bar — the bottom bar grows its category switches */
  {
    const c = cls('v14-mo-consent')
    const html = `<div class="${c}"><i class="l"></i><i class="l"></i><i class="l"></i><div class="sc"></div><div class="bar"><p>We use cookies to measure traffic.</p><div class="more"><span>Essential<u class="on"></u></span><span>Analytics<u></u></span><span>Marketing<u></u></span></div><div class="act"><em>Manage</em><button>Accept all</button></div></div></div>`
    const css = `.${c} {
  position: relative;
  width: 250px;
  height: 152px;
  padding: 12px;
  background: #0e1626;
  border: 1px solid #22304b;
  border-radius: 0.75rem;
  overflow: hidden;
}
.${c} .l { display: block; height: 8px; margin-bottom: 10px; border-radius: 4px; background: #1a2437; }
.${c} .l:nth-child(1) { width: 55%; height: 12px; background: #22304b; }
.${c} .l:nth-child(2) { width: 92%; }
.${c} .l:nth-child(3) { width: 78%; }
.${c} .sc { position: absolute; inset: 0; background: rgba(2,6,23,0.55); backdrop-filter: blur(1.5px); }
.${c} .bar {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  padding: 0.45rem 0.55rem;
  background: #16203a;
  border: 1px solid #2f3d5c;
  border-radius: 0.55rem;
  box-shadow: 0 14px 30px rgba(0,0,0,0.6);
  transition: transform 0.3s ease, border-color 0.3s ease;
}
.${c} .bar p { margin: 0; font-size: 0.62rem; line-height: 1.3; color: #cbd5e1; }
.${c} .more {
  display: grid;
  gap: 4px;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, margin 0.35s ease;
}
.${c} .more span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.58rem;
  line-height: 1.2;
  color: #94a3b8;
}
.${c} .more u { position: relative; width: 20px; height: 11px; border-radius: 999px; background: #2f3d5c; }
.${c} .more u::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
}
.${c} .more .on { background: #34d399; }
.${c} .more .on::after { left: 11px; background: #052e16; }
.${c} .act { display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; margin-top: 0.4rem; }
.${c} .act em { font-style: normal; font-size: 0.62rem; color: #94a3b8; cursor: pointer; }
.${c} .act button {
  padding: 0.24rem 0.55rem;
  font: inherit;
  font-size: 0.62rem;
  font-weight: 600;
  color: #041225;
  background: #38bdf8;
  border: none;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}
.${c}:hover .bar { transform: translateY(-2px); border-color: #3f5d86; }
.${c}:hover .more { max-height: 52px; opacity: 1; margin-top: 0.35rem; }
.${c}:hover .act button { background: #7dd3fc; box-shadow: 0 4px 14px rgba(56,189,248,0.35); }`
    add(mk({
      name: 'Cookie Consent Overlay',
      category: 'Modals & Overlays',
      description: 'Dimmed page with a consent bar pinned across its foot that grows upward on hover to unfold three category switches above the accept action.',
      html, css,
      tags: ['consent', 'cookies', 'banner', 'overlay', 'expand'],
    }))
  }

  /* MO2. Toast stack — a collapsed pile that fans out under the pointer */
  {
    const c = cls('v14-mo-toasts')
    const html = `<div class="${c}"><i class="l"></i><i class="l"></i><div class="st"><div class="t"><span class="g"></span><b>Deploy succeeded</b><small>now</small></div><div class="t"><span class="b"></span><b>Build queued</b><small>1m</small></div><div class="t"><span class="y"></span><b>Cache warmed</b><small>3m</small></div></div></div>`
    const css = `.${c} {
  position: relative;
  width: 252px;
  height: 144px;
  padding: 12px;
  background: #0d1424;
  border: 1px solid #22304b;
  border-radius: 0.75rem;
  overflow: hidden;
}
.${c} .l { display: block; height: 8px; margin-bottom: 10px; border-radius: 4px; background: #18213a; }
.${c} .l:nth-child(1) { width: 48%; }
.${c} .l:nth-child(2) { width: 66%; }
.${c} .st { position: absolute; right: 10px; bottom: 10px; width: 176px; height: 36px; }
.${c} .t {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  height: 36px;
  padding: 0 0.5rem;
  background: #1b2540;
  border: 1px solid #35446690;
  border-radius: 0.5rem;
  box-shadow: 0 10px 22px rgba(0,0,0,0.55);
  transform-origin: 50% 100%;
  transition: transform 0.38s cubic-bezier(0.34, 1.28, 0.64, 1);
}
.${c} .t:nth-child(1) { z-index: 3; transform: translateY(0) scale(1); }
.${c} .t:nth-child(2) { z-index: 2; transform: translateY(-7px) scale(0.94); }
.${c} .t:nth-child(3) { z-index: 1; transform: translateY(-13px) scale(0.88); }
.${c} .t span { flex: none; width: 8px; height: 8px; border-radius: 50%; }
.${c} .t .g { background: #34d399; }
.${c} .t .b { background: #38bdf8; }
.${c} .t .y { background: #fbbf24; }
.${c} .t b { flex: 1; font-size: 0.68rem; font-weight: 500; color: #e2e8f0; white-space: nowrap; }
.${c} .t small { font-size: 0.58rem; color: #64748b; }
.${c}:hover .t:nth-child(1) { transform: translateY(0) scale(1); }
.${c}:hover .t:nth-child(2) { transform: translateY(-42px) scale(1); }
.${c}:hover .t:nth-child(3) { transform: translateY(-84px) scale(1); }`
    add(mk({
      name: 'Stacked Toast Overlay',
      category: 'Modals & Overlays',
      description: 'Three notifications piled in the corner of a page with only their top edges showing, springing apart into a readable column while the pointer is over the page.',
      html, css,
      tags: ['toast', 'stack', 'notification', 'fan', 'overlay'],
    }))
  }

  /* MO3. Drop zone — a dashed upload veil over the attachment list */
  {
    const c = cls('v14-mo-dropzone')
    const html = `<div class="${c}"><div class="ls"><b>Attachments · 3</b><a><i class="p"></i>proposal.pdf<em>240 KB</em></a><a><i class="i"></i>hero-shot.png<em>1.8 MB</em></a><a><i class="z"></i>assets.zip<em>12 MB</em></a></div><div class="dz"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg><b>Drop files to upload</b><small>PNG, PDF up to 10 MB</small></div></div>`
    const css = `.${c} {
  position: relative;
  width: 238px;
  height: 114px;
  padding: 10px;
  background: #111a2c;
  border: 1px solid #253049;
  border-radius: 0.7rem;
  overflow: hidden;
}
.${c} .ls { transition: filter 0.3s ease, opacity 0.3s ease; }
.${c} .ls b { display: block; margin-bottom: 0.4rem; font-size: 0.64rem; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; }
.${c} .ls a {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.24rem 0.3rem;
  font-size: 0.68rem;
  color: #cbd5e1;
  border-radius: 0.3rem;
}
.${c} .ls a:nth-child(even) { background: #16203a; }
.${c} .ls i { flex: none; width: 14px; height: 16px; border-radius: 2px; }
.${c} .ls .p { background: #ef4444; }
.${c} .ls .i { background: #38bdf8; }
.${c} .ls .z { background: #fbbf24; }
.${c} .ls em { margin-left: auto; font-style: normal; font-size: 0.58rem; color: #64748b; }
.${c} .dz {
  position: absolute;
  inset: 6px;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 2px;
  text-align: center;
  color: #7dd3fc;
  background: rgba(9,16,31,0.88);
  border: 2px dashed #38bdf8;
  border-radius: 0.55rem;
  opacity: 0;
  transform: scale(0.96);
  transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.${c} .dz svg { animation: ${c}-bob 1.5s ease-in-out infinite; }
.${c} .dz b { margin-top: 3px; font-size: 0.74rem; color: #e0f2fe; }
.${c} .dz small { font-size: 0.6rem; color: #64748b; }
.${c}:hover .ls { filter: blur(1.5px); opacity: 0.5; }
.${c}:hover .dz { opacity: 1; transform: scale(1); }
@keyframes ${c}-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}`
    add(mk({
      name: 'Drop Zone Overlay',
      category: 'Modals & Overlays',
      description: 'Attachment list that blurs behind a dashed upload veil when files are dragged over it, the veil scaling up around a bobbing arrow and its size limits.',
      html, css,
      tags: ['upload', 'dropzone', 'dashed', 'overlay', 'files'],
    }))
  }

  /* MO4. Share pill — a recording chrome that widens to show its controls */
  {
    const c = cls('v14-mo-screenshare')
    const html = `<div class="${c}"><i class="l"></i><i class="l"></i><div class="ch"></div><div class="pill"><span class="dot"></span><b>Sharing</b><em>04:12</em><div class="ex"><u><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0"/><path d="M12 18v3"/></svg></u><u><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="2" y="6" width="13" height="12" rx="2"/><path d="M15 11l7-4v10l-7-4z"/></svg></u></div><button>Stop</button></div></div>`
    const css = `.${c} {
  position: relative;
  width: 252px;
  height: 142px;
  padding: 14px;
  background: #0d1424;
  border: 1px solid #22304b;
  border-radius: 0.75rem;
  overflow: hidden;
}
.${c} .l { display: block; height: 8px; margin: 34px 0 10px; border-radius: 4px; background: #18213a; }
.${c} .l:nth-child(1) { width: 56%; }
.${c} .l:nth-child(2) { width: 40%; margin-top: 0; }
.${c} .ch {
  height: 42px;
  border-radius: 4px;
  background:
    linear-gradient(90deg, #1e293b 0 16px, transparent 16px 26px, #334155 26px 42px, transparent 42px 52px, #1e40af 52px 68px, transparent 68px 78px, #0e7490 78px 94px, transparent 94px);
  background-size: 104px 100%;
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid rgba(52,211,153,0.55);
  border-radius: 0.75rem;
  pointer-events: none;
  animation: ${c}-edge 2.4s ease-in-out infinite;
}
.${c} .pill {
  position: absolute;
  top: 10px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.26rem 0.22rem 0.45rem;
  font-size: 0.6rem;
  color: #a7f3d0;
  background: #0b2b22;
  border: 1px solid #17614c;
  border-radius: 999px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.6);
  transform: translateX(-50%);
}
.${c} .dot {
  position: relative;
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f43f5e;
}
.${c} .dot::after {
  content: '';
  position: absolute;
  inset: -3px;
  border: 2px solid rgba(244,63,94,0.6);
  border-radius: 50%;
  animation: ${c}-ping 1.8s ease-out infinite;
}
.${c} .pill b { font-weight: 500; white-space: nowrap; }
.${c} .pill em { font-style: normal; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.56rem; color: #6ee7b7; }
.${c} .ex {
  display: flex;
  gap: 3px;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-width 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
}
.${c} .ex u {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  color: #6ee7b7;
  text-decoration: none;
  background: #123c30;
  border-radius: 50%;
}
.${c} .pill button {
  padding: 0.14rem 0.45rem;
  font: inherit;
  font-size: 0.58rem;
  font-weight: 600;
  color: #fff1f2;
  background: #be123c;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.${c} .pill button:hover { background: #e11d48; }
.${c}:hover .ex { max-width: 42px; opacity: 1; }
@keyframes ${c}-edge {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}
@keyframes ${c}-ping {
  0%       { transform: scale(0.7); opacity: 0.85; }
  70%,100% { transform: scale(2.1); opacity: 0; }
}`
    add(mk({
      name: 'Screen Share Overlay',
      category: 'Modals & Overlays',
      description: 'Shared window ringed in pulsing green with a floating status pill that counts the elapsed time and widens on hover to reveal its microphone and camera toggles.',
      html, css,
      tags: ['screen-share', 'recording', 'pill', 'overlay', 'controls'],
    }))
  }
}
