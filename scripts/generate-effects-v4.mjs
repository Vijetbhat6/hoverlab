// scripts/generate-effects-v4.mjs
//
// Fourth wave: seven NEW categories.
//
// The first three waves grew depth inside the twenty-five categories that
// already existed. This one closes coverage gaps — component families that
// people search for by name and that the catalog had no home for at all:
//
//   Tables & Data Grids    Forms & Validation     Scroll & Sticky
//   Sliders & Carousels    Icons & Shapes         Micro-interactions
//   Filters & Blend Modes
//
// Selection rule: a family earns a category when it is (a) a thing people
// type into a search box as a noun ("css range slider", "custom scrollbar
// css"), and (b) not just a restyle of something already covered. That is
// why `Forms & Validation` is separate from `Inputs & Hover` — the latter
// is text fields, this is the controls that are NOT text fields, where all
// the real CSS work (appearance: none, ::-webkit-slider-thumb, :checked
// siblings) lives.
//
// Tokens and helpers come from generate-effects.mjs so every wave shares
// one id sequence and one palette. Everything assumes a DARK preview
// surface. Infinite animations do not need a prefers-reduced-motion block
// here — `withMotionGuard` in src/lib/effects.ts appends one as the
// catalog is assembled.

import { rgbOf, NOISE } from './generate-effects-modern.mjs'

/**
 * A stand-in "photograph" built from gradients.
 *
 * The filter and blend categories are about what you do TO an image, so
 * they need one — but a real asset would break the promise that every
 * snippet is standalone copy-paste. A warm sky over a cool foreground
 * reads as a photo well enough to show what a duotone or a grayscale
 * transition is doing, and it costs zero requests.
 */
const photo = (warm, cool) => `radial-gradient(60% 45% at 72% 22%, #fde68a 0%, transparent 60%),
    radial-gradient(80% 60% at 20% 80%, ${cool} 0%, transparent 65%),
    linear-gradient(170deg, ${warm} 0%, ${cool} 55%, #0b1120 100%)`

export function generateV4(ctx) {
  const { PALETTES, SIZES, GRADPAIRS, TRIOS, NEUTRALS, cls, mk, add } = ctx

  /* ============================================================
   *  TABLES & DATA GRIDS  (~85)
   *
   *  Every template ships `border-collapse: separate` + a radius on the
   *  wrapper rather than on the table, because a radius on <table> is
   *  ignored once cells have their own borders — the single most common
   *  reason a hand-rolled table looks square when the design said round.
   * ========================================================== */

  const TROWS = [
    ['Acme Corp', 'Pro', '$2,400'],
    ['Globex', 'Team', '$960'],
    ['Initech', 'Starter', '$180'],
  ]

  // 1. Zebra-striped table with a gradient header — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`tb-zebra-${g.name}`)
    const body = TROWS.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')
    const html = `<table class="${c}"><thead><tr><th>Account</th><th>Plan</th><th>MRR</th></tr></thead><tbody>${body}</tbody></table>`
    const css = `.${c} {
  border-collapse: separate;
  border-spacing: 0;
  width: 320px;
  font-size: 0.8rem;
  color: #e2e8f0;
  background: #0f172a;
  border-radius: 0.7rem;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
}
.${c} th {
  padding: 0.6rem 0.8rem;
  text-align: left;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #0b1120;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
}
.${c} td {
  padding: 0.55rem 0.8rem;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.${c} tbody tr:nth-child(even) { background: rgba(255,255,255,0.035); }
.${c} tbody tr { transition: background 0.18s ease; }
.${c} tbody tr:hover { background: rgba(${rgbOf(g.a)}, 0.14); }
.${c} td:last-child { text-align: right; font-variant-numeric: tabular-nums; }`
    add(mk({
      name: `${g.name} Zebra Table`,
      category: 'Tables & Data Grids',
      description: `Striped data table with a ${g.name.toLowerCase()} gradient header and a tinted row hover.`,
      html, css,
      tags: ['table', 'zebra', 'striped', 'data', 'gradient header', g.name.toLowerCase()],
    }))
  }

  // 2. Sticky header inside a scrolling body — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`tb-sticky-${g.name}`)
    const rows = [...TROWS, ['Umbrella', 'Pro', '$2,010'], ['Soylent', 'Team', '$780'], ['Stark', 'Enterprise', '$8,400']]
    const body = rows.map((r) => `<tr><td>${r[0]}</td><td>${r[2]}</td></tr>`).join('')
    const html = `<div class="${c}"><table><thead><tr><th>Account</th><th>MRR</th></tr></thead><tbody>${body}</tbody></table></div>`
    const css = `.${c} {
  width: 300px;
  max-height: 160px;
  overflow-y: auto;
  border-radius: 0.7rem;
  border: 1px solid rgba(255,255,255,0.08);
  background: #0f172a;
  scrollbar-width: thin;
  scrollbar-color: ${g.a} transparent;
}
.${c} table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.8rem;
  color: #e2e8f0;
}
.${c} th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 0.55rem 0.8rem;
  text-align: left;
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #94a3b8;
  background: #131c31;
  box-shadow: inset 0 -1px 0 rgba(${rgbOf(g.a)}, 0.5);
}
.${c} td {
  padding: 0.5rem 0.8rem;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.${c} td:last-child { text-align: right; font-variant-numeric: tabular-nums; color: ${g.b}; }
.${c}::-webkit-scrollbar { width: 6px; }
.${c}::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: linear-gradient(${g.a}, ${g.b});
}`
    add(mk({
      name: `${g.name} Sticky Header Table`,
      category: 'Tables & Data Grids',
      description: `Scrollable table whose header stays pinned, with a ${g.name.toLowerCase()} scrollbar thumb.`,
      html, css,
      tags: ['table', 'sticky header', 'scroll', 'data grid', g.name.toLowerCase()],
    }))
  }

  // 3. Row hover with a left accent bar — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`tb-accent-${pal.name}`)
    const body = TROWS.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')
    const html = `<table class="${c}"><tbody>${body}</tbody></table>`
    const css = `.${c} {
  border-collapse: separate;
  border-spacing: 0;
  width: 300px;
  font-size: 0.82rem;
  color: #cbd5e1;
  background: #0f172a;
  border-radius: 0.6rem;
  overflow: hidden;
}
.${c} td {
  padding: 0.62rem 0.85rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  transition: color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}
.${c} tr:last-child td { border-bottom: none; }
.${c} tr:hover td {
  background: rgba(${pal.rgb}, 0.1);
  color: #f8fafc;
}
.${c} tr:hover td:first-child { box-shadow: inset 3px 0 0 ${pal.p}; }
.${c} td:last-child { text-align: right; font-size: 0.72rem; color: ${pal.s}; }`
    add(mk({
      name: `${pal.name} Accent Row Table`,
      category: 'Tables & Data Grids',
      description: `Borderless list table where hovering a row lights a ${pal.name.toLowerCase()} bar down its left edge.`,
      html, css,
      tags: ['table', 'row hover', 'accent', 'list', pal.name.toLowerCase()],
    }))
  }

  // 4. Status pill cells — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`tb-status-${g.name}`)
    const html = `<table class="${c}"><tbody><tr><td>Deploy #4021</td><td><span class="ok">Live</span></td></tr><tr><td>Deploy #4020</td><td><span class="warn">Building</span></td></tr><tr><td>Deploy #4019</td><td><span class="off">Failed</span></td></tr></tbody></table>`
    const css = `.${c} {
  border-collapse: separate;
  border-spacing: 0 0.3rem;
  width: 300px;
  font-size: 0.8rem;
  color: #e2e8f0;
}
.${c} td {
  padding: 0.5rem 0.8rem;
  background: #131c31;
  transition: transform 0.18s ease;
}
.${c} td:first-child { border-radius: 0.5rem 0 0 0.5rem; }
.${c} td:last-child { border-radius: 0 0.5rem 0.5rem 0; text-align: right; }
.${c} tr:hover td { transform: translateX(2px); }
.${c} span {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
}
.${c} .ok {
  color: ${g.a};
  background: rgba(${rgbOf(g.a)}, 0.15);
  box-shadow: inset 0 0 0 1px rgba(${rgbOf(g.a)}, 0.4);
}
.${c} .warn {
  color: ${g.b};
  background: rgba(${rgbOf(g.b)}, 0.15);
  box-shadow: inset 0 0 0 1px rgba(${rgbOf(g.b)}, 0.4);
}
.${c} .off {
  color: #94a3b8;
  background: rgba(148,163,184,0.12);
  box-shadow: inset 0 0 0 1px rgba(148,163,184,0.3);
}`
    add(mk({
      name: `${g.name} Status Cell Table`,
      category: 'Tables & Data Grids',
      description: `Spaced-row table with ${g.name.toLowerCase()} status pills in the trailing cell.`,
      html, css,
      tags: ['table', 'status', 'pill', 'deploy', 'rows', g.name.toLowerCase()],
    }))
  }

  // 5. Sortable header with a caret — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`tb-sort-${g.name}`)
    const body = TROWS.map((r) => `<tr><td>${r[0]}</td><td>${r[2]}</td></tr>`).join('')
    const html = `<table class="${c}"><thead><tr><th class="active">Account</th><th>MRR</th></tr></thead><tbody>${body}</tbody></table>`
    const css = `.${c} {
  border-collapse: separate;
  border-spacing: 0;
  width: 300px;
  font-size: 0.8rem;
  color: #e2e8f0;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 0.65rem;
  overflow: hidden;
}
.${c} th {
  position: relative;
  padding: 0.55rem 1.4rem 0.55rem 0.8rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  background: #131c31;
  cursor: pointer;
  user-select: none;
  transition: color 0.18s ease, background 0.18s ease;
}
.${c} th::after {
  content: '';
  position: absolute;
  right: 0.7rem;
  top: 50%;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 5px solid currentColor;
  opacity: 0.25;
  transform: translateY(-50%);
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.${c} th:hover { color: #e2e8f0; background: #17223c; }
.${c} th:hover::after { opacity: 0.6; }
.${c} th.active { color: ${g.a}; }
.${c} th.active::after { opacity: 1; transform: translateY(-50%) rotate(180deg); }
.${c} td {
  padding: 0.55rem 0.8rem;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.${c} td:last-child { text-align: right; font-variant-numeric: tabular-nums; }`
    add(mk({
      name: `${g.name} Sortable Header Table`,
      category: 'Tables & Data Grids',
      description: `Table headers that read as sortable — hover reveals the caret, the active column tints ${g.name.toLowerCase()}.`,
      html, css,
      tags: ['table', 'sortable', 'header', 'caret', 'data grid', g.name.toLowerCase()],
    }))
  }

  // 6. Airy borderless grid — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`tb-airy-${t.name}`)
    const html = `<table class="${c}"><thead><tr><th>Metric</th><th>Now</th><th>Δ</th></tr></thead><tbody><tr><td>Signups</td><td>1,284</td><td class="up">+12%</td></tr><tr><td>Churn</td><td>2.1%</td><td class="down">−0.4%</td></tr><tr><td>NPS</td><td>62</td><td class="up">+5</td></tr></tbody></table>`
    const css = `.${c} {
  border-collapse: collapse;
  width: 300px;
  font-size: 0.8rem;
  color: #e2e8f0;
}
.${c} th {
  padding: 0 0.6rem 0.5rem;
  text-align: left;
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.${c} td {
  padding: 0.55rem 0.6rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.${c} tbody tr { transition: opacity 0.18s ease; }
.${c}:hover tbody tr { opacity: 0.45; }
.${c} tbody tr:hover { opacity: 1; }
.${c} th:last-child, .${c} td:last-child { text-align: right; }
.${c} td:nth-child(2) { color: #f8fafc; font-variant-numeric: tabular-nums; }
.${c} .up { color: ${t.a}; }
.${c} .down { color: ${t.c}; }`
    add(mk({
      name: `${t.name} Airy Metrics Table`,
      category: 'Tables & Data Grids',
      description: `Borderless metrics table in ${t.name.toLowerCase()} that dims every row except the one under the cursor.`,
      html, css,
      tags: ['table', 'metrics', 'borderless', 'minimal', 'dim', t.name.toLowerCase()],
    }))
  }

  // 7. Dense compact grid — 4 neutrals × 3 sizes = 12
  for (const n of NEUTRALS) {
    for (const sz of SIZES) {
      const c = cls(`tb-dense-${n.name}-${sz.name}`)
      const pad = sz.name === 'SM' ? '0.3rem 0.5rem' : sz.name === 'MD' ? '0.45rem 0.7rem' : '0.6rem 0.9rem'
      const fs = sz.name === 'SM' ? '0.7rem' : sz.name === 'MD' ? '0.78rem' : '0.88rem'
      const html = `<table class="${c}"><thead><tr><th>ID</th><th>Region</th><th>P95</th></tr></thead><tbody><tr><td>a91</td><td>iad1</td><td>142ms</td></tr><tr><td>a92</td><td>fra1</td><td>210ms</td></tr><tr><td>a93</td><td>syd1</td><td>318ms</td></tr></tbody></table>`
      const css = `.${c} {
  border-collapse: collapse;
  width: 280px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: ${fs};
  color: ${n.text};
  background: ${n.surface};
  border: 1px solid ${n.border};
  border-radius: 0.4rem;
  overflow: hidden;
}
.${c} th, .${c} td {
  padding: ${pad};
  text-align: left;
  border-right: 1px solid ${n.border};
  border-bottom: 1px solid ${n.border};
}
.${c} th:last-child, .${c} td:last-child { border-right: none; }
.${c} tr:last-child td { border-bottom: none; }
.${c} th {
  font-weight: 600;
  color: #94a3b8;
  background: ${n.bg};
}
.${c} tbody tr { transition: background 0.12s linear; }
.${c} tbody tr:hover { background: ${n.bg}; }
.${c} td:last-child { text-align: right; }`
      add(mk({
        name: `${n.name} Dense Grid (${sz.name})`,
        category: 'Tables & Data Grids',
        description: `Monospace ${sz.name.toLowerCase()} data grid on a ${n.name.toLowerCase()} surface with full cell rules — for logs and console views.`,
        html, css,
        tags: ['table', 'data grid', 'dense', 'monospace', 'console', n.name.toLowerCase()],
      }))
    }
  }

  /* ============================================================
   *  FORMS & VALIDATION  (~90)
   *
   *  Separate from `Inputs & Hover` on purpose: this is the half of
   *  forms where you have to take the native widget apart with
   *  `appearance: none` and rebuild it from a sibling `:checked`
   *  selector. Different problem, different snippets.
   * ========================================================== */

  // 1. Checkbox with a drawn tick — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`fv-check-${pal.name}`)
    const html = `<label class="${c}"><input type="checkbox" checked><span class="box"></span>Email me product updates</label>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: #e2e8f0;
  cursor: pointer;
  user-select: none;
}
.${c} input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.${c} .box {
  position: relative;
  width: 20px;
  height: 20px;
  flex: none;
  border-radius: 0.35rem;
  background: #0b1120;
  box-shadow: inset 0 0 0 1.5px #334155;
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c} .box::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) scale(0);
  transform-origin: center;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c}:hover .box { box-shadow: inset 0 0 0 1.5px ${pal.s}; }
.${c} input:checked + .box {
  background: ${pal.p};
  box-shadow: inset 0 0 0 1.5px ${pal.p}, 0 0 0 4px rgba(${pal.rgb}, 0.15);
}
.${c} input:checked + .box::after { transform: rotate(45deg) scale(1); }
.${c} input:focus-visible + .box { box-shadow: inset 0 0 0 1.5px ${pal.p}, 0 0 0 4px rgba(${pal.rgb}, 0.35); }`
    add(mk({
      name: `${pal.name} Tick Checkbox`,
      category: 'Forms & Validation',
      description: `Custom checkbox that springs a white tick into a ${pal.name.toLowerCase()} box, with a real focus ring.`,
      html, css,
      tags: ['checkbox', 'form', 'tick', 'accessible', 'focus-visible', pal.name.toLowerCase()],
    }))
  }

  // 2. Radio with a ring fill — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`fv-radio-${pal.name}`)
    const html = `<div class="${c}"><label><input type="radio" name="${c}" checked><span></span>Monthly</label><label><input type="radio" name="${c}"><span></span>Yearly</label></div>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: #e2e8f0;
}
.${c} label {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  cursor: pointer;
  user-select: none;
}
.${c} input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.${c} span {
  position: relative;
  width: 18px;
  height: 18px;
  flex: none;
  border-radius: 50%;
  background: #0b1120;
  box-shadow: inset 0 0 0 1.5px #334155;
  transition: box-shadow 0.2s ease;
}
.${c} span::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: ${pal.p};
  transform: scale(0);
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c} label:hover span { box-shadow: inset 0 0 0 1.5px ${pal.s}; }
.${c} input:checked + span {
  box-shadow: inset 0 0 0 1.5px ${pal.p}, 0 0 0 4px rgba(${pal.rgb}, 0.14);
}
.${c} input:checked + span::after { transform: scale(1); }
.${c} input:focus-visible + span { box-shadow: inset 0 0 0 1.5px ${pal.p}, 0 0 0 4px rgba(${pal.rgb}, 0.35); }`
    add(mk({
      name: `${pal.name} Ring Radio Group`,
      category: 'Forms & Validation',
      description: `Radio group whose selected dot pops into a ${pal.name.toLowerCase()} ring — no JavaScript, pure :checked.`,
      html, css,
      tags: ['radio', 'form', 'radio group', 'checked', pal.name.toLowerCase()],
    }))
  }

  // 3. Select with a chevron — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`fv-select-${g.name}`)
    const html = `<div class="${c}"><select><option>Production</option><option>Preview</option><option>Development</option></select></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
}
.${c} select {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  padding: 0.6rem 2.2rem 0.6rem 0.9rem;
  font-size: 0.88rem;
  font-family: inherit;
  color: #e2e8f0;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.55rem;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c} select:hover { border-color: ${g.a}; }
.${c} select:focus {
  border-color: ${g.a};
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.a)}, 0.25);
}
.${c}::after {
  content: '';
  position: absolute;
  right: 0.95rem;
  top: 50%;
  width: 7px;
  height: 7px;
  border-right: 2px solid ${g.b};
  border-bottom: 2px solid ${g.b};
  transform: translateY(-70%) rotate(45deg);
  pointer-events: none;
  transition: transform 0.2s ease;
}
.${c}:hover::after { transform: translateY(-45%) rotate(45deg); }
.${c} option { background: #0f172a; color: #e2e8f0; }`
    add(mk({
      name: `${g.name} Chevron Select`,
      category: 'Forms & Validation',
      description: `Native select with the OS arrow stripped and a ${g.name.toLowerCase()} chevron that nudges down on hover.`,
      html, css,
      tags: ['select', 'dropdown', 'form', 'appearance none', 'chevron', g.name.toLowerCase()],
    }))
  }

  // 4. File drop zone — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`fv-drop-${g.name}`)
    const html = `<label class="${c}"><input type="file"><i></i><b>Drop your file here</b><span>or click to browse — PNG, SVG up to 5 MB</span></label>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  width: 250px;
  padding: 1.2rem 1rem;
  text-align: center;
  border-radius: 0.8rem;
  border: 1.5px dashed #334155;
  background: #0f172a;
  cursor: pointer;
  transition: border-color 0.22s ease, background 0.22s ease, transform 0.22s ease;
}
.${c} input { display: none; }
.${c} i {
  width: 30px;
  height: 30px;
  margin-bottom: 0.3rem;
  border-radius: 50%;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 4px 14px rgba(${rgbOf(g.a)}, 0.4);
  position: relative;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c} i::before, .${c} i::after {
  content: '';
  position: absolute;
  background: #0b1120;
  border-radius: 1px;
  left: 50%;
  top: 50%;
}
.${c} i::before { width: 2px; height: 12px; transform: translate(-50%, -50%); }
.${c} i::after { width: 12px; height: 2px; transform: translate(-50%, -50%); }
.${c} b { font-size: 0.85rem; color: #e2e8f0; }
.${c} span { font-size: 0.7rem; color: #64748b; }
.${c}:hover {
  border-color: ${g.a};
  background: rgba(${rgbOf(g.a)}, 0.06);
  transform: translateY(-2px);
}
.${c}:hover i { transform: scale(1.12) rotate(90deg); }`
    add(mk({
      name: `${g.name} File Drop Zone`,
      category: 'Forms & Validation',
      description: `Dashed upload target that tints ${g.name.toLowerCase()} and spins its plus badge when you hover it.`,
      html, css,
      tags: ['file upload', 'drop zone', 'dashed', 'form', g.name.toLowerCase()],
    }))
  }

  // 5. OTP / verification code group — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`fv-otp-${g.name}`)
    const html = `<div class="${c}"><input value="4" maxlength="1"><input value="1" maxlength="1"><input value="9" maxlength="1"><input maxlength="1"><input maxlength="1"><input maxlength="1"></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.4rem;
}
.${c} input {
  width: 34px;
  height: 44px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #f8fafc;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  outline: none;
  caret-color: ${g.a};
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}
.${c} input:not(:placeholder-shown) { border-color: rgba(${rgbOf(g.b)}, 0.6); }
.${c} input:hover { border-color: #475569; }
.${c} input:focus {
  border-color: ${g.a};
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.a)}, 0.25);
  transform: translateY(-2px);
}`
    add(mk({
      name: `${g.name} OTP Code Input`,
      category: 'Forms & Validation',
      description: `Six-box verification code field with a ${g.name.toLowerCase()} caret and a lift on the focused digit.`,
      html, css,
      tags: ['otp', 'verification code', '2fa', 'form', 'input group', g.name.toLowerCase()],
    }))
  }

  // 6. Inline validation states — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`fv-valid-${g.name}`)
    const html = `<div class="${c}"><label class="ok"><input value="ada@example.com"><small>Looks good</small></label><label class="bad"><input value="ada@example"><small>Enter a full email address</small></label></div>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 250px;
}
.${c} label {
  position: relative;
  display: block;
}
.${c} input {
  width: 100%;
  padding: 0.55rem 2rem 0.55rem 0.8rem;
  font-size: 0.85rem;
  font-family: inherit;
  color: #e2e8f0;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c} small {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.7rem;
}
.${c} label::after {
  position: absolute;
  right: 0.7rem;
  top: 0.55rem;
  font-size: 0.85rem;
  font-weight: 700;
}
.${c} .ok input { border-color: rgba(${rgbOf(g.a)}, 0.7); }
.${c} .ok input:focus { box-shadow: 0 0 0 3px rgba(${rgbOf(g.a)}, 0.22); }
.${c} .ok small { color: ${g.a}; }
.${c} .ok::after { content: '✓'; color: ${g.a}; }
.${c} .bad input { border-color: #f87171; }
.${c} .bad input:focus { box-shadow: 0 0 0 3px rgba(248,113,113,0.22); }
.${c} .bad small { color: #f87171; }
.${c} .bad::after { content: '!'; color: #f87171; }`
    add(mk({
      name: `${g.name} Validation States`,
      category: 'Forms & Validation',
      description: `Paired valid / invalid fields with inline messages, glyphs and matching focus rings in ${g.name.toLowerCase()}.`,
      html, css,
      tags: ['validation', 'error state', 'success state', 'form', 'inline message', g.name.toLowerCase()],
    }))
  }

  // 7. Password strength meter — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`fv-strength-${t.name}`)
    const html = `<div class="${c}"><input type="password" value="correcthorse"><div class="bars"><i></i><i></i><i></i><i></i></div><small>Strong — add a symbol for excellent</small></div>`
    const css = `.${c} {
  width: 240px;
}
.${c} input {
  width: 100%;
  padding: 0.55rem 0.8rem;
  font-size: 0.9rem;
  font-family: inherit;
  letter-spacing: 0.12em;
  color: #e2e8f0;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  outline: none;
  transition: border-color 0.2s ease;
}
.${c} input:focus { border-color: ${t.b}; }
.${c} .bars {
  display: flex;
  gap: 0.25rem;
  margin: 0.5rem 0 0.35rem;
}
.${c} i {
  height: 4px;
  flex: 1;
  border-radius: 2px;
  background: #1e293b;
  transform-origin: left;
  animation: ${c}-fill 0.45s ease both;
}
.${c} i:nth-child(1) { background: ${t.a}; }
.${c} i:nth-child(2) { background: ${t.b}; animation-delay: 0.1s; }
.${c} i:nth-child(3) { background: ${t.c}; animation-delay: 0.2s; }
.${c} small { font-size: 0.7rem; color: ${t.c}; }
@keyframes ${c}-fill {
  from { transform: scaleX(0); }
}`
    add(mk({
      name: `${t.name} Password Strength`,
      category: 'Forms & Validation',
      description: `Password field with a four-segment ${t.name.toLowerCase()} strength meter that fills left to right.`,
      html, css,
      tags: ['password', 'strength meter', 'form', 'validation', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SCROLL & STICKY  (~88)
   *
   *  Each of these is demonstrable inside the 180px preview because
   *  the scroll container is part of the snippet — you can scroll the
   *  card itself. The scroll-driven ones use `animation-timeline`,
   *  which degrades to a plain time-based run where unsupported, so
   *  the snippet is never broken, only less clever.
   * ========================================================== */

  const FEED = ['Deployed to production', 'Merged PR #482', 'Invited 3 teammates', 'Upgraded to Pro', 'Rotated API keys', 'Added custom domain']

  // 1. Custom scrollbar — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`sc-bar-${g.name}`)
    const items = FEED.map((f) => `<li>${f}</li>`).join('')
    const html = `<ul class="${c}">${items}</ul>`
    const css = `.${c} {
  width: 250px;
  max-height: 150px;
  margin: 0;
  padding: 0.5rem;
  overflow-y: auto;
  list-style: none;
  border-radius: 0.7rem;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.07);
  scrollbar-width: thin;
  scrollbar-color: ${g.a} rgba(255,255,255,0.05);
}
.${c} li {
  padding: 0.5rem 0.6rem;
  font-size: 0.82rem;
  color: #cbd5e1;
  border-radius: 0.4rem;
  transition: background 0.15s ease;
}
.${c} li:hover { background: rgba(255,255,255,0.05); }
.${c}::-webkit-scrollbar { width: 8px; }
.${c}::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.04);
  border-radius: 4px;
}
.${c}::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: linear-gradient(${g.a}, ${g.b});
  border: 2px solid #0f172a;
  background-clip: padding-box;
}
.${c}::-webkit-scrollbar-thumb:hover { background: ${g.b}; background-clip: padding-box; }`
    add(mk({
      name: `${g.name} Custom Scrollbar`,
      category: 'Scroll & Sticky',
      description: `Scrollable list with a slim ${g.name.toLowerCase()} gradient thumb — styled for both WebKit and Firefox.`,
      html, css,
      tags: ['scrollbar', 'custom scrollbar', 'overflow', 'scrollbar-color', g.name.toLowerCase()],
    }))
  }

  // 2. Scroll-snap rail — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`sc-snap-${g.name}`)
    const html = `<div class="${c}"><div>01</div><div>02</div><div>03</div><div>04</div></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.6rem;
  width: 260px;
  padding: 0.5rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding: 0.5rem;
  scrollbar-width: none;
  border-radius: 0.8rem;
  background: #0f172a;
}
.${c}::-webkit-scrollbar { display: none; }
.${c} > div {
  flex: 0 0 120px;
  height: 84px;
  display: grid;
  place-items: center;
  scroll-snap-align: start;
  border-radius: 0.6rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: #0b1120;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 6px 20px rgba(${rgbOf(g.a)}, 0.3);
  transition: transform 0.22s ease;
}
.${c} > div:hover { transform: translateY(-3px); }`
    add(mk({
      name: `${g.name} Snap Rail`,
      category: 'Scroll & Sticky',
      description: `Horizontal ${g.name.toLowerCase()} card rail that snaps each tile to the left edge, scrollbar hidden.`,
      html, css,
      tags: ['scroll snap', 'carousel', 'rail', 'horizontal scroll', g.name.toLowerCase()],
    }))
  }

  // 3. Reading progress bar, scroll-driven — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`sc-prog-${g.name}`)
    const html = `<div class="${c}"><div class="bar"></div><p>Scroll me. The bar above is driven by this box's own scroll position — no scroll listener, no JavaScript at all.</p><p>Where <code>animation-timeline</code> isn't supported the bar simply sits full width.</p></div>`
    const css = `.${c} {
  position: relative;
  width: 260px;
  max-height: 150px;
  overflow-y: auto;
  padding: 0 0.8rem 0.8rem;
  border-radius: 0.7rem;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.07);
  scroll-timeline: --${c}-sc block;
}
.${c} .bar {
  position: sticky;
  top: 0;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  transform-origin: left;
  animation: ${c}-grow linear;
  animation-timeline: --${c}-sc;
}
.${c} p {
  font-size: 0.8rem;
  line-height: 1.6;
  color: #cbd5e1;
}
.${c} code {
  font-size: 0.75rem;
  color: ${g.b};
  background: rgba(${rgbOf(g.b)}, 0.12);
  padding: 0.05rem 0.3rem;
  border-radius: 0.25rem;
}
@keyframes ${c}-grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}`
    add(mk({
      name: `${g.name} Reading Progress`,
      category: 'Scroll & Sticky',
      description: `Sticky ${g.name.toLowerCase()} progress bar driven by scroll-timeline — it tracks the scroll with no listener.`,
      html, css,
      tags: ['scroll progress', 'reading progress', 'scroll-timeline', 'scroll driven', g.name.toLowerCase()],
    }))
  }

  // 4. Sticky section headers — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`sc-stick-${g.name}`)
    const section = (label, rows) =>
      `<h5>${label}</h5>${rows.map((r) => `<p>${r}</p>`).join('')}`
    const html = `<div class="${c}">${section('Today', ['Deployed to production', 'Merged PR #482'])}${section('Yesterday', ['Invited 3 teammates', 'Upgraded to Pro'])}${section('Last week', ['Rotated API keys', 'Added custom domain'])}</div>`
    const css = `.${c} {
  width: 250px;
  max-height: 150px;
  overflow-y: auto;
  border-radius: 0.7rem;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.07);
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}
.${c} h5 {
  position: sticky;
  top: 0;
  margin: 0;
  padding: 0.4rem 0.75rem;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${g.a};
  background: rgba(15,23,42,0.9);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(${rgbOf(g.a)}, 0.25);
}
.${c} p {
  margin: 0;
  padding: 0.55rem 0.75rem;
  font-size: 0.8rem;
  color: #cbd5e1;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}`
    add(mk({
      name: `${g.name} Sticky Section Headers`,
      category: 'Scroll & Sticky',
      description: `Grouped list whose ${g.name.toLowerCase()} date headers stick and blur the rows sliding beneath them.`,
      html, css,
      tags: ['sticky', 'section header', 'grouped list', 'backdrop blur', g.name.toLowerCase()],
    }))
  }

  // 5. Reveal on scroll (view-timeline) — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`sc-reveal-${g.name}`)
    const cards = ['Ship faster', 'Stay in flow', 'Measure what matters', 'Sleep at night']
      .map((t) => `<div>${t}</div>`).join('')
    const html = `<div class="${c}">${cards}</div>`
    const css = `.${c} {
  width: 240px;
  max-height: 150px;
  padding: 0.6rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-radius: 0.7rem;
  background: #0f172a;
  scrollbar-width: none;
}
.${c}::-webkit-scrollbar { display: none; }
.${c} > div {
  padding: 0.7rem 0.8rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #e2e8f0;
  border-radius: 0.55rem;
  background: #131c31;
  box-shadow: inset 0 0 0 1px rgba(${rgbOf(g.a)}, 0.25);
  animation: ${c}-in 0.6s ease both;
  animation-timeline: view();
  animation-range: entry 10% cover 35%;
}
@keyframes ${c}-in {
  from { opacity: 0; transform: translateY(14px) scale(0.96); }
  to   { opacity: 1; transform: none; }
}`
    add(mk({
      name: `${g.name} Scroll Reveal Stack`,
      category: 'Scroll & Sticky',
      description: `Cards that fade and rise as they enter the scrollport, using view() — falls back to a plain fade-in.`,
      html, css,
      tags: ['scroll reveal', 'view-timeline', 'animation-range', 'fade up', g.name.toLowerCase()],
    }))
  }

  // 6. Edge-fade scroll shadows — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`sc-fade-${t.name}`)
    const chips = ['Overview', 'Activity', 'Members', 'Billing', 'Integrations', 'Danger zone']
      .map((s) => `<span>${s}</span>`).join('')
    const html = `<div class="${c}">${chips}</div>`
    const css = `.${c} {
  display: flex;
  gap: 0.45rem;
  width: 250px;
  padding: 0.5rem 0;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-mask: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  mask: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
}
.${c}::-webkit-scrollbar { display: none; }
.${c} span {
  flex: none;
  padding: 0.35rem 0.75rem;
  font-size: 0.78rem;
  white-space: nowrap;
  color: #cbd5e1;
  border-radius: 999px;
  background: #131c31;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.07);
  transition: color 0.18s ease, box-shadow 0.18s ease;
}
.${c} span:hover {
  color: #f8fafc;
  box-shadow: inset 0 0 0 1px ${t.b};
}
.${c} span:first-child {
  color: #0b1120;
  background: linear-gradient(90deg, ${t.a}, ${t.b});
}`
    add(mk({
      name: `${t.name} Edge-Fade Chip Rail`,
      category: 'Scroll & Sticky',
      description: `Overflowing chip row masked to fade at both edges so it reads as scrollable without a scrollbar.`,
      html, css,
      tags: ['scroll shadow', 'mask-image', 'edge fade', 'chips', 'overflow', t.name.toLowerCase()],
    }))
  }

  // 7. Scroll-spy dot rail — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`sc-spy-${g.name}`)
    const html = `<div class="${c}"><nav><a class="on"></a><a></a><a></a><a></a></nav><div class="pane"><p>Intro</p><p>Install</p><p>Usage</p><p>API</p></div></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.8rem;
  align-items: stretch;
  width: 230px;
}
.${c} nav {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  gap: 0.5rem;
  padding: 0.3rem 0;
}
.${c} a {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #334155;
  transition: background 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
  cursor: pointer;
}
.${c} a:hover { background: ${g.b}; transform: scale(1.3); }
.${c} a.on {
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  transform: scale(1.5);
  box-shadow: 0 0 0 4px rgba(${rgbOf(g.a)}, 0.18);
}
.${c} .pane {
  flex: 1;
  max-height: 140px;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  border-radius: 0.6rem;
  background: #0f172a;
}
.${c} .pane::-webkit-scrollbar { display: none; }
.${c} .pane p {
  margin: 0;
  height: 70px;
  display: grid;
  place-items: center;
  scroll-snap-align: start;
  font-size: 0.85rem;
  font-weight: 600;
  color: #e2e8f0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}`
    add(mk({
      name: `${g.name} Scroll-Spy Dots`,
      category: 'Scroll & Sticky',
      description: `Snap-scrolling pane beside a ${g.name.toLowerCase()} dot rail that marks the section you're on.`,
      html, css,
      tags: ['scroll spy', 'dots', 'scroll snap', 'navigation', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SLIDERS & CAROUSELS  (~81)
   *
   *  Range inputs need the thumb styled twice — once for
   *  ::-webkit-slider-thumb and once for ::-moz-range-thumb — and the
   *  two rules cannot be merged into one selector list, because an
   *  unknown pseudo-element invalidates the whole list. Every range
   *  template below repeats itself for exactly that reason.
   * ========================================================== */

  // 1. Range slider — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`sl-range-${pal.name}`)
    const html = `<input type="range" class="${c}" value="62">`
    const css = `.${c} {
  appearance: none;
  -webkit-appearance: none;
  width: 220px;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, ${pal.p} 62%, #1e293b 62%);
  outline: none;
  cursor: pointer;
}
.${c}::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid ${pal.p};
  box-shadow: 0 2px 8px rgba(${pal.rgb}, 0.5);
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c}::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid ${pal.p};
  box-shadow: 0 2px 8px rgba(${pal.rgb}, 0.5);
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c}:hover::-webkit-slider-thumb { transform: scale(1.2); }
.${c}:hover::-moz-range-thumb { transform: scale(1.2); }
.${c}:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 6px rgba(${pal.rgb}, 0.25); }`
    add(mk({
      name: `${pal.name} Range Slider`,
      category: 'Sliders & Carousels',
      description: `Range input with a ${pal.name.toLowerCase()} track fill and a thumb that swells on hover.`,
      html, css,
      tags: ['range slider', 'input range', 'slider thumb', 'form', pal.name.toLowerCase()],
    }))
  }

  // 2. Range with a value bubble — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`sl-bubble-${g.name}`)
    const html = `<div class="${c}"><b>48%</b><input type="range" value="48"></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  padding-top: 1.7rem;
}
.${c} b {
  position: absolute;
  top: 0;
  left: 48%;
  transform: translateX(-50%);
  padding: 0.12rem 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #0b1120;
  border-radius: 0.35rem;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  transition: transform 0.2s ease;
}
.${c} b::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -4px;
  width: 0;
  height: 0;
  transform: translateX(-50%);
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid ${g.b};
}
.${c}:hover b { transform: translateX(-50%) translateY(-2px); }
.${c} input {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, ${g.a} 0%, ${g.b} 48%, #1e293b 48%);
  outline: none;
  cursor: pointer;
}
.${c} input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #0b1120;
  border: 3px solid ${g.b};
  box-shadow: 0 3px 10px rgba(${rgbOf(g.b)}, 0.55);
}
.${c} input::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #0b1120;
  border: 3px solid ${g.b};
  box-shadow: 0 3px 10px rgba(${rgbOf(g.b)}, 0.55);
}`
    add(mk({
      name: `${g.name} Slider With Bubble`,
      category: 'Sliders & Carousels',
      description: `Gradient-filled range with a ${g.name.toLowerCase()} value bubble and pointer sitting above the thumb.`,
      html, css,
      tags: ['range slider', 'tooltip', 'value bubble', 'gradient track', g.name.toLowerCase()],
    }))
  }

  // 3. Before / after comparison — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`sl-compare-${g.name}`)
    const html = `<div class="${c}"><div class="after"></div><div class="before"><i></i></div></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 140px;
  border-radius: 0.7rem;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
}
.${c} .after {
  position: absolute;
  inset: 0;
  background: ${photo('#334155', '#0f172a')};
  filter: grayscale(1);
}
.${c} .before {
  position: relative;
  width: 55%;
  min-width: 24px;
  max-width: 100%;
  height: 100%;
  overflow: hidden;
  resize: horizontal;
  background: ${photo(g.a, g.b)};
}
.${c} .before::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 2px;
  height: 100%;
  background: #fff;
  box-shadow: 0 0 12px rgba(255,255,255,0.6);
}
.${c} i {
  position: absolute;
  top: 50%;
  right: -13px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fff;
  transform: translateY(-50%);
  box-shadow: 0 2px 10px rgba(0,0,0,0.4);
  pointer-events: none;
}
.${c} i::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-left: 2px solid ${g.a};
  border-right: 2px solid ${g.a};
}`
    add(mk({
      name: `${g.name} Before / After Compare`,
      category: 'Sliders & Carousels',
      description: `Drag the corner to wipe between a ${g.name.toLowerCase()} treatment and the grayscale original — CSS resize, no JS.`,
      html, css,
      tags: ['before after', 'comparison slider', 'resize', 'image compare', g.name.toLowerCase()],
    }))
  }

  // 4. Snap carousel with dots — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`sl-carousel-${g.name}`)
    const html = `<div class="${c}"><div class="track"><figure>Slide one</figure><figure>Slide two</figure><figure>Slide three</figure></div><div class="dots"><i class="on"></i><i></i><i></i></div></div>`
    const css = `.${c} {
  width: 240px;
}
.${c} .track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  border-radius: 0.7rem;
  scrollbar-width: none;
}
.${c} .track::-webkit-scrollbar { display: none; }
.${c} figure {
  flex: 0 0 100%;
  height: 110px;
  margin: 0;
  display: grid;
  place-items: center;
  scroll-snap-align: center;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0b1120;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
}
.${c} figure:nth-child(2) { background: linear-gradient(140deg, ${g.b}, ${g.a}); }
.${c} figure:nth-child(3) { background: linear-gradient(220deg, ${g.a}, ${g.b}); }
.${c} .dots {
  display: flex;
  justify-content: center;
  gap: 0.35rem;
  margin-top: 0.55rem;
}
.${c} i {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #334155;
  transition: width 0.25s ease, background 0.25s ease;
}
.${c} i.on { width: 18px; background: ${g.a}; }`
    add(mk({
      name: `${g.name} Snap Carousel`,
      category: 'Sliders & Carousels',
      description: `Full-width ${g.name.toLowerCase()} slide track with center snapping and a stretching active dot.`,
      html, css,
      tags: ['carousel', 'slider', 'scroll snap', 'dots', 'pagination', g.name.toLowerCase()],
    }))
  }

  // 5. Infinite logo marquee — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`sl-marquee-${g.name}`)
    const set = ['ACME', 'GLOBEX', 'INITECH', 'UMBRELLA'].map((s) => `<span>${s}</span>`).join('')
    const html = `<div class="${c}"><div class="track">${set}${set}</div></div>`
    const css = `.${c} {
  width: 250px;
  padding: 0.7rem 0;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #0f172a;
  -webkit-mask: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent);
  mask: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent);
}
.${c} .track {
  display: flex;
  gap: 2rem;
  width: max-content;
  animation: ${c}-slide 12s linear infinite;
}
.${c}:hover .track { animation-play-state: paused; }
.${c} span {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  white-space: nowrap;
}
@keyframes ${c}-slide {
  to { transform: translateX(-50%); }
}`
    add(mk({
      name: `${g.name} Logo Marquee`,
      category: 'Sliders & Carousels',
      description: `Seamless logo ticker in ${g.name.toLowerCase()} gradient type that pauses when you hover it.`,
      html, css,
      tags: ['marquee', 'ticker', 'infinite scroll', 'logos', 'social proof', g.name.toLowerCase()],
    }))
  }

  // 6. Vertical testimonial ticker — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`sl-vticker-${t.name}`)
    const set = ['“Cut our build time in half.”', '“The one tool nobody complains about.”', '“Shipped in an afternoon.”']
      .map((s, i) => `<blockquote style="--i:${i}">${s}</blockquote>`).join('')
    const html = `<div class="${c}"><div class="track">${set}${set}</div></div>`
    const css = `.${c} {
  width: 240px;
  height: 120px;
  overflow: hidden;
  border-radius: 0.7rem;
  background: #0f172a;
  -webkit-mask: linear-gradient(180deg, transparent, #000 20%, #000 80%, transparent);
  mask: linear-gradient(180deg, transparent, #000 20%, #000 80%, transparent);
}
.${c} .track {
  display: flex;
  flex-direction: column;
  animation: ${c}-up 9s linear infinite;
}
.${c}:hover .track { animation-play-state: paused; }
.${c} blockquote {
  margin: 0;
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 0.9rem;
  font-size: 0.82rem;
  font-style: italic;
  color: #cbd5e1;
  border-left: 2px solid ${t.b};
}
.${c} blockquote:nth-child(3n+1) { border-color: ${t.a}; }
.${c} blockquote:nth-child(3n+3) { border-color: ${t.c}; }
@keyframes ${c}-up {
  to { transform: translateY(-50%); }
}`
    add(mk({
      name: `${t.name} Vertical Testimonial Ticker`,
      category: 'Sliders & Carousels',
      description: `Quotes scrolling upward behind a top-and-bottom fade, in ${t.name.toLowerCase()} accent rules.`,
      html, css,
      tags: ['ticker', 'vertical marquee', 'testimonials', 'quotes', t.name.toLowerCase()],
    }))
  }

  // 7. 3D coverflow rail — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`sl-cover-${t.name}`)
    const html = `<div class="${c}"><div class="l"></div><div class="m"></div><div class="r"></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  width: 250px;
  height: 130px;
  perspective: 700px;
}
.${c} > div {
  width: 76px;
  height: 100px;
  border-radius: 0.6rem;
  transition: transform 0.45s cubic-bezier(0.34, 1.2, 0.64, 1), filter 0.45s ease;
  box-shadow: 0 12px 28px rgba(0,0,0,0.45);
}
.${c} .l {
  background: linear-gradient(160deg, ${t.a}, ${t.b});
  transform: rotateY(38deg) translateZ(-30px) scale(0.88);
  filter: brightness(0.6);
}
.${c} .m {
  background: linear-gradient(160deg, ${t.b}, ${t.c});
  transform: translateZ(20px);
  z-index: 1;
}
.${c} .r {
  background: linear-gradient(160deg, ${t.c}, ${t.a});
  transform: rotateY(-38deg) translateZ(-30px) scale(0.88);
  filter: brightness(0.6);
}
.${c}:hover .l { transform: rotateY(24deg) translateZ(-14px) scale(0.94); filter: brightness(0.85); }
.${c}:hover .r { transform: rotateY(-24deg) translateZ(-14px) scale(0.94); filter: brightness(0.85); }
.${c}:hover .m { transform: translateZ(40px) scale(1.04); }`
    add(mk({
      name: `${t.name} Coverflow Rail`,
      category: 'Sliders & Carousels',
      description: `Three ${t.name.toLowerCase()} panels in perspective — the flanks straighten and brighten on hover.`,
      html, css,
      tags: ['coverflow', 'carousel', '3d', 'perspective', 'gallery', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ICONS & SHAPES  (~89)
   *
   *  Two pseudo-elements and a border are enough for most UI glyphs.
   *  Doing it in CSS rather than SVG means the icon inherits color,
   *  scales with font-size, and animates its own parts — which is the
   *  whole reason the hamburger-to-X is a CSS exercise and not an
   *  <img>.
   * ========================================================== */

  // 1. Hamburger → X — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`ic-burger-${g.name}`)
    const html = `<label class="${c}"><input type="checkbox"><i></i></label>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 0.6rem;
  background: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}
.${c}:hover { box-shadow: inset 0 0 0 1px ${g.a}; }
.${c} input { display: none; }
.${c} i, .${c} i::before, .${c} i::after {
  display: block;
  width: 20px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  transition: transform 0.3s cubic-bezier(0.68, -0.4, 0.27, 1.4), opacity 0.2s ease;
}
.${c} i { position: relative; }
.${c} i::before, .${c} i::after {
  content: '';
  position: absolute;
  left: 0;
}
.${c} i::before { top: -6px; }
.${c} i::after { top: 6px; }
.${c} input:checked + i { background: transparent; }
.${c} input:checked + i::before { transform: translateY(6px) rotate(45deg); }
.${c} input:checked + i::after { transform: translateY(-6px) rotate(-45deg); }`
    add(mk({
      name: `${g.name} Hamburger Toggle`,
      category: 'Icons & Shapes',
      description: `Three ${g.name.toLowerCase()} bars that fold into an X on click — one checkbox, no JavaScript.`,
      html, css,
      tags: ['hamburger', 'menu icon', 'toggle', 'checkbox hack', 'nav', g.name.toLowerCase()],
    }))
  }

  // 2. Arrow / chevron set — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`ic-arrow-${pal.name}`)
    const html = `<div class="${c}"><a class="up"></a><a class="right"></a><a class="down"></a><a class="left"></a></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.9rem;
}
.${c} a {
  position: relative;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #0f172a;
  box-shadow: inset 0 0 0 1px #334155;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.${c} a::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  border-top: 2px solid ${pal.p};
  border-right: 2px solid ${pal.p};
  transition: border-color 0.2s ease;
}
.${c} .up::before    { transform: translate(-50%, -30%) rotate(-45deg); }
.${c} .right::before { transform: translate(-70%, -50%) rotate(45deg); }
.${c} .down::before  { transform: translate(-50%, -70%) rotate(135deg); }
.${c} .left::before  { transform: translate(-30%, -50%) rotate(-135deg); }
.${c} a:hover {
  box-shadow: inset 0 0 0 1px ${pal.p}, 0 0 0 4px rgba(${pal.rgb}, 0.15);
  transform: translateY(-2px);
}
.${c} a:hover::before { border-color: ${pal.s}; }`
    add(mk({
      name: `${pal.name} Chevron Buttons`,
      category: 'Icons & Shapes',
      description: `Four directional chevrons drawn from two borders, in ${pal.name.toLowerCase()}, with a lift on hover.`,
      html, css,
      tags: ['arrow', 'chevron', 'icon', 'direction', 'pagination', pal.name.toLowerCase()],
    }))
  }

  // 3. Play / pause / stop — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`ic-play-${g.name}`)
    const html = `<div class="${c}"><a class="play"></a><a class="pause"></a><a class="stop"></a></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.8rem;
}
.${c} a {
  position: relative;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 6px 18px rgba(${rgbOf(g.a)}, 0.35);
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}
.${c} a:hover {
  transform: scale(1.08);
  box-shadow: 0 8px 26px rgba(${rgbOf(g.a)}, 0.55);
}
.${c} .play::before {
  content: '';
  width: 0;
  height: 0;
  margin-left: 3px;
  border-left: 12px solid #0b1120;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
}
.${c} .pause::before {
  content: '';
  width: 11px;
  height: 14px;
  border-left: 3.5px solid #0b1120;
  border-right: 3.5px solid #0b1120;
}
.${c} .stop::before {
  content: '';
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: #0b1120;
}`
    add(mk({
      name: `${g.name} Transport Controls`,
      category: 'Icons & Shapes',
      description: `Play, pause and stop glyphs cut from borders on ${g.name.toLowerCase()} gradient discs.`,
      html, css,
      tags: ['play button', 'pause', 'media controls', 'icon', 'triangle', g.name.toLowerCase()],
    }))
  }

  // 4. Speech bubble with tail — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`ic-bubble-${g.name}`)
    const html = `<div class="${c}">Anyone shipping today?</div>`
    const css = `.${c} {
  position: relative;
  max-width: 200px;
  padding: 0.65rem 0.9rem;
  font-size: 0.85rem;
  line-height: 1.4;
  color: #0b1120;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  border-radius: 0.9rem 0.9rem 0.9rem 0.2rem;
  box-shadow: 0 8px 24px rgba(${rgbOf(g.a)}, 0.3);
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c}::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -9px;
  width: 0;
  height: 0;
  border-top: 10px solid ${g.b};
  border-right: 12px solid transparent;
}
.${c}:hover { transform: translateY(-3px) rotate(-1deg); }`
    add(mk({
      name: `${g.name} Speech Bubble`,
      category: 'Icons & Shapes',
      description: `Chat bubble with a border-drawn tail on a ${g.name.toLowerCase()} gradient fill.`,
      html, css,
      tags: ['speech bubble', 'chat', 'tooltip shape', 'triangle', g.name.toLowerCase()],
    }))
  }

  // 5. Corner ribbon — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`ic-ribbon-${g.name}`)
    const html = `<div class="${c}"><span>NEW</span><h4>Realtime cursors</h4><p>See your teammates as they type.</p></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  padding: 1rem;
  overflow: hidden;
  border-radius: 0.75rem;
  background: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.07);
}
.${c} span {
  position: absolute;
  top: 12px;
  right: -30px;
  width: 110px;
  padding: 0.2rem 0;
  text-align: center;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #0b1120;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  transform: rotate(38deg);
  box-shadow: 0 4px 14px rgba(${rgbOf(g.a)}, 0.4);
}
.${c} h4 { margin: 0 0 0.3rem; font-size: 0.92rem; color: #f8fafc; }
.${c} p { margin: 0; font-size: 0.78rem; color: #94a3b8; }`
    add(mk({
      name: `${g.name} Corner Ribbon`,
      category: 'Icons & Shapes',
      description: `Card with a rotated ${g.name.toLowerCase()} ribbon clipped to the top-right corner.`,
      html, css,
      tags: ['ribbon', 'corner banner', 'badge', 'card', 'new', g.name.toLowerCase()],
    }))
  }

  // 6. Star burst badge — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`ic-burst-${g.name}`)
    const html = `<div class="${c}"><b>−40%</b></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
}
.${c}::before, .${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}
.${c}::after {
  transform: rotate(36deg);
  opacity: 0.85;
}
.${c} b {
  position: relative;
  z-index: 1;
  font-size: 0.9rem;
  font-weight: 800;
  color: #0b1120;
}
.${c}:hover::after { transform: rotate(72deg); }
.${c}::after { transition: transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1); }`
    add(mk({
      name: `${g.name} Starburst Badge`,
      category: 'Icons & Shapes',
      description: `Two clipped ten-point stars offset into a ${g.name.toLowerCase()} sale burst that twists on hover.`,
      html, css,
      tags: ['star', 'burst', 'clip-path', 'badge', 'sale', g.name.toLowerCase()],
    }))
  }

  // 7. Plus → close spin — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`ic-plus-${g.name}`)
    const html = `<button class="${c}"><i></i></button>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 8px 22px rgba(${rgbOf(g.a)}, 0.4);
  transition: transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.3s ease;
}
.${c} i {
  position: relative;
  display: block;
  width: 16px;
  height: 16px;
}
.${c} i::before, .${c} i::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  background: #0b1120;
  border-radius: 1px;
  transform: translate(-50%, -50%);
}
.${c} i::before { width: 2px; height: 16px; }
.${c} i::after { width: 16px; height: 2px; }
.${c}:hover {
  transform: rotate(135deg);
  box-shadow: 0 10px 30px rgba(${rgbOf(g.a)}, 0.6);
}`
    add(mk({
      name: `${g.name} Plus To Close`,
      category: 'Icons & Shapes',
      description: `Floating ${g.name.toLowerCase()} action button whose plus rotates into a close cross.`,
      html, css,
      tags: ['plus icon', 'close icon', 'fab', 'rotate', 'toggle', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MICRO-INTERACTIONS  (~85)
   *
   *  The distinguishing constraint: every one of these has to be
   *  triggerable without JavaScript, which in practice means :active,
   *  :focus-within, :checked, or :hover. That rules out the usual
   *  "add a class on click" pattern and is why several use a hidden
   *  checkbox as the state.
   * ========================================================== */

  // 1. Ripple on press — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`mi-ripple-${pal.name}`)
    const html = `<button class="${c}">Press me</button>`
    const css = `.${c} {
  position: relative;
  overflow: hidden;
  padding: 0.65rem 1.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #f8fafc;
  border: none;
  border-radius: 0.55rem;
  cursor: pointer;
  background: ${pal.p};
  box-shadow: 0 4px 14px rgba(${pal.rgb}, 0.35);
}
.${c}::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255,255,255,0.55);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
}
.${c}:active::after {
  animation: ${c}-ripple 0.55s ease-out;
}
@keyframes ${c}-ripple {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(18); opacity: 0; }
}`
    add(mk({
      name: `${pal.name} Press Ripple`,
      category: 'Micro-interactions',
      description: `Material-style ripple that blooms from the center of a ${pal.name.toLowerCase()} button on :active.`,
      html, css,
      tags: ['ripple', 'click feedback', 'active state', 'button', pal.name.toLowerCase()],
    }))
  }

  // 2. Heart burst like — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mi-heart-${g.name}`)
    const html = `<label class="${c}"><input type="checkbox" checked><i></i><b>2,481</b></label>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.85rem;
  color: #94a3b8;
  cursor: pointer;
  user-select: none;
}
.${c} input { display: none; }
.${c} i {
  position: relative;
  width: 22px;
  height: 22px;
  transition: transform 0.28s cubic-bezier(0.34, 1.8, 0.64, 1);
}
.${c} i::before, .${c} i::after {
  content: '';
  position: absolute;
  top: 3px;
  width: 11px;
  height: 17px;
  border-radius: 11px 11px 0 0;
  background: #334155;
  transition: background 0.25s ease;
}
.${c} i::before { left: 11px; transform: rotate(-45deg); transform-origin: 0 100%; }
.${c} i::after  { left: 11px; transform: rotate(45deg); transform-origin: 0 100%; }
.${c}:hover i { transform: scale(1.15); }
.${c} input:checked + i::before, .${c} input:checked + i::after { background: ${g.a}; }
.${c} input:checked + i {
  animation: ${c}-pop 0.45s cubic-bezier(0.34, 1.8, 0.64, 1);
}
.${c} input:checked ~ b { color: ${g.b}; }
.${c} b { font-weight: 600; font-variant-numeric: tabular-nums; transition: color 0.25s ease; }
@keyframes ${c}-pop {
  0%   { transform: scale(1); }
  45%  { transform: scale(1.45); }
  100% { transform: scale(1); }
}`
    add(mk({
      name: `${g.name} Heart Like`,
      category: 'Micro-interactions',
      description: `Two rounded rectangles make the heart; checking it pops the shape and tints it ${g.name.toLowerCase()}.`,
      html, css,
      tags: ['like button', 'heart', 'favorite', 'checkbox hack', 'pop', g.name.toLowerCase()],
    }))
  }

  // 3. Drawn checkmark success — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mi-check-${g.name}`)
    const html = `<div class="${c}"><i></i><b>Payment confirmed</b></div>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
}
.${c} i {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(${rgbOf(g.a)}, 0.12);
  box-shadow: inset 0 0 0 2px ${g.a};
  animation: ${c}-ring 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.${c} i::after {
  content: '';
  position: absolute;
  left: 18px;
  top: 12px;
  width: 12px;
  height: 22px;
  border: solid ${g.b};
  border-width: 0 3px 3px 0;
  transform-origin: bottom right;
  transform: rotate(45deg) scale(0);
  animation: ${c}-tick 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}
.${c} b { font-size: 0.85rem; color: #e2e8f0; }
@keyframes ${c}-ring {
  from { transform: scale(0.4); opacity: 0; }
}
@keyframes ${c}-tick {
  to { transform: rotate(45deg) scale(1); }
}`
    add(mk({
      name: `${g.name} Success Checkmark`,
      category: 'Micro-interactions',
      description: `${g.name} confirmation ring that scales in, then snaps a border-drawn tick into place.`,
      html, css,
      tags: ['checkmark', 'success', 'confirmation', 'tick', 'feedback', g.name.toLowerCase()],
    }))
  }

  // 4. Copy → copied swap — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mi-copy-${g.name}`)
    const html = `<button class="${c}"><span class="a">Copy token</span><span class="b">Copied ✓</span></button>`
    const css = `.${c} {
  position: relative;
  overflow: hidden;
  width: 150px;
  height: 40px;
  border: none;
  border-radius: 0.55rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  background: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(${rgbOf(g.a)}, 0.4);
}
.${c} span {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  transition: transform 0.3s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.3s ease;
}
.${c} .a { color: #e2e8f0; }
.${c} .b {
  color: #0b1120;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  transform: translateY(100%);
  opacity: 0;
}
.${c}:hover .a { transform: translateY(-100%); opacity: 0; }
.${c}:hover .b { transform: translateY(0); opacity: 1; }`
    add(mk({
      name: `${g.name} Copy Confirm Swap`,
      category: 'Micro-interactions',
      description: `Button whose label slides away to reveal a ${g.name.toLowerCase()} "Copied" state underneath.`,
      html, css,
      tags: ['copy button', 'confirm', 'label swap', 'slide', g.name.toLowerCase()],
    }))
  }

  // 5. Shake on error — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mi-shake-${g.name}`)
    const html = `<div class="${c}"><input value="wrong-password" type="password"><small>Incorrect password</small></div>`
    const css = `.${c} {
  width: 220px;
}
.${c} input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  font-size: 0.9rem;
  font-family: inherit;
  color: #e2e8f0;
  background: #0f172a;
  border: 1px solid #f87171;
  border-radius: 0.55rem;
  outline: none;
  animation: ${c}-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
.${c} input:focus {
  border-color: ${g.a};
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.a)}, 0.22);
}
.${c} small {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.72rem;
  color: #f87171;
  animation: ${c}-fade 0.4s ease 0.15s both;
}
@keyframes ${c}-shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-7px); }
  40%, 60% { transform: translateX(7px); }
}
@keyframes ${c}-fade {
  from { opacity: 0; transform: translateY(-4px); }
}`
    add(mk({
      name: `${g.name} Error Shake Field`,
      category: 'Micro-interactions',
      description: `Field that shakes once on rejection, then focuses back to a calm ${g.name.toLowerCase()} ring.`,
      html, css,
      tags: ['shake', 'error', 'form feedback', 'invalid', g.name.toLowerCase()],
    }))
  }

  // 6. Magnetic hover chip — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`mi-magnet-${g.name}`)
    const html = `<a class="${c}"><span>Read the changelog</span><i></i></a>`
    const css = `.${c} {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #e2e8f0;
  text-decoration: none;
  border-radius: 999px;
  background: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.09);
  cursor: pointer;
  transition: box-shadow 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} span { transition: transform 0.25s ease; }
.${c} i {
  width: 12px;
  height: 2px;
  border-radius: 2px;
  background: ${g.b};
  transition: transform 0.25s ease, width 0.25s ease;
}
.${c} i::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  border-top: 2px solid ${g.b};
  border-right: 2px solid ${g.b};
  transform: translate(-6px, -2px) rotate(45deg);
}
.${c}:hover {
  transform: translateY(-3px);
  box-shadow: inset 0 0 0 1px ${g.a}, 0 10px 26px rgba(${rgbOf(g.a)}, 0.3);
}
.${c}:hover span { transform: translateX(-2px); }
.${c}:hover i { width: 18px; transform: translateX(3px); }`
    add(mk({
      name: `${g.name} Magnetic Link Chip`,
      category: 'Micro-interactions',
      description: `Pill link that lifts toward the cursor while its ${g.name.toLowerCase()} arrow stretches forward.`,
      html, css,
      tags: ['hover', 'magnetic', 'arrow', 'link', 'chip', g.name.toLowerCase()],
    }))
  }

  // 7. Notification count bump — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`mi-bump-${t.name}`)
    const html = `<div class="${c}"><i></i><b>7</b></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 0.7rem;
  background: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
  cursor: pointer;
}
.${c} i {
  position: relative;
  width: 16px;
  height: 14px;
  border-radius: 6px 6px 2px 2px;
  background: #94a3b8;
  transform-origin: top center;
  transition: background 0.2s ease;
}
.${c} i::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -4px;
  width: 6px;
  height: 4px;
  border-radius: 0 0 3px 3px;
  background: inherit;
  transform: translateX(-50%);
}
.${c}:hover i {
  background: ${t.b};
  animation: ${c}-ring 0.6s ease;
}
.${c} b {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  display: grid;
  place-items: center;
  font-size: 0.62rem;
  font-weight: 800;
  color: #0b1120;
  border-radius: 999px;
  background: linear-gradient(90deg, ${t.a}, ${t.c});
  animation: ${c}-bump 0.5s cubic-bezier(0.34, 1.8, 0.64, 1) both;
}
@keyframes ${c}-ring {
  20%, 60% { transform: rotate(-12deg); }
  40%, 80% { transform: rotate(12deg); }
}
@keyframes ${c}-bump {
  from { transform: scale(0); }
  60%  { transform: scale(1.3); }
  to   { transform: scale(1); }
}`
    add(mk({
      name: `${t.name} Notification Bump`,
      category: 'Micro-interactions',
      description: `Bell that swings on hover while its ${t.name.toLowerCase()} count badge pops in over the corner.`,
      html, css,
      tags: ['notification', 'bell', 'badge', 'bump', 'count', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FILTERS & BLEND MODES  (~85)
   *
   *  Adjacent to Masks & Clip Paths but a different question: masks
   *  decide WHERE a layer shows, filters and blends decide WHAT COLOR
   *  it comes out. Both use a gradient stand-in for the photograph so
   *  the snippet stays asset-free.
   * ========================================================== */

  // 1. Duotone — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`fb-duo-${g.name}`)
    const html = `<div class="${c}"><div class="img"></div><div class="tint"></div><b>Duotone</b></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  height: 140px;
  border-radius: 0.75rem;
  overflow: hidden;
  isolation: isolate;
  box-shadow: 0 12px 32px rgba(0,0,0,0.4);
}
.${c} .img {
  position: absolute;
  inset: 0;
  background: ${photo('#f97316', '#4c1d95')};
  filter: grayscale(1) contrast(1.25);
}
.${c} .tint {
  position: absolute;
  inset: 0;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  mix-blend-mode: color;
  transition: opacity 0.4s ease;
}
.${c} b {
  position: absolute;
  left: 0.8rem;
  bottom: 0.7rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff;
  mix-blend-mode: difference;
}
.${c}:hover .tint { opacity: 0; }`
    add(mk({
      name: `${g.name} Duotone Photo`,
      category: 'Filters & Blend Modes',
      description: `Grayscale base tinted ${g.name.toLowerCase()} with mix-blend-mode: color — hover drops back to the original.`,
      html, css,
      tags: ['duotone', 'mix-blend-mode', 'grayscale', 'image treatment', g.name.toLowerCase()],
    }))
  }

  // 2. Grayscale → color reveal — 17 palettes = 17
  for (const pal of PALETTES) {
    const c = cls(`fb-gray-${pal.name}`)
    const html = `<figure class="${c}"><div class="img"></div><figcaption>Hover to develop</figcaption></figure>`
    const css = `.${c} {
  position: relative;
  width: 200px;
  height: 130px;
  margin: 0;
  border-radius: 0.7rem;
  overflow: hidden;
  cursor: pointer;
}
.${c} .img {
  position: absolute;
  inset: 0;
  background: ${photo(pal.p, pal.a)};
  filter: grayscale(1) brightness(0.7);
  transform: scale(1.02);
  transition: filter 0.5s ease, transform 0.5s ease;
}
.${c} figcaption {
  position: absolute;
  inset: auto 0 0 0;
  padding: 0.5rem 0.7rem;
  font-size: 0.75rem;
  color: #f8fafc;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  opacity: 0.85;
  transition: opacity 0.4s ease;
}
.${c}:hover .img {
  filter: grayscale(0) brightness(1) saturate(1.15);
  transform: scale(1.08);
}
.${c}:hover figcaption { opacity: 0; }`
    add(mk({
      name: `${pal.name} Develop On Hover`,
      category: 'Filters & Blend Modes',
      description: `Desaturated ${pal.name.toLowerCase()} tile that regains color and pushes in when hovered.`,
      html, css,
      tags: ['grayscale', 'filter', 'hover reveal', 'image zoom', 'saturate', pal.name.toLowerCase()],
    }))
  }

  // 3. Glitch RGB split — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`fb-glitch-${g.name}`)
    const html = `<div class="${c}" data-t="SIGNAL"><span>SIGNAL</span></div>`
    const css = `.${c} {
  position: relative;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: #e2e8f0;
}
.${c} span { position: relative; z-index: 1; }
.${c}::before, .${c}::after {
  content: attr(data-t);
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  mix-blend-mode: screen;
}
.${c}::before {
  color: ${g.a};
  animation: ${c}-l 2.4s steps(2, end) infinite;
}
.${c}::after {
  color: ${g.b};
  animation: ${c}-r 2.4s steps(2, end) infinite;
}
@keyframes ${c}-l {
  0%, 88%, 100% { transform: translate(0); }
  90% { transform: translate(-3px, 1px); }
  94% { transform: translate(2px, -2px); }
}
@keyframes ${c}-r {
  0%, 86%, 100% { transform: translate(0); }
  92% { transform: translate(3px, -1px); }
  96% { transform: translate(-2px, 2px); }
}`
    add(mk({
      name: `${g.name} Glitch Split`,
      category: 'Filters & Blend Modes',
      description: `Headline with ${g.name.toLowerCase()} channel copies screened over it that jitter apart every few seconds.`,
      html, css,
      tags: ['glitch', 'rgb split', 'mix-blend-mode', 'screen', 'text', g.name.toLowerCase()],
    }))
  }

  // 4. mix-blend type over imagery — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`fb-blendtype-${g.name}`)
    const html = `<div class="${c}"><h3>OVERLAP</h3></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 230px;
  height: 130px;
  border-radius: 0.7rem;
  overflow: hidden;
  isolation: isolate;
  background: ${photo(g.a, g.b)};
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: ${NOISE};
  opacity: 0.12;
  pointer-events: none;
}
.${c} h3 {
  margin: 0;
  font-size: 1.9rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: #fff;
  mix-blend-mode: overlay;
  transition: mix-blend-mode 0.3s ease, letter-spacing 0.4s ease;
}
.${c}:hover h3 {
  mix-blend-mode: difference;
  letter-spacing: 0.16em;
}`
    add(mk({
      name: `${g.name} Blend Mode Headline`,
      category: 'Filters & Blend Modes',
      description: `Type set in overlay blend over a grainy ${g.name.toLowerCase()} field, flipping to difference on hover.`,
      html, css,
      tags: ['mix-blend-mode', 'overlay', 'difference', 'typography', 'grain', g.name.toLowerCase()],
    }))
  }

  // 5. Frosted backdrop panel — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`fb-frost-${g.name}`)
    const html = `<div class="${c}"><div class="panel"><b>backdrop-filter</b><span>blur + saturate over live content</span></div></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 240px;
  height: 140px;
  border-radius: 0.8rem;
  overflow: hidden;
  background: ${photo(g.a, g.b)};
}
.${c} .panel {
  padding: 0.8rem 1rem;
  width: 78%;
  border-radius: 0.65rem;
  background: rgba(15,23,42,0.35);
  backdrop-filter: blur(10px) saturate(160%);
  -webkit-backdrop-filter: blur(10px) saturate(160%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 26px rgba(0,0,0,0.35);
  transition: backdrop-filter 0.4s ease, transform 0.4s ease;
}
.${c} b { display: block; font-size: 0.85rem; color: #f8fafc; }
.${c} span { font-size: 0.72rem; color: rgba(248,250,252,0.75); }
.${c}:hover .panel {
  backdrop-filter: blur(2px) saturate(120%);
  -webkit-backdrop-filter: blur(2px) saturate(120%);
  transform: translateY(-2px);
}`
    add(mk({
      name: `${g.name} Frosted Panel`,
      category: 'Filters & Blend Modes',
      description: `Glass panel over a ${g.name.toLowerCase()} field — hovering pulls the blur back so the backdrop sharpens.`,
      html, css,
      tags: ['backdrop-filter', 'frosted glass', 'blur', 'saturate', 'glassmorphism', g.name.toLowerCase()],
    }))
  }

  // 6. Hue-rotate cycle — 12 pairs = 12
  for (const g of GRADPAIRS) {
    const c = cls(`fb-hue-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 130px;
  height: 130px;
  border-radius: 1.6rem;
  background: conic-gradient(from 0deg, ${g.a}, ${g.b}, ${g.a});
  box-shadow: 0 14px 40px rgba(${rgbOf(g.a)}, 0.35);
  animation: ${c}-hue 7s linear infinite;
}
@keyframes ${c}-hue {
  to { filter: hue-rotate(360deg); }
}`
    add(mk({
      name: `${g.name} Hue Cycle Tile`,
      category: 'Filters & Blend Modes',
      description: `Conic ${g.name.toLowerCase()} tile walked through the full hue wheel by a single filter keyframe.`,
      html, css,
      tags: ['hue-rotate', 'filter', 'conic gradient', 'color cycle', g.name.toLowerCase()],
    }))
  }

  // 7. Spotlight contrast reveal — 8 trios = 8
  for (const t of TRIOS) {
    const c = cls(`fb-spot-${t.name}`)
    const html = `<div class="${c}"><div class="img"></div><div class="spot"></div></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  height: 140px;
  border-radius: 0.75rem;
  overflow: hidden;
  isolation: isolate;
}
.${c} .img {
  position: absolute;
  inset: 0;
  background: ${photo(t.a, t.c)};
  filter: brightness(0.35) saturate(0.4);
  transition: filter 0.5s ease;
}
.${c} .spot {
  position: absolute;
  left: 0;
  top: 50%;
  width: 150px;
  height: 150px;
  margin: -75px 0 0 -50px;
  border-radius: 50%;
  background: radial-gradient(circle closest-side, rgba(255,255,255,0.6), transparent 75%);
  mix-blend-mode: soft-light;
  animation: ${c}-sweep 6s ease-in-out infinite alternate;
}
.${c}:hover .img { filter: brightness(1) saturate(1.1); }
@keyframes ${c}-sweep {
  from { transform: translate(30px, -14px); }
  to   { transform: translate(160px, 18px); }
}`
    add(mk({
      name: `${t.name} Spotlight Reveal`,
      category: 'Filters & Blend Modes',
      description: `Dimmed ${t.name.toLowerCase()} image with a soft-light spotlight drifting across it; hover lifts the whole frame.`,
      html, css,
      tags: ['spotlight', 'soft-light', 'brightness', 'blend', 'reveal', t.name.toLowerCase()],
    }))
  }
}
