'use client'

/**
 * <ErrorStateRetry> — a failed-to-load panel that can actually recover.
 *
 * What separates a usable error state from a dead end:
 *
 *  - A retry that shows it is retrying. A button that silently re-fires and
 *    fails again reads as broken, so the busy state is explicit.
 *  - The technical detail behind a <details>, not on the surface. Users do
 *    not want a stack trace; the one person who does need it — the
 *    colleague they forward the screenshot to — needs it to be there.
 *  - A copyable error id. "Something went wrong" with no reference is
 *    unactionable for support.
 *
 * `role="alert"` announces the failure immediately, since a section that
 * silently swaps from spinner to error is invisible to a screen reader.
 */

import * as React from 'react'
import { RefreshCw, CircleAlert, Copy, Check } from 'lucide-react'

export interface ErrorStateRetryProps {
  title?: string
  description?: string
  /** Shown behind a disclosure — stack, response body, whatever helps. */
  detail?: string
  errorId?: string
  onRetry?: () => Promise<void>
  supportHref?: string
  className?: string
}

export function ErrorStateRetry({
  title = 'We could not load this',
  description = 'The request failed before it finished. Your data is safe — nothing was changed.',
  detail = 'GET /api/v1/projects → 503 Service Unavailable\n  upstream: projects-api\n  duration: 30012ms (timeout)',
  errorId = 'err_7f3a92c4b81e',
  onRetry,
  supportHref,
  className = '',
}: ErrorStateRetryProps) {
  const [busy, setBusy] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  async function retry() {
    if (busy) return
    setBusy(true)
    try {
      await onRetry?.()
    } finally {
      setBusy(false)
    }
  }

  async function copyId() {
    if (!navigator.clipboard) return
    await navigator.clipboard.writeText(errorId)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/60 px-6 py-12 text-center ${className}`}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <CircleAlert className="h-6 w-6" />
      </span>

      <h2 className="mt-5 text-lg font-bold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={retry}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          <RefreshCw
            aria-hidden
            className={`h-4 w-4 ${busy ? 'motion-safe:animate-spin' : ''}`}
          />
          {busy ? 'Retrying' : 'Try again'}
        </button>

        {supportHref ? (
          <a
            href={supportHref}
            className="rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Contact support
          </a>
        ) : null}
      </div>

      {errorId ? (
        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Reference</span>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{errorId}</code>
          <button
            type="button"
            onClick={copyId}
            aria-label="Copy error reference"
            className="rounded p-1 transition-colors hover:bg-muted hover:text-foreground"
          >
            {copied ? (
              <Check aria-hidden className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy aria-hidden className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ) : null}

      {detail ? (
        <details className="mt-6 w-full max-w-lg text-left [&_summary::-webkit-details-marker]:hidden">
          <summary className="cursor-pointer list-none text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            Technical details
          </summary>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-muted/60 p-3 text-left font-mono text-xs text-muted-foreground">
            {detail}
          </pre>
        </details>
      ) : null}
    </div>
  )
}
