/**
 * Recolours a live preview to match the palette its template ships.
 *
 * ── THE PROBLEM THIS SOLVES ─────────────────────────────────────────────
 *
 * A template's colours live in the `app/globals.css` that lands in the
 * download. The previews on this site do not read that file — they render
 * the page components directly, against Hoverlab's own tokens. So without
 * this component the four landing templates would ship four palettes and
 * display four identical indigo screenshots, which is worse than not having
 * given them palettes at all: the grid would be advertising a difference it
 * then fails to show.
 *
 * ── HOW ─────────────────────────────────────────────────────────────────
 *
 * A `<style>` element carrying one rule per theme, and a wrapper div
 * carrying the class those rules name. Everything inside sets its colours
 * from `var(--primary)` and friends, so redefining the variables on an
 * ancestor is enough — no component needs to know it is being themed.
 *
 * Server-rendered, so the preview is the right colour on first paint. See
 * `paletteScopeCss` for why this is a stylesheet rather than an inline
 * `style` attribute.
 *
 * ── WHY THE STYLE TAG IS NOT DEDUPED ────────────────────────────────────
 *
 * Two cards with the same palette emit the same rule twice. That is a few
 * hundred bytes and an identical redefinition — cheaper than the module-
 * level registry that avoiding it would need, and it keeps the component
 * self-contained enough to drop anywhere. Palettes are per-template and a
 * grid holds four, so the duplication has a ceiling.
 */

import * as React from 'react'

import {
  getPalette,
  paletteClassName,
  paletteScopeCss,
} from '@/lib/templates/palettes'

export function PaletteScope({
  palette: paletteId,
  className = '',
  children,
}: {
  /** Palette id from the template record. Undefined renders children as-is. */
  palette: string | undefined
  className?: string
  children: React.ReactNode
}) {
  const palette = getPalette(paletteId)

  // No palette is the common case — the seven app-shell templates share the
  // catalog's own tokens on purpose. Returning children unwrapped keeps
  // their markup exactly as it was before this component existed.
  if (!palette) {
    return className ? <div className={className}>{children}</div> : <>{children}</>
  }

  return (
    <div className={`${paletteClassName(palette)} ${className}`.trim()}>
      <style
        // Generated from a typed literal in this repo, never from input.
        dangerouslySetInnerHTML={{ __html: paletteScopeCss(palette) }}
      />
      {children}
    </div>
  )
}
