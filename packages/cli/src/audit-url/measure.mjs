/**
 * The one function that runs inside the page.
 *
 * `measurePage` is handed to `page.evaluate`, which serialises it with
 * `Function.prototype.toString` and runs the text in the browser. That has
 * two consequences this file is written around:
 *
 *   - it must be SELF-CONTAINED. No imports, no module-level helpers, nothing
 *     closed over. Every helper is declared inside it.
 *   - it returns plain JSON. All interpretation (clustering, contrast, RTL
 *     comparison) happens on the Node side, in pure functions that have unit
 *     tests, so the only untestable-without-a-browser code is this walk.
 *
 * WHAT IT RECORDS
 *
 * One record per rendered element, in document order, with the computed
 * values the analyses need and nothing they do not. `p` is the parent's
 * index (parents always precede children), `k` is a structural path used to
 * pair the same element between the left-to-right and right-to-left passes.
 *
 * Colours are resolved to sRGB `[r, g, b, a]` here, through a 1x1 canvas,
 * because Tailwind v4 and modern CSS produce `oklch()` / `color-mix()` values
 * that `getComputedStyle` returns unchanged.
 *
 * Spacing is read through `computedStyleMap()` where it exists. That is not
 * an optimisation: `getComputedStyle` returns the USED value for margins, so
 * `margin: 0 auto` on a centred container reads back as `margin-left:
 * 143.5px`, which would then be reported as an off-grid margin nobody wrote.
 * The typed map keeps `auto` as a keyword and percentages as percentages.
 *
 * The DOM elements are also kept on `window.__hlAuditEls`, index-aligned with
 * the records, so a later axe-core run can be mapped back onto them.
 *
 * @param {{ maxElements: number }} options
 */
export function measurePage(options) {
  const MAX = options.maxElements
  const root = document.documentElement
  const sx = window.scrollX
  const sy = window.scrollY
  const round = (n, places = 1) => {
    const f = 10 ** places
    return Math.round(n * f) / f
  }

  /* ── colour ─────────────────────────────────────────────────────────── */

  const colorCache = new Map()
  let ctx = null
  const SENTINEL = '#010203'

  const toRgba = (value) => {
    if (!value || value === 'transparent') return [0, 0, 0, 0]
    const cached = colorCache.get(value)
    if (cached) return cached
    let out
    const plain = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(value)
    if (plain) {
      const raw = plain[4]
      const alpha = raw === undefined ? 1 : raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw)
      out = [Number(plain[1]), Number(plain[2]), Number(plain[3]), alpha]
    } else {
      if (!ctx) {
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        ctx = canvas.getContext('2d', { willReadFrequently: true })
      }
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = SENTINEL
      ctx.fillStyle = value
      if (ctx.fillStyle === SENTINEL && value.replace(/\s/g, '').toLowerCase() !== SENTINEL) {
        out = [0, 0, 0, 0]
      } else {
        ctx.fillRect(0, 0, 1, 1)
        const d = ctx.getImageData(0, 0, 1, 1).data
        let alpha = d[3] / 255
        const slash = /\/\s*([\d.]+%?)\s*\)\s*$/.exec(value)
        if (slash) alpha = slash[1].endsWith('%') ? parseFloat(slash[1]) / 100 : parseFloat(slash[1])
        out = [d[0], d[1], d[2], round(alpha, 3)]
      }
    }
    out = [out[0], out[1], out[2], round(out[3], 3)]
    colorCache.set(value, out)
    return out
  }

  /* ── labels ─────────────────────────────────────────────────────────── */

  const label = (el) => {
    const tag = el.localName
    if (el.id && /^[A-Za-z][\w-]{0,40}$/.test(el.id)) return `${tag}#${el.id}`
    const raw = typeof el.className === 'string' ? el.className : ''
    const classes = raw
      .split(/\s+/)
      .filter((c) => c && c.length <= 24 && !/[:[\]/()%.!,#]/.test(c))
      .slice(0, 2)
    return tag + classes.map((c) => `.${c}`).join('')
  }

  /* ── spacing, via the typed map ─────────────────────────────────────── */

  const SPACING = [
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'row-gap', 'column-gap',
  ]
  const HORIZONTAL_MARGINS = new Set(['margin-left', 'margin-right'])

  const SKIP = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META', 'HEAD', 'TITLE', 'BASE', 'SLOT',
  ])

  /* ── the walk ───────────────────────────────────────────────────────── */

  const els = []
  const records = []
  let truncated = false
  const stack = [[root, -1, 1, '']]

  while (stack.length) {
    const [el, parentIndex, childNumber, parentKey] = stack.pop()
    if (SKIP.has(el.tagName)) continue
    if (records.length >= MAX) {
      truncated = true
      break
    }

    const cs = getComputedStyle(el)
    if (cs.display === 'none') continue

    const index = records.length
    const key = `${parentKey}/${el.localName}${childNumber}`
    const rect = el.getBoundingClientRect()
    const map = typeof el.computedStyleMap === 'function' ? el.computedStyleMap() : null

    let text = ''
    for (const node of el.childNodes) {
      if (node.nodeType === 3) text += node.nodeValue
    }
    text = text.replace(/\s+/g, ' ').trim()

    const sp = {}
    let autoStart = false
    let autoEnd = false
    for (const prop of SPACING) {
      let px = null
      if (map) {
        const v = map.get(prop)
        if (v && v.unit === 'px') px = v.value
        else if (v && prop === 'margin-left' && v.value === 'auto') autoStart = true
        else if (v && prop === 'margin-right' && v.value === 'auto') autoEnd = true
      } else if (!HORIZONTAL_MARGINS.has(prop)) {
        // No typed map: horizontal margins are unreadable (auto resolves to a
        // length), so they are left out rather than guessed at.
        const s = cs.getPropertyValue(prop)
        if (/^-?[\d.]+px$/.test(s)) px = parseFloat(s)
      }
      if (px !== null && px !== 0) sp[prop] = round(px, 2)
    }

    let insetL = null
    let insetR = null
    if (cs.position !== 'static' && map) {
      const l = map.get('left')
      const r = map.get('right')
      insetL = l && l.unit === 'px' ? round(l.value) : l && l.value === 'auto' ? 'auto' : null
      insetR = r && r.unit === 'px' ? round(r.value) : r && r.value === 'auto' ? 'auto' : null
    }

    const radii = []
    for (const corner of [
      'border-top-left-radius', 'border-top-right-radius',
      'border-bottom-right-radius', 'border-bottom-left-radius',
    ]) {
      const m = /^([\d.]+)px/.exec(cs.getPropertyValue(corner))
      if (m && parseFloat(m[1]) > 0) radii.push(round(parseFloat(m[1]), 2))
    }

    const borders = []
    for (const side of ['top', 'right', 'bottom', 'left']) {
      if (parseFloat(cs.getPropertyValue(`border-${side}-width`)) > 0 && cs.getPropertyValue(`border-${side}-style`) !== 'none') {
        const c = toRgba(cs.getPropertyValue(`border-${side}-color`))
        if (c[3] > 0) borders.push(c)
      }
    }

    const overflowX = cs.overflowX
    const overflowY = cs.overflowY
    const clips = overflowX !== 'visible' || overflowY !== 'visible'

    const record = {
      i: index,
      p: parentIndex,
      k: key,
      tag: el.localName,
      lab: label(el),
      r: [round(rect.left + sx), round(rect.top + sy), round(rect.width), round(rect.height)],
      text: text.length,
      tx: text.slice(0, 40),
      color: toRgba(cs.color),
      fill: toRgba(cs.webkitTextFillColor || cs.color),
      bg: toRgba(cs.backgroundColor),
      bgImg: cs.backgroundImage !== 'none',
      bgText: cs.backgroundClip === 'text' || cs.webkitBackgroundClip === 'text',
      borders,
      op: round(parseFloat(cs.opacity), 3),
      vis: cs.visibility,
      fs: round(parseFloat(cs.fontSize), 2),
      fw: cs.fontWeight,
      disp: cs.display,
      pos: cs.position,
      flt: cs.cssFloat,
      dir: cs.direction,
      ta: cs.textAlign,
      tr: cs.transform,
      scale: cs.scale,
      rot: cs.rotate,
      ox: overflowX,
      oy: overflowY,
      to: cs.textOverflow,
      clamp: cs.webkitLineClamp && cs.webkitLineClamp !== 'none',
      sw: clips ? el.scrollWidth : 0,
      cw: clips ? el.clientWidth : 0,
      shadow: cs.boxShadow !== 'none' ? cs.boxShadow : '',
      sp,
      autoStart,
      autoEnd,
      insetL,
      insetR,
      radii,
      dis: el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true',
      hid: el.hasAttribute('inert') || el.hasAttribute('hidden'),
      role: el.getAttribute('role') || '',
      cls: el.namespaceURI === 'http://www.w3.org/2000/svg' && typeof el.className === 'object' ? el.className.baseVal : '',
    }

    els.push(el)
    records.push(record)

    const kids = el.children
    for (let n = kids.length - 1; n >= 0; n--) stack.push([kids[n], index, n + 1, key])
  }

  window.__hlAuditEls = els

  const scroller = document.scrollingElement || root
  return {
    elements: records,
    page: {
      title: document.title,
      vw: window.innerWidth,
      vh: window.innerHeight,
      scrollW: scroller.scrollWidth,
      clientW: scroller.clientWidth,
      rootDir: getComputedStyle(root).direction,
      colorScheme: getComputedStyle(root).colorScheme,
      truncated,
      typedMap: typeof root.computedStyleMap === 'function',
    },
  }
}
