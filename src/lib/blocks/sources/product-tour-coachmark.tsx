'use client'

/**
 * <ProductTourCoachmark> — a step of a guided tour, anchored to real UI.
 *
 * Onboarding had a checklist, a wizard and an invite step, all of which
 * take the user somewhere else to explain something. A coach mark is the
 * opposite move: it explains a control while pointing at that control, in
 * place, which is the only version of onboarding that survives contact
 * with an interface people are already looking at.
 *
 * WHAT MAKES A TOUR TOLERABLE
 *
 *   It is skippable from step one, with a control of the same weight as
 *   "next". A tour that has to be endured is remembered as an obstacle,
 *   and the feature it was explaining is remembered as the reason for it.
 *   Step counts are shown for the same reason: "2 of 4" is a promise about
 *   how long this will take, and people tolerate what they can see the end
 *   of.
 *
 *   It points at something. The spotlight cuts a hole in the dimmer over
 *   the real element rather than describing it — "the filter button in the
 *   top right" is a sentence the reader has to resolve, and half of them
 *   resolve it to the wrong control.
 *
 *   It is short. Four steps is a tour; eleven is a manual nobody asked
 *   for, delivered one sentence at a time.
 *
 * WHY THE DIMMER IS TWO ELEMENTS AND NOT A CLIP PATH
 *
 * The hole is a large spread shadow on the highlighted element — one box
 * paints everything outside it — rather than a `clip-path` with the cutout
 * computed in JS. The shadow moves with the element on resize with no
 * measurement code, and there is nothing to recompute when the layout
 * shifts under it.
 *
 * ACCESSIBILITY, WHICH TOURS ROUTINELY GET WRONG
 *
 * The card is a `role="dialog"` with `aria-modal`, labelled by its own
 * heading and described by its body, so a screen reader announces the step
 * rather than leaving a keyboard user inside an interface that has
 * silently gone non-interactive behind a dimmer. Focus moves to the card
 * on each step — otherwise "next" advances the visual tour while the
 * user's focus stays wherever it was, which is the bug that makes tours
 * unusable by keyboard.
 *
 * Escape ends the tour. A modal that traps without an exit is the thing
 * people close the tab over.
 */

import * as React from 'react'
import { ArrowRight, X } from 'lucide-react'

export interface TourStep {
  title: string
  body: string
  /** Which demo control this step points at. */
  target: 'filters' | 'search' | 'export' | 'invite'
}

export interface ProductTourCoachmarkProps {
  steps?: TourStep[]
  onFinish?: () => void
  onSkip?: () => void
  className?: string
}

const DEFAULT_STEPS: TourStep[] = [
  {
    title: 'Narrow the list first',
    body: 'Filters stack, and every one you apply stays visible as a chip above the results so you always know why you are seeing what you are seeing.',
    target: 'filters',
  },
  {
    title: 'Search inside the filter',
    body: 'Search runs against whatever the filters left, not the whole workspace. Clear the chips if you meant to search everything.',
    target: 'search',
  },
  {
    title: 'Take it with you',
    body: 'Export gives you exactly the rows on screen, in CSV or JSON. Scheduled exports live in Settings.',
    target: 'export',
  },
  {
    title: 'Bring someone in',
    body: 'Anyone you invite lands on this same view, with your filters shared but not applied. That is the whole tour.',
    target: 'invite',
  },
]

const TARGETS: { id: TourStep['target']; label: string }[] = [
  { id: 'filters', label: 'Filters' },
  { id: 'search', label: 'Search' },
  { id: 'export', label: 'Export' },
  { id: 'invite', label: 'Invite' },
]

export function ProductTourCoachmark({
  steps = DEFAULT_STEPS,
  onFinish,
  onSkip,
  className = '',
}: ProductTourCoachmarkProps) {
  const [index, setIndex] = React.useState(0)
  const [running, setRunning] = React.useState(true)
  const cardRef = React.useRef<HTMLDivElement>(null)

  const step = steps[index]
  const last = index === steps.length - 1

  /*
    Focus follows the step. Without this, "next" advances the tour visually
    while the keyboard user stays wherever they were — the single thing
    that makes a tour unusable without a mouse.
  */
  React.useEffect(() => {
    if (running) cardRef.current?.focus()
  }, [index, running])

  function end() {
    setRunning(false)
    onSkip?.()
  }

  if (!step) return null

  return (
    <section
      aria-label="Product tour"
      className={`mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      {/* The demo surface. In a real app this is your actual interface;
          nothing here belongs to the tour except the spotlight and card. */}
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-card"
        onKeyDown={(event) => {
          if (event.key === 'Escape') end()
        }}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          {TARGETS.map((target) => {
            const active = running && step.target === target.id
            return (
              <span
                key={target.id}
                className={`relative rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? // The hole: one spread shadow paints everything
                      // outside this element. No clip-path, no measuring.
                      'z-20 bg-background text-foreground shadow-[0_0_0_4px_var(--color-primary),0_0_0_9999px_color-mix(in_oklab,var(--background)_78%,transparent)]'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {target.label}
              </span>
            )
          })}
        </div>

        {/* Tall enough that the step card fits inside the frame. A real
            page has a whole screen to sit in; this demo has to reserve the
            room deliberately or the card is clipped by `overflow-hidden`. */}
        <div className="px-4 py-10 pb-56 text-sm text-muted-foreground sm:pb-40">
          <p className="max-w-prose">
            Rows of whatever this product shows sit here. The tour points at
            the controls above without moving the reader away from them.
          </p>
        </div>

        {running ? (
          <div
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-step-title"
            aria-describedby="tour-step-body"
            tabIndex={-1}
            className="absolute inset-x-4 bottom-4 z-30 rounded-xl border border-border bg-card p-4 shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inset-x-auto sm:right-4 sm:w-80"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id="tour-step-title" className="text-sm font-semibold text-foreground">
                {step.title}
              </h3>
              <button
                type="button"
                onClick={end}
                className="-m-1 rounded p-1 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden className="h-4 w-4" />
                <span className="sr-only">End the tour</span>
              </button>
            </div>

            <p id="tour-step-body" className="mt-1.5 text-sm text-muted-foreground">
              {step.body}
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              {/* A promise about how long this takes. */}
              <p className="text-xs text-muted-foreground">
                {index + 1} of {steps.length}
              </p>

              <div className="flex items-center gap-2">
                {/* Same weight as Next, not grey text. */}
                <button
                  type="button"
                  onClick={end}
                  className="inline-flex h-8 items-center rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (last) {
                      setRunning(false)
                      onFinish?.()
                    } else {
                      setIndex((i) => i + 1)
                    }
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {last ? 'Done' : 'Next'}
                  {last ? null : <ArrowRight aria-hidden className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {running ? null : (
        <button
          type="button"
          onClick={() => {
            setIndex(0)
            setRunning(true)
          }}
          className="mt-3 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Replay the tour
        </button>
      )}
    </section>
  )
}
