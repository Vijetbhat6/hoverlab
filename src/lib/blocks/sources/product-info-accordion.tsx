/**
 * <ProductInfoAccordion> — description, materials, delivery, returns.
 *
 * Named `<details>` elements again, so exactly one section is open at a
 * time with no state and no JavaScript. The first is open by default: a
 * product page whose entire description is collapsed reads as an empty page
 * to both a customer and a crawler.
 *
 * That last point is the real argument for `<details>` over a JS
 * accordion here. The content is in the DOM whether or not a section is
 * open, so a search engine indexes the materials and delivery copy — which
 * is exactly the long-tail text product pages rank for.
 *
 * Server component.
 */

import * as React from 'react'
import { ChevronDown } from 'lucide-react'

export interface InfoSection {
  id: string
  title: string
  /** Paragraphs, rendered in order. */
  body: string[]
  /** Optional key/value rows — materials, dimensions, care. */
  specs?: Array<{ label: string; value: string }>
  defaultOpen?: boolean
}

export interface ProductInfoAccordionProps {
  sections?: InfoSection[]
  className?: string
}

const DEFAULT_SECTIONS: InfoSection[] = [
  {
    id: 'description',
    title: 'Description',
    defaultOpen: true,
    body: [
      'A midweight crew neck knitted from extra-fine merino, with a clean set-in sleeve and ribbed trims that hold their shape through a season of wear.',
      'Cut slightly relaxed through the body so it layers over a shirt without pulling. Fully fashioned, which means the panels are knitted to shape rather than cut from a sheet — it costs more to make and it does not lose its line at the shoulder.',
    ],
  },
  {
    id: 'materials',
    title: 'Materials & care',
    body: ['Knitted in Scotland from mulesing-free merino.'],
    specs: [
      { label: 'Composition', value: '100% extra-fine merino wool' },
      { label: 'Weight', value: '19.5 micron, 12gg' },
      { label: 'Care', value: 'Hand wash cold, dry flat' },
      { label: 'Origin', value: 'Made in Scotland' },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery',
    body: [
      'Standard delivery is free on orders over £50 and arrives in 2–4 working days. Next-day is £6.95 if you order before 2pm.',
    ],
    specs: [
      { label: 'Standard', value: '2–4 working days · free over £50' },
      { label: 'Next day', value: 'Order before 2pm · £6.95' },
      { label: 'International', value: '5–10 working days · from £12' },
    ],
  },
  {
    id: 'returns',
    title: 'Returns',
    body: [
      'Thirty days from delivery, free, in any condition you would accept yourself. Print the label from your order page or hand it to any collection point.',
      'Sale items included — we have never understood shops that exclude them.',
    ],
  },
]

export function ProductInfoAccordion({
  sections = DEFAULT_SECTIONS,
  className = '',
}: ProductInfoAccordionProps) {
  return (
    <div
      className={`divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/60 bg-card/60 ${className}`}
    >
      {sections.map((section) => (
        <details
          key={section.id}
          name="product-info"
          open={section.defaultOpen}
          className="group px-5 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-start font-medium transition-colors hover:text-foreground/80">
            {section.title}
            <ChevronDown
              aria-hidden
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
            />
          </summary>

          <div className="pb-5 pe-4">
            {section.body.map((paragraph, i) => (
              <p key={i} className="mb-3 text-sm leading-relaxed text-muted-foreground last:mb-0">
                {paragraph}
              </p>
            ))}

            {section.specs ? (
              <dl className="mt-4 divide-y divide-border/40 border-t border-border/40">
                {section.specs.map((spec) => (
                  <div key={spec.label} className="flex justify-between gap-4 py-2 text-sm">
                    <dt className="text-muted-foreground">{spec.label}</dt>
                    <dd className="text-end font-medium">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  )
}
