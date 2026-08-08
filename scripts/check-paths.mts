// Verify every guided path points at blocks that exist.
//
// A path is hand-written prose referencing ids by hand, which is exactly
// the kind of data that rots silently: rename a block, and the path keeps
// rendering with a step that 404s. The block catalog has the build script
// pairing ids against source files to keep it honest; this is the same
// guarantee for the layer above it.
//
// Run: npm run check:paths  (wired into prebuild)

import { PATHS } from '../src/lib/paths/catalog.ts'
import { BLOCK_CATALOG } from '../src/lib/blocks/catalog.ts'

const known = new Set(BLOCK_CATALOG.map((b) => b.id))
const problems: string[] = []

for (const path of PATHS) {
  if (path.steps.length === 0) {
    problems.push(`${path.slug}: has no steps`)
  }

  const seen = new Set<string>()
  for (const step of path.steps) {
    if (!known.has(step.blockId)) {
      problems.push(`${path.slug}: step "${step.blockId}" is not a block`)
    }
    if (seen.has(step.blockId)) {
      // Not fatal in principle, but always a mistake in practice — a path
      // that lists the same block twice is a copy-paste slip.
      problems.push(`${path.slug}: step "${step.blockId}" appears twice`)
    }
    seen.add(step.blockId)

    for (const alt of step.alternatives ?? []) {
      if (!known.has(alt)) {
        problems.push(`${path.slug}: alternative "${alt}" (of ${step.blockId}) is not a block`)
      }
    }
  }
}

// Slugs are URLs; a duplicate silently shadows one of the pages.
const slugs = PATHS.map((p) => p.slug)
for (const slug of new Set(slugs)) {
  if (slugs.filter((s) => s === slug).length > 1) problems.push(`duplicate slug "${slug}"`)
}

const steps = PATHS.reduce((n, p) => n + p.steps.length, 0)
console.log(`check-paths: ${PATHS.length} paths, ${steps} steps`)

if (problems.length > 0) {
  console.error(`\ncheck-paths: ${problems.length} problem(s)`)
  for (const p of problems) console.error(`  ✗ ${p}`)
  process.exit(1)
}

console.log('check-paths: every step resolves.')
