'use client'

/**
 * <DropdownMenu> — a button that opens a list of actions.
 *
 * This is an ACTION menu, so it follows the menu keyboard model, which is not
 * the listbox one and not "a popover full of buttons":
 *
 *  - Down or Up on the closed trigger opens it and lands on the first or last
 *    item. Inside, Down/Up move (wrapping), Home/End jump, and typing a letter
 *    jumps to the next item starting with it.
 *  - Escape closes AND returns focus to the trigger. A menu that closes and
 *    leaves focus on `<body>` strands a keyboard user at the top of the page —
 *    the single most common menu bug, and one no mouse user will ever see.
 *  - Choosing an item closes the menu and returns focus the same way. Tab
 *    closes it and lets focus move on. A press outside closes it.
 *  - Items are `role="menuitem"` with `tabIndex={-1}`: the menu owns focus
 *    movement, so none of them is a tab stop. Disabled items are skipped
 *    rather than focusable-and-dead.
 *  - The list stays mounted, hidden by attribute, so the trigger's
 *    `aria-controls` always resolves.
 *
 * LIMITS, STATED: it opens below the trigger and does not flip near the
 * viewport edge, and it is not portalled, so an ancestor with
 * `overflow: hidden` will clip it. `align="end"` covers the common
 * right-edge case. If you need collision handling, this is the piece to swap
 * for a positioning library — the keyboard model above is what to keep.
 */

import * as React from 'react'

export type MenuEntry =
  | {
      type?: 'item'
      id: string
      label: string
      icon?: React.ReactNode
      /** Shown on the right as a hint; it does not bind the key. */
      shortcut?: string
      onSelect?: () => void
      /** Render as a link instead of a button. */
      href?: string
      disabled?: boolean
      danger?: boolean
    }
  | { type: 'separator' }
  | { type: 'label'; label: string }

export interface DropdownMenuProps {
  /** What the trigger button shows. */
  trigger: React.ReactNode
  /** Names the trigger when `trigger` is only an icon. */
  triggerLabel?: string
  items: MenuEntry[]
  /** Names the menu itself. */
  label: string
  align?: 'start' | 'end'
  /**
   * Start open — for documentation and screenshots. It does not move focus, so
   * a menu that is open on first paint never steals it from the page.
   */
  defaultOpen?: boolean
  className?: string
}

export function DropdownMenu({
  trigger,
  triggerLabel,
  items,
  label,
  align = 'start',
  defaultOpen = false,
  className = '',
}: DropdownMenuProps) {
  const uid = React.useId()
  const [open, setOpen] = React.useState(defaultOpen)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const focusables = () =>
    Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? [],
    )

  const openAt = (where: 'first' | 'last') => {
    setOpen(true)
    // The menu is unhidden by this render; focus once it is.
    requestAnimationFrame(() => {
      const list = focusables()
      ;(where === 'first' ? list[0] : list[list.length - 1])?.focus()
    })
  }

  const close = (returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const list = focusables()
    const at = list.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown') list[(at + 1) % list.length]?.focus()
    else if (e.key === 'ArrowUp') list[(at - 1 + list.length) % list.length]?.focus()
    else if (e.key === 'Home') list[0]?.focus()
    else if (e.key === 'End') list[list.length - 1]?.focus()
    else if (e.key === 'Escape') close(true)
    else if (e.key === 'Tab') return setOpen(false)
    else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const ch = e.key.toLowerCase()
      const ordered = [...list.slice(at + 1), ...list.slice(0, at + 1)]
      const hit = ordered.find((el) => el.textContent?.trim().toLowerCase().startsWith(ch))
      if (!hit) return
      hit.focus()
    } else return
    e.preventDefault()
  }

  return (
    <div ref={rootRef} className={`relative inline-block text-start ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${uid}-menu`}
        aria-label={triggerLabel}
        onClick={() => (open ? close(false) : openAt('first'))}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            openAt('first')
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            openAt('last')
          }
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {trigger}
      </button>

      <div
        ref={menuRef}
        id={`${uid}-menu`}
        role="menu"
        aria-label={label}
        hidden={!open}
        onKeyDown={onMenuKeyDown}
        className={`absolute top-full z-50 mt-1.5 min-w-52 rounded-xl border border-border bg-card p-1.5 shadow-xl ${
          align === 'end' ? 'end-0' : 'start-0'
        }`}
      >
        {items.map((entry, i) => {
          if (entry.type === 'separator') {
            return <div key={`sep-${i}`} role="separator" className="my-1 h-px bg-border" />
          }
          if (entry.type === 'label') {
            return (
              <p
                key={`label-${i}`}
                aria-hidden
                className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {entry.label}
              </p>
            )
          }
          const cls = `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm transition-colors focus-visible:outline-none ${
            entry.disabled
              ? 'cursor-not-allowed opacity-50'
              : entry.danger
                ? 'text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10'
                : 'hover:bg-muted focus-visible:bg-muted'
          }`
          const content = (
            <>
              {entry.icon ? <span aria-hidden className="shrink-0 text-muted-foreground">{entry.icon}</span> : null}
              <span className="flex-1 truncate">{entry.label}</span>
              {entry.shortcut ? (
                <kbd aria-hidden className="text-xs text-muted-foreground">
                  {entry.shortcut}
                </kbd>
              ) : null}
            </>
          )
          const choose = () => {
            entry.onSelect?.()
            close(true)
          }
          return entry.href && !entry.disabled ? (
            <a key={entry.id} role="menuitem" tabIndex={-1} href={entry.href} onClick={choose} className={cls}>
              {content}
            </a>
          ) : (
            <button
              key={entry.id}
              type="button"
              role="menuitem"
              tabIndex={-1}
              aria-disabled={entry.disabled || undefined}
              onClick={entry.disabled ? undefined : choose}
              className={cls}
            >
              {content}
            </button>
          )
        })}
      </div>
    </div>
  )
}
