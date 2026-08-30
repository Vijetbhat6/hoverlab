// scripts/generate-effects-v13.mjs
//
// Thirteenth wave: 138 new designs, one entry each, across ALL 32 effect
// categories. Same one-per-design discipline as v11 and v12 — no
// colorway, size or speed stamping; the Customize panel re-tokens
// anything.
//
// THE SEAL
//
// Six categories were sealed by scripts/check-catalog-focus.mts as
// shape-exhausted: Dividers & Separators, Badges & Tags, Skeletons &
// Shimmers, Borders & Outlines, Progress & Meters and Scroll & Sticky.
// Parts a–g deliberately skipped them; the owner then asked for the wave
// to cover every category, so part h adds four designs to each of the six
// and the focus baseline was re-accepted with `--update`. The SEALED
// reasons in that script are unchanged and still worth reading before the
// next wave — the search really is harder in those six.
//
// WEIGHTING
//
// The five categories the shape-budget note calls genuinely short of
// shapes — Charts & Data, Timelines & Steps, Tables & Data Grids, Forms
// & Validation, Micro-interactions — take six designs each. The other 27
// take four. 27x4 + 5x6 = 138.
//
// Split into eight sibling modules (a–h) so each block of categories
// could be written and checked on its own; this file only sequences
// them. Same ctx as every other wave, same assembly constraints: roots
// visible at rest, no position:absolute on a root, infinite keyframes
// resting sensibly at their 100% stop under the reduced-motion guard,
// everything fitting a ~300x180 dark preview.

import { generateV13A } from './generate-effects-v13-a.mjs'
import { generateV13B } from './generate-effects-v13-b.mjs'
import { generateV13C } from './generate-effects-v13-c.mjs'
import { generateV13D } from './generate-effects-v13-d.mjs'
import { generateV13E } from './generate-effects-v13-e.mjs'
import { generateV13F } from './generate-effects-v13-f.mjs'
import { generateV13G } from './generate-effects-v13-g.mjs'
import { generateV13H } from './generate-effects-v13-h.mjs'

export function generateV13(ctx) {
  generateV13A(ctx)
  generateV13B(ctx)
  generateV13C(ctx)
  generateV13D(ctx)
  generateV13E(ctx)
  generateV13F(ctx)
  generateV13G(ctx)
  generateV13H(ctx)
}
