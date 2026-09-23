/**
 * Build element records in the shape `measurePage` returns, for tests that
 * exercise the analyses without a browser.
 *
 * Kept out of `test/` on purpose: `node --test` runs every .mjs file in a
 * directory named `test`, and a helper is not a test.
 */

const DEFAULTS = {
  tag: 'div',
  r: [0, 0, 100, 20],
  text: 0,
  tx: '',
  color: [0, 0, 0, 1],
  fill: [0, 0, 0, 1],
  bg: [0, 0, 0, 0],
  bgImg: false,
  bgText: false,
  borders: [],
  op: 1,
  vis: 'visible',
  fs: 16,
  fw: '400',
  disp: 'block',
  pos: 'static',
  flt: 'none',
  dir: 'ltr',
  ta: 'start',
  tr: 'none',
  scale: 'none',
  rot: 'none',
  ox: 'visible',
  oy: 'visible',
  to: 'clip',
  clamp: false,
  sw: 0,
  cw: 0,
  shadow: '',
  sp: {},
  autoStart: false,
  autoEnd: false,
  insetL: null,
  insetR: null,
  radii: [],
  dis: false,
  hid: false,
  role: '',
  cls: '',
}

/**
 * A list of specs, each with an optional `p` (parent index; defaults to the
 * previous element's parent chain root, i.e. -1 for the first), becomes
 * records with `i`, `k` and `lab` filled in. Text is given as `tx`.
 */
export function tree(specs) {
  const records = []
  const childCounts = new Map()
  specs.forEach((spec, i) => {
    const p = spec.p ?? (i === 0 ? -1 : 0)
    const tag = spec.tag ?? DEFAULTS.tag
    const n = (childCounts.get(p) ?? 0) + 1
    childCounts.set(p, n)
    const k = `${p >= 0 ? records[p].k : ''}/${tag}${n}`
    const text = spec.tx ? spec.tx.length : (spec.text ?? 0)
    records.push({
      ...DEFAULTS,
      ...spec,
      sp: { ...(spec.sp ?? {}) },
      i,
      p,
      k,
      lab: spec.lab ?? tag,
      text,
      tx: spec.tx ?? '',
    })
  })
  return records
}

export const PAGE = { vw: 1280, vh: 800, scrollW: 1280, clientW: 1280, colorScheme: 'normal', truncated: false }
