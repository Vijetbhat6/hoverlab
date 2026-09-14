import { test } from 'node:test'
import assert from 'node:assert/strict'

import { TEMPLATE_CATALOG } from './catalog'
import { PAGE_CATALOG } from '../pages/catalog'

/* ------------------------------------------------------------------ *
 *  Set pieces
 * ------------------------------------------------------------------ *
 *
 * `setPiece` is optional in the type and required in practice, exactly
 * like `palette`, and for the same reason: widening the field to required
 * would be a lie about what the file has to tolerate while a template is
 * being written. This file is what makes "required in practice" true.
 *
 * The `pageId` check is the one that earns its keep. A set piece naming a
 * screen the template does not contain is the failure this field invites —
 * it is easy to write while composing a route table, it typechecks, and
 * nothing on the site looks broken, because a card would simply link to a
 * page that is not in the download. That is a promise about what somebody
 * is about to pay for, so it fails the build rather than degrading.
 */

const PAGE_IDS = new Set(PAGE_CATALOG.map((p) => p.id))

for (const template of TEMPLATE_CATALOG) {
  test(`${template.id} names a set piece`, () => {
    const piece = template.setPiece
    assert.ok(piece, `${template.id} has no setPiece — see template-types.ts`)

    assert.ok(piece.name.trim().length > 0, `${template.id}: setPiece.name is empty`)
    assert.ok(piece.note.trim().length > 0, `${template.id}: setPiece.note is empty`)

    /* It renders on a card beside a two-line description. Past about
       forty-five characters it wraps to three lines and the card in that
       column grows taller than its neighbours. */
    assert.ok(
      piece.name.length <= 45,
      `${template.id}: setPiece.name is ${piece.name.length} chars, over the 45 a card can show`,
    )

    /* A set piece that restates the template's name is not a set piece —
       it is the thing the field exists to stop. */
    assert.notEqual(
      piece.name.toLowerCase().trim(),
      template.name.toLowerCase().trim(),
      `${template.id}: setPiece.name just repeats the template name`,
    )
  })

  test(`${template.id}'s set piece is on a screen it ships`, () => {
    const piece = template.setPiece
    assert.ok(piece)

    assert.ok(
      PAGE_IDS.has(piece.pageId),
      `${template.id}: setPiece.pageId "${piece.pageId}" is not a page in the catalog`,
    )

    const routed = template.routes.some((r) => r.pageId === piece.pageId)
    assert.ok(
      routed,
      `${template.id}: setPiece.pageId "${piece.pageId}" is a real page but is not one of this template's routes — the card would link to a screen the download does not contain`,
    )
  })
}

/* ------------------------------------------------------------------ *
 *  Route tables
 * ------------------------------------------------------------------ *
 *
 * Cheap invariants that only break when a route table is edited by hand,
 * which is the only way route tables are ever edited.
 */

for (const template of TEMPLATE_CATALOG) {
  test(`${template.id} has a coherent route table`, () => {
    assert.ok(template.routes.length > 0, `${template.id} has no routes`)

    for (const route of template.routes) {
      assert.ok(
        PAGE_IDS.has(route.pageId),
        `${template.id}: route ${route.path} names unknown page "${route.pageId}"`,
      )
      assert.ok(
        route.file.startsWith('app/') && route.file.endsWith('.tsx'),
        `${template.id}: route ${route.path} has file "${route.file}", which is not an app-router page`,
      )
    }

    /* Two routes writing to one file means the second silently overwrites
       the first in `assembleFiles`, and the generated project is missing a
       screen the route table promised. */
    const files = template.routes.map((r) => r.file)
    assert.equal(
      new Set(files).size,
      files.length,
      `${template.id}: two routes write to the same file`,
    )

    const paths = template.routes.map((r) => r.path)
    assert.equal(
      new Set(paths).size,
      paths.length,
      `${template.id}: two routes claim the same path`,
    )
  })
}

/* `previewPageId`, when set, is an override for the card thumbnail — so it
   has to be a screen the template actually renders, same argument as the
   set piece one rung up. */
for (const template of TEMPLATE_CATALOG) {
  if (!template.previewPageId) continue

  test(`${template.id}'s preview page is one of its routes`, () => {
    assert.ok(
      template.routes.some((r) => r.pageId === template.previewPageId),
      `${template.id}: previewPageId "${template.previewPageId}" is not among its routes`,
    )
  })
}
