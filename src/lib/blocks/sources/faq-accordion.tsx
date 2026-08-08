/**
 * <FaqAccordion> — a frequently-asked-questions list.
 *
 * Built on <details>/<summary> with a shared `name`, which gives real
 * accordion behaviour — opening one closes the rest — with no state, no
 * effect hook and no JavaScript at all. Keyboard support and the
 * open/closed state exposed to screen readers come free from the elements.
 *
 * Pass `exclusive={false}` for an list where several answers can sit open
 * at once.
 */

import * as React from 'react'
import { Plus } from 'lucide-react'

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqAccordionProps {
  items?: FaqItem[]
  heading?: string
  subheading?: string
  /** Only one answer open at a time. */
  exclusive?: boolean
  className?: string
}

const DEFAULT_ITEMS: FaqItem[] = [
  {
    question: 'Can I use this in a commercial project?',
    answer:
      'Yes. Everything here is yours to ship in client work and paid products, with no attribution required.',
  },
  {
    question: 'Do I need a specific framework?',
    answer:
      'No. The markup is plain HTML and the styling is utility classes, so it drops into any stack that can render an element.',
  },
  {
    question: 'How do updates work?',
    answer:
      'Copied code is yours — nothing reaches back into your project. Pull a newer version whenever you want it.',
  },
  {
    question: 'Is there a free tier?',
    answer:
      'There is. A large part of the catalog is free forever; the paid plan unlocks the rest and removes usage limits.',
  },
]

export function FaqAccordion({
  items = DEFAULT_ITEMS,
  heading = 'Frequently asked questions',
  subheading = 'Everything people ask before getting started.',
  exclusive = true,
  className = '',
}: FaqAccordionProps) {
  return (
    <section className={`mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        {subheading ? (
          <p className="mt-3 text-muted-foreground">{subheading}</p>
        ) : null}
      </div>

      <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card/60">
        {items.map((item) => (
          <details
            key={item.question}
            name={exclusive ? 'faq' : undefined}
            className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-semibold transition-colors hover:text-foreground/80">
              {item.question}
              <Plus
                aria-hidden
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45"
              />
            </summary>
            <p className="pb-5 pr-8 text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
