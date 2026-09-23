/**
 * What the page looks like, as numbers, for the stress harness.
 *
 * ── THIS FUNCTION MUST BE SELF-CONTAINED ────────────────────────────────
 *
 * `measureStressState` is serialised by Playwright and run inside the
 * page, so it can reference nothing outside its own body: no imports, no
 * module-level helpers, no other file. Every helper is declared inside it.
 * That is why it reads as one long function rather than a set of small
 * ones, and why the types are declared above it and erased at runtime.
 *
 * It measures and does not judge. Whether a number is a defect depends on
 * the baseline it is compared against, and that lives in `verdict.ts`,
 * which is plain Node and unit-tested. Keeping the two apart means the
 * judgement can be tested without a browser.
 *
 * ── HOW ELEMENTS ARE IDENTIFIED ─────────────────────────────────────────
 *
 * By structural path (`main:1>div:2>h3:1`), never by text. A stress
 * rewrites the text, so a text-based identity would call every element
 * "new" and every stressed run a total failure. The DOM tree is unchanged
 * by the frame, so the same path names the same element in both runs.
 */

export interface ElementRef {
  /** Structural path: stable across text transforms. */
  key: string
  /** A short human label: tag plus the start of its text. */
  label: string
}

export interface ClippedText extends ElementRef {
  /** How many pixels of content lie beyond the clip box. */
  by: number
  axis: 'x' | 'y'
}

export interface SpilledText extends ElementRef {
  /** How far the glyphs reach past their own element's edge, in pixels. */
  by: number
}

export interface WideElement extends ElementRef {
  /** How far past the viewport edge it reaches, in pixels. */
  reach: number
}

export interface OverlapPair {
  key: string
  a: string
  b: string
  area: number
}

export interface PaintCandidate extends ElementRef {
  bg: string
  parentBg: string
  width: number
  height: number
  /** True when the element has a border, outline or background image of its own. */
  hasEdge: boolean
}

export interface ControlBoundary extends ElementRef {
  hasBorder: boolean
  hasOutline: boolean
}

export interface RunningAnimation extends ElementRef {
  name: string
  duration: number
  width: number
  height: number
}

export interface StressMeasure {
  viewportWidth: number
  scrollWidth: number
  /** Pixels the document scrolls sideways; 0 means no horizontal scrollbar. */
  overflowX: number
  wide: WideElement[]
  clipped: ClippedText[]
  spilled: SpilledText[]
  overlaps: OverlapPair[]
  paint: PaintCandidate[]
  controls: ControlBoundary[]
  animations: RunningAnimation[]
  textLength: number
  elementCount: number
}

export function measureStressState(): StressMeasure {
  const MAX = 40
  const root = document.querySelector('main') as HTMLElement | null

  const empty: StressMeasure = {
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflowX: 0,
    wide: [],
    clipped: [],
    spilled: [],
    overlaps: [],
    paint: [],
    controls: [],
    animations: [],
    textLength: 0,
    elementCount: 0,
  }
  if (!root) return empty

  const vw = window.innerWidth

  function pathOf(el: Element): string {
    const parts: string[] = []
    let cur: Element | null = el
    while (cur && cur !== root && parts.length < 14) {
      const parent: Element | null = cur.parentElement
      const index = parent ? Array.prototype.indexOf.call(parent.children, cur) + 1 : 1
      parts.unshift(cur.tagName.toLowerCase() + ':' + index)
      cur = parent
    }
    return parts.join('>')
  }

  function ownText(el: Element): string {
    let text = ''
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === 3) text += node.nodeValue ?? ''
    }
    return text.replace(/\s+/g, ' ').trim()
  }

  function refOf(el: Element): ElementRef {
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
    return {
      key: pathOf(el),
      label: el.tagName.toLowerCase() + (text ? ' "' + text.slice(0, 28) + '"' : ''),
    }
  }

  function isTransparent(color: string): boolean {
    return (
      color === 'transparent' ||
      /^rgba\(.*,\s*0\)$/.test(color) ||
      /\/\s*0(\.0+)?%?\s*\)$/.test(color)
    )
  }

  function effectiveBg(el: Element): string {
    let cur: Element | null = el.parentElement
    while (cur) {
      const bg = getComputedStyle(cur).backgroundColor
      if (!isTransparent(bg)) return bg
      cur = cur.parentElement
    }
    return 'canvas'
  }

  // A closed `<details>` hides its non-`<summary>` content through an
  // internal `::details-content` pseudo-element the DOM cannot see or
  // style-query — `getComputedStyle` on the real child element inside
  // still reports `display: block`, `visibility: visible` and a full,
  // real `getBoundingClientRect()`, exactly as if it were open. CSS
  // introspection cannot tell a closed accordion body from an open one;
  // the browser's own `.open` IDL boolean can, unconditionally.
  const inClosedDetails = (el: HTMLElement): boolean => {
    for (let cur: HTMLElement | null = el; cur && cur !== root; cur = cur.parentElement) {
      if (cur instanceof HTMLDetailsElement && !cur.open) {
        // The <summary> itself — the disclosure widget — stays visible
        // whether or not the details is open; only the rest of the body
        // is hidden.
        const summary = cur.querySelector(':scope > summary')
        if (summary && (summary === el || summary.contains(el))) return false
        return true
      }
    }
    return false
  }

  const all = Array.from(root.querySelectorAll('*'))
  const visible: Array<{ el: HTMLElement; cs: CSSStyleDeclaration; rect: DOMRect }> = []

  for (const node of all) {
    if (!(node instanceof HTMLElement)) continue
    const cs = getComputedStyle(node)
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue
    if (inClosedDetails(node)) continue
    const rect = node.getBoundingClientRect()
    // 1px boxes are the sr-only pattern: present for screen readers, not for eyes.
    if (rect.width <= 1 || rect.height <= 1) continue
    visible.push({ el: node, cs, rect })
  }

  const inScroller = (el: HTMLElement): boolean => {
    let cur: HTMLElement | null = el.parentElement
    while (cur && cur !== root) {
      const overflow = getComputedStyle(cur).overflowX
      if (overflow === 'auto' || overflow === 'scroll' || overflow === 'hidden' || overflow === 'clip') {
        return true
      }
      cur = cur.parentElement
    }
    return false
  }

  // Walks to `root`, not a fixed number of ancestors: an accessible dialog
  // is `role="dialog"` wrapped in a `<form>`, a header row and a title
  // group before it reaches the actual `absolute`/`fixed` overlay, and a
  // shallow cap stopped short of that overlay on exactly that markup —
  // the modal's own header text then compared, geometrically, against the
  // page it sits on top of and lost, an "overlap" nobody could ever see
  // because the dialog's own opaque card paints over it. Since this only
  // WIDENS the exclusion, a leaf that used to fail this check still does;
  // the only effect is removing findings that were never paintable.
  const isPositioned = (el: HTMLElement): boolean => {
    let cur: HTMLElement | null = el
    while (cur && cur !== root) {
      const position = getComputedStyle(cur).position
      if (position === 'absolute' || position === 'fixed') return true
      cur = cur.parentElement
    }
    return false
  }

  // ── Elements reaching past the viewport, outermost only ────────────────
  const wideSet = new Set<HTMLElement>()
  for (const { el, cs, rect } of visible) {
    if (cs.position === 'fixed') continue
    const reach = Math.max(rect.right - vw, -rect.left)
    if (reach > 1 && !inScroller(el)) wideSet.add(el)
  }
  const wide: WideElement[] = []
  for (const el of wideSet) {
    let nested = false
    for (let cur = el.parentElement; cur && cur !== root; cur = cur.parentElement) {
      if (wideSet.has(cur)) {
        nested = true
        break
      }
    }
    if (nested) continue
    const rect = el.getBoundingClientRect()
    wide.push({ ...refOf(el), reach: Math.round(Math.max(rect.right - vw, -rect.left)) })
    if (wide.length >= MAX) break
  }

  // ── Where the text is actually drawn ───────────────────────────────────
  //
  // Element boxes lie about text. A long unbreakable word in a `div` with
  // `overflow: visible` is drawn straight through the edge of its card and
  // into the next one while the div's own rectangle stays exactly where it
  // was, so any check on element rects (overlap, clipping, `scrollWidth`)
  // sees a tidy layout. The only honest measurement is the rectangle of the
  // glyphs themselves, one per line, from a Range over the text node.
  interface Line {
    left: number
    top: number
    right: number
    bottom: number
  }

  function lineRects(el: HTMLElement): Line[] {
    const lines: Line[] = []
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType !== 3 || !(node.nodeValue ?? '').trim()) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      for (const r of Array.from(range.getClientRects())) {
        if (r.width > 0 && r.height > 0) {
          lines.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom })
        }
      }
    }
    return lines
  }

  // Anything inside an endlessly moving track (a marquee, a ticker) has a
  // clipping story that changes every frame; it is not a layout defect.
  const movingTargets = new Set<Element>()
  for (const animation of document.getAnimations()) {
    const effect = animation.effect as KeyframeEffect | null
    if (effect?.target && effect.getComputedTiming().iterations === Infinity) {
      movingTargets.add(effect.target)
    }
  }
  const inMotion = (el: HTMLElement): boolean => {
    for (let cur: Element | null = el; cur && cur !== root; cur = cur.parentElement) {
      if (movingTargets.has(cur)) return true
    }
    return false
  }

  const textLeaves = visible
    .filter(({ el }) => ownText(el).length > 0 && !inMotion(el))
    .slice(0, 400)
    .map((entry) => ({ ...entry, lines: lineRects(entry.el) }))
    .filter((entry) => entry.lines.length > 0)

  // ── Text cut off by a clipping ancestor ─────────────────────────────────
  // Partly visible and partly cut is a defect. Wholly outside the clip box is
  // not: that is a collapsed accordion or an off-screen slide, hidden on
  // purpose. Deliberate truncation (ellipsis, line-clamp) is also excluded.
  //
  // A real `overflow-x/y: auto|scroll` ancestor ENDS the search for that
  // axis, rather than merely being skipped. A table an author correctly
  // wrapped in `overflow-x-auto` is reachable by scrolling that div — that
  // is the whole point of the wrapper — and a decorative `overflow-hidden`
  // further out (a rounded-corner card, this site's own preview chrome) is
  // clipping the SCROLLER's box, not this text. Walking past the scroller
  // and blaming that outer ancestor reported a defect that scrolling the
  // inner div already fixes; found on `billing-invoice-detail` under the
  // 200%-text stress, whose table sits inside its own correct scroller two
  // ancestors below the preview frame's rounded `overflow-hidden` wrapper.
  const clipped: ClippedText[] = []
  for (const leaf of textLeaves) {
    // Mutable: an ellipsised or line-clamped ancestor shrinks these to its
    // own edge before the walk continues outward — see below.
    let left = Math.min(...leaf.lines.map((l) => l.left))
    let right = Math.max(...leaf.lines.map((l) => l.right))
    let top = Math.min(...leaf.lines.map((l) => l.top))
    let bottom = Math.max(...leaf.lines.map((l) => l.bottom))

    let xOwnedByScroller = false
    let yOwnedByScroller = false

    for (let anc: HTMLElement | null = leaf.el; anc && anc !== root; anc = anc.parentElement) {
      const acs = getComputedStyle(anc)

      const clipsX = !xOwnedByScroller && (acs.overflowX === 'hidden' || acs.overflowX === 'clip')
      const clipsY = !yOwnedByScroller && (acs.overflowY === 'hidden' || acs.overflowY === 'clip')

      if (acs.overflowX === 'auto' || acs.overflowX === 'scroll') xOwnedByScroller = true
      if (acs.overflowY === 'auto' || acs.overflowY === 'scroll') yOwnedByScroller = true

      if (!clipsX && !clipsY) continue

      // `left`/`right`/`top`/`bottom` are the leaf's full, PRE-clip glyph
      // extent (from `Range.getClientRects()` — see `lineRects` above),
      // deliberately: that is what makes it possible to tell "cut off" from
      // "deliberately truncated" in the first place. But once an ancestor
      // IS a deliberate truncation (`text-overflow: ellipsis`, or
      // `-webkit-line-clamp`), its own edge — not the leaf's phantom full
      // width — is the real, visible boundary from here outward. Skipping
      // the check on THIS ancestor (`continue`, unchanged) but leaving the
      // full phantom extent in place for the NEXT one is exactly how a
      // correctly-`truncate`d span two levels down still got an unrelated
      // outer wrapper (this site's own rounded preview-chrome card) blamed
      // for "cutting off" text nobody ever saw past the ellipsis. Clip the
      // bounds to this ancestor's own box before moving on.
      const lineClamp = acs.getPropertyValue('-webkit-line-clamp')
      const ellipsised = acs.textOverflow === 'ellipsis'
      const clamped = lineClamp !== '' && lineClamp !== 'none'
      if (ellipsised || clamped) {
        const box = anc.getBoundingClientRect()
        if (clipsX && ellipsised) {
          left = Math.max(left, box.left)
          right = Math.min(right, box.right)
        }
        if (clipsY && clamped) {
          top = Math.max(top, box.top)
          bottom = Math.min(bottom, box.bottom)
        }
        continue
      }

      // The sr-only pattern again, this time as the CLIPPING ancestor rather
      // than the leaf. Tailwind's current `.sr-only` does not shrink the
      // box at all — a screen-reader-only table keeps its natural,
      // content-sized layout (a `<table>`'s rows are exactly as tall as
      // their cells) and hides it with `clip-path: inset(50%)`, a 0×0
      // visible window centred in that box. `overflow: hidden` is also set,
      // for the legacy `clip: rect(...)` browsers, but it is not what is
      // doing the hiding here — checking only the box's own (large) size
      // would miss this entirely. Either technique means nothing in this
      // ancestor is a viewport a sighted user could ever see a fragment
      // through, so a "cut off" reading two levels down is a false one.
      //
      // Matched narrowly, on the `inset(50% ...)` shape specifically
      // (insetting every side by half collapses to a single point,
      // whatever the box's own size) rather than "any clip-path": a
      // decorative clip-path — an angled card corner, a shaped badge — can
      // still genuinely cut off real content, and that has to keep failing.
      //
      // A `break`, not a `continue`: once a leaf is established invisible
      // here, no ancestor further out — this site's own rounded preview
      // chrome included — can make it "more cut off". Continuing the walk
      // outward past this point is exactly how that outer, unrelated
      // wrapper ended up blamed for a table nobody was ever going to see.
      if (/^inset\(\s*50%/.test(acs.clipPath)) break
      const box = anc.getBoundingClientRect()
      if (box.width <= 1 || box.height <= 1) break
      let by = 0
      let axis: 'x' | 'y' = 'x'
      if (clipsX) {
        const seen = Math.min(right, box.right) - Math.max(left, box.left)
        const cut = Math.max(0, right - box.right) + Math.max(0, box.left - left)
        if (seen > 0 && cut > 1) {
          by = cut
          axis = 'x'
        }
      }
      if (by === 0 && clipsY) {
        const seen = Math.min(bottom, box.bottom) - Math.max(top, box.top)
        const cut = Math.max(0, bottom - box.bottom) + Math.max(0, box.top - top)
        if (seen > 0 && cut > 1) {
          by = cut
          axis = 'y'
        }
      }
      if (by > 0) {
        clipped.push({ ...refOf(leaf.el), key: pathOf(leaf.el) + '<' + pathOf(anc), by: Math.round(by), axis })
        break
      }
    }
    if (clipped.length >= MAX * 2) break
  }

  // ── Text spilling out of its own box ────────────────────────────────────
  const spilled: SpilledText[] = []
  for (const leaf of textLeaves) {
    if (leaf.cs.display === 'inline') continue
    // Deliberate truncation, and text the element clips itself, are not
    // spills: a Range still reports the full width of an ellipsised string.
    // The clipping pass above owns the second case.
    const clamp = leaf.cs.getPropertyValue('-webkit-line-clamp')
    if (leaf.cs.textOverflow === 'ellipsis' || (clamp !== '' && clamp !== 'none')) continue
    if (leaf.cs.overflowX === 'hidden' || leaf.cs.overflowX === 'clip') continue
    const right = Math.max(...leaf.lines.map((l) => l.right))
    const left = Math.min(...leaf.lines.map((l) => l.left))
    const by = Math.max(right - leaf.rect.right, leaf.rect.left - left)
    if (by > 2) spilled.push({ ...refOf(leaf.el), by: Math.round(by) })
    if (spilled.length >= MAX) break
  }

  // ── Text drawn on top of other text ─────────────────────────────────────
  // Compared line by line on the glyph rectangles above, so a word that has
  // spilled into its neighbour's card is caught even though both boxes are
  // exactly where the layout put them.
  //
  // A `-webkit-line-clamp`d (or ellipsised) element lays its FULL text out
  // internally before clipping the paint — that is how the browser knows
  // where to cut. `Range.getClientRects()` reports that full, pre-clip
  // layout, so a 3-line clamp on a much longer paragraph has real line boxes
  // sitting well below its own visible bottom edge, over whatever content
  // comes next. Nothing is actually drawn there (`overflow: hidden` sees to
  // that), so those phantom lines are not a collision — clip every leaf's
  // lines to its nearest clip-forming ancestor before comparing, the same
  // boundary the "cut off" and "spill" checks already respect.
  function clipBoxFor(el: HTMLElement): { left: number; top: number; right: number; bottom: number } | null {
    let box: { left: number; top: number; right: number; bottom: number } | null = null
    for (let anc: HTMLElement | null = el; anc && anc !== root; anc = anc.parentElement) {
      const acs = getComputedStyle(anc)
      const lineClamp = acs.getPropertyValue('-webkit-line-clamp')
      const clamps = lineClamp !== '' && lineClamp !== 'none'
      const hiddenX = acs.overflowX === 'hidden' || acs.overflowX === 'clip'
      const hiddenY = acs.overflowY === 'hidden' || acs.overflowY === 'clip'
      if (!clamps && !hiddenX && !hiddenY) continue
      const r = anc.getBoundingClientRect()
      box = box
        ? {
            left: Math.max(box.left, r.left),
            top: Math.max(box.top, r.top),
            right: Math.min(box.right, r.right),
            bottom: Math.min(box.bottom, r.bottom),
          }
        : { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
    }
    return box
  }

  function clipLines(lines: Line[], box: { left: number; top: number; right: number; bottom: number } | null): Line[] {
    if (!box) return lines
    const out: Line[] = []
    for (const l of lines) {
      const left = Math.max(l.left, box.left)
      const top = Math.max(l.top, box.top)
      const right = Math.min(l.right, box.right)
      const bottom = Math.min(l.bottom, box.bottom)
      if (right > left && bottom > top) out.push({ left, top, right, bottom })
    }
    return out
  }

  const leaves = textLeaves
    .filter(({ el }) => !isPositioned(el))
    .map((leaf) => ({ ...leaf, lines: clipLines(leaf.lines, clipBoxFor(leaf.el)) }))
    .filter((leaf) => leaf.lines.length > 0)
  const overlaps: OverlapPair[] = []
  for (let i = 0; i < leaves.length && overlaps.length < MAX; i++) {
    const a = leaves[i]
    for (let j = i + 1; j < leaves.length && overlaps.length < MAX; j++) {
      const b = leaves[j]
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue
      let area = 0
      for (const la of a.lines) {
        for (const lb of b.lines) {
          const w = Math.min(la.right, lb.right) - Math.max(la.left, lb.left)
          const h = Math.min(la.bottom, lb.bottom) - Math.max(la.top, lb.top)
          if (w > 3 && h > 3) area += w * h
        }
      }
      if (area > 0) {
        overlaps.push({
          key: pathOf(a.el) + '|' + pathOf(b.el),
          a: refOf(a.el).label,
          b: refOf(b.el).label,
          area: Math.round(area),
        })
      }
    }
  }

  // ── Shapes drawn with a background colour alone ────────────────────────
  const paint: PaintCandidate[] = []
  for (const { el, cs, rect } of visible) {
    // Form controls have their own check below; listing an input here as a
    // "shape" as well would report one defect twice.
    if (['IMG', 'SVG', 'CANVAS', 'INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) continue
    if (isTransparent(cs.backgroundColor)) continue
    if (Math.min(rect.width, rect.height) < 4) continue
    if (ownText(el).length > 0) continue
    if (el.querySelector('svg, img, canvas, video, picture')) continue
    if ((el.textContent ?? '').trim().length > 0) continue

    const hasBorder =
      parseFloat(cs.borderTopWidth) + parseFloat(cs.borderRightWidth) +
        parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth) > 0 &&
      cs.borderTopStyle !== 'none'
    const hasOutline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
    const hasImage = cs.backgroundImage !== 'none'

    paint.push({
      ...refOf(el),
      bg: cs.backgroundColor,
      parentBg: effectiveBg(el),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      hasEdge: hasBorder || hasOutline || hasImage,
    })
    if (paint.length >= 200) break
  }

  // ── Form controls whose only boundary is a fill ────────────────────────
  //
  // Only elements whose visual boundary is an author-drawn CSS box belong
  // here. A native `<input type="range">`, `type="color"` or `type="file">`
  // has no CSS border box to begin with — its track or swatch is drawn by
  // the browser or OS, and forced-colors mode already re-skins those on its
  // own. The exclusion is by `type` alone, checked before any role: an
  // `<input type="checkbox" role="switch">` is still a native checkbox
  // underneath, so a role-based branch in the selector cannot be allowed to
  // let it back in.
  const NATIVE_UNBORDERED = new Set(['range', 'color', 'file', 'checkbox', 'radio', 'hidden'])
  const controls: ControlBoundary[] = []
  const controlSelector =
    'input, textarea, select, [role="textbox"], [role="combobox"], [role="switch"], [role="slider"]'
  // A naked, background-less control (`bg-transparent`) sitting inside a
  // wrapper that carries the field's real border — an icon-plus-input pill
  // is the common shape — is bounded by that wrapper, not by itself. Only a
  // control with no fill of its own gets to borrow it: one with a real
  // background is a separate shape and still needs its own edge, wrapper or
  // not. Two levels up covers the pill and the icon-row div around it
  // without reaching into an unrelated ancestor card's border.
  function hasWrapperBorder(el: HTMLElement): boolean {
    let cur: HTMLElement | null = el.parentElement
    for (let depth = 0; cur && cur !== root && depth < 2; depth++, cur = cur.parentElement) {
      const acs = getComputedStyle(cur)
      const bordered =
        parseFloat(acs.borderTopWidth) + parseFloat(acs.borderRightWidth) +
          parseFloat(acs.borderBottomWidth) + parseFloat(acs.borderLeftWidth) > 0 &&
        acs.borderTopStyle !== 'none'
      if (bordered) return true
    }
    return false
  }
  for (const node of Array.from(root.querySelectorAll(controlSelector))) {
    if (!(node instanceof HTMLElement)) continue
    if (node.tagName === 'INPUT' && NATIVE_UNBORDERED.has((node as HTMLInputElement).type)) continue
    const cs = getComputedStyle(node)
    const rect = node.getBoundingClientRect()
    if (cs.display === 'none' || cs.visibility === 'hidden' || rect.width <= 1 || rect.height <= 1) continue
    if (isTransparent(cs.backgroundColor) && hasWrapperBorder(node)) continue
    const hasBorder =
      parseFloat(cs.borderTopWidth) + parseFloat(cs.borderRightWidth) +
        parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth) > 0 &&
      cs.borderTopStyle !== 'none'
    const hasOutline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
    controls.push({ ...refOf(node), hasBorder, hasOutline })
  }

  // ── Animations still running ───────────────────────────────────────────
  const animations: RunningAnimation[] = []
  for (const animation of document.getAnimations()) {
    const effect = animation.effect as KeyframeEffect | null
    const target = effect?.target
    if (!effect || !(target instanceof HTMLElement) || !root.contains(target)) continue
    if (animation.playState !== 'running') continue
    const timing = effect.getComputedTiming()
    if (timing.iterations !== Infinity) continue
    const rect = target.getBoundingClientRect()
    const cs = getComputedStyle(target)
    if (rect.width <= 0 || rect.height <= 0 || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue
    animations.push({
      ...refOf(target),
      name: (animation as Animation & { animationName?: string }).animationName ?? animation.id ?? 'animation',
      duration: typeof timing.duration === 'number' ? timing.duration : 0,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    })
    if (animations.length >= MAX) break
  }

  return {
    viewportWidth: vw,
    scrollWidth: document.documentElement.scrollWidth,
    overflowX: Math.max(0, document.documentElement.scrollWidth - vw),
    wide,
    clipped,
    spilled,
    overlaps,
    paint,
    controls,
    animations,
    textLength: (root.innerText ?? '').length,
    elementCount: all.length,
  }
}
