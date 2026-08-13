'use client'

/**
 * <UploadProgressList> — the list that follows the dropzone.
 *
 * The dropzone is the easy half of an uploader; this list is where the
 * real work lives, because it is the only place cancel, retry and
 * failure can exist. The classic bug is hiding the failed row — the
 * upload dies, the row vanishes, and the user walks away certain their
 * file went up. Here a failure stays visible, says why, and carries a
 * retry button, which is the entire contract of the component.
 *
 * Progress bars are real `role="progressbar"` elements with
 * `aria-valuenow`, not styled divs — a screen reader should hear 62%,
 * not silence. The shimmer on active rows is `motion-safe:` gated.
 */

import * as React from 'react'
import {
  CircleCheck,
  FileArchive,
  FileImage,
  FileText,
  File as FileIcon,
  RotateCcw,
  X,
} from 'lucide-react'

export type UploadState = 'complete' | 'uploading' | 'queued' | 'failed'

export interface UploadRow {
  id: string
  name: string
  size: string
  state: UploadState
  /** 0–100, meaningful only while uploading. */
  progress?: number
  error?: string
}

export interface UploadProgressListProps {
  files?: UploadRow[]
  className?: string
}

const DEFAULT_FILES: UploadRow[] = [
  { id: 'f1', name: 'onboarding-deck.pdf', size: '4.2 MB', state: 'complete' },
  { id: 'f2', name: 'team-offsite-photos.zip', size: '212 MB', state: 'uploading', progress: 62 },
  { id: 'f3', name: 'homepage-hero.png', size: '8.7 MB', state: 'uploading', progress: 18 },
  { id: 'f4', name: 'q3-financials.xlsx', size: '318 KB', state: 'queued' },
  { id: 'f5', name: 'launch-video-draft.mp4', size: '1.4 GB', state: 'failed', error: 'Connection lost at 34%' },
]

function iconFor(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return FileImage
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return FileArchive
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return FileText
  return FileIcon
}

export function UploadProgressList({
  files = DEFAULT_FILES,
  className = '',
}: UploadProgressListProps) {
  const [rows, setRows] = React.useState(files)

  function cancel(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id))
  }

  function retry(id: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? { ...row, state: 'uploading' as const, progress: 12, error: undefined }
          : row,
      ),
    )
  }

  return (
    <ul className={`mx-auto w-full max-w-lg space-y-2 ${className}`}>
      {rows.map((row) => {
        const Icon = iconFor(row.name)
        return (
          <li
            key={row.id}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3"
          >
            <span
              aria-hidden
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                row.state === 'failed'
                  ? 'bg-destructive/10 text-destructive'
                  : row.state === 'complete'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {row.state === 'complete' ? (
                <CircleCheck className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium text-card-foreground">
                  {row.name}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {row.size}
                </span>
              </p>

              {row.state === 'complete' ? (
                <p className="mt-0.5 text-xs text-muted-foreground">Uploaded</p>
              ) : row.state === 'queued' ? (
                <p className="mt-0.5 text-xs text-muted-foreground">Queued — waiting for a slot</p>
              ) : row.state === 'failed' ? (
                <p className="mt-0.5 text-xs text-destructive">{row.error ?? 'Upload failed'}</p>
              ) : (
                <div className="mt-1.5 flex items-center gap-2">
                  <div
                    role="progressbar"
                    aria-valuenow={row.progress ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uploading ${row.name}`}
                    className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
                  >
                    <span
                      className="block h-full rounded-full bg-primary motion-safe:animate-pulse"
                      style={{ width: `${row.progress ?? 0}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {row.progress ?? 0}%
                  </span>
                </div>
              )}
            </div>

            {row.state === 'failed' ? (
              <button
                type="button"
                onClick={() => retry(row.id)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
              >
                <RotateCcw aria-hidden className="h-3.5 w-3.5" />
                Retry
              </button>
            ) : row.state !== 'complete' ? (
              <button
                type="button"
                onClick={() => cancel(row.id)}
                aria-label={`Cancel upload of ${row.name}`}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
