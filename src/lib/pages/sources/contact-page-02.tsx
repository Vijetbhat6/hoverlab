/**
 * The contact page, take 02 — route first, write second.
 *
 *   doors       three reasons to be here, each with its own destination
 *   sales       a calendar, because that is what this door actually wants
 *   support     a structured ticket, because free text loses the details
 *   objections  what happens next, per door, with real response times
 *
 * Take 01 puts one form at the top and answers the four commonest questions
 * underneath. That is the right shape when every message lands in the same
 * inbox — one form, one queue, one person triaging.
 *
 * It stops being right the moment the messages have different destinations.
 * A single "how can we help?" textarea forces the sender to guess what you
 * need and forces you to reply asking for it, which is two round trips
 * before anyone has done anything. A buyer wants a time in a calendar. A
 * customer with a broken import wants to attach a file and a workspace id.
 * Neither is served by the same box.
 *
 * So the page opens on `persona-cards` as a router: pick the door, get the
 * form built for it. The cost is one extra click for everyone, and the
 * judgement is that the click is cheaper than the round trip it removes.
 *
 * Both destinations render inline rather than behind navigation, because a
 * router that hides its destinations is a page that looks empty on arrival.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { PersonaCards } from '@/lib/blocks/sources/persona-cards'
import { BookingScheduler } from '@/lib/blocks/sources/booking-scheduler'
import { SupportTicketForm } from '@/lib/blocks/sources/support-ticket-form'
import { FaqObjectionList } from '@/lib/blocks/sources/faq-objection-list'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const DOORS = [
  {
    name: 'I want to buy',
    headline: 'Book thirty minutes with someone who can answer pricing',
    bullets: [
      'Straight to a calendar, no qualification form first',
      'You will meet an engineer, not only an account executive',
      'Security questionnaire answered before the call if you send it',
    ],
    href: '#sales',
    ctaLabel: 'Pick a time',
  },
  {
    name: 'Something is broken',
    headline: 'File it with the details we will otherwise have to ask for',
    bullets: [
      'Workspace id and a file attachment, captured up front',
      'Median first reply four hours, business days, no bot',
      'Sev-1 during month-end close is paged, not queued',
    ],
    href: '#support',
    ctaLabel: 'Open a ticket',
  },
  {
    name: 'Everything else',
    headline: 'Press, partnerships, invoices, or a question about the company',
    bullets: [
      'hello@acme.example reaches four people',
      'Invoices and VAT: billing@acme.example',
      'Press: we will say yes to most things and answer within a day',
    ],
    href: 'mailto:hello@acme.example',
    ctaLabel: 'Email us',
  },
]

const WHAT_HAPPENS = [
  {
    id: 'sales',
    label: 'Booked a sales call',
    detail:
      'You get a confirmation with the agenda and the name of who is joining. No pre-call form. If you send the security questionnaire beforehand it is answered in the invite, so the thirty minutes are not spent reading it aloud.',
    tone: 'positive' as const,
    status: 'Instant',
  },
  {
    id: 'support-normal',
    label: 'Filed a support ticket',
    detail:
      'Auto-acknowledged with a ticket number, then a human reply. Four hours is the median and fourteen is the ninety-fifth percentile — both measured on business hours, both published on the status page.',
    tone: 'neutral' as const,
    status: '4h median',
  },
  {
    id: 'support-sev1',
    label: 'Filed a Sev-1 during close',
    detail:
      'Between the 28th and the 3rd, anything marked blocking pages the on-call engineer directly rather than entering the queue. This is the one route on the page with a phone attached to it.',
    tone: 'warning' as const,
    status: 'Paged',
  },
  {
    id: 'general',
    label: 'Emailed hello@',
    detail:
      'Read by four people, none of whom are a shared-inbox rota, which means it is occasionally slower than support and never routed to someone who cannot answer.',
    tone: 'neutral' as const,
    status: '1–2 days',
  },
]

export default function ContactPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Contact" ctaLabel="Book a call" ctaHref="#contact-page-02-sales" />

      <main>
        <PersonaCards
          heading="What brings you here?"
          subheading="Three doors, because a buyer and a customer with a broken import want completely different things and one textarea serves neither well."
          personas={DOORS}
        />

        <div id="contact-page-02-sales">
          <BookingScheduler
            heading="Thirty minutes, with an engineer in the room"
            description="No discovery form. If it turns out we are wrong for you, we would rather establish that in the first ten minutes than in the fourth call."
            durationMinutes={30}
            hostTimeZone="Europe/Lisbon"
          />
        </div>

        <div id="contact-page-02-support">
          <SupportTicketForm
            heading="Tell us what broke"
            intro="The fields below are the ones we would email you for anyway. Filling them in now is what turns a two-day thread into one reply."
            submitLabel="File the ticket"
          />
        </div>

        <FaqObjectionList
          heading="What happens after you send it"
          intro="Response times as measured, not as aspired to. The slow one is at the bottom and it is labelled."
          rows={WHAT_HAPPENS}
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
