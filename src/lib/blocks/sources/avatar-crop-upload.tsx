'use client'

/**
 * <AvatarCropUpload> — pick a photo, frame it, save it.
 *
 * The upload blocks in this catalog handle files as files: a dropzone, a
 * queue, a progress bar. An avatar is a different job that happens to start
 * the same way. Nobody's photo is square, the interesting part of it is
 * rarely in the middle, and a product that centre-crops whatever it is
 * given produces a wall of members photographed from the chin down.
 *
 * So the framing is the block, and the upload is one line of it.
 *
 * WHY THE MASK IS A RING AND NOT A CLIPPED IMAGE
 *
 * The image is drawn in full and a ring is laid over it, dimming everything
 * outside the circle rather than hiding it. Cropping tools that show only
 * the kept region make people frame blind — you cannot tell whether the top
 * of someone's head is just outside the circle or was never in the file.
 * Seeing the discarded part is what makes one drag enough.
 *
 * WHY ZOOM IS A RANGE INPUT
 *
 * A range is the only zoom control that is keyboard-operable without extra
 * work: arrows step it, Home and End reach the bounds, and it announces its
 * value. Pinch and scroll-to-zoom are additions to this, never replacements
 * for it, and a crop tool that can only be driven by a mouse locks people
 * out of setting their own face.
 *
 * WHAT IS SIMPLIFIED, SAID PLAINLY
 *
 * Position is two sliders rather than a drag, and the output is the
 * transform values rather than a canvas-rendered file. Dragging needs
 * pointer capture and bounds maths against the scaled image, and encoding
 * needs a canvas and a blob — both are real work with real edge cases, and
 * both would bury the part worth copying. The three numbers this produces
 * are exactly what a `<canvas>` `drawImage` call or a server-side resize
 * needs, so the remaining step is arithmetic rather than design.
 *
 * The sample photograph is an inline SVG data URI. Every artifact in this
 * catalog has to render with no network and no asset pipeline, and an
 * off-centre subject is the whole point of the demo — a centred one would
 * make the controls look unnecessary.
 */

import * as React from 'react'
import { Camera, RotateCcw, Upload } from 'lucide-react'

export interface AvatarCropUploadProps {
  heading?: string
  description?: string
  /** Any image URL. Defaults to a self-contained SVG portrait. */
  imageSrc?: string
  /** Rendered size of the circular frame, in pixels. */
  frameSize?: number
  onSave?: (crop: { zoom: number; x: number; y: number }) => void
  className?: string
}

/*
  A deliberately off-centre subject: the head sits high and left, so a
  centre crop clips it and the controls have something to fix.
*/
const SAMPLE_PORTRAIT =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#bae6fd"/><stop offset="100%" stop-color="#e0f2fe"/>
        </linearGradient>
        <linearGradient id="coat" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3f4d63"/><stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
      </defs>
      <rect width="320" height="320" fill="url(#bg)"/>
      <circle cx="252" cy="66" r="30" fill="#fde68a" opacity="0.75"/>
      <path d="M126 246c62 0 112 34 112 74H14c0-40 50-74 112-74Z" fill="url(#coat)"/>
      <path d="M104 196h44v56h-44z" fill="#eab894"/>
      <circle cx="126" cy="132" r="74" fill="#f5d0b0"/>
      <path d="M52 130a74 74 0 0 1 148-8c4-44-30-72-74-72s-78 32-74 80Z" fill="#6b4226"/>
      <circle cx="102" cy="138" r="6" fill="#3f2a1c"/>
      <circle cx="152" cy="138" r="6" fill="#3f2a1c"/>
      <path d="M108 170c10 9 28 9 38 0" stroke="#b9795a" stroke-width="6" fill="none" stroke-linecap="round"/>
    </svg>`,
  )

const MIN_ZOOM = 1
const MAX_ZOOM = 2.5

/*
  Where the sliders start, and deliberately not a perfect crop.

  The subject sits up and left of centre, so these values pull the face
  most of the way into the circle and leave it slightly high — a photo that
  arrives already framed makes the controls look like decoration. Note the
  translate percentages are in the image's own pre-scale space: a shift of
  n% moves it by `n% x width x zoom` on screen, which is why these numbers
  are smaller than the visible correction suggests.
*/
const DEFAULT_CROP: { zoom: number; x: number; y: number } = { zoom: 1.3, x: 7, y: 6 }

export function AvatarCropUpload({
  heading = 'Profile photo',
  description = 'Drag the sliders until your face fills the circle. Everything outside it is trimmed.',
  imageSrc = SAMPLE_PORTRAIT,
  frameSize = 176,
  onSave,
  className = '',
}: AvatarCropUploadProps) {
  const [zoom, setZoom] = React.useState(DEFAULT_CROP.zoom)
  const [x, setX] = React.useState(DEFAULT_CROP.x)
  const [y, setY] = React.useState(DEFAULT_CROP.y)

  const dirty =
    zoom !== DEFAULT_CROP.zoom || x !== DEFAULT_CROP.x || y !== DEFAULT_CROP.y

  function reset() {
    setZoom(DEFAULT_CROP.zoom)
    setX(DEFAULT_CROP.x)
    setY(DEFAULT_CROP.y)
  }

  return (
    <section
      aria-labelledby="avatar-crop-heading"
      className={`mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 id="avatar-crop-heading" className="text-lg font-semibold text-foreground">
          {heading}
        </h2>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>

        <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3">
            {/*
              The frame. `overflow-hidden` on the outer square clips the
              image to the working area; the ring inside marks the circle
              that will actually be kept, with the discarded corners dimmed
              rather than removed.
            */}
            <div
              className="relative shrink-0 overflow-hidden rounded-xl bg-muted"
              style={{ width: frameSize, height: frameSize }}
            >
              <img
                src={imageSrc}
                alt="Your profile photo, positioned inside the crop frame"
                className="h-full w-full object-cover"
                style={{
                  transform: `scale(${zoom}) translate(${x}%, ${y}%)`,
                  transformOrigin: 'center',
                }}
              />
              {/* The mask: a very large spread shadow paints everything
                  outside the circle, which is one element instead of four
                  corner overlays that never quite line up.

                  `color-mix` rather than a slash-alpha on the token. These
                  tokens are complete `oklch()` colours, so `var(--background)/0.72`
                  is not a colour and the mask silently disappears. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_color-mix(in_oklab,var(--background)_72%,transparent)]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-inset ring-primary/70"
              />
            </div>

            <p className="text-xs text-muted-foreground">Preview · 512 × 512 PNG</p>
          </div>

          <div className="min-w-0 flex-1 space-y-5">
            <label className="block">
              <span className="flex items-baseline justify-between text-sm font-medium text-foreground">
                Zoom
                <span className="font-mono text-xs text-muted-foreground">
                  {zoom.toFixed(2)}×
                </span>
              </span>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </label>

            <label className="block">
              <span className="flex items-baseline justify-between text-sm font-medium text-foreground">
                Horizontal
                <span className="font-mono text-xs text-muted-foreground">{x}%</span>
              </span>
              <input
                type="range"
                min={-40}
                max={40}
                value={x}
                onChange={(event) => setX(Number(event.target.value))}
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </label>

            <label className="block">
              <span className="flex items-baseline justify-between text-sm font-medium text-foreground">
                Vertical
                <span className="font-mono text-xs text-muted-foreground">{y}%</span>
              </span>
              <input
                type="range"
                min={-40}
                max={40}
                value={y}
                onChange={(event) => setY(Number(event.target.value))}
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Upload aria-hidden className="h-4 w-4" />
                Replace photo
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={!dirty}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40"
              >
                <RotateCcw aria-hidden className="h-4 w-4" />
                Reset
              </button>
              <button
                type="button"
                onClick={() => onSave?.({ zoom, x, y })}
                className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Camera aria-hidden className="h-4 w-4" />
                Save photo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
