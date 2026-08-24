'use client'

/**
 * Palette Generator tool.
 *
 * Lets the designer pick a base color and a color-harmony scheme, then
 * generates a 5-color palette. Shows the palette as large swatches with
 * hex/HSL/RGB readouts, copy-as-CSS-variables, copy-as-Tailwind-config,
 * and copy-as-JSON. State persists to localStorage so reloads restore
 * the working palette.
 */

import * as React from 'react'
import Link from 'next/link'
import { Palette, Shuffle, Copy, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { readSharedState, ShareLinkButton } from '@/components/designer-tools/share-link'
import {
  generatePalette,
  hexToHsl,
  hexToRgb,
  normalizeHex,
  randomHex,
  type PaletteScheme,
} from '@/lib/color-tools'
import { cn } from '@/lib/utils'

const SCHEMES: { id: PaletteScheme; label: string }[] = [
  { id: 'analogous', label: 'Analogous' },
  { id: 'complementary', label: 'Complementary' },
  { id: 'triadic', label: 'Triadic' },
  { id: 'split-complementary', label: 'Split Complementary' },
  { id: 'tetradic', label: 'Tetradic' },
  { id: 'monochromatic', label: 'Monochromatic' },
  { id: 'shades', label: 'Shades & Tints' },
]

const STORAGE_KEY = 'hoverlab:tool:palette'

interface PaletteState {
  base: string
  scheme: PaletteScheme
}

export default function PaletteToolPage() {
  const [base, setBase] = React.useState('#10b981')
  const [scheme, setScheme] = React.useState<PaletteScheme>('analogous')

  // Hydrate from localStorage.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.base) {
          const n = normalizeHex(parsed.base)
          if (n) setBase(n)
        }
        if (parsed.scheme && SCHEMES.some((s) => s.id === parsed.scheme)) {
          setScheme(parsed.scheme)
        }
      }
    } catch {
      /* ignore */
    }

    // A shared link's state wins over whatever this browser had stored.
    const shared = readSharedState<PaletteState>()
    if (shared) {
      const n = shared.base ? normalizeHex(shared.base) : null
      if (n) setBase(n)
      if (shared.scheme && SCHEMES.some((s) => s.id === shared.scheme)) {
        setScheme(shared.scheme)
      }
    }
  }, [])

  // Persist on change.
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ base, scheme }))
    } catch {
      /* ignore */
    }
  }, [base, scheme])

  const palette = React.useMemo(() => generatePalette(base, scheme), [base, scheme])

  // Generate exports.
  const cssVars = React.useMemo(() => {
    const lines = palette.colors.map(
      (c, i) => `  --color-${i + 1}: ${c};`,
    )
    return `:root {\n${lines.join('\n')}\n}`
  }, [palette])

  const tailwindConfig = React.useMemo(() => {
    const entries = palette.colors
      .map((c, i) => `      '${(i + 1) * 100}': '${c}',`)
      .join('\n')
    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        palette: {\n${entries}\n        }\n      }\n    }\n  }\n}`
  }, [palette])

  const jsonExport = React.useMemo(() => {
    return JSON.stringify(
      {
        name: palette.name,
        base,
        colors: palette.colors.map((c) => ({
          hex: c,
          rgb: hexToRgb(c),
          hsl: hexToHsl(c),
        })),
      },
      null,
      2,
    )
  }, [palette, base])

  return (
    <ToolLayout
      name="Palette Generator"
      tagline="5-color palettes from any base color"
      icon={<Palette className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* Controls */}
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-2 block text-sm font-medium">Base color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-field bg-transparent"
                aria-label="Pick base color"
              />
              <Input
                value={base}
                onChange={(e) => {
                  const n = normalizeHex(e.target.value)
                  if (n) setBase(n)
                  else setBase(e.target.value)
                }}
                className="font-mono"
                placeholder="#10b981"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setBase(randomHex())}
                aria-label="Random base color"
                title="Random base color"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>

            <Label className="mb-2 mt-5 block text-sm font-medium">Scheme</Label>
            <div className="grid grid-cols-2 gap-2">
              {SCHEMES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScheme(s.id)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-xs font-medium transition-colors',
                    scheme === s.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* The base's position varies by scheme (index 0, 1 or 2 —
                see generatePalette), so compute it rather than claim one. */}
            <div className="mt-5 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{palette.name}</span>{' '}
              scheme · 5 colors
              {(() => {
                const i = palette.colors.findIndex(
                  (c) => c.toLowerCase() === base.toLowerCase(),
                )
                return i >= 0 ? ` · base at position ${i + 1}` : ''
              })()}
            </div>

            {/* Handoff: the palette picks the colour, the token generator
                turns it into the full variable set the catalog runs on. */}
            <div className="mt-3 flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
                <Link href={`/tools/tokens?base=${encodeURIComponent(base)}`}>
                  Build design tokens from this base
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <ShareLinkButton state={{ base, scheme }} />
            </div>
          </div>

          <CopyCssCard code={cssVars} title="CSS variables" language="css" />
          <CopyCssCard code={tailwindConfig} title="Tailwind config" language="js" />
          <CopyCssCard code={jsonExport} title="JSON" language="json" />
        </div>

        {/* Palette display */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            {palette.colors.map((color, i) => (
              <SwatchCard key={`${color}-${i}`} color={color} index={i} />
            ))}
          </div>

          {/* Big preview using the palette */}
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border/60 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
              Live preview — buttons styled with this palette
            </div>
            <div className="space-y-4 p-6">
              <div className="flex flex-wrap gap-3">
                {palette.colors.map((color, i) => (
                  <button
                    key={i}
                    type="button"
                    className="rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105"
                    style={{ backgroundColor: color }}
                  >
                    Button {i + 1}
                  </button>
                ))}
              </div>
              <div
                className="flex h-24 items-center justify-center rounded-md text-2xl font-bold"
                style={{
                  background: `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[2]}, ${palette.colors[4]})`,
                  color: '#fff',
                  textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                }}
              >
                Gradient hero
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}

/* ============================================================
 *  Swatch card
 * ========================================================== */

function SwatchCard({ color, index }: { color: string; index: number }) {
  const [copied, setCopied] = React.useState(false)
  const hsl = hexToHsl(color)
  const rgb = hexToRgb(color)

  const onCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(color)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }, [color])

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={onCopy}
        className="group relative block h-28 w-full"
        style={{ backgroundColor: color }}
        aria-label={`Copy ${color}`}
        title={`Click to copy ${color}`}
      >
        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </span>
        <span className="absolute bottom-2 left-2 rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {index + 1}
        </span>
      </button>
      <div className="space-y-1 p-3">
        <div className="font-mono text-xs font-semibold uppercase">{color}</div>
        {rgb && (
          <div className="font-mono text-[10px] text-muted-foreground">
            rgb({rgb.r}, {rgb.g}, {rgb.b})
          </div>
        )}
        {hsl && (
          <div className="font-mono text-[10px] text-muted-foreground">
            hsl({Math.round(hsl.h)}, {Math.round(hsl.s)}%, {Math.round(hsl.l)}%)
          </div>
        )}
        {/* Handoff: is this swatch readable as text? The checker answers
            properly — against both surfaces, at three sizes. */}
        <Link
          href={`/tools/contrast?fg=${encodeURIComponent(color)}`}
          className="inline-block pt-1 text-[10px] font-medium text-primary underline-offset-2 hover:underline"
        >
          Check contrast →
        </Link>
      </div>
    </div>
  )
}
