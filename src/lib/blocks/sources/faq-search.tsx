'use client'

/**
 * <FaqSearch> — a filter over the questions, and a way out when it finds nothing.
 *
 * <FaqCategorized> helps a reader who knows which topic their question is
 * under. Plenty of readers do not — they know a word. They know "SSO", or
 * "refund", or "rate limit", and they will type it into whatever box is
 * nearest, which on most help pages is the browser's own find bar.
 *
 * Filtering rather than jumping is the difference from every other FAQ block
 * here. Cmd-F highlights the first match and leaves the other thirty-nine
 * questions on screen; this removes them, which is what turns forty
 * questions into the two that matter.
 *
 * It searches answers as well as questions. Someone typing "SOC 2" is
 * looking for a word that appears in an answer whose question is phrased
 * "how do you handle compliance", and a title-only filter tells them the
 * page has nothing — the single most common way this pattern fails.
 *
 * The empty state is the reason the block exists. A search that finds
 * nothing is the clearest signal you will ever get that a visitor has an
 * unanswered question and is about to leave, so it is the one moment worth
 * spending a contact route on. An empty state that only says "no results" is
 * a dead end at exactly the wrong time.
 *
 * Two accessibility details:
 *
 *   - The result count is a `role="status"` live region, so a screen reader
 *     hears "3 of 12 questions" as the list narrows. Without it, typing
 *     silently changes the page for anyone not watching it.
 *   - The input is a real `<label>` and a `type="search"`, not a placeholder
 *     doing double duty. Placeholder-as-label disappears on first keystroke,
 *     which is when it is most needed.
 *
 * Uncontrolled `<details>` here rather than the exclusive `name` grouping
 * <FaqAccordion> uses: with a filter, having one answer close another is
 * disorienting, because the reader is usually comparing the two results the
 * search left them with.
 */

import * as React from 'react'
import { Plus, Search } from 'lucide-react'

export interface SearchableQuestion {
  question: string
  answer: string
  /** Extra words that should match but do not belong in the copy. */
  keywords?: string[]
}

export interface FaqSearchProps {
  eyebrow?: string
  heading?: string
  inputLabel?: string
  placeholder?: string
  questions?: SearchableQuestion[]
  emptyHeading?: string
  emptyBody?: string
  contactLabel?: string
  contactHref?: string
  className?: string
}

const DEFAULT_QUESTIONS: SearchableQuestion[] = [
  {
    question: 'Can I change plans mid-cycle?',
    answer:
      'Yes, immediately. Upgrades are prorated to the day; downgrades credit the unused remainder against your next invoice rather than refunding it.',
    keywords: ['upgrade', 'downgrade', 'proration'],
  },
  {
    question: 'Do you support single sign-on?',
    answer:
      'SAML 2.0 and OIDC on Team and above, with SCIM provisioning on Enterprise. Okta, Entra ID, Google Workspace and JumpCloud are tested; anything standards-compliant should work.',
    keywords: ['SSO', 'SAML', 'Okta', 'SCIM'],
  },
  {
    question: 'How do you handle compliance?',
    answer:
      'SOC 2 Type II, audited annually, with the current report available under NDA. GDPR and UK GDPR as a processor, with a DPA you can sign from the billing page. HIPAA BAAs on Enterprise.',
    keywords: ['SOC 2', 'GDPR', 'HIPAA', 'DPA'],
  },
  {
    question: 'What is the API rate limit?',
    answer:
      '600 requests a minute per workspace on paid plans, 60 on trials. Limits are per workspace rather than per key, so adding keys does not add capacity.',
    keywords: ['throttle', '429'],
  },
  {
    question: 'Can we get a refund?',
    answer:
      'Within 30 days of a first purchase, no questions asked, on any plan. After that we credit rather than refund, except where local law says otherwise.',
    keywords: ['money back', 'cancel'],
  },
  {
    question: 'Where is our data stored?',
    answer:
      'In the region you pick at workspace creation: Virginia, Frankfurt or Sydney. It does not leave that region, including for backups.',
    keywords: ['residency', 'EU', 'region'],
  },
  {
    question: 'Do you help with migration?',
    answer:
      'Yes, at no charge, on any plan. Most migrations take an afternoon and our exports import without a schema rewrite.',
    keywords: ['import', 'switch', 'onboarding'],
  },
  {
    question: 'What happens when a trial ends?',
    answer:
      'The workspace becomes read-only rather than being deleted. Everything is still there for 30 days, and adding a card restores it instantly.',
    keywords: ['expire', 'trial'],
  },
]

export function FaqSearch({
  eyebrow = 'Help',
  heading = 'Search the questions',
  inputLabel = 'Search frequently asked questions',
  placeholder = 'Try “SSO”, “refund”, “rate limit”…',
  questions = DEFAULT_QUESTIONS,
  emptyHeading = 'Nothing here matches that',
  emptyBody = 'Which probably means it is a question we should be answering. Send it over and you will get a real reply, usually the same day.',
  contactLabel = 'Ask us directly',
  contactHref = '#',
  className = '',
}: FaqSearchProps) {
  const [query, setQuery] = React.useState('')

  const results = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return questions
    return questions.filter((item) =>
      [item.question, item.answer, ...(item.keywords ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [query, questions])

  const filtering = query.trim().length > 0

  return (
    <section
      aria-labelledby="faq-search-heading"
      className={`mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
        <h2
          id="faq-search-heading"
          className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          {heading}
        </h2>
      </div>

      <div className="mt-8">
        <label htmlFor="faq-search-input" className="sr-only">
          {inputLabel}
        </label>
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="faq-search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="h-12 w-full rounded-xl border border-field bg-background ps-12 pe-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        {/* Announced as the list narrows, not just drawn. */}
        <p role="status" className="mt-3 h-5 text-sm text-muted-foreground">
          {filtering
            ? `${results.length} of ${questions.length} question${questions.length === 1 ? '' : 's'}`
            : ''}
        </p>
      </div>

      {results.length > 0 ? (
        <div className="mt-4 divide-y divide-border/60 border-y border-border/60">
          {results.map((item) => (
            <details key={item.question} className="group py-1">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-4 text-start font-medium text-foreground marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                {item.question}
                <Plus
                  aria-hidden
                  className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <p className="max-w-prose text-pretty pb-5 pe-10 leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-lg font-semibold text-foreground">{emptyHeading}</p>
          <p className="mx-auto mt-2 max-w-md text-pretty leading-relaxed text-muted-foreground">
            {emptyBody}
          </p>
          <a
            href={contactHref}
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {contactLabel}
          </a>
        </div>
      )}
    </section>
  )
}
