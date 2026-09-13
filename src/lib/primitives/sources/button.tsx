/**
 * <Button> — six variants, four sizes, and the two states everyone forgets.
 *
 * There is no shortage of button components. What is short is buttons that
 * handle the states a real form puts them in:
 *
 *   loading   the label stays, the spinner replaces the icon slot, and the
 *             width does not change. A button that shrinks to a spinner
 *             moves everything after it, and a button that grows makes the
 *             row reflow at the exact moment the user is watching it.
 *   icon-only  has no text, so it has no accessible name. `aria-label` is
 *             required by the type when `size="icon"` — TypeScript refuses
 *             the unlabelled version rather than an audit finding it later.
 *
 * `loading` also implies `disabled`, but they are not the same prop: a
 * disabled button is one the user may not press, a loading button is one
 * they already pressed. Keeping them separate is what lets the loading one
 * announce itself with `aria-busy` while a disabled one stays silent.
 */

import * as React from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-border bg-background hover:bg-muted/60 text-foreground',
  ghost: 'text-foreground hover:bg-muted/70',
  destructive: 'bg-destructive text-white hover:bg-destructive/90 shadow-sm',
  link: 'text-primary underline-offset-4 hover:underline',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
  icon: 'h-9 w-9 p-0',
}

type BaseProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  variant?: Variant
  /** Shown before the label. Replaced by the spinner while loading. */
  icon?: React.ReactNode
  /** Shown after the label — a chevron, a count, an external-link mark. */
  trailingIcon?: React.ReactNode
  /** The user has pressed it and something is happening. Implies disabled. */
  loading?: boolean
  /** Fills its container. Use in a form footer, never in a toolbar. */
  block?: boolean
  className?: string
}

/**
 * An icon button must be labelled; a text button must not be, because its
 * own text is the label and a second one overrides it for screen readers.
 */
export type ButtonProps = BaseProps &
  ({ size: 'icon'; 'aria-label': string } | { size?: Exclude<Size, 'icon'> })

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  trailingIcon,
  loading = false,
  block = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      // A loading button is not a disabled one, but it must not be pressed
      // twice — so it is disabled in fact and announced as busy, which is
      // what a screen reader needs to say "working" rather than "dimmed".
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'inline-flex shrink-0 select-none items-center justify-center rounded-lg font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        block ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
      ) : (
        icon
      )}
      {/*
        At `size="icon"` the glyph may arrive either way — as `icon`, or as
        the only child. Dropping children outright, which is the obvious
        way to write "no text on an icon button", renders an empty circle
        for every caller who wrote `<Button size="icon"><X /></Button>`;
        that is the shape the JSX invites, so it has to work.
      */}
      {size === 'icon' && icon ? null : children}
      {loading ? null : trailingIcon}
    </button>
  )
}
