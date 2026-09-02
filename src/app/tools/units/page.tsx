'use client'

/**
 * Unit Converter tool.
 *
 * Convert between px / rem / em / % / vw / vh in real time. Designer
 * sets the root font size (default 16px) and the viewport dimensions
 * (defaults 1440x900). Type any value in any unit and immediately see
 * the equivalent in every other unit. Click any output row to copy it.
 */

import * as React from 'react'
import { Ruler, Copy, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { ToolWorkbench } from '@/components/designer-tools/tool-workbench'
import { useToolState } from '@/hooks/use-tool-state'

const TOOL = '/tools/units'

type Unit = 'px' | 'rem' | 'em' | '%' | 'vw' | 'vh'

const UNITS: Unit[] = ['px', 'rem', 'em', '%', 'vw', 'vh']

const UNIT_LABELS: Record<Unit, string> = {
  px: 'Pixels',
  rem: 'Root em',
  em: 'Em (parent)',
  '%': 'Percent',
  vw: 'Viewport width',
  vh: 'Viewport height',
}

const UNIT_DESCRIPTIONS: Record<Unit, string> = {
  px: 'Absolute device pixels. Always the same physical size on a given screen.',
  rem: 'Relative to root font-size. 1rem = root font-size in px.',
  em: 'Relative to parent element font-size. Compounds when nested.',
  '%': 'Relative to parent element dimension (width for width, height for height).',
  vw: '1vw = 1% of viewport width. Changes when window is resized.',
  vh: '1vh = 1% of viewport height. Changes when window is resized.',
}

/**
 * The context, and the value being converted in it.
 *
 * These were two pieces of state persisted as `{ state, inputValue,
 * inputUnit }` — a nested blob that only this tool's own restore could
 * read. Flattened because a preset is one object, and because "16px at a
 * 1440 viewport" is one thing a person would name, not two.
 */
interface UnitsState {
  rootFontSize: number // px
  parentFontSize: number // px (for em)
  viewportWidth: number // px (for vw, %)
  viewportHeight: number // px (for vh)
  parentDimension: number // px (for % when used on width)
  inputValue: string
  inputUnit: Unit
}

const DEFAULT_STATE: UnitsState = {
  rootFontSize: 16,
  parentFontSize: 16,
  viewportWidth: 1440,
  viewportHeight: 900,
  parentDimension: 1200,
  inputValue: '16',
  inputUnit: 'px',
}

export default function UnitsToolPage() {
  // Working state stays local and ungated; named presets need an account.
  // See `use-tool-state.ts` for why the two layers are separate.
  const tool = useToolState<UnitsState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool
  const { inputValue, inputUnit } = state
  const setInputValue = (v: string) => setState((s) => ({ ...s, inputValue: v }))
  const setInputUnit = (u: Unit) => setState((s) => ({ ...s, inputUnit: u }))

  /*
    Drop the old nested blob's outer key, once.

    This tool used to persist `{ state, inputValue, inputUnit }`, so a
    returning visitor's stored JSON merges a stray `state` object into the
    flat shape above. It restores harmlessly — nothing reads it — but it
    would then be written back on every change and copied into every preset
    saved from this browser, which is how a schema stops being the schema.
    The two fields that were already top-level survive; the context numbers
    reset to defaults, which is a cheaper price than a migration for five
    numbers.
  */
  React.useEffect(() => {
    setState((s) => {
      if (!('state' in s)) return s
      const { state: _legacy, ...rest } = s as UnitsState & { state?: unknown }
      return rest as UnitsState
    })
  }, [setState])

  // Convert the input value to px first, then derive all other units.
  const conversions = React.useMemo(() => {
    const v = parseFloat(inputValue)
    if (Number.isNaN(v)) return null

    // Input → px
    let px: number
    switch (inputUnit) {
      case 'px': px = v; break
      case 'rem': px = v * state.rootFontSize; break
      case 'em': px = v * state.parentFontSize; break
      case '%': px = (v / 100) * state.parentDimension; break
      case 'vw': px = (v / 100) * state.viewportWidth; break
      case 'vh': px = (v / 100) * state.viewportHeight; break
    }

    return {
      px,
      rem: px / state.rootFontSize,
      em: px / state.parentFontSize,
      '%': state.parentDimension > 0 ? (px / state.parentDimension) * 100 : 0,
      vw: state.viewportWidth > 0 ? (px / state.viewportWidth) * 100 : 0,
      vh: state.viewportHeight > 0 ? (px / state.viewportHeight) * 100 : 0,
    }
  }, [inputValue, inputUnit, state])

  return (
    <ToolLayout
      name="Unit Converter"
      tagline="px · rem · em · % · vw · vh"
      icon={<Ruler className="h-5 w-5" />}
    >
      <ToolWorkbench controlsWidth="360px">
        {/* Converter */}
        <div className="space-y-4">
          {/* Input row */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-2 block text-sm font-medium">Input value</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="font-mono text-lg"
                step="any"
                aria-label="Input value"
              />
              <select
                value={inputUnit}
                onChange={(e) => setInputUnit(e.target.value as Unit)}
                className="w-28 rounded-md border border-border bg-background px-3 text-sm font-medium"
                aria-label="Input unit"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {UNIT_DESCRIPTIONS[inputUnit]}
            </p>
          </div>

          {/* Output rows */}
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border/60 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
              All conversions
            </div>
            <div>
              {UNITS.filter((u) => u !== inputUnit).map((unit) => (
                <OutputRow
                  key={unit}
                  unit={unit}
                  label={UNIT_LABELS[unit]}
                  description={UNIT_DESCRIPTIONS[unit]}
                  value={conversions ? conversions[unit] : null}
                />
              ))}
            </div>
          </div>

          {/* Quick reference */}
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs">
            <div className="mb-2 font-semibold">Quick reference</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
              <span>1rem = {state.rootFontSize}px</span>
              <span>1em = {state.parentFontSize}px</span>
              <span>1vw = {(state.viewportWidth / 100).toFixed(2)}px</span>
              <span>1vh = {(state.viewportHeight / 100).toFixed(2)}px</span>
              <span>100% = {state.parentDimension}px</span>
              <span>1px = {(1 / state.rootFontSize).toFixed(4)}rem</span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Reference values</Label>
            <div className="space-y-4">
              <SettingRow
                label="Root font-size"
                value={state.rootFontSize}
                onChange={(v) => setState((s) => ({ ...s, rootFontSize: v }))}
                unit="px"
                hint="Used for rem conversions"
              />
              <SettingRow
                label="Parent font-size"
                value={state.parentFontSize}
                onChange={(v) => setState((s) => ({ ...s, parentFontSize: v }))}
                unit="px"
                hint="Used for em conversions"
              />
              <SettingRow
                label="Parent dimension"
                value={state.parentDimension}
                onChange={(v) => setState((s) => ({ ...s, parentDimension: v }))}
                unit="px"
                hint="Used for % conversions (assume width)"
              />
              <SettingRow
                label="Viewport width"
                value={state.viewportWidth}
                onChange={(v) => setState((s) => ({ ...s, viewportWidth: v }))}
                unit="px"
                hint="Used for vw conversions"
              />
              <SettingRow
                label="Viewport height"
                value={state.viewportHeight}
                onChange={(v) => setState((s) => ({ ...s, viewportHeight: v }))}
                unit="px"
                hint="Used for vh conversions"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Tip:</span> All values
            are computed live as you type. Click any output row to copy it.
            Settings persist across sessions.
          </div>

          {/* After the controls, never before them — the ask lands once the
              context exists rather than in front of it. */}
          <ToolPresetsBar tool={tool} noun="context" />

          {/* No `brand`: a unit conversion carries no hue. */}
          <UseInCatalog tool={TOOL} />
        </div>
      </ToolWorkbench>
    </ToolLayout>
  )
}

/* ============================================================
 *  Output row
 * ========================================================== */

function OutputRow({
  unit,
  label,
  description,
  value,
}: {
  unit: Unit
  label: string
  description: string
  value: number | null
}) {
  const [copied, setCopied] = React.useState(false)

  const display = value === null
    ? '—'
    : Math.abs(value) < 0.0001
      ? '0'
      : Math.abs(value) >= 1000
        ? value.toFixed(0)
        : Math.abs(value) >= 1
          ? value.toFixed(3).replace(/\.?0+$/, '')
          : value.toFixed(6).replace(/\.?0+$/, '')

  const onCopy = React.useCallback(async () => {
    if (value === null) return
    try {
      await navigator.clipboard.writeText(`${display}${unit}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* ignore */
    }
  }, [value, display, unit])

  return (
    <button
      type="button"
      onClick={onCopy}
      className="flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/40"
      title={`Copy ${display}${unit}`}
    >
      <div className="w-12 text-sm font-semibold uppercase text-primary">{unit}</div>
      <div className="flex-1">
        <div className="font-mono text-sm tabular-nums">{display}{unit}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </div>
      {copied ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground opacity-50" />
      )}
    </button>
  )
}

/* ============================================================
 *  Setting row
 * ========================================================== */

function SettingRow({
  label,
  value,
  onChange,
  unit,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  unit: string
  hint: string
}) {
  // The <Label> named nothing: no `htmlFor`, and it does not wrap the field.
  const labelId = React.useId()
  const hintId = `${labelId}-hint`

  return (
    <div>
      <Label id={labelId} className="mb-1 block text-xs font-medium">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!Number.isNaN(v)) onChange(v)
          }}
          className="h-8 font-mono text-sm"
          step="any"
          min={1}
          aria-labelledby={labelId}
          aria-describedby={hintId}
        />
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <p id={hintId} className="mt-1 text-[11px] text-muted-foreground">
        {hint}
      </p>
    </div>
  )
}
