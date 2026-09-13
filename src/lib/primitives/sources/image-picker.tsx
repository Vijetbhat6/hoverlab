'use client'

/**
 * <ImagePicker> — a drop zone that is also a button that is also a preview.
 *
 * Three things make this different from a styled `<input type="file">`:
 *
 *   1. Drag and drop needs a counter, not a boolean. `dragleave` fires when
 *      the pointer crosses into a CHILD element, so the naive version
 *      flickers the highlight off every time the cursor passes over the
 *      icon in the middle of the zone. Counting enter/leave pairs is the
 *      only reliable fix.
 *   2. The file input must stay in the DOM and stay focusable. Replacing it
 *      with a div and a click handler loses keyboard access and the
 *      platform's own file dialog affordances, so the input is visually
 *      hidden and the label is the whole zone.
 *   3. The object URL has to be revoked. A picker used a dozen times in a
 *      session leaks a dozen blobs, each holding the whole image in memory
 *      until the tab closes.
 *
 * Validation is done here rather than left to `accept`, because `accept` is
 * a filter on the file dialog and nothing at all on a drop — a dragged
 * 40 MB video lands in your state and uploads.
 */

import * as React from 'react'
import { ImagePlus, Upload, X } from 'lucide-react'

export interface ImagePickerProps {
  value?: File | null
  onChange?: (file: File | null) => void
  /** Megabytes. Rejected before it reaches state. */
  maxSizeMb?: number
  accept?: string
  label?: string
  hint?: string
  className?: string
}

export function ImagePicker({
  value = null,
  onChange,
  maxSizeMb = 5,
  accept = 'image/png,image/jpeg,image/webp,image/avif',
  label = 'Upload an image',
  hint,
  className = '',
}: ImagePickerProps) {
  const [dragDepth, setDragDepth] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  /*
   * The preview URL, created when the file changes and revoked when it
   * changes again or the component unmounts. Without the revoke, every
   * pick holds its image in memory for the life of the document.
   */
  React.useEffect(() => {
    if (!value) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const accepted = accept.split(',').map((t) => t.trim())

  const take = (file: File | undefined) => {
    if (!file) return
    if (accepted.length > 0 && !accepted.includes(file.type)) {
      setError('That file type is not accepted.')
      return
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${maxSizeMb} MB.`)
      return
    }
    setError(null)
    onChange?.(file)
  }

  const clear = () => {
    setError(null)
    onChange?.(null)
    // The input keeps its value after a pick, so choosing the same file
    // twice in a row fires no change event without this.
    if (inputRef.current) inputRef.current.value = ''
  }

  const dragging = dragDepth > 0

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label
        onDragEnter={(e) => {
          e.preventDefault()
          // Counted, not a boolean: dragleave fires on every child
          // boundary, and a boolean flickers the highlight off as the
          // pointer crosses the icon.
          setDragDepth((d) => d + 1)
        }}
        onDragLeave={() => setDragDepth((d) => Math.max(0, d - 1))}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          setDragDepth(0)
          take(e.dataTransfer.files[0])
        }}
        className={[
          'relative flex cursor-pointer flex-col items-center justify-center gap-2',
          'rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          'focus-within:ring-2 focus-within:ring-ring',
          dragging
            ? 'border-primary bg-primary/5'
            : error
              ? 'border-destructive/50 bg-destructive/5'
              : 'border-border bg-muted/20 hover:bg-muted/40',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          // `sr-only` rather than `hidden`: a hidden input is not focusable,
          // which takes the whole control away from a keyboard user.
          className="sr-only"
          onChange={(e) => take(e.target.files?.[0])}
        />

        {preview ? (
          <>
            {/* A plain <img>, not next/image: a primitive has to paste
                into a project that may not have it, and the source here is
                an object URL that next/image could not optimise anyway. */}
            <img
              src={preview}
              alt={value?.name ?? ''}
              className="max-h-40 rounded-lg object-contain"
            />
            <p className="max-w-full truncate text-xs text-muted-foreground">
              {value?.name} · {((value?.size ?? 0) / 1024).toFixed(0)} KB
            </p>
          </>
        ) : (
          <>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background text-muted-foreground">
              {dragging ? (
                <Upload className="h-5 w-5" aria-hidden />
              ) : (
                <ImagePlus className="h-5 w-5" aria-hidden />
              )}
            </span>
            <span className="text-sm font-medium text-foreground">
              {dragging ? 'Drop it here' : label}
            </span>
            <span className="text-xs text-muted-foreground">
              {hint ?? `PNG, JPG, WebP or AVIF · up to ${maxSizeMb} MB`}
            </span>
          </>
        )}
      </label>

      {value ? (
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-3.5 w-3.5" aria-hidden /> Remove
        </button>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
