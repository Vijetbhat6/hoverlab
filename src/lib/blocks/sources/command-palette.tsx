'use client'

/**
 * <CommandPalette> — the ⌘K quick-switcher.
 *
 * Deceptively hard, which is why it is worth lifting whole. What is handled
 * here and usually is not:
 *
 *  - Roving focus stays in the input while the *highlight* moves through the
 *    list. Moving real DOM focus to each item breaks typing, so the input
 *    keeps focus and `aria-activedescendant` points at the highlighted row —
 *    the combobox pattern.
 *  - Arrow keys wrap at both ends, and the highlight resets to the first
 *    result whenever the query changes. Leaving it at index 7 after the list
 *    shrinks to two results is how palettes select the wrong thing.
 *  - The highlighted item is scrolled into view with `block: 'nearest'`, so
 *    keyboard travel does not jump the list around.
 *  - ⌘K / Ctrl-K toggles, Escape closes, and the shortcut calls
 *    `preventDefault` — otherwise Firefox steals it for its search bar.
 *
 * Rendered inline rather than in a portal so it previews in place; move it
 * into a portal with a focus trap when you drop it into a real app.
 */

import * as React from 'react'
import {
  Search,
  FileText,
  Settings,
  Users,
  CreditCard,
  Plus,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

export interface CommandItem {
  id: string
  label: string
  group: string
  icon?: React.ReactNode
  shortcut?: string
  onSelect?: () => void
}

export interface CommandPaletteProps {
  items?: CommandItem[]
  placeholder?: string
  /** Start open — the default, so the block previews as something visible. */
  defaultOpen?: boolean
  /**
   * Render as a demo inside a larger page. Drops the document-level
   * Ctrl/Cmd-K and Escape binding, which a preview has no business owning —
   * on a page of previews it would fight the host app for the same keys —
   * and the search field's `autoFocus`, which would scroll the browser to
   * this card on load.
   */
  embedded?: boolean
  className?: string
}

const DEFAULT_ITEMS: CommandItem[] = [
  { id: 'new-project', label: 'Create new project', group: 'Actions', icon: <Plus className="h-4 w-4" />, shortcut: 'N' },
  { id: 'invite', label: 'Invite a teammate', group: 'Actions', icon: <Users className="h-4 w-4" /> },
  { id: 'docs', label: 'Search documentation', group: 'Navigation', icon: <FileText className="h-4 w-4" /> },
  { id: 'billing', label: 'Go to billing', group: 'Navigation', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'settings', label: 'Open settings', group: 'Navigation', icon: <Settings className="h-4 w-4" />, shortcut: ',' },
  { id: 'members', label: 'Manage members', group: 'Navigation', icon: <Users className="h-4 w-4" /> },
]

export function CommandPalette({
  items = DEFAULT_ITEMS,
  placeholder = 'Type a command or search',
  defaultOpen = true,
  embedded = false,
  className = '',
}: CommandPaletteProps) {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  const [open, setOpen] = React.useState(defaultOpen)
  const [query, setQuery] = React.useState('')
  const [highlight, setHighlight] = React.useState(0)

  const listRef = React.useRef<HTMLDivElement>(null)

  const results = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return items
    return items.filter((item) => item.label.toLowerCase().includes(term))
  }, [items, query])

  // A stale highlight after the list shrinks selects the wrong row.
  React.useEffect(() => {
    setHighlight(0)
  }, [query])

  // Keep the highlighted row visible without yanking the list around.
  //
  // Skipped on the first commit. `scrollIntoView` walks up *every* scrollable
  // ancestor, the document included, so running it on mount scrolls the whole
  // page to wherever this palette happens to sit. On mount the highlight is
  // row 0, which is already in view, so there was never anything to correct.
  const settled = React.useRef(false)
  React.useEffect(() => {
    if (!settled.current) {
      settled.current = true
      return
    }
    const node = listRef.current?.querySelector<HTMLElement>('[data-highlighted="true"]')
    node?.scrollIntoView({ block: 'nearest' })
  }, [highlight])

  React.useEffect(() => {
    if (embedded) return

    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        // Firefox binds Ctrl-K to its search bar unless we take it.
        event.preventDefault()
        setOpen((v) => !v)
      } else if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [embedded])

  function handleKeyDown(event: React.KeyboardEvent) {
    if (results.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((i) => (i + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((i) => (i - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = results[highlight]
      item?.onSelect?.()
      setOpen(false)
    }
  }

  // Preserve authored group order.
  const grouped = React.useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    for (const item of results) {
      const list = map.get(item.group)
      if (list) list.push(item)
      else map.set(item.group, [item])
    }
    return [...map.entries()]
  }, [results])

  if (!open) {
    return (
      <div className={`flex items-center justify-center p-10 ${className}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <Search aria-hidden className="h-4 w-4" />
          Search
          <kbd className="ml-2 rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-xs">
            ⌘K
          </kbd>
        </button>
      </div>
    )
  }

  let flatIndex = -1

  return (
    <div className={`flex justify-center p-6 ${className}`}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border/60 px-4">
          <Search aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />

          <input
            autoFocus={!embedded}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${uid}-command-list`}
            aria-activedescendant={
              results[highlight] ? `command-item-${results[highlight].id}` : undefined
            }
            aria-label={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground"
          />

          <kbd className="shrink-0 rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            esc
          </kbd>
        </div>

        <div
          ref={listRef}
          id={`${uid}-command-list`}
          role="listbox"
          aria-label="Commands"
          className="max-h-72 overflow-y-auto p-2"
        >
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No commands match “{query}”
            </p>
          ) : (
            grouped.map(([group, groupItems]) => (
              <div key={group} className="mb-1 last:mb-0">
                <p className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {group}
                </p>

                {groupItems.map((item) => {
                  flatIndex += 1
                  const active = flatIndex === highlight

                  return (
                    <button
                      key={item.id}
                      id={`command-item-${item.id}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      data-highlighted={active}
                      onMouseEnter={() => setHighlight(results.indexOf(item))}
                      onClick={() => {
                        item.onSelect?.()
                        setOpen(false)
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        active ? 'bg-primary/10 text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      <span className={active ? 'text-primary' : ''}>{item.icon}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.shortcut ? (
                        <kbd className="rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {item.shortcut}
                        </kbd>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ArrowUp aria-hidden className="h-3 w-3" />
            <ArrowDown aria-hidden className="h-3 w-3" />
            navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft aria-hidden className="h-3 w-3" />
            select
          </span>
          <span className="ml-auto">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>
    </div>
  )
}
