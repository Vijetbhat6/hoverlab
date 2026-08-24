/**
 * Fail the build when the effect catalog grows in a category that is done,
 * and report how far behind the block catalog is.
 *
 *   npx tsx scripts/check-catalog-focus.mts
 *   npx tsx scripts/check-catalog-focus.mts --update   # accept a new baseline
 *
 * WHY THIS EXISTS
 *
 * Six effect categories are shape-exhausted. Not "large" — exhausted, in the
 * sense that the space of visually distinct things a divider can do is
 * finite and we have made all of them. Another generation wave against
 * `Dividers & Separators` produces a fifth kind of horizontal rule: real
 * work, real render time, real review, and no buyer has ever compared two
 * catalogs on how many dividers they have.
 *
 * Meanwhile the block catalog is where this product is measured against its
 * competitors, and it is roughly an order of magnitude behind. Every hour
 * spent on effect number 772 is an hour not spent closing that.
 *
 * "Stop growing the effect catalog" was a decision written in a strategy
 * document, and decisions that live only in strategy documents get undone by
 * the next person who runs a generator because generating is easy. So this
 * is the same decision as a build step: `SEALED` categories cannot grow, and
 * the build says so if they do.
 *
 * WHAT IT DOES NOT DO
 *
 * It does not stop anyone adding effects to open categories, and it does not
 * stop a sealed category from being FIXED. Deleting a broken effect and
 * replacing it keeps the count level and passes. The rule is on growth, not
 * on maintenance, because "no new dividers" and "never touch a divider
 * again" are very different instructions and only the first one is wanted.
 *
 * --update rewrites the baseline. That is the escape hatch, and it is
 * deliberately a separate deliberate act that shows up in a diff: sealing is
 * a judgement call and judgement calls get revisited, but they should be
 * revisited on purpose rather than by a generator run nobody reviewed.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { EFFECTS } from '../src/lib/effects.ts'
import { BLOCK_INDEX } from '../src/lib/blocks/block-index.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const BASELINE = join(HERE, '..', 'src', 'lib', 'catalog-focus.json')

/**
 * Categories that are finished, and the reason each one is.
 *
 * The reason matters more than the list. Anyone can unseal a category by
 * editing this file; what should stop them is having to write a better
 * sentence than the one already here.
 */
const SEALED: Record<string, string> = {
  'Dividers & Separators':
    'A divider is a line between two things. The distinct shapes are: solid, dashed, gradient-fade, with a centred label, and decorated with an icon or ornament. All five exist. A sixth is a colour change.',
  'Badges & Tags':
    'A badge is a small piece of text in a shaped container. Pill, square, outlined, dot-prefixed, with a remove affordance, animated on entry — all present. Further additions vary the palette, not the shape.',
  'Skeletons & Shimmers':
    'The whole category is one idea — a grey placeholder with a moving highlight — applied to the handful of layouts that get skeletoned. The shapes are covered and the animation has one axis.',
  'Borders & Outlines':
    'Gradient, animated-trace, glow, inset, dashed-marching, corner-only. The remaining variation is which colour travels around the box.',
  'Progress & Meters':
    'Linear, circular, segmented, indeterminate, striped, with a label. The category is defined by a value between 0 and 1, and there are only so many ways to draw one.',
  'Scroll & Sticky':
    'Scroll-driven reveal, parallax, progress indicator, sticky header, snap. Each is one browser behaviour, and every one of them is here.',
}

/** Blocks per category, and the count a competitor comparison actually turns on. */
const BLOCK_TARGET = 250

interface Baseline {
  /** Effects per sealed category at the moment it was sealed. */
  sealed: Record<string, number>
  /** Block count when the baseline was last accepted, for the progress line. */
  blocks: number
}

function currentCounts(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const effect of EFFECTS) {
    counts[effect.category] = (counts[effect.category] ?? 0) + 1
  }
  return counts
}

function readBaseline(): Baseline | null {
  try {
    return JSON.parse(readFileSync(BASELINE, 'utf8')) as Baseline
  } catch {
    return null
  }
}

function writeBaseline(counts: Record<string, number>): Baseline {
  const sealed: Record<string, number> = {}
  for (const category of Object.keys(SEALED)) sealed[category] = counts[category] ?? 0
  const next: Baseline = { sealed, blocks: BLOCK_INDEX.length }
  writeFileSync(BASELINE, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  return next
}

function main(): void {
  const counts = currentCounts()
  const update = process.argv.includes('--update')

  let baseline = readBaseline()
  if (!baseline || update) {
    baseline = writeBaseline(counts)
    console.log(
      `catalog-focus: baseline ${update ? 'updated' : 'created'} — ` +
        `${Object.keys(SEALED).length} sealed categories, ${BLOCK_INDEX.length} blocks`,
    )
    if (update) return
  }

  // A category named in SEALED but absent from the baseline was sealed after
  // the baseline was written. Treat its current count as the ceiling rather
  // than as unlimited — the alternative silently exempts every new seal.
  const failures: string[] = []
  for (const [category, reason] of Object.entries(SEALED)) {
    const ceiling = baseline.sealed[category] ?? counts[category] ?? 0
    const now = counts[category] ?? 0
    if (now > ceiling) {
      failures.push(
        `  ${category}: ${now} effects, up from ${ceiling}\n` +
          `    ${reason}\n` +
          `    Point the wave at blocks instead, or run --update if this seal is genuinely wrong.`,
      )
    }
  }

  const behind = Math.max(0, BLOCK_TARGET - BLOCK_INDEX.length)
  console.log(
    `catalog-focus: ${EFFECTS.length} effects, ${BLOCK_INDEX.length} blocks` +
      (behind ? ` — ${behind} short of ${BLOCK_TARGET}` : ` — past ${BLOCK_TARGET}`),
  )

  if (failures.length) {
    console.error(
      '\ncatalog-focus: a sealed effect category grew.\n\n' +
        failures.join('\n\n') +
        '\n',
    )
    process.exit(1)
  }
}

main()
