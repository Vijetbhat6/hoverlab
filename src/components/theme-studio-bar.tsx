'use client'

/**
 * The theme control that sits above every catalog grid.
 *
 * ── WHY IT IS HERE AND NOT ON A SETTINGS PAGE ───────────────────────────
 *
 * Because the question it answers is "would this catalog suit my product",
 * and that question is asked while looking at the catalog. A theme picker
 * behind a settings link is a theme picker nobody finds; one above the grid
 * turns 285 blocks into 285 blocks *in your colours*, which is the same
 * catalog doing considerably more work.
 *
 * It renders inside `CatalogLayout`, so /blocks, /pages, /templates,
 * /browse, /category, /kits, /paths and all four detail routes get it from
 * one file. Every preview on those pages renders live React against the
 * document's own tokens, so changing the tokens changes all of them at once
 * — there is no per-card wiring, and there deliberately is not one.
 *
 * ── COLLAPSED BY DEFAULT, AND THE COLLAPSED STATE IS USEFUL ─────────────
 *
 * One row: what the theme is now, and a way in. Expanded it is four axes.
 * A permanently open four-row control above every catalog page would be a
 * toolbar competing with the thing it themes — and the visitor who does not
 * care about theming should lose one line, not a screenful.
 *
 * The open/closed state persists per browser, because someone actively
 * trying themes opens it on one page and lands on another two clicks later.
 *
 * ── WHY THE PRESETS COME FIRST ──────────────────────────────────────────
 *
 * Four sliders is a design brief; eight named themes is a decision. Most
 * people want "make it look like a dev tool", not a hue in degrees, so the
 * presets are the first row and the axes below are the escape hatch for
 * people who know what they want.
 *
 * ── HYDRATION ───────────────────────────────────────────────────────────
 *
 * The saved theme lives in localStorage, which the server cannot read, so
 * the bar renders its default labels until `ready`. Rendering the saved
 * theme's name on the server would be a guess, and a wrong guess is a
 * hydration mismatch that throws the subtree away.
 *
 * ACCESSIBILITY: the disclosure carries `aria-expanded` and `aria-controls`;
 * each axis is a labelled group of `aria-pressed` buttons rather than a
 * bare row of swatches; every colour choice carries its name in text, since
 * a swatch alone is not a label; the "applies to every preview" note is a
 * polite live region so a screen-reader user learns the change landed.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, Palette, RotateCcw, SlidersHorizontal } from 'lucide-react'

import { useThemeStudio } from '@/hooks/use-theme-studio'
import {
  accentSwatch,
  baseSwatch,
  BASE_PRESETS,
  FONT_CHOICES,
  RADIUS_STOPS,
  THEME_PRESETS,
} from '@/lib/theme-studio'
import { BRAND_PRESETS } from '@/lib/brand-presets'

const OPEN_KEY = 'hoverlab:theme-studio-open'

export function ThemeStudioBar() {
  const uid = React.useId()
  const { theme, ready, isCustom, preset, set, patch, setAccent, reset } =
    useThemeStudio()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(OPEN_KEY) === '1')
    } catch {
      /* Site data switched off. The bar just starts closed. */
    }
  }, [])

  function toggle() {
    setOpen((wasOpen) => {
      const next = !wasOpen
      try {
        window.localStorage.setItem(OPEN_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const label = !ready
    ? 'Default'
    : (preset?.name ?? (isCustom ? 'Custom' : 'Default'))

  return (
    <div className="border-b border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ---- The one row that is always here --------------------- */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={`${uid}-panel`}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Palette aria-hidden className="h-4 w-4 text-primary" />
            Theme
            <span className="text-muted-foreground">{label}</span>
            <SlidersHorizontal
              aria-hidden
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                open ? 'rotate-90' : ''
              }`}
            />
          </button>

          {/* A swatch trio: what the accent, the surface and the corner
              currently are, readable without opening anything. */}
          <span aria-hidden className="flex items-center gap-1">
            <span
              className="h-4 w-4 rounded-full border border-border"
              style={{ background: accentSwatch(theme.accent) }}
            />
            <span
              className="h-4 w-4 rounded-full border border-border"
              style={{ background: baseSwatch(theme.base) }}
            />
            <span
              className="h-4 w-4 border border-field"
              style={{ borderRadius: `${Math.min(theme.radiusRem, 0.5)}rem` }}
            />
          </span>

          <span className="hidden text-xs text-muted-foreground sm:inline">
            Applies to every preview on the site.
          </span>

          <div className="ms-auto flex items-center gap-2">
            {isCustom ? (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw aria-hidden className="h-3 w-3" />
                Reset
              </button>
            ) : null}
            <Link
              href="/themes"
              className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Browse themes
            </Link>
          </div>
        </div>

        {/* ---- Four axes, on request -------------------------------- */}
        {open ? (
          <div id={`${uid}-panel`} className="space-y-4 pb-4 pt-1">
            {/* Presets first: a decision beats four sliders. */}
            <fieldset className="border-0 p-0">
              <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Themes
              </legend>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {THEME_PRESETS.map((option) => {
                  const on = preset?.id === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        set({
                          accent: option.accent,
                          base: option.base,
                          fontId: option.fontId,
                          radiusRem: option.radiusRem,
                        })
                      }
                      aria-pressed={on}
                      title={option.note}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        on
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted'
                      }`}
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
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* ---- Accent ---------------------------------------- */}
              <fieldset className="border-0 p-0">
                <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Accent
                </legend>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {BRAND_PRESETS.map((option) => {
                    const on = Math.abs(theme.accent.hue - option.hue) < 0.5
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setAccent({
                            hue: option.hue,
                            chroma: option.chroma,
                            lightL: option.lightL,
                            darkL: option.darkL,
                          })
                        }
                        aria-pressed={on}
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
                </div>
              </fieldset>

              {/* ---- Base ------------------------------------------ */}
              <fieldset className="border-0 p-0">
                <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Base
                </legend>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {BASE_PRESETS.map((option) => {
                    const on =
                      Math.abs(theme.base.warmHue - option.warmHue) < 0.5 &&
                      Math.abs(theme.base.coolHue - option.coolHue) < 0.5 &&
                      Math.abs(theme.base.chroma - option.chroma) < 0.001
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          patch({
                            base: {
                              warmHue: option.warmHue,
                              coolHue: option.coolHue,
                              chroma: option.chroma,
                            },
                          })
                        }
                        aria-pressed={on}
                        title={option.note}
                        className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          on ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                        }`}
                      >
                        {option.name}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              {/* ---- Font ------------------------------------------ */}
              <div>
                <label
                  htmlFor={`${uid}-font`}
                  className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Typeface
                </label>
                <select
                  id={`${uid}-font`}
                  value={theme.fontId}
                  onChange={(event) => patch({ fontId: event.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {FONT_CHOICES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ---- Radius ---------------------------------------- */}
              <fieldset className="border-0 p-0">
                <legend className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Corners
                </legend>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {RADIUS_STOPS.map((stop) => {
                    const on = Math.abs(theme.radiusRem - stop.rem) < 0.001
                    return (
                      <button
                        key={stop.name}
                        type="button"
                        onClick={() => patch({ radiusRem: stop.rem })}
                        aria-pressed={on}
                        className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          on ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                        }`}
                      >
                        {stop.name}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            </div>

            <p aria-live="polite" className="text-xs text-muted-foreground">
              {ready && isCustom
                ? `Showing ${label}. Every block, page and template preview on the site is rendered in it — nothing here is a screenshot.`
                : 'Pick a theme and the whole catalog is redrawn in it. Kept in this browser; nothing is sent anywhere.'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
