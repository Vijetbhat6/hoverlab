import { LEVEL_LABEL, type ArtifactLevel } from '@/lib/artifact-types'
import { catalogWaves, formatAdded } from '@/lib/recency'
import { absoluteUrl } from '@/lib/site'

/**
 * The email that goes out when something lands in the catalog.
 *
 * ── WHAT WAS MISSING, AND IT WAS NOT THE ADDRESSES ──────────────────────
 *
 * Every signup form on this site works and stores consent, three written
 * sequences sit in `lib/sequences.ts`, and `/api/newsletter` has mirrored to
 * Resend since the day it was written. What none of that produced is the one
 * email the list was actually promised. Read the consent text this site has
 * been recording against every signup:
 *
 *   "…then only mail when something is added."
 *
 * That is a promise to send a specific message on a specific trigger, and
 * until this file existed there was nothing that could compose it. The list
 * was being collected against an email nobody could send.
 *
 * ── WHY IT IS COMPOSED FROM THE LEDGER AND NOT WRITTEN BY HAND ──────────
 *
 * The same reason /changelog and /feed.xml are: the recency ledger is
 * derived from git, so it records what actually shipped rather than what
 * somebody remembered to mention. A hand-written "what's new" email is the
 * one surface where a quiet fortnight is most tempting to paper over, and
 * this is the shape where that is not possible — a fortnight with nothing in
 * it composes to `null` and no email goes out.
 *
 * That is the single most important behaviour in this file. `composeDigest`
 * returning null is a normal, expected answer, and the sender treats it as
 * "there is nothing to say" rather than as a failure. A newsletter that
 * mails on a schedule regardless of whether it has news is how a list learns
 * to ignore you, and it would also break the promise above in the other
 * direction: the consent says mail me when something is added, not weekly.
 *
 * ── PURE, AND TESTED, BECAUSE IT IS UNUSUALLY HARD TO EYEBALL ───────────
 *
 * Nothing here sends, reads an environment variable, or touches a network.
 * It turns a watermark date into an email or into null, which means the
 * interesting cases — an empty window, a window with one item, a window
 * spanning several waves — are testable without a sending key and without
 * mailing anybody. `scripts/send-catalog-digest.mts` is the part that has
 * side effects, and it is deliberately thin.
 */

export interface DigestSection {
  level: ArtifactLevel
  /** Human label, pluralised for the count. */
  heading: string
  /** Ids in the window, newest first, capped — see SAMPLE_PER_LEVEL. */
  sample: { id: string; url: string }[]
  /** How many landed on this rung in total, which may exceed `sample`. */
  total: number
}

export interface Digest {
  subject: string
  /** Plain text. The only format the sequences in `lib/sequences.ts` use. */
  text: string
  /** Exclusive lower bound — everything after this date is in the digest. */
  since: string
  /** The newest date included. */
  until: string
  /** Total artifacts across every rung. */
  itemCount: number
  sections: DigestSection[]
}

/**
 * How many ids get named per rung.
 *
 * A wave here can be forty blocks or two hundred and fifty-six effects, and
 * an email listing two hundred and fifty-six of anything is not read. Six is
 * enough to show the range and to make the link worth clicking, and the
 * count beside them tells the truth about the rest.
 */
const SAMPLE_PER_LEVEL = 6

/** Where a reader lands for each rung. Deep-linked, not dumped at the home page. */
const LEVEL_PATH: Record<ArtifactLevel, string> = {
  effect: '/effect',
  primitive: '/primitive',
  block: '/block',
  page: '/page',
  template: '/template',
}

/** Catalog index per rung, for the "see all" line under each section. */
const LEVEL_INDEX: Record<ArtifactLevel, string> = {
  effect: '/library',
  primitive: '/primitives',
  block: '/blocks',
  page: '/pages',
  template: '/templates',
}

/**
 * "1 new block" / "40 new blocks", from the labels the rest of the site uses.
 *
 * Lower-cased from `LEVEL_LABEL` rather than written out again here: the
 * plural of every rung already exists in one place, and a second copy is a
 * second thing to update the day a rung is renamed.
 */
function heading(level: ArtifactLevel, count: number): string {
  const label = LEVEL_LABEL[level]
  return `${count} new ${(count === 1 ? label.one : label.many).toLowerCase()}`
}

/**
 * An id as a reader-facing name.
 *
 * Derived from the id rather than looked up in the catalog, and that is a
 * deliberate trade. Importing five catalogs here would pull the entire
 * artifact tree — every block source, every page composition — into a script
 * whose job is to write a hundred lines of text, and would make this module
 * unimportable from anywhere light. `hero-split` reading as "Hero split" is
 * a small loss against that; the link beside it carries the real name.
 */
function titleise(id: string): string {
  const words = id.replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * Everything added strictly after `since`, as an email, or null if nothing was.
 *
 * `since` is exclusive so that running the sender twice with the same
 * watermark cannot mail the same wave twice — the second run finds an empty
 * window and composes null. That is the property that makes the watermark
 * safe to advance only on a successful send.
 */
export function composeDigest(since: string, now = new Date()): Digest | null {
  const today = now.toISOString().slice(0, 10)

  const waves = catalogWaves().filter((wave) => wave.date > since && wave.date <= today)
  if (waves.length === 0) return null

  // Group across waves: two block waves three days apart are one "new blocks"
  // section in an email, not two. The page-level grouping in `catalogWaves`
  // is right for a changelog, which is chronological, and wrong here.
  const byLevel = new Map<ArtifactLevel, string[]>()
  for (const wave of waves) {
    const ids = byLevel.get(wave.level)
    if (ids) ids.push(...wave.ids)
    else byLevel.set(wave.level, [...wave.ids])
  }

  // Ladder order, not insertion order — an email that opens with templates
  // and ends with effects reads as a list; this reads as a catalog.
  const ORDER: ArtifactLevel[] = ['effect', 'primitive', 'block', 'page', 'template']

  const sections: DigestSection[] = ORDER.filter((level) => byLevel.has(level)).map(
    (level) => {
      const ids = byLevel.get(level) as string[]
      return {
        level,
        heading: heading(level, ids.length),
        total: ids.length,
        sample: ids.slice(0, SAMPLE_PER_LEVEL).map((id) => ({
          id,
          url: absoluteUrl(`${LEVEL_PATH[level]}/${id}`),
        })),
      }
    },
  )

  const itemCount = sections.reduce((sum, section) => sum + section.total, 0)
  const until = waves.reduce((newest, wave) => (wave.date > newest ? wave.date : newest), since)

  /*
    The subject names the biggest rung and the total.

    Not "What's new at Hoverlab" — a subject line that would be identical
    every time is a subject line that stops being read, and this one has real
    information available to it. "40 new blocks, and 4 other things" tells
    somebody whether to open it.
  */
  const biggest = sections.reduce((a, b) => (b.total > a.total ? b : a))
  const others = itemCount - biggest.total
  const subject =
    others > 0
      ? `${biggest.heading}, and ${others} other ${others === 1 ? 'thing' : 'things'}`
      : biggest.heading

  const lines: string[] = [
    `Since ${formatAdded(since) ?? since}, ${itemCount} ${itemCount === 1 ? 'thing' : 'things'} landed in the catalog.`,
    '',
  ]

  for (const section of sections) {
    lines.push(section.heading.toUpperCase())
    for (const item of section.sample) {
      lines.push(`  ${titleise(item.id)} — ${item.url}`)
    }
    if (section.total > section.sample.length) {
      lines.push(
        `  …and ${section.total - section.sample.length} more: ${absoluteUrl(LEVEL_INDEX[section.level])}`,
      )
    }
    lines.push('')
  }

  lines.push(
    'Everything above installs free and the source is on the page. Pro sells the',
    'commercial licence, not access.',
    '',
    `The full list, with dates: ${absoluteUrl('/changelog')}`,
    '',
    // The promise this email exists to keep, restated where it is easy to act
    // on. `/api/newsletter/unsubscribe?token=…` is one GET with no login, and
    // the sender substitutes the per-subscriber token.
    'You are getting this because you asked to hear when something was added.',
    'Unsubscribe: {{unsubscribe_url}}',
  )

  return {
    subject,
    text: lines.join('\n'),
    since,
    until,
    itemCount,
    sections,
  }
}
