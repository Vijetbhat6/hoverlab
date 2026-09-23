/**
 * Build-time gate for the primitive state matrix.
 *
 * `scripts/build-figma-states.mts` needs a browser and a running server, so
 * it cannot run in `prebuild`. This is the half that can: it recomputes what
 * the committed `generated-state-coverage.json` should contain from the live
 * catalog and fails only when the two structurally disagree.
 *
 * Same policy as `check-stress.mts` and `check-figma-kit.mts`: absent output
 * is a skip (the feature is opt-in until the first crawl is committed), and
 * a coverage file that names a primitive no longer in the catalog, an
 * unknown state id, or a malformed verdict fails the build. A primitive that
 * exists but has never been crawled is only reported — the crawl is a
 * minutes-long browser pass, not something a peer's unrelated commit should
 * be blocked on.
 *
 *   npx tsx scripts/check-figma-states.mts [--strict]
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { PRIMITIVE_INDEX } from '../src/lib/primitives/primitive-index.ts'
import { NON_DEFAULT_STATES, isVerdict, type StateId, type Verdict } from '../src/lib/states/states.ts'

const strict = process.argv.includes('--strict')

const COVERAGE_FILE = join('src', 'lib', 'generated-state-coverage.json')

if (!existsSync(COVERAGE_FILE)) {
  console.log('check-figma-states: no state coverage recorded yet, skipping (run `npx tsx scripts/build-figma-states.mts`).')
  process.exit(0)
}

interface Stored {
  primitives: number
  coverage: Record<string, Partial<Record<StateId, Verdict>>>
  focusDefects: Record<string, string[]>
}

const stored = JSON.parse(readFileSync(COVERAGE_FILE, 'utf8')) as Stored
const known = new Set(PRIMITIVE_INDEX.map((p) => p.id))
const stateIds = new Set(NON_DEFAULT_STATES.map((s) => s.id))

const problems: string[] = []

for (const [id, verdicts] of Object.entries(stored.coverage)) {
  if (!known.has(id)) {
    problems.push(`${id}: no such primitive any more; remove it from the coverage file.`)
    continue
  }
  for (const [state, verdict] of Object.entries(verdicts)) {
    if (!stateIds.has(state as StateId)) problems.push(`${id}: unknown state "${state}".`)
    if (!isVerdict(verdict)) problems.push(`${id}: ${state} has an invalid verdict "${verdict}".`)
  }
}

for (const id of Object.keys(stored.focusDefects)) {
  if (!known.has(id)) problems.push(`${id}: focus defect listed for a primitive that no longer exists.`)
}

const covered = Object.keys(stored.coverage).filter((id) => known.has(id))
const missing = PRIMITIVE_INDEX.filter((p) => !stored.coverage[p.id]).map((p) => p.id)
const defectCount = Object.values(stored.focusDefects).reduce((n, list) => n + list.length, 0)

console.log(
  `check-figma-states: ${covered.length} of ${PRIMITIVE_INDEX.length} primitives have a state result, ` +
    `${missing.length} not yet run, ${defectCount} focus-visible defect(s) recorded.`,
)

if (strict && missing.length > 0) {
  problems.push(`${missing.length} primitive(s) have no state result: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ', ...' : ''}.`)
}

if (problems.length > 0) {
  console.error(`\ncheck-figma-states: FAILED\n`)
  for (const problem of problems.slice(0, 40)) console.error(`  ${problem}`)
  if (problems.length > 40) console.error(`  ...and ${problems.length - 40} more`)
  process.exit(1)
}
