/**
 * Every tool that has a readable permalink, in one place.
 *
 * Two consumers, and they are the reason this file exists rather than each
 * page importing its own spec and nothing tying them together:
 *
 *   The sitemap, which needs the curated hrefs across all six tools. Those
 *   URLs are the half of this feature a crawler ever sees — see the
 *   canonical rule in `tool-page-metadata.ts` — so if they are not listed
 *   here they are not indexed anywhere.
 *
 *   `permalink.test.ts`, which round-trips every curated entry through the
 *   codec for all six tools at once. A per-tool test would pass on five
 *   tools and miss the sixth the day somebody adds one.
 *
 * The specs are deliberately NOT keyed into a `Record<string, …>` registry.
 * Each is `ToolPermalink<its own state>`, and a map would have to erase
 * that to a common type — which costs every server page its inference and
 * buys nothing, since each page imports exactly one spec by name.
 */

import { galleryHrefs } from '@/lib/tools/permalink'
import { CONTRAST_PERMALINK } from '@/lib/tools/permalinks/contrast'
import { GRADIENT_PERMALINK } from '@/lib/tools/permalinks/gradient'
import { PALETTE_PERMALINK } from '@/lib/tools/permalinks/palette'
import { SHADOW_PERMALINK } from '@/lib/tools/permalinks/shadow'
import { TOKENS_PERMALINK } from '@/lib/tools/permalinks/tokens'
import { TYPOGRAPHY_PERMALINK } from '@/lib/tools/permalinks/typography'

/**
 * One entry per tool, erased to the shape the cross-tool consumers need.
 *
 * `unknown` rather than `any` for the state parameter: nothing in this list
 * reads a state, it only asks each spec for hrefs and counts, so the type
 * parameter genuinely is not needed here — and `any` would quietly turn off
 * checking for anyone who later reached deeper.
 */
export const TOOL_PERMALINKS = [
  { href: PALETTE_PERMALINK.href, hrefs: galleryHrefs(PALETTE_PERMALINK) },
  { href: TOKENS_PERMALINK.href, hrefs: galleryHrefs(TOKENS_PERMALINK) },
  { href: GRADIENT_PERMALINK.href, hrefs: galleryHrefs(GRADIENT_PERMALINK) },
  { href: SHADOW_PERMALINK.href, hrefs: galleryHrefs(SHADOW_PERMALINK) },
  { href: TYPOGRAPHY_PERMALINK.href, hrefs: galleryHrefs(TYPOGRAPHY_PERMALINK) },
  { href: CONTRAST_PERMALINK.href, hrefs: galleryHrefs(CONTRAST_PERMALINK) },
] as const

/**
 * Every curated permalink across every tool, as site-relative hrefs —
 * except the ones that ARE a tool's bare URL.
 *
 * Most galleries include the tool's own defaults, because that state
 * deserves a card: it is the one everybody starts in, and a grid that
 * skipped it would be a list of alternatives to something unnamed. But
 * `toolQuery` omits fields at their default, so that entry's href is just
 * `/tools/palette` — which the sitemap already lists, at a higher priority,
 * from `DESIGNER_TOOLS`.
 *
 * Filtered here rather than in the sitemap so the rule lives next to the
 * thing that causes it. Without it the file emitted five `<loc>` entries
 * twice, with two different priorities — which is not fatal, and is exactly
 * the kind of contradictory signal that teaches a crawler to discount the
 * field.
 */
export const CURATED_PERMALINK_HREFS: string[] = TOOL_PERMALINKS.flatMap((t) =>
  t.hrefs.filter((href) => href.includes('?')),
)
