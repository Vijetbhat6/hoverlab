/**
 * What breaks when the same page is laid out right-to-left.
 *
 * The page is measured twice, once as served and once with `dir="rtl"`
 * injected on `<html>` before any script runs. Everything here is a
 * comparison between those two measurements of the SAME elements (paired by
 * structural path), so a finding is always "this changed when the direction
 * did", never "this looks odd".
 *
 * WHAT IS DETECTED, AND HOW SURE IT IS
 *
 *   rtl-page-scroll        the page gets a horizontal scrollbar it did not
 *                          have. Certain: a document measurement.
 *   rtl-overflow           visible content that lies past a viewport edge in
 *                          RTL and did not in LTR. Right edge under RTL is
 *                          the start side, which a browser cannot scroll to,
 *                          so that content is simply gone. Certain about the
 *                          geometry; decorative shapes are excluded by only
 *                          looking at text, controls and media.
 *   rtl-clipped-text      an `overflow: hidden` box whose text no longer
 *                          fits when it did before, without an ellipsis.
 *   rtl-clipped            text partly hidden by an ancestor's overflow only
 *                          in RTL. Advisory: a carousel does this on purpose.
 *   rtl-not-mirrored       content that stayed on the same physical side
 *                          while its neighbourhood mirrored. Advisory: it is
 *                          sometimes deliberate (a phone number, a code
 *                          sample), so elements that are `direction: ltr`
 *                          are excluded and a neighbourhood must show that
 *                          mirroring did happen. The cause is read from the
 *                          computed style and named when it can be.
 *   rtl-icon-not-mirrored  a Lucide icon that the RTL ledger in
 *                          `review/rtl.mjs` rules "mirror" and that was not
 *                          flipped. Only icons that can be NAMED at runtime
 *                          are checked; an inline SVG with no class has no
 *                          name to look up, and guessing at a path's meaning
 *                          would be making it up.
 *   rtl-text-align         text hard-set to `left` or `right` under RTL.
 *
 * NOT ATTEMPTED: bidirectional text ordering, punctuation placement,
 * translated strings that are longer, and anything that needs real Arabic or
 * Hebrew copy. This swaps the direction, not the language.
 */

import * as rtlLedger from '../review/rtl.mjs'
import { chain, hasBox, inFixedSubtree, isHiddenSubtree, quote, selectorFor } from './dom.mjs'

const MEDIA = new Set(['img', 'svg', 'video', 'canvas', 'picture'])
const CONTROLS = new Set(['button', 'input', 'select', 'textarea'])
const CODEISH = new Set(['code', 'pre', 'kbd', 'samp', 'input', 'textarea', 'td', 'th'])

const TOLERANCE = 3 // px: layout rounding and border-box versus padding-box
const MATERIAL = 12 // px: how far mirroring must move a box for its not moving to mean anything
const OFF_EDGE = 2

/** Content is what a reader reads or operates: text, media, controls. Decoration is not. */
function isContent(record) {
  return record.text > 0 || MEDIA.has(record.tag) || CONTROLS.has(record.tag)
}

function insideSvg(elements, index) {
  for (let j = elements[index].p; j >= 0; j = elements[j].p) if (elements[j].tag === 'svg') return true
  return false
}

const CLIPPING = new Set(['hidden', 'clip'])

/**
 * The horizontal range of an element that is actually painted: its box
 * intersected with every ancestor that clips or scrolls it (the root and
 * body excluded, because they are the viewport and are handled against it).
 *
 * `hardLo`/`hardHi` intersect only the clipping (hidden/clip) ancestors, so
 * a caller can tell "cut off" from "inside a scroller".
 */
function paintedRange(elements, index) {
  const self = elements[index]
  let lo = self.r[0]
  let hi = self.r[0] + self.r[2]
  let hardLo = lo
  let hardHi = hi
  for (let j = self.p; j >= 0; j = elements[j].p) {
    const a = elements[j]
    if (a.tag === 'html' || a.tag === 'body') continue
    if (a.ox === 'visible') continue
    const aLo = a.r[0]
    const aHi = a.r[0] + a.r[2]
    lo = Math.max(lo, aLo)
    hi = Math.min(hi, aHi)
    if (CLIPPING.has(a.ox)) {
      hardLo = Math.max(hardLo, aLo)
      hardHi = Math.min(hardHi, aHi)
    }
  }
  return { lo, hi, hardLo, hardHi }
}

/** Whether a transform, `scale` or `rotate` on this element flips it horizontally. */
export function flipsHorizontally(record) {
  const matrix = /^matrix\(\s*(-?[\d.e+-]+)/.exec(record.tr ?? '')
  if (matrix && Number(matrix[1]) < 0) return true
  const matrix3d = /^matrix3d\(\s*(-?[\d.e+-]+)/.exec(record.tr ?? '')
  if (matrix3d && Number(matrix3d[1]) < 0) return true
  const scale = /^(-?[\d.]+)/.exec(record.scale ?? '')
  if (scale && Number(scale[1]) < 0) return true
  const rot = /^(-?[\d.]+)(deg|rad|turn)?/.exec(record.rot ?? '')
  if (rot) {
    const degrees = rot[2] === 'rad' ? (Number(rot[1]) * 180) / Math.PI : rot[2] === 'turn' ? Number(rot[1]) * 360 : Number(rot[1])
    if (Math.abs(((degrees % 360) + 360) % 360 - 180) < 1) return true
  }
  return false
}

/** `arrow-right` to `ArrowRight`, the way the review ledger keys icons. */
export function pascalCase(kebab) {
  return kebab
    .split('-')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join('')
}

/** The rect an element is positioned against, for a mirroring test. */
function containingBox(elements, index, page) {
  const record = elements[index]
  if (record.pos === 'fixed') return { x: 0, w: page.vw }
  if (record.pos === 'absolute') {
    for (let j = record.p; j >= 0; j = elements[j].p) {
      const a = elements[j]
      if (a.pos !== 'static' || a.tr !== 'none') return { x: a.r[0], w: a.r[2] }
    }
    return { x: 0, w: page.vw }
  }
  if (record.p < 0) return null
  const parent = elements[record.p]
  return { x: parent.r[0], w: parent.r[2] }
}

function cause(record) {
  const absolute = record.pos === 'absolute' || record.pos === 'fixed'
  if (absolute && typeof record.insetL === 'number' && record.insetR === 'auto') {
    return `positioned with left: ${record.insetL}px and right: auto`
  }
  if (absolute && typeof record.insetR === 'number' && record.insetL === 'auto') {
    return `positioned with right: ${record.insetR}px and left: auto`
  }
  if (record.flt === 'left' || record.flt === 'right') return `float: ${record.flt}`
  if (record.sp['margin-left'] && !record.sp['margin-right']) return `margin-left: ${record.sp['margin-left']}px with no margin-right`
  if (record.sp['margin-right'] && !record.sp['margin-left']) return `margin-right: ${record.sp['margin-right']}px with no margin-left`
  return 'a physical offset the computed style does not name'
}

/**
 * Compare a page's two measurements.
 *
 * @param {{ elements: object[], page: object }} ltr
 * @param {{ elements: object[], page: object }} rtl
 * @param {{ page: string }} where
 */
export function analyzeRtl(ltr, rtl, where) {
  const findings = []
  const at = (elements, index, detail) => ({
    page: where.page,
    selector: selectorFor(elements, index) + quote(elements[index]),
    detail,
  })

  // Pair by structural path. An element present in only one pass is not compared.
  const ltrByKey = new Map(ltr.elements.map((record) => [record.k, record.i]))
  const pair = rtl.elements.map((record) => ltrByKey.get(record.k) ?? -1)
  const compared = pair.filter((i) => i >= 0).length

  const R = rtl.elements
  const L = ltr.elements
  const vw = rtl.page.vw

  /* ── page scrolls sideways only in RTL ── */
  const ltrScrolls = ltr.page.scrollW > ltr.page.clientW + 1
  const rtlScrolls = rtl.page.scrollW > rtl.page.clientW + 1
  if (rtlScrolls && !ltrScrolls) {
    findings.push({
      rule: 'rtl-page-scroll',
      family: 'rtl',
      severity: 'violation',
      key: `rtl-page-scroll:${where.page}`,
      message: `Under dir=rtl the page gains a horizontal scrollbar (content ${rtl.page.scrollW}px wide in a ${rtl.page.clientW}px viewport); left-to-right it fits.`,
      count: 1,
      examples: [{ page: where.page, selector: 'document', detail: `${rtl.page.scrollW}px vs ${rtl.page.clientW}px` }],
      data: { scrollWidth: rtl.page.scrollW, clientWidth: rtl.page.clientW },
    })
  }

  /* ── content past a viewport edge, and text clipped, only in RTL ── */
  const escapes = { left: [], right: [] }
  const clippedText = []
  const clippedByAncestor = []

  for (const record of R) {
    const partner = pair[record.i]
    if (partner < 0) continue
    if (!isContent(record) || insideSvg(R, record.i)) continue
    if (!hasBox(record, 4) || isHiddenSubtree(R, record.i) || inFixedSubtree(R, record.i)) continue
    const before = L[partner]

    // Past a viewport edge, after every clipping or scrolling ancestor has had its say.
    const now = paintedRange(R, record.i)
    if (now.hi - now.lo > OFF_EDGE) {
      const then = paintedRange(L, partner)
      const sideNow = now.lo < -OFF_EDGE ? 'left' : now.hi > vw + OFF_EDGE ? 'right' : null
      const sideThen = then.lo < -OFF_EDGE ? 'left' : then.hi > vw + OFF_EDGE ? 'right' : null
      if (sideNow && sideNow !== sideThen) {
        const by = sideNow === 'left' ? -now.lo : now.hi - vw
        escapes[sideNow].push({ record, by: Math.round(by) })
      }
    }

    // Text that overflows its own overflow:hidden box, newly.
    if (
      record.text > 0 &&
      CLIPPING.has(record.ox) &&
      record.to !== 'ellipsis' &&
      !record.clamp &&
      record.sw > record.cw + 2 &&
      before.sw <= before.cw + 2
    ) {
      clippedText.push({ record, by: record.sw - record.cw })
    }

    // Text partly hidden by an ancestor's overflow:hidden, newly.
    if (record.text > 0) {
      const width = record.r[2]
      const shown = Math.max(0, now.hardHi - now.hardLo) / width
      const wasShown = (() => {
        const then = paintedRange(L, partner)
        return Math.max(0, then.hardHi - then.hardLo) / before.r[2]
      })()
      if (shown >= 0.1 && shown <= 0.9 && wasShown >= 0.98) {
        clippedByAncestor.push({ record, shown })
      }
    }
  }

  for (const side of ['left', 'right']) {
    const list = escapes[side]
    if (list.length === 0) continue
    const worst = Math.max(...list.map((item) => item.by))
    findings.push({
      rule: 'rtl-overflow',
      family: 'rtl',
      severity: 'violation',
      key: `rtl-overflow:${side}:${where.page}`,
      message:
        side === 'right'
          ? `${list.length} text/control/media ${list.length === 1 ? 'element lies' : 'elements lie'} past the right edge of the viewport under dir=rtl (by up to ${worst}px). ` +
            'That is the start side in RTL, which a browser cannot scroll to: the content is cut off and unreachable. Left-to-right it fits.'
          : `${list.length} text/control/media ${list.length === 1 ? 'element lies' : 'elements lie'} past the left edge of the viewport under dir=rtl (by up to ${worst}px), forcing sideways scrolling. Left-to-right it fits.`,
      count: list.length,
      examples: list
        .sort((a, b) => b.by - a.by || a.record.i - b.record.i)
        .slice(0, 5)
        .map((item) => at(R, item.record.i, `${item.by}px past the ${side} edge`)),
      data: { side, worst },
    })
  }

  if (clippedText.length) {
    findings.push({
      rule: 'rtl-clipped-text',
      family: 'rtl',
      severity: 'violation',
      key: `rtl-clipped-text:${where.page}`,
      message:
        `${clippedText.length} overflow:hidden ${clippedText.length === 1 ? 'box no longer fits its text' : 'boxes no longer fit their text'} under dir=rtl ` +
        '(no ellipsis, so the end of the text is cut off silently). Left-to-right it fits.',
      count: clippedText.length,
      examples: clippedText.slice(0, 5).map((item) => at(R, item.record.i, `${item.by}px of text hidden`)),
      data: {},
    })
  }

  if (clippedByAncestor.length) {
    findings.push({
      rule: 'rtl-clipped',
      family: 'rtl',
      severity: 'advisory',
      key: `rtl-clipped:${where.page}`,
      message:
        `${clippedByAncestor.length} text ${clippedByAncestor.length === 1 ? 'element is' : 'elements are'} partly hidden by an ancestor's overflow:hidden under dir=rtl and were fully visible left-to-right. ` +
        'A carousel does this on purpose; anything else is a defect.',
      count: clippedByAncestor.length,
      examples: clippedByAncestor
        .slice(0, 5)
        .map((item) => at(R, item.record.i, `${Math.round(item.shown * 100)}% visible`)),
      data: {},
    })
  }

  /* ── content that did not mirror while its neighbourhood did ── */
  const mirrored = new Array(R.length).fill(0)
  const stuck = []

  for (const record of R) {
    const partner = pair[record.i]
    if (partner < 0 || !hasBox(record, 1) || record.p < 0) continue
    if (isHiddenSubtree(R, record.i) || insideSvg(R, record.i)) continue
    const box = containingBox(R, record.i, rtl.page)
    const before = L[partner]
    const boxBefore = containingBox(L, partner, ltr.page)
    if (!box || !boxBefore) continue

    const dxBefore = before.r[0] - boxBefore.x
    const dxNow = record.r[0] - box.x
    const expected = box.w - dxBefore - record.r[2]
    if (Math.abs(expected - dxBefore) <= MATERIAL) continue // nearly symmetric: mirroring would not move it

    if (Math.abs(dxNow - expected) <= TOLERANCE) mirrored[record.i] = 1
    else if (Math.abs(dxNow - dxBefore) <= TOLERANCE) {
      const eligible =
        isContent(record) &&
        record.dir === 'rtl' &&
        Math.min(record.r[2], record.r[3]) >= 8 &&
        (record.disp !== 'inline' || MEDIA.has(record.tag)) &&
        inFixedSubtree(R, record.i) === inFixedSubtree(L, partner)
      if (eligible) stuck.push({ record, dxNow, expected })
    }
  }

  // Subtree totals, so a candidate can ask "did its neighbourhood mirror?".
  const subtree = mirrored.slice()
  for (let i = R.length - 1; i > 0; i--) if (R[i].p >= 0) subtree[R[i].p] += subtree[i]

  const flagged = stuck.filter(({ record }) => {
    let ancestor = record.p
    for (let depth = 0; depth < 4 && ancestor >= 0; depth++, ancestor = R[ancestor].p) {
      if (subtree[ancestor] - subtree[record.i] >= 2) return true
    }
    return false
  })

  if (flagged.length) {
    findings.push({
      rule: 'rtl-not-mirrored',
      family: 'rtl',
      severity: 'advisory',
      key: `rtl-not-mirrored:${where.page}`,
      message:
        `${flagged.length} ${flagged.length === 1 ? 'element stayed' : 'elements stayed'} on the same physical side under dir=rtl while the elements around ` +
        `${flagged.length === 1 ? 'it' : 'them'} mirrored. Usually a physical offset (left: N, margin-left, float: left) that should be logical.`,
      count: flagged.length,
      examples: flagged
        .slice(0, 5)
        .map(({ record, dxNow, expected }) =>
          at(R, record.i, `${cause(record)}; ${Math.round(dxNow)}px from the container's left edge, ${Math.round(expected)}px if mirrored`),
        ),
      data: {},
    })
  }

  /* ── directional icons the ledger says to mirror ── */
  const icons = new Map()
  const ledger = rtlLedger.ICONS ?? {}
  for (const record of R) {
    if (record.tag !== 'svg' || !record.cls || record.dir !== 'rtl') continue
    const named = /\blucide-([a-z0-9-]+)/.exec(record.cls)
    if (!named) continue
    const name = pascalCase(named[1])
    const ruling = ledger[name]
    if (!ruling || ruling.ruling !== 'mirror') continue
    if (!hasBox(record, 4) || isHiddenSubtree(R, record.i)) continue

    // The flip may be on the icon or on the wrapper that rotates it.
    const flipped = chain(R, record.i).slice(0, 4).some((j) => flipsHorizontally(R[j]))
    if (flipped) continue

    if (!icons.has(name)) icons.set(name, { name, why: ruling.why, list: [] })
    icons.get(name).list.push(record)
  }
  for (const icon of [...icons.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    findings.push({
      rule: 'rtl-icon-not-mirrored',
      family: 'rtl',
      severity: 'advisory',
      key: `rtl-icon:${icon.name}:${where.page}`,
      message:
        `${icon.list.length}x ${icon.name} icon not mirrored under dir=rtl. Ledger ruling is "mirror": ${icon.why}`,
      count: icon.list.length,
      examples: icon.list.slice(0, 3).map((record) => at(R, record.i, `lucide-${record.cls.match(/\blucide-([a-z0-9-]+)/)[1]}`)),
      data: { icon: icon.name },
    })
  }

  /* ── text hard-aligned to a physical side ── */
  const aligned = []
  for (const record of R) {
    const partner = pair[record.i]
    if (partner < 0 || record.dir !== 'rtl') continue
    if (record.text < 12 || record.r[2] < 120 || CODEISH.has(record.tag)) continue
    if (record.ta !== 'left' && record.ta !== 'right') continue
    if (L[partner].ta !== record.ta) continue
    if (isHiddenSubtree(R, record.i) || insideSvg(R, record.i)) continue
    aligned.push(record)
  }
  if (aligned.length) {
    findings.push({
      rule: 'rtl-text-align',
      family: 'rtl',
      severity: 'advisory',
      key: `rtl-text-align:${where.page}`,
      message:
        `${aligned.length} text ${aligned.length === 1 ? 'block is' : 'blocks are'} hard-aligned to a physical side (text-align: left/right) and did not follow dir=rtl. ` +
        'Use start/end so the text follows the reading direction.',
      count: aligned.length,
      examples: aligned.slice(0, 5).map((record) => at(R, record.i, `text-align: ${record.ta}`)),
      data: {},
    })
  }

  return { findings, compared }
}
