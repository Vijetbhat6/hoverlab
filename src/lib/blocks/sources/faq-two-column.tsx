/**
 * <FaqTwoColumn> — questions on the right, a standing offer of help on the left.
 *
 * <FaqAccordion> answers the questions it was written for and has nothing
 * to say about the one it wasn't. That gap is where the sale is lost: a
 * visitor with an unlisted objection reads to the bottom, finds no way to
 * ask, and leaves. The left rail exists to catch exactly that person, which
 * is why it holds a contact route rather than decoration.
 *
 * The rail is `sticky` so it stays beside the questions however far the
 * list runs — an offer of help that has scrolled out of view is one the
 * reader has to go looking for at the moment they are least inclined to.
 * On narrow screens it becomes a normal block above the list, because a
 * sticky element in a single-column flow just eats the viewport.
 *
 * Disclosure is <details>/<summary> with a shared `name`, same as the
 * accordion: real one-at-a-time behaviour, keyboard support and correct
 * screen-reader state, with no state hook and no JavaScript.
 */

import * as React from 'react'
import { ChevronDown, MessageCircle } from 'lucide-react'

export interface FaqTwoColumnItem {
  question: string
  answer: string
}

export interface FaqTwoColumnProps {
  items?: FaqTwoColumnItem[]
  heading?: string
  subheading?: string
  /** Text on the help card. Pass null to drop the card entirely. */
  helpTitle?: string | null
  helpBody?: string
  helpCtaLabel?: string
  helpCtaHref?: string
  /** Only one answer open at a time. */
  exclusive?: boolean
  className?: string
}

const DEFAULT_ITEMS: FaqTwoColumnItem[] = [
  {
    question: 'What happens when my licence expires?',
    answer:
      'Nothing stops working. What ends is access to components published after your window — everything you already copied stays yours to ship, permanently, with no check at runtime.',
  },
  {
    question: 'Can I use this for client work?',
    answer:
      'Yes, on any paid plan, including projects you hand over to the client afterwards. The one thing no licence covers is reselling the components themselves as a competing library.',
  },
  {
    question: 'Do I need to credit you?',
    answer:
      'No. Attribution is never required, on any plan, including the free one.',
  },
  {
    question: 'Is there a team plan?',
    answer:
      'There is, priced per seat, with shared brand tokens and one workspace everybody pulls from. It can be billed monthly or bought outright for a year.',
  },
  {
    question: 'What if I need something that is not in the catalog?',
    answer:
      'Ask. Requests that several people want are usually the next thing built, and the roadmap is public.',
  },
]

export function FaqTwoColumn({
  items = DEFAULT_ITEMS,
  heading = 'Questions, answered',
  subheading = 'The things people ask before they buy — and a way to ask the ones that are not here.',
  helpTitle = 'Still not sure?',
  helpBody =
    'Send the question. A person reads it, and you get an answer rather than a link to this page.',
  helpCtaLabel = 'Ask a question',
  helpCtaHref = '/contact',
  exclusive = true,
  className = '',
}: FaqTwoColumnProps) {
  return (
    <section
      className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 ${className}`}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
        {/* The rail. `self-start` is what lets `sticky` have an effect — a
            stretched grid item is already as tall as the row, so it has no
            room to move within it. */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
          {subheading ? (
            <p className="mt-3 text-pretty text-muted-foreground">{subheading}</p>
          ) : null}

          {helpTitle ? (
            <div className="mt-8 rounded-2xl border border-border/60 bg-card/60 p-5">
              <MessageCircle
                aria-hidden
                className="h-5 w-5 text-muted-foreground"
              />
              <p className="mt-3 font-semibold">{helpTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {helpBody}
              </p>
              <a
                href={helpCtaHref}
                className="mt-4 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {helpCtaLabel}
              </a>
            </div>
          ) : null}
        </div>

        <div className="divide-y divide-border/60 border-y border-border/60">
          {items.map((item) => (
            <details
              key={item.question}
              name={exclusive ? 'faq-two-column' : undefined}
              className="group [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left text-base font-semibold transition-colors hover:text-foreground/80">
                {item.question}
                <ChevronDown
                  aria-hidden
                  className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="max-w-prose pb-5 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
