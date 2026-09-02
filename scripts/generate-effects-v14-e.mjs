// scripts/generate-effects-v14-e.mjs
//
// Fourteenth wave, part E: Patterns & Textures (4), Masks & Clip Paths
// (4), Sliders & Carousels (4), Icons & Shapes (4).
//
//   Patterns   — tartan plaid, wood grain with a knot, corrugated sheet
//                with rivets, quilted padding
//   Masks      — stamp perforation (two-layer mask union), travelling
//                torchlight clip circle, two-disc xor exclusion,
//                keyhole (circle + conic wedge union) panning a view
//   Sliders    — fanned card hand, story progress reel, mixer fader
//                bank, 3D wheel picker
//   Icons      — heart with a like burst, padlock shackle, paper plane
//                with a trail, draining hourglass that flips
//
// Pattern tiles follow the 240x140 rounded-tile convention.

export function generateV14E(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Patterns & Textures                                                 */
  /* ------------------------------------------------------------------ */

  /* PT1. Tartan plaid — asymmetric translucent bands crossed both ways */
  {
    const c = cls('v14-pt-tartan')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  background-color: #0b3b2c;
  background-image:
    repeating-linear-gradient(90deg,
      rgba(30,58,138,0.55) 0 16px,
      rgba(226,232,240,0) 16px 30px,
      rgba(226,232,240,0.14) 30px 48px,
      rgba(226,232,240,0) 48px 58px,
      rgba(250,204,21,0.7) 58px 61px,
      rgba(226,232,240,0) 61px 76px),
    repeating-linear-gradient(0deg,
      rgba(30,58,138,0.55) 0 16px,
      rgba(226,232,240,0) 16px 30px,
      rgba(226,232,240,0.14) 30px 48px,
      rgba(226,232,240,0) 48px 58px,
      rgba(250,204,21,0.7) 58px 61px,
      rgba(226,232,240,0) 61px 76px);
  box-shadow: inset 0 0 30px rgba(0,0,0,0.45), 0 0 0 1px rgba(148,163,184,0.25);
}`
    add(mk({
      name: 'Tartan Plaid Sett',
      category: 'Patterns & Textures',
      description: 'A woven tartan sett built from one asymmetric band group crossed over itself, so the navy blocks, pale checks and thin yellow over-check darken and brighten where they overlap.',
      html, css,
      tags: ['tartan', 'plaid', 'sett', 'textile', 'overcheck'],
    }))
  }

  /* PT2. Wood grain — three grain periods plus a knot */
  {
    const c = cls('v14-pt-wood')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  background-color: #7a4a21;
  background-image:
    radial-gradient(15px 34px at 176px 70px,
      rgba(53,27,8,0.9) 0 12%,
      rgba(163,106,52,0.4) 26%,
      rgba(53,27,8,0.7) 42%,
      rgba(163,106,52,0.3) 58%,
      rgba(64,34,12,0.5) 74%,
      rgba(122,74,33,0) 100%),
    radial-gradient(70px 190px at 30px 70px,
      rgba(48,25,7,0) 0 46%,
      rgba(48,25,7,0.3) 50%,
      rgba(48,25,7,0) 54%,
      rgba(48,25,7,0) 68%,
      rgba(48,25,7,0.24) 72%,
      rgba(48,25,7,0) 77%,
      rgba(48,25,7,0) 88%,
      rgba(48,25,7,0.2) 92%,
      rgba(48,25,7,0) 97%),
    repeating-linear-gradient(180deg, rgba(48,25,7,0.34) 0 2px, rgba(122,74,33,0) 2px 11px),
    repeating-linear-gradient(180deg, rgba(255,232,200,0.07) 0 1px, rgba(122,74,33,0) 1px 7px),
    repeating-linear-gradient(180deg, rgba(48,25,7,0.22) 0 3px, rgba(122,74,33,0) 3px 23px),
    linear-gradient(90deg, rgba(0,0,0,0.3), rgba(0,0,0,0) 34%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.3));
  box-shadow: inset 0 0 0 1px rgba(226,232,240,0.14), 0 6px 16px rgba(0,0,0,0.45);
}`
    add(mk({
      name: 'Wood Grain Board',
      category: 'Patterns & Textures',
      description: 'A sawn timber board whose grain is drawn from three horizontal line periods that never line up, with a ringed knot swirling near the right edge.',
      html, css,
      tags: ['wood', 'grain', 'timber', 'knot', 'natural'],
    }))
  }

  /* PT3. Corrugated sheet — shaded ridges plus rivet rows */
  {
    const c = cls('v14-pt-corrugated')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 140px;
  border-radius: 0.4rem;
  background-color: #1e293b;
  background-image:
    radial-gradient(2.5px 2.5px at 12px 11px, rgba(8,11,20,0.95) 60%, rgba(8,11,20,0) 100%),
    radial-gradient(2.5px 2.5px at 12px 129px, rgba(8,11,20,0.95) 60%, rgba(8,11,20,0) 100%),
    repeating-linear-gradient(90deg,
      #131c2e 0px,
      #33415a 5px,
      #94a3b8 10px,
      #dbe4ee 12px,
      #94a3b8 14px,
      #33415a 19px,
      #131c2e 24px);
  background-size: 24px 140px, 24px 140px, auto;
  box-shadow: inset 0 0 0 1px rgba(148,163,184,0.3), 0 6px 16px rgba(0,0,0,0.5);
}`
    add(mk({
      name: 'Corrugated Sheet',
      category: 'Patterns & Textures',
      description: 'A galvanised corrugated sheet where each ridge is shaded from trough to highlight and back, with a row of dark rivets pinned along the top and bottom edges.',
      html, css,
      tags: ['corrugated', 'metal', 'ridges', 'rivets', 'industrial'],
    }))
  }

  /* PT4. Quilted padding — diamond stitch lattice with puffed cells */
  {
    const c = cls('v14-pt-quilt')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 140px;
  border-radius: 0.75rem;
  background-color: #223049;
  background-image:
    repeating-linear-gradient(45deg, rgba(226,232,240,0.28) 0 1.5px, rgba(15,23,42,0) 1.5px 30px),
    repeating-linear-gradient(-45deg, rgba(226,232,240,0.28) 0 1.5px, rgba(15,23,42,0) 1.5px 30px),
    radial-gradient(circle at 50% 50%, rgba(226,232,240,0.2) 0 20%, rgba(226,232,240,0.06) 40%, rgba(2,6,23,0.34) 66%, rgba(2,6,23,0) 78%),
    radial-gradient(circle at 50% 50%, rgba(226,232,240,0.2) 0 20%, rgba(226,232,240,0.06) 40%, rgba(2,6,23,0.34) 66%, rgba(2,6,23,0) 78%);
  background-size: auto, auto, 42.4px 42.4px, 42.4px 42.4px;
  background-position: 0 0, 0 0, 21.2px 0, 0 21.2px;
  box-shadow: inset 0 0 0 1px rgba(148,163,184,0.25), 0 8px 18px rgba(0,0,0,0.45);
}`
    add(mk({
      name: 'Quilted Padding',
      category: 'Patterns & Textures',
      description: 'Padded upholstery in which two crossing stitch lines cut the surface into diamonds and every diamond swells with its own highlight and shadow.',
      html, css,
      tags: ['quilted', 'padded', 'upholstery', 'diamond', 'stitch'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Masks & Clip Paths                                                  */
  /* ------------------------------------------------------------------ */

  /* MK1. Stamp perforation — hole grid unioned with an inner rectangle */
  {
    const c = cls('v14-mk-stamp')
    const html = `<div class="${c}"><span class="in"><b>24</b><em>HOVERLAB</em></span></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 216px;
  height: 120px;
  background: linear-gradient(150deg, #38bdf8, #6366f1 55%, #a21caf);
  -webkit-mask:
    radial-gradient(circle 7px at 12px 12px, rgba(0,0,0,0) 96%, #000 100%) -12px -12px / 24px 24px,
    linear-gradient(#000, #000) 12px 12px / calc(100% - 24px) calc(100% - 24px) no-repeat;
  mask:
    radial-gradient(circle 7px at 12px 12px, rgba(0,0,0,0) 96%, #000 100%) -12px -12px / 24px 24px,
    linear-gradient(#000, #000) 12px 12px / calc(100% - 24px) calc(100% - 24px) no-repeat;
  transition: transform 0.4s cubic-bezier(0.34, 1.3, 0.64, 1), filter 0.4s ease;
}
.${c} .in {
  display: grid;
  place-items: center;
  gap: 0.15rem;
  padding: 0.5rem 1.1rem;
  border: 2px solid rgba(15,23,42,0.55);
  border-radius: 0.3rem;
}
.${c} b { font-size: 1.5rem; font-weight: 800; color: #0f172a; line-height: 1; }
.${c} em {
  font-style: normal;
  font-size: 0.55rem;
  letter-spacing: 0.24em;
  color: rgba(15,23,42,0.75);
}
.${c}:hover { transform: rotate(-3deg) scale(1.05); filter: drop-shadow(0 10px 18px rgba(99,102,241,0.5)); }`
    add(mk({
      name: 'Stamp Perforation Mask',
      category: 'Masks & Clip Paths',
      description: 'A postage stamp whose perforated border is punched by uniting a repeating grid of circular holes with a solid inner rectangle, so the bites land only on the four edges; it tilts and glows when picked up.',
      html, css,
      tags: ['stamp', 'perforation', 'mask-layers', 'postage', 'punched'],
    }))
  }

  /* MK2. Torchlight — a clip-path circle travelling over hidden text */
  {
    const c = cls('v14-mk-torch')
    const html = `<div class="${c}"><span class="dim">CLASSIFIED</span><i class="hi"><span>CLASSIFIED</span></i></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 240px;
  height: 116px;
  border-radius: 0.6rem;
  overflow: hidden;
  background: linear-gradient(160deg, #131c30, #0a0f1c);
  box-shadow: inset 0 0 0 1px rgba(148,163,184,0.2);
}
.${c} span {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}
.${c} .dim { color: #22304c; }
.${c} .hi {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 50% 50%, rgba(56,189,248,0.22), rgba(56,189,248,0.1));
  -webkit-clip-path: circle(40px at 16% 50%);
  clip-path: circle(40px at 16% 50%);
  animation: ${c}-sweep 5.5s ease-in-out infinite;
}
.${c} .hi span { color: #f8fafc; text-shadow: 0 0 14px rgba(125,211,252,0.9); }
@keyframes ${c}-sweep {
  0%   { -webkit-clip-path: circle(40px at 16% 50%); clip-path: circle(40px at 16% 50%); }
  50%  { -webkit-clip-path: circle(40px at 84% 50%); clip-path: circle(40px at 84% 50%); }
  100% { -webkit-clip-path: circle(40px at 16% 50%); clip-path: circle(40px at 16% 50%); }
}`
    add(mk({
      name: 'Torchlight Reveal Mask',
      category: 'Masks & Clip Paths',
      description: 'A word sunk almost invisibly into a dark panel, legible only inside a circular clip path that drifts back and forth across it like a torch beam.',
      html, css,
      tags: ['torchlight', 'spotlight', 'clip-path', 'reveal', 'travelling'],
    }))
  }

  /* MK3. Venn exclusion — two disc mask layers composited xor */
  {
    const c = cls('v14-mk-venn')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 216px;
  height: 128px;
  background:
    radial-gradient(60% 90% at 20% 20%, rgba(250,204,21,0.85), rgba(250,204,21,0) 60%),
    linear-gradient(120deg, #f472b6, #6366f1 55%, #22d3ee);
  background-size: 140% 140%;
  background-position: 20% 50%;
  -webkit-mask-image:
    radial-gradient(circle 58px at 30% 50%, #000 97%, rgba(0,0,0,0) 100%),
    radial-gradient(circle 58px at 70% 50%, #000 97%, rgba(0,0,0,0) 100%);
  -webkit-mask-composite: xor;
  mask-image:
    radial-gradient(circle 58px at 30% 50%, #000 97%, rgba(0,0,0,0) 100%),
    radial-gradient(circle 58px at 70% 50%, #000 97%, rgba(0,0,0,0) 100%);
  mask-composite: exclude;
  transition: transform 0.5s cubic-bezier(0.34, 1.25, 0.64, 1), background-position 0.6s ease;
}
.${c}:hover { transform: rotate(6deg) scale(1.04); background-position: 80% 50%; }`
    add(mk({
      name: 'Venn Exclusion Mask',
      category: 'Masks & Clip Paths',
      description: 'Two overlapping discs composited with mask exclusion so the lens where they meet is punched clean out, leaving a pair of gradient crescents that swing and repaint on hover.',
      html, css,
      tags: ['venn', 'exclude', 'mask-composite', 'crescent', 'xor'],
    }))
  }

  /* MK4. Keyhole — circle mask unioned with a downward conic wedge */
  {
    const c = cls('v14-mk-keyhole')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 124px;
  height: 132px;
  background:
    radial-gradient(circle at 26% 24%, #fde68a, rgba(253,230,138,0) 45%),
    linear-gradient(150deg, #fb923c, #db2777 45%, #4c1d95);
  background-size: 210% 210%;
  background-position: 22% 40%;
  -webkit-mask:
    radial-gradient(circle 28px at 50% 44px, #000 97%, rgba(0,0,0,0) 100%) no-repeat,
    conic-gradient(from 171deg at 50% 44px, #000 0 18deg, rgba(0,0,0,0) 18deg) no-repeat;
  mask:
    radial-gradient(circle 28px at 50% 44px, #000 97%, rgba(0,0,0,0) 100%) no-repeat,
    conic-gradient(from 171deg at 50% 44px, #000 0 18deg, rgba(0,0,0,0) 18deg) no-repeat;
  filter: drop-shadow(0 8px 16px rgba(0,0,0,0.6));
  transition: background-position 0.7s ease, filter 0.4s ease;
}
.${c}:hover {
  background-position: 78% 70%;
  filter: drop-shadow(0 8px 22px rgba(219,39,119,0.55));
}`
    add(mk({
      name: 'Keyhole Peep Mask',
      category: 'Masks & Clip Paths',
      description: 'A gradient scene cut to an old-fashioned keyhole by uniting a circular mask with a narrow conic wedge below it, and the view pans across as you lean in on hover.',
      html, css,
      tags: ['keyhole', 'conic', 'mask-union', 'peep', 'pan'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Sliders & Carousels                                                 */
  /* ------------------------------------------------------------------ */

  /* SL1. Card fan — cards pivoting about a point below the deck */
  {
    const c = cls('v14-sl-fan')
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  position: relative;
  width: 236px;
  height: 138px;
}
.${c} i {
  position: absolute;
  left: 50%;
  top: 10px;
  width: 64px;
  height: 90px;
  margin-left: -32px;
  border-radius: 0.5rem;
  transform-origin: 50% 128px;
  box-shadow: 0 8px 18px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(226,232,240,0.28);
  transition: transform 0.5s cubic-bezier(0.34, 1.2, 0.64, 1), filter 0.5s ease;
}
.${c} i::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  top: 10px;
  height: 4px;
  border-radius: 2px;
  background: rgba(15,23,42,0.45);
}
.${c} i:nth-child(1) { background: linear-gradient(150deg, #f472b6, #9d174d); transform: rotate(-20deg); filter: brightness(0.7); }
.${c} i:nth-child(2) { background: linear-gradient(150deg, #a78bfa, #4c1d95); transform: rotate(-10deg); filter: brightness(0.85); }
.${c} i:nth-child(3) { background: linear-gradient(150deg, #38bdf8, #1d4ed8); transform: rotate(0deg); }
.${c} i:nth-child(4) { background: linear-gradient(150deg, #34d399, #065f46); transform: rotate(10deg); filter: brightness(0.85); }
.${c} i:nth-child(5) { background: linear-gradient(150deg, #fbbf24, #b45309); transform: rotate(20deg); filter: brightness(0.7); }
.${c}:hover i:nth-child(1) { transform: rotate(-38deg); filter: brightness(1); }
.${c}:hover i:nth-child(2) { transform: rotate(-19deg); filter: brightness(1); }
.${c}:hover i:nth-child(3) { transform: rotate(0deg) translateY(-12px); z-index: 2; }
.${c}:hover i:nth-child(4) { transform: rotate(19deg); filter: brightness(1); }
.${c}:hover i:nth-child(5) { transform: rotate(38deg); filter: brightness(1); }`
    add(mk({
      name: 'Card Fan Carousel',
      category: 'Sliders & Carousels',
      description: 'Five slides held like a hand of cards, pivoting about a point below the deck so they spread wide and brighten on hover while the middle card lifts clear.',
      html, css,
      tags: ['carousel', 'fan', 'cards', 'pivot', 'spread'],
    }))
  }

  /* SL2. Story reel — segmented progress bars over a slide */
  {
    const c = cls('v14-sl-story')
    const html = `<div class="${c}"><div class="bars"><i class="dn"></i><i class="dn"></i><i class="ac"><b></b></i><i></i><i></i></div><div class="hd"><span class="av"></span><span class="nm">hoverlab</span><span class="tm">2h</span></div><div class="cap">New effects wave</div></div>`
    const css = `.${c} {
  position: relative;
  width: 222px;
  height: 140px;
  padding: 8px;
  border-radius: 0.75rem;
  overflow: hidden;
  background:
    radial-gradient(80% 70% at 22% 8%, rgba(244,114,182,0.55), rgba(244,114,182,0) 60%),
    linear-gradient(155deg, #4338ca, #0b1224 70%);
  box-shadow: inset 0 0 0 1px rgba(148,163,184,0.22);
}
.${c} .bars { display: flex; gap: 4px; }
.${c} .bars i {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: rgba(226,232,240,0.25);
  overflow: hidden;
}
.${c} .bars .dn { background: #e2e8f0; }
.${c} .bars .ac b {
  display: block;
  width: 0;
  height: 100%;
  border-radius: 2px;
  background: #e2e8f0;
  animation: ${c}-fill 4s linear infinite;
}
.${c} .hd { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.55rem; }
.${c} .av {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(140deg, #fbbf24, #f43f5e);
  box-shadow: 0 0 0 2px rgba(226,232,240,0.85);
}
.${c} .nm { font-size: 0.72rem; font-weight: 600; color: #f1f5f9; }
.${c} .tm { font-size: 0.62rem; color: rgba(226,232,240,0.6); }
.${c} .cap {
  position: absolute;
  left: 10px;
  bottom: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #f8fafc;
  text-shadow: 0 2px 8px rgba(0,0,0,0.6);
}
@keyframes ${c}-fill {
  0%   { width: 0; }
  100% { width: 100%; }
}`
    add(mk({
      name: 'Story Progress Reel',
      category: 'Sliders & Carousels',
      description: 'A stories-style slide topped by five segment bars, two already spent and the third filling steadily across its track while the author strip and caption sit over the artwork.',
      html, css,
      tags: ['stories', 'carousel', 'segments', 'progress', 'autoplay'],
    }))
  }

  /* SL3. Mixer faders — a bank of five channel sliders */
  {
    const c = cls('v14-sl-mixer')
    const html = `<div class="${c}"><i class="sc"></i><div class="ch"><span class="tr"><b class="lv"></b><b class="cap"></b></span><em>1</em></div><div class="ch"><span class="tr"><b class="lv"></b><b class="cap"></b></span><em>2</em></div><div class="ch"><span class="tr"><b class="lv"></b><b class="cap"></b></span><em>3</em></div><div class="ch"><span class="tr"><b class="lv"></b><b class="cap"></b></span><em>4</em></div><div class="ch"><span class="tr"><b class="lv"></b><b class="cap"></b></span><em>5</em></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 0.6rem;
  background: linear-gradient(180deg, #1a2338, #0d1424);
  box-shadow: inset 0 0 0 1px rgba(148,163,184,0.22), 0 8px 18px rgba(0,0,0,0.5);
}
.${c} .sc {
  width: 10px;
  height: 92px;
  margin-right: 2px;
  background-image: repeating-linear-gradient(180deg, rgba(148,163,184,0.55) 0 1px, rgba(0,0,0,0) 1px 11.5px);
}
.${c} .ch { display: grid; justify-items: center; gap: 5px; width: 30px; }
.${c} .tr {
  position: relative;
  width: 6px;
  height: 92px;
  border-radius: 3px;
  background: #0a1020;
  box-shadow: inset 0 0 0 1px rgba(148,163,184,0.3), inset 0 2px 5px rgba(0,0,0,0.8);
}
.${c} .lv {
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: 1px;
  border-radius: 3px;
  background: linear-gradient(180deg, #38bdf8, #0e7490);
  transition: height 0.5s cubic-bezier(0.5, 0, 0.3, 1);
}
.${c} .cap {
  position: absolute;
  left: 50%;
  width: 26px;
  height: 12px;
  margin-left: -13px;
  border-radius: 3px;
  background: linear-gradient(180deg, #f1f5f9, #94a3b8);
  box-shadow: 0 3px 7px rgba(0,0,0,0.65);
  transition: bottom 0.5s cubic-bezier(0.5, 0, 0.3, 1), box-shadow 0.3s ease;
}
.${c} .cap::after {
  content: '';
  position: absolute;
  left: 3px;
  right: 3px;
  top: 5px;
  height: 2px;
  border-radius: 1px;
  background: #334155;
}
.${c} em { font-style: normal; font-size: 0.6rem; color: #64748b; }
.${c} .ch:nth-child(2) .cap { bottom: 58px; }
.${c} .ch:nth-child(2) .lv { height: 64px; }
.${c} .ch:nth-child(3) .cap { bottom: 30px; }
.${c} .ch:nth-child(3) .lv { height: 36px; }
.${c} .ch:nth-child(4) .cap { bottom: 70px; }
.${c} .ch:nth-child(4) .lv { height: 76px; }
.${c} .ch:nth-child(5) .cap { bottom: 16px; }
.${c} .ch:nth-child(5) .lv { height: 22px; }
.${c} .ch:nth-child(6) .cap { bottom: 46px; }
.${c} .ch:nth-child(6) .lv { height: 52px; }
.${c}:hover .ch:nth-child(2) .cap { bottom: 34px; }
.${c}:hover .ch:nth-child(2) .lv { height: 40px; }
.${c}:hover .ch:nth-child(3) .cap { bottom: 64px; }
.${c}:hover .ch:nth-child(3) .lv { height: 70px; }
.${c}:hover .ch:nth-child(4) .cap { bottom: 24px; }
.${c}:hover .ch:nth-child(4) .lv { height: 30px; }
.${c}:hover .ch:nth-child(5) .cap { bottom: 62px; }
.${c}:hover .ch:nth-child(5) .lv { height: 68px; }
.${c}:hover .ch:nth-child(6) .cap { bottom: 74px; }
.${c}:hover .ch:nth-child(6) .lv { height: 80px; }
.${c}:hover .cap { box-shadow: 0 3px 12px rgba(56,189,248,0.55); }`
    add(mk({
      name: 'Mixer Fader Bank',
      category: 'Sliders & Carousels',
      description: 'Five channel faders in a console strip, each cap riding a lit groove against a tick scale, and the whole mix re-levels itself to a new set of positions on hover.',
      html, css,
      tags: ['fader', 'mixer', 'console', 'vertical', 'levels'],
    }))
  }

  /* SL4. Wheel picker — items on a rotating 3D cylinder */
  {
    const c = cls('v14-sl-wheel')
    const html = `<div class="${c}"><div class="rl"><i>January</i><i>February</i><i>March</i><i>April</i><i>May</i><i>June</i><i>July</i></div></div>`
    const css = `.${c} {
  position: relative;
  width: 152px;
  height: 132px;
  border-radius: 0.7rem;
  overflow: hidden;
  perspective: 420px;
  background: linear-gradient(180deg, #101a30, #0a0f1c);
  box-shadow: inset 0 0 0 1px rgba(148,163,184,0.22);
  -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,0) 0, #000 20%, #000 80%, rgba(0,0,0,0) 100%);
  mask-image: linear-gradient(180deg, rgba(0,0,0,0) 0, #000 20%, #000 80%, rgba(0,0,0,0) 100%);
}
.${c} .rl {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.34, 1.15, 0.64, 1);
}
.${c} i {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 26px;
  margin-top: -13px;
  font-style: normal;
  font-size: 0.82rem;
  line-height: 26px;
  text-align: center;
  color: #e2e8f0;
  backface-visibility: hidden;
}
.${c} i:nth-child(1) { transform: rotateX(60deg) translateZ(74px); opacity: 0.2; }
.${c} i:nth-child(2) { transform: rotateX(40deg) translateZ(74px); opacity: 0.4; }
.${c} i:nth-child(3) { transform: rotateX(20deg) translateZ(74px); opacity: 0.7; }
.${c} i:nth-child(4) { transform: rotateX(0deg) translateZ(74px); color: #7dd3fc; font-weight: 700; }
.${c} i:nth-child(5) { transform: rotateX(-20deg) translateZ(74px); opacity: 0.7; }
.${c} i:nth-child(6) { transform: rotateX(-40deg) translateZ(74px); opacity: 0.4; }
.${c} i:nth-child(7) { transform: rotateX(-60deg) translateZ(74px); opacity: 0.2; }
.${c}::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  top: 50%;
  height: 30px;
  margin-top: -15px;
  border-top: 1px solid rgba(56,189,248,0.7);
  border-bottom: 1px solid rgba(56,189,248,0.7);
  background: rgba(56,189,248,0.08);
  pointer-events: none;
}
.${c}:hover .rl { transform: rotateX(20deg); }
.${c}:hover i:nth-child(4) { color: #e2e8f0; font-weight: 400; opacity: 0.7; }
.${c}:hover i:nth-child(5) { color: #7dd3fc; font-weight: 700; opacity: 1; }`
    add(mk({
      name: 'Wheel Picker Reel',
      category: 'Sliders & Carousels',
      description: 'A drum of month labels standing on a 3D cylinder, fading as they curve away from the lit selection band, and rolling on by one notch when hovered.',
      html, css,
      tags: ['picker', 'wheel', 'cylinder', '3d', 'selection'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Icons & Shapes                                                      */
  /* ------------------------------------------------------------------ */

  /* IC1. Heart — beating at rest, bursting a ring on hover */
  {
    const c = cls('v14-ic-heart')
    const html = `<div class="${c}"><b class="rg"></b><i class="ht"></i></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  cursor: pointer;
}
.${c} .ht {
  position: relative;
  width: 32px;
  height: 32px;
  background: #f43f5e;
  transform: rotate(-45deg);
  animation: ${c}-beat 2.6s ease-in-out infinite;
  transition: filter 0.3s ease;
}
.${c} .ht::before,
.${c} .ht::after {
  content: '';
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f43f5e;
}
.${c} .ht::before { top: -16px; left: 0; }
.${c} .ht::after { top: 0; right: -16px; }
.${c} .rg {
  position: absolute;
  width: 44px;
  height: 44px;
  border: 3px solid #fb7185;
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.5);
  transition: transform 0.45s cubic-bezier(0.2, 1.5, 0.5, 1), opacity 0.45s ease;
}
.${c}:hover .rg { opacity: 0.55; transform: scale(1.55); }
.${c}:hover .ht { filter: drop-shadow(0 0 12px rgba(244,63,94,0.8)); }
@keyframes ${c}-beat {
  0%, 62%, 100% { transform: rotate(-45deg) scale(1); }
  70%           { transform: rotate(-45deg) scale(1.16); }
  78%           { transform: rotate(-45deg) scale(1); }
  86%           { transform: rotate(-45deg) scale(1.12); }
}`
    add(mk({
      name: 'Heart Like Icon',
      category: 'Icons & Shapes',
      description: 'A heart built from a rotated square and two discs that gives a double beat every few seconds and throws out an expanding like-ring when hovered.',
      html, css,
      tags: ['heart', 'like', 'beat', 'burst', 'favourite'],
    }))
  }

  /* IC2. Padlock — the shackle springs open on hover */
  {
    const c = cls('v14-ic-lock')
    const html = `<div class="${c}"><i class="sh"></i><i class="bd"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 64px;
  height: 82px;
  cursor: pointer;
}
.${c} .bd {
  position: absolute;
  left: 7px;
  bottom: 4px;
  width: 50px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(180deg, #fbbf24, #b45309);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), 0 4px 10px rgba(0,0,0,0.5);
  transition: background 0.35s ease;
}
.${c} .bd::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 12px;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  border-radius: 50%;
  background: #451a03;
  box-shadow: 0 8px 0 -2px #451a03, 0 5px 0 -2.5px #451a03;
}
.${c} .sh {
  position: absolute;
  left: 16px;
  bottom: 38px;
  width: 32px;
  height: 30px;
  border: 6px solid #cbd5e1;
  border-bottom: none;
  border-radius: 16px 16px 0 0;
  transform-origin: right bottom;
  transition: transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1), border-color 0.35s ease;
}
.${c}:hover .sh { transform: translateY(-9px) rotate(14deg); border-color: #86efac; }
.${c}:hover .bd { background: linear-gradient(180deg, #4ade80, #15803d); }`
    add(mk({
      name: 'Padlock Unlock Icon',
      category: 'Icons & Shapes',
      description: 'A brass padlock whose shackle lifts and swings open about its right hinge on hover while the body turns green to confirm the unlock.',
      html, css,
      tags: ['padlock', 'unlock', 'shackle', 'security', 'toggle'],
    }))
  }

  /* IC3. Paper plane — launches and leaves a dashed trail */
  {
    const c = cls('v14-ic-plane')
    const html = `<div class="${c}"><b class="t1"></b><b class="t2"></b><b class="t3"></b><i class="pl"></i><i class="fd"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 86px;
  height: 78px;
  cursor: pointer;
}
.${c} .pl,
.${c} .fd {
  position: absolute;
  left: 26px;
  top: 20px;
  width: 42px;
  height: 42px;
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.3, 1);
}
.${c} .pl {
  background: linear-gradient(140deg, #7dd3fc, #2563eb);
  -webkit-clip-path: polygon(100% 0, 0 46%, 44% 56%, 56% 100%);
  clip-path: polygon(100% 0, 0 46%, 44% 56%, 56% 100%);
}
.${c} .fd {
  background: rgba(15,23,42,0.55);
  -webkit-clip-path: polygon(100% 0, 44% 56%, 56% 100%);
  clip-path: polygon(100% 0, 44% 56%, 56% 100%);
}
.${c} b {
  position: absolute;
  height: 3px;
  border-radius: 2px;
  background: rgba(125,211,252,0.75);
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.4s ease;
}
.${c} .t1 { left: 10px; top: 52px; width: 18px; transform: translate(6px, -6px); }
.${c} .t2 { left: 4px;  top: 60px; width: 12px; transform: translate(6px, -6px); transition-delay: 0.06s; }
.${c} .t3 { left: 16px; top: 66px; width: 9px;  transform: translate(6px, -6px); transition-delay: 0.12s; }
.${c}:hover .pl,
.${c}:hover .fd { transform: translate(12px, -12px); }
.${c}:hover b { opacity: 1; transform: translate(0, 0); }`
    add(mk({
      name: 'Paper Plane Send Icon',
      category: 'Icons & Shapes',
      description: 'A two-tone paper dart clipped from a gradient, which darts up and to the right on hover while three speed dashes settle into place behind it.',
      html, css,
      tags: ['plane', 'send', 'clip-path', 'trail', 'message'],
    }))
  }

  /* IC4. Hourglass — sand drains, then the frame flips over */
  {
    const c = cls('v14-ic-hourglass')
    const html = `<div class="${c}"><i class="gl"><b class="s1"></b><b class="fl"></b><b class="s2"></b></i><i class="cp t"></i><i class="cp b"></i><i class="po l"></i><i class="po r"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 60px;
  height: 86px;
  animation: ${c}-flip 6s ease-in-out infinite;
}
.${c} .gl {
  position: absolute;
  left: 10px;
  top: 9px;
  width: 40px;
  height: 68px;
  background: rgba(148,163,184,0.24);
  -webkit-clip-path: polygon(0 0, 100% 0, 55% 50%, 100% 100%, 0 100%, 45% 50%);
  clip-path: polygon(0 0, 100% 0, 55% 50%, 100% 100%, 0 100%, 45% 50%);
}
.${c} .s1,
.${c} .s2 {
  position: absolute;
  left: 0;
  right: 0;
  height: 34px;
  background: linear-gradient(180deg, #fcd34d, #f59e0b);
}
.${c} .s1 { top: 0; transform-origin: 50% 100%; animation: ${c}-drain 6s linear infinite; }
.${c} .s2 { bottom: 0; transform-origin: 50% 100%; animation: ${c}-heap 6s linear infinite; }
.${c} .fl {
  position: absolute;
  left: 50%;
  top: 30px;
  width: 2px;
  height: 30px;
  margin-left: -1px;
  background: #fcd34d;
  animation: ${c}-pour 6s linear infinite;
}
.${c} .cp {
  position: absolute;
  left: 0;
  width: 60px;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(180deg, #cbd5e1, #64748b);
}
.${c} .cp.t { top: 0; }
.${c} .cp.b { bottom: 0; }
.${c} .po {
  position: absolute;
  top: 6px;
  width: 4px;
  height: 74px;
  border-radius: 2px;
  background: linear-gradient(90deg, #94a3b8, #475569);
}
.${c} .po.l { left: 3px; }
.${c} .po.r { right: 3px; }
@keyframes ${c}-drain {
  0%        { transform: scaleY(1); }
  80%, 100% { transform: scaleY(0); }
}
@keyframes ${c}-heap {
  0%        { transform: scaleY(0); }
  80%, 100% { transform: scaleY(1); }
}
@keyframes ${c}-pour {
  0%, 3%    { opacity: 0; }
  8%, 74%   { opacity: 1; }
  80%, 100% { opacity: 0; }
}
@keyframes ${c}-flip {
  0%, 86% { transform: rotate(0deg); }
  100%    { transform: rotate(180deg); }
}`
    add(mk({
      name: 'Hourglass Timer Icon',
      category: 'Icons & Shapes',
      description: 'A framed hourglass whose upper chamber empties through a thin stream into the heap below, and once the sand has run through the whole frame turns over to start again.',
      html, css,
      tags: ['hourglass', 'timer', 'sand', 'flip', 'countdown'],
    }))
  }
}
