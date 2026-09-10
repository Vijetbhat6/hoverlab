/**
 * The help centre — a page whose success is measured in tickets *not* filed.
 *
 *   announcement  the incident, if there is one, above everything
 *   search        the field is the page
 *   answers       the questions that deflect the most contacts
 *   feedback      did that work, asked while the reader is still here
 *   ticket        the escalation, last and unmissable
 *   footer        status and locale
 *
 * WHY SEARCH IS THE HERO. Everyone arriving here has a specific problem
 * already phrased in their head. A help centre that opens with categories
 * asks them to translate that phrasing into somebody else's taxonomy, and
 * the translation is where people give up and write to support instead.
 * The suggestion chips carry the four queries a support inbox actually
 * receives, so the common cases are one click rather than one sentence.
 *
 * WHY THE TICKET FORM IS AT THE BOTTOM AND NOT IN A MODAL. Hiding it
 * raises the cost of contacting you, which does reduce tickets — by
 * converting them into churn you never see. The honest version puts the
 * answers first and the form in plain sight underneath, so the reader who
 * needs a person reaches one on the first screen they landed on.
 *
 * THE INCIDENT IS ONE EVENT, STATED THREE TIMES. The announcement bar, the
 * status word in the footer and the `/status` route of the Help Centre
 * template are the same maintenance window. Blocks ship independent demo
 * data and composing them means reconciling it: a bar announcing an outage
 * above a footer reading "all systems normal" is not two components with
 * different defaults to a reader, it is a product that does not know
 * whether it is up.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { AnnouncementBar } from '@/lib/blocks/sources/announcement-bar'
import { HeroSearch } from '@/lib/blocks/sources/hero-search'
import { FaqGrid } from '@/lib/blocks/sources/faq-grid'
import { FeedbackWidget } from '@/lib/blocks/sources/feedback-widget'
import { SupportTicketForm } from '@/lib/blocks/sources/support-ticket-form'
import { FooterStatusLocale } from '@/lib/blocks/sources/footer-status-locale'

const HELP_LINKS = [
  { label: 'Help', href: '#' },
  { label: 'Docs', href: '/docs' },
  { label: 'Changelog', href: '/changelog' },
  { label: 'Status', href: '/status' },
]

/**
 * The queries a support inbox actually receives, not the ones a marketing
 * page wishes it did. Each is a task, phrased the way the person stuck on
 * it would phrase it.
 */
const COMMON_SEARCHES = [
  'Reset two-factor',
  'Change the billing email',
  'Export everything',
  'Seat limit reached',
]

/**
 * Answers, ordered by how much contact volume each one absorbs.
 *
 * Every one of these ends in a decision the reader can act on alone. An
 * answer that finishes with "contact support" belongs in the ticket form
 * below rather than here — it costs the reader a scroll and gains nothing.
 */
const COMMON_ANSWERS = [
  {
    question: 'I have lost my two-factor device.',
    answer:
      'Use one of the eight recovery codes issued when you turned 2FA on. If those are gone too, a workspace admin can reset your second factor from Settings → Team; we cannot do it for you, because a support agent who can disable 2FA is a way around 2FA.',
  },
  {
    question: 'Who receives our invoices?',
    answer:
      'The billing email on the account, which is separate from the owner’s login and can be a shared inbox. Change it under Billing → Details; the next invoice uses it, and past invoices are re-sendable to the new address from the same screen.',
  },
  {
    question: 'How do I get all of our data out?',
    answer:
      'Account → Export produces a ZIP of JSON and CSV, everything you have put in, with no plan gate and no notice period. Large workspaces are emailed a link when the file is ready, usually within the hour.',
  },
  {
    question: 'We have hit the seat limit mid-sprint.',
    answer:
      'Adding a seat is instant and prorated to the day — nobody is blocked while an invoice clears. If you would rather not add one, deactivating a dormant member frees their seat immediately and keeps everything they wrote.',
  },
  {
    question: 'Someone has left the company. What happens to their work?',
    answer:
      'Deactivate rather than delete. Their documents, comments and history stay where they are and reassign to whoever you name; deleting the account removes the person and keeps the work, but the audit trail then reads "deleted user", which is harder to answer questions about a year later.',
  },
  {
    question: 'Why is a page loading slowly for one person only?',
    answer:
      'Almost always a stale service worker. A hard reload fixes it. If it survives that, check the status page above — a regional degradation shows up as one office being slow while the rest of the company is fine.',
  },
]

export default function HelpCentrePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar
        badge="Status"
        message="Scheduled maintenance is in progress — dashboards and the CLI are unavailable."
        ctaLabel="Follow the status page"
        ctaHref="/status"
        storageKey="acme-help-maintenance"
      />

      <NavbarSimple
        brand="Acme"
        links={HELP_LINKS}
        activeLabel="Help"
        ctaLabel="Contact support"
        ctaHref="#ticket"
      />

      <main>
        {/*
          `inputId` is set rather than left to default. The block is a server
          component and cannot call `useId`, so its field id is a literal —
          fine on its own, a duplicate the moment a second search hero
          renders anywhere on the same document, which is exactly what the
          catalog hub does.
        */}
        <HeroSearch
          heading="Search before you write to us."
          subheading="Most of what reaches our inbox is answered on this page in about forty seconds. The four below are what people ask for most."
          placeholder="Describe what you are trying to do…"
          submitLabel="Search help"
          suggestions={COMMON_SEARCHES}
          inputId="help-centre-search"
        />

        <FaqGrid
          heading="The six that come up most"
          subheading="Ordered by how often they arrive, not by how interesting they are."
          items={COMMON_ANSWERS}
        />

        <FeedbackWidget
          heading="Did that answer it?"
          placeholder="Tell us which question you came for and did not find. That is the most useful thing on this page."
        />

        <div id="ticket">
          <SupportTicketForm
            heading="Still stuck"
            intro="One person reads every one of these. Include what you expected, what happened, and the workspace name — that is the difference between an answer and a first reply asking for details."
            submitLabel="Send to support"
          />
        </div>
      </main>

      {/* Same incident as the bar at the top of the page. */}
      <FooterStatusLocale productName="Acme" status="maintenance" statusHref="/status" />
    </div>
  )
}
