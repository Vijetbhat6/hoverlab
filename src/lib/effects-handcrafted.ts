/**
 * Hand-crafted (curated) effects.
 *
 * These ~64 effects are small enough (~64 KB) to ship to the client
 * directly, which is why the landing showcase and the "Featured" filter
 * render instantly with no network round-trip. The 1,600+ generated
 * effects live in generated-effects.json and are fetched on demand.
 */

import type { Effect } from "./effect-types";

/* ============================================================
 *  Hand-curated effects (featured)
 * ==========================================================
 * These are the original, hand-crafted demos. They are marked
 * `featured: true` so the "Featured" filter surfaces them.
 */

export const HANDCRAFTED: Effect[] = [
  /* ---------------- BUTTONS ---------------- */
  {
    id: "btn-gradient",
    name: "Gradient Shift Button",
    category: "Buttons",
    description:
      "A button whose multi-color gradient slides across on hover, paired with a soft drop shadow that intensifies.",
    html: `<button class="fx-btn-gradient">Get Started</button>`,
    css: `.fx-btn-gradient {
  position: relative;
  padding: 0.75rem 1.75rem;
  border: none;
  border-radius: 0.625rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(120deg, #f43f5e, #f59e0b, #10b981, #6366f1);
  background-size: 300% 300%;
  background-position: 0% 50%;
  transition: background-position 0.6s ease, transform 0.2s ease, box-shadow 0.3s ease;
  box-shadow: 0 6px 18px -6px rgba(244, 63, 94, 0.5);
}
.fx-btn-gradient:hover {
  background-position: 100% 50%;
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -8px rgba(99, 102, 241, 0.55);
}
.fx-btn-gradient:active { transform: translateY(0); }`,
  },
  {
    id: "btn-neon",
    name: "Neon Glow Button",
    category: "Buttons",
    description:
      "A bordered button with a soft cyan halo that fully ignites into a glowing pill on hover.",
    html: `<button class="fx-btn-neon">Activate</button>`,
    css: `.fx-btn-neon {
  position: relative;
  padding: 0.75rem 1.75rem;
  border: 2px solid #22d3ee;
  border-radius: 0.625rem;
  background: transparent;
  color: #22d3ee;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: color 0.25s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 6px rgba(34, 211, 238, 0.4), inset 0 0 6px rgba(34, 211, 238, 0.2);
}
.fx-btn-neon:hover {
  color: #0b0f1a;
  background: #22d3ee;
  box-shadow: 0 0 14px rgba(34, 211, 238, 0.9), 0 0 32px rgba(34, 211, 238, 0.6);
}`,
    darkSurface: true,
  },
  {
    id: "btn-3d",
    name: "3D Push Button",
    category: "Buttons",
    description:
      "A chunky button with a solid drop-shadow base that compresses when pressed for a satisfying tactile feel.",
    html: `<button class="fx-btn-3d">Press Me</button>`,
    css: `.fx-btn-3d {
  position: relative;
  padding: 0.75rem 1.75rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 0.95rem;
  color: #fff;
  cursor: pointer;
  background: #ec4899;
  box-shadow: 0 6px 0 #9d174d, 0 8px 14px rgba(0, 0, 0, 0.25);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.fx-btn-3d:hover { background: #f472b6; }
.fx-btn-3d:active {
  transform: translateY(6px);
  box-shadow: 0 0 0 #9d174d, 0 0 4px rgba(0, 0, 0, 0.25);
}`,
  },
  {
    id: "btn-slide",
    name: "Slide Fill Button",
    category: "Buttons",
    description:
      "A ghost button that fills from left to right with a solid color on hover, with the text color flipping in sync.",
    html: `<button class="fx-btn-slide">Continue</button>`,
    css: `.fx-btn-slide {
  position: relative;
  isolation: isolate;
  padding: 0.75rem 1.75rem;
  border: 2px solid #10b981;
  border-radius: 0.625rem;
  background: transparent;
  color: #10b981;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  overflow: hidden;
  transition: color 0.3s ease;
}
.fx-btn-slide::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #10b981;
  transform: translateX(-101%);
  transition: transform 0.35s cubic-bezier(0.65, 0, 0.35, 1);
  z-index: -1;
}
.fx-btn-slide:hover { color: #fff; }
.fx-btn-slide:hover::before { transform: translateX(0); }`,
  },
  {
    id: "btn-border-draw",
    name: "Border Draw Button",
    category: "Buttons",
    description:
      "Minimal text button whose top and bottom borders sweep in from opposite directions on hover.",
    html: `<button class="fx-btn-border-draw">Discover</button>`,
    css: `.fx-btn-border-draw {
  position: relative;
  padding: 0.75rem 1.75rem;
  border: none;
  background: transparent;
  color: #f59e0b;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: color 0.3s ease;
}
.fx-btn-border-draw::before,
.fx-btn-border-draw::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  background: #f59e0b;
  transform: scaleX(0);
  transition: transform 0.4s ease;
}
.fx-btn-border-draw::before { top: 0; left: 0; transform-origin: left; }
.fx-btn-border-draw::after { bottom: 0; right: 0; transform-origin: right; }
.fx-btn-border-draw:hover::before,
.fx-btn-border-draw:hover::after { transform: scaleX(1); }
.fx-btn-border-draw:hover { color: #fbbf24; }`,
  },
  {
    id: "btn-pulse",
    name: "Pulse Ring Button",
    category: "Buttons",
    description:
      "A pill button with two concentric rings that continuously pulse outward, calling attention without motion noise.",
    html: `<button class="fx-btn-pulse">Subscribe</button>`,
    css: `.fx-btn-pulse {
  position: relative;
  padding: 0.75rem 1.75rem;
  border: none;
  border-radius: 999px;
  background: #6366f1;
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.fx-btn-pulse::before,
.fx-btn-pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 2px solid #6366f1;
  animation: fx-pulse-ring 2s ease-out infinite;
}
.fx-btn-pulse::after { animation-delay: 1s; }
.fx-btn-pulse:hover { transform: scale(1.05); }
@keyframes fx-pulse-ring {
  0%   { transform: scale(1);   opacity: 0.8; }
  100% { transform: scale(1.6); opacity: 0; }
}`,
  },

  /* ---------------- LOADERS ---------------- */
  {
    id: "loader-spinner",
    name: "Classic Spinner",
    category: "Loaders",
    description:
      "The timeless rotating-border spinner, refined with a subtle base ring for depth.",
    html: `<div class="fx-loader-spinner"></div>`,
    css: `.fx-loader-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: fx-spin 0.9s linear infinite;
}
@keyframes fx-spin { to { transform: rotate(360deg); } }`,
  },
  {
    id: "loader-dots",
    name: "Three Dots Bounce",
    category: "Loaders",
    description:
      "Three colored dots that bounce in a staggered rhythm, perfect for inline status indicators.",
    html: `<div class="fx-loader-dots"><span></span><span></span><span></span></div>`,
    css: `.fx-loader-dots { display: flex; gap: 0.5rem; }
.fx-loader-dots span {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #f43f5e;
  animation: fx-dots-bounce 1.2s ease-in-out infinite;
}
.fx-loader-dots span:nth-child(2) { animation-delay: 0.15s; background: #f59e0b; }
.fx-loader-dots span:nth-child(3) { animation-delay: 0.3s; background: #10b981; }
@keyframes fx-dots-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
  40%           { transform: translateY(-14px); opacity: 1; }
}`,
  },
  {
    id: "loader-pulse-ring",
    name: "Pulse Ring Loader",
    category: "Loaders",
    description:
      "Two concentric rings expand and fade in alternation, creating a sonar-like pulse.",
    html: `<div class="fx-loader-pulse-ring"></div>`,
    css: `.fx-loader-pulse-ring {
  position: relative;
  width: 50px;
  height: 50px;
}
.fx-loader-pulse-ring::before,
.fx-loader-pulse-ring::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #22d3ee;
  animation: fx-pulse-r 1.8s ease-out infinite;
}
.fx-loader-pulse-ring::after { animation-delay: 0.9s; }
@keyframes fx-pulse-r {
  0%   { transform: scale(0);   opacity: 1; }
  100% { transform: scale(1.2); opacity: 0; }
}`,
  },
  {
    id: "loader-square",
    name: "Square Wave",
    category: "Loaders",
    description:
      "A single square that rotates and morphs its border-radius in a hypnotic wave pattern.",
    html: `<div class="fx-loader-square"></div>`,
    css: `.fx-loader-square {
  width: 44px;
  height: 44px;
  background: #ec4899;
  border-radius: 6px;
  animation: fx-square 1.4s ease-in-out infinite;
}
@keyframes fx-square {
  0%, 40%, 100% { transform: rotate(0deg) scale(1); border-radius: 6px; }
  20%           { transform: rotate(45deg) scale(0.7); border-radius: 50%; }
  60%           { transform: rotate(-45deg) scale(1.1); border-radius: 12px; }
}`,
  },
  {
    id: "loader-skeleton",
    name: "Skeleton Shimmer",
    category: "Loaders",
    description:
      "Two stacked placeholder bars with a soft sweeping highlight that signals content is on its way.",
    html: `<div class="fx-loader-skeleton"></div>
<div class="fx-loader-skeleton"></div>`,
    css: `.fx-loader-skeleton {
  width: 100%;
  max-width: 240px;
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg,
    rgba(148, 163, 184, 0.15) 25%,
    rgba(148, 163, 184, 0.35) 50%,
    rgba(148, 163, 184, 0.15) 75%);
  background-size: 200% 100%;
  animation: fx-shimmer 1.5s infinite;
}
.fx-loader-skeleton + .fx-loader-skeleton { margin-top: 8px; height: 10px; width: 80%; }
@keyframes fx-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`,
    darkSurface: true,
  },

  /* ---------------- CARDS ---------------- */
  {
    id: "card-lift",
    name: "Hover Lift Card",
    category: "Cards",
    description:
      "A gradient card that rises on hover with an intensifying colored shadow for a tactile floating effect.",
    html: `<div class="fx-card-lift">
  <h4 style="margin:0;font-size:1.05rem;font-weight:700;">Emerald Plan</h4>
  <p style="margin:0.35rem 0 0;font-size:0.85rem;opacity:0.9;">Hover to lift</p>
</div>`,
    css: `.fx-card-lift {
  width: 220px;
  padding: 1.5rem;
  border-radius: 0.875rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease;
  cursor: pointer;
}
.fx-card-lift:hover {
  transform: translateY(-10px);
  box-shadow: 0 22px 40px -12px rgba(16, 185, 129, 0.55);
}`,
  },
  {
    id: "card-glass",
    name: "Glassmorphism Card",
    category: "Cards",
    description:
      "A frosted glass card with backdrop blur sitting over a colorful gradient plate — the classic iOS-style material.",
    html: `<div class="fx-card-glass">
  <h4 style="margin:0;font-size:1.05rem;font-weight:700;">Frosted</h4>
  <p style="margin:0.35rem 0 0;font-size:0.85rem;opacity:0.9;">Blur + transparency</p>
</div>`,
    css: `.fx-card-glass {
  position: relative;
  width: 240px;
  padding: 1.5rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px) saturate(180%);
  -webkit-backdrop-filter: blur(14px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}
.fx-card-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  background:
    radial-gradient(circle at 20% 20%, rgba(244, 63, 94, 0.55), transparent 50%),
    radial-gradient(circle at 80% 60%, rgba(99, 102, 241, 0.55), transparent 50%),
    linear-gradient(135deg, #1f2937, #111827);
  z-index: -1;
}`,
    darkSurface: true,
  },
  {
    id: "card-neu",
    name: "Neumorphism Card",
    category: "Cards",
    description:
      "A soft extruded card with dual light/dark shadows that invert into an inset on hover for a pressed feel.",
    html: `<div class="fx-card-neu">
  <h4 style="margin:0;font-size:1.05rem;font-weight:700;">Soft UI</h4>
  <p style="margin:0.35rem 0 0;font-size:0.85rem;">Hover to press</p>
</div>`,
    css: `.fx-card-neu {
  width: 220px;
  padding: 1.75rem;
  border-radius: 1.25rem;
  background: #e0e5ec;
  color: #475569;
  box-shadow: 10px 10px 24px #b8bbc0, -10px -10px 24px #ffffff;
  transition: box-shadow 0.3s ease;
}
.fx-card-neu:hover {
  box-shadow: inset 6px 6px 14px #b8bbc0, inset -6px -6px 14px #ffffff;
}`,
    previewClass: "bg-[#e0e5ec]",
  },
  {
    id: "card-spotlight",
    name: "Spotlight Card",
    category: "Cards",
    description:
      "A dark card where a cyan spotlight follows the cursor, revealing the surface only where you point. (Move your mouse over it.)",
    html: `<div class="fx-card-spotlight" data-spotlight>
  <h4 style="margin:0;font-size:1.05rem;font-weight:700;">Spotlight</h4>
  <p style="margin:0.35rem 0 0;font-size:0.85rem;opacity:0.85;">Move your cursor</p>
</div>`,
    css: `.fx-card-spotlight {
  position: relative;
  width: 240px;
  padding: 1.5rem;
  border-radius: 0.875rem;
  background: #1e293b;
  color: #f1f5f9;
  overflow: hidden;
  transition: transform 0.3s ease;
}
.fx-card-spotlight::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at var(--fx-x, 50%) var(--fx-y, 50%),
    rgba(34, 211, 238, 0.35), transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.fx-card-spotlight:hover::before { opacity: 1; }

// JS hook — track cursor position on the card:
//   const card = document.querySelector('.fx-card-spotlight');
//   card.addEventListener('mousemove', e => {
//     const rect = card.getBoundingClientRect();
//     card.style.setProperty('--fx-x', (e.clientX - rect.left) + 'px');
//     card.style.setProperty('--fx-y', (e.clientY - rect.top) + 'px');
//   });`,
    darkSurface: true,
  },
  {
    id: "card-flip",
    name: "3D Flip Card",
    category: "Cards",
    description:
      "A card that rotates 180° on the Y axis when hovered, revealing a different face on the back.",
    html: `<div class="fx-flip-card">
  <div class="fx-flip-card-inner">
    <div class="fx-flip-card-face fx-flip-card-front">Front</div>
    <div class="fx-flip-card-face fx-flip-card-back">Back</div>
  </div>
</div>`,
    css: `.fx-flip-card {
  perspective: 1000px;
  width: 220px;
  height: 140px;
}
.fx-flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}
.fx-flip-card:hover .fx-flip-card-inner { transform: rotateY(180deg); }
.fx-flip-card-face {
  position: absolute;
  inset: 0;
  border-radius: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
.fx-flip-card-front { background: linear-gradient(135deg, #f59e0b, #f43f5e); color: #fff; }
.fx-flip-card-back  { background: linear-gradient(135deg, #6366f1, #06b6d4); color: #fff; transform: rotateY(180deg); }`,
  },

  /* ---------------- TEXT ---------------- */
  {
    id: "text-gradient",
    name: "Animated Gradient Text",
    category: "Text",
    description:
      "Bold heading text filled with a flowing five-color gradient that scrolls continuously.",
    html: `<h2 class="fx-text-gradient">Living Colors</h2>`,
    css: `.fx-text-gradient {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(90deg, #f43f5e, #f59e0b, #10b981, #6366f1, #f43f5e);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: fx-gradient-flow 4s linear infinite;
}
@keyframes fx-gradient-flow {
  to { background-position: 200% center; }
}`,
  },
  {
    id: "text-glitch",
    name: "Glitch Text",
    category: "Text",
    description:
      "Cyberpunk-style distorted text with two clip-pathed colored ghosts that shift independently.",
    html: `<h2 class="fx-text-glitch" data-text="GLITCH">GLITCH</h2>`,
    css: `.fx-text-glitch {
  position: relative;
  font-size: 2.25rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.04em;
}
.fx-text-glitch::before,
.fx-text-glitch::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.fx-text-glitch::before {
  color: #ec4899;
  animation: fx-glitch-1 2.5s infinite linear alternate-reverse;
  clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
}
.fx-text-glitch::after {
  color: #22d3ee;
  animation: fx-glitch-2 1.8s infinite linear alternate-reverse;
  clip-path: polygon(0 60%, 100% 60%, 100% 100%, 0 100%);
}
@keyframes fx-glitch-1 {
  0%   { transform: translate(0); }
  20%  { transform: translate(-3px, 2px); }
  40%  { transform: translate(-2px, -2px); }
  60%  { transform: translate(3px, 1px); }
  80%  { transform: translate(2px, -1px); }
  100% { transform: translate(0); }
}
@keyframes fx-glitch-2 {
  0%   { transform: translate(0); }
  20%  { transform: translate(2px, -2px); }
  40%  { transform: translate(3px, 2px); }
  60%  { transform: translate(-2px, -1px); }
  80%  { transform: translate(-3px, 1px); }
  100% { transform: translate(0); }
}`,
    darkSurface: true,
  },
  {
    id: "text-typewriter",
    name: "Typewriter",
    category: "Text",
    description:
      "Mono-spaced text that types itself out character by character with a blinking caret, then re-types.",
    html: `<div class="fx-text-typewriter">console.log('hi');</div>`,
    css: `.fx-text-typewriter {
  font-family: monospace;
  font-size: 1.25rem;
  color: #10b981;
  overflow: hidden;
  white-space: nowrap;
  border-right: 3px solid #10b981;
  width: 0;
  animation: fx-type 4s steps(22, end) infinite alternate,
             fx-caret 0.7s step-end infinite;
}
@keyframes fx-type {
  0%        { width: 0; }
  40%, 60%  { width: 14ch; }
  100%      { width: 0; }
}
@keyframes fx-caret { 50% { border-color: transparent; } }`,
    darkSurface: true,
  },
  {
    id: "text-neon",
    name: "Neon Glow Text",
    category: "Text",
    description:
      "White text surrounded by layered cyan shadows that flicker like an old neon sign.",
    html: `<h2 class="fx-text-neon">NEON</h2>`,
    css: `.fx-text-neon {
  font-size: 2.25rem;
  font-weight: 800;
  color: #fff;
  text-shadow:
    0 0 5px #fff,
    0 0 10px #fff,
    0 0 20px #22d3ee,
    0 0 40px #22d3ee,
    0 0 80px #22d3ee;
  animation: fx-neon-flicker 3s infinite alternate;
}
@keyframes fx-neon-flicker {
  0%, 18%, 22%, 25%, 53%, 57%, 100% {
    text-shadow:
      0 0 5px #fff, 0 0 10px #fff,
      0 0 20px #22d3ee, 0 0 40px #22d3ee, 0 0 80px #22d3ee;
  }
  20%, 24%, 55% { text-shadow: none; }
}`,
    darkSurface: true,
  },
  {
    id: "text-shimmer",
    name: "Shimmer Text",
    category: "Text",
    description:
      "Subtle slate text with a bright gold highlight band that sweeps across continuously.",
    html: `<h2 class="fx-text-shimmer">Loading gold…</h2>`,
    css: `.fx-text-shimmer {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(90deg, #475569 0%, #475569 40%, #fbbf24 50%, #475569 60%, #475569 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: fx-text-shimmer 2.5s linear infinite;
}
@keyframes fx-text-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`,
  },

  /* ---------------- BACKGROUNDS ---------------- */
  {
    id: "bg-gradient",
    name: "Animated Gradient",
    category: "Backgrounds",
    description:
      "A four-color gradient that slowly pans its position to create a continuously morphing backdrop.",
    html: `<div class="fx-bg-gradient"></div>`,
    css: `.fx-bg-gradient {
  width: 100%;
  height: 100%;
  min-height: 180px;
  border-radius: 0.75rem;
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: fx-bg-gradient 14s ease infinite;
}
@keyframes fx-bg-gradient {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`,
    previewClass: "p-0",
  },
  {
    id: "bg-orbs",
    name: "Floating Orbs",
    category: "Backgrounds",
    description:
      "Three blurred colored orbs drifting on a dark surface — great for hero section backdrops.",
    html: `<div class="fx-bg-orbs"><span></span></div>`,
    css: `.fx-bg-orbs {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 180px;
  border-radius: 0.75rem;
  background: #0f172a;
  overflow: hidden;
}
.fx-bg-orbs::before,
.fx-bg-orbs::after,
.fx-bg-orbs span {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(8px);
  opacity: 0.7;
}
.fx-bg-orbs::before {
  width: 90px; height: 90px;
  background: #f43f5e;
  top: 20%; left: 15%;
  animation: fx-float 8s ease-in-out infinite;
}
.fx-bg-orbs::after {
  width: 70px; height: 70px;
  background: #22d3ee;
  top: 50%; right: 20%;
  animation: fx-float 11s ease-in-out infinite reverse;
}
.fx-bg-orbs span {
  width: 60px; height: 60px;
  background: #f59e0b;
  bottom: 15%; left: 50%;
  animation: fx-float 9s ease-in-out 1s infinite;
}
@keyframes fx-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(20px, -25px) scale(1.1); }
  66%      { transform: translate(-15px, 15px) scale(0.95); }
}`,
    previewClass: "p-0",
  },
  {
    id: "bg-grid",
    name: "Animated Grid",
    category: "Backgrounds",
    description:
      "A retro-tech glowing grid that pans diagonally over a radial vignette — Tron meets synthwave.",
    html: `<div class="fx-bg-grid"></div>`,
    css: `.fx-bg-grid {
  width: 100%;
  height: 100%;
  min-height: 180px;
  border-radius: 0.75rem;
  background:
    linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px),
    radial-gradient(circle at center, #1e1b4b 0%, #0b1020 100%);
  background-size: 32px 32px, 32px 32px, 100% 100%;
  animation: fx-grid-pan 8s linear infinite;
}
@keyframes fx-grid-pan {
  0%   { background-position: 0 0, 0 0, 0 0; }
  100% { background-position: 32px 32px, 32px 32px, 0 0; }
}`,
    previewClass: "p-0",
  },
  {
    id: "bg-mesh",
    name: "Mesh Gradient",
    category: "Backgrounds",
    description:
      "A multi-point radial gradient mesh that gently shifts position, producing a soft aurora of color.",
    html: `<div class="fx-bg-mesh"></div>`,
    css: `.fx-bg-mesh {
  width: 100%;
  height: 100%;
  min-height: 180px;
  border-radius: 0.75rem;
  background-color: #0f172a;
  background-image:
    radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.7) 0px, transparent 50%),
    radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 0.7) 0px, transparent 50%),
    radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 0.7) 0px, transparent 50%),
    radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 0.7) 0px, transparent 50%),
    radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 0.7) 0px, transparent 50%),
    radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 0.7) 0px, transparent 50%),
    radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 0.7) 0px, transparent 50%);
  background-size: 200% 200%;
  animation: fx-mesh-shift 12s ease-in-out infinite;
}
@keyframes fx-mesh-shift {
  0%, 100% { background-position: 0% 0%; }
  50%      { background-position: 100% 100%; }
}`,
    previewClass: "p-0",
  },

  /* ---------------- INPUTS & HOVER ---------------- */
  {
    id: "input-float",
    name: "Floating Label Input",
    category: "Inputs & Hover",
    description:
      "A label that starts centered and gracefully floats up to the corner when the field is focused or filled.",
    html: `<div class="fx-input-float">
  <input type="text" placeholder=" " id="fx-input-float-field" />
  <label for="fx-input-float-field">Your email</label>
</div>`,
    css: `.fx-input-float {
  position: relative;
  width: 100%;
  max-width: 260px;
}
.fx-input-float input {
  width: 100%;
  padding: 1.1rem 0.75rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  background: transparent;
  color: inherit;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.25s ease;
}
.fx-input-float input:focus { border-color: #10b981; }
.fx-input-float label {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}
.fx-input-float input:focus + label,
.fx-input-float input:not(:placeholder-shown) + label {
  top: 0.25rem;
  transform: translateY(0);
  font-size: 0.72rem;
  color: #10b981;
}`,
  },
  {
    id: "input-underline",
    name: "Underline Grow Input",
    category: "Inputs & Hover",
    description:
      "Minimalist input whose bottom border grows in from the left on focus for an elegant material reveal.",
    html: `<div class="fx-input-underline">
  <input type="text" placeholder="Search…" />
</div>`,
    css: `.fx-input-underline {
  position: relative;
  width: 100%;
  max-width: 260px;
}
.fx-input-underline input {
  width: 100%;
  padding: 0.6rem 0.25rem;
  border: none;
  border-bottom: 2px solid #cbd5e1;
  background: transparent;
  color: inherit;
  font-size: 1rem;
  outline: none;
}
.fx-input-underline::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background: #6366f1;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s ease;
}
.fx-input-underline:focus-within::after { transform: scaleX(1); }`,
  },
  {
    id: "hover-zoom",
    name: "Image Zoom Hover",
    category: "Inputs & Hover",
    description:
      "A framed visual that smoothly zooms in on hover while the overlay text stays sharp — common in image galleries.",
    html: `<div class="fx-hover-zoom">
  <div class="fx-hover-zoom-bg"></div>
  <div class="fx-hover-zoom-label">Explore</div>
</div>`,
    css: `.fx-hover-zoom {
  position: relative;
  width: 220px;
  height: 150px;
  border-radius: 0.75rem;
  overflow: hidden;
  cursor: pointer;
}
.fx-hover-zoom-bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(99, 102, 241, 0.7), rgba(236, 72, 153, 0.7)),
    repeating-linear-gradient(45deg, #1e293b 0 10px, #334155 10px 20px);
  transition: transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.fx-hover-zoom:hover .fx-hover-zoom-bg { transform: scale(1.18); }
.fx-hover-zoom-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  z-index: 1;
}`,
  },
  {
    id: "link-underline",
    name: "Underline Reveal Link",
    category: "Inputs & Hover",
    description:
      "A link whose underline wipes in from left to right on hover and wipes out the same way on leave.",
    html: `<a class="fx-link-underline">Read the docs →</a>`,
    css: `.fx-link-underline {
  position: relative;
  font-size: 1.05rem;
  font-weight: 600;
  color: #f59e0b;
  text-decoration: none;
  cursor: pointer;
  padding-bottom: 4px;
}
.fx-link-underline::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background: #f59e0b;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.4s ease;
}
.fx-link-underline:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}`,
  },
  {
    id: "hover-icon",
    name: "Icon Bounce Hover",
    category: "Inputs & Hover",
    description:
      "A pill chip whose arrow shoots up and to the right on hover, while the surface fills with color.",
    html: `<a class="fx-hover-icon">
  Learn more
  <span class="fx-hover-icon-arrow">→</span>
</a>`,
    css: `.fx-hover-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1.25rem;
  border-radius: 999px;
  background: #f3f4f6;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease, color 0.3s ease;
}
.fx-hover-icon .fx-hover-icon-arrow {
  display: inline-block;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.fx-hover-icon:hover {
  background: #10b981;
  color: #fff;
}
.fx-hover-icon:hover .fx-hover-icon-arrow {
  transform: translateX(6px) rotate(-45deg);
}`,
  },

  /* ============ ROUND 2 — BONUS EFFECTS ============ */

  /* ---- Buttons ---- */
  {
    id: "btn-liquid",
    name: "Liquid Wave Button",
    category: "Buttons",
    description:
      "A teal wave rises from the bottom and floods the button on hover, with the text color flipping to white.",
    html: `<button class="fx-btn-liquid">Dive in</button>`,
    css: `.fx-btn-liquid {
  position: relative;
  isolation: isolate;
  padding: 0.85rem 2rem;
  border: none;
  border-radius: 0.625rem;
  background: transparent;
  color: #0f766e;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  overflow: hidden;
  transition: color 0.4s ease 0.1s;
}
.fx-btn-liquid::before {
  content: '';
  position: absolute;
  left: 0;
  bottom: -100%;
  width: 100%;
  height: 200%;
  background: #14b8a6;
  border-radius: 50% 50% 0 0;
  transition: bottom 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: -1;
}
.fx-btn-liquid:hover { color: #fff; }
.fx-btn-liquid:hover::before { bottom: 0; border-radius: 0; }`,
  },
  {
    id: "btn-beam",
    name: "Border Beam Button",
    category: "Buttons",
    description:
      "A dark button surrounded by a rotating conic-gradient beam that traces its border like a comet.",
    html: `<button class="fx-btn-beam">Launch</button>`,
    css: `.fx-btn-beam {
  position: relative;
  padding: 0.8rem 1.9rem;
  border: none;
  border-radius: 0.625rem;
  background: #0f172a;
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  isolation: isolate;
  overflow: hidden;
}
.fx-btn-beam::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: conic-gradient(from 0deg, transparent 0%, #22d3ee 12%, #818cf8 25%, transparent 40%);
  animation: fx-beam-spin 3s linear infinite;
  z-index: -2;
}
.fx-btn-beam::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: calc(0.625rem - 2px);
  background: #0f172a;
  z-index: -1;
}
@keyframes fx-beam-spin { to { transform: rotate(360deg); } }`,
    darkSurface: true,
  },
  {
    id: "btn-glow-trail",
    name: "Glow Trail Button",
    category: "Buttons",
    description:
      "A deep-indigo button that ignites layered indigo glows on hover for an electric, almost magnetic presence.",
    html: `<button class="fx-btn-glow-trail">Engage</button>`,
    css: `.fx-btn-glow-trail {
  position: relative;
  padding: 0.8rem 1.9rem;
  border: 1px solid #6366f1;
  border-radius: 0.625rem;
  background: #1e1b4b;
  color: #c7d2fe;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: color 0.25s ease, border-color 0.25s ease;
}
.fx-btn-glow-trail:hover {
  color: #fff;
  border-color: #a5b4fc;
  box-shadow:
    0 0 12px rgba(99, 102, 241, 0.6),
    0 0 24px rgba(99, 102, 241, 0.35),
    inset 0 0 12px rgba(99, 102, 241, 0.25);
}`,
    darkSurface: true,
  },
  {
    id: "btn-icon-slide",
    name: "Icon Slide Button",
    category: "Buttons",
    description:
      "A warm amber button whose trailing arrow nudges right on hover, suggesting forward motion.",
    html: `<button class="fx-btn-icon-slide">
  Continue
  <span class="fx-btn-icon-slide-icon">→</span>
</button>`,
    css: `.fx-btn-icon-slide {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1.6rem;
  border: none;
  border-radius: 0.625rem;
  background: #f59e0b;
  color: #1f2937;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  overflow: hidden;
  transition: background 0.25s ease;
}
.fx-btn-icon-slide-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.fx-btn-icon-slide:hover .fx-btn-icon-slide-icon {
  transform: translateX(4px);
}
.fx-btn-icon-slide:hover { background: #fbbf24; }`,
  },

  /* ---- Loaders ---- */
  {
    id: "loader-bar",
    name: "Indeterminate Bar",
    category: "Loaders",
    description:
      "A slim pill track with a colored segment that slides endlessly from left to right — perfect for progress feedback.",
    html: `<div class="fx-loader-bar"></div>`,
    css: `.fx-loader-bar {
  position: relative;
  width: 220px;
  height: 6px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.18);
  overflow: hidden;
}
.fx-loader-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 40%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #6366f1, #ec4899);
  animation: fx-bar-slide 1.4s ease-in-out infinite;
}
@keyframes fx-bar-slide {
  0%   { left: -40%; }
  100% { left: 100%; }
}`,
  },
  {
    id: "loader-orbit",
    name: "Orbit Loader",
    category: "Loaders",
    description:
      "Three colored dots circle a central point at staggered phases, like electrons tracing an orbit.",
    html: `<div class="fx-loader-orbit"><span></span><span></span><span></span></div>`,
    css: `.fx-loader-orbit {
  position: relative;
  width: 56px;
  height: 56px;
}
.fx-loader-orbit span {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  margin: -5px;
  border-radius: 50%;
  background: #f43f5e;
  transform-origin: 5px 5px;
  animation: fx-orbit-rot 1.6s linear infinite;
}
.fx-loader-orbit span:nth-child(1) { background: #6366f1; animation-delay: 0s; }
.fx-loader-orbit span:nth-child(2) { background: #f59e0b; animation-delay: -0.53s; }
.fx-loader-orbit span:nth-child(3) { background: #10b981; animation-delay: -1.06s; }
@keyframes fx-orbit-rot {
  0%   { transform: rotate(0deg) translateX(22px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(22px) rotate(-360deg); }
}`,
  },
  {
    id: "loader-wave",
    name: "Liquid Wave Loader",
    category: "Loaders",
    description:
      "Two counter-rotating waves slosh inside a circular vessel, creating a hypnotic liquid-fill illusion.",
    html: `<div class="fx-loader-wave"></div>`,
    css: `.fx-loader-wave {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(34, 211, 238, 0.25);
  overflow: hidden;
  background: transparent;
}
.fx-loader-wave::before,
.fx-loader-wave::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -10%;
  width: 200%;
  height: 200%;
  background: rgba(34, 211, 238, 0.55);
  border-radius: 42%;
  transform: translateX(-50%) rotate(0deg);
  animation: fx-wave 4s linear infinite;
}
.fx-loader-wave::after {
  background: rgba(34, 211, 238, 0.35);
  border-radius: 46%;
  animation-duration: 6s;
  animation-direction: reverse;
}
@keyframes fx-wave {
  0%   { transform: translateX(-50%) rotate(0deg); }
  100% { transform: translateX(-50%) rotate(360deg); }
}`,
    darkSurface: true,
  },

  /* ---- Cards ---- */
  {
    id: "card-grad-border",
    name: "Gradient Border Card",
    category: "Cards",
    description:
      "A dark card framed by an animated four-color gradient ring that continuously morphs via a mask trick.",
    html: `<div class="fx-card-grad-border">
  <h4 style="margin:0;font-size:1.05rem;font-weight:700;">Holographic</h4>
  <p style="margin:0.35rem 0 0;font-size:0.85rem;opacity:0.85;">Animated border ring</p>
</div>`,
    css: `.fx-card-grad-border {
  position: relative;
  width: 240px;
  padding: 1.5rem;
  border-radius: 0.875rem;
  background: #0f172a;
  color: #f1f5f9;
  isolation: isolate;
}
.fx-card-grad-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(135deg, #f43f5e, #f59e0b, #10b981, #6366f1);
  background-size: 300% 300%;
  animation: fx-grad-border 5s ease infinite;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  z-index: -1;
}
@keyframes fx-grad-border {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}`,
    darkSurface: true,
  },
  {
    id: "card-tilt",
    name: "3D Tilt Card",
    category: "Cards",
    description:
      "A violet gradient card that tilts in 3D space on hover, with title and subtitle lifted at different depths.",
    html: `<div class="fx-card-tilt">
  <h4 class="fx-card-tilt-title">Perspective</h4>
  <p class="fx-card-tilt-sub">Hover for parallax tilt</p>
</div>`,
    css: `.fx-card-tilt {
  width: 220px;
  padding: 1.5rem;
  border-radius: 0.875rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  box-shadow: 0 14px 30px -10px rgba(99, 102, 241, 0.55);
  transform-style: preserve-3d;
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease;
  cursor: pointer;
}
.fx-card-tilt:hover {
  transform: perspective(800px) rotateX(8deg) rotateY(-8deg) translateZ(8px);
  box-shadow: -10px 18px 36px -12px rgba(99, 102, 241, 0.65);
}
.fx-card-tilt-title {
  transform: translateZ(40px);
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}
.fx-card-tilt-sub {
  transform: translateZ(20px);
  margin: 0.35rem 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
}`,
  },
  {
    id: "card-glow",
    name: "Glow Pulse Card",
    category: "Cards",
    description:
      "An indigo card that breathes — its outer glow softly expands and contracts on a steady loop, calling attention without motion noise.",
    html: `<div class="fx-card-glow">
  <h4 style="margin:0;font-size:1.05rem;font-weight:700;">Breathing</h4>
  <p style="margin:0.35rem 0 0;font-size:0.85rem;opacity:0.85;">Always-on glow loop</p>
</div>`,
    css: `.fx-card-glow {
  position: relative;
  width: 220px;
  padding: 1.5rem;
  border-radius: 0.875rem;
  background: #1e1b4b;
  color: #e0e7ff;
  border: 1px solid rgba(99, 102, 241, 0.4);
  box-shadow: 0 0 0 rgba(99, 102, 241, 0);
  transition: box-shadow 0.4s ease, transform 0.4s ease;
  animation: fx-glow-pulse 2.6s ease-in-out infinite;
}
@keyframes fx-glow-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(99, 102, 241, 0.4), 0 0 20px rgba(99, 102, 241, 0.15); }
  50%      { box-shadow: 0 0 18px rgba(99, 102, 241, 0.8), 0 0 40px rgba(99, 102, 241, 0.4); }
}`,
    darkSurface: true,
  },

  /* ---- Text ---- */
  {
    id: "text-3d",
    name: "3D Layered Text",
    category: "Text",
    description:
      "Bold white text built up from six magenta shadow layers, creating a chunky retro 3D extrusion that lifts on hover.",
    html: `<h2 class="fx-text-3d">DEPTH</h2>`,
    css: `.fx-text-3d {
  font-size: 2.5rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.02em;
  text-shadow:
    1px 1px 0 #c026d3,
    2px 2px 0 #a21caf,
    3px 3px 0 #86198f,
    4px 4px 0 #701a75,
    5px 5px 0 #4a044e,
    6px 6px 8px rgba(0, 0, 0, 0.4);
  transition: transform 0.3s ease;
}
.fx-text-3d:hover { transform: translate(-2px, -2px); }`,
    darkSurface: true,
  },
  {
    id: "text-wave",
    name: "Wave Bounce Text",
    category: "Text",
    description:
      "Each letter bounces up and down with a staggered delay, producing a rolling wave across the word.",
    html: `<h2 class="fx-text-wave">
  <span style="animation-delay:0s">W</span><span style="animation-delay:.1s">a</span><span style="animation-delay:.2s">v</span><span style="animation-delay:.3s">e</span>
</h2>`,
    css: `.fx-text-wave {
  font-size: 2rem;
  font-weight: 800;
  color: #10b981;
  display: inline-flex;
}
.fx-text-wave span {
  display: inline-block;
  animation: fx-wave-bounce 1.6s ease-in-out infinite;
}
@keyframes fx-wave-bounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}`,
  },
  {
    id: "text-reveal",
    name: "Reveal Mask Text",
    category: "Text",
    description:
      "Text filled with a multi-color gradient that pans across the letters and pauses, then sweeps back to repeat.",
    html: `<h2 class="fx-text-reveal">REVEAL</h2>`,
    css: `.fx-text-reveal {
  position: relative;
  font-size: 2.5rem;
  font-weight: 800;
  color: transparent;
  background: linear-gradient(90deg, #f43f5e 0%, #f59e0b 50%, #10b981 100%);
  -webkit-background-clip: text;
  background-clip: text;
  background-size: 200% 100%;
  -webkit-text-fill-color: transparent;
  background-position: -200% 0;
  animation: fx-reveal-pan 3s ease-in-out infinite;
}
@keyframes fx-reveal-pan {
  0%        { background-position: -200% 0; }
  60%, 100% { background-position: 200% 0; }
}`,
  },

  /* ---- Backgrounds ---- */
  {
    id: "bg-aurora",
    name: "Aurora Background",
    category: "Backgrounds",
    description:
      "Two large blurred radial blobs drift independently across a near-black canvas, evoking northern lights.",
    html: `<div class="fx-bg-aurora"></div>`,
    css: `.fx-bg-aurora {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 180px;
  border-radius: 0.75rem;
  background: #020617;
  overflow: hidden;
}
.fx-bg-aurora::before,
.fx-bg-aurora::after {
  content: '';
  position: absolute;
  width: 60%;
  height: 80%;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.7;
}
.fx-bg-aurora::before {
  top: -20%;
  left: -10%;
  background: radial-gradient(circle, #22d3ee, transparent 70%);
  animation: fx-aurora-a 10s ease-in-out infinite alternate;
}
.fx-bg-aurora::after {
  bottom: -20%;
  right: -10%;
  background: radial-gradient(circle, #c026d3, transparent 70%);
  animation: fx-aurora-b 12s ease-in-out infinite alternate;
}
@keyframes fx-aurora-a {
  0%   { transform: translate(0, 0) scale(1); }
  100% { transform: translate(30%, 20%) scale(1.3); }
}
@keyframes fx-aurora-b {
  0%   { transform: translate(0, 0) scale(1.1); }
  100% { transform: translate(-25%, -15%) scale(0.9); }
}`,
    previewClass: "p-0",
  },
  {
    id: "bg-stars",
    name: "Starfield Background",
    category: "Backgrounds",
    description:
      "A repeating pattern of multi-color stars on a deep navy gradient that gently twinkles in opacity.",
    html: `<div class="fx-bg-stars"></div>`,
    css: `.fx-bg-stars {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 180px;
  border-radius: 0.75rem;
  background:
    radial-gradient(2px 2px at 20px 30px, #fff, transparent),
    radial-gradient(1px 1px at 80px 90px, #fff, transparent),
    radial-gradient(1.5px 1.5px at 140px 50px, #93c5fd, transparent),
    radial-gradient(1px 1px at 200px 120px, #fff, transparent),
    radial-gradient(2px 2px at 260px 30px, #fde68a, transparent),
    radial-gradient(1px 1px at 320px 100px, #fff, transparent),
    linear-gradient(180deg, #0b1020, #1e1b4b);
  background-repeat: repeat;
  background-size: 360px 180px, 360px 180px, 360px 180px, 360px 180px, 360px 180px, 360px 180px, 100% 100%;
  animation: fx-stars-twinkle 4s ease-in-out infinite alternate;
}
@keyframes fx-stars-twinkle {
  0%   { opacity: 0.7; }
  100% { opacity: 1; }
}`,
    previewClass: "p-0",
  },
  {
    id: "bg-conic",
    name: "Spinning Conic Gradient",
    category: "Backgrounds",
    description:
      "A saturated conic wheel of seven colors that rotates continuously — striking as a hero panel backdrop.",
    html: `<div class="fx-bg-conic"></div>`,
    css: `.fx-bg-conic {
  width: 100%;
  height: 100%;
  min-height: 180px;
  border-radius: 0.75rem;
  background: conic-gradient(from 0deg at 50% 50%,
    #f43f5e, #f59e0b, #facc15, #10b981, #06b6d4, #6366f1, #ec4899, #f43f5e);
  animation: fx-conic-rot 8s linear infinite;
  filter: saturate(1.1);
}
@keyframes fx-conic-rot { to { transform: rotate(360deg); } }`,
    previewClass: "p-0",
  },

  /* ---- Inputs & Hover ---- */
  {
    id: "toggle-ios",
    name: "iOS Toggle Switch",
    category: "Inputs & Hover",
    description:
      "A pure-CSS iOS-style toggle with a hidden checkbox, smooth slide, and accessible focus ring.",
    html: `<label class="fx-toggle">
  <input type="checkbox" />
  <span class="fx-toggle-slider"></span>
</label>`,
    css: `.fx-toggle {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 30px;
}
.fx-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}
.fx-toggle-slider {
  position: absolute;
  inset: 0;
  cursor: pointer;
  background: #cbd5e1;
  border-radius: 999px;
  transition: background 0.3s ease;
}
.fx-toggle-slider::before {
  content: '';
  position: absolute;
  height: 22px;
  width: 22px;
  left: 4px;
  bottom: 4px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}
.fx-toggle input:checked + .fx-toggle-slider { background: #10b981; }
.fx-toggle input:checked + .fx-toggle-slider::before { transform: translateX(22px); }
.fx-toggle input:focus-visible + .fx-toggle-slider {
  outline: 2px solid #10b981;
  outline-offset: 2px;
}`,
  },
  {
    id: "check-custom",
    name: "Custom Checkbox",
    category: "Inputs & Hover",
    description:
      "A native checkbox restyled with appearance:none — fills with indigo and draws an animated checkmark when checked.",
    html: `<label class="fx-check">
  <input type="checkbox" />
  Accept terms
</label>`,
    css: `.fx-check {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  user-select: none;
  font-size: 0.95rem;
  color: #475569;
}
.fx-check input {
  appearance: none;
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border: 2px solid #cbd5e1;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.fx-check input:checked {
  background: #6366f1;
  border-color: #6366f1;
}
.fx-check input:checked::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 11px;
  border: solid #fff;
  border-width: 0 2.5px 2.5px 0;
  transform: rotate(45deg);
}`,
  },
  {
    id: "tooltip-hover",
    name: "Tooltip on Hover",
    category: "Inputs & Hover",
    description:
      "A dark chip that reveals a small floating tooltip with an arrow above it on hover, using only pseudo-elements.",
    html: `<span class="fx-tooltip" data-tip="Helpful tip!">Hover me</span>`,
    css: `.fx-tooltip {
  position: relative;
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: #1e293b;
  color: #f1f5f9;
  font-size: 0.9rem;
  cursor: help;
}
.fx-tooltip::after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(6px);
  background: #0f172a;
  color: #f8fafc;
  padding: 0.4rem 0.7rem;
  border-radius: 0.375rem;
  font-size: 0.78rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}
.fx-tooltip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(6px);
  border: 5px solid transparent;
  border-top-color: #0f172a;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fx-tooltip:hover::after,
.fx-tooltip:hover::before {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}`,
  },

  /* ============ ROUND 3 — NAVIGATION, DIVIDERS, BADGES, BONUS ============ */

  /* ---- Navigation & Menus ---- */
  {
    id: "nav-hamburger",
    name: "Animated Hamburger",
    category: "Navigation & Menus",
    description:
      "Pure-CSS hamburger menu using the checkbox hack — three lines morph into an X with no JavaScript.",
    html: `<label class="fx-hamburger">
  <input type="checkbox" />
  <div class="fx-hamburger-lines">
    <span></span><span></span><span></span>
  </div>
</label>`,
    css: `.fx-hamburger { display: inline-block; cursor: pointer; }
.fx-hamburger input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.fx-hamburger-lines {
  position: relative;
  width: 36px;
  height: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.fx-hamburger-lines span {
  display: block;
  height: 3px;
  width: 100%;
  background: #f59e0b;
  border-radius: 2px;
  transition: transform 0.3s ease, opacity 0.2s ease;
  transform-origin: center;
}
.fx-hamburger input:checked + .fx-hamburger-lines span:nth-child(1) {
  transform: translateY(10.5px) rotate(45deg);
}
.fx-hamburger input:checked + .fx-hamburger-lines span:nth-child(2) {
  opacity: 0;
}
.fx-hamburger input:checked + .fx-hamburger-lines span:nth-child(3) {
  transform: translateY(-10.5px) rotate(-45deg);
}`,
  },
  {
    id: "nav-pill-tabs",
    name: "Pill Tab Switcher",
    category: "Navigation & Menus",
    description:
      "A segmented pill tab control with a floating indigo indicator that snaps to the selected option via :has().",
    html: `<div class="fx-tabs-pill">
  <label><input type="radio" name="fx-pill" checked />Day</label>
  <label><input type="radio" name="fx-pill" />Week</label>
  <label><input type="radio" name="fx-pill" />Month</label>
</div>`,
    css: `.fx-tabs-pill {
  display: inline-flex;
  padding: 4px;
  border-radius: 999px;
  background: #e2e8f0;
}
.fx-tabs-pill label {
  position: relative;
  padding: 0.45rem 1.1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-radius: 999px;
  transition: color 0.25s ease;
  z-index: 1;
}
.fx-tabs-pill input { display: none; }
.fx-tabs-pill label:has(input:checked) { color: #fff; }
.fx-tabs-pill label:has(input:checked)::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: #6366f1;
  z-index: -1;
  box-shadow: 0 4px 10px -2px rgba(99, 102, 241, 0.5);
}`,
    previewClass: "bg-[#e2e8f0]",
  },
  {
    id: "nav-dropdown",
    name: "Hover Dropdown Menu",
    category: "Navigation & Menus",
    description:
      "A native <details>-based dropdown that animates open, with arrow rotation and hover-highlighted menu items.",
    html: `<details class="fx-dropdown">
  <summary class="fx-dropdown-summary">Account</summary>
  <ul class="fx-dropdown-menu">
    <li><a href="#">Profile</a></li>
    <li><a href="#">Settings</a></li>
    <li><a href="#">Sign out</a></li>
  </ul>
</details>`,
    css: `.fx-dropdown {
  position: relative;
  display: inline-block;
}
.fx-dropdown-summary {
  list-style: none;
  cursor: pointer;
  padding: 0.55rem 1.1rem;
  border-radius: 0.5rem;
  background: #1e293b;
  color: #f1f5f9;
  font-size: 0.9rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.fx-dropdown-summary::-webkit-details-marker { display: none; }
.fx-dropdown-summary::after {
  content: '▾';
  font-size: 0.75rem;
  transition: transform 0.25s ease;
}
.fx-dropdown[open] .fx-dropdown-summary::after { transform: rotate(180deg); }
.fx-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 160px;
  padding: 0.35rem;
  border-radius: 0.5rem;
  background: #0f172a;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  list-style: none;
  margin: 0;
  animation: fx-dropdown-in 0.2s ease;
}
@keyframes fx-dropdown-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fx-dropdown-menu li a {
  display: block;
  padding: 0.45rem 0.7rem;
  border-radius: 0.375rem;
  color: #cbd5e1;
  font-size: 0.85rem;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}
.fx-dropdown-menu li a:hover {
  background: rgba(99, 102, 241, 0.18);
  color: #fff;
}`,
    darkSurface: true,
  },
  {
    id: "nav-breadcrumb",
    name: "Breadcrumb Trail",
    category: "Navigation & Menus",
    description:
      "A breadcrumb trail with chevron separators that nudge forward on hover, and a bolded current page.",
    html: `<ul class="fx-breadcrumb">
  <li><a href="#">Home</a></li>
  <li><a href="#">Library</a></li>
  <li>Effects</li>
</ul>`,
    css: `.fx-breadcrumb {
  display: inline-flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.85rem;
}
.fx-breadcrumb li {
  display: inline-flex;
  align-items: center;
  color: #64748b;
}
.fx-breadcrumb li:not(:last-child)::after {
  content: '';
  display: inline-block;
  width: 7px;
  height: 7px;
  border-top: 2px solid #cbd5e1;
  border-right: 2px solid #cbd5e1;
  transform: rotate(45deg);
  margin: 0 0.6rem;
  transition: transform 0.25s ease;
}
.fx-breadcrumb li:hover:not(:last-child)::after {
  transform: rotate(45deg) translate(2px, -2px);
}
.fx-breadcrumb li a {
  color: #475569;
  text-decoration: none;
  transition: color 0.2s ease;
}
.fx-breadcrumb li a:hover { color: #6366f1; }
.fx-breadcrumb li:last-child { color: #0f172a; font-weight: 600; }
.dark .fx-breadcrumb li:last-child { color: #f1f5f9; }`,
  },

  /* ---- Dividers & Separators ---- */
  {
    id: "divider-gradient",
    name: "Gradient Divider",
    category: "Dividers & Separators",
    description:
      "A horizontal hairline that fades in from both ends with an indigo-to-pink gradient — elegant for section breaks.",
    html: `<div class="fx-divider-gradient-wrap"><p class="fx-pre">Section One</p><hr class="fx-divider-gradient" /><p class="fx-post">Section Two</p></div>`,
    css: `.fx-divider-gradient-wrap {
  display: flex; flex-direction: column; gap: 0.6rem;
  width: 100%; max-width: 280px;
  color: #cbd5e1; font-family: system-ui, sans-serif;
}
.fx-divider-gradient-wrap .fx-pre {
  margin: 0; font-size: 0.85rem; font-weight: 700; color: #f1f5f9;
}
.fx-divider-gradient-wrap .fx-post {
  margin: 0; font-size: 0.78rem; color: #94a3b8;
}
.fx-divider-gradient {
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #6366f1, #ec4899, transparent);
  border: none;
  border-radius: 2px;
}`,
  },
  {
    id: "divider-wave",
    name: "Wavy Dotted Divider",
    category: "Dividers & Separators",
    description:
      "A row of evenly-spaced amber dots forming a soft wavy line — playful and lightweight.",
    html: `<div class="fx-divider-wave-wrap"><span class="fx-wlbl">Notes</span><div class="fx-divider-wave"></div><span class="fx-wmeta">end</span></div>`,
    css: `.fx-divider-wave-wrap {
  display: flex; align-items: center; gap: 0.75rem;
  width: 100%; max-width: 280px;
  color: #cbd5e1; font-family: system-ui, sans-serif;
}
.fx-divider-wave-wrap .fx-wlbl {
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  color: #f59e0b; white-space: nowrap;
}
.fx-divider-wave-wrap .fx-wmeta {
  font-size: 0.7rem; color: #64748b; white-space: nowrap;
}
.fx-divider-wave {
  flex: 1; height: 14px;
  background-image: radial-gradient(circle at 7px 7px, #f59e0b 1.5px, transparent 2px);
  background-size: 14px 14px;
  background-repeat: repeat-x;
  background-position: 0 50%;
}`,
  },
  {
    id: "divider-dashes",
    name: "Animated Marching Dashes",
    category: "Dividers & Separators",
    description:
      "A green dashed line whose segments appear to march continuously to the right via background-position animation.",
    html: `<div class="fx-divider-dashes-wrap"><span class="fx-dlbl">Loading</span><div class="fx-divider-dashes"></div><span class="fx-dmeta">streaming</span></div>`,
    css: `.fx-divider-dashes-wrap {
  display: flex; align-items: center; gap: 0.75rem;
  width: 100%; max-width: 280px;
  color: #cbd5e1; font-family: system-ui, sans-serif;
}
.fx-divider-dashes-wrap .fx-dlbl {
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  color: #10b981; white-space: nowrap;
}
.fx-divider-dashes-wrap .fx-dmeta {
  font-size: 0.7rem; color: #64748b; white-space: nowrap;
}
.fx-divider-dashes {
  flex: 1; height: 2px;
  background-image: linear-gradient(90deg, #10b981 50%, transparent 50%);
  background-size: 14px 2px;
  background-repeat: repeat-x;
  animation: fx-dash-march 1s linear infinite;
}
@keyframes fx-dash-march {
  to { background-position: 28px 0; }
}`,
  },

  /* ---- Badges & Tags ---- */
  {
    id: "badge-pulse",
    name: "Notification Pulse Badge",
    category: "Badges & Tags",
    description:
      "A pink badge with a cyan corner dot that emits an expanding ring continuously, signaling a live notification.",
    html: `<span class="fx-badge-pulse">New</span>`,
    css: `.fx-badge-pulse {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 1rem;
  background: #ec4899;
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  border-radius: 0.5rem;
}
.fx-badge-pulse::after {
  content: '';
  position: absolute;
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #22d3ee;
  border: 2px solid #fff;
  animation: fx-badge-ping 1.6s ease-out infinite;
}
@keyframes fx-badge-ping {
  0%   { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7); }
  70%  { box-shadow: 0 0 0 8px rgba(34, 211, 238, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }
}`,
  },
  {
    id: "tag-folded",
    name: "Folded Corner Tag",
    category: "Badges & Tags",
    description:
      "An amber price tag with a notched right edge using clip-path — perfect for discount or sale labels.",
    html: `<span class="fx-tag-folded">-25%</span>`,
    css: `.fx-tag-folded {
  position: relative;
  display: inline-block;
  padding: 0.4rem 1.1rem 0.4rem 0.85rem;
  background: #f59e0b;
  color: #1f2937;
  font-weight: 700;
  font-size: 0.85rem;
  border-radius: 4px 0 0 4px;
  clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%);
}`,
  },
  {
    id: "badge-status-dot",
    name: "Status Dot Indicator",
    category: "Badges & Tags",
    description:
      "A small green dot with an outward-pulsing ring paired with a status label — common in dashboards for 'online' state.",
    html: `<span class="fx-status-dot">Operational</span>`,
    css: `.fx-status-dot {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #475569;
}
.fx-status-dot::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: fx-status-pulse 2s ease-out infinite;
}
@keyframes fx-status-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70%  { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}`,
  },

  /* ---- Bonus: more buttons, loaders, text, avatars ---- */
  {
    id: "btn-shine",
    name: "Shine Sweep Button",
    category: "Buttons",
    description:
      "A dark button with a skewed highlight band that sweeps across its surface on hover, like light catching glass.",
    html: `<button class="fx-btn-shine">Continue</button>`,
    css: `.fx-btn-shine {
  position: relative;
  padding: 0.8rem 1.9rem;
  border: none;
  border-radius: 0.625rem;
  background: #0f172a;
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  overflow: hidden;
  isolation: isolate;
}
.fx-btn-shine::before {
  content: '';
  position: absolute;
  top: 0;
  left: -80%;
  width: 50%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  transform: skewX(-20deg);
  transition: left 0.6s ease;
  z-index: 1;
}
.fx-btn-shine:hover::before { left: 130%; }`,
    darkSurface: true,
  },
  {
    id: "loader-hex",
    name: "Hexagon Flip Loader",
    category: "Loaders",
    description:
      "A purple hexagon (via clip-path) that flips on its Y axis while bouncing — geometric and modern.",
    html: `<div class="fx-loader-hex"></div>`,
    css: `.fx-loader-hex {
  width: 40px;
  height: 46px;
  background: #8b5cf6;
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  animation: fx-hex-flip 1.4s ease-in-out infinite;
}
@keyframes fx-hex-flip {
  0%, 100% { transform: rotateY(0deg) translateY(0); }
  50%      { transform: rotateY(180deg) translateY(-8px); }
}`,
  },
  {
    id: "loader-ring-grad",
    name: "Gradient Ring Loader",
    category: "Loaders",
    description:
      "A conic gradient masked into a thin ring that rotates — a more colorful alternative to the classic spinner.",
    html: `<div class="fx-loader-ring-grad"></div>`,
    css: `.fx-loader-ring-grad {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #f43f5e, #f59e0b, #10b981, #6366f1, #f43f5e);
  -webkit-mask: radial-gradient(circle at center, transparent 58%, #000 60%);
          mask: radial-gradient(circle at center, transparent 58%, #000 60%);
  animation: fx-ring-grad-spin 1.1s linear infinite;
}
@keyframes fx-ring-grad-spin { to { transform: rotate(360deg); } }`,
  },
  {
    id: "text-clip",
    name: "Gradient Drop-Shadow Text",
    category: "Text",
    description:
      "Bold text filled with an indigo-to-pink gradient, lifted off the page by a soft colored drop-shadow.",
    html: `<h2 class="fx-text-clip">AURORA</h2>`,
    css: `.fx-text-clip {
  position: relative;
  font-size: 2.5rem;
  font-weight: 900;
  color: transparent;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.02em;
  filter: drop-shadow(0 4px 8px rgba(99, 102, 241, 0.35));
}`,
  },
  {
    id: "hover-avatar-stack",
    name: "Avatar Stack",
    category: "Inputs & Hover",
    description:
      "Four overlapping circular avatars that fan out horizontally on hover, with each one rising to the top in turn.",
    html: `<div class="fx-avatar-stack">
  <span>AB</span><span>CD</span><span>EF</span><span>+5</span>
</div>`,
    css: `.fx-avatar-stack {
  display: inline-flex;
  align-items: center;
}
.fx-avatar-stack span {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: linear-gradient(135deg, #f43f5e, #f59e0b);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: -12px;
  transition: transform 0.25s ease, z-index 0s;
  position: relative;
  z-index: 1;
}
.fx-avatar-stack span:first-child { margin-left: 0; }
.fx-avatar-stack span:nth-child(2) { background: linear-gradient(135deg, #6366f1, #06b6d4); z-index: 2; }
.fx-avatar-stack span:nth-child(3) { background: linear-gradient(135deg, #10b981, #84cc16); z-index: 3; }
.fx-avatar-stack span:nth-child(4) { background: linear-gradient(135deg, #ec4899, #8b5cf6); z-index: 4; }
.fx-avatar-stack:hover span { transform: translateX(4px); z-index: 5; }`,
  },
];
