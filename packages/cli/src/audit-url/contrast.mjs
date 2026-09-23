/**
 * Built-in WCAG contrast measurement over rendered text.
 *
 * WHAT IS MEASURED
 *
 * Every element that directly owns visible text: its painted text colour
 * (`-webkit-text-fill-color` when it overrides `color`), against the first
 * opaque background found walking up from the element, with every
 * translucent layer between them composited in order. The threshold comes
 * from the computed size and weight, not from the source: 4.5:1, or 3:1 for
 * text of at least 24px, or 18.66px bold.
 *
 * WHAT IS DELIBERATELY SKIPPED, AND COUNTED
 *
 * A measurement that guesses is worse than none, so these are skipped and
 * the counts are reported beside the result:
 *
 *   - text over a `background-image` (a gradient or a photo has no single
 *     colour, and the answer depends on where in it the text sits);
 *   - gradient-clipped text and fully transparent text;
 *   - text inside inline SVG (painted by `fill`, not `color`);
 *   - disabled controls (WCAG 1.4.3 exempts inactive components);
 *   - hidden, inert, zero-area and effectively invisible (opacity < 5%) text.
 *
 * KNOWN BLIND SPOTS
 *
 * The background is found by walking ANCESTORS. Text absolutely positioned
 * over an unrelated sibling image is not seen, and text over a fixed header
 * that scrolled under it is not either. An `opacity` on an ancestor dims the
 * text here but not that ancestor's own background, which is a small
 * overestimate of the ratio and never an underestimate of a failure.
 * axe-core, when present, is merged in by the caller to cover part of that.
 */

import { composite, contrastRatio, formatRatio, requiredRatio, toHex } from './color.mjs'
import { effectiveOpacity, hasBox, inSvg, isHiddenSubtree, quote, selectorFor } from './dom.mjs'

const CANVAS_LIGHT = [255, 255, 255, 1]
const CANVAS_DARK = [18, 18, 18, 1] // Chromium's canvas when `color-scheme: dark` is in force

/** The colour under everything: the root's own background, else the browser canvas. */
function canvasFor(elements, page) {
  const html = elements[0]
  if (html && html.bg[3] >= 0.999) return html.bg
  const scheme = String(page.colorScheme ?? '')
  return scheme.includes('dark') && !scheme.includes('light') ? CANVAS_DARK : CANVAS_LIGHT
}

/**
 * The effective background of an element, or null when it cannot be known.
 *
 * @returns {{ rgb: number[] } | { unknown: true }}
 */
export function backgroundOf(elements, index, canvas) {
  const layers = []
  let base = null
  for (let j = index; j >= 0; j = elements[j].p) {
    const record = elements[j]
    if (record.bgImg) return { unknown: true }
    if (record.bg[3] > 0) {
      if (record.bg[3] >= 0.999) {
        base = record.bg
        break
      }
      layers.push(record.bg)
    }
  }
  let rgb = base ?? canvas
  for (let n = layers.length - 1; n >= 0; n--) rgb = composite(layers[n], rgb)
  return { rgb }
}

/**
 * @param {object[]} elements  records from `measurePage`
 * @param {object} page        the page block from `measurePage`
 * @param {{ page: string }} where  the path this page was loaded from
 */
export function analyzeContrast(elements, page, where) {
  const canvas = canvasFor(elements, page)
  const groups = new Map()
  const flagged = new Set()
  const skipped = { image: 0, svg: 0, disabled: 0, invisible: 0, transparent: 0 }
  let measured = 0

  for (const record of elements) {
    if (record.text === 0) continue
    if (record.tag === 'option' || record.tag === 'title') continue
    if (record.bgText) {
      skipped.transparent++
      continue
    }
    if (inSvg(elements, record.i)) {
      skipped.svg++
      continue
    }
    if (record.dis) {
      skipped.disabled++
      continue
    }
    if (!hasBox(record) || isHiddenSubtree(elements, record.i)) {
      skipped.invisible++
      continue
    }
    // Fully left of, or above, the page origin: a skip link parked off-screen.
    if (record.r[0] + record.r[2] <= 0 || record.r[1] + record.r[3] <= 0) {
      skipped.invisible++
      continue
    }
    const opacity = effectiveOpacity(elements, record.i)
    if (opacity < 0.05) {
      skipped.invisible++
      continue
    }

    // `-webkit-text-fill-color` defaults to the computed `color`, so it is always the painted colour.
    const paint = record.fill
    if (paint[3] === 0) {
      skipped.transparent++
      continue
    }

    const background = backgroundOf(elements, record.i, canvas)
    if (background.unknown) {
      skipped.image++
      continue
    }

    const alpha = paint[3] * opacity
    const fg = composite([paint[0], paint[1], paint[2], alpha], background.rgb)
    const ratio = contrastRatio(fg, background.rgb)
    const { large, ratio: needed } = requiredRatio(record.fs, record.fw)
    measured++

    if (ratio >= needed) continue

    flagged.add(record.i)
    const key = `${toHex(fg)}|${toHex(background.rgb)}|${large ? 'large' : 'normal'}`
    let group = groups.get(key)
    if (!group) {
      group = {
        key,
        fg: toHex(fg),
        bg: toHex(background.rgb),
        ratio,
        needed,
        large,
        count: 0,
        examples: [],
      }
      groups.set(key, group)
    }
    group.count++
    if (group.examples.length < 5) {
      group.examples.push({
        page: where.page,
        selector: selectorFor(elements, record.i) + quote(record),
        detail: `${record.fs}px${Number(record.fw) >= 700 ? ' bold' : ''}, ${formatRatio(ratio)}`,
      })
    }
  }

  return { groups, flagged, skipped, measured }
}
