// scripts/generate-effects-v13-g.mjs
//
// Thirteenth wave, part G: Micro-interactions (6), Filters & Blend
// Modes (4).
//
// Shape-budget group: Micro-interactions is one of the categories still
// genuinely short of shapes, so it takes six; Filters is "thinning" and
// takes four.
//
//   Micro   — send plane, delete bin, emoji rating, scrub preview,
//             pin snap, play row equaliser
//   Filters — multiply wash, difference text, unblur reveal, blend row
//
// Every micro-interaction here is driven by :hover or :active on the
// element itself, so it reads at rest and demonstrates on contact.

export function generateV13G(ctx) {
  const { cls, mk, add } = ctx

  /* ------------------------------------------------------------------ */
  /* Micro-interactions                                                  */
  /* ------------------------------------------------------------------ */

  /* MI1. Send plane — the paper plane flies off and a fresh one arrives */
  {
    const c = cls('v13-mi-send')
    const html = `<button class="${c}"><span>Send</span><i></i></button>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  background: #2563eb;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  overflow: hidden;
  transition: background 0.2s ease;
}
.${c} span { transition: transform 0.3s ease; }
.${c} i {
  display: block;
  width: 14px;
  height: 14px;
  background: #fff;
  clip-path: polygon(0 0, 100% 50%, 0 100%, 22% 50%);
  transition: transform 0.45s cubic-bezier(0.6, 0, 0.4, 1), opacity 0.2s ease;
}
.${c}:hover { background: #3b82f6; }
.${c}:active span { transform: translateX(-4px); }
.${c}:active i {
  transform: translate(42px, -26px) rotate(18deg);
  opacity: 0;
  transition: transform 0.4s cubic-bezier(0.5, 0, 0.9, 0.4), opacity 0.3s ease 0.1s;
}`
    add(mk({
      name: 'Send Plane',
      category: 'Micro-interactions',
      description: 'Send button whose paper plane launches up and out of the frame when pressed, the label giving way as it goes.',
      html, css,
      tags: ['send', 'plane', 'launch', 'press', 'message'],
    }))
  }

  /* MI2. Delete bin — the lid tips open when the row is hovered */
  {
    const c = cls('v13-mi-bin')
    const html = `<div class="${c}"><span>Draft — untitled</span><button><i class="lid"></i><i class="can"></i></button></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 230px;
  padding: 0.5rem 0.6rem;
  font-size: 0.76rem;
  color: #cbd5e1;
  background: #131c31;
  border: 1px solid #253049;
  border-radius: 0.5rem;
  transition: border-color 0.25s ease, background 0.25s ease;
}
.${c} button {
  position: relative;
  width: 26px;
  height: 26px;
  background: none;
  border: none;
  cursor: pointer;
}
.${c} .lid {
  position: absolute;
  left: 4px;
  top: 5px;
  width: 18px;
  height: 3px;
  border-radius: 2px;
  background: #94a3b8;
  transform-origin: left center;
  transition: transform 0.3s cubic-bezier(0.34, 1.5, 0.64, 1), background 0.25s ease;
}
.${c} .lid::before {
  content: '';
  position: absolute;
  left: 6px;
  top: -3px;
  width: 6px;
  height: 3px;
  border-radius: 2px 2px 0 0;
  background: inherit;
}
.${c} .can {
  position: absolute;
  left: 6px;
  top: 10px;
  width: 14px;
  height: 13px;
  border: 2px solid #94a3b8;
  border-top: none;
  border-radius: 0 0 3px 3px;
  transition: border-color 0.25s ease, transform 0.2s ease;
}
.${c}:hover { border-color: #7f1d1d; background: #1a1218; }
.${c}:hover .lid { transform: rotate(-38deg) translateY(-1px); background: #f87171; }
.${c}:hover .can { border-color: #f87171; }
.${c} button:active .can { transform: translateY(2px) scaleY(0.9); }`
    add(mk({
      name: 'Delete Bin Hover',
      category: 'Micro-interactions',
      description: 'List row whose bin icon tips its lid open and turns red as the row is hovered, the can squashing when pressed.',
      html, css,
      tags: ['delete', 'bin', 'lid', 'hover', 'destructive'],
    }))
  }

  /* MI3. Emoji rating — faces that swell and colour on hover */
  {
    const c = cls('v13-mi-emoji')
    const html = `<div class="${c}"><label><input type="radio" name="${c}" /><span>😖</span></label><label><input type="radio" name="${c}" /><span>🙁</span></label><label><input type="radio" name="${c}" /><span>😐</span></label><label><input type="radio" name="${c}" checked /><span>🙂</span></label><label><input type="radio" name="${c}" /><span>🤩</span></label></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.35rem;
  padding: 0.4rem 0.5rem;
  background: #131c31;
  border: 1px solid #253049;
  border-radius: 999px;
}
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} label { cursor: pointer; }
.${c} span {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  font-size: 1.1rem;
  border-radius: 50%;
  filter: grayscale(1) opacity(0.55);
  transition: transform 0.25s cubic-bezier(0.34, 1.6, 0.64, 1), filter 0.25s ease, background 0.25s ease;
}
.${c} label:hover span { filter: none; transform: scale(1.25) translateY(-2px); }
.${c} input:checked + span {
  filter: none;
  background: rgba(56,189,248,0.16);
  transform: scale(1.1);
}`
    add(mk({
      name: 'Emoji Rating Faces',
      category: 'Micro-interactions',
      description: 'Row of grey faces that regain colour and jump forward under the cursor, the chosen one keeping a tinted disc behind it.',
      html, css,
      tags: ['rating', 'emoji', 'faces', 'feedback', 'radio'],
    }))
  }

  /* MI4. Scrub preview — hovering a video card steps through frames */
  {
    const c = cls('v13-mi-scrub')
    const html = `<div class="${c}"><div class="th"><i></i><em>2:14</em></div><b>Keyframe editor tour</b></div>`
    const css = `.${c} {
  width: 190px;
  cursor: pointer;
}
.${c} .th {
  position: relative;
  height: 106px;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #0d1424;
}
.${c} i {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 70% at 20% 30%, #f472b6, transparent 60%),
    radial-gradient(60% 70% at 50% 60%, #38bdf8, transparent 60%),
    radial-gradient(60% 70% at 80% 35%, #fbbf24, transparent 60%),
    linear-gradient(140deg, #1e1b4b, #0f172a);
  background-size: 400% 100%;
  background-position: 0% 50%;
}
.${c} em {
  position: absolute;
  right: 5px;
  bottom: 5px;
  padding: 0 4px;
  font-style: normal;
  font-size: 0.6rem;
  color: #e2e8f0;
  background: rgba(2,6,23,0.75);
  border-radius: 3px;
}
.${c} .th::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 0;
  background: #f472b6;
  transition: width 0.1s linear;
}
.${c} b {
  display: block;
  margin-top: 0.4rem;
  font-size: 0.76rem;
  font-weight: 500;
  color: #cbd5e1;
  transition: color 0.2s ease;
}
.${c}:hover i { animation: ${c}-scrub 2s steps(4) infinite; }
.${c}:hover .th::after { width: 100%; transition: width 2s linear; }
.${c}:hover b { color: #f1f5f9; }
@keyframes ${c}-scrub {
  from { background-position: 0% 50%; }
  to   { background-position: 100% 50%; }
}`
    add(mk({
      name: 'Scrub Preview Thumbnail',
      category: 'Micro-interactions',
      description: 'Video card that steps through four preview frames while hovered, a thin scrub line filling along the bottom as it goes.',
      html, css,
      tags: ['scrub', 'preview', 'frames', 'steps', 'video'],
    }))
  }

  /* MI5. Pin snap — the pin drops and locks with a jolt */
  {
    const c = cls('v13-mi-pin')
    const html = `<label class="${c}"><input type="checkbox" checked /><span class="p"><i></i></span><em>Pinned to top</em></label>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.4rem 0.7rem 0.4rem 0.5rem;
  font-size: 0.76rem;
  color: #94a3b8;
  background: #131c31;
  border: 1px solid #253049;
  border-radius: 999px;
  cursor: pointer;
  transition: border-color 0.25s ease, color 0.25s ease;
}
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} .p {
  position: relative;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
}
.${c} i {
  display: block;
  width: 8px;
  height: 12px;
  border-radius: 4px 4px 1px 1px;
  background: #64748b;
  transform: rotate(38deg) translateY(-2px);
  transition: transform 0.3s cubic-bezier(0.34, 1.7, 0.64, 1), background 0.25s ease;
}
.${c} i::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 12px;
  width: 2px;
  height: 8px;
  margin-left: -1px;
  background: inherit;
  border-radius: 0 0 1px 1px;
}
.${c} em { font-style: normal; }
.${c} input:checked ~ .p i {
  background: #fbbf24;
  transform: rotate(0deg) translateY(0);
}
.${c}:has(input:checked) { border-color: rgba(251,191,36,0.5); color: #fcd34d; }
.${c}:hover i { transform: rotate(20deg) translateY(-1px); }
.${c}:hover input:checked ~ .p i { transform: rotate(0deg) translateY(-2px) scale(1.1); }`
    add(mk({
      name: 'Pin Snap Toggle',
      category: 'Micro-interactions',
      description: 'Pin chip whose tack swings upright and turns gold when pinned, the whole chip picking up the same amber outline.',
      html, css,
      tags: ['pin', 'snap', 'toggle', 'rotate', 'bookmark'],
    }))
  }

  /* MI6. Play row equaliser — the track number becomes bouncing bars */
  {
    const c = cls('v13-mi-playrow')
    const html = `<div class="${c}"><div class="ix"><b>04</b><span class="eq"><i></i><i></i><i></i></span></div><div class="ti"><b>Night Bus</b><small>Kaho Ito</small></div><em>3:42</em></div>`
    const css = `.${c} {
  display: grid;
  grid-template-columns: 26px 1fr auto;
  align-items: center;
  gap: 0.6rem;
  width: 236px;
  padding: 0.4rem 0.55rem;
  border-radius: 0.45rem;
  color: #cbd5e1;
  cursor: pointer;
  transition: background 0.2s ease;
}
.${c}:hover { background: #1a2540; }
.${c} .ix { position: relative; display: grid; place-items: center; height: 20px; }
.${c} .ix b {
  font-size: 0.72rem;
  color: #64748b;
  font-variant-numeric: tabular-nums;
  transition: opacity 0.2s ease;
}
.${c} .eq {
  position: absolute;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.${c} .eq i {
  display: block;
  width: 3px;
  height: 100%;
  border-radius: 1px;
  background: #34d399;
  transform-origin: bottom;
}
.${c}:hover .ix b { opacity: 0; }
.${c}:hover .eq { opacity: 1; }
.${c}:hover .eq i:nth-child(1) { animation: ${c}-bar 0.7s ease-in-out infinite; }
.${c}:hover .eq i:nth-child(2) { animation: ${c}-bar 0.7s ease-in-out 0.15s infinite; }
.${c}:hover .eq i:nth-child(3) { animation: ${c}-bar 0.7s ease-in-out 0.3s infinite; }
.${c} .ti b { display: block; font-size: 0.78rem; color: #f1f5f9; }
.${c} .ti small { font-size: 0.65rem; color: #64748b; }
.${c} em { font-style: normal; font-size: 0.68rem; color: #64748b; font-variant-numeric: tabular-nums; }
@keyframes ${c}-bar {
  0%, 100% { transform: scaleY(0.3); }
  50%      { transform: scaleY(1); }
}`
    add(mk({
      name: 'Play Row Equalizer',
      category: 'Micro-interactions',
      description: 'Track row where the index number fades out on hover and three bouncing equaliser bars take its place.',
      html, css,
      tags: ['playlist', 'equalizer', 'swap', 'hover', 'music'],
    }))
  }

  /* ------------------------------------------------------------------ */
  /* Filters & Blend Modes                                               */
  /* ------------------------------------------------------------------ */

  /* FB1. Multiply wash — a colour layer multiplied over a photo tile */
  {
    const c = cls('v13-fb-multiply')
    const html = `<div class="${c}"><i></i><b>MULTIPLY</b></div>`
    const css = `.${c} {
  position: relative;
  width: 200px;
  height: 124px;
  border-radius: 0.6rem;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(70% 80% at 25% 20%, #fef3c7, transparent 60%),
    radial-gradient(80% 90% at 80% 80%, #94a3b8, transparent 65%),
    linear-gradient(150deg, #e2e8f0, #64748b);
}
.${c} i {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, #f43f5e, #6366f1);
  mix-blend-mode: multiply;
  opacity: 0;
  transition: opacity 0.4s ease;
}
.${c} b {
  position: absolute;
  left: 0.7rem;
  bottom: 0.6rem;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  color: #0f172a;
  mix-blend-mode: overlay;
}
.${c}:hover i { opacity: 1; }`
    add(mk({
      name: 'Multiply Wash Tile',
      category: 'Filters & Blend Modes',
      description: 'Light photo tile that takes a two-colour gradient wash multiplied over it on hover, deepening every tone at once.',
      html, css,
      tags: ['multiply', 'blend', 'wash', 'duotone', 'hover'],
      darkSurface: true,
    }))
  }

  /* FB2. Difference text — a heading inverting whatever it crosses */
  {
    const c = cls('v13-fb-difference')
    const html = `<div class="${c}"><i></i><b>INVERT</b></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 210px;
  height: 110px;
  border-radius: 0.6rem;
  overflow: hidden;
  isolation: isolate;
  background: repeating-linear-gradient(
    -55deg,
    #f8fafc 0 16px,
    #0f172a 16px 32px
  );
}
.${c} i {
  position: absolute;
  inset: -30%;
  background: repeating-linear-gradient(-55deg, #38bdf8 0 16px, transparent 16px 32px);
  opacity: 0.4;
  animation: ${c}-slide 6s linear infinite;
}
.${c} b {
  position: relative;
  font-size: 1.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #fff;
  mix-blend-mode: difference;
}
@keyframes ${c}-slide {
  from { transform: translateX(0); }
  to   { transform: translateX(32px); }
}`
    add(mk({
      name: 'Difference Stripe Text',
      category: 'Filters & Blend Modes',
      description: 'Heading set in difference blend over a drifting stripe field, so each letter inverts whatever band it happens to cross.',
      html, css,
      tags: ['difference', 'blend', 'stripes', 'invert', 'typography'],
      darkSurface: true,
    }))
  }

  /* FB3. Unblur reveal — a frosted card that comes into focus */
  {
    const c = cls('v13-fb-unblur')
    const html = `<div class="${c}"><div class="ct"><b>Sealed bid</b><p>£48,500 · submitted 12 Mar</p></div><span>hover to reveal</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 214px;
  height: 108px;
  border-radius: 0.6rem;
  overflow: hidden;
  background: linear-gradient(150deg, #1e1b4b, #0f172a);
  border: 1px solid #29344d;
  cursor: pointer;
}
.${c} .ct {
  text-align: center;
  color: #e2e8f0;
  filter: blur(7px);
  transform: scale(1.04);
  transition: filter 0.45s ease, transform 0.45s ease;
}
.${c} b { display: block; font-size: 0.95rem; }
.${c} p { margin: 0.2rem 0 0; font-size: 0.75rem; color: #a5b4fc; }
.${c} span {
  position: absolute;
  bottom: 0.5rem;
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
  transition: opacity 0.3s ease;
}
.${c}:hover .ct { filter: blur(0); transform: scale(1); }
.${c}:hover span { opacity: 0; }`
    add(mk({
      name: 'Unblur Reveal',
      category: 'Filters & Blend Modes',
      description: 'Card holding blurred private figures that sharpen into focus on hover as the prompt underneath fades away.',
      html, css,
      tags: ['blur', 'reveal', 'privacy', 'focus', 'hover'],
    }))
  }

  /* FB4. Blend mode row — the same swatch under five different modes */
  {
    const c = cls('v13-fb-blendrow')
    const html = `<div class="${c}"><figure><i class="m1"></i><figcaption>screen</figcaption></figure><figure><i class="m2"></i><figcaption>overlay</figcaption></figure><figure><i class="m3"></i><figcaption>color-dodge</figcaption></figure><figure><i class="m4"></i><figcaption>exclusion</figcaption></figure></div>`
    const css = `.${c} {
  display: flex;
  gap: 6px;
}
.${c} figure {
  margin: 0;
  display: grid;
  justify-items: center;
  gap: 0.3rem;
}
.${c} i {
  position: relative;
  display: block;
  width: 54px;
  height: 54px;
  border-radius: 0.45rem;
  overflow: hidden;
  isolation: isolate;
  background: linear-gradient(140deg, #4338ca, #0e7490);
  transition: transform 0.25s ease;
}
.${c} i::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 32% 30%, #fbbf24 0 32%, transparent 34%),
              radial-gradient(circle at 70% 70%, #f43f5e 0 30%, transparent 32%);
}
.${c} .m1::after { mix-blend-mode: screen; }
.${c} .m2::after { mix-blend-mode: overlay; }
.${c} .m3::after { mix-blend-mode: color-dodge; }
.${c} .m4::after { mix-blend-mode: exclusion; }
.${c} figcaption { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.55rem; color: #64748b; }
.${c} figure:hover i { transform: scale(1.08); }
.${c} figure:hover figcaption { color: #cbd5e1; }`
    add(mk({
      name: 'Blend Mode Row',
      category: 'Filters & Blend Modes',
      description: 'Four identical swatches showing the same two discs composited under screen, overlay, colour-dodge and exclusion.',
      html, css,
      tags: ['blend-modes', 'comparison', 'swatches', 'reference', 'composite'],
    }))
  }
}
