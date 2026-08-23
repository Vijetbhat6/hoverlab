/**
 * Guards the catalog against duplicate element ids.
 *
 * /blocks, /pages and /templates each render every artifact in their tier
 * into one document. A block that hard-codes `id="newsletter-email"` is
 * therefore fine on its own detail page and invalid the moment two pages
 * carrying it land on the same index — which is what happened: three
 * copies of `newsletter-email` and two of `promo-code` on /pages, so a
 * <label> resolved to whichever input rendered first and a screen reader
 * announced the wrong field.
 *
 * The fix was React.useId() in every reusable source. This is the check
 * that keeps it fixed, because the failure is invisible in the one place
 * anyone looks at a block: its own page, where there is only one of it.
 *
 * Run: npx tsx scripts/check-duplicate-ids.mts
 *
 * Note this cannot be an ordinary page test: all three routes sit behind
 * the login gate in proxy.ts, so there is nothing to fetch. It renders the
 * registries directly instead.
 */

import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { BLOCK_PREVIEWS } from '../src/lib/blocks/registry'
import { PAGE_PREVIEWS, getPagePreview } from '../src/lib/pages/registry'
import { TEMPLATE_INDEX } from '../src/lib/templates/template-index'

interface Surface {
  route: string
  previews: Record<string, React.ReactNode>
}

/**
 * /templates has no registry of its own — each card thumbnails the first
 * page of the template — so its surface is assembled the same way the
 * card does it. See template-card.tsx.
 */
const templateSurface: Record<string, React.ReactNode> = {}
for (const t of TEMPLATE_INDEX) {
  const pageId = t.previewPageId ?? t.routes[0]?.pageId
  const preview = pageId ? getPagePreview(pageId) : undefined
  if (preview) templateSurface[t.id] = preview
}

const SURFACES: Surface[] = [
  { route: '/blocks', previews: BLOCK_PREVIEWS },
  { route: '/pages', previews: PAGE_PREVIEWS },
  { route: '/templates', previews: templateSurface },
]

let failed = 0

for (const { route, previews } of SURFACES) {
  const html = renderToStaticMarkup(
    React.createElement(
      'div',
      null,
      ...Object.entries(previews).map(([key, node]) =>
        React.createElement('section', { key }, node),
      ),
    ),
  )

  const counts = new Map<string, number>()
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) {
    counts.set(m[1], (counts.get(m[1]) ?? 0) + 1)
  }

  const dupes = [...counts].filter(([, n]) => n > 1)
  // A label pointing at an id nothing renders is the same bug seen from
  // the other end, so check it here rather than in a second pass.
  const orphans = [...html.matchAll(/\sfor="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((f) => !counts.has(f))

  const artifacts = Object.keys(previews).length
  if (dupes.length === 0 && orphans.length === 0) {
    console.log(
      `  ok   ${route.padEnd(12)} ${artifacts} artifacts, ${counts.size} unique ids`,
    )
    continue
  }

  failed++
  console.log(`  FAIL ${route.padEnd(12)} ${artifacts} artifacts`)
  for (const [id, n] of dupes) console.log(`         duplicate id "${id}" x${n}`)
  for (const f of orphans) console.log(`         <label for="${f}"> matches no element`)
}

if (failed > 0) {
  console.log(
    `\n${failed} surface(s) with id collisions. Use React.useId() in the source rather than a literal.`,
  )
  process.exit(1)
}

console.log('\nNo duplicate ids across the catalog.')
