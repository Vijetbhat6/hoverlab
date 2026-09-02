/**
 * <FaqCategorized> — a long FAQ split into topics you can jump between.
 *
 * The three FAQ blocks already here all assume a list short enough to read
 * top to bottom. Past roughly fifteen questions that assumption breaks
 * whether the answers collapse or not: <FaqAccordion> becomes forty summary
 * lines to scan, <FaqGrid> becomes a wall, and neither gives the reader any
 * way to skip the twenty-eight questions that are not theirs.
 *
 * <FaqTwoColumn> also has a rail, but it holds a contact route — an offer of
 * help for the person whose question is not on the list. This one's nav is
 * navigation, for the person whose question *is* on the list and who cannot
 * find it. Different reader, different failure, different rail.
 *
 * The nav is anchor links and the sections are `<details>`, so the whole
 * block works with JavaScript disabled and every question is in the DOM for
 * search engines and Cmd-F. `scroll-mt` on each section keeps the heading
 * clear of a sticky site header after a jump — without it the anchor lands
 * with the topic name hidden behind the nav, which reads as the link having
 * missed.
 *
 * Topic ids come from `slugify(topic.name)`, so a topic renamed in the data
 * renames its anchor with it and the nav cannot point at a section that no
 * longer exists.
 *
 * `open` on the first question of each topic is deliberate. A jump that
 * lands on nothing but closed summaries makes the reader work twice; one
 * open answer confirms they arrived somewhere useful.
 */

import * as React from 'react'
import { Plus } from 'lucide-react'

export interface CategorizedQuestion {
  question: string
  answer: string
}

export interface FaqTopic {
  name: string
  questions: CategorizedQuestion[]
}

export interface FaqCategorizedProps {
  eyebrow?: string
  heading?: string
  topics?: FaqTopic[]
  /** Open each topic's first answer on arrival. See the note above. */
  openFirst?: boolean
  className?: string
}

/** Topic name → anchor id. One source for both the nav and the target. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const DEFAULT_TOPICS: FaqTopic[] = [
  {
    name: 'Billing',
    questions: [
      {
        question: 'Can I change plans mid-cycle?',
        answer:
          'Yes, and the change takes effect immediately. Upgrades are prorated to the day; downgrades credit the unused remainder against your next invoice rather than refunding it.',
      },
      {
        question: 'What happens if a payment fails?',
        answer:
          'We retry on days 1, 3 and 7 and email you each time. Nothing is suspended until the fourth failure, and your data is retained for 30 days after that.',
      },
      {
        question: 'Do you offer annual invoicing?',
        answer:
          'On any plan, and it is the only option on Enterprise. Annual terms are billed once, so there is no recurring charge that can fail — which matters if your cards decline cross-border subscriptions.',
      },
    ],
  },
  {
    name: 'Security',
    questions: [
      {
        question: 'Where is our data stored?',
        answer:
          'In the region you pick at workspace creation: Virginia, Frankfurt or Sydney. It does not leave that region, including for backups, and the region cannot be changed later without a migration we run for you.',
      },
      {
        question: 'Are you SOC 2 compliant?',
        answer:
          'Type II, audited annually. The current report is available under NDA from the security page, along with our penetration test summary.',
      },
      {
        question: 'Can we bring our own encryption keys?',
        answer:
          'On Enterprise, via AWS KMS or Google Cloud KMS. Revoking the key makes the workspace unreadable to us within minutes.',
      },
    ],
  },
  {
    name: 'Integrations',
    questions: [
      {
        question: 'Does it work with our existing helpdesk?',
        answer:
          'There are first-party integrations for Zendesk, Intercom, Front and Help Scout, and a webhook plus REST API for anything else. Most teams run alongside their helpdesk for the first month rather than replacing it.',
      },
      {
        question: 'Is there an API rate limit?',
        answer:
          '600 requests a minute per workspace on paid plans, 60 on trials. Limits are per workspace rather than per key, so adding keys does not add capacity.',
      },
    ],
  },
  {
    name: 'Support',
    questions: [
      {
        question: 'What are your support hours?',
        answer:
          'Email is answered within one business day on every plan, including trials. Priority plans get four hours, and Enterprise gets a shared Slack channel with a one-hour target during your working day.',
      },
      {
        question: 'Do you help with migration?',
        answer:
          'Yes, at no charge, on any plan. Most migrations are an afternoon; we have never charged for one and do not intend to start.',
      },
    ],
  },
]

export function FaqCategorized({
  eyebrow = 'Answers',
  heading = 'Everything we get asked, sorted by what it is about',
  topics = DEFAULT_TOPICS,
  openFirst = true,
  className = '',
}: FaqCategorizedProps) {
  return (
    <section
      aria-labelledby="faq-categorized-heading"
      className={`mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
        <h2
          id="faq-categorized-heading"
          className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          {heading}
        </h2>
      </div>

      {/* Scrolls sideways on a phone rather than wrapping to four rows, which
          would push the first answer off the screen entirely. */}
      <nav aria-label="FAQ topics" className="mt-8 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          {topics.map((topic) => (
            <li key={topic.name}>
              <a
                href={`#faq-${slugify(topic.name)}`}
                className="block rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {topic.name}
                <span className="ms-2 text-xs tabular-nums text-muted-foreground/70">
                  {topic.questions.length}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-12 space-y-12">
        {topics.map((topic) => {
          const slug = slugify(topic.name)
          return (
            <section key={topic.name} id={`faq-${slug}`} aria-labelledby={`faq-${slug}-heading`} className="scroll-mt-24">
              <h3
                id={`faq-${slug}-heading`}
                className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {topic.name}
              </h3>

              <div className="mt-4 divide-y divide-border/60 border-y border-border/60">
                {topic.questions.map((item, index) => (
                  <details
                    key={item.question}
                    name={`faq-${slug}`}
                    open={openFirst && index === 0}
                    className="group py-1"
                  >
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
            </section>
          )
        })}
      </div>
    </section>
  )
}
