/**
 * <LogoSegments> — customer logos grouped by the industry they are in.
 *
 * An undifferentiated logo wall answers "are you real". It does not answer
 * the question an enterprise buyer is actually asking, which is "have you
 * done this for someone like me" — and on an ungrouped wall they answer it
 * by scanning twenty names for one they recognise from their own sector, and
 * usually giving up. Two names under a heading that says `Healthcare` does
 * more work than twenty names under no heading at all.
 *
 * It is also the honest shape for an uneven customer base. Most companies
 * are strong in one vertical and thin in two others, and a flat wall hides
 * that in a way the first sales call immediately un-hides. Showing four
 * logos under one segment and two under another is a claim that survives the
 * meeting, and it tells a buyer in the thin segment that they would be
 * early — which for some of them is the reason to buy.
 *
 * Structured as a <dl>: each segment name is a term and its logos are its
 * description, so the grouping is real to a screen reader rather than being
 * a visual accident of where the headings sit. A wall of <ul>s under <h3>s
 * would look identical and carry none of that.
 *
 * `count` is separate from the logos on purpose. A segment usually has more
 * customers than it has logos cleared for use, and "and 40 more" is both
 * true and stronger than silently showing six.
 *
 * Text wordmarks by default, matching <LogoGrid> and <LogoStrip>.
 */

import * as React from 'react'

export interface LogoSegment {
  name: string
  /** Wordmarks, or any node — an <img>, an inline <svg>. */
  logos: React.ReactNode[]
  /** e.g. "and 40 more" — for customers who exist but cannot be named. */
  count?: string
}

export interface LogoSegmentsProps {
  eyebrow?: string
  heading?: string
  subheading?: string
  segments?: LogoSegment[]
  className?: string
}

const DEFAULT_SEGMENTS: LogoSegment[] = [
  {
    name: 'Financial services',
    logos: ['Fieldstone', 'Meridian Capital', 'Umbra', 'Halden Trust'],
    count: 'and 40 more',
  },
  {
    name: 'Healthcare',
    logos: ['Alcove Health', 'Coastline', 'Lumon Care'],
    count: 'and 18 more',
  },
  {
    name: 'Logistics',
    logos: ['Northwind Freight', 'Vandelay', 'Portside'],
    count: 'and 12 more',
  },
  {
    name: 'Public sector',
    logos: ['City of Ravel', 'Kestrel Authority'],
  },
]

/*
  A stable id suffix derived from this instance's own heading.

  `useId` is the right answer and is not available here: this is a server
  component and hooks are not. The heading is what differs when a section is
  used twice on one page, so hashing it gives each copy its own
  `aria-labelledby` target without a hook, a prop or a counter — and it
  stays stable across server and client renders, which a counter would not.
*/
function instanceId(...parts: (string | undefined)[]): string {
  const text = parts.filter(Boolean).join('|')
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0
  return (hash >>> 0).toString(36).slice(0, 6)
}

export function LogoSegments({
  eyebrow = 'Customers',
  heading = 'Someone in your industry has already done this',
  subheading = 'Named with permission. Where a segment shows fewer logos than customers, the rest are under agreements that do not allow it.',
  segments = DEFAULT_SEGMENTS,
  className = '',
}: LogoSegmentsProps) {
  const headingId = `logo-segments-heading-${instanceId(heading, eyebrow)}`

  return (
    <section
      aria-labelledby={headingId}
      className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
        <h2
          id={headingId}
          className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          {heading}
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{subheading}</p>
      </div>

      <dl className="mt-12 divide-y divide-border/60 border-y border-border/60">
        {segments.map((segment) => (
          <div
            key={segment.name}
            className="grid gap-4 py-8 sm:grid-cols-[minmax(0,min(12rem,38%))_minmax(0,1fr)] sm:gap-10"
          >
            <dt className="min-w-0 break-words text-sm font-semibold tracking-tight text-foreground">
              {segment.name}
              {segment.count ? (
                <span className="mt-1 block text-sm font-normal text-muted-foreground">
                  {segment.count}
                </span>
              ) : null}
            </dt>

            <dd className="min-w-0">
              <ul className="flex flex-wrap items-center gap-x-10 gap-y-4">
                {segment.logos.map((logo, i) => (
                  <li
                    key={i}
                    className="text-lg font-bold tracking-tight text-muted-foreground/85 transition-colors hover:text-foreground"
                  >
                    {logo}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
