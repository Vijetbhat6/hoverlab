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
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { OpenInStudio } from '@/components/studio/open-in-studio'
import { ToolWorkbench } from '@/components/designer-tools/tool-workbench'
import { useToolState } from '@/hooks/use-tool-state'
import {
  TOKEN_DEFAULTS,
  TOKENS_PERMALINK,
  buildScheme,
  type TokenState,
} from '@/lib/tools/permalinks/tokens'
import { tokenBlockCss, tokenDtcg } from '@/lib/tools/token-css'
import { hexToRgb, normalizeHex, rgbToOklch } from '@/lib/color-tools'
import { cn } from '@/lib/utils'

const DEFAULT_STATE = TOKEN_DEFAULTS

const TOOL = '/tools/tokens'


export default function TokensTool({
  initial,
  permalinks,
}: {
  initial?: TokenState
  permalinks?: React.ReactNode
}) {
  // Working state is local and ungated; named presets need an account.
  // See `use-tool-state.ts` for why the two layers are kept apart.
  const tool = useToolState<TokenState>(TOOL, DEFAULT_STATE, {
    initial,
    permalink: TOKENS_PERMALINK,
  })
  const { state, setState } = tool

  // Handoff from the palette generator: ?base=#hex seeds hue + saturation.
  // window.location rather than useSearchParams — the hook would force a
  // Suspense boundary around the whole page for one optional param.
  // The param wins over the restored state, then leaves the URL so a
  // reload keeps whatever the user tunes afterwards. Waits on `hydrating`
  // so the localStorage restore cannot land after this and overwrite it.
  React.useEffect(() => {
    if (tool.hydrating) return
    const param = new URLSearchParams(window.location.search).get('base')
    const hex = param ? normalizeHex(param) : null
    const rgb = hex ? hexToRgb(hex) : null
    if (!rgb) return
    const { c, h } = rgbToOklch(rgb)
    setState((s) => ({
      ...s,
      hue: Math.round(((h % 360) + 360) % 360),
      chroma: Math.min(0.3, Math.round(c * 200) / 200),
    }))
    window.history.replaceState(null, '', window.location.pathname)
  }, [tool.hydrating, setState])

  const light = buildScheme(state, false)
  const dark = buildScheme(state, true)
  const css = tokenBlockCss(state)

  const set = <K extends keyof TokenState>(key: K) => (v: number[]) =>
    setState((s) => ({ ...s, [key]: v[0] as TokenState[K] }))

  return (
    <ToolLayout
      name="Token Generator"
      tagline="Build the CSS variables every block in the catalog is styled against"
      icon={<Palette className="h-5 w-5" />}
      permalinks={permalinks}
    >
      <ToolWorkbench previewSide="right" controlsWidth="320px">
        {/* Controls */}
        <div className="space-y-6 rounded-2xl border border-border/60 bg-card/60 p-5">
          <div>
            <div className="flex items-baseline justify-between">
              <Label>Brand hue</Label>
              <span className="font-mono text-xs text-muted-foreground">{state.hue}°</span>
            </div>
            <Slider
              aria-label="Brand hue"
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
              <Label>Saturation</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {state.chroma.toFixed(2)}
              </span>
            </div>
            <Slider
              aria-label="Saturation"
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
              <Label>Neutral tint</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {state.neutralChroma.toFixed(3)}
              </span>
            </div>
            <Slider
              aria-label="Neutral tint"
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
              <Label>Corner radius</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {state.radius.toFixed(3)}rem
              </span>
            </div>
            <Slider
              aria-label="Corner radius"
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

          {/* After the controls, never before them. Asking for an account in
              front of a tool that used to be free is a toll booth; asking
              once the token set exists is an offer. */}
          <ToolPresetsBar tool={tool} noun="token set" />
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

          {/* The same tokens, in the file a designer imports. See the note
              on tokenDtcg in lib/tools/token-css — one artifact, two channels. */}
          <CopyCssCard
            code={tokenDtcg(state, false)}
            title="tokens.light.json — import into Figma"
            language="json"
          />
          <CopyCssCard
            code={tokenDtcg(state, true)}
            title="tokens.dark.json — import into Figma"
            language="json"
          />

          {/* The exit. Placed after the output rather than beside the
              controls: it is worth reading once the tokens exist, and it is
              noise while someone is still moving sliders. */}
          <UseInCatalog
            tool={TOOL}
            brand={{ hue: state.hue, chroma: state.chroma }}
          />

          <OpenInStudio
            params={{
              hue: state.hue,
              chroma: state.chroma,
              radius: state.radius,
              neutral: state.neutralChroma,
            }}
            gap="A token file tells an agent which grey to use and nothing about what to write — and copy is most of what it generates."
          />
        </div>
      </ToolWorkbench>
    </ToolLayout>
  )
}
