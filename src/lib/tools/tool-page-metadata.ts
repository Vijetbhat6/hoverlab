/**
 * The metadata half of a tool permalink — server-only.
 *
 * Split from `permalink.ts` because that module is imported by client
 * components and this one reaches `lib/site`, which reads server-only
 * environment variables and says so in its own docblock.
 *
 * ── THE CANONICAL RULE, AND WHY IT IS NOT "INDEX EVERYTHING" ────────────
 *
 * A query string over ten numeric fields is an infinite URL space. Pointing
 * a crawler at all of it would not produce a thousand ranking pages, it
 * would produce a crawl trap — thousands of near-identical documents
 * competing with each other and with the tool itself, which is the textbook
 * way to make a good page rank worse.
 *
 * So the rule has two halves:
 *
 *   A permalink that matches one of the tool's CURATED entries is a
 *   document. It is self-canonical, it is listed in the sitemap, it is
 *   linked from the tool page itself, and its title says what it contains.
 *   There are between eight and twelve per tool and they are chosen to
 *   answer real queries — "white on blue contrast", "golden ratio type
 *   scale", "neumorphic box shadow".
 *
 *   Any other permalink is a VARIANT. It works identically, it unfurls with
 *   a real title in a chat client, and its canonical points at the tool's
 *   bare URL — the same treatment `/browse?level=` gets, and the same
 *   treatment `/builder` gives every composition.
 *
 * Both halves get the descriptive title and OG tags, because those are
 * worth having whether or not a crawler is ever going to see the page: the
 * first audience for a shared permalink is a person looking at a link
 * preview in Slack, and "Palette Generator — Hoverlab" tells them nothing
 * about the palette they were just sent.
 */

import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/designer-tools'
import { absoluteUrl } from '@/lib/site'
import {
  matchingGalleryEntry,
  parseToolState,
  toolHref,
  type SearchParams,
  type ToolPermalink,
} from '@/lib/tools/permalink'

export function toolPageMetadata<T extends object>(
  spec: ToolPermalink<T>,
  params: SearchParams,
): Metadata {
  const base = toolMetadata(spec.href)
  const { state, fromLink } = parseToolState(spec, params)

  // A bare visit is the tool page it always was, byte for byte. Nothing
  // about this feature should change what /tools/palette already ranks for.
  if (!fromLink) return base

  const { title, description } = spec.describe(state)
  const href = toolHref(spec, state)
  const curated = matchingGalleryEntry(spec, state) !== null
  const canonical = curated ? href : spec.href

  return {
    ...base,
    title,
    description,
    alternates: { canonical },
    openGraph: {
      ...base.openGraph,
      title,
      description,
      url: absoluteUrl(href),
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}
