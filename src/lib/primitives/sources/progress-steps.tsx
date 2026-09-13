/**
 * <ProgressSteps> — where you are in something that has an order.
 *
 * The markup is the interesting part. A stepper is a list of steps, in
 * order, so it is an `<ol>` inside a `<nav>` — not a row of divs. That one
 * choice gives screen-reader users the count ("list, 4 items") and the
 * position for free, and `aria-current="step"` names the one you are on.
 * Everything built from divs has to reconstruct all of that with labels,
 * and usually reconstructs none of it.
 *
 * The connector between steps is a sibling element rather than a border on
 * the step, because it has to be half-coloured: the line leaving a
 * completed step is done, the line entering the current one is not. A
 * border cannot be two colours and a gradient cannot animate cleanly
 * between them.
 *
 * The vertical orientation is not a variant of the horizontal one so much
 * as the only usable form on a phone — four labelled steps across a 390px
 * screen leaves about 80px per label, which is one word. Both are here for
 * that reason, not for variety.
 */

import * as React from 'react'
import { Check } from 'lucide-react'

export interface Step {
  label: string
  /** One line under the label. Dropped on the horizontal layout when tight. */
  description?: string
}

export interface ProgressStepsProps {
  steps: Step[]
  /** Index of the step in progress. Everything before it is complete. */
  current: number
  orientation?: 'horizontal' | 'vertical'
  /** Names the sequence: "Checkout", "Onboarding". */
  label: string
  className?: string
}

export function ProgressSteps({
  steps,
  current,
  orientation = 'horizontal',
  label,
  className = '',
}: ProgressStepsProps) {
  const vertical = orientation === 'vertical'

  return (
    <nav aria-label={label} className={className}>
      <ol className={vertical ? 'flex flex-col' : 'flex items-start'}>
        {steps.map((step, i) => {
          const done = i < current
          const active = i === current
          const last = i === steps.length - 1

          const marker = (
            <span
              className={[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                'text-xs font-semibold transition-colors',
                done
                  ? 'border-primary bg-primary text-primary-foreground'
                  : active
                    ? 'border-primary bg-background text-primary'
                    : 'border-border bg-background text-muted-foreground',
              ].join(' ')}
            >
              {done ? (
                <>
                  {/* The tick is the only thing marking a step done
                      visually; without the label beside it the state
                      would be carried by colour alone. */}
                  <span className="sr-only">Completed</span>
                  <Check className="h-4 w-4" aria-hidden />
                </>
              ) : (
                i + 1
              )}
            </span>
          )

          const text = (
            <>
              <p
                className={`text-sm font-medium ${active || done ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {step.label}
              </p>
              {step.description ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
              ) : null}
            </>
          )

          if (vertical) {
            return (
              <li
                key={step.label}
                aria-current={active ? 'step' : undefined}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  {marker}
                  {last ? null : (
                    <span
                      aria-hidden
                      className={`my-1 w-0.5 flex-1 rounded-full ${done ? 'bg-primary' : 'bg-border'}`}
                    />
                  )}
                </div>
                <div className={last ? 'pt-1.5' : 'pb-6 pt-1.5'}>{text}</div>
              </li>
            )
          }

          return (
            <li
              key={step.label}
              aria-current={active ? 'step' : undefined}
              // The last step has no connector, so it must not claim a
              // share of the width — otherwise its label sits in the
              // middle of an empty quarter of the row.
              className={last ? 'flex flex-col' : 'flex flex-1 flex-col'}
            >
              <div className="flex items-center">
                {marker}
                {last ? null : (
                  <span
                    aria-hidden
                    className={`ms-2 h-0.5 flex-1 rounded-full ${done ? 'bg-primary' : 'bg-border'}`}
                  />
                )}
              </div>
              <div className="mt-2 pe-3">{text}</div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
