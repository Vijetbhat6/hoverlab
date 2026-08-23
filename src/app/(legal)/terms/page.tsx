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
import { OPERATOR } from '@/lib/legal'
import { absoluteUrl } from '@/lib/site'

/**
 * /terms — the agreement between the operator and everyone using the site.
 *
 * Written against what the code actually does, not from a template: the
 * catalog is public and copyable without an account, the CLI and `/api/v1`
 * are unauthenticated, Pro is a one-time purchase and Team is a recurring
 * per-seat subscription whose shared-workspace features are not built yet.
 * Every one of those facts changes a clause, and a generic template would
 * have got all of them wrong.
 *
 * What this page is NOT: legal advice, or a substitute for having a lawyer
 * read it. It is a complete, honest first draft that names the right
 * parties and describes the real service, which is what a lawyer needs to
 * start from and what a payment processor needs to see.
 */

const TITLE = 'Terms of Service — Hoverlab'
const DESCRIPTION =
  'The agreement covering use of the Hoverlab catalog, CLI, API and paid plans.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/terms' },
  openGraph: {
    url: absoluteUrl('/terms'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
}

export default function TermsPage() {
  return (
    <>
      <LegalTitle
        title="Terms of Service"
        summary={
          <>
            <p>
              The short version: browsing and copying the catalog is free and
              needs no account. What you may do with the code you copy is set
              out in the{' '}
              <Link href="/licence" className="font-medium text-primary hover:underline">
                Licence
              </Link>
              , not here. If you buy Pro or Team, the{' '}
              <Link href="/refunds" className="font-medium text-primary hover:underline">
                Refund Policy
              </Link>{' '}
              says when you get your money back. This page covers everything
              else — accounts, acceptable use, and who is liable for what.
            </p>
          </>
        }
      />

      <LegalSection id="who-we-are" title="1. Who you are agreeing with">
        <p>
          Hoverlab is operated by <OperatorName />, at {OPERATOR.address}
          {'. '}
          In these terms, &ldquo;we&rdquo; and &ldquo;us&rdquo; mean that
          entity, and &ldquo;you&rdquo; means the person or organisation using
          the site.
        </p>
        <p>
          By using the site, the CLI, the public API or the MCP server, you
          agree to these terms. If you do not agree to them, do not use the
          service.
        </p>
      </LegalSection>

      <LegalSection id="the-service" title="2. What the service is">
        <p>
          Hoverlab is a catalog of user-interface code — CSS effects, React
          blocks, full pages and starter templates — with live previews, a
          command-line installer (<code className="font-mono text-sm">npx hoverlab</code>),
          a public HTTP API and an MCP server for AI coding agents.
        </p>
        <LegalList
          items={[
            'Browsing, previewing and copying the catalog does not require an account.',
            'An account adds saved favourites, a synced bundle and the playground.',
            'Pro is a one-time purchase. Team is a per-seat monthly subscription.',
            'The CLI, the public API and the MCP server are open to everyone, with or without an account.',
          ]}
        />
        <p>
          We may add, change or remove catalog items and features. Where a
          change removes something you paid for, section 7 applies.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="3. Accounts">
        <p>
          You are responsible for what happens under your account and for
          keeping your password to yourself. Tell us at <ContactEmail /> if you
          think someone else has access to it.
        </p>
        <p>
          You must be old enough to enter a contract where you live. You may
          close your account at any time from the account page; see the{' '}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>{' '}
          for what happens to your data when you do.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="4. Acceptable use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            'Redistribute the catalog, or a substantial part of it, as a competing catalog, component library, template pack or theme — see the Licence for what you may ship.',
            'Scrape the site or hammer the public API at a rate that degrades it for others. The API has no key today; that is trust, not an invitation.',
            'Resell, share or publish account credentials, or use one Pro licence across an organisation in place of buying seats.',
            'Attempt to break, probe or circumvent the authentication, billing or entitlement systems.',
            'Use the service to build or distribute anything unlawful.',
          ]}
        />
        <p>
          We may suspend or close an account that does any of these. Where the
          breach is honest and fixable we will say so before acting.
        </p>
      </LegalSection>

      <LegalSection id="paid-plans" title="5. Paid plans and billing">
        <p>
          Payments are processed by Polar, who act as merchant of record. Your
          card details never reach our servers. Polar handles sales tax and
          VAT, and issues the invoice.
        </p>
        <LegalList
          items={[
            'Pro is charged once. It does not renew, and it does not expire.',
            'Team is charged monthly per seat until cancelled. Cancelling stops the next charge; access continues to the end of the period you have already paid for.',
            'Prices shown on the site are for display. The amount charged at checkout is authoritative, and is what appears on your invoice.',
            'Some Team features — shared brand tokens, shared collections, seat management — are marked "soon" on the pricing page because they are not built yet. Do not buy Team for those features today.',
          ]}
        />
        <p>
          Refunds are covered by the{' '}
          <Link href="/refunds" className="font-medium text-primary hover:underline">
            Refund Policy
          </Link>
          , which forms part of these terms.
        </p>
      </LegalSection>

      <LegalSection id="your-content" title="6. Your content">
        <p>
          Anything you create in the playground, save to a bundle or upload
          stays yours. We store it to provide the service — to sync it between
          your devices — and for no other purpose. We do not use it to train
          models, and we do not publish it.
        </p>
      </LegalSection>

      <LegalSection id="availability" title="7. Availability and changes">
        <p>
          The service is provided as it is, without a guarantee of uptime. We
          do not promise the site will be available at any particular moment,
          or that a given catalog item will remain in the catalog.
        </p>
        <p>
          Code you have already copied or installed is unaffected by any of
          this: it lives in your project, it does not call home, and nothing
          we deploy can break it. That is a deliberate property of the product
          rather than a promise made in a document.
        </p>
        <p>
          If we discontinue the service entirely within twelve months of a Pro
          purchase, contact us at <ContactEmail /> and we will refund it in
          full, whatever the refund window says.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="8. Liability">
        <p>
          To the extent the law allows, we are not liable for indirect or
          consequential loss — lost profits, lost data, or business
          interruption — arising from your use of the service or of code
          copied from it. Our total liability to you is limited to the amount
          you have paid us in the twelve months before the claim.
        </p>
        <p>
          Nothing here limits liability for death, personal injury, fraud, or
          anything else that cannot lawfully be limited. If you are a consumer,
          your statutory rights are unaffected.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="9. Changes to these terms">
        <p>
          We may update these terms. The date at the top of this page tells
          you which version is current. A material change — one that affects
          what you may do, or what you pay — will be announced on the site,
          and where we hold your email address, by email. Continuing to use
          the service after a change means you accept it.
        </p>
      </LegalSection>

      <LegalSection id="law" title="10. Governing law">
        <p>
          These terms are governed by the law of {OPERATOR.jurisdiction}, and
          the courts there have jurisdiction over any dispute. If you are a
          consumer, this does not deprive you of the protection of the
          mandatory law of the country where you live.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="11. Contact">
        <p>
          Questions, complaints and legal notices go to <ContactEmail />, or by
          post to <OperatorName /> at {OPERATOR.address}.
        </p>
      </LegalSection>

      <LegalFooterNav current="/terms" />
    </>
  )
}
