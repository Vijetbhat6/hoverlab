/**
 * Inline every shader effect's source, and derive its preview markup.
 *
 *   npx tsx scripts/build-shader-sources.mts
 *
 * Two outputs, mirroring the split the block tier makes:
 *
 *   generated-shader-sources.json   the files a buyer copies, server-only
 *   generated-shader-markup.json    html + fallback css, client-safe, ~9 KB
 *
 * WHY THE MARKUP IS GENERATED
 *
 * A shader effect's preview markup is a `<canvas data-hoverlab-shader>` and
 * a stylesheet whose only real content is a gradient standing in for the
 * design when WebGL is unavailable. Hand-writing that gradient would be a
 * second copy of the design's palette, living in a different file from the
 * palette, describing a state nobody on the team ever sees. It would be
 * wrong within a month and nothing would notice.
 *
 * So the fallback is computed from the program's own palettes, through the
 * same `fallbackBackground()` the React surface calls. Retune a palette and
 * the fallback follows it on the next build; there is no second place to
 * remember.
 *
 * WHY THE SOURCE IS INLINED
 *
 * The same reason `build-artifact-sources.mjs` gives: reading `.tsx` off
 * disk at request time is a bet that the deployment bundler traced the file
 * into the serverless function, and that bet fails silently on production
 * cold paths only.
 *
 * Run via `npm run build:shaders`, wired into `prebuild`.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SHADER_CATALOG } from '../src/lib/shaders/catalog.ts'
import { SHADER_PROGRAMS } from '../src/lib/shaders/registry.ts'
import { fallbackBackground } from '../src/lib/shaders/runtime.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const SHADER_DIR = join(HERE, '..', 'src', 'lib', 'shaders')

/**
 * The two files every shader effect ships alongside its own.
 *
 * `from` is where the file lives here; `to` is where the buyer is told to
 * put it, and therefore what the rewritten imports have to resolve to.
 * Shared deliberately: the second shader somebody adds is one new file,
 * because they already have these.
 */
const SHARED = [
  { from: 'runtime.ts', to: 'components/shader-runtime.ts', lang: 'ts' },
  { from: 'shader-surface.tsx', to: 'components/shader-surface.tsx', lang: 'tsx' },
] as const

/**
 * Rewrite this repo's internal paths to the ones a buyer will have.
 *
 * Identical in spirit to `rewriteImports` in `build-artifact-sources.mjs`:
 * the preview keeps the internal path, so it cannot drift from the source,
 * and the *shipped text* gets the external one.
 */
function rewriteImports(source: string): string {
  return source
    .replace(/from '\.\.\/shader-surface'/g, "from './shader-surface'")
    .replace(/from '\.\.\/runtime'/g, "from './shader-runtime'")
    .replace(/from '\.\/runtime'/g, "from './shader-runtime'")
}

function read(relative: string): string {
  return readFileSync(join(SHADER_DIR, relative), 'utf8')
}

/* ------------------------------------------------------------------ *
 *  The catalog and the registry have to agree
 * ------------------------------------------------------------------ */

const programs = new Map(SHADER_PROGRAMS.map((p) => [p.id, p]))
const problems: string[] = []

for (const record of SHADER_CATALOG) {
  const program = programs.get(record.id)
  if (!program) {
    problems.push(`catalog record "${record.id}" has no program in registry.ts`)
    continue
  }
  if (program.kind !== record.renderer) {
    problems.push(
      `"${record.id}" is catalogued as ${record.renderer} but its program is ${program.kind}`,
    )
  }
}

const catalogued = new Set(SHADER_CATALOG.map((r) => r.id))
for (const program of SHADER_PROGRAMS) {
  if (!catalogued.has(program.id)) {
    problems.push(`program "${program.id}" is in registry.ts but not in catalog.ts`)
  }
}

if (problems.length > 0) {
  console.error('[build-shader-sources] catalog and registry disagree:')
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}

/* ------------------------------------------------------------------ *
 *  Markup
 * ------------------------------------------------------------------ */

/**
 * The preview surface for one design.
 *
 * `align-self: stretch` and `flex: 1 1 auto` are what let one stylesheet
 * serve three differently shaped preview boxes. Every surface that renders
 * effect markup is a centring flex container — the card at `h-40`, the
 * static card at `min-h-[180px]`, the detail stage at whatever
 * `stageMinHeight` says — and a shader wants to fill its box rather than
 * sit in the middle of it at some intrinsic size it does not have. Outside
 * a flex container both properties are inert and `min-height` carries it.
 */
function surfaceCss(id: string, light: string, dark: string): string {
  const cls = `.fx-${id}`
  return `${cls} {
  position: relative;
  align-self: stretch;
  flex: 1 1 auto;
  width: 100%;
  min-height: 9rem;
  overflow: hidden;
  border-radius: 0.75rem;
  /* Shown until the shader's first frame, and permanently if WebGL is
     unavailable. Derived from the program's palette, not typed twice. */
  background: ${light};
}

${cls} > canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.dark ${cls} {
  background: ${dark};
}
`
}

interface EmittedFile {
  path: string
  lang: string
  source: string
}

const markup: Record<string, { html: string; css: string; lines: number }> = {}

/**
 * The runtime and the surface are stored once, not once per effect.
 *
 * Every shader effect ships the same two shared files, and the obvious
 * encoding — a complete `files[]` per id — wrote them fifteen times and
 * turned a 50 KB artifact into 516 KB. `shaders.ts` joins `own` to `shared`
 * at module load, which is one array concat per effect and gives every
 * consumer the same complete `files[]` it would have had.
 */
const sources: { shared: EmittedFile[]; own: Record<string, EmittedFile> } = {
  shared: SHARED.map((f) => ({
    path: f.to,
    lang: f.lang,
    source: rewriteImports(read(f.from)),
  })),
  own: {},
}

for (const record of SHADER_CATALOG) {
  const program = programs.get(record.id)!
  const own = rewriteImports(read(join('sources', `${record.id}.tsx`)))

  markup[record.id] = {
    html: `<div class="fx-${record.id}"><canvas data-hoverlab-shader="${record.id}" aria-hidden="true"></canvas></div>`,
    css: surfaceCss(
      record.id,
      fallbackBackground(program.light),
      fallbackBackground(program.dark),
    ),
    lines: own.split('\n').length,
  }

  sources.own[record.id] = {
    path: `components/${record.id}.tsx`,
    lang: 'tsx',
    source: own,
  }
}

writeFileSync(
  join(SHADER_DIR, 'generated-shader-markup.json'),
  `${JSON.stringify(markup, null, 2)}\n`,
)
writeFileSync(
  join(SHADER_DIR, 'generated-shader-sources.json'),
  `${JSON.stringify(sources, null, 2)}\n`,
)

const bytes = (o: unknown) => `${(JSON.stringify(o).length / 1024).toFixed(1)} KB`
console.log(
  [
    `[build-shader-sources] ${SHADER_CATALOG.length} shader effects`,
    `  markup  : ${bytes(markup)}  (client-safe)`,
    `  sources : ${bytes(sources)}  (server only)`,
  ].join('\n'),
)
