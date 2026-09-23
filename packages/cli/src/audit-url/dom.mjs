/**
 * Helpers over the flat element records `measurePage` returns.
 *
 * The records are index-aligned and parents precede children, so every walk
 * here is a loop over integers. Nothing touches a browser.
 */

const LANDMARKS = new Set(['main', 'header', 'footer', 'nav', 'section', 'aside', 'form', 'dialog', 'article'])

/** A label carries information when it names an id or a class, or is a landmark. */
function distinctive(record) {
  return record.lab.includes('.') || record.lab.includes('#') || LANDMARKS.has(record.tag)
}

/**
 * A selector a person can find in devtools: the element's own label,
 * prefixed by the nearest distinctive ancestor when the element's own label
 * is a bare tag. It is a locator, not a guarantee of uniqueness, and it is
 * never fed back to `querySelector`.
 */
export function selectorFor(elements, index) {
  const self = elements[index]
  let text = self.lab
  if (!distinctive(self)) {
    for (let j = self.p, depth = 0; j >= 0 && depth < 4; j = elements[j].p, depth++) {
      if (distinctive(elements[j])) {
        text = `${elements[j].lab} ${depth === 0 ? '> ' : ''}${text}`
        break
      }
    }
  }
  return text.length > 90 ? `${text.slice(0, 89)}…` : text
}

/** Indices from `index` up to the root, inclusive of `index`. */
export function chain(elements, index) {
  const out = []
  for (let j = index; j >= 0; j = elements[j].p) out.push(j)
  return out
}

/**
 * Whether an element is inside a subtree that is not part of the page as
 * a reader sees it: `hidden`, `inert`, or `visibility: hidden` all the way
 * (visibility is inherited, so the record's own value already says).
 */
export function isHiddenSubtree(elements, index) {
  for (let j = index; j >= 0; j = elements[j].p) {
    if (elements[j].hid) return true
  }
  return elements[index].vis === 'hidden' || elements[index].vis === 'collapse'
}

/** Whether the element, or an ancestor, is `position: fixed`. */
export function inFixedSubtree(elements, index) {
  for (let j = index; j >= 0; j = elements[j].p) {
    if (elements[j].pos === 'fixed') return true
  }
  return false
}

/** Product of `opacity` from the element up to the root. */
export function effectiveOpacity(elements, index) {
  let product = 1
  for (let j = index; j >= 0; j = elements[j].p) product *= elements[j].op
  return product
}

/** Whether an element is inside an inline SVG, where paint comes from `fill` and not `color`. */
export function inSvg(elements, index) {
  for (let j = index; j >= 0; j = elements[j].p) {
    if (elements[j].tag === 'svg') return true
  }
  return false
}

/** Rendered box with real area. A 1px sr-only box is "there" but not seen. */
export function hasBox(record, min = 2) {
  return record.r[2] >= min && record.r[3] >= min
}

/** A short human-facing sample of an element's text, for examples. */
export function quote(record) {
  return record.tx ? ` "${record.tx.length > 32 ? `${record.tx.slice(0, 31)}…` : record.tx}"` : ''
}
