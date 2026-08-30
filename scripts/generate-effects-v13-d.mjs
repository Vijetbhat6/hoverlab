// scripts/generate-effects-v13-d.mjs
//
// Thirteenth wave, part D: Alerts & Toasts, Accordions & Tabs,
// 3D & Perspective, Glow & Neon. Four designs each.
//
// Shape-budget group: "thinning" for all four.
//
//   Alerts     — quota warning, error summary, tip callout, approval
//   Tabs       — billing period, code snippet, settings accordion,
//                autoplay feature tabs
//   3D         — flip clock, unfolding box, twisting ribbon, tunnel rings
//   Glow       — seven segment, runway lights, edge spill, fireflies
//
// Tabs use the radio-group pattern the rest of the category uses, so
// they stay interactive with no JavaScript.

export function generateV13D(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Alerts & Toasts                                                     */
  /* ------------------------------------------------------------------ */

  /* AL1. Quota warning — a usage meter carried inside the alert */
  {
    const c = cls('v13-al-quota')
    const html = `<div class="${c}"><div class="h"><b>You're near your limit</b><em>92%</em></div><div class="m"><i></i></div><p>4,600 of 5,000 renders used this month.</p><div class="r"><button>Upgrade</button><a>Remind me later</a></div></div>`
    const css = `.${c} {
  width: 244px;
  padding: 0.7rem 0.8rem 0.75rem;
  background: #1c1608;
  border: 1px solid #78350f;
  border-left: 3px solid #f59e0b;
  border-radius: 0.5rem;
  color: #fef3c7;
}
.${c} .h { display: flex; align-items: baseline; justify-content: space-between; }
.${c} b { font-size: 0.8rem; color: #fcd34d; }
.${c} em { font-style: normal; font-size: 0.72rem; font-weight: 700; color: #f59e0b; }
.${c} .m {
  height: 6px;
  margin: 0.45rem 0 0.4rem;
  border-radius: 3px;
  background: rgba(245,158,11,0.18);
  overflow: hidden;
}
.${c} .m i {
  display: block;
  width: 92%;
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #fbbf24, #f97316);
  animation: ${c}-throb 2.6s ease-in-out infinite;
}
.${c} p { margin: 0; font-size: 0.68rem; color: #d6bd8a; }
.${c} .r { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.6rem; }
.${c} button {
  padding: 0.3rem 0.7rem;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  color: #451a03;
  background: #f59e0b;
  border: none;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: background 0.2s ease;
}
.${c} button:hover { background: #fbbf24; }
.${c} a { font-size: 0.68rem; color: #a78552; cursor: pointer; }
.${c} a:hover { color: #fcd34d; }
@keyframes ${c}-throb {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.25); }
}`
    add(mk({
      name: 'Quota Warning Alert',
      category: 'Alerts & Toasts',
      description: 'Amber alert carrying its own usage meter, the fill gently throbbing to show how little of the allowance is left.',
      html, css,
      tags: ['quota', 'usage', 'meter', 'warning', 'upgrade'],
    }))
  }

  /* AL2. Error summary — a validation roll-up that links to each field */
  {
    const c = cls('v13-al-errsum')
    const html = `<div class="${c}"><b><i>!</i>3 problems to fix</b><ul><li><a>Email</a> is not a valid address</li><li><a>Password</a> needs 12 characters</li><li><a>Country</a> is required</li></ul></div>`
    const css = `.${c} {
  width: 238px;
  padding: 0.7rem 0.8rem 0.75rem;
  background: #1b0f13;
  border: 1px solid #7f1d1d;
  border-radius: 0.55rem;
  color: #fecdd3;
}
.${c} b { display: flex; align-items: center; gap: 0.45rem; font-size: 0.8rem; color: #fca5a5; }
.${c} b i {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  font-style: normal;
  font-size: 0.7rem;
  font-weight: 800;
  color: #450a0a;
  background: #f87171;
  border-radius: 50%;
}
.${c} ul { margin: 0.5rem 0 0; padding: 0; list-style: none; display: grid; gap: 0.25rem; }
.${c} li {
  position: relative;
  padding-left: 0.85rem;
  font-size: 0.7rem;
  color: #d4a5ab;
}
.${c} li::before {
  content: '';
  position: absolute;
  left: 0.15rem;
  top: 0.45rem;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #f87171;
}
.${c} a {
  color: #fca5a5;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease;
  border-radius: 2px;
}
.${c} a:hover { color: #fff1f2; background: rgba(248,113,113,0.18); }`
    add(mk({
      name: 'Error Summary Alert',
      category: 'Alerts & Toasts',
      description: 'Validation roll-up counting the problems in a form and listing each one as a link back to the field that caused it.',
      html, css,
      tags: ['validation', 'summary', 'errors', 'links', 'form'],
    }))
  }

  /* AL3. Tip callout — a low-key hint with a lamp that warms on hover */
  {
    const c = cls('v13-al-tip')
    const html = `<div class="${c}"><i></i><div><b>Tip</b><p>Hold <kbd>alt</kbd> while dragging a stop to duplicate it instead of moving it.</p></div></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.6rem;
  width: 238px;
  padding: 0.7rem 0.8rem;
  background: #101a24;
  border: 1px solid #1e3a4c;
  border-radius: 0.55rem;
  color: #bae6fd;
  transition: border-color 0.3s ease, background 0.3s ease;
}
.${c} i {
  position: relative;
  flex: none;
  width: 14px;
  height: 18px;
  margin-top: 2px;
  border-radius: 7px 7px 3px 3px;
  background: #334155;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}
.${c} i::after {
  content: '';
  position: absolute;
  left: 3px;
  right: 3px;
  bottom: -4px;
  height: 3px;
  border-radius: 0 0 2px 2px;
  background: #475569;
  transition: background 0.3s ease;
}
.${c} b { display: block; font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: #38bdf8; }
.${c} p { margin: 0.2rem 0 0; font-size: 0.72rem; line-height: 1.5; color: #94b8cc; }
.${c} kbd {
  padding: 0 4px;
  font-family: ui-monospace, monospace;
  font-size: 0.66rem;
  color: #e0f2fe;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 3px;
}
.${c}:hover { border-color: #f59e0b; background: #161a1c; }
.${c}:hover i { background: #fbbf24; box-shadow: 0 0 14px rgba(251,191,36,0.75); }
.${c}:hover i::after { background: #b45309; }`
    add(mk({
      name: 'Tip Callout',
      category: 'Alerts & Toasts',
      description: 'Quiet hint panel with a small bulb in the gutter that lights up warm amber when the callout is hovered.',
      html, css,
      tags: ['tip', 'callout', 'hint', 'bulb', 'docs'],
    }))
  }

  /* AL4. Approval request — an actionable notice with a requester */
  {
    const c = cls('v13-al-approval')
    const html = `<div class="${c}"><div class="t"><span class="av">MT</span><div><b>Mira asked for a review</b><small>feat/keyframe-editor · 12 files</small></div></div><div class="r"><button class="y">Approve</button><button class="n">Request changes</button></div></div>`
    const css = `.${c} {
  width: 250px;
  padding: 0.7rem 0.75rem 0.75rem;
  background: #141b2c;
  border: 1px solid #29344d;
  border-radius: 0.6rem;
  box-shadow: 0 14px 30px rgba(0,0,0,0.4);
  color: #cbd5e1;
}
.${c} .t { display: flex; align-items: center; gap: 0.55rem; }
.${c} .av {
  display: grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #3b0764;
  background: linear-gradient(140deg, #f5d0fe, #d8b4fe);
  border-radius: 50%;
}
.${c} b { display: block; font-size: 0.78rem; color: #f1f5f9; }
.${c} small { font-size: 0.64rem; color: #64748b; }
.${c} .r { display: flex; gap: 0.4rem; margin-top: 0.65rem; }
.${c} button {
  flex: 1;
  padding: 0.35rem 0;
  font: inherit;
  font-size: 0.71rem;
  font-weight: 600;
  border-radius: 0.38rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.${c} .y { color: #052e16; background: #34d399; }
.${c} .y:hover { background: #6ee7b7; }
.${c} .n { color: #cbd5e1; background: transparent; border-color: #3b4a63; }
.${c} .n:hover { background: #1e293b; color: #f1f5f9; }`
    add(mk({
      name: 'Approval Request Alert',
      category: 'Alerts & Toasts',
      description: 'Review request notice showing who asked and what changed, with paired approve and request-changes actions along the foot.',
      html, css,
      tags: ['approval', 'review', 'actions', 'avatar', 'request'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Accordions & Tabs                                                   */
  /* ------------------------------------------------------------------ */

  /* AT1. Billing period tabs — monthly/yearly with a saving flag */
  {
    const c = cls('v13-at-billing')
    const html = `<div class="${c}"><div class="s"><label><input type="radio" name="${c}" checked /><span>Monthly</span></label><label><input type="radio" name="${c}" /><span>Yearly <em>−20%</em></span></label><i class="pill"></i></div><div class="p"><b class="m">$9<small>/mo</small></b><b class="y">$86<small>/yr</small></b></div></div>`
    const css = `.${c} {
  width: 216px;
  padding: 0.6rem;
  text-align: center;
  background: #131a2b;
  border: 1px solid #253049;
  border-radius: 0.7rem;
  color: #cbd5e1;
}
.${c} .s {
  position: relative;
  display: flex;
  padding: 3px;
  background: #0f1626;
  border-radius: 999px;
}
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} label { flex: 1; cursor: pointer; }
.${c} .s span {
  position: relative;
  z-index: 1;
  display: block;
  padding: 0.35rem 0;
  font-size: 0.73rem;
  color: #94a3b8;
  transition: color 0.25s ease;
}
.${c} .s em {
  font-style: normal;
  font-size: 0.6rem;
  font-weight: 700;
  color: #34d399;
}
.${c} .pill {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  border-radius: 999px;
  background: #4f46e5;
  transition: transform 0.32s cubic-bezier(0.65, 0, 0.35, 1);
}
.${c} label:nth-child(2) input:checked ~ span { color: #fff; }
.${c} label:nth-child(1) input:checked ~ span { color: #fff; }
.${c} .s label:nth-child(2) input:checked ~ span em { color: #bbf7d0; }
.${c} .s:has(label:nth-child(2) input:checked) .pill { transform: translateX(100%); }
.${c} .p { position: relative; height: 42px; margin-top: 0.55rem; }
.${c} .p b {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  font-size: 1.5rem;
  color: #f1f5f9;
  transition: opacity 0.28s ease, transform 0.32s ease;
}
.${c} .p small { font-size: 0.65rem; color: #64748b; }
.${c} .p .y { opacity: 0; transform: translateY(8px); }
.${c}:has(label:nth-child(2) input:checked) .p .m { opacity: 0; transform: translateY(-8px); }
.${c}:has(label:nth-child(2) input:checked) .p .y { opacity: 1; transform: translateY(0); }`
    add(mk({
      name: 'Billing Period Tabs',
      category: 'Accordions & Tabs',
      description: 'Monthly and yearly segmented tabs with a sliding pill and a discount flag, the headline price crossfading as the period changes.',
      html, css,
      tags: ['pricing', 'segmented', 'billing', 'toggle', 'price'],
    }))
  }

  /* AT2. Code snippet tabs — language tabs over a mono pane */
  {
    const c = cls('v13-at-codetabs')
    const html = `<div class="${c}"><div class="t"><label><input type="radio" name="${c}" checked /><span>npm</span></label><label><input type="radio" name="${c}" /><span>pnpm</span></label><label><input type="radio" name="${c}" /><span>bun</span></label></div><pre class="a"><code>npm i hoverlab</code></pre><pre class="b"><code>pnpm add hoverlab</code></pre><pre class="d"><code>bun add hoverlab</code></pre></div>`
    const css = `.${c} {
  width: 232px;
  background: #0c1322;
  border: 1px solid #22304d;
  border-radius: 0.55rem;
  overflow: hidden;
}
.${c} .t { display: flex; gap: 2px; padding: 0.3rem 0.3rem 0; background: #101a2e; }
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} label { cursor: pointer; }
.${c} .t span {
  display: block;
  padding: 0.3rem 0.65rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  color: #64748b;
  border-radius: 0.35rem 0.35rem 0 0;
  transition: background 0.2s ease, color 0.2s ease;
}
.${c} label:hover span { color: #cbd5e1; }
.${c} input:checked ~ span { color: #7dd3fc; background: #0c1322; }
.${c} pre {
  margin: 0;
  padding: 0.65rem 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.73rem;
  color: #d1d5db;
  display: none;
}
.${c} pre code::before { content: '$ '; color: #475569; }
.${c}:has(label:nth-child(1) input:checked) .a,
.${c}:has(label:nth-child(2) input:checked) .b,
.${c}:has(label:nth-child(3) input:checked) .d { display: block; }`
    add(mk({
      name: 'Code Snippet Tabs',
      category: 'Accordions & Tabs',
      description: 'Package-manager tabs sitting on top of a terminal pane, the active tab merging into the code surface below it.',
      html, css,
      tags: ['tabs', 'code', 'terminal', 'package-manager', 'docs'],
    }))
  }

  /* AT3. Settings accordion — sections that open onto switch rows */
  {
    const c = cls('v13-at-setacc')
    const html = `<div class="${c}"><details open><summary><b>Notifications</b><i></i></summary><div class="row"><span>Email digest</span><u class="on"></u></div><div class="row"><span>Mentions</span><u class="on"></u></div></details><details><summary><b>Privacy</b><i></i></summary><div class="row"><span>Public profile</span><u></u></div></details><details><summary><b>Advanced</b><i></i></summary><div class="row"><span>Beta features</span><u></u></div></details></div>`
    const css = `.${c} {
  width: 236px;
  background: #111a2b;
  border: 1px solid #253049;
  border-radius: 0.6rem;
  overflow: hidden;
  color: #cbd5e1;
}
.${c} details { border-bottom: 1px solid #1e293b; }
.${c} details:last-child { border-bottom: none; }
.${c} summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.7rem;
  cursor: pointer;
  list-style: none;
  transition: background 0.18s ease;
}
.${c} summary::-webkit-details-marker { display: none; }
.${c} summary:hover { background: #16203a; }
.${c} b { font-size: 0.78rem; color: #f1f5f9; }
.${c} summary i {
  width: 8px;
  height: 8px;
  border-right: 2px solid #64748b;
  border-bottom: 2px solid #64748b;
  transform: rotate(45deg) translate(-2px, -2px);
  transition: transform 0.25s ease;
}
.${c} details[open] summary i { transform: rotate(-135deg) translate(-2px, -2px); }
.${c} .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.35rem 0.7rem 0.35rem 0.9rem;
  font-size: 0.72rem;
  color: #94a3b8;
}
.${c} .row:last-child { padding-bottom: 0.6rem; }
.${c} u {
  position: relative;
  width: 30px;
  height: 17px;
  border-radius: 999px;
  background: #334155;
  cursor: pointer;
  transition: background 0.24s ease;
}
.${c} u::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #e2e8f0;
  transition: transform 0.24s ease;
}
.${c} .on { background: #6366f1; }
.${c} .on::after { transform: translateX(13px); background: #fff; }`
    add(mk({
      name: 'Settings Accordion',
      category: 'Accordions & Tabs',
      description: 'Grouped preference sections that open onto rows of switches, each header chevron flipping as its group expands.',
      html, css,
      tags: ['accordion', 'settings', 'switches', 'details', 'sections'],
    }))
  }

  /* AT4. Autoplay feature tabs — a rail whose active row fills on a timer */
  {
    const c = cls('v13-at-autoplay')
    const html = `<div class="${c}"><div class="row on"><b>Copy any effect</b><i></i></div><div class="row"><b>Re-colour it</b><i></i></div><div class="row"><b>Ship the CSS</b><i></i></div></div>`
    const css = `.${c} {
  width: 224px;
  display: grid;
  gap: 0.3rem;
  padding: 0.5rem;
  background: #111a2b;
  border: 1px solid #253049;
  border-radius: 0.6rem;
}
.${c} .row {
  padding: 0.45rem 0.55rem 0.5rem;
  border-radius: 0.45rem;
  background: #16203a;
  cursor: pointer;
  transition: background 0.2s ease;
}
.${c} .row:hover { background: #1c2946; }
.${c} b { display: block; font-size: 0.76rem; color: #94a3b8; transition: color 0.25s ease; }
.${c} .row i {
  display: block;
  height: 3px;
  margin-top: 0.45rem;
  border-radius: 2px;
  background: rgba(148,163,184,0.2);
  overflow: hidden;
}
.${c} .row i::after {
  content: '';
  display: block;
  height: 100%;
  width: 0;
  border-radius: 2px;
  background: linear-gradient(90deg, #22d3ee, #6366f1);
}
.${c} .on { background: #1c2946; }
.${c} .on b { color: #f1f5f9; }
.${c} .on i::after { animation: ${c}-fill 4.5s linear infinite; }
@keyframes ${c}-fill {
  0%   { width: 0; }
  100% { width: 100%; }
}`
    add(mk({
      name: 'Autoplay Feature Tabs',
      category: 'Accordions & Tabs',
      description: 'Vertical feature rail where the active row carries a progress line that fills on a timer before handing over to the next.',
      html, css,
      tags: ['tabs', 'autoplay', 'progress', 'feature', 'rail'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* 3D & Perspective                                                    */
  /* ------------------------------------------------------------------ */

  /* 3D1. Flip clock — split-flap digit card turning on its hinge */
  {
    const c = cls('v13-3d-flipclock')
    const html = `<div class="${c}"><div class="d"><span class="t"><u>4</u></span><span class="b"><u>4</u></span><span class="f"><u>4</u></span></div><div class="d"><span class="t"><u>7</u></span><span class="b"><u>7</u></span><span class="f"><u>7</u></span></div></div>`
    const css = `.${c} {
  display: flex;
  gap: 8px;
  perspective: 300px;
}
.${c} .d {
  position: relative;
  width: 46px;
  height: 64px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 2.4rem;
  font-weight: 700;
  line-height: 1;
  color: #f8fafc;
  border-radius: 0.4rem;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(0,0,0,0.55);
}
.${c} span {
  position: absolute;
  left: 0;
  right: 0;
  height: 32px;
  overflow: hidden;
  background: #1e293b;
}
.${c} u {
  display: block;
  height: 64px;
  line-height: 64px;
  text-align: center;
  text-decoration: none;
}
.${c} .t {
  top: 0;
  border-bottom: 1px solid #0b1120;
}
.${c} .b {
  bottom: 0;
  background: #17202f;
}
.${c} .b u { margin-top: -32px; }
.${c} .f {
  top: 0;
  border-bottom: 1px solid #0b1120;
  transform-origin: bottom center;
  backface-visibility: hidden;
  animation: ${c}-flip 3s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
@keyframes ${c}-flip {
  0%, 50%   { transform: rotateX(0deg); opacity: 1; }
  78%       { transform: rotateX(-88deg); opacity: 1; }
  80%, 100% { transform: rotateX(-90deg); opacity: 0; }
}`
    add(mk({
      name: 'Flip Clock',
      category: '3D & Perspective',
      description: 'Split-flap digit cards whose top half hinges forward on its axis and falls out of sight, the way a station clock turns over.',
      html, css,
      tags: ['flip-clock', 'split-flap', 'hinge', 'rotatex', 'digits'],
    }))
  }

  /* 3D2. Unfolding box — four flaps opening away from a base */
  {
    const c = cls('v13-3d-box')
    const html = `<div class="${c}"><div class="s"><i class="n"></i><i class="e"></i><i class="s2"></i><i class="w"></i><b>✦</b></div></div>`
    const css = `.${c} {
  width: 130px;
  height: 130px;
  display: grid;
  place-items: center;
  perspective: 420px;
}
.${c} .s {
  position: relative;
  width: 58px;
  height: 58px;
  transform-style: preserve-3d;
  transform: rotateX(56deg) rotateZ(-38deg);
  background: #1e1b4b;
  box-shadow: 0 0 0 1px rgba(129,140,248,0.5);
}
.${c} b {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 1.3rem;
  color: #a5b4fc;
}
.${c} i {
  position: absolute;
  width: 58px;
  height: 58px;
  background: linear-gradient(160deg, #4338ca, #312e81);
  box-shadow: 0 0 0 1px rgba(129,140,248,0.45);
  animation: ${c}-open 4.4s ease-in-out infinite alternate;
}
.${c} .n { top: 0;    left: 0; transform-origin: top;    }
.${c} .s2 { bottom: 0; left: 0; transform-origin: bottom; }
.${c} .e { top: 0; right: 0; transform-origin: right; }
.${c} .w { top: 0; left: 0;  transform-origin: left;  }
.${c} .n  { animation-name: ${c}-n; }
.${c} .s2 { animation-name: ${c}-s; }
.${c} .e  { animation-name: ${c}-e; }
.${c} .w  { animation-name: ${c}-w; }
@keyframes ${c}-n { 0% { transform: rotateX(0deg); } 100% { transform: rotateX(-105deg); } }
@keyframes ${c}-s { 0% { transform: rotateX(0deg); } 100% { transform: rotateX(105deg); } }
@keyframes ${c}-e { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(-105deg); } }
@keyframes ${c}-w { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(105deg); } }`
    add(mk({
      name: 'Unfolding Box',
      category: '3D & Perspective',
      description: 'Four indigo flaps hinged to an isometric base that swing outward together to reveal the mark printed inside.',
      html, css,
      tags: ['unfold', 'flaps', 'isometric', 'hinge', 'reveal'],
    }))
  }

  /* 3D3. Twisting ribbon — segments rotating on a shared axis */
  {
    const c = cls('v13-3d-ribbon')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 96px;
  perspective: 500px;
}
.${c} i {
  display: block;
  width: 15px;
  height: 62px;
  background: linear-gradient(180deg, #f472b6, #8b5cf6);
  box-shadow: 0 0 14px rgba(139,92,246,0.35);
  transform-style: preserve-3d;
  animation: ${c}-twist 3.6s ease-in-out infinite;
}
.${c} i:nth-child(1) { animation-delay: 0s; }
.${c} i:nth-child(2) { animation-delay: 0.1s; }
.${c} i:nth-child(3) { animation-delay: 0.2s; }
.${c} i:nth-child(4) { animation-delay: 0.3s; }
.${c} i:nth-child(5) { animation-delay: 0.4s; }
.${c} i:nth-child(6) { animation-delay: 0.5s; }
.${c} i:nth-child(7) { animation-delay: 0.6s; }
.${c} i:nth-child(8) { animation-delay: 0.7s; }
@keyframes ${c}-twist {
  0%, 100% { transform: rotateY(0deg); }
  50%      { transform: rotateY(180deg); }
}`
    add(mk({
      name: 'Twisting Ribbon',
      category: '3D & Perspective',
      description: 'A row of gradient slats that each turn a half revolution on a delay, so a twist travels along the ribbon and back.',
      html, css,
      tags: ['ribbon', 'twist', 'rotatey', 'slats', 'wave'],
    }))
  }

  /* 3D4. Tunnel rings — squares receding along the z axis */
  {
    const c = cls('v13-3d-tunnel')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 140px;
  height: 110px;
  perspective: 220px;
  transform-style: preserve-3d;
  overflow: hidden;
  border-radius: 0.6rem;
  background: radial-gradient(circle at 50% 50%, #0b1224, #020617);
  box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
}
.${c} i {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 96px;
  height: 76px;
  margin: -38px 0 0 -48px;
  border: 2px solid #22d3ee;
  border-radius: 0.4rem;
  box-shadow: 0 0 14px rgba(34,211,238,0.4);
  animation: ${c}-fly 3s linear infinite;
}
.${c} i:nth-child(2) { animation-delay: -0.6s; }
.${c} i:nth-child(3) { animation-delay: -1.2s; }
.${c} i:nth-child(4) { animation-delay: -1.8s; }
.${c} i:nth-child(5) { animation-delay: -2.4s; }
@keyframes ${c}-fly {
  0%   { transform: translateZ(-460px); opacity: 0; }
  20%  { opacity: 1; }
  85%  { opacity: 1; }
  100% { transform: translateZ(120px); opacity: 0; }
}`
    add(mk({
      name: 'Tunnel Rings',
      category: '3D & Perspective',
      description: 'Cyan frames flying out of the distance toward the viewer on a loop, fading in far away and out as they pass the plane.',
      html, css,
      tags: ['tunnel', 'perspective', 'translatez', 'rings', 'depth'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Glow & Neon                                                         */
  /* ------------------------------------------------------------------ */

  /* GL1. Seven segment — a glowing calculator display */
  {
    const c = cls('v13-gl-sevenseg')
    const html = `<div class="${c}"><span class="d"><i class="a"></i><i class="b"></i><i class="cc"></i><i class="dd"></i><i class="e"></i><i class="f"></i><i class="g"></i></span><span class="d two"><i class="a"></i><i class="b"></i><i class="cc"></i><i class="dd"></i><i class="e"></i><i class="f"></i><i class="g"></i></span></div>`
    const css = `.${c} {
  display: flex;
  gap: 14px;
  padding: 0.85rem 1rem;
  background: #0a0f0d;
  border: 1px solid #14532d;
  border-radius: 0.5rem;
  box-shadow: inset 0 0 26px rgba(0,0,0,0.9);
}
.${c} .d { position: relative; width: 30px; height: 54px; }
.${c} i {
  position: absolute;
  background: #4ade80;
  border-radius: 2px;
  opacity: 0.08;
  transition: opacity 0.2s ease;
}
.${c} .a, .${c} .g, .${c} .dd { left: 5px; width: 20px; height: 4px; }
.${c} .a  { top: 0; }
.${c} .g  { top: 25px; }
.${c} .dd { bottom: 0; }
.${c} .b, .${c} .cc, .${c} .e, .${c} .f { width: 4px; height: 20px; }
.${c} .f  { top: 4px; left: 0; }
.${c} .b  { top: 4px; right: 0; }
.${c} .e  { bottom: 4px; left: 0; }
.${c} .cc { bottom: 4px; right: 0; }
.${c} .d .a, .${c} .d .b, .${c} .d .cc, .${c} .d .dd, .${c} .d .e, .${c} .d .f {
  opacity: 1;
  box-shadow: 0 0 10px rgba(74,222,128,0.85);
}
.${c} .two .f, .${c} .two .cc { opacity: 0.08; box-shadow: none; }
.${c} .two .g { opacity: 1; box-shadow: 0 0 10px rgba(74,222,128,0.85); }
.${c} .d { animation: ${c}-flick 4s steps(1) infinite; }
.${c} .two { animation-delay: 0.4s; }
@keyframes ${c}-flick {
  0%, 96%  { filter: none; }
  97%      { filter: brightness(0.55); }
  98%,100% { filter: none; }
}`
    add(mk({
      name: 'Seven Segment Display',
      category: 'Glow & Neon',
      description: 'Two seven-segment digits glowing green behind a dark bezel, with the unlit segments left faintly visible and an occasional flicker.',
      html, css,
      tags: ['seven-segment', 'display', 'digits', 'lcd', 'flicker'],
    }))
  }

  /* GL2. Runway lights — chasing arrow lamps along a strip */
  {
    const c = cls('v13-gl-runway')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i><b>›</b></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0.7rem 1rem;
  background: #0b0a14;
  border: 1px solid #312e81;
  border-radius: 999px;
}
.${c} i {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(129,140,248,0.18);
  animation: ${c}-chase 1.4s linear infinite;
}
.${c} i:nth-child(1) { animation-delay: 0s; }
.${c} i:nth-child(2) { animation-delay: 0.14s; }
.${c} i:nth-child(3) { animation-delay: 0.28s; }
.${c} i:nth-child(4) { animation-delay: 0.42s; }
.${c} i:nth-child(5) { animation-delay: 0.56s; }
.${c} i:nth-child(6) { animation-delay: 0.7s; }
.${c} b {
  margin-left: 2px;
  font-size: 1.5rem;
  line-height: 1;
  color: #818cf8;
  text-shadow: 0 0 12px rgba(129,140,248,0.9);
  animation: ${c}-pulse 1.4s ease-in-out infinite;
}
@keyframes ${c}-chase {
  0%, 45%  { background: rgba(129,140,248,0.18); box-shadow: none; }
  15%      { background: #c7d2fe; box-shadow: 0 0 16px rgba(165,180,252,0.95); }
  100%     { background: rgba(129,140,248,0.18); box-shadow: none; }
}
@keyframes ${c}-pulse {
  0%, 100% { opacity: 0.55; }
  70%      { opacity: 1; }
}`
    add(mk({
      name: 'Runway Lights',
      category: 'Glow & Neon',
      description: 'Row of lamps that light in sequence toward a glowing chevron, like approach lights guiding the eye along the strip.',
      html, css,
      tags: ['runway', 'chase', 'lamps', 'sequence', 'direction'],
    }))
  }

  /* GL3. Edge spill — light leaking out from behind one edge of a panel */
  {
    const c = cls('v13-gl-edgespill')
    const html = `<div class="${c}"><b>Backlit</b><p>The glow comes from behind the panel, not from the surface.</p></div>`
    const css = `.${c} {
  position: relative;
  width: 212px;
  padding: 0.9rem 0.95rem;
  background: #0e1120;
  border: 1px solid #1c2340;
  border-radius: 0.7rem;
  color: #c7d2fe;
  isolation: isolate;
}
.${c}::before {
  content: '';
  position: absolute;
  z-index: -1;
  left: 14%;
  right: 14%;
  bottom: -3px;
  height: 22px;
  border-radius: 999px;
  background: linear-gradient(90deg, #22d3ee, #a855f7, #f472b6);
  filter: blur(14px);
  animation: ${c}-breathe 4.5s ease-in-out infinite;
}
.${c} b { display: block; font-size: 0.9rem; color: #f1f5f9; margin-bottom: 0.3rem; }
.${c} p { margin: 0; font-size: 0.72rem; line-height: 1.5; color: #8b93b8; }
@keyframes ${c}-breathe {
  0%, 100% { opacity: 0.65; transform: scaleX(0.9); }
  50%      { opacity: 1; transform: scaleX(1.05); }
}`
    add(mk({
      name: 'Edge Spill Panel',
      category: 'Glow & Neon',
      description: 'Dark panel with a blurred colour bar hidden behind its lower edge, spilling light out around it and breathing slowly.',
      html, css,
      tags: ['backlit', 'spill', 'blur', 'panel', 'ambient'],
    }))
  }

  /* GL4. Firefly field — drifting motes that pulse in and out */
  {
    const c = cls('v13-gl-firefly')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 210px;
  height: 118px;
  border-radius: 0.7rem;
  overflow: hidden;
  background: radial-gradient(120% 100% at 50% 120%, #0b2419, #04070c 70%);
  box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
}
.${c} i {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fde68a;
  box-shadow: 0 0 12px 3px rgba(253,230,138,0.7);
  animation: ${c}-drift 7s ease-in-out infinite;
}
.${c} i:nth-child(1) { left: 12%; top: 62%; animation-delay: 0s;    animation-duration: 6.5s; }
.${c} i:nth-child(2) { left: 30%; top: 34%; animation-delay: -1.1s; animation-duration: 8s; }
.${c} i:nth-child(3) { left: 48%; top: 72%; animation-delay: -2.3s; animation-duration: 7.4s; }
.${c} i:nth-child(4) { left: 62%; top: 26%; animation-delay: -3.4s; animation-duration: 9s; }
.${c} i:nth-child(5) { left: 76%; top: 58%; animation-delay: -4.2s; animation-duration: 6.8s; }
.${c} i:nth-child(6) { left: 88%; top: 40%; animation-delay: -5.1s; animation-duration: 8.6s; }
.${c} i:nth-child(7) { left: 20%; top: 18%; animation-delay: -2.8s; animation-duration: 7.9s; }
@keyframes ${c}-drift {
  0%, 100% { transform: translate(0, 0) scale(0.6); opacity: 0.15; }
  25%      { transform: translate(10px, -14px) scale(1); opacity: 1; }
  55%      { transform: translate(-8px, -26px) scale(0.8); opacity: 0.5; }
  80%      { transform: translate(6px, -10px) scale(1); opacity: 0.9; }
}`
    add(mk({
      name: 'Firefly Field',
      category: 'Glow & Neon',
      description: 'Warm motes drifting over a dark clearing, each fading up and down on its own timing so the field never repeats.',
      html, css,
      tags: ['fireflies', 'motes', 'drift', 'ambient', 'night'],
    }))
  }
}
