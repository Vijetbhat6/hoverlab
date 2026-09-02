'use client'

/**
 * <CodeTabsPanel> — one install command, four package managers, real tabs.
 *
 * Every reader uses exactly one package manager, so printing all four
 * commands at once wastes three lines and forces a mental filter on every
 * snippet down the page. The tab remembers the choice the reader already
 * made everywhere else in their life — they click "pnpm" once and stop
 * seeing npm.
 *
 * This block keeps that memory local on purpose. Syncing the selection
 * across every instance on a page (and into localStorage) is a docs-
 * framework concern; wiring it here would smuggle in global state.
 */

import * as React from 'react'
import { Copy, Check } from 'lucide-react'

export interface CodeTab {
  label: string
  code: string
  language?: string
}

export interface CodeTabsPanelProps {
  tabs?: CodeTab[]
  title?: string
  className?: string
}

const DEFAULT_TABS: CodeTab[] = [
  { label: 'npm', code: 'npm install @acme/sdk', language: 'bash' },
  { label: 'pnpm', code: 'pnpm add @acme/sdk', language: 'bash' },
  { label: 'yarn', code: 'yarn add @acme/sdk', language: 'bash' },
  { label: 'bun', code: 'bun add @acme/sdk', language: 'bash' },
]

export function CodeTabsPanel({
  tabs = DEFAULT_TABS,
  title = 'Install the SDK',
  className = '',
}: CodeTabsPanelProps) {
  const [active, setActive] = React.useState(0)
  const [copied, setCopied] = React.useState(false)
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const baseId = React.useId()

  const tab = tabs[active] ?? tabs[0]

  function select(index: number) {
    setActive(index)
    setCopied(false)
    tabRefs.current[index]?.focus()
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const last = tabs.length - 1
    if (event.key === 'ArrowRight') select(active === last ? 0 : active + 1)
    else if (event.key === 'ArrowLeft') select(active === 0 ? last : active - 1)
    else if (event.key === 'Home') select(0)
    else if (event.key === 'End') select(last)
    else return
    event.preventDefault()
  }

  function copy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    void navigator.clipboard.writeText(tab.code).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className={`w-full max-w-2xl overflow-hidden rounded-2xl border border-border/60 bg-zinc-950 ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
        <div aria-hidden className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <span className="truncate font-mono text-xs text-white/40">{title}</span>

        <div
          role="tablist"
          aria-label="Package manager"
          onKeyDown={onKeyDown}
          className="ms-auto flex gap-1"
        >
          {tabs.map((t, i) => (
            <button
              key={t.label}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${baseId}-panel-${i}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => select(i)}
              className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                i === active
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-${active}`}
        aria-labelledby={`${baseId}-tab-${active}`}
        className="relative"
      >
        <pre className="overflow-x-auto p-4 pe-14 text-sm leading-relaxed">
          <code
            className="font-mono text-zinc-300"
            data-language={tab.language ?? 'bash'}
          >
            <span aria-hidden className="select-none text-white/30">
              ${' '}
            </span>
            {tab.code}
          </code>
        </pre>

        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copied' : `Copy ${tab.label} command`}
          className="absolute right-3 top-3 inline-flex items-center rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? (
            <Check aria-hidden className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy aria-hidden className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}
