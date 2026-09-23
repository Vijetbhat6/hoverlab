'use client'

/**
 * <ReturnLabelInstructions> — the screen between "approved" and "posted".
 *
 * Returns fail in the gap after approval. The customer has a reference number,
 * a vague memory of a QR code in an email, and a box in the hall for eleven
 * days. Every one of those days is a support contact waiting to happen and a
 * refund the retailer has not been able to close.
 *
 * SO THE BLOCK IS A SET OF INSTRUCTIONS, NOT A LABEL DOWNLOAD
 *
 * Three drop-off methods, each with the thing that actually blocks it stated
 * up front: printerless needs a QR code the shop scans, home collection needs
 * someone in, a locker needs the parcel to fit. Choosing the method changes
 * the steps, because "print the label" and "show the QR code at the counter"
 * are not the same list with one line swapped.
 *
 * THE PACKING RULES ARE PART OF THE INSTRUCTIONS
 *
 * Most rejected returns are rejected on arrival for a reason listed here and
 * nowhere the customer saw: original packaging kept, accessories included,
 * label on the outside not inside. Putting them beside the label rather than
 * in a policy page is the entire difference between a return that clears and
 * one that bounces.
 *
 * THE DEADLINE IS A DATE, NOT A DURATION. "Return within 14 days" requires the
 * customer to remember when they started. A date does not, and it is the one
 * number worth repeating at the top and the bottom.
 *
 * THE QR CODE IS DRAWN, NOT FETCHED. A deterministic pattern from the
 * reference string — no image to host, no layout shift, and it demonstrates
 * the slot without pretending to be a real scannable code. Swap it for your
 * carrier's.
 *
 * ACCESSIBILITY: methods are a radio group, so arrow keys move between them
 * and only one is in the tab order; the steps are an `<ol>` that changes with
 * the method and is announced through a polite live region; the drawn code is
 * `aria-hidden` with the reference available as text beside it, because a
 * screen-reader user cannot use a QR code but can read the number out.
 */

import * as React from 'react'
import { Box, CalendarDays, MapPin, Printer, QrCode, Truck } from 'lucide-react'

export interface ReturnMethod {
  id: string
  label: string
  blocker: string
  icon: typeof Printer
  steps: string[]
}

export interface ReturnLabelInstructionsProps {
  reference?: string
  deadline?: string
  parcelNote?: string
  methods?: ReturnMethod[]
  packingRules?: string[]
  className?: string
}

const DEFAULT_METHODS: ReturnMethod[] = [
  {
    id: 'qr',
    label: 'Drop off, no printer',
    blocker: 'You need a phone with you at the counter',
    icon: QrCode,
    steps: [
      'Pack the item — see the rules below.',
      'Take the parcel and this QR code to any of the 4,100 drop-off points.',
      'The shop scans the code and prints the label onto your parcel.',
      'Keep the receipt. It is the proof of posting and the only thing that settles a lost-parcel claim.',
    ],
  },
  {
    id: 'print',
    label: 'Print the label yourself',
    blocker: 'You need a printer and something to attach the label with',
    icon: Printer,
    steps: [
      'Print the label at 100% — "fit to page" shrinks the barcode until scanners refuse it.',
      'Tape it flat on the largest face, with no tape across the barcode itself.',
      'Cover or remove the old delivery label. Two labels is the most common misroute.',
      'Drop the parcel at any point on the network, or hand it to a collecting driver.',
    ],
  },
  {
    id: 'collect',
    label: 'Collection from your address',
    blocker: 'Someone must be in between 08:00 and 18:00',
    icon: Truck,
    steps: [
      'Pick a date at least one working day ahead.',
      'Leave the parcel packed but unlabelled — the driver brings the label.',
      'The driver scans it on the doorstep and hands you a receipt.',
      'A missed collection is rebooked free once, then costs £4.',
    ],
  },
]

const DEFAULT_RULES = [
  'Original box and internal packaging, if you still have them.',
  'Every accessory that came with it — cables, allen keys, the manual.',
  'Nothing written on the product box itself. Put it inside an outer carton.',
  'One return per parcel. Two references in one box cannot be checked in.',
]

/** A drawn placeholder, deterministic from the reference. Not scannable. */
function codeCells(reference: string, size: number) {
  const cells: boolean[] = []
  let hash = 0
  for (const ch of reference) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  for (let i = 0; i < size * size; i++) {
    hash = (hash * 1103515245 + 12345) >>> 0
    cells.push(((hash >>> 16) & 1) === 1)
  }
  return cells
}

export function ReturnLabelInstructions({
  reference = 'RTN-4471-9082',
  deadline = 'Tuesday 30 September 2026',
  parcelNote = '1 parcel · up to 20 kg · 60 × 60 × 60 cm',
  methods = DEFAULT_METHODS,
  packingRules = DEFAULT_RULES,
  className = '',
}: ReturnLabelInstructionsProps) {
  const uid = React.useId()
  const [methodId, setMethodId] = React.useState(methods[0]?.id ?? '')

  const method = methods.find((m) => m.id === methodId) ?? methods[0]
  const grid = 11
  const cells = React.useMemo(() => codeCells(reference, grid), [reference])

  if (!method) return null

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-3xl">
        <header className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Send it back</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Return {reference} · {parcelNote}
              </p>
              {/* A date, not a duration. Repeated at the foot. */}
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <CalendarDays aria-hidden className="h-3.5 w-3.5" />
                Must be posted by {deadline}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div
                aria-hidden
                className="grid shrink-0 gap-px rounded-lg border border-border bg-card p-2"
                style={{ gridTemplateColumns: `repeat(${grid}, 0.5rem)` }}
              >
                {cells.map((on, i) => (
                  <span
                    key={i}
                    className={`h-2 w-2 rounded-[1px] border border-transparent ${on ? 'bg-foreground' : 'bg-transparent'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Or quote
                <br />
                <span className="font-mono text-xs text-foreground">{reference}</span>
              </p>
            </div>
          </div>
        </header>

        <fieldset className="mt-6 border-0 p-0">
          <legend className="text-sm font-semibold">How do you want to send it?</legend>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {methods.map((option) => {
              const Icon = option.icon
              const id = `${uid}-${option.id}`
              const on = methodId === option.id
              return (
                <div key={option.id}>
                  <input
                    type="radio"
                    id={id}
                    name={`${uid}-method`}
                    checked={on}
                    onChange={() => setMethodId(option.id)}
                    className="peer sr-only"
                  />
                  <label
                    htmlFor={id}
                    className={`block h-full cursor-pointer rounded-xl border p-3 text-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
                      on ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/60'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Icon aria-hidden className="h-4 w-4" />
                      {option.label}
                    </span>
                    {/* The thing that actually blocks it, said up front. */}
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {option.blocker}
                    </span>
                  </label>
                </div>
              )
            })}
          </div>
        </fieldset>

        <div aria-live="polite" className="mt-6">
          <h3 data-stress-ignore className="text-sm font-semibold">{method.label} — what to do</h3>
          <ol className="mt-3 space-y-3">
            {method.steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span
                  aria-hidden
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                >
                  {index + 1}
                </span>
                <p className="text-sm text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Box aria-hidden className="h-4 w-4 text-primary" />
              Pack it like this
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {packingRules.map((rule) => (
                <li key={rule} className="flex gap-2">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground border border-transparent" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <MapPin aria-hidden className="h-4 w-4 text-primary" />
              Nearest drop-off points
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              {[
                ['Kade Convenience, Weena 212', 'Open until 22:00 · 0.4 km'],
                ['PostPoint Central Station', 'Open until 20:00 · 1.1 km'],
                ['Blaak Locker Bank', '24 hours · 1.6 km · parcels under 40 cm'],
              ].map(([name, meta]) => (
                <li key={name}>
                  <span className="block font-medium">{name}</span>
                  <span className="block text-muted-foreground">{meta}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border p-4">
          <p className="text-xs text-muted-foreground">
            Posted after {deadline} and the return is refused at the depot and
            sent back to you. Nothing is charged, but nothing is refunded either.
          </p>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Printer aria-hidden className="h-4 w-4" />
            {method.id === 'print' ? 'Download the label' : 'Email me this page'}
          </button>
        </div>
      </div>
    </section>
  )
}
