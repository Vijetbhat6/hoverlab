/**
 * The FAQ page, take 02 — objection-ordered, no search.
 *
 *   objections  the hard questions first, hardest at the top
 *   general     the rest, in two columns, because they are short
 *   security    the compliance subset, separated and labelled
 *   human       the widget, for the question the page did not answer
 *
 * Take 01 opens with `faq-search` because it assumes a long FAQ: forty-plus
 * questions where scanning is the bottleneck and the reader arrives from a
 * search engine holding a phrase.
 *
 * A search box over eighteen questions is worse than no search box. It adds
 * a keystroke commitment to a list that fits on two screens, and — worse —
 * it implies the list is long enough to get lost in, which makes the page
 * feel like a support portal rather than a sales objection handler. The
 * empty result state of a small FAQ is also its worst screen: the reader
 * types "refund", gets nothing, and concludes there is no refund policy.
 *
 * So this take sorts by discomfort instead. `faq-objection-list` takes the
 * top: price, lock-in, the missing certification, what happens if the
 * company dies. Those are the questions that lose deals, they are the ones
 * nobody types into a search box, and putting them first is the whole
 * argument of the page — a FAQ that opens on "how do I reset my password"
 * has been organised for the company's convenience.
 *
 * Security is split out rather than mixed in because it gets forwarded
 * alone. Someone sends this page's anchor to their IT reviewer, and that
 * reviewer should land on a list with no marketing in it.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { FaqObjectionList } from '@/lib/blocks/sources/faq-objection-list'
import { FaqTwoColumn } from '@/lib/blocks/sources/faq-two-column'
import { SecurityFaqList } from '@/lib/blocks/sources/security-faq-list'
import { SupportChatWidget } from '@/lib/blocks/sources/support-chat-widget'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const OBJECTIONS = [
  {
    id: 'price',
    label: 'You are more expensive than the two obvious alternatives',
    detail:
      'Yes, by roughly forty percent at the ten-seat tier. The difference is that our number includes the integration build and theirs does not — both of the alternatives quote implementation separately, and in the three deals we have lost on price this year, two of those implementations came in above our annual figure. Ask them for the combined number before comparing.',
    tone: 'warning' as const,
    status: '~40% higher',
  },
  {
    id: 'lock-in',
    label: 'What happens to our data if we leave?',
    detail:
      'Full export, including the reconciliation history and the match rules, as CSV and as the JSON the API returns. It is a button in settings, not a support request, and it works on a cancelled account for ninety days after the last billing date. We built it that way because we were burned by the reverse.',
    tone: 'positive' as const,
    status: 'Self-serve',
  },
  {
    id: 'soc2',
    label: 'Are you SOC 2 Type II?',
    detail:
      'No. Type I today; the Type II observation window closes in March and the report is expected in Q2. If your procurement process has a hard gate on Type II, we will fail it, and we would rather you learn that on this page than in week six of a pilot.',
    tone: 'critical' as const,
    status: 'Type I only',
  },
  {
    id: 'bus-factor',
    label: 'You are nineteen people. What if you go under?',
    detail:
      'Reasonable question and the honest answer is that we are revenue-funded and profitable, which makes us slow rather than fragile. There is a source escrow arrangement available on annual enterprise contracts. There is no acquisition clause we can promise you, because nobody can.',
    tone: 'neutral' as const,
    status: 'Escrow available',
  },
  {
    id: 'migration',
    label: 'How long does it take to switch?',
    detail:
      'Two weeks of elapsed time for a typical ten-seat finance team, of which roughly six hours is your work and the rest is us waiting for a full month of data to reconcile against. We will not claim a day. Anyone who claims a day has not migrated match rules.',
    tone: 'neutral' as const,
    status: '~2 weeks',
  },
]

const GENERAL = [
  {
    question: 'Do you have a free trial?',
    answer:
      'Fourteen days, no card, full product including the integrations. The only thing gated during the trial is bulk export, for the obvious reason.',
  },
  {
    question: 'Is there a minimum contract?',
    answer:
      'No. Monthly billing cancels at the end of the period you have paid for. Annual saves seventeen percent and is genuinely refundable pro rata in the first sixty days.',
  },
  {
    question: 'Which accounting systems do you connect to?',
    answer:
      'Nine live, three in beta and marked as such in the directory. If yours is not listed, the API is documented and two of the nine were originally built by customers.',
  },
  {
    question: 'Do you support multi-entity consolidation?',
    answer:
      'Yes, up to twelve entities on the standard plan. Inter-company elimination is manual — it is on the roadmap and it is not built, so do not buy us for it today.',
  },
  {
    question: 'Can we self-host?',
    answer:
      'No, and we have no plan to. If self-hosting is a requirement rather than a preference, we are the wrong vendor and the shortlist you want has three other names on it.',
  },
  {
    question: 'What are your support hours?',
    answer:
      'Weekdays, 08:00 to 19:00 UTC, with a real person. During month-end close, the 28th to the 3rd, anything marked blocking pages an on-call engineer outside those hours too.',
  },
  {
    question: 'Do you offer a discount for non-profits?',
    answer:
      'Fifty percent, no paperwork beyond your registration number, and it applies to the annual plan as well.',
  },
  {
    question: 'Who owns the data we put in?',
    answer:
      'You do. We do not train anything on it, we do not sell aggregate views of it, and the sub-processor list that can see it is published with thirty days of change notice.',
  },
]

const SECURITY = [
  {
    id: 'encryption',
    label: 'Encryption at rest and in transit',
    detail: 'AES-256 at rest, TLS 1.3 in transit. Keys rotated quarterly, managed in KMS.',
    tone: 'positive' as const,
    status: 'Yes',
  },
  {
    id: 'sso',
    label: 'SAML SSO and SCIM provisioning',
    detail: 'SAML 2.0 on the business plan and above. SCIM de-provisioning included, not an add-on.',
    tone: 'positive' as const,
    status: 'Business+',
  },
  {
    id: 'soc2-detail',
    label: 'SOC 2',
    detail: 'Type I report available under NDA today. Type II observation window closes March 2026.',
    tone: 'warning' as const,
    status: 'Type I',
  },
  {
    id: 'residency',
    label: 'Data residency',
    detail: 'EU (Frankfurt) or US (Virginia), chosen at workspace creation and not movable afterwards.',
    tone: 'neutral' as const,
    status: 'EU / US',
  },
  {
    id: 'pentest',
    label: 'Third-party penetration test',
    detail: 'Annual, most recently October 2025. Summary letter shared on request; full report under NDA.',
    tone: 'positive' as const,
    status: 'Annual',
  },
  {
    id: 'bcp',
    label: 'Documented disaster recovery test',
    detail: 'RPO 1 hour, RTO 4 hours. Last full restore drill was May 2025, which is older than we would like.',
    tone: 'warning' as const,
    status: 'May 2025',
  },
]

export default function FaqPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="FAQ" ctaLabel="Start a trial" ctaHref="#faq-page-02-general" />

      <main>
        <FaqObjectionList
          heading="The five questions that actually decide this"
          intro="Sorted by how uncomfortable they are, hardest first. Three of the five have answers that will lose us some readers, and those are the three worth reading."
          rows={OBJECTIONS}
        />

        <div id="faq-page-02-general">
          <FaqTwoColumn
            heading="Everything else"
            subheading="Short answers, because these are short questions. Eighteen of them in total, which is why this page has no search box."
            items={GENERAL}
            helpTitle="Not here?"
            helpBody="The chat below is a person during business hours and a form outside them. Either way it is answered by someone who can change the thing you are asking about."
            helpCtaLabel="Ask a human"
            helpCtaHref="#faq-page-02-human"
          />
        </div>

        {/*
          Split out rather than folded into the list above: this section
          gets forwarded on its own to an IT reviewer, and it should survive
          that trip without a sales sentence attached to it.
        */}
        <SecurityFaqList
          heading="For your security reviewer"
          intro="The same list we return on a questionnaire, including the two rows where the answer is not the one you want. Anchor-linkable — send this section, not the page."
          rows={SECURITY}
        />

        <div id="faq-page-02-human" className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
          <SupportChatWidget online waitMinutes={6} />
        </div>
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
