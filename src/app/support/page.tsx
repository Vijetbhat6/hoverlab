/**
 * /support — what you get when something goes wrong.
 *
 * WHY THE PAGE EXISTS
 *
 * `/compare` records, in its own data, the one row where a competitor beats
 * us outright and we had nothing to say: Aceternity sells a private Discord
 * and a 48-hour response as features of a $199 licence. This site made no
 * commitment at all — not a weak one, none — and a buyer reading two
 * pricing pages side by side scores silence as zero.
 *
 * WHY IT IS SHAPED LIKE THIS
 *
 * Two rules, both borrowed from pages that already got this right on this
 * site.
 *
 * From `/accessibility`: state the limit in the same breath as the claim.
 * The response targets here are business-day targets from a small team, and
 * the page says so above the table rather than in a footnote. A target
 * quietly stated as if it were an SLA is the kind of promise that turns
 * into a refund request.
 *
 * From `lib/social.ts`: never render a door that opens onto nothing. Every
 * channel on this page comes from `supportChannels()`, which returns only
 * what this deployment has actually been configured with. On a deployment
 * with no Discord invite and no operator email, this page says there is no
 * channel yet — which is embarrassing and true, and better than a link to
 * discord.com's home page.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock, LifeBuoy, MessageCircle, ShieldCheck } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'
import { PLANS, formatPrice } from '@/lib/billing/plans'
import { SUPPORT_TIERS, supportChannels, supportFor } from '@/lib/billing/support'

const TITLE = 'Support — what you get when something breaks — Hoverlab'
const DESCRIPTION =
  'Response targets by plan, the channels that are actually open, and what falls outside support. Business-day targets from a small team, stated plainly rather than as an SLA.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['ui library support', 'component library support', 'hoverlab support'],
  alternates: { canonical: '/support' },
  openGraph: {
    url: absoluteUrl('/support'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/**
 * The plans a buyer actually chooses between.
 *
 * Renewals and the AI add-on carry a support tier so the type stays
 * exhaustive, but neither is a thing anyone buys first, and listing eight
 * rows to describe three commitments would obscure the three.
 */
const LADDER = ['free', 'pro', 'studio', 'team'] as const

export default function SupportPage() {
  const channels = supportChannels()

  return (
    <div className="relative flex min-h-screen flex-col">
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Support' }])} />
      <SiteHeader />

      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-12 sm:px-6">
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Support
          </p>
          <h1 className="type-page mt-2">What you get when something breaks</h1>
          <p className="mt-4 text-pretty text-body">
            Most of this catalog needs no support at all — the source is on the page,
            the licence is one sentence, and nothing phones home. This page is for the
            rest: a block that renders wrong, an export that will not open, an invoice
            that needs a company name on it.
          </p>

          {/*
            The limit, before the table rather than after it. Everything
            below is a target from a small team during business hours, and a
            reader who stops here should already know that.
          */}
          <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
            <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Clock aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                These are <strong className="font-semibold text-foreground">targets</strong>,
                not a contractual service level. They are measured in business days, they
                describe a first reply rather than a fix, and they come from a small team
                rather than a support desk. Nothing on this page changes the refund terms
                in the{' '}
                <Link href="/refunds" className="underline underline-offset-4 hover:text-foreground">
                  refund policy
                </Link>
                .
              </span>
            </p>
          </div>
        </header>

        {/* ------------------------------------------------------------ *
         *  By plan
         * ------------------------------------------------------------ */}
        <section className="mt-12">
          <h2 className="type-section flex items-center gap-2">
            <LifeBuoy aria-hidden className="h-5 w-5 text-muted-foreground" />
            By plan
          </h2>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Plan
                  </th>
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Support
                  </th>
                  <th scope="col" className="py-2 font-semibold">
                    First reply
                  </th>
                </tr>
              </thead>
              <tbody>
                {LADDER.map((id) => {
                  const plan = PLANS[id]
                  const tier = supportFor(id)
                  return (
                    <tr key={id} className="border-b border-border/60 align-top">
                      <th scope="row" className="py-3 pr-4 font-medium">
                        {plan.name}
                        <span className="ml-2 font-normal text-muted-foreground">
                          {plan.priceCents === 0 ? 'Free' : formatPrice(plan.priceCents)}
                        </span>
                      </th>
                      <td className="py-3 pr-4 text-muted-foreground">{tier.label}</td>
                      <td className="py-3 text-muted-foreground">
                        {tier.responseDays === null
                          ? 'No target'
                          : `${tier.responseDays} business day${tier.responseDays === 1 ? '' : 's'}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <dl className="mt-6 space-y-4">
            {Object.values(SUPPORT_TIERS).map((tier) => (
              <div key={tier.id}>
                <dt className="text-sm font-semibold">{tier.label}</dt>
                <dd className="mt-1 text-pretty text-sm text-muted-foreground">{tier.summary}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ------------------------------------------------------------ *
         *  Channels
         * ------------------------------------------------------------ */}
        <section className="mt-12">
          <h2 className="type-section flex items-center gap-2">
            <MessageCircle aria-hidden className="h-5 w-5 text-muted-foreground" />
            Where to ask
          </h2>

          {channels.length === 0 ? (
            /*
              The honest empty state. It renders when neither an operator
              email nor a community URL is configured — which is the state
              of any deployment that has not had those values set, this one
              included until they are. Saying so is better than inventing a
              door.
            */
            <p className="mt-4 text-pretty text-body text-muted-foreground">
              No support channel is open yet. The response targets above apply from the
              moment one is — until then, the catalog source on every artifact page is the
              honest answer to most questions, and nothing here is gated behind asking.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {channels.map((channel) => (
                <li key={channel.id} className="rounded-lg border border-border p-4">
                  <a
                    href={channel.href}
                    className="text-sm font-semibold underline underline-offset-4"
                  >
                    {channel.label}
                  </a>
                  <p className="mt-1 text-pretty text-sm text-muted-foreground">{channel.use}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ------------------------------------------------------------ *
         *  Scope
         * ------------------------------------------------------------ */}
        <section className="mt-12">
          <h2 className="type-section flex items-center gap-2">
            <ShieldCheck aria-hidden className="h-5 w-5 text-muted-foreground" />
            What support covers
          </h2>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">In scope</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li>A block, page or effect that does not render as shown.</li>
                <li>An export, CLI command or MCP tool that fails.</li>
                <li>Licences, seats, invoices and refunds.</li>
                <li>Accessibility findings in a shipped artifact.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Out of scope</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {/*
                  Stated because the boundary is the honest part. A catalog
                  licence is not a retainer, and pretending otherwise is how
                  a two-day target becomes a two-week one for everybody.
                */}
                <li>Debugging your application around a block.</li>
                <li>Custom design or bespoke component work.</li>
                <li>Framework, build and deployment problems generally.</li>
                <li>Anything under an NDA or a vendor security questionnaire.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold">Before you write in</h2>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">
            Every artifact ships its source on its own page, and{' '}
            <Link href="/accessibility" className="underline underline-offset-4 hover:text-foreground">
              the accessibility evidence
            </Link>{' '}
            is published per artifact. Blocks and pages can be opened as a running
            project from their detail page, which answers most &ldquo;does this actually
            work&rdquo; questions faster than a reply would.
          </p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
          >
            See what each plan includes
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
