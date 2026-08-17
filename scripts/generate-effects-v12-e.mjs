// scripts/generate-effects-v12-e.mjs
//
// Twelfth wave, part E: Modals & Overlays, Alerts & Toasts,
// Accordions & Tabs, 3D & Perspective — six designs each, one entry
// per distinct design (no colorway / size / speed stamping), following
// the v11 convention. Every design here is chosen to differ in
// mechanic or composition from the surviving catalog entries in its
// category, and each carries its own accent color.
//
// Modals     — anchored popover, share sheet, rating prompt, floating
//              mini player, split auth modal, wizard dialog
// Alerts     — hazard-stripe alert, achievement toast, update-ready
//              toast, error-trace alert, ticker banner, presence toast
// Accordions — browser folder tabs, horizontal flex accordion,
//              expanding icon tabs, marker highlight tabs, bracket
//              tabs, ledger accordion
// 3D         — hinged door, perspective phone, spinning coin,
//              perspective crawl, swinging badge, louver blinds
//
// Constraints inherited from the assembly guard: root visible at rest,
// no position:absolute on the root, ≤ ~260×150, infinite keyframes rest
// sensibly at their 100% stop.

export function generateV12E(ctx) {
  const { cls, mk, add } = ctx

  /* ───────────────────────── Modals & Overlays ───────────────────────── */

  /* 1. Anchored popover — a floating popover pinned to a trigger with a caret */
  {
    const c = cls('v12-mo-popover')
    const html = `<div class="${c}"><button class="trig">Options ▾</button><div class="pop"><b>Share settings</b><span>Anyone with the link can view.</span><i class="tail"></i></div></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  height: 130px;
  font-family: system-ui, sans-serif;
}
.${c} .trig {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #e2e8f0;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: border-color 0.25s ease, background 0.25s ease;
}
.${c} .pop {
  position: absolute;
  left: 50%;
  top: 52px;
  width: 190px;
  transform: translateX(-50%) translateY(0);
  padding: 0.7rem 0.85rem;
  background: #fff;
  color: #0f172a;
  border-radius: 0.6rem;
  box-shadow: 0 12px 30px rgba(0,0,0,0.45), 0 0 0 1px rgba(99,102,241,0.25);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.${c} .pop b { display: block; font-size: 0.8rem; color: #4338ca; }
.${c} .pop span { display: block; font-size: 0.72rem; color: #475569; margin-top: 2px; }
.${c} .tail {
  position: absolute;
  top: -6px;
  left: 50%;
  width: 12px;
  height: 12px;
  margin-left: -6px;
  background: #fff;
  transform: rotate(45deg);
  box-shadow: -1px -1px 0 rgba(99,102,241,0.25);
}
.${c}:hover .trig { border-color: #6366f1; background: #312e81; }
.${c}:hover .pop { transform: translateX(-50%) translateY(6px); box-shadow: 0 18px 40px rgba(0,0,0,0.55), 0 0 0 1px #6366f1; }`
    add(mk({
      name: 'Anchored Popover',
      category: 'Modals & Overlays',
      description: 'A white popover with a caret pinned beneath its trigger button that springs downward and gains an accent ring on hover.',
      html, css,
      tags: ['popover', 'anchored', 'caret', 'overlay', 'dropdown'],
    }))
  }

  /* 2. Share sheet — a grid of app targets rising over a dimmed page */
  {
    const c = cls('v12-mo-share')
    const html = `<div class="${c}"><div class="page"></div><div class="sheet"><b>Share to</b><div class="grid"><i>✉</i><i>✈</i><i>🔗</i><i>📋</i></div></div></div>`
    const css = `.${c} {
  position: relative;
  width: 200px;
  height: 140px;
  overflow: hidden;
  border-radius: 0.7rem;
  background: #0f172a;
  font-family: system-ui, sans-serif;
}
.${c} .page {
  position: absolute;
  inset: 0;
  background: linear-gradient(#1e293b 0 12px, transparent 12px 20px, #1e293b 20px 28px, transparent 28px 36px, #1e293b 36px 44px, transparent 44px) 12px 12px / calc(100% - 24px) 100% no-repeat;
  opacity: 0.6;
  transition: opacity 0.3s ease, filter 0.3s ease;
}
.${c} .sheet {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  padding: 0.6rem 0.8rem 0.7rem;
  background: #e0f2fe;
  color: #0c4a6e;
  border-radius: 0.8rem 0.8rem 0 0;
  transform: translateY(8px);
  box-shadow: 0 -8px 24px rgba(0,0,0,0.4);
  transition: transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.${c} .sheet b { display: block; font-size: 0.72rem; margin-bottom: 0.5rem; }
.${c} .grid { display: flex; gap: 0.6rem; }
.${c} .grid i {
  flex: 1;
  height: 32px;
  display: grid;
  place-items: center;
  font-style: normal;
  font-size: 0.95rem;
  background: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 2px 6px rgba(14,165,233,0.25);
  transition: transform 0.25s ease, background 0.25s ease;
}
.${c}:hover .page { opacity: 0.35; filter: blur(1px); }
.${c}:hover .sheet { transform: translateY(0); }
.${c}:hover .grid i { background: #bae6fd; }
.${c}:hover .grid i:nth-child(1) { transform: translateY(-3px); transition-delay: 0s; }
.${c}:hover .grid i:nth-child(2) { transform: translateY(-3px); transition-delay: 0.05s; }
.${c}:hover .grid i:nth-child(3) { transform: translateY(-3px); transition-delay: 0.1s; }
.${c}:hover .grid i:nth-child(4) { transform: translateY(-3px); transition-delay: 0.15s; }`
    add(mk({
      name: 'Share Sheet Modal',
      category: 'Modals & Overlays',
      description: 'A pale share sheet with a row of app targets rises over a dimmed page and its icons hop in sequence on hover.',
      html, css,
      tags: ['share', 'sheet', 'overlay', 'icons', 'mobile'],
    }))
  }

  /* 3. Rating prompt — a star-rating dialog over a dimmed card */
  {
    const c = cls('v12-mo-rating')
    const html = `<div class="${c}"><div class="dim"></div><div class="dlg"><b>Enjoying the app?</b><div class="stars"><i>★</i><i>★</i><i>★</i><i>★</i><i>★</i></div><span>Tap a star to rate</span></div></div>`
    const css = `.${c} {
  position: relative;
  width: 210px;
  height: 140px;
  border-radius: 0.7rem;
  overflow: hidden;
  background: #111827;
  font-family: system-ui, sans-serif;
}
.${c} .dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(245,158,11,0.15), transparent 60%);
  transition: opacity 0.3s ease;
}
.${c} .dlg {
  position: absolute;
  left: 50%; top: 50%;
  width: 170px;
  transform: translate(-50%, -50%);
  padding: 0.75rem 0.8rem 0.7rem;
  text-align: center;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 0.7rem;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5);
  transition: border-color 0.3s ease, transform 0.3s ease;
}
.${c} .dlg b { display: block; font-size: 0.8rem; color: #f9fafb; }
.${c} .dlg span { display: block; font-size: 0.65rem; color: #9ca3af; margin-top: 0.3rem; }
.${c} .stars { display: flex; justify-content: center; gap: 4px; margin-top: 0.4rem; }
.${c} .stars i {
  font-style: normal;
  font-size: 1.15rem;
  color: #4b5563;
  transition: color 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c}:hover .dlg { border-color: #f59e0b; transform: translate(-50%, -50%) scale(1.03); }
.${c}:hover .stars i { color: #f59e0b; text-shadow: 0 0 8px rgba(245,158,11,0.6); }
.${c}:hover .stars i:nth-child(1) { transform: scale(1.2); transition-delay: 0s; }
.${c}:hover .stars i:nth-child(2) { transform: scale(1.2); transition-delay: 0.06s; }
.${c}:hover .stars i:nth-child(3) { transform: scale(1.2); transition-delay: 0.12s; }
.${c}:hover .stars i:nth-child(4) { transform: scale(1.2); transition-delay: 0.18s; }
.${c}:hover .stars i:nth-child(5) { transform: scale(1.2); transition-delay: 0.24s; }`
    add(mk({
      name: 'Rating Prompt Modal',
      category: 'Modals & Overlays',
      description: 'A centred rate-us dialog whose five grey stars light up amber one after another when hovered.',
      html, css,
      tags: ['rating', 'stars', 'dialog', 'prompt', 'modal'],
    }))
  }

  /* 4. Floating mini player — picture-in-picture overlay in a corner */
  {
    const c = cls('v12-mo-pip')
    const html = `<div class="${c}"><div class="doc"><i></i><i></i><i></i><i></i></div><div class="pip"><span class="play">▶</span><em></em></div></div>`
    const css = `.${c} {
  position: relative;
  width: 220px;
  height: 140px;
  border-radius: 0.6rem;
  overflow: hidden;
  background: #0f172a;
  border: 1px solid #1e293b;
}
.${c} .doc { position: absolute; inset: 14px; }
.${c} .doc i {
  display: block;
  height: 8px;
  margin-bottom: 10px;
  border-radius: 4px;
  background: #1e293b;
}
.${c} .doc i:nth-child(1) { width: 60%; }
.${c} .doc i:nth-child(2) { width: 90%; }
.${c} .doc i:nth-child(3) { width: 75%; }
.${c} .doc i:nth-child(4) { width: 50%; }
.${c} .pip {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 92px;
  height: 56px;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #881337, #f43f5e 60%, #fb7185);
  box-shadow: 0 10px 24px rgba(244,63,94,0.35), 0 0 0 1px rgba(255,255,255,0.08);
  display: grid;
  place-items: center;
  overflow: hidden;
  transition: transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.3s ease;
}
.${c} .play {
  width: 22px; height: 22px;
  display: grid; place-items: center;
  font-size: 0.6rem;
  color: #881337;
  background: rgba(255,255,255,0.9);
  border-radius: 50%;
  transition: transform 0.3s ease;
}
.${c} .pip em {
  position: absolute;
  left: 0; bottom: 0;
  height: 3px;
  width: 40%;
  background: #fff;
  transition: width 0.6s ease;
}
.${c}:hover .pip { transform: translate(-6px, -6px) scale(1.15); box-shadow: 0 16px 36px rgba(244,63,94,0.5), 0 0 0 1px rgba(255,255,255,0.15); }
.${c}:hover .play { transform: scale(1.2); }
.${c}:hover .pip em { width: 70%; }`
    add(mk({
      name: 'Floating Mini Player',
      category: 'Modals & Overlays',
      description: 'A picture-in-picture video overlay docked in the corner of a page that swells toward the cursor and advances its progress bar on hover.',
      html, css,
      tags: ['pip', 'video', 'floating', 'overlay', 'player'],
    }))
  }

  /* 5. Split auth modal — image pane + form pane dialog */
  {
    const c = cls('v12-mo-split')
    const html = `<div class="${c}"><div class="art"><b>Welcome<br>back</b></div><div class="form"><i></i><i></i><button>Sign in</button></div></div>`
    const css = `.${c} {
  display: flex;
  width: 220px;
  height: 130px;
  border-radius: 0.7rem;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.3);
  font-family: system-ui, sans-serif;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.${c} .art {
  width: 42%;
  padding: 0.8rem 0.7rem;
  background: linear-gradient(160deg, #6d28d9, #8b5cf6 55%, #c4b5fd);
  background-size: 130% 130%;
  background-position: 0% 0%;
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  line-height: 1.15;
  transition: background-position 0.6s ease;
}
.${c} .form {
  flex: 1;
  padding: 0.85rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.${c} .form i {
  display: block;
  height: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 0.3rem;
  background: #f8fafc;
  transition: border-color 0.3s ease;
}
.${c} .form button {
  margin-top: auto;
  padding: 0.35rem 0;
  font-size: 0.7rem;
  font-weight: 600;
  color: #fff;
  background: #8b5cf6;
  border: none;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: background 0.25s ease;
}
.${c}:hover { transform: translateY(-3px); box-shadow: 0 22px 50px rgba(0,0,0,0.55), 0 0 0 1px #8b5cf6; }
.${c}:hover .art { background-position: 100% 100%; }
.${c}:hover .form i { border-color: #8b5cf6; }
.${c}:hover .form button { background: #6d28d9; }`
    add(mk({
      name: 'Split Auth Modal',
      category: 'Modals & Overlays',
      description: 'A two-pane sign-in dialog with a violet artwork panel beside a compact form that lifts and tints its fields on hover.',
      html, css,
      tags: ['auth', 'sign-in', 'split', 'dialog', 'modal'],
    }))
  }

  /* 6. Wizard dialog — a multi-step modal with progress dots and next button */
  {
    const c = cls('v12-mo-wizard')
    const html = `<div class="${c}"><div class="dots"><i class="on"></i><i class="on"></i><i></i><i></i></div><b>Connect your workspace</b><span>Step 2 of 4</span><div class="row"><em>Back</em><button>Continue →</button></div></div>`
    const css = `.${c} {
  position: relative;
  width: 210px;
  padding: 0.85rem 0.9rem 0.8rem;
  background: #ecfdf5;
  color: #064e3b;
  border-radius: 0.7rem;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.35);
  font-family: system-ui, sans-serif;
  transition: box-shadow 0.3s ease;
}
.${c} .dots { display: flex; gap: 5px; margin-bottom: 0.6rem; }
.${c} .dots i {
  height: 4px;
  flex: 1;
  border-radius: 2px;
  background: #a7f3d0;
  transition: background 0.3s ease;
}
.${c} .dots i.on { background: #10b981; }
.${c} b { display: block; font-size: 0.85rem; }
.${c} span { display: block; font-size: 0.65rem; color: #047857; margin-top: 2px; }
.${c} .row { display: flex; align-items: center; justify-content: space-between; margin-top: 0.75rem; }
.${c} .row em { font-style: normal; font-size: 0.7rem; color: #047857; }
.${c} .row button {
  padding: 0.35rem 0.75rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #fff;
  background: #10b981;
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: transform 0.25s ease, background 0.25s ease;
}
.${c}:hover { box-shadow: 0 20px 48px rgba(0,0,0,0.55), 0 0 0 1px #10b981; }
.${c}:hover .dots i:nth-child(3) { background: #10b981; }
.${c}:hover .row button { transform: translateX(3px); background: #059669; }`
    add(mk({
      name: 'Wizard Dialog',
      category: 'Modals & Overlays',
      description: 'A pale multi-step onboarding dialog with a segmented progress bar that advances a step and nudges its continue button on hover.',
      html, css,
      tags: ['wizard', 'stepper', 'dialog', 'onboarding', 'modal'],
    }))
  }

  /* ───────────────────────── Alerts & Toasts ───────────────────────── */

  /* 7. Hazard stripe alert — warning box with a diagonal-striped edge */
  {
    const c = cls('v12-al-hazard')
    const html = `<div class="${c}"><span class="ico">⚠</span><div><b>Rate limit reached</b><span>Retry in 42s or upgrade your plan.</span></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 240px;
  padding: 0.7rem 0.8rem 0.7rem 1.1rem;
  background: #1c1917;
  color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  overflow: hidden;
  font-family: system-ui, sans-serif;
  transition: box-shadow 0.3s ease;
}
.${c}::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 8px;
  background: repeating-linear-gradient(-45deg, #f59e0b 0 6px, #1c1917 6px 12px);
  background-size: 17px 17px;
  transition: background-position 0.6s linear;
}
.${c} .ico { font-size: 1.1rem; color: #f59e0b; transition: transform 0.3s ease; }
.${c} b { display: block; font-size: 0.8rem; }
.${c} span:not(.ico) { display: block; font-size: 0.68rem; color: #d6d3d1; margin-top: 1px; }
.${c}:hover { box-shadow: 0 0 0 3px rgba(245,158,11,0.25), 0 8px 24px rgba(245,158,11,0.15); }
.${c}:hover::before { background-position: 0 17px; }
.${c}:hover .ico { transform: rotate(-8deg) scale(1.15); }`
    add(mk({
      name: 'Hazard Stripe Alert',
      category: 'Alerts & Toasts',
      description: 'A warning alert edged with diagonal hazard stripes that scroll and a caution icon that tilts on hover.',
      html, css,
      tags: ['warning', 'hazard', 'stripes', 'alert', 'rate-limit'],
    }))
  }

  /* 8. Achievement toast — badge with shimmer and unlocked label */
  {
    const c = cls('v12-al-achieve')
    const html = `<div class="${c}"><span class="badge">🏆</span><div><em>Achievement unlocked</em><b>First deploy</b></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 230px;
  padding: 0.65rem 0.9rem;
  background: linear-gradient(135deg, #2e1065, #4c1d95);
  color: #ede9fe;
  border: 1px solid #7c3aed;
  border-radius: 0.7rem;
  overflow: hidden;
  font-family: system-ui, sans-serif;
  box-shadow: 0 8px 24px rgba(139,92,246,0.3);
}
.${c}::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  left: -60%;
  width: 40%;
  background: linear-gradient(100deg, transparent, rgba(255,255,255,0.22), transparent);
  transform: skewX(-15deg);
  transition: left 0.7s ease;
}
.${c} .badge {
  width: 36px; height: 36px;
  display: grid; place-items: center;
  font-size: 1.15rem;
  background: radial-gradient(circle at 35% 30%, #c4b5fd, #8b5cf6 70%);
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(139,92,246,0.35);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.${c} em { display: block; font-style: normal; font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; color: #c4b5fd; }
.${c} b { display: block; font-size: 0.85rem; }
.${c}:hover::after { left: 120%; }
.${c}:hover .badge { transform: rotate(-12deg) scale(1.15); box-shadow: 0 0 0 5px rgba(139,92,246,0.45), 0 0 18px rgba(139,92,246,0.7); }`
    add(mk({
      name: 'Achievement Toast',
      category: 'Alerts & Toasts',
      description: 'A game-style unlock toast with a round trophy badge that wobbles and a shimmer that sweeps across on hover.',
      html, css,
      tags: ['achievement', 'toast', 'badge', 'shimmer', 'unlock'],
    }))
  }

  /* 9. Update ready toast — restart CTA with a pulsing dot */
  {
    const c = cls('v12-al-update')
    const html = `<div class="${c}"><i class="dot"></i><div><b>Update ready</b><span>v2.4.0 downloaded</span></div><button>Restart</button></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 230px;
  padding: 0.6rem 0.6rem 0.6rem 0.85rem;
  background: #0c1a2b;
  color: #e0f2fe;
  border: 1px solid #0ea5e9;
  border-radius: 0.6rem;
  font-family: system-ui, sans-serif;
  box-shadow: 0 6px 20px rgba(14,165,233,0.2);
  transition: box-shadow 0.3s ease;
}
.${c} .dot {
  position: relative;
  width: 10px; height: 10px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #0ea5e9;
}
.${c} .dot::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid #0ea5e9;
  animation: ${c}-ping 1.6s ease-out infinite;
}
@keyframes ${c}-ping {
  0% { transform: scale(0.6); opacity: 1; }
  100% { transform: scale(2.2); opacity: 0; }
}
.${c} > div { flex: 1; }
.${c} b { display: block; font-size: 0.8rem; }
.${c} span { display: block; font-size: 0.65rem; color: #7dd3fc; }
.${c} button {
  padding: 0.35rem 0.7rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #082f49;
  background: #38bdf8;
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: background 0.25s ease, transform 0.25s ease;
}
.${c}:hover { box-shadow: 0 10px 28px rgba(14,165,233,0.35); }
.${c}:hover button { background: #7dd3fc; transform: scale(1.06); }`
    add(mk({
      name: 'Update Ready Toast',
      category: 'Alerts & Toasts',
      description: 'A sky-blue app-update toast with a pinging status dot and a restart button that brightens and swells on hover.',
      html, css,
      tags: ['update', 'toast', 'restart', 'ping', 'status'],
    }))
  }

  /* 10. Error trace alert — expandable stack trace via <details> */
  {
    const c = cls('v12-al-trace')
    const html = `<details class="${c}"><summary><i>✕</i><b>Build failed</b><em>details</em></summary><pre>TypeError: x is undefined
  at render (app.js:42)
  at main (app.js:9)</pre></details>`
    const css = `.${c} {
  width: 240px;
  background: #1c0a0f;
  color: #ffe4e6;
  border: 1px solid #f43f5e;
  border-left-width: 4px;
  border-radius: 0.5rem;
  overflow: hidden;
  font-family: system-ui, sans-serif;
  transition: box-shadow 0.3s ease;
}
.${c} summary {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.6rem 0.75rem;
  cursor: pointer;
  list-style: none;
}
.${c} summary::-webkit-details-marker { display: none; }
.${c} summary i {
  width: 18px; height: 18px;
  display: grid; place-items: center;
  font-style: normal;
  font-size: 0.65rem;
  font-weight: 700;
  color: #fff;
  background: #f43f5e;
  border-radius: 50%;
}
.${c} summary b { flex: 1; font-size: 0.8rem; }
.${c} summary em {
  font-style: normal;
  font-size: 0.62rem;
  color: #fb7185;
  text-decoration: underline dotted;
  transition: color 0.2s ease;
}
.${c}[open] summary em { color: #fecdd3; }
.${c} pre {
  margin: 0;
  padding: 0.5rem 0.75rem 0.6rem;
  font-size: 0.6rem;
  line-height: 1.45;
  color: #fda4af;
  background: #2a0d15;
  border-top: 1px solid rgba(244,63,94,0.3);
  white-space: pre;
  overflow: hidden;
}
.${c}:hover { box-shadow: 0 0 0 3px rgba(244,63,94,0.2); }
.${c}:hover summary em { color: #fff; }`
    add(mk({
      name: 'Error Trace Alert',
      category: 'Alerts & Toasts',
      description: 'A rose error alert built on a details element that expands to reveal a compact stack trace when clicked.',
      html, css,
      tags: ['error', 'alert', 'details', 'stack-trace', 'expand'],
    }))
  }

  /* 11. Ticker banner — announcement bar with a scrolling marquee message */
  {
    const c = cls('v12-al-ticker')
    const html = `<div class="${c}"><b>LIVE</b><div class="track"><span>Scheduled maintenance tonight 02:00–03:00 UTC · Expect brief downtime · </span><span>Scheduled maintenance tonight 02:00–03:00 UTC · Expect brief downtime · </span></div></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  width: 250px;
  height: 34px;
  background: #f97316;
  color: #431407;
  border-radius: 0.35rem;
  overflow: hidden;
  font-family: system-ui, sans-serif;
  box-shadow: 0 6px 18px rgba(249,115,22,0.35);
}
.${c} b {
  flex-shrink: 0;
  height: 100%;
  padding: 0 0.6rem;
  display: grid;
  place-items: center;
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  color: #fff7ed;
  background: #9a3412;
}
.${c} .track {
  flex: 1;
  display: flex;
  overflow: hidden;
  white-space: nowrap;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
}
.${c} .track span {
  flex-shrink: 0;
  padding-left: 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  animation: ${c}-scroll 9s linear infinite;
}
@keyframes ${c}-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}
.${c}:hover .track span { animation-play-state: paused; }`
    add(mk({
      name: 'Ticker Banner',
      category: 'Alerts & Toasts',
      description: 'An orange announcement bar with a LIVE tag and an edge-faded marquee message that scrolls continuously and pauses on hover.',
      html, css,
      tags: ['banner', 'ticker', 'marquee', 'announcement', 'live'],
    }))
  }

  /* 12. Presence toast — avatar cluster "3 people joined" */
  {
    const c = cls('v12-al-presence')
    const html = `<div class="${c}"><div class="avs"><i>A</i><i>M</i><i>K</i></div><div><b>3 people joined</b><span>Ada, Max &amp; Kai are here</span></div><em>👋</em></div>`
    const css = `.${c} {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 245px;
  padding: 0.6rem 0.8rem;
  background: #14200a;
  color: #ecfccb;
  border: 1px solid #84cc16;
  border-radius: 999px;
  font-family: system-ui, sans-serif;
  box-shadow: 0 6px 20px rgba(132,204,22,0.2);
  transition: box-shadow 0.3s ease;
}
.${c} .avs { display: flex; flex-shrink: 0; }
.${c} .avs i {
  width: 24px; height: 24px;
  display: grid; place-items: center;
  margin-left: -9px;
  font-style: normal;
  font-size: 0.65rem;
  font-weight: 700;
  color: #1a2e05;
  border-radius: 50%;
  border: 2px solid #14200a;
  transition: margin-left 0.35s cubic-bezier(0.34, 1.4, 0.64, 1), transform 0.35s ease;
}
.${c} .avs i:first-child { margin-left: 0; background: #bef264; }
.${c} .avs i:nth-child(2) { background: #a3e635; }
.${c} .avs i:nth-child(3) { background: #84cc16; }
.${c} > div { flex: 1; min-width: 0; white-space: nowrap; }
.${c} b { display: block; font-size: 0.78rem; }
.${c} span { display: block; font-size: 0.6rem; color: #a3e635; }
.${c} em { margin-left: auto; font-style: normal; font-size: 1rem; transition: transform 0.4s ease; }
.${c}:hover { box-shadow: 0 10px 28px rgba(132,204,22,0.35); }
.${c}:hover .avs i { margin-left: 1px; }
.${c}:hover .avs i:first-child { margin-left: 0; }
.${c}:hover em { transform: rotate(20deg) scale(1.2); }`
    add(mk({
      name: 'Presence Toast',
      category: 'Alerts & Toasts',
      description: 'A pill toast with an overlapping avatar cluster that fans apart on hover to announce who just joined.',
      html, css,
      tags: ['presence', 'avatars', 'toast', 'joined', 'pill'],
    }))
  }

  /* ───────────────────────── Accordions & Tabs ───────────────────────── */

  /* 13. Browser folder tabs — trapezoid tabs with an active tab merged into the pane */
  {
    const c = cls('v12-at-folder')
    const html = `<div class="${c}"><label><input type="radio" name="${c}" checked><span>index.html</span></label><label><input type="radio" name="${c}"><span>styles.css</span></label><label><input type="radio" name="${c}"><span>app.js</span></label><div class="pane"></div></div>`
    const css = `.${c} {
  position: relative;
  display: flex;
  align-items: flex-end;
  width: 240px;
  height: 120px;
  padding: 0 0 78px 8px;
  font-family: system-ui, sans-serif;
}
.${c} label {
  position: relative;
  margin-right: -10px;
  cursor: pointer;
}
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} span {
  display: block;
  padding: 0.4rem 1rem 0.45rem;
  font-size: 0.7rem;
  color: #94a3b8;
  background: #1e293b;
  clip-path: polygon(10px 0, calc(100% - 10px) 0, 100% 100%, 0 100%);
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.${c} label:hover span { color: #e2e8f0; transform: translateY(-2px); }
.${c} input:checked + span {
  color: #fff;
  background: #6366f1;
  z-index: 2;
  position: relative;
  transform: none;
}
.${c} .pane {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 78px;
  background: #6366f1;
  border-radius: 0.5rem;
  background-image: repeating-linear-gradient(#818cf8 0 6px, transparent 6px 14px);
  background-size: 60% 100%;
  background-position: 14px 12px;
  background-repeat: no-repeat;
}`
    add(mk({
      name: 'Browser Folder Tabs',
      category: 'Accordions & Tabs',
      description: 'Trapezoid browser-style tabs where the checked radio tab merges seamlessly into the indigo content pane below.',
      html, css,
      tags: ['tabs', 'browser', 'trapezoid', 'radio', 'folder'],
    }))
  }

  /* 14. Horizontal flex accordion — hovered panel widens, others shrink */
  {
    const c = cls('v12-at-flexpanels')
    const html = `<div class="${c}"><div class="p"><b>Plan</b></div><div class="p"><b>Build</b></div><div class="p"><b>Ship</b></div></div>`
    const css = `.${c} {
  display: flex;
  gap: 5px;
  width: 240px;
  height: 120px;
  font-family: system-ui, sans-serif;
}
.${c} .p {
  position: relative;
  flex: 1;
  display: flex;
  align-items: flex-end;
  padding: 0.5rem 0.55rem;
  border-radius: 0.5rem;
  background: #134e4a;
  overflow: hidden;
  cursor: pointer;
  transition: flex 0.45s cubic-bezier(0.4, 0, 0.2, 1), background 0.35s ease;
}
.${c} .p::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 15%, rgba(94,234,212,0.5), transparent 55%);
  opacity: 0;
  transition: opacity 0.35s ease;
}
.${c} .p b {
  position: relative;
  font-size: 0.72rem;
  color: #99f6e4;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  transition: writing-mode 0s, color 0.3s ease;
}
.${c} .p:hover { flex: 3; background: #14b8a6; }
.${c} .p:hover::before { opacity: 1; }
.${c} .p:hover b { color: #042f2e; font-weight: 700; }`
    add(mk({
      name: 'Horizontal Flex Accordion',
      category: 'Accordions & Tabs',
      description: 'Three vertical teal panels where the hovered one grows to triple width and lights up while its siblings squeeze aside.',
      html, css,
      tags: ['accordion', 'horizontal', 'flex', 'panels', 'expand'],
    }))
  }

  /* 15. Expanding icon tabs — checked tab unrolls its label */
  {
    const c = cls('v12-at-icontabs')
    const html = `<div class="${c}"><label><input type="radio" name="${c}" checked><i>⌂</i><span>Home</span></label><label><input type="radio" name="${c}"><i>♥</i><span>Saved</span></label><label><input type="radio" name="${c}"><i>☺</i><span>Profile</span></label><label><input type="radio" name="${c}"><i>⚙</i><span>Settings</span></label></div>`
    const css = `.${c} {
  display: flex;
  gap: 4px;
  padding: 5px;
  background: #0e1a24;
  border: 1px solid #164e63;
  border-radius: 999px;
  font-family: system-ui, sans-serif;
}
.${c} label {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 0.6rem;
  border-radius: 999px;
  color: #67e8f9;
  cursor: pointer;
  transition: background 0.3s ease, color 0.3s ease;
}
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} i { font-style: normal; font-size: 0.95rem; }
.${c} span {
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  font-size: 0.72rem;
  font-weight: 600;
  opacity: 0;
  transition: max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, margin-left 0.35s ease;
}
.${c} label:hover { color: #cffafe; background: rgba(6,182,212,0.15); }
.${c} input:checked ~ i { color: #083344; }
.${c} label:has(input:checked) { background: #06b6d4; color: #083344; }
.${c} input:checked ~ span { max-width: 80px; opacity: 1; margin-left: 0.4rem; }`
    add(mk({
      name: 'Expanding Icon Tabs',
      category: 'Accordions & Tabs',
      description: 'A cyan pill tab bar of icons where the checked tab unrolls a text label beside its glyph while the others stay compact.',
      html, css,
      tags: ['tabs', 'icons', 'expand', 'label', 'radio'],
    }))
  }

  /* 16. Marker highlight tabs — active tab gets a hand-drawn highlighter stroke */
  {
    const c = cls('v12-at-marker')
    const html = `<div class="${c}"><label><input type="radio" name="${c}" checked><span>Overview</span></label><label><input type="radio" name="${c}"><span>Reviews</span></label><label><input type="radio" name="${c}"><span>Specs</span></label></div>`
    const css = `.${c} {
  display: flex;
  gap: 1.1rem;
  padding: 0.4rem 0.6rem;
  font-family: Georgia, 'Times New Roman', serif;
}
.${c} label { position: relative; cursor: pointer; }
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} span {
  position: relative;
  display: inline-block;
  padding: 0.2rem 0.3rem;
  font-size: 1rem;
  color: #cbd5e1;
  z-index: 1;
  transition: color 0.25s ease;
}
.${c} span::before {
  content: '';
  position: absolute;
  left: -4px; right: -4px;
  top: 38%;
  height: 0.7em;
  background: #ec4899;
  border-radius: 40% 60% 55% 45% / 60% 40% 60% 40%;
  transform: scaleX(0) rotate(-1.5deg);
  transform-origin: left center;
  z-index: -1;
  opacity: 0.85;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} label:hover span { color: #fff; }
.${c} input:checked + span { color: #fff; font-weight: 700; }
.${c} input:checked + span::before { transform: scaleX(1) rotate(-1.5deg); }`
    add(mk({
      name: 'Marker Highlight Tabs',
      category: 'Accordions & Tabs',
      description: 'Serif text tabs where the checked tab receives a hand-drawn pink highlighter stroke that sweeps in from the left.',
      html, css,
      tags: ['tabs', 'highlighter', 'marker', 'serif', 'radio'],
    }))
  }

  /* 17. Bracket tabs — active tab framed by sliding [ ] brackets */
  {
    const c = cls('v12-at-bracket')
    const html = `<div class="${c}"><label><input type="radio" name="${c}" checked><span>logs</span></label><label><input type="radio" name="${c}"><span>metrics</span></label><label><input type="radio" name="${c}"><span>traces</span></label></div>`
    const css = `.${c} {
  display: flex;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  background: #120a1a;
  border: 1px solid #3b0764;
  border-radius: 0.4rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.${c} label { position: relative; cursor: pointer; }
.${c} input { position: absolute; opacity: 0; width: 0; height: 0; }
.${c} span {
  position: relative;
  display: inline-block;
  padding: 0.3rem 0.85rem;
  font-size: 0.8rem;
  color: #a78bfa;
  transition: color 0.25s ease;
}
.${c} span::before,
.${c} span::after {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.05rem;
  color: #d946ef;
  opacity: 0;
  transition: opacity 0.25s ease, left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), right 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.${c} span::before { content: '['; left: 10px; }
.${c} span::after { content: ']'; right: 10px; }
.${c} label:hover span { color: #e9d5ff; }
.${c} input:checked + span { color: #f5d0fe; font-weight: 700; }
.${c} input:checked + span::before { opacity: 1; left: 0; }
.${c} input:checked + span::after { opacity: 1; right: 0; }`
    add(mk({
      name: 'Bracket Tabs',
      category: 'Accordions & Tabs',
      description: 'Monospace tabs where a pair of fuchsia square brackets snaps around the checked tab label.',
      html, css,
      tags: ['tabs', 'brackets', 'monospace', 'radio', 'terminal'],
    }))
  }

  /* 18. Ledger accordion — numbered rows, open row gets a filled number and plus→minus */
  {
    const c = cls('v12-at-ledger')
    const html = `<div class="${c}"><details open><summary><i>01</i><b>Getting started</b><em></em></summary><p>Install the CLI and run init.</p></details><details><summary><i>02</i><b>Configuration</b><em></em></summary><p>Edit hoverlab.config.js.</p></details><details><summary><i>03</i><b>Deploy</b><em></em></summary><p>Push to main to publish.</p></details></div>`
    const css = `.${c} {
  width: 240px;
  border-top: 1px solid #065f46;
  font-family: system-ui, sans-serif;
  color: #d1fae5;
}
.${c} details { border-bottom: 1px solid #065f46; }
.${c} summary {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.2rem;
  cursor: pointer;
  list-style: none;
}
.${c} summary::-webkit-details-marker { display: none; }
.${c} summary i {
  width: 22px; height: 22px;
  display: grid; place-items: center;
  font-style: normal;
  font-size: 0.6rem;
  font-weight: 700;
  color: #34d399;
  border: 1px solid #10b981;
  border-radius: 50%;
  transition: background 0.25s ease, color 0.25s ease;
}
.${c} summary b { flex: 1; font-size: 0.78rem; font-weight: 600; }
.${c} summary em {
  position: relative;
  width: 12px; height: 12px;
}
.${c} summary em::before,
.${c} summary em::after {
  content: '';
  position: absolute;
  left: 0; top: 5px;
  width: 12px; height: 2px;
  background: #10b981;
  transition: transform 0.3s ease;
}
.${c} summary em::after { transform: rotate(90deg); }
.${c} details[open] summary i { background: #10b981; color: #022c22; }
.${c} details[open] summary em::after { transform: rotate(0deg); }
.${c} summary:hover b { color: #6ee7b7; }
.${c} p {
  margin: 0;
  padding: 0 0.2rem 0.5rem 2.05rem;
  font-size: 0.68rem;
  color: #6ee7b7;
}`
    add(mk({
      name: 'Ledger Accordion',
      category: 'Accordions & Tabs',
      description: 'A numbered emerald accordion whose open row fills its number badge and turns the plus into a minus.',
      html, css,
      tags: ['accordion', 'numbered', 'details', 'plus-minus', 'ledger'],
    }))
  }

  /* ───────────────────────── 3D & Perspective ───────────────────────── */

  /* 19. Hinged door — a panel swings open on its left edge to reveal a room */
  {
    const c = cls('v12-td-door')
    const html = `<div class="${c}"><div class="frame"><span>enter</span><div class="door"><i></i></div></div></div>`
    const css = `.${c} {
  width: 200px;
  height: 140px;
  display: grid;
  place-items: center;
  perspective: 500px;
}
.${c} .frame {
  position: relative;
  width: 84px;
  height: 120px;
  background: linear-gradient(#fde68a, #f59e0b);
  border: 4px solid #78350f;
  border-radius: 4px 4px 0 0;
  transform-style: preserve-3d;
  display: grid;
  place-items: center;
}
.${c} .frame span {
  font: 700 0.65rem/1 system-ui, sans-serif;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #78350f;
}
.${c} .door {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #92400e, #b45309 60%, #d97706);
  border-radius: 2px 2px 0 0;
  transform-origin: left center;
  transform-style: preserve-3d;
  transform: rotateY(-20deg);
  box-shadow: 0 0 0 1px #451a03;
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .door i {
  position: absolute;
  right: 9px;
  top: 50%;
  width: 7px; height: 7px;
  margin-top: -3px;
  border-radius: 50%;
  background: #fde68a;
  box-shadow: 0 0 6px rgba(253,230,138,0.6);
}
.${c}:hover .door { transform: rotateY(-108deg); }`
    add(mk({
      name: 'Hinged Door',
      category: '3D & Perspective',
      description: 'A wooden door in a glowing amber frame that swings open on its left hinge in perspective to reveal the word inside on hover.',
      html, css,
      tags: ['door', 'hinge', 'rotate', 'perspective', 'reveal'],
    }))
  }

  /* 20. Perspective phone — a tilted device mockup stands upright on hover */
  {
    const c = cls('v12-td-phone')
    const html = `<div class="${c}"><div class="dev"><i class="notch"></i><div class="scr"><b></b><b></b><b></b></div></div></div>`
    const css = `.${c} {
  width: 200px;
  height: 145px;
  display: grid;
  place-items: center;
  perspective: 600px;
}
.${c} .dev {
  position: relative;
  width: 70px;
  height: 130px;
  background: #0f172a;
  border: 3px solid #334155;
  border-radius: 12px;
  transform-style: preserve-3d;
  transform: rotateY(-38deg) rotateX(12deg);
  box-shadow: -14px 18px 30px rgba(0,0,0,0.5), inset 0 0 0 1px #1e293b;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.6s ease;
}
.${c} .notch {
  position: absolute;
  top: 5px; left: 50%;
  width: 24px; height: 5px;
  margin-left: -12px;
  background: #334155;
  border-radius: 3px;
  z-index: 1;
}
.${c} .scr {
  position: absolute;
  inset: 4px;
  border-radius: 8px;
  padding: 16px 8px 8px;
  background: linear-gradient(160deg, #0369a1, #0ea5e9 60%, #7dd3fc);
  overflow: hidden;
  transform: translateZ(2px);
}
.${c} .scr b {
  display: block;
  height: 6px;
  margin-bottom: 7px;
  border-radius: 3px;
  background: rgba(255,255,255,0.7);
  transform: translateX(-30px);
  opacity: 0;
  transition: transform 0.5s ease, opacity 0.5s ease;
}
.${c} .scr b:nth-child(1) { width: 80%; transition-delay: 0.1s; }
.${c} .scr b:nth-child(2) { width: 55%; transition-delay: 0.2s; }
.${c} .scr b:nth-child(3) { width: 65%; transition-delay: 0.3s; }
.${c}:hover .dev { transform: rotateY(0) rotateX(0); box-shadow: 0 18px 36px rgba(14,165,233,0.35), inset 0 0 0 1px #1e293b; }
.${c}:hover .scr b { transform: translateX(0); opacity: 1; }`
    add(mk({
      name: 'Perspective Phone',
      category: '3D & Perspective',
      description: 'A phone mockup resting at a three-quarter angle that rotates flat to face you on hover while its screen content slides in.',
      html, css,
      tags: ['phone', 'mockup', 'perspective', 'rotate', 'device'],
    }))
  }

  /* 21. Spinning coin — a thick disc rotates continuously on Y showing its edge */
  {
    const c = cls('v12-td-coin')
    const html = `<div class="${c}"><div class="coin"><div class="f a">$</div><div class="f b">$</div><i></i><i></i><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  width: 160px;
  height: 130px;
  display: grid;
  place-items: center;
  perspective: 700px;
}
.${c} .coin {
  position: relative;
  width: 84px;
  height: 84px;
  transform-style: preserve-3d;
  animation: ${c}-spin 3.2s linear infinite;
}
.${c}:hover .coin { animation-duration: 1.2s; }
.${c} .f {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font: 800 2rem/1 Georgia, serif;
  color: #3f6212;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #d9f99d, #84cc16 60%, #4d7c0f);
  box-shadow: inset 0 0 0 5px #a3e635, inset 0 0 0 7px #65a30d;
  backface-visibility: hidden;
}
.${c} .f.a { transform: translateZ(4px); }
.${c} .f.b { transform: rotateY(180deg) translateZ(4px); }
.${c} i {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #4d7c0f;
  border: 1px solid #365314;
}
.${c} i:nth-child(3) { transform: translateZ(2px); }
.${c} i:nth-child(4) { transform: translateZ(0px); }
.${c} i:nth-child(5) { transform: translateZ(-2px); }
.${c} i:nth-child(6) { transform: translateZ(-3px); }
.${c} i:nth-child(7) { transform: translateZ(3px); }
@keyframes ${c}-spin {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}`
    add(mk({
      name: 'Spinning Coin',
      category: '3D & Perspective',
      description: 'A lime coin with a visible rim built from stacked discs spins on its vertical axis and speeds up on hover.',
      html, css,
      tags: ['coin', 'spin', 'rotate', 'preserve-3d', 'disc'],
    }))
  }

  /* 22. Perspective crawl — text tilted back on X, drifting away like an opening crawl */
  {
    const c = cls('v12-td-crawl')
    const html = `<div class="${c}"><div class="stage"><p><b>A NEW HOVER</b>It is a period of CSS-only motion. Rebel stylesheets, striking from a hidden repo, have won their first victory against the JS Empire. Hover to hold the frame.</p></div></div>`
    const css = `.${c} {
  width: 240px;
  height: 145px;
  overflow: hidden;
  border-radius: 0.5rem;
  background: radial-gradient(ellipse at 50% 110%, #1c1917, #000 70%);
  perspective: 300px;
  perspective-origin: 50% 30%;
  -webkit-mask-image: linear-gradient(transparent 0, #000 40%);
  mask-image: linear-gradient(transparent 0, #000 40%);
}
.${c} .stage {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform: rotateX(40deg);
  transform-origin: 50% 100%;
}
.${c} p {
  margin: 0 auto;
  width: 200px;
  padding-top: 40px;
  text-align: justify;
  font: 700 0.95rem/1.35 system-ui, sans-serif;
  color: #f97316;
  animation: ${c}-crawl 14s linear infinite;
}
.${c} p b { display: block; font-size: 1.4rem; text-align: center; margin: 0 0 8px; color: #fdba74; letter-spacing: 0.06em; }
@keyframes ${c}-crawl {
  0% { transform: translateY(70px); }
  50% { transform: translateY(-120px); }
  50.01% { transform: translateY(70px); }
  100% { transform: translateY(0); }
}
.${c}:hover p { animation-play-state: paused; }`
    add(mk({
      name: 'Perspective Crawl',
      category: '3D & Perspective',
      description: 'Orange opening-crawl text tilted back into the distance scrolls away from the viewer and holds still on hover.',
      html, css,
      tags: ['crawl', 'perspective', 'text', 'rotate-x', 'cinematic'],
    }))
  }

  /* 23. Swinging badge — an ID badge on a lanyard swings in 3D */
  {
    const c = cls('v12-td-badge')
    const html = `<div class="${c}"><div class="lan"></div><div class="card"><i></i><b>Guest</b><span>#0421</span></div></div>`
    const css = `.${c} {
  position: relative;
  width: 160px;
  height: 148px;
  perspective: 500px;
  transform-style: preserve-3d;
  font-family: system-ui, sans-serif;
}
.${c} .lan {
  position: absolute;
  left: 50%;
  top: 0;
  width: 6px;
  height: 34px;
  margin-left: -3px;
  background: repeating-linear-gradient(#f43f5e 0 4px, #be123c 4px 8px);
  border-radius: 3px;
  transform-origin: top center;
  animation: ${c}-swing 2.6s ease-in-out infinite;
}
.${c} .card {
  position: absolute;
  left: 50%;
  top: 30px;
  width: 80px;
  height: 108px;
  margin-left: -40px;
  padding-top: 20px;
  text-align: center;
  background: #fff;
  border-radius: 0.5rem;
  border-top: 12px solid #f43f5e;
  box-shadow: 0 12px 26px rgba(0,0,0,0.5);
  transform-origin: top center;
  transform-style: preserve-3d;
  animation: ${c}-swing 2.6s ease-in-out infinite;
  transition: animation-duration 0.3s;
}
.${c} .card i {
  display: block;
  width: 34px; height: 34px;
  margin: 0 auto 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fda4af, #f43f5e);
}
.${c} .card b { display: block; font-size: 0.75rem; color: #0f172a; }
.${c} .card span { display: block; font-size: 0.6rem; color: #64748b; }
@keyframes ${c}-swing {
  0% { transform: rotateZ(-8deg) rotateY(-14deg); }
  50% { transform: rotateZ(8deg) rotateY(14deg); }
  100% { transform: rotateZ(-8deg) rotateY(-14deg); }
}
.${c}:hover .card,
.${c}:hover .lan { animation-duration: 1.1s; }`
    add(mk({
      name: 'Swinging Badge',
      category: '3D & Perspective',
      description: 'A conference ID badge hanging from a rose lanyard sways side to side with a subtle Y-axis twist and swings faster on hover.',
      html, css,
      tags: ['badge', 'lanyard', 'swing', 'pendulum', 'perspective'],
    }))
  }

  /* 24. Louver blinds — horizontal slats rotate open on X to reveal a scene */
  {
    const c = cls('v12-td-blinds')
    const html = `<div class="${c}"><div class="scene"><b>hello</b></div><div class="slats"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>`
    const css = `.${c} {
  position: relative;
  width: 200px;
  height: 130px;
  border-radius: 0.5rem;
  overflow: hidden;
  perspective: 500px;
  font-family: system-ui, sans-serif;
}
.${c} .scene {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 50% 40%, #a78bfa, #4c1d95 70%);
}
.${c} .scene b {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #f5f3ff;
  text-shadow: 0 0 14px rgba(196,181,253,0.8);
}
.${c} .slats {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  transform-style: preserve-3d;
}
.${c} .slats i {
  flex: 1;
  background: linear-gradient(#e9d5ff, #a78bfa 55%, #7c3aed);
  border-bottom: 1px solid #4c1d95;
  transform-origin: center top;
  transform: rotateX(0deg);
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
}
.${c} .slats i:nth-child(1) { transition-delay: 0s; }
.${c} .slats i:nth-child(2) { transition-delay: 0.05s; }
.${c} .slats i:nth-child(3) { transition-delay: 0.1s; }
.${c} .slats i:nth-child(4) { transition-delay: 0.15s; }
.${c} .slats i:nth-child(5) { transition-delay: 0.2s; }
.${c} .slats i:nth-child(6) { transition-delay: 0.25s; }
.${c}:hover .slats i { transform: rotateX(90deg); }`
    add(mk({
      name: 'Louver Blinds',
      category: '3D & Perspective',
      description: 'A stack of violet window slats tilts open in staggered 3D rotation on hover to reveal the glowing scene behind.',
      html, css,
      tags: ['blinds', 'louver', 'slats', 'rotate-x', 'reveal'],
    }))
  }
}
