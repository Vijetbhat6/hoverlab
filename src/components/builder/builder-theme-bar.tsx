'use client'

/**
 * Restyling a composition, in the builder.
 *
 * ── WHY THIS IS THE RIGHT "EDIT INSIDE THE COMPOSITION" ─────────────────
 *
 * The competitors' builders let you edit the content of a section. This
 * catalog cannot honestly offer that: blocks here take no props, because
 * they are files you leave with and change in your editor — that is the
 * argument the whole site makes, and a prop panel would be a second,
 * worse editor for the same text.
 *
 * Tokens are the edit that IS ours to offer. Every block in the catalog
 * styles itself through `bg-background` and `text-muted-foreground` and
 * never a literal colour, so four knobs restyle all thirty sections at
 * once — and the result leaves with the reader as CSS they install, not as
 * a setting that lives on our side. See `lib/builder/theme.ts`.
 *
 * ── WHY THE COMMIT IS DEBOUNCED AND THE PREVIEW IS NOT ──────────────────
 *
 * The theme is in the URL like everything else, so a slider drag would be
 * one server round trip per pixel. Dragging paints locally at once — the
 * same custom-property trick `/tools/shadcn` uses, applied to a live swatch
 * strip — and the URL catches up when the reader stops moving. Nothing is
 * lost by the delay: the URL is where the theme is *saved*, and the reader
 * is still holding the slider.
 *
 * ── WHY THE PRESETS ARE THE GENERATOR'S OWN ─────────────────────────────
 *
 * `THEME_PRESETS` from `lib/shadcn-theme` rather than a list invented here.
 * A reader who lands on `/tools/shadcn` and one who lands on `/builder`
 * should be choosing between the same five starting points, and two lists
 * of presets would disagree within a month.
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Paintbrush, RotateCcw } from 'lucide-react'

import { builderHref } from '@/lib/builder/compose'
import {
  DEFAULT_THEME,
  encodeTheme,
  THEME_PRESETS,
  buildTheme,
  type ThemeState,
} from '@/lib/shadcn-theme'
import { cn } from '@/lib/utils'

/** How long the reader has to stop moving before the URL is rewritten. */
const COMMIT_DELAY = 350

export function BuilderThemeBar({
  ids,
  theme,
  malformed,
}: {
  /** The composition, so a theme change keeps the layout. */
  ids: string[]
  /** The theme as it stands, decoded on the server. Null means default. */
  theme: ThemeState | null
  /** True when `?t=` was present and unreadable. */
  malformed: boolean
}) {
  const router = useRouter()
  const [draft, setDraft] = React.useState<ThemeState>(theme ?? DEFAULT_THEME)
  const [open, setOpen] = React.useState(false)

  /*
   * The server's value wins whenever it changes — a back button, a shared
   * link, a reset. Compared by encoding rather than by reference, because
   * the decoded object is rebuilt on every server render and would
   * otherwise clobber the reader's in-flight slider every time they moved
   * a section.
   */
  const serverParam = theme ? encodeTheme(theme) : null
  const [appliedParam, setAppliedParam] = React.useState(serverParam)
  if (appliedParam !== serverParam) {
    setAppliedParam(serverParam)
    setDraft(theme ?? DEFAULT_THEME)
  }

  const draftParam = React.useMemo(() => encodeTheme(draft), [draft])
  const isDefault = draftParam === encodeTheme(DEFAULT_THEME)

  /*
   * One timer, cleared on every change and on unmount. Without the cleanup
   * a reader who drags a slider and then navigates away gets a push into a
   * page they have left.
   */
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  function schedule(next: ThemeState) {
    setDraft(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const param = encodeTheme(next)
      // The default theme is the absence of a theme, not a theme called
      // default: `?t=` for it would be a parameter that changes nothing and
      // makes every shared link look customised.
      const isDefaultNext = param === encodeTheme(DEFAULT_THEME)
      router.push(builderHref(ids, isDefaultNext ? null : param), { scroll: false })
    }, COMMIT_DELAY)
  }

  /* Swatches painted from the draft, so the strip moves with the slider
     rather than with the navigation. */
  const tokens = React.useMemo(() => buildTheme(draft), [draft])

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 px-2.5 text-xs font-medium transition-colors hover:bg-muted"
        >
          <Paintbrush aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
          Theme
        </button>

        {/* The presets, always visible. Most readers want one of five
            answers, and hiding them behind the same disclosure as the
            sliders would make the common case two clicks. */}
        <div role="radiogroup" aria-label="Theme preset" className="flex flex-wrap gap-1.5">
          {THEME_PRESETS.map((preset) => {
            const selected =
              draft.hue === preset.state.hue &&
              draft.chroma === preset.state.chroma &&
              draft.radius === preset.state.radius &&
              draft.neutralChroma === preset.state.neutralChroma

            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={selected}
                title={preset.note}
                onClick={() => schedule({ ...draft, ...preset.state })}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <span
                  aria-hidden
                  className="h-3 w-3 rounded-full border border-black/10"
                  style={{ background: `oklch(0.6 ${preset.state.chroma} ${preset.state.hue})` }}
                />
                {preset.name}
              </button>
            )
          })}
        </div>

        {!isDefault && (
          <button
            type="button"
            onClick={() => {
              setDraft(DEFAULT_THEME)
              if (timer.current) clearTimeout(timer.current)
              router.push(builderHref(ids, null), { scroll: false })
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw aria-hidden className="h-3.5 w-3.5" />
            Reset
          </button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {isDefault
            ? 'The catalog default. Every section reads its colours from tokens.'
            : 'Applied to every section, and exported as CSS below.'}
        </span>
      </div>

      {malformed && (
        <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-2.5 text-xs">
          The theme in this link could not be read — something truncated it.
          The layout is intact; the colours are the catalog default.
        </p>
      )}

      {open && (
        <div className="mt-3 grid gap-4 border-t border-border/60 pt-3 sm:grid-cols-2">
          <Slider
            label="Brand hue"
            value={draft.hue}
            min={0}
            max={360}
            step={1}
            suffix="°"
            onChange={(hue) => schedule({ ...draft, hue })}
          />
          <Slider
            label="Brand chroma"
            value={draft.chroma}
            min={0}
            max={0.3}
            step={0.005}
            places={3}
            onChange={(chroma) => schedule({ ...draft, chroma })}
          />
          <Slider
            label="Corner radius"
            value={draft.radius}
            min={0}
            max={2}
            step={0.025}
            places={3}
            suffix="rem"
            onChange={(radius) => schedule({ ...draft, radius })}
          />
          <Slider
            label="Neutral tint"
            value={draft.neutralChroma}
            min={0}
            max={0.03}
            step={0.001}
            places={3}
            onChange={(neutralChroma) => schedule({ ...draft, neutralChroma })}
          />

          {/* Six tokens, as a sanity check that the knobs did what the
              reader expected before they scroll down to the whole page. */}
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground">Tokens</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {['primary', 'secondary', 'accent', 'muted', 'card', 'border'].map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1 text-[11px] text-muted-foreground"
                >
                  <span
                    aria-hidden
                    className="h-3 w-3 rounded-sm border border-black/10"
                    style={{ background: tokens.light[name] }}
                  />
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** One labelled range input, with its value shown. */
function Slider({
  label,
  value,
  min,
  max,
  step,
  places = 0,
  suffix = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  places?: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-xs font-medium">
        {label}
        <span className="tabular-nums text-muted-foreground">
          {value.toFixed(places)}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 w-full accent-primary"
      />
    </label>
  )
}
