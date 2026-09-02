'use client'

/**
 * <UploadResumable> — one big file, on a connection that will drop.
 *
 * File Upload had the dropzone, the progress list, the avatar cropper and
 * the CSV mapper. All four assume the upload finishes. This one assumes it
 * does not: a 4GB file over hotel wifi, where the interesting states are
 * paused, retrying, and "the tab closed an hour ago".
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * The bar is allowed to go backwards. When a chunk fails and is retried,
 * the bytes it claimed are given back, and the number drops. Every
 * progress bar that only ever increases is lying at exactly the moment the
 * user most needs the truth — they watch it reach 98%, sit there, and
 * finally fail, having believed for four minutes that it was nearly done.
 * A bar that dips by two per cent and says why is trusted afterwards.
 *
 * TIME REMAINING IS A RANGE, OR IT IS NOTHING
 *
 * Estimated from a rolling window of recent chunks, not from the average
 * since the start, and suppressed entirely while the rate is unstable —
 * which is what "3 seconds remaining" for five minutes actually is. A
 * range is honest about a number that genuinely is not known.
 *
 * RESUMING IS PROMISED IN ADVANCE, NOT AFTER THE FACT
 *
 * Nobody knows that closing the tab is safe unless it says so before they
 * do it. The sentence is under the bar the whole time, because the moment
 * it is needed is the moment the person has already given up. Its truth
 * depends on the upload id living somewhere durable — the comment on
 * `uploadId` is where that goes.
 *
 * CANCEL SAYS WHAT IT THROWS AWAY
 *
 * "Cancel and delete the 1.2GB already uploaded", not "Cancel". Partial
 * uploads cost storage and are billable; a person who meant to pause
 * should not discover the difference afterwards.
 *
 * ACCESSIBILITY: a real `role="progressbar"` with `aria-valuenow` and a
 * text `aria-valuetext`, so it is announced as "1.2 of 4.1 gigabytes,
 * 29 per cent" rather than a bare number. Status changes go through one
 * polite live region rather than each control announcing itself.
 */

import * as React from 'react'
import { CloudUpload, Pause, Play, RotateCcw, Trash2, WifiOff } from 'lucide-react'

export type UploadState = 'uploading' | 'paused' | 'retrying' | 'offline' | 'done'

export interface UploadResumableProps {
  fileName?: string
  totalBytes?: number
  chunkBytes?: number
  /**
   * The handle a resume needs. Persist it — localStorage, IndexedDB, the
   * server's session — or the promise below is not one.
   */
  uploadId?: string
  className?: string
}

const GB = 1024 ** 3

function size(bytes: number) {
  if (bytes >= GB) return `${(bytes / GB).toFixed(1)} GB`
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

export function UploadResumable({
  fileName = 'site-backup-2026-08-27.tar.zst',
  totalBytes = 4.1 * GB,
  chunkBytes = 0.05 * GB,
  uploadId = 'up_9f2c41',
  className = '',
}: UploadResumableProps) {
  const [sent, setSent] = React.useState(1.18 * GB)
  const [state, setState] = React.useState<UploadState>('uploading')
  const [retries, setRetries] = React.useState(2)
  /* Rolling window of recent chunk rates, in bytes per second. */
  const [rates, setRates] = React.useState<number[]>([9.4e6, 11.2e6, 4.1e6, 12.8e6])

  React.useEffect(() => {
    if (state !== 'uploading') return
    const timer = window.setInterval(() => {
      setSent((current) => {
        const next = current + chunkBytes
        if (next >= totalBytes) {
          setState('done')
          return totalBytes
        }
        return next
      })
      setRates((r) => [...r.slice(-5), 6e6 + Math.round(Math.sin(Date.now() / 900) * 4e6 + 5e6)])
    }, 900)
    return () => window.clearInterval(timer)
  }, [state, chunkBytes, totalBytes])

  const pct = Math.min(100, (sent / totalBytes) * 100)
  const remainingBytes = Math.max(0, totalBytes - sent)

  /* Recent chunks only. An average since the start is a different lie. */
  const recent = rates.slice(-4)
  const mean = recent.reduce((a, b) => a + b, 0) / Math.max(1, recent.length)
  const spread = Math.max(...recent) / Math.max(1, Math.min(...recent))
  const stable = recent.length >= 3 && spread < 2.5
  const lowSeconds = remainingBytes / Math.max(...recent)
  const highSeconds = remainingBytes / Math.max(1, Math.min(...recent))

  const minutes = (s: number) => Math.max(1, Math.round(s / 60))
  const eta =
    state !== 'uploading'
      ? null
      : stable
        ? `about ${minutes(lowSeconds)}–${minutes(highSeconds)} minutes left`
        : /* Suppressed rather than invented. */
          'time left is not worth guessing at this connection speed'

  const retryChunk = () => {
    setState('retrying')
    /* The bar gives the failed chunk's bytes back. It is allowed to. */
    setSent((current) => Math.max(0, current - chunkBytes))
    setRetries((r) => r + 1)
    window.setTimeout(() => setState('uploading'), 1200)
  }

  const STATUS: Record<UploadState, string> = {
    uploading: `Uploading ${size(sent)} of ${size(totalBytes)}`,
    paused: 'Paused. Nothing already uploaded has been lost.',
    retrying: `Chunk failed — sending it again. Progress went back by ${size(chunkBytes)}.`,
    offline: 'Connection lost. It will pick up from here when you are back.',
    done: 'Upload complete.',
  }

  return (
    <section className={`mx-auto w-full max-w-xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
          >
            {state === 'offline' ? (
              <WifiOff className="h-5 w-5" />
            ) : (
              <CloudUpload className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {size(totalBytes)} · {Math.ceil(totalBytes / chunkBytes)} chunks
              {retries > 0 ? ` · ${retries} retried` : ''}
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
            {Math.floor(pct)}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.floor(pct)}
          /* Announced in the unit that means something, not a bare number. */
          aria-valuetext={`${size(sent)} of ${size(totalBytes)}, ${Math.floor(pct)} per cent`}
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              state === 'retrying' ? 'bg-amber-500' : 'bg-primary'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* One live region for the whole component. */}
        <p aria-live="polite" className="mt-2 min-h-5 text-xs text-muted-foreground">
          {STATUS[state]}
          {eta ? ` · ${eta}` : ''}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {state === 'done' ? null : state === 'paused' || state === 'offline' ? (
            <button
              type="button"
              onClick={() => setState('uploading')}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Play aria-hidden className="h-4 w-4" />
              Resume from {size(sent)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setState('paused')}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Pause aria-hidden className="h-4 w-4" />
              Pause
            </button>
          )}

          <button
            type="button"
            onClick={retryChunk}
            disabled={state === 'done'}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <RotateCcw aria-hidden className="h-4 w-4" />
            Simulate a failed chunk
          </button>

          {/* Names what it throws away. */}
          <button
            type="button"
            className="ms-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Trash2 aria-hidden className="h-4 w-4" />
            Cancel and delete the {size(sent)} already uploaded
          </button>
        </div>

        {/* Said before it is needed, not after. */}
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          You can close this tab. The upload is stored as{' '}
          <code className="rounded bg-muted px-1 font-mono">{uploadId}</code> and
          carries on from {size(sent)} when you come back — for the next 7 days.
        </p>
      </div>
    </section>
  )
}
