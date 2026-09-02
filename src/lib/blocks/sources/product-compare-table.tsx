'use client'

/**
 * <ProductCompareTable> — four products, side by side, differences first.
 *
 * Product Listings had the grid, the rail, the filter sidebar and the
 * collection toolbar: four ways of narrowing a catalogue down. Comparison
 * is what happens after the narrowing works and somebody is left holding
 * three plausible options, and it is the step where most storefronts hand
 * the shopper a spreadsheet or nothing at all.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * "Only show differences" is the whole feature. Twenty-two rows of specs,
 * fourteen of them identical across every column, is not a comparison — it
 * is a data dump that hides the four rows the decision turns on. One
 * toggle collapses the matching rows and says how many it hid, so nothing
 * is silently gone.
 *
 * THE ATTRIBUTE COLUMN IS PINNED
 *
 * Scroll a comparison sideways on a phone and the row labels leave the
 * screen; every number after that is unattributed. `position: sticky` on
 * the row headers, with an opaque background — sticky over a transparent
 * cell is the bug where text from the scrolling column shows through the
 * one that is meant to be fixed.
 *
 * REMOVING A PRODUCT IS UNDOABLE
 *
 * Comparisons are assembled by hand, item by item, and a column dropped by
 * mistake means rebuilding the set. The remove control puts it back.
 *
 * BETTER IS MARKED, BUT ONLY WHERE BETTER MEANS SOMETHING
 *
 * A tick on the highest number is nonsense for weight and useful for
 * battery life, so the direction lives on the row rather than being
 * assumed. Rows where "best" is a matter of taste carry no mark at all —
 * quietly declaring a winner on a subjective row is how a comparison table
 * stops being trusted.
 *
 * ACCESSIBILITY: `<th scope="col">` per product and `scope="row"` per
 * attribute, so every cell is announced with both of its coordinates.
 * The differences toggle is a labelled checkbox with a live region
 * reporting what changed, and "best" is a word in the cell, not a colour.
 */

import * as React from 'react'
import { Check, Plus, X } from 'lucide-react'

export interface CompareProduct {
  id: string
  name: string
  price: string
  values: Record<string, string>
}

export interface CompareRow {
  label: string
  /** How to read the row, or 'none' where "best" is a matter of taste. */
  better: 'higher' | 'lower' | 'none'
  /** Extracts the comparable number from a display value. */
  numeric?: (value: string) => number
}

export interface ProductCompareTableProps {
  products?: CompareProduct[]
  rows?: CompareRow[]
  className?: string
}

const DEFAULT_ROWS: CompareRow[] = [
  { label: 'Price', better: 'lower', numeric: (v) => Number(v.replace(/[^\d.]/g, '')) },
  { label: 'Battery life', better: 'higher', numeric: (v) => parseFloat(v) },
  { label: 'Weight', better: 'lower', numeric: (v) => parseFloat(v) },
  { label: 'Noise cancelling', better: 'none' },
  { label: 'Driver', better: 'none' },
  { label: 'Charging', better: 'none' },
  { label: 'Water resistance', better: 'none' },
  { label: 'Warranty', better: 'higher', numeric: (v) => parseFloat(v) },
  { label: 'Replaceable battery', better: 'none' },
]

const DEFAULT_PRODUCTS: CompareProduct[] = [
  {
    id: 'a',
    name: 'Field Over-Ear',
    price: '£249',
    values: {
      Price: '£249',
      'Battery life': '38 hours',
      Weight: '286 g',
      'Noise cancelling': 'Adaptive, 3 levels',
      Driver: '40 mm dynamic',
      Charging: 'USB-C, 3.5 mm passive',
      'Water resistance': 'IPX4',
      Warranty: '2 years',
      'Replaceable battery': 'Yes, by post',
    },
  },
  {
    id: 'b',
    name: 'Field Over-Ear Lite',
    price: '£179',
    values: {
      Price: '£179',
      'Battery life': '44 hours',
      Weight: '241 g',
      'Noise cancelling': 'Passive only',
      Driver: '40 mm dynamic',
      Charging: 'USB-C, 3.5 mm passive',
      'Water resistance': 'IPX4',
      Warranty: '2 years',
      'Replaceable battery': 'Yes, by post',
    },
  },
  {
    id: 'c',
    name: 'Studio Reference',
    price: '£329',
    values: {
      Price: '£329',
      'Battery life': '30 hours',
      Weight: '324 g',
      'Noise cancelling': 'Adaptive, 5 levels',
      Driver: '50 mm planar',
      Charging: 'USB-C, 3.5 mm passive',
      'Water resistance': 'None',
      Warranty: '5 years',
      'Replaceable battery': 'Yes, by post',
    },
  },
]

export function ProductCompareTable({
  products = DEFAULT_PRODUCTS,
  rows = DEFAULT_ROWS,
  className = '',
}: ProductCompareTableProps) {
  const [removed, setRemoved] = React.useState<string[]>([])
  const [differencesOnly, setDifferencesOnly] = React.useState(true)

  const shown = products.filter((p) => !removed.includes(p.id))

  const isSame = (row: CompareRow) =>
    shown.length > 1 && new Set(shown.map((p) => p.values[row.label])).size === 1

  const visibleRows = differencesOnly ? rows.filter((r) => !isSame(r)) : rows
  const hidden = rows.length - visibleRows.length

  /* Direction comes from the row, so nothing declares a winner by guess. */
  const bestIds = (row: CompareRow) => {
    if (row.better === 'none' || !row.numeric || shown.length < 2) return []
    const scored = shown.map((p) => ({ id: p.id, n: row.numeric!(p.values[row.label] ?? '') }))
    if (scored.some((s) => Number.isNaN(s.n))) return []
    const target =
      row.better === 'higher'
        ? Math.max(...scored.map((s) => s.n))
        : Math.min(...scored.map((s) => s.n))
    return scored.filter((s) => s.n === target).map((s) => s.id)
  }

  return (
    <section className={`mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">
            Comparing {shown.length} of {products.length}
          </h2>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={differencesOnly}
              onChange={(event) => setDifferencesOnly(event.target.checked)}
              /*
                accent-primary, not a hand-rolled box: these tokens are
                oklch(), so hsl(var(--primary)) is not a colour and the
                check renders browser-blue.
              */
              className="h-4 w-4 rounded border-field accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
            Only show differences
          </label>
        </div>

        {/* Nothing is silently gone. */}
        <p aria-live="polite" className="mt-1 min-h-5 text-xs text-muted-foreground">
          {differencesOnly && hidden > 0
            ? `${hidden} ${hidden === 1 ? 'row is' : 'rows are'} identical across all ${shown.length} and hidden.`
            : 'Showing every row, identical or not.'}
        </p>

        {removed.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {removed.map((id) => {
              const product = products.find((p) => p.id === id)
              if (!product) return null
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRemoved((r) => r.filter((x) => x !== id))}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Plus aria-hidden className="h-3.5 w-3.5" />
                  Put {product.name} back
                </button>
              )
            })}
          </div>
        ) : null}

        <div className="mt-4 -mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[36rem] border-collapse text-start text-sm">
            <caption className="sr-only">
              Specifications compared across {shown.length} products.
              {differencesOnly && hidden > 0
                ? ` ${hidden} identical rows are hidden.`
                : ''}
            </caption>
            <thead>
              <tr className="border-b border-border align-bottom">
                {/* Opaque, or the scrolling column shows through it. */}
                <th
                  scope="col"
                  className="sticky left-0 z-10 w-40 bg-card px-3 py-3 text-xs font-medium text-muted-foreground"
                >
                  Specification
                </th>
                {shown.map((product) => (
                  <th key={product.id} scope="col" className="px-3 py-3">
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">
                          {product.name}
                        </span>
                        <span className="block text-xs font-normal text-muted-foreground">
                          {product.price}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setRemoved((r) => [...r, product.id])}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X aria-hidden className="h-3.5 w-3.5" />
                        <span className="sr-only">
                          Remove {product.name} from the comparison
                        </span>
                      </button>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleRows.map((row) => {
                const best = bestIds(row)
                return (
                  <tr key={row.label}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-card px-3 py-2.5 text-xs font-medium text-muted-foreground"
                    >
                      {row.label}
                    </th>
                    {shown.map((product) => {
                      const isBest = best.includes(product.id)
                      return (
                        <td key={product.id} className="px-3 py-2.5 text-foreground">
                          <span className="flex items-center gap-1.5">
                            {product.values[row.label] ?? '—'}
                            {isBest ? (
                              /* A word, not only a tick and a colour. */
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                <Check aria-hidden className="h-3 w-3" />
                                best
                              </span>
                            ) : null}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {shown.length < 2 ? (
          <p className="mt-4 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            One product left. Put another back to compare against it.
          </p>
        ) : null}
      </div>
    </section>
  )
}
