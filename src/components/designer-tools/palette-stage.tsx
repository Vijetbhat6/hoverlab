'use client'

/**
 * The live palette preview's stage and controls.
 *
 * Split from the route because of what it renders: the blocks in the preview
 * are the catalog's real blocks, server components among them, and they are
 * handed in as already-rendered nodes. A client component cannot import the
 * block registry without dragging every block into the client graph — the
 * registry says as much at the top of the file — so the page does the lookup
 * on the server and this holds the state.
 *
 * That is also the whole idea of the tool. The palette does not repaint a
 * mock-up drawn for the occasion; it repaints a pricing table, a dashboard
 * and a nav bar that exist, that are installed by `npx shadcn add`, and that
 * are styled against exactly the tokens being generated here. A palette looks
 * fine as five rectangles. It is a different question whether the secondary
 * text on the plan card is still readable, and that question has an answer
 * only if the plan card is real.
 *
 * How the repaint works: every derived token is written as a CSS custom
 * property on one wrapper element, and the blocks below inherit them. No
 * iframe, no rebuild, no round trip — the blocks read `bg-background` and
 * `text-muted-foreground` like everything else on the site, and a custom
 * property set on an ancestor is the mechanism those were always resolving
 * through.
 */

import * as React from 'react'
import { Brush, Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SliderField } from '@/components/control-field'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { ToolWorkbench } from '@/components/designer-tools/tool-workbench'
import { useToolState } from '@/hooks/use-tool-state'
import { brandFromHex, normalizeHex } from '@/lib/color-tools'
import {
  auditContrast,
  DEFAULT_PALETTE,
  deriveTokens,
  paletteToCss,
  PALETTE_PRESETS,
  tokensToStyle,
  type PaletteInput,
} from '@/lib/palette-preview'
import { cn } from '@/lib/utils'

const TOOL = '/tools/palette-preview'

/** One real block from the catalog, rendered on the server. */
export interface PaletteSample {
  id: string
  name: string
  /** What this surface is here to prove. */
  note: string
  node: React.ReactNode
}

interface PaletteState extends PaletteInput {
  /** Which scheme the stage is showing. */
  scheme: 'light' | 'dark'
  /** Which sample is on screen — all of them at once is a lot of page. */
  sample: string
}

const DEFAULT_STATE: PaletteState = {
  ...DEFAULT_PALETTE,
  scheme: 'light',
  sample: 'all',
}

export function PaletteStage({ samples }: { samples: PaletteSample[] }) {
  const tool = useToolState<PaletteState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const update = (patch: Partial<PaletteState>) => setState((s) => ({ ...s, ...patch }))

  const palette: PaletteInput = React.useMemo(
    () => ({
      background: state.background,
      foreground: state.foreground,
      primary: state.primary,
      accent: state.accent,
      radius: state.radius,
    }),
    [state.background, state.foreground, state.primary, state.accent, state.radius],
  )

  const tokens = React.useMemo(
    () => deriveTokens(palette, state.scheme),
    [palette, state.scheme],
  )
  const checks = React.useMemo(() => auditContrast(tokens), [tokens])
  // Advisory checks are shown and not counted — see the note on the field.
  const failures = checks.filter((check) => !check.passes && !check.advisory)
  const css = React.useMemo(() => paletteToCss(palette), [palette])

  const shown = state.sample === 'all' ? samples : samples.filter((s) => s.id === state.sample)

  const brand = brandFromHex(state.primary)

  return (
    <ToolLayout
      name="Live Palette Preview"
      tagline="Four colours, applied to real components — a nav bar, a hero, a pricing table, a dashboard — repainted as you drag, in both schemes, with the contrast of every pair that carries text checked while you work"
      icon={<Brush className="h-5 w-5" />}
    >
      <ToolWorkbench controlsWidth="380px">
        <div className="min-w-0 space-y-4">
          {/* Which surface, and which scheme. */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              <SurfaceChip
                label="Everything"
                active={state.sample === 'all'}
                onClick={() => update({ sample: 'all' })}
              />
              {samples.map((sample) => (
                <SurfaceChip
                  key={sample.id}
                  label={sample.name}
                  active={state.sample === sample.id}
                  onClick={() => update({ sample: sample.id })}
                />
              ))}
            </div>
            <div className="ml-auto flex overflow-hidden rounded-lg border border-border">
              {(['light', 'dark'] as const).map((scheme) => (
                <button
                  key={scheme}
                  type="button"
                  onClick={() => update({ scheme })}
                  aria-pressed={state.scheme === scheme}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                    state.scheme === scheme
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted',
                  )}
                >
                  {scheme === 'light' ? (
                    <Sun className="h-3.5 w-3.5" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" />
                  )}
                  {scheme}
                </button>
              ))}
            </div>
          </div>

          {/*
            The stage.

            `dark` goes on the wrapper when the dark scheme is being previewed
            so the handful of blocks that carry an explicit `dark:` utility —
            a green "up" arrow, mostly — follow the preview rather than the
            site. It is a one-way switch: the variant is defined as
            `&:is(.dark *)`, so a class can turn the dark styles ON inside a
            light page but cannot turn them OFF inside a dark one. Everything
            that matters is token-driven and repaints either way; this is the
            fringe, and it is better to say so than to pretend otherwise.
          */}
          <div
            className={cn(
              'overflow-hidden rounded-2xl border border-border shadow-sm',
              state.scheme === 'dark' && 'dark',
            )}
            style={{
              ...(tokensToStyle(tokens, state.radius) as React.CSSProperties),
              background: 'var(--background)',
              color: 'var(--foreground)',
            }}
          >
            {/* The primitives first: this is the row that changes most
                visibly, and the one every block below is built out of. */}
            <div className="space-y-4 border-b border-border p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Primary action</Button>
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
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Badge</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Input
                  className="h-9 max-w-[240px]"
                  placeholder="An input, and its focus ring"
                  aria-label="Sample input"
                />
              </div>
              <p className="text-sm">
                Body text on the page background.{' '}
                <span className="text-muted-foreground">
                  Secondary text, which is where a palette usually fails.
                </span>{' '}
                <a href="#contrast" className="text-primary underline underline-offset-2">
                  A link in the brand colour.
                </a>
              </p>
            </div>

            {shown.map((sample) => (
              <section key={sample.id} className="border-b border-border last:border-b-0">
                {/*
                  The label sits outside the block's own surface, in the
                  preview's colours, so it never reads as part of the block.
                */}
                <p className="border-b border-border bg-muted px-4 py-1.5 text-[11px] font-medium text-muted-foreground">
                  {sample.name} — {sample.note}
                </p>
                {sample.node}
              </section>
            ))}
          </div>

          {/* Contrast, against the derived tokens rather than the input. */}
          <div id="contrast" className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold">
                Contrast in the {state.scheme} scheme
              </h2>
              <p className="text-xs text-muted-foreground">
                {failures.length === 0
                  ? 'Every pair clears its level.'
                  : `${failures.length} pair${failures.length === 1 ? '' : 's'} below the line.`}
              </p>
            </div>
            <ul className="mt-3 space-y-1.5">
              {checks.map((check) => (
                <li
                  key={check.label}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                >
                  <span
                    aria-hidden
                    className="h-4 w-8 shrink-0 rounded border border-border"
                    style={{ background: check.background, color: check.foreground }}
                  >
                    <span className="block text-center text-[9px] leading-4">Aa</span>
                  </span>
                  <span className="min-w-0 flex-1 truncate">{check.label}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {check.ratio.toFixed(2)}:1
                  </span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                      check.passes
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : check.advisory
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-destructive/15 text-destructive',
                    )}
                    title={check.requirement}
                  >
                    {check.passes
                      ? 'pass'
                      : check.advisory
                        ? `under ${check.required}:1`
                        : `needs ${check.required}:1`}
                  </span>
                </li>
              ))}
            </ul>
            {failures.length ? (
              <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
                {failures[0].requirement}. The usual fix is a darker text colour
                rather than a different brand — the brand is the part you are
                least willing to change, and the one least often at fault.
              </p>
            ) : null}
          </div>

          <CopyCssCard code={css} title="globals.css" language="css" />

          <UseInCatalog brand={brand} tool={TOOL} />
        </div>

        {/* ------------------------------------------------ Controls */}
        <div className="space-y-5">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">The four decisions</Label>
            <ColorRow
              label="Background"
              hint="The page itself"
              value={state.background}
              onChange={(background) => update({ background })}
            />
            <ColorRow
              label="Text"
              hint="Body copy — the greys are derived from it"
              value={state.foreground}
              onChange={(foreground) => update({ foreground })}
            />
            <ColorRow
              label="Primary"
              hint="Buttons, links, focus rings"
              value={state.primary}
              onChange={(primary) => update({ primary })}
            />
            <ColorRow
              label="Accent"
              hint="Hover surfaces take its hue, not its saturation"
              value={state.accent}
              onChange={(accent) => update({ accent })}
            />
            <SliderField
              label="Radius"
              description="Blocks read --radius for every corner they draw, so this is a theme decision rather than a per-component one. Zero is a terminal; one is a consumer app."
              value={state.radius}
              min={0}
              max={1.5}
              step={0.025}
              display={`${state.radius.toFixed(3)}rem`}
              onChange={(radius) => update({ radius })}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Start from</Label>
            <div className="grid gap-2">
              {PALETTE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    update({
                      background: preset.background,
                      foreground: preset.foreground,
                      primary: preset.primary,
                      accent: preset.accent,
                      radius: preset.radius,
                    })
                  }
                  className="flex items-center gap-3 rounded-lg border border-border p-2 text-left transition-colors hover:bg-muted"
                >
                  <span aria-hidden className="flex shrink-0 overflow-hidden rounded-md border border-border">
                    {[preset.background, preset.foreground, preset.primary, preset.accent].map(
                      (hex) => (
                        <span
                          key={hex}
                          className="h-6 w-4"
                          style={{ background: hex }}
                        />
                      ),
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">{preset.name}</span>
                    <span className="block text-[11px] leading-snug text-muted-foreground">
                      {preset.note}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-medium">What is being repainted</h2>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              These are the catalog&apos;s own blocks, not a mock-up drawn for
              this page — the same files{' '}
              <code className="font-mono">npx shadcn add</code> installs. They
              read the semantic tokens above, which is why four colours can
              repaint all of them and why the answer you get here is the answer
              you get in your own project.
            </p>
          </div>

          <ToolPresetsBar tool={tool} noun="palette" />
        </div>
      </ToolWorkbench>
    </ToolLayout>
  )
}

function SurfaceChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-background hover:bg-muted',
      )}
    >
      {label}
    </button>
  )
}

/**
 * A native colour well plus the hex.
 *
 * The text field takes anything `normalizeHex` accepts — three digits, no
 * hash — and only commits when it parses, so typing over a value does not
 * repaint the stage to black halfway through the third character.
 */
function ColorRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
}) {
  const id = React.useId()
  const [draft, setDraft] = React.useState(value)

  // Follow the value when a preset changes it out from under the field.
  React.useEffect(() => setDraft(value), [value])

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-xs font-semibold">
          {label}
        </Label>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
      <div className="flex gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1"
        />
        <input
          type="text"
          aria-label={`${label} hex`}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            const normalized = normalizeHex(e.target.value)
            if (normalized) onChange(normalized)
          }}
          className={cn(
            'h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 font-mono text-xs uppercase',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        />
      </div>
    </div>
  )
}
