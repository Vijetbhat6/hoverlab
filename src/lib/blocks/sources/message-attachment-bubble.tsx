'use client'

/**
 * <MessageAttachmentBubble> — every kind of thing that is not text.
 *
 * The companion to `message-bubble-thread`, split out because attachments are
 * a genuinely separate problem and get treated as an afterthought: one grey
 * rectangle with a paperclip and a filename, whatever was sent.
 *
 * FIVE KINDS, AND EACH ONE NEEDS SOMETHING DIFFERENT
 *
 *   image     a thumbnail with real dimensions reserved, and alt text
 *   document  type, size and page count, because "report.pdf" is not enough
 *   link      a title and host, not a bare URL that wraps over four lines
 *   location  a name and a distance, not raw coordinates
 *   upload    a progress bar and a cancel, before it is any of the above
 *
 * Collapsing those into one card is what makes a chat feel unfinished. Each
 * shape below is a few lines and answers the question its own kind raises.
 *
 * THE IN-FLIGHT STATE IS THE ONE PEOPLE SKIP
 *
 * An upload occupies a bubble before it is a file, and it needs a determinate
 * progress bar, a size, and a cancel that actually removes the bubble. Showing
 * a spinner instead means a 40 MB video on a train looks identical to a stuck
 * request.
 *
 * IMAGES RESERVE THEIR BOX. `aspect-ratio` on the frame from the known
 * dimensions, so the thread does not jump when the thumbnail decodes. A chat
 * that reflows as images load is a chat you cannot read while it loads.
 *
 * SIZES ARE FORMATTED FROM BYTES ONCE. Not "1048576 bytes", not "1.048576 MB".
 * One helper, binary units, one decimal.
 *
 * ACCESSIBILITY: every attachment is a link or button with an accessible name
 * that includes the kind and the size — "Invoice INV-2026-0841, PDF, 240 KB,
 * 3 pages" — because "download" ×5 is what a screen reader otherwise hears.
 * The upload progress is a real `role="progressbar"` with its values set.
 */

import * as React from 'react'
import { Download, FileText, Link2, MapPin, X } from 'lucide-react'

export type AttachmentKind = 'image' | 'document' | 'link' | 'location' | 'upload'

export interface Attachment {
  id: string
  kind: AttachmentKind
  mine?: boolean
  at: string
  /** image */
  alt?: string
  width?: number
  height?: number
  /** document + upload */
  name?: string
  bytes?: number
  format?: string
  pages?: number
  /** upload */
  percent?: number
  /** link */
  title?: string
  host?: string
  excerpt?: string
  /** location */
  place?: string
  distance?: string
}

export interface MessageAttachmentBubbleProps {
  attachments?: Attachment[]
  className?: string
}

const DEFAULT_ATTACHMENTS: Attachment[] = [
  {
    id: 'a1',
    kind: 'image',
    at: '09:31',
    alt: 'The cracked base plate on the second chair, photographed from above',
    width: 1600,
    height: 1200,
  },
  {
    id: 'a2',
    kind: 'document',
    mine: true,
    at: '09:33',
    name: 'INV-2026-0841',
    format: 'PDF',
    bytes: 245_760,
    pages: 3,
  },
  {
    id: 'a3',
    kind: 'link',
    at: '09:35',
    title: 'Replacing a Meridian base plate — 8 minutes, one allen key',
    host: 'support.northwind.example',
    excerpt:
      'The plate is held by four M6 bolts under the seat pan. No need to remove the gas lift.',
  },
  {
    id: 'a4',
    kind: 'location',
    mine: true,
    at: '09:38',
    place: 'Rotterdam DC — goods in, gate 4',
    distance: '2.1 km from the ring road exit',
  },
  {
    id: 'a5',
    kind: 'upload',
    mine: true,
    at: 'now',
    name: 'unboxing-clip.mp4',
    format: 'MP4',
    bytes: 41_943_040,
    percent: 62,
  },
]

/** Binary units, one decimal, one place in the codebase. */
function size(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`
}

export function MessageAttachmentBubble({
  attachments = DEFAULT_ATTACHMENTS,
  className = '',
}: MessageAttachmentBubbleProps) {
  const [items, setItems] = React.useState(attachments)

  function cancel(id: string) {
    setItems((list) => list.filter((item) => item.id !== id))
  }

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-2xl space-y-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Attachments</h2>

        {items.map((item) => (
          <div
            key={item.id}
            className={`flex ${item.mine ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] overflow-hidden rounded-2xl text-sm ${
                item.mine
                  ? 'rounded-ee-sm bg-primary/10 text-foreground'
                  : 'rounded-es-sm bg-muted text-foreground'
              }`}
            >
              {item.kind === 'image' ? (
                <figure>
                  {/* The box is reserved from the known dimensions, so the
                      thread does not jump as the thumbnail decodes. */}
                  <div
                    style={{ aspectRatio: `${item.width ?? 4} / ${item.height ?? 3}` }}
                    className="grid w-64 max-w-full place-items-center bg-foreground/10 text-xs text-muted-foreground"
                  >
                    <span className="px-4 text-center">{item.alt}</span>
                  </div>
                  <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-muted-foreground">
                    <span>
                      {item.width} × {item.height}
                    </span>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1 rounded font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Download aria-hidden className="h-3 w-3" />
                      Save
                      <span className="sr-only"> the photograph: {item.alt}</span>
                    </a>
                  </figcaption>
                </figure>
              ) : null}

              {item.kind === 'document' ? (
                <a
                  href="#"
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span
                    aria-hidden
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-card text-primary"
                  >
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {item.format} · {size(item.bytes ?? 0)} · {item.pages} pages
                    </span>
                  </span>
                  <span className="sr-only">
                    Download {item.name}, {item.format}, {size(item.bytes ?? 0)},{' '}
                    {item.pages} pages
                  </span>
                </a>
              ) : null}

              {item.kind === 'link' ? (
                <a
                  href="#"
                  className="block p-3 transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  {/* A title and a host, not a URL that wraps over four lines. */}
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Link2 aria-hidden className="h-3 w-3" />
                    {item.host}
                  </span>
                  <span className="mt-1 block font-medium">{item.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {item.excerpt}
                  </span>
                </a>
              ) : null}

              {item.kind === 'location' ? (
                <a
                  href="#"
                  className="block transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span
                    aria-hidden
                    className="grid h-24 w-64 max-w-full place-items-center bg-foreground/10 text-muted-foreground"
                  >
                    <MapPin className="h-6 w-6" />
                  </span>
                  <span className="block p-3">
                    <span className="block font-medium">{item.place}</span>
                    <span className="block text-xs text-muted-foreground">
                      {item.distance}
                    </span>
                  </span>
                </a>
              ) : null}

              {item.kind === 'upload' ? (
                <div className="w-64 max-w-full p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {size(((item.bytes ?? 0) * (item.percent ?? 0)) / 100)} of{' '}
                        {size(item.bytes ?? 0)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => cancel(item.id)}
                      aria-label={`Cancel upload of ${item.name}`}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X aria-hidden className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {/* Determinate: a spinner cannot tell a slow upload from a
                      stuck one. */}
                  <div
                    role="progressbar"
                    aria-valuenow={item.percent ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uploading ${item.name}`}
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-card border border-transparent"
                  >
                    <div
                      style={{ width: `${item.percent ?? 0}%` }}
                      className="h-full rounded-full bg-primary transition-[width] border border-transparent"
                    />
                  </div>
                </div>
              ) : null}

              <p className="px-3 pb-2 text-end text-[10px] text-muted-foreground">
                {item.at}
              </p>
            </div>
          </div>
        ))}

        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Every attachment was cancelled. Cancelling removes the bubble — a
            cancel that leaves a dead card behind is the version people complain
            about.
          </p>
        ) : null}
      </div>
    </section>
  )
}
