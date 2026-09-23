'use client'

/**
 * "Start from your site" — paste an address, get the brand back.
 *
 * ── WHAT IT PROMISES, AND WHAT IT DOES NOT ──────────────────────────────
 *
 * It reads the colour, typeface and corner radius a site's own CSS declares,
 * and it shows where each came from and how far to trust it. It does not
 * promise to find a brand: a monochrome site has no colour to find, and a
 * site that styles itself from JavaScript ships almost no CSS to read. In
 * both cases the card says so and leaves the theme alone, because a theme
 * applied on a guess the visitor did not notice is worse than none.
 *
 * Nothing is applied until the visitor presses Apply, and Apply is undoable.
 * Reading a site is a request to a stranger's server; changing every preview
 * on the page is a separate decision.
 *
 * ── THE PREVIEW IS THE SAME PIPELINE AS THE EXPORT ──────────────────────
 *
 * Apply writes the theme through `useThemeStudio`, the same hook the bar and
 * the gallery use, so the blocks below re-render in the brand immediately.
 * "Open in the Studio" hands the same four axes across, and the Studio is
 * where the DTCG and Design DNA files come out — ungated there, like every
 * tool, so this card adds no second export path to keep in step.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Globe, Loader2, Undo2 } from 'lucide-react'

import { useThemeStudio } from '@/hooks/use-theme-studio'
import { fontById, type ThemeStudioValue } from '@/lib/theme-studio'
import type { BrandExtraction, Confidence } from '@/lib/brand-extract/extract'
import { themeFromExtraction } from '@/lib/brand-extract/to-theme'

const TRUST: Record<Confidence, { label: string; tone: string }> = {
  high: { label: 'Declared by the site', tone: 'text-foreground' },
  medium: { label: 'A deliberate signal', tone: 'text-foreground' },
  low: { label: 'A guess — check it', tone: 'text-muted-foreground' },
}

function Source({ confidence, source }: { confidence: Confidence; source: string }) {
  return (
    <p className="mt-0.5 text-[11px] text-muted-foreground">
      <span className={TRUST[confidence].tone}>{TRUST[confidence].label}</span> · {source}
    </p>
  )
}

export function BrandFromUrl() {
  const { theme, set } = useThemeStudio()
  const [input, setInput] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<BrandExtraction | null>(null)
  const [applied, setApplied] = React.useState(false)
  // The theme as it was before Apply, so Undo restores it rather than
  // resetting to the catalog default and losing what the visitor had.
  const before = React.useRef<ThemeStudioValue | null>(null)

  const mapped = React.useMemo(() => (result ? themeFromExtraction(result, theme) : null), [result, theme])
  // Only what would actually change, so "nothing found" cannot look like a result.
  const canApply = (mapped?.applied.length ?? 0) > 0

  async function read(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    setApplied(false)
    try {
      const response = await fetch('/api/brand/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input }),
      })
      const data = (await response.json().catch(() => ({}))) as BrandExtraction & { error?: string }
      if (!response.ok) {
        setError(data.error ?? 'That site could not be read.')
        return
      }
      setResult(data)
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  function apply() {
    if (!mapped) return
    before.current = theme
    set(mapped.theme)
    setApplied(true)
  }

  function undo() {
    if (before.current) set(before.current)
    setApplied(false)
  }

  return (
    <section
      aria-labelledby="brand-from-url"
      className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-5 sm:p-6"
    >
      <h2 id="brand-from-url" className="flex items-center gap-2 text-lg font-bold tracking-tight">
        <Globe aria-hidden className="h-4 w-4 text-primary" />
        Start from your site
      </h2>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
        Paste an address and Hoverlab reads the colour, typeface and corner radius the site
        declares, then shows where each came from. Nothing is applied until you say so.
      </p>

      <form onSubmit={read} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="brand-url" className="sr-only">
          Your website address
        </label>
        <input
          id="brand-url"
          type="text"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          placeholder="yourproduct.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
          {busy ? 'Reading…' : 'Read my brand'}
        </button>
      </form>

      <p className="mt-2 text-[11px] text-muted-foreground">
        The address is sent to our server once so it can fetch that page. It is not stored.
        Public sites only.
      </p>

      <div aria-live="polite" className="mt-4">
        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {result && mapped ? (
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs text-muted-foreground">
              Read{' '}
              <span className="font-medium text-foreground">{result.title ?? result.url}</span>
              {' '}— {result.scanned.stylesheets} stylesheet{result.scanned.stylesheets === 1 ? '' : 's'}
            </p>

            <dl className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Colour</dt>
                <dd className="mt-1.5">
                  {result.primary ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="h-7 w-7 shrink-0 rounded-md border border-black/10"
                          style={{ background: result.primary.value.hex }}
                        />
                        <span className="font-mono text-sm">{result.primary.value.hex}</span>
                      </div>
                      <Source confidence={result.primary.confidence} source={result.primary.source} />
                      {result.palette.length > 1 ? (
                        <div className="mt-2 flex gap-1" role="img" aria-label={`Other colours found: ${result.palette.slice(1).map((p) => p.hex).join(', ')}`}>
                          {result.palette.slice(1).map((p) => (
                            <span
                              key={p.hex}
                              aria-hidden
                              className="h-4 w-4 rounded border border-black/10"
                              style={{ background: p.hex }}
                            />
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No brand colour found.</p>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Typeface</dt>
                <dd className="mt-1.5">
                  {result.bodyFont ? (
                    <>
                      <p className="text-sm font-medium">{result.bodyFont.value.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {result.bodyFont.value.kind}
                        {result.bodyFont.value.system ? ', a system font' : ''}
                      </p>
                      <Source confidence={result.bodyFont.confidence} source={result.bodyFont.source} />
                      {result.headingFont ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Headings: <span className="text-foreground">{result.headingFont.value.name}</span>
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No typeface declared.</p>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Corners</dt>
                <dd className="mt-1.5">
                  {result.radius ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="h-7 w-7 shrink-0 border-l-2 border-t-2 border-foreground/60"
                          style={{ borderTopLeftRadius: `${result.radius.value.rem}rem` }}
                        />
                        <span className="text-sm font-medium">{result.radius.value.label}</span>
                      </div>
                      <Source confidence={result.radius.confidence} source={result.radius.source} />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No radius declared.</p>
                  )}
                </dd>
              </div>
            </dl>

            {mapped.substitutions.map((note) => (
              <p key={note} className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {note} <span className="sr-only">Previewing with {fontById(mapped.theme.fontId).name}.</span>
              </p>
            ))}
            {result.notes.map((note) => (
              <p key={note} className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {note}
              </p>
            ))}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {applied ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                    <Check aria-hidden className="h-4 w-4 text-primary" />
                    Applied — the blocks below are wearing it
                  </span>
                  <button
                    type="button"
                    onClick={undo}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Undo2 aria-hidden className="h-3.5 w-3.5" />
                    Undo
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={apply}
                  disabled={!canApply}
                  className="inline-flex min-h-9 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Apply to the whole site
                </button>
              )}
              <Link
                href={mapped.studioHref}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Open in the Studio to export
                <ArrowRight aria-hidden className="h-3.5 w-3.5 rtl:rotate-180" />
              </Link>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              The Studio writes the design tokens (W3C DTCG) and a Design DNA file for your coding agent.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
