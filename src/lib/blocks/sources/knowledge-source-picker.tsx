/**
 * <KnowledgeSourcePicker> — choosing what an assistant is allowed to read,
 * with indexing state per source.
 *
 * The block that decides whether answers are any good, and it has an
 * unusual requirement: it has to show *work in progress* honestly. A source
 * that is 40% indexed will answer questions badly, and hiding that behind a
 * green tick is how a user concludes the product is stupid rather than
 * still ingesting.
 *
 *  - Every source states its state in words — Ready, Indexing, Failed,
 *    Paused — beside the icon. Never colour alone.
 *  - Indexing rows carry a `<progress>` with an accessible name that
 *    includes the source, so five simultaneous bars are distinguishable.
 *  - A failed source explains itself inline and offers a fix, rather than
 *    a red dot and a support link.
 *  - The search field is `type="search"` with a label, and filtering is
 *    announced through a `role="status"` count — otherwise a keyboard user
 *    types and hears nothing change.
 *  - Selection is checkboxes in a `<fieldset>` with a `<legend>`, which is
 *    what turns eleven loose checkboxes into one answerable question.
 *
 * The footer states the *effect* of the current selection in plain language,
 * because "6 selected" does not tell anyone what the assistant will do.
 */

'use client'

import * as React from 'react'
import {
  AlertCircle,
  Check,
  Database,
  FileText,
  Github,
  Globe,
  Loader2,
  Pause,
  Plus,
  RotateCw,
  Search,
} from 'lucide-react'

export type IndexState = 'ready' | 'indexing' | 'failed' | 'paused'

export interface KnowledgeSource {
  id: string
  label: string
  kind: 'drive' | 'repo' | 'table' | 'site'
  detail: string
  state: IndexState
  /** 0–100, when indexing. */
  progress?: number
  /** Shown under a failed source. */
  error?: string
}

export interface KnowledgeSourcePickerProps {
  heading?: string
  sources?: KnowledgeSource[]
  className?: string
}

const KIND_ICON = {
  drive: FileText,
  repo: Github,
  table: Database,
  site: Globe,
} as const

const STATE_LABEL = {
  ready: 'Ready',
  indexing: 'Indexing',
  failed: 'Failed',
  paused: 'Paused',
} as const

const DEFAULT_SOURCES: KnowledgeSource[] = [
  {
    id: 'handbook',
    label: 'Company handbook',
    kind: 'drive',
    detail: 'Google Drive · 214 documents',
    state: 'ready',
  },
  {
    id: 'warehouse',
    label: 'Analytics warehouse',
    kind: 'table',
    detail: '18 tables · schema only, no row data',
    state: 'ready',
  },
  {
    id: 'repo',
    label: 'product/api',
    kind: 'repo',
    detail: 'GitHub · main branch, docs/ and README',
    state: 'indexing',
    progress: 44,
  },
  {
    id: 'helpsite',
    label: 'help.acme.com',
    kind: 'site',
    detail: 'Crawled weekly · 480 pages',
    state: 'ready',
  },
  {
    id: 'legal',
    label: 'Contracts archive',
    kind: 'drive',
    detail: 'SharePoint · 1,902 files',
    state: 'failed',
    error: 'Access denied — the connector account cannot read this folder.',
  },
  {
    id: 'notion',
    label: 'Design wiki',
    kind: 'site',
    detail: 'Paused by you on 2 August',
    state: 'paused',
  },
]

export function KnowledgeSourcePicker({
  heading = 'What can the assistant read?',
  sources = DEFAULT_SOURCES,
  className = '',
}: KnowledgeSourcePickerProps) {
  const [query, setQuery] = React.useState('')
  const [selected, setSelected] = React.useState<string[]>(
    sources.filter((s) => s.state === 'ready').map((s) => s.id),
  )

  const visible = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return sources
    return sources.filter(
      (s) =>
        s.label.toLowerCase().includes(term) || s.detail.toLowerCase().includes(term),
    )
  }, [sources, query])

  const chosen = sources.filter((s) => selected.includes(s.id))
  const pending = chosen.filter((s) => s.state === 'indexing').length
  const searchId = React.useId()

  return (
    <div className={`mx-auto w-full max-w-xl p-6 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        {/* -- Header ---------------------------------------------------- */}
        <div className="border-b border-border/60 px-5 py-4">
          <h3 className="text-sm font-semibold">{heading}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Only selected sources are searched. Everything else stays invisible to it.
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
            <Search aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
            <label htmlFor={searchId} className="sr-only">
              Filter sources
            </label>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter sources"
              className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Without this a keyboard user types into the filter and gets no
              feedback that anything happened. */}
          <p role="status" className="sr-only">
            {visible.length} of {sources.length} sources shown
          </p>
        </div>

        {/* -- Sources --------------------------------------------------- */}
        {/* Sized to clear the failed source rather than clipping it. A
            connector that cannot be read is the row a user most needs to
            see, and it was the one falling below the fold. */}
        <fieldset className="max-h-[34rem] overflow-y-auto">
          <legend className="sr-only">Sources the assistant may read</legend>

          {visible.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Nothing matches “{query}”.
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {visible.map((source) => {
                const Icon = KIND_ICON[source.kind]
                const on = selected.includes(source.id)
                const blocked = source.state === 'failed'

                return (
                  <li key={source.id}>
                    <label
                      className={`flex items-start gap-3 px-5 py-3 transition-colors ${
                        blocked ? 'opacity-70' : 'cursor-pointer hover:bg-muted/40'
                      } has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-ring`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={blocked}
                        onChange={() =>
                          setSelected((list) =>
                            list.includes(source.id)
                              ? list.filter((x) => x !== source.id)
                              : [...list, source.id],
                          )
                        }
                        className="mt-1 h-4 w-4 shrink-0 accent-primary"
                      />

                      <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{source.label}</span>
                          <StateBadge state={source.state} />
                        </span>

                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {source.detail}
                        </span>

                        {source.state === 'indexing' && typeof source.progress === 'number' ? (
                          <span className="mt-2 block">
                            <progress
                              value={source.progress}
                              max={100}
                              aria-label={`Indexing ${source.label}`}
                              className="h-1 w-full appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary"
                            >
                              {source.progress}%
                            </progress>
                            <span className="mt-1 block text-[11px] text-muted-foreground">
                              {source.progress}% indexed — answers from this source will be
                              incomplete until it finishes
                            </span>
                          </span>
                        ) : null}

                        {source.error ? (
                          <span className="mt-1.5 flex items-start gap-2 text-[11px] leading-relaxed text-rose-600 dark:text-rose-400">
                            <AlertCircle aria-hidden className="mt-px h-3 w-3 shrink-0" />
                            {source.error}
                          </span>
                        ) : null}
                      </span>

                      {blocked ? (
                        <button
                          type="button"
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <RotateCw aria-hidden className="h-3 w-3" />
                          Reconnect
                          <span className="sr-only"> {source.label}</span>
                        </button>
                      ) : null}
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </fieldset>

        {/* -- Footer ---------------------------------------------------- */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border/60 bg-muted/30 px-5 py-3">
          {/* The effect of the selection, not its cardinality. */}
          <p role="status" className="text-xs text-muted-foreground">
            {chosen.length === 0 ? (
              'Nothing selected — the assistant will answer from the conversation alone.'
            ) : (
              <>
                Searching{' '}
                <span className="font-medium text-foreground">
                  {chosen.length} {chosen.length === 1 ? 'source' : 'sources'}
                </span>
                {pending > 0 ? `, ${pending} still indexing` : ''}
              </>
            )}
          </p>

          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus aria-hidden className="h-3.5 w-3.5" />
            Connect a source
          </button>
        </div>
      </div>
    </div>
  )
}

function StateBadge({ state }: { state: IndexState }) {
  const shared =
    'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide'

  if (state === 'ready') {
    return (
      <span className={`${shared} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`}>
        <Check aria-hidden className="h-2.5 w-2.5" />
        {STATE_LABEL.ready}
      </span>
    )
  }

  if (state === 'indexing') {
    return (
      <span className={`${shared} bg-primary/10 text-primary`}>
        <Loader2
          aria-hidden
          className="h-2.5 w-2.5 animate-spin motion-reduce:[animation-duration:2.4s]"
        />
        {STATE_LABEL.indexing}
      </span>
    )
  }

  if (state === 'failed') {
    return (
      <span className={`${shared} bg-rose-500/10 text-rose-600 dark:text-rose-400`}>
        <AlertCircle aria-hidden className="h-2.5 w-2.5" />
        {STATE_LABEL.failed}
      </span>
    )
  }

  return (
    <span className={`${shared} bg-muted text-muted-foreground`}>
      <Pause aria-hidden className="h-2.5 w-2.5" />
      {STATE_LABEL.paused}
    </span>
  )
}
