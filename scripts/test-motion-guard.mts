// Behavioral test for the reduced-motion guard.
//
// Asserting that the CSS *contains* a @media block proves nothing — the
// selector could be wrong, the specificity could lose, the property list
// could be incomplete. (It was: the first version collapsed durations but
// left animation-delay alone, so staggered effects still cascaded for half
// a second. Frame comparison caught it; a string assertion would not have.)
//
// So this renders each effect twice, from the real catalog, and compares
// frames ~900ms apart:
//
//   prefers-reduced-motion: no-preference -> frames MUST differ (it animates)
//   prefers-reduced-motion: reduce        -> frames MUST match  (it's still)
//
// Imports EFFECTS rather than the raw JSON deliberately: the guard is
// applied when the catalog is assembled, so this exercises exactly the CSS
// that ships to the clipboard, the API and the ZIP.
//
// Run: npm run test:motion

import { chromium } from 'playwright'
import { createHash } from 'node:crypto'
import { EFFECTS } from '../src/lib/effects.ts'
import { analyzeEffect } from '../src/lib/effect-insights.ts'

/**
 * One guarded effect per template family, derived from the catalog rather
 * than hardcoded.
 *
 * The first version listed ~20 families by hand, and both bugs it found
 * were caught only because the offending family happened to be on the
 * list — if `al-pulse` hadn't been, the pseudo-element miss would have
 * shipped. Deriving the set means every template is covered, and a
 * template added next month is covered without anyone remembering to add
 * it here.
 *
 * Variants within a family (17 palettes x 3 sizes of the same template)
 * share their CSS structure, so one representative each is the right
 * granularity — that is what the exhaustive static pass in
 * audit-motion-guard.mts is for.
 */
function familyOf(css: string): string {
  // `.fx-ml-conic-sunset-5096` -> `ml-conic`; hand-written names have no
  // seq suffix, so fall back to the whole class.
  const cls = /\.fx-([\w-]+)/.exec(css)?.[1] ?? ''
  const parts = cls.split('-')
  return parts.length >= 3 ? parts.slice(0, 2).join('-') : cls
}

const byFamily = new Map<string, (typeof EFFECTS)[number]>()
for (const e of EFFECTS) {
  if (!analyzeEffect(e.css, e.html).hasInfiniteAnimation) continue
  const fam = familyOf(e.css)
  if (!byFamily.has(fam)) byFamily.set(fam, e)
}
const picks = [...byFamily].map(([fam, effect]) => ({ fam, effect }))

const browser = await chromium.launch()
const failures: string[] = []
let pass = 0
let inconclusive = 0

async function isStill(
  effect: (typeof EFFECTS)[number],
  reducedMotion: 'reduce' | 'no-preference',
): Promise<boolean> {
  const ctx = await browser.newContext({ reducedMotion, viewport: { width: 400, height: 300 } })
  const page = await ctx.newPage()
  await page.setContent(
    `<style>body{margin:0;display:grid;place-items:center;height:100vh;background:#020617}
     ${effect.css}</style>${effect.html}`,
  )
  // Three samples at uneven gaps, not two. A periodic effect sampled
  // twice can land on matching phase and read as motionless — that's what
  // every "inconclusive" was. Uneven spacing makes a false match require
  // the period to divide both gaps.
  const frames: string[] = []
  for (const wait of [400, 700, 1100]) {
    await page.waitForTimeout(wait)
    frames.push(createHash('sha1').update(await page.screenshot()).digest('hex'))
  }
  await ctx.close()
  return frames.every((f) => f === frames[0])
}

for (const { fam, effect } of picks) {
  const label = `${fam.padEnd(14)} ${effect.name}`

  if (!analyzeEffect(effect.css, effect.html).respectsReducedMotion) {
    failures.push(`${effect.name} — no guard in shipped CSS`)
    console.log(`✗ ${label} — SHIPPED WITHOUT A GUARD`)
    continue
  }

  if (await isStill(effect, 'no-preference')) {
    // Not a guard failure: some loops look identical every frame (a
    // rotating radial symmetric shape, a flicker caught mid-cycle).
    // Report so the sample can be swapped, don't fail the run.
    console.log(`~ ${label} — no visible motion either way, inconclusive`)
    inconclusive++
    continue
  }

  if (await isStill(effect, 'reduce')) {
    console.log(`✓ ${label}`)
    pass++
  } else {
    failures.push(effect.name)
    console.log(`✗ ${label} — STILL MOVING under prefers-reduced-motion`)
  }
}

await browser.close()

console.log(`\n${pass} passed · ${inconclusive} inconclusive · ${failures.length} failed`)
if (failures.length) {
  console.log('Failing:\n  ' + failures.join('\n  '))
  process.exit(1)
}
