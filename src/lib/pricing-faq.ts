/**
 * The questions a price raises, answered where the price is shown.
 *
 * Plain strings on purpose: the same text is rendered on /pricing and emitted
 * as FAQPage structured data, and a schema block must say exactly what the
 * page says. Every answer restates something a legal page already commits to,
 * so if one of these needs changing, change the source first:
 *
 *   refunds        src/app/(legal)/refunds/page.tsx
 *   tax + invoice  src/app/(legal)/terms/page.tsx
 *   the free tier  src/components/landing/faq-accordion.tsx
 *
 * Deliberately absent: anything about regional or student pricing. Whether
 * a visitor sees a discount depends on the deployment (a trusted country
 * header) and on the Polar dashboard, neither of which this file can see, and
 * a FAQ that promises one the checkout then declines is worse than silence.
 */
export interface PricingFaqEntry {
  q: string
  a: string
}

export const PRICING_FAQ: readonly PricingFaqEntry[] = [
  {
    q: 'Can I get a refund?',
    a: 'Yes. Pro has a 14-day refund, no questions asked: email us within 14 days of buying and the payment is returned in full, to the card or account you paid from, usually within 5 to 10 business days. Once refunded, the licence ends. Team is a monthly subscription — cancel it and the next charge stops.',
  },
  {
    q: 'Is tax included, and do I get an invoice?',
    a: 'Payments are processed by Polar, who act as merchant of record. They collect and remit VAT or sales tax where it applies and issue the invoice, so you receive a proper receipt for your accounts.',
  },
  {
    q: 'What does the one-time price include?',
    a: 'Pro is paid once and the licence is permanent — everything you have stays yours forever. Catalog updates are included for twelve months; a renewal buys what gets added after that, and skipping it takes nothing away.',
  },
  {
    q: 'Can I use the free version for client work?',
    a: 'The free tier covers personal and non-commercial work: learning, side projects and portfolios. Client projects, paid products and internal tools at a company need a Pro licence. Browsing, copying, the CLI and the public API need no account either way.',
  },
]
