'use client'

/**
 * <SearchAutocomplete> — the field in the header, not the palette over it.
 *
 * Command & Search had the palette, the shortcuts sheet, the results panel
 * and the applied-filters bar. The palette is a modal that takes the whole
 * screen and runs commands; this is the small field that lives in the
 * header, suggests as you type, and has to stay out of your way. They look
 * similar and behave nothing alike.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * Enter submits what you typed. Not the first suggestion, not whatever the
 * list settled on while the request was in flight — the characters in the
 * box. A suggestion only wins if the person arrowed down to it, which they
 * did on purpose. Every "it searched for something I did not ask for"
 * complaint is this rule being broken, usually because the highlight
 * defaults to index 0 and Enter reads the highlight.
 *
 * LATE RESPONSES ARE DROPPED, NOT RENDERED
 *
 * Type four characters quickly and four requests are in the air; they can
 * land in any order, and the list you are pointing at can be replaced by
 * an older one a moment before you click. A sequence number guards it: a
 * response older than the newest one already shown is discarded. This is
 * the bug behind clicking a result and landing somewhere unrelated, and it
 * cannot be fixed with a debounce alone. (The stand-in below also clears
 * its timer on change, which a real `fetch` will not do for you unless you
 * carry an `AbortController` — keep the counter when you swap it out.)
 *
 * RECENT SEARCHES ARE REMOVABLE
 *
 * Anything the product remembers about a person has to be forgettable by
 * them, one item at a time — a search history you can only clear entirely
 * is a bad answer to somebody who typed one thing they regret.
 *
 * ACCESSIBILITY: the combobox pattern — the input keeps focus and points
 * at the active option with `aria-activedescendant`, the popup is a
 * `role="listbox"`, groups are `role="group"` with their own labels, and
 * the result count is announced through a polite live region. Hover does
 * not move the keyboard highlight.
 */

import * as React from 'react'
import { ArrowUpRight, Clock, CornerDownLeft, FileText, Search, User, X } from 'lucide-react'

export interface SearchEntity {
  id: string
  label: string
  detail: string
  group: string
  icon: React.ComponentType<{ className?: string }>
}

export interface SearchAutocompleteProps {
  entities?: SearchEntity[]
  recents?: string[]
  /** Simulated round-trip, so the out-of-order guard is visible in a demo. */
  latencyMs?: number
  /**
   * Opens with a query already typed. A closed, empty search field is a
   * picture of an input, not of this component.
   */
  initialQuery?: string
  className?: string
}

const DEFAULT_ENTITIES: SearchEntity[] = [
  { id: 'c1', label: 'Meridian Foods', detail: 'Customer · 41 seats · Scale', group: 'Customers', icon: User },
  { id: 'c2', label: 'Meridian Logistics', detail: 'Customer · 8 seats · Team', group: 'Customers', icon: User },
  { id: 'c3', label: 'Halden Group', detail: 'Customer · 120 seats · Enterprise', group: 'Customers', icon: User },
  { id: 'd1', label: 'Refunds policy', detail: 'Document · edited 3 days ago', group: 'Documents', icon: FileText },
  { id: 'd2', label: 'Merchant onboarding runbook', detail: 'Document · edited in June', group: 'Documents', icon: FileText },
  { id: 'd3', label: 'Q3 support metrics', detail: 'Document · edited yesterday', group: 'Documents', icon: FileText },
]

const DEFAULT_RECENTS = ['refund policy', 'meridian', 'seat count enterprise']

const LISTBOX_ID = 'search-autocomplete-listbox'

export function SearchAutocomplete({
  entities = DEFAULT_ENTITIES,
  recents = DEFAULT_RECENTS,
  latencyMs = 180,
  initialQuery = 'meri',
  className = '',
}: SearchAutocompleteProps) {
  const [query, setQuery] = React.useState(initialQuery)
  const [open, setOpen] = React.useState(Boolean(initialQuery))
  /* -1 means "nothing navigated to", which is what makes Enter honest. */
  const [active, setActive] = React.useState(-1)
  const [results, setResults] = React.useState<SearchEntity[]>([])
  const [pending, setPending] = React.useState(false)
  const [history, setHistory] = React.useState(recents)
  const [submitted, setSubmitted] = React.useState<string | null>(null)

  /* Monotonic counter: anything older than the newest render is dropped. */
  const seq = React.useRef(0)
  const shown = React.useRef(0)

  React.useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setResults([])
      setPending(false)
      return
    }
    const mine = ++seq.current
    setPending(true)
    const timer = window.setTimeout(
      () => {
        /* The guard. A late response never overwrites a newer one. */
        if (mine < shown.current) return
        shown.current = mine
        setResults(
          entities.filter(
            (e) =>
              e.label.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q),
          ),
        )
        setPending(false)
      },
      /* Uneven on purpose — even responses come back late. */
      mine % 2 === 0 ? latencyMs * 2 : latencyMs,
    )
    return () => window.clearTimeout(timer)
  }, [query, entities, latencyMs])

  React.useEffect(() => setActive(-1), [query])

  const grouped = React.useMemo(() => {
    const map = new Map<string, SearchEntity[]>()
    for (const r of results) map.set(r.group, [...(map.get(r.group) ?? []), r])
    return [...map.entries()]
  }, [results])
  const flat = grouped.flatMap(([, rows]) => rows)

  const submitQuery = (text: string) => {
    setSubmitted(text)
    setOpen(false)
    setHistory((h) => [text, ...h.filter((x) => x !== text)].slice(0, 5))
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((i) => (flat.length ? Math.min(i + 1, flat.length - 1) : -1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, -1))
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      /* The rule: the highlight only wins if somebody moved to it. */
      if (active >= 0 && flat[active]) submitQuery(flat[active].label)
      else if (query.trim()) submitQuery(query.trim())
    }
  }

  const showRecents = open && !query.trim() && history.length > 0

  return (
    /*
      Bottom padding, not a stray value: the popup is absolutely positioned
      and adds nothing to the section's height, so any ancestor with
      `overflow: hidden` clips it. Reserve the room it opens into.
    */
    <section className={`mx-auto w-full max-w-xl px-4 pb-40 pt-16 sm:px-6 ${className}`}>
      <div className="relative">
        <label htmlFor="search-autocomplete" className="sr-only">
          Search customers and documents
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id="search-autocomplete"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={LISTBOX_ID}
          aria-autocomplete="list"
          aria-activedescendant={
            active >= 0 && flat[active] ? `search-option-${flat[active].id}` : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            setSubmitted(null)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search customers and documents"
          className="h-11 w-full rounded-xl border border-field bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setSubmitted(null)
            }}
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </button>
        ) : null}

        {open ? (
          <div
            id={LISTBOX_ID}
            role="listbox"
            aria-label="Search suggestions"
            className="absolute left-0 right-0 top-full z-10 mt-1 max-h-80 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg"
          >
            {showRecents ? (
              <div role="group" aria-label="Recent searches">
                <p className="px-2.5 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                  Recent
                </p>
                {history.map((h) => (
                  <div
                    key={h}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Clock aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        setQuery(h)
                      }}
                      className="min-w-0 flex-1 truncate text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {h}
                    </button>
                    {/* Forgettable one at a time, not only all at once. */}
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        setHistory((list) => list.filter((x) => x !== h))
                      }}
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X aria-hidden className="h-3 w-3" />
                      <span className="sr-only">Remove &ldquo;{h}&rdquo; from recent searches</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {query.trim() ? (
              <>
                {/* Always first, always the typed text — the Enter target. */}
                <div
                  role="option"
                  aria-selected={active === -1}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    submitQuery(query.trim())
                  }}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${
                    active === -1 ? 'bg-accent text-accent-foreground' : 'text-foreground'
                  }`}
                >
                  <Search aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">
                    Search for <strong className="font-semibold">{query.trim()}</strong>
                  </span>
                  <CornerDownLeft aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </div>

                {grouped.map(([group, rows]) => (
                  <div key={group} role="group" aria-label={group}>
                    <p className="px-2.5 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                      {group}
                    </p>
                    {rows.map((row) => {
                      const index = flat.indexOf(row)
                      const isActive = index === active
                      const Icon = row.icon
                      return (
                        <div
                          key={row.id}
                          id={`search-option-${row.id}`}
                          role="option"
                          aria-selected={isActive}
                          onMouseDown={(event) => {
                            event.preventDefault()
                            submitQuery(row.label)
                          }}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 ${
                            isActive ? 'bg-accent text-accent-foreground' : 'text-foreground'
                          }`}
                        >
                          <Icon aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{row.label}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {row.detail}
                            </span>
                          </span>
                          <ArrowUpRight
                            aria-hidden
                            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                          />
                        </div>
                      )
                    })}
                  </div>
                ))}

                {!pending && results.length === 0 ? (
                  <p className="px-2.5 py-4 text-sm text-muted-foreground">
                    Nothing matched. Press Enter to search everything for
                    &ldquo;{query.trim()}&rdquo; anyway.
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Counts announced politely; the field keeps focus throughout. */}
      <p aria-live="polite" className="mt-3 min-h-5 text-xs text-muted-foreground">
        {submitted
          ? `Searched for “${submitted}”.`
          : pending
            ? 'Searching…'
            : query.trim()
              ? `${results.length} ${results.length === 1 ? 'suggestion' : 'suggestions'}. Enter searches for what you typed.`
              : 'Enter searches for exactly what you type. Arrow down to pick a suggestion instead.'}
      </p>
    </section>
  )
}
