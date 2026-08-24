'use client'

/**
 * <KeyboardShortcutsSheet> — the "?" overlay every keyboard-driven app owes
 * its users.
 *
 * A command palette teaches discovery; this teaches speed. Products ship
 * the first and skip the second, and the result is a set of shortcuts only
 * the team that built them knows about.
 *
 * The part worth copying is the key rendering, not the layout. Shortcuts
 * are written once, in one notation ("mod+k"), and rendered per platform:
 * `mod` is ⌘ on Apple and Ctrl everywhere else, and every product that
 * hardcodes one of the two is wrong for half its users. `alt` is ⌥ on a Mac
 * and Alt elsewhere for the same reason.
 *
 * Platform is detected after mount, never during render. Reading
 * `navigator` while rendering gives the server one string and the client
 * another, and React resolves that by discarding the server markup — for a
 * component whose whole job is to render fifteen key glyphs. The
 * non-Apple form renders first and corrects itself, because that is the
 * majority and the correction is invisible.
 */

import * as React from 'react'
import { X, Search } from 'lucide-react'

export interface Shortcut {
  /** Chord in canonical notation: "mod+k", "shift+alt+d", "g then i". */
  keys: string
  label: string
}

export interface ShortcutGroup {
  title: string
  shortcuts: Shortcut[]
}

export interface KeyboardShortcutsSheetProps {
  groups?: ShortcutGroup[]
  /** Controlled open state. Omit to let the sheet own it. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

const DEFAULT_GROUPS: ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: 'mod+k', label: 'Open the command palette' },
      { keys: '/', label: 'Focus search' },
      { keys: '?', label: 'Show this sheet' },
      { keys: 'esc', label: 'Close anything open' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: 'g then h', label: 'Go home' },
      { keys: 'g then i', label: 'Go to inbox' },
      { keys: 'g then s', label: 'Go to settings' },
      { keys: 'mod+[', label: 'Back' },
      { keys: 'mod+]', label: 'Forward' },
    ],
  },
  {
    title: 'Editing',
    shortcuts: [
      { keys: 'mod+s', label: 'Save' },
      { keys: 'mod+enter', label: 'Save and close' },
      { keys: 'mod+shift+d', label: 'Duplicate' },
      { keys: 'mod+backspace', label: 'Delete' },
    ],
  },
]

/** Canonical token → what to draw, given the platform. */
const GLYPHS: Record<string, { apple: string; other: string }> = {
  mod: { apple: '⌘', other: 'Ctrl' },
  alt: { apple: '⌥', other: 'Alt' },
  shift: { apple: '⇧', other: 'Shift' },
  enter: { apple: '↵', other: 'Enter' },
  backspace: { apple: '⌫', other: 'Backspace' },
  esc: { apple: 'Esc', other: 'Esc' },
  up: { apple: '↑', other: '↑' },
  down: { apple: '↓', other: '↓' },
}

/**
 * Split a chord into the pieces to render.
 *
 * "then" survives as a word rather than becoming a key, because `g then i`
 * is a sequence and drawing it as `G` `THEN` `I` implies three keys held at
 * once. Exported so a test can assert the notation without rendering.
 */
export function chordParts(keys: string): { token: string; isSeparator: boolean }[] {
  return keys
    .split(/(\s+then\s+|\+)/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      part === 'then' || part === '+'
        ? { token: part === '+' ? '' : 'then', isSeparator: true }
        : { token: part, isSeparator: false },
    )
    .filter((part) => !(part.isSeparator && !part.token))
}

function glyph(token: string, apple: boolean): string {
  const known = GLYPHS[token.toLowerCase()]
  if (known) return apple ? known.apple : known.other
  return token.length === 1 ? token.toUpperCase() : token
}

export function KeyboardShortcutsSheet({
  groups = DEFAULT_GROUPS,
  open,
  onOpenChange,
  className,
}: KeyboardShortcutsSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(true)
  const isOpen = open ?? internalOpen
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }

  // See the note at the top: platform after mount, never during render.
  const [apple, setApple] = React.useState(false)
  React.useEffect(() => {
    setApple(/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent))
  }, [])

  const [query, setQuery] = React.useState('')

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map((group) => ({
        ...group,
        shortcuts: group.shortcuts.filter(
          (s) => s.label.toLowerCase().includes(q) || s.keys.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.shortcuts.length > 0)
  }, [groups, query])

  if (!isOpen) return null

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl ${className ?? ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <header className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5">
        <h2 id="shortcuts-title" className="text-sm font-semibold tracking-tight">
          Keyboard shortcuts
        </h2>
        <div className="relative ml-auto">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter"
            aria-label="Filter shortcuts"
            className="h-8 w-36 rounded-lg border border-border bg-background pl-8 pr-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-48"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close shortcuts"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      </header>

      <div className="max-h-[26rem] overflow-y-auto px-5 py-4">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No shortcut matches &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {filtered.map((group) => (
              <section key={group.title}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.title}
                </h3>
                <dl className="space-y-1">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.keys}
                      className="flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 hover:bg-muted/50"
                    >
                      <dt className="text-sm">{shortcut.label}</dt>
                      <dd className="flex shrink-0 items-center gap-1">
                        {chordParts(shortcut.keys).map((part, i) =>
                          part.isSeparator ? (
                            <span
                              key={`${shortcut.keys}-sep-${i}`}
                              className="px-0.5 text-xs text-muted-foreground"
                            >
                              then
                            </span>
                          ) : (
                            <kbd
                              key={`${shortcut.keys}-${i}`}
                              className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md border border-border bg-muted px-1.5 font-mono text-[11px] font-medium"
                            >
                              {glyph(part.token, apple)}
                            </kbd>
                          ),
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
