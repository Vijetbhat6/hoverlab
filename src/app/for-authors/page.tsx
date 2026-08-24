import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, X, Minus } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { NewsletterSignup } from '@/components/landing/newsletter-signup'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { TEMPLATE_COUNT } from '@/lib/templates/template-index'
import { PLANS, formatPrice } from '@/lib/billing/plans'
import { AUTHOR_SEQUENCE } from '@/lib/sequences'
import { absoluteUrl } from '@/lib/site'

/**
 * /for-authors — the page for people who used to sell on a marketplace.
 *
 * The one funnel an agent cannot disintermediate is the one where somebody
 * already knows your name. Search gets re-ranked, an MCP server is a config
 * line an assistant can swap, a registry entry is one of forty. The two
 * healthiest catalogs in this category run on 56–57% direct traffic, which
 * is brand, and nothing else we ship builds any.
 *
 * This starts with the warmest available segment rather than with "brand"
 * in the abstract. Envato's displaced authors already believe a well-built
 * component is worth money — the belief every other channel has to
 * manufacture — and their marketplace income has fallen away.
 *
 * THE FIRST THING ON THE PAGE IS THE DISQUALIFIER.
 *
 * We are not a marketplace, they cannot sell through us, and that idea
 * stays rejected. Saying it in the opening paragraph costs some signups and
 * buys the only thing this page is actually for: being believed. A page
 * that lets a marketplace author read to the bottom before revealing it is
 * not a marketplace has spent their attention and their goodwill at once.
 *
 * The comparison table is honest in both directions for the same reason. A
 * marketplace beats this catalog on breadth and on the ability to sell what
 * you make, and pretending otherwise to an audience that spent years inside
 * one would be transparent and fatal.
 */

const TITLE = 'For marketplace authors — Hoverlab'
const DESCRIPTION =
  'You built and sold themes. Here is what a single-author component catalog offers instead, what its licence lets you ship, and why it is not a marketplace.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'themeforest alternative',
    'envato authors',
    'ui kit for client work',
    'commercial component licence',
  ],
  alternates: { canonical: '/for-authors' },
  openGraph: {
    url: absoluteUrl('/for-authors'),
    title: TITLE,
    description: DESCRIPTION,
  },
}

type Cell = 'yes' | 'no' | 'partial'

interface Row {
  question: string
  hoverlab: Cell
  marketplace: Cell
  note: string
}

/**
 * Rows chosen so the marketplace wins two of them.
 *
 * A comparison table where one column is a full row of ticks is read as
 * marketing and discarded, and this audience has more reason than most to
 * discard it. The two it loses are the two that are actually true.
 */
const ROWS: Row[] = [
  {
    question: 'Can you sell your own work through it?',
    hoverlab: 'no',
    marketplace: 'yes',
    note: 'This is a catalog, not a platform. If selling your work is what you need, a marketplace is the right answer and this is not.',
  },
  {
    question: 'Breadth of what is available',
    hoverlab: 'partial',
    marketplace: 'yes',
    note: `Thousands of authors beats one. ${TOTAL_COUNT.toLocaleString('en-US')} effects, ${BLOCK_COUNT} blocks, ${PAGE_COUNT} pages and ${TEMPLATE_COUNT} templates is a lot to build against, and it is not a marketplace's catalogue.`,
  },
  {
    question: 'One consistent standard across everything',
    hoverlab: 'yes',
    marketplace: 'no',
    note: 'Every block is checked for reduced-motion handling before it ships, and every preview renders from the same file whose source you copy. A marketplace cannot hold thousands of sellers to one bar.',
  },
  {
    question: 'Read the source before you commit to it',
    hoverlab: 'yes',
    marketplace: 'partial',
    note: 'Everything here is readable and copyable with no account. Most marketplace items are a screenshot and a demo until you have paid.',
  },
  {
    question: 'One licence covering unlimited client projects',
    hoverlab: 'yes',
    marketplace: 'no',
    note: 'Marketplace licences are typically per-end-product. Pro is bought once and covers every project and every client.',
  },
  {
    question: 'Install from the terminal or from an agent',
    hoverlab: 'yes',
    marketplace: 'no',
    note: 'npx hoverlab add, npx shadcn add, or an MCP server your editor drives. A zip download is a zip download.',
  },
  {
    question: 'Price for where you actually live',
    hoverlab: 'yes',
    marketplace: 'no',
    note: 'Regional pricing applies automatically from the edge, across three purchasing-power bands.',
  },
]

const ICON: Record<Cell, React.ReactNode> = {
  yes: <Check aria-hidden className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />,
  no: <X aria-hidden className="h-4 w-4 text-destructive" />,
  partial: <Minus aria-hidden className="h-4 w-4 text-muted-foreground" />,
}

const LABEL: Record<Cell, string> = { yes: 'Yes', no: 'No', partial: 'Partly' }

export default function ForAuthorsPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-4 pb-12 pt-16 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            For marketplace authors
          </p>
          <h1 className="type-page mt-3">
            You cannot sell your work through us
          </h1>

          {/*
            The disqualifier first, at full size. See the note at the top of
            this file: a page that buries it has spent the reader's
            attention and their goodwill at the same time.
          */}
          <div className="mt-5 space-y-4 text-body">
            <p>
              Hoverlab is not a marketplace and we are not planning to become
              one. There is no author programme, no revenue share, and no
              submission queue. If what you need is somewhere to sell what you
              build, this page has nothing for you and you should stop reading
              here — that is a real thing to want, and we are not it.
            </p>
            <p>
              What this is: the catalog you build client work out of.{' '}
              {TOTAL_COUNT.toLocaleString('en-US')} effects, {BLOCK_COUNT}{' '}
              blocks, {PAGE_COUNT} pages and {TEMPLATE_COUNT} templates, all
              readable and copyable without an account, installable from the
              terminal or by an editor agent, under a commercial licence that
              is written out in public rather than implied on a pricing card.
            </p>
            <p>
              You have read more marketplace licences than most people alive,
              so the comparison below is written the way you would check it —
              including the two rows where a marketplace is the better answer.
            </p>
          </div>
        </section>

        <section
          className="mx-auto w-full max-w-5xl px-4 pb-14 sm:px-6 lg:px-8"
          aria-labelledby="compare-heading"
        >
          <h2 id="compare-heading" className="text-2xl font-bold tracking-tight">
            Side by side
          </h2>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-border/60">
            <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Question
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold">
                    Hoverlab
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold">
                    A marketplace
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {ROWS.map((row) => (
                  <tr key={row.question}>
                    <th scope="row" className="px-5 py-4 font-normal">
                      <span className="block font-medium">{row.question}</span>
                      <span className="mt-1 block max-w-lg text-xs text-muted-foreground">
                        {row.note}
                      </span>
                    </th>
                    <td className="px-4 py-4 text-center align-top">
                      <span className="inline-flex flex-col items-center gap-1">
                        {ICON[row.hoverlab]}
                        <span className="sr-only">{LABEL[row.hoverlab]}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center align-top">
                      <span className="inline-flex flex-col items-center gap-1">
                        {ICON[row.marketplace]}
                        <span className="sr-only">{LABEL[row.marketplace]}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          className="mx-auto w-full max-w-3xl px-4 pb-14 sm:px-6 lg:px-8"
          aria-labelledby="licence-heading"
        >
          <h2 id="licence-heading" className="text-2xl font-bold tracking-tight">
            The licence, in the part you will check first
          </h2>
          <div className="mt-4 space-y-4 text-body">
            <p>
              Free covers personal and non-commercial work. Pro is{' '}
              {formatPrice(PLANS.pro.priceCents)} once — less where you live,
              if you are somewhere we price regionally — and covers work you
              are paid for: client sites, your own products, work for an
              employer. Unlimited projects, unlimited clients, no per-project
              fee, no attribution.
            </p>
            <p>
              The part you are actually looking for:{' '}
              <strong className="font-semibold text-foreground">
                you may not repackage the catalog and sell it
              </strong>{' '}
              as a theme, a template pack or a UI kit. Building something
              substantial with these components and selling that is exactly
              what Pro is for. Rearranging the components and selling those is
              not, at any tier.
            </p>
            <p>
              That is the only line that has to exist, and it is written out in
              full rather than left to a support email.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/licence"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Read the licence in full
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Look at the catalog first
            </Link>
          </div>
        </section>

        <section
          className="mx-auto w-full max-w-3xl px-4 pb-6 sm:px-6 lg:px-8"
          aria-labelledby="sequence-heading"
        >
          <h2 id="sequence-heading" className="text-2xl font-bold tracking-tight">
            What you get if you leave an address
          </h2>
          <p className="mt-2 text-body">
            {AUTHOR_SEQUENCE.emails.length} emails over about two weeks, and
            then nothing until something is actually added. The subjects are
            listed because a sequence you can read the shape of before
            agreeing to it is the only kind worth agreeing to.
          </p>
          {/*
            The sequence is rendered from the same module that holds its copy,
            so this list cannot describe a sequence that is not the one
            somebody receives.
          */}
          <ol className="mt-4 space-y-1.5">
            {AUTHOR_SEQUENCE.emails.map((email) => (
              <li key={email.subject} className="flex gap-3 text-sm">
                <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">
                  {email.day === 0 ? 'now' : `day ${email.day}`}
                </span>
                <span>{email.subject}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            Being straight about the state of this: there is no mail provider
            wired up yet, so nothing sends today. The addresses are kept and
            the sequence above is written, which is why it can be quoted here
            rather than promised.
          </p>
        </section>

        <NewsletterSignup source="authors" />
      </main>

      <SiteFooter />
    </div>
  )
}
