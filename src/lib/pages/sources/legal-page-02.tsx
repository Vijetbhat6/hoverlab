/**
 * The legal page, take 02 — one document, with a plain-language column.
 *
 *   header      which document, which version, when it changed
 *   clauses     each one twice: what it says, and what it means
 *   questions   the six things people email to ask about the terms
 *   consent     the cookie choice, on the page rather than in a banner
 *
 * Take 01 puts terms, privacy, DPA and cookies in one docs frame with a
 * sidebar, on the reasoning that people arrive looking for a specific clause
 * and a wall of text makes that a Ctrl-F expedition. That is right for the
 * reader who knows what they are looking for — usually a lawyer or a
 * procurement reviewer with a checklist.
 *
 * This take serves the reader who does not: a customer who got an email
 * saying the terms have changed, or someone who genuinely wants to know
 * whether you can read their ledger. For them a four-document sidebar is a
 * dead end, because they cannot name the clause they need. What they need is
 * a summary they can trust, sitting beside the text it summarises.
 *
 * Hence one document per page rather than four in a frame, and `feature-rows`
 * carrying each clause twice — the operative language and a plain sentence
 * saying what it does. The plain column is explicitly not the contract, and
 * the page says so once rather than footnoting every row.
 *
 * `cookie-consent` renders inline here instead of as a banner. A consent
 * control that only exists as an overlay is unreachable the moment someone
 * has dismissed it, which is precisely when they come looking for it.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { ArticleHeader } from '@/lib/blocks/sources/article-header'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'
import { CookieConsent } from '@/lib/blocks/sources/cookie-consent'
import { FooterCompliance } from '@/lib/blocks/sources/footer-compliance'

const CLAUSES = [
  {
    eyebrow: 'Clause 3 — Your data',
    title: 'You own everything you put in, and we do not train on it',
    body: '"Customer Data remains the exclusive property of Customer. Provider shall process Customer Data solely to provide the Services, and shall not use Customer Data to train, fine-tune or evaluate any machine learning model, whether or not such use is anonymised or aggregated."',
    bullets: [
      'In plain terms: your ledger is yours. We read it to reconcile it.',
      'We do not train models on it, including anonymised.',
      'We do not sell aggregate views of it to anyone.',
    ],
  },
  {
    eyebrow: 'Clause 7 — Ending the contract',
    title: 'Ninety days to export, and it is a button, not a request',
    body: '"Upon termination for any reason, Provider shall maintain Customer Data in an exportable state for ninety (90) days, accessible to Customer via self-service export. Provider shall not condition such export on settlement of outstanding fees."',
    bullets: [
      'In plain terms: you can leave and take everything with you.',
      'Ninety days after the last billing date, including if we terminated you.',
      'Unpaid invoices do not lock your export. That clause is deliberate.',
    ],
  },
  {
    eyebrow: 'Clause 11 — Sub-processors',
    title: 'Thirty days notice before anyone new can touch your data',
    body: '"Provider shall publish a current list of Sub-processors and shall give Customer not less than thirty (30) days written notice prior to authorising any new Sub-processor. Customer may object on reasonable data-protection grounds, in which case either party may terminate the affected Services without penalty."',
    bullets: [
      'In plain terms: you get a month’s warning and a right to object.',
      'If you object and we proceed, you can leave without a penalty.',
      'The current list is nine names and it is published, not on request.',
    ],
  },
  {
    eyebrow: 'Clause 14 — Liability',
    title: 'Capped at twelve months of fees, and this one is not in your favour',
    body: '"Provider’s aggregate liability arising out of or related to this Agreement shall not exceed the total fees paid by Customer in the twelve (12) months preceding the event giving rise to liability."',
    bullets: [
      'In plain terms: if we cause a loss, our exposure is one year of what you paid us.',
      'This is standard and it is still worse for you than for us. We are not going to pretend otherwise.',
      'It is negotiable on annual enterprise contracts, and only there.',
    ],
  },
  {
    eyebrow: 'Clause 18 — Changes to these terms',
    title: 'Thirty days notice, and you can refuse by leaving',
    body: '"Provider may amend these Terms upon thirty (30) days notice. Continued use following the effective date constitutes acceptance. Where an amendment materially reduces Customer rights, Customer may terminate without penalty within sixty (60) days of the effective date."',
    bullets: [
      'In plain terms: we email you a month before anything changes.',
      'If a change takes something away from you, you get sixty days to leave.',
      'Every past version stays published. Nothing is silently replaced.',
    ],
  },
]

const QUESTIONS = [
  {
    question: 'Can your staff read our ledger data?',
    answer:
      'Only with a support ticket referencing it, only for as long as the ticket is open, and every access is logged and exportable by you. Four engineers hold that access; it is not the whole company.',
  },
  {
    question: 'Where is the data physically stored?',
    answer:
      'Frankfurt or Northern Virginia, chosen when the workspace is created. It cannot be moved afterwards, and that constraint is in Clause 9 rather than buried in a support article.',
  },
  {
    question: 'What happens to our data if you are acquired?',
    answer:
      'Clause 21 requires the successor to be bound by these terms as written, and gives you sixty days to terminate without penalty on a change of control. It does not, and cannot, promise we will never be acquired.',
  },
  {
    question: 'Do you respond to law-enforcement requests?',
    answer:
      'Where legally required. We notify you first unless a court order forbids it, we publish a transparency count annually, and that count has been zero for three years running.',
  },
  {
    question: 'Is the DPA pre-signed?',
    answer:
      'Yes, and it is incorporated by reference rather than being a separate signature step. The standard contractual clauses are attached as Annex 2.',
  },
  {
    question: 'What counts as a "material" reduction in rights under Clause 18?',
    answer:
      'Anything touching your data ownership, the export right, the sub-processor notice period, or the liability cap. We have listed those four explicitly rather than leaving "material" to be argued about later.',
  },
]

const COOKIE_CATEGORIES = [
  {
    id: 'essential',
    name: 'Essential',
    description: 'Session and security. Cannot be turned off, and there are four of them.',
    essential: true,
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Self-hosted, IP-truncated page counts. No third party receives this, and it is off by default.',
  },
  {
    id: 'support',
    name: 'Support chat',
    description: 'Loads the chat widget and remembers your conversation. Off by default; turning it off hides the widget entirely.',
  },
]

export default function LegalPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Legal" ctaLabel="Download as PDF" ctaHref="#legal-page-02-clauses" />

      <main>
        <ArticleHeader
          category="Legal — Terms of Service"
          title="Terms of Service"
          standfirst="Version 4.2, effective 1 February 2026. Five clauses below are shown twice: the operative language, and a plain sentence saying what it does. The plain column is a summary and is not the contract — where they differ, the quoted text is what binds."
          author="Acme B.V."
          role="Amsterdam, Netherlands"
          date="1 February 2026"
          readMinutes={9}
        />

        {/*
          Each clause twice, side by side. The whole argument of this take:
          a reader who cannot name the clause they need is not served by a
          four-document sidebar, and is served by a summary sitting beside
          the text it summarises.
        */}
        <div id="legal-page-02-clauses">
          <FeatureRows
            heading="The five clauses people actually ask about"
            subheading="Out of thirty-one. The full document continues below these; the liability one is included because it is the clause least in your favour and leaving it out would make this section marketing."
            rows={CLAUSES}
          />
        </div>

        <FaqAccordion
          heading="What people email to ask"
          subheading="Six questions the terms answer but not in words anyone searches for."
          items={QUESTIONS}
        />

        {/*
          Inline rather than as a banner. A consent control that exists only
          as an overlay is unreachable the moment it has been dismissed —
          which is exactly when someone comes looking for it.
        */}
        <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <CookieConsent
            heading="Cookie choices"
            body="Your current settings, editable here rather than only in a banner you have already dismissed. Two of the three are off unless you turn them on."
            categories={COOKIE_CATEGORIES}
            policyHref="#legal-page-02-clauses"
            policyLabel="Read the cookie policy"
          />
        </div>
      </main>

      <FooterCompliance brand="Acme" />
    </div>
  )
}
