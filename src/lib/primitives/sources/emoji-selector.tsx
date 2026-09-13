'use client'

/**
 * <EmojiSelector> — reactions on a message, and the picker that adds one.
 *
 * The control is the row of counts, not the picker. That is the part that
 * carries state, the part that is pressed most, and the part everyone gets
 * wrong: a reaction pill is a TOGGLE, so it is `aria-pressed`, and it has
 * to say whose reaction it is — "👍 3" tells you nothing about whether one
 * of those three is you, and pressing it is how you find out.
 *
 * So a pill you have reacted with is visually distinct AND announced as
 * pressed, and its accessible name spells out the emoji, which a screen
 * reader otherwise reads as "thumbs up sign" glued to a number.
 *
 * The picker is deliberately a short fixed set rather than a full emoji
 * keyboard. A complete picker is a search index, a skin-tone selector, a
 * category rail and about 40 KB of data — a different component, and one
 * whose absence nobody has ever complained about on a reaction row.
 */

import * as React from 'react'
import { SmilePlus } from 'lucide-react'

export interface Reaction {
  emoji: string
  count: number
  /** Whether the current user is one of the count. */
  reacted?: boolean
  /** Spoken instead of the glyph: "thumbs up". */
  name?: string
}

export interface EmojiSelectorProps {
  reactions: Reaction[]
  onToggle?: (emoji: string) => void
  /** Offered by the "add" button. Kept short on purpose. */
  choices?: string[]
  className?: string
}

const DEFAULT_CHOICES = ['👍', '🎉', '❤️', '🚀', '👀', '😄', '🤔', '✅']

/** Names for the default set, so the pills do not announce raw glyphs. */
const NAMES: Record<string, string> = {
  '👍': 'thumbs up',
  '🎉': 'celebrate',
  '❤️': 'heart',
  '🚀': 'rocket',
  '👀': 'eyes',
  '😄': 'smile',
  '🤔': 'thinking',
  '✅': 'done',
}

export function EmojiSelector({
  reactions,
  onToggle,
  choices = DEFAULT_CHOICES,
  className = '',
}: EmojiSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (emoji: string) => {
    onToggle?.(emoji)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={`relative inline-flex flex-wrap items-center gap-1 ${className}`}>
      {reactions.map((reaction) => {
        const name = reaction.name ?? NAMES[reaction.emoji] ?? 'reaction'
        return (
          <button
            key={reaction.emoji}
            type="button"
            // A toggle, not a button: the state is "have I reacted", and
            // `aria-pressed` is the only thing that conveys it.
            aria-pressed={reaction.reacted === true}
            aria-label={`${name}, ${reaction.count}`}
            onClick={() => onToggle?.(reaction.emoji)}
            className={[
              'inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs',
              'transition-colors focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ring',
              reaction.reacted
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/60',
            ].join(' ')}
          >
            <span aria-hidden className="text-sm leading-none">
              {reaction.emoji}
            </span>
            <span className="font-medium tabular-nums">{reaction.count}</span>
          </button>
        )
      })}

      <button
        type="button"
        aria-label="Add a reaction"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SmilePlus className="h-3.5 w-3.5" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Reactions"
          // `bottom-full` and `start-0`: above the row, aligned to the
          // reading start, so it never opens off the edge of a message
          // bubble at the end of a thread.
          className="absolute bottom-full start-0 z-50 mb-1 flex gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-lg"
        >
          {choices.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="menuitem"
              aria-label={NAMES[emoji] ?? emoji}
              onClick={() => pick(emoji)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-base transition-transform hover:scale-125 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
            >
              <span aria-hidden>{emoji}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
