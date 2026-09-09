/**
 * Billing history, for the person who did not buy the product.
 *
 * The reader here is usually finance, not the user — they arrived from an
 * email asking for a receipt, they do not know the product, and they want
 * one document. That reframes the whole layout: this is a retrieval
 * screen, not a dashboard.
 *
 * So the history table leads, an expanded invoice sits under it as the
 * shape of what a row opens into, and the payment method is last. The
 * obvious wrong answer is card-first, which is what a product-led design
 * does because the card is the thing the *user* changes — and it is the
 * one thing finance does not need.
 *
 * The detail block is on the page rather than behind a modal for the same
 * reason: an invoice is printed and forwarded, and a modal is neither.
 */

import * as React from 'react'
import { InvoiceHistoryTable } from '@/lib/blocks/sources/invoice-history-table'
import { BillingInvoiceDetail } from '@/lib/blocks/sources/billing-invoice-detail'
import { PaymentMethodCard } from '@/lib/blocks/sources/payment-method-card'

export default function InvoicesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every charge, downloadable as a PDF. Nothing here needs an account
          on the product itself.
        </p>
      </section>

      <InvoiceHistoryTable />
      <BillingInvoiceDetail />
      <PaymentMethodCard />
    </main>
  )
}
