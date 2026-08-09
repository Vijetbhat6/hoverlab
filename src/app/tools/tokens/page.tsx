'use client'

/**
 * Design token generator.
 *
 * The templates ship a `globals.css` full of semantic tokens — `--background`,
 * `--card`, `--muted-foreground` — and every block in the catalog is styled
 * against them. There was no way to *build* one, which meant the answer to
 * "I don't have those tokens" was "download a template and cut it up".
 * This is that missing UI.
 *
 * The output is a complete light + dark token block in the shadcn/ui
 * convention, which is what the catalog assumes and what most Tailwind
 * projects already use.
 *
 * Colour maths is OKLCH, not HSL. HSL's lightness is a coordinate, not a
 * perception: `hsl(60 100% 50%)` (yellow) and `hsl(240 100% 50%)` (blue)
 * claim the same lightness and are nowhere near it. Ramps built in HSL go
 * muddy in the greens and washed out in the blues. OKLCH is perceptually
 * uniform, so one lightness scale works across every hue — which is the
 * whole job here.
 */

import * as React from 'react'
import { Palette, Sun, Moon } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'hoverlab:tool:tokens'

interface TokenState {
  /** Brand hue, 0–360. */
  hue: number
  /** Brand chroma, 0–0.3 — how saturated the accent is. */
  chroma: number
  /** Corner radius in rem. */
  radius: number
  /** How far the neutrals are tinted toward the brand hue, 0–0.03. */
  neutralChroma: number
}

const DEFAULT_STATE: TokenState = {
  hue: 250,
  chroma: 0.19,
  radius: 0.625,
  neutralChroma: 0.006,
}

/** `oklch(L C H)` with the precision the CSS actually needs. */
function oklch(l: number, c: number, h: number): string {
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`
}

interface Scheme {
  label: string
  tokens: Array<{ name: string; value: string; swatch: boolean }>
}

/**
 * Build one scheme's token list.
 *
 * The lightness values are the shadcn defaults, kept deliberately: they are
 * what the whole catalog was designed against, and a "generator" that emits
 * a subtly different scale would produce tokens that technically work and
 * make every block look slightly wrong.
 */
function buildScheme(state: TokenState, dark: boolean): Scheme {
  const { hue, chroma, radius, neutralChroma } = state
  const n = (l: number) => oklch(l, neutralChroma, hue)

  const tokens = dark
    ? [
        { name: '--background', value: n(0.145), swatch: true },
        { name: '--foreground', value: n(0.985), swatch: true },
        { name: '--card', value: n(0.205), swatch: true },
        { name: '--card-foreground', value: n(0.985), swatch: true },
        { name: '--popover', value: n(0.205), swatch: true },
        { name: '--popover-foreground', value: n(0.985), swatch: true },
        { name: '--primary', value: oklch(0.72, chroma, hue), swatch: true },
        { name: '--primary-foreground', value: n(0.145), swatch: true },
        { name: '--secondary', value: n(0.269), swatch: true },
        { name: '--secondary-foreground', value: n(0.985), swatch: true },
        { name: '--muted', value: n(0.269), swatch: true },
        { name: '--muted-foreground', value: n(0.708), swatch: true },
        { name: '--accent', value: n(0.269), swatch: true },
        { name: '--accent-foreground', value: n(0.985), swatch: true },
        { name: '--destructive', value: oklch(0.704, 0.191, 22.2), swatch: true },
        { name: '--border', value: 'oklch(1 0 0 / 10%)', swatch: false },
        { name: '--input', value: 'oklch(1 0 0 / 15%)', swatch: false },
        { name: '--ring', value: oklch(0.556, chroma * 0.4, hue), swatch: true },
      ]
    : [
        { name: '--background', value: oklch(1, 0, 0), swatch: true },
        { name: '--foreground', value: n(0.145), swatch: true },
        { name: '--card', value: oklch(1, 0, 0), swatch: true },
        { name: '--card-foreground', value: n(0.145), swatch: true },
        { name: '--popover', value: oklch(1, 0, 0), swatch: true },
        { name: '--popover-foreground', value: n(0.145), swatch: true },
        { name: '--primary', value: oklch(0.52, chroma, hue), swatch: true },
        { name: '--primary-foreground', value: n(0.985), swatch: true },
        { name: '--secondary', value: n(0.97), swatch: true },
        { name: '--secondary-foreground', value: n(0.205), swatch: true },
        { name: '--muted', value: n(0.97), swatch: true },
        { name: '--muted-foreground', value: n(0.556), swatch: true },
        { name: '--accent', value: n(0.97), swatch: true },
        { name: '--accent-foreground', value: n(0.205), swatch: true },
        { name: '--destructive', value: oklch(0.577, 0.245, 27.3), swatch: true },
        { name: '--border', value: n(0.922), swatch: true },
        { name: '--input', value: n(0.922), swatch: true },
        { name: '--ring', value: oklch(0.708, chroma * 0.4, hue), swatch: true },
      ]

  if (!dark) tokens.unshift({ name: '--radius', value: `${radius}rem`, swatch: false })

  return { label: dark ? 'Dark' : 'Light', tokens }
}

function buildCss(state: TokenState): string {
  const light = buildScheme(state, false)
  const dark = buildScheme(state, true)

  const lines = (scheme: Scheme, indent: string) =>
    scheme.tokens.map((t) => `${indent}${t.name}: ${t.value};`).join('\n')

  return `/* Generated by Hoverlab — hoverlab design tokens
   Drop this into your globals.css. Every block in the catalog
   is styled against these names. */

:root {
${lines(light, '  ')}
}

.dark {
${lines(dark, '  ')}
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
`
}

export default function TokensToolPage() {
  const [state, setState] = React.useState<TokenState>(DEFAULT_STATE)

  // Restore after mount, never during render — reading localStorage in the
  // initializer would make the server and client markup disagree.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setState({ ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<TokenState>) })
    } catch {
      /* private mode — defaults are fine */
    }
  }, [])

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const light = buildScheme(state, false)
  const dark = buildScheme(state, true)
  const css = buildCss(state)

  const set = <K extends keyof TokenState>(key: K) => (v: number[]) =>
    setState((s) => ({ ...s, [key]: v[0] as TokenState[K] }))

  return (
    <ToolLayout
      name="Token Generator"
      tagline="Build the CSS variables every block in the catalog is styled against"
      icon={<Palette className="h-5 w-5" />}
    >
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Controls */}
        <div className="space-y-6 rounded-2xl border border-border/60 bg-card/60 p-5">
          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="hue">Brand hue</Label>
              <span className="font-mono text-xs text-muted-foreground">{state.hue}°</span>
            </div>
            <Slider
              id="hue"
              value={[state.hue]}
              onValueChange={set('hue')}
              min={0}
              max={360}
              step={1}
              className="mt-3"
            />
            <div
              aria-hidden
              className="mt-2 h-2 rounded-full"
              style={{
                background:
                  'linear-gradient(to right, oklch(0.6 0.2 0), oklch(0.6 0.2 60), oklch(0.6 0.2 120), oklch(0.6 0.2 180), oklch(0.6 0.2 240), oklch(0.6 0.2 300), oklch(0.6 0.2 360))',
              }}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              The one colour every token is derived from. Everything else on
              this page — primary, ring, accent, the tinted greys — is this
              angle plus a lightness.
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="chroma">Saturation</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {state.chroma.toFixed(2)}
              </span>
            </div>
            <Slider
              id="chroma"
              value={[state.chroma]}
              onValueChange={set('chroma')}
              min={0}
              max={0.3}
              step={0.005}
              className="mt-3"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              How saturated the brand colour is. OKLCH keeps lightness fixed
              as this moves, so the contrast of text on your primary button
              does not drift while you tune it.
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="neutral">Neutral tint</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {state.neutralChroma.toFixed(3)}
              </span>
            </div>
            <Slider
              id="neutral"
              value={[state.neutralChroma]}
              onValueChange={set('neutralChroma')}
              min={0}
              max={0.03}
              step={0.001}
              className="mt-3"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              How far the greys lean toward your brand hue. A little is what
              separates a designed neutral from plain grey; a lot looks like a
              colour cast.
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="radius">Corner radius</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {state.radius.toFixed(3)}rem
              </span>
            </div>
            <Slider
              id="radius"
              value={[state.radius]}
              onValueChange={set('radius')}
              min={0}
              max={1.5}
              step={0.025}
              className="mt-3"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              The base radius. Every component derives from it, so this one
              number is the difference between a sharp interface and a soft
              one across the whole set.
            </p>
          </div>
        </div>

        {/* Preview + output */}
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[light, dark].map((scheme, i) => (
              <div
                key={scheme.label}
                className="overflow-hidden rounded-2xl border border-border/60"
              >
                <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/40 px-4 py-2 text-xs font-semibold">
                  {i === 0 ? (
                    <Sun aria-hidden className="h-3.5 w-3.5" />
                  ) : (
                    <Moon aria-hidden className="h-3.5 w-3.5" />
                  )}
                  {scheme.label}
                </div>

                {/* A real card rendered in the generated tokens, not a row of
                    swatches: the question is "does my UI look right in this",
                    and swatches cannot answer it. */}
                <div
                  className="p-4"
                  style={{
                    background: scheme.tokens.find((t) => t.name === '--background')?.value,
                    color: scheme.tokens.find((t) => t.name === '--foreground')?.value,
                  }}
                >
                  <div
                    className="p-4"
                    style={{
                      background: scheme.tokens.find((t) => t.name === '--card')?.value,
                      border: `1px solid ${scheme.tokens.find((t) => t.name === '--border')?.value}`,
                      borderRadius: `${state.radius}rem`,
                    }}
                  >
                    <div className="text-sm font-semibold">Upgrade your plan</div>
                    <div
                      className="mt-1 text-xs"
                      style={{
                        color: scheme.tokens.find((t) => t.name === '--muted-foreground')?.value,
                      }}
                    >
                      Unlimited projects and priority support.
                    </div>
                    <div className="mt-3 flex gap-2">
                      <span
                        className="px-3 py-1.5 text-xs font-semibold"
                        style={{
                          background: scheme.tokens.find((t) => t.name === '--primary')?.value,
                          color: scheme.tokens.find((t) => t.name === '--primary-foreground')
                            ?.value,
                          borderRadius: `calc(${state.radius}rem - 2px)`,
                        }}
                      >
                        Upgrade
                      </span>
                      <span
                        className="px-3 py-1.5 text-xs font-semibold"
                        style={{
                          background: scheme.tokens.find((t) => t.name === '--secondary')?.value,
                          color: scheme.tokens.find((t) => t.name === '--secondary-foreground')
                            ?.value,
                          borderRadius: `calc(${state.radius}rem - 2px)`,
                        }}
                      >
                        Later
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {scheme.tokens
                      .filter((t) => t.swatch)
                      .map((t) => (
                        <span
                          key={t.name}
                          title={`${t.name}: ${t.value}`}
                          className={cn('h-5 w-5 rounded border border-black/10')}
                          style={{ background: t.value }}
                        />
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <CopyCssCard code={css} title="globals.css" language="css" />
        </div>
      </div>
    </ToolLayout>
  )
}
