'use client'

/**
 * Style — the four axes, plus the palette the accent was picked from.
 *
 * ── THE ORDER IS THE ARGUMENT ───────────────────────────────────────────
 *
 * Named themes, then accent, then neutrals, then type and corners. Eight
 * named themes is a decision and four axes is a design brief, so the
 * decision comes first — the same ordering `ThemeStudioBar` settled on and
 * for the same reason.
 *
 * Within the axes, neutrals come second rather than last, which is the one
 * departure from what people expect. Everyone changes their accent; almost
 * nobody changes their greys, which is why every startup site looks like
 * the same site in a different colour. Putting neutrals directly under the
 * accent is the cheapest way to make it a question someone answers instead
 * of a default they inherit.
 *
 * ── WHY THE HARMONY ROW IS HERE AND NOT A TAB OF ITS OWN ────────────────
 *
 * A five-colour palette is not a design system — the rules allow exactly
 * one chromatic token and say so. So the palette generator folds in as the
 * *way you choose* an accent rather than as a parallel output: pick a base
 * and a harmony, and the five colours it produces are five candidates, one
 * click from being the accent the whole canvas is wearing. That is the
 * question a harmony actually answers for someone building a product, and
 * it is the one thing the standalone tool could not do — it produced five
 * hexes and then you were on your own.
 *
 * The other four colours are not thrown away so much as not pretended
 * about. They are good for a chart series or an illustration and the
 * document does not claim they are part of the system, because they are not.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Dice5, RotateCcw } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  BASE_PRESETS,
  FONT_CHOICES,
  RADIUS_STOPS,
  THEME_PRESETS,
  accentSwatch,
  baseSwatch,
  matchingPreset,
} from '@/lib/theme-studio'
import { BRAND_PRESETS } from '@/lib/brand-presets'
import { PALETTE_SCHEMES } from '@/lib/tools/permalinks/palette'
import { normalizeHex, oklchInSrgbGamut, randomHex } from '@/lib/color-tools'
import {
  accentCandidates,
  accentHex,
  radiusStopName,
  withAccentHex,
  type StudioState,
} from '@/lib/studio/state'
import { cn } from '@/lib/utils'

/** Human labels for the harmonies. The ids are kebab-case and unreadable. */
const SCHEME_LABELS: Record<string, string> = {
  analogous: 'Analogous',
  complementary: 'Complementary',
  triadic: 'Triadic',
  'split-complementary': 'Split comp.',
  tetradic: 'Tetradic',
  monochromatic: 'Monochromatic',
  shades: 'Shades',
}

function Group({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </legend>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </fieldset>
  )
}

const chipClass = (on: boolean) =>
  cn(
    'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    on ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted',
  )

export interface StyleTabProps {
  state: StudioState
  onChange: React.Dispatch<React.SetStateAction<StudioState>>
  /** Resets the four axes and the harmony base. Never the identity. */
  onResetLook: () => void
}

export function StyleTab({ state, onChange, onResetLook }: StyleTabProps) {
  const uid = React.useId()
  const { theme } = state
  const preset = matchingPreset(theme)
  const candidates = accentCandidates(state)
  const currentHex = accentHex(theme).toLowerCase()

  /*
    The hex field is kept as its own draft string rather than being driven
    from `accentHex(theme)`. A controlled input fed a normalised value
    cannot be typed into: `#1` normalises to nothing, so the field would
    snap back on the second keystroke. The draft is null whenever the field
    is not being edited, which is what lets the displayed value follow a
    change made anywhere else on the tab.
  */
  const [hexDraft, setHexDraft] = React.useState<string | null>(null)

  /*
    True when the accent cannot be shown in sRGB at all, which is not an
    edge case — the catalog's own default (L 0.55, C 0.2, hue 160) is one.
    OKLCH describes colours sRGB cannot reach, and a browser asked for one
    clips it: the emerald default lands as #009145, which is hue 151 at
    chroma 0.155 rather than hue 160 at 0.2.
  */
  const outOfGamut = !oklchInSrgbGamut({
    l: theme.accent.lightL,
    c: theme.accent.chroma,
    h: theme.accent.hue,
  })

  const patchTheme = (part: Partial<typeof theme>) =>
    onChange((s) => ({ ...s, theme: { ...s.theme, ...part } }))

  const patchAccent = (part: Partial<typeof theme.accent>) =>
    onChange((s) => ({ ...s, theme: { ...s.theme, accent: { ...s.theme.accent, ...part } } }))

  /*
    Reads `s.theme.base` from the updater, not `theme.base` from this
    render's closure. The neutral tint is a slider, so it fires per frame
    during a drag, and spreading a render-old branch into each update
    discards anything that landed in between — the same reason
    `patchAccent` above is written this way.
  */
  const patchBase = (part: Partial<typeof theme.base>) =>
    onChange((s) => ({ ...s, theme: { ...s.theme, base: { ...s.theme.base, ...part } } }))

  /*
    Commit only a hex that differs from the one on display, and that guard
    is the whole reason this is not a one-liner.

    The field shows `accentHex`, which is the accent clipped into sRGB — and
    where the accent is out of gamut (the default is), the clip moves the
    hue. Re-deriving the accent from that string on every blur would walk
    the accent 9° away from where the user put it, on a field they only
    tabbed through. Comparing first makes the field a readout until someone
    actually edits it.
  */
  function commitHex(value: string) {
    const hex = normalizeHex(value)
    setHexDraft(null)
    if (!hex || hex.toLowerCase() === currentHex) return
    onChange((s) => withAccentHex({ ...s, paletteBase: hex }, hex))
  }

  return (
    <div className="space-y-6">
      {/* ---- Named themes ------------------------------------------ */}
      <Group
        label="Start from a theme"
        hint="Four axes set at once. Everything below stays editable afterwards."
      >
        <div className="flex flex-wrap gap-1.5">
          {THEME_PRESETS.map((option) => {
            const on = preset?.id === option.id
            return (
              <button
                key={option.id}
                type="button"
                title={option.note}
                aria-pressed={on}
                onClick={() =>
                  patchTheme({
                    accent: option.accent,
                    base: option.base,
                    fontId: option.fontId,
                    radiusRem: option.radiusRem,
                  })
                }
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  on ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted',
                )}
              >
                <span
                  aria-hidden
                  className="h-3 w-3 rounded-full border border-border/60"
                  style={{ background: accentSwatch(option.accent) }}
                />
                {option.name}
              </button>
            )
          })}
        </div>
      </Group>

      {/* ---- Accent ------------------------------------------------ */}
      <div className="space-y-4 rounded-xl border border-border/60 p-4">
        <Group
          label="Accent"
          hint="The only chromatic colour in the system. Everything else is a neutral."
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {BRAND_PRESETS.map((option) => {
              const on = Math.abs(theme.accent.hue - option.hue) < 0.5
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    patchAccent({ hue: option.hue, chroma: option.chroma })
                  }
                  className="relative h-7 w-7 rounded-full border border-border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  style={{ background: option.swatch }}
                >
                  {on ? (
                    <Check
                      aria-hidden
                      className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow"
                    />
                  ) : null}
                  {/* A swatch is not a label. */}
                  <span className="sr-only">{option.name}</span>
                </button>
              )
            })}

            <label htmlFor={`${uid}-hex`} className="sr-only">
              Accent as a hex value
            </label>
            <Input
              id={`${uid}-hex`}
              value={hexDraft ?? currentHex}
              onChange={(e) => setHexDraft(e.target.value)}
              onBlur={(e) => commitHex(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitHex(e.currentTarget.value)
              }}
              spellCheck={false}
              className="ms-1 h-7 w-24 font-mono text-xs"
            />
          </div>

          {outOfGamut ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              <strong className="font-semibold text-foreground">Outside sRGB.</strong>{' '}
              This accent is more saturated than a standard screen can show, so
              browsers clip it — the hex beside it is what actually renders, and it
              is a slightly different hue. Harmless on a wide-gamut display and on
              any browser that honours <code className="font-mono">oklch()</code>;
              lower the saturation if you need the two to agree.
            </p>
          ) : null}
        </Group>

        {/*
          Hue and chroma as sliders, and lightness deliberately NOT beside
          them at the same size. The two lightnesses are a contrast
          decision — the defaults are the values measured at 5.01:1 and
          8.33:1 against the two page grounds — and offering them as a
          peer of "hue" invites someone to drag the accent below AA while
          looking at a colour they like. They are still reachable, below,
          labelled as what they are.
        */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-baseline justify-between">
              <Label>Hue</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {Math.round(theme.accent.hue)}°
              </span>
            </div>
            <Slider
              aria-label="Accent hue"
              value={[theme.accent.hue]}
              onValueChange={([v]) => patchAccent({ hue: v ?? 0 })}
              min={0}
              max={360}
              step={1}
              className="mt-2"
            />
            <div
              aria-hidden
              className="mt-1.5 h-1.5 rounded-full"
              style={{
                background:
                  'linear-gradient(to right, oklch(0.6 0.2 0), oklch(0.6 0.2 60), oklch(0.6 0.2 120), oklch(0.6 0.2 180), oklch(0.6 0.2 240), oklch(0.6 0.2 300), oklch(0.6 0.2 360))',
              }}
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <Label>Saturation</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {theme.accent.chroma.toFixed(3)}
              </span>
            </div>
            <Slider
              aria-label="Accent saturation"
              value={[theme.accent.chroma]}
              onValueChange={([v]) => patchAccent({ chroma: v ?? 0 })}
              min={0}
              max={0.3}
              step={0.005}
              className="mt-2"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              OKLCH holds lightness still as this moves, so button contrast does not
              drift while you tune.
            </p>
          </div>
        </div>

        <details className="group">
          <summary className="cursor-pointer list-none text-xs font-medium text-muted-foreground underline-offset-4 hover:underline">
            Accent lightness (measured for contrast — change with care)
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-baseline justify-between">
                <Label>On light</Label>
                <span className="font-mono text-xs text-muted-foreground">
                  {theme.accent.lightL.toFixed(2)}
                </span>
              </div>
              <Slider
                id={`${uid}-lightl`}
                aria-label="Accent lightness in the light theme"
                value={[theme.accent.lightL]}
                onValueChange={([v]) => patchAccent({ lightL: v ?? 0.5 })}
                min={0.2}
                max={0.8}
                step={0.01}
                className="mt-2"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <Label>On dark</Label>
                <span className="font-mono text-xs text-muted-foreground">
                  {theme.accent.darkL.toFixed(2)}
                </span>
              </div>
              <Slider
                id={`${uid}-darkl`}
                aria-label="Accent lightness in the dark theme"
                value={[theme.accent.darkL]}
                onValueChange={([v]) => patchAccent({ darkL: v ?? 0.7 })}
                min={0.4}
                max={0.95}
                step={0.01}
                className="mt-2"
              />
            </div>
            <p className="text-[11px] text-muted-foreground sm:col-span-2">
              Two values for one accent, because a lightness that reads on white
              disappears on the dark ground. The defaults are the ones measured at
              5.01:1 and 8.33:1 against the two page backgrounds — the canvas shows
              what your change does to the muted pair, but check your own buttons in{' '}
              <Link href="/tools/contrast" className="underline underline-offset-2">
                the contrast checker
              </Link>{' '}
              before shipping a change here.
            </p>
          </div>
        </details>

        {/* ---- The harmony row ------------------------------------- */}
        <Group
          label="Or pick from a harmony"
          hint="Five candidates off one base colour. Click one to make it the accent."
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {PALETTE_SCHEMES.map((scheme) => (
              <button
                key={scheme}
                type="button"
                aria-pressed={state.paletteScheme === scheme}
                onClick={() => onChange((s) => ({ ...s, paletteScheme: scheme }))}
                className={chipClass(state.paletteScheme === scheme)}
              >
                {SCHEME_LABELS[scheme] ?? scheme}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const hex = randomHex()
                onChange((s) => ({ ...s, paletteBase: hex }))
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Dice5 aria-hidden className="h-3.5 w-3.5" />
              Random base
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {candidates.map((hex) => {
              const on = hex.toLowerCase() === currentHex
              return (
                <button
                  key={hex}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange((s) => withAccentHex(s, hex))}
                  className={cn(
                    'group/swatch overflow-hidden rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    on ? 'border-primary' : 'border-border hover:border-foreground/30',
                  )}
                >
                  <span aria-hidden className="block h-9 w-20" style={{ background: hex }} />
                  <span className="block bg-card px-1 py-0.5 font-mono text-[10px]">
                    {hex.toUpperCase()}
                  </span>
                  <span className="sr-only">
                    Use {hex.toUpperCase()} as the accent{on ? ' (current)' : ''}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Only the hue and saturation travel — the lightness pair above is a
            contrast decision and is left where you set it. The other four colours
            are fine for a chart series; they are not part of the system, and the
            document does not claim they are.
          </p>
        </Group>
      </div>

      {/* ---- Neutrals ---------------------------------------------- */}
      <Group
        label="Neutrals"
        hint="What actually makes two products look different. Warm surfaces against cool ink in light, swapped in dark."
      >
        <div className="flex flex-wrap gap-1.5">
          {BASE_PRESETS.map((option) => {
            const on =
              Math.abs(theme.base.warmHue - option.warmHue) < 0.5 &&
              Math.abs(theme.base.coolHue - option.coolHue) < 0.5 &&
              Math.abs(theme.base.chroma - option.chroma) < 0.001
            return (
              <button
                key={option.id}
                type="button"
                title={option.note}
                aria-pressed={on}
                onClick={() =>
                  patchTheme({
                    base: {
                      warmHue: option.warmHue,
                      coolHue: option.coolHue,
                      chroma: option.chroma,
                    },
                  })
                }
                className={cn('inline-flex items-center gap-1.5', chipClass(on))}
              >
                <span
                  aria-hidden
                  className="h-3 w-3 rounded-full border border-border/60"
                  style={{ background: baseSwatch(option) }}
                />
                {option.name}
              </button>
            )
          })}
        </div>

        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <Label>Tint strength</Label>
            <span className="font-mono text-xs text-muted-foreground">
              {theme.base.chroma.toFixed(2)}×
            </span>
          </div>
          <Slider
            aria-label="Neutral tint strength"
            value={[theme.base.chroma]}
            onValueChange={([v]) => patchBase({ chroma: v ?? 1 })}
            min={0}
            max={3}
            step={0.05}
            className="mt-2"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            A multiplier on the per-token amounts, not an absolute: 0 is a true grey,
            1× is what the catalog ships, 3× is visibly tinted. Relative keeps the
            proportion between a background and a card instead of flattening both.
          </p>
        </div>
      </Group>

      {/* ---- Type and corners -------------------------------------- */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${uid}-font`}>Typeface</Label>
          <select
            id={`${uid}-font`}
            value={theme.fontId}
            onChange={(e) => patchTheme({ fontId: e.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
          >
            {FONT_CHOICES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {FONT_CHOICES.find((f) => f.id === theme.fontId)?.note}
          </p>
        </div>

        <Group label="Corners">
          <div className="flex flex-wrap gap-1.5">
            {RADIUS_STOPS.map((stop) => {
              const on = Math.abs(theme.radiusRem - stop.rem) < 0.001
              return (
                <button
                  key={stop.name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => patchTheme({ radiusRem: stop.rem })}
                  className={chipClass(on)}
                >
                  {stop.name}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {theme.radiusRem}rem
            {radiusStopName(theme.radiusRem) ? '' : ' — between two stops'}. One token, and
            every <code className="font-mono">rounded-*</code> utility follows it.
          </p>
        </Group>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
        <button
          type="button"
          onClick={onResetLook}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw aria-hidden className="h-3.5 w-3.5" />
          Reset the look
        </button>
        <Link
          href="/themes"
          className="ms-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Browse named themes
          <ArrowRight aria-hidden className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
