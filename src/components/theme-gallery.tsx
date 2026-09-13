'use client'

/**
 * The preset gallery on /themes.
 *
 * ── WHAT A THEME GALLERY IS ACTUALLY FOR ────────────────────────────────
 *
 * Not for choosing a colour — the bar above every catalog grid does that in
 * one click. This page exists to answer the question a colour picker cannot:
 * "what would this catalog look like as MY product". So the unit here is a
 * whole theme with a name and a stated use — accent, neutrals, typeface and
 * corners moved together — rather than four independent axes.
 *
 * ── THE THUMBNAILS ARE DRAWN, THE PREVIEW IS REAL ───────────────────────
 *
 * Eight themes cannot all be live at once: there is one document and it has
 * one theme. So each card draws itself from six inline colours (see
 * `thumbnailColors`, which is explicit about being approximate), and the
 * accurate preview is the section below it — real blocks from the catalog,
 * rendered by the browser in whichever theme is applied. Pretending the
 * cards were live previews would be the dishonest version of this page.
 *
 * ── COPY CSS GIVES YOU THE INPUTS, NOT THE OUTPUTS ──────────────────────
 *
 * Nine custom properties rather than eighty finished colours. They keep
 * working if the derivation is improved, and they are small enough that
 * somebody will actually read them before pasting. `/api/v1/dna/{id}` is
 * still there for anyone who wants every resolved token.
 *
 * ACCESSIBILITY: each card is a real `<button>` carrying `aria-pressed`, so
 * the applied theme is perceivable without relying on the ring; the
 * thumbnail is `aria-hidden` and every fact it encodes is repeated as text
 * beneath it; the copy confirmation is a polite live region rather than a
 * tooltip.
 */

import * as React from 'react'
import { Check, Copy, RotateCcw } from 'lucide-react'

import { useThemeStudio } from '@/hooks/use-theme-studio'
import {
  fontById,
  themeCss,
  thumbnailColors,
  THEME_PRESETS,
  type ThemePreset,
} from '@/lib/theme-studio'

function Thumbnail({ preset }: { preset: ThemePreset }) {
  const c = thumbnailColors(preset)
  const radius = `${preset.radiusRem}rem`
  const font = fontById(preset.fontId)
  return (
    <div
      aria-hidden
      style={{
        background: c.page,
        borderColor: c.border,
        borderRadius: `calc(${radius} + 0.25rem)`,
        fontFamily: font.stack,
      }}
      className="border p-3"
    >
      {/* A bar, a card with a button, and two text lines: the smallest
          arrangement in which a change of neutral, corner or typeface is
          actually visible. */}
      <div className="flex items-center justify-between gap-2">
        <span
          style={{ background: c.ink, borderRadius: radius }}
          className="h-1.5 w-10 opacity-80"
        />
        <span
          style={{ background: c.accent, borderRadius: radius }}
          className="h-4 w-10"
        />
      </div>

      <div
        style={{ background: c.card, borderColor: c.border, borderRadius: radius }}
        className="mt-2.5 border p-2.5"
      >
        <p style={{ color: c.ink }} className="text-[11px] font-semibold leading-tight">
          Aa Whole sections
        </p>
        <p style={{ color: c.muted }} className="mt-1 text-[10px] leading-tight">
          Neutrals, corners and type — not only the accent.
        </p>
        <span
          style={{ background: c.accent, color: c.onAccent, borderRadius: radius }}
          className="mt-2 inline-block px-2 py-1 text-[10px] font-semibold"
        >
          Get started
        </span>
      </div>
    </div>
  )
}

export function ThemeGallery() {
  const { theme, ready, isCustom, preset, set, reset } = useThemeStudio()
  const [copied, setCopied] = React.useState<string | null>(null)

  async function copy(target: ThemePreset | null) {
    const css = themeCss(target ?? theme)
    try {
      await navigator.clipboard?.writeText(css)
      setCopied(target?.id ?? 'current')
      window.setTimeout(() => setCopied(null), 1800)
    } catch {
      /* Clipboard is absent over plain http and in some embedded webviews. */
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {!ready
            ? 'Loading your theme…'
            : preset
              ? `Applied: ${preset.name}.`
              : isCustom
                ? 'Applied: a custom theme you built with the bar above.'
                : 'Applied: the catalog default.'}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => copy(null)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied === 'current' ? (
              <Check aria-hidden className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy aria-hidden className="h-3.5 w-3.5" />
            )}
            Copy the applied theme as CSS
          </button>
          {isCustom ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RotateCcw aria-hidden className="h-3.5 w-3.5" />
              Back to default
            </button>
          ) : null}
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {THEME_PRESETS.map((option) => {
          const on = ready && preset?.id === option.id
          return (
            <li key={option.id}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-3 transition-colors ${
                  on ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <button
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
                  className="rounded-xl text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Thumbnail preset={option} />

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{option.name}</h3>
                    {on ? (
                      <span className="inline-flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                        <Check aria-hidden className="h-3 w-3" />
                        Applied
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Apply
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">{option.note}</p>

                  {/* Everything the thumbnail encodes, as text. */}
                  <dl className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <div className="flex gap-1">
                      <dt className="sr-only">Typeface</dt>
                      <dd>{fontById(option.fontId).name}</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt className="sr-only">Corner radius</dt>
                      <dd>{option.radiusRem}rem corners</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt className="sr-only">Neutral chroma</dt>
                      <dd>
                        {option.base.chroma === 0
                          ? 'true grey'
                          : `tint ×${option.base.chroma}`}
                      </dd>
                    </div>
                  </dl>
                </button>

                <button
                  type="button"
                  onClick={() => copy(option)}
                  className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-[11px] font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {copied === option.id ? (
                    <Check aria-hidden className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy aria-hidden className="h-3 w-3" />
                  )}
                  {copied === option.id ? 'CSS copied' : 'Copy CSS'}
                  <span className="sr-only"> for the {option.name} theme</span>
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <p aria-live="polite" className="sr-only">
        {copied ? 'Theme CSS copied to the clipboard' : ''}
      </p>

      <details className="mt-6 rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          What the copied CSS contains
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          Nine custom properties — the inputs, not the eighty colours derived
          from them. Paste them into your own <code>:root</code> and the
          derivation in <code>globals.css</code> does the rest, which means
          the theme keeps working when that derivation is improved. If you
          want every resolved token instead, <code>/api/v1/dna/&#123;id&#125;</code>
          serves them.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed">
          <code dir="ltr">{themeCss(theme)}</code>
        </pre>
      </details>
    </div>
  )
}
