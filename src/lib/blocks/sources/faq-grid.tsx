/**
 * <FaqGrid> — every answer open, in two columns, with nothing to click.
 *
 * The other two FAQ blocks collapse their answers, and for a support page
 * that is right: someone hunting one specific answer wants the questions
 * scannable and the rest out of the way.
 *
 * This one is for the opposite job. An FAQ section on a marketing page
 * earns its place through long-tail search — "does X support SSO", "can I
 * cancel Y" — and a collapsed answer is a worse candidate for the snippet
 * a search engine lifts, because the text it would quote is the text a
 * visitor arrives to find hidden. Rendering everything also means the
 * section prints, translates and Cmd-Fs correctly, none of which a
 * disclosure widget does.
 *
 * The cost is real and is the reason this is a separate block rather than
 * a prop: five open answers are a wall of text. Keep it to answers of two
 * or three sentences, and reach for <FaqAccordion> once they run longer or
 * there are more than about eight.
 *
 * A description list, not a stack of divs. <dt>/<dd> is what a
 * question-and-answer pair *is*, and it is what lets a screen reader move
 * question to question. `columns` rather than a grid so pairs of uneven
 * length pack by height instead of leaving a ragged row.
 */

import * as React from 'react'

export interface FaqGridItem {
  question: string
  answer: string
}

export interface FaqGridProps {
  items?: FaqGridItem[]
  heading?: string
  subheading?: string
  className?: string
}

const DEFAULT_ITEMS: FaqGridItem[] = [
  {
    question: 'Is there a free plan?',
    answer:
      'Yes, and it is not a trial. Browsing, customising and copying stay free permanently — what a paid licence buys is the right to ship the result commercially.',
  },
  {
    question: 'Which frameworks are supported?',
    answer:
      'The effects are CSS-first and work anywhere that renders an element. The blocks, pages and templates are React and Tailwind.',
  },
  {
    question: 'Do I need an account to copy code?',
    answer:
      'No. Every artifact is readable and copyable without signing in, and the public API needs no key.',
  },
  {
    question: 'How do updates reach my project?',
    answer:
      'They do not, by design. Copied code is yours and nothing reaches back into your repository — you pull a newer version when you actually want one.',
  },
  {
    question: 'Can I customise before copying?',
    answer:
      'Yes. Colours, timing and sizing are editable in the browser, and what you copy is what you configured.',
  },
  {
    question: 'What about accessibility?',
    answer:
      'Components ship with real semantics and honour prefers-reduced-motion. Anything decorative that animates is gated so it does not run for visitors who have asked for less motion.',
  },
]

export function FaqGrid({
  items = DEFAULT_ITEMS,
  heading = 'Common questions',
  subheading = 'Short answers, all of them on the page.',
  className = '',
}: FaqGridProps) {
  return (
    <section
      className={`mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24 ${className}`}
    >
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        {subheading ? (
          <p className="mt-3 text-muted-foreground">{subheading}</p>
        ) : null}
      </div>

      <dl className="gap-x-10 sm:columns-2">
        {items.map((item) => (
          // The wrapper is what `break-inside` applies to — a <dt> and its
          // <dd> are two elements, and without it a column boundary can
          // fall between a question and its own answer.
          <div key={item.question} className="mb-8 break-inside-avoid">
            <dt className="font-semibold leading-snug">{item.question}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
