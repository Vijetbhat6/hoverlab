/**
 * Checkout for the buyer who is not going to fill in a form.
 *
 * `checkout-page` is the full flow. This is the short one, and it is a
 * different page rather than a variant because the ordering argument is
 * inverted: the wallet buttons go *above* the form, not beside it.
 *
 * That placement is the entire conversion difference on mobile, and it has
 * one consequence most implementations skip. A wallet returns an address,
 * and that address is frequently not the one the buyer wants the parcel
 * sent to — it is whatever was in their phone three years ago.
 * <CheckoutExpressPayment> shows what came back and lets it be changed
 * before the charge, rather than after, when changing it means a support
 * conversation.
 *
 *   cart      the basket as a real dialog — focus trapped, focus returned,
 *             Escape closes. A drawer that loses focus to the page behind
 *             it is a keyboard user's dead end at the last step
 *   express   the wallets, and what they did to the form
 *   gift      the two fields that prevent two support emails
 *
 * <GiftOptionsForm> is last and is not an upsell. A gift order with no
 * message and a price left in the box generates a complaint; asked at
 * checkout it is one question, and asked afterwards it is impossible.
 */

import * as React from 'react'
import { CartDrawer } from '@/lib/blocks/sources/cart-drawer'
import { CheckoutExpressPayment } from '@/lib/blocks/sources/checkout-express-payment'
import { GiftOptionsForm } from '@/lib/blocks/sources/gift-options-form'

export default function ExpressCheckoutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/*
        A heading before the drawer, because <CartDrawer> opens onto its own
        scrim — correct for the block, and a page that starts with 380px of
        dimmed grey is a page whose catalog tile says nothing.
      */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Express checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The bag, the wallets above the form, and the two fields that stop a
          gift order becoming a complaint.
        </p>
      </section>

      <CartDrawer />

      {/* Wallets above the form, and the address they return shown. */}
      <CheckoutExpressPayment />

      <GiftOptionsForm />
    </main>
  )
}
