/**
 * /preview/builder?b=hero-split,pricing-tiers — a composition, alone, in a
 * real viewport.
 *
 * ── WHY IT IS A SEPARATE ROUTE FROM /preview/{level}/{id} ───────────────
 *
 * That route takes an id and prerenders every one of them, because the set
 * of artifacts is known at build time. A composition is not in that set: it
 * is something the reader invented thirty seconds ago and the only record
 * of it is the query string. So this one is dynamic, has no
 * `generateStaticParams`, and cannot be prerendered — which is also why it
 * is capped by the same `MAX_SECTIONS` the builder is. The URL is public
 * and a stranger can type it.
 *
 * ── WHY /builder NEEDS IT AT ALL ────────────────────────────────────────
 *
 * The same constraint that produced `/preview/{level}/{id}`, restated for a
 * page instead of a section: Tailwind's `sm:` and `md:` are viewport media
 * queries, so showing a composition in a 375px-wide box renders the desktop
 * layout squeezed. A composed page is exactly where that lie is most
 * expensive — the reader is checking whether five sections stack correctly
 * together, which is the one thing they cannot check by reading source.
 *
 * ── THEME ───────────────────────────────────────────────────────────────
 *
 * Passed in `?t=`, unlike the artifact frame, which deliberately takes no
 * theme parameter. The difference is that there the theme is the reader's
 * light/dark choice, which `localStorage` already carries across the frame
 * boundary; here it is a palette the reader built in the builder's own theme
 * bar, which lives in the URL and nowhere else. Without it, switching to
 * mobile would silently drop the colours the reader just chose.
 *
 * `noindex`, like the artifact frame: this is a chrome-less duplicate of
 * `/builder`, and an infinite family of them.
 */

import type { Metadata } from 'next'

import { PreviewGuard } from '@/components/preview-guard'
import { getBlockPreview } from '@/lib/blocks/registry'
import { COMPOSITION_PARAM, parseComposition, THEME_PARAM } from '@/lib/builder/compose'
import { COMPOSITION_THEME_CLASS, compositionTheme } from '@/lib/builder/theme'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function CompositionPreviewFrame({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { ids } = parseComposition(params[COMPOSITION_PARAM])
  const theme = compositionTheme(params[THEME_PARAM])

  const dir = params.dir
  const rtl = (Array.isArray(dir) ? dir[0] : dir) === 'rtl'

  return (
    <main
      dir={rtl ? 'rtl' : undefined}
      className={`min-h-screen bg-background text-foreground ${COMPOSITION_THEME_CLASS}`}
    >
      {/* The token overrides, scoped to this wrapper. Inert markup when the
          composition carries no theme, which is the common case. */}
      {theme.css ? <style>{theme.css}</style> : null}

      {ids.length === 0 ? (
        <p className="p-8 text-sm text-muted-foreground">
          Nothing in this composition. Add a section in the builder.
        </p>
      ) : (
        ids.map((id, i) => (
          <PreviewGuard key={`${id}-${i}`}>{getBlockPreview(id)}</PreviewGuard>
        ))
      )}
    </main>
  )
}
