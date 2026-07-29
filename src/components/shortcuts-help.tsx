'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

/* ============================================================
 *  Global shortcuts help state
 *  A tiny event-based store so any component can open the dialog
 *  by calling useShortcutsHelp().open(), without prop drilling.
 * ========================================================== */

const OPEN_EVENT = 'cssfx:open-shortcuts-help'

interface ShortcutsHelpContextValue {
  open: () => void
}

function useShortcutsHelpInternal(): ShortcutsHelpContextValue {
  return React.useMemo(
    () => ({
      open: () => {
        if (typeof window === 'undefined') return
        window.dispatchEvent(new CustomEvent(OPEN_EVENT))
      },
    }),
    [],
  )
}

// Export under the name other files import.
export const useShortcutsHelp = useShortcutsHelpInternal

/* ============================================================
 *  Dialog component
 *  Listens for OPEN_EVENT and the '?' key, then shows the dialog.
 *  Mounted once at the app root (in page.tsx and effect/[slug]/page.tsx).
 * ========================================================== */

interface ShortcutEntry {
  keys: string[]
  description: string
  /** Where this shortcut works. */
  scope: 'Anywhere' | 'Home' | 'Detail' | 'Playground'
}

const SHORTCUTS: ShortcutEntry[] = [
  { keys: ['⌘', 'K'], description: 'Open the command palette (fuzzy search all effects)', scope: 'Anywhere' },
  { keys: ['?'], description: 'Show this help dialog', scope: 'Anywhere' },
  { keys: ['/'], description: 'Focus the search bar', scope: 'Home' },
  { keys: ['b'], description: 'Open / close your bundle', scope: 'Anywhere' },
  { keys: ['v'], description: 'Open / close compare (side-by-side preview)', scope: 'Anywhere' },
  { keys: ['j'], description: 'Next effect in catalog', scope: 'Detail' },
  { keys: ['k'], description: 'Previous effect in catalog', scope: 'Detail' },
  { keys: ['f'], description: 'Toggle favorite', scope: 'Detail' },
  { keys: ['s'], description: 'Add to / remove from bundle', scope: 'Detail' },
  { keys: ['c'], description: 'Copy current CSS to clipboard', scope: 'Detail' },
  { keys: ['Esc'], description: 'Close dialog / blur input', scope: 'Anywhere' },
]

export function ShortcutsHelpButton() {
  const [open, setOpen] = React.useState(false)

  // Listen for OPEN_EVENT (fired by useShortcutsHelp().open()) and the
  // '?' keypress (only when not typing in an input).
  React.useEffect(() => {
    function onOpenEvent() {
      setOpen(true)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key !== '?') return
      // Don't trigger when typing in an input/textarea.
      const t = e.target
      if (
        t instanceof HTMLElement &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT' ||
          t.isContentEditable)
      ) {
        return
      }
      e.preventDefault()
      setOpen(true)
    }
    window.addEventListener(OPEN_EVENT, onOpenEvent)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpenEvent)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b border-border/60 p-4 pb-3">
          <DialogTitle className="text-base">Keyboard shortcuts</DialogTitle>
          <DialogDescription className="text-xs">
            Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">?</kbd>{' '}
            anywhere to open this dialog.
          </DialogDescription>
        </DialogHeader>

        <div className="fx-no-scrollbar max-h-[60vh] overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {SHORTCUTS.map((s) => (
              <li
                key={s.description}
                className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm hover:bg-muted/40"
              >
                <span className="min-w-0 flex-1 text-foreground">
                  {s.description}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.scope}
                  </span>
                  <span className="flex items-center gap-0.5">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground shadow-sm"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border/60 p-3 text-center">
          <p className="text-[11px] text-muted-foreground">
            Shortcuts are ignored while you're typing in an input, textarea,
            or code editor.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
