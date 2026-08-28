'use client'

/**
 * Motion presets.
 *
 * A gallery of the animations a UI actually uses — enter, exit, attention —
 * each copyable as keyframes plus the class that drives them.
 *
 * It used to end there, and that was the problem: a preset is a starting
 * point, and the moment someone wanted the fade to travel 16px instead of 24
 * this page had nothing to offer but a text editor. The editor already
 * existed one tool over. So every preset the timeline can express opens in
 * it, seeded, in one click — and the presets themselves are now the same
 * `Animation` data the editor works in (see `lib/motion-presets.ts`), so the
 * CSS shown here is generated from what the editor would load rather than
 * stored next to it. What you copy and what opens cannot drift apart.
 *
 * Two of the eight cannot be expressed on a pixel timeline, and rather than
 * approximate them into something subtly different they say so where the
 * Edit button would be. An honest missing affordance beats a preset that
 * changes when you open it.
 *
 * Every preset ships with its `prefers-reduced-motion` guard already
 * written, and that is the point of this tool existing rather than being a
 * page of copy-paste keyframes. An animation library that leaves the guard
 * to the reader ships an accessibility bug by default, and the catalog's
 * own effects are audited for exactly this (see `test:motion`).
 *
 * Preview honours the setting too: with reduce on, the demo stops moving.
 * Being able to see what a reduced-motion visitor sees is the fastest way
 * to notice that your "subtle" fade was carrying the whole meaning.
 */

import * as React from 'react'
import Link from 'next/link'
import { Zap, RotateCcw, SlidersHorizontal, Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import {
  MOTION_GROUPS,
  MOTION_PRESETS,
  buildMotionCss,
  motionClass,
  motionKeyframes,
  motionShorthand,
  type MotionPreset,
} from '@/lib/motion-presets'
import { cn } from '@/lib/utils'

/** Duration · easing · iterations, for the line under the name. */
function summarise(preset: MotionPreset): string {
  if (!preset.anim) return preset.timing ?? ''
  const { duration, easing, iterations, stops } = preset.anim
  return [
    `${duration}ms`,
    easing,
    iterations === 0 ? 'infinite' : `${iterations}×`,
    `${stops.length} stops`,
  ].join(' · ')
}

export default function MotionToolPage() {
  const [selectedId, setSelectedId] = React.useState(MOTION_PRESETS[0]!.id)
  const [reduced, setReduced] = React.useState(false)
  // Bump to restart a one-shot animation on demand.
  const [runKey, setRunKey] = React.useState(0)

  const selected = MOTION_PRESETS.find((p) => p.id === selectedId) ?? MOTION_PRESETS[0]!

  return (
    <ToolLayout
      name="Motion Presets"
      tagline="The animations a UI actually uses — each with its reduced-motion guard already written, and each one editable"
      icon={<Zap className="h-5 w-5" />}
    >
      {/* Scoped so the demo can be stopped independently of the site's own
          reduced-motion provider. The demo class is separate from the `fx-`
          class on purpose: the copied CSS carries a guard, and a guard that
          also silenced this preview would defeat the toggle below. */}
      <style>{`
        ${MOTION_PRESETS.map(
          (p) => `${motionKeyframes(p)}
        .demo-${p.id} { animation: ${motionClass(p)} ${motionShorthand(p)}; }`,
        ).join('\n')}
        .demo-still, .demo-still * { animation: none !important; }
      `}</style>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card/60 p-4">
          {MOTION_GROUPS.map((group) => (
            <div key={group}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </h2>
              <ul className="space-y-1">
                {MOTION_PRESETS.filter((p) => p.group === group).map((preset) => (
                  <li key={preset.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(preset.id)
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
                <p className="mt-1 font-mono text-[11px] text-muted-foreground/80">
                  {summarise(selected)}
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

            {/*
              The exit from "nearly right" to "right".

              A hash rather than a query string, matching the share links: the
              server never needs it, so there is no prerender variance and
              nothing is logged. `#from=<id>` stays readable, which means the
              link is worth sending to someone.
            */}
            <div className="mt-4 border-t border-border/60 pt-4">
              {selected.anim ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild size="sm" className="gap-1.5">
                    <Link href={`/tools/keyframes#from=${selected.id}`}>
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Edit in the keyframes editor
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Opens this exact animation on a timeline — move the stops,
                    add one, change the curve. The guard comes with it.
                  </p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Lock
                    aria-hidden
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Not editable on the timeline.
                    </span>{' '}
                    {selected.notEditable}
                  </p>
                </div>
              )}
            </div>
          </div>

          <CopyCssCard
            code={buildMotionCss(selected)}
            title={motionClass(selected)}
            language="css"
          />

          {/*
            No presets bar: this page is itself a preset gallery, and the
            only state is which of them is open. Anything worth naming is
            worth editing first, and that now has somewhere to happen. The
            catalog exit stays — someone comparing motion presets is one
            click from the effects that already use them.
          */}
          <UseInCatalog tool="/tools/motion" />
        </div>
      </div>
    </ToolLayout>
  )
}
