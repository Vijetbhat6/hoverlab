'use client'

/**
 * Motion presets.
 *
 * A gallery of the animations a UI actually uses — enter, exit, attention —
 * each copyable as keyframes plus the class that drives them.
 *
 * Every preset ships with its `prefers-reduced-motion` guard already
 * written, and that is the point of this tool existing rather than being a
 * page of copy-paste keyframes. An animation library that leaves the guard
 * to the reader ships an accessibility bug by default, and the catalog's
 * own effects are audited for exactly this (see `test:motion`). Handing out
 * unguarded keyframes from the same site would be incoherent.
 *
 * Preview honours the setting too: with reduce on, the demo stops moving.
 * Being able to see what a reduced-motion visitor sees is the fastest way
 * to notice that your "subtle" fade was carrying the whole meaning.
 */

import * as React from 'react'
import { Zap, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { cn } from '@/lib/utils'

interface Preset {
  id: string
  name: string
  group: 'Enter' | 'Exit' | 'Attention'
  blurb: string
  /** Keyframes body, without the @keyframes wrapper. */
  frames: string
  /** Default duration + easing. */
  timing: string
  /** Loops forever — needs the guard most. */
  loops?: boolean
}

const PRESETS: Preset[] = [
  {
    id: 'fade-in-up',
    name: 'Fade in up',
    group: 'Enter',
    blurb: 'The default for anything entering on scroll. Small travel, never more than ~24px.',
    frames: `from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: none; }`,
    timing: '0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
  },
  {
    id: 'fade-in',
    name: 'Fade in',
    group: 'Enter',
    blurb: 'No movement at all. The safe choice when a lot of things enter at once.',
    frames: `from { opacity: 0; }
  to   { opacity: 1; }`,
    timing: '0.4s ease-out both',
  },
  {
    id: 'scale-in',
    name: 'Scale in',
    group: 'Enter',
    blurb: 'For things that appear where you clicked — popovers, menus, tooltips.',
    frames: `from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: none; }`,
    timing: '0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
  },
  {
    id: 'slide-in-right',
    name: 'Slide in right',
    group: 'Enter',
    blurb: 'Drawers and side panels. The one most worth guarding — it crosses the screen.',
    frames: `from { transform: translateX(100%); }
  to   { transform: none; }`,
    timing: '0.3s cubic-bezier(0.32, 0.72, 0, 1) both',
  },
  {
    id: 'fade-out-down',
    name: 'Fade out down',
    group: 'Exit',
    blurb: 'Dismissals. Exits should be faster than entrances — nobody waits to watch something leave.',
    frames: `from { opacity: 1; transform: none; }
  to   { opacity: 0; transform: translateY(12px); }`,
    timing: '0.2s ease-in both',
  },
  {
    id: 'pulse',
    name: 'Pulse',
    group: 'Attention',
    blurb: 'A live status dot. Opacity only — a scaling pulse reflows everything beside it.',
    frames: `0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }`,
    timing: '2s ease-in-out infinite',
    loops: true,
  },
  {
    id: 'shake',
    name: 'Shake',
    group: 'Attention',
    blurb: 'A rejected form field. Short, small, and once — a shake that repeats reads as broken.',
    frames: `0%, 100%   { transform: translateX(0); }
  20%, 60%   { transform: translateX(-4px); }
  40%, 80%   { transform: translateX(4px); }`,
    timing: '0.4s ease-in-out both',
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    group: 'Attention',
    blurb: 'Skeleton loading. Pair it with a background gradient sized 200%.',
    frames: `from { background-position: 200% 0; }
  to   { background-position: -200% 0; }`,
    timing: '1.6s ease-in-out infinite',
    loops: true,
  },
]

/**
 * The full CSS for one preset, guard included.
 *
 * Loops are stopped outright; one-shots are collapsed to 0.01ms rather than
 * removed. That distinction matters: a one-shot often ends in the state the
 * element must be *in* (`opacity: 1` via `both`), and deleting the animation
 * leaves it at the from-state — invisible forever. Collapsing the duration
 * keeps the end state and removes the motion.
 */
function buildCss(preset: Preset): string {
  const name = `fx-${preset.id}`
  return `@keyframes ${name} {
  ${preset.frames}
}

.${name} {
  animation: ${name} ${preset.timing};
}

@media (prefers-reduced-motion: reduce) {
  .${name} {
${
  preset.loops
    ? `    animation: none;`
    : `    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;`
}
  }
}`
}

export default function MotionToolPage() {
  const [selected, setSelected] = React.useState<Preset>(PRESETS[0]!)
  const [reduced, setReduced] = React.useState(false)
  // Bump to restart a one-shot animation on demand.
  const [runKey, setRunKey] = React.useState(0)

  const groups = ['Enter', 'Exit', 'Attention'] as const

  return (
    <ToolLayout
      name="Motion Presets"
      tagline="The animations a UI actually uses — each with its reduced-motion guard already written"
      icon={<Zap className="h-5 w-5" />}
    >
      {/* Scoped so the demo can be stopped independently of the site's own
          reduced-motion provider. */}
      <style>{`
        ${PRESETS.map(
          (p) => `@keyframes fx-${p.id} { ${p.frames} }
        .demo-${p.id} { animation: fx-${p.id} ${p.timing}; }`,
        ).join('\n')}
        .demo-still, .demo-still * { animation: none !important; }
      `}</style>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card/60 p-4">
          {groups.map((group) => (
            <div key={group}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </h2>
              <ul className="space-y-1">
                {PRESETS.filter((p) => p.group === group).map((preset) => (
                  <li key={preset.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(preset)
                        setRunKey((k) => k + 1)
                      }}
                      aria-current={selected.id === preset.id ? 'true' : undefined}
                      className={cn(
                        'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        selected.id === preset.id
                          ? 'bg-primary/10 font-semibold text-primary'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      )}
                    >
                      {preset.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{selected.name}</h2>
                <p className="mt-0.5 max-w-xl text-xs text-muted-foreground">
                  {selected.blurb}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setRunKey((k) => k + 1)}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Replay
                </Button>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={reduced}
                    onChange={(e) => setReduced(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  Simulate reduced motion
                </label>
              </div>
            </div>

            <div className="mt-5 flex min-h-[180px] items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background">
              <div
                key={runKey}
                className={cn(
                  'flex h-24 w-48 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-sm font-semibold text-primary-foreground',
                  `demo-${selected.id}`,
                  reduced && 'demo-still',
                )}
              >
                {reduced ? 'Still' : selected.name}
              </div>
            </div>

            {reduced ? (
              <p className="mt-3 text-xs text-muted-foreground">
                This is what a visitor with reduced motion enabled sees. If the
                meaning disappeared along with the movement, the animation was
                carrying information it should not have been.
              </p>
            ) : null}
          </div>

          <CopyCssCard code={buildCss(selected)} title={`fx-${selected.id}`} language="css" />

          {/*
            No presets bar: this page is itself a preset gallery, and the
            only state is which of them is open. The catalog exit stays —
            someone comparing motion presets is one click from the effects
            that already use them.
          */}
          <UseInCatalog tool="/tools/motion" />
        </div>
      </div>
    </ToolLayout>
  )
}
