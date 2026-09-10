/**
 * The fortnight between buying and reviewing.
 *
 * `account-orders-page` serves someone signed in. This page serves the
 * larger group: a person with an order number in an email, no account, and
 * one question — where is it. Requiring a login to answer that is the
 * single most common cause of a "where is my order" support email, which is
 * the most common support email there is.
 *
 *   lookup      order number and email, no account
 *   timeline    with an arrival *range* rather than a date. A single date
 *               is a promise the courier did not make, and every day past
 *               it is a complaint the shop caused
 *   review      the form that produces the reviews every other commerce
 *               block displays, with a real radio group for the stars
 *
 * The review form belongs on this page rather than on a product page, and
 * that placement is the argument. Reviews are asked for after delivery, in
 * the email that says the parcel arrived, and the link in that email lands
 * on the tracking screen. Putting the form anywhere else means building a
 * second route to it for the only moment anyone actually uses it.
 */

import * as React from 'react'
import { OrderLookupForm } from '@/lib/blocks/sources/order-lookup-form'
import { OrderTrackingTimeline } from '@/lib/blocks/sources/order-tracking-timeline'
import { ReviewSubmitForm } from '@/lib/blocks/sources/review-submit-form'

export default function OrderTrackingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <OrderLookupForm />
      <OrderTrackingTimeline />

      {/* Where the "how did we do" email actually lands. */}
      <ReviewSubmitForm />
    </main>
  )
}
