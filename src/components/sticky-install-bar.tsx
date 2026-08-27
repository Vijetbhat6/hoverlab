'use client'

/**
 * <StickyInstallBar> — the install command, kept within reach.
 *
 * A block page is long: preview, then two hundred lines of source, then the
 * blocks it composes, then related. The one thing a reader is going to do
 * at the end of all that scrolling is install it, and until now the command
 * to do so was back at the top.
 *
 * Appears only after the header has scrolled away, so it never covers the
 * buttons it duplicates, and only from the `sm` breakpoint up, where there
 * is room for it without eating the viewport. Its one piece of motion is a
 * fade, which the global `prefers-reduced-motion` rule already neutralises.
 *
 * It also waits while the cookie banner is unanswered. Both are fixed to the
 * bottom of the viewport, and stacking a duplicated convenience on top of an
 * unanswered legal question is the wrong way round: the command is still at
 * the top of the page, and the wait is one click long. `pending` is false
 * where no banner is asked for, so this does not go missing on a build with
 * no analytics key — see useConsent.
 */

import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { reportUsage } from '@/lib/report-usage'
import { useConsent } from '@/components/use-consent'
import { cn } from '@/lib/utils'

export function StickyInstallBar({
  id,
  name,
  command,
}: {
  id: string
  name: string
  command: string
}) {
  const [scrolledPast, setScrolledPast] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const { pending } = useConsent()

  const visible = scrolledPast && !pending

  React.useEffect(() => {
    // 480px is roughly the header plus the action row — far enough that the
    // bar cannot appear while the buttons it mirrors are still on screen.
    const onScroll = () => setScrolledPast(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      // Copying the install command is the same intent as copying the
      // source: it is what somebody does immediately before using this.
      reportUsage(id, 'copy')
      toast.success(`Copied — run it in your project to add ${name}.`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed — select the command and copy it by hand.')
    }
  }

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden justify-center p-4 transition-opacity sm:flex',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className={cn(
          'pointer-events-auto flex max-w-full items-center gap-3 rounded-full border border-border/60 bg-background/90 py-2 pl-4 pr-2 shadow-lg backdrop-blur',
          !visible && 'pointer-events-none',
        )}
      >
        <code className="truncate font-mono text-xs text-muted-foreground sm:text-sm">
          {command}
        </code>
        <button
          type="button"
          onClick={copy}
          tabIndex={visible ? 0 : -1}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? (
            <Check aria-hidden className="h-3.5 w-3.5" />
          ) : (
            <Copy aria-hidden className="h-3.5 w-3.5" />
          )}
          {copied ? 'Copied' : 'Copy'}
          <span className="sr-only"> the install command for {name}</span>
        </button>
      </div>
    </div>
  )
}
