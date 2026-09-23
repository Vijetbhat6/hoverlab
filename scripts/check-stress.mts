/**
 * The build-time half of the stress-test matrix.
 *
 * `scripts/stress-matrix.mts` needs a browser and a running server, so it
 * cannot run in `prebuild`. This can, and it says the one thing a build
 * without a browser is entitled to say: whether the committed report is
 * still a truthful record of the code.
 *
 * ── WHAT FAILS THE BUILD ────────────────────────────────────────────────
 *
 *   - a report written under older definitions (`STRESS_VERSION`), because
 *     "passed the old test" is not evidence about the new one;
 *   - a result for an artifact that no longer exists;
 *   - a result that is malformed (an unknown condition id, a value that is
 *     not one of the four outcomes).
 *
 * ── WHAT IS ONLY REPORTED ───────────────────────────────────────────────
 *
 * Stale results (the source changed after the measurement), artifacts with
 * no result yet, and failures. None of them fails the build by default,
 * and the split is deliberate. Editing a block would otherwise turn every
 * peer's prebuild red until somebody ran a minutes-long browser pass, and
 * a check that is routinely worked around is a check that ends up deleted.
 * The /stress pages do their own staleness check and refuse to show an old
 * pass as current, so staleness cannot leak into a claim.
 *
 * `--strict` turns all three into failures. That is the mode to run before
 * saying "every block is verified under six stresses" anywhere.
 *
 * An absent or empty report is a skip, not a failure: the feature is opt-in
 * until the first run is committed (same policy as `check-figma-kit`).
 *
 *     npx tsx scripts/check-stress.mts [--strict]
 */

import { readFileSync } from 'node:fs'

import { BLOCK_CATALOG } from '../src/lib/blocks/catalog.ts'
import { PAGE_CATALOG } from '../src/lib/pages/catalog.ts'
import { PRIMITIVE_CATALOG } from '../src/lib/primitives/catalog.ts'
import { STRESSES, STRESS_VERSION, artifactKey, type StressLevel } from '../src/lib/stress/conditions.ts'
import { sourceHash } from '../src/lib/stress/source-hash.ts'

const strict = process.argv.includes('--strict')

interface Stored {
  version: number
  results: Record<string, { h: string; at: string; s: Record<string, number>; f?: Record<string, string[]> }>
}

const report = JSON.parse(readFileSync('src/lib/generated-stress-report.json', 'utf8')) as Stored
const keys = Object.keys(report.results)

if (keys.length === 0) {
  console.log('check-stress: no results recorded yet, skipping (run `npm run stress -- --write`).')
  process.exit(0)
}

const catalog = new Map<string, { level: StressLevel; id: string }>()
for (const [level, ids] of [
  ['primitive', PRIMITIVE_CATALOG.map((p) => p.id)],
  ['block', BLOCK_CATALOG.map((b) => b.id)],
  ['page', PAGE_CATALOG.map((p) => p.id)],
] as const) {
  for (const id of ids) catalog.set(artifactKey(level, id), { level, id })
}

const problems: string[] = []
const known = new Set<string>(STRESSES.map((s) => s.id))

if (report.version !== STRESS_VERSION) {
  problems.push(
    `report version ${report.version} but the definitions are version ${STRESS_VERSION}: re-run \`npm run stress -- --write\`.`,
  )
}

let stale = 0
let failing = 0
for (const key of keys) {
  const result = report.results[key]
  const artifact = catalog.get(key)
  if (!artifact) {
    problems.push(`${key}: no such artifact any more; remove it from the report.`)
    continue
  }
  for (const [id, outcome] of Object.entries(result.s)) {
    if (!known.has(id)) problems.push(`${key}: unknown condition "${id}".`)
    if (![0, 1, 2, 3].includes(outcome)) problems.push(`${key}: ${id} has outcome ${outcome}.`)
    if (outcome === 0) failing += 1
  }
  if (result.h !== sourceHash(artifact.level, artifact.id)) stale += 1
}

const missing = catalog.size - keys.filter((key) => catalog.has(key)).length

console.log(
  `check-stress: ${keys.length} of ${catalog.size} artifacts measured, ${stale} stale, ${failing} failing cells, ${missing} not yet run.`,
)

if (strict) {
  if (stale > 0) problems.push(`${stale} result(s) are stale.`)
  if (missing > 0) problems.push(`${missing} artifact(s) have no result.`)
  if (failing > 0) problems.push(`${failing} condition(s) fail.`)
}

if (problems.length > 0) {
  console.error(`\ncheck-stress: FAILED\n`)
  for (const problem of problems.slice(0, 40)) console.error(`  ${problem}`)
  if (problems.length > 40) console.error(`  ...and ${problems.length - 40} more`)
  process.exit(1)
}
