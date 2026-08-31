'use client'

/**
 * <SearchScopeSwitcher> — the same query, counted across every place it
 * could have matched.
 *
 * A search box that returns one flat list has already made a decision on
 * the user's behalf: that everything is one corpus. Products with more than
 * one kind of thing in them — documents, people, settings, past
 * conversations — need the user to say which, and the cheapest way to ask
 * is to show the answer in every scope at once.
 *
 * WHY THE COUNTS ARE THE FEATURE
 *
 * A scope tab with no count is a guess. "People" might have the answer or
 * might be empty, and the only way to find out is to click and lose your
 * place. With counts the user picks correctly the first time, and — the
 * part that matters more — they can see immediately when the answer is
 * nowhere, without visiting four tabs to establish it.
 *
 * AN EMPTY SCOPE STAYS VISIBLE
 *
 * Same reasoning as the facet panel: a tab strip that reorders or drops
 * tabs as the query changes is disorienting. Zero-result scopes stay in
 * place, greyed, and cannot be selected — the strip is stable and the
 * absence is information.
 *
 * KEYBOARD BEHAVIOUR IS THE TABLIST CONTRACT. Left/Right move between
 * tabs, Home and End jump to the ends, and focus follows selection —
 * which is correct here because switching scope is cheap and reversible.
 *
 * ACCESSIBILITY: a real tablist with roving `tabIndex`, `aria-selected` and
 * `aria-controls` pointing at the panel. The count is inside the tab's
 * accessible name, so the reason to choose a tab is announced with it.
 */

import * as React from 'react'
import { FileText, Hash, MessageSquare, Search, Settings, Users } from 'lucide-react'

export interface SearchScope {
  id: string
  label: string
  count: number
  Icon: typeof FileText
}

export interface ScopedResult {
  id: string
  scopeId: string
  title: string
  context: string
  meta: string
}

export interface SearchScopeSwitcherProps {
  query?: string
  scopes?: SearchScope[]
  results?: ScopedResult[]
  className?: string
}

const DEFAULT_SCOPES: SearchScope[] = [
  { id: 'all', label: 'All', count: 47, Icon: Search },
  { id: 'docs', label: 'Documents', count: 31, Icon: FileText },
  { id: 'people', label: 'People', count: 4, Icon: Users },
  { id: 'threads', label: 'Threads', count: 12, Icon: MessageSquare },
  { id: 'channels', label: 'Channels', count: 0, Icon: Hash },
  { id: 'settings', label: 'Settings', count: 0, Icon: Settings },
]

const DEFAULT_RESULTS: ScopedResult[] = [
  {
    id: '1',
    scopeId: 'docs',
    title: 'Q3 renewal playbook',
    context: 'the renewal window opens 60 days before the term ends, and the owner…',
    meta: 'Updated 3 days ago · Sam Okafor',
  },
  {
    id: '2',
    scopeId: 'docs',
    title: 'Pricing and renewal FAQ',
    context: '…what happens at renewal if the seat count changed mid-term?',
    meta: 'Updated 2 weeks ago · Rhea Patel',
  },
  {
    id: '3',
    scopeId: 'people',
    title: 'Jordan Lee',
    context: 'Renewals lead · jordan@acme.com',
    meta: 'Customer Success',
  },
  {
    id: '4',
    scopeId: 'threads',
    title: '#renewals — Acme Corp',
    context: 'Rhea: pushing the renewal call to Thursday, they want the usage report first',
    meta: '14 replies · yesterday',
  },
]

export function SearchScopeSwitcher({
  query = 'renewal',
  scopes = DEFAULT_SCOPES,
  results = DEFAULT_RESULTS,
  className = '',
}: SearchScopeSwitcherProps) {
  const [activeId, setActiveId] = React.useState('all')
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})

  const selectable = scopes.filter((scope) => scope.count > 0)
  const shown = activeId === 'all' ? results : results.filter((r) => r.scopeId === activeId)

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const index = selectable.findIndex((scope) => scope.id === activeId)
    let next = index

    if (event.key === 'ArrowRight') next = (index + 1) % selectable.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + selectable.length) % selectable.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = selectable.length - 1
    else return

    event.preventDefault()
    const id = selectable[next].id
    setActiveId(id)
    tabRefs.current[id]?.focus()
  }

  return (
    <section
      className={`rounded-2xl border border-border bg-card text-card-foreground ${className}`}
    >
      <div className="border-b border-border p-4 sm:p-5">
        <p className="text-sm text-muted-foreground">
          Results for <span className="font-semibold text-foreground">“{query}”</span>
        </p>

        <div
          role="tablist"
          aria-label="Search scope"
          className="mt-3 flex flex-wrap gap-1.5"
        >
          {scopes.map((scope) => {
            const empty = scope.count === 0
            const selected = scope.id === activeId

            return (
              <button
                key={scope.id}
                ref={(node) => {
                  tabRefs.current[scope.id] = node
                }}
                type="button"
                role="tab"
                id={`scope-tab-${scope.id}`}
                aria-selected={selected}
                aria-controls="scope-panel"
                aria-disabled={empty || undefined}
                // Roving tabIndex: one stop for the whole strip, then arrows.
                tabIndex={selected ? 0 : -1}
                onKeyDown={onKeyDown}
                onClick={() => {
                  if (!empty) setActiveId(scope.id)
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  empty
                    ? 'cursor-not-allowed border-transparent text-muted-foreground/40'
                    : selected
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <scope.Icon aria-hidden className="h-3.5 w-3.5" />
                <span aria-hidden>{scope.label}</span>
                <span
                  aria-hidden
                  className={`rounded px-1 text-[11px] tabular-nums ${
                    selected ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {scope.count}
                </span>
                {/* The count belongs in the name, not only in a badge. */}
                <span className="sr-only">
                  {scope.label}, {scope.count} {scope.count === 1 ? 'result' : 'results'}
                  {empty ? ', unavailable' : ''}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div
        id="scope-panel"
        role="tabpanel"
        aria-labelledby={`scope-tab-${activeId}`}
        tabIndex={0}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ul className="divide-y divide-border">
          {shown.map((result) => {
            const scope = scopes.find((s) => s.id === result.scopeId)
            return (
              <li key={result.id}>
                <a
                  href="#"
                  className="block p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
                >
                  <div className="flex items-center gap-2">
                    {scope ? (
                      <scope.Icon aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : null}
                    <h3 className="text-sm font-semibold">{result.title}</h3>
                    {/* Shown only in the merged view, where it disambiguates. */}
                    {activeId === 'all' && scope ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {scope.label}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    …{result.context}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{result.meta}</p>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
