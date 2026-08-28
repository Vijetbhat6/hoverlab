'use client'

/**
 * Keyframes Editor.
 *
 * The gap between the two animation tools already here. `/tools/motion` is
 * a gallery — pick one of the animations a UI actually uses and copy it.
 * `/tools/easing` is one curve between two states. Neither lets you author
 * an animation: the moment you want three stops instead of two, or want to
 * move and fade on different schedules, both tools run out and you are
 * hand-writing percentages in a text editor with no preview.
 *
 * The stops are the whole interface, so they are direct: a rail you click
 * to add a stop and drag a slider to place, with the transform and opacity
 * at that stop underneath. Transforms are composed in a fixed order —
 * translate, then rotate, then scale — because CSS applies a transform list
 * right-to-left and swapping two entries silently changes the result, which
 * is not a decision worth exposing.
 *
 * The output carries its `prefers-reduced-motion` guard, for the same
 * reason `/tools/motion` does: the catalog's own effects are audited for
 * exactly this (`npm run test:motion`), and a site that audits its own
 * animations while handing out unguarded keyframes would be incoherent.
 *
 * The two tools are now one system rather than two. `/tools/motion` is the
 * gallery and this is its editor: its presets are the same `Animation` data
 * this page works in, so "Edit in the keyframes editor" over there opens the
 * real thing here rather than an approximation of it, and the same presets
 * are offered below as starting points. The model and both emitters live in
 * `lib/keyframes-css.ts` — one implementation, so the CSS the gallery hands
 * out and the CSS this page copies cannot drift.
 */

import * as React from 'react'
import Link from 'next/link'
import { Clapperboard, Play, Plus, Sparkles, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SliderField, ToggleField } from '@/components/control-field'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { useToolState } from '@/hooks/use-tool-state'
import {
  NEUTRAL,
  animationShorthand,
  buildAnimationCss,
  keyframesBlock,
  loops as isLooping,
  round,
  safeName,
  sortStops,
  type Animation,
  type Direction,
  type Fill,
  type Stop,
} from '@/lib/keyframes-css'
import { MOTION_PRESETS, findMotionPreset } from '@/lib/motion-presets'
import { cn } from '@/lib/utils'

const TOOL = '/tools/keyframes'

/**
 * The animation, plus the three things that are about editing it rather than
 * about the animation itself — what it is called, which stop is open, and
 * what the preview is shaped like.
 */
interface KeyframesState extends Animation {
  name: string
  selected: number
  /** Which shape the preview box takes — a card reads differently to a dot. */
  shape: 'card' | 'dot' | 'text'
}

/**
 * The curves in the menu.
 *
 * The three unnamed béziers at the bottom are the ones `/tools/motion` ships
 * with, so a preset opened from the gallery finds its own curve in the list
 * rather than showing an empty select. `easingOptions` below still unions in
 * whatever the state holds, because a preset saved on the account may carry a
 * curve this list has since stopped offering.
 */
const EASINGS = [
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'cubic-bezier(0.4, 0, 0.2, 1)',
  'cubic-bezier(0.22, 1, 0.36, 1)',
  'cubic-bezier(0.16, 1, 0.3, 1)',
  'steps(6, end)',
]

/** The presets worth starting from — the ones the timeline can express. */
const STARTERS = MOTION_PRESETS.filter((p) => p.anim)

/**
 * A gallery preset as editor state, ready to load.
 *
 * The name becomes the preset's, not `fx-`-prefixed: that prefix namespaces
 * the gallery's copy-paste snippets against each other, and someone who has
 * opened one to change it is naming their own animation now.
 */
function seedFrom(id: string): Partial<KeyframesState> | null {
  const preset = findMotionPreset(id)
  if (!preset?.anim) return null
  return {
    ...preset.anim,
    name: preset.id,
    selected: preset.anim.stops[0]?.id ?? 1,
  }
}

/**
 * The preset id in `#from=…`, if the visitor arrived from the gallery.
 *
 * A hash rather than a query string, for the same reason the share links use
 * one: the server never sees it, so there is no prerender variance and no
 * `useSearchParams` suspense boundary to thread through a client page. Read
 * from a mount effect — never during render, where the server has no hash —
 * and stripped afterwards so a reload keeps whatever was edited since.
 */
function readSeedId(): string | null {
  if (typeof window === 'undefined') return null
  const m = /^#from=([a-z0-9-]+)$/.exec(window.location.hash)
  if (!m) return null
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  return m[1]!
}

const DEFAULT_STATE: KeyframesState = {
  name: 'rise-in',
  duration: 600,
  delay: 0,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  iterations: 1,
  direction: 'normal',
  fill: 'both',
  stops: [
    { id: 1, at: 0, ...NEUTRAL, opacity: 0, y: 16, scale: 96 },
    { id: 2, at: 100, ...NEUTRAL },
  ],
  selected: 1,
  shape: 'card',
}

export default function KeyframesToolPage() {
  const tool = useToolState<KeyframesState>(TOOL, DEFAULT_STATE)
  const { state, setState, hydrating } = tool

  const update = (patch: Partial<KeyframesState>) => setState((s) => ({ ...s, ...patch }))

  /*
    Replaying is a remount, not a class toggle.

    Restarting a CSS animation by removing and re-adding a class needs a
    forced reflow between the two to work at all, and the version of that
    trick everyone copies reads `offsetWidth` for its side effect — which
    linters delete and bundlers can hoist. Keying the element on a counter
    makes React tear it down and build it again, which restarts the
    animation by construction.
  */
  const [runId, setRunId] = React.useState(0)
  const [reduced, setReduced] = React.useState(false)

  const loadPreset = React.useCallback(
    (id: string) => {
      const seed = seedFrom(id)
      if (!seed) return
      // Wholesale, not merged: a preset is a starting point, and half of the
      // last animation left under it would be neither one thing nor the other.
      setState({ ...DEFAULT_STATE, ...seed })
      setRunId((n) => n + 1)
    },
    [setState],
  )

  /*
    A preset arriving from the gallery beats whatever this browser had stored.

    It has to run after the hook's own restore or the restore would land on
    top of it — hence the `hydrating` gate rather than a bare mount effect.
    The hash is read once and stripped, so the seed does not re-apply over
    the visitor's edits on every reload.
  */
  const seeded = React.useRef(false)
  React.useEffect(() => {
    if (hydrating || seeded.current) return
    seeded.current = true
    const id = readSeedId()
    if (id) loadPreset(id)
  }, [hydrating, loadPreset])

  const stops = React.useMemo(() => sortStops(state.stops), [state.stops])
  const selected = stops.find((s) => s.id === state.selected) ?? stops[0]

  function patchStop(id: number, next: Partial<Stop>) {
    update({ stops: state.stops.map((s) => (s.id === id ? { ...s, ...next } : s)) })
  }

  const name = safeName(state.name)
  const loops = isLooping(state)

  /*
    A select whose value is not among its options renders blank, and silently
    rewriting the curve to one that is would change the animation behind the
    visitor's back. So the list absorbs whatever the state holds instead —
    which covers a preset opened from the gallery and a preset saved off the
    account before this list was trimmed.
  */
  const easingOptions = React.useMemo(
    () => (EASINGS.includes(state.easing) ? EASINGS : [...EASINGS, state.easing]),
    [state.easing],
  )

  /*
    Every emitter below comes from `lib/keyframes-css.ts` rather than living
    here, because /tools/motion emits the same CSS for the same model and two
    copies of "which reduced-motion guard does this need" is exactly the pair
    that drifts. The guard split — stop a loop outright, collapse a one-shot
    so it still lands on its final frame — is documented there.
  */
  const cssBlock = buildAnimationCss(state.name, state)

  /* Preview -------------------------------------------------------------- */

  /*
    The animation is injected as a real stylesheet rather than applied as
    inline styles, because inline styles cannot express keyframes at all —
    and injecting exactly the CSS shown in the copy box means the preview
    is the output rather than a re-implementation of it that can drift.
  */
  const previewCss = `${keyframesBlock(name, state.stops)}\n.kf-preview-target { animation: ${name} ${animationShorthand(state)}; }`

  return (
    <ToolLayout
      name="CSS Keyframes Editor"
      tagline="Author a multi-stop animation on a timeline and copy it with its reduced-motion guard already written"
      icon={<Clapperboard className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {/*
            Starting points, not a second gallery.

            An empty timeline is a worse first screen than a nearly-right one,
            and the animations worth starting from already exist next door.
            These are those, loaded whole — the same data /tools/motion shows,
            so nothing is approximated on the way in.
          */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Sparkles aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
                Start from
              </Label>
              <Link
                href="/tools/motion"
                className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                See them animated →
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => loadPreset(preset.id)}
                  title={preset.blurb}
                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {preset.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  tool.reset()
                  setRunId((n) => n + 1)
                }}
                className="rounded-lg border border-dashed border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Reset
              </button>
            </div>
            <p className="mt-2.5 text-[11px] leading-snug text-muted-foreground">
              Loading one replaces the timeline. Two of the presets over there
              are not on this list — they animate things a pixel timeline
              cannot express, and that page says which and why.
            </p>
          </div>

          {/* The stage */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex min-h-[300px] items-center justify-center overflow-hidden rounded-t-xl bg-gradient-to-br from-muted/50 to-muted/10 p-8">
              {!reduced ? <style>{previewCss}</style> : null}
              <div
                key={runId}
                className={cn(
                  'kf-preview-target flex items-center justify-center',
                  state.shape === 'card' &&
                    'h-28 w-48 rounded-xl border border-primary/40 bg-primary/15 text-sm font-semibold text-primary shadow-lg',
                  state.shape === 'dot' &&
                    'h-16 w-16 rounded-full bg-gradient-to-br from-primary to-emerald-500 shadow-lg',
                  state.shape === 'text' && 'text-3xl font-extrabold tracking-tight',
                )}
              >
                {state.shape === 'card' ? name : null}
                {state.shape === 'text' ? 'Hoverlab' : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border/60 px-4 py-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setRunId((n) => n + 1)}
              >
                <Play className="h-3.5 w-3.5" /> Replay
              </Button>

              <div className="ml-auto flex items-center gap-2">
                <Switch
                  id="kf-reduced"
                  checked={reduced}
                  onCheckedChange={setReduced}
                  aria-label="Simulate reduced motion"
                />
                <Label htmlFor="kf-reduced" className="text-xs text-muted-foreground">
                  Simulate reduced motion
                </Label>
              </div>
            </div>
          </div>

          {/* The timeline. Stops sit on a rail at their percentage — the one
              view that shows spacing, which is the thing a list of numbers
              cannot show. */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Label className="text-sm font-medium">Timeline</Label>
              <span className="text-[11px] text-muted-foreground">
                {stops.length} stops · {state.duration}ms
              </span>
            </div>

            <div className="relative h-14 rounded-lg border border-border/60 bg-muted/20">
              <div
                aria-hidden
                className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-border"
              />
              {stops.map((stop) => (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => update({ selected: stop.id })}
                  aria-pressed={stop.id === selected?.id}
                  aria-label={`Stop at ${round(stop.at)} percent`}
                  style={{ left: `calc(12px + ${stop.at}% * (100% - 24px) / 100%)` }}
                  className={cn(
                    'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border px-1.5 py-1 font-mono text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    stop.id === selected?.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  {Math.round(stop.at)}%
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                disabled={stops.length >= 10}
                onClick={() => {
                  /*
                    A new stop lands in the widest gap rather than at a
                    fixed percentage, so repeated clicks subdivide the
                    timeline instead of stacking stops on top of each other.
                  */
                  let at = 50
                  let widest = -1
                  for (let i = 0; i < stops.length - 1; i++) {
                    const span = stops[i + 1].at - stops[i].at
                    if (span > widest) {
                      widest = span
                      at = stops[i].at + span / 2
                    }
                  }
                  const id = Math.max(0, ...state.stops.map((s) => s.id)) + 1
                  update({
                    stops: [...state.stops, { id, at: Math.round(at), ...NEUTRAL }],
                    selected: id,
                  })
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add stop
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-muted-foreground"
                // Two stops is an animation. One is a static rule.
                disabled={stops.length <= 2 || !selected}
                onClick={() => {
                  if (!selected) return
                  const rest = state.stops.filter((s) => s.id !== selected.id)
                  update({ stops: rest, selected: rest[0]?.id ?? 1 })
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove stop
              </Button>
            </div>
          </div>

          <CopyCssCard code={cssBlock} title="CSS" language="css" />
          <CopyCssCard
            code={`<div class="${name}">…</div>`}
            title="HTML"
            language="html"
          />

          <UseInCatalog tool={TOOL} />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          {selected ? (
            <div className="space-y-4 rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <Label className="block text-sm font-medium">
                  Stop at {Math.round(selected.at)}%
                </Label>
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  onClick={() => patchStop(selected.id, NEUTRAL)}
                >
                  Reset to neutral
                </button>
              </div>

              <SliderField
                label="Position"
                description="Where on the timeline this frame sits, as a percentage of the duration. Two stops close together make a fast move with a pause either side — that is how you get a snap rather than a drift."
                value={selected.at}
                min={0}
                max={100}
                step={1}
                display={`${Math.round(selected.at)}%`}
                onChange={(v) => patchStop(selected.id, { at: v })}
              />
              <SliderField
                label="Opacity"
                description="100% is fully opaque. Fading from 0 is the cheapest enter animation there is, and the one that survives reduced motion best."
                value={selected.opacity}
                min={0}
                max={100}
                step={1}
                display={`${Math.round(selected.opacity)}%`}
                onChange={(v) => patchStop(selected.id, { opacity: v })}
              />
              <SliderField
                label="Translate X"
                description="Horizontal offset. Transforms are composited on the GPU and never trigger layout, which is why animating this instead of `left` is the difference between 60fps and jank."
                value={selected.x}
                min={-200}
                max={200}
                step={1}
                display={`${selected.x}px`}
                onChange={(v) => patchStop(selected.id, { x: v })}
              />
              <SliderField
                label="Translate Y"
                description="Vertical offset. A rise of 8–24px is the standard enter; more than that and the element reads as flying in rather than settling."
                value={selected.y}
                min={-200}
                max={200}
                step={1}
                display={`${selected.y}px`}
                onChange={(v) => patchStop(selected.id, { y: v })}
              />
              <SliderField
                label="Scale"
                description="100% is untouched. Small scales read as depth; below about 90% on an enter it starts to look like a zoom rather than an arrival."
                value={selected.scale}
                min={0}
                max={200}
                step={1}
                display={`${Math.round(selected.scale)}%`}
                onChange={(v) => patchStop(selected.id, { scale: v })}
              />
              <SliderField
                label="Rotate"
                description="Applied after the translate and before the scale, because CSS resolves a transform list right to left and reordering it silently changes the result."
                value={selected.rotate}
                min={-360}
                max={360}
                step={1}
                display={`${selected.rotate}°`}
                onChange={(v) => patchStop(selected.id, { rotate: v })}
              />
              <SliderField
                label="Blur"
                description="The one property here that is not free — filter forces a repaint every frame. Effective in small doses on a single element, expensive across a list."
                value={selected.blur}
                min={0}
                max={20}
                step={0.5}
                display={`${selected.blur}px`}
                onChange={(v) => patchStop(selected.id, { blur: v })}
              />
            </div>
          ) : null}

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Playback</Label>

            <div className="space-y-1.5">
              <Label htmlFor="kf-name" className="text-xs font-semibold">
                Name
              </Label>
              <input
                id="kf-name"
                value={state.name}
                onChange={(e) => update({ name: e.target.value })}
                className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-[11px] leading-snug text-muted-foreground">
                Used for both the <code className="font-mono">@keyframes</code> and the
                class. Emitted as{' '}
                <code className="font-mono">{name}</code> — spaces and anything else
                invalid in a CSS identifier are folded to hyphens.
              </p>
            </div>

            <SliderField
              label="Duration"
              description="Under about 150ms an animation reads as a jump; over about 500ms it reads as a wait. Enter and exit want the short end; attention loops can afford the long one."
              value={state.duration}
              min={50}
              max={3000}
              step={10}
              display={`${state.duration}ms`}
              onChange={(v) => update({ duration: v })}
            />
            <SliderField
              label="Delay"
              description="Held before the first frame. Staggering a list by 40–60ms per item is what makes a group arrive as a group rather than a stampede."
              value={state.delay}
              min={0}
              max={2000}
              step={10}
              display={`${state.delay}ms`}
              onChange={(v) => update({ delay: v })}
            />

            <div className="space-y-1.5">
              <Label htmlFor="kf-easing" className="font-mono text-xs font-semibold">
                animation-timing-function
              </Label>
              <Select value={state.easing} onValueChange={(v) => update({ easing: v })}>
                <SelectTrigger id="kf-easing" aria-label="Timing function">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {easingOptions.map((easing) => (
                    <SelectItem key={easing} value={easing} className="font-mono text-xs">
                      {easing}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Applies between every pair of stops, not once across the whole
                animation. Want a different curve on one segment? Add a stop.
              </p>
            </div>

            <SliderField
              label="Iterations"
              description="How many times it runs. Zero here means infinite — and an infinite animation gets the stricter reduced-motion guard, because a loop shortened to a millisecond is a loop running very fast forever."
              value={state.iterations}
              min={0}
              max={10}
              step={1}
              display={loops ? 'infinite' : String(state.iterations)}
              onChange={(v) => update({ iterations: v })}
            />

            <div className="space-y-1.5">
              <Label htmlFor="kf-direction" className="font-mono text-xs font-semibold">
                animation-direction
              </Label>
              <Select
                value={state.direction}
                onValueChange={(v) => update({ direction: v as Direction })}
              >
                <SelectTrigger id="kf-direction" aria-label="Direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">normal</SelectItem>
                  <SelectItem value="reverse">reverse</SelectItem>
                  <SelectItem value="alternate">alternate — there and back</SelectItem>
                  <SelectItem value="alternate-reverse">alternate-reverse</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-snug text-muted-foreground">
                <code className="font-mono">alternate</code> is how a pulse is written
                once instead of twice — you author half the movement and let the
                return trip come free.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="kf-fill" className="font-mono text-xs font-semibold">
                animation-fill-mode
              </Label>
              <Select value={state.fill} onValueChange={(v) => update({ fill: v as Fill })}>
                <SelectTrigger id="kf-fill" aria-label="Fill mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">none</SelectItem>
                  <SelectItem value="forwards">forwards — hold the last frame</SelectItem>
                  <SelectItem value="backwards">backwards — hold the first</SelectItem>
                  <SelectItem value="both">both</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-snug text-muted-foreground">
                The reason an enter animation snaps back at the end:{' '}
                <code className="font-mono">none</code> drops the animated values the
                instant it finishes. <code className="font-mono">both</code> is the
                safe default for anything that arrives and stays.
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Preview subject</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['card', 'Card'],
                  ['dot', 'Dot'],
                  ['text', 'Text'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ shape: value })}
                  aria-pressed={state.shape === value}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    state.shape === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <ToggleField
              label="Loop the preview"
              description="Shortcut for setting iterations to infinite. Useful while you are shaping the curve and wrong for almost anything you ship — an animation that never stops is an animation nobody can read past."
              checked={loops}
              onChange={(v) => update({ iterations: v ? 0 : 1 })}
            />
          </div>

          <ToolPresetsBar tool={tool} noun="animation" />
        </div>
      </div>
    </ToolLayout>
  )
}
