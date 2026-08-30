// scripts/generate-effects-v13-f.mjs
//
// Thirteenth wave, part F: Tables & Data Grids (6), Forms & Validation
// (6), Sliders & Carousels (4), Icons & Shapes (4).
//
// Shape-budget group: Tables and Forms are in the group still short of
// shapes, so they take six each; Sliders and Icons are "thinning" and
// take four.
//
//   Tables  — pivot totals, tree table, diff table, filter toolbar,
//             paged table, schedule grid
//   Forms   — address autocomplete, multi-step, NPS scale, time picker,
//             upload list, conditional fieldset
//   Sliders — peek carousel, temperature slider, dual-row marquee,
//             counter carousel
//   Icons   — download tray, rocket, coffee steam, ticking clock

export function generateV13F(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Tables & Data Grids                                                 */
  /* ------------------------------------------------------------------ */

  /* TB1. Pivot totals — a cross-tab with a totals row and column */
  {
    const c = cls('v13-tb-pivot')
    const html = `<table class="${c}"><thead><tr><th></th><th>Q1</th><th>Q2</th><th class="tt">Σ</th></tr></thead><tbody><tr><th>EU</th><td>128</td><td>164</td><td class="tt">292</td></tr><tr><th>US</th><td>210</td><td>188</td><td class="tt">398</td></tr><tr><th>APAC</th><td>96</td><td>141</td><td class="tt">237</td></tr><tr class="tr"><th>Σ</th><td>434</td><td>493</td><td class="tt">927</td></tr></tbody></table>`
    const css = `.${c} {
  width: 224px;
  border-collapse: collapse;
  font-size: 0.7rem;
  color: #cbd5e1;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.5rem;
  overflow: hidden;
}
.${c} th, .${c} td { padding: 0.32rem 0.5rem; text-align: right; }
.${c} thead th { font-size: 0.62rem; font-weight: 500; color: #64748b; background: #131c31; }
.${c} tbody th { text-align: left; font-weight: 500; color: #94a3b8; }
.${c} td { font-variant-numeric: tabular-nums; }
.${c} .tt { color: #7dd3fc; font-weight: 600; background: rgba(56,189,248,0.07); }
.${c} .tr { border-top: 1px solid #29344d; }
.${c} .tr th, .${c} .tr td { color: #e2e8f0; font-weight: 700; background: rgba(56,189,248,0.07); }
.${c} tbody tr:hover td, .${c} tbody tr:hover th { background: #1a2540; }`
    add(mk({
      name: 'Pivot Totals Table',
      category: 'Tables & Data Grids',
      description: 'Cross-tab of regions against quarters with a tinted totals column and totals row meeting at the grand total.',
      html, css,
      tags: ['pivot', 'cross-tab', 'totals', 'table', 'aggregate'],
    }))
  }

  /* TB2. Tree table — hierarchical rows with disclosure arrows */
  {
    const c = cls('v13-tb-tree')
    const html = `<div class="${c}"><div class="r h"><span>Path</span><em>Size</em></div><div class="r g"><span><i></i>src</span><em>2.4 MB</em></div><div class="r d1"><span><i></i>components</span><em>1.1 MB</em></div><div class="r d2"><span>Button.tsx</span><em>18 KB</em></div><div class="r d2"><span>Card.tsx</span><em>24 KB</em></div><div class="r d1"><span>lib</span><em>860 KB</em></div><div class="r g"><span><i></i>public</span><em>640 KB</em></div></div>`
    const css = `.${c} {
  width: 226px;
  font-size: 0.71rem;
  color: #cbd5e1;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.5rem;
  overflow: hidden;
}
.${c} .r {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.28rem 0.55rem;
  transition: background 0.16s ease;
}
.${c} .r:hover { background: #1a2540; }
.${c} .h { font-size: 0.62rem; color: #64748b; background: #131c31; }
.${c} .h:hover { background: #131c31; }
.${c} span { display: flex; align-items: center; gap: 0.35rem; }
.${c} em { font-style: normal; font-variant-numeric: tabular-nums; color: #64748b; }
.${c} i {
  width: 0;
  height: 0;
  border-left: 5px solid #64748b;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  transform: rotate(90deg);
}
.${c} .g span { color: #f1f5f9; font-weight: 500; }
.${c} .d1 span { padding-left: 0.9rem; }
.${c} .d2 span { padding-left: 1.9rem; color: #94a3b8; }
.${c} .d2 { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.66rem; }`
    add(mk({
      name: 'Tree Table',
      category: 'Tables & Data Grids',
      description: 'File-tree table with disclosure arrows and two levels of indentation, sizes right-aligned in tabular figures.',
      html, css,
      tags: ['tree', 'hierarchy', 'files', 'indent', 'disclosure'],
    }))
  }

  /* TB3. Diff table — added, removed and unchanged rows */
  {
    const c = cls('v13-tb-diff')
    const html = `<div class="${c}"><div class="r add"><b>+</b><span>plan</span><em>pro</em></div><div class="r rem"><b>−</b><span>seats</span><em>3</em></div><div class="r add"><b>+</b><span>seats</span><em>5</em></div><div class="r"><b> </b><span>region</span><em>eu-west-2</em></div><div class="r rem"><b>−</b><span>trial_ends</span><em>2026-09-01</em></div></div>`
    const css = `.${c} {
  width: 230px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.69rem;
  background: #0d1220;
  border: 1px solid #253049;
  border-radius: 0.5rem;
  overflow: hidden;
}
.${c} .r {
  display: grid;
  grid-template-columns: 16px 1fr auto;
  align-items: center;
  gap: 0.4rem;
  padding: 0.26rem 0.5rem;
  color: #94a3b8;
  border-left: 2px solid transparent;
}
.${c} b { text-align: center; font-weight: 700; }
.${c} em { font-style: normal; color: #cbd5e1; }
.${c} .add { background: rgba(52,211,153,0.10); border-left-color: #34d399; color: #6ee7b7; }
.${c} .add em { color: #a7f3d0; }
.${c} .rem { background: rgba(248,113,113,0.10); border-left-color: #f87171; color: #fca5a5; }
.${c} .rem em { color: #fecdd3; text-decoration: line-through; }
.${c} .r:hover { filter: brightness(1.25); }`
    add(mk({
      name: 'Diff Table',
      category: 'Tables & Data Grids',
      description: 'Change log rendered as a diff, added rows tinted green with a plus and removed rows struck through in red.',
      html, css,
      tags: ['diff', 'changes', 'added', 'removed', 'audit'],
    }))
  }

  /* TB4. Filter toolbar table — active filters shown as removable chips */
  {
    const c = cls('v13-tb-filterbar')
    const html = `<div class="${c}"><div class="tb"><span class="s">Search…</span><span class="ch">status: live<i>×</i></span><span class="ch">plan: pro<i>×</i></span><em>2 filters</em></div><div class="r"><span>atlas-web</span><b>live</b></div><div class="r"><span>atlas-api</span><b>live</b></div><div class="r"><span>docs-site</span><b>live</b></div></div>`
    const css = `.${c} {
  width: 244px;
  font-size: 0.71rem;
  color: #cbd5e1;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.55rem;
  overflow: hidden;
}
.${c} .tb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  padding: 0.45rem 0.5rem;
  background: #131c31;
  border-bottom: 1px solid #253049;
}
.${c} .s {
  flex: 1;
  min-width: 62px;
  padding: 0.2rem 0.45rem;
  font-size: 0.66rem;
  color: #64748b;
  background: #0d1424;
  border: 1px solid #29344d;
  border-radius: 0.3rem;
}
.${c} .ch {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.14rem 0.4rem;
  font-size: 0.63rem;
  color: #a5b4fc;
  background: rgba(99,102,241,0.16);
  border: 1px solid rgba(99,102,241,0.4);
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.18s ease;
}
.${c} .ch i { font-style: normal; opacity: 0.7; }
.${c} .ch:hover { background: rgba(99,102,241,0.32); }
.${c} .ch:hover i { opacity: 1; }
.${c} .tb em { font-style: normal; font-size: 0.6rem; color: #64748b; }
.${c} .r {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.34rem 0.55rem;
  border-bottom: 1px solid #1a2338;
  transition: background 0.16s ease;
}
.${c} .r:last-child { border-bottom: none; }
.${c} .r:hover { background: #1a2540; }
.${c} .r b {
  font-size: 0.6rem;
  font-weight: 600;
  color: #34d399;
  background: rgba(52,211,153,0.14);
  border-radius: 999px;
  padding: 0.08rem 0.4rem;
}`
    add(mk({
      name: 'Filter Toolbar Table',
      category: 'Tables & Data Grids',
      description: 'Data grid topped by a filter bar where each active constraint sits as a removable chip beside the search box.',
      html, css,
      tags: ['filters', 'chips', 'toolbar', 'search', 'grid'],
    }))
  }

  /* TB5. Paged table — a pagination footer under the rows */
  {
    const c = cls('v13-tb-paged')
    const html = `<div class="${c}"><div class="r"><span>INV-2041</span><em>$318.00</em></div><div class="r"><span>INV-2040</span><em>$96.00</em></div><div class="r"><span>INV-2039</span><em>$1,204.00</em></div><div class="ft"><span>21–30 of 148</span><div class="pg"><a>‹</a><a class="on">3</a><a>4</a><a>5</a><a>›</a></div></div></div>`
    const css = `.${c} {
  width: 240px;
  font-size: 0.71rem;
  color: #cbd5e1;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.55rem;
  overflow: hidden;
}
.${c} .r {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.36rem 0.6rem;
  border-bottom: 1px solid #1a2338;
  transition: background 0.16s ease;
}
.${c} .r:hover { background: #1a2540; }
.${c} em { font-style: normal; font-variant-numeric: tabular-nums; color: #e2e8f0; }
.${c} .ft {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.5rem;
  background: #131c31;
  font-size: 0.63rem;
  color: #64748b;
}
.${c} .pg { display: flex; gap: 2px; }
.${c} .pg a {
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  border-radius: 0.28rem;
  color: #94a3b8;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} .pg a:hover { background: #1e293b; color: #e2e8f0; }
.${c} .pg .on { background: #4f46e5; color: #fff; }`
    add(mk({
      name: 'Paged Table',
      category: 'Tables & Data Grids',
      description: 'Invoice rows closed off by a footer that states the visible range and offers numbered pagination with the current page filled.',
      html, css,
      tags: ['pagination', 'footer', 'range', 'invoices', 'table'],
    }))
  }

  /* TB6. Schedule grid — resources down, hours across, blocks placed */
  {
    const c = cls('v13-tb-schedule')
    const html = `<div class="${c}"><div class="hd"><span></span><b>9</b><b>10</b><b>11</b><b>12</b><b>1</b></div><div class="rw"><span>Studio A</span><div class="tr"><i class="p1" style="--s:0;--w:2"></i><i class="p2" style="--s:3;--w:2"></i></div></div><div class="rw"><span>Studio B</span><div class="tr"><i class="p3" style="--s:1;--w:3"></i></div></div><div class="rw"><span>Booth</span><div class="tr"><i class="p2" style="--s:0;--w:1"></i><i class="p1" style="--s:2;--w:2"></i></div></div></div>`
    const css = `.${c} {
  width: 240px;
  display: grid;
  gap: 3px;
  font-size: 0.62rem;
  color: #94a3b8;
  padding: 0.5rem;
  background: #0f1626;
  border: 1px solid #253049;
  border-radius: 0.55rem;
}
.${c} .hd, .${c} .rw { display: grid; grid-template-columns: 48px 1fr; align-items: center; gap: 0.4rem; }
.${c} .hd { display: grid; grid-template-columns: 48px repeat(5, 1fr); }
.${c} .hd b { text-align: center; font-weight: 500; color: #64748b; }
.${c} .tr {
  position: relative;
  height: 20px;
  border-radius: 3px;
  background: repeating-linear-gradient(90deg, rgba(148,163,184,0.1) 0 1px, transparent 1px 20%);
}
.${c} i {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: calc(var(--s) * 20%);
  width: calc(var(--w) * 20% - 2px);
  border-radius: 3px;
  transition: filter 0.2s ease, transform 0.2s ease;
}
.${c} .p1 { background: linear-gradient(90deg, #38bdf8, #0ea5e9); }
.${c} .p2 { background: linear-gradient(90deg, #a78bfa, #7c3aed); }
.${c} .p3 { background: linear-gradient(90deg, #34d399, #059669); }
.${c} i:hover { filter: brightness(1.2); transform: scaleY(1.15); }`
    add(mk({
      name: 'Schedule Grid',
      category: 'Tables & Data Grids',
      description: 'Booking grid with resources down the side and hours across the top, each reservation drawn as a block spanning its slots.',
      html, css,
      tags: ['schedule', 'booking', 'timeline-grid', 'resources', 'slots'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Forms & Validation                                                  */
  /* ------------------------------------------------------------------ */

  /* FM1. Address autocomplete — suggestions dropping under the field */
  {
    const c = cls('v13-fm-address')
    const html = `<div class="${c}"><label>Address</label><input type="text" value="12 Rue de" /><ul><li><b>12 Rue de Rivoli</b><small>75001 Paris, FR</small></li><li><b>12 Rue de la Paix</b><small>75002 Paris, FR</small></li></ul></div>`
    const css = `.${c} {
  position: relative;
  width: 236px;
  /* The list is absolute; this reserves its height so the field group still
     measures as tall as it looks. */
  padding-bottom: 90px;
}
.${c} label { display: block; margin-bottom: 0.25rem; font-size: 0.65rem; color: #64748b; }
.${c} input {
  width: 100%;
  padding: 0.45rem 0.6rem;
  font: inherit;
  font-size: 0.78rem;
  color: #e2e8f0;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.45rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c} input:focus { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.15); }
.${c} ul {
  position: absolute;
  left: 0;
  right: 0;
  /* Anchored under the input rather than under the root, because the root
     carries the reserved padding the list sits in. */
  top: 66px;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  background: #111a2b;
  border: 1px solid #29344d;
  border-radius: 0.45rem;
  box-shadow: 0 16px 32px rgba(0,0,0,0.5);
  z-index: 2;
}
.${c} li {
  padding: 0.3rem 0.45rem;
  border-radius: 0.3rem;
  cursor: pointer;
  transition: background 0.15s ease;
}
.${c} li:hover { background: #1c2740; }
.${c} b { display: block; font-size: 0.74rem; font-weight: 500; color: #e2e8f0; }
.${c} small { font-size: 0.62rem; color: #64748b; }`
    add(mk({
      name: 'Address Autocomplete',
      category: 'Forms & Validation',
      description: 'Address field with a suggestion list hanging below it, each row giving the street on one line and the locality on the next.',
      html, css,
      tags: ['autocomplete', 'address', 'suggestions', 'dropdown', 'lookup'],
    }))
  }

  /* FM2. Multi-step form — a progress head over the current fieldset */
  {
    const c = cls('v13-fm-multistep')
    const html = `<form class="${c}"><div class="st"><i class="on"></i><i class="on"></i><i></i></div><b>Step 2 of 3 · Billing</b><div class="two"><label><span>Expiry</span><input type="text" value="09 / 28" /></label><label><span>CVC</span><input type="text" value="•••" /></label></div><div class="r"><em>Back</em><button>Continue</button></div></form>`
    const css = `.${c} {
  width: 236px;
  padding: 0.7rem 0.8rem 0.75rem;
  background: #111a2b;
  border: 1px solid #253049;
  border-radius: 0.6rem;
  color: #cbd5e1;
}
.${c} .st { display: flex; gap: 4px; margin-bottom: 0.5rem; }
.${c} .st i { flex: 1; height: 3px; border-radius: 2px; background: #29344d; }
.${c} .st .on { background: linear-gradient(90deg, #22d3ee, #6366f1); }
.${c} > b { display: block; font-size: 0.68rem; color: #64748b; margin-bottom: 0.55rem; }
.${c} label { display: block; margin-bottom: 0.45rem; }
.${c} span { display: block; margin-bottom: 0.2rem; font-size: 0.62rem; color: #64748b; }
.${c} input {
  width: 100%;
  padding: 0.35rem 0.5rem;
  font: inherit;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  color: #e2e8f0;
  background: #0d1424;
  border: 1px solid #29344d;
  border-radius: 0.35rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c} input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.16); }
.${c} .two { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.${c} .r { display: flex; align-items: center; justify-content: space-between; margin-top: 0.6rem; }
.${c} em { font-style: normal; font-size: 0.72rem; color: #64748b; cursor: pointer; }
.${c} em:hover { color: #cbd5e1; }
.${c} button {
  padding: 0.36rem 0.85rem;
  font: inherit;
  font-size: 0.73rem;
  font-weight: 600;
  color: #fff;
  background: #4f46e5;
  border: none;
  border-radius: 0.38rem;
  cursor: pointer;
  transition: background 0.2s ease;
}
.${c} button:hover { background: #6366f1; }`
    add(mk({
      name: 'Multi-Step Form',
      category: 'Forms & Validation',
      description: 'Checkout step with a three-segment progress head, a paired expiry and CVC row, and back and continue actions.',
      html, css,
      tags: ['multi-step', 'wizard', 'progress', 'billing', 'fieldset'],
    }))
  }

  /* FM3. NPS scale — an eleven-point rating strip */
  {
    const c = cls('v13-fm-nps')
    const html = `<div class="${c}"><b>How likely are you to recommend us?</b><div class="sc"><label><input type="radio" name="${c}" /><span>0</span></label><label><input type="radio" name="${c}" /><span>1</span></label><label><input type="radio" name="${c}" /><span>2</span></label><label><input type="radio" name="${c}" /><span>3</span></label><label><input type="radio" name="${c}" /><span>4</span></label><label><input type="radio" name="${c}" /><span>5</span></label><label><input type="radio" name="${c}" /><span>6</span></label><label><input type="radio" name="${c}" /><span>7</span></label><label><input type="radio" name="${c}" /><span>8</span></label><label><input type="radio" name="${c}" checked /><span>9</span></label><label><input type="radio" name="${c}" /><span>10</span></label></div><div class="lg"><em>Not at all</em><em>Very likely</em></div></div>`
    const css = `.${c} {
  width: 244px;
  color: #cbd5e1;
}
.${c} b { display: block; font-size: 0.72rem; font-weight: 500; margin-bottom: 0.5rem; }
.${c} .sc { display: flex; gap: 2px; }
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} label { flex: 1; cursor: pointer; }
.${c} span {
  display: grid;
  place-items: center;
  height: 26px;
  font-size: 0.63rem;
  color: #94a3b8;
  background: #16203a;
  border: 1px solid #29344d;
  border-radius: 0.25rem;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}
.${c} label:nth-child(-n+7) span:hover { background: rgba(248,113,113,0.25); color: #fecaca; }
.${c} label:nth-child(n+8) span:hover { background: rgba(52,211,153,0.25); color: #bbf7d0; }
.${c} input:checked + span {
  color: #052e16;
  background: #34d399;
  border-color: #34d399;
  transform: translateY(-3px);
}
.${c} .lg { display: flex; justify-content: space-between; margin-top: 0.35rem; }
.${c} em { font-style: normal; font-size: 0.6rem; color: #64748b; }`
    add(mk({
      name: 'NPS Scale',
      category: 'Forms & Validation',
      description: 'Eleven-point recommendation scale where detractor and promoter halves preview in different colours and the choice lifts out of the row.',
      html, css,
      tags: ['nps', 'rating', 'scale', 'survey', 'radio'],
    }))
  }

  /* FM4. Time picker — hour, minute and meridiem segments */
  {
    const c = cls('v13-fm-timepicker')
    const html = `<div class="${c}"><label>Start time</label><div class="f"><input class="sg" value="09" /><i>:</i><input class="sg" value="30" /><div class="mr"><label><input type="radio" name="${c}" checked /><span>AM</span></label><label><input type="radio" name="${c}" /><span>PM</span></label></div></div></div>`
    const css = `.${c} {
  width: 210px;
  color: #cbd5e1;
}
.${c} > label { display: block; margin-bottom: 0.25rem; font-size: 0.65rem; color: #64748b; }
.${c} .f {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.45rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c} .sg {
  width: 34px;
  padding: 0.2rem 0;
  font: inherit;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.95rem;
  text-align: center;
  color: #f1f5f9;
  background: transparent;
  border: none;
  border-radius: 0.3rem;
  outline: none;
  transition: background 0.18s ease;
}
.${c} .sg:focus { background: rgba(56,189,248,0.18); }
.${c} .f i { font-style: normal; font-size: 0.95rem; color: #64748b; }
.${c} .mr { display: flex; margin-left: auto; gap: 2px; padding: 2px; background: #16203a; border-radius: 0.35rem; }
.${c} .mr input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} .mr label { cursor: pointer; }
.${c} .mr span {
  display: block;
  padding: 0.16rem 0.4rem;
  font-size: 0.62rem;
  font-weight: 600;
  color: #64748b;
  border-radius: 0.28rem;
  transition: background 0.18s ease, color 0.18s ease;
}
.${c} .mr input:checked + span { background: #38bdf8; color: #082f49; }
.${c} .f:focus-within { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.15); }`
    add(mk({
      name: 'Time Picker Field',
      category: 'Forms & Validation',
      description: 'Segmented time field with separate hour and minute boxes that tint on focus and an AM/PM switch pinned to the right.',
      html, css,
      tags: ['time', 'segments', 'picker', 'meridiem', 'field'],
    }))
  }

  /* FM5. Upload list — per-file progress rows under a drop target */
  {
    const c = cls('v13-fm-uploadlist')
    const html = `<div class="${c}"><div class="dz">Drop files or <u>browse</u></div><div class="f done"><i></i><div><b>brief.pdf</b><span class="ba"><em style="--w:100%"></em></span></div><s>✓</s></div><div class="f"><i></i><div><b>hero-shot.png</b><span class="ba"><em style="--w:62%"></em></span></div><s>62%</s></div><div class="f err"><i></i><div><b>raw-clip.mov</b><span class="ba"><em style="--w:28%"></em></span></div><s>!</s></div></div>`
    const css = `.${c} {
  width: 244px;
  display: grid;
  gap: 0.35rem;
  color: #cbd5e1;
}
.${c} .dz {
  padding: 0.6rem;
  text-align: center;
  font-size: 0.72rem;
  color: #64748b;
  background: #0f172a;
  border: 1px dashed #334155;
  border-radius: 0.5rem;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}
.${c} .dz u { color: #7dd3fc; }
.${c} .dz:hover { border-color: #38bdf8; color: #cbd5e1; background: #101d2f; }
.${c} .f {
  display: grid;
  grid-template-columns: 22px 1fr auto;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.45rem;
  background: #131c31;
  border: 1px solid #253049;
  border-radius: 0.4rem;
}
.${c} .f i {
  width: 16px;
  height: 20px;
  background: #334155;
  clip-path: polygon(0 0, 68% 0, 100% 28%, 100% 100%, 0 100%);
}
.${c} b { display: block; font-size: 0.68rem; font-weight: 500; }
.${c} .ba {
  display: block;
  height: 3px;
  margin-top: 3px;
  border-radius: 2px;
  background: rgba(148,163,184,0.2);
  overflow: hidden;
}
.${c} .ba em { display: block; height: 100%; width: var(--w); background: #38bdf8; border-radius: 2px; }
.${c} s { font-size: 0.62rem; text-decoration: none; color: #64748b; }
.${c} .done i { background: #34d399; }
.${c} .done .ba em { background: #34d399; }
.${c} .done s { color: #34d399; }
.${c} .err i { background: #f87171; }
.${c} .err .ba em { background: #f87171; }
.${c} .err s {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  font-weight: 700;
  color: #450a0a;
  background: #f87171;
  border-radius: 50%;
}`
    add(mk({
      name: 'Upload List',
      category: 'Forms & Validation',
      description: 'Drop target followed by one row per file, each carrying its own progress bar and a done, percentage or failure marker.',
      html, css,
      tags: ['upload', 'progress', 'files', 'dropzone', 'status'],
    }))
  }

  /* FM6. Conditional fieldset — extra fields unroll when the box is ticked */
  {
    const c = cls('v13-fm-conditional')
    const html = `<div class="${c}"><label class="tg"><input type="checkbox" checked /><span class="bx"></span><span>Ship to a different address</span></label><div class="ex"><label><span>Recipient</span><input value="Mira Tanaka" /></label><label><span>Postcode</span><input value="EC1V 9BX" /></label></div></div>`
    const css = `.${c} {
  width: 236px;
  padding: 0.7rem 0.75rem;
  background: #111a2b;
  border: 1px solid #253049;
  border-radius: 0.55rem;
  color: #cbd5e1;
}
.${c} .tg { display: flex; align-items: center; gap: 0.5rem; font-size: 0.74rem; cursor: pointer; }
.${c} .tg input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} .bx {
  position: relative;
  flex: none;
  width: 17px;
  height: 17px;
  border: 2px solid #475569;
  border-radius: 0.28rem;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.${c} .bx::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 0px;
  width: 4px;
  height: 8px;
  border: solid #0b1020;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) scale(0);
  transition: transform 0.2s cubic-bezier(0.34, 1.6, 0.64, 1);
}
.${c} input:checked + .bx { background: #38bdf8; border-color: #38bdf8; }
.${c} input:checked + .bx::after { transform: rotate(45deg) scale(1); }
.${c} .ex {
  display: grid;
  gap: 0.4rem;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.35s ease, opacity 0.25s ease, margin-top 0.35s ease;
}
.${c}:has(.tg input:checked) .ex { max-height: 130px; opacity: 1; margin-top: 0.6rem; }
.${c} .ex label { display: block; }
.${c} .ex span { display: block; margin-bottom: 0.15rem; font-size: 0.61rem; color: #64748b; }
.${c} .ex input {
  width: 100%;
  padding: 0.32rem 0.5rem;
  font: inherit;
  font-size: 0.73rem;
  color: #e2e8f0;
  background: #0d1424;
  border: 1px solid #29344d;
  border-radius: 0.35rem;
  outline: none;
  transition: border-color 0.2s ease;
}
.${c} .ex input:focus { border-color: #38bdf8; }`
    add(mk({
      name: 'Conditional Fieldset',
      category: 'Forms & Validation',
      description: 'Checkbox that unrolls a hidden group of fields beneath it, the extra inputs staying out of the layout until they are needed.',
      html, css,
      tags: ['conditional', 'reveal', 'checkbox', 'fieldset', 'progressive'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Sliders & Carousels                                                 */
  /* ------------------------------------------------------------------ */

  /* SL1. Peek carousel — the next slide showing at the edge */
  {
    const c = cls('v13-sl-peek')
    const html = `<div class="${c}"><i class="pv"></i><i class="cu"><b>Featured</b></i><i class="nx"></i><a class="l">‹</a><a class="r">›</a></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 250px;
  height: 112px;
  padding: 0 8px;
  overflow: hidden;
}
.${c} i {
  display: block;
  height: 88px;
  border-radius: 0.55rem;
  transition: transform 0.35s ease, filter 0.35s ease;
}
.${c} .pv, .${c} .nx {
  flex: none;
  width: 34px;
  filter: brightness(0.55) saturate(0.6);
}
.${c} .pv { background: linear-gradient(140deg, #f472b6, #9d174d); }
.${c} .nx { background: linear-gradient(140deg, #34d399, #065f46); }
.${c} .cu {
  position: relative;
  flex: 1;
  display: grid;
  align-items: end;
  padding: 0.5rem;
  background: linear-gradient(140deg, #38bdf8, #1e3a8a);
  box-shadow: 0 10px 24px rgba(0,0,0,0.45);
}
.${c} b { font-size: 0.72rem; color: #e0f2fe; }
.${c} a {
  position: absolute;
  top: 50%;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  margin-top: -11px;
  font-size: 0.85rem;
  color: #0b1020;
  background: rgba(226,232,240,0.9);
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.${c} .l { left: 4px; transform: translateX(-4px); }
.${c} .r { right: 4px; transform: translateX(4px); }
.${c}:hover a { opacity: 1; transform: translateX(0); }
.${c}:hover .pv { transform: translateX(-4px); }
.${c}:hover .nx { transform: translateX(4px); }`
    add(mk({
      name: 'Peek Carousel',
      category: 'Sliders & Carousels',
      description: 'Carousel that leaves a dimmed sliver of the neighbouring slides on show, with arrow controls fading in on hover.',
      html, css,
      tags: ['carousel', 'peek', 'neighbours', 'arrows', 'slides'],
    }))
  }

  /* SL2. Temperature slider — a track that warms toward the top */
  {
    const c = cls('v13-sl-temp')
    const html = `<div class="${c}"><b>21°</b><input type="range" min="0" max="100" value="62" /><div class="lg"><span>16°</span><span>28°</span></div></div>`
    const css = `.${c} {
  width: 230px;
  color: #cbd5e1;
}
.${c} b { display: block; margin-bottom: 0.4rem; font-size: 1.3rem; color: #fdba74; }
.${c} input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, #38bdf8, #a78bfa 40%, #fb923c 72%, #ef4444);
  outline: none;
  cursor: pointer;
}
.${c} input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f8fafc;
  border: 3px solid #fb923c;
  box-shadow: 0 3px 10px rgba(0,0,0,0.5);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.${c} input::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f8fafc;
  border: 3px solid #fb923c;
  box-shadow: 0 3px 10px rgba(0,0,0,0.5);
}
.${c} input:hover::-webkit-slider-thumb { transform: scale(1.12); box-shadow: 0 0 0 8px rgba(251,146,60,0.18); }
.${c} .lg { display: flex; justify-content: space-between; margin-top: 0.3rem; font-size: 0.62rem; color: #64748b; }`
    add(mk({
      name: 'Temperature Slider',
      category: 'Sliders & Carousels',
      description: 'Thermostat slider whose track runs cool to hot across its length, the thumb picking up a warm halo as it is grabbed.',
      html, css,
      tags: ['slider', 'temperature', 'range', 'gradient-track', 'thermostat'],
    }))
  }

  /* SL3. Dual row marquee — two belts scrolling opposite ways */
  {
    const c = cls('v13-sl-dualmarquee')
    const html = `<div class="${c}"><div class="rw a"><span>Buttons</span><span>Loaders</span><span>Cards</span><span>Text</span><span>Buttons</span><span>Loaders</span><span>Cards</span><span>Text</span></div><div class="rw b"><span>Neon</span><span>Glass</span><span>3D</span><span>Masks</span><span>Neon</span><span>Glass</span><span>3D</span><span>Masks</span></div></div>`
    const css = `.${c} {
  display: grid;
  gap: 8px;
  width: 244px;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
}
.${c} .rw { display: flex; gap: 8px; width: max-content; }
.${c} span {
  flex: none;
  padding: 0.3rem 0.7rem;
  font-size: 0.72rem;
  white-space: nowrap;
  color: #cbd5e1;
  background: #16203a;
  border: 1px solid #29344d;
  border-radius: 999px;
}
.${c} .a { animation: ${c}-left 14s linear infinite; }
.${c} .b { animation: ${c}-right 16s linear infinite; }
.${c} .b span { color: #a5b4fc; border-color: rgba(99,102,241,0.4); }
@keyframes ${c}-left  { from { transform: translateX(0); }    to { transform: translateX(-50%); } }
@keyframes ${c}-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }`
    add(mk({
      name: 'Dual Row Marquee',
      category: 'Sliders & Carousels',
      description: 'Two pill belts scrolling in opposite directions at different speeds, both faded out at the edges by a gradient mask.',
      html, css,
      tags: ['marquee', 'ticker', 'opposite', 'pills', 'mask-fade'],
    }))
  }

  /* SL4. Counter carousel — a numbered slide counter and fill bar */
  {
    const c = cls('v13-sl-counter')
    const html = `<div class="${c}"><div class="st"><b>03</b><em>/ 06</em></div><div class="pn"></div><div class="ft"><span class="ba"><i></i></span><div class="ar"><a>‹</a><a>›</a></div></div></div>`
    const css = `.${c} {
  width: 236px;
}
.${c} .pn {
  height: 96px;
  border-radius: 0.55rem;
  background:
    radial-gradient(70% 90% at 20% 10%, rgba(244,114,182,0.7), transparent 60%),
    linear-gradient(150deg, #312e81, #0f172a);
  box-shadow: inset 0 0 0 1px rgba(148,163,184,0.15);
}
.${c} .st { display: flex; align-items: baseline; gap: 0.25rem; margin-bottom: 0.45rem; }
.${c} b { font-size: 1.4rem; font-weight: 700; color: #f1f5f9; font-variant-numeric: tabular-nums; }
.${c} em { font-style: normal; font-size: 0.72rem; color: #64748b; }
.${c} .ft { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.5rem; }
.${c} .ba { flex: 1; height: 2px; background: rgba(148,163,184,0.25); border-radius: 2px; overflow: hidden; }
.${c} .ba i { display: block; width: 50%; height: 100%; background: #f472b6; border-radius: 2px; }
.${c} .ar { display: flex; gap: 3px; }
.${c} .ar a {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  font-size: 0.85rem;
  color: #94a3b8;
  border: 1px solid #29344d;
  border-radius: 0.3rem;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.${c} .ar a:hover { background: #f472b6; color: #4a044e; border-color: #f472b6; }`
    add(mk({
      name: 'Counter Carousel',
      category: 'Sliders & Carousels',
      description: 'Slide panel headed by a large position counter, with a thin fill bar and paired arrows sharing the footer.',
      html, css,
      tags: ['carousel', 'counter', 'position', 'arrows', 'progress'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Icons & Shapes                                                      */
  /* ------------------------------------------------------------------ */

  /* IC1. Download tray — the arrow drops into the tray on hover */
  {
    const c = cls('v13-ic-download')
    const html = `<div class="${c}"><i class="ar"></i><i class="tr"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 54px;
  height: 54px;
  cursor: pointer;
}
.${c} .ar {
  position: absolute;
  left: 50%;
  top: 6px;
  width: 4px;
  height: 22px;
  margin-left: -2px;
  border-radius: 2px;
  background: #38bdf8;
  transition: transform 0.35s cubic-bezier(0.5, 0, 0.5, 1);
}
.${c} .ar::after {
  content: '';
  position: absolute;
  left: -6px;
  bottom: -3px;
  width: 16px;
  height: 16px;
  border-right: 4px solid #38bdf8;
  border-bottom: 4px solid #38bdf8;
  border-radius: 0 0 3px 0;
  transform: rotate(45deg);
  transform-origin: center;
}
.${c} .tr {
  position: absolute;
  left: 6px;
  right: 6px;
  bottom: 6px;
  height: 16px;
  border: 3px solid #64748b;
  border-top: none;
  border-radius: 0 0 5px 5px;
  transition: border-color 0.3s ease;
}
.${c}:hover .ar { transform: translateY(10px); }
.${c}:hover .tr { border-color: #38bdf8; }`
    add(mk({
      name: 'Download Tray Icon',
      category: 'Icons & Shapes',
      description: 'Download glyph whose arrow drops into the tray on hover while the tray itself lights up to catch it.',
      html, css,
      tags: ['download', 'arrow', 'tray', 'hover', 'glyph'],
    }))
  }

  /* IC2. Rocket — lifts off with a flame that keeps burning */
  {
    const c = cls('v13-ic-rocket')
    const html = `<div class="${c}"><i class="bd"><b class="fin l"></b><b class="fin r"></b><b class="pt"></b></i><i class="fl"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 56px;
  height: 76px;
  cursor: pointer;
}
.${c} .bd {
  position: absolute;
  left: 50%;
  top: 4px;
  width: 22px;
  height: 44px;
  margin-left: -11px;
  border-radius: 11px 11px 5px 5px;
  background: linear-gradient(180deg, #f8fafc, #cbd5e1);
  transition: transform 0.45s cubic-bezier(0.5, 0, 0.5, 1);
}
.${c} .pt {
  position: absolute;
  left: 50%;
  top: 11px;
  width: 9px;
  height: 9px;
  margin-left: -4.5px;
  border-radius: 50%;
  background: #0ea5e9;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.4);
}
.${c} .fin {
  position: absolute;
  bottom: -2px;
  width: 10px;
  height: 16px;
  background: #ef4444;
}
.${c} .fin.l { left: -8px; border-radius: 8px 0 0 4px; transform: skewY(22deg); }
.${c} .fin.r { right: -8px; border-radius: 0 8px 4px 0; transform: skewY(-22deg); }
.${c} .fl {
  position: absolute;
  left: 50%;
  top: 46px;
  width: 12px;
  height: 20px;
  margin-left: -6px;
  border-radius: 50% 50% 50% 50% / 30% 30% 70% 70%;
  background: linear-gradient(180deg, #fde047, #f97316 60%, rgba(239,68,68,0));
  transform-origin: top center;
  animation: ${c}-burn 0.35s ease-in-out infinite alternate;
}
@keyframes ${c}-burn {
  from { transform: scaleY(0.8) scaleX(0.9); opacity: 0.85; }
  to   { transform: scaleY(1.2) scaleX(1.05); opacity: 1; }
}
.${c}:hover .bd { transform: translateY(-10px); }`
    add(mk({
      name: 'Rocket Icon',
      category: 'Icons & Shapes',
      description: 'Fin-and-porthole rocket over a flame that flickers continuously, the body lifting clear of the exhaust on hover.',
      html, css,
      tags: ['rocket', 'launch', 'flame', 'flicker', 'hover'],
    }))
  }

  /* IC3. Coffee steam — a mug with three rising wisps */
  {
    const c = cls('v13-ic-coffee')
    const html = `<div class="${c}"><i class="s1"></i><i class="s2"></i><i class="s3"></i><b class="mug"></b></div>`
    const css = `.${c} {
  position: relative;
  width: 62px;
  height: 76px;
}
.${c} .mug {
  position: absolute;
  left: 8px;
  bottom: 4px;
  width: 34px;
  height: 30px;
  border: 3px solid #e2e8f0;
  border-radius: 3px 3px 9px 9px;
  background: linear-gradient(180deg, #78350f 0 6px, #451a03 6px 100%);
}
.${c} .mug::after {
  content: '';
  position: absolute;
  right: -16px;
  top: 4px;
  width: 14px;
  height: 15px;
  border: 3px solid #e2e8f0;
  border-left: none;
  border-radius: 0 9px 9px 0;
}
.${c} i {
  position: absolute;
  bottom: 36px;
  width: 4px;
  height: 20px;
  border-radius: 3px;
  background: linear-gradient(180deg, rgba(226,232,240,0), rgba(226,232,240,0.6));
  animation: ${c}-rise 2.6s ease-in-out infinite;
}
.${c} .s1 { left: 15px; animation-delay: 0s; }
.${c} .s2 { left: 23px; animation-delay: 0.5s; height: 26px; }
.${c} .s3 { left: 31px; animation-delay: 1s; }
@keyframes ${c}-rise {
  0%   { opacity: 0; transform: translateY(6px) scaleY(0.6) skewX(0deg); }
  35%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-16px) scaleY(1.1) skewX(-10deg); }
}`
    add(mk({
      name: 'Coffee Steam Icon',
      category: 'Icons & Shapes',
      description: 'Line-drawn mug of coffee with three wisps of steam rising and skewing away on staggered delays.',
      html, css,
      tags: ['coffee', 'mug', 'steam', 'rise', 'icon'],
    }))
  }

  /* IC4. Ticking clock — hands sweeping at real proportions */
  {
    const c = cls('v13-ic-clock')
    const html = `<div class="${c}"><i class="h"></i><i class="m"></i><i class="s"></i><b></b></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  border: 3px solid #e2e8f0;
  background: #0f172a;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: repeating-conic-gradient(from 0deg, #94a3b8 0 2deg, transparent 2deg 30deg);
  -webkit-mask: radial-gradient(circle, transparent 66%, #000 68%);
  mask: radial-gradient(circle, transparent 66%, #000 68%);
}
.${c} i {
  position: absolute;
  bottom: 50%;
  left: 50%;
  border-radius: 2px;
  transform-origin: bottom center;
}
.${c} .h { width: 4px; height: 15px; margin-left: -2px; background: #e2e8f0; animation: ${c}-turn 43200s linear infinite; }
.${c} .m { width: 3px; height: 21px; margin-left: -1.5px; background: #cbd5e1; animation: ${c}-turn 3600s linear infinite; }
.${c} .s { width: 2px; height: 23px; margin-left: -1px; background: #f87171; animation: ${c}-tick 60s steps(60) infinite; }
.${c} b {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f87171;
  z-index: 1;
}
@keyframes ${c}-turn { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes ${c}-tick { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`
    add(mk({
      name: 'Ticking Clock Icon',
      category: 'Icons & Shapes',
      description: 'Analogue clock face with hour ticks and three hands, the red second hand stepping round in sixty discrete jumps.',
      html, css,
      tags: ['clock', 'hands', 'ticking', 'steps', 'analogue'],
    }))
  }
}
