/**
 * <FeatureRows> — features as alternating rows, image side flipping each time.
 *
 * The oldest shape in marketing layout, and the catalog did not have it.
 * <BentoFeatures> composes six tiles into one asymmetric picture,
 * <FeatureTabs> makes features take turns in a fixed frame, and
 * <CodeShowcase> is a single row with an editor in it. None of them gives a
 * feature a full row of its own, which is what you want when each one needs
 * a paragraph and a picture rather than a caption.
 *
 * The alternation is the whole mechanic. Identical rows stacked the same
 * way read as a list to be skimmed and abandoned; flipping the media side
 * each row forces the eye back across the page and gives each feature a
 * fresh entry point. It is `lg:` only — below that everything is one column
 * and a flipped row would just be an image in a different place with no
 * pattern to break.
 *
 * `order` on the media rather than `direction: rtl` or a reversed array:
 * DOM order stays copy-then-media for every row, so a screen reader and a
 * narrow viewport both get the heading before the picture it belongs to,
 * however the wide layout arranges them.
 *
 * The media is a drawn panel, not an <img>. A feature section built on
 * remote screenshots is a layout shift and a set of assets to host; the
 * shape reads correctly without them, and `media` takes a node for when the
 * real thing is ready.
 */

import * as React from 'react'
import { Check } from 'lucide-react'

export interface FeatureRow {
  eyebrow?: string
  title: string
  body: string
  bullets?: string[]
  /** Replaces the drawn placeholder panel. */
  media?: React.ReactNode
}

export interface FeatureRowsProps {
  rows?: FeatureRow[]
  heading?: string
  subheading?: string
  className?: string
}

const DEFAULT_ROWS: FeatureRow[] = [
  {
    eyebrow: 'Browse',
    title: 'Find it without an account',
    body:
      'Every component is readable, customisable and copyable before you sign in for anything. Nothing sits behind an email gate, because a gate at the browse step costs more visitors than it captures.',
    bullets: ['No login to copy', 'Public REST API, no key', 'Live preview on every page'],
  },
  {
    eyebrow: 'Customise',
    title: 'Tune it in the browser, not after pasting',
    body:
      'Colour, timing and sizing are editable where you found the component, and what you copy is what you configured — not a default you then have to hunt through and change.',
    bullets: ['Brand colours applied across the catalog', 'Copy reflects your edits'],
  },
  {
    eyebrow: 'Ship',
    title: 'The code lands in your repo and stops being ours',
    body:
      'No runtime dependency, no package that phones home, no version to keep in step. You own the file the moment it is pasted, and updates reach you only when you go and get them.',
    bullets: ['Plain TSX and utility classes', 'No attribution required'],
  },
]

/** The stand-in panel, when a row brings no media of its own. */
function PlaceholderPanel() {
  return (
    <div
      aria-hidden
      className="aspect-[4/3] w-full rounded-2xl border border-border/60 bg-gradient-to-br from-muted/60 to-card p-6"
    >
      <div className="flex h-full flex-col gap-3 rounded-xl border border-border/50 bg-background/60 p-4">
        <div className="h-2.5 w-1/3 rounded-full bg-muted-foreground/25" />
        <div className="h-2 w-3/4 rounded-full bg-muted-foreground/15" />
        <div className="h-2 w-2/3 rounded-full bg-muted-foreground/15" />
        <div className="mt-auto grid grid-cols-3 gap-2">
          <div className="h-10 rounded-lg bg-muted-foreground/10" />
          <div className="h-10 rounded-lg bg-muted-foreground/10" />
          <div className="h-10 rounded-lg bg-muted-foreground/10" />
        </div>
      </div>
    </div>
  )
}

export function FeatureRows({
  rows = DEFAULT_ROWS,
  heading = 'How it works',
  subheading = 'Three steps, none of which involve an account.',
  className = '',
}: FeatureRowsProps) {
  return (
    <section
      className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 ${className}`}
    >
      {heading ? (
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
          {subheading ? (
            <p className="mt-3 text-muted-foreground">{subheading}</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-20 sm:space-y-28">
        {rows.map((row, i) => (
          <div
            key={row.title}
            className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
          >
            <div>
              {row.eyebrow ? (
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  {row.eyebrow}
                </p>
              ) : null}
              <h3 className="mt-2 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                {row.title}
              </h3>
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                {row.body}
              </p>
              {row.bullets?.length ? (
                <ul className="mt-6 space-y-2.5">
                  {row.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm">
                      <Check
                        aria-hidden
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                      />
                      <span className="text-foreground/90">{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {/* Odd rows put the media first at `lg`. Visual order only — the
                copy stays ahead of it in the DOM for every row. */}
            <div className={i % 2 === 1 ? 'lg:order-first' : undefined}>
              {row.media ?? <PlaceholderPanel />}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
