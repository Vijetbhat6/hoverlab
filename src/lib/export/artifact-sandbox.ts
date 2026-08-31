/**
 * Turning a catalog artifact into a runnable StackBlitz project.
 *
 * `stackblitz.ts` knows how to assemble a project; this knows what each
 * tier of the catalog is made of. Kept apart because the assembly is pure
 * string work and this half has to reach into three separate generated
 * source maps.
 *
 * ── WHY TEMPLATES ARE NOT HERE ──────────────────────────────────────────
 *
 * They are the obvious next case: a template already *is* a complete Next
 * project, so it would need no scaffold at all — the shortest code path of
 * the three. It is deliberately absent because six of the seven templates
 * are the Pro product, and a sandbox is a full file dump by definition. An
 * "Open in StackBlitz" button on a Pro template would hand over every byte
 * of the thing the licence is sold for, to anyone, with no account.
 *
 * Blocks and pages carry no such gate — the catalog is public, the source
 * is on the page already, and `npx hoverlab add` writes the same file — so
 * a sandbox gives away nothing that a reader could not already take. That
 * asymmetry is the whole reason this file enumerates levels rather than
 * accepting any artifact id.
 *
 * If templates ever get a sandbox it must be entitlement-checked at the
 * route, not here: see `lib/billing/require-pro.ts`.
 */

import blockSources from '@/lib/blocks/generated-block-sources.json'
import pageSources from '@/lib/pages/generated-page-sources.json'
import { getBlock } from '@/lib/blocks/blocks'
import { getPage } from '@/lib/pages/pages'
import { PAGE_CATALOG } from '@/lib/pages/catalog'
import {
  exportedComponent,
  stackblitzReactForm,
  type ReactSandboxInput,
  type SandboxFile,
} from '@/lib/export/stackblitz'
import type { SandboxForm } from '@/lib/sandbox'

/** The tiers a sandbox can be built for. Templates are excluded — see above. */
export const SANDBOX_LEVELS = ['block', 'page'] as const
export type SandboxLevel = (typeof SANDBOX_LEVELS)[number]

export function isSandboxLevel(value: string): value is SandboxLevel {
  return (SANDBOX_LEVELS as readonly string[]).includes(value)
}

type SourceMap = Record<string, { path: string; lang: string; source: string }[]>

const BLOCK_SOURCES = blockSources as SourceMap
const PAGE_SOURCES = pageSources as SourceMap

/**
 * Block ids imported by a block source.
 *
 * Nearly every block imports `react` and `lucide-react` and no part of this
 * codebase — that is a property the catalog maintains on purpose. Two do
 * not: `code-showcase` pulls in `@/components/faq-accordion`, and
 * `product-buy-box` pulls in `./product-grid`. Neither declares it in
 * `deps` or `files`, because the catalog has no field that could express
 * "another block".
 *
 * So it is read out of the source. Both import shapes appear in the two
 * real cases and both are handled; anything else resolves to an id that is
 * not in the catalog and is ignored, which is the right answer for
 * `lucide-react`.
 */
function blockImportsOf(source: string): string[] {
  const ids: string[] = []

  for (const [, spec] of source.matchAll(
    /(?:^|\n)\s*import[^'"\n]*from\s*['"](?:@\/components\/|\.\/)([\w-]+)['"]/g,
  )) {
    if (spec in BLOCK_SOURCES) ids.push(spec)
  }

  return ids
}

/**
 * Files for one block: the artifact, plus any block it imports.
 *
 * Breadth-first over `blockImportsOf`, with a seen-set because a cycle
 * would otherwise hang the request rather than fail it. The seed order is
 * preserved so the caller can still treat the first file as the entry.
 */
function blockFiles(id: string, seen = new Set<string>()): SandboxFile[] {
  const out: SandboxFile[] = []
  const queue = [id]

  while (queue.length > 0) {
    const next = queue.shift()!
    if (seen.has(next)) continue
    seen.add(next)

    for (const file of BLOCK_SOURCES[next] ?? []) {
      out.push({ path: file.path, source: file.source })
      queue.push(...blockImportsOf(file.source))
    }
  }

  return out
}

/**
 * Files for one page: the page, plus every block it renders.
 *
 * A page source is a composition — twelve `@/components/…` imports and
 * almost no markup of its own — so shipping it alone produces a project
 * that fails to resolve on the first import. `composedOf` is the catalog's
 * own record of what it renders, which is why the page tier keeps that
 * field rather than parsing imports back out of the source.
 */
function pageFiles(id: string): SandboxFile[] {
  const meta = PAGE_CATALOG.find((page) => page.id === id)
  if (!meta) return []

  const files = (PAGE_SOURCES[id] ?? []).map((file) => ({
    path: file.path,
    source: file.source,
  }))

  /*
   * One `seen` set across the whole page, for two reasons. Pages routinely
   * render the same block twice, and a composed block may itself import a
   * block the page also lists — `product-detail-page` does both. Without a
   * shared set the project would carry duplicate file entries, and the last
   * one written would win silently.
   */
  const seen = new Set<string>()
  for (const blockId of meta.composedOf) {
    files.push(...blockFiles(blockId, seen))
  }

  return files
}

export interface ArtifactSandbox {
  form: SandboxForm
  /** Path the editor opens on, for the button's title attribute. */
  openFile: string
}

/**
 * The StackBlitz payload for one artifact, or null if it cannot be built.
 *
 * Null rather than a thrown error or a best guess: the caller's right
 * response is to not render the button, and every null here is a real
 * condition — an unknown id, a tier without sources, or a source whose
 * exported component could not be identified. A button that opens a
 * project which fails to compile is worse than no button.
 */
export function buildArtifactSandbox(
  level: SandboxLevel,
  id: string,
  siteUrl?: string,
): ArtifactSandbox | null {
  const meta = level === 'block' ? getBlock(id) : getPage(id)
  if (!meta) return null

  const files = level === 'block' ? blockFiles(id) : pageFiles(id)
  if (files.length === 0) return null

  /*
   * The entry is the artifact's own file, which is the first one the
   * catalog lists. For a page that matters: the composed blocks were
   * appended after it, so "first" is the page and not one of its parts.
   */
  const entry = files[0]
  const component = exportedComponent(entry.source)
  if (!component) return null

  const input: ReactSandboxInput = {
    id,
    name: meta.name,
    description: meta.description,
    files,
    componentName: component.name,
    entryIsDefault: component.isDefault,
    entryPath: entry.path,
    sourceUrl: siteUrl ? `${siteUrl}/${level}/${id}` : undefined,
  }

  return { form: stackblitzReactForm(input), openFile: `src/${entry.path}` }
}
