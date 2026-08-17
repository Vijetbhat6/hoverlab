// scripts/generate-effects-v11.mjs
//
// Eleventh wave: Buttons only, and a deliberate break from every wave
// before it — ONE entry per design, no colorway or size stamping.
//
// The catalog thinning that ships alongside this wave (see the pass at
// the bottom of generate-effects.mjs) collapsed every stamped family to
// its canonical member, because 51 near-identical solid buttons were
// crowding out the designs that differ in mechanics rather than hue.
// The Customize panel already re-colors and re-sizes any effect, so a
// variant that differs only in tokens earns nothing but scroll length.
//
// These sixteen are chosen to not overlap the 22 surviving button
// designs (solid lift, gradient shift, outline fill, glow pulse, sheen,
// icon pill, gradient ring, glass, arrow slide, loading ×2, split,
// traced border, provider, hold-to-confirm, speed dial, icon toolbar,
// slide-to-unlock, download progress, gooey, keycap). Spread across
// mechanics:
//
//   press feel     — brutalist hard shadow, spring squish, soft ripple
//   drawn borders  — corner brackets, offset twin, stitched patch,
//                    double frame
//   fills          — liquid rise, dot expand, underline-to-box
//   typographic    — roll label, tracking bloom
//   shape          — notched tech, icon expand, peel corner, skew banner
//
// Constraints inherited from the assembly guard: no infinite keyframes
// doing the core work (they rest at their 100% stop), no
// position:absolute on the root, visible at rest on the dark preview
// surface. Everything here is transition-driven, which suits buttons
// anyway.

export function generateV11(ctx) {
  const { cls, mk, add } = ctx

  /* 1. Brutalist hard shadow — offset block shadow collapses on press */
  {
    const c = cls('v11-btn-brutal')
    const html = `<button class="${c}">Ship it</button>`
    const css = `.${c} {
  padding: 0.65rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1c1917;
  background: #fbbf24;
  border: 2px solid #1c1917;
  border-radius: 0.3rem;
  cursor: pointer;
  box-shadow: 4px 4px 0 0 #1c1917;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.${c}:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 0 #1c1917;
}
.${c}:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 0 #1c1917;
}`
    add(mk({
      name: 'Brutalist Shadow Button',
      category: 'Buttons',
      description: 'Neo-brutalist button with a hard offset shadow that lifts on hover and collapses flat on press.',
      html, css,
      tags: ['brutalist', 'shadow', 'press', 'hard-shadow'],
    }))
  }

  /* 2. Liquid rise — a curved fill climbs from the bottom edge */
  {
    const c = cls('v11-btn-liquid')
    const html = `<button class="${c}"><span>Dive in</span></button>`
    const css = `.${c} {
  position: relative;
  padding: 0.65rem 1.6rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #818cf8;
  background: transparent;
  border: 2px solid #6366f1;
  border-radius: 0.55rem;
  cursor: pointer;
  overflow: hidden;
}
.${c} span { position: relative; z-index: 1; transition: color 0.4s ease; }
.${c}::before {
  content: '';
  position: absolute;
  left: -25%;
  top: 100%;
  width: 150%;
  height: 220%;
  background: #6366f1;
  border-radius: 45% 47% 0 0;
  transition: top 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s ease;
}
.${c}:hover::before { top: -20%; border-radius: 0; }
.${c}:hover span { color: #fff; }`
    add(mk({
      name: 'Liquid Rise Button',
      category: 'Buttons',
      description: 'Outline button that floods from the bottom with a curved liquid crest on hover.',
      html, css,
      tags: ['liquid', 'fill', 'rise', 'outline', 'hover-fill'],
    }))
  }

  /* 3. Corner brackets — four corner marks grow into a full frame */
  {
    const c = cls('v11-btn-bracket')
    const html = `<button class="${c}">Target</button>`
    const css = `.${c} {
  position: relative;
  padding: 0.7rem 1.7rem;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #2dd4bf;
  background: rgba(20,184,166,0.06);
  border: none;
  cursor: pointer;
}
.${c}::before,
.${c}::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  transition: width 0.3s ease, height 0.3s ease;
}
.${c}::before {
  top: 0; left: 0;
  border-top: 2px solid #14b8a6;
  border-left: 2px solid #14b8a6;
}
.${c}::after {
  bottom: 0; right: 0;
  border-bottom: 2px solid #14b8a6;
  border-right: 2px solid #14b8a6;
}
.${c}:hover::before,
.${c}:hover::after { width: 100%; height: 100%; }`
    add(mk({
      name: 'Corner Bracket Button',
      category: 'Buttons',
      description: 'Crosshair-style corner brackets that extend into a complete frame around the label on hover.',
      html, css,
      tags: ['bracket', 'corners', 'frame', 'border-draw'],
    }))
  }

  /* 4. Roll label — the label rolls up and a second one rolls in */
  {
    const c = cls('v11-btn-roll')
    const html = `<button class="${c}"><span class="rl"><span>Deploy</span><span>Let's go</span></span></button>`
    const css = `.${c} {
  padding: 0.65rem 1.6rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  background: #8b5cf6;
  border: none;
  border-radius: 0.55rem;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 4px 14px 0 rgba(139,92,246,0.35);
}
.${c} .rl {
  display: block;
  position: relative;
  height: 1.4em;
  overflow: hidden;
}
.${c} .rl span {
  display: block;
  height: 1.4em;
  line-height: 1.4em;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c}:hover .rl span { transform: translateY(-100%); }`
    add(mk({
      name: 'Roll Label Button',
      category: 'Buttons',
      description: 'Button label rolls upward on hover and a second line of text rolls in from below.',
      html, css,
      tags: ['roll', 'label', 'text-swap', 'slide'],
    }))
  }

  /* 5. Dot expand — a leading dot inflates into the full background */
  {
    const c = cls('v11-btn-dot')
    const html = `<button class="${c}"><span>Record</span></button>`
    const css = `.${c} {
  position: relative;
  padding: 0.65rem 1.5rem 0.65rem 2.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fb7185;
  background: transparent;
  border: 2px solid #f43f5e;
  border-radius: 999px;
  cursor: pointer;
  overflow: hidden;
}
.${c} span { position: relative; z-index: 1; transition: color 0.35s ease; }
.${c}::before {
  content: '';
  position: absolute;
  left: 1rem;
  top: 50%;
  width: 8px;
  height: 8px;
  margin-top: -4px;
  border-radius: 50%;
  background: #f43f5e;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c}:hover::before { transform: scale(40); }
.${c}:hover span { color: #fff; }`
    add(mk({
      name: 'Dot Expand Button',
      category: 'Buttons',
      description: 'A small recording dot inflates to flood the whole pill with color on hover.',
      html, css,
      tags: ['dot', 'expand', 'fill', 'pill', 'radial'],
    }))
  }

  /* 6. Notched tech — clip-path cut corners, HUD style */
  {
    const c = cls('v11-btn-notch')
    const html = `<button class="${c}">Initialize</button>`
    const css = `.${c} {
  padding: 0.7rem 1.8rem;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #cffafe;
  background: linear-gradient(180deg, #164e63, #0e7490);
  border: none;
  cursor: pointer;
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
  transition: filter 0.25s ease, letter-spacing 0.25s ease;
}
.${c}:hover {
  filter: brightness(1.25);
  letter-spacing: 0.14em;
}
.${c}:active { filter: brightness(0.9); }`
    add(mk({
      name: 'Notched Tech Button',
      category: 'Buttons',
      description: 'HUD-style button with clip-path notched corners that brightens and spaces out its label on hover.',
      html, css,
      tags: ['notch', 'clip-path', 'tech', 'hud', 'sci-fi'],
    }))
  }

  /* 7. Offset twin — a solid twin sits behind and snaps flush on hover */
  {
    const c = cls('v11-btn-twin')
    const html = `<button class="${c}"><span>Confirm</span></button>`
    const css = `.${c} {
  position: relative;
  padding: 0.65rem 1.6rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #6ee7b7;
  background: transparent;
  border: 2px solid #10b981;
  border-radius: 0.4rem;
  cursor: pointer;
}
.${c} span { position: relative; z-index: 1; transition: color 0.3s ease; }
.${c}::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 0.3rem;
  background: #10b981;
  transform: translate(7px, 7px);
  z-index: 0;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c}:hover::before { transform: translate(0, 0); }
.${c}:hover span { color: #022c22; }`
    add(mk({
      name: 'Offset Twin Button',
      category: 'Buttons',
      description: 'A solid twin layer sits offset behind the outline and snaps flush underneath it on hover.',
      html, css,
      tags: ['offset', 'twin', 'layers', 'snap'],
    }))
  }

  /* 8. Underline to box — a text underline grows into a full box */
  {
    const c = cls('v11-btn-ubox')
    const html = `<button class="${c}"><span>Read more</span></button>`
    const css = `.${c} {
  position: relative;
  padding: 0.55rem 0.9rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fbbf24;
  background: transparent;
  border: none;
  cursor: pointer;
}
.${c} span { position: relative; z-index: 1; }
.${c}::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 0.45rem;
  background: rgba(245,158,11,0.9);
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
}
.${c}:hover::before {
  height: 100%;
  background: rgba(245,158,11,0.18);
}`
    add(mk({
      name: 'Underline Box Button',
      category: 'Buttons',
      description: 'A minimal text button whose underline grows upward into a soft tinted box on hover.',
      html, css,
      tags: ['underline', 'box', 'minimal', 'text-button'],
    }))
  }

  /* 9. Stitched patch — dashed inner seam like sewn fabric */
  {
    const c = cls('v11-btn-stitch')
    const html = `<button class="${c}"><span>Hand made</span></button>`
    const css = `.${c} {
  position: relative;
  padding: 0.75rem 1.7rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff7ed;
  background: #ea580c;
  border: none;
  border-radius: 0.7rem;
  cursor: pointer;
  box-shadow: 0 4px 14px 0 rgba(249,115,22,0.4), inset 0 -3px 0 rgba(0,0,0,0.15);
  transition: background 0.25s ease, transform 0.25s ease;
}
.${c}::before {
  content: '';
  position: absolute;
  inset: 5px;
  border: 2px dashed rgba(255,247,237,0.65);
  border-radius: 0.45rem;
  transition: inset 0.25s ease;
  pointer-events: none;
}
.${c}:hover { background: #c2410c; transform: translateY(-2px); }
.${c}:hover::before { inset: 3px; }`
    add(mk({
      name: 'Stitched Patch Button',
      category: 'Buttons',
      description: 'Fabric-patch button with a dashed stitch seam inside its edge that loosens on hover.',
      html, css,
      tags: ['stitched', 'dashed', 'patch', 'craft'],
    }))
  }

  /* 10. Spring squish — overshooting squash-and-stretch press feel */
  {
    const c = cls('v11-btn-squish')
    const html = `<button class="${c}">Boop</button>`
    const css = `.${c} {
  padding: 0.7rem 1.7rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  background: #ec4899;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 6px 18px 0 rgba(236,72,153,0.4);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.${c}:hover {
  transform: scale(1.08);
  box-shadow: 0 10px 26px 0 rgba(236,72,153,0.5);
}
.${c}:active {
  transform: scale(0.92, 0.86);
  box-shadow: 0 2px 8px 0 rgba(236,72,153,0.4);
}`
    add(mk({
      name: 'Spring Squish Button',
      category: 'Buttons',
      description: 'Springy button that overshoots as it grows on hover and squashes like jelly on press.',
      html, css,
      tags: ['spring', 'squish', 'bounce', 'elastic', 'press'],
    }))
  }

  /* 11. Icon expand — a round icon button widens to reveal its label */
  {
    const c = cls('v11-btn-iconx')
    const html = `<button class="${c}"><b>+</b><span>New project</span></button>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  height: 46px;
  padding: 0 13px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  background: #0ea5e9;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 4px 14px 0 rgba(14,165,233,0.4);
  transition: background 0.3s ease;
}
.${c} b {
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1;
  transition: transform 0.35s ease;
}
.${c} span {
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  opacity: 0;
  transition: max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, margin-left 0.35s ease;
}
.${c}:hover { background: #0284c7; }
.${c}:hover b { transform: rotate(90deg); }
.${c}:hover span { max-width: 140px; opacity: 1; margin-left: 0.5rem; }`
    add(mk({
      name: 'Icon Expand Button',
      category: 'Buttons',
      description: 'A round plus button that unrolls into a labeled pill on hover while the icon twists.',
      html, css,
      tags: ['icon', 'expand', 'reveal', 'fab', 'pill'],
    }))
  }

  /* 12. Soft ripple — CSS-only ripple ring on press */
  {
    const c = cls('v11-btn-ripple')
    const html = `<button class="${c}"><span>Tap me</span></button>`
    const css = `.${c} {
  position: relative;
  padding: 0.65rem 1.6rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  background: #3b82f6;
  border: none;
  border-radius: 0.55rem;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 4px 14px 0 rgba(59,130,246,0.35);
  transition: background 0.25s ease;
}
.${c} span { position: relative; z-index: 1; }
.${c}::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 120%;
  padding-top: 120%;
  border-radius: 50%;
  background: rgba(255,255,255,0.35);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  transition: transform 0.5s ease, opacity 0.6s ease;
}
.${c}:hover { background: #2563eb; }
.${c}:active::after {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
  transition: none;
}`
    add(mk({
      name: 'Soft Ripple Button',
      category: 'Buttons',
      description: 'Material-style button where a soft ripple ring blooms from the center on press, CSS only.',
      html, css,
      tags: ['ripple', 'material', 'press', 'radial'],
    }))
  }

  /* 13. Double frame — outline plus offset outer ring, pushed apart on hover */
  {
    const c = cls('v11-btn-frame')
    const html = `<button class="${c}">Gallery</button>`
    const css = `.${c} {
  padding: 0.65rem 1.7rem;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #e9d5ff;
  background: transparent;
  border: 2px solid #a855f7;
  border-radius: 0.2rem;
  outline: 1px solid rgba(168,85,247,0.5);
  outline-offset: 3px;
  cursor: pointer;
  transition: outline-offset 0.25s ease, outline-color 0.25s ease, background 0.25s ease;
}
.${c}:hover {
  outline-offset: 7px;
  outline-color: rgba(168,85,247,0.9);
  background: rgba(168,85,247,0.12);
}
.${c}:active { outline-offset: 1px; }`
    add(mk({
      name: 'Double Frame Button',
      category: 'Buttons',
      description: 'Gallery-frame button with a second outline ring that pushes outward on hover and snaps in on press.',
      html, css,
      tags: ['frame', 'outline', 'double-border', 'offset'],
    }))
  }

  /* 14. Tracking bloom — letter-spacing spreads with an inner glow */
  {
    const c = cls('v11-btn-track')
    const html = `<button class="${c}">EXPLORE</button>`
    const css = `.${c} {
  padding: 0.75rem 1.9rem;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #d9f99d;
  background: #1a2e05;
  border: 1px solid #4d7c0f;
  border-radius: 0.55rem;
  cursor: pointer;
  box-shadow: inset 0 0 0 0 rgba(132,204,22,0);
  transition: letter-spacing 0.35s ease, box-shadow 0.35s ease, color 0.35s ease;
}
.${c}:hover {
  letter-spacing: 0.32em;
  color: #ecfccb;
  box-shadow: inset 0 0 24px 0 rgba(132,204,22,0.35);
}`
    add(mk({
      name: 'Tracking Bloom Button',
      category: 'Buttons',
      description: 'Typographic button whose letters spread apart while a green glow blooms from inside.',
      html, css,
      tags: ['letter-spacing', 'typography', 'glow', 'tracking'],
    }))
  }

  /* 15. Peel corner — a folded corner peels open to reveal the under-layer */
  {
    const c = cls('v11-btn-peel')
    const html = `<button class="${c}"><span>Unwrap</span></button>`
    const css = `.${c} {
  position: relative;
  padding: 0.7rem 1.7rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fecdd3;
  background: #4c0519;
  border: 1px solid #9f1239;
  border-radius: 0.4rem;
  cursor: pointer;
  overflow: hidden;
  transition: background 0.3s ease;
}
.${c} span { position: relative; z-index: 1; }
.${c}::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  border-style: solid;
  border-width: 0;
  border-color: #fb7185 #0b0410 #0b0410 #fb7185;
  border-radius: 0 0 0 0.4rem;
  box-shadow: -2px 2px 6px rgba(0,0,0,0.35);
  transition: border-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c}:hover { background: #881337; }
.${c}:hover::before { border-width: 0 22px 22px 0; }`
    add(mk({
      name: 'Peel Corner Button',
      category: 'Buttons',
      description: 'The top-right corner folds over like peeling paper on hover, revealing a bright under-layer.',
      html, css,
      tags: ['peel', 'fold', 'corner', 'paper'],
    }))
  }

  /* 16. Skew banner — a slanted parallelogram that straightens on hover */
  {
    const c = cls('v11-btn-skew')
    const html = `<button class="${c}"><span>Game on</span></button>`
    const css = `.${c} {
  padding: 0.7rem 1.9rem;
  font-size: 0.95rem;
  font-weight: 700;
  font-style: italic;
  color: #fff;
  background: linear-gradient(120deg, #d946ef, #a855f7);
  border: none;
  transform: skewX(-10deg);
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(217,70,239,0.4);
  transition: transform 0.25s ease, border-radius 0.25s ease, box-shadow 0.25s ease;
}
.${c} span {
  display: inline-block;
  transform: skewX(10deg);
  transition: transform 0.25s ease;
}
.${c}:hover {
  transform: skewX(0deg);
  border-radius: 0.55rem;
  box-shadow: 0 8px 24px rgba(217,70,239,0.5);
}
.${c}:hover span { transform: skewX(0deg); }`
    add(mk({
      name: 'Skew Banner Button',
      category: 'Buttons',
      description: 'Esports-style slanted banner button that straightens and rounds off on hover.',
      html, css,
      tags: ['skew', 'banner', 'parallelogram', 'sport'],
    }))
  }
}
