// scripts/generate-effects-v12-c.mjs
//
// Twelfth wave, part C: Badges & Tags, Toggles & Switches, Tooltips &
// Popovers, Skeletons & Shimmers — six designs per category, ONE entry
// per design (same discipline as v11: no colorway/size stamping; the
// Customize panel re-tokens anything that only differs by hue).
//
// Each design is picked to be a different mechanic or silhouette from
// the entries already in its category:
//
//   Badges & Tags   — live pulse dot, ticket stub, gradient rim, avatar
//                     stack, peel sticker, progress fill
//   Toggles         — rocker, squircle morph, star burst, padlock,
//                     neon tube, eye visibility (all real checkboxes)
//   Tooltips        — comic bubble, slider value, color picker, ellipsis
//                     text, kebab menu, drawer label
//   Skeletons       — code block, chat thread, stat tiles, music player,
//                     calendar grid, diagonal stripes
//
// Constraints inherited from the assembly guard: roots visible at rest,
// no position:absolute on the root, infinite keyframes rest at their
// 100% stop (so every 100% frame here is a sensible resting pose).

export function generateV12C(ctx) {
  const { cls, mk, add } = ctx

  /* ───────────────────────── Badges & Tags ───────────────────────── */

  /* 1. Live pulse — a red LIVE pill whose dot throws expanding rings */
  {
    const c = cls('v12-bdg-live')
    const html = `<span class="${c}"><i></i>LIVE</span>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem 0.35rem 0.7rem;
  font: 700 0.75rem/1 system-ui, sans-serif;
  letter-spacing: 0.12em;
  color: #fff;
  background: #f43f5e;
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(244,63,94,0.5), 0 6px 18px rgba(244,63,94,0.35);
}
.${c} i {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
}
.${c} i::before,
.${c} i::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid #fff;
  animation: ${c}-ring 1.6s ease-out infinite;
}
.${c} i::after { animation-delay: 0.8s; }
@keyframes ${c}-ring {
  0% { transform: scale(1); opacity: 0.9; }
  100% { transform: scale(3.2); opacity: 0; }
}`
    add(mk({
      name: 'Live Pulse Badge',
      category: 'Badges & Tags',
      description: 'On-air LIVE pill whose white dot throws two staggered expanding rings.',
      html, css,
      tags: ['live', 'pulse', 'ring', 'status', 'broadcast'],
    }))
  }

  /* 2. Ticket stub — perforated ticket with punched semicircle notches */
  {
    const c = cls('v12-bdg-ticket')
    const html = `<span class="${c}"><b>ADMIT ONE</b><em>№ 0427</em></span>`
    const css = `.${c} {
  display: inline-flex;
  align-items: stretch;
  font: 700 0.75rem/1 system-ui, sans-serif;
  color: #1c1917;
  background: #f59e0b;
  border-radius: 0.5rem;
  -webkit-mask: radial-gradient(circle 7px at 65% 0, transparent 98%, #000) top / 100% 51% no-repeat,
    radial-gradient(circle 7px at 65% 100%, transparent 98%, #000) bottom / 100% 51% no-repeat;
  mask: radial-gradient(circle 7px at 65% 0, transparent 98%, #000) top / 100% 51% no-repeat,
    radial-gradient(circle 7px at 65% 100%, transparent 98%, #000) bottom / 100% 51% no-repeat;
  transition: transform 0.25s ease;
}
.${c} b { padding: 0.6rem 0.9rem; letter-spacing: 0.1em; }
.${c} em {
  padding: 0.6rem 0.75rem;
  font-style: normal;
  font-weight: 600;
  letter-spacing: 0.06em;
  border-left: 2px dashed rgba(28,25,23,0.45);
  writing-mode: horizontal-tb;
}
.${c}:hover { transform: rotate(-3deg) scale(1.04); }`
    add(mk({
      name: 'Ticket Stub Tag',
      category: 'Badges & Tags',
      description: 'Amber admission-ticket tag with punched notches and a perforated stub that tilts on hover.',
      html, css,
      tags: ['ticket', 'stub', 'perforated', 'mask', 'coupon'],
    }))
  }

  /* 3. Gradient rim — thin conic rim that spins on hover */
  {
    const c = cls('v12-bdg-rim')
    const html = `<span class="${c}"><span>Premium</span></span>`
    const css = `.${c} {
  display: inline-block;
  padding: 2px;
  border-radius: 999px;
  background: linear-gradient(120deg, #8b5cf6, #ec4899, #f59e0b, #8b5cf6);
  background-size: 300% 100%;
  background-position: 0% 50%;
  transition: background-position 0.7s ease, box-shadow 0.4s ease;
  box-shadow: 0 0 0 0 rgba(139,92,246,0);
}
.${c} span {
  display: block;
  padding: 0.4rem 1rem;
  font: 600 0.8rem/1 system-ui, sans-serif;
  color: #ede9fe;
  background: #0b1020;
  border-radius: 999px;
}
.${c}:hover { background-position: 100% 50%; box-shadow: 0 0 18px 2px rgba(139,92,246,0.45); }`
    add(mk({
      name: 'Gradient Rim Tag',
      category: 'Badges & Tags',
      description: 'Dark pill wrapped in a thin violet-to-amber gradient rim that sweeps and glows on hover.',
      html, css,
      tags: ['gradient', 'rim', 'border', 'pill', 'premium'],
    }))
  }

  /* 4. Avatar stack — overlapping avatars with a +N counter */
  {
    const c = cls('v12-bdg-avatars')
    const html = `<span class="${c}"><i>A</i><i>J</i><i>M</i><b>+4</b><em>collaborators</em></span>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.85rem 0.3rem 0.35rem;
  background: rgba(14,165,233,0.1);
  border: 1px solid rgba(14,165,233,0.35);
  border-radius: 999px;
  font: 600 0.75rem/1 system-ui, sans-serif;
  color: #bae6fd;
}
.${c} i,
.${c} b {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.65rem;
  font-style: normal;
  color: #fff;
  border: 2px solid #0b1020;
  margin-right: -8px;
  transition: margin 0.3s ease, transform 0.3s ease;
}
.${c} i:nth-child(1) { background: #0ea5e9; }
.${c} i:nth-child(2) { background: #6366f1; }
.${c} i:nth-child(3) { background: #14b8a6; }
.${c} b { background: #1e293b; color: #bae6fd; margin-right: 0.5rem; }
.${c} em { font-style: normal; }
.${c}:hover i { margin-right: 2px; }
.${c}:hover b { transform: scale(1.1); }`
    add(mk({
      name: 'Avatar Stack Tag',
      category: 'Badges & Tags',
      description: 'Sky-blue tag with three overlapping avatars and a +N counter that fan apart on hover.',
      html, css,
      tags: ['avatars', 'stack', 'collaborators', 'count', 'pill'],
    }))
  }

  /* 5. Peel sticker — a rotated sticker with a white die-cut border */
  {
    const c = cls('v12-bdg-sticker')
    const html = `<span class="${c}">FRESH!</span>`
    const css = `.${c} {
  display: inline-block;
  padding: 0.5rem 1.1rem;
  font: 900 0.9rem/1 system-ui, sans-serif;
  letter-spacing: 0.06em;
  color: #1a2e05;
  background: #84cc16;
  border: 3px solid #fff;
  border-radius: 999px;
  transform: rotate(-8deg);
  box-shadow: 0 6px 0 -2px rgba(0,0,0,0.35), 0 8px 18px rgba(0,0,0,0.45);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.${c}:hover {
  transform: rotate(4deg) scale(1.08);
  box-shadow: 0 2px 0 -1px rgba(0,0,0,0.35), 0 4px 10px rgba(0,0,0,0.45);
}`
    add(mk({
      name: 'Die-Cut Sticker Tag',
      category: 'Badges & Tags',
      description: 'Lime sticker with a white die-cut border, slapped on at an angle, that springs upright on hover.',
      html, css,
      tags: ['sticker', 'die-cut', 'rotate', 'spring', 'lime'],
    }))
  }

  /* 6. Progress fill — a tag whose background is a percentage bar */
  {
    const c = cls('v12-bdg-progress')
    const html = `<span class="${c}"><span>Syncing</span><b>72%</b></span>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.9rem;
  font: 600 0.78rem/1 system-ui, sans-serif;
  color: #ccfbf1;
  border: 1px solid rgba(20,184,166,0.5);
  border-radius: 0.5rem;
  background: linear-gradient(90deg, rgba(20,184,166,0.55) 72%, rgba(20,184,166,0.08) 72%) no-repeat;
  transition: box-shadow 0.3s ease;
}
.${c} b { font-variant-numeric: tabular-nums; color: #5eead4; }
.${c}:hover {
  background: linear-gradient(90deg, rgba(20,184,166,0.55) 100%, rgba(20,184,166,0.08) 100%);
  box-shadow: 0 0 14px rgba(20,184,166,0.35);
}
.${c}:hover b { color: #fff; }`
    add(mk({
      name: 'Progress Fill Tag',
      category: 'Badges & Tags',
      description: 'Teal status tag whose background doubles as a 72% progress bar and completes on hover.',
      html, css,
      tags: ['progress', 'fill', 'percentage', 'status', 'sync'],
    }))
  }

  /* ───────────────────────── Toggles & Switches ───────────────────── */

  /* 7. Rocker — a physical two-way rocker that tips in perspective */
  {
    const c = cls('v12-tgl-rocker')
    const html = `<label class="${c}"><input type="checkbox"><span class="rk"><i>O</i><i>I</i></span></label>`
    const css = `.${c} {
  display: inline-block;
  padding: 6px;
  background: #1e293b;
  border-radius: 8px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05);
  cursor: pointer;
  perspective: 200px;
}
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} .rk {
  display: flex;
  width: 96px;
  height: 44px;
  border-radius: 5px;
  overflow: hidden;
  transform-style: preserve-3d;
  transform: rotateY(18deg);
  transition: transform 0.25s ease;
}
.${c} .rk i {
  flex: 1;
  display: grid;
  place-items: center;
  font: 800 1rem/1 system-ui, sans-serif;
  font-style: normal;
  color: #94a3b8;
  background: #334155;
  transition: background 0.25s ease, color 0.25s ease;
}
.${c} .rk i:first-child { background: #475569; color: #e2e8f0; }
.${c} input:checked + .rk { transform: rotateY(-18deg); }
.${c} input:checked + .rk i:first-child { background: #334155; color: #94a3b8; }
.${c} input:checked + .rk i:last-child { background: #f97316; color: #fff; }
.${c}:hover .rk { filter: brightness(1.12); }`
    add(mk({
      name: 'Rocker Switch',
      category: 'Toggles & Switches',
      description: 'Physical O/I rocker switch that tips over in perspective and lights its orange side when checked.',
      html, css,
      tags: ['rocker', 'switch', 'physical', '3d', 'checkbox'],
    }))
  }

  /* 8. Squircle morph — the thumb morphs from square to circle as it slides */
  {
    const c = cls('v12-tgl-squircle')
    const html = `<label class="${c}"><input type="checkbox"><span class="tr"><i></i></span></label>`
    const css = `.${c} { display: inline-block; cursor: pointer; }
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} .tr {
  display: block;
  position: relative;
  width: 76px;
  height: 40px;
  background: #1e293b;
  border: 2px solid #334155;
  border-radius: 8px;
  transition: background 0.35s ease, border-color 0.35s ease, border-radius 0.35s ease;
}
.${c} .tr i {
  position: absolute;
  top: 5px;
  left: 5px;
  width: 26px;
  height: 26px;
  background: #94a3b8;
  border-radius: 4px;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.35s ease, background 0.35s ease;
}
.${c} input:checked + .tr { background: #d946ef; border-color: #d946ef; border-radius: 999px; }
.${c} input:checked + .tr i { transform: translateX(36px) rotate(180deg); border-radius: 50%; background: #fff; }
.${c}:hover .tr { border-color: #e879f9; }`
    add(mk({
      name: 'Squircle Morph Toggle',
      category: 'Toggles & Switches',
      description: 'A square thumb in a square track that slides across, spins and morphs into a circle inside a fuchsia pill when checked.',
      html, css,
      tags: ['morph', 'square', 'circle', 'toggle', 'checkbox'],
    }))
  }

  /* 9. Star burst — favorite star fills gold and fires a particle ring */
  {
    const c = cls('v12-tgl-star')
    const html = `<label class="${c}"><input type="checkbox"><span class="st">★</span><span class="lb">Favorite</span></label>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1px solid #334155;
  color: #cbd5e1;
  font: 600 0.85rem/1 system-ui, sans-serif;
  cursor: pointer;
  transition: border-color 0.3s ease, background 0.3s ease;
}
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} .st {
  position: relative;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  font-size: 1.4rem;
  line-height: 1;
  color: #475569;
  transition: color 0.3s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c} .st::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid #f59e0b;
  opacity: 0;
  transform: scale(0.4);
}
.${c} input:checked ~ .st { color: #f59e0b; transform: scale(1.2) rotate(72deg); text-shadow: 0 0 12px rgba(245,158,11,0.6); }
.${c} input:checked ~ .st::before { animation: ${c}-burst 0.6s ease-out forwards; }
.${c} input:checked ~ .lb { color: #fde68a; }
.${c}:hover { border-color: #f59e0b; background: rgba(245,158,11,0.08); }
.${c}:hover .st { color: #f59e0b; }
@keyframes ${c}-burst {
  0% { opacity: 1; transform: scale(0.4); border-width: 6px; }
  100% { opacity: 0; transform: scale(2); border-width: 0; }
}`
    add(mk({
      name: 'Star Burst Toggle',
      category: 'Toggles & Switches',
      description: 'Favorite toggle whose star fills amber, spins into place and fires an expanding ring when checked.',
      html, css,
      tags: ['star', 'favorite', 'burst', 'like', 'checkbox'],
    }))
  }

  /* 10. Padlock — the shackle lifts and swings open when unlocked */
  {
    const c = cls('v12-tgl-lock')
    const html = `<label class="${c}"><input type="checkbox"><span class="pl"><i></i><b></b></span><span class="lb">Locked</span></label>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  font: 600 0.85rem/1 system-ui, sans-serif;
  color: #cbd5e1;
  cursor: pointer;
}
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} .pl {
  position: relative;
  width: 44px;
  height: 56px;
}
.${c} .pl i {
  position: absolute;
  left: 9px;
  top: 0;
  width: 20px;
  height: 26px;
  border: 5px solid #64748b;
  border-bottom: none;
  border-radius: 13px 13px 0 0;
  transform-origin: 3px 100%;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s ease;
}
.${c} .pl b {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 44px;
  height: 32px;
  background: #64748b;
  border-radius: 6px;
  transition: background 0.3s ease;
}
.${c} .pl b::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 9px;
  width: 6px;
  height: 12px;
  margin-left: -3px;
  background: #0b1020;
  border-radius: 3px;
}
.${c} input:checked ~ .pl i { transform: translateY(-6px) rotateY(180deg); border-color: #6ee7b7; }
.${c} input:checked ~ .pl b { background: #10b981; }
.${c} input:checked ~ .lb { color: #6ee7b7; }
.${c}:hover .pl b { filter: brightness(1.15); }`
    add(mk({
      name: 'Padlock Toggle',
      category: 'Toggles & Switches',
      description: 'A grey padlock whose shackle lifts and swings open, turning the body emerald when unlocked.',
      html, css,
      tags: ['padlock', 'lock', 'unlock', 'security', 'checkbox'],
    }))
  }

  /* 11. Neon tube — a hollow track lights up like a neon sign */
  {
    const c = cls('v12-tgl-neon')
    const html = `<label class="${c}"><input type="checkbox"><span class="tr"><i></i></span></label>`
    const css = `.${c} { display: inline-block; cursor: pointer; }
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} .tr {
  display: block;
  position: relative;
  width: 84px;
  height: 40px;
  border: 3px solid #334155;
  border-radius: 999px;
  transition: border-color 0.35s ease, box-shadow 0.35s ease;
}
.${c} .tr i {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 3px solid #475569;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.35s ease, box-shadow 0.35s ease, background 0.35s ease;
}
.${c} input:checked + .tr {
  border-color: #22d3ee;
  box-shadow: 0 0 6px #06b6d4, 0 0 18px rgba(6,182,212,0.6), inset 0 0 8px rgba(6,182,212,0.5);
}
.${c} input:checked + .tr i {
  transform: translateX(44px);
  border-color: #fff;
  background: #22d3ee;
  box-shadow: 0 0 8px #fff, 0 0 18px #06b6d4;
}
.${c}:hover .tr { border-color: #67e8f9; }`
    add(mk({
      name: 'Neon Tube Toggle',
      category: 'Toggles & Switches',
      description: 'Hollow outline switch that ignites like a cyan neon tube, with a glowing thumb, when checked.',
      html, css,
      tags: ['neon', 'glow', 'outline', 'toggle', 'checkbox'],
    }))
  }

  /* 12. Eye visibility — an eye that closes its lid when hidden */
  {
    const c = cls('v12-tgl-eye')
    const html = `<label class="${c}"><input type="checkbox"><span class="ey"><i></i><b></b></span><span class="lb">Show password</span></label>`
    const css = `.${c} {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.5rem 0.9rem;
  border-radius: 0.6rem;
  background: #111a33;
  border: 1px solid #1e293b;
  font: 600 0.85rem/1 system-ui, sans-serif;
  color: #94a3b8;
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
}
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} .ey {
  position: relative;
  width: 34px;
  height: 20px;
  overflow: hidden;
}
.${c} .ey i {
  position: absolute;
  inset: 0;
  border-radius: 50% / 60%;
  background: #cbd5e1;
  transform: scaleY(0.12);
  transition: transform 0.3s ease, background 0.3s ease;
}
.${c} .ey b {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: #6366f1;
  box-shadow: inset 0 0 0 3px #1e1b4b;
  transform: scale(0);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c} input:checked ~ .ey i { transform: scaleY(1); background: #e0e7ff; }
.${c} input:checked ~ .ey b { transform: scale(1); }
.${c} input:checked ~ .lb { color: #c7d2fe; }
.${c}:hover { border-color: #6366f1; color: #c7d2fe; }`
    add(mk({
      name: 'Eye Visibility Toggle',
      category: 'Toggles & Switches',
      description: 'Show/hide password toggle where a closed eyelid opens and an indigo pupil pops in when checked.',
      html, css,
      tags: ['eye', 'visibility', 'password', 'reveal', 'checkbox'],
    }))
  }

  /* ───────────────────────── Tooltips & Popovers ─────────────────── */

  /* 13. Comic bubble — hard-shadow speech bubble with a rounded tail */
  {
    const c = cls('v12-tip-comic')
    const html = `<div class="${c}"><span class="bb">Pow! Saved to drafts.</span><button>💾</button></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.${c} .bb {
  position: relative;
  padding: 0.55rem 0.9rem;
  font: 800 0.85rem/1.2 system-ui, sans-serif;
  color: #1c1917;
  background: #fef3c7;
  border: 3px solid #1c1917;
  border-radius: 14px;
  box-shadow: 4px 4px 0 #1c1917;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.${c} .bb::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -14px;
  width: 16px;
  height: 16px;
  margin-left: -8px;
  background: #fef3c7;
  border: 3px solid #1c1917;
  border-top: none;
  border-left: none;
  transform: rotate(45deg) skew(10deg, 10deg);
  clip-path: polygon(0 0, 100% 0, 100% 100%);
}
.${c} button {
  width: 46px;
  height: 46px;
  font-size: 1.3rem;
  background: #f59e0b;
  border: 3px solid #1c1917;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 3px 3px 0 #1c1917;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.${c}:hover .bb { transform: translate(-2px, -2px) rotate(-2deg); box-shadow: 6px 6px 0 #1c1917; }
.${c}:hover button { transform: translate(2px, 2px); box-shadow: 0 0 0 #1c1917; }`
    add(mk({
      name: 'Comic Bubble Tooltip',
      category: 'Tooltips & Popovers',
      description: 'Comic-book speech bubble with a hard offset shadow floating over a chunky amber icon button.',
      html, css,
      tags: ['comic', 'speech-bubble', 'brutalist', 'tooltip', 'hard-shadow'],
    }))
  }

  /* 14. Slider value — a range thumb with its value bubble above */
  {
    const c = cls('v12-tip-slider')
    const html = `<div class="${c}"><span class="rail"><i class="fill"></i><i class="th"><b>64</b></i></span><small><span>0</span><span>100</span></small></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  padding-top: 34px;
  font: 600 0.7rem/1 system-ui, sans-serif;
  color: #94a3b8;
}
.${c} .rail {
  display: block;
  position: relative;
  height: 6px;
  background: #1e293b;
  border-radius: 3px;
}
.${c} .fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 64%;
  background: #0ea5e9;
  border-radius: 3px;
  transition: width 0.4s ease;
}
.${c} .th {
  position: absolute;
  left: 64%;
  top: 50%;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  background: #fff;
  border: 3px solid #0ea5e9;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  transition: left 0.4s ease, transform 0.2s ease;
}
.${c} .th b {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  padding: 0.3rem 0.5rem;
  font-size: 0.75rem;
  color: #fff;
  background: #0ea5e9;
  border-radius: 6px 6px 6px 0;
  transition: transform 0.2s ease;
}
.${c} .th b::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -5px;
  margin-left: -5px;
  border: 5px solid transparent;
  border-top-color: #0ea5e9;
  border-bottom: 0;
}
.${c} small { display: flex; justify-content: space-between; margin-top: 8px; }
.${c}:hover .th { transform: scale(1.15); }
.${c}:hover .th b { transform: translateX(-50%) translateY(-3px); }`
    add(mk({
      name: 'Slider Value Tooltip',
      category: 'Tooltips & Popovers',
      description: 'Range slider whose thumb carries a sky-blue value bubble that lifts as the thumb grows on hover.',
      html, css,
      tags: ['slider', 'range', 'value', 'tooltip', 'bubble'],
    }))
  }

  /* 15. Color picker popover — swatch trigger with a hue picker card */
  {
    const c = cls('v12-tip-color')
    const html = `<div class="${c}"><span class="sw"></span><div class="pp"><i class="area"><b></b></i><i class="hue"><b></b></i><code>#d946ef</code></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.${c} .sw {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #d946ef;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #d946ef;
  transition: transform 0.25s ease;
}
.${c} .pp {
  width: 140px;
  padding: 8px;
  background: #111a33;
  border: 1px solid #1e293b;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.5);
  display: grid;
  gap: 8px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.${c} .area {
  position: relative;
  display: block;
  height: 64px;
  border-radius: 6px;
  background: linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, #d946ef);
}
.${c} .area b,
.${c} .hue b {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.6);
  transition: transform 0.25s ease;
}
.${c} .area b { right: 14px; top: 10px; }
.${c} .hue {
  position: relative;
  display: block;
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
}
.${c} .hue b { left: 78%; top: -1px; }
.${c} code {
  font: 600 0.72rem/1 ui-monospace, monospace;
  color: #f0abfc;
  letter-spacing: 0.04em;
}
.${c}:hover .sw { transform: scale(1.1) rotate(-6deg); }
.${c}:hover .pp { transform: translateY(-3px); box-shadow: 0 16px 34px rgba(217,70,239,0.25); }
.${c}:hover .area b, .${c}:hover .hue b { transform: scale(1.3); }`
    add(mk({
      name: 'Color Picker Popover',
      category: 'Tooltips & Popovers',
      description: 'A fuchsia swatch button with an attached picker popover showing a saturation area, hue rail and hex readout.',
      html, css,
      tags: ['color', 'picker', 'popover', 'swatch', 'hue'],
    }))
  }

  /* 16. Ellipsis text — truncated text reveals its full form on hover */
  {
    const c = cls('v12-tip-ellipsis')
    const html = `<div class="${c}"><span class="tt">quarterly-report-final-v3-really-final.pdf</span><span class="tx">quarterly-report-final-v3-really-final.pdf</span></div>`
    const css = `.${c} {
  position: relative;
  width: 200px;
  padding: 0.55rem 0.8rem;
  font: 500 0.82rem/1.3 system-ui, sans-serif;
  color: #ccfbf1;
  background: #111a33;
  border: 1px solid #1e293b;
  border-radius: 8px;
  cursor: default;
}
.${c} .tx {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.${c} .tt {
  position: absolute;
  left: -20px;
  bottom: calc(100% + 8px);
  width: max-content;
  max-width: 250px;
  padding: 0.5rem 0.7rem;
  font-size: 0.72rem;
  line-height: 1.4;
  color: #042f2e;
  background: #5eead4;
  border-radius: 6px;
  overflow-wrap: anywhere;
  opacity: 0;
  transform: translateY(6px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.${c} .tt::after {
  content: '';
  position: absolute;
  left: 38px;
  top: 100%;
  border: 6px solid transparent;
  border-top-color: #5eead4;
  border-bottom: 0;
}
.${c}:hover { border-color: #14b8a6; }
.${c}:hover .tt { opacity: 1; transform: translateY(0); }`
    add(mk({
      name: 'Ellipsis Text Tooltip',
      category: 'Tooltips & Popovers',
      description: 'A truncated filename that reveals its full text in a teal tooltip when hovered.',
      html, css,
      tags: ['ellipsis', 'truncate', 'overflow', 'tooltip', 'text'],
    }))
  }

  /* 17. Kebab menu — a ⋮ button with an open dropdown menu */
  {
    const c = cls('v12-tip-menu')
    const html = `<div class="${c}"><button>⋮</button><ul><li>✎ Rename</li><li>⧉ Duplicate</li><li>↗ Share</li><li class="dg">🗑 Delete</li></ul></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.${c} button {
  width: 34px;
  height: 34px;
  font-size: 1.1rem;
  color: #e2e8f0;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.${c} ul {
  list-style: none;
  margin: 0;
  padding: 6px;
  width: 132px;
  background: #111a33;
  border: 1px solid #1e293b;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.5);
  font: 500 0.78rem/1 system-ui, sans-serif;
  color: #cbd5e1;
  transition: transform 0.25s ease;
}
.${c} li {
  padding: 0.5rem 0.6rem;
  border-radius: 6px;
  transition: background 0.15s ease, color 0.15s ease, padding-left 0.15s ease;
}
.${c} li:hover { background: rgba(139,92,246,0.18); color: #ede9fe; padding-left: 0.85rem; }
.${c} li.dg { color: #fda4af; margin-top: 4px; border-top: 1px solid #1e293b; border-radius: 0 0 6px 6px; }
.${c} li.dg:hover { background: rgba(244,63,94,0.15); color: #fff; }
.${c}:hover button { background: #8b5cf6; border-color: #8b5cf6; }
.${c}:hover ul { transform: translateY(2px); }`
    add(mk({
      name: 'Kebab Menu Popover',
      category: 'Tooltips & Popovers',
      description: 'A ⋮ overflow button with its dropdown menu open, rows highlighting violet and a destructive item set apart.',
      html, css,
      tags: ['menu', 'dropdown', 'kebab', 'popover', 'overflow'],
    }))
  }

  /* 18. Drawer label — a label slides out from behind an icon button */
  {
    const c = cls('v12-tip-drawer')
    const html = `<div class="${c}"><span class="lb">Add to library</span><button>+</button></div>`
    const css = `.${c} {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 44px;
}
.${c} button {
  position: relative;
  z-index: 1;
  width: 44px;
  height: 44px;
  font: 300 1.6rem/1 system-ui, sans-serif;
  color: #fff;
  background: #10b981;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(16,185,129,0.4);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c} .lb {
  order: 2;
  margin-left: -22px;
  padding: 0.45rem 0.9rem 0.45rem 1.9rem;
  font: 600 0.8rem/1 system-ui, sans-serif;
  color: #d1fae5;
  background: #064e3b;
  border-radius: 0 999px 999px 0;
  white-space: nowrap;
  transform: translateX(-100%);
  opacity: 0;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
}
.${c}:hover .lb { transform: translateX(0); opacity: 1; }
.${c}:hover button { transform: rotate(90deg); }`
    add(mk({
      name: 'Drawer Label Tooltip',
      category: 'Tooltips & Popovers',
      description: 'Round emerald plus button whose label slides out sideways from behind it like a drawer on hover.',
      html, css,
      tags: ['drawer', 'slide', 'label', 'fab', 'tooltip'],
    }))
  }

  /* ───────────────────────── Skeletons & Shimmers ─────────────────── */

  const shimmer = (c, base = '#1e293b', hi = 'rgba(255,255,255,0.08)') => `.${c} .sk {
  background: ${base};
  background-image: linear-gradient(100deg, transparent 30%, ${hi} 50%, transparent 70%);
  background-size: 200% 100%;
  animation: ${c}-shine 1.6s linear infinite;
}
@keyframes ${c}-shine { 0% { background-position: 150% 0; } 100% { background-position: -50% 0; } }`

  /* 19. Code block — indented token bars in a mini editor */
  {
    const c = cls('v12-skl-code')
    const html = `<div class="${c}"><div class="bar"><i></i><i></i><i></i></div><div class="ln"><b class="sk k"></b><b class="sk"></b></div><div class="ln i1"><b class="sk"></b><b class="sk s"></b></div><div class="ln i2"><b class="sk k"></b><b class="sk"></b><b class="sk s"></b></div><div class="ln i1"><b class="sk"></b></div><div class="ln"><b class="sk k"></b></div></div>`
    const css = `.${c} {
  width: 220px;
  padding: 8px 10px 10px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
}
.${c} .bar { display: flex; gap: 5px; margin-bottom: 10px; }
.${c} .bar i { width: 8px; height: 8px; border-radius: 50%; background: #334155; }
.${c} .ln { display: flex; gap: 6px; margin-bottom: 8px; }
.${c} .ln:last-child { margin-bottom: 0; }
.${c} .i1 { padding-left: 16px; }
.${c} .i2 { padding-left: 32px; }
.${c} .ln b { height: 10px; width: 64px; border-radius: 3px; }
.${c} .ln b.k { width: 34px; background-color: rgba(99,102,241,0.55); }
.${c} .ln b.s { width: 48px; background-color: rgba(129,140,248,0.3); }
${shimmer(c)}
.${c} .ln:nth-child(3) b { animation-delay: 0.1s; }
.${c} .ln:nth-child(4) b { animation-delay: 0.2s; }
.${c} .ln:nth-child(5) b { animation-delay: 0.3s; }
.${c} .ln:nth-child(6) b { animation-delay: 0.4s; }`
    add(mk({
      name: 'Code Block Skeleton',
      category: 'Skeletons & Shimmers',
      description: 'Mini editor placeholder with indented shimmering token bars, keyword bars tinted indigo.',
      html, css,
      tags: ['code', 'editor', 'skeleton', 'shimmer', 'placeholder'],
    }))
  }

  /* 20. Chat thread — alternating left/right bubbles */
  {
    const c = cls('v12-skl-chat')
    const html = `<div class="${c}"><div class="m"><i class="sk av"></i><b class="sk"></b></div><div class="m me"><b class="sk"></b></div><div class="m"><i class="sk av"></i><b class="sk"></b></div><div class="m me"><b class="sk"></b></div></div>`
    const css = `.${c} {
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${c} .m { display: flex; align-items: flex-end; gap: 6px; }
.${c} .m.me { justify-content: flex-end; }
.${c} .av { width: 20px; height: 20px; border-radius: 50%; flex: none; }
.${c} .m b { height: 26px; border-radius: 12px 12px 12px 3px; }
.${c} .m:nth-child(1) b { width: 130px; }
.${c} .m:nth-child(3) b { width: 96px; }
.${c} .m.me b { border-radius: 12px 12px 3px 12px; background-color: rgba(14,165,233,0.35); }
.${c} .m:nth-child(2) b { width: 110px; }
.${c} .m:nth-child(4) b { width: 70px; }
${shimmer(c)}
.${c} .m:nth-child(2) .sk { animation-delay: 0.15s; }
.${c} .m:nth-child(3) .sk { animation-delay: 0.3s; }
.${c} .m:nth-child(4) .sk { animation-delay: 0.45s; }`
    add(mk({
      name: 'Chat Bubbles Skeleton',
      category: 'Skeletons & Shimmers',
      description: 'Messaging placeholder with alternating grey and sky-tinted chat bubbles that shimmer in sequence.',
      html, css,
      tags: ['chat', 'messages', 'bubbles', 'skeleton', 'shimmer'],
    }))
  }

  /* 21. Stat tiles — three KPI tiles with a number bar and sparkline */
  {
    const c = cls('v12-skl-stats')
    const html = `<div class="${c}"><div class="t"><b class="sk l"></b><b class="sk n"></b><i class="sp"><u class="sk"></u><u class="sk"></u><u class="sk"></u><u class="sk"></u><u class="sk"></u></i></div><div class="t"><b class="sk l"></b><b class="sk n"></b><i class="sp"><u class="sk"></u><u class="sk"></u><u class="sk"></u><u class="sk"></u><u class="sk"></u></i></div><div class="t"><b class="sk l"></b><b class="sk n"></b><i class="sp"><u class="sk"></u><u class="sk"></u><u class="sk"></u><u class="sk"></u><u class="sk"></u></i></div></div>`
    const css = `.${c} {
  display: flex;
  gap: 8px;
  width: 240px;
}
.${c} .t {
  flex: 1;
  padding: 10px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
}
.${c} .t b { display: block; border-radius: 4px; }
.${c} .l { width: 60%; height: 7px; margin-bottom: 10px; }
.${c} .n { width: 80%; height: 16px; margin-bottom: 10px; background-color: rgba(16,185,129,0.35); }
.${c} .sp { display: flex; align-items: flex-end; gap: 3px; height: 22px; }
.${c} .sp u { flex: 1; border-radius: 2px 2px 0 0; }
.${c} .sp u:nth-child(1) { height: 40%; }
.${c} .sp u:nth-child(2) { height: 70%; }
.${c} .sp u:nth-child(3) { height: 50%; }
.${c} .sp u:nth-child(4) { height: 100%; }
.${c} .sp u:nth-child(5) { height: 65%; }
${shimmer(c)}
.${c} .t:nth-child(2) .sk { animation-delay: 0.2s; }
.${c} .t:nth-child(3) .sk { animation-delay: 0.4s; }`
    add(mk({
      name: 'Stat Tiles Skeleton',
      category: 'Skeletons & Shimmers',
      description: 'Three KPI tile placeholders, each with a label bar, emerald-tinted number bar and a tiny sparkline.',
      html, css,
      tags: ['stats', 'kpi', 'dashboard', 'skeleton', 'sparkline'],
    }))
  }

  /* 22. Music player — album art, title bars, seek bar and controls */
  {
    const c = cls('v12-skl-player')
    const html = `<div class="${c}"><div class="art sk"></div><div class="body"><b class="sk t"></b><b class="sk a"></b><i class="seek sk"><u></u></i><span class="ctl"><i class="sk"></i><i class="sk big"></i><i class="sk"></i></span></div></div>`
    const css = `.${c} {
  display: flex;
  gap: 12px;
  width: 230px;
  padding: 10px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
}
.${c} .art { width: 64px; height: 64px; border-radius: 8px; flex: none; background-color: rgba(236,72,153,0.3); }
.${c} .body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.${c} .body b { display: block; height: 8px; border-radius: 4px; }
.${c} .t { width: 85%; height: 10px; }
.${c} .a { width: 55%; }
.${c} .seek { position: relative; display: block; height: 4px; border-radius: 2px; margin-top: 2px; }
.${c} .seek u { position: absolute; left: 0; top: 0; bottom: 0; width: 38%; background: #ec4899; border-radius: 2px; }
.${c} .ctl { display: flex; align-items: center; justify-content: center; gap: 12px; }
.${c} .ctl i { width: 12px; height: 12px; border-radius: 50%; }
.${c} .ctl i.big { width: 20px; height: 20px; background-color: rgba(236,72,153,0.4); }
${shimmer(c)}`
    add(mk({
      name: 'Music Player Skeleton',
      category: 'Skeletons & Shimmers',
      description: 'Now-playing card placeholder with pink-tinted album art, title bars, a seek bar and shimmering control dots.',
      html, css,
      tags: ['music', 'player', 'media', 'skeleton', 'shimmer'],
    }))
  }

  /* 23. Calendar grid — month header and a 7×4 grid of day cells */
  {
    const c = cls('v12-skl-calendar')
    const html = `<div class="${c}"><div class="hd"><b class="sk"></b><span><i class="sk"></i><i class="sk"></i></span></div><div class="g">${'<i class="sk"></i>'.repeat(28)}</div></div>`
    const css = `.${c} {
  width: 210px;
  padding: 10px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
}
.${c} .hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.${c} .hd b { display: block; width: 80px; height: 10px; border-radius: 4px; }
.${c} .hd span { display: flex; gap: 6px; }
.${c} .hd span i { width: 14px; height: 14px; border-radius: 4px; }
.${c} .g { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
.${c} .g i { aspect-ratio: 1; border-radius: 4px; }
.${c} .g i:nth-child(-n+7) { background-color: rgba(245,158,11,0.3); height: 6px; aspect-ratio: auto; border-radius: 3px; }
.${c} .g i:nth-child(17) { background-color: rgba(245,158,11,0.6); border-radius: 50%; }
${shimmer(c)}
.${c} .g i:nth-child(n+8):nth-child(-n+14) .sk, .${c} .g i:nth-child(n+8):nth-child(-n+14) { animation-delay: 0.1s; }
.${c} .g i:nth-child(n+15):nth-child(-n+21) { animation-delay: 0.2s; }
.${c} .g i:nth-child(n+22) { animation-delay: 0.3s; }`
    add(mk({
      name: 'Calendar Grid Skeleton',
      category: 'Skeletons & Shimmers',
      description: 'Month-view placeholder with a header, amber weekday ticks, a 7-by-4 grid of day cells and a highlighted today dot.',
      html, css,
      tags: ['calendar', 'grid', 'month', 'skeleton', 'shimmer'],
    }))
  }

  /* 24. Diagonal stripes — animated barber-pole stripes instead of a shine */
  {
    const c = cls('v12-skl-stripes')
    const html = `<div class="${c}"><div class="img"></div><div class="row"><b class="w1"></b><b class="w2"></b></div><div class="row"><b class="w3"></b><b class="w4"></b></div></div>`
    const css = `.${c} {
  width: 220px;
  padding: 10px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
}
.${c} .img,
.${c} b {
  display: block;
  border-radius: 6px;
  background-color: #1e293b;
  background-image: repeating-linear-gradient(-45deg, rgba(20,184,166,0.28) 0 8px, transparent 8px 16px);
  background-size: 22.6px 22.6px;
  animation: ${c}-slide 0.9s linear infinite;
}
.${c} .img { height: 64px; margin-bottom: 10px; }
.${c} .row { display: flex; gap: 8px; margin-bottom: 8px; }
.${c} .row:last-child { margin-bottom: 0; }
.${c} b { height: 10px; }
.${c} .w1 { width: 60%; } .${c} .w2 { width: 25%; }
.${c} .w3 { width: 40%; } .${c} .w4 { width: 45%; }
@keyframes ${c}-slide { 0% { background-position: 0 0; } 100% { background-position: 22.6px 0; } }`
    add(mk({
      name: 'Diagonal Stripe Skeleton',
      category: 'Skeletons & Shimmers',
      description: 'Card placeholder filled with slowly marching teal barber-pole stripes instead of a shimmer sweep.',
      html, css,
      tags: ['stripes', 'diagonal', 'barber-pole', 'skeleton', 'loading'],
    }))
  }
}
