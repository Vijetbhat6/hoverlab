/**
 * /alternatives — the index over the nine per-vendor pages.
 *
 * WHY THESE EXIST BESIDE /compare RATHER THAN INSIDE IT
 *
 * /compare is one page holding nine vendors, and it is the right shape for
 * the reader who has already found us and wants the landscape. It is the
 * wrong shape for the query that actually gets typed, which is never "css
 * component catalog comparison" — it is "react bits alternative", with a
 * card already out and one vendor in mind.
 *
 * A single page cannot rank for nine of those. Each one wants a document
 * whose title, heading and first paragraph are about that vendor, and which
 * answers the specific question behind the search: what does this other
 * thing do that you do not, and why would I switch. That is nine documents.
 *
 * WHY THEY ARE NOT NINE PIECES OF DOORWAY SPAM
 *
 * Because every one of them leads with `beatsUs` — the field `compare.ts`
 * makes required precisely so that a comparison cannot be written where the
 * author wins every row. A reader who searched for a competitor's name is
 * the most sceptical reader this site gets; opening with the competitor's
 * genuine advantage is the only version of this page that survives them, and
 * it is also the only version worth publishing.
 *
 * The content is generated from the same sourced, per-row-dated data as
 * /compare, so these nine pages cannot drift from it or from each other.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Scale } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'
import { COMPETITORS, OLDEST_CHECK_LABEL, dateLabel } from '@/lib/compare'

const TITLE = 'Alternatives — Hoverlab compared, one vendor at a time'
const DESCRIPTION =
  'A page per alternative, each one opening with what that vendor does better. Prices and figures are read off their own pages and dated individually.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'react bits alternative',
    'tailwind plus alternative',
    'shadcnblocks alternative',
    'component library alternatives',
  ],
  alternates: { canonical: '/alternatives' },
  openGraph: {
    url: absoluteUrl('/alternatives'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function AlternativesIndexPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <JsonLd
        data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Alternatives' }])}
      />
      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-12 sm:px-6"
      >
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Alternatives
          </p>
          <h1 className="type-page mt-2">Compared, one at a time</h1>
          <p className="mt-4 text-pretty text-body">
            A page for each of the {COMPETITORS.length} catalogs people weigh this
            against. Every one of them opens with what that vendor does better than
            we do, because you were going to find out anyway and it may as well be
            from us.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing here is older than {OLDEST_CHECK_LABEL}, and each page carries
            the date its own figures were read. Want the whole field in one table
            instead?{' '}
            <Link href="/compare" className="underline underline-offset-4 hover:text-foreground">
              /compare
            </Link>{' '}
            has it.
          </p>
        </header>

        <ul className="mt-10 space-y-3">
          {COMPETITORS.map((competitor) => (
            <li key={competitor.slug}>
              <Link
                href={`/alternatives/${competitor.slug}`}
                className="group flex flex-col gap-1.5 rounded-xl border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/40"
              >
                <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold group-hover:text-primary">
                    Hoverlab vs {competitor.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    checked {dateLabel(competitor.checkedOn)}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">
                  {competitor.ladder}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Read the comparison
                  <ArrowRight
                    aria-hidden
                    className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-12 rounded-xl border border-border bg-muted/30 p-5 text-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Scale aria-hidden className="h-5 w-5 text-muted-foreground" />
            Missing one?
          </h2>
          <p className="mt-2 text-muted-foreground">
            A vendor gets a page here once we can read their prices off their own
            site and re-read them. Uiverse is the notable absence: its pricing is
            reported at $4.99 and $19.99 a month and the site returns 403 to every
            fetch, so publishing a number from memory on a page whose whole argument
            is that we checked would discredit the other nine.{' '}
            <Link href="/support" className="underline underline-offset-4 hover:text-foreground">
              Tell us who else to add
            </Link>
            .
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
