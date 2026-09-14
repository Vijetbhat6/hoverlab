/**
 * /book — the reservation screen, which is the only conversion on the site.
 *
 *   hero       the next four nights with counts, so the answer is immediate
 *   picker     the real slot grid, with a time zone on it
 *   terms      what happens after you press the button
 *   answers    large tables, cancellations, deposits, accessibility
 *
 * TWO BOOKING BLOCKS ON ONE PAGE IS DELIBERATE and it is the interesting
 * decision here. <HeroBooking> answers "is there any point continuing" in
 * the first screen — four nights, a number of free slots on each — while
 * <BookingScheduler> is the actual grid you choose from. Most restaurant
 * sites ship only the second, which means a visitor with no free table on
 * their night has to work that out by clicking through five days.
 *
 * <HeroBooking>'s `days` ARE PASSED EXPLICITLY, not left to the demo data.
 * The block's defaults are generic weekday names, and a restaurant that is
 * shut on Mondays and Tuesdays rendering "Mon 3 slots" is teaching the
 * template's reader to ship a booking page that lies. The days here match
 * the opening hours the rest of the site states.
 *
 * NO `onBook` OR `onConfirm` HANDLER IS PASSED. Both blocks are client
 * components and this page is a server component — a function cannot cross
 * that boundary, and passing one is the error that has to be caught at the
 * page level because nothing about the block's own types prevents it. The
 * blocks fall back to their own internal confirmation, which is the right
 * behaviour for a template: the reader wires it to their own booking
 * provider and that is a one-line change in one place.
 *
 * THE TERMS SECTION EXISTS BECAUSE THE CANCELLATION POLICY IS PART OF THE
 * PRODUCT. A no-show costs a 38-cover restaurant a measurable amount, and
 * every deposit policy is experienced as a nasty surprise unless it is
 * stated before the button rather than in a confirmation email.
 *
 * Anchors are prefixed `bk-`.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroBooking } from '@/lib/blocks/sources/hero-booking'
import { BookingScheduler } from '@/lib/blocks/sources/booking-scheduler'
import { ProductSpecSplit } from '@/lib/blocks/sources/product-spec-split'
import { FaqTwoColumn } from '@/lib/blocks/sources/faq-two-column'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

/* Wednesday to Sunday — the nights the kitchen is actually open. */
const NIGHTS = [
  { weekday: 'Wed', day: '18', slots: 6 },
  { weekday: 'Thu', day: '19', slots: 4 },
  { weekday: 'Fri', day: '20', slots: 1 },
  { weekday: 'Sat', day: '21', slots: 0 },
]

const SITTINGS = [
  { date: 'Wed 18 Mar', slots: ['18:00', '18:30', '19:00', '20:15', '20:45', '21:00'] },
  { date: 'Thu 19 Mar', slots: ['18:00', '18:30', '20:30', '21:00'] },
  { date: 'Fri 20 Mar', slots: ['18:00'] },
  { date: 'Sat 21 Mar', slots: [] },
  { date: 'Sun 22 Mar', slots: ['12:00', '12:30', '13:00', '14:30', '15:00'] },
]

const TERMS = [
  {
    label: 'No deposit for five or fewer',
    detail:
      'Give us a card only for tables of six or more, where a no-show is a quarter of the room. Nothing is charged unless you do not arrive and do not tell us.',
  },
  {
    label: 'Cancel free up to 24 hours before',
    detail:
      'One click in the confirmation email, or ring us. Inside 24 hours we will always try to fill the table first and only charge if we cannot.',
  },
  {
    label: 'Your table is yours for the evening',
    detail:
      'One sitting per table, so there is no second booking waiting behind you and nobody will ask you to leave. The 12:00 and 12:30 Sunday slots are the exception — those are lunch.',
  },
  {
    label: 'We hold the table for twenty minutes',
    detail:
      'After that we may release it, because someone is usually waiting. Ring if you are running late and we will hold it as long as we can.',
  },
]

const ANSWERS = [
  {
    question: 'I need a table for eight. Why can I not book it here?',
    answer:
      'Six and above goes through the phone, because we want to talk about the menu first — large tables eat differently and we would rather plan it than improvise on the night. Ring 0117 946 2210 from 4pm on a service day.',
  },
  {
    question: 'Nothing is available on the night I want. Is there a waiting list?',
    answer:
      'Yes, and it moves — roughly one table in six comes back to us on any given evening. Join it from the slot grid above and you will get a text the moment something opens, with twenty minutes to take it.',
  },
  {
    question: 'Can I book for tonight?',
    answer:
      'The grid shows real availability including today, so if a slot is there you can take it. Wednesdays and Thursdays very often have something at short notice; Fridays and Saturdays almost never do.',
  },
  {
    question: 'Is the dining room accessible?',
    answer:
      'Step-free from the street, no internal steps, and an accessible WC on the same floor. Two tables take a wheelchair comfortably — tell us when you book and we will hold one of those rather than seat you and shuffle.',
  },
  {
    question: 'Can I bring a baby or a young child?',
    answer:
      'Of course, at the six o’clock sitting, where there are usually two or three others. We have two high chairs and the kitchen will do a smaller plate of anything on the menu. Later sittings get loud and are not much fun for a small child.',
  },
  {
    question: 'Do you take walk-ins?',
    answer:
      'If there is a table, yes, and there sometimes is at six or after nine. It is worth ringing rather than walking up the hill on a Saturday — we would rather save you the trip.',
  },
]

export default function ReservationPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Quay & Larder"
        links={[
          { label: 'Menu', href: '#' },
          { label: 'About', href: '#' },
          { label: 'Find us', href: '#' },
        ]}
        activeLabel="Book"
        ctaLabel="Call us"
        ctaHref="#bk-answers"
      />

      <main>
        <HeroBooking
          eyebrow="Wednesday to Sunday"
          heading="Book a table"
          subheading="Thirty-eight covers, one sitting a night. Weekends go about ten days ahead; Wednesday is usually free at short notice and is the better meal."
          days={NIGHTS}
          submitLabel="See times"
        />

        <div id="bk-slots">
          <BookingScheduler
            heading="Choose a sitting"
            description="Times are when your table is ready, not when the kitchen can take an order — the kitchen closes at half past nine, so the last sitting is 21:00."
            durationMinutes={150}
            hostTimeZone="Europe/London"
            days={SITTINGS}
          />
        </div>

        <ProductSpecSplit
          eyebrow="What happens next"
          heading="Before you press the button"
          intro="Four things about deposits, cancellations and how long the table is yours. All of them are on this page rather than in the confirmation email, which is where they usually turn up as a surprise."
          points={TERMS}
        />

        <div id="bk-answers">
          <FaqTwoColumn
            heading="Booking questions"
            subheading="Large tables, waiting lists, children and access — the six that come up most on the phone."
            items={ANSWERS}
            helpTitle="Ring us instead"
            helpBody="0117 946 2210, answered from 4pm on service days by somebody who will be in the room that evening."
            helpCtaLabel="Call 0117 946 2210"
          />
        </div>
      </main>

      <FooterMinimal
        brand="Quay & Larder"
        links={[
          { label: 'Menu', href: '#' },
          { label: 'Book', href: '#bk-slots' },
          { label: 'Find us', href: '#' },
          { label: 'Gift vouchers', href: '#' },
        ]}
      />
    </div>
  )
}
