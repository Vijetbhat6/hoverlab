/**
 * <ChatEmptyState> — the first screen of an assistant, before any turn.
 *
 * The blank thread is the highest-leverage screen in an AI product and the
 * one most often left as a centred logo. A visitor who does not know what
 * the thing can be asked will ask nothing, so this screen's whole job is to
 * answer "what do I type" with examples specific enough to be worth
 * clicking.
 *
 * Structure, not decoration:
 *
 *  - Suggestions are a real `<ul>` of buttons, so a screen reader hears "list
 *    of 4" and can skip it. A grid of divs with click handlers is the usual
 *    shape and is unreachable by keyboard.
 *  - Each starter is grouped under a heading tied to the list by
 *    `aria-labelledby`, because "Explore" alone tells a reader nothing about
 *    what the four items under it are.
 *  - The capability strip is `aria-hidden` where it repeats the headings —
 *    reassurance for the eye, noise for a reader.
 *
 * Server component: no state, no effects, nothing to hydrate.
 */

import * as React from 'react'
import { BarChart3, FileSearch, Lightbulb, Sparkles, Table2, Wand2 } from 'lucide-react'

export interface StarterGroup {
  id: string
  label: string
  icon: 'analyse' | 'find' | 'draft' | 'explain'
  prompts: string[]
}

export interface ChatEmptyStateProps {
  greeting?: string
  subheading?: string
  groups?: StarterGroup[]
  footnote?: string
  className?: string
}

const GROUP_ICON = {
  analyse: BarChart3,
  find: FileSearch,
  draft: Wand2,
  explain: Lightbulb,
} as const

const DEFAULT_GROUPS: StarterGroup[] = [
  {
    id: 'analyse',
    label: 'Analyse',
    icon: 'analyse',
    prompts: ['Break down Q3 revenue by region', 'Which cohort churned hardest, and why?'],
  },
  {
    id: 'find',
    label: 'Find',
    icon: 'find',
    prompts: ['Show every account with an open escalation', 'Pull the last three pricing decks'],
  },
  {
    id: 'draft',
    label: 'Draft',
    icon: 'draft',
    prompts: ['Write the weekly update from these metrics', 'Draft a save offer for at-risk teams'],
  },
  {
    id: 'explain',
    label: 'Explain',
    icon: 'explain',
    prompts: ['Walk me through how ARR is calculated here', 'What changed in the forecast model?'],
  },
]

export function ChatEmptyState({
  greeting = 'What can I look into?',
  subheading = 'Connected to your warehouse, docs and support inbox. Ask in plain language — I will show the query I ran.',
  groups = DEFAULT_GROUPS,
  footnote = 'Answers cite their sources. Nothing is written back without your approval.',
  className = '',
}: ChatEmptyStateProps) {
  return (
    <section className={`mx-auto w-full max-w-3xl px-6 py-16 text-center ${className}`}>
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles aria-hidden className="h-5 w-5" />
      </span>

      <h2 className="mt-5 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
        {greeting}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground">
        {subheading}
      </p>

      <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
        {groups.map((group) => {
          const Icon = GROUP_ICON[group.icon]
          const headingId = `starters-${group.id}`

          return (
            <div
              key={group.id}
              className="rounded-2xl border border-border/60 bg-card/60 p-4 transition-colors hover:border-border"
            >
              <h3
                id={headingId}
                className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                <Icon aria-hidden className="h-3.5 w-3.5 text-primary" />
                {group.label}
              </h3>

              <ul aria-labelledby={headingId} className="space-y-1.5">
                {group.prompts.map((prompt) => (
                  <li key={prompt}>
                    <button
                      type="button"
                      className="w-full rounded-xl px-3 py-2 text-left text-sm leading-snug text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {prompt}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <p className="mx-auto mt-8 inline-flex max-w-md items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground">
        <Table2 aria-hidden className="h-3.5 w-3.5 shrink-0" />
        {footnote}
      </p>
    </section>
  )
}
