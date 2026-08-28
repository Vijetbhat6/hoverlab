'use client'

/**
 * 3D Transform Playground.
 *
 * The 2D half of `transform` is guessable — translate moves, rotate turns,
 * scale resizes. The 3D half is not, and the reason is that three separate
 * properties have to agree before anything looks right, and two of them
 * live on a different element from the one you are transforming:
 *
 *   `perspective` goes on the PARENT. Setting it on the element itself is
 *   the single most common mistake here, and it silently produces a flat
 *   projection — the rotation happens, it just looks like a squash.
 *
 *   `transform-style: preserve-3d` also goes on the parent, and without it
 *   children are flattened into their parent's plane, which is why a card
 *   flip built from two stacked faces shows both sides at once.
 *
 *   `backface-visibility` is what hides the reverse of a face once it has
 *   turned away, and it is the last piece of the flip.
 *
 * So this is a playground with the parent's properties as first-class
 * controls rather than footnotes, plus a card-flip demo, because a flip is
 * the thing people are almost always actually trying to build when they
 * arrive at rotateY.
 */

import * as React from 'react'
import { Box, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SliderField, ToggleField } from '@/components/control-field'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { useToolState } from '@/hooks/use-tool-state'
import { cn } from '@/lib/utils'

const TOOL = '/tools/transform'

interface TransformState {
  /** On the parent, in px. Lower is a wider lens and a stronger effect. */
  perspective: number
  perspectiveOriginX: number
  perspectiveOriginY: number
  preserve3d: boolean
  rotateX: number
  rotateY: number
  rotateZ: number
  translateX: number
  translateY: number
  translateZ: number
  scale: number
  skewX: number
  skewY: number
  originX: number
  originY: number
  backfaceHidden: boolean
  /** Swap the single face for a two-sided card that turns on hover. */
  flipDemo: boolean
}

const DEFAULT_STATE: TransformState = {
  perspective: 800,
  perspectiveOriginX: 50,
  perspectiveOriginY: 50,
  preserve3d: true,
  rotateX: -12,
  rotateY: 24,
  rotateZ: 0,
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  scale: 100,
  skewX: 0,
  skewY: 0,
  originX: 50,
  originY: 50,
  backfaceHidden: true,
  flipDemo: false,
}

const round = (n: number) => Math.round(n * 100) / 100

/**
 * The transform list, in the order the browser resolves it.
 *
 * CSS applies a transform list right-to-left, so this order is load-bearing:
 * translate first means the rotation happens around the moved position,
 * which is what people expect. Reordering it would silently change every
 * result the tool has ever produced.
 */
function transformCss(s: TransformState): string {
  const parts: string[] = []
  if (s.translateX || s.translateY)
    parts.push(`translate(${s.translateX}px, ${s.translateY}px)`)
  if (s.translateZ) parts.push(`translateZ(${s.translateZ}px)`)
  if (s.rotateX) parts.push(`rotateX(${s.rotateX}deg)`)
  if (s.rotateY) parts.push(`rotateY(${s.rotateY}deg)`)
  if (s.rotateZ) parts.push(`rotateZ(${s.rotateZ}deg)`)
  if (s.skewX || s.skewY) parts.push(`skew(${s.skewX}deg, ${s.skewY}deg)`)
  if (s.scale !== 100) parts.push(`scale(${round(s.scale / 100)})`)
  return parts.join(' ') || 'none'
}

export default function TransformToolPage() {
  const tool = useToolState<TransformState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const update = (patch: Partial<TransformState>) => setState((s) => ({ ...s, ...patch }))

  const transform = transformCss(state)
  const originDefault = state.originX === 50 && state.originY === 50

  const parentCss = `/* On the PARENT — this is the part that catches everyone out.
   perspective on the transformed element itself does nothing useful. */
.scene {
  perspective: ${state.perspective}px;${
    state.perspectiveOriginX !== 50 || state.perspectiveOriginY !== 50
      ? `\n  perspective-origin: ${state.perspectiveOriginX}% ${state.perspectiveOriginY}%;`
      : ''
  }${state.preserve3d ? '\n  transform-style: preserve-3d;' : ''}
}`

  const childCss = `.card {
  transform: ${transform};${originDefault ? '' : `\n  transform-origin: ${state.originX}% ${state.originY}%;`}${
    state.backfaceHidden ? '\n  backface-visibility: hidden;' : ''
  }
}`

  const flipCss = `/* A card flip, which is what rotateY is usually for.
   Both faces are stacked; preserve-3d keeps them in space and
   backface-visibility hides whichever one has turned away. */
.flip {
  perspective: ${state.perspective}px;
}

.flip-inner {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

.flip:hover .flip-inner,
.flip:focus-within .flip-inner {
  transform: rotateY(180deg);
}

.flip-front,
.flip-back {
  backface-visibility: hidden;
}

.flip-back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .flip-inner { transition-duration: 0.01ms; }
}`

  const cssBlock = state.flipDemo ? flipCss : `${parentCss}\n\n${childCss}`

  return (
    <ToolLayout
      name="3D Transform & Perspective Playground"
      tagline="rotateX, rotateY and the three parent properties that have to agree before any of it looks right"
      icon={<Box className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {/* The scene. The dashed frame is the parent that carries the
              perspective — without seeing it, "on the parent" is just a
              sentence. */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div
              className="relative flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-gradient-to-br from-muted/40 to-muted/10 p-8"
              style={{
                perspective: `${state.perspective}px`,
                perspectiveOrigin: `${state.perspectiveOriginX}% ${state.perspectiveOriginY}%`,
                transformStyle: state.preserve3d ? 'preserve-3d' : 'flat',
              }}
            >
              <span className="absolute left-3 top-2 font-mono text-[10px] text-muted-foreground">
                .scene — perspective: {state.perspective}px
              </span>

              {state.flipDemo ? (
                <FlipCard perspective={state.perspective} />
              ) : (
                <div
                  style={{
                    transform,
                    transformOrigin: `${state.originX}% ${state.originY}%`,
                    backfaceVisibility: state.backfaceHidden ? 'hidden' : 'visible',
                  }}
                  className="flex h-44 w-64 flex-col items-center justify-center rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/25 to-emerald-500/20 shadow-2xl"
                >
                  <span className="text-sm font-bold">.card</span>
                  <span className="mt-1 max-w-[85%] text-center font-mono text-[10px] leading-relaxed text-muted-foreground">
                    {transform}
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {state.flipDemo
              ? 'Hover or tab to the card to flip it. Two faces stacked in the same place, kept in 3D space by preserve-3d on their wrapper, with backface-visibility hiding whichever has turned away.'
              : 'Perspective is the distance from the viewer to the z=0 plane. Small numbers are a wide-angle lens — dramatic, distorted; large numbers flatten towards an isometric projection.'}
          </p>

          <CopyCssCard code={cssBlock} title="CSS" language="css" />
          <CopyCssCard
            code={
              state.flipDemo
                ? `<div class="flip" tabindex="0">
  <div class="flip-inner">
    <div class="flip-front">Front</div>
    <div class="flip-back">Back</div>
  </div>
</div>`
                : `<div class="scene">
  <div class="card">…</div>
</div>`
            }
            title="HTML"
            language="html"
          />

          <UseInCatalog tool={TOOL} />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">The scene (on the parent)</Label>
            <SliderField
              label="perspective"
              description="How far the viewer is from the z=0 plane. This is the property that has to live on the parent — set it on the element you are rotating and you get a flat squash instead of depth. Under about 400px it reads as a fisheye; over about 1500px it barely reads at all."
              value={state.perspective}
              min={100}
              max={2500}
              step={20}
              display={`${state.perspective}px`}
              onChange={(v) => update({ perspective: v })}
            />
            <SliderField
              label="perspective-origin X"
              description="Where the viewer is standing, horizontally. Moving it off centre is how you get a scene that looks lit and composed rather than photographed head-on."
              value={state.perspectiveOriginX}
              min={0}
              max={100}
              step={1}
              display={`${state.perspectiveOriginX}%`}
              onChange={(v) => update({ perspectiveOriginX: v })}
            />
            <SliderField
              label="perspective-origin Y"
              description="The same, vertically. Below 50% you are looking down at the scene; above, up at it."
              value={state.perspectiveOriginY}
              min={0}
              max={100}
              step={1}
              display={`${state.perspectiveOriginY}%`}
              onChange={(v) => update({ perspectiveOriginY: v })}
            />
            <ToggleField
              label="transform-style: preserve-3d"
              description="Keeps children in the same 3D space as their parent. Off — the default, `flat` — every child is projected onto the parent's plane first, which is exactly why a card flip built from two faces shows both of them at once."
              checked={state.preserve3d}
              onChange={(v) => update({ preserve3d: v })}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <Label className="block text-sm font-medium">Rotation</Label>
              <button
                type="button"
                className="flex items-center gap-1 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => update({ rotateX: 0, rotateY: 0, rotateZ: 0 })}
              >
                <RotateCcw aria-hidden className="h-3 w-3" /> Face on
              </button>
            </div>
            <SliderField
              label="rotateX"
              description="Tips the element towards or away from you, around the horizontal axis. Small negative values — the top leaning back — are the standard product-shot angle."
              value={state.rotateX}
              min={-180}
              max={180}
              step={1}
              display={`${state.rotateX}deg`}
              onChange={(v) => update({ rotateX: v })}
            />
            <SliderField
              label="rotateY"
              description="Turns it around the vertical axis. At exactly 180 you are looking at the back, which is where backface-visibility starts to matter."
              value={state.rotateY}
              min={-180}
              max={180}
              step={1}
              display={`${state.rotateY}deg`}
              onChange={(v) => update({ rotateY: v })}
            />
            <SliderField
              label="rotateZ"
              description="A flat spin in the plane of the screen — the same thing plain `rotate` does. No perspective is involved, so this one looks identical whatever the scene is set to."
              value={state.rotateZ}
              min={-180}
              max={180}
              step={1}
              display={`${state.rotateZ}deg`}
              onChange={(v) => update({ rotateZ: v })}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Position and shape</Label>
            <SliderField
              label="translateZ"
              description="Moves the element towards the viewer or away. This is the one that needs perspective to do anything visible at all — with no perspective on the parent it is a no-op, which is the fastest way to confirm the scene is set up correctly."
              value={state.translateZ}
              min={-400}
              max={400}
              step={5}
              display={`${state.translateZ}px`}
              onChange={(v) => update({ translateZ: v })}
            />
            <SliderField
              label="translateX"
              description="Horizontal move, applied before the rotations so the element turns around where it ended up."
              value={state.translateX}
              min={-200}
              max={200}
              step={1}
              display={`${state.translateX}px`}
              onChange={(v) => update({ translateX: v })}
            />
            <SliderField
              label="translateY"
              description="Vertical move."
              value={state.translateY}
              min={-200}
              max={200}
              step={1}
              display={`${state.translateY}px`}
              onChange={(v) => update({ translateY: v })}
            />
            <SliderField
              label="scale"
              description="Uniform resize. Applied last in the list, so it scales the already-rotated result rather than the original box."
              value={state.scale}
              min={10}
              max={200}
              step={1}
              display={`${round(state.scale / 100)}`}
              onChange={(v) => update({ scale: v })}
            />
            <SliderField
              label="skewX"
              description="Shears horizontally. Genuinely 2D — no amount of perspective makes a skew look three-dimensional, which is worth knowing before you spend an afternoon trying."
              value={state.skewX}
              min={-45}
              max={45}
              step={1}
              display={`${state.skewX}deg`}
              onChange={(v) => update({ skewX: v })}
            />
            <SliderField
              label="skewY"
              description="Shears vertically."
              value={state.skewY}
              min={-45}
              max={45}
              step={1}
              display={`${state.skewY}deg`}
              onChange={(v) => update({ skewY: v })}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Origin and backface</Label>
            <SliderField
              label="transform-origin X"
              description="The pivot, horizontally. Moving it to an edge is the difference between a card spinning in place and a door swinging open."
              value={state.originX}
              min={0}
              max={100}
              step={1}
              display={`${state.originX}%`}
              onChange={(v) => update({ originX: v })}
            />
            <SliderField
              label="transform-origin Y"
              description="The pivot, vertically. Bottom-centre is the hinge a dropdown wants; top-centre is the one a tooltip wants."
              value={state.originY}
              min={0}
              max={100}
              step={1}
              display={`${state.originY}%`}
              onChange={(v) => update({ originY: v })}
            />
            <ToggleField
              label="backface-visibility: hidden"
              description="Hides the element once it has turned more than 90° away. Set rotateY past 90 with this off to see the mirrored back — and then understand why every card flip on the web sets it."
              checked={state.backfaceHidden}
              onChange={(v) => update({ backfaceHidden: v })}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Card flip</Label>
            <ToggleField
              label="Show the flip instead"
              description="Swaps the single face for the two-sided card everyone is actually trying to build when they find rotateY. The copied CSS becomes the whole recipe — both faces, the transition, and the reduced-motion guard."
              checked={state.flipDemo}
              onChange={(v) => update({ flipDemo: v })}
            />
          </div>

          <ToolPresetsBar tool={tool} noun="transform" />
        </div>
      </div>
    </ToolLayout>
  )
}

/**
 * The flip, built the way the emitted CSS builds it.
 *
 * `focus-within` alongside hover, and a real `tabIndex`, because a card
 * whose only trigger is the mouse is a card a keyboard user can never see
 * the back of. The group-hover here is Tailwind's equivalent of the
 * `.flip:hover .flip-inner` selector in the output.
 */
function FlipCard({ perspective }: { perspective: number }) {
  return (
    <div
      tabIndex={0}
      className="group relative h-44 w-64 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
      style={{ perspective: `${perspective}px` }}
    >
      <div
        className={cn(
          'relative h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]',
          'group-hover:[transform:rotateY(180deg)] group-focus-visible:[transform:rotateY(180deg)]',
          'motion-reduce:transition-none',
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          style={{ backfaceVisibility: 'hidden' }}
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/25 to-emerald-500/20 shadow-2xl"
        >
          <span className="text-sm font-bold">Front</span>
          <span className="mt-1 text-[11px] text-muted-foreground">Hover or tab</span>
        </div>
        <div
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-500/25 to-fuchsia-500/20 shadow-2xl"
        >
          <span className="text-sm font-bold">Back</span>
          <span className="mt-1 text-[11px] text-muted-foreground">
            Pre-rotated 180°, so it lands facing you
          </span>
        </div>
      </div>
    </div>
  )
}
