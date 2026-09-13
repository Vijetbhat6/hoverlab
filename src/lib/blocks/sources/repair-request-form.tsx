'use client'

/**
 * <RepairRequestForm> — booking a repair, where the quote comes first.
 *
 * A repair is not a return. The customer wants to keep the thing; they want it
 * working. That single difference changes the whole form, and most products
 * get it wrong by reusing the returns flow with the word swapped.
 *
 * WHAT CHANGES BECAUSE IT IS A REPAIR
 *
 *  - **The fault matters more than the product.** A guided symptom picker
 *    beats a free-text box: it routes the job to the right bench, decides
 *    whether the unit has to travel at all, and produces an estimate. Free
 *    text produces a phone call.
 *  - **There are three service routes, not one.** On-site, send-in, and
 *    self-service with a posted part. Which are available depends on the
 *    symptom, so the routes are filtered by it rather than offered blindly and
 *    refused later.
 *  - **The estimate is shown before submission, with its uncertainty.** A
 *    range and an explicit "quoted before any work starts". A repair form that
 *    submits into silence is a repair the customer chases twice.
 *
 * WARRANTY STATUS IS RESOLVED IN THE FORM, NOT AFTER IT
 *
 * The same serial number that identifies the unit decides whether the customer
 * pays. Showing that at the point of choosing — covered, so £0; lapsed, so a
 * range — is the difference between an informed booking and a surprise
 * invoice. It pairs with `warranty-coverage-panel`, which is the read view of
 * the same fact.
 *
 * ACCESSIBILITY: the symptom picker is a radio group whose options carry their
 * consequence in text, not just in a badge; the estimate is a polite live
 * region because it changes as choices are made; the date input has a real
 * `min` so a past date cannot be submitted and then rejected server-side.
 */

import * as React from 'react'
import { Banknote, CircleAlert, Home, Package, ShieldCheck, Wrench } from 'lucide-react'

export interface Symptom {
  id: string
  label: string
  detail: string
  /** Routes this symptom can be served by. */
  routes: string[]
  estimateLow: number
  estimateHigh: number
}

export interface ServiceRoute {
  id: string
  label: string
  note: string
  icon: typeof Home
}

export interface RepairRequestFormProps {
  productName?: string
  serial?: string
  underWarranty?: boolean
  symptoms?: Symptom[]
  routes?: ServiceRoute[]
  currency?: string
  className?: string
}

const DEFAULT_SYMPTOMS: Symptom[] = [
  {
    id: 'motor',
    label: 'Desk will not raise or lower',
    detail: 'Handset lights up but nothing moves, or it moves and stops.',
    routes: ['onsite', 'part'],
    estimateLow: 0,
    estimateHigh: 180,
  },
  {
    id: 'wobble',
    label: 'Frame wobbles or is uneven',
    detail: 'Usually a levelling foot or a loose crossbar, not a fault in the legs.',
    routes: ['onsite', 'self'],
    estimateLow: 0,
    estimateHigh: 60,
  },
  {
    id: 'handset',
    label: 'Handset or display is dead',
    detail: 'A part swap. The unit does not need to travel.',
    routes: ['part', 'self'],
    estimateLow: 0,
    estimateHigh: 45,
  },
  {
    id: 'surface',
    label: 'Desktop surface is damaged',
    detail: 'Splitting, delamination or a lifting edge. Needs an inspection.',
    routes: ['onsite', 'sendin'],
    estimateLow: 90,
    estimateHigh: 340,
  },
]

const DEFAULT_ROUTES: ServiceRoute[] = [
  { id: 'onsite', label: 'Engineer visits', note: '5–9 working days · half-day window', icon: Home },
  { id: 'sendin', label: 'Send it in', note: '10–14 working days · we collect', icon: Package },
  { id: 'part', label: 'We post the part', note: '2–3 working days · you fit it', icon: Wrench },
  { id: 'self', label: 'Guided self-service', note: 'Same day · instructions and a video call', icon: ShieldCheck },
]

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring'

export function RepairRequestForm({
  productName = 'Kestrel sit-stand desk',
  serial = 'KS-2291-8840',
  underWarranty = true,
  symptoms = DEFAULT_SYMPTOMS,
  routes = DEFAULT_ROUTES,
  currency = '£',
  className = '',
}: RepairRequestFormProps) {
  const uid = React.useId()
  const [symptomId, setSymptomId] = React.useState(symptoms[0]?.id ?? '')
  const [routeId, setRouteId] = React.useState('')

  const symptom = symptoms.find((s) => s.id === symptomId)
  // Routes are filtered by the symptom rather than offered and then refused.
  const available = routes.filter((route) => symptom?.routes.includes(route.id))

  // A route the new symptom does not offer must not stay selected. Derived
  // rather than reset in an effect: the effect would have to depend on a
  // freshly built array and would run on every render to do nothing.
  const chosenRoute = available.some((r) => r.id === routeId) ? routeId : ''

  const cost = underWarranty
    ? 'No charge — this unit is under warranty'
    : symptom
      ? symptom.estimateLow === symptom.estimateHigh
        ? `${currency}${symptom.estimateHigh}`
        : `${currency}${symptom.estimateLow}–${currency}${symptom.estimateHigh}`
      : '—'

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <form className="mx-auto max-w-3xl" onSubmit={(e) => e.preventDefault()}>
        <h2 className="text-xl font-bold tracking-tight">Book a repair</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {productName} · serial <span className="font-mono text-xs">{serial}</span>
        </p>

        {/* Resolved here, not after submission. */}
        <p
          className={`mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
            underWarranty
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {underWarranty ? (
            <ShieldCheck aria-hidden className="h-4 w-4" />
          ) : (
            <CircleAlert aria-hidden className="h-4 w-4" />
          )}
          {underWarranty
            ? 'Under warranty until 12 March 2027 — parts and labour included'
            : 'Out of warranty since 19 January 2025 — chargeable, quoted first'}
        </p>

        <fieldset className="mt-6 border-0 p-0">
          <legend className="text-sm font-semibold">What is wrong with it?</legend>
          <div className="mt-3 space-y-2">
            {symptoms.map((option) => {
              const id = `${uid}-s-${option.id}`
              const on = symptomId === option.id
              return (
                <div key={option.id}>
                  <input
                    type="radio"
                    id={id}
                    name={`${uid}-symptom`}
                    checked={on}
                    onChange={() => setSymptomId(option.id)}
                    className="peer sr-only"
                  />
                  <label
                    htmlFor={id}
                    className={`block cursor-pointer rounded-xl border p-3 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
                      on ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/60'
                    }`}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {option.detail}
                    </span>
                  </label>
                </div>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="mt-6 border-0 p-0">
          <legend className="text-sm font-semibold">
            How should we do it?
            <span className="ms-2 text-xs font-normal text-muted-foreground">
              {available.length} of {routes.length} routes suit this fault
            </span>
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {available.map((route) => {
              const Icon = route.icon
              const id = `${uid}-r-${route.id}`
              const on = chosenRoute === route.id
              return (
                <div key={route.id}>
                  <input
                    type="radio"
                    id={id}
                    name={`${uid}-route`}
                    checked={on}
                    onChange={() => setRouteId(route.id)}
                    className="peer sr-only"
                  />
                  <label
                    htmlFor={id}
                    className={`block h-full cursor-pointer rounded-xl border p-3 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
                      on ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/60'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <Icon aria-hidden className="h-4 w-4" />
                      {route.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {route.note}
                    </span>
                  </label>
                </div>
              )
            })}
          </div>
        </fieldset>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-from`} className="block text-sm font-medium">
              Earliest date that suits you
            </label>
            <input
              id={`${uid}-from`}
              type="date"
              // A past date cannot be submitted and then refused server-side.
              min="2026-09-14"
              defaultValue="2026-09-21"
              className={`mt-1.5 ${INPUT_CLASS}`}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-phone`} className="block text-sm font-medium">
              Phone for the engineer
            </label>
            <input
              id={`${uid}-phone`}
              type="tel"
              autoComplete="tel"
              placeholder="+31 6 1234 5678"
              className={`mt-1.5 ${INPUT_CLASS}`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={`${uid}-detail`} className="block text-sm font-medium">
              Anything the picker did not cover
              <span className="ms-2 text-xs font-normal text-muted-foreground">Optional</span>
            </label>
            <textarea
              id={`${uid}-detail`}
              rows={3}
              placeholder="It only fails going down, and only past about 90 cm."
              className={`mt-1.5 ${INPUT_CLASS}`}
            />
          </div>
        </div>

        <div
          aria-live="polite"
          className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
        >
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Banknote aria-hidden className="h-4 w-4 text-primary" />
              Estimate: {cost}
            </p>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              An estimate, not a quote. Nothing is charged until an engineer has
              seen the fault and you have accepted a figure in writing.
            </p>
          </div>
          <button
            type="submit"
            disabled={!chosenRoute}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            Request the repair
          </button>
        </div>
      </form>
    </section>
  )
}
