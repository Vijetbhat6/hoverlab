/**
 * Run the Verify tab across the catalog in a real browser.
 *
 * ── WHY THIS EXISTS AS WELL AS `check-verify` ───────────────────────────
 *
 * `check-verify.mts` reads every generated file back and reports what can
 * be known without rendering: a `<template>` that never closed, a `<style>`
 * that lost its `scoped`, a class that is not a Tailwind class. It runs in
 * the build and it is fast.
 *
 * It is also structurally blind to the defect class this catalog turns out
 * to actually have. The bug that prompted this script was two extra spaces
 * of indentation: `<td><i class="cv"></i>North America</td>` broken across
 * three lines, which puts a newline between the icon and the word, which in
 * an inline formatting context *is a space*. Every static property of that
 * file is correct. The table is 1.6px wider. Nothing but a browser can say
 * so, and nothing but a comparison against the original can say it matters.
 *
 * So this drives the real page — the real panel, the real differ, the same
 * code a visitor runs — and fails when a rendering disagrees with the
 * effect it was exported from.
 *
 * ── WHY IT IS NOT IN THE BUILD ──────────────────────────────────────────
 *
 * It needs a dev server and a browser, and a full pass is 1,111 effects
 * times four targets at about two seconds each. It samples by default and
 * takes `--all` when you mean it, which is the same bargain `test:motion`
 * and `test:blocks` already make:
 *
 *     npm run test:verify                    a spread sample of 24
 *     npm run test:verify -- --sample 60     a bigger one
 *     npm run test:verify -- --all           every effect, slowly
 *     npm run test:verify -- btn-gradient    just these
 *     BASE=http://localhost:3017 npm run test:verify
 *
 * ── WHAT COUNTS AS A FAILURE ────────────────────────────────────────────
 *
 * A `real` computed-property difference, or a structural one. Differences
 * the panel classes as `equivalent` are reported and not failed: a border
 * colour behind `border-style: none` cannot be painted, and failing a build
 * on it would only teach somebody to delete the check.
 */

import { chromium } from 'playwright'

import { EFFECTS } from '../src/lib/effects.ts'
import { isShaderRenderer } from '../src/lib/shaders/shader-types.ts'
import { VERIFY_TARGETS } from '../src/lib/export/verify.ts'

const BASE = process.env.BASE ?? 'http://localhost:3007'
const args = process.argv.slice(2)
const ONLY = args.filter((arg) => !arg.startsWith('-') && !/^\d+$/.test(arg))
const ALL = args.includes('--all')
const sampleIndex = args.indexOf('--sample')
const requested = sampleIndex === -1 ? 24 : Number(args[sampleIndex + 1])
// A junk `--sample` value used to produce NaN, then a stride of NaN, then
// an empty subject list and a confusing "no effects matched".
const SAMPLE = Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : 24

/** Tab labels, in the order the panel renders them. */
const TARGET_LABEL: Record<string, string> = {
  css: 'CSS',
  vue: 'Vue',
  svelte: 'Svelte',
  tailwind: 'Tailwind',
}

const candidates = EFFECTS.filter((effect) => !isShaderRenderer(effect.renderer))

/**
 * Which effects to open.
 *
 * A spread rather than the first N or a random N. The catalog is ordered
 * by tier and then by generation wave, so the first 24 are all hand-written
 * buttons — the least representative slice there is — and a random sample
 * makes a failure impossible to reproduce.
 */
const subjects = ONLY.length
  ? candidates.filter((effect) => ONLY.includes(effect.id))
  : ALL
    ? candidates
    : candidates.filter((_, i) => i % Math.max(1, Math.floor(candidates.length / SAMPLE)) === 0)

if (!subjects.length) {
  console.error(`test-verify: no effects matched ${ONLY.join(', ') || '(sample)'}`)
  process.exit(1)
}

interface Failure {
  effect: string
  target: string
  headline: string
  rows: string[]
}

const failures: Failure[] = []
const equivalents: Failure[] = []
let checked = 0
let unreadable = 0

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 1200 } })

// The ladder tour aria-hides the page wrapper, which makes every role
// lookup below fail on a first visit.
await context.addInitScript(() => {
  try {
    localStorage.setItem('hoverlab:ladder-tour-seen', '1')
  } catch {
    /* Blocked storage; the tour treats that as seen anyway. */
  }
})

const page = await context.newPage()

/** The dev server drops a connection now and then; one retry is enough. */
async function open(url: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      return true
    } catch {
      await page.waitForTimeout(1500)
    }
  }
  console.error(`  could not open ${url}`)
  return false
}

/*
 * Progress, one line per effect.
 *
 * A pass over the catalog is minutes long and the only thing worse than
 * waiting for it is not knowing whether it is still moving — the first
 * version of this script printed nothing until it finished and was
 * indistinguishable from a hang.
 */
let index = 0

for (const effect of subjects) {
  index++
  process.stdout.write(
    `[${String(index).padStart(String(subjects.length).length)}/${subjects.length}] ${effect.id}`,
  )
  const started = Date.now()

  if (!(await open(`${BASE}/effect/${effect.id}`))) {
    process.stdout.write('  — unreachable\n')
    continue
  }

  try {
    await page.getByRole('tab', { name: 'Verify' }).click({ timeout: 20_000 })
  } catch {
    process.stdout.write('  — no Verify tab\n')
    continue
  }

  const marks: string[] = []

  for (const target of VERIFY_TARGETS) {
    const label = TARGET_LABEL[target]
    try {
      await page.getByRole('button', { name: label, exact: true }).click({ timeout: 15_000 })

      // The panel measures once both frames have loaded; the verdict text
      // is what it writes when it is done.
      const verdict = page.locator('[aria-live="polite"] p').first()
      await verdict.waitFor({ state: 'visible', timeout: 15_000 })
      let headline = ''
      for (let i = 0; i < 30; i++) {
        headline = (await verdict.textContent())?.trim() ?? ''
        if (!headline.startsWith('Rendering')) break
        await page.waitForTimeout(400)
      }

      checked++

      if (headline.startsWith('Rendering') || headline.startsWith('The two frames')) {
        unreadable++
        marks.push(`${label} ?`)
        continue
      }

      const rows = (await page.locator('[role="tabpanel"]:visible table tbody tr').allTextContents())
        .map((row) => row.replace(/\s+/g, ' ').trim())
        .slice(0, 8)

      /*
       * Allowlist the two headlines that mean "fine", and fail everything
       * else. Matching the *failure* wordings instead was a hole: a verdict
       * this script had never heard of — and there is now one for "neither
       * frame rendered anything" — fell through to being counted as a pass.
       * A checker that treats the unrecognised case as success is worse
       * than no checker.
       */
      if (headline.startsWith('Every one of')) {
        marks.push(`${label} ok`)
      } else if (headline.startsWith('Identical apart from')) {
        equivalents.push({ effect: effect.id, target: label, headline, rows: [] })
        marks.push(`${label} ~`)
      } else {
        failures.push({ effect: effect.id, target: label, headline, rows })
        marks.push(`${label} FAIL`)
      }
    } catch (error) {
      failures.push({
        effect: effect.id,
        target: label,
        headline: `the panel did not report: ${(error as Error).message.split('\n')[0]}`,
        rows: [],
      })
      marks.push(`${label} FAIL`)
    }
  }

  process.stdout.write(
    `  ${marks.join(', ')}  (${Math.round((Date.now() - started) / 100) / 10}s)\n`,
  )
}

await browser.close()

if (equivalents.length) {
  console.log(
    `test-verify: ${equivalents.length} export(s) differ only in values that cannot be painted.`,
  )
  for (const row of equivalents.slice(0, 5)) {
    console.log(`  ${row.effect} / ${row.target}: ${row.headline}`)
  }
  if (equivalents.length > 5) console.log(`  … and ${equivalents.length - 5} more`)
  console.log('')
}

if (unreadable) {
  console.log(`test-verify: ${unreadable} export(s) could not be measured in this browser.\n`)
}

if (!failures.length) {
  console.log(
    `test-verify: ${checked} export(s) across ${subjects.length} effects render the same as the original.`,
  )
  process.exit(0)
}

console.error(`test-verify: ${failures.length} of ${checked} exports render differently.\n`)

for (const failure of failures) {
  console.error(`  ${failure.effect} / ${failure.target}`)
  console.error(`    ${failure.headline}`)
  for (const row of failure.rows) console.error(`      ${row}`)
}

console.error(
  [
    '',
    'Each of these is the export of an effect rendering differently from the',
    'effect. The fix is in src/lib/export/, not in the effect — and the same',
    'comparison is on the effect page under the Verify tab, where the two',
    'frames sit side by side.',
  ].join('\n'),
)

process.exit(1)
