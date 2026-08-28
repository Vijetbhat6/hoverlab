/**
 * Live palette preview.
 *
 * A server component, unlike every other tool page, and for one reason: the
 * things being previewed are the catalog's real blocks. The block registry is
 * deliberately not a client module — some blocks are server components, and
 * importing the registry from `'use client'` would drag all 183 of them into
 * the browser bundle — so the lookup happens here and the rendered nodes are
 * handed to `<PaletteStage>`, which holds the state.
 *
 * The choice of samples is the argument the tool is making. Every one of them
 * is a surface where a palette fails differently:
 *
 *   A nav bar is mostly border and muted text, which is where a background
 *   and a text colour that "look fine" stop being fine.
 *   A hero is the brand at full size, next to body copy.
 *   A pricing table is the one place a product shows two levels of emphasis
 *   in the same row, so a weak primary shows up immediately.
 *   Dashboard stat cards are dense: small text on a card on a page, i.e.
 *   three surfaces deep, which is the case a swatch grid cannot show at all.
 *   A footer is the muted-on-muted case.
 *
 * Five surfaces, not twenty-five: the point is to be looked at, and a page
 * that takes three seconds to repaint is a page nobody drags a slider on.
 */

import { BlockPreview } from '@/components/blocks/block-preview'
import { PaletteStage, type PaletteSample } from '@/components/designer-tools/palette-stage'
import { getBlockMeta } from '@/lib/blocks/block-index'

/** Block id → why that block is in the stage. */
const SAMPLES: Array<{ id: string; note: string }> = [
  { id: 'navbar-simple', note: 'borders and muted text, at the top of every page' },
  { id: 'hero-split', note: 'the brand at full size, next to body copy' },
  { id: 'pricing-tiers', note: 'two levels of emphasis in one row' },
  { id: 'dashboard-stat-cards', note: 'small text, three surfaces deep' },
  { id: 'footer-minimal', note: 'the muted-on-muted case' },
]

export default function PalettePreviewPage() {
  /*
    A missing id is dropped rather than thrown on.

    These are hand-written references into a catalog that other people edit,
    which is exactly the data that rots — and the failure mode of a rename
    should be one fewer sample in the stage, not a 500 on a tool page that
    otherwise works perfectly. `check-paths.mts` exists because the guided
    paths made the opposite choice.
  */
  const samples: PaletteSample[] = SAMPLES.flatMap(({ id, note }) => {
    const meta = getBlockMeta(id)
    if (!meta) return []
    return [
      {
        id,
        name: meta.name,
        note,
        node: <BlockPreview componentKey={meta.previewComponent} />,
      },
    ]
  })

  return <PaletteStage samples={samples} />
}
