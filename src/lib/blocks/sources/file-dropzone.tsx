'use client'

/**
 * <FileDropzone> — drag-and-drop upload with per-file progress.
 *
 * The drag counter is the part everyone gets wrong. `dragleave` fires when
 * the pointer crosses into a *child* element, so a naive
 * `onDragLeave={() => setActive(false)}` makes the highlight flicker as you
 * move across the zone's own contents. Counting enter/leave pairs and only
 * clearing at zero is the fix.
 *
 * The zone is also a real <label> wrapping a file input, so clicking and
 * keyboard activation both work without re-implementing either — a div with
 * an onClick that opens a file picker is unreachable by keyboard.
 *
 * Rejected files stay listed with the reason rather than being dropped
 * silently, which is how users end up believing an upload succeeded.
 */

import * as React from 'react'
import { CloudUpload, File as FileIcon, X, CircleCheck, TriangleAlert } from 'lucide-react'

export interface UploadItem {
  id: string
  name: string
  size: number
  /** 0–100. */
  progress: number
  error?: string
}

export interface FileDropzoneProps {
  accept?: string
  maxSizeMb?: number
  initialFiles?: UploadItem[]
  onFiles?: (files: File[]) => void
  className?: string
}

const DEFAULT_FILES: UploadItem[] = [
  { id: '1', name: 'brand-guidelines.pdf', size: 2_411_724, progress: 100 },
  { id: '2', name: 'hero-render.png', size: 8_930_112, progress: 64 },
  { id: '3', name: 'archive.zip', size: 148_930_112, progress: 0, error: 'Larger than the 20 MB limit' },
]

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileDropzone({
  accept = 'image/*,application/pdf',
  maxSizeMb = 20,
  initialFiles = DEFAULT_FILES,
  onFiles,
  className = '',
}: FileDropzoneProps) {
  const [files, setFiles] = React.useState(initialFiles)
  const [active, setActive] = React.useState(false)

  // Enter/leave fire per element crossed, not per zone — count the pairs.
  const depth = React.useRef(0)

  function handleDragEnter(event: React.DragEvent) {
    event.preventDefault()
    depth.current += 1
    setActive(true)
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault()
    depth.current -= 1
    if (depth.current <= 0) {
      depth.current = 0
      setActive(false)
    }
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    depth.current = 0
    setActive(false)
    addFiles(Array.from(event.dataTransfer.files))
  }

  function addFiles(incoming: File[]) {
    if (incoming.length === 0) return
    onFiles?.(incoming)

    setFiles((prev) => [
      ...prev,
      ...incoming.map((file, i) => ({
        id: `${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        progress: 0,
        error:
          file.size > maxSizeMb * 1024 * 1024
            ? `Larger than the ${maxSizeMb} MB limit`
            : undefined,
      })),
    ])
  }

  return (
    <div className={`w-full ${className}`}>
      {/* A label wrapping the input — click and keyboard both work natively. */}
      <label
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors focus-within:ring-2 focus-within:ring-primary ${
          active
            ? 'border-primary bg-primary/5'
            : 'border-border/60 bg-card/40 hover:border-primary/40 hover:bg-muted/30'
        }`}
      >
        <input
          type="file"
          multiple
          accept={accept}
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
          className="sr-only"
        />

        <span
          aria-hidden
          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
            active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
          }`}
        >
          <CloudUpload className="h-6 w-6" />
        </span>

        <span className="mt-4 block text-sm font-semibold">
          {active ? 'Drop to upload' : 'Drag files here, or click to browse'}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">
          Images and PDFs up to {maxSizeMb} MB each
        </span>
      </label>

      {files.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {files.map((file) => {
            const done = !file.error && file.progress >= 100

            return (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3"
              >
                <span
                  aria-hidden
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    file.error
                      ? 'bg-destructive/10 text-destructive'
                      : done
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {file.error ? (
                    <TriangleAlert className="h-4 w-4" />
                  ) : done ? (
                    <CircleCheck className="h-4 w-4" />
                  ) : (
                    <FileIcon className="h-4 w-4" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium">{file.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatSize(file.size)}
                    </span>
                  </p>

                  {file.error ? (
                    <p className="mt-0.5 text-xs text-destructive">{file.error}</p>
                  ) : done ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">Uploaded</p>
                  ) : (
                    <div
                      role="progressbar"
                      aria-valuenow={file.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Uploading ${file.name}`}
                      className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"
                    >
                      <span
                        className="block h-full rounded-full bg-primary transition-all"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
                  aria-label={`Remove ${file.name}`}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X aria-hidden className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
