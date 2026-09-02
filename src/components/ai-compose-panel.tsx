'use client'

/**
 * <AiComposePanel> — describe a section, get one built in your tokens.
 *
 * The other half of what credits buy. `<AiVariantPanel>` changes something
 * that already exists; this starts from a sentence, which is the reason
 * anyone would pay monthly rather than once.
 *
 * Why this is worth doing here rather than in a general-purpose chat
 * window: the route hands the model this catalog's actual design tokens
 * and forbids literal colours, so what comes back sits inside a Hoverlab
 * project instead of beside it. The same brief in a blank chat produces a
 * section with its own greys, its own radii and a palette that collapses
 * in dark mode. Tokens plus a brief is a component; a brief alone is a
 * guess.
 *
 * COSTS MORE THAN A VARIANT, and says so before the button is pressed. A
 * meter that charges 3 where the thing beside it charges 1 has to state
 * that up front — finding out afterwards is how a credit balance turns
 * into a grievance.
 *
 * The 402 here is deliberately different from the variant panel's. Compose
 * is a cost-3 action and the free daily allowance only covers cost-1 ones,
 * so "come back tomorrow" is never the right advice — both refusals point
 * at a purchase.
 */

import * as React from 'react'
import { Layers, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useBrandColor } from '@/hooks/use-brand-color'
import { cn } from '@/lib/utils'

/** Kept in step with ACTION_COSTS.compose in billing/credits.ts. */
const COMPOSE_COST = 3

const MAX_BRIEF = 600

export interface ComposedSection {
  name: string
  html: string
  css: string
  note: string
}

const EXAMPLES = [
  'A pricing section with three tiers and a monthly/yearly toggle',
  'A testimonial row with four logos above it',
  'An FAQ block with six questions that expand',
]

export function AiComposePanel({
  onApply,
  className,
}: {
  onApply: (section: ComposedSection) => void
  className?: string
}) {
  const { color: brand } = useBrandColor()
  const [brief, setBrief] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [blocked, setBlocked] = React.useState<'signin' | 'buy' | null>(null)

  async function compose() {
    if (busy) return
    const trimmed = brief.trim()
    if (!trimmed) {
      toast.error('Describe the section you want.')
      return
    }

    setBusy(true)
    setBlocked(null)

    try {
      const res = await fetch('/api/ai/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: trimmed, brand }),
      })
      const data = (await res.json().catch(() => ({}))) as Partial<ComposedSection> & {
        error?: string
      }

      if (res.status === 401) {
        setBlocked('signin')
        return
      }
      if (res.status === 402) {
        setBlocked('buy')
        return
      }
      if (!res.ok || !data.html) {
        toast.error(data.error ?? 'That did not come back usable. Try again.')
        return
      }

      onApply({
        name: data.name ?? 'Section',
        html: data.html,
        css: data.css ?? '',
        note: data.note ?? '',
      })
      if (data.note) toast.success(data.note)
    } catch {
      toast.error('Could not reach the model. Check your connection.')
    } finally {
      setBusy(false)
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
          <Layers aria-hidden className="h-4 w-4 text-primary" />
          Build a section
        </h3>
        <span className="text-xs text-muted-foreground">
          {COMPOSE_COST} credits
        </span>
      </div>

      <Textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value.slice(0, MAX_BRIEF))}
        placeholder="A pricing section with three tiers, the middle one highlighted…"
        rows={3}
        className="resize-none text-sm"
        aria-label="Describe the section you want"
      />

      {/* Examples as buttons, not placeholder text. A placeholder disappears
          the moment someone types, which is exactly when they would want to
          look at it again. */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setBrief(example)}
            disabled={busy}
            className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            {example.length > 34 ? `${example.slice(0, 34)}…` : example}
          </button>
        ))}
      </div>

      <Button
        size="sm"
        className="mt-3 w-full"
        onClick={compose}
        disabled={busy || !brief.trim()}
      >
        {busy ? (
          <Loader2 aria-hidden className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Layers aria-hidden className="mr-1.5 h-3.5 w-3.5" />
        )}
        {busy ? 'Building' : 'Build it'}
      </Button>

      {blocked ? (
        <p className="mt-3 rounded-lg border border-border/60 bg-muted/50 p-3 text-xs text-muted-foreground">
          {blocked === 'signin' ? (
            <>
              <a href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </a>{' '}
              to build a section.
            </>
          ) : (
            <>
              Composing costs {COMPOSE_COST} credits, which is more than the free
              daily generations cover.{' '}
              <a
                href="/account#billing"
                className="font-medium text-primary hover:underline"
              >
                Pro, or a credit pack
              </a>{' '}
              covers it — Pro includes credits that never expire.
            </>
          )}
        </p>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Built in your design tokens, so it drops into a Hoverlab project and
        looks like the rest of it. Yours to use, and not added to the catalog.
      </p>
    </div>
  )
}
