// scripts/generate-effects-v14.mjs
//
// Fourteenth wave: 138 new designs, one entry each, across ALL 32 effect
// categories. Same one-per-design discipline as v11, v12 and v13 — no
// colorway, size or speed stamping; the Customize panel re-tokens
// anything.
//
// THE SEAL
//
// Six categories are marked shape-exhausted by
// scripts/check-catalog-focus.mts: Dividers & Separators, Badges & Tags,
// Skeletons & Shimmers, Borders & Outlines, Progress & Meters and Scroll
// & Sticky. v13 was first built to respect that and covered only 26
// categories; the owner overruled it and asked for every category. That
// call stands, so this wave covers all 32 from the outset — parts g and h
// carry the six — and the focus baseline is re-accepted with `--update`.
// The SEALED prose in that script is still accurate about how much harder
// the search is in those six; it is a warning, not a veto.
//
// WEIGHTING
//
// The five categories the shape-budget note calls genuinely short of
// shapes — Charts & Data, Timelines & Steps, Tables & Data Grids, Forms
// & Validation, Micro-interactions — take six designs each. The other 27
// take four. 27x4 + 5x6 = 138.
//
// Per-part group accounting (which shape-budget group each module was
// working in, so the next wave does not have to re-derive it):
//
//   a  Buttons, Loaders, Cards, Text .......................... thinning
//   b  Backgrounds, Inputs & Hover, Nav & Menus, Toggles ....... thinning
//   c  Tooltips, Entrance, Avatars & Images, Modals ............ thinning
//   d  Alerts & Toasts, Accordions & Tabs, 3D, Glow & Neon ..... thinning
//   e  Patterns, Masks, Sliders & Carousels, Icons & Shapes .... thinning
//   f  Charts, Timelines, Tables, Forms ................ short of shapes
//   g  Micro-interactions (short) + Filters, Dividers*, Badges*
//   h  Skeletons*, Borders*, Progress*, Scroll & Sticky* ..... exhausted
//                                                    (* sealed category)
//
// VERIFICATION
//
// Every part was rendered through scripts/shot-effects.mjs — a Playwright
// contact sheet that puts each effect in a 300x180 dark cell, takes a
// rest and a hover frame, and flags roots that are under 4px, absolutely
// positioned, transparent, or overflowing. That harness was rebuilt for
// this wave and committed this time; v13's was thrown away and had to be
// written again from the notes. audit-effects.mjs and audit-motion-guard
// both report zero issues on effects the render pass rejects, so the
// render pass is the one that matters.
//
// Split into eight sibling modules (a–h) so each block of categories
// could be written and checked on its own; this file only sequences
// them. Same ctx as every other wave, same assembly constraints: roots
// visible at rest, no position:absolute on a root, infinite keyframes
// resting sensibly at their 100% stop under the reduced-motion guard,
// everything fitting a ~300x180 dark preview.

import { generateV14A } from './generate-effects-v14-a.mjs'
import { generateV14B } from './generate-effects-v14-b.mjs'
import { generateV14C } from './generate-effects-v14-c.mjs'
import { generateV14D } from './generate-effects-v14-d.mjs'
import { generateV14E } from './generate-effects-v14-e.mjs'
import { generateV14F } from './generate-effects-v14-f.mjs'
import { generateV14G } from './generate-effects-v14-g.mjs'
import { generateV14H } from './generate-effects-v14-h.mjs'

export function generateV14(ctx) {
  generateV14A(ctx)
  generateV14B(ctx)
  generateV14C(ctx)
  generateV14D(ctx)
  generateV14E(ctx)
  generateV14F(ctx)
  generateV14G(ctx)
  generateV14H(ctx)
}
