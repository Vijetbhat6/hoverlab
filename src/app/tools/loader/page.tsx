/**
 * Loader generator.
 *
 * A server component, like the palette preview and unlike the other tools,
 * because of what it feeds the client: the catalog's own Loaders category.
 * `lib/effects` carries every effect's markup and CSS and is server-only —
 * importing it from a `'use client'` file would put 1.6 MB of JSON in the
 * browser bundle to render 35 spinners. The filter happens here, and only the
 * loaders travel.
 *
 * The rail is not decoration. A generator next to a gallery is two products
 * that ignore each other; the loaders handed down here are the generator's
 * starting points, read for their own size, duration and colour by
 * `seedFromCss`. That is the difference between "here are some loaders you
 * could copy" and "here is that loader, on sliders".
 */

import { LoaderStudio, type CatalogLoader } from '@/components/designer-tools/loader-studio'
import { EFFECTS } from '@/lib/effects'

export default function LoaderToolPage() {
  /*
    Only the four fields the studio reads.

    Passing whole `Effect` records would serialise descriptions, aliases and
    insight metadata into the RSC payload for no reason — this page ships 35
    of them, and the rail renders a preview and a name.
  */
  const catalog: CatalogLoader[] = EFFECTS.filter(
    (effect) => effect.category === 'Loaders',
  ).map((effect) => ({
    id: effect.id,
    name: effect.name,
    html: effect.html,
    css: effect.css,
    tags: effect.tags ?? [],
    darkSurface: effect.darkSurface,
  }))

  return <LoaderStudio catalog={catalog} />
}
