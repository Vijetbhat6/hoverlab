'use client'

/**
 * <RangeSlider> — two thumbs on one track: a price range, a date span, an
 * age band.
 *
 * The obvious build is a `div` track with two draggable handles and a page of
 * pointer maths, and it arrives with none of what a slider needs: no keyboard,
 * no touch behaviour, no screen-reader value. This one stacks TWO NATIVE
 * `<input type="range">` on the same track instead. The browser then supplies
 * the arrow keys, Page Up/Down, Home/End, touch dragging and the announced
 * value; the component only draws the coloured span between the thumbs and
 * keeps the two from crossing.
 *
 * The trick that makes stacking work: each input has `pointer-events: none`
 * (so they do not block each other) and its THUMB has `pointer-events: auto`
 * (so the thumbs still grab). Two consequences, both handled:
 *
 *  - When both thumbs sit at the far end, the one on top is the max thumb and
 *    the min thumb cannot be reached to pull it back. So the min input is
 *    raised above the max input once it passes the midpoint.
 *  - The thumbs must never cross. Each `onChange` clamps against the other, so
 *    the range can collapse to a single value but never invert.
 *
 * Each input is named on its own ("Price, minimum" / "Price, maximum") — two
 * unlabelled sliders would be announced as "slider, 20" and "slider, 80".
 *
 * The filled span uses logical properties, so in a right-to-left document,
 * where the native track runs the other way, the fill still sits between the
 * thumbs.
 */

import * as React from 'react'

export interface RangeSliderProps {
  label: string
  min?: number
  max?: number
  step?: number
  value?: [number, number]
  defaultValue?: [number, number]
  onValueChange?: (value: [number, number]) => void
  /** How to show a value in the readout — currency, units. */
  format?: (n: number) => string
  disabled?: boolean
  className?: string
}

// One pseudo-element per engine; the two cannot share a selector list.
const THUMB =
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow ' +
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background ' +
  '[&:focus-visible::-webkit-slider-thumb]:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_35%,transparent)] [&:focus-visible::-moz-range-thumb]:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_35%,transparent)]'

const TRACK =
  '[&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent'

export function RangeSlider({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onValueChange,
  format = String,
  disabled = false,
  className = '',
}: RangeSliderProps) {
  const uid = React.useId()
  const [inner, setInner] = React.useState<[number, number]>(defaultValue ?? [min, max])
  const [lo, hi] = value ?? inner

  const set = (next: [number, number]) => {
    if (value === undefined) setInner(next)
    onValueChange?.(next)
  }

  const span = max - min || 1
  const startPct = ((lo - min) / span) * 100
  const endPct = ((hi - min) / span) * 100

  const input = `pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent focus-visible:outline-none disabled:cursor-not-allowed ${TRACK} ${THUMB}`

  return (
    <div className={`w-full ${disabled ? 'opacity-50' : ''} ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span id={`${uid}-label`} className="text-sm font-medium">
          {label}
        </span>
        <output aria-live="off" className="text-sm tabular-nums text-muted-foreground">
          {format(lo)} – {format(hi)}
        </output>
      </div>

      <div className="relative mt-3 h-5">
        <div aria-hidden className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted border border-transparent" />
        <div
          aria-hidden
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary border border-transparent"
          style={{ insetInlineStart: `${startPct}%`, width: `${Math.max(endPct - startPct, 0)}%` }}
        />
        <input
          type="range"
          aria-label={`${label}, minimum`}
          min={min}
          max={max}
          step={step}
          value={lo}
          disabled={disabled}
          onChange={(e) => set([Math.min(Number(e.target.value), hi), hi])}
          className={`${input} ${lo > min + span / 2 ? 'z-20' : 'z-10'}`}
        />
        <input
          type="range"
          aria-label={`${label}, maximum`}
          min={min}
          max={max}
          step={step}
          value={hi}
          disabled={disabled}
          onChange={(e) => set([lo, Math.max(Number(e.target.value), lo)])}
          className={`${input} ${lo > min + span / 2 ? 'z-10' : 'z-20'}`}
        />
      </div>
    </div>
  )
}
