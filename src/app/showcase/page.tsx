/**
 * /showcase — things other people built with this.
 *
 * WHY IT SHIPS EMPTY, AND WHY THE EMPTY STATE IS THE PAGE
 *
 * There are no verified entries yet, and `lib/showcase.ts` explains at
 * length why seeding it with our own deployments would be the invented
 * testimonials with an extra step. So the interesting design problem here is
 * not the grid — it is the zero state, which is what every visitor sees
 * today and what most will see for a while.
 *
 * The zero state does two things and refuses a third. It says plainly that
 * the list is empty and why, and it tells somebody how to get on it. What it
 * does not do is hide: no "coming soon" over a blurred fake grid, no
 * skeleton cards implying entries are loading. A visitor who works out that
 * the placeholder companies are not real has learned something about every
 * other number on the site.
 *
 * WHY THE GRID IS BUILT ANYWAY
 *
 * Because the alternative is that the first real entry arrives and has
 * nowhere to go, and gets pasted into JSX under deadline. The rendering path
 * is finished, tested by the types, and takes one array element.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Layers } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'
import { RUNG_LABEL, SHOWCASE, SUBMISSION_PATH } from '@/lib/showcase'

const TITLE = 'Showcase — sites built with Hoverlab'
const DESCRIPTION =
  'Real, live sites built with the catalog. Every entry links to the thing itself, says which tiers it used, and is published with permission.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['hoverlab showcase', 'sites built with tailwind blocks', 'component library examples'],
  alternates: { canonical: '/showcase' },
  openGraph: {
    url: absoluteUrl('/showcase'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function ShowcasePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Showcase' }])} />
      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 pt-12 sm:px-6"
      >
        <header className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Showcase
          </p>
          <h1 className="type-page mt-2">Built with this</h1>
          <p className="mt-4 text-pretty text-body">
            Live sites, linked so you can open them and judge for yourself. Every
            entry says which tiers it actually took, and nothing goes up without
            the owner&rsquo;s permission.
          </p>
        </header>

        {SHOWCASE.length === 0 ? (
          /*
            The honest zero state. Says what is true, says why, and gives the
            one action available. No blurred placeholder grid behind it — see
            the docblock.
          */
          <section className="mt-10 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <h2 className="text-lg font-semibold">Nothing here yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-muted-foreground">
              This page is empty because nobody has sent something in and had it
              verified yet &mdash; not because it is still loading. It would be easy
              to fill with our own demo deployments wearing other people&rsquo;s
              names, and that is the same thing as inventing testimonials, which
              this site has done once and will not do again.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-muted-foreground">
              If you shipped something with it, the bar is low and specific: a
              public URL we can open, and your permission to link it.
            </p>
            <Link
              href={SUBMISSION_PATH}
              className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Send us a link
              <ArrowUpRight aria-hidden className="h-4 w-4" />
            </Link>
          </section>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {SHOWCASE.map((site) => (
              <li
                key={site.href}
                className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/40"
              >
                {site.shot ? (
                  // Plain <img>: these are third-party screenshots of varying
                  // dimensions committed under /public, and next/image's
                  // optimiser buys nothing for a handful of them while adding
                  // a required width/height per entry that a contributor
                  // would have to measure.
                  <img
                    src={site.shot}
                    alt={`${site.name}, built with Hoverlab`}
                    loading="lazy"
                    className="aspect-[16/10] w-full max-w-full object-cover"
                  />
                ) : null}

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-semibold">
                    <a
                      href={site.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-primary"
                    >
                      {site.name}
                      <ArrowUpRight
                        aria-hidden
                        className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary"
                      />
                    </a>
                  </h2>
                  <p className="mt-1.5 flex-1 text-sm text-muted-foreground">
                    {site.blurb}
                  </p>

                  <p className="mt-4 flex flex-wrap items-center gap-1.5">
                    <Layers
                      aria-hidden
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    />
                    <span className="sr-only">Tiers used:</span>
                    {site.uses.map((rung) => (
                      <span
                        key={rung}
                        className="rounded-md border border-border/60 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {RUNG_LABEL[rung]}
                      </span>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {SHOWCASE.length > 0 ? (
          <section className="mt-12 rounded-xl border border-border bg-muted/30 p-5 text-sm">
            <h2 className="text-base font-semibold">Built something?</h2>
            <p className="mt-2 text-muted-foreground">
              Send a public URL and permission to link it, and it goes up.{' '}
              <Link
                href={SUBMISSION_PATH}
                className="underline underline-offset-4 hover:text-foreground"
              >
                Get in touch
              </Link>
              .
            </p>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  )
}
