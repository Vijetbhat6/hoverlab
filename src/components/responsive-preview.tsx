'use client'

/**
 * <ResponsivePreview> — see the block at the width it will actually be used.
 *
 * ── THE CONSTRAINT THAT SHAPES THIS ─────────────────────────────────────
 *
 * Tailwind's breakpoints are viewport media queries. Putting the preview in
 * a 375px-wide box does not produce the mobile layout — it produces the
 * desktop layout squeezed, which looks broken and is not what a phone would
 * render. Only a real viewport changes what `sm:` and `md:` do, and the only
 * real viewport available inside a page is a frame.
 *
 * ── SO WHY IS DESKTOP NOT A FRAME TOO ───────────────────────────────────
 *
 * Because the inline preview is load-bearing for two things that have
 * nothing to do with this feature. It is the markup a crawler reads on
 * `/block/<id>`, and it is what `scripts/shot-blocks.mts` screenshots. Both
 * would quietly stop working if the default became an iframe. So desktop
 * renders exactly what it rendered before, and the frame is created only
 * when someone actually asks for a narrower width — which also means the
 * page costs nothing extra for the readers who never touch the control.
 *
 * ── LOADING ─────────────────────────────────────────────────────────────
 *
 * `loading="lazy"` and a skeleton, because a frame is a second document
 * with its own React runtime. Switching to mobile takes a moment and a
 * blank white rectangle in the meantime reads as a broken block rather than
 * a loading one.
 *
 * ACCESSIBILITY: a radiogroup rather than three toggle buttons, so the
 * widths are announced as one choice out of three; the frame carries a
 * `title`, which is what a screen reader uses to name it; and the width is
 * in the accessible name, not only in an icon.
 */

import * as React from 'react'
import { Laptop, Languages, Monitor, Smartphone, Tablet } from 'lucide-react'

interface Device {
  id: string
  label: string
  /** CSS width for the frame. `null` renders the inline preview instead. */
  width: number | null
  Icon: typeof Monitor
}

const DEVICES: Device[] = [
  { id: 'mobile', label: 'Mobile', width: 375, Icon: Smartphone },
  { id: 'tablet', label: 'Tablet', width: 768, Icon: Tablet },
  { id: 'laptop', label: 'Laptop', width: 1024, Icon: Laptop },
  { id: 'full', label: 'Full width', width: null, Icon: Monitor },
]

export function ResponsivePreview({
  level,
  id,
  name,
  children,
}: {
  level: 'block' | 'page'
  id: string
  name: string
  /** The inline preview, rendered at full width. */
  children: React.ReactNode
}) {
  const [deviceId, setDeviceId] = React.useState('full')
  const [rtl, setRtl] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)

  const device = DEVICES.find((d) => d.id === deviceId) ?? DEVICES[3]

  function choose(next: Device) {
    if (next.id !== deviceId) setLoaded(false)
    setDeviceId(next.id)
  }

  /*
   * Turning RTL on forces the frame, even at full width.
   *
   * Direction is a document property — it decides how
   * `padding-inline-start` resolves and which way inline content runs — so
   * the inline preview, which lives inside an LTR page, cannot show it. The
   * width control and the direction control therefore share one frame, and
   * asking for RTL is one of the two ways to summon it.
   */
  const framed = device.width !== null || rtl
  const frameWidth = device.width ?? undefined

  function toggleRtl() {
    setLoaded(false)
    setRtl((value) => !value)
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Preview width"
        className="mb-3 flex flex-wrap items-center gap-1.5"
      >
        {DEVICES.map((option) => {
          const selected = option.id === device.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(option)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <option.Icon aria-hidden className="h-3.5 w-3.5" />
              <span aria-hidden>{option.label}</span>
              <span className="sr-only">
                {option.label}
                {option.width ? `, ${option.width} pixels wide` : ', the full column'}
              </span>
              {option.width ? (
                <span aria-hidden className="tabular-nums text-muted-foreground">
                  {option.width}
                </span>
              ) : null}
            </button>
          )
        })}
        {/*
          Separated from the width radios by a divider: direction is an
          independent axis, not a fifth width, and grouping it with them
          would imply picking one deselects the others.
        */}
        <span aria-hidden className="mx-1 h-4 w-px bg-border" />

        <button
          type="button"
          role="switch"
          aria-checked={rtl}
          onClick={toggleRtl}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            rtl
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Languages aria-hidden className="h-3.5 w-3.5" />
          <span aria-hidden>RTL</span>
          <span className="sr-only">
            Right-to-left direction, as Arabic, Hebrew, Farsi and Urdu read
          </span>
        </button>
      </div>

      {!framed ? (
        children
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-muted/30 p-4">
          <div
            className="relative mx-auto overflow-hidden rounded-xl border border-border/60 bg-background"
            style={{ width: frameWidth, maxWidth: '100%' }}
          >
            {!loaded ? (
              <div
                aria-hidden
                className="absolute inset-0 animate-pulse bg-muted/60"
              />
            ) : null}
            <iframe
              // Keyed on the width so switching devices remounts the frame
              // rather than resizing one. A resized iframe keeps whatever
              // state the block was in, and a menu left open at 1024px
              // reopens looking wrong at 375px.
              key={`${device.id}-${rtl ? 'rtl' : 'ltr'}`}
              src={`/preview/${level}/${id}${rtl ? '?dir=rtl' : ''}`}
              title={
                `${name}` +
                (device.width ? ` at ${device.width} pixels wide` : ' at full width') +
                (rtl ? ', right to left' : '')
              }
              loading="lazy"
              onLoad={() => setLoaded(true)}
              className="block h-[38rem] w-full border-0"
            />
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            {device.width
              ? `Rendered in a real ${device.width}px viewport, so the responsive breakpoints are the ones a device would actually hit.`
              : 'Rendered in its own document at full width.'}
            {rtl
              ? ' Direction is right-to-left: every gutter, alignment and border side comes from a logical property, so it mirrors without a second stylesheet.'
              : ''}
          </p>
        </div>
      )}
    </div>
  )
}
