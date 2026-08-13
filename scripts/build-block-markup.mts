// Render every block to static HTML at build time.
//
// Why this is a build step and not a function:
//
//   Next's App Router refuses an import of `react-dom/server` — "render or
//   return the content directly as a Server Component instead". That is the
//   right rule for pages, and it makes rendering a component *to a string*
//   at request time impossible inside the app.
//
//   It is also unnecessary. The block catalog is fixed per deploy, so the
//   markup is fixed per deploy too. Rendering all 76 blocks once at build
//   and serving the strings is strictly better than doing it per request:
//   no react-dom/server anywhere in the app graph, nothing to cache, and
//   the detail page stays a static render.
//
// This is the same split as `build-artifact-sources.mjs` — a plain Node
// pass that produces JSON the app imports — and it runs in the same
// prebuild step. Written as .mts and run through `tsx` because unlike that
// script it has to *execute* the catalog's TSX, not just read it.
//
// Run: npm run build:markup

import { cloneElement, isValidElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { BLOCK_CATALOG } from '../src/lib/blocks/catalog.ts'
import { getBlockPreview } from '../src/lib/blocks/registry.tsx'
import { formatHtml } from '../src/lib/export/html-parse.ts'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'src', 'lib', 'blocks', 'generated-block-markup.json')

const markup: Record<string, string> = {}
const missing: string[] = []

for (const block of BLOCK_CATALOG) {
  const preview = getBlockPreview(block.previewComponent)
  if (!preview) {
    missing.push(block.id)
    continue
  }

  // The registry renders a few blocks with `embedded` so a grid of live
  // previews cannot steal scroll or focus from the page hosting it. This
  // export is the opposite case — it is pasted into a page of its own, and
  // should carry the real component's `autofocus`. Keyed off the prop
  // actually being set, so a block that adopts the flag later is covered
  // without anyone updating a list here.
  const real =
    isValidElement<{ embedded?: boolean }>(preview) && 'embedded' in preview.props
      ? cloneElement(preview, { embedded: false })
      : preview

  try {
    // `renderToStaticMarkup`, not `renderToString`: nothing hydrates this,
    // and the bookkeeping attributes would be noise in something a human
    // is about to paste.
    markup[block.id] = formatHtml(renderToStaticMarkup(real))
  } catch (err) {
    // A block that throws on render is a real bug, but it should not take
    // the whole build down over an export format — the block still works
    // in React, which is how it actually ships.
    missing.push(`${block.id} (render failed: ${(err as Error).message})`)
  }
}

writeFileSync(out, `${JSON.stringify(markup, null, 2)}\n`, 'utf8')

const bytes = JSON.stringify(markup).length
console.log(
  `build-block-markup: ${Object.keys(markup).length} blocks, ${(bytes / 1024).toFixed(1)} KB`,
)

if (missing.length > 0) {
  // Loud, but not fatal. A missing preview already shows as a visible
  // placeholder on the detail page; this is the same fact, earlier.
  console.warn(`build-block-markup: no markup for ${missing.length}: ${missing.join(', ')}`)
}
