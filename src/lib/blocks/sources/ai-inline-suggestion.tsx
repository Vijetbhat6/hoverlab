/**
 * <AiInlineSuggestion> — ghost-text completion inside a real field: the
 * model proposes the rest of the sentence, Tab accepts, Escape refuses.
 *
 * Copilot-style completion done as a plain textarea rather than an editor
 * framework. The technique is a two-layer overlay: a transparent-caret
 * textarea on top of a mirror div that renders the typed text plus the
 * suggestion in muted grey. Both layers must share every text metric —
 * font, size, leading, padding, wrapping — or the ghost drifts out of
 * alignment with the caret by a few pixels per line, which is worse than
 * not having it. That is why the metrics live in one constant used by both.
 *
 * Interaction rules that make it tolerable rather than infuriating:
 *
 *  - Tab accepts, Escape dismisses, and any other keystroke invalidates the
 *    suggestion. A completion that survives the next character is one the
 *    user has to fight.
 *  - A dismissed suggestion does not come back for the same prefix. Without
 *    that, Escape means "show it again in 400ms".
 *  - Nothing is proposed mid-word or while the field is empty.
 *  - The hint is announced through `role="status"` — a sighted user sees
 *    grey text, and everyone else is told a completion is available and how
 *    to take it. Ghost text with no announcement is invisible to a screen
 *    reader, which is the accessibility failure this pattern is known for.
 */

'use client'

import * as React from 'react'
import { CornerDownLeft, Sparkles } from 'lucide-react'

export interface SuggestionRule {
  /** Lowercased prefix the draft must end with. */
  when: string
  /** The completion offered, appended verbatim. */
  then: string
}

export interface AiInlineSuggestionProps {
  label?: string
  placeholder?: string
  /** Starting draft, so the block demonstrates itself. */
  defaultValue?: string
  rules?: SuggestionRule[]
  /** Milliseconds of quiet before a completion is offered. */
  delay?: number
  className?: string
}

/**
 * Shared text metrics.
 *
 * The mirror and the textarea must agree on every one of these or the ghost
 * text stops lining up with the caret.
 */
const METRICS =
  'w-full whitespace-pre-wrap break-words px-3.5 py-3 text-sm leading-relaxed font-sans'

const DEFAULT_RULES: SuggestionRule[] = [
  { when: 'thanks for flagging', then: ' this — I have raised it with the team and will follow up by Friday.' },
  { when: 'the renewal', then: ' conversation should start ninety days out, not thirty.' },
  { when: 'i wanted to', then: ' follow up on the pricing question from our call last week.' },
  { when: 'hi', then: ' there — quick update on where the migration stands.' },
]

export function AiInlineSuggestion({
  label = 'Reply',
  placeholder = 'Start typing — a completion appears after a moment…',
  defaultValue = 'Thanks for flagging',
  rules = DEFAULT_RULES,
  delay = 400,
  className = '',
}: AiInlineSuggestionProps) {
  const [value, setValue] = React.useState(defaultValue)
  const [suggestion, setSuggestion] = React.useState('')
  /** Prefixes the user has already refused, so Escape sticks. */
  const [refused, setRefused] = React.useState<string[]>([])
  const fieldRef = React.useRef<HTMLTextAreaElement>(null)
  const fieldId = React.useId()

  React.useEffect(() => {
    setSuggestion('')

    const draft = value.trimEnd()
    // Nothing mid-word, nothing on an empty field, nothing already refused.
    if (draft.length === 0 || draft !== value) return
    if (refused.includes(draft.toLowerCase())) return

    const id = window.setTimeout(() => {
      const lower = draft.toLowerCase()
      const rule = rules.find((r) => lower.endsWith(r.when))
      if (rule) setSuggestion(rule.then)
    }, delay)

    return () => window.clearTimeout(id)
  }, [value, rules, delay, refused])

  function accept() {
    if (!suggestion) return
    const next = value + suggestion
    setValue(next)
    setSuggestion('')
    requestAnimationFrame(() => {
      const el = fieldRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(next.length, next.length)
    })
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!suggestion) return

    if (event.key === 'Tab') {
      event.preventDefault()
      accept()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setRefused((list) => [...list, value.trimEnd().toLowerCase()])
      setSuggestion('')
    }
  }

  return (
    <div className={`mx-auto w-full max-w-xl p-6 ${className}`}>
      <label htmlFor={fieldId} className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <div className="relative rounded-2xl border border-border/60 bg-card focus-within:ring-2 focus-within:ring-ring">
        {/*
          The mirror. `aria-hidden` because its text duplicates the field's
          value, and a screen reader must not read the draft twice.
          `pointer-events-none` so clicks reach the textarea beneath.
        */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${METRICS} text-transparent`}
        >
          {value}
          {suggestion ? <span className="text-muted-foreground/60">{suggestion}</span> : null}
        </div>

        <textarea
          ref={fieldRef}
          id={fieldId}
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          // Autocomplete off: a browser dropdown over ghost text is two
          // competing suggestions in the same place.
          autoComplete="off"
          spellCheck
          aria-describedby={suggestion ? `${fieldId}-hint` : undefined}
          className={`relative resize-none bg-transparent outline-none placeholder:text-muted-foreground ${METRICS}`}
        />
      </div>

      {/* The announcement ghost text otherwise lacks entirely. */}
      <p
        id={`${fieldId}-hint`}
        role="status"
        className="mt-2 flex min-h-5 items-center gap-2 text-xs text-muted-foreground"
      >
        {suggestion ? (
          <>
            <Sparkles aria-hidden className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Suggestion available — press{' '}
              <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono">
                Tab
              </kbd>{' '}
              to accept,{' '}
              <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono">
                Esc
              </kbd>{' '}
              to dismiss
            </span>
          </>
        ) : (
          <>
            <CornerDownLeft aria-hidden className="h-3.5 w-3.5 shrink-0" />
            Keep typing — completions appear after a short pause.
          </>
        )}
      </p>

      {suggestion ? (
        <button
          type="button"
          onClick={accept}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Sparkles aria-hidden className="h-3.5 w-3.5" />
          Accept suggestion
        </button>
      ) : null}
    </div>
  )
}
