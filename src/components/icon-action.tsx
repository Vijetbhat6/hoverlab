'use client'

/**
 * An icon-only control that is never unlabelled.
 *
 * The catalog is full of 28px circles: a heart, a package, a pair of scales,
 * an arrow. Each carried a `title`, which the browser shows after a second
 * or so in a system tooltip you cannot style, and which touch devices never
 * show at all. Four of them in a row on a card, and the honest answer to
 * "what does this do" was "click it and find out".
 *
 * So `label` is required and does three jobs: it is the accessible name, it
 * is the tooltip text, and — where the caller has room, via `showLabel` —
 * it is a visible word. There is no way to render one of these without
 * saying what it does.
 *
 * `pressed` drives `aria-pressed` for the toggles (favourite, bundle,
 * compare), which is what tells a screen reader that "Save" is a state and
 * not a one-shot command.
 */

import * as React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Tone = 'default' | 'primary' | 'rose'

/** Border/background/text for a control's resting and active states. */
const TONE: Record<Tone, { on: string; off: string }> = {
  default: {
    on: 'border-foreground/40 bg-muted text-foreground',
    off: 'border-border/60 bg-background/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground',
  },
  primary: {
    on: 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20',
    off: 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-primary',
  },
  rose: {
    on: 'border-rose-400/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20',
    off: 'border-border/60 bg-background/60 text-muted-foreground hover:border-rose-400/40 hover:text-rose-500',
  },
}

export interface IconActionProps {
  /**
   * What this control does, in words — "Save to favorites", not "Heart".
   * Used as the accessible name and as the tooltip.
   */
  label: string
  /** The glyph. Rendered `aria-hidden`; `label` carries the meaning. */
  icon: React.ReactNode
  /** Show `label` as visible text beside the icon. Off by default. */
  showLabel?: boolean
  /** Toggle state, when this control is a toggle rather than an action. */
  pressed?: boolean
  disabled?: boolean
  tone?: Tone
  onClick?: () => void
  /** Render as a link instead of a button. */
  href?: string
  className?: string
}

export function IconAction({
  label,
  icon,
  showLabel = false,
  pressed,
  disabled = false,
  tone = 'primary',
  onClick,
  href,
  className,
}: IconActionProps) {
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    showLabel ? 'h-7 px-2.5 text-[11px] font-medium' : 'h-7 w-7',
    pressed ? TONE[tone].on : TONE[tone].off,
    disabled && 'cursor-not-allowed opacity-40',
    className,
  )

  const body = (
    <>
      {icon}
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Link href={href} className={classes} aria-label={label}>
            {body}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-pressed={pressed}
            aria-label={label}
            className={classes}
          >
            {body}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}
