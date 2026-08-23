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
 * /privacy — what is collected, why, who else sees it, and how to get rid
 * of it.
 *
 * Written from the code rather than from a template, and it names every
 * processor the app actually talks to: Firebase for accounts and stored
 * state, Polar for payments, PostHog for product analytics, Vercel for
 * hosting, and Resend only if a mailing key is configured. If a service is
 * added, it belongs in section 4 in the same commit.
 *
 * Two things stated plainly because they are true and unusual enough to be
 * worth saying: the catalog needs no account, and nothing anyone creates
 * here is used to train a model.
 *
 * PostHog is listed under cookies honestly — it persists to
 * `localStorage+cookie` (see analytics-provider.tsx). Under the EU/UK
 * ePrivacy rules that is non-essential storage and needs consent BEFORE it
 * is set, which means a consent banner, not just this disclosure. That work
 * is not done; section 6 says so rather than implying otherwise.
 */

const TITLE = 'Privacy Policy — Hoverlab'
const DESCRIPTION =
  'What Hoverlab collects, why, who processes it, and how to have it deleted.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
  openGraph: {
    url: absoluteUrl('/privacy'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
}

export default function PrivacyPage() {
  return (
    <>
      <LegalTitle
        title="Privacy Policy"
        summary={
          <p>
            The short version: you can browse and copy the entire catalog
            without an account and without telling us anything. If you make an
            account we store your email address and what you save. If you buy
            something, Polar handles the payment and we never see your card.
            We use PostHog to see which effects get copied. Nothing here is
            sold, and nothing here trains a model.
          </p>
        }
      />

      <LegalSection id="controller" title="1. Who is responsible">
        <p>
          <OperatorName />, at {OPERATOR.address}, is the data controller for
          the personal data described below. Contact us about anything on this
          page at <ContactEmail />.
        </p>
      </LegalSection>

      <LegalSection id="what-we-collect" title="2. What we collect, and why">
        <p>
          <strong className="font-semibold text-foreground">
            If you never make an account:
          </strong>{' '}
          nothing that identifies you is stored by us. The catalog, the
          designer tools, the CLI and the public API all work without one.
          Your browser keeps your favourites, recent items and preferences in
          its own local storage — that data stays on your device and is never
          sent to us.
        </p>
        <p>
          <strong className="font-semibold text-foreground">
            If you make an account:
          </strong>
        </p>
        <LegalList
          items={[
            <>
              <strong className="font-semibold text-foreground">Email address and display name</strong>{' '}
              — to identify your account and to send account email such as a
              password reset. Legal basis: performance of a contract.
            </>,
            <>
              <strong className="font-semibold text-foreground">Password</strong> —
              held by Firebase Authentication as a salted hash. We never see or
              store the password itself.
            </>,
            <>
              <strong className="font-semibold text-foreground">Your saved state</strong>{' '}
              — favourites, bundle contents, playground remixes. Stored so it
              follows you between devices, and for nothing else.
            </>,
            <>
              <strong className="font-semibold text-foreground">Purchase records</strong>{' '}
              — which plan you hold, when it was bought, and the amount Polar
              reported charging. Needed to give you what you paid for and to
              keep our books. Legal basis: contract, and legal obligation for
              the accounting records.
            </>,
          ]}
        />
        <p>
          <strong className="font-semibold text-foreground">
            If you join the mailing list:
          </strong>{' '}
          we store the address, where on the site you signed up, the date, and
          the exact sentence you agreed to. Legal basis: consent. Every email
          carries a one-click unsubscribe link, and using it is the whole of
          what is required to leave.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Analytics:</strong>{' '}
          we record product events — an effect viewed, an effect copied, a
          checkout started — with PostHog, to learn which parts of the catalog
          are worth expanding. Signed in, those events are tied to your
          account id. Legal basis: legitimate interest in understanding how the
          product is used; you can opt out (section 6).
        </p>
      </LegalSection>

      <LegalSection id="what-we-dont" title="3. What we do not do">
        <LegalList
          items={[
            'We do not sell personal data, and we do not share it for advertising.',
            'We do not use your playground remixes, bundles or any other content you create to train machine-learning models.',
            'We do not store IP addresses or user agents against a newsletter signup — neither is needed to send an email.',
            'We do not run advertising trackers, retargeting pixels or social widgets.',
          ]}
        />
      </LegalSection>

      <LegalSection id="processors" title="4. Who else processes your data">
        <p>
          These are the only third parties involved, and each is used for one
          thing:
        </p>
        <LegalList
          items={[
            <>
              <strong className="font-semibold text-foreground">Google Firebase</strong>{' '}
              (Authentication and Firestore) — accounts, and everything you
              save. Hosted in Google Cloud.
            </>,
            <>
              <strong className="font-semibold text-foreground">Polar</strong> —
              payments, as merchant of record. They receive your email address
              and take your payment details directly; we receive back only a
              record of what was purchased.
            </>,
            <>
              <strong className="font-semibold text-foreground">PostHog</strong> —
              product analytics.
            </>,
            <>
              <strong className="font-semibold text-foreground">Vercel</strong> —
              hosting. Vercel keeps standard server logs, which include IP
              addresses, for a limited period.
            </>,
            <>
              <strong className="font-semibold text-foreground">Resend</strong> —
              mailing list delivery, if and when a sending platform is
              configured. Until then, list addresses are stored only in
              Firestore.
            </>,
          ]}
        />
        <p>
          Some of these process data outside your country. Where that involves
          a transfer out of the EEA or the UK, it is covered by the standard
          contractual clauses in each provider&rsquo;s data processing terms.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="5. How long we keep it">
        <LegalList
          items={[
            'Account data and saved state: until you delete your account, then removed within 30 days.',
            'Purchase and invoice records: kept for as long as tax law requires, typically six to eight years, even after an account is closed.',
            'Mailing list entries: until you unsubscribe. An unsubscribed address is kept, marked as unsubscribed, so that we can prove you asked to leave and so you are not re-added by mistake.',
            'Analytics events: retained by PostHog under its own retention settings.',
          ]}
        />
      </LegalSection>

      <LegalSection id="cookies" title="6. Cookies and local storage">
        <p>Three kinds of storage are in play, and only the first is essential:</p>
        <LegalList
          items={[
            <>
              <strong className="font-semibold text-foreground">A session cookie</strong>{' '}
              set when you sign in. Without it you cannot stay signed in, so
              it is strictly necessary and is not subject to consent. It is
              cleared when you sign out.
            </>,
            <>
              <strong className="font-semibold text-foreground">Your browser&rsquo;s local storage</strong>{' '}
              — theme, reduced-motion preference, framework choice, recently
              viewed items and an anonymous favourites list. This never leaves
              your device. Clearing site data removes it.
            </>,
            <>
              <strong className="font-semibold text-foreground">PostHog analytics storage</strong>{' '}
              — a cookie and a local-storage entry that give your browser a
              persistent anonymous id. This is not essential.
            </>,
          ]}
        />
        <p>
          To be straight about it: the analytics storage is currently set when
          the page loads, before any consent is asked for. In the EU and the
          UK that is not good enough, and a consent prompt is owed. Until one
          ships, you can opt out completely by turning on Do Not Track, by
          using your browser&rsquo;s tracking protection, or by asking us at{' '}
          <ContactEmail /> to exclude you — we will do it by hand.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="7. Your rights">
        <p>
          If you are in the EEA or the UK, you have the right to access a copy
          of your data, to correct it, to have it erased, to restrict or object
          to processing, and to take it elsewhere in a portable format. Where
          we rely on consent — the mailing list — you can withdraw it at any
          time without giving a reason.
        </p>
        <p>
          Exercise any of these by emailing <ContactEmail />. We answer within
          30 days. You can also complain to your local data protection
          authority; we would rather you told us first.
        </p>
      </LegalSection>

      <LegalSection id="security" title="8. Security">
        <p>
          Passwords are hashed by Firebase and never seen by us. Card details
          are never transmitted to our servers. Sessions are held in an
          HTTP-only cookie, and every route that returns account data verifies
          that session on the server rather than trusting the browser.
        </p>
        <p>
          If a breach affects your data, we will tell you and the relevant
          authority as the law requires.
        </p>
      </LegalSection>

      <LegalSection id="children" title="9. Children">
        <p>
          The service is not directed at children under 13, and we do not
          knowingly collect their data. If you believe a child has made an
          account, tell us at <ContactEmail /> and we will delete it.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="10. Changes">
        <p>
          When this policy changes, the date at the top changes with it. A
          change that affects what we collect or who processes it will be
          announced on the site before it takes effect. The{' '}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          cover everything that is not about data.
        </p>
      </LegalSection>

      <LegalFooterNav current="/privacy" />
    </>
  )
}
