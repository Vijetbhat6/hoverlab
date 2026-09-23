'use client'

/**
 * <SidebarDocsTree> — a documentation sidebar: a version picker, a filter box
 * and sections of pages, with the filter narrowing the list as you type.
 *
 *  - The version picker is a native `<select>` with a visible-to-AT label.
 *    Nothing a custom listbox could add is worth losing the mobile picker and
 *    the type-ahead the browser already ships.
 *  - Filtering announces itself. A `role="status"` line reports "6 pages
 *    match" as you type, because a list that silently shrinks tells a screen
 *    reader nothing happened. It is `sr-only` inside a `relative` wrapper (an
 *    absolutely positioned sr-only node in a scroll container scrolls the
 *    page sideways).
 *  - Sections with no match disappear entirely instead of leaving a heading
 *    over an empty list, and a zero-result filter says so in words.
 *  - The filter is `type="search"` and is labelled, not just given a
 *    placeholder — a placeholder is not a name.
 */

import * as React from 'react'
import { Search } from 'lucide-react'

export interface DocsPage {
  id: string
  label: string
  isNew?: boolean
}

export interface DocsSection {
  title: string
  pages: DocsPage[]
}

export interface SidebarDocsTreeProps {
  sections?: DocsSection[]
  versions?: string[]
  defaultPageId?: string
  children?: React.ReactNode
  className?: string
}

const DEFAULT_SECTIONS: DocsSection[] = [
  {
    title: 'Getting started',
    pages: [
      { id: 'intro', label: 'Introduction' },
      { id: 'install', label: 'Installation' },
      { id: 'quickstart', label: 'Quickstart' },
    ],
  },
  {
    title: 'Core concepts',
    pages: [
      { id: 'routing', label: 'Routing' },
      { id: 'data-fetching', label: 'Data fetching' },
      { id: 'caching', label: 'Caching', isNew: true },
      { id: 'rendering', label: 'Rendering modes' },
    ],
  },
  {
    title: 'Guides',
    pages: [
      { id: 'auth', label: 'Authentication' },
      { id: 'i18n', label: 'Internationalization' },
      { id: 'testing', label: 'Testing' },
      { id: 'deploying', label: 'Deploying' },
    ],
  },
  {
    title: 'API reference',
    pages: [
      { id: 'config', label: 'Configuration' },
      { id: 'cli', label: 'Command line' },
      { id: 'errors', label: 'Error codes' },
    ],
  },
]

export function SidebarDocsTree({
  sections = DEFAULT_SECTIONS,
  versions = ['v3.2 (latest)', 'v3.1', 'v2.9'],
  defaultPageId = 'caching',
  children,
  className = '',
}: SidebarDocsTreeProps) {
  const uid = React.useId()
  const [query, setQuery] = React.useState('')
  const [activeId, setActiveId] = React.useState(defaultPageId)

  const needle = query.trim().toLowerCase()
  const visible = sections
    .map((s) => ({
      ...s,
      pages: s.pages.filter((p) => !needle || p.label.toLowerCase().includes(needle)),
    }))
    .filter((s) => s.pages.length > 0)
  const total = visible.reduce((n, s) => n + s.pages.length, 0)

  return (
    <div
      className={`flex h-[32rem] overflow-hidden rounded-2xl border border-border/60 bg-background ${className}`}
    >
      <aside
        aria-label="Documentation"
        className="relative flex w-[256px] shrink-0 flex-col border-e border-border/60 bg-card/40"
      >
        <div className="space-y-3 p-3">
          <div>
            <label htmlFor={`${uid}-version`} className="sr-only">
              Documentation version
            </label>
            <select
              id={`${uid}-version`}
              defaultValue={versions[0]}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {versions.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <label htmlFor={`${uid}-filter`} className="sr-only">
              Filter pages
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id={`${uid}-filter`}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter pages"
              autoComplete="off"
              className="w-full rounded-xl border border-border/60 bg-background py-2 ps-9 pe-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <p role="status" className="sr-only">
            {needle ? `${total} ${total === 1 ? 'page matches' : 'pages match'}` : ''}
          </p>
        </div>

        <nav aria-label="Docs" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {visible.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No pages match “{query.trim()}”.
            </p>
          ) : (
            visible.map((section, si) => {
              const headingId = `${uid}-s${si}`
              return (
                <div key={section.title}>
                  <h2
                    id={headingId}
                    className="px-3 pb-1.5 text-xs font-semibold text-foreground"
                  >
                    {section.title}
                  </h2>
                  <ul aria-labelledby={headingId} className="border-s border-border/60">
                    {section.pages.map((page) => {
                      const active = page.id === activeId
                      return (
                        <li key={page.id}>
                          <a
                            href="#"
                            aria-current={active ? 'page' : undefined}
                            onClick={(e) => {
                              e.preventDefault()
                              setActiveId(page.id)
                            }}
                            className={`-ms-px flex items-center gap-2 border-s px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                              active
                                ? 'border-primary font-medium text-primary'
                                : 'border-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                            }`}
                          >
                            <span className="truncate">{page.label}</span>
                            {page.isNew ? (
                              <span className="rounded bg-primary/10 px-1.5 text-[10px] font-semibold uppercase leading-4 text-primary">
                                New
                              </span>
                            ) : null}
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })
          )}
        </nav>
      </aside>

      <main className="hidden min-w-0 flex-1 p-6 sm:block">
        {children ?? (
          <div className="flex min-h-full min-w-0 items-center justify-center break-words rounded-xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            Your page content goes here
          </div>
        )}
      </main>
    </div>
  )
}
