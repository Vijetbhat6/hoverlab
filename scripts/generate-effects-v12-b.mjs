// scripts/generate-effects-v12-b.mjs
//
// Twelfth wave, part b: Backgrounds, Inputs & Hover, Navigation & Menus,
// Dividers & Separators. Same discipline as v11 — ONE entry per design,
// no colorway/size/speed stamping, every design a different mechanic
// from the entries already living in its category.
//
// Backgrounds are self-contained tiles (240×140 roots) rather than
// full-bleed surfaces, so they sit inside the preview cell like every
// other effect. Interactive categories are transition-driven on
// :hover / :focus-within / :checked; the only infinite keyframes are on
// the synthwave floor drift and they rest at a sensible frame.

export function generateV12B(ctx) {
  const { cls, mk, add } = ctx

  /* ───────────────────────── Backgrounds ───────────────────────── */

  /* B1. Isometric cubes — three linear gradients tile into stacked cubes */
  {
    const c = cls('v12-bg-isocubes')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  background-color: #1e1b4b;
  background-image:
    linear-gradient(30deg, #312e81 12%, transparent 12.5%, transparent 87%, #312e81 87.5%, #312e81),
    linear-gradient(150deg, #312e81 12%, transparent 12.5%, transparent 87%, #312e81 87.5%, #312e81),
    linear-gradient(30deg, #312e81 12%, transparent 12.5%, transparent 87%, #312e81 87.5%, #312e81),
    linear-gradient(150deg, #312e81 12%, transparent 12.5%, transparent 87%, #312e81 87.5%, #312e81),
    linear-gradient(60deg, #4f46e5 25%, transparent 25.5%, transparent 75%, #4f46e5 75%, #4f46e5),
    linear-gradient(60deg, #4f46e5 25%, transparent 25.5%, transparent 75%, #4f46e5 75%, #4f46e5);
  background-size: 40px 70px;
  background-position: 0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px;
  box-shadow: inset 0 0 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(99,102,241,0.3);
}`
    add(mk({
      name: 'Isometric Cubes Tile',
      category: 'Backgrounds',
      description: 'Stacked isometric cubes built entirely from six tiled linear gradients in indigo tones.',
      html, css,
      tags: ['isometric', 'cubes', 'pattern', 'geometric'],
    }))
  }

  /* B2. Halftone fade — dot grid that shrinks to nothing across the tile */
  {
    const c = cls('v12-bg-halftone')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  overflow: hidden;
  background: linear-gradient(135deg, #082f49, #0c4a6e);
  box-shadow: 0 0 0 1px rgba(14,165,233,0.3);
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #38bdf8 3px, transparent 3.5px);
  background-size: 12px 12px;
  -webkit-mask-image: linear-gradient(115deg, #000 15%, transparent 80%);
  mask-image: linear-gradient(115deg, #000 15%, transparent 80%);
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #7dd3fc 1.2px, transparent 1.7px);
  background-size: 12px 12px;
  background-position: 6px 6px;
  -webkit-mask-image: linear-gradient(115deg, transparent 20%, #000 60%, transparent 95%);
  mask-image: linear-gradient(115deg, transparent 20%, #000 60%, transparent 95%);
}`
    add(mk({
      name: 'Halftone Fade Tile',
      category: 'Backgrounds',
      description: 'A halftone dot screen that fades from bold dots to fine points across a deep sky gradient.',
      html, css,
      tags: ['halftone', 'dots', 'fade', 'print'],
    }))
  }

  /* B3. Diamond lattice — offset diagonal facets with fine violet seams */
  {
    const c = cls('v12-bg-lattice')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  background-color: #2e1065;
  background-image:
    linear-gradient(45deg, #4c1d95 25%, transparent 25%, transparent 75%, #4c1d95 75%),
    linear-gradient(-45deg, #4c1d95 25%, transparent 25%, transparent 75%, #4c1d95 75%),
    linear-gradient(45deg, transparent 49%, #7c3aed 49%, #7c3aed 51%, transparent 51%),
    linear-gradient(-45deg, transparent 49%, #7c3aed 49%, #7c3aed 51%, transparent 51%);
  background-size: 28px 28px;
  background-position: 0 0, 14px 14px, 0 0, 14px 14px;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.3);
}`
    add(mk({
      name: 'Diamond Lattice Tile',
      category: 'Backgrounds',
      description: 'Offset diagonal facets crossed by fine violet seams form a faceted diamond lattice.',
      html, css,
      tags: ['lattice', 'diamond', 'facets', 'diagonal'],
    }))
  }

  /* B4. Tartan plaid — crossing translucent stripes of two widths */
  {
    const c = cls('v12-bg-tartan')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  background-color: #4c0519;
  background-image:
    repeating-linear-gradient(0deg, rgba(244,63,94,0.55) 0 14px, transparent 14px 40px),
    repeating-linear-gradient(90deg, rgba(244,63,94,0.55) 0 14px, transparent 14px 40px),
    repeating-linear-gradient(0deg, rgba(254,205,211,0.35) 0 2px, transparent 2px 40px),
    repeating-linear-gradient(90deg, rgba(254,205,211,0.35) 0 2px, transparent 2px 40px),
    repeating-linear-gradient(0deg, transparent 0 20px, rgba(0,0,0,0.25) 20px 22px),
    repeating-linear-gradient(90deg, transparent 0 20px, rgba(0,0,0,0.25) 20px 22px);
  background-position: 0 6px, 6px 0, 0 26px, 26px 0, 0 0, 0 0;
  box-shadow: 0 0 0 1px rgba(244,63,94,0.35);
}`
    add(mk({
      name: 'Tartan Plaid Tile',
      category: 'Backgrounds',
      description: 'Rose tartan built from crossing translucent stripes of three widths, layered into a woven plaid.',
      html, css,
      tags: ['tartan', 'plaid', 'stripes', 'woven'],
    }))
  }

  /* B5. Synthwave floor — perspective grid rolling toward the viewer */
  {
    const c = cls('v12-bg-synthfloor')
    const html = `<div class="${c}"><div class="sun"></div><div class="floor"></div></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  overflow: hidden;
  background: linear-gradient(#0f172a, #164e63 60%, #06b6d4 60%, #083344 62%);
  box-shadow: 0 0 0 1px rgba(6,182,212,0.35);
}
.${c} .sun {
  position: absolute;
  left: 50%;
  top: 22%;
  width: 56px;
  height: 56px;
  margin-left: -28px;
  border-radius: 50%;
  background: linear-gradient(#f0abfc, #22d3ee);
  -webkit-mask: repeating-linear-gradient(#000 0 5px, transparent 5px 8px);
  mask: repeating-linear-gradient(#000 0 5px, transparent 5px 8px);
  filter: drop-shadow(0 0 8px rgba(34,211,238,0.6));
}
.${c} .floor {
  position: absolute;
  left: -50%;
  right: -50%;
  top: 60%;
  bottom: 0;
  background-image:
    linear-gradient(90deg, rgba(34,211,238,0.6) 1px, transparent 1px),
    linear-gradient(rgba(34,211,238,0.6) 1px, transparent 1px);
  background-size: 28px 28px;
  transform-origin: 50% 0;
  transform: perspective(90px) rotateX(58deg);
  animation: ${c}-roll 1.4s linear infinite;
}
@keyframes ${c}-roll {
  from { background-position: 0 0, 0 0; }
  to   { background-position: 0 0, 0 28px; }
}`
    add(mk({
      name: 'Synthwave Floor Tile',
      category: 'Backgrounds',
      description: 'Retro synthwave scene with a striped sun and a cyan perspective grid that rolls toward the viewer.',
      html, css,
      tags: ['synthwave', 'retro', 'grid', 'perspective', 'animated'],
    }))
  }

  /* B6. Triangle mosaic — conic gradients tile into a facet mosaic */
  {
    const c = cls('v12-bg-trimosaic')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  background-color: #4a044e;
  background-image:
    conic-gradient(from 45deg at 50% 50%, #701a75 0 25%, #a21caf 0 50%, #86198f 0 75%, #d946ef 0);
  background-size: 40px 40px;
  box-shadow: inset 0 0 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(217,70,239,0.35);
}`
    add(mk({
      name: 'Triangle Mosaic Tile',
      category: 'Backgrounds',
      description: 'Four-tone conic gradient tiles into a low-poly triangle mosaic in fuchsia and magenta.',
      html, css,
      tags: ['mosaic', 'triangles', 'low-poly', 'conic'],
    }))
  }

  /* ──────────────────────── Inputs & Hover ─────────────────────── */

  /* I1. Rating stars — radio stars that light up on hover and check */
  {
    const c = cls('v12-in-stars')
    const html = `<fieldset class="${c}"><legend>Rate it</legend><div class="row"><input type="radio" name="${c}" id="${c}-5"><label for="${c}-5">★</label><input type="radio" name="${c}" id="${c}-4"><label for="${c}-4">★</label><input type="radio" name="${c}" id="${c}-3" checked><label for="${c}-3">★</label><input type="radio" name="${c}" id="${c}-2"><label for="${c}-2">★</label><input type="radio" name="${c}" id="${c}-1"><label for="${c}-1">★</label></div></fieldset>`
    const css = `.${c} {
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 0.5rem 1rem 0.7rem;
  background: #111827;
  color: #94a3b8;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.${c} legend { padding: 0 0.4rem; }
.${c} .row { display: flex; flex-direction: row-reverse; justify-content: flex-end; gap: 0.15rem; }
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} label {
  font-size: 1.9rem;
  line-height: 1;
  color: #334155;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease, text-shadow 0.2s ease;
}
.${c} label:hover,
.${c} label:hover ~ label,
.${c} input:checked ~ label { color: #f59e0b; text-shadow: 0 0 10px rgba(245,158,11,0.55); }
.${c} label:hover { transform: scale(1.25); }
.${c} .row:hover input:checked ~ label { color: #78350f; text-shadow: none; }
.${c} .row:hover label:hover,
.${c} .row:hover label:hover ~ label { color: #f59e0b; text-shadow: 0 0 10px rgba(245,158,11,0.55); }`
    add(mk({
      name: 'Rating Stars Input',
      category: 'Inputs & Hover',
      description: 'Five-star radio rating where hovering previews the score and clicking locks it in, no JavaScript.',
      html, css,
      tags: ['rating', 'stars', 'radio', 'hover-preview'],
    }))
  }

  /* I2. Inline edit — plain text turns into a field on hover / focus */
  {
    const c = cls('v12-in-inline')
    const html = `<div class="${c}"><span class="lbl">Project name</span><input type="text" value="Aurora Redesign"><span class="pen">✎</span></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 220px;
}
.${c} .lbl { font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; }
.${c} input {
  font: inherit;
  font-size: 1.05rem;
  font-weight: 600;
  color: #e2e8f0;
  background: transparent;
  border: 1px solid transparent;
  border-bottom: 1px dashed #475569;
  border-radius: 0.4rem;
  padding: 0.4rem 2rem 0.4rem 0.5rem;
  margin-left: -0.5rem;
  outline: none;
  transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}
.${c} .pen {
  position: absolute;
  right: 0.5rem;
  bottom: 0.55rem;
  color: #f43f5e;
  font-size: 0.95rem;
  opacity: 0;
  transform: translateX(6px);
  transition: opacity 0.25s ease, transform 0.25s ease;
  pointer-events: none;
}
.${c}:hover input,
.${c}:focus-within input {
  background: #1e293b;
  border-color: #f43f5e;
  border-bottom-style: solid;
}
.${c}:focus-within input { box-shadow: 0 0 0 3px rgba(244,63,94,0.25); }
.${c}:hover .pen,
.${c}:focus-within .pen { opacity: 1; transform: translateX(0); }`
    add(mk({
      name: 'Inline Edit Field',
      category: 'Inputs & Hover',
      description: 'Text that reads as plain copy until hovered, when a pencil slides in and the field reveals itself.',
      html, css,
      tags: ['inline-edit', 'text', 'reveal', 'pencil'],
    }))
  }

  /* I3. Segmented radio — a sliding puck tracks the checked option */
  {
    const c = cls('v12-in-segment')
    const html = `<div class="${c}"><input type="radio" name="${c}" id="${c}-a" checked><label for="${c}-a">Day</label><input type="radio" name="${c}" id="${c}-b"><label for="${c}-b">Week</label><input type="radio" name="${c}" id="${c}-c"><label for="${c}-c">Month</label><span class="puck"></span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 72px);
  padding: 4px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 999px;
  isolation: isolate;
}
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} label {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 0.45rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-radius: 999px;
  transition: color 0.25s ease;
}
.${c} label:hover { color: #cbd5e1; }
.${c} .puck {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: 72px;
  border-radius: 999px;
  background: #10b981;
  box-shadow: 0 2px 10px rgba(16,185,129,0.45);
  transition: transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} input:nth-of-type(1):checked ~ .puck { transform: translateX(0); }
.${c} input:nth-of-type(2):checked ~ .puck { transform: translateX(72px); }
.${c} input:nth-of-type(3):checked ~ .puck { transform: translateX(144px); }
.${c} input:checked + label { color: #022c22; }`
    add(mk({
      name: 'Segmented Radio Field',
      category: 'Inputs & Hover',
      description: 'Three-way segmented control whose emerald puck springs across to whichever radio option is chosen.',
      html, css,
      tags: ['segmented', 'radio', 'puck', 'slide'],
    }))
  }

  /* I4. URL prefix — protocol addon lights up with the field on focus */
  {
    const c = cls('v12-in-urlprefix')
    const html = `<label class="${c}"><span class="pre">https://</span><input type="text" placeholder="yourdomain.com"><span class="ok">✓</span></label>`
    const css = `.${c} {
  display: flex;
  align-items: stretch;
  width: 240px;
  border: 1px solid #334155;
  border-radius: 0.55rem;
  overflow: hidden;
  background: #0f172a;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.${c} .pre {
  display: flex;
  align-items: center;
  padding: 0 0.7rem;
  font-size: 0.85rem;
  font-family: ui-monospace, monospace;
  color: #64748b;
  background: #1e293b;
  border-right: 1px solid #334155;
  transition: color 0.25s ease, background 0.25s ease, border-color 0.25s ease;
}
.${c} input {
  flex: 1;
  min-width: 0;
  padding: 0.6rem 0.7rem;
  font: inherit;
  font-size: 0.9rem;
  color: #e2e8f0;
  background: transparent;
  border: none;
  outline: none;
}
.${c} input::placeholder { color: #475569; }
.${c} .ok {
  display: flex;
  align-items: center;
  padding: 0 0.7rem;
  color: #0ea5e9;
  font-weight: 700;
  opacity: 0;
  transform: scale(0.5);
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.${c}:hover { border-color: #475569; }
.${c}:focus-within { border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14,165,233,0.25); }
.${c}:focus-within .pre { color: #e0f2fe; background: #0ea5e9; border-color: #0ea5e9; }
.${c}:focus-within .ok { opacity: 1; transform: scale(1); }`
    add(mk({
      name: 'URL Prefix Field',
      category: 'Inputs & Hover',
      description: 'Domain input with a fixed https:// addon that fills sky blue and pops a checkmark once the field is focused.',
      html, css,
      tags: ['url', 'prefix', 'addon', 'focus'],
    }))
  }

  /* I5. Textarea counter — the field grows and a counter chip fades in */
  {
    const c = cls('v12-in-textarea')
    const html = `<div class="${c}"><textarea rows="2" placeholder="Leave a note…"></textarea><span class="count">0 / 280</span></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
}
.${c} textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
  height: 68px;
  padding: 0.6rem 0.75rem 1.4rem;
  font: inherit;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #e2e8f0;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.6rem;
  outline: none;
  resize: none;
  transition: height 0.3s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}
.${c} textarea::placeholder { color: #475569; }
.${c} .count {
  position: absolute;
  right: 0.6rem;
  bottom: 0.5rem;
  padding: 0.1rem 0.45rem;
  font-size: 0.65rem;
  font-family: ui-monospace, monospace;
  color: #5eead4;
  background: rgba(20,184,166,0.15);
  border: 1px solid rgba(20,184,166,0.35);
  border-radius: 999px;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.25s ease, transform 0.25s ease;
  pointer-events: none;
}
.${c}:hover textarea { border-color: #475569; }
.${c}:focus-within textarea { height: 96px; border-color: #14b8a6; box-shadow: 0 0 0 3px rgba(20,184,166,0.22); }
.${c}:focus-within .count { opacity: 1; transform: translateY(0); }`
    add(mk({
      name: 'Growing Textarea Field',
      category: 'Inputs & Hover',
      description: 'Compact textarea that expands on focus while a teal character-count chip fades in at the corner.',
      html, css,
      tags: ['textarea', 'grow', 'counter', 'focus'],
    }))
  }

  /* I6. Range slider — filled track with a thumb that swells on hover */
  {
    const c = cls('v12-in-range')
    const html = `<label class="${c}"><span class="head"><span>Volume</span><span class="val">64%</span></span><input type="range" min="0" max="100" value="64"></label>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  width: 220px;
  padding: 0.85rem 1rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  color: #e2e8f0;
  font-size: 0.85rem;
  transition: border-color 0.25s ease;
}
.${c} .head { display: flex; justify-content: space-between; }
.${c} .val { color: #a78bfa; font-family: ui-monospace, monospace; }
.${c} input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  margin: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, #8b5cf6 0 64%, #1e293b 64%);
  outline: none;
  cursor: pointer;
}
.${c} input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #f5f3ff;
  border: 3px solid #8b5cf6;
  box-shadow: 0 0 0 0 rgba(139,92,246,0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.${c} input::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f5f3ff;
  border: 3px solid #8b5cf6;
  box-shadow: 0 0 0 0 rgba(139,92,246,0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.${c}:hover { border-color: #8b5cf6; }
.${c}:hover input::-webkit-slider-thumb { transform: scale(1.25); box-shadow: 0 0 0 7px rgba(139,92,246,0.25); }
.${c}:hover input::-moz-range-thumb { transform: scale(1.25); box-shadow: 0 0 0 7px rgba(139,92,246,0.25); }`
    add(mk({
      name: 'Range Slider Field',
      category: 'Inputs & Hover',
      description: 'Labelled range input with a violet filled track and a thumb that swells with a soft halo on hover.',
      html, css,
      tags: ['range', 'slider', 'thumb', 'hover'],
    }))
  }

  /* ─────────────────────── Navigation & Menus ──────────────────── */

  /* N1. Table-of-contents spy — a rail marker jumps to the hovered heading */
  {
    const c = cls('v12-nav-toc')
    const html = `<nav class="${c}"><span class="head">On this page</span><a href="#" class="on">Overview</a><a href="#">Installation</a><a href="#" class="sub">Requirements</a><a href="#">Usage</a></nav>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  width: 180px;
  padding-left: 0.85rem;
  border-left: 2px solid #1e293b;
  font-size: 0.85rem;
}
.${c} .head {
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 0.4rem;
}
.${c} a {
  position: relative;
  padding: 0.28rem 0;
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.2s ease, transform 0.2s ease;
}
.${c} a.sub { padding-left: 0.9rem; font-size: 0.8rem; }
.${c} a::before {
  content: '';
  position: absolute;
  left: calc(-0.85rem - 2px);
  top: 15%;
  height: 70%;
  width: 2px;
  background: #6366f1;
  border-radius: 2px;
  transform: scaleY(0);
  transition: transform 0.25s ease;
}
.${c} a.on { color: #e2e8f0; }
.${c} a.on::before { transform: scaleY(1); }
.${c} a:hover { color: #a5b4fc; transform: translateX(3px); }
.${c} a:hover::before { transform: scaleY(1); }
.${c}:hover a.on:not(:hover)::before { transform: scaleY(0); }
.${c}:hover a.on:not(:hover) { color: #94a3b8; }`
    add(mk({
      name: 'Table Of Contents Nav',
      category: 'Navigation & Menus',
      description: 'Docs-style on-this-page list where the indigo rail marker jumps to whichever heading is hovered.',
      html, css,
      tags: ['toc', 'scrollspy', 'rail', 'docs'],
    }))
  }

  /* N2. Radial fan menu — items orbit out from a hub on hover */
  {
    const c = cls('v12-nav-radial')
    const html = `<div class="${c}"><span class="hub">+</span><a href="#" class="i1">✎</a><a href="#" class="i2">♥</a><a href="#" class="i3">↗</a><a href="#" class="i4">✕</a></div>`
    const css = `.${c} {
  position: relative;
  width: 180px;
  height: 130px;
}
.${c} .hub {
  position: absolute;
  left: 50%;
  bottom: 8px;
  width: 44px;
  height: 44px;
  margin-left: -22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  line-height: 1;
  color: #fff;
  background: #d946ef;
  box-shadow: 0 6px 18px rgba(217,70,239,0.45);
  cursor: pointer;
  transition: transform 0.35s ease;
  z-index: 1;
}
.${c} a {
  position: absolute;
  left: 50%;
  bottom: 14px;
  width: 32px;
  height: 32px;
  margin-left: -16px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  color: #f0abfc;
  background: #1e1b3a;
  border: 1px solid #a21caf;
  text-decoration: none;
  transform: translate(0, 0) scale(0.4);
  opacity: 0;
  transition: transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.25s ease, background 0.2s ease;
}
.${c} a:hover { background: #d946ef; color: #fff; }
.${c}:hover .hub { transform: rotate(135deg); }
.${c}:hover a { opacity: 1; }
.${c}:hover .i1 { transform: translate(-64px, -6px) scale(1); }
.${c}:hover .i2 { transform: translate(-32px, -58px) scale(1); }
.${c}:hover .i3 { transform: translate(32px, -58px) scale(1); }
.${c}:hover .i4 { transform: translate(64px, -6px) scale(1); }
.${c}:hover .i2, .${c}:hover .i3 { transition-delay: 0.05s; }
.${c}:hover .i4 { transition-delay: 0.1s; }`
    add(mk({
      name: 'Radial Fan Menu',
      category: 'Navigation & Menus',
      description: 'A fuchsia hub button that spins into an X while four actions fan out along an arc on hover.',
      html, css,
      tags: ['radial', 'fan', 'fab', 'arc'],
    }))
  }

  /* N3. Hover dropdown — a top link drops a panel of sub-links */
  {
    const c = cls('v12-nav-dropdown')
    const html = `<nav class="${c}"><a href="#">Home</a><div class="dd"><a href="#" class="t">Products ▾</a><div class="panel"><a href="#">Analytics</a><a href="#">Automation</a><a href="#">Billing</a></div></div><a href="#">Pricing</a></nav>`
    const css = `.${c} {
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.35rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 0.6rem;
  font-size: 0.85rem;
  height: 130px;
  box-sizing: border-box;
}
.${c} a {
  display: block;
  padding: 0.4rem 0.75rem;
  color: #94a3b8;
  text-decoration: none;
  border-radius: 0.4rem;
  white-space: nowrap;
  transition: color 0.2s ease, background 0.2s ease;
}
.${c} > a:hover, .${c} .t:hover { color: #e0f2fe; background: #1e293b; }
.${c} .dd { position: relative; }
.${c} .panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 140px;
  padding: 0.3rem;
  background: #111827;
  border: 1px solid #0ea5e9;
  border-radius: 0.5rem;
  box-shadow: 0 12px 30px rgba(0,0,0,0.5);
  opacity: 0;
  transform: translateY(-6px) scaleY(0.9);
  transform-origin: top;
  visibility: hidden;
  transition: opacity 0.2s ease, transform 0.25s ease, visibility 0s linear 0.25s;
}
.${c} .panel a { font-size: 0.8rem; padding: 0.35rem 0.6rem; }
.${c} .panel a:hover { color: #0ea5e9; background: rgba(14,165,233,0.12); padding-left: 0.85rem; }
.${c} .dd:hover .t { color: #0ea5e9; background: rgba(14,165,233,0.12); }
.${c} .dd:hover .panel { opacity: 1; transform: translateY(0) scaleY(1); visibility: visible; transition-delay: 0s; }`
    add(mk({
      name: 'Hover Dropdown Nav',
      category: 'Navigation & Menus',
      description: 'Horizontal nav where hovering the Products link drops a sky-outlined panel of sub-links into view.',
      html, css,
      tags: ['dropdown', 'nav', 'hover', 'panel'],
    }))
  }

  /* N4. Skew ribbon — parallelogram tabs with a fill that slides on hover */
  {
    const c = cls('v12-nav-skew')
    const html = `<nav class="${c}"><a href="#" class="on"><span>Overview</span></a><a href="#"><span>Specs</span></a><a href="#"><span>Reviews</span></a></nav>`
    const css = `.${c} {
  display: flex;
  gap: 2px;
  padding: 0 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
}
.${c} a {
  position: relative;
  padding: 0.55rem 1.1rem;
  color: #94a3b8;
  text-decoration: none;
  background: #1e293b;
  transform: skewX(-18deg);
  overflow: hidden;
  transition: color 0.25s ease;
}
.${c} a span { display: block; transform: skewX(18deg); position: relative; z-index: 1; }
.${c} a::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #f97316;
  transform: translateX(-101%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} a.on { color: #fff7ed; }
.${c} a.on::before { transform: translateX(0); }
.${c} a:hover { color: #fff7ed; }
.${c} a:hover::before { transform: translateX(0); }
.${c}:hover a.on:not(:hover)::before { transform: translateX(101%); }
.${c}:hover a.on:not(:hover) { color: #94a3b8; }`
    add(mk({
      name: 'Skew Ribbon Nav',
      category: 'Navigation & Menus',
      description: 'Slanted parallelogram tabs where the orange fill wipes out of the active tab and into the hovered one.',
      html, css,
      tags: ['skew', 'tabs', 'ribbon', 'wipe'],
    }))
  }

  /* N5. Numbered section dots — vertical dots that stretch into labels */
  {
    const c = cls('v12-nav-dots')
    const html = `<nav class="${c}"><a href="#" class="on"><i></i><span>01 Intro</span></a><a href="#"><i></i><span>02 Work</span></a><a href="#"><i></i><span>03 About</span></a><a href="#"><i></i><span>04 Contact</span></a></nav>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
  letter-spacing: 0.06em;
}
.${c} a {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #64748b;
  text-decoration: none;
  transition: color 0.25s ease;
}
.${c} i {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #334155;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s ease, box-shadow 0.25s ease;
}
.${c} span { opacity: 0.6; transition: opacity 0.25s ease, transform 0.25s ease; }
.${c} a.on i, .${c} a:hover i { width: 34px; background: #84cc16; box-shadow: 0 0 10px rgba(132,204,22,0.55); }
.${c} a.on, .${c} a:hover { color: #ecfccb; }
.${c} a.on span, .${c} a:hover span { opacity: 1; transform: translateX(2px); }
.${c}:hover a.on:not(:hover) i { width: 10px; background: #334155; box-shadow: none; }
.${c}:hover a.on:not(:hover) { color: #64748b; }
.${c}:hover a.on:not(:hover) span { opacity: 0.6; transform: none; }`
    add(mk({
      name: 'Section Dots Nav',
      category: 'Navigation & Menus',
      description: 'Full-page style side dots that stretch into a lime bar and brighten their numbered label on hover.',
      html, css,
      tags: ['dots', 'sections', 'fullpage', 'vertical'],
    }))
  }

  /* N6. Slide row menu — rows sweep a tinted bar in and reveal an arrow */
  {
    const c = cls('v12-nav-rows')
    const html = `<nav class="${c}"><a href="#"><span>Dashboard</span><b>→</b></a><a href="#"><span>Projects</span><b>→</b></a><a href="#"><span>Team</span><b>→</b></a><a href="#"><span>Settings</span><b>→</b></a></nav>`
    const css = `.${c} {
  display: flex;
  flex-direction: column;
  width: 190px;
  font-size: 0.85rem;
  border-top: 1px solid #1e293b;
}
.${c} a {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  color: #94a3b8;
  text-decoration: none;
  border-bottom: 1px solid #1e293b;
  overflow: hidden;
  transition: color 0.25s ease;
}
.${c} a::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(20,184,166,0.28), rgba(20,184,166,0.04));
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} a span, .${c} a b { position: relative; }
.${c} a b {
  font-weight: 400;
  color: #2dd4bf;
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity 0.25s ease, transform 0.3s ease;
}
.${c} a:hover { color: #ccfbf1; }
.${c} a:hover::before { transform: translateX(0); }
.${c} a:hover b { opacity: 1; transform: translateX(0); }`
    add(mk({
      name: 'Slide Row Menu',
      category: 'Navigation & Menus',
      description: 'Stacked menu rows where hovering sweeps a teal tint bar across the row and slides an arrow into place.',
      html, css,
      tags: ['menu', 'rows', 'sweep', 'arrow'],
    }))
  }

  /* ───────────────────── Dividers & Separators ─────────────────── */

  /* D1. Arrow rule — a rule that ends in an arrowhead */
  {
    const c = cls('v12-div-arrow')
    const html = `<div class="${c}"><span class="dot"></span><span class="line"></span><span class="tip"></span></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  width: 240px;
}
.${c} .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #0ea5e9;
  box-shadow: 0 0 10px rgba(14,165,233,0.6);
}
.${c} .line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, #0ea5e9, rgba(14,165,233,0.35) 60%, #0ea5e9);
}
.${c} .tip {
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 12px solid #0ea5e9;
  filter: drop-shadow(0 0 5px rgba(14,165,233,0.6));
}`
    add(mk({
      name: 'Arrow Rule Divider',
      category: 'Dividers & Separators',
      description: 'A directional divider that starts from a glowing sky dot and ends in a solid arrowhead.',
      html, css,
      tags: ['arrow', 'rule', 'directional', 'line'],
    }))
  }

  /* D2. Ring chain — linked rings strung along a rule */
  {
    const c = cls('v12-div-chain')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 14px;
  background:
    radial-gradient(circle at 7px 7px, transparent 4px, #10b981 4.5px, #10b981 6px, transparent 6.5px) 0 0 / 22px 14px repeat-x,
    linear-gradient(#10b981, #10b981) 0 50% / 100% 2px no-repeat;
  filter: drop-shadow(0 0 4px rgba(16,185,129,0.4));
}`
    add(mk({
      name: 'Ring Chain Divider',
      category: 'Dividers & Separators',
      description: 'Emerald rings strung evenly along a thin rule, like links on a chain.',
      html, css,
      tags: ['rings', 'chain', 'repeat', 'links'],
    }))
  }

  /* D3. Scallop edge — a row of half circles closing a section */
  {
    const c = cls('v12-div-scallop')
    const html = `<div class="${c}"><div class="top"></div><div class="edge"></div></div>`
    const css = `.${c} {
  width: 240px;
}
.${c} .top {
  height: 46px;
  background: #4c0519;
  border-radius: 0.6rem 0.6rem 0 0;
}
.${c} .edge {
  height: 14px;
  background:
    radial-gradient(circle at 12px 0, #4c0519 11px, transparent 12px) 0 0 / 24px 14px repeat-x;
  filter: drop-shadow(0 3px 0 #f43f5e);
}`
    add(mk({
      name: 'Scallop Edge Divider',
      category: 'Dividers & Separators',
      description: 'A section that ends in a row of scalloped half-circles trimmed with a rose edge.',
      html, css,
      tags: ['scallop', 'edge', 'section', 'curved'],
    }))
  }

  /* D4. Comet tail — a tapering rule with a bright head */
  {
    const c = cls('v12-div-comet')
    const html = `<div class="${c}"><span class="tail"></span><span class="head"></span></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 16px;
}
.${c} .tail {
  position: absolute;
  left: 0;
  top: 0;
  width: 226px;
  height: 16px;
  background: linear-gradient(90deg, transparent, rgba(245,158,11,0.2) 45%, #f59e0b);
  clip-path: polygon(0 48%, 100% 15%, 100% 85%, 0 52%);
}
.${c} .head {
  position: absolute;
  right: 0;
  top: 50%;
  width: 16px;
  height: 16px;
  margin-top: -8px;
  border-radius: 50%;
  background: radial-gradient(circle, #fef3c7, #f59e0b 60%);
  box-shadow: 0 0 12px rgba(245,158,11,0.75);
}`
    add(mk({
      name: 'Comet Tail Divider',
      category: 'Dividers & Separators',
      description: 'A rule that thickens and brightens toward a glowing amber head, like a comet streaking across the page.',
      html, css,
      tags: ['comet', 'taper', 'glow', 'gradient'],
    }))
  }

  /* D5. Rope twist — alternating diagonal segments read as a twisted cord */
  {
    const c = cls('v12-div-rope')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 8px;
  border-radius: 999px;
  background: repeating-linear-gradient(-55deg, #f97316 0 5px, #9a3412 5px 8px, #fdba74 8px 10px, #9a3412 10px 12px);
  box-shadow: 0 1px 0 rgba(0,0,0,0.5), 0 0 8px rgba(249,115,22,0.35);
}`
    add(mk({
      name: 'Rope Twist Divider',
      category: 'Dividers & Separators',
      description: 'A rounded cord of alternating diagonal orange strands that reads as a twisted rope.',
      html, css,
      tags: ['rope', 'twist', 'diagonal', 'cord'],
    }))
  }

  /* D6. Section number — left-aligned numeral with a rule that trails away */
  {
    const c = cls('v12-div-number')
    const html = `<div class="${c}"><span class="num">02</span><span class="rule"></span><span class="lbl">Process</span></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 240px;
}
.${c} .num {
  font-family: ui-monospace, monospace;
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1;
  color: #84cc16;
}
.${c} .rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, #84cc16, rgba(132,204,22,0.05));
}
.${c} .lbl {
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #a3e635;
}`
    add(mk({
      name: 'Section Number Divider',
      category: 'Dividers & Separators',
      description: 'Editorial divider with a bold lime section number, a rule that fades away, and a small caps label at the end.',
      html, css,
      tags: ['number', 'section', 'editorial', 'rule'],
    }))
  }
}
