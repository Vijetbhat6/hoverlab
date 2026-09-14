/**
 * /students — the student discount, and what counts as proof.
 *
 * WHY IT IS A CODE AND NOT AN AUTOMATIC DISCOUNT
 *
 * Every other discount on this site is decided server-side from a request
 * header, because a country can be read off an IP and a visitor cannot lie
 * about it usefully. Nothing on a request says anybody is a student, so this
 * one is the only discount here that has to be applied by a human reading a
 * piece of evidence and handing back a code. `billing/codes.ts` says the
 * same thing in the type: `studentOffer()` has no automatic branch.
 *
 * WHY THE VERIFICATION BAR IS LOW AND SAYS SO
 *
 * A `.edu` address is not proof of anything — most of the world's
 * universities do not use one, and plenty of people hold one for life. So
 * the page asks for whatever the person has and says plainly that we are not
 * running an identity check. The honest framing matters more than the
 * enforcement: the cost of somebody claiming this who should not is one
 * discounted licence, and the cost of a verification process that rejects a
 * real student in Lagos or Jakarta is the customer plus the story they tell.
 *
 * HOW IT INTERACTS WITH REGIONAL PRICING
 *
 * It does not stack, and the page says which one to take. A student in India
 * is already reading a band-A price; being told to apply a student code on
 * top of it and having it rejected at the till is the exact failure the
 * banner in `components/billing/regional-offer-banner.tsx` is built to
 * avoid, and it would happen here instead.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap, Mail } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'
import { studentOffer } from '@/lib/billing/codes'
import { PLANS, formatPrice } from '@/lib/billing/plans'

const TITLE = 'Student discount — Hoverlab'
const DESCRIPTION =
  'A real discount for students and anyone learning, with a verification bar we state plainly rather than pretend is rigorous. Does not stack with regional pricing — take whichever is cheaper.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['student discount', 'ui library student', 'hoverlab students'],
  alternates: { canonical: '/students' },
  openGraph: {
    url: absoluteUrl('/students'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/** What we will accept as evidence. Deliberately several things, not one. */
const EVIDENCE = [
  'A photo of a current student ID, with anything you do not want us to see covered up.',
  'An email from a university address — any domain, not only .edu.',
  'An enrolment letter, a transcript header, a course dashboard screenshot.',
  'A bootcamp or course receipt, if that is what you are doing instead.',
]

export default function StudentsPage() {
  const offer = studentOffer()

  return (
    <div className="relative flex min-h-screen flex-col">
      <JsonLd
        data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Students' }])}
      />
      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-12 sm:px-6"
      >
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Students
          </p>
          <h1 className="type-page mt-2">
            {offer ? `${offer.percentOff}% off, for anyone learning` : 'A discount for anyone learning'}
          </h1>
          <p className="mt-4 text-pretty text-body">
            Almost everything here is free to install and always will be &mdash; the
            source is on the page and the CLI needs no account. What Pro sells is a{' '}
            <Link href="/licence" className="underline underline-offset-4 hover:text-foreground">
              commercial licence
            </Link>
            , and the moment a student needs one is usually the moment they take
            their first paid piece of work. That is the worst possible moment to
            meet a {formatPrice(PLANS.pro.priceCents)} bill.
          </p>
        </header>

        {offer ? (
          <section className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <GraduationCap aria-hidden className="h-5 w-5 text-primary" />
              The code
            </h2>
            <p className="mt-3 flex flex-wrap items-center gap-3">
              <code className="rounded-md border border-primary/30 bg-background px-3 py-1.5 font-mono text-sm font-semibold tracking-wide">
                {offer.code}
              </code>
              <span className="text-sm text-muted-foreground">
                {offer.percentOff}% off at checkout.
              </span>
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              It is published rather than handed out one at a time on purpose. A
              discount that takes three days of email to obtain is one most students
              give up on, and the honour system costs less than the process would.
              If you can afford the full price, paying it is what keeps this
              discount available to the people who cannot.
            </p>
          </section>
        ) : (
          <section className="mt-8 rounded-xl border border-border bg-muted/40 p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Mail aria-hidden className="h-5 w-5 text-muted-foreground" />
              Ask, and you get one
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              There is no published code on this deployment yet, so this one is done
              by email: send anything from the list below and a code comes back.
              Nobody is going to interrogate it.
            </p>
            <Link
              href="/support"
              className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ask for a code
            </Link>
          </section>
        )}

        {/* ------------------------------------------------------------ *
         *  What counts
         * ------------------------------------------------------------ */}
        <section className="mt-12">
          <h2 className="type-section">What counts as a student</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Anyone learning this and not yet being paid properly for it. School,
            university, a bootcamp, a course, or teaching yourself with nothing to
            show for it but projects. If you are between jobs and rebuilding a
            portfolio, take it too.
          </p>

          <ul className="mt-5 space-y-2.5">
            {EVIDENCE.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-border/60 bg-card/40 p-3.5 text-sm text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-5 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <strong className="font-semibold text-foreground">
              This is not an identity check, and we are not pretending it is.
            </strong>{' '}
            A <code className="font-mono text-xs">.edu</code> address proves almost
            nothing &mdash; most universities outside the United States do not issue
            one, and plenty of people keep theirs for life. The cost of somebody
            taking this who should not is one discounted licence. The cost of a
            process rigorous enough to stop them is turning away real students in
            every country where the paperwork looks different, which is most of them.
          </p>
        </section>

        {/* ------------------------------------------------------------ *
         *  Stacking
         * ------------------------------------------------------------ */}
        <section className="mt-12">
          <h2 className="type-section">It does not stack with regional pricing</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If you are in one of the countries with{' '}
            <Link href="/pricing" className="underline underline-offset-4 hover:text-foreground">
              purchasing-power pricing
            </Link>
            , you are already being charged a much lower price, and in most of those
            countries it is lower than this discount would make it. Take whichever
            single one is cheaper &mdash; a second code entered on top of the first
            is rejected at checkout, and being told at the till that a discount you
            were promised does not apply is worse than never having been offered it.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Not sure which applies to you? The price shown on{' '}
            <Link href="/pricing" className="underline underline-offset-4 hover:text-foreground">
              /pricing
            </Link>{' '}
            is already your regional one.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
