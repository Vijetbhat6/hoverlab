'use client'

/**
 * <CtaInlineCard> — the offer that sits inside the article, mid-sentence.
 *
 * CTA Sections had three full-width bands and a sticky bar: four ways of
 * interrupting the page. This is the one that does not interrupt. It sits
 * in the column, at the width of the text, after the paragraph that earned
 * it — which is a different design problem, and the reason a band pasted
 * into an article always looks like an advert somebody forgot to remove.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * It is an `<aside>` with a label, so it is out of the article's reading
 * flow rather than pretending to be the next paragraph. A screen-reader
 * user can skip a labelled complementary region in one keystroke; the same
 * card built from a div lands as body text and has to be read through
 * every time, including the button. The visual break — narrower rule,
 * different surface — is the sighted version of exactly that affordance.
 *
 * IT IS ABOUT THE SECTION IT FOLLOWS
 *
 * The heading references what was just being read. An inline card offering
 * a generic "start your free trial" is the same interruption wherever it
 * lands, which is why readers learn to skip it in one article and skip it
 * in all of them afterwards.
 *
 * THE FRICTION IS STATED BEFORE THE CLICK
 *
 * "No card, about two minutes" under the button. The cost of finding that
 * out on the next page is a bounce; the cost of putting it here is one
 * line of text.
 *
 * DISMISSING IT MEANS SOMETHING
 *
 * "Not now" hides it for the rest of the visit rather than fading it back
 * in on the next scroll. A card you cannot get rid of is read as an advert
 * whether or not it is one — and in a real build this is the moment to
 * write the preference somewhere that survives a reload.
 *
 * ACCESSIBILITY: labelled `<aside>`, one `<h2>` that is a real heading in
 * the document outline, and a link styled as a button that is genuinely an
 * anchor because it navigates.
 */

import * as React from 'react'
import { ArrowRight, Sparkles, X } from 'lucide-react'

export interface CtaInlineCardProps {
  /** What the reader was just reading — the card has to answer it. */
  contextLabel?: string
  heading?: string
  body?: string
  actionLabel?: string
  href?: string
  /** The friction, admitted before the click rather than on the next page. */
  fineprint?: string
  className?: string
}

export function CtaInlineCard({
  contextLabel = 'Since you are reading about migrations',
  heading = 'Run this migration against a copy first',
  body =
    'The sandbox restores a snapshot of your production database and throws it away after an hour. It is the cheapest way to find out whether the lock timeout above is enough for your data.',
  actionLabel = 'Open a sandbox',
  href = '#sandbox',
  fineprint = 'No card. About two minutes, and it deletes itself.',
  className = '',
}: CtaInlineCardProps) {
  const [dismissed, setDismissed] = React.useState(false)

  return (
    <div className={`mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 ${className}`}>
      {/* Surrounding prose, so the card is seen at the width it will live at. */}
      <p className="text-sm leading-relaxed text-muted-foreground">
        …which is why the migration queues behind the reporting job rather than
        failing outright. The lock is held for as long as the report runs, and
        on a large table that can be several minutes.
      </p>

      {dismissed ? (
        <p role="status" className="my-6 text-xs text-muted-foreground">
          Hidden for the rest of your visit.
        </p>
      ) : (
        /*
          A labelled complementary region: skippable in one keystroke, and
          out of the article's reading flow rather than posing as the next
          paragraph.
        */
        <aside
          aria-label="Related offer"
          className="relative my-6 rounded-xl border border-border bg-muted/50 p-5"
        >
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <X aria-hidden className="h-3.5 w-3.5" />
            <span className="sr-only">Not now — hide this for the rest of my visit</span>
          </button>

          <p className="flex items-center gap-1.5 pe-8 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Sparkles aria-hidden className="h-3.5 w-3.5" />
            {contextLabel}
          </p>
          <h2 className="mt-2 text-base font-semibold text-foreground">{heading}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>

          <a
            href={href}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {actionLabel}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </a>
          {/* The cost, before the click. */}
          <p className="mt-2 text-xs text-muted-foreground">{fineprint}</p>
        </aside>
      )}

      <p className="text-sm leading-relaxed text-muted-foreground">
        The safe version is to set a lock timeout and accept that the migration
        may need a second pass, rather than letting it wait indefinitely and
        block every write behind it.
      </p>
    </div>
  )
}
