/**
 * The standalone FAQ page.
 *
 *   search       type a word, get the answer — the only interaction most
 *                visitors want on this page
 *   categorized  the same answers, browsable, for people who do not yet know
 *                the word to type
 *   cta          the way out for a question nobody wrote down
 *
 * Both, and in that order, because the two halves serve opposite visitors and
 * a page with only one of them fails half its traffic. Someone arriving from
 * a search engine has a phrase and wants to match it; someone arriving from
 * the navbar is browsing and has no phrase at all. A long accordion answers
 * the second and makes the first read forty questions.
 *
 * Distinct from `help-centre-page`, which is a support portal with articles,
 * a contact route and a ticket history. This is a marketing page: pre-sale
 * objections, answered before someone has an account to log into.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { FaqSearch } from '@/lib/blocks/sources/faq-search'
import { FaqCategorized } from '@/lib/blocks/sources/faq-categorized'
import { CtaInlineCard } from '@/lib/blocks/sources/cta-inline-card'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const SEARCHABLE = [
  {
    question: 'Is there a free plan?',
    answer:
      'There is a free tier rather than a trial: it does not expire, it is capped at one workspace and 500 transactions a month, and it never asks for a card. Most single-person users stay on it permanently.',
    keywords: ['free', 'trial', 'cost', 'price', 'card'],
  },
  {
    question: 'Can I export everything if I leave?',
    answer:
      'Yes, as CSV or JSON, from Settings → Data, without asking us. The export includes historical records, attachments and the audit log. It keeps working for 90 days after cancellation.',
    keywords: ['export', 'leave', 'cancel', 'lock-in', 'data', 'migrate'],
  },
  {
    question: 'Where is my data stored?',
    answer:
      'In the region chosen when the workspace is created — eu-west, us-east or ap-southeast — and it does not move. Backups stay in the same region.',
    keywords: ['gdpr', 'region', 'residency', 'eu', 'privacy', 'hosting'],
  },
  {
    question: 'Do you train models on my data?',
    answer:
      'No, and it is not a setting you have to find and turn off. Customer content is never used to train anything, by us or by a subprocessor; the DPA says so in a clause you can hold us to.',
    keywords: ['ai', 'model', 'training', 'llm', 'privacy'],
  },
  {
    question: 'What happens when I go over the plan limit?',
    answer:
      'Nothing stops working. You get an email at 80% and another at 100%, and overage bills at the per-unit rate on the pricing page. We do not lock an account for going over.',
    keywords: ['limit', 'overage', 'quota', 'usage', 'billing'],
  },
  {
    question: 'Is there an API?',
    answer:
      'A public REST API on every plan, free tier included, with no separate key purchase. Rate limits differ by plan and are published in the docs rather than discovered.',
    keywords: ['api', 'rest', 'integration', 'developer', 'webhook'],
  },
]

const TOPICS = [
  {
    name: 'Billing',
    questions: [
      {
        question: 'Can I change plan mid-month?',
        answer:
          'Yes, both directions, and the change is prorated to the day. Downgrades take effect immediately rather than at renewal, so you are not paying for a tier you have stopped using.',
      },
      {
        question: 'Do you invoice annually?',
        answer:
          'On any plan, with a 15% discount and net-30 terms. Purchase orders and bank transfer are fine; a procurement portal is fine too, though it will be slower than either of us would like.',
      },
      {
        question: 'Is VAT included in the listed price?',
        answer:
          'Prices are excluding VAT. It is added at checkout based on the billing country, and a valid EU VAT number reverse-charges it.',
      },
    ],
  },
  {
    name: 'Security',
    questions: [
      {
        question: 'Do you have SOC 2?',
        answer:
          'Type II, audited annually, and the report is available under NDA within a day of asking. The penetration-test summary is available without one.',
      },
      {
        question: 'Is SSO available on every plan?',
        answer:
          'SAML and OIDC are on Business and above. They are not priced as a separate security add-on, which is a practice we have opinions about.',
      },
      {
        question: 'How long do you keep deleted data?',
        answer:
          'Thirty days in soft delete, then purged from primaries and from backups within a further sixty. Immediate hard delete is available on request for anything with a legal reason behind it.',
      },
    ],
  },
  {
    name: 'Getting started',
    questions: [
      {
        question: 'How long does setup actually take?',
        answer:
          'Twenty minutes to a working workspace if your data is in a supported system, and about a day if it is in spreadsheets. The import step is the whole cost; everything after it is configuration you can change later.',
      },
      {
        question: 'Do you migrate my existing data?',
        answer:
          'Self-serve importers cover the six commonest sources. Above 100,000 records, a person on our side runs the migration with you — included, not a professional-services line item.',
      },
      {
        question: 'Can I try it with my real data before deciding?',
        answer:
          'That is the recommended way. Import into a sandbox workspace, which is free and disposable, and throw it away if the answer is no.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="FAQ" ctaLabel="Start free" ctaHref="#questions" />

      <main>
        <div id="questions">
          <FaqSearch
            eyebrow="Questions"
            heading="Type what you are worried about"
            placeholder="export, SSO, VAT, limits…"
            questions={SEARCHABLE}
            emptyHeading="Nobody has asked that yet"
            emptyBody="Which makes it a good question. Send it over and the answer goes on this page."
            contactLabel="Ask it"
            contactHref="#ask"
          />
        </div>

        <FaqCategorized
          eyebrow="Everything else"
          heading="Browse by what you are deciding"
          topics={TOPICS}
        />

        <div id="ask">
          <CtaInlineCard
            contextLabel="Still stuck"
            heading="Ask a person"
            body="Questions that reach us more than twice end up on this page, so asking genuinely helps the next reader as well as you."
            actionLabel="Contact support"
            fineprint="One working day, usually much less."
          />
        </div>
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
