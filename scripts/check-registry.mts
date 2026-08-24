// Fail the build if the shadcn registry would publish something broken.
//
// A registry is a promise made to a stranger's build. `npx shadcn add
// @hoverlab/saas-landing-page` runs in someone else's project, writes files
// into it, and the first thing they see if we got it wrong is a TypeScript
// error in code they did not write. None of that surfaces here, because in
// this repo every import resolves — the block imports `@/components/navbar-simple`
// and finds it, because we have one.
//
// So the checks below are all "would this still be true somewhere else":
//
//   1. Every local import a published item makes resolves to another
//      published item. An import of `@/components/site-header` is fine here
//      and fatal there.
//   2. Block and page ids do not collide. They share one namespace in the
//      registry, and a collision silently makes one unreachable.
//   3. Every page source has a default export. `registry:page` writes a
//      route file, and a route file without a default export is a build
//      error in Next.
//   4. The generated token file exists and is not empty, so `registry:base`
//      actually carries a theme.
//
// Deliberately NOT imported from `src/lib/registry/registry.ts` — that module
// is `server-only`, which throws outside a React Server Component. The rules
// live in `src/lib/registry/deps.ts`, which both sides import, so this check
// and the served registry cannot drift apart.
//
// Run: npm run check:registry (wired into prebuild)

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { BLOCK_CATALOG } from '../src/lib/blocks/catalog.ts'
import { PAGE_CATALOG } from '../src/lib/pages/catalog.ts'
import { unresolvedLocalImports } from '../src/lib/registry/deps.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

type Sources = Record<string, Array<{ path: string; lang: string; source: string }>>

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(join(root, rel), 'utf8')) as T
}

const blockSources = readJson<Sources>('src/lib/blocks/generated-block-sources.json')
const pageSources = readJson<Sources>('src/lib/pages/generated-page-sources.json')

const failures: string[] = []

/* -- 1. every local import resolves to a published item ----------------- */

const known = new Set<string>([
  ...BLOCK_CATALOG.map((b) => b.id),
  ...PAGE_CATALOG.map((p) => p.id),
])

const artifacts = [
  ...BLOCK_CATALOG.map((b) => ({ id: b.id, sources: (blockSources[b.id] ?? []).map((f) => f.source) })),
  ...PAGE_CATALOG.map((p) => ({ id: p.id, sources: (pageSources[p.id] ?? []).map((f) => f.source) })),
]

for (const { item, unresolved } of unresolvedLocalImports(artifacts, known)) {
  failures.push(
    `${item} imports "${unresolved}", which the registry cannot serve. ` +
      'Either add it to the catalog or inline it into the source.',
  )
}

/* -- 2. ids do not collide across tiers --------------------------------- */

const pageIds = new Set(PAGE_CATALOG.map((p) => p.id))
for (const block of BLOCK_CATALOG) {
  if (pageIds.has(block.id)) {
    failures.push(`id "${block.id}" is used by both a block and a page; the registry addresses both by bare id.`)
  }
}

/* -- 3. pages are routable ---------------------------------------------- */

for (const page of PAGE_CATALOG) {
  const files = pageSources[page.id] ?? []
  if (files.length === 0) {
    failures.push(`page "${page.id}" has no source; registry:page needs a file to write.`)
    continue
  }
  if (!files.some((f) => /export\s+default/.test(f.source))) {
    failures.push(`page "${page.id}" has no default export; it ships as a route file and Next needs one.`)
  }
}

/* -- 4. registry:base carries a theme ----------------------------------- */

try {
  const tokens = readJson<{ light: Record<string, string>; dark: Record<string, string> }>(
    'src/lib/registry/generated-tokens.json',
  )
  if (!tokens.light || Object.keys(tokens.light).length === 0) {
    failures.push('generated-tokens.json has no light theme; run npm run build:registry.')
  }
  if (!tokens.dark || Object.keys(tokens.dark).length === 0) {
    failures.push('generated-tokens.json has no dark theme; run npm run build:registry.')
  }
} catch {
  failures.push('src/lib/registry/generated-tokens.json is missing; run npm run build:registry.')
}

/* -- report ------------------------------------------------------------- */

if (failures.length) {
  console.error(`\nregistry check failed — ${failures.length} problem(s):\n`)
  for (const f of failures) console.error(`  ✗ ${f}`)
  console.error('')
  process.exit(1)
}

console.log(
  `registry check: ${BLOCK_CATALOG.length} blocks + ${PAGE_CATALOG.length} pages + 1 base, all resolvable`,
)
