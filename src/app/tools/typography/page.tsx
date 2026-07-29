'use client'

/**
 * Typography Playground tool.
 *
 * Pick a heading font + body font pairing, tune size / weight / line-height
 * / letter-spacing / paragraph-spacing, and preview against real lorem
 * ipsum. Includes a modular type scale generator (1.2 / 1.25 / 1.333 /
 * 1.5 ratios) that outputs Tailwind/CLS-ready CSS variables.
 */

import * as React from 'react'
import { Type, Copy, Check, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'hoverlab:tool:typography'

// Curated Google Font pairings. Each pairing has been chosen so the
// two fonts feel related but distinct (one for display, one for body).
interface FontPair {
  id: string
  name: string
  heading: string
  body: string
  // CSS font-family stack with fallbacks.
  headingStack: string
  bodyStack: string
}

const FONT_PAIRS: FontPair[] = [
  {
    id: 'inter-system',
    name: 'Inter + System',
    heading: 'Inter',
    body: 'System UI',
    headingStack: 'Inter, system-ui, -apple-system, sans-serif',
    bodyStack: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  {
    id: 'playfair-source',
    name: 'Playfair + Source Sans',
    heading: 'Playfair Display',
    body: 'Source Sans 3',
    headingStack: '"Playfair Display", Georgia, serif',
    bodyStack: '"Source Sans 3", system-ui, sans-serif',
  },
  {
    id: 'merriweather-inter',
    name: 'Merriweather + Inter',
    heading: 'Merriweather',
    body: 'Inter',
    headingStack: 'Merriweather, Georgia, serif',
    bodyStack: 'Inter, system-ui, sans-serif',
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk + Inter',
    heading: 'Space Grotesk',
    body: 'Inter',
    headingStack: '"Space Grotesk", system-ui, sans-serif',
    bodyStack: 'Inter, system-ui, sans-serif',
  },
  {
    id: 'lora-worksans',
    name: 'Lora + Work Sans',
    heading: 'Lora',
    body: 'Work Sans',
    headingStack: 'Lora, Georgia, serif',
    bodyStack: '"Work Sans", system-ui, sans-serif',
  },
  {
    id: 'poppins-roboto',
    name: 'Poppins + Roboto',
    heading: 'Poppins',
    body: 'Roboto',
    headingStack: 'Poppins, system-ui, sans-serif',
    bodyStack: 'Roboto, system-ui, sans-serif',
  },
  {
    id: 'bitter-opensans',
    name: 'Bitter + Open Sans',
    heading: 'Bitter',
    body: 'Open Sans',
    headingStack: 'Bitter, Georgia, serif',
    bodyStack: '"Open Sans", system-ui, sans-serif',
  },
  {
    id: 'cormorant-mulish',
    name: 'Cormorant + Mulish',
    heading: 'Cormorant Garamond',
    body: 'Mulish',
    headingStack: '"Cormorant Garamond", Georgia, serif',
    bodyStack: 'Mulish, system-ui, sans-serif',
  },
]

const SCALE_RATIOS = [
  { id: '1.2', label: '1.2 — Minor Third', value: 1.2 },
  { id: '1.25', label: '1.25 — Major Third', value: 1.25 },
  { id: '1.333', label: '1.333 — Perfect Fourth', value: 1.333 },
  { id: '1.5', label: '1.5 — Perfect Fifth', value: 1.5 },
  { id: '1.618', label: '1.618 — Golden Ratio', value: 1.618 },
]

interface TypoState {
  pairId: string
  baseSize: number // px
  scale: number
  headingWeight: number
  bodyWeight: number
  headingLineHeight: number
  bodyLineHeight: number
  headingLetterSpacing: number // em
  bodyLetterSpacing: number // em
  paragraphSpacing: number // em
}

const DEFAULT_STATE: TypoState = {
  pairId: 'playfair-source',
  baseSize: 16,
  scale: 1.25,
  headingWeight: 700,
  bodyWeight: 400,
  headingLineHeight: 1.15,
  bodyLineHeight: 1.6,
  headingLetterSpacing: -0.02,
  bodyLetterSpacing: 0,
  paragraphSpacing: 1.4,
}

const PREVIEW_TEXT = {
  h1: 'The quick brown fox jumps over the lazy dog',
  h2: 'A curated library of beautiful CSS effects',
  body: 'Hoverlab is a living library of pure-CSS effects with live demos and copy-ready code. Buttons, loaders, cards, text effects, backgrounds and more — all crafted to be production-ready. Browse, customize, and copy in seconds.',
  small: 'Designed for designers, by designers. Built with zero dependencies.',
}

export default function TypographyToolPage() {
  const [state, setState] = React.useState<TypoState>(DEFAULT_STATE)

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

  const pair = FONT_PAIRS.find((p) => p.id === state.pairId) ?? FONT_PAIRS[0]

  // Computed type scale.
  const scale = React.useMemo(() => {
    const sizes: { name: string; size: number; rem: string }[] = []
    const names = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl']
    // base is index 2; sizes below and above are derived.
    for (let i = -2; i <= 4; i++) {
      const size = state.baseSize * Math.pow(state.scale, i)
      const idx = i + 2
      sizes.push({
        name: names[idx] ?? `step${idx}`,
        size: Math.round(size * 100) / 100,
        rem: (size / state.baseSize).toFixed(3).replace(/\.?0+$/, '') + 'rem',
      })
    }
    return sizes
  }, [state.baseSize, state.scale])

  const cssOutput = React.useMemo(() => {
    return `:root {
  --font-heading: ${pair.headingStack};
  --font-body: ${pair.bodyStack};
  --text-base: ${state.baseSize}px;

  /* Type scale (ratio ${state.scale}) */
${scale
  .map(
    (s) =>
      `  --text-${s.name}: ${s.size}px; /* ${s.rem} */`,
  )
  .join('\n')}

  --leading-heading: ${state.headingLineHeight};
  --leading-body: ${state.bodyLineHeight};
  --tracking-heading: ${state.headingLetterSpacing}em;
  --tracking-body: ${state.bodyLetterSpacing}em;
  --spacing-paragraph: ${state.paragraphSpacing}em;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: ${state.headingWeight};
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-heading);
}

body, p, li, blockquote {
  font-family: var(--font-body);
  font-weight: ${state.bodyWeight};
  line-height: var(--leading-body);
  letter-spacing: var(--tracking-body);
}

p + p { margin-top: var(--spacing-paragraph); }`
  }, [pair, state, scale])

  // Inject Google Fonts <link> for the chosen pairing.
  React.useEffect(() => {
    const families = [pair.heading, pair.body]
      .filter((f) => f !== 'System UI')
      .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@300;400;500;600;700;800`)
    if (families.length === 0) return
    const href = `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`

    let link = document.getElementById('typography-fonts-link') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = 'typography-fonts-link'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = href
  }, [pair])

  return (
    <ToolLayout
      name="Typography Playground"
      tagline="Font pairing + modular type scale"
      icon={<Type className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* Controls */}
        <div className="space-y-5">
          {/* Font pairing */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-2 block text-sm font-medium">Font pairing</Label>
            <select
              value={state.pairId}
              onChange={(e) => setState((s) => ({ ...s, pairId: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {FONT_PAIRS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Heading:</span> {pair.heading}
              </div>
              <div>
                <span className="font-medium text-foreground">Body:</span> {pair.body}
              </div>
            </div>
          </div>

          {/* Size + scale */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Size &amp; scale</Label>
            <SliderRow
              label="Base size"
              value={state.baseSize}
              min={12}
              max={22}
              step={1}
              display={`${state.baseSize}px`}
              onChange={(v) => setState((s) => ({ ...s, baseSize: v }))}
            />
            <div className="mt-4">
              <Label className="mb-2 block text-xs text-muted-foreground">Scale ratio</Label>
              <div className="grid grid-cols-1 gap-1">
                {SCALE_RATIOS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, scale: r.value }))}
                    className={cn(
                      'rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors',
                      state.scale === r.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted',
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Heading controls */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Heading</Label>
            <SliderRow
              label="Weight"
              value={state.headingWeight}
              min={300}
              max={800}
              step={100}
              display={String(state.headingWeight)}
              onChange={(v) => setState((s) => ({ ...s, headingWeight: v }))}
            />
            <div className="mt-3">
              <SliderRow
                label="Line height"
                value={state.headingLineHeight}
                min={0.9}
                max={1.6}
                step={0.05}
                display={state.headingLineHeight.toFixed(2)}
                onChange={(v) => setState((s) => ({ ...s, headingLineHeight: v }))}
              />
            </div>
            <div className="mt-3">
              <SliderRow
                label="Letter spacing"
                value={state.headingLetterSpacing}
                min={-0.08}
                max={0.08}
                step={0.005}
                display={`${state.headingLetterSpacing.toFixed(3)}em`}
                onChange={(v) => setState((s) => ({ ...s, headingLetterSpacing: v }))}
              />
            </div>
          </div>

          {/* Body controls */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Body</Label>
            <SliderRow
              label="Weight"
              value={state.bodyWeight}
              min={300}
              max={700}
              step={100}
              display={String(state.bodyWeight)}
              onChange={(v) => setState((s) => ({ ...s, bodyWeight: v }))}
            />
            <div className="mt-3">
              <SliderRow
                label="Line height"
                value={state.bodyLineHeight}
                min={1}
                max={2.2}
                step={0.05}
                display={state.bodyLineHeight.toFixed(2)}
                onChange={(v) => setState((s) => ({ ...s, bodyLineHeight: v }))}
              />
            </div>
            <div className="mt-3">
              <SliderRow
                label="Letter spacing"
                value={state.bodyLetterSpacing}
                min={-0.04}
                max={0.08}
                step={0.005}
                display={`${state.bodyLetterSpacing.toFixed(3)}em`}
                onChange={(v) => setState((s) => ({ ...s, bodyLetterSpacing: v }))}
              />
            </div>
            <div className="mt-3">
              <SliderRow
                label="Paragraph spacing"
                value={state.paragraphSpacing}
                min={0}
                max={3}
                step={0.1}
                display={`${state.paragraphSpacing.toFixed(1)}em`}
                onChange={(v) => setState((s) => ({ ...s, paragraphSpacing: v }))}
              />
            </div>
          </div>

          <CopyCssCard code={cssOutput} title="CSS variables + base styles" language="css" />
        </div>

        {/* Preview */}
        <div className="space-y-4">
          {/* Type scale visualization */}
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border/60 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
              Type scale ({state.scale}× ratio, {state.baseSize}px base)
            </div>
            <div className="space-y-2 p-5">
              {scale
                .slice()
                .reverse()
                .map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    className="group flex w-full items-baseline gap-3 rounded px-2 py-1 text-left hover:bg-muted/40"
                    title={`Copy var(--text-${s.name})`}
                  >
                    <span className="w-12 shrink-0 font-mono text-[10px] uppercase text-muted-foreground">
                      {s.name}
                    </span>
                    <span
                      className="flex-1 truncate"
                      style={{
                        fontFamily: pair.headingStack,
                        fontSize: `${s.size}px`,
                        fontWeight: state.headingWeight,
                        lineHeight: 1.1,
                      }}
                    >
                      {s.size}px
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                      {s.rem}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Real preview */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border/60 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
              Live preview
            </div>
            <div
              className="p-8"
              style={{
                fontFamily: pair.bodyStack,
                fontSize: `${state.baseSize}px`,
                fontWeight: state.bodyWeight,
                lineHeight: state.bodyLineHeight,
                letterSpacing: `${state.bodyLetterSpacing}em`,
              }}
            >
              <h1
                style={{
                  fontFamily: pair.headingStack,
                  fontSize: `${state.baseSize * Math.pow(state.scale, 4)}px`,
                  fontWeight: state.headingWeight,
                  lineHeight: state.headingLineHeight,
                  letterSpacing: `${state.headingLetterSpacing}em`,
                  marginBottom: '0.5em',
                }}
              >
                {PREVIEW_TEXT.h1}
              </h1>
              <h2
                style={{
                  fontFamily: pair.headingStack,
                  fontSize: `${state.baseSize * Math.pow(state.scale, 2)}px`,
                  fontWeight: state.headingWeight,
                  lineHeight: state.headingLineHeight,
                  letterSpacing: `${state.headingLetterSpacing}em`,
                  marginBottom: '0.6em',
                  marginTop: '1.2em',
                }}
              >
                {PREVIEW_TEXT.h2}
              </h2>
              <p>{PREVIEW_TEXT.body}</p>
              <p style={{ marginTop: `${state.paragraphSpacing}em` }}>
                Paragraph spacing demonstrates the gap between consecutive paragraphs.
                Adjust the slider to see how readability changes with more or less
                breathing room between blocks of text.
              </p>
              <p
                style={{
                  marginTop: `${state.paragraphSpacing}em`,
                  fontSize: `${state.baseSize * Math.pow(state.scale, -1)}px`,
                  color: 'var(--muted-foreground)',
                }}
              >
                {PREVIEW_TEXT.small}
              </p>
            </div>
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
