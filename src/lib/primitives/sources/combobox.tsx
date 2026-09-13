'use client'

/**
 * <Combobox> — a select you can type into.
 *
 * A native `<select>` is the right control for five options and the wrong
 * one for five hundred: it cannot be filtered, cannot show two lines per
 * row, and on desktop opens a list nobody can style. Every app ends up
 * building this, and most build it without the keyboard contract, which is
 * the part that makes it a control rather than a div with a list under it.
 *
 * What the WAI-ARIA combobox pattern actually requires, and what is here:
 *
 *   Down/Up      move the active option, opening the list if closed
 *   Home/End     first and last option
 *   Enter        select the active option
 *   Escape       close; a second Escape clears the query
 *   Tab          close and commit, because Tab means "I am done here"
 *   blur         close without selecting
 *
 * The focus never leaves the input. Options are marked active with
 * `aria-activedescendant` rather than by focusing them — moving DOM focus
 * into the list is what breaks typing, and it is the single most common
 * defect in hand-built comboboxes.
 */

import * as React from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'

export interface ComboboxOption {
  value: string
  label: string
  /** Second line — an email under a name, a path under a file. */
  hint?: string
  disabled?: boolean
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string | null
  onChange?: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  /** Names the control for assistive tech. */
  label: string
  className?: string
}

export function Combobox({
  options,
  value = null,
  onChange,
  placeholder = 'Select…',
  emptyMessage = 'Nothing matches that.',
  disabled = false,
  label,
  className = '',
}: ComboboxProps) {
  const id = React.useId()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [active, setActive] = React.useState(0)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  const selected = options.find((o) => o.value === value) ?? null

  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || (o.hint ?? '').toLowerCase().includes(q),
    )
  }, [options, query])

  // Clamp rather than reset: filtering down to fewer options should not
  // send the highlight back to the top mid-typing if it is still in range.
  React.useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, matches.length - 1)))
  }, [matches.length])

  /* Keep the active option in view when the arrows walk past the fold. */
  React.useEffect(() => {
    if (!open) return
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  /* A click outside closes. Pointerdown, not click: a click that starts
     outside and ends inside should still close, and vice versa. */
  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const commit = (option: ComboboxOption) => {
    if (option.disabled) return
    onChange?.(option.value)
    setQuery('')
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const delta = e.key === 'ArrowDown' ? 1 : -1
      setActive((a) => (a + delta + matches.length) % Math.max(1, matches.length))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActive(Math.max(0, matches.length - 1))
    } else if (e.key === 'Enter') {
      if (!open) return
      e.preventDefault()
      const option = matches[active]
      if (option) commit(option)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      // Two meanings, in the order a user expects them: close the list,
      // then — if it was already closed — abandon what they typed.
      if (open) setOpen(false)
      else setQuery('')
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div
        className={[
          'flex items-center gap-2 rounded-lg border border-border bg-background px-3',
          'focus-within:ring-2 focus-within:ring-ring',
          disabled ? 'opacity-60' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-label={label}
          aria-activedescendant={open && matches[active] ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          disabled={disabled}
          value={open ? query : (selected?.label ?? '')}
          placeholder={selected ? selected.label : placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-9 w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>

      {open ? (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </li>
          ) : (
            matches.map((option, i) => {
              const isSelected = option.value === value
              return (
                <li
                  key={option.value}
                  id={`${id}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  // Pointerdown, not click: click fires after blur, and by
                  // then the list has closed and the option is gone.
                  onPointerDown={(e) => {
                    e.preventDefault()
                    commit(option)
                  }}
                  onPointerEnter={() => setActive(i)}
                  className={[
                    'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm',
                    option.disabled ? 'pointer-events-none opacity-50' : '',
                    i === active ? 'bg-muted text-foreground' : 'text-foreground',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Check
                    className={`h-4 w-4 shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.hint ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {option.hint}
                      </span>
                    ) : null}
                  </span>
                </li>
              )
            })
          )}
        </ul>
      ) : null}
    </div>
  )
}
