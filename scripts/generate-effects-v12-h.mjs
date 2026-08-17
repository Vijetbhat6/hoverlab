// scripts/generate-effects-v12-h.mjs
//
// Twelfth wave, part H: Sliders & Carousels, Icons & Shapes,
// Micro-interactions, Filters & Blend Modes — six designs each, one
// entry per design (same discipline as v11: no colorway or size
// stamping, every entry is a different mechanic).
//
// Sliders are CSS-only: styled <input type=range>, radio-driven
// carousels, scroll-snap rails and one infinite 3D ring. Filters &
// Blend Modes use CSS-drawn gradient blobs as the subject so the
// filter or blend is what you actually see.

export function generateV12H(ctx) {
  const { cls, mk, add } = ctx

  /* ───────────── Sliders & Carousels ───────────── */

  /* 1. Hue range — the track is a full spectrum, the thumb a white ring */
  {
    const c = cls('v12-sl-hue')
    const html = `<div class="${c}"><span class="lbl">Hue</span><input type="range" min="0" max="360" value="210"></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 240px;
  padding: 0.85rem 1rem;
  background: #131a2e;
  border: 1px solid #1e293b;
  border-radius: 0.75rem;
  color: #e2e8f0;
  font-size: 0.8rem;
  font-weight: 600;
}
.${c} input {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  min-width: 0;
  height: 12px;
  margin: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
  outline: none;
  cursor: pointer;
}
.${c} input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: transparent;
  border: 4px solid #fff;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.5);
  transition: transform 0.2s ease;
}
.${c} input::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: transparent;
  border: 4px solid #fff;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.5);
}
.${c} input:hover::-webkit-slider-thumb { transform: scale(1.2); }`
    add(mk({
      name: 'Spectrum Hue Slider',
      category: 'Sliders & Carousels',
      description: 'Range input whose track is a full colour spectrum, with a transparent ring thumb that shows the hue underneath.',
      html, css,
      tags: ['range', 'hue', 'spectrum', 'color-picker', 'slider'],
    }))
  }

  /* 2. Segmented block range — discrete blocks drawn on the track, square thumb */
  {
    const c = cls('v12-sl-blocks')
    const html = `<div class="${c}"><input type="range" min="0" max="10" value="6"><div class="row"><span>0</span><span>Level</span><span>10</span></div></div>`
    const css = `.${c} {
  width: 240px;
  padding: 0.9rem 1rem 0.7rem;
  background: #131a2e;
  border: 1px solid #1e293b;
  border-radius: 0.75rem;
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.${c} input {
  -webkit-appearance: none;
  appearance: none;
  display: block;
  width: 100%;
  height: 16px;
  margin: 0;
  border-radius: 4px;
  background: repeating-linear-gradient(90deg, #f97316 0 16px, transparent 16px 20px);
  outline: none;
  cursor: pointer;
}
.${c} input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 26px;
  border-radius: 4px;
  background: #fff7ed;
  border: 2px solid #f97316;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  transition: background 0.2s ease;
}
.${c} input::-moz-range-thumb {
  width: 14px;
  height: 22px;
  border-radius: 4px;
  background: #fff7ed;
  border: 2px solid #f97316;
}
.${c} input:hover::-webkit-slider-thumb { background: #f97316; }
.${c} .row {
  display: flex;
  justify-content: space-between;
  margin-top: 0.55rem;
}`
    add(mk({
      name: 'Block Segment Range',
      category: 'Sliders & Carousels',
      description: 'Range input with a track drawn as discrete orange blocks and a tall square thumb that fills in on hover.',
      html, css,
      tags: ['range', 'segments', 'blocks', 'stepped', 'slider'],
    }))
  }

  /* 3. Expanding panel carousel — radio picks which vertical strip opens */
  {
    const c = cls('v12-sl-panels')
    const html = `<div class="${c}"><input type="radio" name="${c}" id="${c}-a" checked><input type="radio" name="${c}" id="${c}-b"><input type="radio" name="${c}" id="${c}-c"><input type="radio" name="${c}" id="${c}-d"><div class="strip"><label for="${c}-a" class="p1"><span>Alps</span></label><label for="${c}-b" class="p2"><span>Coast</span></label><label for="${c}-c" class="p3"><span>Dunes</span></label><label for="${c}-d" class="p4"><span>Fjord</span></label></div></div>`
    const css = `.${c} { position: relative; width: 250px; height: 130px; }
.${c} input { position: absolute; opacity: 0; pointer-events: none; }
.${c} .strip {
  display: flex;
  gap: 4px;
  width: 100%;
  height: 100%;
}
.${c} label {
  flex: 1;
  position: relative;
  border-radius: 0.6rem;
  cursor: pointer;
  overflow: hidden;
  transition: flex 0.45s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease;
}
.${c} .p1 { background: linear-gradient(160deg, #6366f1, #1e1b4b); }
.${c} .p2 { background: linear-gradient(160deg, #0ea5e9, #0c4a6e); }
.${c} .p3 { background: linear-gradient(160deg, #f59e0b, #78350f); }
.${c} .p4 { background: linear-gradient(160deg, #10b981, #064e3b); }
.${c} label span {
  position: absolute;
  left: 0.6rem;
  bottom: 0.5rem;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.${c} label:hover { filter: brightness(1.15); }
.${c} #${c}-a:checked ~ .strip .p1,
.${c} #${c}-b:checked ~ .strip .p2,
.${c} #${c}-c:checked ~ .strip .p3,
.${c} #${c}-d:checked ~ .strip .p4 { flex: 4; }
.${c} #${c}-a:checked ~ .strip .p1 span,
.${c} #${c}-b:checked ~ .strip .p2 span,
.${c} #${c}-c:checked ~ .strip .p3 span,
.${c} #${c}-d:checked ~ .strip .p4 span { opacity: 1; transform: none; }`
    add(mk({
      name: 'Expanding Panel Carousel',
      category: 'Sliders & Carousels',
      description: 'Four vertical strips where the selected panel expands to reveal its caption, driven by hidden radios with no JavaScript.',
      html, css,
      tags: ['carousel', 'accordion', 'radio', 'expand', 'panels'],
    }))
  }

  /* 4. Cube face carousel — radios spin a 3D cube to the chosen face */
  {
    const c = cls('v12-sl-cube')
    const html = `<div class="${c}"><input type="radio" name="${c}" id="${c}-1" checked><input type="radio" name="${c}" id="${c}-2"><input type="radio" name="${c}" id="${c}-3"><input type="radio" name="${c}" id="${c}-4"><div class="scene"><div class="cube"><div class="f f1">Design</div><div class="f f2">Build</div><div class="f f3">Test</div><div class="f f4">Ship</div></div></div><div class="nav"><label for="${c}-1"></label><label for="${c}-2"></label><label for="${c}-3"></label><label for="${c}-4"></label></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  width: 220px;
}
.${c} input { position: absolute; opacity: 0; pointer-events: none; }
.${c} .scene { width: 160px; height: 80px; perspective: 500px; }
.${c} .cube {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform: translateZ(-80px) rotateY(0deg);
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .f {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  border-radius: 0.5rem;
  backface-visibility: hidden;
}
.${c} .f1 { background: #8b5cf6; transform: rotateY(0deg) translateZ(80px); }
.${c} .f2 { background: #a855f7; transform: rotateY(90deg) translateZ(80px); }
.${c} .f3 { background: #7c3aed; transform: rotateY(180deg) translateZ(80px); }
.${c} .f4 { background: #6d28d9; transform: rotateY(270deg) translateZ(80px); }
.${c} #${c}-2:checked ~ .scene .cube { transform: translateZ(-80px) rotateY(-90deg); }
.${c} #${c}-3:checked ~ .scene .cube { transform: translateZ(-80px) rotateY(-180deg); }
.${c} #${c}-4:checked ~ .scene .cube { transform: translateZ(-80px) rotateY(-270deg); }
.${c} .nav { display: flex; gap: 8px; }
.${c} .nav label {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #312e81;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}
.${c} .nav label:hover { transform: scale(1.3); }
.${c} #${c}-1:checked ~ .nav label:nth-child(1),
.${c} #${c}-2:checked ~ .nav label:nth-child(2),
.${c} #${c}-3:checked ~ .nav label:nth-child(3),
.${c} #${c}-4:checked ~ .nav label:nth-child(4) { background: #c4b5fd; }`
    add(mk({
      name: 'Cube Face Carousel',
      category: 'Sliders & Carousels',
      description: 'A 3D cube that rotates to show the face selected by the dot navigation, using radio inputs and no JavaScript.',
      html, css,
      tags: ['carousel', '3d', 'cube', 'radio', 'rotate'],
    }))
  }

  /* 5. Ring rotation carousel — six cards on a slow infinite 3D turntable */
  {
    const c = cls('v12-sl-ring')
    const html = `<div class="${c}"><div class="ring"><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i></div></div>`
    const css = `.${c} { width: 240px; height: 120px; perspective: 600px; }
.${c} .ring {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: ${c}-spin 12s linear infinite;
}
.${c}:hover .ring { animation-play-state: paused; }
.${c} i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 56px;
  height: 76px;
  margin: -38px 0 0 -28px;
  display: grid;
  place-items: center;
  font-style: normal;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(160deg, #14b8a6, #0f766e);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 0.5rem;
  backface-visibility: hidden;
}
.${c} i:nth-child(1) { transform: rotateY(0deg) translateZ(110px); }
.${c} i:nth-child(2) { transform: rotateY(60deg) translateZ(110px); }
.${c} i:nth-child(3) { transform: rotateY(120deg) translateZ(110px); }
.${c} i:nth-child(4) { transform: rotateY(180deg) translateZ(110px); }
.${c} i:nth-child(5) { transform: rotateY(240deg) translateZ(110px); }
.${c} i:nth-child(6) { transform: rotateY(300deg) translateZ(110px); }
@keyframes ${c}-spin {
  from { transform: rotateX(-8deg) rotateY(0deg); }
  to { transform: rotateX(-8deg) rotateY(360deg); }
}`
    add(mk({
      name: 'Turntable Ring Carousel',
      category: 'Sliders & Carousels',
      description: 'Six cards arranged on a 3D ring that turns continuously and pauses while hovered.',
      html, css,
      tags: ['carousel', '3d', 'ring', 'rotate', 'turntable'],
    }))
  }

  /* 6. Snap timeline rail — horizontal scroll-snap milestones on a line */
  {
    const c = cls('v12-sl-timeline')
    const html = `<div class="${c}"><div class="rail"><div class="m"><b></b>Jan<span>Kickoff</span></div><div class="m"><b></b>Mar<span>Alpha</span></div><div class="m"><b></b>Jun<span>Beta</span></div><div class="m"><b></b>Sep<span>Launch</span></div><div class="m"><b></b>Dec<span>v2</span></div></div></div>`
    const css = `.${c} {
  width: 250px;
  padding: 0.6rem 0;
  background: #131a2e;
  border: 1px solid #1e293b;
  border-radius: 0.75rem;
}
.${c} .rail {
  position: relative;
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding: 0.5rem 0.75rem;
}
.${c} .rail::-webkit-scrollbar { display: none; }
.${c} .m {
  position: relative;
  flex: 0 0 96px;
  scroll-snap-align: start;
  padding-top: 1.4rem;
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: default;
}
.${c} .m::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0.75rem;
  height: 2px;
  background: #1e293b;
}
.${c} .m span {
  display: block;
  margin-top: 0.15rem;
  color: #e2e8f0;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}
.${c} .m b {
  position: absolute;
  left: 0;
  top: 0.4rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #0b1020;
  border: 2px solid #ec4899;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}
.${c} .m:hover b { background: #ec4899; box-shadow: 0 0 0 4px rgba(236,72,153,0.25); }`
    add(mk({
      name: 'Snap Timeline Rail',
      category: 'Sliders & Carousels',
      description: 'Horizontally scrolling timeline with snap-aligned milestones on a shared line, dots lighting up on hover.',
      html, css,
      tags: ['timeline', 'scroll-snap', 'rail', 'milestones', 'horizontal'],
    }))
  }

  /* ───────────── Icons & Shapes ───────────── */

  /* 7. Envelope — the flap opens and a letter rises on hover */
  {
    const c = cls('v12-ic-envelope')
    const html = `<div class="${c}"><span class="letter"></span><span class="flap"></span><span class="body"></span></div>`
    const css = `.${c} {
  position: relative;
  width: 84px;
  height: 60px;
  margin-top: 26px;
  cursor: pointer;
}
.${c} .body {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #38bdf8, #0284c7);
  border-radius: 6px;
  clip-path: polygon(0 0, 50% 45%, 100% 0, 100% 100%, 0 100%);
  z-index: 2;
}
.${c} .flap {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 34px;
  background: #0ea5e9;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  transform-origin: top center;
  transition: transform 0.4s ease;
  z-index: 3;
}
.${c} .letter {
  position: absolute;
  left: 10px;
  right: 10px;
  top: 6px;
  height: 46px;
  background-color: #f8fafc;
  border-radius: 3px;
  background-image: linear-gradient(#cbd5e1 0 0), linear-gradient(#cbd5e1 0 0), linear-gradient(#cbd5e1 0 0);
  background-size: 60% 3px, 45% 3px, 55% 3px;
  background-position: 8px 10px, 8px 18px, 8px 26px;
  background-repeat: no-repeat;
  transition: transform 0.4s ease 0.1s;
  z-index: 1;
}
.${c}:hover .flap { transform: rotateX(180deg); z-index: 0; }
.${c}:hover .letter { transform: translateY(-26px); }`
    add(mk({
      name: 'Envelope Open Icon',
      category: 'Icons & Shapes',
      description: 'A CSS envelope whose flap folds back and a lined letter slides up out of it on hover.',
      html, css,
      tags: ['envelope', 'mail', 'icon', 'open', 'hover'],
    }))
  }

  /* 8. Battery — hover fills the cells and turns the body green */
  {
    const c = cls('v12-ic-battery')
    const html = `<div class="${c}"><span class="cells"><i></i><i></i><i></i><i></i></span></div>`
    const css = `.${c} {
  position: relative;
  width: 96px;
  height: 46px;
  border: 3px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px;
  cursor: pointer;
  transition: border-color 0.3s ease;
}
.${c}::after {
  content: '';
  position: absolute;
  right: -11px;
  top: 12px;
  width: 6px;
  height: 16px;
  background: #e2e8f0;
  border-radius: 0 3px 3px 0;
  transition: background 0.3s ease;
}
.${c} .cells { display: flex; gap: 4px; height: 100%; }
.${c} i {
  flex: 1;
  border-radius: 3px;
  background: #10b981;
  transform: scaleY(0);
  transform-origin: bottom;
  transition: transform 0.25s ease;
}
.${c} i:nth-child(1) { transform: scaleY(1); }
.${c}:hover i:nth-child(2) { transform: scaleY(1); transition-delay: 0.05s; }
.${c}:hover i:nth-child(3) { transform: scaleY(1); transition-delay: 0.15s; }
.${c}:hover i:nth-child(4) { transform: scaleY(1); transition-delay: 0.25s; }
.${c}:hover { border-color: #10b981; }
.${c}:hover::after { background: #10b981; }`
    add(mk({
      name: 'Battery Charge Icon',
      category: 'Icons & Shapes',
      description: 'Battery outline with one cell lit that charges cell by cell on hover and turns its casing green.',
      html, css,
      tags: ['battery', 'charge', 'icon', 'cells', 'hover'],
    }))
  }

  /* 9. Play to pause — one triangle splits into two bars */
  {
    const c = cls('v12-ic-playpause')
    const html = `<button class="${c}" aria-label="Play"><span class="l"></span><span class="r"></span></button>`
    const css = `.${c} {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid #f43f5e;
  background: rgba(244,63,94,0.1);
  cursor: pointer;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}
.${c} span {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 30px;
  background: #f43f5e;
  transition: clip-path 0.35s ease, transform 0.35s ease, border-radius 0.35s ease, background 0.3s ease;
}
.${c} .l {
  left: 26px;
  transform: translateY(-50%);
  clip-path: polygon(0 0, 100% 20%, 100% 80%, 0 100%);
}
.${c} .r {
  left: 38px;
  transform: translateY(-50%);
  clip-path: polygon(0 20%, 100% 50%, 100% 50%, 0 80%);
}
.${c}:hover { background: #f43f5e; box-shadow: 0 0 0 6px rgba(244,63,94,0.25); }
.${c}:hover span { background: #fff; border-radius: 3px; }
.${c}:hover .l { transform: translate(-6px, -50%); clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
.${c}:hover .r { transform: translate(6px, -50%); clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }`
    add(mk({
      name: 'Play Pause Morph',
      category: 'Icons & Shapes',
      description: 'A play triangle built from two clipped halves that separate and square off into a pause icon on hover.',
      html, css,
      tags: ['play', 'pause', 'morph', 'icon', 'clip-path'],
    }))
  }

  /* 10. Blob morph — an organic shape continuously reshaping */
  {
    const c = cls('v12-ic-blob')
    const html = `<div class="${c}"></div>`
    const css = `.${c} {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #d946ef, #8b5cf6);
  box-shadow: 0 10px 30px rgba(217,70,239,0.35);
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  animation: ${c}-morph 8s ease-in-out infinite;
  cursor: pointer;
  transition: filter 0.3s ease;
}
.${c}:hover { filter: brightness(1.2) saturate(1.2); }
@keyframes ${c}-morph {
  0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  50% { border-radius: 50% 60% 30% 60% / 30% 40% 70% 50%; }
  75% { border-radius: 40% 30% 60% 50% / 60% 70% 40% 30%; }
  100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
}`
    add(mk({
      name: 'Morphing Blob Shape',
      category: 'Icons & Shapes',
      description: 'An organic gradient blob whose border-radius keeps morphing between shapes, brightening on hover.',
      html, css,
      tags: ['blob', 'morph', 'organic', 'shape', 'gradient'],
    }))
  }

  /* 11. Eye — the lid blinks shut on hover, pupil glances aside */
  {
    const c = cls('v12-ic-eye')
    const html = `<div class="${c}"><span class="ball"><i></i></span><span class="lid"></span></div>`
    const css = `.${c} {
  position: relative;
  width: 100px;
  height: 56px;
  overflow: hidden;
  cursor: pointer;
  clip-path: ellipse(50% 50% at 50% 50%);
  background: #f8fafc;
}
.${c} .ball {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 34px;
  height: 34px;
  margin: -17px 0 0 -17px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 40%, #22d3ee, #0891b2 60%, #164e63);
  transition: transform 0.3s ease;
}
.${c} .ball i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  border-radius: 50%;
  background: #0b1020;
  box-shadow: 4px -4px 0 -3px #fff inset;
}
.${c} .lid {
  position: absolute;
  inset: 0;
  background: #164e63;
  border-bottom: 3px solid #22d3ee;
  transform: translateY(-100%);
  transition: transform 0.25s ease;
}
.${c}:hover .lid { transform: translateY(0); }
.${c}:hover .ball { transform: translateX(10px); }`
    add(mk({
      name: 'Blinking Eye Icon',
      category: 'Icons & Shapes',
      description: 'An almond-shaped eye with a cyan iris whose lid slides shut when hovered.',
      html, css,
      tags: ['eye', 'blink', 'icon', 'lid', 'hover'],
    }))
  }

  /* 12. Lightbulb — switches on with glow rays on hover */
  {
    const c = cls('v12-ic-bulb')
    const html = `<div class="${c}"><span class="glass"></span><span class="base"></span></div>`
    const css = `.${c} {
  position: relative;
  width: 64px;
  height: 92px;
  cursor: pointer;
}
.${c} .glass {
  position: absolute;
  left: 4px;
  top: 0;
  width: 56px;
  height: 56px;
  border-radius: 50% 50% 46% 46%;
  background: #1e293b;
  border: 3px solid #475569;
  transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
}
.${c} .glass::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 22px;
  width: 20px;
  height: 20px;
  margin-left: -10px;
  border: 2px solid #64748b;
  border-top-color: transparent;
  border-radius: 0 0 10px 10px;
  transition: border-color 0.35s ease;
}
.${c} .base {
  position: absolute;
  left: 20px;
  top: 58px;
  width: 24px;
  height: 20px;
  background: repeating-linear-gradient(180deg, #94a3b8 0 4px, #475569 4px 7px);
  border-radius: 0 0 6px 6px;
}
.${c} .base::after {
  content: '';
  position: absolute;
  left: 5px;
  bottom: -8px;
  width: 14px;
  height: 8px;
  background: #475569;
  border-radius: 0 0 6px 6px;
}
.${c}:hover .glass {
  background: radial-gradient(circle at 50% 60%, #fef3c7, #f59e0b);
  border-color: #fbbf24;
  box-shadow: 0 0 24px 8px rgba(245,158,11,0.55), 0 0 60px 20px rgba(245,158,11,0.25);
}
.${c}:hover .glass::after { border-color: #92400e; border-top-color: transparent; }`
    add(mk({
      name: 'Lightbulb Switch Icon',
      category: 'Icons & Shapes',
      description: 'A dim CSS lightbulb that lights up amber with a soft glow halo on hover.',
      html, css,
      tags: ['lightbulb', 'glow', 'icon', 'idea', 'hover'],
    }))
  }

  /* ───────────── Micro-interactions ───────────── */

  /* 13. Follow toggle — outline pill becomes a filled "Following" with check */
  {
    const c = cls('v12-mi-follow')
    const html = `<label class="${c}"><input type="checkbox"><span class="pill"><i></i><b class="a">Follow</b><b class="b">Following</b></span></label>`
    const css = `.${c} { position: relative; display: inline-block; cursor: pointer; }
.${c} input { position: absolute; opacity: 0; pointer-events: none; }
.${c} .pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.3rem;
  border: 2px solid #6366f1;
  border-radius: 999px;
  color: #a5b4fc;
  font-size: 0.9rem;
  font-weight: 600;
  background: transparent;
  transition: background 0.3s ease, color 0.3s ease, transform 0.15s ease;
}
.${c} .pill i {
  width: 0;
  height: 10px;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(45deg) scale(0);
  transition: width 0.25s ease, transform 0.25s ease 0.1s;
}
.${c} .pill .b { display: none; }
.${c} .pill:hover { transform: scale(1.04); background: rgba(99,102,241,0.15); }
.${c} input:checked + .pill { background: #6366f1; color: #fff; }
.${c} input:checked + .pill i { width: 6px; transform: rotate(45deg) scale(1) translateY(-2px); }
.${c} input:checked + .pill .a { display: none; }
.${c} input:checked + .pill .b { display: inline; }
.${c} input:checked + .pill:hover { background: #4f46e5; }`
    add(mk({
      name: 'Follow Toggle Pill',
      category: 'Micro-interactions',
      description: 'A Follow pill that fills in, grows a checkmark and relabels itself Following when clicked, using a hidden checkbox.',
      html, css,
      tags: ['follow', 'toggle', 'checkbox', 'pill', 'social'],
    }))
  }

  /* 14. Tooltip nudge — a tooltip pops up above the trigger with an arrow */
  {
    const c = cls('v12-mi-tooltip')
    const html = `<span class="${c}"><span class="tip">Copied to clipboard</span><button>Hover me</button></span>`
    const css = `.${c} {
  position: relative;
  display: inline-block;
  padding-top: 44px;
}
.${c} button {
  padding: 0.55rem 1.2rem;
  border-radius: 0.5rem;
  border: 1px solid #334155;
  background: #131a2e;
  color: #e2e8f0;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.${c} .tip {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translate(-50%, 8px) scale(0.9);
  padding: 0.4rem 0.7rem;
  background: #0ea5e9;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  border-radius: 0.4rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c} .tip::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -5px;
  width: 10px;
  height: 10px;
  margin-left: -5px;
  background: #0ea5e9;
  transform: rotate(45deg);
}
.${c}:hover button { border-color: #0ea5e9; }
.${c}:hover .tip { opacity: 1; transform: translate(-50%, 0) scale(1); }`
    add(mk({
      name: 'Springy Tooltip Pop',
      category: 'Micro-interactions',
      description: 'Hovering the trigger pops a sky-blue tooltip with an arrow up above it using an overshooting spring easing.',
      html, css,
      tags: ['tooltip', 'popover', 'spring', 'hover', 'hint'],
    }))
  }

  /* 15. Undo toast — hovering "Delete" reveals an undo bar with a draining timer */
  {
    const c = cls('v12-mi-undo')
    const html = `<div class="${c}"><div class="row"><span>Draft #12</span><b>Delete</b></div><div class="toast">Deleted<u>Undo</u><i></i></div></div>`
    const css = `.${c} {
  position: relative;
  width: 230px;
  cursor: pointer;
}
.${c} .row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 0.9rem;
  border-radius: 0.6rem;
  background: #131a2e;
  border: 1px solid #1e293b;
  color: #e2e8f0;
  font-size: 0.85rem;
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.${c} .row b { color: #f43f5e; font-size: 0.8rem; }
.${c} .toast {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.9rem;
  border-radius: 0.6rem;
  background: #1c1917;
  color: #e7e5e4;
  font-size: 0.85rem;
  overflow: hidden;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.${c} .toast u {
  margin-left: auto;
  color: #f59e0b;
  font-weight: 700;
  text-decoration: none;
}
.${c} .toast i {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: #f59e0b;
  transform-origin: left;
  transform: scaleX(1);
}
.${c}:hover .row { opacity: 0; transform: translateY(-8px); }
.${c}:hover .toast { opacity: 1; transform: none; }
.${c}:hover .toast i { animation: ${c}-drain 4s linear forwards; }
@keyframes ${c}-drain { to { transform: scaleX(0); } }`
    add(mk({
      name: 'Undo Toast Timer',
      category: 'Micro-interactions',
      description: 'Hover the row to see it swap for a dark toast offering Undo, with an amber timer bar draining beneath it.',
      html, css,
      tags: ['toast', 'undo', 'timer', 'delete', 'feedback'],
    }))
  }

  /* 16. Clap counter — hover bumps the hands and floats a +1 badge */
  {
    const c = cls('v12-mi-clap')
    const html = `<button class="${c}"><span class="hands">👏</span><span class="n">128</span><span class="plus">+1</span></button>`
    const css = `.${c} {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 1rem 0.5rem 0.7rem;
  margin-top: 28px;
  border-radius: 999px;
  border: 1px solid #334155;
  background: #131a2e;
  color: #e2e8f0;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.${c} .hands {
  display: inline-block;
  font-size: 1.4rem;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c} .plus {
  position: absolute;
  left: 8px;
  top: -6px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #84cc16;
  color: #1a2e05;
  font-size: 0.75rem;
  font-weight: 800;
  opacity: 0;
  transform: translateY(6px) scale(0.6);
  transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c}:hover { border-color: #84cc16; }
.${c}:hover .hands { transform: scale(1.25) rotate(-12deg); }
.${c}:hover .plus { opacity: 1; transform: translateY(-26px) scale(1); }
.${c}:active .hands { transform: scale(0.9); }`
    add(mk({
      name: 'Clap Counter Bump',
      category: 'Micro-interactions',
      description: 'A Medium-style clap button where the hands bounce and a lime +1 badge floats up on hover.',
      html, css,
      tags: ['clap', 'counter', 'applause', 'badge', 'hover'],
    }))
  }

  /* 17. Password reveal — checkbox eye toggles dots to plain text */
  {
    const c = cls('v12-mi-reveal')
    const html = `<label class="${c}"><input type="checkbox"><span class="field"><span class="dots">••••••••</span><span class="txt">hunter2!</span></span><span class="eye"></span></label>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: center;
  width: 220px;
  padding: 0.6rem 0.8rem;
  border-radius: 0.55rem;
  background: #131a2e;
  border: 1px solid #334155;
  color: #e2e8f0;
  font-family: ui-monospace, monospace;
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.${c}:hover { border-color: #d946ef; }
.${c} input { position: absolute; opacity: 0; pointer-events: none; }
.${c} .field { flex: 1; position: relative; height: 1.3em; overflow: hidden; }
.${c} .field span {
  position: absolute;
  left: 0;
  top: 0;
  line-height: 1.3em;
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.${c} .dots { letter-spacing: 0.15em; }
.${c} .txt { color: #f0abfc; transform: translateY(100%); opacity: 0; }
.${c} .eye {
  position: relative;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #94a3b8;
  clip-path: ellipse(50% 32% at 50% 50%);
  transition: border-color 0.2s ease, clip-path 0.3s ease;
}
.${c} .eye::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 50%;
  background: #94a3b8;
  transition: background 0.2s ease;
}
.${c} input:checked ~ .eye { border-color: #d946ef; clip-path: ellipse(50% 50% at 50% 50%); }
.${c} input:checked ~ .eye::after { background: #d946ef; }
.${c} input:checked ~ .field .txt { transform: none; opacity: 1; }
.${c} input:checked ~ .field .dots { transform: translateY(-100%); opacity: 0; }`
    add(mk({
      name: 'Password Reveal Toggle',
      category: 'Micro-interactions',
      description: 'Clicking the eye flips masked dots up out of view and rolls the plain-text password into place, no JavaScript needed.',
      html, css,
      tags: ['password', 'reveal', 'eye', 'toggle', 'checkbox'],
    }))
  }

  /* 18. Chip dismiss — hovering the × on a chip shrinks and strikes it */
  {
    const c = cls('v12-mi-chip')
    const html = `<span class="${c}"><span class="tag">React</span><button aria-label="Remove">×</button></span>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.4rem 0.35rem 0.85rem;
  border-radius: 999px;
  background: rgba(14,165,233,0.15);
  border: 1px solid #0ea5e9;
  color: #7dd3fc;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease, opacity 0.25s ease, color 0.25s ease;
}
.${c} .tag {
  text-decoration: line-through;
  text-decoration-color: transparent;
  transition: text-decoration-color 0.25s ease;
}
.${c} button {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.${c} button:hover { background: #f43f5e; color: #fff; transform: rotate(90deg); }
.${c}:has(button:hover) {
  background: rgba(244,63,94,0.12);
  border-color: #f43f5e;
  color: #fda4af;
  transform: scale(0.94);
  opacity: 0.85;
}
.${c}:has(button:hover) .tag { text-decoration-color: #f43f5e; }`
    add(mk({
      name: 'Chip Dismiss Preview',
      category: 'Micro-interactions',
      description: 'Hovering the remove button on a tag chip previews the deletion by striking the label, tinting it red and shrinking the chip.',
      html, css,
      tags: ['chip', 'tag', 'dismiss', 'remove', 'hover'],
    }))
  }

  /* ───────────── Filters & Blend Modes ───────────── */

  /* 19. Screen overlap circles — RGB discs blend to white where they cross */
  {
    const c = cls('v12-fb-screen')
    const html = `<div class="${c}"><i class="r"></i><i class="g"></i><i class="b"></i></div>`
    const css = `.${c} {
  position: relative;
  width: 160px;
  height: 140px;
  cursor: pointer;
}
.${c} i {
  position: absolute;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  mix-blend-mode: screen;
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .r { background: #f43f5e; left: 38px; top: 6px; }
.${c} .g { background: #10b981; left: 12px; top: 50px; }
.${c} .b { background: #0ea5e9; left: 64px; top: 50px; }
.${c}:hover .r { transform: translateY(-14px); }
.${c}:hover .g { transform: translate(-14px, 10px); }
.${c}:hover .b { transform: translate(14px, 10px); }`
    add(mk({
      name: 'Screen Blend Discs',
      category: 'Filters & Blend Modes',
      description: 'Three primary discs in screen blend mode that add up to white where they overlap, and drift apart on hover.',
      html, css,
      tags: ['blend', 'screen', 'circles', 'additive', 'rgb'],
    }))
  }

  /* 20. Invert flip — a gradient tile inverts its colours on hover */
  {
    const c = cls('v12-fb-invert')
    const html = `<div class="${c}"><span>Invert</span></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 200px;
  height: 120px;
  border-radius: 0.8rem;
  background:
    radial-gradient(circle at 20% 30%, #f59e0b 0 30px, transparent 31px),
    radial-gradient(circle at 75% 70%, #6366f1 0 40px, transparent 41px),
    linear-gradient(135deg, #0f172a, #1e293b);
  color: #e2e8f0;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: filter 0.4s ease;
}
.${c}:hover { filter: invert(1) hue-rotate(180deg); }`
    add(mk({
      name: 'Invert Filter Tile',
      category: 'Filters & Blend Modes',
      description: 'A dark tile with amber and indigo blobs that flips to a light negative on hover using the invert filter with hue-rotate to keep hues stable.',
      html, css,
      tags: ['invert', 'filter', 'negative', 'hue-rotate', 'hover'],
    }))
  }

  /* 21. Film grain overlay — SVG turbulence noise blended over a gradient */
  {
    const c = cls('v12-fb-grain')
    const html = `<div class="${c}"><span>Grain</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 200px;
  height: 120px;
  border-radius: 0.8rem;
  overflow: hidden;
  background: linear-gradient(135deg, #f97316, #7c2d12);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}
.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
  opacity: 0.35;
  transition: opacity 0.35s ease;
}
.${c}:hover::after { opacity: 0.85; }
.${c} span { position: relative; z-index: 1; }`
    add(mk({
      name: 'Film Grain Overlay',
      category: 'Filters & Blend Modes',
      description: 'An SVG turbulence noise texture blended in overlay mode over an orange gradient, growing coarser on hover.',
      html, css,
      tags: ['grain', 'noise', 'overlay', 'texture', 'blend'],
    }))
  }

  /* 22. Focus pull — a blurred blob snaps into focus on hover */
  {
    const c = cls('v12-fb-focus')
    const html = `<div class="${c}"><i></i><span>Focus</span></div>`
    const css = `.${c} {
  position: relative;
  display: grid;
  place-items: center;
  width: 200px;
  height: 120px;
  border-radius: 0.8rem;
  overflow: hidden;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}
.${c} i {
  position: absolute;
  left: 30px;
  top: 20px;
  width: 140px;
  height: 80px;
  border-radius: 40% 60% 55% 45% / 55% 40% 60% 45%;
  background: linear-gradient(120deg, #14b8a6, #0ea5e9, #8b5cf6);
  filter: blur(14px);
  transition: filter 0.5s ease, transform 0.5s ease;
}
.${c} span {
  position: relative;
  filter: blur(2px);
  transition: filter 0.5s ease;
}
.${c}:hover i { filter: blur(0); transform: scale(0.9); }
.${c}:hover span { filter: blur(0); }`
    add(mk({
      name: 'Focus Pull Blur',
      category: 'Filters & Blend Modes',
      description: 'A heavily blurred teal-to-violet blob and its label pull into sharp focus on hover like a lens rack.',
      html, css,
      tags: ['blur', 'focus', 'filter', 'lens', 'hover'],
    }))
  }

  /* 23. Drop-shadow cutout — filter shadow that follows a clip-path star */
  {
    const c = cls('v12-fb-cutout')
    const html = `<div class="${c}"><i></i></div>`
    const css = `.${c} {
  display: grid;
  place-items: center;
  width: 140px;
  height: 140px;
  cursor: pointer;
  filter: drop-shadow(0 6px 4px rgba(0,0,0,0.6)) drop-shadow(0 0 0 rgba(236,72,153,0));
  transition: filter 0.35s ease, transform 0.35s ease;
}
.${c} i {
  width: 110px;
  height: 110px;
  background: linear-gradient(160deg, #f9a8d4, #ec4899 50%, #9d174d);
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}
.${c}:hover {
  transform: translateY(-6px);
  filter: drop-shadow(0 16px 10px rgba(0,0,0,0.6)) drop-shadow(0 0 14px rgba(236,72,153,0.7));
}`
    add(mk({
      name: 'Drop Shadow Star Cutout',
      category: 'Filters & Blend Modes',
      description: 'A clip-path star whose shadow hugs its points thanks to the drop-shadow filter, lifting with a pink glow on hover.',
      html, css,
      tags: ['drop-shadow', 'filter', 'clip-path', 'star', 'hover'],
    }))
  }

  /* 24. Gooey merge — contrast+blur trick fuses two blobs as they meet */
  {
    const c = cls('v12-fb-gooey')
    const html = `<div class="${c}"><div class="goo"><i class="a"></i><i class="b"></i></div></div>`
    const css = `.${c} {
  width: 220px;
  height: 120px;
  cursor: pointer;
}
.${c} .goo {
  position: relative;
  width: 100%;
  height: 100%;
  background: #0b1020;
  border-radius: 0.8rem;
  filter: contrast(14);
}
.${c} i {
  position: absolute;
  top: 35px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #84cc16;
  filter: blur(9px);
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .a { left: 24px; }
.${c} .b { right: 24px; }
.${c}:hover .a { transform: translateX(37px); }
.${c}:hover .b { transform: translateX(-37px); }`
    add(mk({
      name: 'Gooey Merge Blobs',
      category: 'Filters & Blend Modes',
      description: 'Two lime blobs that stretch and fuse together as they meet on hover, using the classic blur-plus-contrast gooey filter.',
      html, css,
      tags: ['gooey', 'blur', 'contrast', 'merge', 'blobs'],
    }))
  }
}
