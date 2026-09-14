/**
 * /labs — the experiments shelf, and the brief people build against.
 *
 * WHY THE BRIEF IS THE PAGE ON DAY ONE
 *
 * The shelf is empty, and unlike /showcase and /wall that is not the whole
 * story here: this page is asking for something specific, and the ask is
 * useful with zero entries on it. Nobody submits to a shelf that has not
 * told them what it wants, so the rules from `lib/labs.ts` render above the
 * fold rather than as small print under a grid that does not exist.
 *
 * WHY THE RULES ARE PROMINENT RATHER THAN TUCKED AWAY
 *
 * "Recreate a famous effect" invites exactly one bad outcome — somebody
 * lifting a company's code or shipping their brand identity — and the cost
 * of that lands on us, since we would be the ones publishing it. A rule
 * nobody read is a rule that does not work, so they are six cards rather
 * than a paragraph of terms.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, FlaskConical } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'
import { LAB_ENTRIES, LAB_RULES, LABS_SUBMISSION_PATH } from '@/lib/labs'

const TITLE = 'Labs — recreate a famous effect, get linked — Hoverlab'
const DESCRIPTION =
  'The experiments shelf. Rebuild an effect you admire from scratch, name what you recreated, and keep the credit and the copyright. The brief, in full.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['css experiments', 'recreate css effect', 'hoverlab labs'],
  alternates: { canonical: '/labs' },
  openGraph: {
    url: absoluteUrl('/labs'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function LabsPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Labs' }])} />
      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 pt-12 sm:px-6"
      >
        <header className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Labs
          </p>
          <h1 className="type-page mt-2">Recreate a famous effect, get linked</h1>
          <p className="mt-4 text-pretty text-body">
            Pick an effect you have admired on somebody else&rsquo;s site, work out
            how it is done, and build your own version from scratch. It goes on this
            shelf with your name and your link on it, permanently, and you keep the
            copyright.
          </p>
          <p className="mt-3 text-pretty text-sm text-muted-foreground">
            It is a fair trade rather than a favour: you get a credit on a page that
            ranks, and this catalog gets an effect it did not have to design.
          </p>
        </header>

        {/* ------------------------------------------------------------ *
         *  The shelf
         * ------------------------------------------------------------ */}
        <section className="mt-10">
          <h2 className="type-section">The shelf</h2>

          {LAB_ENTRIES.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <FlaskConical aria-hidden className="mx-auto h-6 w-6 text-muted-foreground" />
              <h3 className="mt-3 text-base font-semibold">Nothing on it yet</h3>
              <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-muted-foreground">
                The shelf is other people&rsquo;s work, and nobody has sent anything
                in. Filling it with our own effects relabelled as community
                experiments would be inventing contributors, so it stays empty until
                it is not. The first entry gets the top of the page.
              </p>
            </div>
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {LAB_ENTRIES.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-border/60 bg-card/40 p-5"
                >
                  <h3 className="font-semibold">
                    {entry.effectId ? (
                      <Link href={`/effect/${entry.effectId}`} className="hover:text-primary">
                        {entry.name}
                      </Link>
                    ) : (
                      entry.name
                    )}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{entry.blurb}</p>

                  <dl className="mt-4 space-y-1.5 text-xs">
                    <div className="flex gap-1.5">
                      <dt className="shrink-0 text-muted-foreground">After</dt>
                      <dd>
                        <a
                          href={entry.original.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-primary"
                        >
                          {entry.original.name}
                          <ArrowUpRight aria-hidden className="h-3 w-3" />
                        </a>
                      </dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="shrink-0 text-muted-foreground">Built by</dt>
                      <dd>
                        <a
                          href={entry.credit.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium underline underline-offset-4 hover:text-primary"
                        >
                          {entry.credit.name}
                          <ArrowUpRight aria-hidden className="h-3 w-3" />
                        </a>
                      </dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="shrink-0 text-muted-foreground">Technique</dt>
                      <dd className="text-muted-foreground">{entry.technique}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ------------------------------------------------------------ *
         *  The brief
         * ------------------------------------------------------------ */}
        <section className="mt-14">
          <h2 className="type-section">What we will and will not publish</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Read these before you start rather than after. The first three are the
            difference between a study of a technique and a copy with the serial
            numbers filed off &mdash; and we are the ones who would be publishing
            the second one.
          </p>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {LAB_RULES.map((rule) => (
              <li
                key={rule.title}
                className="rounded-xl border border-border/60 bg-card/40 p-4"
              >
                <h3 className="text-sm font-semibold">{rule.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{rule.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-xl border border-border bg-muted/30 p-5">
          <h2 className="text-base font-semibold">Send one in</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A live demo (a pen, a gist, a deployed page), what you recreated, and how
            you want to be credited. A person reads every submission against the
            rules above, which is why there is no form that writes straight to the
            shelf.
          </p>
          <Link
            href={LABS_SUBMISSION_PATH}
            className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Submit an experiment
            <ArrowUpRight aria-hidden className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
