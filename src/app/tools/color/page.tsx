'use client'

/**
 * Color Format Converter tool.
 *
 * Colors arrive in whatever format the source happened to speak — a hex
 * from Figma, an rgb() from devtools, an oklch() from a modern token
 * file — and the codebase wants a different one. Paste any of them, get
 * all of them, one copy button per row.
 *
 * OKLCH is the one direction that can leave sRGB: a valid oklch() string
 * may name a color no sRGB screen can show. We clamp into gamut and say
 * so, rather than silently pretending the round trip was lossless.
 */

import * as React from 'react'
import { Blend, Copy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToolLayout, copyWithToast } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { useToolState } from '@/hooks/use-tool-state'
import {
  brandFromHex,
  formatOklch,
  hexToRgb,
  hslToRgb,
  oklchInSrgbGamut,
  oklchToRgb,
  rgbToHex,
  rgbToHsl,
  rgbToOklch,
  type OKLCH,
  type RGB,
} from '@/lib/color-tools'
import { cn } from '@/lib/utils'

const TOOL = '/tools/color'

interface ParsedColor {
  rgb: RGB
  oklch: OKLCH
  /** True when the input named an out-of-sRGB oklch() and rgb was clamped. */
  clamped: boolean
}

/* ============================================================
 *  Parsing
 * ========================================================== */

const RGB_RE =
  /^rgba?\(\s*([\d.]+)(%?)\s*[,\s]\s*([\d.]+)(%?)\s*[,\s]\s*([\d.]+)(%?)\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/
const HSL_RE =
  /^hsla?\(\s*(-?[\d.]+)(?:deg)?\s*[,\s]\s*([\d.]+)%?\s*[,\s]\s*([\d.]+)%?\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/
const OKLCH_RE =
  /^oklch\(\s*(-?[\d.]+)(%?)\s+(-?[\d.]+)(%?)\s+(-?[\d.]+)(?:deg)?\s*(?:\/\s*[\d.]+%?\s*)?\)$/

function fromRgb(rgb: RGB): ParsedColor {
  return { rgb, oklch: rgbToOklch(rgb), clamped: false }
}

/** Parse hex / rgb() / hsl() / oklch(). Alpha is accepted and dropped. */
function parseCssColor(input: string): ParsedColor | null {
  const s = input.trim().toLowerCase()
  if (!s) return null

  const hex = hexToRgb(s)
  if (hex) return fromRgb(hex)

  const rgbM = RGB_RE.exec(s)
  if (rgbM) {
    const ch = (v: string, pct: string) => {
      const n = parseFloat(v) * (pct ? 255 / 100 : 1)
      return Math.max(0, Math.min(255, n))
    }
    return fromRgb({
      r: ch(rgbM[1], rgbM[2]),
      g: ch(rgbM[3], rgbM[4]),
      b: ch(rgbM[5], rgbM[6]),
    })
  }

  const hslM = HSL_RE.exec(s)
  if (hslM) {
    return fromRgb(
      hslToRgb({
        h: parseFloat(hslM[1]),
        s: Math.max(0, Math.min(100, parseFloat(hslM[2]))),
        l: Math.max(0, Math.min(100, parseFloat(hslM[3]))),
      }),
    )
  }

  const okM = OKLCH_RE.exec(s)
  if (okM) {
    const oklch: OKLCH = {
      l: parseFloat(okM[1]) / (okM[2] ? 100 : 1),
      // Per CSS Color 4, 100% chroma corresponds to 0.4.
      c: Math.max(0, parseFloat(okM[3]) * (okM[4] ? 0.4 / 100 : 1)),
      h: ((parseFloat(okM[5]) % 360) + 360) % 360,
    }
    return {
      rgb: oklchToRgb(oklch),
      oklch,
      clamped: !oklchInSrgbGamut(oklch),
    }
  }

  return null
}

/* ============================================================
 *  Page
 * ========================================================== */

const DEFAULT_INPUT = '#10b981'

/**
 * One field, still an object.
 *
 * This tool persisted the raw string rather than JSON, which was fine while
 * localStorage was the only reader. A preset is `{ tool, name, state }`
 * with `state` an object, so the shape has to be one — and a stored bare
 * string now fails `JSON.parse` and restores as the default, which costs a
 * returning visitor one colour and needs no migration.
 *
 * Restoring an unparseable value is safe here in a way it is not elsewhere:
 * the field already accepts anything while someone types, and renders the
 * last good colour with an "invalid" flag rather than blanking.
 */
interface ColorState {
  input: string
}

const DEFAULT_STATE: ColorState = { input: DEFAULT_INPUT }

export default function ColorToolPage() {
  // Working state stays local and ungated; named presets need an account.
  // See `use-tool-state.ts` for why the two layers are separate.
  const tool = useToolState<ColorState>(TOOL, DEFAULT_STATE)
  const input = tool.state.input
  const setInput = (v: string) => tool.setState({ input: v })
  // Invalid keystrokes keep the last good color on screen instead of blanking it.
  const [lastValid, setLastValid] = React.useState<ParsedColor>(
    () => parseCssColor(DEFAULT_INPUT)!,
  )

  const parsed = React.useMemo(() => parseCssColor(input), [input])
  React.useEffect(() => {
    if (parsed) setLastValid(parsed)
  }, [parsed])
  const color = parsed ?? lastValid
  const invalid = !parsed && input.trim() !== ''

  const hex = rgbToHex(color.rgb)
  const hsl = rgbToHsl(color.rgb)
  const rows = [
    { label: 'HEX', value: hex },
    {
      label: 'RGB',
      value: `rgb(${Math.round(color.rgb.r)}, ${Math.round(color.rgb.g)}, ${Math.round(color.rgb.b)})`,
    },
    {
      label: 'HSL',
      value: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
    },
    { label: 'OKLCH', value: formatOklch(color.oklch), clamped: color.clamped },
  ]

  return (
    <ToolLayout
      name="Color Converter"
      tagline="hex · rgb · hsl · oklch, from any of them"
      icon={<Blend className="h-6 w-6" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* Input */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label htmlFor="color-input" className="mb-2 block text-sm font-medium">
              Any CSS color
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={hex}
                onChange={(e) => setInput(e.target.value)}
                className="h-10 w-12 shrink-0 cursor-pointer rounded border border-field bg-transparent"
                aria-label="Pick a color"
              />
              <Input
                id="color-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={cn(
                  'font-mono',
                  invalid && 'border-destructive focus-visible:ring-destructive',
                )}
                placeholder="#10b981, rgb(16 185 129), hsl(160, 84%, 39%), oklch(0.7 0.15 163)"
                spellCheck={false}
              />
            </div>
            <p
              className={cn(
                'mt-2 text-xs',
                invalid ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {invalid
                ? 'Not a color we recognize — showing the last valid one.'
                : 'Accepts hex, rgb()/rgba(), hsl()/hsla(), and oklch(). Alpha is dropped.'}
            </p>
          </div>

          {/* Output rows */}
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border/60 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
              All formats
            </div>
            {rows.map((row) => (
              <FormatRow key={row.label} {...row} />
            ))}
          </div>

          {color.clamped && (
            <p className="text-xs text-muted-foreground">
              That oklch() color sits outside the sRGB gamut. The hex / RGB / HSL
              values (and the swatch) are clamped to the nearest displayable color.
            </p>
          )}

          {/* After the field, never before it — the ask lands once there is a
              colour worth keeping rather than in front of an empty input. */}
          <ToolPresetsBar tool={tool} noun="colour" />
        </div>

        {/* Swatch on both surfaces */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border/60 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
              Preview
            </div>
            <SwatchSurface hex={hex} surface="#ffffff" label="On light" dark={false} />
            <SwatchSurface hex={hex} surface="#0a0a0a" label="On dark" dark />
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Tip:</span> click any
            row to copy its CSS string. Everything runs locally — nothing is
            uploaded.
          </div>

          {/* The whole tool is one colour, so this is the clearest possible
              case for repainting the catalog in it. */}
          <UseInCatalog tool={TOOL} brand={brandFromHex(hex)} />
        </div>
      </div>
    </ToolLayout>
  )
}

/* ============================================================
 *  Format row
 * ========================================================== */

function FormatRow({
  label,
  value,
  clamped,
}: {
  label: string
  value: string
  clamped?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => copyWithToast(value, `${value} copied`)}
      className="flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/40"
      title={`Copy ${value}`}
    >
      <div className="w-16 text-sm font-semibold uppercase text-primary">{label}</div>
      <div className="flex-1 font-mono text-sm tabular-nums">
        {value}
        {clamped && (
          <span className="ml-2 font-sans text-[10px] text-amber-600 dark:text-amber-500">
            outside sRGB
          </span>
        )}
      </div>
      <Copy className="h-4 w-4 text-muted-foreground opacity-50" />
    </button>
  )
}

/* ============================================================
 *  Swatch surface
 * ========================================================== */

/* Surfaces are hard-coded white and near-black on purpose: the point is
   to judge the color against both, independent of the site theme. */
function SwatchSurface({
  hex,
  surface,
  label,
  dark,
}: {
  hex: string
  surface: string
  label: string
  dark: boolean
}) {
  return (
    <div
      className="flex items-center gap-4 p-5"
      style={{ backgroundColor: surface }}
    >
      <div
        className="h-20 w-20 shrink-0 rounded-lg shadow-sm"
        style={{
          backgroundColor: hex,
          border: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
        }}
      />
      <div>
        <div
          className="text-xs font-medium"
          style={{ color: dark ? '#a1a1aa' : '#71717a' }}
        >
          {label}
        </div>
        <div
          className="font-mono text-sm"
          style={{ color: dark ? '#fafafa' : '#18181b' }}
        >
          {hex}
        </div>
      </div>
    </div>
  )
}
