'use client'

/**
 * Glassmorphism Generator.
 *
 * Tunes backdrop-blur + background opacity + border + saturation + shadow
 * + inner highlight to produce a frosted-glass card. Preview sits over a
 * colorful gradient background so the blur is visible. Output includes
 * the `-webkit-backdrop-filter` fallback and a graceful @supports rule
 * for browsers without backdrop-filter support.
 */

import * as React from 'react'
import { Wine, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SliderField, ToggleField } from '@/components/control-field'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { randomHex } from '@/lib/color-tools'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'hoverlab:tool:glassmorphism'

// The value is rendered as an inline style, so only bare gradient functions
// are accepted — url(...) and anything that could smuggle extra declarations
// is refused.
function safeGradient(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  if (!/^(linear|radial|conic)-gradient\(/i.test(v)) return null
  if (/url\s*\(/i.test(v) || /[;{}<>]/.test(v)) return null
  return v
}

interface GlassState {
  blur: number // px
  bgOpacity: number // 0-1
  bgColor: string
  saturation: number // %
  brightness: number // %
  borderColor: string
  borderOpacity: number // 0-1
  borderWidth: number // px
  shadowOpacity: number // 0-1
  shadowBlur: number // px
  shadowY: number // px
  innerHighlight: boolean
  // background scene
  bgGradient1: string
  bgGradient2: string
  bgGradient3: string
  /** Full background-image value handed off from the gradient tool; overrides the 3-stop scene. */
  customBg: string | null
  // card
  cardRadius: number
  cardWidth: number
  cardHeight: number
}

const DEFAULT_STATE: GlassState = {
  blur: 16,
  bgOpacity: 0.65,
  bgColor: '#ffffff',
  saturation: 180,
  brightness: 100,
  borderColor: '#ffffff',
  borderOpacity: 0.3,
  borderWidth: 1,
  shadowOpacity: 0.15,
  shadowBlur: 24,
  shadowY: 8,
  innerHighlight: true,
  bgGradient1: '#f43f5e',
  bgGradient2: '#8b5cf6',
  bgGradient3: '#06b6d4',
  customBg: null,
  cardRadius: 16,
  cardWidth: 320,
  cardHeight: 200,
}

export default function GlassmorphismToolPage() {
  const [state, setState] = React.useState<GlassState>(DEFAULT_STATE)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        // Stored customBg is re-validated — it feeds an inline style.
        parsed.customBg = safeGradient(parsed.customBg)
        setState((prev) => ({ ...prev, ...parsed }))
      }
    } catch {
      /* ignore */
    }

    // Handoff from the gradient tool: ?bg=<encoded background-image> wins
    // over the restored state. window.location rather than useSearchParams —
    // the hook would force a Suspense boundary around the whole page for one
    // optional param. Stripped after applying so a reload keeps later edits.
    const param = new URLSearchParams(window.location.search).get('bg')
    if (param !== null) {
      const gradient = safeGradient(param)
      if (gradient) setState((prev) => ({ ...prev, customBg: gradient }))
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const update = (patch: Partial<GlassState>) => setState((s) => ({ ...s, ...patch }))

  // Build CSS values.
  const bgRgba = React.useMemo(() => {
    const hex = state.bgColor.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${state.bgOpacity.toFixed(2)})`
  }, [state.bgColor, state.bgOpacity])

  const borderRgba = React.useMemo(() => {
    const hex = state.borderColor.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${state.borderOpacity.toFixed(2)})`
  }, [state.borderColor, state.borderOpacity])

  const shadow = React.useMemo(() => {
    return `0 ${state.shadowY}px ${state.shadowBlur}px rgba(0, 0, 0, ${state.shadowOpacity.toFixed(2)})`
  }, [state.shadowY, state.shadowBlur, state.shadowOpacity])

  const filterValue = `blur(${state.blur}px) saturate(${state.saturation}%) brightness(${state.brightness}%)`

  const cardStyle: React.CSSProperties = React.useMemo(
    () => ({
      width: state.cardWidth,
      height: state.cardHeight,
      borderRadius: state.cardRadius,
      background: bgRgba,
      backdropFilter: filterValue,
      WebkitBackdropFilter: filterValue,
      border: `${state.borderWidth}px solid ${borderRgba}`,
      boxShadow: `${shadow}${state.innerHighlight ? ', inset 0 1px 0 0 rgba(255, 255, 255, 0.4)' : ''}`,
    }),
    [state, bgRgba, borderRgba, shadow, filterValue],
  )

  const cssBlock = React.useMemo(() => {
    return `.glass {
  background: ${bgRgba};
  backdrop-filter: ${filterValue};
  -webkit-backdrop-filter: ${filterValue};
  border: ${state.borderWidth}px solid ${borderRgba};
  border-radius: ${state.cardRadius}px;
  box-shadow: ${shadow}${state.innerHighlight ? ', inset 0 1px 0 0 rgba(255, 255, 255, 0.4)' : ''};
}

/* Fallback for browsers without backdrop-filter support */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass {
    background: ${state.bgColor};
  }
}`
  }, [bgRgba, filterValue, borderRgba, state, shadow])

  const randomizeBackground = () => {
    update({
      bgGradient1: randomHex(),
      bgGradient2: randomHex(),
      bgGradient3: randomHex(),
      customBg: null,
    })
  }

  return (
    <ToolLayout
      name="Glassmorphism Generator"
      tagline="Frosted-glass cards with backdrop-blur"
      icon={<Wine className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Preview */}
        <div className="space-y-4">
          <div
            className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-xl border border-border p-8"
            style={{
              background:
                state.customBg ??
                `linear-gradient(135deg, ${state.bgGradient1}, ${state.bgGradient2}, ${state.bgGradient3})`,
            }}
          >
            {/* Decorative shapes for visible blur — their colours belong to the
                3-stop scene, so they hide under a handed-off gradient */}
            {!state.customBg && (
              <>
                <div
                  className="absolute -left-12 top-8 h-40 w-40 rounded-full opacity-70"
                  style={{ background: state.bgGradient1, filter: 'blur(8px)' }}
                />
                <div
                  className="absolute -right-8 bottom-12 h-32 w-32 rounded-full opacity-70"
                  style={{ background: state.bgGradient3, filter: 'blur(8px)' }}
                />
                <div
                  className="absolute right-1/3 top-4 h-24 w-24 rotate-12 opacity-60"
                  style={{ background: state.bgGradient2, filter: 'blur(6px)' }}
                />
              </>
            )}

            {/* The glass card */}
            <div style={cardStyle} className="relative z-10 flex flex-col items-center justify-center gap-2 p-6">
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">Glass card</div>
              <div className="text-xs text-zinc-700 dark:text-zinc-200">
                backdrop-filter: blur({state.blur}px)
              </div>
            </div>
          </div>

          {/* Background scene controls */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm font-medium">Background scene</Label>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={randomizeBackground}
              >
                <Shuffle className="h-3 w-3" /> Random
              </Button>
            </div>
            {state.customBg && (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2">
                <span className="truncate font-mono text-[10px] text-muted-foreground">
                  {state.customBg}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 shrink-0 text-xs"
                  onClick={() => update({ customBg: null })}
                >
                  Clear
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2">
              {(['bgGradient1', 'bgGradient2', 'bgGradient3'] as const).map((key) => (
                <div key={key} className="flex flex-1 flex-col gap-1">
                  <input
                    type="color"
                    value={state[key]}
                    onChange={(e) => update({ [key]: e.target.value, customBg: null })}
                    className="h-10 w-full cursor-pointer rounded border border-border bg-transparent"
                    aria-label={`Gradient ${key.slice(-1)}`}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">{state[key]}</span>
                </div>
              ))}
            </div>
          </div>

          <CopyCssCard code={cssBlock} title="CSS" language="css" />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          {/* Backdrop filter */}
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Backdrop filter</Label>
            <SliderField
              label="Blur"
              description="How far the backdrop is smeared behind the card. This is the whole effect — at 0 the glass is only a tinted rectangle."
              value={state.blur}
              min={0}
              max={40}
              step={0.5}
              display={`${state.blur}px`}
              onChange={(v) => update({ blur: v })}
            />
            <SliderField
              label="Saturation"
              description="Pushes colour back into the blurred backdrop. Blurring averages colours toward grey, so convincing frosted glass usually sits above 100%."
              value={state.saturation}
              min={100}
              max={300}
              step={5}
              display={`${state.saturation}%`}
              onChange={(v) => update({ saturation: v })}
            />
            <SliderField
              label="Brightness"
              description="Lightens or darkens whatever shows through. Drop it when the glass sits on a pale background and the text on top starts losing contrast."
              value={state.brightness}
              min={50}
              max={150}
              step={5}
              display={`${state.brightness}%`}
              onChange={(v) => update({ brightness: v })}
            />
          </div>

          {/* Background */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Glass background</Label>
            <div className="mb-3 flex items-center gap-3">
              <input
                type="color"
                value={state.bgColor}
                onChange={(e) => update({ bgColor: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded border border-border bg-transparent"
              />
              <Input
                value={state.bgColor}
                onChange={(e) => update({ bgColor: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
            <SliderField
              label="Tint opacity"
              description="How much of the glass colour sits over the blur. Past about 0.3 it stops reading as glass and starts reading as a solid panel."
              value={state.bgOpacity}
              min={0}
              max={1}
              step={0.01}
              display={state.bgOpacity.toFixed(2)}
              onChange={(v) => update({ bgOpacity: v })}
            />
          </div>

          {/* Border */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Border</Label>
            <div className="mb-3 flex items-center gap-3">
              <input
                type="color"
                value={state.borderColor}
                onChange={(e) => update({ borderColor: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded border border-border bg-transparent"
              />
              <Input
                value={state.borderColor}
                onChange={(e) => update({ borderColor: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
            <SliderField
              label="Border width"
              description="A hairline edge is what separates the panel from the page. 1px is usually enough; thicker starts to look like a frame rather than an edge."
              value={state.borderWidth}
              min={0}
              max={4}
              step={0.5}
              display={`${state.borderWidth}px`}
              onChange={(v) => update({ borderWidth: v })}
            />
            <SliderField
              label="Border opacity"
              description="How visible that edge is. Real glass catches light unevenly, so a semi-transparent white border reads better than a solid one."
              value={state.borderOpacity}
              min={0}
              max={1}
              step={0.01}
              display={state.borderOpacity.toFixed(2)}
              onChange={(v) => update({ borderOpacity: v })}
            />
          </div>

          {/* Shadow */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Shadow</Label>
            <SliderField
              label="Y offset"
              description="How far the shadow drops below the card. This is what sets the apparent height of the panel above the page."
              value={state.shadowY}
              min={0}
              max={40}
              step={1}
              display={`${state.shadowY}px`}
              onChange={(v) => update({ shadowY: v })}
            />
            <SliderField
              label="Shadow blur"
              description="Softness of the shadow edge. Keep it larger than the Y offset — a shadow tighter than its drop reads as a hard outline."
              value={state.shadowBlur}
              min={0}
              max={80}
              step={1}
              display={`${state.shadowBlur}px`}
              onChange={(v) => update({ shadowBlur: v })}
            />
            <SliderField
              label="Shadow opacity"
              description="Strength of the shadow. Glass sits close to the surface, so this wants to stay low — heavy shadows make it look like plastic."
              value={state.shadowOpacity}
              min={0}
              max={0.6}
              step={0.01}
              display={state.shadowOpacity.toFixed(2)}
              onChange={(v) => update({ shadowOpacity: v })}
            />
            <ToggleField
              label="Inner highlight"
              description="Adds a bright inset line along the top edge, the way light catches the lip of a real pane. It is the cheapest thing here and does the most."
              checked={state.innerHighlight}
              onChange={(v) => update({ innerHighlight: v })}
            />
          </div>

          {/* Card dimensions */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Card</Label>
            <SliderField
              label="Corner radius"
              description="Rounding on the panel itself. Larger radii read as softer and more physical; 0 gives you a sheet of glass cut square."
              value={state.cardRadius}
              min={0}
              max={40}
              step={1}
              display={`${state.cardRadius}px`}
              onChange={(v) => update({ cardRadius: v })}
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}

