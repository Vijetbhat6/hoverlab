'use client'

import * as React from 'react'
import { Check, Copy, Info, ShieldCheck, TriangleAlert, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  analyzeEffect,
  reducedMotionGuard,
  type SupportLevel,
} from '@/lib/effect-insights'
import { cn } from '@/lib/utils'

interface EffectInsightsPanelProps {
  html: string
  /** The CSS currently rendered — customized, not the original. */
  css: string
}

const SUPPORT_COPY: Record<SupportLevel, { label: string; blurb: string; tone: string }> = {
  wide: {
    label: 'Works everywhere',
    blurb: 'Every feature this uses has shipped in all major browsers for years.',
    tone: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500',
  },
  recent: {
    label: 'Modern browsers',
    blurb: 'Uses features that reached every engine recently. Fine for most projects; add fallbacks if you support older Safari or Firefox.',
    tone: 'border-amber-500/40 bg-amber-500/10 text-amber-500',
  },
  limited: {
    label: 'Needs a fallback',
    blurb: 'Relies on something not yet in every engine. Treat it as progressive enhancement.',
    tone: 'border-rose-500/40 bg-rose-500/10 text-rose-500',
  },
}

const LEVEL_DOT: Record<SupportLevel, string> = {
  wide: 'bg-emerald-500',
  recent: 'bg-amber-500',
  limited: 'bg-rose-500',
}

/**
 * Compatibility and accessibility read-out for the effect on screen.
 *
 * Two questions block a paste that a preview can't answer: "will this
 * break in the browsers I support?" and "is this safe for someone who
 * asked for less motion?". Both are derivable from the CSS, so they're
 * computed rather than curated — see lib/effect-insights.
 *
 * The reduced-motion guard is generated on the spot and copyable, which
 * turns the warning into something you can act on in one click instead of
 * a scolding.
 */
export function EffectInsightsPanel({ html, css }: EffectInsightsPanelProps) {
  const insights = React.useMemo(() => analyzeEffect(css, html), [css, html])
  const guard = React.useMemo(() => reducedMotionGuard(css), [css])
  const [copied, setCopied] = React.useState(false)

  const support = SUPPORT_COPY[insights.support]

  async function copyGuard() {
    if (!guard) return
    try {
      await navigator.clipboard.writeText(guard)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      toast.success('Reduced-motion guard copied', {
        description: 'Paste it after the effect CSS to stop the motion for users who opt out.',
      })
    } catch {
      toast.error('Could not copy — your browser blocked clipboard access')
    }
  }

  return (
    <div className="space-y-4">
      {/* Support verdict */}
      <div className={cn('rounded-lg border p-3', support.tone)}>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4" />
          {support.label}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-foreground/70">{support.blurb}</p>
      </div>

      {/* Size / complexity */}
      <dl className="grid grid-cols-3 gap-2 text-center">
        <Stat label="CSS" value={`${(insights.cssBytes / 1024).toFixed(1)} KB`} />
        <Stat label="Rules" value={String(insights.ruleCount)} />
        <Stat label="Keyframes" value={String(insights.keyframeCount)} />
      </dl>

      {/* Platform features in play */}
      {insights.features.length > 0 ? (
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Zap className="h-3.5 w-3.5" /> Platform features
          </h3>
          <ul className="space-y-2">
            {insights.features.map((f) => (
              <li key={f.name} className="rounded-md border border-border/60 bg-muted/30 p-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', LEVEL_DOT[f.level])} />
                  <code className="text-xs font-semibold">{f.name}</code>
                </div>
                <p className="mt-1 pl-3.5 text-[11px] leading-relaxed text-muted-foreground">
                  {f.note}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Accessibility notes */}
      {insights.accessibility.length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Accessibility
          </h3>
          <ul className="space-y-2">
            {insights.accessibility.map((note) => (
              <li
                key={note.title}
                className={cn(
                  'flex gap-2 rounded-md border p-2.5',
                  note.severity === 'warn'
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-border/60 bg-muted/30',
                )}
              >
                {note.severity === 'warn' ? (
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                ) : (
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold">{note.title}</div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {note.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* One-click fix for the motion warning */}
      {guard ? (
        <section className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold">Reduced-motion guard</div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Scoped to this effect&apos;s classes. Paste it below the CSS.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={copyGuard}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-background/70 p-2 text-[10px] leading-relaxed">
            <code>{guard}</code>
          </pre>
        </section>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
