'use client'

/**
 * <ToastStack> — a corner notification stack with a working timer.
 *
 * Toasts are the component most often shipped inaccessible, because the
 * hard parts are invisible:
 *
 *  - The container is a permanent `aria-live` region that exists *before*
 *    any toast does. A live region added to the DOM at the same moment as
 *    its first message is usually not announced at all — the screen reader
 *    has nothing registered to watch.
 *  - Severity picks the politeness. Errors use `role="alert"`
 *    (assertive, interrupts); everything else is polite and waits its turn.
 *    Making a success message interrupt what someone is reading is rude,
 *    and making an error wait is dangerous.
 *  - Auto-dismiss pauses on hover *and* on focus, and stops entirely while
 *    the pointer is anywhere in the stack. A message that vanishes while
 *    being read is the same bug whether the reader uses a mouse or a
 *    keyboard.
 *  - Every toast has a real close button with a name. Auto-dismiss is a
 *    convenience, not a substitute — WCAG 2.2.1 wants a way to dismiss.
 *
 * The enter animation is gated behind `motion-safe:`; under `reduce` the
 * toast simply appears. The timer is unaffected — reduced motion is about
 * movement, not about taking things away.
 */

import * as React from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number
  variant: ToastVariant
  title: string
  body?: string
}

export interface ToastStackProps {
  /** Milliseconds before a toast dismisses itself. 0 disables the timer. */
  duration?: number
  className?: string
}

const VARIANTS: Record<
  ToastVariant,
  { Icon: typeof Info; tone: string; ring: string }
> = {
  success: {
    Icon: CheckCircle2,
    tone: 'text-emerald-600 dark:text-emerald-400',
    ring: 'border-emerald-500/30',
  },
  error: { Icon: XCircle, tone: 'text-destructive', ring: 'border-destructive/30' },
  warning: {
    Icon: AlertTriangle,
    tone: 'text-amber-600 dark:text-amber-400',
    ring: 'border-amber-500/30',
  },
  info: { Icon: Info, tone: 'text-primary', ring: 'border-primary/30' },
}

const SAMPLES: Array<Omit<Toast, 'id'>> = [
  { variant: 'success', title: 'Deployment live', body: 'acme-web is serving from 14 regions.' },
  { variant: 'error', title: 'Build failed', body: 'Type error in app/page.tsx line 42.' },
  { variant: 'warning', title: 'Usage at 80%', body: 'You have used 8,000 of 10,000 requests.' },
  { variant: 'info', title: 'New version available', body: 'v2.4.0 is ready to install.' },
]

export function ToastStack({ duration = 5000, className = '' }: ToastStackProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const [paused, setPaused] = React.useState(false)
  const nextId = React.useRef(0)

  const dismiss = React.useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  function push(variant: ToastVariant) {
    const sample = SAMPLES.find((s) => s.variant === variant) ?? SAMPLES[0]!
    setToasts((list) => [...list, { ...sample, id: nextId.current++ }])
  }

  // One timer for the whole stack rather than one per toast: the pause is a
  // property of the stack (the pointer is over *it*), and a per-toast timer
  // would need the same paused flag threaded into every one of them.
  React.useEffect(() => {
    if (paused || duration <= 0 || toasts.length === 0) return
    const timer = setTimeout(() => {
      setToasts((list) => list.slice(1))
    }, duration)
    return () => clearTimeout(timer)
  }, [paused, duration, toasts])

  return (
    <div className={`relative min-h-96 p-10 ${className}`}>
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-lg font-semibold">Toast notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fire one to see the stack. Hover or focus a toast to hold it open.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {(Object.keys(VARIANTS) as ToastVariant[]).map((variant) => (
            <button
              key={variant}
              type="button"
              onClick={() => push(variant)}
              className="rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-semibold capitalize transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {variant}
            </button>
          ))}
        </div>
      </div>

      {/*
        The live region is mounted always, empty or not. Creating it at the
        same time as its first message is the classic reason toasts are
        never announced.
      */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        className="pointer-events-none absolute bottom-6 right-6 flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => {
          const { Icon, tone, ring } = VARIANTS[toast.variant]
          return (
            <div
              key={toast.id}
              // Errors interrupt; everything else waits its turn.
              role={toast.variant === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-background/95 p-3.5 shadow-lg backdrop-blur motion-safe:animate-[toast-in_180ms_ease-out] ${ring}`}
            >
              <Icon aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.body ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{toast.body}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label={`Dismiss: ${toast.title}`}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Keyframes travel with the component so it works wherever it lands. */}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  )
}
