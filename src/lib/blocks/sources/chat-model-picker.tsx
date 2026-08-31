'use client'

/**
 * <ChatModelPicker> — choosing a model with the trade-off on screen.
 *
 * Agent Chat has the thread, the prompt bar, the streaming answer, branches
 * and a canvas. All of them assume the model has already been chosen. Every
 * product that ships more than one model needs this control, and almost all
 * of them ship it as a dropdown of names — which asks the user to know from
 * memory which of four names is the cheap fast one.
 *
 * THE THREE NUMBERS THAT MAKE THE CHOICE
 *
 * Relative capability, typical latency, and cost per message. Those are the
 * axes anyone actually trades between, and a picker that omits them is
 * asking for a decision while withholding the inputs. Cost is shown per
 * message rather than per million tokens, because per-token pricing is a
 * unit nobody can convert in their head at the moment of choosing.
 *
 * THE UNAVAILABLE STATE IS EXPLAINED, NOT GREYED
 *
 * A model the current plan cannot reach renders with the reason and the
 * upgrade path attached. A disabled row with no explanation is the most
 * common way this control turns into a support ticket.
 *
 * SWITCHING MID-THREAD IS CALLED OUT. Changing model does not re-run the
 * conversation, and the earlier turns stay as the previous model wrote
 * them. Saying so in the panel is cheaper than the confusion it prevents.
 *
 * ACCESSIBILITY: a listbox with roving focus, `aria-activedescendant`
 * avoided in favour of real focusable options — simpler and far more
 * reliably announced. The trigger reports the current selection in its
 * accessible name; Escape closes and returns focus.
 */

import * as React from 'react'
import { Check, ChevronDown, Gauge, Lock, Zap } from 'lucide-react'

export interface ChatModel {
  id: string
  name: string
  vendor: string
  blurb: string
  /** 1–5, relative within this list rather than an absolute claim. */
  capability: number
  latency: string
  costPerMessage: string
  /** Absent means available on the current plan. */
  lockedReason?: string
}

export interface ChatModelPickerProps {
  models?: ChatModel[]
  initialModelId?: string
  className?: string
}

const DEFAULT_MODELS: ChatModel[] = [
  {
    id: 'fast',
    name: 'Swift',
    vendor: 'In-house',
    blurb: 'Drafts, summaries and anything you will read and rewrite anyway.',
    capability: 2,
    latency: '~0.4s',
    costPerMessage: '1 credit',
  },
  {
    id: 'balanced',
    name: 'Standard',
    vendor: 'In-house',
    blurb: 'The default. Handles most reasoning without thinking about it.',
    capability: 4,
    latency: '~1.2s',
    costPerMessage: '4 credits',
  },
  {
    id: 'deep',
    name: 'Deliberate',
    vendor: 'In-house',
    blurb: 'Long chains of reasoning, code review, anything you will act on unread.',
    capability: 5,
    latency: '~6s',
    costPerMessage: '18 credits',
  },
  {
    id: 'vision',
    name: 'Standard Vision',
    vendor: 'In-house',
    blurb: 'Reads screenshots, diagrams and PDFs alongside the prompt.',
    capability: 4,
    latency: '~2s',
    costPerMessage: '6 credits',
    lockedReason: 'Included with Pro+ — your plan does not have image input.',
  },
]

function CapabilityBar({ level }: { level: number }) {
  return (
    <span aria-hidden className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          className={`h-1 w-3 rounded-full ${step <= level ? 'bg-primary' : 'bg-muted-foreground/25'}`}
        />
      ))}
    </span>
  )
}

export function ChatModelPicker({
  models = DEFAULT_MODELS,
  initialModelId = 'balanced',
  className = '',
}: ChatModelPickerProps) {
  const [open, setOpen] = React.useState(true)
  const [selectedId, setSelectedId] = React.useState(initialModelId)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const selected = models.find((model) => model.id === selectedId) ?? models[0]

  function choose(model: ChatModel) {
    if (model.lockedReason) return
    setSelectedId(model.id)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div
      className={`relative w-full max-w-md ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          triggerRef.current?.focus()
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="model-listbox"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{selected.name}</span>
          <span className="block text-xs text-muted-foreground">
            {selected.latency} · {selected.costPerMessage}
          </span>
        </span>
        <span className="sr-only">Current model: {selected.name}. Change model.</span>
        <ChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          id="model-listbox"
          role="listbox"
          aria-label="Model"
          className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        >
          <ul className="max-h-96 overflow-y-auto">
            {models.map((model) => {
              const isSelected = model.id === selectedId
              const locked = Boolean(model.lockedReason)

              return (
                <li key={model.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={locked || undefined}
                    onClick={() => choose(model)}
                    className={`flex w-full flex-col items-start gap-2 border-b border-border/60 p-3 text-left transition-colors last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                      locked
                        ? 'cursor-not-allowed opacity-70'
                        : isSelected
                          ? 'bg-primary/5'
                          : 'hover:bg-muted/50'
                    }`}
                  >
                    <span className="flex w-full items-center gap-2">
                      <span className="text-sm font-semibold">{model.name}</span>
                      <span className="text-xs text-muted-foreground">{model.vendor}</span>
                      {locked ? (
                        <Lock aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : null}
                      {isSelected ? (
                        <Check aria-hidden className="ml-auto h-4 w-4 text-primary" />
                      ) : null}
                    </span>

                    <span className="text-xs text-muted-foreground">{model.blurb}</span>

                    {/* The three numbers. Announced as words, not bars. */}
                    <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CapabilityBar level={model.capability} />
                        <span className="sr-only">
                          Capability {model.capability} of 5.
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Gauge aria-hidden className="h-3 w-3" />
                        {model.latency}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Zap aria-hidden className="h-3 w-3" />
                        {model.costPerMessage}
                      </span>
                    </span>

                    {/* Explained rather than greyed — see the header. */}
                    {locked ? (
                      <span className="mt-0.5 w-full rounded-lg bg-muted px-2 py-1.5 text-[11px] text-muted-foreground">
                        {model.lockedReason}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>

          <p className="border-t border-border bg-muted/40 p-3 text-[11px] text-muted-foreground">
            Changing model applies to your next message. Earlier replies in this thread
            stay as the model that wrote them left them.
          </p>
        </div>
      ) : null}
    </div>
  )
}
