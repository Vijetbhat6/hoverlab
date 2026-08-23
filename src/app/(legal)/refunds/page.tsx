import type { Metadata } from 'next'
import Link from 'next/link'

import {
  LegalTitle,
  LegalSection,
  LegalList,
  LegalFooterNav,
  ContactEmail,
} from '@/components/legal/legal-parts'
import { absoluteUrl } from '@/lib/site'

/**
 * /refunds — when money comes back, and how to ask.
 *
 * A payment processor will not release live mode without this page, and a
 * catalog sold as a one-time purchase needs it more than most: the customer
 * has the code the moment they pay, so "you already downloaded it" is the
 * obvious excuse for refusing, and saying up front that we do not use it is
 * worth more than the occasional refund costs.
 *
 * The two shapes are deliberately different because the products are: Pro
 * is bought once and kept, so it gets a fixed window; Team renews, so the
 * remedy is cancelling the next charge rather than unwinding the last one.
 */

const TITLE = 'Refund Policy — Hoverlab'
const DESCRIPTION =
  'A 14-day refund on Pro, no questions asked, and how cancellation works on Team.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/refunds' },
  openGraph: {
    url: absoluteUrl('/refunds'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
}

export default function RefundsPage() {
  return (
    <>
      <LegalTitle
        title="Refund Policy"
        summary={
          <p>
            The short version: email <ContactEmail /> within 14 days of buying
            Pro and you get your money back. You do not have to explain why,
            and we will not ask you to delete anything you already installed.
            Team is a subscription — cancel it and the next charge stops.
          </p>
        }
      />

      <LegalSection id="pro" title="Pro — 14 days, no questions">
        <p>
          Pro is a one-time purchase. If it is not what you expected, ask for a
          refund within 14 days of the payment and we will issue it in full.
        </p>
        <LegalList
          items={[
            'No reason is required. "Changed my mind" is a reason.',
            'We will not ask you to prove you removed the code from your projects. You have it, it works offline, and pretending otherwise would waste both our time.',
            'The refund goes back to the card or account you paid from, via Polar. It usually lands within 5–10 business days, depending on your bank.',
            'Once refunded, the licence ends: the commercial rights it granted stop, and Pro features return to their free limits.',
          ]}
        />
        <p>
          After 14 days we will still look at it. A refund outside the window
          is at our discretion, and the usual answer is yes if something on
          our side misled you.
        </p>
      </LegalSection>

      <LegalSection id="team" title="Team — cancel any time">
        <p>
          Team is billed monthly per seat. Cancel from the account page or by
          emailing us, and:
        </p>
        <LegalList
          items={[
            'The next charge does not happen.',
            'Access continues to the end of the period you have already paid for — we do not cut you off mid-month.',
            'Part-months are not refunded as a rule, because the seats were available to use for that period.',
            'The exception is a first charge you did not intend — a duplicate, or a renewal you meant to cancel and told us about within 7 days. We refund those in full.',
          ]}
        />
        <p>
          Some Team features are still being built and are marked as such on
          the{' '}
          <Link href="/pricing" className="font-medium text-primary hover:underline">
            pricing page
          </Link>
          . If you bought Team for one of those, say so and you get a full
          refund regardless of how long ago it was — selling something that is
          not there is our mistake, not your buyer&rsquo;s remorse.
        </p>
      </LegalSection>

      <LegalSection id="how" title="How to ask">
        <p>
          Email <ContactEmail /> from the address on the account, or reply to
          your receipt from Polar. Include the invoice number if you have it.
          One message is enough — there is no form.
        </p>
        <p>
          We aim to answer within two business days and to have the money
          moving the same day we agree it.
        </p>
      </LegalSection>

      <LegalSection id="chargebacks" title="Chargebacks">
        <p>
          Please write to us before raising a chargeback with your bank. A
          chargeback costs us a fee and takes months to resolve, where an email
          takes a day, and we have never refused a good-faith refund request.
          Accounts with an open chargeback are suspended until it is settled.
        </p>
      </LegalSection>

      <LegalSection id="statutory" title="Your statutory rights">
        <p>
          If you are a consumer in the EU or the UK, you have a statutory
          right to withdraw from a distance purchase within 14 days. Digital
          content delivered immediately can be excluded from that right, and
          checkout asks you to agree to immediate delivery — but this policy
          gives you the same 14 days anyway, so the distinction should never
          matter to you. Nothing here reduces any right you have by law.
        </p>
      </LegalSection>

      <LegalFooterNav current="/refunds" />
    </>
  )
}
