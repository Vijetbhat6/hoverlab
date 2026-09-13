/**
 * /themes — the catalog, in eight named looks.
 *
 * ── WHY THIS PAGE EXISTS ────────────────────────────────────────────────
 *
 * A visitor evaluating a component catalog is not asking "are these blocks
 * well built". They are asking "would my product look like this", and until
 * now the honest answer was "not unless indigo is your brand". Everything
 * needed to answer it properly was already in the repo — the brand tokens,
 * the shape axes, the template palettes — and all of it was reachable only
 * through an API or a download.
 *
 * So: named themes, applied to the whole site in one click, with the real
 * catalog rendered underneath as the proof. The control bar above every
 * catalog grid is the same mechanism in one line; this page is where the
 * decisions live.
 *
 * ── THE PREVIEW BELOW IS THE REAL CATALOG ───────────────────────────────
 *
 * Three actual blocks from `registry.tsx` — not screenshots, not a mock-up
 * drawn for this page. They render against the document's own tokens, so
 * whichever theme is applied is what they are wearing. That is the whole
 * claim the page makes and it would be worthless if the preview were a
 * picture.
 *
 * Server-rendered, apart from the gallery itself, which has to be a client
 * component because the theme lives in `localStorage`.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Palette } from 'lucide-react'

import { ThemeGallery } from '@/components/theme-gallery'
import { BlockPreview } from '@/components/blocks/block-preview'
import { THEME_PRESETS } from '@/lib/theme-studio'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { absoluteUrl } from '@/lib/site'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd } from '@/lib/structured-data'

const TITLE = `${THEME_PRESETS.length} Themes for the Whole Catalog — Hoverlab`
const DESCRIPTION =
  'Recolour every block, page and template at once. Accent, neutrals, typeface and corner radius, as eight named themes or four controls — applied live, copied out as nine lines of CSS.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'tailwind theme',
    'shadcn theme',
    'design tokens',
    'theme generator',
    'css variables',
    'oklch palette',
  ],
  alternates: { canonical: '/themes' },
  openGraph: {
    url: absoluteUrl('/themes'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/*
  The three blocks the live preview shows.

  Chosen to cover the three places a theme change is visible and easy to get
  wrong: a marketing surface with a filled primary button, a dense product
  surface full of borders and muted text, and a form whose fields depend on
  --field being distinguishable from --border. A theme that survives all
  three survives the catalog.
*/
const PREVIEWED = [
  { id: 'pricing-tiers', label: 'A marketing section — the accent on a filled button' },
  { id: 'dashboard-stat-cards', label: 'A dense product surface — borders and muted text' },
  { id: 'crud-create-modal', label: 'A form — where --field has to beat --border' },
]

export default function ThemesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Themes' }])} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Palette aria-hidden className="h-3.5 w-3.5" />
            Themes
          </span>

          <h1 className="type-hub mt-5">The whole catalog, in your colours</h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-body">
            Four axes — accent, neutrals, typeface, corners — moved together
            and applied to every preview on the site at once. Not a swatch
            page: {BLOCK_COUNT} blocks, {' '}
            <Link href="/pages" className="font-medium underline underline-offset-4">
              every page
            </Link>{' '}
            and every template are redrawn in whichever theme you pick.
          </p>

          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Most catalogs let you change the accent. Changing the{' '}
            <em>neutrals</em> is what actually stops a product looking like
            every other product, so that is an axis here rather than a
            footnote.
          </p>
        </header>

        <section aria-labelledby="theme-presets" className="mt-12">
          <h2 id="theme-presets" className="sr-only">
            Named themes
          </h2>
          <ThemeGallery />
        </section>

        {/* ---- The proof ------------------------------------------- */}
        <section aria-labelledby="theme-preview" className="mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="theme-preview" className="text-2xl font-bold tracking-tight">
              Rendered live, not screenshotted
            </h2>
            <Link
              href="/blocks"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-all hover:gap-2 hover:text-foreground"
            >
              All {BLOCK_COUNT} blocks
              <ArrowRight aria-hidden className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            These are three real blocks out of the catalog, rendered by your
            browser against the tokens the theme above sets. Change the theme
            and they change with it — which is the only demonstration worth
            making, because a picture of a themed component proves nothing.
          </p>

          <div className="mt-6 space-y-8">
            {PREVIEWED.map((item) => (
              <figure key={item.id}>
                <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{item.label}</span>
                  <Link
                    href={`/block/${item.id}`}
                    className="font-mono text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    {item.id}
                  </Link>
                </figcaption>
                <div className="overflow-hidden rounded-2xl border border-border">
                  <BlockPreview componentKey={item.id} />
                </div>
              </figure>
            ))}
          </div>
        </section>

        {/* ---- What this is not ------------------------------------ */}
        <section className="mt-16 rounded-2xl border border-dashed border-border/60 p-6">
          <h2 className="text-lg font-bold tracking-tight">
            What a theme here does and does not move
          </h2>
          <div className="mt-3 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">It moves</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li>The accent, and everything derived from it — buttons, links, focus rings.</li>
                <li>The neutrals, in both light and dark, including the borders.</li>
                <li>The typeface for all body and heading text.</li>
                <li>Corner radius, through the one token every rounded utility reads.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">It deliberately does not</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li>
                  Spacing density or the type scale. Both exist in the export,
                  and both change how the page <em>lays out</em> — a catalog
                  whose gutters move while you browse is one you cannot
                  compare two cards in.
                </li>
                <li>
                  Semantic colours. Destructive stays red and success stays
                  green in every theme, because those carry meaning rather
                  than brand.
                </li>
                <li>
                  Anything on the server. The theme lives in this browser and
                  is not sent anywhere.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
