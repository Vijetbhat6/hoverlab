/**
 * /feed.xml — the changelog as Atom.
 *
 * `/changelog` was the only thing on this site a returning visitor could
 * come back *for*, and the only way to subscribe to it was to hand over an
 * email address. For an audience of developers that is the wrong ask and
 * the wrong medium: a feed reader costs them nothing, reveals nothing, and
 * is checked without anyone having to remember to check it. The newsletter
 * stays — this is its machine-readable twin, built from exactly the same
 * ledger, so the two can never disagree about what shipped.
 *
 * Atom rather than RSS 2.0 because the dates are unambiguous (RFC 3339,
 * required, rather than RSS's optional and famously mis-implemented
 * pubDate) and because every reader that speaks RSS speaks Atom.
 *
 * One entry per wave — per (day, rung) — which is the same grouping the
 * changelog page renders. A wave that added 256 effects and 45 blocks is
 * two pieces of news, and collapsing them to one entry per day would lose
 * which rung grew, which is the only thing a subscriber cares about.
 */

import { EFFECTS } from '@/lib/effects'
import { BLOCK_CATALOG } from '@/lib/blocks/catalog'
import { PAGE_CATALOG } from '@/lib/pages/catalog'
import { TEMPLATE_CATALOG } from '@/lib/templates/catalog'
import { LEVEL_LABEL, type ArtifactLevel } from '@/lib/artifact-types'
import { CATALOG_UPDATED_AT, catalogWaves } from '@/lib/recency'
import { absoluteUrl } from '@/lib/site'

/** Ids carry no names; the catalogs do. Same lookup as the changelog page. */
const NAMES: Record<ArtifactLevel, Map<string, string>> = {
  effect: new Map(EFFECTS.map((e) => [e.id, e.name])),
  block: new Map(BLOCK_CATALOG.map((b) => [b.id, b.name])),
  page: new Map(PAGE_CATALOG.map((p) => [p.id, p.name])),
  template: new Map(TEMPLATE_CATALOG.map((t) => [t.id, t.name])),
}

/** Where one artifact lives, so an entry links to something and not nothing. */
const PATH: Record<ArtifactLevel, string> = {
  effect: '/effect',
  block: '/block',
  page: '/page',
  template: '/template',
}

/** How many artifacts an entry names before it falls back to a count. */
const SAMPLES = 12

/** Entries older than this are not news any more, and the file has a size. */
const MAX_ENTRIES = 60

/**
 * The five characters XML cannot carry raw.
 *
 * Artifact names are ours rather than user input, but "Do's & Don'ts" is a
 * perfectly ordinary block name and an unescaped ampersand makes the whole
 * document unparseable — a feed reader shows nothing at all rather than one
 * broken entry, so this is not a place to rely on the data being tame.
 */
function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** A ledger date (YYYY-MM-DD) as the RFC 3339 timestamp Atom requires. */
function rfc3339(date: string): string {
  return `${date}T00:00:00Z`
}

export const dynamic = 'force-static'

export function GET(): Response {
  const waves = catalogWaves().slice(0, MAX_ENTRIES)

  const entries = waves
    .map((wave) => {
      const count = wave.ids.length
      const noun = (
        count === 1 ? LEVEL_LABEL[wave.level].one : LEVEL_LABEL[wave.level].many
      ).toLowerCase()
      const title = `${count} new ${noun}`

      const named = wave.ids
        .slice(0, SAMPLES)
        .map((id) => ({ id, name: NAMES[wave.level].get(id) }))
        // An id with no name is an artifact that has since been removed from
        // the catalog while its ledger row remains. Linking to it would be a
        // 404 in someone's feed reader, so it is dropped from the list rather
        // than rendered as a dead entry.
        .filter((item): item is { id: string; name: string } => Boolean(item.name))

      const items = named
        .map(
          (item) =>
            `&lt;li&gt;&lt;a href="${xml(
              absoluteUrl(`${PATH[wave.level]}/${item.id}`),
            )}"&gt;${xml(item.name)}&lt;/a&gt;&lt;/li&gt;`,
        )
        .join('')

      const more =
        count > named.length
          ? `&lt;p&gt;…and ${count - named.length} more.&lt;/p&gt;`
          : ''

      /*
        The id has to be stable and globally unique for the lifetime of the
        feed — a reader keys "have I shown this already" on it. Derived from
        the date and the rung, which is exactly what makes a wave a wave, so
        re-generating the feed never resurfaces an entry someone has read.
      */
      const id = `tag:hoverlab.dev,${wave.date}:${wave.level}`

      return `  <entry>
    <title>${xml(title)}</title>
    <link rel="alternate" type="text/html" href="${xml(absoluteUrl('/changelog'))}"/>
    <id>${xml(id)}</id>
    <updated>${rfc3339(wave.date)}</updated>
    <category term="${xml(wave.level)}"/>
    <content type="html">&lt;p&gt;${xml(
      `${count} ${noun} added to the Hoverlab catalog.`,
    )}&lt;/p&gt;&lt;ul&gt;${items}&lt;/ul&gt;${more}</content>
  </entry>`
    })
    .join('\n')

  const body = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Hoverlab — what's new in the catalog</title>
  <subtitle>Every effect, block, page and template added to Hoverlab, dated from the repository history rather than hand-maintained.</subtitle>
  <link rel="self" type="application/atom+xml" href="${xml(absoluteUrl('/feed.xml'))}"/>
  <link rel="alternate" type="text/html" href="${xml(absoluteUrl('/changelog'))}"/>
  <id>${xml(absoluteUrl('/'))}</id>
  <updated>${rfc3339(CATALOG_UPDATED_AT)}</updated>
  <author><name>Hoverlab</name></author>
${entries}
</feed>
`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      // The catalog changes on deploy, not on request. A day of browser
      // cache with a week of stale-while-revalidate keeps readers that poll
      // hourly off the origin without ever showing them a stale feed for
      // long after a wave lands.
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
