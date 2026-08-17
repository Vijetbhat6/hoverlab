// scripts/generate-effects-v10.mjs
//
// Tenth wave: a fifth pair of template families per category — twenty
// more each, 640 in total, on top of the 2,560 that v6–v9 added.
//
// Read the v9 header first; this one continues its accounting. The
// three-group split it introduced has shifted, and not in a good
// direction:
//
//   Still genuinely short — Charts & Data, Tables & Data Grids, Forms &
//   Validation, Micro-interactions, Timelines & Steps. A bullet chart, a
//   treemap, a resizable-column table, a phone field with a country
//   select, a signature pad and a delivery tracker are all shapes the
//   catalog could not draw before today. These carry the wave.
//
//   Thinning — Buttons, Cards, Loaders, Navigation, Modals, Text, Icons,
//   Masks, Patterns, Backgrounds, Inputs, Toggles, Tooltips, Sliders,
//   3D, Accordions, Alerts, Avatars, Entrance, Filters, Glow. Still real
//   shapes (Newton's cradle, split-flap board, brick bond, gooey button,
//   rotary knob), but the search each one took was noticeably longer
//   than in v9.
//
//   Out of distinct shapes — Dividers & Separators, Badges & Tags,
//   Skeletons & Shimmers, Borders & Outlines, and now Progress & Meters
//   and Scroll & Sticky have joined them. Six categories. What follows in
//   those is a wave divider, a stitched rule, a split badge, a map
//   skeleton, a sketch border, a needle dial and a scroll-shadow
//   container. Each is a defensible entry and none is a discovery. The
//   per-family comments say so where it applies rather than leaving the
//   reader to work it out.
//
// This wave was run across all 32 categories at explicit request, after
// the weighting recommendation was declined twice. That is a legitimate
// call — uniform depth has its own value — but the honest summary is
// that roughly a fifth of v10 is variation on what is already there.
//
// Same arithmetic throughout: `GRADPAIRS` (12) + `TRIOS` (8) = 20 per
// category. Tokens and helpers from generate-effects.mjs, dark preview
// surface, guards applied at assembly by `withMotionGuard`.
//
// Two constraints worth restating:
//   - The assembled guard collapses an animation to 1ms and runs it ONCE,
//     so every infinite keyframe below rests where its 100% stop puts it.
//   - Any @property registration is GLOBAL. Names are scoped to the
//     effect's own class, because these snippets get pasted into pages
//     that may already use a short custom property name.

import { rgbOf } from './generate-effects-modern.mjs'

export function generateV10(ctx) {
  const { GRADPAIRS, TRIOS, cls, mk, add } = ctx

  /* ============================================================
   *  3D & PERSPECTIVE — hardcover book opening  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-3d-book-${g.name}`)
    const html = `<div class="${c}"><div class="bk"><i class="pg"></i><i class="cov"><b>ATLAS</b></i></div></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 190px;
  height: 150px;
  perspective: 720px;
}
.${c} .bk {
  position: relative;
  width: 96px;
  height: 126px;
  transform-style: preserve-3d;
}
.${c} .pg {
  position: absolute;
  inset: 0;
  border-radius: 0.2rem 0.4rem 0.4rem 0.2rem;
  background: #e2e8f0;
  background-image: repeating-linear-gradient(180deg, #cbd5e1 0 1px, transparent 1px 9px);
  box-shadow: inset 8px 0 12px rgba(15,23,42,0.16);
}
.${c} .cov {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 0.2rem 0.4rem 0.4rem 0.2rem;
  background: linear-gradient(125deg, ${g.a}, ${g.b});
  box-shadow: 0 10px 26px rgba(${rgbOf(g.a)}, 0.35);
  transform-origin: left center;
  transform: rotateY(0deg);
  transition: transform 0.75s cubic-bezier(0.55, 0.05, 0.25, 1), box-shadow 0.75s ease;
  backface-visibility: hidden;
}
.${c} .cov b {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  color: rgba(11,17,32,0.75);
}
.${c}:hover .cov {
  transform: rotateY(-142deg);
  box-shadow: 0 18px 34px rgba(0,0,0,0.45);
}`
    add(mk({
      name: `${g.name} Book Cover`,
      category: '3D & Perspective',
      description: `Hardcover hinged at the spine rather than the page edge, so it swings past 90 degrees and lies back against itself the way a real cover does.`,
      html, css,
      tags: ['3d', 'book', 'cover', 'hinge', 'rotatey', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  3D & PERSPECTIVE — wireframe globe  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-3d-globe-${t.name}`)
    const html = `<div class="${c}"><div class="gl"><i></i><i></i><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 150px;
  height: 150px;
  perspective: 600px;
}
.${c} .gl {
  position: relative;
  width: 112px;
  height: 112px;
  border-radius: 50%;
  transform-style: preserve-3d;
  box-shadow: inset 0 0 34px rgba(${rgbOf(t.b)}, 0.28), 0 0 30px rgba(${rgbOf(t.a)}, 0.22);
  animation: ${c}-spin 9s linear infinite;
}
@keyframes ${c}-spin {
  from { transform: rotateX(-16deg) rotateY(0deg); }
  to   { transform: rotateX(-16deg) rotateY(360deg); }
}
.${c} .gl i {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid ${t.b};
  transform-style: preserve-3d;
}
.${c} .gl i:nth-child(1) { transform: rotateY(0deg);   border-color: ${t.a}; }
.${c} .gl i:nth-child(2) { transform: rotateY(36deg);  border-color: ${t.b}; }
.${c} .gl i:nth-child(3) { transform: rotateY(72deg);  border-color: ${t.c}; }
.${c} .gl i:nth-child(4) { transform: rotateY(108deg); border-color: ${t.b}; }
.${c} .gl i:nth-child(5) { transform: rotateY(144deg); border-color: ${t.a}; }
.${c} .gl::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 0;
  border-top: 1.5px solid ${t.c};
  opacity: 0.7;
}`
    add(mk({
      name: `${t.name} Wireframe Globe`,
      category: '3D & Perspective',
      description: `Five circles sharing a centre at even yaw offsets, which reads as a meridian cage once the whole group rotates — no sphere primitive required.`,
      html, css,
      tags: ['3d', 'globe', 'wireframe', 'sphere', 'rotate', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ACCORDIONS & TABS — changelog release accordion  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-acc-changelog-${g.name}`)
    const html = `<div class="${c}"><details open><summary><b>v2.4.0</b><i class="tag new">Feature</i><em>Aug 12</em></summary><ul><li>Radar and waterfall charts</li><li>Grouped table rows</li></ul></details><details><summary><b>v2.3.1</b><i class="tag fix">Fix</i><em>Aug 4</em></summary><ul><li>Duplicate effect names</li></ul></details></div>`
    const css = `.${c} {
  width: 240px;
  padding: 0.2rem 0.65rem;
  border-radius: 0.55rem;
  background: #0f172a;
  border: 1px solid #1e293b;
}
.${c} details { border-bottom: 1px solid #1e293b; }
.${c} details:last-child { border-bottom: none; }
.${c} summary {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0;
  cursor: pointer;
  list-style: none;
}
.${c} summary::-webkit-details-marker { display: none; }
.${c} summary b {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  font-weight: 650;
  color: #f1f5f9;
}
.${c} .tag {
  padding: 0.06rem 0.34rem;
  border-radius: 999px;
  font-size: 0.58rem;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #0b1120;
}
.${c} .new { background: linear-gradient(135deg, ${g.a}, ${g.b}); }
.${c} .fix { background: #475569; color: #e2e8f0; }
.${c} summary em {
  margin-left: auto;
  font-style: normal;
  font-size: 0.64rem;
  color: #475569;
}
.${c} ul {
  margin: 0;
  padding: 0 0 0.6rem 0.9rem;
  list-style: none;
}
.${c} li {
  position: relative;
  padding: 0.16rem 0;
  font-size: 0.72rem;
  color: #94a3b8;
}
.${c} li::before {
  content: '';
  position: absolute;
  left: -0.7rem;
  top: 0.6rem;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: ${g.b};
}`
    add(mk({
      name: `${g.name} Changelog Accordion`,
      category: 'Accordions & Tabs',
      description: `Release entries folded by version, each summary carrying its own change-type tag and ship date so the history is readable without opening a single panel.`,
      html, css,
      tags: ['accordion', 'changelog', 'release notes', 'versions', 'details', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ACCORDIONS & TABS — sliding panel track  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-acc-sliding-${t.name}`)
    const html = `<div class="${c}"><div class="tb"><span class="on">Overview</span><span>Specs</span><span>Reviews</span></div><div class="vp"><div class="tr"><div class="pn"><b>Overview</b><i></i><i class="s"></i></div><div class="pn"><b>Specs</b><i></i><i class="s"></i></div><div class="pn"><b>Reviews</b><i></i><i class="s"></i></div></div></div></div>`
    const css = `.${c} {
  width: 236px;
  border-radius: 0.55rem;
  overflow: hidden;
  background: #0f172a;
  border: 1px solid #1e293b;
}
.${c} .tb {
  display: flex;
  border-bottom: 1px solid #1e293b;
}
.${c} .tb span {
  flex: 1;
  padding: 0.5rem 0;
  text-align: center;
  font-size: 0.72rem;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.18s ease, border-color 0.18s ease;
}
.${c} .tb .on {
  color: #f1f5f9;
  border-bottom-color: ${t.b};
}
.${c}:hover .tb .on { color: #64748b; border-bottom-color: transparent; }
.${c}:hover .tb span:nth-child(2) { color: #f1f5f9; border-bottom-color: ${t.c}; }
.${c} .vp { overflow: hidden; }
.${c} .tr {
  display: flex;
  width: 300%;
  transition: transform 0.42s cubic-bezier(0.5, 0, 0.2, 1);
}
.${c}:hover .tr { transform: translateX(-33.333%); }
.${c} .pn {
  display: grid;
  gap: 0.45rem;
  width: 33.333%;
  padding: 0.7rem 0.75rem 0.9rem;
}
.${c} .pn b { font-size: 0.76rem; font-weight: 650; color: #e2e8f0; }
.${c} .pn i {
  height: 8px;
  border-radius: 3px;
  background: #1e293b;
}
.${c} .pn .s {
  width: 62%;
  background: linear-gradient(90deg, ${t.a}, ${t.c});
  opacity: 0.55;
}`
    add(mk({
      name: `${t.name} Sliding Panels`,
      category: 'Accordions & Tabs',
      description: `Panels laid end to end on one track that translates by a third per tab, so switching moves horizontally instead of cross-fading in place.`,
      html, css,
      tags: ['tabs', 'sliding', 'panels', 'track', 'transition', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ALERTS & TOASTS — mention notification toast  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-alert-mention-${g.name}`)
    const html = `<div class="${c}"><i class="av">AL</i><div class="bd"><b>Ada Lovelace<span> mentioned you</span></b><p>“can you take the <em>@catalog</em> pass?”</p><div class="ac"><button class="p">Reply</button><button>Mute</button></div></div><i class="cl"></i></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  gap: 0.55rem;
  width: 288px;
  padding: 0.65rem 0.7rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
  box-shadow: 0 16px 36px rgba(0,0,0,0.5);
}
.${c} .av {
  flex: none;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 0.65rem;
  font-style: normal;
  font-weight: 700;
  color: #0b1120;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c} .bd { display: grid; gap: 0.2rem; min-width: 0; }
.${c} .bd b { font-size: 0.76rem; font-weight: 650; color: #f1f5f9; }
.${c} .bd b span { font-weight: 400; color: #64748b; }
.${c} .bd p {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.45;
  color: #94a3b8;
}
.${c} .bd em {
  font-style: normal;
  color: ${g.b};
}
.${c} .ac { display: flex; gap: 0.3rem; margin-top: 0.25rem; }
.${c} .ac button {
  padding: 0.22rem 0.5rem;
  border-radius: 0.3rem;
  border: 1px solid #334155;
  background: transparent;
  font-size: 0.68rem;
  color: #94a3b8;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} .ac button:hover { background: #1e293b; color: #e2e8f0; }
.${c} .ac .p {
  border-color: transparent;
  font-weight: 650;
  color: #0b1120;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c} .cl {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  width: 12px;
  height: 12px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.16s ease;
}
.${c}:hover .cl { opacity: 1; }
.${c} .cl::before,
.${c} .cl::after {
  content: '';
  position: absolute;
  left: 0;
  top: 5px;
  width: 12px;
  height: 1.5px;
  background: #94a3b8;
}
.${c} .cl::before { transform: rotate(45deg); }
.${c} .cl::after  { transform: rotate(-45deg); }`
    add(mk({
      name: `${g.name} Mention Toast`,
      category: 'Alerts & Toasts',
      description: `Social notification carrying who, what they said and two ways to respond, sized so the quoted line can wrap without pushing the actions off the card.`,
      html, css,
      tags: ['toast', 'mention', 'notification', 'social', 'actions', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ALERTS & TOASTS — cookie preferences panel  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-alert-consent-${t.name}`)
    const html = `<div class="${c}"><b class="ti">Cookie preferences</b><label class="rw"><span>Essential<em>Always on</em></span><i class="sw on lock"></i></label><label class="rw"><span>Analytics<em>Usage and performance</em></span><i class="sw on"></i></label><label class="rw"><span>Marketing<em>Personalised ads</em></span><i class="sw"></i></label><div class="ft"><button>Reject all</button><button class="p">Save</button></div></div>`
    const css = `.${c} {
  width: 268px;
  padding: 0.75rem 0.8rem 0.7rem;
  border-radius: 0.6rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  box-shadow: 0 18px 40px rgba(0,0,0,0.5);
}
.${c} .ti {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  font-weight: 650;
  color: #f1f5f9;
}
.${c} .rw {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0;
  border-top: 1px solid #1e293b;
  cursor: pointer;
}
.${c} .rw span {
  display: grid;
  gap: 0.05rem;
  font-size: 0.74rem;
  color: #e2e8f0;
}
.${c} .rw em {
  font-style: normal;
  font-size: 0.63rem;
  color: #64748b;
}
.${c} .sw {
  position: relative;
  flex: none;
  margin-left: auto;
  width: 32px;
  height: 18px;
  border-radius: 999px;
  background: #334155;
  transition: background 0.24s ease;
}
.${c} .sw::after {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #f8fafc;
  transition: transform 0.24s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} .sw.on { background: linear-gradient(135deg, ${t.b}, ${t.c}); }
.${c} .sw.on::after { transform: translateX(14px); }
.${c} .sw.lock { opacity: 0.55; cursor: not-allowed; }
.${c} .ft {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.6rem;
}
.${c} .ft button {
  flex: 1;
  padding: 0.4rem;
  border-radius: 0.4rem;
  border: 1px solid #334155;
  background: transparent;
  font-size: 0.72rem;
  color: #94a3b8;
  cursor: pointer;
  transition: background 0.16s ease;
}
.${c} .ft button:hover { background: #1e293b; }
.${c} .ft .p {
  border-color: transparent;
  font-weight: 650;
  color: #0b1120;
  background: linear-gradient(135deg, ${t.a}, ${t.b});
}`
    add(mk({
      name: `${t.name} Consent Panel`,
      category: 'Alerts & Toasts',
      description: `Per-category cookie controls rather than one accept button, with the essential row switched on and visibly locked so the choice that is not a choice reads as such.`,
      html, css,
      tags: ['consent', 'cookies', 'privacy', 'preferences', 'gdpr', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  AVATARS & IMAGES — fanned photo stack  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-avatar-fan-${g.name}`)
    const html = `<div class="${c}"><i class="p p3"></i><i class="p p2"></i><i class="p p1"></i></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 210px;
  height: 150px;
}
.${c} .p {
  position: absolute;
  width: 96px;
  height: 116px;
  border-radius: 0.45rem;
  border: 3px solid #f8fafc;
  box-shadow: 0 8px 20px rgba(0,0,0,0.45);
  transform-origin: 50% 100%;
  transition: transform 0.42s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.${c} .p1 {
  background: linear-gradient(150deg, ${g.a}, ${g.b});
  transform: rotate(0deg);
  z-index: 3;
}
.${c} .p2 {
  background: linear-gradient(150deg, ${g.b}, #1e293b);
  transform: rotate(0deg);
  z-index: 2;
}
.${c} .p3 {
  background: linear-gradient(150deg, #334155, ${g.a});
  transform: rotate(0deg);
  z-index: 1;
}
.${c}:hover .p1 { transform: rotate(-13deg) translateX(-34px); }
.${c}:hover .p2 { transform: rotate(1deg)  translateY(-6px); }
.${c}:hover .p3 { transform: rotate(15deg)  translateX(34px); }`
    add(mk({
      name: `${g.name} Photo Fan`,
      category: 'Avatars & Images',
      description: `Three prints squared up as one pile that spread from a shared bottom pivot, so the fan opens like a hand of cards rather than sliding apart in parallel.`,
      html, css,
      tags: ['image', 'stack', 'fan', 'photos', 'spread', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  AVATARS & IMAGES — broken image fallback  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-avatar-broken-${t.name}`)
    const html = `<div class="${c}"><i class="ic"><b class="mt"></b><b class="sun"></b><b class="tear"></b></i><span>Image unavailable</span><em>hero-4x.avif</em></div>`
    const css = `.${c} {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 0.28rem;
  width: 214px;
  height: 136px;
  border-radius: 0.55rem;
  border: 1.5px dashed #334155;
  background: repeating-linear-gradient(45deg, #0f172a 0 8px, #101c33 8px 16px);
}
.${c} .ic {
  position: relative;
  width: 44px;
  height: 34px;
  margin-bottom: 0.2rem;
  border-radius: 0.28rem;
  border: 2px solid ${t.b};
  overflow: hidden;
}
.${c} .mt {
  position: absolute;
  left: 4px;
  bottom: 0;
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 15px solid ${t.a};
}
.${c} .sun {
  position: absolute;
  right: 6px;
  top: 5px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${t.c};
}
.${c} .tear {
  position: absolute;
  left: 50%;
  top: -4px;
  width: 2px;
  height: 42px;
  margin-left: -1px;
  background: #0b1120;
  transform: rotate(12deg);
  box-shadow: 2px 0 0 ${t.b};
}
.${c} span { font-size: 0.74rem; color: #94a3b8; }
.${c} em {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-style: normal;
  font-size: 0.62rem;
  color: #475569;
}`
    add(mk({
      name: `${t.name} Broken Image`,
      category: 'Avatars & Images',
      description: `The state every gallery eventually shows and few designs draw — a torn picture glyph over a hatched field, with the filename kept so the failure is diagnosable.`,
      html, css,
      tags: ['image', 'broken', 'fallback', 'error', 'placeholder', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BACKGROUNDS — constellation network  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-bg-constellation-${g.name}`)
    const html = `<div class="${c}"><i class="ln"></i><i class="dt"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 250px;
  height: 150px;
  overflow: hidden;
  border-radius: 0.55rem;
  background: radial-gradient(80% 100% at 50% 0%, #101c33, #05070f);
}
.${c} i { position: absolute; inset: -10%; }
.${c} .ln {
  background-image:
    repeating-linear-gradient(28deg,  rgba(${rgbOf(g.b)}, 0.22) 0 1px, transparent 1px 46px),
    repeating-linear-gradient(-52deg, rgba(${rgbOf(g.a)}, 0.18) 0 1px, transparent 1px 58px),
    repeating-linear-gradient(86deg,  rgba(${rgbOf(g.b)}, 0.14) 0 1px, transparent 1px 72px);
  animation: ${c}-drift 14s ease-in-out infinite;
}
.${c} .dt {
  background-image:
    radial-gradient(circle, ${g.a} 1.6px, transparent 2px),
    radial-gradient(circle, ${g.b} 1.2px, transparent 1.6px);
  background-size: 46px 46px, 58px 58px;
  background-position: 12px 8px, 30px 26px;
  filter: drop-shadow(0 0 4px rgba(${rgbOf(g.a)}, 0.7));
  animation: ${c}-drift 14s ease-in-out infinite;
}
@keyframes ${c}-drift {
  0%, 100% { transform: translate(0, 0); }
  50%      { transform: translate(-14px, 10px); }
}`
    add(mk({
      name: `${g.name} Constellation Net`,
      category: 'Backgrounds',
      description: `Node field and its link mesh built as two gradient layers on matching cell sizes and moved together, so the dots stay on the lines without a single positioned element.`,
      html, css,
      tags: ['background', 'constellation', 'network', 'nodes', 'particles', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BACKGROUNDS — rotating sunburst rays  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-bg-sunburst-${t.name}`)
    const html = `<div class="${c}"><i class="ry"></i><i class="hz"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 250px;
  height: 150px;
  overflow: hidden;
  border-radius: 0.55rem;
  background: linear-gradient(180deg, #0b1224, #05070f);
}
.${c} .ry {
  position: absolute;
  left: 50%;
  top: 78%;
  width: 340px;
  height: 340px;
  margin: -170px 0 0 -170px;
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    rgba(${rgbOf(t.a)}, 0.34) 0deg 7deg,
    transparent 7deg 18deg
  );
  animation: ${c}-turn 26s linear infinite;
}
@keyframes ${c}-turn {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.${c} .hz {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 40% at 50% 78%, rgba(${rgbOf(t.c)}, 0.5), transparent 70%),
    linear-gradient(180deg, transparent 40%, rgba(5,7,15,0.9));
}`
    add(mk({
      name: `${t.name} Sunburst Rays`,
      category: 'Backgrounds',
      description: `Repeating conic wedges anchored below the frame so only the upper fan is visible, turning slowly under a radial haze that keeps the hub from reading as a hard point.`,
      html, css,
      tags: ['background', 'sunburst', 'rays', 'conic', 'radial', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BADGES & TAGS — split label/value badge  (12)
   *  Exhausted category: this is a real form (the shields.io
   *  two-tone badge) but it is a badge variant, not a discovery.
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-badge-split-${g.name}`)
    const html = `<span class="${c}"><i class="k">build</i><i class="v">passing</i></span>`
    const css = `.${c} {
  display: inline-flex;
  border-radius: 0.28rem;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  font-style: normal;
  line-height: 1;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.${c} i {
  padding: 0.32rem 0.45rem;
  font-style: normal;
}
.${c} .k {
  color: #cbd5e1;
  background: #334155;
}
.${c} .v {
  font-weight: 650;
  color: #0b1120;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c}:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(${rgbOf(g.a)}, 0.35);
}`
    add(mk({
      name: `${g.name} Split Badge`,
      category: 'Badges & Tags',
      description: `Two-cell status badge with a neutral key against a coloured value, the pairing that makes a wall of these scannable down the value column alone.`,
      html, css,
      tags: ['badge', 'split', 'status', 'shield', 'monospace', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BADGES & TAGS — price tag with eyelet  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-badge-pricetag-${t.name}`)
    const html = `<span class="${c}"><i class="hole"></i>$24.00</span>`
    const css = `.${c} {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.34rem 0.6rem 0.34rem 1.15rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0b1120;
  background: linear-gradient(115deg, ${t.a}, ${t.b} 55%, ${t.c});
  clip-path: polygon(11px 0, 100% 0, 100% 100%, 11px 100%, 0 50%);
  transition: transform 0.24s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} .hole {
  position: absolute;
  left: 13px;
  top: 50%;
  width: 6px;
  height: 6px;
  margin-top: -3px;
  border-radius: 50%;
  background: #0b1120;
}
.${c}:hover { transform: rotate(-3deg) translateX(-2px); }`
    add(mk({
      name: `${t.name} Price Tag`,
      category: 'Badges & Tags',
      description: `Retail swing-ticket silhouette — pointed left end cut by clip-path with a punched eyelet — tilting on hover as though hanging from the hole.`,
      html, css,
      tags: ['badge', 'price tag', 'retail', 'clip-path', 'ecommerce', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BORDERS & OUTLINES — hand-drawn sketch frame  (12)
   *  Exhausted category: a texture treatment of a border rather
   *  than a new border mechanism.
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-border-sketch-${g.name}`)
    const html = `<div class="${c}"><b>Draft</b><p>Rough edges on purpose.</p></div>`
    const css = `.${c} {
  position: relative;
  width: 208px;
  padding: 0.85rem 0.9rem;
  background: #0b1120;
  border: 2px solid ${g.a};
  border-radius: 255px 12px 225px 15px / 15px 225px 12px 255px;
  transition: border-radius 0.4s ease, transform 0.3s ease;
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1.5px solid ${g.b};
  border-radius: 12px 245px 18px 235px / 235px 15px 255px 14px;
  opacity: 0.65;
  pointer-events: none;
}
.${c} b {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #f1f5f9;
}
.${c} p {
  margin: 0;
  font-size: 0.73rem;
  line-height: 1.5;
  color: #94a3b8;
}
.${c}:hover {
  border-radius: 225px 15px 255px 12px / 12px 255px 15px 225px;
  transform: rotate(-0.5deg);
}`
    add(mk({
      name: `${g.name} Sketch Frame`,
      category: 'Borders & Outlines',
      description: `Wobbly ink frame from asymmetric elliptical border-radii doubled at an offset, the two strokes disagreeing just enough to read as drawn rather than computed.`,
      html, css,
      tags: ['border', 'sketch', 'hand-drawn', 'wobble', 'doodle', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BORDERS & OUTLINES — folder tab border  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-border-foldertab-${t.name}`)
    const html = `<div class="${c}"><i class="tab">ACTIVE</i><p>Contents of the selected folder.</p></div>`
    const css = `.${c} {
  position: relative;
  width: 212px;
  margin-top: 20px;
  padding: 0.85rem 0.85rem 0.9rem;
  border: 1.5px solid ${t.b};
  border-radius: 0 0.45rem 0.45rem 0.45rem;
  background: #0b1120;
  transition: border-color 0.24s ease;
}
.${c} .tab {
  position: absolute;
  left: -1.5px;
  top: -20px;
  padding: 0.22rem 0.75rem 0.2rem 0.5rem;
  border: 1.5px solid ${t.b};
  border-bottom: none;
  border-radius: 0.4rem 0.7rem 0 0;
  background: #0b1120;
  font-size: 0.6rem;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.09em;
  color: ${t.a};
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 100%, 0 100%);
  transition: color 0.24s ease, transform 0.24s ease;
}
.${c} .tab::after {
  content: '';
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: -1.5px;
  height: 1.5px;
  background: #0b1120;
}
.${c} p {
  margin: 0;
  font-size: 0.73rem;
  line-height: 1.55;
  color: #94a3b8;
}
.${c}:hover { border-color: ${t.c}; }
.${c}:hover .tab { color: ${t.c}; transform: translateY(-2px); }`
    add(mk({
      name: `${t.name} Folder Tab`,
      category: 'Borders & Outlines',
      description: `Manila-folder outline where the tab's bottom stroke is painted out to join the panel, so the two shapes share one continuous border instead of stacking.`,
      html, css,
      tags: ['border', 'folder', 'tab', 'file', 'outline', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BUTTONS — gooey merge button  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-btn-gooey-${g.name}`)
    const html = `<div class="${c}"><div class="goo"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div><span>Deploy</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 168px;
  height: 52px;
  cursor: pointer;
}
.${c} .goo {
  position: absolute;
  inset: 0;
  filter: blur(7px) contrast(22);
}
.${c} .goo i {
  position: absolute;
  top: 50%;
  border-radius: 999px;
  background: ${g.a};
  transition: transform 0.5s cubic-bezier(0.34, 1.3, 0.64, 1), width 0.5s ease;
}
.${c} .b1 {
  left: 50%;
  width: 108px;
  height: 34px;
  margin: -17px 0 0 -54px;
}
.${c} .b2,
.${c} .b3 {
  width: 22px;
  height: 22px;
  margin-top: -11px;
}
.${c} .b2 { left: 32px; }
.${c} .b3 { right: 32px; }
.${c}:hover .b1 { width: 132px; margin-left: -66px; }
.${c}:hover .b2 { transform: translateX(-18px) scale(1.15); }
.${c}:hover .b3 { transform: translateX(18px) scale(1.15); }
.${c} span {
  position: relative;
  z-index: 1;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #0b1120;
}`
    add(mk({
      name: `${g.name} Gooey Button`,
      category: 'Buttons',
      description: `Metaball effect from blur plus extreme contrast on a shared layer, so the two satellites stretch a liquid neck as they separate instead of simply moving apart.`,
      html, css,
      tags: ['button', 'gooey', 'metaball', 'blur', 'contrast', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  BUTTONS — mechanical keycap  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-btn-keycap-${t.name}`)
    const html = `<button class="${c}"><i class="top">⌘K</i></button>`
    const css = `.${c} {
  position: relative;
  width: 76px;
  height: 66px;
  padding: 0;
  border: none;
  border-radius: 0.55rem;
  cursor: pointer;
  background: linear-gradient(180deg, ${t.b}, ${t.a});
  box-shadow: 0 7px 0 rgba(${rgbOf(t.a)}, 0.55), 0 10px 18px rgba(0,0,0,0.45);
  transition: transform 0.09s ease, box-shadow 0.09s ease;
}
.${c} .top {
  position: absolute;
  inset: 4px 4px 10px 4px;
  display: grid;
  place-items: center;
  border-radius: 0.4rem;
  background: linear-gradient(180deg, #1e293b, #0f172a);
  box-shadow: inset 0 1px 0 rgba(248,250,252,0.12);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.86rem;
  font-style: normal;
  font-weight: 650;
  color: ${t.c};
}
.${c}:active {
  transform: translateY(6px);
  box-shadow: 0 1px 0 rgba(${rgbOf(t.a)}, 0.55), 0 3px 8px rgba(0,0,0,0.45);
}
.${c}:hover .top { color: #f8fafc; }`
    add(mk({
      name: `${t.name} Keycap Button`,
      category: 'Buttons',
      description: `Physical key with its travel in the shadow rather than the transform — the stem shortens as the cap descends, so the press bottoms out instead of sliding.`,
      html, css,
      tags: ['button', 'keycap', 'keyboard', 'press', 'skeuomorphic', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CARDS — weather forecast card  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-card-weather-${g.name}`)
    const html = `<article class="${c}"><div class="hd"><div class="nw"><b>18°</b><span>Lisbon · Clear</span></div><i class="sun"><em></em></i></div><div class="fc"><span><em>Thu</em><i></i>21°</span><span><em>Fri</em><i></i>19°</span><span><em>Sat</em><i></i>17°</span><span><em>Sun</em><i></i>22°</span></div></article>`
    const css = `.${c} {
  width: 236px;
  padding: 0.8rem 0.85rem 0.7rem;
  border-radius: 0.7rem;
  background: linear-gradient(160deg, ${g.b}, #0b1120 78%);
  border: 1px solid rgba(${rgbOf(g.a)}, 0.28);
  transition: transform 0.26s ease;
}
.${c}:hover { transform: translateY(-3px); }
.${c} .hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.${c} .nw b {
  display: block;
  font-size: 2.1rem;
  font-weight: 300;
  line-height: 1;
  color: #f8fafc;
}
.${c} .nw span {
  font-size: 0.68rem;
  color: rgba(248,250,252,0.65);
}
.${c} .sun {
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${g.a};
  box-shadow: 0 0 22px rgba(${rgbOf(g.a)}, 0.75);
  animation: ${c}-pulse 4s ease-in-out infinite;
}
@keyframes ${c}-pulse {
  0%, 100% { box-shadow: 0 0 18px rgba(${rgbOf(g.a)}, 0.6); }
  50%      { box-shadow: 0 0 30px rgba(${rgbOf(g.a)}, 0.9); }
}
.${c} .fc {
  display: flex;
  justify-content: space-between;
  margin-top: 0.75rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(248,250,252,0.12);
}
.${c} .fc span {
  display: grid;
  justify-items: center;
  gap: 0.22rem;
  font-size: 0.72rem;
  color: #f8fafc;
}
.${c} .fc em {
  font-style: normal;
  font-size: 0.6rem;
  color: rgba(248,250,252,0.5);
}
.${c} .fc i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: ${g.a};
  opacity: 0.85;
}`
    add(mk({
      name: `${g.name} Weather Card`,
      category: 'Cards',
      description: `Current conditions weighted large over a four-day strip, the whole panel tinted by the same hue as the sun mark so the card reads as one sky rather than a chart.`,
      html, css,
      tags: ['card', 'weather', 'forecast', 'widget', 'temperature', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CARDS — now playing card  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-card-nowplaying-${t.name}`)
    const html = `<article class="${c}"><i class="art"></i><div class="mt"><b>Sundial</b><span>Kiasmos</span><div class="wv"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div><button class="pp"><i></i><i></i></button></article>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 246px;
  padding: 0.6rem 0.65rem;
  border-radius: 0.6rem;
  background: #111827;
  border: 1px solid #1f2937;
  transition: border-color 0.24s ease;
}
.${c}:hover { border-color: ${t.b}; }
.${c} .art {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 0.4rem;
  background:
    radial-gradient(70% 70% at 30% 25%, ${t.a}, transparent 70%),
    linear-gradient(140deg, ${t.b}, ${t.c});
}
.${c} .mt { display: grid; gap: 0.1rem; min-width: 0; flex: 1; }
.${c} .mt b {
  font-size: 0.78rem;
  font-weight: 650;
  color: #f1f5f9;
}
.${c} .mt > span {
  font-size: 0.67rem;
  color: #64748b;
}
.${c} .wv {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 15px;
  margin-top: 0.2rem;
}
.${c} .wv i {
  width: 2.5px;
  border-radius: 1px;
  background: linear-gradient(180deg, ${t.a}, ${t.c});
  animation: ${c}-eq 1.1s ease-in-out infinite;
}
@keyframes ${c}-eq {
  0%, 100% { height: 4px; }
  50%      { height: 15px; }
}
.${c} .wv i:nth-child(1)  { animation-delay: 0s; }
.${c} .wv i:nth-child(2)  { animation-delay: -0.9s; }
.${c} .wv i:nth-child(3)  { animation-delay: -0.4s; }
.${c} .wv i:nth-child(4)  { animation-delay: -0.7s; }
.${c} .wv i:nth-child(5)  { animation-delay: -0.2s; }
.${c} .wv i:nth-child(6)  { animation-delay: -1s; }
.${c} .wv i:nth-child(7)  { animation-delay: -0.5s; }
.${c} .wv i:nth-child(8)  { animation-delay: -0.15s; }
.${c} .wv i:nth-child(9)  { animation-delay: -0.8s; }
.${c} .wv i:nth-child(10) { animation-delay: -0.35s; }
.${c} .wv i:nth-child(11) { animation-delay: -0.65s; }
.${c} .wv i:nth-child(12) { animation-delay: -0.25s; }
.${c} .pp {
  flex: none;
  display: grid;
  grid-auto-flow: column;
  gap: 3px;
  place-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: linear-gradient(135deg, ${t.b}, ${t.c});
  transition: transform 0.18s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} .pp i {
  width: 3px;
  height: 12px;
  border-radius: 1px;
  background: #0b1120;
}
.${c} .pp:hover { transform: scale(1.1); }`
    add(mk({
      name: `${t.name} Now Playing`,
      category: 'Cards',
      description: `Player row where the level meter runs on negative animation delays, so the twelve bars start mid-cycle and never line up into a visible wave.`,
      html, css,
      tags: ['card', 'music', 'now playing', 'waveform', 'player', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CHARTS & DATA — bullet chart  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-chart-bullet-${g.name}`)
    const html = `<div class="${c}"><div class="rw"><em>Revenue</em><div class="tk"><i class="bd b1"></i><i class="bd b2"></i><i class="bd b3"></i><i class="ms"></i><i class="tg"></i></div></div><div class="rw"><em>Signups</em><div class="tk"><i class="bd b1"></i><i class="bd b2"></i><i class="bd b3"></i><i class="ms s2"></i><i class="tg t2"></i></div></div></div>`
    const css = `.${c} {
  display: grid;
  gap: 0.6rem;
  width: 244px;
  padding: 0.75rem 0.7rem;
  border-radius: 0.55rem;
  background: #0b1120;
  border: 1px solid #1e293b;
}
.${c} .rw { display: grid; gap: 0.25rem; }
.${c} em {
  font-style: normal;
  font-size: 0.65rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}
.${c} .tk {
  position: relative;
  height: 20px;
}
.${c} .bd {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: 2px;
}
.${c} .b1 { width: 100%; background: #131f38; }
.${c} .b2 { width: 72%;  background: #1c2b47; }
.${c} .b3 { width: 44%;  background: #24365a; }
.${c} .ms {
  position: absolute;
  left: 0;
  top: 6px;
  height: 8px;
  border-radius: 2px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  box-shadow: 0 0 10px rgba(${rgbOf(g.a)}, 0.4);
  animation: ${c}-m1 1.1s cubic-bezier(0.4, 0, 0.2, 1) 1 both;
}
@keyframes ${c}-m1 { from { width: 0; } to { width: 82%; } }
.${c} .ms.s2 { animation-name: ${c}-m2; animation-delay: 0.12s; }
@keyframes ${c}-m2 { from { width: 0; } to { width: 57%; } }
.${c} .tg {
  position: absolute;
  left: 88%;
  top: 1px;
  bottom: 1px;
  width: 2.5px;
  border-radius: 1px;
  background: #f8fafc;
}
.${c} .tg.t2 { left: 70%; }`
    add(mk({
      name: `${g.name} Bullet Chart`,
      category: 'Charts & Data',
      description: `Stephen Few's replacement for the gauge — a measure bar over banded qualitative ranges with a target tick, carrying in one row what a dial needs a whole tile for.`,
      html, css,
      tags: ['chart', 'bullet', 'kpi', 'target', 'dashboard', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  CHARTS & DATA — treemap  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-chart-treemap-${t.name}`)
    const html = `<div class="${c}"><i class="a"><b>Direct<em>42%</em></b></i><i class="b"><b>Search<em>26%</em></b></i><i class="c"><b>Social<em>18%</em></b></i><i class="d"><b>Mail<em>9%</em></b></i><i class="e"><b>Ref<em>5%</em></b></i></div>`
    const css = `.${c} {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  grid-template-rows: 1.35fr 1fr;
  gap: 3px;
  width: 244px;
  height: 150px;
  padding: 4px;
  border-radius: 0.55rem;
  background: #0b1120;
  border: 1px solid #1e293b;
}
.${c} i {
  position: relative;
  display: grid;
  align-content: end;
  padding: 0.35rem 0.4rem;
  border-radius: 0.28rem;
  overflow: hidden;
  transition: filter 0.2s ease, transform 0.2s ease;
}
.${c} .a { grid-row: span 2; background: linear-gradient(150deg, ${t.a}, ${t.b}); }
.${c} .b { background: linear-gradient(150deg, ${t.b}, ${t.c}); }
.${c} .c { background: linear-gradient(150deg, ${t.c}, ${t.a}); }
.${c} .d { background: linear-gradient(150deg, ${t.b}, #1e293b); }
.${c} .e { background: linear-gradient(150deg, ${t.c}, #1e293b); }
.${c} i:hover { filter: brightness(1.15); transform: scale(0.985); }
.${c} b {
  display: grid;
  gap: 0.02rem;
  font-size: 0.64rem;
  font-weight: 650;
  line-height: 1.25;
  color: #0b1120;
}
.${c} em {
  font-style: normal;
  font-size: 0.72rem;
  font-weight: 800;
}`
    add(mk({
      name: `${t.name} Treemap`,
      category: 'Charts & Data',
      description: `Share-of-total as nested area rather than length, sized with fractional grid tracks so the proportions are declared once and the tiles re-solve at any width.`,
      html, css,
      tags: ['chart', 'treemap', 'share', 'proportion', 'grid', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  DIVIDERS & SEPARATORS — wave section transition  (12)
   *  Exhausted category. This is the wave rule the set lacked,
   *  but it is a fourth-generation horizontal rule.
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-div-wave-${g.name}`)
    const html = `<div class="${c}"><i></i></div>`
    const css = `.${c} {
  width: 250px;
  padding: 0.7rem 0;
}
.${c} i {
  display: block;
  height: 18px;
  background: linear-gradient(90deg, ${g.a}, ${g.b});
  -webkit-mask:
    radial-gradient(circle at 50% 0, transparent 9px, #000 9.5px) 0 0 / 36px 18px repeat-x,
    radial-gradient(circle at 50% 100%, #000 9px, transparent 9.5px) 18px 0 / 36px 18px repeat-x;
  mask:
    radial-gradient(circle at 50% 0, transparent 9px, #000 9.5px) 0 0 / 36px 18px repeat-x,
    radial-gradient(circle at 50% 100%, #000 9px, transparent 9.5px) 18px 0 / 36px 18px repeat-x;
  -webkit-mask-composite: source-over;
  mask-composite: add;
  animation: ${c}-roll 3.5s linear infinite;
}
@keyframes ${c}-roll {
  from { -webkit-mask-position: 0 0, 18px 0; mask-position: 0 0, 18px 0; }
  to   { -webkit-mask-position: 36px 0, 54px 0; mask-position: 36px 0, 54px 0; }
}`
    add(mk({
      name: `${g.name} Wave Divider`,
      category: 'Dividers & Separators',
      description: `Sine edge assembled from two alternating circle masks rather than an SVG path, the pair scrolling one full period so the crests travel without the band moving.`,
      html, css,
      tags: ['divider', 'wave', 'mask', 'section', 'separator', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  DIVIDERS & SEPARATORS — stitched seam  (8)
   *  Exhausted category: honestly a dashed rule with a shadow.
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-div-stitch-${t.name}`)
    const html = `<div class="${c}"><i></i></div>`
    const css = `.${c} {
  width: 250px;
  padding: 0.9rem 0;
}
.${c} i {
  display: block;
  height: 3px;
  border-radius: 2px;
  background: repeating-linear-gradient(
    90deg,
    ${t.a} 0 9px,
    transparent 9px 17px
  );
  filter: drop-shadow(0 1.5px 0 rgba(${rgbOf(t.c)}, 0.55));
  transition: background-position 0.35s ease;
}
.${c}:hover i { background-position: 8px 0; }`
    add(mk({
      name: `${t.name} Stitch Divider`,
      category: 'Dividers & Separators',
      description: `Saddle-stitch seam: a dashed rule offset by a coloured drop-shadow so each stitch appears to sit proud of the surface, shifting half a stitch on hover.`,
      html, css,
      tags: ['divider', 'stitch', 'seam', 'dashed', 'separator', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ENTRANCE ANIMATIONS — two-axis grid pop  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-ent-gridpop-${g.name}`)
    const html = `<div class="${c}"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`
    const css = `.${c} {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 7px;
  width: 216px;
  padding: 0.4rem 0;
}
.${c} i {
  height: 46px;
  border-radius: 0.4rem;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  transform: scale(0.4) translateY(14px);
  opacity: 0;
  animation: ${c}-pop 0.62s cubic-bezier(0.34, 1.45, 0.64, 1) 1 both;
}
@keyframes ${c}-pop {
  to { transform: scale(1) translateY(0); opacity: 1; }
}
.${c} i:nth-child(1)  { animation-delay: 0s; }
.${c} i:nth-child(2)  { animation-delay: 0.06s; }
.${c} i:nth-child(3)  { animation-delay: 0.12s; }
.${c} i:nth-child(4)  { animation-delay: 0.18s; }
.${c} i:nth-child(5)  { animation-delay: 0.06s; }
.${c} i:nth-child(6)  { animation-delay: 0.12s; }
.${c} i:nth-child(7)  { animation-delay: 0.18s; }
.${c} i:nth-child(8)  { animation-delay: 0.24s; }
.${c} i:nth-child(9)  { animation-delay: 0.12s; }
.${c} i:nth-child(10) { animation-delay: 0.18s; }
.${c} i:nth-child(11) { animation-delay: 0.24s; }
.${c} i:nth-child(12) { animation-delay: 0.3s; }`
    add(mk({
      name: `${g.name} Grid Pop`,
      category: 'Entrance Animations',
      description: `Tiles keyed off row plus column rather than index, so the entrance sweeps diagonally from the top-left corner instead of running along each row in turn.`,
      html, css,
      tags: ['entrance', 'grid', 'stagger', 'diagonal', 'pop', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ENTRANCE ANIMATIONS — self-drawing border  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-ent-borderdraw-${t.name}`)
    const html = `<div class="${c}"><i class="t"></i><i class="r"></i><i class="b"></i><i class="l"></i><b>Verified</b></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 200px;
  height: 92px;
  background: #0b1120;
}
.${c} i {
  position: absolute;
  background: linear-gradient(90deg, ${t.a}, ${t.c});
}
.${c} .t, .${c} .b { height: 2px; width: 100%; transform: scaleX(0); }
.${c} .l, .${c} .r { width: 2px; height: 100%; transform: scaleY(0); }
.${c} .t { top: 0; left: 0; transform-origin: 0 50%;   animation: ${c}-x 0.34s ease 1 both; }
.${c} .r { top: 0; right: 0; transform-origin: 50% 0;  animation: ${c}-y 0.34s ease 0.34s 1 both; }
.${c} .b { bottom: 0; right: 0; transform-origin: 100% 50%; animation: ${c}-x 0.34s ease 0.68s 1 both; }
.${c} .l { bottom: 0; left: 0; transform-origin: 50% 100%;  animation: ${c}-y 0.34s ease 1.02s 1 both; }
@keyframes ${c}-x { to { transform: scaleX(1); } }
@keyframes ${c}-y { to { transform: scaleY(1); } }
.${c} b {
  font-size: 0.85rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  color: #e2e8f0;
  opacity: 0;
  animation: ${c}-in 0.4s ease 1.3s 1 both;
}
@keyframes ${c}-in { to { opacity: 1; } }`
    add(mk({
      name: `${t.name} Border Draw-In`,
      category: 'Entrance Animations',
      description: `Four edges scaling in sequence from the corner the previous one finished at, so a single stroke appears to travel the perimeter before the label arrives.`,
      html, css,
      tags: ['entrance', 'border', 'draw', 'sequence', 'outline', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FILTERS & BLEND MODES — emboss relief  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-filter-emboss-${g.name}`)
    const html = `<div class="${c}"><span>RELIEF</span></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 226px;
  height: 118px;
  border-radius: 0.55rem;
  background: linear-gradient(150deg, #1a2338, #0d1220);
  box-shadow: inset 0 1px 0 rgba(248,250,252,0.06);
}
.${c} span {
  font-size: 1.85rem;
  font-weight: 850;
  letter-spacing: 0.1em;
  color: #151d2f;
  text-shadow:
    -1px -1px 0 rgba(0,0,0,0.7),
     1px  1px 0 rgba(248,250,252,0.12),
     0    0   18px rgba(${rgbOf(g.a)}, 0.28);
  transition: text-shadow 0.35s ease, color 0.35s ease;
}
.${c}:hover span {
  color: #101828;
  text-shadow:
     1px  1px 0 rgba(0,0,0,0.75),
    -1px -1px 0 rgba(248,250,252,0.14),
     0    0   22px rgba(${rgbOf(g.b)}, 0.4);
}`
    add(mk({
      name: `${g.name} Emboss Relief`,
      category: 'Filters & Blend Modes',
      description: `Letterforms pressed into the surface by one dark and one light offset shadow, the pair swapping sides on hover so the relief flips from debossed to raised.`,
      html, css,
      tags: ['filter', 'emboss', 'relief', 'letterpress', 'shadow', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FILTERS & BLEND MODES — solarize curve  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-filter-solarize-${t.name}`)
    const html = `<div class="${c}"><i class="art"></i><i class="sol"></i><span>SOLARIZE</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: end start;
  width: 232px;
  height: 138px;
  padding: 0.55rem 0.65rem;
  overflow: hidden;
  border-radius: 0.55rem;
  background: #05070f;
  isolation: isolate;
}
.${c} i { position: absolute; inset: 0; }
.${c} .art {
  background:
    radial-gradient(52% 62% at 32% 34%, ${t.a}, transparent 70%),
    radial-gradient(48% 58% at 72% 68%, ${t.b}, transparent 72%),
    linear-gradient(155deg, ${t.c}, #05070f);
}
.${c} .sol {
  background: inherit;
  backdrop-filter: invert(1) brightness(1.4) saturate(1.6);
  -webkit-mask: linear-gradient(#000, #000);
  mask: linear-gradient(#000, #000);
  mix-blend-mode: lighten;
  opacity: 0.55;
  transition: opacity 0.45s ease;
}
.${c}:hover .sol { opacity: 0; }
.${c} span {
  position: relative;
  z-index: 1;
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  color: #f8fafc;
  mix-blend-mode: difference;
}`
    add(mk({
      name: `${t.name} Solarize`,
      category: 'Filters & Blend Modes',
      description: `Sabattier effect from an inverted copy composited with lighten, which flips only the tones the original leaves dark — the partial reversal a full invert cannot give.`,
      html, css,
      tags: ['filter', 'solarize', 'sabattier', 'invert', 'darkroom', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FORMS & VALIDATION — phone field with country select  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-form-phone-${g.name}`)
    const html = `<div class="${c}"><label>Phone number</label><div class="fl"><button class="cc"><i class="fg"></i>+351<b class="cv"></b></button><span class="num">912 345 678</span><i class="ok"></i></div><em class="hp">We only use this for delivery updates.</em></div>`
    const css = `.${c} {
  display: grid;
  gap: 0.3rem;
  width: 250px;
}
.${c} label { font-size: 0.7rem; font-weight: 600; color: #94a3b8; }
.${c} .fl {
  display: flex;
  align-items: center;
  border-radius: 0.45rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c} .fl:hover,
.${c} .fl:focus-within {
  border-color: ${g.b};
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.b)}, 0.14);
}
.${c} .cc {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.55rem 0.5rem 0.55rem 0.6rem;
  border: none;
  border-right: 1px solid #1e293b;
  border-radius: 0.45rem 0 0 0.45rem;
  background: transparent;
  font-size: 0.76rem;
  color: #e2e8f0;
  cursor: pointer;
}
.${c} .fg {
  width: 16px;
  height: 11px;
  border-radius: 1.5px;
  background: linear-gradient(90deg, ${g.a} 0 40%, ${g.b} 40% 100%);
}
.${c} .cv {
  width: 5px;
  height: 5px;
  border-right: 1.4px solid #64748b;
  border-bottom: 1.4px solid #64748b;
  transform: rotate(45deg) translateY(-1px);
}
.${c} .num {
  flex: 1;
  padding: 0 0.6rem;
  font-size: 0.8rem;
  letter-spacing: 0.03em;
  color: #f1f5f9;
}
.${c} .ok {
  position: relative;
  width: 16px;
  height: 16px;
  margin-right: 0.6rem;
  border-radius: 50%;
  background: ${g.a};
}
.${c} .ok::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 5px;
  width: 7px;
  height: 3.5px;
  border-left: 1.8px solid #0b1120;
  border-bottom: 1.8px solid #0b1120;
  transform: rotate(-45deg);
}
.${c} .hp {
  font-style: normal;
  font-size: 0.66rem;
  color: #475569;
}`
    add(mk({
      name: `${g.name} Phone Field`,
      category: 'Forms & Validation',
      description: `Dial code chosen inside the field it prefixes rather than in a separate control, with the valid state marked at the trailing edge where the eye finishes the line.`,
      html, css,
      tags: ['form', 'phone', 'country code', 'input group', 'validation', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  FORMS & VALIDATION — signature pad  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-form-signature-${t.name}`)
    const html = `<div class="${c}"><div class="pad"><i class="ink"></i><i class="base"></i><em>×</em></div><div class="ft"><span>Sign above</span><button>Clear</button></div></div>`
    const css = `.${c} {
  width: 252px;
}
.${c} .pad {
  position: relative;
  height: 96px;
  border-radius: 0.5rem 0.5rem 0 0;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-bottom: none;
  overflow: hidden;
  cursor: crosshair;
}
.${c} .ink {
  position: absolute;
  left: 26px;
  top: 24px;
  width: 150px;
  height: 44px;
  border: 2.5px solid transparent;
  border-bottom-color: ${t.a};
  border-left-color: ${t.b};
  border-radius: 60% 40% 55% 45% / 70% 55% 45% 30%;
  transform: rotate(-8deg);
  filter: drop-shadow(0 0 5px rgba(${rgbOf(t.a)}, 0.4));
  animation: ${c}-write 2.6s ease-in-out infinite;
}
@keyframes ${c}-write {
  0%       { clip-path: inset(0 100% 0 0); }
  55%, 88% { clip-path: inset(0 0 0 0); }
  100%     { clip-path: inset(0 0 0 0); }
}
.${c} .base {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 22px;
  height: 1px;
  background: repeating-linear-gradient(90deg, #334155 0 5px, transparent 5px 10px);
}
.${c} .pad em {
  position: absolute;
  left: 18px;
  bottom: 14px;
  font-style: normal;
  font-size: 0.8rem;
  color: #475569;
}
.${c} .ft {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.55rem;
  border-radius: 0 0 0.5rem 0.5rem;
  background: #111827;
  border: 1px solid #1e293b;
}
.${c} .ft span { font-size: 0.66rem; color: #64748b; }
.${c} .ft button {
  padding: 0.24rem 0.55rem;
  border-radius: 0.3rem;
  border: 1px solid #334155;
  background: transparent;
  font-size: 0.68rem;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.16s ease, border-color 0.16s ease;
}
.${c} .ft button:hover { color: ${t.c}; border-color: ${t.c}; }`
    add(mk({
      name: `${t.name} Signature Pad`,
      category: 'Forms & Validation',
      description: `Signing surface with a dashed baseline and cross mark, the stroke revealed left to right by an animated inset clip so it draws rather than fades in.`,
      html, css,
      tags: ['form', 'signature', 'sign', 'canvas', 'contract', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  GLOW & NEON — lightning strike  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-glow-lightning-${g.name}`)
    const html = `<div class="${c}"><i class="flash"></i><i class="bolt"></i></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 172px;
  height: 150px;
  overflow: hidden;
  border-radius: 0.55rem;
  background: linear-gradient(180deg, #0a1020, #05070f);
}
.${c} .flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(60% 55% at 50% 40%, rgba(${rgbOf(g.a)}, 0.55), transparent 70%);
  opacity: 0;
  animation: ${c}-flash 3.4s steps(1) infinite;
}
@keyframes ${c}-flash {
  0%, 5%   { opacity: 0; }
  6%       { opacity: 1; }
  8%       { opacity: 0.15; }
  10%      { opacity: 0.9; }
  14%,100% { opacity: 0; }
}
.${c} .bolt {
  position: relative;
  width: 46px;
  height: 96px;
  background: linear-gradient(180deg, ${g.a}, ${g.b});
  clip-path: polygon(56% 0, 20% 52%, 46% 52%, 30% 100%, 82% 42%, 52% 42%, 78% 0);
  filter: drop-shadow(0 0 10px ${g.a}) drop-shadow(0 0 24px rgba(${rgbOf(g.b)}, 0.7));
  animation: ${c}-strike 3.4s steps(1) infinite;
}
@keyframes ${c}-strike {
  0%, 5%   { opacity: 0.12; }
  6%       { opacity: 1; }
  8%       { opacity: 0.3; }
  10%      { opacity: 1; }
  14%,100% { opacity: 0.12; }
}`
    add(mk({
      name: `${g.name} Lightning Strike`,
      category: 'Glow & Neon',
      description: `Jagged bolt cut by clip-path and lit by stacked drop-shadows, driven on stepped keyframes so the discharge snaps between states the way a real strike does.`,
      html, css,
      tags: ['neon', 'lightning', 'bolt', 'strike', 'flash', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  GLOW & NEON — volumetric light cone  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-glow-lightcone-${t.name}`)
    const html = `<div class="${c}"><i class="lamp"></i><i class="cone"></i><i class="pool"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 196px;
  height: 152px;
  overflow: hidden;
  border-radius: 0.55rem;
  background: linear-gradient(180deg, #080d1a, #04060d);
}
.${c} .lamp {
  position: absolute;
  left: 50%;
  top: 10px;
  width: 26px;
  height: 9px;
  margin-left: -13px;
  border-radius: 0 0 5px 5px;
  background: ${t.a};
  box-shadow: 0 0 18px ${t.a};
}
.${c} .cone {
  position: absolute;
  left: 50%;
  top: 19px;
  width: 132px;
  height: 106px;
  margin-left: -66px;
  background: linear-gradient(180deg, rgba(${rgbOf(t.b)}, 0.42), rgba(${rgbOf(t.c)}, 0.04));
  clip-path: polygon(42% 0, 58% 0, 100% 100%, 0 100%);
  filter: blur(3px);
  animation: ${c}-flicker 5s ease-in-out infinite;
}
@keyframes ${c}-flicker {
  0%, 100% { opacity: 0.85; }
  45%      { opacity: 1; }
  70%      { opacity: 0.78; }
}
.${c} .pool {
  position: absolute;
  left: 50%;
  bottom: 16px;
  width: 140px;
  height: 26px;
  margin-left: -70px;
  border-radius: 50%;
  background: radial-gradient(ellipse at 50% 50%, rgba(${rgbOf(t.c)}, 0.5), transparent 70%);
  filter: blur(4px);
}`
    add(mk({
      name: `${t.name} Light Cone`,
      category: 'Glow & Neon',
      description: `Volumetric beam as a blurred trapezoid between an emitter and the ellipse it lands on, all three flickering together so the shaft and its pool stay tied.`,
      html, css,
      tags: ['neon', 'light cone', 'volumetric', 'beam', 'spotlight', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ICONS & SHAPES — rotating cog  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-icon-cog-${g.name}`)
    const html = `<div class="${c}"><i class="cog"></i><i class="hub"></i></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  cursor: pointer;
}
.${c} .cog {
  position: absolute;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    ${g.a} 0deg 18deg, transparent 18deg 30deg,
    ${g.a} 30deg 48deg, transparent 48deg 60deg,
    ${g.a} 60deg 78deg, transparent 78deg 90deg,
    ${g.a} 90deg 108deg, transparent 108deg 120deg,
    ${g.a} 120deg 138deg, transparent 138deg 150deg,
    ${g.a} 150deg 168deg, transparent 168deg 180deg,
    ${g.b} 180deg 198deg, transparent 198deg 210deg,
    ${g.b} 210deg 228deg, transparent 228deg 240deg,
    ${g.b} 240deg 258deg, transparent 258deg 270deg,
    ${g.b} 270deg 288deg, transparent 288deg 300deg,
    ${g.b} 300deg 318deg, transparent 318deg 330deg,
    ${g.b} 330deg 348deg, transparent 348deg 360deg
  );
  -webkit-mask: radial-gradient(farthest-side, #000 66%, transparent 66.5%);
  mask: radial-gradient(farthest-side, #000 66%, transparent 66.5%);
  animation: ${c}-turn 7s linear infinite;
}
@keyframes ${c}-turn {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.${c} .hub {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  -webkit-mask: radial-gradient(farthest-side, transparent 34%, #000 34.5%);
  mask: radial-gradient(farthest-side, transparent 34%, #000 34.5%);
  animation: ${c}-turn 7s linear infinite;
}
.${c}:hover .cog,
.${c}:hover .hub { animation-duration: 1.8s; }`
    add(mk({
      name: `${g.name} Rotating Cog`,
      category: 'Icons & Shapes',
      description: `Gear teeth as alternating conic stops with the disc centre masked away, the hub ring masked the opposite way — two elements, no path data, twelve teeth.`,
      html, css,
      tags: ['icon', 'cog', 'gear', 'settings', 'conic', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  ICONS & SHAPES — wifi arcs  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-icon-wifi-${t.name}`)
    const html = `<div class="${c}"><i class="a3"></i><i class="a2"></i><i class="a1"></i><i class="dot"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 68px;
  height: 54px;
}
.${c} i {
  position: absolute;
  left: 50%;
  bottom: 6px;
  border: 4px solid transparent;
  border-top-color: ${t.b};
  border-radius: 50%;
  transform: translateX(-50%) rotate(45deg);
  animation: ${c}-wave 2.2s ease-out infinite;
}
.${c} .a1 { width: 26px; height: 26px; margin-bottom: -3px; animation-delay: 0s; }
.${c} .a2 { width: 44px; height: 44px; margin-bottom: -12px; animation-delay: 0.22s; border-top-color: ${t.a}; }
.${c} .a3 { width: 62px; height: 62px; margin-bottom: -21px; animation-delay: 0.44s; border-top-color: ${t.c}; }
@keyframes ${c}-wave {
  0%       { opacity: 0.2; }
  30%      { opacity: 1; }
  75%,100% { opacity: 0.2; }
}
.${c} .dot {
  width: 8px;
  height: 8px;
  border: none;
  border-radius: 50%;
  background: ${t.a};
  transform: translateX(-50%);
  animation: none;
}`
    add(mk({
      name: `${t.name} Wifi Arcs`,
      category: 'Icons & Shapes',
      description: `Three nested rings showing only their top border and rotated 45 degrees, which turns a circle into the quarter-arc the signal glyph is actually made of.`,
      html, css,
      tags: ['icon', 'wifi', 'signal', 'arcs', 'connectivity', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  INPUTS & HOVER — masked date field  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-input-datemask-${g.name}`)
    const html = `<div class="${c}"><label>Date of birth</label><div class="fl"><span class="sg on">14</span><i>/</i><span class="sg">08</span><i>/</i><span class="sg mu">YYYY</span><b class="cal"></b></div></div>`
    const css = `.${c} {
  display: grid;
  gap: 0.3rem;
  width: 224px;
}
.${c} label { font-size: 0.7rem; font-weight: 600; color: #94a3b8; }
.${c} .fl {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.5rem 0.6rem;
  border-radius: 0.45rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c}:hover .fl {
  border-color: ${g.b};
  box-shadow: 0 0 0 3px rgba(${rgbOf(g.b)}, 0.14);
}
.${c} .sg {
  padding: 0.05rem 0.18rem;
  border-radius: 0.2rem;
  color: #f1f5f9;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} .sg.mu { color: #475569; }
.${c} .sg.on {
  color: #0b1120;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c}:hover .sg.on { background: transparent; color: #f1f5f9; }
.${c}:hover .sg.mu { background: linear-gradient(135deg, ${g.a}, ${g.b}); color: #0b1120; }
.${c} .fl i {
  font-style: normal;
  color: #475569;
}
.${c} .cal {
  position: relative;
  margin-left: auto;
  width: 15px;
  height: 14px;
  border: 1.5px solid #64748b;
  border-radius: 0.15rem;
  transition: border-color 0.2s ease;
}
.${c} .cal::before {
  content: '';
  position: absolute;
  left: -1.5px;
  right: -1.5px;
  top: 2px;
  height: 1.5px;
  background: #64748b;
  transition: background 0.2s ease;
}
.${c}:hover .cal { border-color: ${g.b}; }
.${c}:hover .cal::before { background: ${g.b}; }`
    add(mk({
      name: `${g.name} Date Mask Field`,
      category: 'Inputs & Hover',
      description: `Fixed day/month/year segments that take focus one at a time and auto-advance, so the separators are chrome the user never has to type.`,
      html, css,
      tags: ['input', 'date', 'mask', 'segmented', 'autoadvance', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  INPUTS & HOVER — slug preview field  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-input-slug-${t.name}`)
    const html = `<div class="${c}"><label>Post title</label><input class="in" value="Ten CSS shapes worth stealing" readonly><div class="pv"><em>hoverlab.dev/blog/</em><b>ten-css-shapes-worth-stealing</b></div></div>`
    const css = `.${c} {
  display: grid;
  gap: 0.3rem;
  width: 254px;
}
.${c} label { font-size: 0.7rem; font-weight: 600; color: #94a3b8; }
.${c} .in {
  width: 100%;
  padding: 0.52rem 0.6rem;
  border-radius: 0.45rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  font-size: 0.78rem;
  color: #f1f5f9;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.${c} .in:hover,
.${c} .in:focus {
  border-color: ${t.b};
  box-shadow: 0 0 0 3px rgba(${rgbOf(t.b)}, 0.14);
}
.${c} .pv {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.1rem;
  padding: 0.4rem 0.55rem;
  border-radius: 0.4rem;
  background: rgba(${rgbOf(t.a)}, 0.09);
  box-shadow: inset 0 0 0 1px rgba(${rgbOf(t.b)}, 0.24);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.67rem;
  line-height: 1.5;
}
.${c} .pv em { font-style: normal; color: #64748b; }
.${c} .pv b {
  font-weight: 600;
  color: ${t.c};
  word-break: break-all;
}`
    add(mk({
      name: `${t.name} Slug Preview`,
      category: 'Inputs & Hover',
      description: `Title field with the URL it will produce rendered underneath, domain greyed and slug highlighted, so the transformation is visible before anything is saved.`,
      html, css,
      tags: ['input', 'slug', 'url preview', 'cms', 'permalink', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  LOADERS — Newton's cradle  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-loader-cradle-${g.name}`)
    const html = `<div class="${c}"><i class="p p1"></i><i class="p p2"></i><i class="p p3"></i><i class="p p4"></i><i class="p p5"></i></div>`
    const css = `.${c} {
  display: flex;
  justify-content: center;
  width: 110px;
  height: 62px;
  padding-top: 2px;
}
.${c} .p {
  position: relative;
  width: 18px;
  height: 54px;
  transform-origin: 50% 0;
}
.${c} .p::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  width: 1px;
  height: 38px;
  margin-left: -0.5px;
  background: #334155;
}
.${c} .p::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 36px;
  width: 16px;
  height: 16px;
  margin-left: -8px;
  border-radius: 50%;
  background: linear-gradient(140deg, ${g.a}, ${g.b});
  box-shadow: 0 0 10px rgba(${rgbOf(g.a)}, 0.5);
}
.${c} .p1 { animation: ${c}-left 1.4s cubic-bezier(0.42, 0, 0.58, 1) infinite; }
.${c} .p5 { animation: ${c}-right 1.4s cubic-bezier(0.42, 0, 0.58, 1) infinite; }
@keyframes ${c}-left {
  0%       { transform: rotate(-32deg); }
  25%, 75% { transform: rotate(0deg); }
  100%     { transform: rotate(-32deg); }
}
@keyframes ${c}-right {
  0%, 25%  { transform: rotate(0deg); }
  50%      { transform: rotate(32deg); }
  75%,100% { transform: rotate(0deg); }
}`
    add(mk({
      name: `${g.name} Newton's Cradle`,
      category: 'Loaders',
      description: `Five pendulums where only the end pair moves and the middle three stay dead still, which is the whole illusion — momentum appears to pass through them.`,
      html, css,
      tags: ['loader', 'newtons cradle', 'pendulum', 'physics', 'swing', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  LOADERS — flipping hourglass  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-loader-hourglass-${t.name}`)
    const html = `<div class="${c}"><div class="gl"><i class="top"></i><i class="bot"></i><i class="stream"></i></div></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 68px;
  height: 82px;
}
.${c} .gl {
  position: relative;
  width: 44px;
  height: 64px;
  animation: ${c}-flip 3.2s ease-in-out infinite;
}
@keyframes ${c}-flip {
  0%, 76%  { transform: rotate(0deg); }
  92%,100% { transform: rotate(180deg); }
}
.${c} .gl::before,
.${c} .gl::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 2px;
  background: ${t.b};
}
.${c} .gl::before { top: 0; }
.${c} .gl::after  { bottom: 0; }
.${c} .top,
.${c} .bot {
  position: absolute;
  left: 3px;
  right: 3px;
  height: 28px;
  background: linear-gradient(180deg, ${t.a}, ${t.c});
}
.${c} .top {
  top: 3px;
  clip-path: polygon(0 0, 100% 0, 52% 100%, 48% 100%);
  animation: ${c}-drain 3.2s linear infinite;
}
@keyframes ${c}-drain {
  0%      { clip-path: polygon(0 0, 100% 0, 52% 100%, 48% 100%); }
  76%     { clip-path: polygon(40% 88%, 60% 88%, 52% 100%, 48% 100%); }
  100%    { clip-path: polygon(40% 88%, 60% 88%, 52% 100%, 48% 100%); }
}
.${c} .bot {
  bottom: 3px;
  clip-path: polygon(48% 0, 52% 0, 100% 100%, 0 100%);
  animation: ${c}-fill 3.2s linear infinite;
}
@keyframes ${c}-fill {
  0%   { clip-path: polygon(48% 0, 52% 0, 54% 12%, 46% 12%); }
  76%  { clip-path: polygon(48% 0, 52% 0, 100% 100%, 0 100%); }
  100% { clip-path: polygon(48% 0, 52% 0, 100% 100%, 0 100%); }
}
.${c} .stream {
  position: absolute;
  left: 50%;
  top: 30px;
  width: 2px;
  height: 8px;
  margin-left: -1px;
  background: ${t.c};
}`
    add(mk({
      name: `${t.name} Hourglass`,
      category: 'Loaders',
      description: `Upper cone draining and lower cone filling on matched clip-path keyframes, the whole body turning over only once the sand has run through.`,
      html, css,
      tags: ['loader', 'hourglass', 'sand', 'timer', 'flip', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MASKS & CLIP PATHS — knockout text panel  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-mask-knockout-${g.name}`)
    const html = `<div class="${c}"><i class="bg"></i><div class="pl"><span>OPEN</span></div></div>`
    const css = `.${c} {
  position: relative;
  width: 232px;
  height: 128px;
  overflow: hidden;
  border-radius: 0.55rem;
}
.${c} .bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 70% at 25% 25%, ${g.a}, transparent 70%),
    linear-gradient(140deg, ${g.b}, #0b1120);
  animation: ${c}-shift 7s ease-in-out infinite;
}
@keyframes ${c}-shift {
  0%, 100% { transform: scale(1) translate(0, 0); }
  50%      { transform: scale(1.12) translate(-6px, 4px); }
}
.${c} .pl {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: #0b1120;
  mix-blend-mode: multiply;
}
.${c} .pl span {
  font-size: 2.6rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: #fff;
}`
    add(mk({
      name: `${g.name} Knockout Panel`,
      category: 'Masks & Clip Paths',
      description: `Solid panel multiplied over a moving field so white letterforms punch straight through to it — the type is a hole, not a fill, and the colour behind keeps drifting.`,
      html, css,
      tags: ['mask', 'knockout', 'text', 'blend', 'multiply', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MASKS & CLIP PATHS — star clip tile  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-mask-star-${t.name}`)
    const html = `<div class="${c}"><i class="fill"></i></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 132px;
  height: 132px;
}
.${c} .fill {
  width: 118px;
  height: 118px;
  background:
    radial-gradient(60% 60% at 35% 30%, rgba(248,250,252,0.35), transparent 65%),
    conic-gradient(from 210deg, ${t.a}, ${t.b} 40%, ${t.c} 72%, ${t.a});
  clip-path: polygon(
    50% 0%, 61% 35%, 98% 35%, 68% 57%,
    79% 91%, 50% 70%, 21% 91%, 32% 57%,
    2% 35%, 39% 35%
  );
  filter: drop-shadow(0 6px 16px rgba(${rgbOf(t.b)}, 0.45));
  animation: ${c}-turn 8s linear infinite;
}
@keyframes ${c}-turn {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}`
    add(mk({
      name: `${t.name} Star Tile`,
      category: 'Masks & Clip Paths',
      description: `Ten-point clip-path polygon over a conic fill, so the highlight sweeps around the points as the shape turns rather than rotating with them.`,
      html, css,
      tags: ['mask', 'star', 'clip-path', 'polygon', 'rotate', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MICRO-INTERACTIONS — drag to reorder  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-micro-reorder-${g.name}`)
    const html = `<div class="${c}"><div class="rw"><i class="gr"></i><span>Introduction</span></div><div class="gap"></div><div class="rw lift"><i class="gr"></i><span>Getting started</span></div><div class="rw"><i class="gr"></i><span>API reference</span></div></div>`
    const css = `.${c} {
  display: grid;
  gap: 0.3rem;
  width: 226px;
  padding: 0.5rem;
  border-radius: 0.55rem;
  background: #0b1120;
  border: 1px solid #1e293b;
}
.${c} .rw {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.48rem 0.55rem;
  border-radius: 0.42rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  font-size: 0.75rem;
  color: #cbd5e1;
  cursor: grab;
  transition: transform 0.28s cubic-bezier(0.34, 1.3, 0.64, 1), box-shadow 0.28s ease, border-color 0.2s ease;
}
.${c} .gr {
  flex: none;
  width: 10px;
  height: 12px;
  background:
    radial-gradient(circle, #475569 1.1px, transparent 1.4px) 0 0 / 5px 4px;
}
.${c} .gap {
  height: 0;
  border-radius: 0.42rem;
  border: 1px dashed transparent;
  transition: height 0.28s cubic-bezier(0.34, 1.3, 0.64, 1), border-color 0.2s ease;
}
.${c}:hover .gap {
  height: 34px;
  border-color: ${g.b};
}
.${c}:hover .lift {
  transform: translate(6px, -42px) rotate(-1.6deg);
  border-color: ${g.a};
  box-shadow: 0 12px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(${rgbOf(g.a)}, 0.4);
  cursor: grabbing;
}`
    add(mk({
      name: `${g.name} Drag Reorder`,
      category: 'Micro-interactions',
      description: `Row lifting off the stack with a slight tilt while a dashed gap opens where it will land, so the drop target is shown rather than guessed at.`,
      html, css,
      tags: ['micro', 'drag', 'reorder', 'sortable', 'list', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MICRO-INTERACTIONS — confetti burst  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-micro-confetti-${t.name}`)
    const html = `<div class="${c}"><button>Complete</button><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><i class="c5"></i><i class="c6"></i></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 190px;
  height: 96px;
}
.${c} button {
  padding: 0.48rem 1rem;
  border: none;
  border-radius: 0.45rem;
  font-size: 0.79rem;
  font-weight: 650;
  color: #0b1120;
  cursor: pointer;
  background: linear-gradient(135deg, ${t.a}, ${t.b});
  transition: transform 0.2s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.${c}:hover button { transform: scale(1.06); }
.${c} i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7px;
  height: 10px;
  border-radius: 1px;
  opacity: 0;
  pointer-events: none;
}
.${c} .c1 { background: ${t.a}; }
.${c} .c2 { background: ${t.b}; }
.${c} .c3 { background: ${t.c}; }
.${c} .c4 { background: ${t.a}; }
.${c} .c5 { background: ${t.c}; }
.${c} .c6 { background: ${t.b}; }
.${c}:hover .c1 { animation: ${c}-p1 0.85s cubic-bezier(0.2, 0.7, 0.4, 1) 1 forwards; }
.${c}:hover .c2 { animation: ${c}-p2 0.9s  cubic-bezier(0.2, 0.7, 0.4, 1) 0.03s 1 forwards; }
.${c}:hover .c3 { animation: ${c}-p3 0.8s  cubic-bezier(0.2, 0.7, 0.4, 1) 0.06s 1 forwards; }
.${c}:hover .c4 { animation: ${c}-p4 0.95s cubic-bezier(0.2, 0.7, 0.4, 1) 0.02s 1 forwards; }
.${c}:hover .c5 { animation: ${c}-p5 0.88s cubic-bezier(0.2, 0.7, 0.4, 1) 0.08s 1 forwards; }
.${c}:hover .c6 { animation: ${c}-p6 0.82s cubic-bezier(0.2, 0.7, 0.4, 1) 0.05s 1 forwards; }
@keyframes ${c}-p1 { 0% { opacity: 1; transform: translate(0,0) rotate(0deg); } 100% { opacity: 0; transform: translate(-58px,-40px) rotate(220deg); } }
@keyframes ${c}-p2 { 0% { opacity: 1; transform: translate(0,0) rotate(0deg); } 100% { opacity: 0; transform: translate(52px,-46px) rotate(-260deg); } }
@keyframes ${c}-p3 { 0% { opacity: 1; transform: translate(0,0) rotate(0deg); } 100% { opacity: 0; transform: translate(-34px,-56px) rotate(180deg); } }
@keyframes ${c}-p4 { 0% { opacity: 1; transform: translate(0,0) rotate(0deg); } 100% { opacity: 0; transform: translate(38px,-58px) rotate(-190deg); } }
@keyframes ${c}-p5 { 0% { opacity: 1; transform: translate(0,0) rotate(0deg); } 100% { opacity: 0; transform: translate(-66px,-14px) rotate(300deg); } }
@keyframes ${c}-p6 { 0% { opacity: 1; transform: translate(0,0) rotate(0deg); } 100% { opacity: 0; transform: translate(64px,-10px) rotate(-320deg); } }`
    add(mk({
      name: `${t.name} Confetti Burst`,
      category: 'Micro-interactions',
      description: `Six scraps thrown on individually authored arcs with mismatched durations and spins, because a burst where every piece shares a curve reads as a fan.`,
      html, css,
      tags: ['micro', 'confetti', 'burst', 'celebrate', 'success', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MODALS & OVERLAYS — paywall gate  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-modal-paywall-${g.name}`)
    const html = `<div class="${c}"><div class="art"><span></span><span></span><span class="s"></span><span></span><span class="s"></span></div><div class="gt"><b>Keep reading</b><em>Members get the full catalog.</em><button>Start free trial</button></div></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 162px;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #0b1120;
  border: 1px solid #1e293b;
}
.${c} .art {
  display: grid;
  gap: 0.42rem;
  padding: 0.75rem 0.8rem;
}
.${c} .art span {
  height: 8px;
  border-radius: 3px;
  background: #1e293b;
}
.${c} .art .s { width: 68%; }
.${c} .gt {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  justify-items: center;
  gap: 0.22rem;
  padding: 2.2rem 0.85rem 0.85rem;
  text-align: center;
  background: linear-gradient(180deg, transparent, #0b1120 42%);
}
.${c} .gt b { font-size: 0.85rem; font-weight: 700; color: #f1f5f9; }
.${c} .gt em {
  font-style: normal;
  font-size: 0.68rem;
  color: #64748b;
}
.${c} .gt button {
  margin-top: 0.4rem;
  padding: 0.42rem 0.9rem;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.74rem;
  font-weight: 650;
  color: #0b1120;
  cursor: pointer;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  transition: transform 0.2s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c}:hover .gt button { transform: translateY(-2px); }`
    add(mk({
      name: `${g.name} Paywall Gate`,
      category: 'Modals & Overlays',
      description: `Content fading under a gradient rather than cut off at a hard line, so the reader can see there is more without being able to read it — the fade is the argument.`,
      html, css,
      tags: ['overlay', 'paywall', 'gate', 'subscription', 'fade', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  MODALS & OVERLAYS — video modal  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-modal-video-${t.name}`)
    const html = `<div class="${c}"><div class="dlg"><div class="scr"><i class="pl"></i></div><div class="ct"><i class="pp"></i><div class="sk"><i class="bf"></i></div><em>1:24 / 4:07</em></div></div></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 250px;
  height: 158px;
  border-radius: 0.6rem;
  background: rgba(5,7,15,0.82);
  backdrop-filter: blur(3px);
}
.${c} .dlg {
  width: 216px;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #05070f;
  box-shadow: 0 22px 46px rgba(0,0,0,0.6), 0 0 0 1px rgba(${rgbOf(t.b)}, 0.32);
  transition: transform 0.3s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.${c}:hover .dlg { transform: scale(1.03); }
.${c} .scr {
  position: relative;
  display: grid;
  place-items: center;
  height: 100px;
  background:
    radial-gradient(70% 90% at 30% 25%, ${t.b}, transparent 70%),
    linear-gradient(150deg, ${t.c}, #05070f);
}
.${c} .pl {
  width: 0;
  height: 0;
  border-top: 12px solid transparent;
  border-bottom: 12px solid transparent;
  border-left: 20px solid rgba(248,250,252,0.92);
  margin-left: 5px;
  filter: drop-shadow(0 3px 8px rgba(0,0,0,0.5));
  transition: transform 0.24s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.${c}:hover .pl { transform: scale(1.18); }
.${c} .ct {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.55rem;
  background: #0b1120;
}
.${c} .pp {
  flex: none;
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 10px solid ${t.a};
}
.${c} .sk {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: #1e293b;
}
.${c} .bf {
  display: block;
  width: 34%;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, ${t.a}, ${t.c});
}
.${c} .ct em {
  font-style: normal;
  font-size: 0.6rem;
  font-variant-numeric: tabular-nums;
  color: #64748b;
}`
    add(mk({
      name: `${t.name} Video Modal`,
      category: 'Modals & Overlays',
      description: `Lightbox carrying real player chrome — scrubber, elapsed over total — under a blurred scrim, so the dialog reads as a player rather than a framed image.`,
      html, css,
      tags: ['modal', 'video', 'player', 'lightbox', 'scrubber', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  NAVIGATION & MENUS — grouped sidebar  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-nav-sidebargroup-${g.name}`)
    const html = `<nav class="${c}"><em>Workspace</em><a class="on"><i></i>Overview</a><a><i></i>Projects<b>12</b></a><em>Account</em><a><i></i>Billing</a><a><i></i>Members</a></nav>`
    const css = `.${c} {
  display: grid;
  gap: 0.1rem;
  width: 186px;
  padding: 0.6rem 0.5rem;
  border-radius: 0.6rem;
  background: #0f172a;
  border: 1px solid #1e293b;
}
.${c} em {
  margin: 0.45rem 0 0.2rem 0.45rem;
  font-style: normal;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #475569;
}
.${c} em:first-child { margin-top: 0; }
.${c} a {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.42rem 0.5rem;
  border-radius: 0.4rem;
  font-size: 0.76rem;
  color: #94a3b8;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}
.${c} a i {
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 0.25rem;
  background: #334155;
  transition: background 0.16s ease;
}
.${c} a:hover { background: #182338; color: #e2e8f0; }
.${c} a:hover i { background: ${g.b}; }
.${c} a.on {
  color: #f1f5f9;
  font-weight: 600;
  background: rgba(${rgbOf(g.a)}, 0.14);
}
.${c} a.on::before {
  content: '';
  position: absolute;
  left: -0.5rem;
  top: 50%;
  width: 3px;
  height: 16px;
  margin-top: -8px;
  border-radius: 0 2px 2px 0;
  background: linear-gradient(180deg, ${g.a}, ${g.b});
}
.${c} a.on i { background: linear-gradient(135deg, ${g.a}, ${g.b}); }
.${c} a b {
  margin-left: auto;
  padding: 0.02rem 0.3rem;
  border-radius: 999px;
  font-size: 0.6rem;
  color: #94a3b8;
  background: #1e293b;
}`
    add(mk({
      name: `${g.name} Sidebar Groups`,
      category: 'Navigation & Menus',
      description: `Nav split by labelled section with the active row marked by a rail bleeding past the panel padding, so the indicator belongs to the sidebar rather than the item.`,
      html, css,
      tags: ['nav', 'sidebar', 'groups', 'sections', 'active', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  NAVIGATION & MENUS — bottom bar with centre action  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-nav-centeraction-${t.name}`)
    const html = `<nav class="${c}"><a class="on"><i></i><span>Home</span></a><a><i></i><span>Search</span></a><button class="fab"><b></b><b></b></button><a><i></i><span>Saved</span></a><a><i></i><span>You</span></a></nav>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 252px;
  padding: 0.5rem 0.6rem 0.55rem;
  border-radius: 0.7rem;
  background: #111827;
  border: 1px solid #1f2937;
}
.${c} a {
  display: grid;
  justify-items: center;
  gap: 0.16rem;
  width: 42px;
  color: #64748b;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.18s ease;
}
.${c} a i {
  width: 16px;
  height: 16px;
  border-radius: 0.3rem;
  background: currentColor;
  transition: transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} a span { font-size: 0.58rem; }
.${c} a:hover { color: #e2e8f0; }
.${c} a:hover i { transform: translateY(-2px); }
.${c} a.on { color: ${t.b}; }
.${c} .fab {
  position: relative;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  margin-bottom: 6px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: linear-gradient(135deg, ${t.a}, ${t.c});
  box-shadow: 0 0 0 5px #111827, 0 8px 20px rgba(${rgbOf(t.a)}, 0.5);
  transform: translateY(-12px);
  transition: transform 0.24s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} .fab b {
  position: absolute;
  border-radius: 1px;
  background: #0b1120;
}
.${c} .fab b:first-child { width: 16px; height: 2.4px; }
.${c} .fab b:last-child  { width: 2.4px; height: 16px; }
.${c}:hover .fab { transform: translateY(-16px) rotate(90deg); }`
    add(mk({
      name: `${t.name} Centre Action Bar`,
      category: 'Navigation & Menus',
      description: `Mobile tab bar whose primary action sits raised in the middle, punched out of the bar by a ring shadow in the bar's own colour rather than by a real cut-out.`,
      html, css,
      tags: ['nav', 'bottom bar', 'fab', 'mobile', 'tabs', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PATTERNS & TEXTURES — running bond brick  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-pattern-brick-${g.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 144px;
  border-radius: 0.55rem;
  background-color: ${g.b};
  background-image:
    linear-gradient(335deg, rgba(11,17,32,0.28) 0 100%),
    linear-gradient(90deg, rgba(11,17,32,0.85) 2px, transparent 2px),
    linear-gradient(0deg,  rgba(11,17,32,0.85) 2px, transparent 2px),
    linear-gradient(90deg, ${g.a} 50%, transparent 50%);
  background-size: 100% 100%, 40px 20px, 40px 20px, 80px 40px;
  background-position: 0 0, 0 0, 0 0, 0 0;
  transition: background-size 0.4s ease;
}
.${c}:hover {
  background-size: 100% 100%, 52px 26px, 52px 26px, 104px 52px;
}`
    add(mk({
      name: `${g.name} Brick Bond`,
      category: 'Patterns & Textures',
      description: `Running bond where the half-course offset comes from a second layer at double the cell size, so the staggered joints fall out of the geometry rather than being drawn.`,
      html, css,
      tags: ['pattern', 'brick', 'masonry', 'running bond', 'wall', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PATTERNS & TEXTURES — triangle tessellation  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-pattern-triangle-${t.name}`)
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 240px;
  height: 144px;
  border-radius: 0.55rem;
  background-color: #0b1120;
  background-image:
    linear-gradient(60deg,  ${t.a} 25%, transparent 25.5%, transparent 75%, ${t.a} 75.5%),
    linear-gradient(-60deg, ${t.b} 25%, transparent 25.5%, transparent 75%, ${t.b} 75.5%),
    linear-gradient(60deg,  ${t.c} 25%, transparent 25.5%, transparent 75%, ${t.c} 75.5%),
    linear-gradient(-60deg, ${t.a} 25%, transparent 25.5%, transparent 75%, ${t.a} 75.5%);
  background-size: 34px 59px;
  background-position: 0 0, 0 0, 17px 30px, 17px 30px;
  animation: ${c}-slide 10s linear infinite;
}
@keyframes ${c}-slide {
  from { background-position: 0 0, 0 0, 17px 30px, 17px 30px; }
  to   { background-position: 0 59px, 0 59px, 17px 89px, 17px 89px; }
}`
    add(mk({
      name: `${t.name} Triangle Tessellation`,
      category: 'Patterns & Textures',
      description: `Equilateral tiling from four 60-degree gradient layers on a half-cell offset, the 59px row height being what keeps the triangles equilateral rather than merely pointy.`,
      html, css,
      tags: ['pattern', 'triangle', 'tessellation', 'geometric', 'seamless', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PROGRESS & METERS — needle dial  (12)
   *  Now-exhausted category: distinct mechanism (a rotating
   *  needle) but the third gauge in the set.
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-prog-needle-${g.name}`)
    const html = `<div class="${c}"><i class="face"></i><i class="ndl"></i><i class="cap"></i><span>68</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 148px;
  height: 96px;
  overflow: hidden;
}
.${c} .face {
  position: absolute;
  bottom: 0;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: conic-gradient(from 270deg, ${g.a} 0deg, ${g.b} 90deg, #1e293b 90deg 180deg, transparent 180deg);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 13px), #000 calc(100% - 12px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 13px), #000 calc(100% - 12px));
}
.${c} .ndl {
  position: absolute;
  bottom: 4px;
  left: 50%;
  width: 3px;
  height: 58px;
  margin-left: -1.5px;
  border-radius: 2px 2px 0 0;
  background: linear-gradient(180deg, #f8fafc, #64748b);
  transform-origin: 50% 100%;
  animation: ${c}-swing 3s cubic-bezier(0.4, 0, 0.2, 1) 1 both;
}
@keyframes ${c}-swing {
  0%   { transform: rotate(-90deg); }
  55%  { transform: rotate(38deg); }
  72%  { transform: rotate(18deg); }
  100% { transform: rotate(32deg); }
}
.${c} .cap {
  position: absolute;
  bottom: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #0f172a;
  box-shadow: 0 0 0 2px ${g.b};
}
.${c} span {
  position: absolute;
  bottom: 20px;
  font-size: 1.1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #e2e8f0;
}`
    add(mk({
      name: `${g.name} Needle Dial`,
      category: 'Progress & Meters',
      description: `Analogue gauge whose needle overshoots its reading and settles back, the small correction being what separates an instrument from a bar drawn in a circle.`,
      html, css,
      tags: ['progress', 'gauge', 'needle', 'dial', 'analogue', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  PROGRESS & METERS — completion checklist  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-prog-checklist-${t.name}`)
    const html = `<div class="${c}"><div class="hd"><b>Setup</b><em>3 of 5</em></div><i class="tr"><i class="fl"></i></i><ul><li class="dn">Create account</li><li class="dn">Verify email</li><li class="dn">Add a project</li><li>Invite your team</li><li>Connect a domain</li></ul></div>`
    const css = `.${c} {
  width: 222px;
  padding: 0.7rem 0.75rem 0.75rem;
  border-radius: 0.55rem;
  background: #0f172a;
  border: 1px solid #1e293b;
}
.${c} .hd {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.45rem;
}
.${c} .hd b { font-size: 0.8rem; font-weight: 650; color: #f1f5f9; }
.${c} .hd em {
  font-style: normal;
  font-size: 0.66rem;
  color: ${t.b};
}
.${c} .tr {
  display: block;
  height: 5px;
  border-radius: 3px;
  background: #1e293b;
  overflow: hidden;
}
.${c} .fl {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, ${t.a}, ${t.c});
  animation: ${c}-fill 1.3s cubic-bezier(0.4, 0, 0.2, 1) 1 both;
}
@keyframes ${c}-fill { from { width: 0; } to { width: 60%; } }
.${c} ul {
  margin: 0.6rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.28rem;
}
.${c} li {
  position: relative;
  padding-left: 1.3rem;
  font-size: 0.73rem;
  color: #94a3b8;
}
.${c} li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 1px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 1.5px solid #334155;
}
.${c} li.dn { color: #475569; text-decoration: line-through; }
.${c} li.dn::before {
  border-color: transparent;
  background: linear-gradient(135deg, ${t.a}, ${t.b});
}
.${c} li.dn::after {
  content: '';
  position: absolute;
  left: 3.5px;
  top: 5px;
  width: 6px;
  height: 3px;
  border-left: 1.6px solid #0b1120;
  border-bottom: 1.6px solid #0b1120;
  transform: rotate(-45deg);
}`
    add(mk({
      name: `${t.name} Completion Checklist`,
      category: 'Progress & Meters',
      description: `Onboarding meter that shows the remaining work as items rather than a percentage, the bar and the count agreeing so neither has to be trusted alone.`,
      html, css,
      tags: ['progress', 'checklist', 'onboarding', 'completion', 'steps', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SCROLL & STICKY — condensing sticky header  (12)
   *  Now-exhausted category, but this one earns its place: the
   *  shrink-on-scroll header had no entry anywhere in the set.
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-scroll-condense-${g.name}`)
    const html = `<div class="${c}"><header class="hd"><i class="lg"></i><b>Hoverlab</b><nav><span>Docs</span><span>Pricing</span></nav></header><div class="bd"><span></span><span class="s"></span><span></span><span></span><span class="s"></span><span></span></div></div>`
    const css = `.${c} {
  position: relative;
  width: 244px;
  height: 158px;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #0b1120;
  border: 1px solid #1e293b;
}
.${c} .hd {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 58px;
  padding: 0 0.75rem;
  background: rgba(11,17,32,0.72);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid transparent;
  transition: height 0.36s cubic-bezier(0.5, 0, 0.2, 1),
              border-color 0.36s ease,
              background 0.36s ease;
}
.${c} .lg {
  width: 26px;
  height: 26px;
  border-radius: 0.4rem;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  transition: width 0.36s cubic-bezier(0.5, 0, 0.2, 1),
              height 0.36s cubic-bezier(0.5, 0, 0.2, 1);
}
.${c} .hd b {
  font-size: 0.86rem;
  font-weight: 700;
  color: #f1f5f9;
  transition: font-size 0.36s cubic-bezier(0.5, 0, 0.2, 1);
}
.${c} .hd nav {
  display: flex;
  gap: 0.55rem;
  margin-left: auto;
  font-size: 0.68rem;
  color: #64748b;
  opacity: 1;
  transition: opacity 0.24s ease;
}
.${c} .bd {
  display: grid;
  gap: 0.5rem;
  padding: 68px 0.8rem 0.8rem;
  transition: transform 0.36s cubic-bezier(0.5, 0, 0.2, 1);
}
.${c} .bd span {
  height: 9px;
  border-radius: 3px;
  background: #1e293b;
}
.${c} .bd .s { width: 64%; }
.${c}:hover .hd {
  height: 38px;
  background: rgba(11,17,32,0.92);
  border-bottom-color: rgba(${rgbOf(g.b)}, 0.4);
}
.${c}:hover .lg { width: 18px; height: 18px; }
.${c}:hover .hd b { font-size: 0.74rem; }
.${c}:hover .hd nav { opacity: 0; }
.${c}:hover .bd { transform: translateY(-42px); }`
    add(mk({
      name: `${g.name} Condensing Header`,
      category: 'Scroll & Sticky',
      description: `Masthead that gives back two thirds of its height as the page moves under it — logo, wordmark and nav each shedding at their own rate rather than scaling as a block.`,
      html, css,
      tags: ['scroll', 'sticky', 'header', 'condense', 'shrink', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SCROLL & STICKY — scroll shadow container  (8)
   *  Close to the existing Edge-Fade family; the mechanism is
   *  shadows rather than a mask, which is a real difference on
   *  non-uniform backgrounds but not a new idea.
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-scroll-shadow-${t.name}`)
    const html = `<div class="${c}"><i class="sh top"></i><div class="ls"><span>Amsterdam</span><span>Berlin</span><span>Copenhagen</span><span>Dublin</span><span>Edinburgh</span><span>Faro</span><span>Geneva</span></div><i class="sh bot"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 200px;
  height: 142px;
  border-radius: 0.55rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  overflow: hidden;
}
.${c} .ls {
  height: 100%;
  overflow-y: auto;
  padding: 0.35rem 0;
  scrollbar-width: thin;
  scrollbar-color: ${t.b} transparent;
}
.${c} .ls::-webkit-scrollbar { width: 5px; }
.${c} .ls::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: ${t.b};
}
.${c} .ls span {
  display: block;
  padding: 0.42rem 0.7rem;
  font-size: 0.76rem;
  color: #cbd5e1;
  cursor: pointer;
  transition: background 0.14s ease;
}
.${c} .ls span:hover { background: #182338; }
.${c} .sh {
  position: absolute;
  left: 0;
  right: 5px;
  height: 22px;
  z-index: 1;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.${c} .top {
  top: 0;
  background: linear-gradient(180deg, rgba(15,23,42,0.98), transparent);
  box-shadow: inset 0 4px 8px -4px rgba(${rgbOf(t.a)}, 0.5);
  opacity: 0;
}
.${c} .bot {
  bottom: 0;
  background: linear-gradient(0deg, rgba(15,23,42,0.98), transparent);
  box-shadow: inset 0 -4px 8px -4px rgba(${rgbOf(t.c)}, 0.5);
  opacity: 1;
}
.${c}:hover .top { opacity: 1; }
.${c}:hover .bot { opacity: 0; }`
    add(mk({
      name: `${t.name} Scroll Shadows`,
      category: 'Scroll & Sticky',
      description: `Overflow cue as a tinted shadow at whichever edge still has content past it, which survives a patterned backdrop where a fade-to-transparent mask would not.`,
      html, css,
      tags: ['scroll', 'shadow', 'overflow', 'affordance', 'list', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SKELETONS & SHIMMERS — map skeleton  (12)
   *  Exhausted category: a new silhouette for the same shimmer.
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-skel-map-${g.name}`)
    const html = `<div class="${c}"><i class="grid"></i><i class="rd r1"></i><i class="rd r2"></i><i class="pin p1"></i><i class="pin p2"></i><i class="card"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 240px;
  height: 150px;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #131f38;
  border: 1px solid #1e293b;
}
.${c} .grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(90deg, #1a2a47 1px, transparent 1px),
    linear-gradient(0deg,  #1a2a47 1px, transparent 1px);
  background-size: 26px 26px;
}
.${c} .rd {
  position: absolute;
  background: #24365a;
  border-radius: 2px;
}
.${c} .r1 { left: -10%; top: 46%; width: 120%; height: 7px; transform: rotate(-8deg); }
.${c} .r2 { left: 58%;  top: -10%; width: 7px; height: 120%; transform: rotate(11deg); }
.${c} .pin {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  opacity: 0.55;
  animation: ${c}-pulse 1.7s ease-in-out infinite;
}
.${c} .p1 { left: 30%; top: 28%; }
.${c} .p2 { left: 70%; top: 62%; animation-delay: 0.5s; }
@keyframes ${c}-pulse {
  0%, 100% { opacity: 0.4; transform: rotate(-45deg) scale(0.94); }
  50%      { opacity: 0.75; transform: rotate(-45deg) scale(1.04); }
}
.${c} .card {
  position: absolute;
  left: 0.55rem;
  right: 0.55rem;
  bottom: 0.55rem;
  height: 38px;
  border-radius: 0.45rem;
  background: linear-gradient(100deg, #1e293b 30%, rgba(${rgbOf(g.b)}, 0.32) 50%, #1e293b 70%);
  background-size: 220% 100%;
  animation: ${c}-shim 1.6s ease-in-out infinite;
}
@keyframes ${c}-shim {
  0%   { background-position: 140% 0; }
  100% { background-position: -40% 0; }
}`
    add(mk({
      name: `${g.name} Map Skeleton`,
      category: 'Skeletons & Shimmers',
      description: `Loading state for a map view — tile grid, two roads at an angle and pulsing pin stubs — with the result card below carrying the usual sweep.`,
      html, css,
      tags: ['skeleton', 'map', 'tiles', 'pins', 'loading', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SKELETONS & SHIMMERS — video player skeleton  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-skel-video-${t.name}`)
    const html = `<div class="${c}"><i class="scr"><b class="pl"></b></i><div class="ct"><i class="bar"></i><div class="mt"><i class="ttl"></i><i class="sub"></i></div></div></div>`
    const css = `.${c} {
  width: 238px;
  padding: 0.5rem;
  border-radius: 0.6rem;
  background: #0f172a;
  border: 1px solid #1e293b;
}
.${c} i {
  display: block;
  border-radius: 0.3rem;
  background: linear-gradient(100deg, #1e293b 32%, rgba(${rgbOf(t.b)}, 0.3) 50%, #1e293b 68%);
  background-size: 240% 100%;
  animation: ${c}-shim 1.7s ease-in-out infinite;
}
@keyframes ${c}-shim {
  0%   { background-position: 150% 0; }
  100% { background-position: -50% 0; }
}
.${c} .scr {
  position: relative;
  display: grid;
  place-items: center;
  height: 122px;
  border-radius: 0.45rem;
}
.${c} .pl {
  width: 0;
  height: 0;
  border-top: 11px solid transparent;
  border-bottom: 11px solid transparent;
  border-left: 18px solid #334155;
  margin-left: 4px;
}
.${c} .ct { margin-top: 0.5rem; }
.${c} .bar { height: 4px; border-radius: 2px; }
.${c} .mt { display: grid; gap: 0.32rem; margin-top: 0.5rem; }
.${c} .ttl { height: 9px; width: 78%; }
.${c} .sub { height: 7px; width: 46%; }`
    add(mk({
      name: `${t.name} Video Skeleton`,
      category: 'Skeletons & Shimmers',
      description: `Placeholder holding a 16:9 stage with an inert play glyph over a scrubber and two metadata lines, so the layout does not shift when the real player mounts.`,
      html, css,
      tags: ['skeleton', 'video', 'player', 'placeholder', 'shimmer', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SLIDERS & CAROUSELS — swipe deck  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-slider-swipedeck-${g.name}`)
    const html = `<div class="${c}"><i class="cd c3"></i><i class="cd c2"></i><i class="cd c1"><b class="no">NOPE</b><b class="yes">LIKE</b></i></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 190px;
  height: 158px;
}
.${c} .cd {
  position: absolute;
  width: 118px;
  height: 140px;
  border-radius: 0.6rem;
  box-shadow: 0 10px 24px rgba(0,0,0,0.45);
  transition: transform 0.45s cubic-bezier(0.34, 1.25, 0.64, 1), opacity 0.45s ease;
}
.${c} .c3 {
  background: linear-gradient(150deg, #334155, ${g.b});
  transform: translateY(14px) scale(0.9);
  opacity: 0.55;
}
.${c} .c2 {
  background: linear-gradient(150deg, ${g.b}, #1e293b);
  transform: translateY(7px) scale(0.95);
  opacity: 0.8;
}
.${c} .c1 {
  position: relative;
  background: linear-gradient(150deg, ${g.a}, ${g.b});
  transform: none;
}
.${c} .c1 b {
  position: absolute;
  top: 12px;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.${c} .no {
  left: 10px;
  color: #fecaca;
  border: 2px solid #fecaca;
  transform: rotate(-14deg);
}
.${c} .yes {
  right: 10px;
  color: #bbf7d0;
  border: 2px solid #bbf7d0;
  transform: rotate(14deg);
}
.${c}:hover .c1 {
  transform: translateX(72px) rotate(15deg);
  opacity: 0;
}
.${c}:hover .c1 .yes { opacity: 1; }
.${c}:hover .c2 { transform: translateY(0) scale(1); opacity: 1; }
.${c}:hover .c3 { transform: translateY(7px) scale(0.95); opacity: 0.8; }`
    add(mk({
      name: `${g.name} Swipe Deck`,
      category: 'Sliders & Carousels',
      description: `Card thrown off to one side with rotation tied to its travel while the stack behind promotes itself a step, each layer taking the transform the one above just left.`,
      html, css,
      tags: ['carousel', 'swipe', 'deck', 'cards', 'stack', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  SLIDERS & CAROUSELS — circular dial slider  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-slider-dial-${t.name}`)
    const html = `<div class="${c}"><i class="tr"></i><i class="fl"></i><i class="kn"></i><div class="rd"><b>21</b><em>°C</em></div></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 152px;
  height: 152px;
}
.${c} .tr,
.${c} .fl {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}
.${c} .tr {
  background: conic-gradient(from 150deg, #1e293b 0deg 240deg, transparent 240deg);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 11px), #000 calc(100% - 10px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 11px), #000 calc(100% - 10px));
}
.${c} .fl {
  background: conic-gradient(from 150deg, ${t.a} 0deg, ${t.b} 90deg, ${t.c} 156deg, transparent 156deg);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 11px), #000 calc(100% - 10px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 11px), #000 calc(100% - 10px));
  filter: drop-shadow(0 0 8px rgba(${rgbOf(t.b)}, 0.5));
  transition: background 0.4s ease;
}
.${c} .kn {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  border-radius: 50%;
  background: #f8fafc;
  box-shadow: 0 2px 8px rgba(0,0,0,0.55);
  cursor: grab;
  transform: rotate(126deg) translate(65px) rotate(-126deg);
  transition: transform 0.4s cubic-bezier(0.5, 0, 0.2, 1);
}
.${c}:hover .kn { transform: rotate(168deg) translate(65px) rotate(-168deg); }
.${c}:hover .fl {
  background: conic-gradient(from 150deg, ${t.a} 0deg, ${t.b} 110deg, ${t.c} 198deg, transparent 198deg);
}
.${c} .rd {
  display: flex;
  align-items: baseline;
  gap: 1px;
}
.${c} .rd b {
  font-size: 2rem;
  font-weight: 300;
  color: #f1f5f9;
}
.${c} .rd em {
  font-style: normal;
  font-size: 0.8rem;
  color: #64748b;
}`
    add(mk({
      name: `${t.name} Dial Slider`,
      category: 'Sliders & Carousels',
      description: `Thermostat-style control where the handle is positioned by rotate-translate-counterrotate, so it rides the arc without the knob itself ever appearing to spin.`,
      html, css,
      tags: ['slider', 'dial', 'circular', 'thermostat', 'knob', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TABLES & DATA GRIDS — resizable columns  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-table-resize-${g.name}`)
    const html = `<table class="${c}"><thead><tr><th>Name<i class="hd"></i></th><th>Plan<i class="hd"></i></th><th>Seats</th></tr></thead><tbody><tr><td>Northwind</td><td>Scale</td><td>48</td></tr><tr><td>Initech</td><td>Team</td><td>12</td></tr><tr><td>Umbrella</td><td>Scale</td><td>96</td></tr></tbody></table>`
    const css = `.${c} {
  width: 248px;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #0b1120;
  border: 1px solid #1e293b;
  font-size: 0.73rem;
  table-layout: fixed;
}
.${c} th {
  position: relative;
  padding: 0.45rem 0.6rem;
  text-align: left;
  font-size: 0.62rem;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
  background: #0f172a;
  border-bottom: 1px solid #1e293b;
  user-select: none;
}
.${c} .hd {
  position: absolute;
  right: -4px;
  top: 0;
  bottom: 0;
  z-index: 1;
  width: 9px;
  cursor: col-resize;
}
.${c} .hd::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 5px;
  bottom: 5px;
  width: 2px;
  border-radius: 1px;
  background: #1e293b;
  transition: background 0.16s ease, top 0.16s ease, bottom 0.16s ease;
}
.${c} .hd:hover::after {
  top: 0;
  bottom: 0;
  background: linear-gradient(180deg, ${g.a}, ${g.b});
  box-shadow: 0 0 8px rgba(${rgbOf(g.a)}, 0.6);
}
.${c} td {
  padding: 0.45rem 0.6rem;
  color: #cbd5e1;
  border-bottom: 1px solid #131f38;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.${c} tbody tr:last-child td { border-bottom: none; }
.${c} tbody tr:hover td { background: #131f38; }
.${c} th:last-child,
.${c} td:last-child {
  text-align: right;
  font-variant-numeric: tabular-nums;
}`
    add(mk({
      name: `${g.name} Resizable Columns`,
      category: 'Tables & Data Grids',
      description: `Grab handles straddling the header borders, each widening into a lit guide on hover — with fixed layout and ellipsis so a narrowed column truncates instead of reflowing.`,
      html, css,
      tags: ['table', 'resizable', 'columns', 'grid', 'col-resize', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TABLES & DATA GRIDS — bulk action bar  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-table-bulk-${t.name}`)
    const html = `<div class="${c}"><table><tbody><tr class="sel"><td><i class="cb on"></i></td><td>invoice-0412.pdf</td></tr><tr class="sel"><td><i class="cb on"></i></td><td>invoice-0413.pdf</td></tr><tr><td><i class="cb"></i></td><td>invoice-0414.pdf</td></tr></tbody></table><div class="bar"><b>2 selected</b><button>Export</button><button class="dg">Delete</button></div></div>`
    const css = `.${c} {
  position: relative;
  width: 244px;
  padding-bottom: 6px;
  border-radius: 0.55rem;
  overflow: hidden;
  background: #0b1120;
  border: 1px solid #1e293b;
}
.${c} table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.73rem;
}
.${c} td {
  padding: 0.46rem 0.5rem;
  color: #cbd5e1;
  border-bottom: 1px solid #131f38;
}
.${c} td:first-child { width: 26px; padding-right: 0; }
.${c} tr.sel td { background: rgba(${rgbOf(t.b)}, 0.1); }
.${c} .cb {
  display: block;
  position: relative;
  width: 14px;
  height: 14px;
  border-radius: 0.22rem;
  border: 1.5px solid #334155;
}
.${c} .cb.on {
  border-color: transparent;
  background: linear-gradient(135deg, ${t.a}, ${t.b});
}
.${c} .cb.on::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 3.5px;
  width: 7px;
  height: 3.5px;
  border-left: 1.7px solid #0b1120;
  border-bottom: 1.7px solid #0b1120;
  transform: rotate(-45deg);
}
.${c} .bar {
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.5rem;
  border-radius: 0.45rem;
  background: #1e293b;
  box-shadow: 0 10px 24px rgba(0,0,0,0.55);
  transform: translateY(140%);
  transition: transform 0.32s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.${c}:hover .bar { transform: translateY(0); }
.${c} .bar b {
  margin-right: auto;
  font-size: 0.68rem;
  font-weight: 650;
  color: #f1f5f9;
}
.${c} .bar button {
  padding: 0.2rem 0.45rem;
  border-radius: 0.28rem;
  border: none;
  font-size: 0.66rem;
  font-weight: 600;
  color: #0b1120;
  cursor: pointer;
  background: linear-gradient(135deg, ${t.b}, ${t.c});
}
.${c} .bar .dg {
  color: #fecaca;
  background: rgba(239,68,68,0.2);
  box-shadow: inset 0 0 0 1px rgba(239,68,68,0.45);
}`
    add(mk({
      name: `${t.name} Bulk Action Bar`,
      category: 'Tables & Data Grids',
      description: `Action tray that rises over the table once rows are ticked, carrying the count and keeping the destructive option visually apart from the safe one.`,
      html, css,
      tags: ['table', 'bulk actions', 'selection', 'toolbar', 'batch', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TEXT — split-flap departure board  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-text-splitflap-${g.name}`)
    const html = `<div class="${c}"><span class="fl"><i class="t">D</i><i class="b">D</i></span><span class="fl"><i class="t">E</i><i class="b">E</i></span><span class="fl"><i class="t">P</i><i class="b">P</i></span><span class="fl"><i class="t">A</i><i class="b">A</i></span><span class="fl"><i class="t">R</i><i class="b">R</i></span><span class="fl"><i class="t">T</i><i class="b">T</i></span></div>`
    const css = `.${c} {
  display: flex;
  gap: 3px;
  padding: 0.5rem 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.${c} .fl {
  position: relative;
  width: 28px;
  height: 40px;
  border-radius: 0.22rem;
  background: #0d1424;
  box-shadow: inset 0 0 0 1px #1e293b;
  perspective: 160px;
}
.${c} .fl i {
  position: absolute;
  left: 0;
  right: 0;
  display: grid;
  height: 20px;
  overflow: hidden;
  font-size: 1.4rem;
  font-style: normal;
  font-weight: 700;
  line-height: 40px;
  color: ${g.a};
  backface-visibility: hidden;
}
.${c} .fl .t {
  top: 0;
  align-items: start;
  border-bottom: 1px solid #05070f;
  transform-origin: 50% 100%;
  animation: ${c}-flip 2.6s cubic-bezier(0.4, 0, 0.35, 1) infinite;
}
.${c} .fl .b {
  bottom: 0;
  align-items: end;
  line-height: 0;
  color: ${g.b};
}
@keyframes ${c}-flip {
  0%, 62%  { transform: rotateX(0deg); }
  78%      { transform: rotateX(-88deg); }
  90%,100% { transform: rotateX(0deg); }
}
.${c} .fl:nth-child(2) .t { animation-delay: 0.08s; }
.${c} .fl:nth-child(3) .t { animation-delay: 0.16s; }
.${c} .fl:nth-child(4) .t { animation-delay: 0.24s; }
.${c} .fl:nth-child(5) .t { animation-delay: 0.32s; }
.${c} .fl:nth-child(6) .t { animation-delay: 0.4s; }`
    add(mk({
      name: `${g.name} Split Flap`,
      category: 'Text',
      description: `Departure-board character cells split across a hinge, the top leaf folding forward on a stagger so the row clatters through left to right.`,
      html, css,
      tags: ['text', 'split flap', 'departure board', 'flip', 'monospace', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TEXT — squiggle underline  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-text-squiggle-${t.name}`)
    const html = `<p class="${c}">Built for people who <a>actually ship</a> things.</p>`
    const css = `.${c} {
  width: 244px;
  margin: 0;
  padding: 0.5rem 0 0.9rem;
  font-size: 0.95rem;
  line-height: 1.65;
  color: #cbd5e1;
}
.${c} a {
  position: relative;
  color: #f1f5f9;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}
.${c} a::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -6px;
  height: 7px;
  background-image:
    radial-gradient(circle at 50% 0%, transparent 3.2px, ${t.a} 3.4px, ${t.a} 4.4px, transparent 4.6px),
    radial-gradient(circle at 50% 100%, transparent 3.2px, ${t.c} 3.4px, ${t.c} 4.4px, transparent 4.6px);
  background-size: 14px 7px;
  background-position: 0 0, 7px 0;
  background-repeat: repeat-x;
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform 0.42s cubic-bezier(0.5, 0, 0.2, 1);
}
.${c} a:hover::after { transform: scaleX(1); }`
    add(mk({
      name: `${t.name} Squiggle Underline`,
      category: 'Text',
      description: `Wavy rule from two offset arc gradients rather than a wavy text-decoration, which keeps the amplitude and the two colours under direct control at any font size.`,
      html, css,
      tags: ['text', 'underline', 'squiggle', 'wavy', 'link', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TIMELINES & STEPS — nested sub-steps  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-timeline-nested-${g.name}`)
    const html = `<div class="${c}"><div class="st dn"><i></i><b>Plan</b></div><div class="sub"><span class="dn">Scope agreed</span><span class="dn">Budget signed</span></div><div class="st now"><i></i><b>Build</b></div><div class="sub"><span class="dn">Schema</span><span class="ac">API layer</span><span>Client</span></div><div class="st"><i></i><b>Ship</b></div></div>`
    const css = `.${c} {
  width: 226px;
  padding: 0.6rem 0.7rem;
  border-radius: 0.55rem;
  background: #0b1120;
  border: 1px solid #1e293b;
}
.${c} .st {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.28rem 0;
}
.${c} .st i {
  position: relative;
  z-index: 1;
  flex: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #0b1120;
  box-shadow: inset 0 0 0 2px #334155;
}
.${c} .st.dn i {
  background: linear-gradient(135deg, ${g.a}, ${g.b});
  box-shadow: none;
}
.${c} .st.now i {
  box-shadow: inset 0 0 0 2px ${g.a}, 0 0 0 3px rgba(${rgbOf(g.a)}, 0.22);
}
.${c} .st b { font-size: 0.78rem; font-weight: 650; color: #e2e8f0; }
.${c} .st:not(.dn) b { color: #94a3b8; }
.${c} .sub {
  display: grid;
  gap: 0.16rem;
  margin: 0.1rem 0 0.1rem 6px;
  padding: 0.2rem 0 0.2rem 0.85rem;
  border-left: 2px solid #1e293b;
}
.${c} .sub span {
  position: relative;
  font-size: 0.71rem;
  color: #64748b;
}
.${c} .sub span::before {
  content: '';
  position: absolute;
  left: -0.98rem;
  top: 50%;
  width: 7px;
  height: 1.5px;
  background: #1e293b;
}
.${c} .sub .dn { color: #94a3b8; }
.${c} .sub .dn::before { background: ${g.b}; }
.${c} .sub .ac {
  color: ${g.a};
  font-weight: 600;
}
.${c} .sub .ac::before { background: ${g.a}; }`
    add(mk({
      name: `${g.name} Nested Steps`,
      category: 'Timelines & Steps',
      description: `Two-level plan where sub-tasks hang off a rail indented under their parent, each connected by a stub, so progress inside a phase is visible without expanding it.`,
      html, css,
      tags: ['timeline', 'nested', 'substeps', 'plan', 'hierarchy', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TIMELINES & STEPS — delivery tracker  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-timeline-delivery-${t.name}`)
    const html = `<div class="${c}"><div class="rail"><i class="fill"></i><i class="van"></i><span class="n dn"></span><span class="n dn"></span><span class="n ac"></span><span class="n"></span></div><div class="lb"><em>Packed</em><em>Sent</em><em class="on">In transit</em><em>Delivered</em></div><b class="eta">Arriving Thursday, 2–4pm</b></div>`
    const css = `.${c} {
  width: 250px;
  padding: 0.85rem 0.7rem 0.7rem;
  border-radius: 0.55rem;
  background: #0f172a;
  border: 1px solid #1e293b;
}
.${c} .rail {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 14px;
  margin: 0 6px;
}
.${c} .rail::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  margin-top: -1px;
  border-radius: 1px;
  background: #1e293b;
}
.${c} .fill {
  position: absolute;
  left: 0;
  top: 50%;
  height: 2px;
  margin-top: -1px;
  border-radius: 1px;
  background: linear-gradient(90deg, ${t.a}, ${t.c});
  animation: ${c}-adv 1.6s cubic-bezier(0.4, 0, 0.2, 1) 1 both;
}
@keyframes ${c}-adv { from { width: 0; } to { width: 66%; } }
.${c} .n {
  position: relative;
  z-index: 1;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #0f172a;
  box-shadow: inset 0 0 0 2px #334155;
}
.${c} .n.dn {
  background: linear-gradient(135deg, ${t.a}, ${t.b});
  box-shadow: none;
}
.${c} .n.ac {
  background: ${t.c};
  box-shadow: 0 0 0 3px rgba(${rgbOf(t.c)}, 0.25);
}
.${c} .van {
  position: absolute;
  top: 50%;
  left: 66%;
  width: 18px;
  height: 11px;
  margin: -14px 0 0 -9px;
  border-radius: 2px 3px 2px 2px;
  background: ${t.c};
  animation: ${c}-roll 1.6s cubic-bezier(0.4, 0, 0.2, 1) 1 both;
}
@keyframes ${c}-roll { from { left: 0%; } to { left: 66%; } }
.${c} .van::before {
  content: '';
  position: absolute;
  right: -5px;
  top: 3px;
  width: 6px;
  height: 8px;
  border-radius: 1px 2px 2px 1px;
  background: ${t.b};
}
.${c} .lb {
  display: flex;
  justify-content: space-between;
  margin-top: 0.4rem;
}
.${c} .lb em {
  width: 25%;
  font-style: normal;
  font-size: 0.6rem;
  text-align: center;
  color: #475569;
}
.${c} .lb em:first-child { text-align: left; }
.${c} .lb em:last-child  { text-align: right; }
.${c} .lb .on { color: ${t.c}; font-weight: 650; }
.${c} .eta {
  display: block;
  margin-top: 0.55rem;
  padding-top: 0.5rem;
  border-top: 1px solid #1e293b;
  font-size: 0.72rem;
  color: #e2e8f0;
}`
    add(mk({
      name: `${t.name} Delivery Tracker`,
      category: 'Timelines & Steps',
      description: `Parcel progress with the vehicle riding the rail to the current node, both driven by the same easing so the marker and the fill arrive together.`,
      html, css,
      tags: ['timeline', 'delivery', 'tracking', 'order', 'shipping', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOGGLES & SWITCHES — rotary knob  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-toggle-knob-${g.name}`)
    const html = `<div class="${c}"><i class="ticks"></i><div class="kn"><i class="ind"></i></div></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 116px;
  height: 116px;
}
.${c} .ticks {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    #334155 0deg 1.5deg,
    transparent 1.5deg 30deg
  );
  -webkit-mask: radial-gradient(farthest-side, transparent 78%, #000 79%);
  mask: radial-gradient(farthest-side, transparent 78%, #000 79%);
  transition: background 0.4s ease;
}
.${c}:hover .ticks {
  background: repeating-conic-gradient(
    from 0deg,
    ${g.b} 0deg 1.5deg,
    transparent 1.5deg 30deg
  );
}
.${c} .kn {
  position: relative;
  display: grid;
  place-items: start center;
  width: 80px;
  height: 80px;
  padding-top: 8px;
  border-radius: 50%;
  cursor: grab;
  background:
    radial-gradient(circle at 38% 30%, #334155, #0f172a 70%);
  box-shadow:
    inset 0 1px 0 rgba(248,250,252,0.14),
    0 8px 20px rgba(0,0,0,0.55);
  transform: rotate(-132deg);
  transition: transform 0.45s cubic-bezier(0.34, 1.25, 0.64, 1), box-shadow 0.3s ease;
}
.${c}:hover .kn {
  transform: rotate(108deg);
  box-shadow:
    inset 0 1px 0 rgba(248,250,252,0.14),
    0 8px 24px rgba(${rgbOf(g.a)}, 0.4);
}
.${c} .ind {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background: linear-gradient(180deg, ${g.a}, ${g.b});
  box-shadow: 0 0 8px rgba(${rgbOf(g.a)}, 0.8);
}
.${c} .kn:active { cursor: grabbing; }`
    add(mk({
      name: `${g.name} Rotary Knob`,
      category: 'Toggles & Switches',
      description: `Hardware-style control turning through 240 degrees of its detent ring, the pointer riding the body so the value is read where the mark meets the ticks.`,
      html, css,
      tags: ['toggle', 'knob', 'rotary', 'dial', 'hardware', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOGGLES & SWITCHES — settings switch list  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-toggle-settings-${t.name}`)
    const html = `<div class="${c}"><label><span>Email digest<em>Weekly summary</em></span><i class="sw on"></i></label><label><span>Push alerts<em>Realtime</em></span><i class="sw"></i></label><label><span>Product news<em>Occasional</em></span><i class="sw on"></i></label></div>`
    const css = `.${c} {
  width: 244px;
  padding: 0.15rem 0.7rem;
  border-radius: 0.55rem;
  background: #0f172a;
  border: 1px solid #1e293b;
}
.${c} label {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0;
  border-top: 1px solid #1e293b;
  cursor: pointer;
}
.${c} label:first-child { border-top: none; }
.${c} span {
  display: grid;
  gap: 0.08rem;
  font-size: 0.76rem;
  color: #e2e8f0;
}
.${c} em {
  font-style: normal;
  font-size: 0.64rem;
  color: #64748b;
}
.${c} .sw {
  position: relative;
  flex: none;
  margin-left: auto;
  width: 36px;
  height: 20px;
  border-radius: 999px;
  background: #334155;
  transition: background 0.26s ease;
}
.${c} .sw::after {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #f8fafc;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
  transition: transform 0.26s cubic-bezier(0.34, 1.45, 0.64, 1), width 0.18s ease;
}
.${c} .sw.on { background: linear-gradient(135deg, ${t.a}, ${t.b}); }
.${c} .sw.on::after { transform: translateX(16px); }
.${c} label:hover .sw::after { width: 20px; }
.${c} label:hover .sw.on::after { transform: translateX(12px); }`
    add(mk({
      name: `${t.name} Settings Switches`,
      category: 'Toggles & Switches',
      description: `Preference rows where the whole line is the target and the thumb stretches under the pointer before it travels, so the switch feels pressed rather than clicked.`,
      html, css,
      tags: ['toggle', 'settings', 'switch list', 'preferences', 'rows', t.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOOLTIPS & POPOVERS — share popover  (12)
   * ========================================================== */
  for (const g of GRADPAIRS) {
    const c = cls(`v10-tip-share-${g.name}`)
    const html = `<div class="${c}"><button class="tg">Share</button><div class="pop"><div class="tg3"><i class="s1"></i><i class="s2"></i><i class="s3"></i><i class="s4"></i></div><div class="cp"><span>hoverlab.dev/e/8f2a</span><button>Copy</button></div></div></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  padding-bottom: 116px;
}
.${c} .tg {
  padding: 0.42rem 0.9rem;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.76rem;
  font-weight: 650;
  color: #0b1120;
  cursor: pointer;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}
.${c} .pop {
  position: absolute;
  left: 0;
  top: 44px;
  width: 100%;
  padding: 0.6rem;
  border-radius: 0.55rem;
  background: #111827;
  border: 1px solid #1f2937;
  box-shadow: 0 16px 36px rgba(0,0,0,0.55);
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
  transform-origin: top left;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.${c}:hover .pop { opacity: 1; transform: none; pointer-events: auto; }
.${c} .tg3 {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}
.${c} .tg3 i {
  flex: 1;
  height: 34px;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} .tg3 i:hover { transform: translateY(-3px); }
.${c} .s1 { background: linear-gradient(140deg, ${g.a}, ${g.b}); }
.${c} .s2 { background: #1e293b; box-shadow: inset 0 0 0 1px #334155; }
.${c} .s3 { background: linear-gradient(140deg, ${g.b}, ${g.a}); }
.${c} .s4 { background: #1e293b; box-shadow: inset 0 0 0 1px #334155; }
.${c} .cp {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.3rem 0.3rem 0.5rem;
  border-radius: 0.4rem;
  background: #0b1120;
  box-shadow: inset 0 0 0 1px #1f2937;
}
.${c} .cp span {
  flex: 1;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.64rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.${c} .cp button {
  padding: 0.22rem 0.45rem;
  border: none;
  border-radius: 0.28rem;
  font-size: 0.64rem;
  font-weight: 650;
  color: #0b1120;
  cursor: pointer;
  background: linear-gradient(135deg, ${g.a}, ${g.b});
}`
    add(mk({
      name: `${g.name} Share Popover`,
      category: 'Tooltips & Popovers',
      description: `Share sheet pairing a row of destination tiles with the raw link and its copy button, since the link is what most people were reaching for anyway.`,
      html, css,
      tags: ['popover', 'share', 'social', 'copy link', 'menu', g.name.toLowerCase()],
    }))
  }

  /* ============================================================
   *  TOOLTIPS & POPOVERS — filter popover with footer  (8)
   * ========================================================== */
  for (const t of TRIOS) {
    const c = cls(`v10-tip-filter-${t.name}`)
    const html = `<div class="${c}"><button class="tg">Filter<b>2</b></button><div class="pop"><em>Status</em><label><i class="cb on"></i>Published</label><label><i class="cb on"></i>Scheduled</label><label><i class="cb"></i>Draft</label><div class="ft"><button class="rs">Reset</button><button class="ap">Apply</button></div></div></div>`
    const css = `.${c} {
  position: relative;
  width: 190px;
  padding-bottom: 170px;
}
.${c} .tg {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.7rem;
  border-radius: 0.4rem;
  background: #111827;
  border: 1px solid #1f2937;
  font-size: 0.75rem;
  color: #e2e8f0;
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.${c}:hover .tg { border-color: ${t.b}; }
.${c} .tg b {
  padding: 0.02rem 0.32rem;
  border-radius: 999px;
  font-size: 0.6rem;
  color: #0b1120;
  background: linear-gradient(135deg, ${t.a}, ${t.b});
}
.${c} .pop {
  position: absolute;
  left: 0;
  top: 42px;
  width: 100%;
  padding: 0.55rem 0.6rem 0.5rem;
  border-radius: 0.5rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  box-shadow: 0 16px 34px rgba(0,0,0,0.55);
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.${c}:hover .pop { opacity: 1; transform: none; pointer-events: auto; }
.${c} em {
  display: block;
  margin-bottom: 0.3rem;
  font-style: normal;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #475569;
}
.${c} label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.24rem 0;
  font-size: 0.74rem;
  color: #cbd5e1;
  cursor: pointer;
}
.${c} .cb {
  position: relative;
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 0.22rem;
  border: 1.5px solid #334155;
}
.${c} .cb.on {
  border-color: transparent;
  background: linear-gradient(135deg, ${t.b}, ${t.c});
}
.${c} .cb.on::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 3.5px;
  width: 7px;
  height: 3.5px;
  border-left: 1.7px solid #0b1120;
  border-bottom: 1.7px solid #0b1120;
  transform: rotate(-45deg);
}
.${c} .ft {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.5rem;
  padding-top: 0.45rem;
  border-top: 1px solid #1e293b;
}
.${c} .ft button {
  flex: 1;
  padding: 0.3rem;
  border-radius: 0.32rem;
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
}
.${c} .rs {
  border: 1px solid #334155;
  background: transparent;
  color: #94a3b8;
}
.${c} .ap {
  border: none;
  color: #0b1120;
  background: linear-gradient(135deg, ${t.a}, ${t.b});
}`
    add(mk({
      name: `${t.name} Filter Popover`,
      category: 'Tooltips & Popovers',
      description: `Deferred-commit filter menu — selections stage inside the panel behind reset and apply, with the active count carried on the trigger so it survives closing.`,
      html, css,
      tags: ['popover', 'filter', 'apply', 'facets', 'menu', t.name.toLowerCase()],
    }))
  }
}
