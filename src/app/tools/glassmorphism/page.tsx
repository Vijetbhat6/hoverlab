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
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { randomHex } from '@/lib/color-tools'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'hoverlab:tool:glassmorphism'

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
        setState((prev) => ({ ...prev, ...parsed }))
      }
    } catch {
      /* ignore */
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
              background: `linear-gradient(135deg, ${state.bgGradient1}, ${state.bgGradient2}, ${state.bgGradient3})`,
            }}
          >
            {/* Decorative shapes for visible blur */}
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
            <div className="flex items-center gap-2">
              {(['bgGradient1', 'bgGradient2', 'bgGradient3'] as const).map((key) => (
                <div key={key} className="flex flex-1 flex-col gap-1">
                  <input
                    type="color"
                    value={state[key]}
                    onChange={(e) => update({ [key]: e.target.value })}
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
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Backdrop filter</Label>
            <SliderRow
              label="Blur"
              value={state.blur}
              min={0}
              max={40}
              step={0.5}
              display={`${state.blur}px`}
              onChange={(v) => update({ blur: v })}
            />
            <div className="mt-3">
              <SliderRow
                label="Saturation"
                value={state.saturation}
                min={100}
                max={300}
                step={5}
                display={`${state.saturation}%`}
                onChange={(v) => update({ saturation: v })}
              />
            </div>
            <div className="mt-3">
              <SliderRow
                label="Brightness"
                value={state.brightness}
                min={50}
                max={150}
                step={5}
                display={`${state.brightness}%`}
                onChange={(v) => update({ brightness: v })}
              />
            </div>
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
            <SliderRow
              label="Opacity"
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
            <SliderRow
              label="Width"
              value={state.borderWidth}
              min={0}
              max={4}
              step={0.5}
              display={`${state.borderWidth}px`}
              onChange={(v) => update({ borderWidth: v })}
            />
            <div className="mt-3">
              <SliderRow
                label="Opacity"
                value={state.borderOpacity}
                min={0}
                max={1}
                step={0.01}
                display={state.borderOpacity.toFixed(2)}
                onChange={(v) => update({ borderOpacity: v })}
              />
            </div>
          </div>

          {/* Shadow */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Shadow</Label>
            <SliderRow
              label="Y offset"
              value={state.shadowY}
              min={0}
              max={40}
              step={1}
              display={`${state.shadowY}px`}
              onChange={(v) => update({ shadowY: v })}
            />
            <div className="mt-3">
              <SliderRow
                label="Blur"
                value={state.shadowBlur}
                min={0}
                max={80}
                step={1}
                display={`${state.shadowBlur}px`}
                onChange={(v) => update({ shadowBlur: v })}
              />
            </div>
            <div className="mt-3">
              <SliderRow
                label="Opacity"
                value={state.shadowOpacity}
                min={0}
                max={0.6}
                step={0.01}
                display={state.shadowOpacity.toFixed(2)}
                onChange={(v) => update({ shadowOpacity: v })}
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Inner highlight (top edge)</Label>
              <Switch
                checked={state.innerHighlight}
                onCheckedChange={(v) => update({ innerHighlight: v })}
              />
            </div>
          </div>

          {/* Card dimensions */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Card</Label>
            <SliderRow
              label="Radius"
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

/* ============================================================
 *  Slider row helper
 * ========================================================== */

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
}

function SliderRow({ label, value, min, max, step, display, onChange }: SliderRowProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-xs tabular-nums">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(arr) => onChange(arr[0])}
      />
    </div>
  )
}
