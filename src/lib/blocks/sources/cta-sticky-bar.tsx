'use client'

/**
 * <CtaStickyBar> — the conversion bar that follows the page down.
 *
 * CTA Sections had three blocks that all sit in the flow: a newsletter
 * band, a community band, a closing panel. Every one of them is only on
 * screen while the reader happens to be scrolled to it, which means a long
 * landing page has its call to action visible for perhaps a tenth of the
 * time somebody spends reading. This is the shape that fixes that, and it
 * is the one most likely to be built badly.
 *
 * THE THREE WAYS THIS PATTERN GOES WRONG
 *
 *   It appears immediately. A sticky bar on first paint is an interstitial
 *   with extra steps — it interrupts before the page has made any case at
 *   all. This one waits until the reader is past a threshold, because
 *   somebody who has scrolled a third of a page has demonstrated interest
 *   and somebody who just arrived has not.
 *
 *   It cannot be dismissed. A bar that eats 64px of a phone screen with no
 *   close button is a tax on everyone who has already decided no.
 *   Dismissal is a real button, and it stays dismissed.
 *
 *   It covers the thing it is selling. On a page ending in a form or a
 *   footer link, the bar sits on top of the content. The fix is not
 *   z-index — it is reserving the bar's height at the end of the document,
 *   which is what the spacer below does, so anchored jumps and keyboard
 *   focus land above the bar rather than underneath it.
 *
 * POSITIONING. The bar is `absolute` inside a `relative` frame, the same
 * way <CookieConsent> is written and for the same reason: a `fixed`
 * element ignores every container it is in, so in a preview grid it would
 * escape its card and pin itself to the browser window. In a real page you
 * drop the frame and swap `absolute` for `fixed` — the classes are
 * otherwise identical.
 *
 * WHY IT ANIMATES IN, AND WHY THAT IS GUARDED
 *
 * A bar that appears instantly at the moment of a scroll reads as a layout
 * jump — the eye interprets it as the page breaking rather than as an
 * offer. A 200ms rise makes it legible as an arrival. It is a finite
 * transition rather than a loop, and `motion-reduce:transition-none` turns
 * it into a plain appearance for anyone who asked for less motion.
 *
 * ACCESSIBILITY
 *
 * A `<section>` with an accessible name, not an `aria-live` region. It is
 * not an alert, and announcing a marketing offer over whatever someone is
 * reading is the audio equivalent of a pop-up. It comes last in the DOM so
 * tabbing reaches it at the end rather than interrupting a form halfway
 * down the page.
 */

import * as React from 'react'
import { ArrowRight, X } from 'lucide-react'

export interface CtaStickyBarProps {
  headline?: string
  sub?: string
  actionLabel?: string
  actionHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  /** Fraction of the page scrolled before it appears. 0 shows immediately. */
  showAfter?: number
  /**
   * Render as a demo inside a larger page.
   *
   * Skips the scroll threshold and shows the bar straight away. A preview
   * card cannot demonstrate a page-scroll behaviour — the host page's
   * scroll position has nothing to do with this component's frame — so
   * without this the block previews as an empty rectangle, which is the
   * worst possible advertisement for a bar whose entire job is to be seen.
   *
   * It does not change the default: a real page keeps `showAfter` and gets
   * the delayed appearance the comment above argues for.
   */
  embedded?: boolean
  className?: string
}

export function CtaStickyBar({
  headline = 'Start with the free tier',
  sub = 'Every component readable and installable. A licence only when you ship it commercially.',
  actionLabel = 'Get started',
  actionHref = '#',
  secondaryLabel = 'See pricing',
  secondaryHref = '#',
  showAfter = 0.35,
  embedded = false,
  className = '',
}: CtaStickyBarProps) {
  const [visible, setVisible] = React.useState(embedded || showAfter <= 0)
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    if (embedded || showAfter <= 0) return

    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      /*
        A page shorter than the viewport has nothing to scroll, so the
        threshold could never be met and the bar would never appear.
        Treating that as "already past it" is right: a page with no scroll
        is one the reader has seen all of.
      */
      const progress = scrollable > 0 ? window.scrollY / scrollable : 1
      setVisible(progress >= showAfter)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [showAfter, embedded])

  return (
    // The demo frame. Delete it in a real page — see POSITIONING above.
    <div className="relative min-h-[13rem] overflow-hidden rounded-xl border border-border bg-muted/20">
      <div className="px-6 py-8 text-sm text-muted-foreground">
        <p className="max-w-prose">
          Page content sits here. The bar rides above it once the reader is
          past the threshold, and the spacer at the end of the document keeps
          the last element reachable.
        </p>
      </div>

      {/* The spacer, not a z-index fight. */}
      <div aria-hidden className="h-20 sm:h-16" />

      {dismissed ? null : (
        <section
          aria-label="Get started"
          className={`absolute inset-x-0 bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur transition duration-200 motion-reduce:transition-none ${
            visible
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-full opacity-0'
          } ${className}`}
        >
          <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{headline}</p>
              {/* Hidden on the smallest screens rather than wrapped to three
                  lines — a sticky bar that grows taller than its own value
                  is the thing people are trying to close. */}
              <p className="hidden truncate text-sm text-muted-foreground sm:block">{sub}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={secondaryHref}
                className="hidden h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex"
              >
                {secondaryLabel}
              </a>
              <a
                href={actionHref}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {actionLabel}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="-me-1 rounded p-1.5 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <X aria-hidden className="h-4 w-4" />
                <span className="sr-only">Dismiss this bar</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
