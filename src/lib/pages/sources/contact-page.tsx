/**
 * The contact page.
 *
 *   form      the channels, and a form for the people none of them fit
 *   faq       the four questions that are the reason for most of the messages
 *   footer    done
 *
 * Short on purpose. A contact page has one job and the commonest way to fail
 * it is to put the form third, under a hero and a paragraph about how much
 * the company values hearing from you.
 *
 * The FAQ underneath is doing real work rather than filling space: a
 * meaningful share of contact-form submissions are "where is my invoice",
 * "how do I cancel" and "do you have a DPA". Answering those here is faster
 * for the sender than a reply would be, and it leaves the inbox for the
 * messages that need a person.
 *
 * The response note is a commitment with a number in it. "We usually get
 * back quickly" is not a commitment, and a reader who has been told nothing
 * specific assumes the worst number they have ever experienced.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { ContactFormSplit } from '@/lib/blocks/sources/contact-form-split'
import { FaqGrid } from '@/lib/blocks/sources/faq-grid'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const CONTACT_FAQ = [
  {
    question: 'Where do I find an invoice?',
    answer:
      'Billing → Invoices, in your account. Every invoice is there as a PDF from the day the account was opened, including ones raised before you joined the team.',
  },
  {
    question: 'How do I cancel?',
    answer:
      'Billing → Plan → Cancel. It takes effect at the end of the period you have paid for, your data stays exportable for 90 days afterwards, and nobody will ring you about it.',
  },
  {
    question: 'Do you have a DPA and a security review pack?',
    answer:
      'Yes to both, and neither needs a sales conversation first. Ask here and they arrive as attachments, usually the same working day.',
  },
  {
    question: 'Something is broken right now.',
    answer:
      'Check status.example.com first — if it is us, the incident is already open and updating. If it is not, mark this form urgent and it routes to the on-call engineer rather than the queue.',
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Contact" ctaLabel="Sign in" ctaHref="#reach" />

      <main>
        <div id="reach">
          <ContactFormSplit
            heading="Talk to someone who can change the answer"
            subheading="Sales, support and the people who write the code all read this. Pick a subject and it goes to the right one of them."
            responseNote="Replies within one working day, and within two hours for anything marked urgent."
          />
        </div>

        <FaqGrid
          heading="Faster than waiting for us"
          subheading="Four things people write in about most. All four have an answer you can act on now."
          items={CONTACT_FAQ}
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
