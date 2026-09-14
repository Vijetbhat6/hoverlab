/**
 * Runs the Verify tab's static half over the whole catalog.
 *
 * WHY A SCRIPT AS WELL AS A TAB. The Verify tab renders an export beside
 * the original so a reader can see that the conversion holds. That is the
 * right place for the *visual* half — two frames and a computed-style diff
 * need a browser. But it only ever runs on the one effect somebody happens
 * to be looking at, and the half that does not need a browser is the half
 * that can be wrong on 1,047 effects at once: a `<template>` block that
 * never closed, a `<style>` that lost its `scoped`, a Tailwind class that
 * is not a Tailwind class.
 *
 * `verifyExport` computes those findings from the generated file, with no
 * DOM involved. So they can be computed for every effect, in CI, before
 * anybody opens a tab — which turns "a reader might notice" into "the
 * build stops".
 *
 * WHAT FAILS THE BUILD. Only `problem` findings, which are statements
 * about the export. A `gap` finding is `tailwind-utilities` admitting it
 * does not know a class; that is a limitation of the verifier and is
 * reported at the end as a to-do rather than as a failure, because making
 * the build red for it would create pressure to delete the honest message
 * instead of teaching the reader the class. `note` findings — Svelte's
 * unused selectors, most of them — are counted and shown, not failed:
 * they are true of the source CSS, and pruning them is Svelte behaving as
 * documented.
 *
 * Run: npx tsx scripts/check-verify.mts [--verbose]
 */

import { EFFECTS } from '../src/lib/effects'
import { VERIFY_TARGETS, verifyExport } from '../src/lib/export/verify'
import { isShaderRenderer } from '../src/lib/shaders/shader-types'

const verbose = process.argv.includes('--verbose')

interface Row {
  effect: string
  target: string
  kind: string
  message: string
}

const problems: Row[] = []
const gaps: Row[] = []
const notes: Row[] = []

/*
 * Shaders are excluded for the same reason the tab hides itself on them:
 * their deliverable is a fragment shader, and their `html`/`css` are the
 * fallback surface. Converting that to Vue is a question nobody asked.
 */
const subjects = EFFECTS.filter((effect) => !isShaderRenderer(effect.renderer))

for (const effect of subjects) {
  for (const target of VERIFY_TARGETS) {
    let report
    try {
      report = verifyExport(
        {
          id: effect.id,
          name: effect.name,
          description: effect.description,
          category: effect.category,
          html: effect.html,
          css: effect.css,
        },
        target,
      )
    } catch (error) {
      problems.push({
        effect: effect.id,
        target,
        kind: 'problem',
        message: `threw while verifying: ${(error as Error).message}`,
      })
      continue
    }

    for (const finding of report.findings) {
      const row: Row = {
        effect: effect.id,
        target,
        kind: finding.kind,
        message: finding.message,
      }
      if (finding.kind === 'problem') problems.push(row)
      else if (finding.kind === 'gap') gaps.push(row)
      else notes.push(row)
    }

    /*
     * An export that rehydrates to no markup at all would render an empty
     * frame beside a full one, and the tab would show that plainly — but
     * only to whoever opened it. Caught here instead.
     */
    if (!report.converted.html.trim()) {
      problems.push({
        effect: effect.id,
        target,
        kind: 'problem',
        message: 'rehydrated to no markup at all.',
      })
    }
  }
}

const checked = subjects.length * VERIFY_TARGETS.length

function summarise(rows: Row[], limit: number): void {
  const byMessage = new Map<string, Row[]>()
  for (const row of rows) {
    // Group on the message's shape, not its text — the counts and the
    // sample class names inside differ per effect and would otherwise put
    // every row in a group of one.
    const shape = row.message.replace(/\d+/g, '#').replace(/\([^)]*\)/g, '(…)')
    const list = byMessage.get(`${row.target}: ${shape}`)
    if (list) list.push(row)
    else byMessage.set(`${row.target}: ${shape}`, [row])
  }

  for (const [shape, list] of [...byMessage.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.error(`  ${list.length}×  ${shape}`)
    for (const row of list.slice(0, verbose ? list.length : limit)) {
      console.error(`        ${row.effect}: ${row.message}`)
    }
    if (!verbose && list.length > limit) {
      console.error(`        … and ${list.length - limit} more (--verbose to list)`)
    }
  }
}

if (notes.length && verbose) {
  console.log(`check-verify: ${notes.length} note(s).`)
  summarise(notes, 3)
}

if (gaps.length) {
  console.error(
    `check-verify: ${gaps.length} class(es) the verifier could not resolve — a gap in tailwind-utilities.ts, not a failure.\n`,
  )
  summarise(gaps, 3)
  console.error('')
}

if (!problems.length) {
  console.log(
    `check-verify: ${checked} export(s) across ${subjects.length} effects rehydrate to renderable markup.` +
      (notes.length ? ` ${notes.length} note(s).` : ''),
  )
  process.exit(0)
}

console.error(`check-verify: ${problems.length} of ${checked} exports have a problem.\n`)
summarise(problems, 5)

console.error(
  [
    '',
    'Each of these is a statement about a generated file, computed by reading',
    'that file back — not about the effect it came from. Fix the generator in',
    'src/lib/export/, not the effect.',
    '',
    'The same findings appear on the effect page under the Verify tab.',
  ].join('\n'),
)

process.exit(1)
