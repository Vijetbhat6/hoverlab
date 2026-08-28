'use client'

/**
 * shadcn/ui Theme Editor.
 *
 * /tools/tokens already emitted a light + dark token block, and for a
 * while that looked like enough. It is not, for two reasons that are the
 * whole of this page.
 *
 * FIRST, A THEME IS ONLY TRUE OF SOMETHING.
 *
 * Twenty-eight oklch values in a text box tell you nothing about whether
 * the secondary button is legible or the muted text has disappeared. The
 * preview here is not a swatch grid — it is the actual shadcn components
 * from this app's own `components/ui`, wearing the theme, in light and
 * dark at the same time. Setting the custom properties on a wrapper is all
 * that takes, because Tailwind v4 resolves `bg-primary` through
 * `var(--primary)` at paint time. What you see is what installs.
 *
 * SECOND, THE HANDOFF HAS TO BE A COMMAND.
 *
 * A copy button on a CSS block hands someone a paste-into-the-right-file
 * problem. `npx shadcn add <url>` does not, and since CLI v4 that is how
 * everything else arrives in a project. So the export is a `registry:theme`
 * item served from `/r/theme.json`, with the entire theme packed into the
 * query string — no account, nothing stored, and the same URL yields the
 * same theme in a year. The CSS is still there for people who want it.
 *
 * WHAT THIS CHECKS THAT ITS COMPETITORS DO NOT
 *
 * Every text-on-surface pair in both modes, against AA, and whether the
 * five chart colours survive colour blindness. Both run continuously and
 * both are reported rather than enforced — a designer may have a reason,
 * and a generator that refuses to emit is one people route around. The
 * maths is shared with /tools/contrast and /tools/colorblind, so the three
 * pages cannot disagree about what passes.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, Copy, Eye, Moon, RotateCcw, SwatchBook, Sun } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SliderField } from '@/components/control-field'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout, copyWithToast } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { useToolState } from '@/hooks/use-tool-state'
import {
  DEFAULT_THEME,
  TOKEN_GROUPS,
  THEME_PRESETS,
  type ThemeState,
  buildTheme,
  chartCollisions,
  encodeTheme,
  hexToTokenValue,
  themeContrast,
  themeCss,
  themeRegistryItem,
  tokenToHex,
} from '@/lib/shadcn-theme'
import { cn } from '@/lib/utils'

const TOOL = '/tools/shadcn'

export default function ShadcnThemeToolPage() {
  const tool = useToolState<ThemeState>(TOOL, DEFAULT_THEME)
  const { state, setState } = tool

  /*
    A stored state from before overrides existed has no `light` / `dark`
    object, and every read below assumes one. Repaired here rather than
    migrated: the four knobs are the valuable half and they survive.
  */
  const theme: ThemeState = {
    ...DEFAULT_THEME,
    ...state,
    light: state.light ?? {},
    dark: state.dark ?? {},
  }

  /** Which mode the token list edits. The preview always shows both. */
  const [editing, setEditing] = React.useState<'light' | 'dark'>('light')
  const [origin, setOrigin] = React.useState('')
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => setOrigin(window.location.origin), [])

  const update = (patch: Partial<ThemeState>) => setState((s) => ({ ...s, ...patch }))

  const setOverride = (mode: 'light' | 'dark', token: string, value: string | null) => {
    const next = { ...theme[mode] }
    if (value === null) delete next[token]
    else next[token] = value
    update({ [mode]: next } as Partial<ThemeState>)
  }

  /*
    Computed straight, with no useMemo.

    `theme` is rebuilt from `state` on every render, so a dependency array
    holding it would miss every time and the memo would be pure overhead —
    and the React Compiler, which is on for this project, refuses to
    optimise a component whose hand-written memoization it cannot preserve.
    The expensive part is the chart solver, and that keeps its own cache in
    `shadcn-theme.ts` where the key is the values rather than the object.
  */
  const tokens = buildTheme(theme)
  const css = themeCss(theme)
  const item = themeRegistryItem(theme)
  const contrast = themeContrast(theme)
  const collisions = chartCollisions(theme)

  const installUrl = `${origin || 'https://hoverlab.dev'}/r/theme.json?t=${encodeTheme(theme)}`
  const installCommand = `npx shadcn@latest add "${installUrl}"`

  const failures = contrast.filter((c) => !c.passes)
  const overrideCount =
    Object.keys(theme.light).length + Object.keys(theme.dark).length

  return (
    <ToolLayout
      name="shadcn Theme Editor"
      tagline="Tune the tokens against real components in both modes, then install the result with one command"
      icon={<SwatchBook className="h-5 w-5" />}
    >
      <div className="space-y-6">
        {/* The install command sits at the top because it is the thing
            people came for, and because it updates as they work — burying
            it under the editor would make it feel like a final step
            rather than the live output it is. */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Install this theme</h2>
            <span className="text-[11px] text-muted-foreground">
              The whole theme is in the URL — nothing is stored on our side
            </span>
          </div>
          <div className="mt-2.5 flex items-stretch gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-border bg-muted/40 px-3 py-2.5 font-mono text-xs">
              {installCommand}
            </code>
            <Button
              variant="outline"
              className="shrink-0 gap-1.5"
              onClick={() => {
                void copyWithToast(installCommand, 'Install command copied')
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          {/* Controls */}
          <div className="space-y-5">
            <div className="space-y-3 rounded-lg border border-border bg-card p-5">
              <Label className="block text-sm font-medium">Start from</Label>
              <div className="grid grid-cols-2 gap-2">
                {THEME_PRESETS.map((preset) => {
                  const active =
                    theme.hue === preset.state.hue &&
                    theme.chroma === preset.state.chroma &&
                    theme.radius === preset.state.radius &&
                    theme.neutralChroma === preset.state.neutralChroma
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      title={preset.note}
                      onClick={() => update(preset.state)}
                      aria-pressed={active}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted/50',
                      )}
                    >
                      <span
                        aria-hidden
                        className="h-3.5 w-3.5 shrink-0 rounded-full"
                        style={{
                          background: `oklch(0.52 ${preset.state.chroma} ${preset.state.hue})`,
                        }}
                      />
                      <span className="truncate">{preset.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-border bg-card p-5">
              <SliderField
                label="Brand hue"
                description="Moves primary, ring, accent tint, the sidebar and the chart wheel together."
                value={theme.hue}
                min={0}
                max={360}
                step={1}
                display={`${Math.round(theme.hue)}°`}
                onChange={(hue) => update({ hue })}
              />
              <SliderField
                label="Brand chroma"
                description="How saturated the accent is. Above about 0.24 the chart colours start colliding for a dichromat."
                value={theme.chroma}
                min={0}
                max={0.3}
                step={0.005}
                display={theme.chroma.toFixed(3)}
                onChange={(chroma) => update({ chroma })}
              />
              <SliderField
                label="Radius"
                description="--radius. The sm / md / lg / xl steps are derived from it."
                value={theme.radius}
                min={0}
                max={2}
                step={0.025}
                display={`${theme.radius}rem`}
                onChange={(radius) => update({ radius })}
              />
              <SliderField
                label="Neutral tint"
                description="How far the greys lean toward the brand hue. A little goes a long way."
                value={theme.neutralChroma}
                min={0}
                max={0.03}
                step={0.001}
                display={theme.neutralChroma.toFixed(3)}
                onChange={(neutralChroma) => update({ neutralChroma })}
              />
            </div>

            {/* Per-token overrides. Second, deliberately: the sliders keep
                a theme coherent and this is the escape hatch from them. */}
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
                <div>
                  <h2 className="text-sm font-medium">Individual tokens</h2>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {overrideCount
                      ? `${overrideCount} overridden`
                      : 'All derived from the sliders'}
                  </p>
                </div>
                <div className="flex rounded-lg border border-border p-0.5">
                  {(['light', 'dark'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setEditing(mode)}
                      aria-pressed={editing === mode}
                      className={cn(
                        'rounded-md px-2 py-1 text-[11px] font-semibold capitalize transition-colors',
                        editing === mode
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[32rem] overflow-y-auto">
                {TOKEN_GROUPS.map((group) => (
                  <div key={group.label} className="border-b border-border/60 last:border-0">
                    <div className="bg-muted/30 px-4 py-2">
                      <div className="text-[11px] font-semibold">{group.label}</div>
                      <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                        {group.note}
                      </p>
                    </div>
                    <ul>
                      {group.tokens.map((token) => (
                        <TokenRow
                          key={token}
                          token={token}
                          value={tokens[editing][token]}
                          overridden={token in theme[editing]}
                          onChange={(hex) =>
                            setOverride(editing, token, hexToTokenValue(hex))
                          }
                          onReset={() => setOverride(editing, token, null)}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {overrideCount ? (
                <div className="border-t border-border/60 p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-1.5 text-xs text-muted-foreground"
                    onClick={() => update({ light: {}, dark: {} })}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset every override
                  </Button>
                </div>
              ) : null}
            </div>

            <ToolPresetsBar tool={tool} noun="theme" />
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <ThemePreview tokens={tokens.light} radius={tokens.radius} mode="light" />
              <ThemePreview tokens={tokens.dark} radius={tokens.radius} mode="dark" />
            </div>

            {/* The checks. Both are computed from the same maths the
                contrast checker and the simulator use. */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
                  <h2 className="text-xs font-semibold">Text contrast, both modes</h2>
                  <span
                    className={cn(
                      'rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      failures.length
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                    )}
                  >
                    {failures.length
                      ? `${failures.length} below AA`
                      : `${contrast.length} pairs clear AA`}
                  </span>
                </div>
                {failures.length ? (
                  <ul className="divide-y divide-border/60">
                    {failures.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-baseline gap-2 px-4 py-2 text-[11px]"
                      >
                        <span className="font-medium">{f.label}</span>
                        <span className="text-muted-foreground">({f.mode})</span>
                        <span className="ml-auto font-mono tabular-nums text-amber-600 dark:text-amber-400">
                          {f.ratio.toFixed(2)}:1
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
                    Every text-on-surface pair in this theme clears 4.5:1 in both light
                    and dark — body text, cards, popovers, all four button variants, the
                    sidebar and the muted helper text that most themes get wrong.
                  </p>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
                  <h2 className="flex items-center gap-1.5 text-xs font-semibold">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    Chart colours under colour blindness
                  </h2>
                  <span
                    className={cn(
                      'rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      collisions.length
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                    )}
                  >
                    {collisions.length ? `${collisions.length} flagged` : 'all distinct'}
                  </span>
                </div>
                {collisions.length ? (
                  <ul className="divide-y divide-border/60">
                    {collisions.map((finding) => (
                      <li key={finding.vision} className="px-4 py-2 text-[11px]">
                        <span className="font-medium">{finding.vision}:</span>{' '}
                        <span className="text-muted-foreground">
                          {finding.pairs
                            .map(([a, b]) => `${a.replace('chart-', '')} & ${b.replace('chart-', '')}`)
                            .join(', ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
                    The five series stay five colours under protanopia, deuteranopia and
                    tritanopia. The lightnesses are solved onto the hues rather than
                    fixed, which is what makes that hold as you turn the hue.
                  </p>
                )}
                <p className="border-t border-border/60 bg-muted/20 px-4 py-2 text-[10px] leading-relaxed text-muted-foreground">
                  Same model as the{' '}
                  <Link
                    href="/tools/colorblind"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    simulator
                  </Link>
                  . A legend should still carry a second cue — no palette makes colour
                  alone sufficient.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* The other two ways out. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <CopyCssCard code={css} title="globals.css" language="css" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Replace the <code className="font-mono">:root</code>,{' '}
              <code className="font-mono">.dark</code> and{' '}
              <code className="font-mono">@theme inline</code> blocks. The last one is
              the part people forget — in Tailwind v4 the variables alone give you
              nothing, because <code className="font-mono">bg-primary</code> only exists
              once that block maps it.
            </p>
          </div>
          <div className="space-y-2">
            <CopyCssCard
              code={JSON.stringify(item, null, 2)}
              title="registry-item.json"
              language="json"
            />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              What the install command above fetches. Commit it to your own repo if you
              would rather serve the theme yourself — it is a plain{' '}
              <code className="font-mono">registry:theme</code> item and the CLI does not
              care where it comes from.
            </p>
          </div>
        </div>

        <UseInCatalog tool={TOOL} />
      </div>
    </ToolLayout>
  )
}

/* ============================================================
 *  One token row
 * ========================================================== */

function TokenRow({
  token,
  value,
  overridden,
  onChange,
  onReset,
}: {
  token: string
  value: string
  overridden: boolean
  onChange: (hex: string) => void
  onReset: () => void
}) {
  const hex = tokenToHex(value)

  return (
    <li className="flex items-center gap-2 px-4 py-1.5 hover:bg-muted/30">
      {/*
        A translucent token — dark mode's border is `oklch(1 0 0 / 10%)` —
        has no hex, so there is nothing for a colour input to hold. Shown
        as a read-only swatch rather than silently flattened to opaque,
        which would quietly change what installs.
      */}
      {hex ? (
        <input
          type="color"
          aria-label={`--${token}`}
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 shrink-0 cursor-pointer rounded border border-border bg-background p-0.5"
        />
      ) : (
        <span
          aria-hidden
          title="Translucent — edit this one in the CSS"
          className="h-6 w-8 shrink-0 rounded border border-dashed border-border"
          style={{ background: value }}
        />
      )}
      <code className="min-w-0 flex-1 truncate font-mono text-[11px]">--{token}</code>
      <code className="hidden shrink-0 font-mono text-[10px] text-muted-foreground sm:block">
        {hex ?? 'alpha'}
      </code>
      <button
        type="button"
        onClick={onReset}
        disabled={!overridden}
        aria-label={`Reset --${token}`}
        className="shrink-0 rounded p-1 text-muted-foreground transition-opacity hover:text-foreground disabled:pointer-events-none disabled:opacity-0"
      >
        <RotateCcw className="h-3 w-3" />
      </button>
    </li>
  )
}

/* ============================================================
 *  Live preview
 * ========================================================== */

/**
 * The theme, on the real components.
 *
 * The whole mechanism is the inline custom properties: everything inside
 * resolves `bg-primary` through `var(--primary)`, so setting the variables
 * on this wrapper re-themes real shadcn components with no re-render of
 * anything and no second copy of the design system to keep in step.
 *
 * `dark` is a class as well as a set of values. The variables alone would
 * paint the surfaces correctly and leave every `dark:` utility inside a
 * component pointing the wrong way — which is exactly the class of bug a
 * preview exists to catch.
 *
 * `--field` is Hoverlab's own token, not shadcn's, and is derived here
 * rather than exported: our Input borders resolve through it, so without
 * it the preview would draw an input this theme does not describe.
 */
function ThemePreview({
  tokens,
  radius,
  mode,
}: {
  tokens: Record<string, string>
  radius: string
  mode: 'light' | 'dark'
}) {
  const vars: Record<string, string> = { '--radius': radius }
  for (const [name, value] of Object.entries(tokens)) vars[`--${name}`] = value
  vars['--field'] = tokens.border
  const style = vars as React.CSSProperties

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Outside the themed wrapper on purpose. Inside it, this label
          would be painted in the previewed theme's own muted colours over
          the page's background — two token sets fighting, and in dark mode
          the result was a caption nobody could read. It labels the
          preview; it is not part of it. */}
      <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/40 px-3 py-2 text-[11px] font-medium text-muted-foreground">
        {mode === 'dark' ? (
          <Moon className="h-3 w-3" aria-hidden />
        ) : (
          <Sun className="h-3 w-3" aria-hidden />
        )}
        <span className="capitalize">{mode}</span>
      </div>

      <div
        style={style}
        className={cn(
          'space-y-4 bg-background p-4 text-foreground',
          mode === 'dark' && 'dark',
        )}
      >
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="secondary">
            Secondary
          </Button>
          <Button size="sm" variant="outline">
            Outline
          </Button>
          <Button size="sm" variant="ghost">
            Ghost
          </Button>
          <Button size="sm" variant="destructive">
            Delete
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 text-card-foreground">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">Project settings</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Muted text, which is where most themes quietly fail AA.
              </p>
            </div>
            <Badge>Live</Badge>
          </div>

          <div className="mt-3 space-y-1.5">
            <Label htmlFor={`${mode}-name`} className="text-xs">
              Name
            </Label>
            <Input
              id={`${mode}-name`}
              defaultValue="hoverlab"
              className="h-8 text-xs"
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs">Public registry</span>
            <Switch defaultChecked aria-label="Public registry" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <span className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
            Accent
          </span>
        </div>

        {/* The chart tokens, at the size a legend actually uses them —
            which is where two similar colours stop being two colours. */}
        <div>
          <div className="flex h-16 items-end gap-1.5">
            {[1, 2, 3, 4, 5].map((n, i) => (
              <div
                key={n}
                className="flex-1 rounded-t"
                style={{
                  background: `var(--chart-${n})`,
                  height: `${45 + i * 13}%`,
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ background: `var(--chart-${n})` }}
                />
                Series {n}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-stretch overflow-hidden rounded-lg border border-border">
          <div className="w-24 shrink-0 bg-sidebar p-2 text-sidebar-foreground">
            <div className="rounded bg-sidebar-primary px-1.5 py-1 text-[10px] font-medium text-sidebar-primary-foreground">
              Overview
            </div>
            <div className="mt-1 rounded px-1.5 py-1 text-[10px] text-sidebar-foreground/70">
              Billing
            </div>
          </div>
          <div className="flex-1 bg-popover p-2 text-popover-foreground">
            <p className="text-[10px] text-muted-foreground">Popover surface</p>
            <p className="mt-1 text-xs font-medium">Sidebar and popover</p>
          </div>
        </div>
      </div>
    </div>
  )
}
