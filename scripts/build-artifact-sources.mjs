/**
 * Inline every block's and page's source into JSON at build time.
 *
 * The sources under src/lib/{blocks,pages}/sources/ are real components: the
 * preview renders them, so what a visitor sees and what they copy can never
 * drift. But the detail page also has to *show* that source, and reading
 * .tsx files off disk at request time is a bet that the deployment bundler
 * traced them into the serverless function — a bet that fails silently and
 * only on production cold paths.
 *
 * So the text is inlined here instead, the same way the effect catalog is
 * built. Two outputs per tier, mirroring the effects split:
 *
 *   generated-<tier>-sources.json   full text, server-only, grows with catalog
 *   generated-<tier>-stats.json     id -> line count, client-safe, ~1 KB
 *
 * Was `build-block-sources.mjs`; generalized when the pages tier landed,
 * because the mechanism is identical and a second copy would have drifted.
 *
 * Run via `npm run build:artifacts` (wired into prebuild).
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const libDir = join(here, '..', 'src', 'lib')

/**
 * One rung of the ladder. `dir` is the folder under src/lib, `singular`
 * names the generated files, and `copyDir` is where a user is told to drop
 * the file — pages land beside routes, blocks beside components.
 */
const TIERS = [
  /*
   * Primitives land in `components/ui/`, not `components/`, because that is
   * where shadcn's CLI puts the controls they sit beside — a segmented
   * control next to a button, not next to a pricing section. The path is
   * also what the detail page tells the visitor to create, so it has to
   * match the convention their project already has.
   */
  { dir: 'primitives', singular: 'primitive', copyDir: 'components/ui' },
  { dir: 'blocks', singular: 'block', copyDir: 'components' },
  { dir: 'pages', singular: 'page', copyDir: 'app' },
  // Templates are projects, not components: each one is a directory of
  // scaffolding under `files/<id>/`, plus everything in `files/_shared/`.
  // See `readTemplateFiles`.
  { dir: 'templates', singular: 'template', multiFile: true },
]

/**
 * Rewrite Hoverlab's internal block paths to the path a buyer will have.
 *
 * A page source imports its blocks. Inside this repo those blocks live at
 * `@/lib/blocks/sources/pricing-tiers` — which is what makes the preview
 * render the real component rather than a copy, and is the whole reason
 * preview and source cannot drift. But that path is meaningless in someone
 * else's project: they will have pasted the block at
 * `components/pricing-tiers.tsx`, which is exactly where the block detail
 * page told them to put it.
 *
 * So the preview keeps the internal path and the *shipped text* gets the
 * external one. Rewriting on the way out is the only place this can happen
 * without either breaking the preview or shipping a path that resolves to
 * nothing.
 */
function rewriteImports(source) {
  return source.replace(/@\/lib\/blocks\/sources\//g, '@/components/')
}

/** Language tag from a file extension, for syntax highlighting. */
function langOf(path) {
  const ext = path.includes('.') ? path.split('.').pop() : ''
  if (['mjs', 'cjs'].includes(ext)) return 'js'
  // Extensionless dotfiles (`gitignore`) fall through to markdown, which
  // highlights comments and nothing else — the right result for them.
  return ['tsx', 'ts', 'jsx', 'js', 'css', 'json', 'html'].includes(ext) ? ext : 'md'
}

/** Every file under `dir`, recursively, as paths relative to `dir`. */
function walk(dir, prefix = '') {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...walk(join(dir, entry.name), rel))
    else out.push(rel)
  }
  return out
}

/**
 * A template's authored scaffolding: everything in `files/_shared/` plus
 * everything in `files/<id>/`.
 *
 * Shared files are the design tokens and the Tailwind config — identical
 * across templates, and the thing that makes a pasted block look right at
 * all. Authoring them once and merging here beats three copies that drift
 * the first time a token is renamed.
 *
 * A template-specific file WINS over a shared one of the same path, so a
 * template can override the theme without the shared copy being deleted.
 *
 * Note what is *not* here: the page and block sources. Those are assembled
 * at runtime in `templates.ts`, where the page and block catalogs are real
 * typed imports rather than something this script would have to re-parse.
 */
function readTemplateFiles(filesDir, id) {
  const merged = new Map()

  for (const dir of [join(filesDir, '_shared'), join(filesDir, id)]) {
    if (!existsSync(dir)) continue
    for (const rel of walk(dir)) {
      merged.set(rel, {
        path: rel,
        lang: langOf(rel),
        source: rewriteImports(readFileSync(join(dir, rel), 'utf8')),
      })
    }
  }

  return [...merged.values()].sort((a, b) => a.path.localeCompare(b.path))
}

let grandTotal = 0

for (const tier of TIERS) {
  const tierDir = join(libDir, tier.dir)
  // Single-file tiers keep one .tsx per artifact in `sources/`; multi-file
  // tiers keep a directory per artifact in `files/`.
  const sourcesDir = join(tierDir, tier.multiFile ? 'files' : 'sources')

  // A tier may not exist yet in an older checkout — skip rather than fail,
  // so this script stays runnable mid-migration.
  if (!existsSync(sourcesDir)) {
    console.log(`build-artifact-sources: no ${tier.dir} sources — skipped`)
    continue
  }

  /* ---------------------------------------------------------------- *
   *  Read the catalog's ids without importing it
   * ---------------------------------------------------------------- *
   * catalog.ts is TypeScript with type-only imports, so this plain-node
   * script cannot require() it. Pulling the ids out with a regex is enough
   * to cross-check the two lists, and keeps the script dependency-free —
   * the alternative is dragging tsx into a step that runs on every build.
   */
  const catalogSrc = readFileSync(join(tierDir, 'catalog.ts'), 'utf8')
  const catalogIds = [...catalogSrc.matchAll(/^\s{4}id: '([a-z0-9-]+)',$/gm)].map((m) => m[1])

  if (catalogIds.length === 0) {
    throw new Error(
      `build-artifact-sources: parsed 0 ids out of ${tier.dir}/catalog.ts — has its shape changed?`,
    )
  }

  /* ---------------------------------------------------------------- *
   *  Pair each id with its source file
   * ---------------------------------------------------------------- */

  const sourceIds = tier.multiFile
    ? readdirSync(sourcesDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && e.name !== '_shared')
        .map((e) => e.name)
    : readdirSync(sourcesDir)
        .filter((f) => f.endsWith('.tsx'))
        .map((f) => f.replace(/\.tsx$/, ''))

  /*
   * Fail the build on either kind of mismatch. An entry whose source is
   * missing renders an empty code panel; a source with no catalog entry is
   * invisible in the grid. Both are the sort of thing that ships unnoticed
   * and is then found by a user, so they are errors, not warnings.
   */
  const orphanEntries = catalogIds.filter((id) => !sourceIds.includes(id))
  const orphanSources = sourceIds.filter((id) => !catalogIds.includes(id))

  if (orphanEntries.length || orphanSources.length) {
    const lines = [`build-artifact-sources: ${tier.dir} catalog and sources/ are out of sync.`]
    if (orphanEntries.length) {
      lines.push(`  in catalog.ts with no sources/<id>.tsx: ${orphanEntries.join(', ')}`)
    }
    if (orphanSources.length) {
      lines.push(`  in sources/ with no catalog.ts entry:   ${orphanSources.join(', ')}`)
    }
    throw new Error(lines.join('\n'))
  }

  /* ---------------------------------------------------------------- *
   *  Emit
   * ---------------------------------------------------------------- */

  const sources = {}
  const stats = {}

  for (const id of catalogIds) {
    if (tier.multiFile) {
      // Paths are already relative to the project root the user will
      // create, so no copyDir prefix applies.
      const files = readTemplateFiles(sourcesDir, id)
      sources[id] = files
      stats[id] = {
        lines: files.reduce((n, f) => n + f.source.split('\n').length, 0),
        files: files.length,
      }
      continue
    }

    const source = rewriteImports(readFileSync(join(sourcesDir, `${id}.tsx`), 'utf8'))

    const files = [
      {
        // Relative to wherever the user drops it. `components/` and `app/`
        // are the conventions every framework's docs assume, so they are
        // the least surprising defaults for a copy target.
        path: `${tier.copyDir}/${id}.tsx`,
        lang: 'tsx',
        source,
      },
    ]

    /*
      An artifact that imports a sibling ships that sibling with it.

      Almost every primitive is one self-contained file, and the tier's
      promise is "paste this and it works". `device-showcase` is the case
      that promise did not cover: it is an *arrangement* of `<LaptopFrame>`
      and `<PhoneFrame>`, so its whole value is that it composes them, and
      inlining two frames to keep the file count at one would duplicate
      three hundred lines to satisfy a rule rather than a reader.

      So the rule it actually has to satisfy is the honest one — every
      relative import resolves to a file shipped alongside it — and the
      sibling list is derived from the imports rather than declared in the
      catalog, so it cannot go stale when somebody adds or drops one.

      One hop only, and deliberately: a sibling that itself composed
      siblings would be a dependency graph, and a tier whose paste target is
      a graph is a block. `primitives.test.ts` holds that line.
    */
    for (const [, sibling] of source.matchAll(/from\s+'\.\/([\w-]+)'/g)) {
      const siblingPath = join(sourcesDir, `${sibling}.tsx`)
      if (!existsSync(siblingPath)) continue
      if (files.some((f) => f.path === `${tier.copyDir}/${sibling}.tsx`)) continue
      files.push({
        path: `${tier.copyDir}/${sibling}.tsx`,
        lang: 'tsx',
        source: rewriteImports(readFileSync(siblingPath, 'utf8')),
      })
    }

    sources[id] = files

    stats[id] = {
      lines: files.reduce((n, f) => n + f.source.split('\n').length, 0),
      files: files.length,
    }
  }

  writeFileSync(
    join(tierDir, `generated-${tier.singular}-sources.json`),
    `${JSON.stringify(sources, null, 0)}\n`,
  )
  writeFileSync(
    join(tierDir, `generated-${tier.singular}-stats.json`),
    `${JSON.stringify(stats, null, 2)}\n`,
  )

  // Sum every file, not just `files[0]` — templates carry ten apiece, and
  // counting only the first made the log under-report them by ~5x.
  const bytes = Object.values(sources).reduce(
    (n, files) => n + files.reduce((m, f) => m + f.source.length, 0),
    0,
  )
  grandTotal += catalogIds.length
  console.log(
    `build-artifact-sources: ${catalogIds.length} ${tier.dir}, ${(bytes / 1024).toFixed(1)} KB inlined`,
  )
}

console.log(`build-artifact-sources: ${grandTotal} artifacts total`)
