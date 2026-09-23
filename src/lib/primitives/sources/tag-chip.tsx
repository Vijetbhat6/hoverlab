'use client'

/**
 * <TagChip> and <TagInput> — removable tags, and the field that makes them.
 *
 * The chip's whole difficulty is the remove button. It is a button inside
 * another interactive element, which means:
 *
 *   - it needs its own accessible name, and "×" is not one. "Remove
 *     design" is, and it has to include the tag, because a screen reader
 *     user tabbing through eight chips otherwise hears "remove" eight
 *     times with no way to tell which is which
 *   - clicking it must not also trigger the chip, so the click stops
 *     propagating
 *   - after removing, focus has to go somewhere deliberate. It is on a
 *     button that no longer exists, and the browser's answer is to move it
 *     to `<body>` — which drops the keyboard user back to the top of the
 *     page. Focus moves to the next chip, or to the input.
 *
 * That last one is the reason this is a pair of components rather than a
 * chip on its own: only the container knows what the next chip is.
 */

import * as React from 'react'
import { X } from 'lucide-react'

export interface TagChipProps {
  label: string
  onRemove?: () => void
  tone?: 'neutral' | 'brand'
  size?: 'sm' | 'md'
  className?: string
}

export const TagChip = React.forwardRef<HTMLSpanElement, TagChipProps>(
  function TagChip({ label, onRemove, tone = 'neutral', size = 'md', className = '' }, ref) {
    return (
      <span
        ref={ref}
        className={[
          'inline-flex shrink-0 items-center gap-1 rounded-md border font-medium',
          size === 'sm' ? 'h-6 ps-2 text-xs' : 'h-7 ps-2.5 text-sm',
          onRemove ? 'pe-1' : size === 'sm' ? 'pe-2' : 'pe-2.5',
          tone === 'brand'
            ? 'border-primary/30 bg-primary/10 text-primary'
            : 'border-border bg-muted/60 text-foreground',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="max-w-[12rem] truncate">{label}</span>
        {onRemove ? (
          <button
            type="button"
            // The tag is in the name, so eight chips do not all announce
            // "remove".
            aria-label={`Remove ${label}`}
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        ) : null}
      </span>
    )
  },
)

export interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  max?: number
  label: string
  className?: string
}

export function TagInput({
  value,
  onChange,
  placeholder = 'Add a tag…',
  max,
  label,
  className = '',
}: TagInputProps) {
  const [draft, setDraft] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const chipRefs = React.useRef<(HTMLSpanElement | null)[]>([])

  const add = (raw: string) => {
    const tag = raw.trim().replace(/,$/, '')
    if (!tag || value.includes(tag)) return
    if (max !== undefined && value.length >= max) return
    onChange([...value, tag])
    setDraft('')
  }

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
    /*
     * Move focus deliberately. The button that was focused has just been
     * unmounted, and the browser's fallback is `<body>` — which sends a
     * keyboard user back to the top of the document. The next chip is the
     * closest thing to "where they were"; the input is the fallback when
     * the removed chip was the last one.
     */
    requestAnimationFrame(() => {
      const next = chipRefs.current[index] ?? chipRefs.current[index - 1]
      const button = next?.querySelector('button')
      if (button) button.focus()
      else inputRef.current?.focus()
    })
  }

  return (
    <div
      className={[
        'flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background p-1.5',
        'focus-within:ring-2 focus-within:ring-ring',
        className,
      ].join(' ')}
      // Clicking the gaps between chips focuses the input, which is what
      // the whole box looks like it should do.
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, i) => (
        <TagChip
          key={tag}
          ref={(el) => {
            chipRefs.current[i] = el
          }}
          label={tag}
          size="sm"
          onRemove={() => removeAt(i)}
        />
      ))}

      <input
        ref={inputRef}
        value={draft}
        aria-label={label}
        placeholder={value.length === 0 ? placeholder : ''}
        disabled={max !== undefined && value.length >= max}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add(draft)
          } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
            // Backspace in an empty field removes the last tag — the
            // behaviour every messaging app's recipient field has taught
            // people to expect.
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={() => add(draft)}
        className="h-6 min-w-[8rem] flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed border border-transparent"
      />
    </div>
  )
}
