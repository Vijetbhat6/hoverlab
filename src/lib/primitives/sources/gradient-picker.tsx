'use client'

/**
 * <GradientPicker> — stops on a track, an angle, and the CSS it produces.
 *
 * The component that is always a one-off. Every product that lets you brand
 * something needs it, nobody ships it, and the reason is that a gradient is
 * not one value — it is an ordered list of (colour, position) pairs plus a
 * type and an angle, and a control for it has to keep that list sorted
 * while the user drags one stop past another.
 *
 * The decisions worth naming:
 *
 *   - Stops are dragged on a track with pointer capture, so a drag that
 *     leaves the element still tracks. `setPointerCapture` rather than
 *     document listeners: the browser cleans up on its own if the pointer
 *     is lost, which document listeners famously do not.
 *   - The list is kept sorted by position at all times, so the emitted CSS
 *     is valid no matter what order the user made them in. An unsorted
 *     `linear-gradient` is not an error — it silently renders wrong.
 *   - Position is a percentage, snapped to whole numbers. Sub-pixel stop
 *     positions produce CSS nobody can read and no design needs.
 *   - The output string is shown and copyable, because that is what the
 *     user came for. A picker whose value only lives in React state is a
 *     toy.
 */

import * as React from 'react'
import { Plus, Trash2 } from 'lucide-react'

export interface GradientStop {
  color: string
  /** 0–100. */
  position: number
}

export interface GradientValue {
  type: 'linear' | 'radial'
  /** Degrees, for linear only. */
  angle: number
  stops: GradientStop[]
}

export interface GradientPickerProps {
  value: GradientValue
  onChange: (value: GradientValue) => void
  label?: string
  className?: string
}

/** The CSS for a gradient value. Stops are sorted, so this is always valid. */
export function gradientCss(value: GradientValue): string {
  const stops = [...value.stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.color} ${Math.round(s.position)}%`)
    .join(', ')
  return value.type === 'linear'
    ? `linear-gradient(${Math.round(value.angle)}deg, ${stops})`
    : `radial-gradient(circle, ${stops})`
}

export function GradientPicker({
  value,
  onChange,
  label = 'Gradient',
  className = '',
}: GradientPickerProps) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const css = gradientCss(value)

  const setStop = (index: number, patch: Partial<GradientStop>) => {
    const stops = value.stops.map((s, i) => (i === index ? { ...s, ...patch } : s))
    onChange({ ...value, stops })
  }

  const positionFromEvent = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return 0
    const raw = (clientX - rect.left) / rect.width
    // Mirrored for RTL: the track is a gradient, which is drawn in the
    // document's direction, so a handle dragged toward the reading start
    // has to move toward 0% in both directions.
    const ratio =
      typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
        ? 1 - raw
        : raw
    return Math.round(Math.max(0, Math.min(1, ratio)) * 100)
  }

  const addStop = () => {
    const sorted = [...value.stops].sort((a, b) => a.position - b.position)
    // Drop the new stop in the widest gap, which is where there is room for
    // it — appending at 100% puts it on top of the last one.
    let gap = 0
    let at = 50
    for (let i = 0; i < sorted.length - 1; i++) {
      const width = sorted[i + 1].position - sorted[i].position
      if (width > gap) {
        gap = width
        at = Math.round(sorted[i].position + width / 2)
      }
    }
    onChange({ ...value, stops: [...value.stops, { color: '#ffffff', position: at }] })
    setActiveIndex(value.stops.length)
  }

  const removeStop = (index: number) => {
    // Two stops is the minimum that is still a gradient.
    if (value.stops.length <= 2) return
    onChange({ ...value, stops: value.stops.filter((_, i) => i !== index) })
    setActiveIndex(0)
  }

  return (
    <div className={`flex w-full flex-col gap-3 ${className}`}>
      <div
        className="h-20 w-full rounded-xl border border-border"
        style={{ backgroundImage: css }}
        role="img"
        aria-label={`${label} preview`}
      />

      {/* -- the track -- */}
      <div
        ref={trackRef}
        className="relative h-6 w-full rounded-full border border-border"
        style={{ backgroundImage: gradientCss({ ...value, type: 'linear', angle: 90 }) }}
      >
        {value.stops.map((stop, i) => (
          <button
            key={i}
            type="button"
            role="slider"
            aria-label={`Stop ${i + 1}, ${stop.color}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(stop.position)}
            aria-valuetext={`${Math.round(stop.position)} percent`}
            onPointerDown={(e) => {
              setActiveIndex(i)
              // Capture, so the drag survives leaving the track — and is
              // released automatically if the pointer is lost.
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
              setStop(i, { position: positionFromEvent(e.clientX) })
            }}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 10 : 1
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault()
                setStop(i, { position: Math.min(100, stop.position + step) })
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault()
                setStop(i, { position: Math.max(0, stop.position - step) })
              } else if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault()
                removeStop(i)
              }
            }}
            style={{
              insetInlineStart: `${stop.position}%`,
              backgroundColor: stop.color,
            }}
            className={[
              'absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 shadow',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              // The handle is centred on its position. `-translate-x-1/2`
              // is physical on purpose: it pairs with the physical half of
              // `insetInlineStart`, and the logical rewrite of this exact
              // idiom is the classic RTL off-centre bug.
              '-translate-x-1/2 rtl:translate-x-1/2',
              i === activeIndex ? 'border-foreground' : 'border-background',
            ].join(' ')}
          />
        ))}
      </div>

      {/* -- controls -- */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          aria-label="Colour of the selected stop"
          value={value.stops[activeIndex]?.color ?? '#ffffff'}
          onChange={(e) => setStop(activeIndex, { color: e.target.value })}
          className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-background p-1"
        />

        <label className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-xs text-muted-foreground">
          Angle
          <input
            type="number"
            min={0}
            max={360}
            value={Math.round(value.angle)}
            disabled={value.type === 'radial'}
            onChange={(e) => onChange({ ...value, angle: Number(e.target.value) })}
            className="w-12 bg-transparent text-sm tabular-nums text-foreground outline-none disabled:opacity-40"
          />
        </label>

        <button
          type="button"
          onClick={() => onChange({ ...value, type: value.type === 'linear' ? 'radial' : 'linear' })}
          className="h-9 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {value.type === 'linear' ? 'Linear' : 'Radial'}
        </button>

        <button
          type="button"
          onClick={addStop}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> Stop
        </button>

        <button
          type="button"
          onClick={() => removeStop(activeIndex)}
          disabled={value.stops.length <= 2}
          aria-label="Remove the selected stop"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      <code className="block overflow-x-auto rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs text-muted-foreground">
        {css}
      </code>
    </div>
  )
}
