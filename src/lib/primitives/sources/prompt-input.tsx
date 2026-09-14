'use client'

/**
 * <PromptInput> — the composer, reduced to the part that is actually hard.
 *
 * A textarea with a send button takes five minutes. These four things take
 * the rest of the day, and this is all of them:
 *
 * **Enter must not send during IME composition.** Typing Japanese, Chinese
 * or Korean means typing romaji, seeing candidates, and pressing Enter to
 * commit the one you want. A composer that sends on Enter sends a
 * half-converted fragment and clears the box, and the bug is invisible to
 * anyone testing in English — which is everyone who ships it. The guard is
 * `event.nativeEvent.isComposing`, and it is one line that nothing will
 * ever remind you to write.
 *
 * **Submission goes through a real `<form>`.** The keydown handler calls
 * `requestSubmit()` rather than invoking the submit logic directly, so
 * there is exactly one submit path: the button, the Enter key, and the
 * mobile keyboard's own "go" all run the same code and the same validation.
 * Two paths is how a composer ends up sending empty strings from one of
 * them.
 *
 * **Stop is a different button from send.** The obvious implementation
 * relabels one button while streaming. To a screen reader user whose focus
 * is on it, the control they are sitting on silently becomes a different
 * control — and the one they meant to press has moved. Rendering them as
 * two buttons makes the swap a focus change, which is what it actually is.
 *
 * **Auto-grow is capped in rows, not pixels.** The cap has to survive the
 * user's font size, so it is measured from the element's own line-height
 * rather than assumed to be 24px.
 */

import * as React from 'react'
import { ArrowUp, Square } from 'lucide-react'

export interface PromptInputProps {
  /** Controlled value. Omit both this and `onValueChange` to run uncontrolled. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Called with the trimmed value. Never called with an empty string. */
  onSubmit?: (value: string) => void
  /** Swaps send for stop and blocks submission. */
  streaming?: boolean
  onStop?: () => void
  placeholder?: string
  disabled?: boolean
  minRows?: number
  maxRows?: number
  /** Attachment and model controls, rendered along the bottom edge. */
  toolbar?: React.ReactNode
  /** Shown under the field — a hint, a counter, an error. */
  footer?: React.ReactNode
  className?: string
}

export function PromptInput({
  value,
  defaultValue = '',
  onValueChange,
  onSubmit,
  streaming = false,
  onStop,
  placeholder = 'Ask anything…',
  disabled = false,
  minRows = 1,
  maxRows = 8,
  toolbar,
  footer,
  className = '',
}: PromptInputProps) {
  const uid = React.useId()
  const areaRef = React.useRef<HTMLTextAreaElement>(null)
  const formRef = React.useRef<HTMLFormElement>(null)
  const [internal, setInternal] = React.useState(defaultValue)

  const controlled = value !== undefined
  const text = controlled ? value : internal

  const setText = (next: string) => {
    if (!controlled) setInternal(next)
    onValueChange?.(next)
  }

  // Grow to fit, then stop. Resetting to `auto` first is what lets the box
  // shrink again when text is deleted; without it scrollHeight only ever
  // reports the tallest it has been.
  React.useEffect(() => {
    const el = areaRef.current
    if (!el) return
    el.style.height = 'auto'
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20
    const padding = el.offsetHeight - el.clientHeight
    el.style.height = `${Math.min(el.scrollHeight, lineHeight * maxRows + padding)}px`
  }, [text, maxRows])

  const canSend = text.trim().length > 0 && !disabled && !streaming

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSend) return
    onSubmit?.(text.trim())
    setText('')
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    // The line this component exists for. See the header.
    if (event.nativeEvent.isComposing) return
    event.preventDefault()
    formRef.current?.requestSubmit()
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={[
        'rounded-2xl border border-border bg-card p-2 shadow-sm',
        'focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20',
        disabled ? 'opacity-60' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <label htmlFor={`${uid}-field`} className="sr-only">
        {placeholder}
      </label>
      <textarea
        id={`${uid}-field`}
        ref={areaRef}
        rows={minRows}
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-describedby={footer ? `${uid}-footer` : undefined}
        className="block w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
      />

      <div className="flex items-end justify-between gap-2 pt-1">
        <div className="flex min-w-0 items-center gap-1">{toolbar}</div>

        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Square className="size-3.5 fill-current" aria-hidden="true" />
            <span className="sr-only">Stop generating</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
            <span className="sr-only">Send message</span>
          </button>
        )}
      </div>

      {footer ? (
        <p id={`${uid}-footer`} className="px-2 pb-1 pt-1.5 text-xs text-muted-foreground">
          {footer}
        </p>
      ) : null}
    </form>
  )
}
