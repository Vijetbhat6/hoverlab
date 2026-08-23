import type { Metadata } from 'next'
import Link from 'next/link'

import {
  LegalTitle,
  LegalSection,
  LegalList,
  LegalFooterNav,
  ContactEmail,
  OperatorName,
} from '@/components/legal/legal-parts'
import { absoluteUrl } from '@/lib/site'

/**
 * /licence — what you may do with code taken from the catalog.
 *
 * This page is the Pro tier. Pro is pitched on five things, and of those
 * only the bundle cap is a wall the code can enforce: the CLI and `/api/v1`
 * are public by design, so "every export format" cannot be sold; the brand
 * colour picker recolours this site's own chrome and is free; private
 * collections are not built. What is left, and what this market actually
 * pays for, is the right to ship commercially — and that right could not
 * be sold because it had never been written down. Worse, /docs told every
 * visitor they already had it.
 *
 * So this document is the product, and the two grants below are drawn
 * where the pricing page has always drawn them: free covers personal and
 * non-commercial work, Pro covers work you are paid for. The docs now say
 * the same thing, which they did not before.
 *
 * The boundary is deliberately generous on the things that cost nothing to
 * give — learning, evaluating, unlimited projects, no attribution, no
 * phone-home — and firm on the one that matters: shipping for money, and
 * republishing the catalog as a competing product.
 */

const TITLE = 'Licence — Hoverlab'
const DESCRIPTION =
  'What you may do with Hoverlab code: free for personal and non-commercial work, Pro for anything you are paid for.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'hoverlab licence',
    'component library commercial license',
    'ui blocks license',
  ],
  alternates: { canonical: '/licence' },
  openGraph: {
    url: absoluteUrl('/licence'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
}

export default function LicencePage() {
  return (
    <>
      <LegalTitle
        title="Licence"
        summary={
          <p>
            The short version: copy anything, from anywhere, without an
            account — learning and trying things out are free and always will
            be. Use it in personal and non-commercial projects for free, in as
            many as you like, with no attribution. The moment the project is
            something you are paid for, you need{' '}
            <Link href="/pricing" className="font-medium text-primary hover:underline">
              Pro
            </Link>
            . The one thing neither licence allows is republishing the catalog
            as a rival to it.
          </p>
        }
      />

      <LegalSection id="what-is-covered" title="What this covers">
        <p>
          Everything in the catalog: CSS effects, blocks, pages and templates,
          along with the code produced for them by the site, the CLI
          (<code className="font-mono text-sm">npx hoverlab add</code>), the
          public API and the MCP server. All of it is licensed by{' '}
          <OperatorName /> under the terms below.
        </p>
        <p>
          A licence is granted to a person, not to a project. It is perpetual —
          Pro is bought once, and code you shipped under it stays licensed even
          if you never come back.
        </p>
      </LegalSection>

      <LegalSection id="free" title="The free licence">
        <p>Without paying anything, and without an account, you may:</p>
        <LegalList
          items={[
            'View, preview and copy every item in the catalog, and install any of it with the CLI or the API.',
            'Use it in unlimited personal projects, side projects, portfolios, experiments and learning material.',
            'Use it in non-commercial work: a hobby site, a student project, a charity or community site that makes no money, and internal prototypes that are never shipped.',
            'Modify it however you like. It is your code once it is in your project.',
            'Ship it with no attribution. A credit is welcome and never required.',
          ]}
        />
        <p>
          Nothing you copy calls home, and nothing we deploy can change or
          break code you already have. That is a property of how the catalog
          is built, not a promise this document has to keep.
        </p>
      </LegalSection>

      <LegalSection id="pro" title="The Pro licence">
        <p>
          Pro is a one-time purchase covering one developer, for life. It adds
          the right to use the catalog in commercial work:
        </p>
        <LegalList
          items={[
            'Products and sites you sell, charge subscriptions for, or run advertising on.',
            'Client work — websites and applications you are paid to build, for as many clients as you like. Your client may keep using what you built for them indefinitely.',
            'Work for your employer, on products your employer sells.',
            'Internal tools and dashboards inside a business.',
            'Unlimited end products. There is no per-project fee and no cap on how many things you ship.',
          ]}
        />
        <p>
          Pro also lifts the product limits described on the{' '}
          <Link href="/pricing" className="font-medium text-primary hover:underline">
            pricing page
          </Link>
          , and includes every item added to the catalog afterwards, at no
          further charge.
        </p>
      </LegalSection>

      <LegalSection id="team" title="The Team licence">
        <p>
          Team covers one seat per person, billed monthly. Each occupied seat
          carries the same rights as a Pro licence, for as long as the
          subscription is live. Code shipped while a seat was active stays
          licensed after it lapses; new work does not.
        </p>
        <p>
          An organisation may not buy one Pro licence and use it across a team.
          One licence, one developer — that is the whole of the seat rule.
        </p>
      </LegalSection>

      <LegalSection id="not-allowed" title="What neither licence allows">
        <p>
          These apply to free and paid users alike, because they are about
          competing with the catalog rather than about using it:
        </p>
        <LegalList
          items={[
            'Redistributing the catalog, or a substantial part of it, as a component library, template pack, theme, UI kit or catalog of your own — free or paid.',
            'Selling or giving away the code as the product itself, where what the buyer is paying for is the components rather than something you built with them.',
            'Publishing catalog items to a package registry, marketplace or gallery under your own name.',
            'Sublicensing, reselling or transferring your licence to someone else.',
            'Using the catalog as a training set for a machine-learning model intended to generate components.',
          ]}
        />
        <p>
          The dividing line is straightforward. Building something with these
          components and selling that is exactly what Pro is for. Repackaging
          the components and selling those is not, at any tier.
        </p>
      </LegalSection>

      <LegalSection id="edge-cases" title="Questions that come up">
        <LegalList
          items={[
            <>
              <strong className="font-semibold text-foreground">
                My side project makes a little money.
              </strong>{' '}
              Then it is commercial and needs Pro. It is a one-time $59 and it
              covers everything you ever ship.
            </>,
            <>
              <strong className="font-semibold text-foreground">
                I am a freelancer with several clients.
              </strong>{' '}
              One Pro licence covers you, across all of them. Your clients do
              not each need one.
            </>,
            <>
              <strong className="font-semibold text-foreground">
                I want to sell a template I built using these blocks.
              </strong>{' '}
              Talk to us at <ContactEmail /> first. If the blocks are a
              component of something substantial you designed, that is usually
              fine; if the template is largely the blocks rearranged, it is the
              redistribution case above.
            </>,
            <>
              <strong className="font-semibold text-foreground">
                Can I use it in an open-source project?
              </strong>{' '}
              Yes, if the project is non-commercial. Note that you cannot
              relicense the catalog code under your project&rsquo;s licence —
              it stays under this one.
            </>,
            <>
              <strong className="font-semibold text-foreground">
                I refunded my Pro purchase.
              </strong>{' '}
              The commercial grant ends with the refund. Anything you shipped
              before it stays licensed; keep shipping and you need to buy again.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="warranty" title="No warranty">
        <p>
          The catalog is provided as it is, without warranty of any kind. It is
          tested, but you are responsible for what you ship. See section 8 of
          the{' '}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          for the limits on liability.
        </p>
      </LegalSection>

      <LegalSection id="asking" title="If in doubt, ask">
        <p>
          This document tries to answer the common cases plainly rather than
          exhaustively. If your situation is not in it, email <ContactEmail />{' '}
          and describe it — we would rather give you a straight answer than
          have you guess.
        </p>
      </LegalSection>

      <LegalFooterNav current="/licence" />
    </>
  )
}
