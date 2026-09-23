/**
 * Does `generated-effect-motion.json` still describe the catalog?
 *
 *     npx tsx scripts/check-effect-motion.mts
 *
 * The motion-safety profile is derived data: `analyzeEffectMotion` run over
 * every effect's SHIPPED css and written to a committed file. Derived data
 * that does not regenerate itself is the failure this repo has already paid
 * for once (a stale JSON travelled to the API, the CLI, the MCP server and the
 * registry, and the counts in SKILL.md travelled further). So this gate does
 * not trust the file: it recomputes every row from the catalog and compares.
 *
 * FAILS WHEN
 *   - the file is missing or unreadable;
 *   - an effect has no row, or a row belongs to no effect;
 *   - a row differs from a fresh analysis (someone changed an effect's CSS,
 *     the guard, or the rules in effect-motion.ts without rebuilding);
 *   - the file is over its size budget (it carries one row per effect and is
 *     imported by a route, so it is kept small);
 *   - an animated property has no ruling in effect-motion.ts. An unruled
 *     property would be silently counted as paint, which is a guess wearing a
 *     badge;
 *   - the browser validation file disagrees with the current analysis. That
 *     file is the only source of a numeric CLS figure, so it must not go
 *     stale either: a validated effect's stored static category has to equal
 *     the current one, the stored summary has to equal the recomputed one, and
 *     the sample has to stay at least MIN_SAMPLE.
 *
 * DOES NOT FAIL WHEN a looping effect is unguarded. That is reported: the
 * badge says so honestly, and the frame test (`test:motion`) and the static
 * audit (`audit:motion`) are the gates on the guard itself. Failing here as
 * well would make a third place to fix one problem.
 *
 * Needs no browser and no server. Rebuild with
 * `npx tsx scripts/build-effect-motion.mts`; re-validate with
 * `npx tsx scripts/validate-effect-motion.mts` (dev server required).
 */

import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { EFFECTS } from '../src/lib/effects.ts'
import { analyzeEffectMotion, sameMotion, type CompactMotion } from '../src/lib/effect-motion.ts'
import { isShaderRenderer } from '../src/lib/shaders/shader-types.ts'
import { motionRowFor } from './build-effect-motion.mts'

const MAX_BYTES = 400 * 1024
const MIN_SAMPLE = 25

const root = process.cwd()
const file = join(root, 'src', 'lib', 'generated-effect-motion.json')
const validationFile = join(root, 'src', 'lib', 'effect-motion-validation.json')
const problems: string[] = []

if (!existsSync(file)) {
  console.error('check-effect-motion: src/lib/generated-effect-motion.json is missing. Run `npx tsx scripts/build-effect-motion.mts`.')
  process.exit(1)
}

let rows: Record<string, CompactMotion>
try {
  rows = JSON.parse(readFileSync(file, 'utf8')) as Record<string, CompactMotion>
} catch (error) {
  console.error(`check-effect-motion: generated-effect-motion.json is not valid JSON (${(error as Error).message}).`)
  process.exit(1)
}

const bytes = statSync(file).size
if (bytes > MAX_BYTES) {
  problems.push(`generated-effect-motion.json is ${(bytes / 1024).toFixed(0)} KB, over the ${MAX_BYTES / 1024} KB budget.`)
}

/* ---- rows vs a fresh analysis ------------------------------------- */

const ids = new Set(EFFECTS.map((e) => e.id))
const missing: string[] = []
const stale: string[] = []
const unclassified = new Map<string, string[]>()
let unguarded = 0

for (const effect of EFFECTS) {
  const row = rows[effect.id]
  if (!row) {
    missing.push(effect.id)
    continue
  }
  if (!sameMotion(row, motionRowFor(effect))) stale.push(effect.id)
  if (!isShaderRenderer(effect.renderer)) {
    const p = analyzeEffectMotion(effect.css, effect.html)
    if (p.reducedMotion === 'unguarded') unguarded++
    for (const prop of p.unclassified) {
      const list = unclassified.get(prop) ?? []
      list.push(effect.id)
      unclassified.set(prop, list)
    }
  }
}
const orphaned = Object.keys(rows).filter((id) => !ids.has(id))

if (missing.length) problems.push(`${missing.length} effect(s) have no motion row, e.g. ${missing.slice(0, 3).join(', ')}.`)
if (orphaned.length) problems.push(`${orphaned.length} row(s) belong to no effect, e.g. ${orphaned.slice(0, 3).join(', ')}.`)
if (stale.length) problems.push(`${stale.length} row(s) differ from a fresh analysis, e.g. ${stale.slice(0, 3).join(', ')}.`)
for (const [prop, list] of unclassified) {
  problems.push(`animated property \`${prop}\` has no ruling in src/lib/effect-motion.ts (used by ${list.slice(0, 2).join(', ')}${list.length > 2 ? ` and ${list.length - 2} more` : ''}).`)
}

/* ---- the browser validation --------------------------------------- */

interface ValidationRow {
  static: 'none' | 'shifts'
  measured: { cls: number; entries: number; windowSeconds: number }
}
interface Validation {
  summary?: { sample: number; agreed: number }
  effects?: Record<string, ValidationRow>
}

let validationLine = 'no validation file'
if (!existsSync(validationFile)) {
  problems.push('src/lib/effect-motion-validation.json is missing. Run `npx tsx scripts/validate-effect-motion.mts` against a running dev server.')
} else {
  const v = JSON.parse(readFileSync(validationFile, 'utf8')) as Validation
  const entries = Object.entries(v.effects ?? {})
  if (entries.length < MIN_SAMPLE) {
    problems.push(`browser validation covers ${entries.length} effects; at least ${MIN_SAMPLE} are required. Re-run scripts/validate-effect-motion.mts.`)
  }

  let agreed = 0
  const driftedStatic: string[] = []
  for (const [id, row] of entries) {
    const effect = EFFECTS.find((e) => e.id === id)
    if (!effect || isShaderRenderer(effect.renderer)) {
      problems.push(`validation row \`${id}\` is not a CSS effect in the catalog any more.`)
      continue
    }
    const nowStatic = analyzeEffectMotion(effect.css, effect.html).layoutShift
    if (nowStatic !== row.static) driftedStatic.push(id)
    if ((nowStatic === 'shifts') === (row.measured.entries > 0)) agreed++
  }
  if (driftedStatic.length) {
    problems.push(`${driftedStatic.length} validated effect(s) now classify differently from when they were measured (e.g. ${driftedStatic.slice(0, 3).join(', ')}). Re-run scripts/validate-effect-motion.mts.`)
  }
  if (v.summary && (v.summary.sample !== entries.length || v.summary.agreed !== agreed)) {
    problems.push(`validation summary says ${v.summary.agreed}/${v.summary.sample} agreed but the rows recompute to ${agreed}/${entries.length}. Re-run scripts/validate-effect-motion.mts.`)
  }
  validationLine = `${agreed}/${entries.length} static classifications agreed with Chromium layout-shift`
}

/* ---- report ------------------------------------------------------- */

if (problems.length) {
  console.error(`check-effect-motion: ${problems.length} problem(s).\n`)
  for (const p of problems) console.error(`  - ${p}`)
  console.error('\nRebuild with `npx tsx scripts/build-effect-motion.mts`.')
  process.exit(1)
}

console.log(
  `check-effect-motion: ${EFFECTS.length} rows match a fresh analysis (${(bytes / 1024).toFixed(0)} KB). ${validationLine}.` +
    (unguarded ? ` ${unguarded} looping effect(s) ship without a reduced-motion guard.` : ''),
)
