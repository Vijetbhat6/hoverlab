// scripts/generate-effects-v14-d.mjs
//
// Fourteenth wave, part D: Alerts & Toasts, Accordions & Tabs,
// 3D & Perspective, Glow & Neon. Four designs each.
//
//   Alerts  — deploy stepper toast, merge-conflict diff alert,
//             token-bucket rate limit alert, declined-card alert
//   Tabs    — wizard step accordion, lifted bottom-nav tabs,
//             timeline year tabs, ribbon toolbar tabs
//   3D      — DNA helix of orbiting rungs, tilted turntable deck,
//             isometric voxel wave, orthogonal gyroscope rings
//   Glow    — fibre patch panel, radial dial gauge, wet-floor
//             reflected sign, pulsing constellation graph
//
// Glow is deliberately structural rather than chromatic: light in
// transit through channels, light as a measured arc, light mirrored in
// a floor, and light hopping across a graph. No two share a mechanic.
//
// Tabs use the radio-group pattern the rest of the category uses, so
// they stay interactive with no JavaScript.

export function generateV14D(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Alerts & Toasts                                                     */
  /* ------------------------------------------------------------------ */

  /* AL1. Deploy toast — a three-stage pipeline stepper inside a toast */
  {
    const c = cls('v14-al-deploy')
    const html = `<div class="${c}"><div class="h"><i class="sp"></i><b>Deploying to production</b></div><div class="st"><div class="rail"><em></em></div><div class="s s1"><u></u><span>Build</span></div><div class="s s2"><u></u><span>Test</span></div><div class="s s3"><u></u><span>Ship</span></div></div></div>`
    const css = `.${c} {
  width: 240px;
  padding: 0.7rem 0.8rem 0.75rem;
  background: #101828;
  border: 1px solid #263349;
  border-radius: 0.6rem;
  box-shadow: 0 14px 30px rgba(0,0,0,0.45);
  color: #cbd5e1;
}
.${c} .h { display: flex; align-items: center; gap: 0.5rem; }
.${c} .sp {
  flex: none;
  width: 13px;
  height: 13px;
  border: 2px solid rgba(148,163,184,0.28);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: ${c}-spin 0.9s linear infinite;
}
.${c} b { font-size: 0.78rem; color: #f1f5f9; }
.${c} .st { position: relative; display: flex; margin-top: 0.75rem; }
.${c} .rail {
  position: absolute;
  left: 16.6%;
  right: 16.6%;
  top: 6px;
  height: 2px;
  background: #23314b;
  border-radius: 2px;
  overflow: hidden;
}
.${c} .rail em {
  display: block;
  width: 0;
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #22d3ee);
  animation: ${c}-fill 6s ease-in-out infinite;
}
.${c} .s { position: relative; z-index: 1; flex: 1; text-align: center; }
.${c} .s u {
  display: block;
  width: 14px;
  height: 14px;
  margin: 0 auto;
  border-radius: 50%;
  background: #101828;
  border: 2px solid #33425e;
  animation: ${c}-lit 6s ease-in-out infinite;
}
.${c} .s span {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.64rem;
  color: #64748b;
  animation: ${c}-txt 6s ease-in-out infinite;
}
.${c} .s2 u { animation-name: ${c}-lit2; }
.${c} .s2 span { animation-name: ${c}-txt2; }
.${c} .s3 u { animation-name: ${c}-lit3; }
.${c} .s3 span { animation-name: ${c}-txt3; }
@keyframes ${c}-spin { to { transform: rotate(360deg); } }
@keyframes ${c}-fill { 0% { width: 0; } 100% { width: 100%; } }
@keyframes ${c}-lit {
  0%, 3%    { background: #101828; border-color: #33425e; box-shadow: none; }
  8%, 100%  { background: #22d3ee; border-color: #22d3ee; box-shadow: 0 0 10px rgba(34,211,238,0.75); }
}
@keyframes ${c}-lit2 {
  0%, 46%   { background: #101828; border-color: #33425e; box-shadow: none; }
  51%, 100% { background: #22d3ee; border-color: #22d3ee; box-shadow: 0 0 10px rgba(34,211,238,0.75); }
}
@keyframes ${c}-lit3 {
  0%, 90%   { background: #101828; border-color: #33425e; box-shadow: none; }
  95%, 100% { background: #22d3ee; border-color: #22d3ee; box-shadow: 0 0 10px rgba(34,211,238,0.75); }
}
@keyframes ${c}-txt  { 0%, 3%  { color: #64748b; } 8%, 100%  { color: #a5f3fc; } }
@keyframes ${c}-txt2 { 0%, 46% { color: #64748b; } 51%, 100% { color: #a5f3fc; } }
@keyframes ${c}-txt3 { 0%, 90% { color: #64748b; } 95%, 100% { color: #a5f3fc; } }`
    add(mk({
      name: 'Deploy Pipeline Toast',
      category: 'Alerts & Toasts',
      description: 'Toast that carries a three-stage pipeline along its foot, the connecting rail filling from left to right and each stage node lighting cyan as the deploy reaches it.',
      html, css,
      tags: ['deploy', 'stepper', 'pipeline', 'toast', 'progress'],
    }))
  }

  /* AL2. Merge conflict — an alert whose body is a two-sided diff */
  {
    const c = cls('v14-al-conflict')
    const html = `<div class="${c}"><div class="h"><i></i><b>Conflict in <code>theme.css</code></b></div><div class="d"><span class="o"><em>−</em>--surface: #0f172a;</span><span class="t"><em>+</em>--surface: #111827;</span></div><div class="r"><button>Keep ours</button><button>Keep theirs</button></div></div>`
    const css = `.${c} {
  width: 246px;
  padding: 0.7rem 0.75rem 0.75rem;
  background: #15121a;
  border: 1px solid #4c2a52;
  border-radius: 0.55rem;
  color: #e9d5ff;
}
.${c} .h { display: flex; align-items: center; gap: 0.45rem; }
.${c} .h i {
  position: relative;
  flex: none;
  width: 14px;
  height: 14px;
  border-left: 2px solid #c084fc;
  border-bottom: 2px solid #c084fc;
  border-radius: 0 0 0 5px;
}
.${c} .h i::after {
  content: '';
  position: absolute;
  right: -3px;
  top: -3px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c084fc;
}
.${c} .h i::before {
  content: '';
  position: absolute;
  left: -4px;
  top: -3px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #7e22ce;
}
.${c} b { font-size: 0.77rem; font-weight: 600; color: #f5f3ff; }
.${c} code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  color: #d8b4fe;
}
.${c} .d {
  display: grid;
  margin-top: 0.55rem;
  border-radius: 0.35rem;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
}
.${c} .d span {
  display: flex;
  gap: 0.4rem;
  padding: 0.28rem 0.45rem;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}
.${c} .d em { font-style: normal; opacity: 0.75; }
.${c} .o { color: #fca5a5; background: rgba(248,113,113,0.1); }
.${c} .t { color: #86efac; background: rgba(74,222,128,0.1); }
.${c} .o:hover { background: rgba(248,113,113,0.24); color: #fee2e2; }
.${c} .t:hover { background: rgba(74,222,128,0.24); color: #dcfce7; }
.${c} .r { display: flex; gap: 0.4rem; margin-top: 0.6rem; }
.${c} button {
  flex: 1;
  padding: 0.32rem 0;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  color: #ddd6fe;
  background: transparent;
  border: 1px solid #4c2a52;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
.${c} button:hover { background: #2a1f36; border-color: #a855f7; color: #faf5ff; }`
    add(mk({
      name: 'Merge Conflict Alert',
      category: 'Alerts & Toasts',
      description: 'Version-control notice whose body is a two-line diff, the incoming and outgoing versions stacked in red and green and each side lighting up as you point at it.',
      html, css,
      tags: ['merge', 'conflict', 'diff', 'git', 'alert'],
    }))
  }

  /* AL3. Rate limit — a token bucket of discrete pips refilling one by one */
  {
    const c = cls('v14-al-ratelimit')
    const html = `<div class="${c}"><div class="h"><b>Rate limit reached</b><em>refilling</em></div><div class="bk"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><p>The bucket takes back one request every 6 seconds.</p></div>`
    const css = `.${c} {
  width: 244px;
  padding: 0.7rem 0.8rem 0.75rem;
  background: #131320;
  border: 1px solid #3f3a63;
  border-radius: 0.55rem;
  color: #ddd6fe;
}
.${c} .h { display: flex; align-items: baseline; justify-content: space-between; }
.${c} b { font-size: 0.79rem; color: #e9d5ff; }
.${c} em {
  font-style: normal;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #818cf8;
}
.${c} .bk { display: flex; gap: 4px; margin: 0.55rem 0 0.5rem; }
.${c} .bk i {
  flex: 1;
  height: 14px;
  border-radius: 3px;
  background: #241f3d;
  box-shadow: inset 0 0 0 1px rgba(129,140,248,0.22);
  animation: ${c}-refill 12s linear infinite;
}
.${c} .bk i:nth-child(1)  { animation-delay: 0s; }
.${c} .bk i:nth-child(2)  { animation-delay: 0.5s; }
.${c} .bk i:nth-child(3)  { animation-delay: 1s; }
.${c} .bk i:nth-child(4)  { animation-delay: 1.5s; }
.${c} .bk i:nth-child(5)  { animation-delay: 2s; }
.${c} .bk i:nth-child(6)  { animation-delay: 2.5s; }
.${c} .bk i:nth-child(7)  { animation-delay: 3s; }
.${c} .bk i:nth-child(8)  { animation-delay: 3.5s; }
.${c} .bk i:nth-child(9)  { animation-delay: 4s; }
.${c} .bk i:nth-child(10) { animation-delay: 4.5s; }
.${c} p { margin: 0; font-size: 0.68rem; color: #8b87b8; }
@keyframes ${c}-refill {
  0%, 4%    { background: #241f3d; box-shadow: inset 0 0 0 1px rgba(129,140,248,0.22); }
  9%        { background: #c7d2fe; box-shadow: 0 0 12px rgba(165,180,252,0.85); }
  14%, 100% { background: #6366f1; box-shadow: inset 0 0 0 1px rgba(165,180,252,0.5); }
}`
    add(mk({
      name: 'Rate Limit Alert',
      category: 'Alerts & Toasts',
      description: 'Throttling notice showing the allowance as ten discrete tokens rather than a bar, each pip flashing bright as it drops back into the bucket one at a time.',
      html, css,
      tags: ['rate-limit', 'tokens', 'bucket', 'throttle', 'api'],
    }))
  }

  /* AL4. Card declined — a physical card object that flinches in the alert */
  {
    const c = cls('v14-al-declined')
    const html = `<div class="${c}"><div class="t"><span class="cd"><i class="x"></i></span><div><b>Card declined</b><small>Visa ending 4417 · issuer refused</small></div></div><button>Update payment method</button></div>`
    const css = `.${c} {
  width: 248px;
  padding: 0.75rem 0.8rem 0.8rem;
  background: #1a1114;
  border: 1px solid #6b2530;
  border-radius: 0.6rem;
  color: #fecdd3;
}
.${c} .t { display: flex; align-items: center; gap: 0.65rem; }
.${c} .cd {
  position: relative;
  flex: none;
  width: 48px;
  height: 31px;
  border-radius: 5px;
  background: linear-gradient(135deg, #3f2a33, #241419);
  box-shadow: inset 0 0 0 1px rgba(253,164,175,0.28), 0 5px 12px rgba(0,0,0,0.55);
  animation: ${c}-flinch 5s ease-in-out infinite;
}
.${c} .cd::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 6px;
  height: 6px;
  background: #14090c;
}
.${c} .cd::after {
  content: '';
  position: absolute;
  left: 5px;
  bottom: 5px;
  width: 10px;
  height: 8px;
  border-radius: 2px;
  background: linear-gradient(160deg, #fbbf24, #a16207);
}
.${c} .x {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: #e11d48;
  box-shadow: 0 0 0 2px #1a1114;
}
.${c} .x::before, .${c} .x::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 8px;
  width: 9px;
  height: 2px;
  border-radius: 1px;
  background: #fff1f2;
}
.${c} .x::before { transform: rotate(45deg); }
.${c} .x::after  { transform: rotate(-45deg); }
.${c} b { display: block; font-size: 0.8rem; color: #fda4af; }
.${c} small { font-size: 0.65rem; color: #a8848c; }
.${c} button {
  display: block;
  width: 100%;
  margin-top: 0.7rem;
  padding: 0.38rem 0;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 600;
  color: #4c0519;
  background: #fb7185;
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}
.${c} button:hover { background: #fda4af; transform: translateY(-1px); }
@keyframes ${c}-flinch {
  0%, 82%, 100% { transform: rotate(0deg) translateX(0); }
  86%           { transform: rotate(-5deg) translateX(-3px); }
  90%           { transform: rotate(5deg) translateX(3px); }
  95%           { transform: rotate(-2deg) translateX(-1px); }
}`
    add(mk({
      name: 'Card Declined Alert',
      category: 'Alerts & Toasts',
      description: 'Payment failure notice built around a miniature credit card with a stripe, chip and rejection badge, the card flinching every few seconds as if the reader pushed it back.',
      html, css,
      tags: ['payment', 'declined', 'card', 'billing', 'error'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Accordions & Tabs                                                   */
  /* ------------------------------------------------------------------ */

  /* AT1. Wizard accordion — numbered steps threaded on a progress rail */
  {
    const c = cls('v14-at-wizard')
    const html = `<div class="${c}"><details class="ok"><summary><i class="n ck"></i><b>Create account</b><small>hola@studio.dev</small></summary><div class="bd">Signed in with a work address.</div></details><details open><summary><i class="n cur">2</i><b>Name the workspace</b></summary><div class="bd"><span class="fld">studio-nord</span><button>Continue</button></div></details><details><summary><i class="n">3</i><b>Invite the team</b></summary><div class="bd">Add teammates by email.</div></details></div>`
    const css = `.${c} {
  width: 238px;
  padding: 0.5rem 0.6rem;
  background: #111a2b;
  border: 1px solid #253049;
  border-radius: 0.6rem;
  color: #cbd5e1;
}
.${c} details { position: relative; padding-left: 1.7rem; }
.${c} details::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 20px;
  bottom: -2px;
  width: 2px;
  background: #24304a;
}
.${c} details:last-child::before { display: none; }
.${c} details.ok::before { background: #15803d; }
.${c} summary {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.25rem 0;
  cursor: pointer;
  list-style: none;
}
.${c} summary::-webkit-details-marker { display: none; }
.${c} .n {
  position: absolute;
  left: 0;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  font-style: normal;
  font-size: 0.62rem;
  font-weight: 700;
  color: #64748b;
  background: #111a2b;
  border: 2px solid #33425e;
  border-radius: 50%;
}
.${c} .ck { background: #22c55e; border-color: #22c55e; }
.${c} .ck::after {
  content: '';
  width: 4px;
  height: 7px;
  border: 2px solid #052e16;
  border-top: 0;
  border-left: 0;
  transform: rotate(45deg) translate(-1px, -1px);
}
.${c} .cur { color: #c7d2fe; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.18); }
.${c} b { font-size: 0.75rem; color: #94a3b8; transition: color 0.2s ease; }
.${c} details[open] b, .${c} summary:hover b { color: #f1f5f9; }
.${c} small { margin-left: auto; font-size: 0.62rem; color: #4d5f7a; }
.${c} .bd {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.15rem 0 0.5rem;
  font-size: 0.68rem;
  color: #7d8ba4;
}
.${c} .fld {
  flex: 1;
  padding: 0.24rem 0.4rem;
  font-size: 0.68rem;
  color: #cbd5e1;
  background: #0e1626;
  border: 1px solid #2b3752;
  border-radius: 0.3rem;
}
.${c} button {
  padding: 0.26rem 0.5rem;
  font: inherit;
  font-size: 0.67rem;
  font-weight: 600;
  color: #fff;
  background: #4f46e5;
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
  transition: background 0.2s ease;
}
.${c} button:hover { background: #6366f1; }`
    add(mk({
      name: 'Wizard Steps Accordion',
      category: 'Accordions & Tabs',
      description: 'Setup accordion whose sections are numbered nodes threaded on a vertical rail, finished steps collapsing to a green tick and a summary while the current step stays open.',
      html, css,
      tags: ['wizard', 'steps', 'accordion', 'onboarding', 'rail'],
    }))
  }

  /* AT2. Lifted nav tabs — the active icon rises out of the bar */
  {
    const c = cls('v14-at-liftnav')
    const html = `<div class="${c}"><label><input type="radio" name="${c}" checked /><span class="ic"><u class="sq"></u></span><span class="lb">Home</span></label><label><input type="radio" name="${c}" /><span class="ic"><u class="ci"></u></span><span class="lb">Orbit</span></label><label><input type="radio" name="${c}" /><span class="ic"><u class="tr"></u></span><span class="lb">Peaks</span></label><label><input type="radio" name="${c}" /><span class="ic"><u class="bars"></u></span><span class="lb">More</span></label></div>`
    const css = `.${c} {
  display: flex;
  width: 240px;
  height: 64px;
  padding: 0 0.3rem;
  background: #111a2b;
  border: 1px solid #253049;
  border-radius: 1.1rem;
  box-shadow: 0 12px 26px rgba(0,0,0,0.45);
}
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} label { position: relative; flex: 1; height: 100%; cursor: pointer; }
.${c} .ic {
  position: absolute;
  left: 50%;
  top: 15px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: #64748b;
  background: #182238;
  border-radius: 50%;
  transform: translateX(-50%);
  transition: transform 0.32s cubic-bezier(0.34, 1.4, 0.64, 1), background 0.28s ease, color 0.28s ease, box-shadow 0.28s ease;
}
.${c} .lb {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 7px;
  text-align: center;
  font-size: 0.62rem;
  color: #475569;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.28s ease, transform 0.28s ease, color 0.28s ease;
}
.${c} label:hover .ic { color: #94a3b8; }
.${c} input:checked ~ .ic {
  color: #f8fafc;
  background: linear-gradient(150deg, #6366f1, #22d3ee);
  box-shadow: 0 8px 18px rgba(79,70,229,0.55);
  transform: translateX(-50%) translateY(-9px);
}
.${c} input:checked ~ .lb { opacity: 1; transform: translateY(0); color: #c7d2fe; }
.${c} .sq { width: 12px; height: 12px; border: 2px solid currentColor; border-radius: 2px; }
.${c} .ci { width: 13px; height: 13px; border: 2px solid currentColor; border-radius: 50%; }
.${c} .tr {
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 12px solid currentColor;
}
.${c} .bars {
  width: 14px;
  height: 12px;
  background: linear-gradient(to bottom, currentColor 0 2px, transparent 2px 5px, currentColor 5px 7px, transparent 7px 10px, currentColor 10px 12px);
}`
    add(mk({
      name: 'Lifted Nav Tabs',
      category: 'Accordions & Tabs',
      description: 'Bottom navigation bar where selecting a tab lifts its icon out of the bar on a springy curve into a glowing gradient disc and floats its label up underneath.',
      html, css,
      tags: ['navigation', 'tabs', 'mobile', 'icons', 'lift'],
    }))
  }

  /* AT3. Timeline tabs — a dated axis used as the tab strip */
  {
    const c = cls('v14-at-timeline')
    const html = `<div class="${c}"><div class="ax"><i class="rail"></i><i class="mk"></i><label><input type="radio" name="${c}" checked /><u></u><span>2023</span></label><label><input type="radio" name="${c}" /><u></u><span>2024</span></label><label><input type="radio" name="${c}" /><u></u><span>2025</span></label><label><input type="radio" name="${c}" /><u></u><span>2026</span></label></div><div class="pn"><div class="p p1"><b>Seed round</b><em>Two people and a folder of CSS.</em></div><div class="p p2"><b>Public beta</b><em>First 400 effects go live.</em></div><div class="p p3"><b>Studio ships</b><em>Editor, CLI and registry land.</em></div><div class="p p4"><b>Public API</b><em>Every effect addressable by id.</em></div></div></div>`
    const css = `.${c} {
  width: 236px;
  padding: 0.7rem 0.75rem 0.8rem;
  background: #111a2b;
  border: 1px solid #253049;
  border-radius: 0.6rem;
  color: #cbd5e1;
}
.${c} .ax { position: relative; display: flex; width: 204px; margin: 0 auto; padding-top: 14px; }
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} .rail { position: absolute; left: 0; right: 0; top: 8px; height: 2px; background: #26314b; }
.${c} .mk {
  position: absolute;
  left: 25.5px;
  top: 4px;
  width: 10px;
  height: 10px;
  margin-left: -5px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 10px rgba(56,189,248,0.9);
  transition: transform 0.36s cubic-bezier(0.65, 0, 0.35, 1);
}
.${c} label { position: relative; width: 51px; text-align: center; cursor: pointer; }
.${c} label u {
  position: absolute;
  left: 50%;
  top: -9px;
  width: 2px;
  height: 7px;
  margin-left: -1px;
  background: #33425e;
  transition: background 0.25s ease;
}
.${c} label span {
  display: block;
  padding-top: 0.25rem;
  font-size: 0.68rem;
  color: #5c6c88;
  transition: color 0.25s ease;
}
.${c} label:hover span { color: #94a3b8; }
.${c} input:checked ~ span { color: #7dd3fc; font-weight: 600; }
.${c} input:checked ~ u { background: #38bdf8; }
.${c}:has(.ax label:nth-of-type(2) input:checked) .mk { transform: translateX(51px); }
.${c}:has(.ax label:nth-of-type(3) input:checked) .mk { transform: translateX(102px); }
.${c}:has(.ax label:nth-of-type(4) input:checked) .mk { transform: translateX(153px); }
.${c} .pn { position: relative; height: 42px; margin-top: 0.6rem; }
.${c} .p {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translateX(10px);
  transition: opacity 0.3s ease, transform 0.34s ease;
}
.${c} .p b { display: block; font-size: 0.8rem; color: #f1f5f9; }
.${c} .p em { font-style: normal; font-size: 0.68rem; color: #7d8ba4; }
.${c} .p1 { opacity: 1; transform: translateX(0); }
.${c}:has(.ax label:nth-of-type(2) input:checked) .p1,
.${c}:has(.ax label:nth-of-type(3) input:checked) .p1,
.${c}:has(.ax label:nth-of-type(4) input:checked) .p1 { opacity: 0; transform: translateX(-10px); }
.${c}:has(.ax label:nth-of-type(2) input:checked) .p2,
.${c}:has(.ax label:nth-of-type(3) input:checked) .p3,
.${c}:has(.ax label:nth-of-type(4) input:checked) .p4 { opacity: 1; transform: translateX(0); }`
    add(mk({
      name: 'Timeline Year Tabs',
      category: 'Accordions & Tabs',
      description: 'Tab strip drawn as a dated axis, with year ticks along a rail and a glowing marker that slides between them while the milestone below swaps in from the side.',
      html, css,
      tags: ['timeline', 'tabs', 'years', 'axis', 'milestones'],
    }))
  }

  /* AT4. Ribbon tabs — tabs over a toolbar of grouped tools */
  {
    const c = cls('v14-at-ribbon')
    const html = `<div class="${c}"><div class="tb"><label><input type="radio" name="${c}" checked /><span>Home</span></label><label><input type="radio" name="${c}" /><span>Insert</span></label><label><input type="radio" name="${c}" /><span>Draw</span></label></div><div class="rb"><div class="g g1"><div class="tt"><i class="bd">B</i><i class="it">I</i><i class="un">U</i></div><small>Font</small></div><div class="g g2"><div class="tt"><i><u class="sq"></u></i><i><u class="ci"></u></i><i><u class="tr"></u></i></div><small>Shapes</small></div><div class="g g3"><div class="tt"><i><u class="w1"></u></i><i><u class="w2"></u></i><i><u class="w3"></u></i></div><small>Stroke</small></div></div></div>`
    const css = `.${c} {
  width: 238px;
  background: #0f1626;
  border: 1px solid #24304a;
  border-radius: 0.55rem;
  overflow: hidden;
  color: #cbd5e1;
}
.${c} .tb { display: flex; gap: 2px; padding: 0.3rem 0.35rem 0; background: #141d31; }
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} label { cursor: pointer; }
.${c} .tb span {
  display: block;
  padding: 0.3rem 0.62rem;
  font-size: 0.7rem;
  color: #64748b;
  border-radius: 0.35rem 0.35rem 0 0;
  transition: background 0.2s ease, color 0.2s ease;
}
.${c} label:hover span { color: #cbd5e1; }
.${c} input:checked ~ span { color: #93c5fd; background: #0f1626; }
.${c} .rb { display: flex; align-items: center; justify-content: center; height: 66px; }
.${c} .g { display: none; text-align: center; }
.${c} .tt { display: flex; gap: 4px; }
.${c} .tt i {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  font-style: normal;
  font-size: 0.8rem;
  color: #94a3b8;
  background: #16203a;
  border: 1px solid #263349;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}
.${c} .tt i:hover { background: #223055; color: #e2e8f0; transform: translateY(-2px); }
.${c} .bd { font-weight: 800; }
.${c} .it { font-style: italic; font-family: Georgia, serif; }
.${c} .un { text-decoration: underline; text-underline-offset: 2px; }
.${c} small {
  display: block;
  margin-top: 0.4rem;
  font-size: 0.6rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #4d5f7a;
}
.${c} .sq { width: 12px; height: 12px; border: 2px solid currentColor; border-radius: 2px; }
.${c} .ci { width: 13px; height: 13px; border: 2px solid currentColor; border-radius: 50%; }
.${c} .tr {
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 12px solid currentColor;
}
.${c} .w1, .${c} .w2, .${c} .w3 { width: 15px; border-radius: 2px; background: currentColor; }
.${c} .w1 { height: 2px; }
.${c} .w2 { height: 4px; }
.${c} .w3 { height: 7px; }
.${c}:has(label:nth-of-type(1) input:checked) .g1,
.${c}:has(label:nth-of-type(2) input:checked) .g2,
.${c}:has(label:nth-of-type(3) input:checked) .g3 { display: block; }`
    add(mk({
      name: 'Ribbon Toolbar Tabs',
      category: 'Accordions & Tabs',
      description: 'Office-style ribbon where each tab swaps the strip below for a different captioned group of tool buttons, and every button lifts slightly as it is pointed at.',
      html, css,
      tags: ['ribbon', 'tabs', 'toolbar', 'editor', 'groups'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* 3D & Perspective                                                    */
  /* ------------------------------------------------------------------ */

  /* 3D1. DNA helix — rungs orbiting a shared vertical axis on a stagger */
  {
    const c = cls('v14-3d-helix')
    const html = `<div class="${c}"><div class="hx"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 170px;
  height: 156px;
  perspective: 560px;
}
.${c} .hx {
  position: relative;
  width: 110px;
  height: 144px;
  transform-style: preserve-3d;
}
.${c} .hx i {
  position: absolute;
  left: 0;
  width: 110px;
  height: 5px;
  border-radius: 3px;
  background: linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6);
  box-shadow: 0 0 10px rgba(129,140,248,0.5);
  transform-style: preserve-3d;
  animation: ${c}-orbit 4.4s linear infinite;
}
.${c} .hx i:nth-child(1)  { top: 0px;   animation-delay: 0s; }
.${c} .hx i:nth-child(2)  { top: 12px;  animation-delay: -0.28s; }
.${c} .hx i:nth-child(3)  { top: 24px;  animation-delay: -0.56s; }
.${c} .hx i:nth-child(4)  { top: 36px;  animation-delay: -0.84s; }
.${c} .hx i:nth-child(5)  { top: 48px;  animation-delay: -1.12s; }
.${c} .hx i:nth-child(6)  { top: 60px;  animation-delay: -1.4s; }
.${c} .hx i:nth-child(7)  { top: 72px;  animation-delay: -1.68s; }
.${c} .hx i:nth-child(8)  { top: 84px;  animation-delay: -1.96s; }
.${c} .hx i:nth-child(9)  { top: 96px;  animation-delay: -2.24s; }
.${c} .hx i:nth-child(10) { top: 108px; animation-delay: -2.52s; }
.${c} .hx i:nth-child(11) { top: 120px; animation-delay: -2.8s; }
.${c} .hx i:nth-child(12) { top: 132px; animation-delay: -3.08s; }
@keyframes ${c}-orbit {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(360deg); }
}`
    add(mk({
      name: 'DNA Helix',
      category: '3D & Perspective',
      description: 'Stack of gradient rungs all turning about one vertical axis on a staggered offset, so the column reads as a double helix winding endlessly through the frame.',
      html, css,
      tags: ['helix', 'dna', 'rotatey', 'stagger', 'spiral'],
    }))
  }

  /* 3D2. Turntable — a deck laid back in perspective with a spinning record */
  {
    const c = cls('v14-3d-turntable')
    const html = `<div class="${c}"><div class="dk"><div class="pl"><i class="lb"></i></div><b class="arm"></b><em class="btn"></em></div></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 210px;
  height: 152px;
  perspective: 520px;
}
.${c} .dk {
  position: relative;
  width: 176px;
  height: 132px;
  border-radius: 0.5rem;
  background: linear-gradient(160deg, #263248, #141c2c);
  box-shadow: 0 22px 34px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(148,163,184,0.18);
  transform-style: preserve-3d;
  transform: rotateX(58deg) rotateZ(-8deg);
}
.${c} .pl {
  position: absolute;
  left: 26px;
  top: 16px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background:
    repeating-radial-gradient(circle at 50% 50%, #10141d 0 2px, #171d29 2px 4px);
  box-shadow: 0 0 0 1px rgba(148,163,184,0.2);
  transform: translateZ(9px);
  animation: ${c}-spin 3.4s linear infinite;
}
.${c} .pl::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 5px;
  width: 2px;
  height: 20px;
  margin-left: -1px;
  background: rgba(226,232,240,0.4);
}
.${c} .lb {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 36px;
  height: 36px;
  margin: -18px 0 0 -18px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #f97316, #fbbf24, #f97316);
  box-shadow: inset 0 0 0 5px rgba(15,23,42,0.15);
}
.${c} .lb::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 50%;
  background: #0f172a;
}
.${c} .arm {
  position: absolute;
  right: 20px;
  top: 22px;
  width: 6px;
  height: 68px;
  border-radius: 3px;
  background: linear-gradient(180deg, #cbd5e1, #64748b);
  transform-origin: 50% 6px;
  transform: translateZ(17px) rotate(28deg);
  animation: ${c}-drift 9s ease-in-out infinite;
}
.${c} .arm::before {
  content: '';
  position: absolute;
  left: -6px;
  top: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #94a3b8;
  box-shadow: inset 0 0 0 4px #475569;
}
.${c} .arm::after {
  content: '';
  position: absolute;
  left: -3px;
  bottom: -3px;
  width: 12px;
  height: 10px;
  border-radius: 2px;
  background: #e2e8f0;
}
.${c} .btn {
  position: absolute;
  right: 22px;
  bottom: 14px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #22d3ee;
  box-shadow: 0 0 10px rgba(34,211,238,0.7);
  transform: translateZ(11px);
}
@keyframes ${c}-spin { to { transform: translateZ(9px) rotate(360deg); } }
@keyframes ${c}-drift {
  0%, 100% { transform: translateZ(17px) rotate(28deg); }
  50%      { transform: translateZ(17px) rotate(34deg); }
}`
    add(mk({
      name: 'Turntable Deck',
      category: '3D & Perspective',
      description: 'A record deck laid back into the picture plane, the platter raised above the plinth and turning under a tonearm that creeps slowly inward across the grooves.',
      html, css,
      tags: ['turntable', 'record', 'rotatex', 'plane', 'scene'],
    }))
  }

  /* 3D3. Voxel wave — an isometric block field rippling on the z axis */
  {
    const c = cls('v14-3d-voxel')
    const html = `<div class="${c}"><div class="sc"><i class="c1"><u class="t"></u><u class="n"></u><u class="s"></u><u class="e"></u><u class="w"></u></i><i class="c2"><u class="t"></u><u class="n"></u><u class="s"></u><u class="e"></u><u class="w"></u></i><i class="c3"><u class="t"></u><u class="n"></u><u class="s"></u><u class="e"></u><u class="w"></u></i><i class="c4"><u class="t"></u><u class="n"></u><u class="s"></u><u class="e"></u><u class="w"></u></i><i class="c5"><u class="t"></u><u class="n"></u><u class="s"></u><u class="e"></u><u class="w"></u></i><i class="c6"><u class="t"></u><u class="n"></u><u class="s"></u><u class="e"></u><u class="w"></u></i><i class="c7"><u class="t"></u><u class="n"></u><u class="s"></u><u class="e"></u><u class="w"></u></i><i class="c8"><u class="t"></u><u class="n"></u><u class="s"></u><u class="e"></u><u class="w"></u></i><i class="c9"><u class="t"></u><u class="n"></u><u class="s"></u><u class="e"></u><u class="w"></u></i></div></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 220px;
  height: 158px;
  perspective: 700px;
  background: radial-gradient(80% 80% at 50% 40%, #101b2e, #080d17 75%);
  border-radius: 0.7rem;
}
.${c} .sc {
  position: relative;
  width: 86px;
  height: 86px;
  transform-style: preserve-3d;
  transform: rotateX(56deg) rotateZ(-45deg) translateZ(-8px);
}
.${c} .sc i {
  position: absolute;
  width: 26px;
  height: 26px;
  transform-style: preserve-3d;
  animation: ${c}-bob 3.4s ease-in-out infinite;
}
.${c} .sc u {
  position: absolute;
  inset: 0;
  display: block;
}
.${c} .t { transform: translateZ(26px); background: #38bdf8; box-shadow: inset 0 0 0 1px rgba(8,47,73,0.5); }
.${c} .n { transform: translateY(-13px) translateZ(13px) rotateX(90deg); background: #0e7490; }
.${c} .s { transform: translateY(13px)  translateZ(13px) rotateX(90deg); background: #0e7490; }
.${c} .e { transform: translateX(13px)  translateZ(13px) rotateY(90deg); background: #155e75; }
.${c} .w { transform: translateX(-13px) translateZ(13px) rotateY(90deg); background: #155e75; }
.${c} .c1 { left: 0px;  top: 0px;  animation-delay: 0s; }
.${c} .c2 { left: 30px; top: 0px;  animation-delay: 0.22s; }
.${c} .c3 { left: 60px; top: 0px;  animation-delay: 0.44s; }
.${c} .c4 { left: 0px;  top: 30px; animation-delay: 0.22s; }
.${c} .c5 { left: 30px; top: 30px; animation-delay: 0.44s; }
.${c} .c6 { left: 60px; top: 30px; animation-delay: 0.66s; }
.${c} .c7 { left: 0px;  top: 60px; animation-delay: 0.44s; }
.${c} .c8 { left: 30px; top: 60px; animation-delay: 0.66s; }
.${c} .c9 { left: 60px; top: 60px; animation-delay: 0.88s; }
@keyframes ${c}-bob {
  0%, 100% { transform: translateZ(0); }
  50%      { transform: translateZ(22px); }
}`
    add(mk({
      name: 'Voxel Wave',
      category: '3D & Perspective',
      description: 'A three by three field of isometric cubes, each built from a lit top and four shaded walls, riding up and down on a diagonal wave that crosses the grid.',
      html, css,
      tags: ['isometric', 'voxel', 'cubes', 'wave', 'grid'],
    }))
  }

  /* 3D4. Gyroscope — three rings spinning on mutually orthogonal axes */
  {
    const c = cls('v14-3d-gyro')
    const html = `<div class="${c}"><div class="gy"><i class="r1"></i><i class="r2"></i><i class="r3"></i><b></b></div></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 168px;
  height: 152px;
  perspective: 640px;
  background: radial-gradient(60% 60% at 50% 50%, #131c2f, #080d17 78%);
  border-radius: 50%;
}
.${c} .gy {
  position: relative;
  width: 118px;
  height: 118px;
  transform-style: preserve-3d;
}
.${c} .gy i {
  position: absolute;
  border-radius: 50%;
}
.${c} .gy .r1 {
  inset: 0;
  border: 3px solid #22d3ee;
  animation: ${c}-a 5s linear infinite;
}
.${c} .gy .r2 {
  inset: 14px;
  border: 3px solid #c084fc;
  animation: ${c}-b 4s linear infinite;
}
.${c} .gy .r3 {
  inset: 28px;
  border: 3px solid #fbbf24;
  animation: ${c}-c 6.5s linear infinite;
}
.${c} .gy b {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 54px;
  height: 54px;
  margin: -27px 0 0 -27px;
  border-radius: 50%;
  background: radial-gradient(circle, #e0f2fe 0 15%, rgba(125,211,252,0.6) 30%, rgba(56,189,248,0.18) 55%, rgba(56,189,248,0) 72%);
  animation: ${c}-core 3s ease-in-out infinite;
}
@keyframes ${c}-a {
  from { transform: rotateX(64deg) rotateY(0deg); }
  to   { transform: rotateX(64deg) rotateY(360deg); }
}
@keyframes ${c}-b {
  from { transform: rotateY(58deg) rotateX(0deg); }
  to   { transform: rotateY(58deg) rotateX(360deg); }
}
@keyframes ${c}-c {
  from { transform: rotateX(20deg) rotateZ(0deg) rotateY(46deg); }
  to   { transform: rotateX(20deg) rotateZ(360deg) rotateY(46deg); }
}
@keyframes ${c}-core {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.14); }
}`
    add(mk({
      name: 'Gyroscope Rings',
      category: '3D & Perspective',
      description: 'Three nested gimbal rings each turning about a different axis at its own speed around a bright core, so the assembly never repeats the same silhouette twice.',
      html, css,
      tags: ['gyroscope', 'gimbal', 'rings', 'orthogonal', 'rotate3d'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Glow & Neon                                                         */
  /* ------------------------------------------------------------------ */

  /* GL1. Fibre patch panel — light in transit through channels */
  {
    const c = cls('v14-gl-fibre')
    const html = `<div class="${c}"><div class="ch"><span class="p a"></span><b class="w"><i></i></b><span class="p z"></span></div><div class="ch"><span class="p a"></span><b class="w"><i></i></b><span class="p z"></span></div><div class="ch"><span class="p a"></span><b class="w"><i></i></b><span class="p z"></span></div><div class="ch"><span class="p a"></span><b class="w"><i></i></b><span class="p z"></span></div></div>`
    const css = `.${c} {
  display: grid;
  gap: 11px;
  width: 234px;
  padding: 0.8rem 0.85rem;
  background: #05080f;
  border: 1px solid #172033;
  border-radius: 0.6rem;
  box-shadow: inset 0 0 26px rgba(0,0,0,0.8);
}
.${c} .ch { display: flex; align-items: center; gap: 9px; }
.${c} .p {
  flex: none;
  width: 13px;
  height: 13px;
  border-radius: 3px;
  background: #0d1526;
  box-shadow: inset 0 0 0 1px rgba(148,163,184,0.22);
}
.${c} .w {
  position: relative;
  flex: 1;
  height: 2px;
  border-radius: 2px;
  background: rgba(148,163,184,0.16);
}
.${c} .w i {
  position: absolute;
  top: -3px;
  left: -26px;
  width: 26px;
  height: 8px;
  border-radius: 4px;
  opacity: 0;
  animation: ${c}-run 2.8s linear infinite;
}
.${c} .ch:nth-child(1) .w i { background: linear-gradient(90deg, rgba(34,211,238,0), #67e8f9); box-shadow: 0 0 14px rgba(34,211,238,0.9); animation-delay: 0s; }
.${c} .ch:nth-child(2) .w i { background: linear-gradient(90deg, rgba(167,139,250,0), #c4b5fd); box-shadow: 0 0 14px rgba(167,139,250,0.9); animation-delay: 0.7s; }
.${c} .ch:nth-child(3) .w i { background: linear-gradient(90deg, rgba(52,211,153,0), #6ee7b7); box-shadow: 0 0 14px rgba(52,211,153,0.9); animation-delay: 1.4s; }
.${c} .ch:nth-child(4) .w i { background: linear-gradient(90deg, rgba(251,191,36,0), #fcd34d); box-shadow: 0 0 14px rgba(251,191,36,0.9); animation-delay: 2.1s; }
.${c} .z { animation: ${c}-arrive 2.8s linear infinite; }
.${c} .ch:nth-child(1) .a { box-shadow: inset 0 0 0 1px rgba(34,211,238,0.5), 0 0 8px rgba(34,211,238,0.35); background: #06323b; }
.${c} .ch:nth-child(2) .a { box-shadow: inset 0 0 0 1px rgba(167,139,250,0.5), 0 0 8px rgba(167,139,250,0.35); background: #241c40; }
.${c} .ch:nth-child(3) .a { box-shadow: inset 0 0 0 1px rgba(52,211,153,0.5), 0 0 8px rgba(52,211,153,0.35); background: #052e26; }
.${c} .ch:nth-child(4) .a { box-shadow: inset 0 0 0 1px rgba(251,191,36,0.5), 0 0 8px rgba(251,191,36,0.35); background: #33240a; }
.${c} .ch:nth-child(1) .z { animation-delay: 0s; }
.${c} .ch:nth-child(2) .z { animation-delay: 0.7s; }
.${c} .ch:nth-child(3) .z { animation-delay: 1.4s; }
.${c} .ch:nth-child(4) .z { animation-delay: 2.1s; }
@keyframes ${c}-run {
  0%       { left: -26px; opacity: 0; }
  10%      { opacity: 1; }
  100%     { left: 100%; opacity: 1; }
}
@keyframes ${c}-arrive {
  0%, 88%  { background: #0d1526; box-shadow: inset 0 0 0 1px rgba(148,163,184,0.22); }
  96%      { background: #e2e8f0; box-shadow: 0 0 16px rgba(226,232,240,0.9); }
  100%     { background: #94a3b8; box-shadow: 0 0 10px rgba(148,163,184,0.6); }
}`
    add(mk({
      name: 'Fibre Patch Panel',
      category: 'Glow & Neon',
      description: 'Four dark fibre channels between lit ports, each carrying a bright packet of light from the source port to the far one, which flares white as the packet lands.',
      html, css,
      tags: ['fibre', 'packet', 'transit', 'ports', 'network'],
    }))
  }

  /* GL2. Dial gauge — glow used as a measured radial scale */
  {
    const c = cls('v14-gl-dial')
    const html = `<div class="${c}"><i class="k1"></i><i class="k2"></i><i class="k3"></i><i class="k4"></i><i class="k5"></i><i class="k6"></i><i class="k7"></i><i class="k8"></i><i class="k9"></i><i class="k10"></i><i class="k11"></i><i class="k12"></i><i class="k13"></i><i class="k14"></i><i class="k15"></i><i class="k16"></i><b class="nd"></b><span class="hub"></span><em class="rd">68<u>%</u></em></div>`
    const css = `.${c} {
  position: relative;
  width: 132px;
  height: 132px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 42%, #101a2b 40%, #070b14 78%);
  box-shadow: inset 0 0 0 1px #16304a, inset 0 0 26px rgba(0,0,0,0.9);
}
.${c} i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 3px;
  height: 10px;
  margin: -55px 0 0 -1.5px;
  border-radius: 2px;
  background: #1c2b42;
  transform-origin: 50% 55px;
}
.${c} .k1  { transform: rotate(-120deg); }
.${c} .k2  { transform: rotate(-104deg); }
.${c} .k3  { transform: rotate(-88deg); }
.${c} .k4  { transform: rotate(-72deg); }
.${c} .k5  { transform: rotate(-56deg); }
.${c} .k6  { transform: rotate(-40deg); }
.${c} .k7  { transform: rotate(-24deg); }
.${c} .k8  { transform: rotate(-8deg); }
.${c} .k9  { transform: rotate(8deg); }
.${c} .k10 { transform: rotate(24deg); }
.${c} .k11 { transform: rotate(40deg); }
.${c} .k12 { transform: rotate(56deg); }
.${c} .k13 { transform: rotate(72deg); }
.${c} .k14 { transform: rotate(88deg); }
.${c} .k15 { transform: rotate(104deg); }
.${c} .k16 { transform: rotate(120deg); }
.${c} .k1, .${c} .k2, .${c} .k3, .${c} .k4, .${c} .k5, .${c} .k6, .${c} .k7,
.${c} .k8, .${c} .k9, .${c} .k10 {
  background: #22d3ee;
  box-shadow: 0 0 9px rgba(34,211,238,0.85);
}
.${c} .k11 {
  background: #67e8f9;
  box-shadow: 0 0 12px rgba(103,232,249,0.95);
  animation: ${c}-edge 2.2s ease-in-out infinite;
}
.${c} .nd {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 3px;
  height: 46px;
  margin: -46px 0 0 -1.5px;
  border-radius: 2px;
  background: linear-gradient(180deg, #f8fafc, #7dd3fc);
  box-shadow: 0 0 10px rgba(125,211,252,0.8);
  transform-origin: 50% 46px;
  animation: ${c}-sway 5s ease-in-out infinite;
}
.${c} .hub {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  border-radius: 50%;
  background: #0b1220;
  box-shadow: inset 0 0 0 2px #38bdf8, 0 0 12px rgba(56,189,248,0.6);
}
.${c} .rd {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 20px;
  text-align: center;
  font-style: normal;
  font-size: 1.05rem;
  font-weight: 700;
  color: #e0f2fe;
  text-shadow: 0 0 12px rgba(56,189,248,0.8);
}
.${c} .rd u { font-size: 0.62rem; text-decoration: none; color: #38bdf8; }
@keyframes ${c}-sway {
  0%, 100% { transform: rotate(40deg); }
  32%      { transform: rotate(47deg); }
  68%      { transform: rotate(35deg); }
}
@keyframes ${c}-edge {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}`
    add(mk({
      name: 'Neon Dial Gauge',
      category: 'Glow & Neon',
      description: 'Round instrument face where the glow is a measurement: ticks light cyan up to the current reading, the boundary tick breathes, and a bright needle drifts either side of it.',
      html, css,
      tags: ['gauge', 'dial', 'ticks', 'needle', 'instrument'],
    }))
  }

  /* GL3. Reflected sign — the mechanic is the mirrored glow, not the sign */
  {
    const c = cls('v14-gl-reflect')
    const html = `<div class="${c}"><b class="sg">OPEN</b><b class="rf">OPEN</b><i class="fl"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 224px;
  height: 146px;
  border-radius: 0.6rem;
  overflow: hidden;
  background: linear-gradient(180deg, #05070d 0 52%, #090d17 52%);
}
.${c} .sg, .${c} .rf {
  position: absolute;
  left: 50%;
  padding: 0.4rem 0.9rem;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: #fff1f7;
  border: 2px solid #f472b6;
  border-radius: 0.4rem;
  text-shadow: 0 0 6px #f9a8d4, 0 0 16px #ec4899;
  box-shadow: 0 0 10px rgba(236,72,153,0.7), inset 0 0 10px rgba(236,72,153,0.55);
}
.${c} .sg { top: 24px; transform: translateX(-50%); }
.${c} .rf {
  top: 84px;
  transform: translateX(-50%) scaleY(-1);
  filter: blur(2.5px);
  opacity: 0.5;
  animation: ${c}-ripple 4.5s ease-in-out infinite;
}
.${c} .fl {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 76px;
  height: 1px;
  background: linear-gradient(90deg, rgba(244,114,182,0), rgba(244,114,182,0.75), rgba(244,114,182,0));
  box-shadow: 0 0 12px rgba(236,72,153,0.55);
}
.${c}::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 76px;
  bottom: 0;
  background: linear-gradient(180deg, rgba(9,13,23,0) 0%, rgba(9,13,23,0.72) 62%, #090d17 100%);
}
@keyframes ${c}-ripple {
  0%, 100% { transform: translateX(-50%) scaleY(-1) skewX(0deg) scaleX(1); }
  30%      { transform: translateX(-50%) scaleY(-1) skewX(3.5deg) scaleX(1.03); }
  65%      { transform: translateX(-50%) scaleY(-1) skewX(-3deg) scaleX(0.98); }
}`
    add(mk({
      name: 'Neon Reflection Sign',
      category: 'Glow & Neon',
      description: 'A steady pink sign standing on a wet floor line, its blurred mirror image below wavering and skewing as if the puddle underneath it never quite settles.',
      html, css,
      tags: ['reflection', 'sign', 'mirror', 'puddle', 'wet-floor'],
    }))
  }

  /* GL4. Constellation — glow as a signal hopping across a graph */
  {
    const c = cls('v14-gl-constel')
    const html = `<div class="${c}"><b class="e1"></b><b class="e2"></b><b class="e3"></b><b class="e4"></b><b class="e5"></b><i class="n1"></i><i class="n2"></i><i class="n3"></i><i class="n4"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 218px;
  height: 130px;
  border-radius: 0.6rem;
  overflow: hidden;
  background: radial-gradient(85% 85% at 45% 40%, #0c1526, #05070e 78%);
  box-shadow: inset 0 0 0 1px #16233c;
}
.${c} b {
  position: absolute;
  height: 2px;
  border-radius: 1px;
  background: rgba(103,232,249,0.2);
  transform-origin: 0 50%;
}
.${c} b::after {
  content: '';
  position: absolute;
  top: -3px;
  left: -26px;
  width: 26px;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(34,211,238,0), #a5f3fc);
  box-shadow: 0 0 14px rgba(34,211,238,0.9);
  opacity: 0;
  animation: ${c}-pulse 3.2s linear infinite;
}
.${c} .e1 { left: 26px; top: 85px;  width: 71px;  transform: rotate(-47.3deg); }
.${c} .e2 { left: 74px; top: 33px;  width: 77px;  transform: rotate(49.2deg); }
.${c} .e3 { left: 124px; top: 91px; width: 69px;  transform: rotate(-41.5deg); }
.${c} .e4 { left: 74px; top: 33px;  width: 103px; transform: rotate(6.7deg); }
.${c} .e5 { left: 26px; top: 85px;  width: 98px;  transform: rotate(3.5deg); }
.${c} .e2::after { animation-delay: 0.5s; }
.${c} .e3::after { animation-delay: 1s; }
.${c} .e4::after { animation-delay: 0.75s; }
.${c} .e5::after { animation-delay: 1.6s; }
.${c} i {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e0f2fe;
  box-shadow: 0 0 10px rgba(56,189,248,0.75);
  animation: ${c}-flare 3.2s ease-in-out infinite;
}
.${c} .n1 { left: 21px;  top: 81px; animation-delay: 0s; }
.${c} .n2 { left: 69px;  top: 29px; animation-delay: 0.45s; }
.${c} .n3 { left: 119px; top: 87px; animation-delay: 0.95s; }
.${c} .n4 { left: 171px; top: 41px; animation-delay: 1.45s; }
@keyframes ${c}-pulse {
  0%   { left: -26px; opacity: 0; }
  10%  { opacity: 1; }
  100% { left: calc(100% - 26px); opacity: 1; }
}
@keyframes ${c}-flare {
  0%, 100% { transform: scale(1);    box-shadow: 0 0 10px rgba(56,189,248,0.75); }
  12%      { transform: scale(1.45); box-shadow: 0 0 20px rgba(125,211,252,1); }
  30%      { transform: scale(1);    box-shadow: 0 0 10px rgba(56,189,248,0.75); }
}`
    add(mk({
      name: 'Neon Constellation',
      category: 'Glow & Neon',
      description: 'Four nodes wired together by faint edges, with a bright signal running down each link in turn and every node flaring as the pulse arrives at it.',
      html, css,
      tags: ['constellation', 'graph', 'nodes', 'signal', 'network'],
    }))
  }
}
