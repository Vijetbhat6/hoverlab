/**
 * <AgentToolCalls> — tool invocations as compact chips that open into their
 * arguments and result.
 *
 * A run makes a dozen calls and only two of them are interesting, so the
 * default has to be dense: name, a one-line argument summary, a duration, a
 * status. Everything else is one click away.
 *
 * What is worth lifting:
 *
 *  - The status is never colour alone. Each chip carries an icon *and* an
 *    `sr-only` word, because "which of these failed" answered only in red is
 *    not answered for roughly one man in twelve.
 *  - Arguments render as a definition list — `<dt>` name, `<dd>` value —
 *    rather than a table, since the shape is genuinely key/value and a table
 *    of two columns forces a reader through row-and-column navigation for
 *    what is really a list of pairs.
 *  - Errors are `role="alert"` only when the panel is opened by the user.
 *    Marking a failed chip as an alert while the list renders would fire
 *    every past failure at a screen reader on page load.
 *  - The whole list is one `aria-busy` container while anything is running,
 *    which is how a reader learns the run is not finished without a live
 *    region reciting each call.
 */

'use client'

import * as React from 'react'
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Database,
  FileCode2,
  Globe,
  Loader2,
  Terminal,
} from 'lucide-react'

export type ToolStatus = 'ok' | 'error' | 'running'

export interface ToolCall {
  id: string
  name: string
  kind?: 'query' | 'http' | 'shell' | 'file'
  /** One-line argument summary shown on the collapsed chip. */
  preview: string
  args?: Record<string, string>
  result?: string
  status?: ToolStatus
  duration?: string
}

export interface AgentToolCallsProps {
  heading?: string
  calls?: ToolCall[]
  className?: string
}

const KIND_ICON = {
  query: Database,
  http: Globe,
  shell: Terminal,
  file: FileCode2,
} as const

const STATUS_LABEL = {
  ok: 'Succeeded',
  error: 'Failed',
  running: 'Running',
} as const

const DEFAULT_CALLS: ToolCall[] = [
  {
    id: '1',
    name: 'warehouse.query',
    kind: 'query',
    preview: 'select … from subscriptions where canceled_at …',
    args: {
      sql: 'select seat_band, sum(arr) from subscriptions where canceled_at between $1 and $2 group by 1',
      params: '["2025-07-01", "2025-09-30"]',
      timeout: '30s',
    },
    result: '3 rows · 214 ms',
    status: 'ok',
    duration: '2.7s',
  },
  {
    id: '2',
    name: 'files.read',
    kind: 'file',
    preview: 'pricing-handbook.md',
    args: { path: 'docs/pricing-handbook.md', range: 'L1–L240' },
    result: '9.4 KB read',
    status: 'ok',
    duration: '0.3s',
  },
  {
    id: '3',
    name: 'crm.search',
    kind: 'http',
    preview: 'GET /accounts?status=at_risk',
    args: { url: 'https://api.crm.internal/v2/accounts', query: 'status=at_risk&limit=100' },
    result: 'HTTP 429 — rate limited, retrying in 4s',
    status: 'error',
    duration: '1.2s',
  },
  {
    id: '4',
    name: 'sandbox.exec',
    kind: 'shell',
    preview: 'python analyse_cohorts.py',
    args: { command: 'python analyse_cohorts.py --window 90d', cwd: '/workspace' },
    status: 'running',
  },
]

export function AgentToolCalls({
  heading = '4 tool calls · 2 messages',
  calls = DEFAULT_CALLS,
  className = '',
}: AgentToolCallsProps) {
  const [open, setOpen] = React.useState<string[]>([])
  const busy = calls.some((c) => (c.status ?? 'ok') === 'running')
  const baseId = React.useId()

  function toggle(id: string) {
    setOpen((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
  }

  return (
    <div className={`mx-auto w-full max-w-2xl p-6 ${className}`}>
      <div
        aria-busy={busy}
        className="overflow-hidden rounded-2xl border border-border/60 bg-card"
      >
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
          <Terminal aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {heading}
          </h3>
        </div>

        <ul className="divide-y divide-border/40">
          {calls.map((call) => {
            const status = call.status ?? 'ok'
            const Icon = KIND_ICON[call.kind ?? 'query']
            const expanded = open.includes(call.id)
            const panelId = `${baseId}-${call.id}`

            return (
              <li key={call.id}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggle(call.id)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <ChevronRight
                    aria-hidden
                    className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                      expanded ? 'rotate-90' : ''
                    }`}
                  />

                  <Icon aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                  <code className="shrink-0 font-mono text-xs font-semibold">{call.name}</code>

                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                    {call.preview}
                  </span>

                  {call.duration ? (
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {call.duration}
                    </span>
                  ) : null}

                  <StatusMark status={status} />
                </button>

                {expanded ? (
                  <div id={panelId} className="space-y-3 bg-muted/30 px-4 pb-3.5 pt-1">
                    {call.args ? (
                      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 pt-2">
                        {Object.entries(call.args).map(([key, value]) => (
                          <React.Fragment key={key}>
                            <dt className="font-mono text-[11px] text-muted-foreground">{key}</dt>
                            <dd className="min-w-0 break-words font-mono text-[11px]">{value}</dd>
                          </React.Fragment>
                        ))}
                      </dl>
                    ) : null}

                    {call.result ? (
                      <p
                        // Announced only because the user just opened this
                        // panel — never on first render.
                        role={status === 'error' ? 'alert' : undefined}
                        className={`rounded-lg border px-2.5 py-1.5 font-mono text-[11px] ${
                          status === 'error'
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'border-border/60 bg-background text-muted-foreground'
                        }`}
                      >
                        {call.result}
                      </p>
                    ) : null}

                    {status === 'running' && !call.result ? (
                      <p className="font-mono text-[11px] text-muted-foreground">
                        Waiting for output…
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/**
 * Icon plus hidden word. The spinner degrades rather than stops under
 * reduced motion: a frozen spinner beside "Running" reads as a hung
 * process, which removes the feedback instead of the discomfort.
 */
function StatusMark({ status }: { status: ToolStatus }) {
  return (
    <span className="shrink-0">
      <span className="sr-only">{STATUS_LABEL[status]}</span>

      {status === 'ok' ? (
        <Check aria-hidden className="h-3.5 w-3.5 text-emerald-500" />
      ) : status === 'error' ? (
        <AlertTriangle aria-hidden className="h-3.5 w-3.5 text-rose-500" />
      ) : (
        <Loader2
          aria-hidden
          className="h-3.5 w-3.5 animate-spin text-primary motion-reduce:[animation-duration:2.4s]"
        />
      )}
    </span>
  )
}
