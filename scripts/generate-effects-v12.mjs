// scripts/generate-effects-v12.mjs
//
// Twelfth wave: six new designs in EVERY category, one entry each —
// 192 in total. The first wave written wide across all 32 categories
// under the one-per-design rule that v11 introduced for Buttons and
// the thinning pass enforces for everything else.
//
// The catalog before this wave held 579 distinct designs, ~17 per
// category, once the colorway/size stamping was collapsed. This wave
// grows depth the only way that survives thinning: as new mechanics
// and shapes, each carrying its own accent color, none looped over
// tokens. The Customize panel handles color and size.
//
// Split into eight sibling modules (a–h, four categories each) so
// each could be written and render-tested independently; this file
// only sequences them. Same ctx as every other wave; same assembly
// constraints (visible at rest, no absolute root, infinite keyframes
// rest at their 100% stop under the reduced-motion guard).

import { generateV12A } from './generate-effects-v12-a.mjs'
import { generateV12B } from './generate-effects-v12-b.mjs'
import { generateV12C } from './generate-effects-v12-c.mjs'
import { generateV12D } from './generate-effects-v12-d.mjs'
import { generateV12E } from './generate-effects-v12-e.mjs'
import { generateV12F } from './generate-effects-v12-f.mjs'
import { generateV12G } from './generate-effects-v12-g.mjs'
import { generateV12H } from './generate-effects-v12-h.mjs'

export function generateV12(ctx) {
  generateV12A(ctx)
  generateV12B(ctx)
  generateV12C(ctx)
  generateV12D(ctx)
  generateV12E(ctx)
  generateV12F(ctx)
  generateV12G(ctx)
  generateV12H(ctx)
}
