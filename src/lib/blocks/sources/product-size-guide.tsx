'use client'

/**
 * <ProductSizeGuide> — the panel that decides whether the parcel comes back.
 *
 * Product Detail had the gallery, the buy box, the info accordion and the
 * review summary. The size guide is the one surface on a clothing page
 * with a measurable return on getting it right: the majority of apparel
 * returns are "wrong size", and every one of them is a shipped parcel, a
 * refund and a restock.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * It answers the question people actually have, which is not "what is the
 * chest measurement of a medium" — it is "what should I buy". So the two
 * pieces of evidence that answer it are above the table, not below it:
 * what the model is wearing next to their height, and what previous buyers
 * did. "Nine in ten kept their usual size" is a fact from the returns data
 * that costs nothing to surface and outperforms the entire table.
 *
 * CENTIMETRES AND INCHES ARE THE SAME TABLE
 *
 * The toggle converts; it does not swap in a second, differently rounded
 * table, and it does not scroll you back to the top. Rounding is done once
 * at display, so 96cm is 37.8in rather than the 38 that a hand-maintained
 * inch table would carry — and the row you were reading stays where it is.
 *
 * HOW TO MEASURE IS PART OF THE GUIDE
 *
 * A chest measurement is useless if two people take it differently. One
 * line per row, in the table, rather than a separate diagram nobody opens.
 *
 * THE TABLE SCROLLS, THE PAGE DOES NOT
 *
 * Six columns will not fit a phone, so the table gets its own horizontal
 * scroll container with the size column pinned. A page that scrolls
 * sideways because of one table is a broken page.
 *
 * ACCESSIBILITY: a real `<table>` with `<caption>`, `scope="col"` and
 * `scope="row"` — a screen reader then reads "Medium, chest, 96 to 101
 * centimetres" instead of a stream of numbers. The unit toggle is a
 * labelled radio group, so it is one control with two states rather than
 * two buttons that both look pressed.
 */

import * as React from 'react'
import { Info, Ruler } from 'lucide-react'

export interface SizeRow {
  size: string
  /** Centimetres, always. Inches are computed, never stored twice. */
  chest: [number, number]
  waist: [number, number]
  sleeve: number
}

export interface ProductSizeGuideProps {
  productName?: string
  rows?: SizeRow[]
  modelNote?: string
  /** From returns data — the single most useful line on the panel. */
  fitNote?: string
  className?: string
}

const DEFAULT_ROWS: SizeRow[] = [
  { size: 'XS', chest: [81, 86], waist: [66, 71], sleeve: 61 },
  { size: 'S', chest: [86, 91], waist: [71, 76], sleeve: 62.5 },
  { size: 'M', chest: [96, 101], waist: [81, 86], sleeve: 64 },
  { size: 'L', chest: [106, 111], waist: [91, 96], sleeve: 65.5 },
  { size: 'XL', chest: [116, 121], waist: [101, 106], sleeve: 67 },
  { size: 'XXL', chest: [126, 131], waist: [111, 116], sleeve: 68.5 },
]

const MEASURE_HELP: Record<string, string> = {
  Chest: 'Around the fullest part, under the arms, tape level and not pulled tight.',
  Waist: 'Around the narrowest part, usually just above the navel.',
  Sleeve: 'From the centre back of the neck, over the shoulder, to the wrist.',
}

export function ProductSizeGuide({
  productName = 'Heavyweight Oxford Shirt',
  rows = DEFAULT_ROWS,
  modelNote = 'The model is 1.78m and wears a medium.',
  fitNote = '9 in 10 buyers kept their usual size. The 1 in 10 who exchanged went up, not down.',
  className = '',
}: ProductSizeGuideProps) {
  const [unit, setUnit] = React.useState<'cm' | 'in'>('cm')
  /*
    The size the model is wearing, marked in the table as well as named
    above it. Not a click target: a row that only responds to a mouse is a
    control keyboard users cannot reach, and this one has nothing to say
    that the marking does not already say.
  */
  const modelSize = 'M'

  /* Rounded once, at display. There is no second table to drift. */
  const value = (cm: number) => (unit === 'cm' ? cm : cm / 2.54)
  const show = (cm: number) => {
    const v = value(cm)
    return unit === 'cm' ? `${Math.round(v)}` : v.toFixed(1)
  }
  const range = ([a, b]: [number, number]) => `${show(a)}–${show(b)}`

  return (
    <section className={`mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Ruler aria-hidden className="h-4 w-4 text-muted-foreground" />
              Size guide — {productName}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Measurements are of the body, not the garment.
            </p>
          </div>

          {/* One control with two states, not two buttons that both look on. */}
          <fieldset className="shrink-0">
            <legend className="sr-only">Units</legend>
            <div className="flex rounded-lg border border-border bg-background p-0.5">
              {(['cm', 'in'] as const).map((u) => (
                <label
                  key={u}
                  className={`cursor-pointer rounded-md px-3 py-1 text-sm font-medium transition focus-within:ring-2 focus-within:ring-ring ${
                    unit === u
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <input
                    type="radio"
                    name="size-guide-unit"
                    value={u}
                    checked={unit === u}
                    onChange={() => setUnit(u)}
                    className="sr-only"
                  />
                  {u === 'cm' ? 'Centimetres' : 'Inches'}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* The two facts that answer the real question, before the table. */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <p className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">
            {modelNote}
          </p>
          <p className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">
            {fitNote}
          </p>
        </div>

        {/* Its own scroll container — the page must not scroll sideways. */}
        <div className="mt-5 -mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[34rem] border-collapse text-start text-sm">
            <caption className="sr-only">
              Body measurements by size, in {unit === 'cm' ? 'centimetres' : 'inches'}.
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-card px-3 py-2 text-xs font-medium text-muted-foreground"
                >
                  Size
                </th>
                {(['Chest', 'Waist', 'Sleeve'] as const).map((label) => (
                  <th key={label} scope="col" className="px-3 py-2 align-top">
                    <span className="block text-xs font-medium text-muted-foreground">
                      {label} ({unit})
                    </span>
                    {/* How to measure, in the table rather than a diagram. */}
                    <span className="mt-0.5 block max-w-44 text-[11px] font-normal leading-snug text-muted-foreground">
                      {MEASURE_HELP[label]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const on = modelSize === row.size
                return (
                  <tr key={row.size} className={on ? 'bg-accent/50' : undefined}>
                    <th
                      scope="row"
                      className={`sticky left-0 z-10 px-3 py-2.5 font-semibold text-foreground ${
                        on ? 'bg-accent/50' : 'bg-card'
                      }`}
                    >
                      {row.size}
                      {on ? (
                        <span className="block text-[11px] font-normal text-muted-foreground">
                          worn by the model
                        </span>
                      ) : null}
                    </th>
                    <td className="px-3 py-2.5 tabular-nums text-foreground">
                      {range(row.chest)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-foreground">
                      {range(row.waist)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-foreground">
                      {show(row.sleeve)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Between two sizes on chest and waist? This shirt is cut straight, so
          take the larger — that is what the exchanges above did.
        </p>
      </div>
    </section>
  )
}
