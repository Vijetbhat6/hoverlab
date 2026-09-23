'use client'

/**
 * <PromptSuggestions> — the starters that fill an empty thread.
 *
 * The blank conversation is the highest-leverage screen in an assistant and
 * usually ships as a centred logo. A visitor who does not know what the
 * thing can be asked asks nothing, so this is the control that answers
 * "what do I type" — and it is the reusable half of the catalog's
 * `<ChatEmptyState>` block, which is the whole screen with headings and a
 * capability strip around it.
 *
 * **A real `<ul>` of real `<button>`s.** The overwhelmingly common shape is
 * a grid of `<div>`s with click handlers, which cannot be reached by
 * keyboard at all and gives a screen reader no indication that there are
 * four of anything. A list announces "list, 4 items" and can be skipped in
 * one keystroke by someone who does not want them.
 *
 * **The heading owns the list.** `aria-labelledby` ties the two together,
 * because "list, 4 items" with no subject is barely better than silence.
 *
 * **The accessible name is the prompt, not the label.** A tile reading
 * "Summarise this…" is a truncation; what gets sent is a full sentence.
 * Where they differ, the button is named for what it will actually do — the
 * visible text stays short, and nobody clicks a thing whose name was cut
 * off mid-word.
 *
 * **`type="button"`, explicitly.** These sit next to a composer, and a
 * bare `<button>` inside a `<form>` defaults to `submit` — which would send
 * the empty prompt instead of filling it.
 */

import * as React from 'react'

export interface PromptSuggestion {
  /** Falls back to `label` when absent. */
  id?: string
  /** The short text on the tile. */
  label: string
  /** A second line of context. Optional. */
  description?: string
  /** Any node — an emoji, an icon, an avatar. Decorative, so it is hidden. */
  icon?: React.ReactNode
  /** What actually gets sent, when it differs from the label. */
  prompt?: string
}

export interface PromptSuggestionsProps {
  suggestions: PromptSuggestion[]
  /** Rendered above the list and used as its accessible name. */
  heading?: string
  /** Receives the full prompt — `prompt ?? label`. */
  onSelect?: (prompt: string, suggestion: PromptSuggestion) => void
  columns?: 1 | 2
  className?: string
}

export function PromptSuggestions({
  suggestions,
  heading = 'Try one of these',
  onSelect,
  columns = 2,
  className = '',
}: PromptSuggestionsProps) {
  const uid = React.useId()

  return (
    <div className={['w-full', className].filter(Boolean).join(' ')}>
      {heading ? (
        <h3
          id={`${uid}-heading`}
          data-stress-ignore
          className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          {heading}
        </h3>
      ) : null}

      <ul
        aria-labelledby={heading ? `${uid}-heading` : undefined}
        className={[
          'grid gap-2',
          columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1',
        ].join(' ')}
      >
        {suggestions.map((suggestion) => {
          const prompt = suggestion.prompt ?? suggestion.label
          const named = prompt !== suggestion.label

          return (
            <li key={suggestion.id ?? suggestion.label}>
              <button
                type="button"
                onClick={() => onSelect?.(prompt, suggestion)}
                aria-label={named ? prompt : undefined}
                className="flex h-full w-full items-start gap-2.5 rounded-xl border border-border bg-card p-3 text-start transition-colors hover:border-primary/40 hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {suggestion.icon ? (
                  <span aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground">
                    {suggestion.icon}
                  </span>
                ) : null}
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {suggestion.label}
                  </span>
                  {suggestion.description ? (
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {suggestion.description}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
