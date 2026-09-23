'use client'

/**
 * <WarrantyCoveragePanel> — what is covered, what is not, and until when.
 *
 * Warranty screens fail in one consistent way: they state a duration and stop.
 * "2-year warranty" answers none of the three questions a customer opens the
 * page with — is my specific unit still in it, does it cover the thing that
 * has gone wrong, and what do I do now.
 *
 * SO THE PANEL IS BUILT AROUND A VERDICT
 *
 * A single line at the top says covered or not, for this serial number, today,
 * with the date it lapses. Everything below is the evidence. A customer who
 * reads only the first line has still been answered, which is the test any
 * status surface should pass.
 *
 * WHAT IS *NOT* COVERED IS AS PROMINENT AS WHAT IS
 *
 * Two columns, equal weight. Hiding exclusions behind a link is how a
 * warranty page turns into a complaint: the customer completes a claim, waits
 * four days and is refused for something that was always written down. Stating
 * it before the claim costs one column and saves the round trip.
 *
 * THE EXTENSION OFFER IS TIMED, NOT PERMANENT. It appears inside the window
 * where an extension can still be bought and disappears afterwards, rather
 * than sitting there permanently as an upsell — a lapsed warranty offering an
 * extension is an insult, not a conversion.
 *
 * DATES ARE RENDERED IN A FIXED LOCALE AND TIME ZONE. `toLocaleDateString`
 * with the browser's defaults produces one string on the server and another in
 * the client, React discards the subtree, and the block flickers. The strings
 * here are authored data for that reason — pass your own formatted values.
 *
 * ACCESSIBILITY: the verdict is a `role="status"` region rather than colour
 * alone; the two coverage lists are separate `<h3>`-headed lists so a screen
 * reader can jump between them; the serial-number picker is a labelled select
 * because most households own more than one of anything.
 */

import * as React from 'react'
import { CircleCheck, CircleX, FileText, ShieldCheck, Wrench } from 'lucide-react'

export interface WarrantyUnit {
  id: string
  product: string
  serial: string
  purchased: string
  expires: string
  /** Days left. Zero or less renders as lapsed. */
  daysLeft: number
  plan: string
}

export interface WarrantyCoveragePanelProps {
  units?: WarrantyUnit[]
  covered?: string[]
  excluded?: string[]
  /** Extension is offered only inside this many days of expiry. */
  extensionWindowDays?: number
  className?: string
}

const DEFAULT_UNITS: WarrantyUnit[] = [
  {
    id: 'u1',
    product: 'Kestrel sit-stand desk',
    serial: 'KS-2291-8840',
    purchased: '12 March 2025',
    expires: '12 March 2027',
    daysLeft: 546,
    plan: 'Standard · 2 years',
  },
  {
    id: 'u2',
    product: 'Meridian task chair',
    serial: 'MC-1187-2210',
    purchased: '4 November 2024',
    expires: '4 November 2026',
    daysLeft: 52,
    plan: 'Standard · 2 years',
  },
  {
    id: 'u3',
    product: 'Halo task lamp',
    serial: 'HL-0042-9917',
    purchased: '19 January 2023',
    expires: '19 January 2025',
    daysLeft: -602,
    plan: 'Standard · 2 years',
  },
]

const DEFAULT_COVERED = [
  'Motor, control box and handset failure',
  'Frame welds, joints and structural parts',
  'Gas lift, castors and tilt mechanism',
  'Manufacturing defects in the desktop surface',
  'Labour and parts on an approved repair',
]

const DEFAULT_EXCLUDED = [
  'Scratches, dents and finish wear from normal use',
  'Damage from moving the unit without dismantling it',
  'Units modified with third-party parts',
  'Consumables — cable ties, felt pads, bulbs',
  'Anything bought through an unauthorised reseller',
]

export function WarrantyCoveragePanel({
  units = DEFAULT_UNITS,
  covered = DEFAULT_COVERED,
  excluded = DEFAULT_EXCLUDED,
  extensionWindowDays = 90,
  className = '',
}: WarrantyCoveragePanelProps) {
  const uid = React.useId()
  const [unitId, setUnitId] = React.useState(units[0]?.id ?? '')

  const unit = units.find((u) => u.id === unitId) ?? units[0]
  if (!unit) return null

  const active = unit.daysLeft > 0
  // Offered only where it is still buyable — see the docblock.
  const canExtend = active && unit.daysLeft <= extensionWindowDays

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Warranty</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Coverage is per unit, not per order. Pick the serial number on the
              underside of the product.
            </p>
          </div>
          <div>
            <label htmlFor={`${uid}-unit`} className="sr-only">
              Choose a registered product
            </label>
            <select
              id={`${uid}-unit`}
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.product} · {u.serial}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* The verdict. A customer who reads only this has been answered. */}
        <div
          role="status"
          className={`mt-5 rounded-2xl border p-5 ${
            active
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-border bg-muted/40'
          }`}
        >
          <p className="flex items-center gap-2 text-base font-semibold">
            {active ? (
              <ShieldCheck aria-hidden className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <CircleX aria-hidden className="h-5 w-5 text-muted-foreground" />
            )}
            {active
              ? `Covered until ${unit.expires}`
              : `Cover lapsed on ${unit.expires}`}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {unit.product} · serial <span className="font-mono text-xs">{unit.serial}</span>{' '}
            · bought {unit.purchased} · {unit.plan}
            {active ? ` · ${unit.daysLeft} days remaining` : ''}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!active}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Wrench aria-hidden className="h-4 w-4" />
              Start a warranty claim
            </button>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <FileText aria-hidden className="h-4 w-4" />
              Download the certificate
            </a>
          </div>

          {canExtend ? (
            <p className="mt-4 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
              Cover ends in {unit.daysLeft} days. It can be extended by two years
              for £49 up until the expiry date — not afterwards.{' '}
              <a href="#" className="font-semibold text-primary underline-offset-2 hover:underline">
                Extend this unit
              </a>
            </p>
          ) : null}

          {!active ? (
            <p className="mt-4 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
              Out-of-warranty repairs are quoted before any work starts, and the
              quote is free.{' '}
              <a href="#" className="font-semibold text-primary underline-offset-2 hover:underline">
                Request a repair quote
              </a>
            </p>
          ) : null}
        </div>

        {/* Equal weight, deliberately. */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 rounded-xl border border-border bg-card p-4">
            <h3 data-stress-ignore className="text-sm font-semibold">Covered</h3>
            <ul className="mt-3 space-y-2">
              {covered.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <CircleCheck
                    aria-hidden
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  />
                  <span className="min-w-0 flex-1 break-words">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 rounded-xl border border-border bg-card p-4">
            <h3 data-stress-ignore className="text-sm font-semibold">Not covered</h3>
            <ul className="mt-3 space-y-2">
              {excluded.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <CircleX aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 break-words">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          This warranty is in addition to your statutory rights, which it does
          not affect. Nothing on this page shortens them.
        </p>
      </div>
    </section>
  )
}
