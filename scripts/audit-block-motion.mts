// Reduced-motion audit for the block and page catalogs.
//
// `test-motion-guard.mts` and `audit-motion-guard.mts` both check effects,
// and neither can say anything about a block. Effects are CSS: a guard is
// appended when the catalog is assembled, and the question is whether its
// selector list reaches every animated rule. Blocks are React components
// styled with Tailwind utilities, with no generated guard at all — the
// question is whether the *author* wrote one.
//
// Why this cannot be a browser test:
//
//   The site mounts <ReducedMotionProvider>, which injects a global rule
//   zeroing animation-duration and iteration-count across the document.
//   So every block preview on hoverlab.app respects reduced motion no
//   matter what the block's own classes say — screenshotting the site
//   would pass a block that ships completely unguarded.
//
//   The artifact is the source, not the preview. What ships is the text a
//   visitor pastes into a project that has no such provider. So the audit
//   reads `generated-block-sources.json` — the exact bytes served by the
//   detail page, the API and the zip — rather than rendering anything.
//
// The rule, and why it is not "no animation under reduced motion":
//
//   Decorative loops (a logo marquee, a skeleton shimmer) must not run:
//   they are pure motion with no informational content, and they are the
//   vestibular trigger the preference exists for. Those want a
//   `motion-safe:` gate, so nothing runs unless motion is welcome.
//
//   Status spinners are different. Freezing one leaves a stopped spinner
//   next to "Signing in", which reads as a hung request — removing the
//   feedback rather than the discomfort. Those want degrading, not
//   stopping: `motion-reduce:[animation-duration:...]` slows the rotation
//   while keeping it legible as progress.
//
//   So a violation is an infinite animation utility with *neither* form of
//   handling anywhere in the file.
//
// Run: npm run audit:motion:blocks

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const libDir = join(here, '..', 'src', 'lib')

/** One file of a shipped artifact, as the build script writes it. */
interface SourceFile {
  path: string
  lang: string
  source: string
}

/**
 * Tailwind utilities that produce an unbounded animation.
 *
 * The four named ones are `infinite` in Tailwind's own definitions.
 * `animate-[…]` is the arbitrary form, which is how both existing guarded
 * blocks declare their keyframes — matched broadly and then checked for
 * `infinite`, since an arbitrary one-shot is not a concern.
 */
const NAMED_INFINITE = /\banimate-(spin|pulse|bounce|ping)\b/g
const ARBITRARY = /\banimate-\[([^\]]*)\]/g

/** Either accepted form of handling. */
const MOTION_SAFE = /\bmotion-safe:/
const MOTION_REDUCE = /\bmotion-reduce:/
const MEDIA_QUERY = /prefers-reduced-motion/

interface Finding {
  artifact: string
  file: string
  utilities: string[]
}

function animatedUtilities(source: string): string[] {
  const found = new Set<string>()

  for (const m of source.matchAll(NAMED_INFINITE)) found.add(m[0])
  for (const m of source.matchAll(ARBITRARY)) {
    // An arbitrary animation that is not infinite runs once and stops; it
    // is not what the preference is about.
    if (m[1]?.includes('infinite')) found.add(m[0])
  }

  return [...found]
}

function auditTier(tier: 'block' | 'page'): Finding[] {
  const path = join(libDir, `${tier}s`, `generated-${tier}-sources.json`)
  const catalog = JSON.parse(readFileSync(path, 'utf8')) as Record<string, SourceFile[]>

  const findings: Finding[] = []

  for (const [id, files] of Object.entries(catalog)) {
    for (const file of files) {
      const utilities = animatedUtilities(file.source)
      if (utilities.length === 0) continue

      // Handling is checked per file, not per element: the guard may sit on
      // a wrapper or in a sibling class string, and a file-level check is
      // the honest granularity for a static pass. It can miss a file that
      // guards one animation and not another — which is why the message
      // names the utilities rather than claiming the file is clean.
      const guarded =
        MOTION_SAFE.test(file.source) ||
        MOTION_REDUCE.test(file.source) ||
        MEDIA_QUERY.test(file.source)

      if (!guarded) findings.push({ artifact: id, file: file.path, utilities })
    }
  }

  return findings
}

const findings = [...auditTier('block'), ...auditTier('page')]

const scanned = (['block', 'page'] as const).map((tier) => {
  const path = join(libDir, `${tier}s`, `generated-${tier}-sources.json`)
  return Object.keys(JSON.parse(readFileSync(path, 'utf8'))).length
})

console.log(
  `Audited ${scanned[0]} blocks and ${scanned[1]} pages for unguarded infinite animation.\n`,
)

if (!findings.length) {
  console.log('No unguarded animation found.')
  process.exit(0)
}

for (const f of findings) {
  console.log(`✗ ${f.artifact}`)
  console.log(`    ${f.file} — ${f.utilities.join(', ')}`)
  console.log(
    '    Add motion-safe: to gate a decorative loop, or motion-reduce:[animation-duration:…] to slow a status spinner.\n',
  )
}

console.log(`${findings.length} unguarded ${findings.length === 1 ? 'file' : 'files'}.`)
process.exit(1)
