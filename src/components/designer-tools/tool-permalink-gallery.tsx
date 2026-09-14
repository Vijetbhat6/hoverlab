/**
 * The curated permalinks for one tool, as real links.
 *
 * Deliberately a SERVER component, and that is the whole design rather than
 * a performance note. The point of moving tool state off `#s=` and into the
 * query string was to make a tuned palette a document; a document needs
 * something to be indexed, and a grid of `<a href>`s whose swatches are
 * real inline-styled HTML is that something. Rendered on the client it
 * would be a crawler's empty shell, and the sitemap entries would point at
 * pages with nothing on them — which is worse than not listing them.
 *
 * It is also the only internal linking this feature has. A sitemap tells a
 * crawler a URL exists; a link from a page that already ranks tells it the
 * URL is worth something, and `/tools/*` is the highest-traffic section on
 * the site.
 *
 * The human case is the one that decided the copy, though. Somebody who
 * lands on the contrast checker from a search has a specific pair in mind
 * and no reason to care that the tool is configurable. Twelve pairs with a
 * sentence each — "one step lighter, and it fails" — answer the question
 * they came with and teach the control on the way past.
 */

import Link from 'next/link'
import {
  galleryState,
  toolHref,
  toolQuery,
  type ToolPermalink,
} from '@/lib/tools/permalink'

export function ToolPermalinkGallery<T extends object>({
  spec,
  current,
  heading,
  blurb,
}: {
  spec: ToolPermalink<T>
  /**
   * The state the page is currently showing, so the card matching it can be
   * marked. Optional — the gallery renders fine without one.
   */
  current?: T
  heading: string
  blurb: string
}) {
  const currentQuery = current ? toolQuery(spec, current) : null

  return (
    <section className="mt-16 border-t pt-10">
      <h2 className="type-section">{heading}</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{blurb}</p>

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {spec.gallery.map((entry) => {
          const state = galleryState(spec, entry)
          const href = toolHref(spec, state)
          const swatches = spec.swatches(state)
          const isCurrent = currentQuery !== null && toolQuery(spec, state) === currentQuery

          return (
            <li key={entry.slug}>
              <Link
                href={href}
                // `aria-current` rather than only a ring: the distinction is
                // "this is the one you are looking at", which is exactly
                // what the attribute means and what a screen reader needs.
                aria-current={isCurrent ? 'true' : undefined}
                className={`group flex h-full flex-col rounded-xl border p-3 transition-colors hover:border-primary/50 hover:bg-muted/40 ${
                  isCurrent ? 'border-primary bg-muted/30' : ''
                }`}
              >
                {swatches.length > 0 && (
                  <div
                    className="flex h-10 overflow-hidden rounded-lg border"
                    // The swatch row is decoration for a link whose text
                    // already names the colours, so it is hidden rather than
                    // read out as a row of unlabelled boxes.
                    aria-hidden="true"
                  >
                    {swatches.map((color, i) => (
                      <div
                        key={`${entry.slug}-${i}`}
                        className="flex-1"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
                <p
                  className={`font-medium leading-snug group-hover:text-primary ${
                    swatches.length > 0 ? 'mt-2.5 text-sm' : 'text-base'
                  }`}
                >
                  {entry.name}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {entry.note}
                </p>
              </Link>
            </li>
          )
        })}
      </ul>

      <p className="mt-5 max-w-3xl text-xs text-muted-foreground">
        Every one of these is just the address bar. Change anything in the
        tool above and the URL changes with it — copy it, paste it into a
        ticket, or commit it in a review, and it opens for anyone with these
        exact settings. No account, and nothing to save first.
      </p>
    </section>
  )
}
