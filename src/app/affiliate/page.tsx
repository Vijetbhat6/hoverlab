/**
 * /affiliate — 30% of the first purchase, and the terms in full.
 *
 * WHY THE TERMS ARE ABOVE THE SIGNUP AND NOT BELOW IT
 *
 * The reader of this page is deciding whether to spend an afternoon writing
 * about the catalog. What decides that is the rate, what it is a percentage
 * of, and when they get paid — not the sentence "join our affiliate
 * programme". Every affiliate page in this category leads with the rate and
 * buries the exclusions, so the exclusions are the thing worth putting up
 * front: the two that matter here are that nothing recurs and that
 * commission is held until the refund window closes, and both are better
 * learned now than a month in.
 *
 * WHY IT MAY SAY THE DOOR IS SHUT
 *
 * Attribution, payouts and tax reporting are a platform feature. Until
 * NEXT_PUBLIC_AFFILIATE_SIGNUP_URL points at one, this page publishes the
 * terms and says applications are not open yet, rather than rendering a
 * button that goes nowhere. Same rule as `lib/social.ts` and /support: never
 * render a door that opens onto nothing.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Ban, Handshake } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'
import {
  AFFILIATE_PERCENT,
  AFFILIATE_PROHIBITED,
  AFFILIATE_TERMS,
  affiliateSignupUrl,
} from '@/lib/affiliate'
import { PLANS, formatPrice } from '@/lib/billing/plans'

const TITLE = `Affiliate programme — ${AFFILIATE_PERCENT}% — Hoverlab`
const DESCRIPTION = `${AFFILIATE_PERCENT}% of the first purchase on every licence tier, a 60-day attribution window, and the exclusions stated up front rather than in small print.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['hoverlab affiliate', 'component library affiliate program', 'developer tools affiliate'],
  alternates: { canonical: '/affiliate' },
  openGraph: {
    url: absoluteUrl('/affiliate'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function AffiliatePage() {
  const signupUrl = affiliateSignupUrl()

  /*
    The worked example, computed rather than typed.

    "30% commission" is an abstraction; "$23.70 on a Pro licence" is a
    decision. Deriving it from PLANS.pro means a price change cannot leave a
    stale figure on the page — which is exactly what a hand-typed number here
    would become, and on a page about money owed to other people.
  */
  const proCents = PLANS.pro.priceCents
  const exampleCents = Math.round((proCents * AFFILIATE_PERCENT) / 100)

  return (
    <div className="relative flex min-h-screen flex-col">
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Affiliate' }])} />
      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-12 sm:px-6"
      >
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Affiliate
          </p>
          <h1 className="type-page mt-2">
            {AFFILIATE_PERCENT}% of the first purchase
          </h1>
          <p className="mt-4 text-pretty text-body">
            If you write about this catalog and somebody buys, you get{' '}
            {AFFILIATE_PERCENT}% of what they paid. On a {formatPrice(proCents)} Pro
            licence that is {formatPrice(exampleCents)} &mdash; enough to be worth
            writing a real post for, which is the only kind worth paying for.
          </p>

          {signupUrl ? (
            <a
              href={signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Apply to join
              <ArrowUpRight aria-hidden className="h-4 w-4" />
            </a>
          ) : (
            <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="font-semibold text-foreground">
                  Applications are not open yet.
                </strong>{' '}
                Tracking a referral and paying out against it correctly needs a
                platform behind it, and running it off a spreadsheet means either
                missing somebody who earned a payment or paying twice. The terms
                below are the terms; when the door opens it opens on them.{' '}
                <Link
                  href="/support"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Write in
                </Link>{' '}
                to be told when.
              </p>
            </div>
          )}
        </header>

        {/* ------------------------------------------------------------ *
         *  Terms
         * ------------------------------------------------------------ */}
        <section className="mt-12">
          <h2 className="type-section flex items-center gap-2">
            <Handshake aria-hidden className="h-5 w-5 text-muted-foreground" />
            The terms
          </h2>

          <dl className="mt-5 space-y-4">
            {AFFILIATE_TERMS.map((term) => (
              <div
                key={term.label}
                className="rounded-xl border border-border/60 bg-card/40 p-4"
              >
                <dt className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {term.label}
                  </span>
                  <span className="font-semibold">{term.value}</span>
                </dt>
                <dd className="mt-1.5 text-sm text-muted-foreground">{term.detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ------------------------------------------------------------ *
         *  Prohibited
         * ------------------------------------------------------------ */}
        <section className="mt-12">
          <h2 className="type-section flex items-center gap-2">
            <Ban aria-hidden className="h-5 w-5 text-muted-foreground" />
            What ends the arrangement
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Four things, and they are specific rather than a paragraph about acting
            professionally. The first two take money for traffic that was already
            ours; the last two put statements under our name that we cannot stand
            behind.
          </p>

          <ul className="mt-5 space-y-2.5">
            {AFFILIATE_PROHIBITED.map((rule) => (
              <li
                key={rule}
                className="flex gap-2.5 rounded-lg border border-border/60 bg-card/40 p-3.5 text-sm text-muted-foreground"
              >
                <Ban aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-xl border border-border bg-muted/30 p-5 text-sm">
          <h2 className="text-base font-semibold">Before you write about it</h2>
          <p className="mt-2 text-muted-foreground">
            Two pages make an honest review easier to write:{' '}
            <Link href="/compare" className="underline underline-offset-4 hover:text-foreground">
              /compare
            </Link>{' '}
            records where each competitor beats us, in our own words, and{' '}
            <Link href="/roadmap" className="underline underline-offset-4 hover:text-foreground">
              /roadmap
            </Link>{' '}
            lists what is unfinished. Quoting either is fine. A review that reads as
            independent while the link is an affiliate one is not, and most
            jurisdictions agree.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
