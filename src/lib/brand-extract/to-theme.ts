/**
 * An extraction, as the four-axis theme the live bar and `/studio` already use.
 *
 * Client-safe and dependency-light: `/themes` calls it in the browser on the
 * JSON the route returned, so there is one mapping and no second copy on the
 * server that could disagree with the preview.
 *
 * ── WHAT IT DOES NOT DO, ON PURPOSE ─────────────────────────────────────
 *
 * It does not apply the site's own typeface. Hoverlab ships five (see
 * `FONT_CHOICES`) and loading an arbitrary one per visitor is the twenty
 * network requests `theme-studio.ts` argues against. So a detected "Inter" is
 * applied as the nearest of the five and *reported* as a substitution, and
 * the UI says which. A tool that quietly showed Geist and called it "your
 * font" would be the failure this whole module is built to avoid.
 *
 * It keeps the catalog's own lightness. Hue and chroma come from the site;
 * lightness is pinned to the values `globals.css` tuned for AA contrast
 * against the surfaces. A pale yellow brand at its own lightness would put
 * `text-primary` at 1.4:1 on white, and "this is your brand" is not worth an
 * unreadable button.
 */

import { coerceBrandColor } from '@/lib/brand-presets'
import { brandFromHex } from '@/lib/color-tools'
import { DEFAULT_THEME, type ThemeStudioValue } from '@/lib/theme-studio'
import type { BrandExtraction } from './extract'

/**
 * The lightness the stylesheet ships, restated because the theme model's own
 * default (`DEFAULT_BRAND_COLOR`, 0.55) is stale.
 *
 * `globals.css` darkened `--brand-light-l` from 0.49 to 0.47 so that
 * `text-primary` on a `bg-primary/10` badge clears 4.5:1, and left
 * `brand-presets.ts` at 0.55. At 0.55 white text on the primary is 4.46:1 for
 * green hues — a fail — which an earlier version of this file inherited by
 * reading the model's default. `to-theme.test.ts` sweeps every hue against
 * these two numbers so they cannot drift back.
 */
export const AA_LIGHT_L = 0.47
export const AA_DARK_L = 0.7

export interface ThemeFromExtraction {
  theme: ThemeStudioValue
  /** Axes that came from the site, for the "applied" line. */
  applied: Array<'accent' | 'font' | 'radius'>
  /** Where the site's own choice could not be honoured, in a sentence each. */
  substitutions: string[]
  /** `/studio?…`, carrying the same axes across. */
  studioHref: string
}

/** The one of Hoverlab's five typefaces nearest a detected one. */
export function nearestFontId(
  name: string,
  kind: 'sans' | 'serif' | 'mono',
  system: boolean,
): { id: string; exact: boolean } {
  const lower = name.toLowerCase()
  if (lower === 'geist' || lower === 'geist sans') return { id: 'geist', exact: true }
  if (lower === 'space grotesk') return { id: 'grotesk', exact: true }
  if (lower === 'source serif' || lower === 'source serif pro' || lower === 'source serif 4') {
    return { id: 'serif', exact: true }
  }
  if (lower === 'jetbrains mono') return { id: 'mono', exact: true }
  if (kind === 'serif') return { id: 'serif', exact: false }
  if (kind === 'mono') return { id: 'mono', exact: false }
  // A site on the system stack asked for nothing to be downloaded; the
  // faithful reading of that is the option that downloads nothing.
  if (system) return { id: 'system', exact: false }
  return { id: 'geist', exact: false }
}

export function themeFromExtraction(
  extraction: BrandExtraction,
  base: ThemeStudioValue = DEFAULT_THEME,
): ThemeFromExtraction {
  const applied: ThemeFromExtraction['applied'] = []
  const substitutions: string[] = []
  let theme: ThemeStudioValue = base

  const from = extraction.primary ? brandFromHex(extraction.primary.value.hex) : null
  if (from) {
    const accent = coerceBrandColor({
      hue: from.hue,
      chroma: from.chroma,
      lightL: AA_LIGHT_L,
      darkL: AA_DARK_L,
    })
    if (accent) {
      theme = { ...theme, accent }
      applied.push('accent')
    }
  }

  const font = extraction.bodyFont?.value
  if (font) {
    const { id, exact } = nearestFontId(font.name, font.kind, font.system)
    theme = { ...theme, fontId: id }
    applied.push('font')
    if (!exact) {
      const label = { geist: 'Geist', system: 'the system font', serif: 'Source Serif', mono: 'JetBrains Mono', grotesk: 'Space Grotesk' }[id] ?? id
      substitutions.push(
        `Your site uses ${font.name}. Hoverlab only ships five typefaces, so the preview uses ${label} — the nearest — and your export names ${font.name}.`,
      )
    }
  }

  if (extraction.radius) {
    theme = { ...theme, radiusRem: extraction.radius.value.rem }
    applied.push('radius')
  }

  const params = new URLSearchParams()
  if (from) {
    params.set('hue', String(theme.accent.hue))
    params.set('chroma', String(theme.accent.chroma))
  }
  if (extraction.radius) params.set('radius', String(theme.radiusRem))
  if (font) params.set('font', theme.fontId)

  return {
    theme,
    applied,
    substitutions,
    studioHref: params.size ? `/studio?${params}` : '/studio',
  }
}
