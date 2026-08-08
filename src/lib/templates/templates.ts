/**
 * The full template catalog, with every file of every generated project.
 *
 * ⚠️  SERVER / BUILD-TIME USE ONLY. Client components should import
 * `./template-index` instead.
 *
 * This is the module that makes a template a project rather than a list of
 * links. A template's file tree is assembled from three sources:
 *
 *   1. scaffolding   inlined from `./files/` by the build script —
 *                    layout, globals.css, tailwind config, package.json
 *   2. pages         each route's page source, placed at `route.file`
 *   3. blocks        every block those pages import, at `components/`
 *
 * Only (1) is inlined by the script. (2) and (3) are grafted on here
 * because this is where `PAGES` and `BLOCKS` are real typed imports — the
 * script would have to re-parse two more catalogs with regexes to know
 * which blocks a page uses, and would silently emit an incomplete project
 * the first time that parsing drifted.
 *
 * Assembling here also means the three tiers cannot disagree. Add a block
 * to a page and every template containing that page grows the file on its
 * next render, with no third place to update.
 */

import 'server-only'

import { TEMPLATE_CATALOG } from './catalog'
import GENERATED_SOURCES from './generated-template-sources.json'
import { PAGES } from '../pages/pages'
import { BLOCKS } from '../blocks/blocks'
import type { ArtifactFile } from '../artifact-types'
import type { Template, TemplateCategory } from './template-types'

const scaffolding = GENERATED_SOURCES as Record<string, ArtifactFile[]>

const PAGE_BY_ID = new Map(PAGES.map((p) => [p.id, p]))
const BLOCK_BY_ID = new Map(BLOCKS.map((b) => [b.id, b]))

/**
 * Every distinct block id reachable from a set of page ids.
 *
 * Deduped, because a template that has both a dashboard and a customer list
 * pulls `dashboard-shell` twice and must ship it once.
 */
function blockIdsFor(pageIds: string[]): string[] {
  const seen = new Set<string>()
  for (const pageId of pageIds) {
    for (const blockId of PAGE_BY_ID.get(pageId)?.composedOf ?? []) {
      seen.add(blockId)
    }
  }
  return [...seen]
}

/** Scaffolding + one file per route + one file per distinct block. */
function assembleFiles(record: (typeof TEMPLATE_CATALOG)[number]): ArtifactFile[] {
  const files: ArtifactFile[] = [...(scaffolding[record.id] ?? [])]

  // Pages, at the path the route table says they occupy.
  for (const route of record.routes) {
    const page = PAGE_BY_ID.get(route.pageId)
    const source = page?.files[0]?.source
    if (!source) continue
    files.push({ path: route.file, lang: 'tsx', source })
  }

  // Blocks, at the path the page sources already import them from.
  for (const blockId of blockIdsFor(record.routes.map((r) => r.pageId))) {
    const file = BLOCK_BY_ID.get(blockId)?.files[0]
    if (!file) continue
    files.push(file)
  }

  // Generated last, because it describes the tree above it. Assembled here
  // rather than added by the zip builder so the archive, the "What you get"
  // list and the download button's count can never disagree.
  files.push({
    path: 'GETTING-STARTED.md',
    lang: 'md',
    source: gettingStarted(record, files),
  })

  return files.sort((a, b) => a.path.localeCompare(b.path))
}

/**
 * A short orientation file, separate from the template's own README.
 *
 * The README describes the project. This describes the *download* — where
 * the code came from, what the folders mean, and where to go to read one
 * section on its own. Merging them would bury the project's own
 * documentation under provenance notes the moment the user opens it.
 */
function gettingStarted(
  record: (typeof TEMPLATE_CATALOG)[number],
  files: ArtifactFile[],
): string {
  const routes = record.routes
    .map((r) => `| \`${r.path}\` | ${r.label} | \`${r.file}\` |`)
    .join('\n')

  const blockCount = files.filter((f) => f.path.startsWith('components/')).length

  return `# ${record.name}

${record.description}

## Run it

\`\`\`bash
npm install
npm run dev
\`\`\`

Then open http://localhost:3000.

## Routes

| Path | Screen | File |
| ---- | ------ | ---- |
${routes}

## What is in here

\`\`\`
app/            ${record.routes.length} routes, the root layout and the theme tokens
components/     ${blockCount} blocks the routes are assembled from
\`\`\`

Each file in \`components/\` is a self-contained section. They take props
with sensible defaults, so every one of them renders standalone before you
wire anything up.

## The two files that matter most

- **\`app/globals.css\`** — the design tokens. Every block styles itself with
  \`bg-card\` and \`text-muted-foreground\` rather than literal colours, so
  changing a value here moves the whole project.
- **\`tailwind.config.ts\`** — maps those variables onto the class names.
  This file and \`globals.css\` are a pair; neither works alone.

## Where this came from

Built from Hoverlab's block and page catalogs. Every section in
\`components/\` has its own page with a live preview and an explanation of
how it works, if you want to read one on its own.

Nothing here phones home, and there is no Hoverlab dependency — this is
your code now.
`
}

export const TEMPLATES: Template[] = TEMPLATE_CATALOG.map((t) => ({
  ...t,
  level: 'template' as const,
  files: assembleFiles(t),
  composedOf: [...new Set(t.routes.map((r) => r.pageId))],
}))

/** How many templates exist. */
export const TEMPLATE_COUNT = TEMPLATES.length

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]))

/** Look up a single template by id. Returns undefined for unknown ids. */
export function getTemplate(id: string): Template | undefined {
  return BY_ID.get(id)
}

/** Templates in one category, in catalog order. */
export function templatesInCategory(category: TemplateCategory): Template[] {
  return TEMPLATES.filter((t) => t.category === category)
}

/**
 * A template's files grouped by top-level folder, for the file tree.
 *
 * Root-level files (package.json, tailwind.config.ts, README.md) are
 * bucketed under `'/'` so they sort together above the folders rather than
 * each forming a group of one.
 */
export function filesByFolder(template: Template): Array<[string, ArtifactFile[]]> {
  const groups = new Map<string, ArtifactFile[]>()

  for (const file of template.files) {
    const slash = file.path.indexOf('/')
    const folder = slash === -1 ? '/' : file.path.slice(0, slash)
    const list = groups.get(folder)
    if (list) list.push(file)
    else groups.set(folder, [file])
  }

  return [...groups.entries()].sort(([a], [b]) => {
    if (a === '/') return -1
    if (b === '/') return 1
    return a.localeCompare(b)
  })
}
