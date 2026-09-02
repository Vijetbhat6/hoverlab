/**
 * A local-service landing page, assembled from blocks.
 *
 * The visitor is on a phone, two streets away, and comparing three
 * practices with the same five-star average. Almost nothing that works on a
 * SaaS page works here, and the running order says why:
 *
 *   navbar          the phone number is the CTA, not "start free"
 *   hero            an actual booking widget — pick a day, not "get in touch"
 *   stats           the four facts a local business is chosen on
 *   personas        which of these visits is yours, priced from
 *   testimonials    named locals, because that is who they trust
 *   prices          a price list for real treatments, not "plans"
 *   faq             parking, insurance, nervous patients, out of hours
 *   contact         a form and a map, because half of them will not book online
 *   footer          the registration numbers a regulated trade must publish
 *
 * THE BOOKING WIDGET IS THE PAGE. `<HeroBooking>` puts real days and slot
 * counts above the fold, which is the whole conversion. A "Contact us"
 * button in that position sends the visitor to whichever competitor let
 * them pick Thursday.
 *
 * WHY PRICES ARE ON IT. Local services habitually hide prices behind a
 * consultation, and the visitor reads that as expensive. Publishing the
 * list is the single highest-leverage difference between this page and the
 * one it replaces — including the numbers nobody likes quoting, because a
 * list with the awkward rows missing is read as a list with something to
 * hide.
 *
 * That section is a `<ComparisonTable>` rather than `<PricingTiers>`, which
 * was the obvious block and is the wrong one: its monthly/yearly toggle is
 * not optional, and "save 20% by paying annually" on a filling is nonsense.
 * A price list is a table.
 *
 * WHY THE FOOTER IS THE COMPLIANCE ONE. A regulated trade has to publish
 * its registration, its regulator and its complaints route. `<FooterMega>`
 * would look better and be missing the things an inspector asks for.
 *
 * Every section takes props, so this file is a running order rather than a
 * wall of copy — swap the content without touching the layout.
 */

import * as React from 'react'

import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroBooking } from '@/lib/blocks/sources/hero-booking'
import { StatsBand } from '@/lib/blocks/sources/stats-band'
import { PersonaCards } from '@/lib/blocks/sources/persona-cards'
import { TestimonialGrid } from '@/lib/blocks/sources/testimonial-grid'
import { ComparisonTable } from '@/lib/blocks/sources/comparison-table'
import { FaqCategorized } from '@/lib/blocks/sources/faq-categorized'
import { ContactFormSplit } from '@/lib/blocks/sources/contact-form-split'
import { FooterCompliance } from '@/lib/blocks/sources/footer-compliance'

export default function LocalServiceLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Kirkwood Dental"
        links={[
          { label: 'Treatments', href: '#treatments' },
          { label: 'Prices', href: '#prices' },
          { label: 'Visiting', href: '#visiting' },
        ]}
        activeLabel="Treatments"
        // The phone number, not a sign-in. Nobody has an account here, and a
        // fair share of this traffic would rather ring than type.
        signInLabel="0131 496 0000"
        signInHref="tel:+441314960000"
        ctaLabel="Book online"
        ctaHref="#book"
      />

      <main>
        <div id="book">
          <HeroBooking
            eyebrow="Stockbridge, Edinburgh — NHS and private"
            heading="A dentist you can get into this week"
            subheading="Same dentist every visit, prices on the wall, and an appointment that starts when it says it does. Taking new NHS patients as of this month."
            submitLabel="Book this slot"
          />
        </div>

        <StatsBand
          stats={[
            {
              value: '2004',
              label: 'practising on this street since',
              caption: 'Same building, third generation',
            },
            {
              value: '4.9',
              label: 'from 612 Google reviews',
              caption: 'We answer the bad ones too',
            },
            {
              value: '48 hrs',
              label: 'typical wait for a check-up',
              caption: 'Same day for anything painful',
            },
            {
              value: 'Yes',
              label: 'taking NHS patients',
              caption: 'Checked and updated every Monday',
            },
          ]}
        />

        <div id="treatments">
          <PersonaCards
            heading="What are you coming in for?"
            subheading="Most people arrive for one of these four. Prices are on the next section, in full, including the ones nobody likes quoting."
            personas={[
              {
                name: 'A check-up',
                headline: 'You are overdue and slightly embarrassed about it',
                bullets: [
                  'Nobody will comment on how long it has been',
                  'Examination, X-rays if needed, and a written plan',
                  'From £29 on the NHS band 1',
                ],
                ctaLabel: 'Book a check-up',
                href: '#book',
              },
              {
                name: 'Something hurts',
                headline: 'You need to be seen today, not in a fortnight',
                bullets: [
                  'Emergency slots held back every morning and afternoon',
                  'Ring before 9am and you will be seen the same day',
                  'Registered or not — we will not turn you away in pain',
                ],
                ctaLabel: 'Call the practice',
                href: 'tel:+441314960000',
              },
              {
                name: 'You are nervous',
                headline: 'The last time went badly and you have avoided it since',
                bullets: [
                  'A first appointment where nothing happens but talking',
                  'Sedation available, and a stop signal that we actually stop for',
                  'Two of our dentists are specifically trained for this',
                ],
                ctaLabel: 'Read how it works',
                href: '#visiting',
              },
              {
                name: 'Straightening or whitening',
                headline: 'You have been looking at this for a while',
                bullets: [
                  'Clear aligners, veneers and whitening, quoted before we start',
                  'A free 15-minute consultation with no obligation',
                  'Finance over 12 months at 0%',
                ],
                ctaLabel: 'See prices',
                href: '#prices',
              },
            ]}
          />
        </div>

        {/* Named locals with the treatment attached. A wall of anonymous
            five-star quotes is what every competing practice already has. */}
        <TestimonialGrid
          heading="What people round here say"
          subheading="Pulled from our Google reviews, with permission and without editing."
          testimonials={[
            {
              quote:
                'I had not been to a dentist in eleven years and had worked myself into a state about it. They gave me an appointment where they just talked me through it and did nothing else. Went back a fortnight later and got it all done.',
              name: 'Alison M.',
              role: 'Comely Bank',
              rating: 5,
            },
            {
              quote:
                'Rang at 8:40 with a broken filling and was in the chair by 11. No fuss about not being registered, and the price was what they said on the phone.',
              name: 'Tomasz K.',
              role: 'Stockbridge',
              rating: 5,
            },
            {
              quote:
                'Third generation of my family to use them. My gran went to the current dentist’s grandfather. They are not the cheapest and they have never once tried to sell me something I did not need.',
              name: 'Fiona R.',
              role: 'Dean Village',
              rating: 5,
            },
            {
              quote:
                'The aligners came in about £400 over the first estimate because I needed extra refinements. They flagged it before doing the work rather than on the invoice, which is the only reason this is still five stars.',
              name: 'Dan H.',
              role: 'New Town',
              rating: 5,
            },
            {
              quote:
                'Parking is genuinely a nightmare and they tell you so on the phone rather than letting you find out. Use the Raeburn Place car park.',
              name: 'Priya S.',
              role: 'Inverleith',
              rating: 4,
            },
            {
              quote:
                'They ran 25 minutes late once in four years and the receptionist rang me before I left the house.',
              name: 'George W.',
              role: 'Canonmills',
              rating: 5,
            },
          ]}
        />

        {/* A price LIST, not pricing tiers.
            `<PricingTiers>` was the obvious block and is the wrong one: its
            monthly/yearly toggle is not optional, and "save 20% by paying
            annually" on a filling is nonsense. A comparison table is what a
            price list actually is — treatments down the side, what each one
            costs under each arrangement across the top. */}
        <div id="prices">
          <ComparisonTable
            heading="Every price, on the page"
            subheading="Including the ones practices normally make you ring for. NHS bands are set nationally and change each April; the private column is ours."
            columns={['NHS Band 1', 'NHS Band 2', 'Private']}
            highlightColumn={1}
            rows={[
              { feature: 'Examination and diagnosis', values: ['£29.00', 'Included', 'From £95'] },
              { feature: 'X-rays, where clinically needed', values: ['Included', 'Included', 'Included'] },
              { feature: 'Scale and polish', values: ['If required', 'Included', 'From £75'] },
              { feature: 'Fillings', values: [false, '£78.00', 'From £145'] },
              { feature: 'Root canal treatment', values: [false, '£78.00', 'From £420'] },
              { feature: 'Extraction', values: [false, '£78.00', 'From £180'] },
              { feature: 'Emergency appointment', values: ['£29.00', '£29.00', '£110'] },
              { feature: 'Whitening', values: [false, false, 'From £320'] },
              { feature: 'Veneers, per tooth', values: [false, false, 'From £480'] },
              { feature: 'Clear aligners, full course', values: [false, false, '£1,900–£3,400'] },
              { feature: 'Written quote before treatment starts', values: [true, true, true] },
              { feature: '0% finance over 12 months, above £500', values: [false, false, true] },
              {
                feature: 'Free if under 18, pregnant, or on qualifying benefits',
                values: [true, true, false],
              },
            ]}
          />
        </div>

        <div id="visiting">
          <FaqCategorized
            eyebrow="Visiting us"
            heading="The things people ring up to ask"
            topics={[
              {
                name: 'Getting here',
                questions: [
                  {
                    question: 'Where do I park?',
                    answer:
                      'Honestly: not easily. Raeburn Place has a pay-and-display two minutes away and is your best bet. There is no practice car park and the residents’ bays are enforced. Give yourself ten minutes more than you think.',
                  },
                  {
                    question: 'Is the practice accessible?',
                    answer:
                      'Ground floor, step-free from the street, and one surgery with a wheelchair-accessible chair. The upstairs surgeries have no lift — tell us when booking and we will put you downstairs.',
                  },
                ],
              },
              {
                name: 'Cost and payment',
                questions: [
                  {
                    question: 'Am I entitled to free NHS treatment?',
                    answer:
                      'Under 18, under 19 and in full-time education, pregnant or having had a baby in the last 12 months, or on qualifying benefits. Bring the evidence to the first appointment — claiming without it and being checked later means paying the full charge plus a penalty.',
                  },
                  {
                    question: 'Will I be told the price before you start?',
                    answer:
                      'Always, in writing, and we do not begin until you have said yes to it. If something changes mid-treatment we stop and tell you rather than adding it to the bill.',
                  },
                ],
              },
              {
                name: 'If you are nervous',
                questions: [
                  {
                    question: 'Can I come in without having anything done?',
                    answer:
                      'Yes, and a fair number of people do. Fifteen minutes, sitting up, nothing in your mouth. Two of our dentists have specific training in dental anxiety and it is not treated as an unusual request.',
                  },
                  {
                    question: 'What sedation do you offer?',
                    answer:
                      'Inhalation sedation for most anxious patients and intravenous sedation for longer or more difficult work. Both need a chat first, and IV sedation needs someone to take you home.',
                  },
                ],
              },
              {
                name: 'Out of hours',
                questions: [
                  {
                    question: 'What do I do at the weekend?',
                    answer:
                      'Ring the practice number and the message gives you the NHS 24 dental line. For anything involving facial swelling, difficulty swallowing or uncontrolled bleeding, go to A&E rather than waiting for Monday.',
                  },
                ],
              },
            ]}
          />
        </div>

        {/* Roughly half of this traffic will not book online no matter how
            good the widget is. The form and the phone number are for them. */}
        <ContactFormSplit
          heading="Or just ask us something"
          subheading="A real person reads these during practice hours and answers the same day. If it is urgent, ring instead — we will always pick up faster than we type."
          channels={[
            { icon: 'chat', label: 'Reception', value: '0131 496 0000', href: 'tel:+441314960000' },
            { icon: 'mail', label: 'Email', value: 'hello@kirkwood.example', href: 'mailto:hello@kirkwood.example' },
            { icon: 'map', label: 'Find us', value: '14 Raeburn Place, Edinburgh EH4 1HN' },
          ]}
          responseNote="Weekdays 8am–6pm, Saturdays 9am–1pm. Closed Sundays and bank holidays."
          submitLabel="Send the message"
          successMessage="Thanks — we have got it and will come back to you today."
        />
      </main>

      {/* One region, not the block's default three. A single-site practice
          that renders a UK/EU/US switcher is claiming to be a multinational,
          and the regulator line is the part that has to be right. */}
      <FooterCompliance
        brand="Kirkwood Dental"
        paymentMethods={['Visa', 'Mastercard', 'Apple Pay', 'Cash']}
        regions={[
          {
            id: 'uk',
            label: 'United Kingdom',
            entity: 'Kirkwood Dental Care Ltd',
            registration:
              'Registered in Scotland, company no. SC418902. Regulated by the General Dental Council; practice registration no. 214880.',
            address: ['14 Raeburn Place', 'Edinburgh EH4 1HN', 'United Kingdom'],
            taxLine:
              'VAT registration GB 341 8802 17. Most dental treatment is VAT-exempt; cosmetic work may not be.',
            extraLinks: [
              { label: 'Complaints procedure', href: '#complaints' },
              { label: 'GDC register', href: '#gdc' },
              { label: 'Practice inspection reports', href: '#inspections' },
            ],
          },
        ]}
      />
    </div>
  )
}
