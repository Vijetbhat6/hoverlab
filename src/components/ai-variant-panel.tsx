'use client'

/**
 * <AiVariantPanel> — describe a change, or ask for a variation.
 *
 * The one metered thing on the site, and the only reason Pro+ exists. It
 * sits in the playground because that is where someone already has a
 * component in front of them and a reason to alter it.
 *
 * Two deliberate choices about how it fails:
 *
 *   The balance is fetched once and updated from the generation response,
 *   not re-fetched after every call. One request per generation, and the
 *   number a user sees is the number the server just charged them.
 *
 *   A 402 is not an error toast. Running out is a normal state with two
 *   different remedies — wait until tomorrow, or buy — and the panel says
 *   which one applies rather than making the user work it out.
 */

import * as React from 'react'
import { Loader2, Sparkles, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface CreditState {
  balance: number
  monthlyAllowance: number
  freeRemaining: number
  freeDaily: number
  signedIn: boolean
}

export interface Variant {
  html: string
  css: string
  note: string
}

export function AiVariantPanel({
  html,
  css,
  onApply,
  className,
}: {
  html: string
  css: string
  onApply: (variant: Variant) => void
  className?: string
}) {
  const [prompt, setPrompt] = React.useState('')
  const [busy, setBusy] = React.useState<'edit' | 'variation' | null>(null)
  const [credits, setCredits] = React.useState<CreditState | null>(null)
  const [blocked, setBlocked] = React.useState<'plus' | 'topup' | 'signin' | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetch('/api/billing/credits')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CreditState | null) => {
        if (!cancelled && data) setCredits(data)
      })
      .catch(() => {
        // The panel still works; only the counter is missing. A failed
        // balance read is not a reason to hide the feature.
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function generate(mode: 'edit' | 'variation') {
    if (busy) return
    if (!css.trim()) {
      toast.error('Write some CSS first.')
      return
    }
    setBusy(mode)
    setBlocked(null)

    try {
      const res = await fetch('/api/ai/variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, css, prompt, mode }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        html?: string
        css?: string
        note?: string
        error?: string
        offer?: 'plus' | 'topup'
        spent?: { remaining: number }
      }

      if (res.status === 401) {
        setBlocked('signin')
        return
      }
      if (res.status === 402) {
        setBlocked(data.offer ?? 'topup')
        return
      }
      if (!res.ok || !data.css) {
        toast.error(data.error ?? 'Generation failed.')
        return
      }

      onApply({ html: data.html ?? html, css: data.css, note: data.note ?? '' })
      if (data.note) toast.success(data.note)

      // Charged server-side; reflect what it reported rather than guessing.
      if (typeof data.spent?.remaining === 'number' && credits) {
        setCredits(
          credits.monthlyAllowance > 0 || credits.balance > 0
            ? { ...credits, balance: data.spent.remaining }
            : { ...credits, freeRemaining: data.spent.remaining },
        )
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur',
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Wand2 aria-hidden className="h-4 w-4 text-primary" />
          Change it with AI
        </h3>
        {credits && (
          <span className="text-xs text-muted-foreground">
            {credits.monthlyAllowance > 0 || credits.balance > 0
              ? `${credits.balance.toLocaleString('en-US')} credits`
              : `${credits.freeRemaining} of ${credits.freeDaily} free today`}
          </span>
        )}
      </div>

      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Make it glassy, slow the animation down, add a subtle inner glow…"
        rows={2}
        className="resize-none text-sm"
        aria-label="Describe the change you want"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => generate('edit')}
          disabled={busy !== null || !prompt.trim()}
        >
          {busy === 'edit' ? (
            <Loader2 aria-hidden className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 aria-hidden className="mr-1.5 h-3.5 w-3.5" />
          )}
          Apply change
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => generate('variation')}
          disabled={busy !== null}
        >
          {busy === 'variation' ? (
            <Loader2 aria-hidden className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles aria-hidden className="mr-1.5 h-3.5 w-3.5" />
          )}
          Surprise me
        </Button>
      </div>

      {blocked && (
        <p className="mt-3 rounded-lg border border-border/60 bg-muted/50 p-3 text-xs text-muted-foreground">
          {blocked === 'signin' && (
            <>
              <a href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </a>{' '}
              to generate — it&apos;s free, and includes {credits?.freeDaily ?? 5}{' '}
              generations a day.
            </>
          )}
          {blocked === 'plus' && (
            <>
              That&apos;s today&apos;s free generations used. They reset tomorrow, or{' '}
              <a href="/account#billing" className="font-medium text-primary hover:underline">
                Pro+
              </a>{' '}
              adds 500 a month.
            </>
          )}
          {blocked === 'topup' && (
            <>
              Out of credits.{' '}
              <a href="/account#billing" className="font-medium text-primary hover:underline">
                Top up
              </a>{' '}
              — packs never expire.
            </>
          )}
        </p>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Generated CSS is yours to use, and it is not added to the catalog.
        Everything else on this site — browsing, copying, the CLI, the API —
        stays free and unmetered.
      </p>
    </div>
  )
}
