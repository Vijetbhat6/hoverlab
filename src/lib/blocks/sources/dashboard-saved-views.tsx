'use client'

/**
 * <DashboardSavedViews> — the tab strip a dashboard grows into.
 *
 * Dashboards had the shell, the KPI cards, the activity feed, the page
 * header, the kanban, the audit timeline and the calendar. Every one of
 * them shows a single, fixed slice of the data. The moment two people
 * share a dashboard they stop agreeing about which slice, and the product
 * either grows saved views or grows a screenshot habit.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * A saved view has three states, and most implementations render two.
 * There is the view as saved, the view with unsaved edits, and — the one
 * that gets skipped — a *shared* view with unsaved edits, where pressing
 * Save changes what a colleague sees tomorrow morning. That case gets its
 * own sentence and a second button, because "Save" and "Save as a copy"
 * are the two honest answers and defaulting to the first is how one
 * person quietly redefines everyone else's morning report.
 *
 * DIRTY IS SHOWN, NOT IMPLIED
 *
 * A dot beside a tab name means nothing to anyone who has not been taught
 * it. The strip says "Edited" in words and the bar underneath names what
 * changed, so the choice to save or discard can be made without pressing
 * either to find out.
 *
 * PERSONAL VIEWS SAY SO
 *
 * Ownership is on the tab, not in a settings drawer. Whether a change is
 * private or public is the single most important fact about a saved view
 * and it is invisible in most products until someone complains.
 *
 * ACCESSIBILITY: a real tablist with roving `aria-selected`, arrow-key
 * movement between tabs, and a `aria-live="polite"` status line for the
 * dirty state. The filter chips are buttons, not divs, so the thing that
 * makes a view dirty is reachable from a keyboard.
 */

import * as React from 'react'
import { Check, Lock, RotateCcw, Save, Users } from 'lucide-react'

export interface SavedView {
  id: string
  name: string
  /** Shared views are the ones where Save has a blast radius. */
  shared?: boolean
  /** The filters this view is saved with, as human phrases. */
  filters: string[]
}

export interface DashboardSavedViewsProps {
  views?: SavedView[]
  className?: string
}

const DEFAULT_VIEWS: SavedView[] = [
  {
    id: 'all-open',
    name: 'All open',
    shared: true,
    filters: ['Status is open', 'Any assignee', 'Last 30 days'],
  },
  {
    id: 'my-escalations',
    name: 'My escalations',
    filters: ['Assigned to me', 'Priority is urgent', 'Breached SLA'],
  },
  {
    id: 'weekly-review',
    name: 'Weekly review',
    shared: true,
    filters: ['Closed last week', 'Any priority', 'Grouped by team'],
  },
]

/** Chips a visitor can toggle to make the current view dirty. */
const EXTRA_FILTERS = ['Enterprise only', 'Has attachment', 'Reopened once or more']

export function DashboardSavedViews({
  views = DEFAULT_VIEWS,
  className = '',
}: DashboardSavedViewsProps) {
  const [activeId, setActiveId] = React.useState(views[0]?.id ?? '')
  /*
   * Opens dirty, on a shared view.
   *
   * Clean is the boring half. Everything this component has to say — the
   * two honest save buttons, the sentence about tomorrow's digest — only
   * exists once a shared view has unsaved edits, so that is where the
   * demo starts. Press "Reset to saved" to see the quiet state.
   */
  const [extra, setExtra] = React.useState<string[]>(['Enterprise only'])
  const [saved, setSaved] = React.useState('')
  const tabsRef = React.useRef<Array<HTMLButtonElement | null>>([])

  const active = views.find((v) => v.id === activeId) ?? views[0]
  const dirty = extra.length > 0

  function select(id: string) {
    setActiveId(id)
    setExtra([])
    setSaved('')
  }

  /* Arrow keys move between tabs — a tablist that only takes clicks is a
     row of buttons wearing a role it does not honour. */
  function onTabKey(event: React.KeyboardEvent, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % views.length
        : (index - 1 + views.length) % views.length
    select(views[next]!.id)
    tabsRef.current[next]?.focus()
  }

  if (!active) return null

  return (
    <section className={`mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <header className="border-b border-border px-5 pt-4">
          <h2 className="text-base font-semibold text-foreground">Support queue</h2>

          <div
            role="tablist"
            aria-label="Saved views"
            className="mt-3 flex flex-wrap items-center gap-1"
          >
            {views.map((view, index) => {
              const selected = view.id === activeId
              return (
                <button
                  key={view.id}
                  ref={(node) => {
                    tabsRef.current[index] = node
                  }}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onKeyDown={(e) => onTabKey(e, index)}
                  onClick={() => select(view.id)}
                  className={`inline-flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? 'border-primary font-semibold text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {/* Ownership on the tab. It decides what Save means. */}
                  {view.shared ? (
                    <Users aria-hidden className="h-3.5 w-3.5" />
                  ) : (
                    <Lock aria-hidden className="h-3.5 w-3.5" />
                  )}
                  {view.name}
                  <span className="sr-only">
                    {view.shared ? ' (shared with the team)' : ' (only you)'}
                  </span>
                  {selected && dirty ? (
                    <span className="ms-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      Edited
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </header>

        {/*
          The bar that names the change. Live, because it appears as a
          result of pressing a chip somewhere else on the screen.
        */}
        <div aria-live="polite">
          {dirty ? (
            <div className="border-b border-border bg-muted/50 px-5 py-3">
              <p className="text-sm text-foreground">
                {extra.length === 1
                  ? 'One filter has been added to this view: '
                  : `${extra.length} filters have been added to this view: `}
                <span className="font-medium">{extra.join(', ')}</span>
              </p>

              {/* The case everyone else collapses into a single Save. */}
              {active.shared ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  <strong className="font-semibold text-foreground">
                    {active.name} is shared with your team.
                  </strong>{' '}
                  Saving changes what everyone sees, including tomorrow&apos;s
                  scheduled digest.
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  {active.name} is visible only to you.
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSaved(`Saved to ${active.name}`)
                    setExtra([])
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Save aria-hidden className="h-3.5 w-3.5" />
                  {active.shared ? `Save for everyone` : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSaved(`Saved as “${active.name} (copy)” — only you can see it`)
                    setExtra([])
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Lock aria-hidden className="h-3.5 w-3.5" />
                  Save as my own copy
                </button>
                <button
                  type="button"
                  onClick={() => setExtra([])}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RotateCcw aria-hidden className="h-3.5 w-3.5" />
                  Reset to saved
                </button>
              </div>
            </div>
          ) : saved ? (
            <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-2.5 text-sm text-foreground">
              <Check aria-hidden className="h-4 w-4 text-primary" />
              {saved}
            </div>
          ) : null}
        </div>

        <div className="px-5 py-5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Filters in this view
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {active.filters.map((filter) => (
              <li
                key={filter}
                className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-foreground"
              >
                {filter}
              </li>
            ))}
            {extra.map((filter) => (
              <li
                key={filter}
                className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {filter}
              </li>
            ))}
          </ul>

          <h3 className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Narrow it further
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {EXTRA_FILTERS.map((filter) => {
              const on = extra.includes(filter)
              return (
                <li key={filter}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setExtra((e) =>
                        e.includes(filter) ? e.filter((f) => f !== filter) : [...e, filter],
                      )
                    }
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      on
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {filter}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
