'use client'

/**
 * <ColorPicker> — a swatch grid, a hex field, and the native picker.
 *
 * Deliberately not a saturation-value square with a hue slider. That
 * control is a pointer-capture problem, a colour-space conversion and a
 * keyboard story of its own, and in a product it is almost always the wrong
 * offer: people picking a brand colour paste a hex, and people picking a
 * label colour want the eight the design system allows. So this is the two
 * cases that matter, plus `<input type="color">` as the escape hatch —
 * which is a real, accessible, platform-native picker that costs nothing.
 *
 * The hex field accepts what people actually paste: `#a1b2c3`, `a1b2c3`,
 * `#abc`, and uppercase. It normalises on blur rather than on keystroke,
 * because rewriting the field while somebody is typing the fourth character
 * of six is how you make a field impossible to type into.
 *
 * The swatch grid is a radio group — one value, several options — so it is
 * one tab stop with arrow keys, not eleven tab stops.
 */

import * as React from 'react'
import { Check, Pipette } from 'lucide-react'

export interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  /** The palette offered. Keep it to what the design system allows. */
  swatches?: string[]
  /** Hide the free-text hex field to restrict input to the swatches. */
  allowCustom?: boolean
  label: string
  className?: string
}

const DEFAULT_SWATCHES = [
  '#0f172a', '#64748b', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#ffffff',
]

/** `#abc` / `abc` / `A1B2C3` → `#a1b2c3`, or null if it is not a colour. */
export function normaliseHex(raw: string): string | null {
  const value = raw.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(value)) {
    return `#${value[0]}${value[0]}${value[1]}${value[1]}${value[2]}${value[2]}`.toLowerCase()
  }
  if (/^[0-9a-f]{6}$/i.test(value)) return `#${value.toLowerCase()}`
  return null
}

/**
 * Whether to draw the tick in black or white on a given swatch.
 *
 * Relative luminance, not a naive average: the eye is far more sensitive to
 * green than to blue, and averaging puts a white tick on a yellow swatch
 * where it disappears.
 */
function isLight(hex: string): boolean {
  const n = Number.parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45
}

export function ColorPicker({
  value,
  onChange,
  swatches = DEFAULT_SWATCHES,
  allowCustom = true,
  label,
  className = '',
}: ColorPickerProps) {
  const [draft, setDraft] = React.useState<string | null>(null)
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const index = swatches.findIndex((s) => s.toLowerCase() === value.toLowerCase())

  const move = (delta: number) => {
    const next = (Math.max(0, index) + delta + swatches.length) % swatches.length
    onChange(swatches[next])
    refs.current[next]?.focus()
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div
        role="radiogroup"
        aria-label={label}
        onKeyDown={(e) => {
          // A grid, so all four arrows move: horizontally by one, and
          // vertically by a row. The row length is the grid's column count.
          const columns = 6
          const map: Record<string, number> = {
            ArrowRight: 1,
            ArrowLeft: -1,
            ArrowDown: columns,
            ArrowUp: -columns,
          }
          if (e.key in map) {
            e.preventDefault()
            move(map[e.key])
          }
        }}
        className="grid grid-cols-6 gap-2"
      >
        {swatches.map((swatch, i) => {
          const selected = swatch.toLowerCase() === value.toLowerCase()
          return (
            <button
              key={swatch}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              // The hex IS the name. "Swatch 4" tells a screen reader user
              // nothing, and the colour name is not knowable from the value.
              aria-label={swatch}
              tabIndex={selected || (index === -1 && i === 0) ? 0 : -1}
              onClick={() => onChange(swatch)}
              style={{ backgroundColor: swatch }}
              className="flex h-8 w-full items-center justify-center rounded-md border border-border/60 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none"
            >
              {selected ? (
                <Check
                  className={`h-4 w-4 ${isLight(swatch) ? 'text-slate-900' : 'text-white'}`}
                  aria-hidden
                />
              ) : null}
            </button>
          )
        })}
      </div>

      {allowCustom ? (
        <div className="flex items-center gap-2">
          <div className="flex h-9 flex-1 items-center rounded-lg border border-border bg-background ps-2.5 focus-within:ring-2 focus-within:ring-ring">
            <span
              aria-hidden
              style={{ backgroundColor: value }}
              className="h-4 w-4 shrink-0 rounded border border-border/60"
            />
            <input
              value={draft ?? value}
              aria-label={`${label} hex value`}
              spellCheck={false}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                // Normalised here, not per keystroke: rewriting "#a1b" to
                // "#aa11bb" while somebody is typing "#a1b2c3" makes the
                // field impossible to use.
                const hex = normaliseHex(draft ?? '')
                if (hex) onChange(hex)
                setDraft(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') setDraft(null)
              }}
              className="w-full bg-transparent px-2 font-mono text-sm uppercase text-foreground outline-none"
            />
          </div>

          <label className="relative inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted/60 focus-within:ring-2 focus-within:ring-ring">
            <Pipette className="h-4 w-4" aria-hidden />
            <span className="sr-only">Open the system colour picker</span>
            {/*
              The native picker, made invisible rather than hidden: a
              `display:none` input cannot be opened by clicking its label in
              Safari, and `visibility:hidden` has the same problem.
            */}
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>
      ) : null}
    </div>
  )
}
