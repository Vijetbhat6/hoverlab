'use client'

/**
 * <Kbd> — a keyboard shortcut, rendered for the keyboard it will be typed on.
 *
 * The reason this is a component and not a `<kbd>` tag with a border: the
 * shortcut is different on every platform, and hardcoding one is how a Mac
 * user reads "Ctrl K" next to a search box that does not answer Ctrl K.
 *
 * So a shortcut is written once, in the abstract — `"mod+k"` — and resolved
 * at render: `mod` is ⌘ on Apple platforms and Ctrl everywhere else, `alt`
 * is ⌥ or Alt, `shift` is ⇧ or Shift. Apple's own guidelines say the
 * symbols are shown without separators, which is why the Mac rendering
 * joins them and the Windows one uses a thin space.
 *
 * The platform is read after mount, not during render. `navigator` does not
 * exist on the server, and branching on it during the first client render
 * makes the markup disagree with what the server sent — React then throws
 * the whole tree away and rebuilds it. Rendering the non-Apple form first
 * and correcting it in an effect costs one paint and is always right.
 */

import * as React from 'react'

export interface KbdProps {
  /**
   * The shortcut, as `mod`, `alt`, `shift`, `ctrl`, `meta` and literal keys
   * joined by `+` — `"mod+shift+p"`. Also accepts a sequence: `"g then i"`.
   */
  keys: string
  size?: 'sm' | 'md'
  className?: string
}

const APPLE_SYMBOL: Record<string, string> = {
  mod: '⌘',
  meta: '⌘',
  ctrl: '⌃',
  alt: '⌥',
  shift: '⇧',
  enter: '↩',
  backspace: '⌫',
  delete: '⌦',
  escape: '⎋',
  tab: '⇥',
  space: '␣',
}

const OTHER_LABEL: Record<string, string> = {
  mod: 'Ctrl',
  meta: 'Win',
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
  enter: 'Enter',
  backspace: 'Backspace',
  delete: 'Del',
  escape: 'Esc',
  tab: 'Tab',
  space: 'Space',
}

/** True on macOS, iPadOS and iOS. */
function detectApple(): boolean {
  if (typeof navigator === 'undefined') return false
  // `navigator.platform` is deprecated but is the only thing that
  // distinguishes an iPad — which reports a Mac user-agent — reliably
  // enough for a cosmetic choice. Wrong here costs a wrong glyph.
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
}

export function Kbd({ keys, size = 'md', className = '' }: KbdProps) {
  const [apple, setApple] = React.useState(false)
  React.useEffect(() => setApple(detectApple()), [])

  const steps = keys.split(/\s+then\s+/i)

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      /*
       * The rendered form is symbols a screen reader cannot pronounce —
       * "⌘⇧P" is read as nothing useful. The abstract shortcut is the
       * label, spelled out, and the symbols are decoration.
       */
      aria-label={spoken(keys)}
      role="img"
    >
      {steps.map((step, s) => (
        <React.Fragment key={s}>
          {s > 0 ? <span className="text-xs text-muted-foreground">then</span> : null}
          <span aria-hidden className={apple ? 'inline-flex' : 'inline-flex gap-1'}>
            {step.split('+').map((raw, i) => {
              const key = raw.trim().toLowerCase()
              const label = apple
                ? (APPLE_SYMBOL[key] ?? raw.trim().toUpperCase())
                : (OTHER_LABEL[key] ?? raw.trim().toUpperCase())
              return (
                <kbd
                  key={i}
                  className={[
                    'inline-flex select-none items-center justify-center rounded border border-border',
                    'bg-muted/60 font-sans font-medium text-muted-foreground',
                    // The 1px bottom border is the whole "keycap" read. Not
                    // a shadow: a shadow under a chip inside a menu item
                    // smears against the highlight behind it.
                    'border-b-2',
                    size === 'sm'
                      ? 'h-5 min-w-5 px-1 text-[10px]'
                      : 'h-6 min-w-6 px-1.5 text-xs',
                    apple && i > 0 ? '-ms-px' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {label}
                </kbd>
              )
            })}
          </span>
        </React.Fragment>
      ))}
    </span>
  )
}

/** "mod+shift+p" → "Command Shift P", for the accessible name. */
function spoken(keys: string): string {
  return keys
    .split(/(\s+then\s+)/i)
    .map((part) =>
      /then/i.test(part)
        ? ' then '
        : part
            .split('+')
            .map((raw) => {
              const key = raw.trim().toLowerCase()
              if (key === 'mod' || key === 'meta') return 'Command'
              if (key === 'ctrl') return 'Control'
              if (key === 'alt') return 'Alt'
              if (key === 'shift') return 'Shift'
              return raw.trim().toUpperCase()
            })
            .join(' '),
    )
    .join('')
    .trim()
}
