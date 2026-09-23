'use client'

/**
 * <Alert> — an inline message that belongs to the page: info, success,
 * warning or error, with an optional action and an optional dismiss.
 *
 * WHY IT IS NOT A LIVE REGION BY DEFAULT
 *
 * The reflex is `role="alert"`, and it is wrong for most alerts. An `alert`
 * role interrupts whatever the screen reader is saying the moment it appears —
 * which is right when a save fails, and wrong for a "Your trial ends in 3
 * days" notice that is simply part of the page on load. So the default is no
 * role at all: a static alert is just content, in reading order.
 *
 * Pass `live` when the message APPEARS as a result of something the user did
 * or that happened while they were here. Then errors and warnings become
 * `role="alert"` (assertive) and info and success become `role="status"`
 * (polite), which is the distinction the two roles exist to make. The live
 * region has to be in the DOM before its text arrives to be announced, so for
 * a message that mounts with the alert, render `<Alert live>` from the start.
 *
 * Colour is never the only signal: every tone has its own icon and the title
 * carries the meaning in words. Text stays `foreground` on the tint, which
 * clears 4.5:1 in both themes; only the icon and the edge take the tone.
 */

import * as React from 'react'
import { Info, CircleCheck, TriangleAlert, CircleAlert, X } from 'lucide-react'

export type AlertTone = 'info' | 'success' | 'warning' | 'error'

export interface AlertAction {
  label: string
  onClick?: () => void
  href?: string
}

export interface AlertProps {
  tone?: AlertTone
  title?: string
  children?: React.ReactNode
  action?: AlertAction
  /** Renders a dismiss button and calls this when it is pressed. */
  onDismiss?: () => void
  /** True when the alert appears in response to something, so it is announced. */
  live?: boolean
  className?: string
}

const TONES: Record<
  AlertTone,
  { icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>; box: string; glyph: string }
> = {
  info: {
    icon: Info,
    box: 'border-sky-600/30 bg-sky-500/10',
    glyph: 'text-sky-700 dark:text-sky-400',
  },
  success: {
    icon: CircleCheck,
    box: 'border-emerald-600/30 bg-emerald-500/10',
    glyph: 'text-emerald-700 dark:text-emerald-400',
  },
  warning: {
    icon: TriangleAlert,
    box: 'border-amber-600/35 bg-amber-500/10',
    glyph: 'text-amber-700 dark:text-amber-400',
  },
  error: {
    icon: CircleAlert,
    box: 'border-destructive/35 bg-destructive/10',
    glyph: 'text-destructive',
  },
}

export function Alert({
  tone = 'info',
  title,
  children,
  action,
  onDismiss,
  live = false,
  className = '',
}: AlertProps) {
  const { icon: Icon, box, glyph } = TONES[tone]
  const role = live ? (tone === 'error' || tone === 'warning' ? 'alert' : 'status') : undefined

  return (
    <div
      role={role}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm text-foreground ${box} ${className}`}
    >
      <Icon aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 ${glyph}`} />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? (
          <div className={`text-muted-foreground ${title ? 'mt-1' : ''}`}>{children}</div>
        ) : null}
        {action ? (
          <div className="mt-3">
            {action.href ? (
              <a
                href={action.href}
                onClick={action.onClick}
                className="rounded font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {action.label}
              </a>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="rounded font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {action.label}
              </button>
            )}
          </div>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-m-1 shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
