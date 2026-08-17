// scripts/generate-effects-v12-g.mjs
//
// Twelfth wave, part G: Timelines & Steps, Tables & Data Grids,
// Forms & Validation, Scroll & Sticky. One entry per distinct design,
// no colorway or size stamping (see the v11 note on why).
//
// Every design here is transition-on-hover / :checked / :focus-within
// driven, or an infinite keyframe whose 100% frame is a sane rest
// state, so the reduced-motion guard leaves something sensible.

export function generateV12G(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Timelines & Steps                                                  */
  /* ------------------------------------------------------------------ */

  /* 1. Segment bar stepper — chunky filled segments, hover fills the next */
  {
    const c = cls('v12-tl-segments')
    const html = `<div class="${c}"><div class="bar"><i></i><i></i><i></i><i></i><i></i></div><div class="lbl"><span>Step 3 of 5</span><b>Shipping</b></div></div>`
    const css = `.${c} {
  width: 240px;
  font-family: system-ui, sans-serif;
  color: #e2e8f0;
}
.${c} .bar { display: flex; gap: 5px; }
.${c} .bar i {
  flex: 1;
  height: 10px;
  border-radius: 999px;
  background: #1e293b;
  transition: background 0.3s ease, transform 0.3s ease;
}
.${c} .bar i:nth-child(-n+3) { background: #6366f1; box-shadow: 0 0 10px rgba(99,102,241,0.5); }
.${c}:hover .bar i:nth-child(4) { background: #6366f1; transform: scaleY(1.4); }
.${c} .lbl {
  display: flex;
  justify-content: space-between;
  margin-top: 0.7rem;
  font-size: 0.8rem;
  color: #94a3b8;
}
.${c} .lbl b { color: #a5b4fc; font-weight: 600; }`
    add(mk({
      name: 'Segment Bar Stepper',
      category: 'Timelines & Steps',
      description: 'Progress stepper made of pill segments where the next segment lights up and swells on hover.',
      html, css,
      tags: ['stepper', 'segments', 'progress', 'pills'],
    }))
  }

  /* 2. Chevron breadcrumb steps — arrow-shaped steps that nest into each other */
  {
    const c = cls('v12-tl-chevron')
    const html = `<div class="${c}"><span class="done">Cart</span><span class="cur">Details</span><span>Pay</span></div>`
    const css = `.${c} {
  display: flex;
  font-family: system-ui, sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  color: #94a3b8;
}
.${c} span {
  padding: 0.55rem 0.9rem 0.55rem 1.4rem;
  background: #1e293b;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%);
  margin-left: -8px;
  transition: background 0.3s ease, color 0.3s ease;
}
.${c} span:first-child { padding-left: 1rem; clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%); border-radius: 6px 0 0 6px; }
.${c} .done { background: #0369a1; color: #e0f2fe; }
.${c} .cur { background: #0ea5e9; color: #fff; }
.${c} span:hover { background: #38bdf8; color: #082f49; }`
    add(mk({
      name: 'Chevron Breadcrumb Steps',
      category: 'Timelines & Steps',
      description: 'Arrow-shaped step chips that nest into one another like a breadcrumb trail and highlight on hover.',
      html, css,
      tags: ['chevron', 'breadcrumb', 'steps', 'arrow'],
    }))
  }

  /* 3. Ring step dial — conic ring split into steps with a centre count */
  {
    const c = cls('v12-tl-ring')
    const html = `<div class="${c}"><div class="ring"><b>2<small>/4</small></b></div><div class="txt"><b>Verify email</b><span>Next: add a team</span></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: system-ui, sans-serif;
  color: #e2e8f0;
}
.${c} .ring {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: conic-gradient(#14b8a6 0 88deg, transparent 88deg 90deg, #14b8a6 90deg 178deg, transparent 178deg 180deg, #1e293b 180deg 268deg, transparent 268deg 270deg, #1e293b 270deg 358deg, transparent 358deg);
  display: grid;
  place-items: center;
  transition: background 0.35s ease, transform 0.35s ease;
}
.${c}:hover .ring {
  transform: rotate(-8deg);
  background: conic-gradient(#14b8a6 0 88deg, transparent 88deg 90deg, #14b8a6 90deg 178deg, transparent 178deg 180deg, #2dd4bf 180deg 268deg, transparent 268deg 270deg, #1e293b 270deg 358deg, transparent 358deg);
}
.${c} .ring::before {
  content: '';
  position: absolute;
  inset: 9px;
  border-radius: 50%;
  background: #0b1020;
}
.${c} .ring b { position: relative; font-size: 1.4rem; font-weight: 700; color: #5eead4; }
.${c} .ring small { font-size: 0.7rem; color: #64748b; font-weight: 500; }
.${c} .txt { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.8rem; }
.${c} .txt b { font-size: 0.9rem; }
.${c} .txt span { color: #94a3b8; }`
    add(mk({
      name: 'Ring Step Dial',
      category: 'Timelines & Steps',
      description: 'Circular progress dial split into step arcs with a centre count, where hover previews the next arc lighting up.',
      html, css,
      tags: ['ring', 'dial', 'steps', 'conic', 'progress'],
    }))
  }

  /* 4. Ruler timeline — tick ruler with a sliding marker */
  {
    const c = cls('v12-tl-ruler')
    const html = `<div class="${c}"><div class="ticks"></div><div class="mark"><span>Q3</span></div><div class="yrs"><span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span></div></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 70px;
  font-family: system-ui, sans-serif;
  color: #e2e8f0;
}
.${c} .ticks {
  position: absolute;
  left: 0; right: 0; top: 24px;
  height: 18px;
  border-top: 2px solid #475569;
  background:
    repeating-linear-gradient(90deg, #475569 0 1px, transparent 1px 12px) 0 0 / 100% 8px no-repeat,
    repeating-linear-gradient(90deg, #94a3b8 0 2px, transparent 2px 60px) 0 0 / 100% 18px no-repeat;
}
.${c} .mark {
  position: absolute;
  top: 0;
  left: 55%;
  width: 2px;
  height: 46px;
  background: #f59e0b;
  transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .mark span {
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.1rem 0.4rem;
  font-size: 0.65rem;
  font-weight: 700;
  color: #1c1917;
  background: #f59e0b;
  border-radius: 4px;
}
.${c} .mark::after {
  content: '';
  position: absolute;
  bottom: -5px; left: -4px;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 10px #f59e0b;
}
.${c}:hover .mark { left: 82%; }
.${c} .yrs {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: #64748b;
}`
    add(mk({
      name: 'Ruler Marker Timeline',
      category: 'Timelines & Steps',
      description: 'Horizontal tick ruler with month labels and a flagged marker that slides forward on hover.',
      html, css,
      tags: ['ruler', 'ticks', 'marker', 'timeline'],
    }))
  }

  /* 5. Icon card steps — vertical steps as small icon cards on a dotted rail */
  {
    const c = cls('v12-tl-cards')
    const html = `<div class="${c}"><div class="st"><i>✓</i><span>Account created</span></div><div class="st on"><i>✎</i><span>Add profile</span></div><div class="st"><i>★</i><span>Invite team</span></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 200px;
  padding-left: 4px;
  font-family: system-ui, sans-serif;
  color: #e2e8f0;
}
.${c}::before {
  content: '';
  position: absolute;
  left: 19px;
  top: 12px; bottom: 12px;
  border-left: 2px dotted #475569;
}
.${c} .st {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.6rem 0.35rem 0.35rem;
  border-radius: 999px;
  background: #0f172a;
  border: 1px solid #1e293b;
  font-size: 0.78rem;
  transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease;
}
.${c} .st i {
  display: grid;
  place-items: center;
  width: 24px; height: 24px;
  border-radius: 50%;
  font-style: normal;
  font-size: 0.7rem;
  background: #1e293b;
  color: #94a3b8;
}
.${c} .st:first-child i { background: #f43f5e; color: #fff; }
.${c} .st.on { border-color: #f43f5e; }
.${c} .st.on i { background: #fff1f2; color: #f43f5e; box-shadow: 0 0 0 4px rgba(244,63,94,0.25); }
.${c} .st:hover { transform: translateX(6px); border-color: #fb7185; background: #1e1b2e; }`
    add(mk({
      name: 'Icon Pill Steps',
      category: 'Timelines & Steps',
      description: 'Vertical onboarding steps rendered as icon pills on a dotted rail, each nudging sideways on hover.',
      html, css,
      tags: ['steps', 'pills', 'icons', 'onboarding', 'vertical'],
    }))
  }

  /* 6. Story progress bars — story-style segments, the active one fills on a loop */
  {
    const c = cls('v12-tl-story')
    const html = `<div class="${c}"><div class="bars"><i class="d"></i><i class="d"></i><i class="a"></i><i></i><i></i></div><div class="hd"><b></b><span>hoverlab</span><em>3 of 5</em></div><div class="body">Slide three</div></div>`
    const css = `.${c} {
  width: 200px;
  padding: 8px 10px 0;
  border-radius: 12px;
  background: linear-gradient(160deg, #4c1d95, #1e1b4b);
  font-family: system-ui, sans-serif;
  color: #ede9fe;
  overflow: hidden;
}
.${c} .bars { display: flex; gap: 4px; }
.${c} .bars i {
  position: relative;
  flex: 1;
  height: 3px;
  border-radius: 3px;
  background: rgba(255,255,255,0.3);
  overflow: hidden;
}
.${c} .bars i::after {
  content: '';
  position: absolute;
  inset: 0;
  background: #fff;
  transform: translateX(-100%);
}
.${c} .bars .d::after { transform: none; }
.${c} .bars .a::after { animation: ${c}-fill 3s linear infinite; }
@keyframes ${c}-fill { 0% { transform: translateX(-100%); } 100% { transform: translateX(0); } }
.${c}:hover .bars .a::after { animation-play-state: paused; }
.${c} .hd { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.6rem; font-size: 0.75rem; }
.${c} .hd b { width: 22px; height: 22px; border-radius: 50%; background: #8b5cf6; border: 2px solid #c4b5fd; }
.${c} .hd em { margin-left: auto; font-style: normal; color: #c4b5fd; }
.${c} .body { height: 62px; display: grid; place-items: center; font-size: 0.85rem; font-weight: 600; opacity: 0.85; }`
    add(mk({
      name: 'Story Progress Bars',
      category: 'Timelines & Steps',
      description: 'Story-style segmented progress bars where the active segment fills on a loop and pauses on hover.',
      html, css,
      tags: ['story', 'segments', 'progress', 'autoplay'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Tables & Data Grids                                                */
  /* ------------------------------------------------------------------ */

  /* 7. Heatmap grid — cells tinted by value, hover pops the cell */
  {
    const c = cls('v12-tb-heat')
    const html = `<table class="${c}"><tr><th></th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th></tr><tr><th>Sun</th><td class="l2">4</td><td class="l3">8</td><td class="l1">2</td><td class="l4">12</td></tr><tr><th>Wnd</th><td class="l1">1</td><td class="l4">11</td><td class="l3">7</td><td class="l2">5</td></tr><tr><th>Rain</th><td class="l3">9</td><td class="l2">3</td><td class="l4">14</td><td class="l1">0</td></tr></table>`
    const css = `.${c} {
  border-collapse: separate;
  border-spacing: 3px;
  font-family: system-ui, sans-serif;
  font-size: 0.72rem;
  color: #e2e8f0;
}
.${c} th { font-weight: 500; color: #94a3b8; padding: 2px 6px; }
.${c} td {
  width: 40px;
  height: 28px;
  text-align: center;
  border-radius: 5px;
  font-variant-numeric: tabular-nums;
  color: #022c22;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.${c} .l1 { background: #064e3b; color: #a7f3d0; }
.${c} .l2 { background: #059669; }
.${c} .l3 { background: #34d399; }
.${c} .l4 { background: #a7f3d0; }
.${c} td:hover { transform: scale(1.15); box-shadow: 0 0 0 2px #ecfdf5; position: relative; z-index: 1; }`
    add(mk({
      name: 'Heatmap Cell Grid',
      category: 'Tables & Data Grids',
      description: 'Compact data grid whose cells are tinted by value like a heatmap, with each cell popping forward on hover.',
      html, css,
      tags: ['heatmap', 'grid', 'cells', 'data'],
    }))
  }

  /* 8. Card row table — rows float as separate cards that lift on hover */
  {
    const c = cls('v12-tb-cardrows')
    const html = `<table class="${c}"><tr><td><b>Acme Co</b></td><td>$4,200</td><td><i>Paid</i></td></tr><tr><td><b>Globex</b></td><td>$1,050</td><td><i class="w">Due</i></td></tr><tr><td><b>Initech</b></td><td>$860</td><td><i>Paid</i></td></tr></table>`
    const css = `.${c} {
  width: 240px;
  border-collapse: separate;
  border-spacing: 0 6px;
  font-family: system-ui, sans-serif;
  font-size: 0.78rem;
  color: #e2e8f0;
}
.${c} td {
  padding: 0.5rem 0.7rem;
  background: #131a30;
  border-top: 1px solid #1e293b;
  border-bottom: 1px solid #1e293b;
  transition: background 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
}
.${c} td:first-child { border-left: 1px solid #1e293b; border-radius: 8px 0 0 8px; }
.${c} td:last-child { border-right: 1px solid #1e293b; border-radius: 0 8px 8px 0; text-align: right; }
.${c} td b { font-weight: 600; }
.${c} td i {
  font-style: normal;
  font-size: 0.65rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: rgba(217,70,239,0.18);
  color: #f0abfc;
}
.${c} td .w { background: rgba(245,158,11,0.18); color: #fcd34d; }
.${c} tr:hover td { background: #1c1836; border-color: #d946ef; transform: translateX(3px); }`
    add(mk({
      name: 'Floating Card Rows',
      category: 'Tables & Data Grids',
      description: 'Invoice table whose rows are spaced apart as rounded cards that light their border and nudge on hover.',
      html, css,
      tags: ['table', 'cards', 'rows', 'invoice'],
    }))
  }

  /* 9. Progress bar table — a bar cell that grows on row hover */
  {
    const c = cls('v12-tb-bars')
    const html = `<table class="${c}"><tr><td>Storage</td><td><span style="--p:72%"></span></td><td>72%</td></tr><tr><td>Bandwidth</td><td><span style="--p:38%"></span></td><td>38%</td></tr><tr><td>Builds</td><td><span style="--p:91%"></span></td><td>91%</td></tr><tr><td>Seats</td><td><span style="--p:55%"></span></td><td>55%</td></tr></table>`
    const css = `.${c} {
  width: 250px;
  border-collapse: collapse;
  font-family: system-ui, sans-serif;
  font-size: 0.75rem;
  color: #cbd5e1;
}
.${c} td { padding: 0.35rem 0.4rem; border-bottom: 1px solid #1e293b; }
.${c} td:first-child { width: 72px; font-weight: 500; }
.${c} td:last-child { width: 34px; text-align: right; font-variant-numeric: tabular-nums; color: #fdba74; }
.${c} td span {
  display: block;
  height: 8px;
  border-radius: 999px;
  background: #1e293b;
  overflow: hidden;
  position: relative;
}
.${c} td span::after {
  content: '';
  position: absolute;
  inset: 0;
  width: var(--p);
  border-radius: inherit;
  background: linear-gradient(90deg, #f97316, #fb923c);
  transform-origin: left;
  transition: transform 0.35s ease, filter 0.35s ease;
}
.${c} tr:hover td { background: rgba(249,115,22,0.07); }
.${c} tr:hover td span::after { filter: brightness(1.25); }
.${c} tr:hover td span { transform: scaleY(1.5); }`
    add(mk({
      name: 'Usage Bar Table',
      category: 'Tables & Data Grids',
      description: 'Quota table with an inline progress bar per row that thickens and brightens when the row is hovered.',
      html, css,
      tags: ['table', 'progress', 'bar', 'usage', 'quota'],
    }))
  }

  /* 10. Leaderboard table — medal ranks and avatars */
  {
    const c = cls('v12-tb-leader')
    const html = `<table class="${c}"><tr class="g"><td>1</td><td><i>A</i>Ava</td><td>2,410</td></tr><tr class="s"><td>2</td><td><i>K</i>Kai</td><td>2,180</td></tr><tr class="b"><td>3</td><td><i>M</i>Mia</td><td>1,955</td></tr><tr><td>4</td><td><i>J</i>Jo</td><td>1,720</td></tr></table>`
    const css = `.${c} {
  width: 230px;
  border-collapse: collapse;
  font-family: system-ui, sans-serif;
  font-size: 0.78rem;
  color: #e2e8f0;
}
.${c} td { padding: 0.35rem 0.5rem; border-bottom: 1px solid #1e293b; transition: background 0.25s ease; }
.${c} td:first-child {
  width: 22px;
  text-align: center;
  font-weight: 700;
  color: #64748b;
}
.${c} td:last-child { text-align: right; font-variant-numeric: tabular-nums; color: #fcd34d; font-weight: 600; }
.${c} td i {
  display: inline-grid;
  place-items: center;
  width: 20px; height: 20px;
  margin-right: 0.5rem;
  border-radius: 50%;
  font-style: normal;
  font-size: 0.65rem;
  background: #334155;
  vertical-align: middle;
  transition: transform 0.25s ease;
}
.${c} .g td:first-child { color: #f59e0b; }
.${c} .s td:first-child { color: #cbd5e1; }
.${c} .b td:first-child { color: #d97706; }
.${c} .g td i { background: #f59e0b; color: #1c1917; box-shadow: 0 0 0 2px #0b1020, 0 0 0 3px #f59e0b; }
.${c} tr:hover td { background: rgba(245,158,11,0.1); }
.${c} tr:hover td i { transform: scale(1.2); }`
    add(mk({
      name: 'Medal Leaderboard Table',
      category: 'Tables & Data Grids',
      description: 'Ranking table with gold, silver and bronze rank tints, avatar chips and a warm row highlight on hover.',
      html, css,
      tags: ['leaderboard', 'ranking', 'table', 'avatars'],
    }))
  }

  /* 11. Column highlight grid — hovering a cell lights its whole column */
  {
    const c = cls('v12-tb-column')
    const html = `<table class="${c}"><tr><th>Plan</th><th>Free</th><th>Pro</th><th>Team</th></tr><tr><td>Seats</td><td>1</td><td>5</td><td>25</td></tr><tr><td>Storage</td><td>2GB</td><td>50GB</td><td>1TB</td></tr><tr><td>Support</td><td>—</td><td>Email</td><td>24/7</td></tr></table>`
    const css = `.${c} {
  border-collapse: collapse;
  overflow: hidden;
  font-family: system-ui, sans-serif;
  font-size: 0.75rem;
  color: #e2e8f0;
}
.${c} th, .${c} td {
  position: relative;
  padding: 0.4rem 0.7rem;
  text-align: center;
  border-bottom: 1px solid #1e293b;
}
.${c} th { color: #a3e635; font-weight: 600; }
.${c} td:first-child, .${c} th:first-child { text-align: left; color: #94a3b8; }
.${c} td:hover::after, .${c} th:hover::after {
  content: '';
  position: absolute;
  left: 0; right: 0;
  top: -400px; bottom: -400px;
  background: rgba(132,204,22,0.12);
  border-left: 1px solid rgba(132,204,22,0.4);
  border-right: 1px solid rgba(132,204,22,0.4);
  pointer-events: none;
}
.${c} td:hover, .${c} th:hover { color: #ecfccb; }`
    add(mk({
      name: 'Column Spotlight Grid',
      category: 'Tables & Data Grids',
      description: 'Pricing comparison grid that highlights an entire column, not just a row, when any cell in it is hovered.',
      html, css,
      tags: ['table', 'column', 'highlight', 'pricing'],
    }))
  }

  /* 12. Ledger table — monospace credit/debit columns with a double-rule total */
  {
    const c = cls('v12-tb-ledger')
    const html = `<table class="${c}"><tr><td>Invoice #1041</td><td class="cr">+1,200.00</td></tr><tr><td>AWS hosting</td><td class="dr">−318.40</td></tr><tr><td>Refund</td><td class="dr">−75.00</td></tr><tr class="tot"><td>Balance</td><td>806.60</td></tr></table>`
    const css = `.${c} {
  width: 240px;
  border-collapse: collapse;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.74rem;
  color: #cbd5e1;
}
.${c} td { padding: 0.35rem 0.5rem; border-bottom: 1px dashed #1e293b; transition: background 0.2s ease; }
.${c} td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
.${c} .cr { color: #22d3ee; }
.${c} .dr { color: #fb7185; }
.${c} .tot td {
  border-top: 3px double #06b6d4;
  border-bottom: none;
  font-weight: 700;
  color: #ecfeff;
  padding-top: 0.5rem;
}
.${c} tr:not(.tot):hover td { background: rgba(6,182,212,0.1); }
.${c} tr:hover td:last-child { text-shadow: 0 0 8px currentColor; }`
    add(mk({
      name: 'Monospace Ledger Table',
      category: 'Tables & Data Grids',
      description: 'Accounting ledger with tabular monospace credit and debit columns and a double-ruled balance row.',
      html, css,
      tags: ['ledger', 'monospace', 'finance', 'table', 'totals'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Forms & Validation                                                 */
  /* ------------------------------------------------------------------ */

  /* 13. Floating label field — the label floats up on focus or when filled */
  {
    const c = cls('v12-fm-float')
    const html = `<label class="${c}"><input type="text" placeholder=" " /><span>Email address</span></label>`
    const css = `.${c} {
  position: relative;
  display: block;
  width: 220px;
  font-family: system-ui, sans-serif;
}
.${c} input {
  width: 100%;
  box-sizing: border-box;
  padding: 1.15rem 0.8rem 0.45rem;
  font-size: 0.9rem;
  color: #e2e8f0;
  background: #0f172a;
  border: 1.5px solid #334155;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.${c} span {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  color: #64748b;
  pointer-events: none;
  transition: top 0.2s ease, font-size 0.2s ease, color 0.2s ease;
}
.${c}:hover input { border-color: #64748b; }
.${c} input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.25); }
.${c} input:focus + span,
.${c} input:not(:placeholder-shown) + span { top: 0.75rem; font-size: 0.65rem; color: #a5b4fc; }`
    add(mk({
      name: 'Floating Label Field',
      category: 'Forms & Validation',
      description: 'Text field whose placeholder label shrinks and floats to the top edge on focus or when a value is entered.',
      html, css,
      tags: ['input', 'floating-label', 'focus', 'material'],
    }))
  }

  /* 14. Segmented choice — pill radio group with a sliding thumb (:checked) */
  {
    const c = cls('v12-fm-segment')
    const html = `<div class="${c}"><label><input type="radio" name="${c}" checked /><span>Monthly</span></label><label><input type="radio" name="${c}" /><span>Yearly</span></label><label><input type="radio" name="${c}" /><span>Lifetime</span></label></div>`
    const css = `.${c} {
  display: inline-flex;
  padding: 4px;
  gap: 2px;
  border-radius: 999px;
  background: #0f172a;
  border: 1px solid #1e293b;
  font-family: system-ui, sans-serif;
}
.${c} label { position: relative; cursor: pointer; }
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} span {
  display: block;
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
  border-radius: 999px;
  transition: background 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
}
.${c} label:hover span { color: #e0f2fe; }
.${c} input:checked + span { background: #0ea5e9; color: #fff; box-shadow: 0 2px 8px rgba(14,165,233,0.45); }
.${c} input:focus-visible + span { outline: 2px solid #7dd3fc; outline-offset: 2px; }`
    add(mk({
      name: 'Segmented Choice Radios',
      category: 'Forms & Validation',
      description: 'Radio group styled as a segmented pill control where the checked option gets a filled, glowing thumb.',
      html, css,
      tags: ['radio', 'segmented', 'pill', 'choice'],
    }))
  }

  /* 15. Quantity stepper — number field with minus/plus caps */
  {
    const c = cls('v12-fm-qty')
    const html = `<div class="${c}"><button type="button">−</button><input type="number" value="2" min="1" /><button type="button">+</button></div>`
    const css = `.${c} {
  display: inline-flex;
  align-items: stretch;
  border: 1.5px solid #334155;
  border-radius: 10px;
  background: #0f172a;
  overflow: hidden;
  font-family: system-ui, sans-serif;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.${c}:hover, .${c}:focus-within { border-color: #14b8a6; box-shadow: 0 0 0 3px rgba(20,184,166,0.2); }
.${c} button {
  width: 38px;
  border: none;
  background: transparent;
  color: #5eead4;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.${c} button:hover { background: #14b8a6; color: #042f2e; }
.${c} input {
  width: 46px;
  border: none;
  border-left: 1px solid #1e293b;
  border-right: 1px solid #1e293b;
  background: transparent;
  color: #e2e8f0;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 600;
  outline: none;
  -moz-appearance: textfield;
}
.${c} input::-webkit-outer-spin-button, .${c} input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }`
    add(mk({
      name: 'Quantity Stepper Field',
      category: 'Forms & Validation',
      description: 'Number input flanked by minus and plus caps that fill with the accent when hovered.',
      html, css,
      tags: ['number', 'quantity', 'stepper', 'input'],
    }))
  }

  /* 16. Underline grow field — material-style underline expands from centre */
  {
    const c = cls('v12-fm-underline')
    const html = `<label class="${c}"><span>Full name</span><input type="text" value="Ada Lovelace" /><i></i></label>`
    const css = `.${c} {
  position: relative;
  display: block;
  width: 220px;
  font-family: system-ui, sans-serif;
}
.${c} span { display: block; font-size: 0.68rem; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; margin-bottom: 2px; transition: color 0.25s ease; }
.${c} input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.4rem 0;
  font-size: 0.95rem;
  color: #e2e8f0;
  background: transparent;
  border: none;
  border-bottom: 1.5px solid #334155;
  outline: none;
}
.${c} i {
  position: absolute;
  left: 50%; right: 50%;
  bottom: 0;
  height: 2px;
  background: #10b981;
  transition: left 0.3s ease, right 0.3s ease;
}
.${c}:hover i { left: 40%; right: 40%; }
.${c}:focus-within i { left: 0; right: 0; }
.${c}:focus-within span { color: #34d399; }`
    add(mk({
      name: 'Underline Grow Field',
      category: 'Forms & Validation',
      description: 'Borderless field with a thin bottom rule where an accent underline grows outward from the centre on focus.',
      html, css,
      tags: ['input', 'underline', 'focus', 'minimal'],
    }))
  }

  /* 17. Swatch radio group — colour swatches with a ring on :checked */
  {
    const c = cls('v12-fm-swatch')
    const html = `<fieldset class="${c}"><legend>Colour</legend><label><input type="radio" name="${c}" /><span style="--s:#f43f5e"></span></label><label><input type="radio" name="${c}" checked /><span style="--s:#ec4899"></span></label><label><input type="radio" name="${c}" /><span style="--s:#8b5cf6"></span></label><label><input type="radio" name="${c}" /><span style="--s:#0ea5e9"></span></label><label><input type="radio" name="${c}" /><span style="--s:#10b981"></span></label></fieldset>`
    const css = `.${c} {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 0;
  padding: 0.6rem 0.9rem;
  border: 1px solid #1e293b;
  border-radius: 12px;
  background: #0f172a;
  font-family: system-ui, sans-serif;
}
.${c} legend { padding: 0 0.3rem; font-size: 0.68rem; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase; }
.${c} label { cursor: pointer; }
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} span {
  display: block;
  width: 26px; height: 26px;
  border-radius: 50%;
  background: var(--s);
  box-shadow: 0 0 0 0 #0f172a, 0 0 0 0 var(--s);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.${c} label:hover span { transform: scale(1.15); }
.${c} input:checked + span { box-shadow: 0 0 0 3px #0f172a, 0 0 0 5px var(--s); transform: scale(1.05); }
.${c} input:checked + span::after { content: '✓'; display: grid; place-items: center; height: 100%; color: #fff; font-size: 0.8rem; font-weight: 700; }`
    add(mk({
      name: 'Colour Swatch Radios',
      category: 'Forms & Validation',
      description: 'Radio group of colour swatch dots where the checked swatch grows an offset ring and a tick.',
      html, css,
      tags: ['radio', 'swatch', 'colour', 'picker'],
    }))
  }

  /* 18. Chip tag input — removable chips inside a text field */
  {
    const c = cls('v12-fm-chips')
    const html = `<label class="${c}"><span>Design<i>×</i></span><span>CSS<i>×</i></span><span>Motion<i>×</i></span><input type="text" placeholder="Add tag…" /></label>`
    const css = `.${c} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  width: 240px;
  box-sizing: border-box;
  padding: 6px;
  border: 1.5px solid #334155;
  border-radius: 10px;
  background: #0f172a;
  font-family: system-ui, sans-serif;
  cursor: text;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.${c}:hover { border-color: #64748b; }
.${c}:focus-within { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.2); }
.${c} span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.2rem 0.3rem 0.2rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #fde68a;
  background: rgba(245,158,11,0.15);
  border: 1px solid rgba(245,158,11,0.4);
  border-radius: 999px;
}
.${c} span i {
  display: grid;
  place-items: center;
  width: 14px; height: 14px;
  border-radius: 50%;
  font-style: normal;
  font-size: 0.7rem;
  color: #fbbf24;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.${c} span i:hover { background: #f59e0b; color: #1c1917; }
.${c} input {
  flex: 1;
  min-width: 60px;
  border: none;
  background: transparent;
  color: #e2e8f0;
  font-size: 0.8rem;
  outline: none;
  padding: 0.2rem;
}`
    add(mk({
      name: 'Tag Chip Input',
      category: 'Forms & Validation',
      description: 'Text field that holds removable tag chips inline, with the chip close buttons and the field border reacting on hover and focus.',
      html, css,
      tags: ['input', 'chips', 'tags', 'multi-value'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Scroll & Sticky                                                    */
  /* ------------------------------------------------------------------ */

  /* 19. Sticky footer total — a summed row that stays pinned at the bottom of a scroll box */
  {
    const c = cls('v12-sc-stickyfoot')
    const html = `<div class="${c}"><div class="row"><span>Hosting</span><b>$24</b></div><div class="row"><span>Domain</span><b>$12</b></div><div class="row"><span>Email</span><b>$6</b></div><div class="row"><span>Backups</span><b>$9</b></div><div class="row"><span>CDN</span><b>$15</b></div><div class="row"><span>Monitoring</span><b>$8</b></div><div class="row"><span>Support</span><b>$20</b></div><div class="tot"><span>Total</span><b>$94</b></div></div>`
    const css = `.${c} {
  width: 220px;
  height: 140px;
  overflow: auto;
  border-radius: 10px;
  border: 1px solid #1e293b;
  background: #0f172a;
  font-family: system-ui, sans-serif;
  font-size: 0.78rem;
  color: #cbd5e1;
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}
.${c} .row, .${c} .tot {
  display: flex;
  justify-content: space-between;
  padding: 0.45rem 0.8rem;
  border-bottom: 1px solid #1e293b;
}
.${c} .row:hover { background: rgba(99,102,241,0.1); }
.${c} .tot {
  position: sticky;
  bottom: 0;
  background: #1e1b4b;
  border-top: 2px solid #6366f1;
  border-bottom: none;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 -6px 12px rgba(0,0,0,0.35);
}
.${c} .tot b { color: #a5b4fc; }`
    add(mk({
      name: 'Sticky Total Footer',
      category: 'Scroll & Sticky',
      description: 'Scrollable line-item list whose total row stays pinned to the bottom edge while the items scroll beneath it.',
      html, css,
      tags: ['sticky', 'footer', 'total', 'scroll', 'list'],
    }))
  }

  /* 20. Scroll-driven hue shift — the box tints as you scroll (animation-timeline: scroll) */
  {
    const c = cls('v12-sc-hue')
    const html = `<div class="${c}"><div class="in"><p>Scroll to warm the box.</p><p>Chapter one begins in the cold blue of morning.</p><p>By midday the light has turned green and gold.</p><p>Evening arrives in amber and rose.</p><p>The end.</p></div></div>`
    const css = `.${c} {
  width: 230px;
  height: 140px;
  overflow: auto;
  border-radius: 10px;
  border: 1px solid #1e293b;
  background: #0f2a3a;
  font-family: system-ui, sans-serif;
  font-size: 0.78rem;
  line-height: 1.5;
  color: #e2e8f0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.3) transparent;
  animation: ${c}-tint linear both;
  animation-timeline: scroll(self);
}
@keyframes ${c}-tint {
  0% { background: #0f2a3a; }
  50% { background: #123a2a; }
  100% { background: #3a1a2a; }
}
.${c} .in { padding: 0.9rem 0.9rem 0.9rem; }
.${c} p { margin: 0 0 1.4rem; }
.${c} p:first-child { color: #14b8a6; font-weight: 600; }
.${c} p:last-child { margin-bottom: 0; }`
    add(mk({
      name: 'Scroll Tint Reader',
      category: 'Scroll & Sticky',
      description: 'Scroll box whose background tints from cool blue to warm rose as you scroll, driven purely by a scroll timeline.',
      html, css,
      tags: ['scroll-driven', 'timeline', 'tint', 'reader'],
    }))
  }

  /* 21. Snap page stack — vertical mandatory snap between full-height pages */
  {
    const c = cls('v12-sc-pages')
    const html = `<div class="${c}"><section><b>01</b>Welcome</section><section><b>02</b>Features</section><section><b>03</b>Pricing</section><section><b>04</b>Sign up</section></div>`
    const css = `.${c} {
  width: 220px;
  height: 140px;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  border-radius: 12px;
  border: 1px solid #1e293b;
  font-family: system-ui, sans-serif;
  color: #fff;
  scrollbar-width: none;
}
.${c}::-webkit-scrollbar { display: none; }
.${c} section {
  height: 140px;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  font-size: 1rem;
  font-weight: 600;
}
.${c} section b { font-size: 0.7rem; opacity: 0.6; font-weight: 500; letter-spacing: 0.1em; }
.${c} section:nth-child(1) { background: linear-gradient(135deg, #be123c, #f43f5e); }
.${c} section:nth-child(2) { background: linear-gradient(135deg, #9f1239, #e11d48); }
.${c} section:nth-child(3) { background: linear-gradient(135deg, #881337, #be123c); }
.${c} section:nth-child(4) { background: linear-gradient(135deg, #4c0519, #9f1239); }
.${c} section:hover b { opacity: 1; }`
    add(mk({
      name: 'Snap Page Stack',
      category: 'Scroll & Sticky',
      description: 'Vertical scroll box that snaps hard between full-height page panels, one section per scroll.',
      html, css,
      tags: ['scroll-snap', 'pages', 'vertical', 'sections'],
    }))
  }

  /* 22. View-timeline scale rail — cards scale up as they enter the centre of a horizontal scroller */
  {
    const c = cls('v12-sc-viewscale')
    const html = `<div class="${c}"><div class="card">A</div><div class="card">B</div><div class="card">C</div><div class="card">D</div><div class="card">E</div><div class="card">F</div></div>`
    const css = `.${c} {
  display: flex;
  gap: 10px;
  width: 240px;
  height: 110px;
  padding: 0 92px 0 24px;
  box-sizing: border-box;
  align-items: center;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  border-radius: 12px;
  background: #0f172a;
  border: 1px solid #1e293b;
  font-family: system-ui, sans-serif;
}
.${c}::-webkit-scrollbar { display: none; }
.${c} .card {
  flex: 0 0 56px;
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #4c1d95;
  color: #ede9fe;
  font-size: 1.1rem;
  font-weight: 700;
  scroll-snap-align: center;
  animation: ${c}-pop linear both;
  animation-timeline: view(inline);
  animation-range: entry 0% exit 100%;
}
@keyframes ${c}-pop {
  0% { transform: scale(0.7); background: #3b0764; }
  50% { transform: scale(1); background: #8b5cf6; box-shadow: 0 8px 20px rgba(139,92,246,0.5); }
  100% { transform: scale(0.7); background: #3b0764; }
}`
    add(mk({
      name: 'Focus Scale Rail',
      category: 'Scroll & Sticky',
      description: 'Horizontal snap rail where each card scales up and brightens as it passes the centre, driven by a view timeline.',
      html, css,
      tags: ['scroll-driven', 'view-timeline', 'rail', 'scale'],
    }))
  }

  /* 23. Sticky date pills — chat thread with centred sticky day dividers */
  {
    const c = cls('v12-sc-datepill')
    const html = `<div class="${c}"><div class="day"><span>Today</span></div><div class="msg">Hey, are the mocks ready?</div><div class="msg me">Almost — pushing now.</div><div class="msg">Nice, ping me when done.</div><div class="day"><span>Yesterday</span></div><div class="msg me">Kickoff at 10?</div><div class="msg">Works for me.</div><div class="msg me">Great, see you then.</div></div>`
    const css = `.${c} {
  width: 220px;
  height: 140px;
  overflow: auto;
  padding: 0 0.6rem;
  box-sizing: border-box;
  border-radius: 12px;
  background: #0f172a;
  border: 1px solid #1e293b;
  font-family: system-ui, sans-serif;
  font-size: 0.74rem;
  color: #e2e8f0;
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}
.${c} .day {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  justify-content: center;
  padding: 0.4rem 0;
  background: linear-gradient(#0f172a 65%, transparent);
}
.${c} .day span {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: #0ea5e9;
  color: #fff;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.${c} .msg {
  max-width: 78%;
  margin: 0 0 0.4rem;
  padding: 0.35rem 0.6rem;
  border-radius: 10px 10px 10px 3px;
  background: #1e293b;
  width: fit-content;
}
.${c} .me { margin-left: auto; background: #0369a1; border-radius: 10px 10px 3px 10px; }`
    add(mk({
      name: 'Sticky Day Pills Thread',
      category: 'Scroll & Sticky',
      description: 'Chat thread scroller where each day divider pill sticks to the top until the next day pushes it away.',
      html, css,
      tags: ['sticky', 'chat', 'divider', 'scroll', 'thread'],
    }))
  }

  /* 24. Picker wheel — snapping vertical wheel with faded edges and a centre band */
  {
    const c = cls('v12-sc-wheel')
    const html = `<div class="${c}"><div class="win"><div class="list"><i></i><i></i><span>08</span><span>09</span><span>10</span><span>11</span><span>12</span><span>13</span><span>14</span><i></i><i></i></div></div><div class="band"></div><em>: 00</em></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 150px;
  height: 140px;
  padding: 0 1rem;
  box-sizing: border-box;
  border-radius: 14px;
  background: #0f172a;
  border: 1px solid #1e293b;
  font-family: system-ui, sans-serif;
  color: #e2e8f0;
}
.${c} .win {
  width: 60px;
  height: 140px;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  -webkit-mask-image: linear-gradient(transparent, #000 35%, #000 65%, transparent);
  mask-image: linear-gradient(transparent, #000 35%, #000 65%, transparent);
}
.${c} .win::-webkit-scrollbar { display: none; }
.${c} .list span, .${c} .list i {
  display: grid;
  place-items: center;
  height: 28px;
  scroll-snap-align: center;
  font-size: 1.15rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.${c} .band {
  position: absolute;
  left: 8px; right: 8px;
  top: 56px;
  height: 28px;
  border-radius: 8px;
  background: rgba(249,115,22,0.16);
  border: 1px solid rgba(249,115,22,0.6);
  pointer-events: none;
}
.${c} em { position: relative; z-index: 1; font-style: normal; font-size: 1.15rem; font-weight: 600; color: #fdba74; }
.${c}:hover .band { background: rgba(249,115,22,0.28); }`
    add(mk({
      name: 'Snap Picker Wheel',
      category: 'Scroll & Sticky',
      description: 'Vertical picker wheel that snaps each value into a highlighted centre band with faded edges above and below.',
      html, css,
      tags: ['scroll-snap', 'picker', 'wheel', 'time', 'mask'],
    }))
  }
}
