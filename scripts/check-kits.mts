// Verify every kit points at artifacts that exist.
//
// A kit is hand-written prose referencing ids by hand across all four
// catalogs, which is exactly the kind of data that rots silently: rename a
// block, and the kit keeps rendering with an item that 404s — on a page
// whose whole job is to say "here is everything you need". `resolve.ts`
// drops an unknown id rather than rendering a broken row, which is right at
// runtime and would hide the mistake forever without this.
//
// Same guarantee check-paths.mts gives the guided paths, one rung wider.
//
// Run: npm run check:kits  (wired into prebuild)

import { KITS } from '../src/lib/kits/catalog.ts'
import { BLOCK_CATALOG } from '../src/lib/blocks/catalog.ts'
import { PAGE_CATALOG } from '../src/lib/pages/catalog.ts'
import { TEMPLATE_CATALOG } from '../src/lib/templates/catalog.ts'
import { EFFECT_INDEX } from '../src/lib/effect-index.ts'

const known: Record<string, Set<string>> = {
  blocks: new Set(BLOCK_CATALOG.map((b) => b.id)),
  pages: new Set(PAGE_CATALOG.map((p) => p.id)),
  templates: new Set(TEMPLATE_CATALOG.map((t) => t.id)),
  effects: new Set(EFFECT_INDEX.map((e) => e.id)),
}

const problems: string[] = []
let items = 0

for (const kit of KITS) {
  // Blocks are the substance of a kit. One with only a template is a link
  // to the template, and one with only effects is a mood board.
  if (kit.contents.blocks.length === 0) {
    problems.push(`${kit.slug}: has no blocks`)
  }

  for (const field of ['templates', 'pages', 'blocks', 'effects'] as const) {
    const ids = kit.contents[field] ?? []
    const seen = new Set<string>()

    for (const id of ids) {
      items += 1
      if (!known[field].has(id)) {
        problems.push(`${kit.slug}: ${field} "${id}" does not exist`)
      }
      if (seen.has(id)) {
        problems.push(`${kit.slug}: ${field} "${id}" appears twice`)
      }
      seen.add(id)
    }
  }
}

// Slugs are URLs; a duplicate silently shadows one of the pages.
const slugs = KITS.map((k) => k.slug)
for (const slug of new Set(slugs)) {
  if (slugs.filter((s) => s === slug).length > 1) problems.push(`duplicate slug "${slug}"`)
}

console.log(`check-kits: ${KITS.length} kits, ${items} items`)

if (problems.length > 0) {
  console.error(`\ncheck-kits: ${problems.length} problem(s)`)
  for (const p of problems) console.error(`  ✗ ${p}`)
  process.exit(1)
}

console.log('check-kits: every item resolves.')
