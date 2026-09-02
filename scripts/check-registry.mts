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
//   5. Every effect's CSS converts to the nested object the schema wants,
//      with nothing the converter could not read. An effect that half
//      converts installs and renders wrong, which is worse than one that
//      refuses to publish.
//   6. Effect ids do not collide with block or page ids — all three share
//      the registry's one namespace.
//   7. Every guided path publishes as an installable pack: unique slug,
//      every step a real block, and no artifact squatting the `path-`
//      prefix those packs are addressed by.
//   8. Every design preset resolves to a complete token set, and the
//      `preset-` names it is addressed by are not squatted by an artifact.
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
import { EFFECTS } from '../src/lib/effects.ts'
import { PATHS } from '../src/lib/paths/catalog.ts'
import { DESIGN_PRESETS, presetRegistryItem } from '../src/lib/registry/presets.ts'
import { unresolvedLocalImports } from '../src/lib/registry/deps.ts'
import { cssToObject } from '../src/lib/registry/css-to-object.ts'

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

/* -- effects convert ----------------------------------------------------- */

/*
  Effects ship as a `css` object rather than as files, so the conversion is
  the packaging — and a conversion failure is invisible until somebody
  installs the effect into their own project and it renders wrong.

  Only "could not read" fails the build. A repeated declaration is a known
  and documented fidelity loss (the cascade would have discarded the earlier
  value anyway) and is reported by the unit tests rather than here.
*/
for (const effect of EFFECTS) {
  const { css, warnings } = cssToObject(effect.css ?? '', effect.id)
  const unreadable = warnings.filter((w) => w.includes('could not read'))

  if (unreadable.length) {
    failures.push(`effect "${effect.id}" has CSS the registry converter cannot read: ${unreadable[0]}`)
  }
  if (Object.keys(css).length === 0) {
    failures.push(`effect "${effect.id}" converts to an empty rule set — it would install nothing.`)
  }
}

const effectIds = new Set(EFFECTS.map((e) => e.id))
for (const block of BLOCK_CATALOG) {
  if (effectIds.has(block.id)) {
    failures.push(`block "${block.id}" collides with an effect of the same id; the registry addresses both by bare id.`)
  }
}
for (const page of PAGE_CATALOG) {
  if (effectIds.has(page.id)) {
    failures.push(`page "${page.id}" collides with an effect of the same id; the registry addresses both by bare id.`)
  }
}

/* -- preview coverage ---------------------------------------------------- */

/*
  Every block needs an entry in BLOCK_PREVIEWS, and nothing else was checking.

  A block can be fully valid everywhere else — source present, catalog entry
  present, shadcn registry item resolvable, a11y and motion audits clean — and
  still render an empty preview card, because the map in `blocks/registry.tsx`
  is a plain `Record<string, React.ReactNode>` and a missing key is a
  `undefined` lookup rather than a type error. That is exactly how
  order-tracking-timeline shipped past a full prebuild with no preview.

  Read as text rather than imported. Importing the map would pull every block
  source — and therefore React, lucide-react and every client component — into
  a node script whose only question is whether a string appears as a key.
*/
const previewSource = readFileSync(join(root, 'src/lib/blocks/registry.tsx'), 'utf8')
const previewKeys = new Set(
  [...previewSource.matchAll(/^\s*'([a-z0-9-]+)':\s*</gm)].map((m) => m[1]!),
)

for (const block of BLOCK_CATALOG) {
  if (!previewKeys.has(block.previewComponent)) {
    failures.push(
      `block "${block.id}" has no entry in BLOCK_PREVIEWS — its detail page and card would render empty.`,
    )
  }
}

/* -- guided paths publish as packs -------------------------------------- */

/*
  Paths are published as `path-{slug}` items whose only content is a list of
  registryDependencies. Two ways that can be wrong, both silent:

    An artifact id beginning `path-` would be routed to the path branch of
    `buildRegistryItem` and return null — a 404 on a name the index itself
    advertises.

    A path step naming a block that does not exist would publish a pack
    whose install half-fails in a stranger's project. `check-paths.mts`
    already refuses that, but it runs against the *site*; this runs against
    what is published, and the two are worth checking separately.
*/
const blockIds = new Set(BLOCK_CATALOG.map((b) => b.id))
const pathSlugs = new Set<string>()

for (const path of PATHS) {
  if (pathSlugs.has(path.slug)) {
    failures.push(`two guided paths share the slug "${path.slug}"; they would publish as one item.`)
  }
  pathSlugs.add(path.slug)

  for (const step of path.steps) {
    if (!blockIds.has(step.blockId)) {
      failures.push(
        `path "${path.slug}" installs "${step.blockId}", which is not a published block.`,
      )
    }
  }
}

for (const artifact of [...BLOCK_CATALOG, ...PAGE_CATALOG, ...EFFECTS]) {
  if (artifact.id.startsWith('path-')) {
    failures.push(
      `"${artifact.id}" starts with "path-", the prefix reserved for guided-path packs; it would be unreachable by name.`,
    )
  }
}

/* -- presets are complete ------------------------------------------------ */

/*
  A preset is a whole design system in one install, which makes an
  incomplete one worse than a missing one: it applies cleanly, changes some
  of the project, and leaves the rest reading against whatever was there
  before. Nothing about that looks like a failure from the CLI's side.

  Three things are checked, and the first is the one that bites. Tailwind v4
  reads `--spacing` and the `--text-*` ramp from `@theme`, so those have to
  land in `cssVars.theme`; declared under `light` they would set custom
  properties that no utility ever looks at, apply without error, and do
  nothing at all.
*/
const presetNames = new Set<string>()

for (const preset of DESIGN_PRESETS) {
  if (presetNames.has(preset.name)) {
    failures.push(`two presets share the name "${preset.name}"; they would publish as one item.`)
  }
  presetNames.add(preset.name)

  const item = presetRegistryItem(preset)

  for (const scope of ['light', 'dark'] as const) {
    if (Object.keys(item.cssVars[scope]).length === 0) {
      failures.push(`preset "${preset.name}" declares no ${scope} tokens.`)
    }
  }

  for (const variable of ['--radius', '--spacing', '--text-base']) {
    if (!item.cssVars.theme[variable]) {
      failures.push(
        `preset "${preset.name}" is missing ${variable} from cssVars.theme — ` +
          'Tailwind reads the ramp and the spacing unit from @theme, so it would install and do nothing.',
      )
    }
  }
}

for (const artifact of [...BLOCK_CATALOG, ...PAGE_CATALOG, ...EFFECTS]) {
  if (presetNames.has(artifact.id)) {
    failures.push(
      `"${artifact.id}" collides with a design preset of the same name; the preset would win the lookup and the artifact would 404.`,
    )
  }
}

/* -- report ------------------------------------------------------------- */

if (failures.length) {
  console.error(`\nregistry check failed — ${failures.length} problem(s):\n`)
  for (const f of failures) console.error(`  ✗ ${f}`)
  console.error('')
  process.exit(1)
}

console.log(
  `registry check: ${PATHS.length} path packs + ${BLOCK_CATALOG.length} blocks + ` +
    `${PAGE_CATALOG.length} pages + ${EFFECTS.length} effects + ` +
    `${DESIGN_PRESETS.length} presets + 1 base, all resolvable`,
)
