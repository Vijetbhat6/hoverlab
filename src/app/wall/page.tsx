/**
 * /wall — the wall of love, which is a wall of citations.
 *
 * THE ONE THING THIS PAGE MUST NOT DO
 *
 * Publish a quote nobody said. This site has done that: six testimonials
 * attributed to named people in named cities, on a page read by developers
 * who can search a name. `scripts/check-claims.mts` is the build gate that
 * came out of it, and it fails on any <blockquote> in site chrome without a
 * `data-endorsement-source` attribute.
 *
 * This is the page most likely to break that rule, so the attribute is not
 * hand-typed here — it is rendered from `Endorsement.source`, which the type
 * requires. There is no way to add a quote to this page without also adding
 * the URL that proves it, short of editing the type.
 *
 * WHY IT IS AT /wall
 *
 * Short, and it is what the category calls these. /testimonials would be
 * more literal and is the word that got this site into trouble; naming the
 * page after the evidence rather than after the genre is a small nudge in
 * the right direction for whoever edits it next.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Quote } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'
import { ENDORSEMENTS } from '@/lib/endorsements'
import { dateLabel } from '@/lib/compare'

const TITLE = 'Wall of love — what people actually said — Hoverlab'
const DESCRIPTION =
  'Everything anyone has said about Hoverlab in public, each one linked to where they said it. No quote appears here without a URL a stranger can open.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['hoverlab reviews', 'hoverlab testimonials', 'component library reviews'],
  alternates: { canonical: '/wall' },
  openGraph: {
    url: absoluteUrl('/wall'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function WallPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <JsonLd
        data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Wall of love' }])}
      />
      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 pt-12 sm:px-6"
      >
        <header className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Wall of love
          </p>
          <h1 className="type-page mt-2">What people actually said</h1>
          <p className="mt-4 text-pretty text-body">
            Every quote on this page links to where it was said, in public, by the
            person it is attributed to. If you cannot click through to it, it is not
            on here.
          </p>
          <p className="mt-3 text-pretty text-sm text-muted-foreground">
            That rule exists because this site once carried six testimonials from
            people who did not exist. They came down, and the build now fails on any
            quote published without a source.
          </p>
        </header>

        {ENDORSEMENTS.length === 0 ? (
          <section className="mt-10 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <Quote aria-hidden className="mx-auto h-6 w-6 text-muted-foreground" />
            <h2 className="mt-3 text-lg font-semibold">Nothing to put here yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-muted-foreground">
              Nobody has said anything about this in public that we can link to. When
              somebody does, it goes up here with the link attached &mdash; and if
              they say something unflattering in public, that is still public, and
              this page is not the place we would be able to hide it.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-muted-foreground">
              In the meantime, the things on this site that are worth trusting are
              the ones you can check yourself: the{' '}
              <Link href="/accessibility" className="underline underline-offset-4 hover:text-foreground">
                accessibility results including what fails
              </Link>
              , the{' '}
              <Link href="/compare" className="underline underline-offset-4 hover:text-foreground">
                comparison that records where competitors beat us
              </Link>
              , and the{' '}
              <Link href="/changelog" className="underline underline-offset-4 hover:text-foreground">
                changelog derived from the repository
              </Link>
              .
            </p>
          </section>
        ) : (
          // Masonry-ish via CSS columns: quotes vary wildly in length and a
          // grid would leave a ragged bottom edge on every row. `break-inside`
          // on the item is what stops a quote splitting across a column.
          <div className="mt-10 gap-4 sm:columns-2 lg:columns-3">
            {ENDORSEMENTS.map((endorsement) => (
              <figure
                key={endorsement.source}
                className="mb-4 break-inside-avoid rounded-xl border border-border/60 bg-card/40 p-5"
              >
                {/*
                  data-endorsement-source is rendered from the required field
                  rather than typed by hand. That is the whole design: the
                  build gate in check-claims.mts looks for this attribute, and
                  here it cannot be present without a real URL behind it.
                */}
                <blockquote
                  data-endorsement-source={endorsement.source}
                  className="text-pretty text-sm leading-relaxed"
                >
                  {endorsement.quote}
                </blockquote>

                <figcaption className="mt-4 text-xs">
                  <span className="font-semibold">{endorsement.author}</span>
                  {endorsement.role ? (
                    <span className="text-muted-foreground"> &middot; {endorsement.role}</span>
                  ) : null}
                  <a
                    href={endorsement.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    {endorsement.sourceLabel}
                    <ArrowUpRight aria-hidden className="h-3 w-3" />
                    <span className="sr-only">
                      , read on {dateLabel(endorsement.checkedOn)}
                    </span>
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
