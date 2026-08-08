'use client'

/**
 * <ProductGallery> — main image with a thumbnail strip.
 *
 * The thumbnails are a `tablist`, and the main image is the panel. That is
 * the correct pattern: the strip selects which of several views is shown,
 * which is exactly what tabs are, and it buys arrow-key navigation that a
 * row of buttons does not have.
 *
 * `aria-live` is deliberately absent. The visible image changing is not an
 * announcement — the tab's selected state already conveys it, and adding a
 * live region here makes a screen reader say the caption twice.
 *
 * Images are gradient placeholders rather than remote URLs, so the block
 * works offline and in a sandbox. Swap for `next/image` with a fixed
 * `aspect-ratio` when you wire it up — keeping the ratio is what stops the
 * gallery shifting the buy box down the page as images load.
 */

import * as React from 'react'
import { Expand } from 'lucide-react'

export interface GalleryView {
  id: string
  /** Alt text for the main image, and the thumbnail's accessible name. */
  label: string
  swatch: string
}

export interface ProductGalleryProps {
  views?: GalleryView[]
  className?: string
}

const DEFAULT_VIEWS: GalleryView[] = [
  { id: 'front', label: 'Front view', swatch: 'from-stone-200 to-stone-400' },
  { id: 'back', label: 'Back view', swatch: 'from-stone-300 to-stone-500' },
  { id: 'detail', label: 'Fabric detail', swatch: 'from-amber-200 to-stone-400' },
  { id: 'worn', label: 'Worn on model', swatch: 'from-zinc-300 to-zinc-500' },
]

export function ProductGallery({
  views = DEFAULT_VIEWS,
  className = '',
}: ProductGalleryProps) {
  const [active, setActive] = React.useState(0)
  const view = views[active] ?? views[0]

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setActive((i) => (i + 1) % views.length)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setActive((i) => (i - 1 + views.length) % views.length)
    }
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Fixed ratio — the buy box must not move as images swap. */}
      <div
        id={`gallery-panel-${view.id}`}
        role="tabpanel"
        aria-label={view.label}
        className="group relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-muted"
      >
        <div
          aria-hidden
          className={`h-full w-full bg-gradient-to-br ${view.swatch} transition-transform duration-500 group-hover:scale-[1.03]`}
        />

        <button
          type="button"
          aria-label={`Expand ${view.label}`}
          className="absolute bottom-3 right-3 rounded-full bg-background/85 p-2.5 text-muted-foreground opacity-0 backdrop-blur transition-all hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Expand aria-hidden className="h-4 w-4" />
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Product images"
        onKeyDown={onKeyDown}
        className="flex gap-2.5 overflow-x-auto pb-1"
      >
        {views.map((v, i) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls={`gallery-panel-${v.id}`}
            // Only the active tab is in the tab order; arrows move within.
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`aspect-square w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors sm:w-20 ${
              i === active ? 'border-primary' : 'border-transparent hover:border-border'
            }`}
          >
            <span className="sr-only">{v.label}</span>
            <span aria-hidden className={`block h-full w-full bg-gradient-to-br ${v.swatch}`} />
          </button>
        ))}
      </div>
    </div>
  )
}
