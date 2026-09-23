/**
 * Infer a site's own design tokens from what it renders, then report drift.
 *
 * THE IDEA
 *
 * The audit has no access to the site's stylesheet, its design tokens or its
 * Figma file, and would be wrong to assume it matches ours. What it can see
 * is the computed values that were painted. A design system leaves a
 * signature in those: spacing lands on a grid, radii come from a handful of
 * values, type sizes from a scale, and most colours are used many times.
 * Drift is what breaks the signature: a `13px` between `12px` and `16px`, a
 * `7px` radius among `8px`s, a `#f9f9f9` beside a `#fafafa` used a hundred
 * times.
 *
 * WHAT COUNTS AS AN OUTLIER
 *
 * Deliberately narrow, because a drift report that cries wolf is deleted.
 * Every rule combines two conditions, and both have to hold:
 *
 *   1. the value is RARE relative to the total, and
 *   2. it is CLOSE to a value the site clearly relies on (or, for spacing,
 *      it is off a grid the site clearly follows).
 *
 * A rare value that is FAR from everything is a one-off design decision (a
 * 72px hero heading), not drift. A value that is off-grid but used everywhere
 * is the site's own scale, however odd. Both are left alone. Counts are on
 * every finding so a person can overrule the heuristic in one glance.
 *
 * Counting unit: one element using one value once, however many of its
 * properties use it. `padding: 13px` on one card is one use, not four.
 */

import { deltaE, isGrey, toHex } from './color.mjs'
import { inSvg, isHiddenSubtree, quote, selectorFor } from './dom.mjs'

/** All the tuning in one place, exported so the tests and the docs can quote it. */
export const THRESHOLDS = {
  spacing: {
    grid: 4,
    /** Fraction of usages that must sit on the grid before the site is said to follow it. */
    gridShare: 0.8,
    /** Fewer usages than this and there is no scale to infer. */
    minUsages: 20,
    /** A value at least this share of all usages is the site's own step, however odd. */
    establishedShare: 0.05,
    /** A site is also on the grid when this share is on it and `halfGridShare` is on the 2px half-grid. */
    halfGridMin: 0.5,
    halfGridShare: 0.9,
  },
  radius: { minUsages: 8, dominantShare: 0.08, dominantMin: 3, rareMax: 2, rareShare: 0.03, maxDiff: 2, minDiff: 0.5, ratio: 4, ignoreAbove: 500 },
  font: { minUsages: 20, dominantShare: 0.06, dominantMin: 3, rareMax: 2, rareShare: 0.02, maxDiff: 1.5, minDiff: 0.5, ratio: 4 },
  color: { minUsages: 20, dominantShare: 0.02, dominantMin: 4, rareMax: 2, rareShare: 0.01, maxDelta: 1.5, ratio: 4, greySprawl: 13 },
  shadow: { minUsages: 8, dominantShare: 0.08, dominantMin: 3, rareMax: 2, rareShare: 0.03, maxDiff: 2, ratio: 4 },
}

/* ── usage collection ─────────────────────────────────────────────────── */

export function emptyUsage() {
  return { spacing: {}, radius: {}, font: {}, color: {}, shadow: {}, fractional: 0, elements: 0 }
}

function bump(bucket, key, example, extra) {
  let entry = bucket[key]
  if (!entry) {
    entry = { count: 0, ex: [], ...extra }
    bucket[key] = entry
  }
  entry.count++
  if (entry.ex.length < 5 && example) entry.ex.push(example)
}

/** `padding-top, padding-right, padding-bottom, padding-left` reads as `padding`. */
export function collapseProps(props) {
  const out = []
  for (const family of ['margin', 'padding']) {
    const sides = props.filter((p) => p.startsWith(`${family}-`)).map((p) => p.slice(family.length + 1))
    if (sides.length === 4) out.push(family)
    else if (sides.length) out.push(`${family}-${sides.join('/')}`)
  }
  for (const gap of props.filter((p) => p.endsWith('-gap'))) out.push(gap)
  return out.join(', ')
}

/**
 * Tally what one page uses.
 *
 * @param {object[]} elements
 * @param {{ page: string }} where
 */
export function collectUsage(elements, where) {
  const usage = emptyUsage()

  for (const record of elements) {
    if (!(record.r[2] > 0 || record.r[3] > 0)) continue
    if (isHiddenSubtree(elements, record.i)) continue
    const svg = inSvg(elements, record.i)
    usage.elements++

    const at = (detail) => ({
      page: where.page,
      selector: selectorFor(elements, record.i) + quote(record),
      detail,
    })

    // Spacing: each distinct value once per element, remembering which properties carried it.
    if (!svg) {
      const byValue = new Map()
      for (const [prop, raw] of Object.entries(record.sp)) {
        const value = Math.abs(raw)
        if (Math.abs(value - Math.round(value)) > 0.01) {
          usage.fractional++
          continue
        }
        const px = Math.round(value)
        if (px === 0) continue
        if (!byValue.has(px)) byValue.set(px, [])
        byValue.get(px).push(prop)
      }
      for (const [px, props] of byValue) bump(usage.spacing, String(px), at(`${collapseProps(props)}: ${px}px`))
    }

    for (const radius of new Set(record.radii)) {
      if (radius < THRESHOLDS.radius.ignoreAbove) bump(usage.radius, String(radius), at(`border-radius: ${radius}px`))
    }

    if (record.text > 0 && !svg) {
      bump(usage.font, String(record.fs), at(`font-size: ${record.fs}px`))
      const paint = record.fill
      if (paint[3] > 0.02) bump(usage.color, toHex(paint), at(`text ${toHex(paint)}`), { rgba: paint })
    }
    if (record.bg[3] > 0.02) bump(usage.color, toHex(record.bg), at(`background ${toHex(record.bg)}`), { rgba: record.bg })
    const seen = new Set()
    for (const border of record.borders) {
      const hex = toHex(border)
      if (seen.has(hex)) continue
      seen.add(hex)
      bump(usage.color, hex, at(`border ${hex}`), { rgba: border })
    }

    if (record.shadow) bump(usage.shadow, record.shadow, at(`box-shadow: ${record.shadow.slice(0, 60)}`))
  }

  return usage
}

/** Fold `source` into `target`, in place. Page order is preserved in the examples. */
export function mergeUsage(target, source) {
  for (const kind of ['spacing', 'radius', 'font', 'color', 'shadow']) {
    for (const [key, entry] of Object.entries(source[kind])) {
      const into = target[kind][key]
      if (!into) {
        target[kind][key] = { ...entry, ex: [...entry.ex] }
      } else {
        into.count += entry.count
        for (const example of entry.ex) if (into.ex.length < 5) into.ex.push(example)
      }
    }
  }
  target.fractional += source.fractional
  target.elements += source.elements
  return target
}

/* ── inference ────────────────────────────────────────────────────────── */

/** Entries as `{ key, value, count, ex }`, most used first, ties broken by value so output is stable. */
function entriesOf(bucket, numeric = true) {
  return Object.entries(bucket)
    .map(([key, entry]) => ({ key, value: numeric ? Number(key) : key, ...entry }))
    .sort((a, b) => b.count - a.count || (numeric ? a.value - b.value : a.key.localeCompare(b.key)))
}

const sum = (entries) => entries.reduce((n, e) => n + e.count, 0)

/**
 * Rare values that sit close to a dominant one.
 *
 * @template T
 * @param {T[]} entries  sorted by count, most used first
 * @param {object} t     the threshold block
 * @param {(a: T, b: T) => number | null} distance  null when the pair is not comparable
 * @param {number} lo    smallest distance that still counts as "different"
 * @param {number} hi    largest distance that still counts as "close"
 * @param {(entry: T) => boolean} [eligible]  entries that may be called outliers at all
 */
function nearDuplicates(entries, t, distance, lo, hi, eligible = () => true) {
  const total = sum(entries)
  const dominantAt = Math.max(t.dominantMin, Math.ceil(total * t.dominantShare))
  const rareAt = Math.max(t.rareMax, Math.floor(total * t.rareShare))
  const dominant = entries.filter((e) => e.count >= dominantAt)
  const found = []

  for (const entry of entries) {
    if (entry.count > rareAt || dominant.includes(entry) || !eligible(entry)) continue
    let best = null
    for (const d of dominant) {
      if (d.count < entry.count * t.ratio) continue
      const gap = distance(entry, d)
      if (gap === null || gap < lo || gap > hi) continue
      if (!best || gap < best.gap || (gap === best.gap && d.count > best.d.count)) best = { d, gap }
    }
    if (best) found.push({ entry, near: best.d, gap: best.gap })
  }
  return { dominant, found, total }
}

const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many)
const px = (n) => `${Number(n.toFixed(2))}px`

/**
 * @param {ReturnType<typeof emptyUsage>} usage
 * @returns {{ scales: object, findings: object[] }}
 */
export function inferTokens(usage) {
  const findings = []
  const scales = {}

  /* ── spacing ── */
  {
    const t = THRESHOLDS.spacing
    const entries = entriesOf(usage.spacing)
    const total = sum(entries)
    const onGrid = entries.filter((e) => e.value % t.grid === 0)
    const share = total ? sum(onGrid) / total : 0
    // Tailwind's own scale has 2, 6, 10 and 14px in it (p-0.5, p-1.5, ...), so a
    // site can be on a 4px grid with half-steps and only 60% of its values
    // divisible by 4. It follows the grid if it is mostly on it, or if it is
    // half on it and everything else is on the 2px half-grid.
    const evenShare = total ? sum(entries.filter((e) => e.value % 2 === 0)) / total : 0
    const follows = share >= t.gridShare || (share >= t.halfGridMin && evenShare >= t.halfGridShare)
    const reported = share >= t.gridShare ? share : evenShare
    const steps = entries
      .filter((e) => e.value % t.grid === 0 && e.count >= Math.max(2, total * 0.01))
      .map((e) => e.value)
      .sort((a, b) => a - b)

    if (total < t.minUsages) {
      scales.spacing = { grid: null, reason: `only ${total} spacing declarations; too few to infer a scale`, total }
    } else if (!follows) {
      scales.spacing = { grid: null, reason: `no dominant grid: ${(share * 100).toFixed(0)}% of ${total} values sit on ${t.grid}px`, total, share }
    } else {
      scales.spacing = {
        grid: t.grid,
        share: Number(share.toFixed(3)),
        halfStepShare: Number(evenShare.toFixed(3)),
        total,
        steps,
        halfSteps: entries.filter((e) => e.value % t.grid === 2).map((e) => e.value).sort((a, b) => a - b),
      }
      for (const entry of entries) {
        // Odd pixel values only. 6, 10 and 14 are Tailwind's half-steps and
        // are how many design systems spell "a little more than 4"; 13 is
        // nobody's step. A 1px value is a hairline, not spacing.
        if (entry.value % 2 === 0 || entry.value < 3) continue
        if (entry.count >= total * t.establishedShare) continue
        const below = Math.floor(entry.value / t.grid) * t.grid
        const above = below + t.grid
        const nearest = entry.value - below <= above - entry.value ? below : above
        findings.push({
          rule: 'spacing-off-grid',
          family: 'tokens',
          severity: 'advisory',
          key: `spacing:${entry.value}`,
          message:
            `Spacing of ${px(entry.value)} is off the ${t.grid}px grid ` +
            `(${(reported * 100).toFixed(0)}% of this site's ${total} spacing values sit on it${share >= t.gridShare ? '' : ' or its 2px half-steps'}): ` +
            `used ${entry.count}x, ${px(Math.abs(entry.value - nearest))} from ${px(nearest)}.`,
          count: entry.count,
          examples: entry.ex.slice(0, 3),
          data: { value: entry.value, nearest, delta: Math.abs(entry.value - nearest), grid: t.grid },
        })
      }
    }
  }

  /* ── radius ── */
  {
    const t = THRESHOLDS.radius
    const entries = entriesOf(usage.radius)
    const total = sum(entries)
    if (total < t.minUsages) {
      scales.radius = { values: [], reason: `only ${total} rounded elements; too few to infer a set`, total }
    } else {
      const { dominant, found } = nearDuplicates(entries, t, (a, b) => Math.abs(a.value - b.value), t.minDiff, t.maxDiff)
      scales.radius = { values: dominant.map((e) => e.value).sort((a, b) => a - b), total }
      for (const { entry, near, gap } of found) {
        findings.push({
          rule: 'radius-drift',
          family: 'tokens',
          severity: 'advisory',
          key: `radius:${entry.value}`,
          message:
            `Border radius ${px(entry.value)} used ${entry.count}x while ${px(near.value)} dominates ` +
            `(${near.count}x); ${px(gap)} off. The rest of the set: ${scales.radius.values.map(px).join(', ')}.`,
          count: entry.count,
          examples: entry.ex.slice(0, 3),
          data: { value: entry.value, near: near.value, delta: gap, dominant: scales.radius.values },
        })
      }
    }
  }

  /* ── type ── */
  {
    const t = THRESHOLDS.font
    const entries = entriesOf(usage.font)
    const total = sum(entries)
    if (total < t.minUsages) {
      scales.font = { values: [], reason: `only ${total} text elements; too few to infer a scale`, total }
    } else {
      const { dominant, found } = nearDuplicates(entries, t, (a, b) => Math.abs(a.value - b.value), t.minDiff, t.maxDiff)
      scales.font = { values: dominant.map((e) => e.value).sort((a, b) => a - b), total }
      for (const { entry, near, gap } of found) {
        findings.push({
          rule: 'type-drift',
          family: 'tokens',
          severity: 'advisory',
          key: `font:${entry.value}`,
          message:
            `Font size ${px(entry.value)} used ${entry.count}x while ${px(near.value)} dominates ` +
            `(${near.count}x); ${px(gap)} off. The rest of the scale: ${scales.font.values.map(px).join(', ')}.`,
          count: entry.count,
          examples: entry.ex.slice(0, 3),
          data: { value: entry.value, near: near.value, delta: gap, dominant: scales.font.values },
        })
      }
    }
  }

  /* ── colour ── */
  {
    const t = THRESHOLDS.color
    const all = entriesOf(usage.color, false)
    const opaque = all.filter((e) => e.rgba[3] >= 0.99)
    const total = sum(opaque)
    const greys = opaque.filter((e) => isGrey(e.rgba))
    scales.color = {
      distinct: all.length,
      translucent: all.length - opaque.length,
      greys: greys.length,
      top: opaque.slice(0, 8).map((e) => ({ hex: e.key, count: e.count })),
    }

    if (total >= t.minUsages) {
      // Pure white and pure black are anchors, not drift: a design that has
      // #f4f4f5 and #ffffff means both, and the page background is counted once.
      const anchor = (e) => e.key === '#ffffff' || e.key === '#000000'
      const { found } = nearDuplicates(opaque, t, (a, b) => deltaE(a.rgba, b.rgba), 0.0001, t.maxDelta, (e) => !anchor(e))
      for (const { entry, near, gap } of found) {
        findings.push({
          rule: 'color-near-duplicate',
          family: 'tokens',
          severity: 'advisory',
          key: `color:${entry.key}`,
          message:
            `Colour ${entry.key} used ${entry.count}x is a near-duplicate of ${near.key} (${near.count}x): ` +
            `visually ${gap.toFixed(1)} apart, where about 2 is the smallest difference an eye notices.`,
          count: entry.count,
          examples: entry.ex.slice(0, 3),
          data: { value: entry.key, near: near.key, deltaE: Number(gap.toFixed(2)) },
        })
      }

      if (greys.length >= t.greySprawl) {
        findings.push({
          rule: 'grey-sprawl',
          family: 'tokens',
          severity: 'advisory',
          key: 'greys',
          message:
            `${greys.length} different greys in use. A full neutral ramp is 11 steps; the ${Math.min(6, greys.length)} ` +
            `most used are ${greys.slice(0, 6).map((e) => `${e.key} (${e.count}x)`).join(', ')}.`,
          count: greys.length,
          examples: greys.slice(-3).flatMap((e) => e.ex.slice(0, 1)),
          data: { distinct: greys.length, top: greys.slice(0, 6).map((e) => e.key) },
        })
      }
    }
  }

  /* ── shadow ── */
  {
    const t = THRESHOLDS.shadow
    const entries = entriesOf(usage.shadow, false).map((e) => ({ ...e, layers: parseShadow(e.key) }))
    const total = sum(entries)
    scales.shadow = { distinct: entries.length, total, top: entries.slice(0, 3).map((e) => e.key) }
    if (total >= t.minUsages) {
      const distance = (a, b) => {
        if (a.layers.length !== b.layers.length) return null
        let worst = 0
        for (let i = 0; i < a.layers.length; i++) {
          const x = a.layers[i]
          const y = b.layers[i]
          if (x.inset !== y.inset || x.color !== y.color) return null
          for (let n = 0; n < 4; n++) worst = Math.max(worst, Math.abs(x.nums[n] - y.nums[n]))
        }
        return worst
      }
      const { found } = nearDuplicates(entries, t, distance, 0.0001, t.maxDiff)
      for (const { entry, near, gap } of found) {
        findings.push({
          rule: 'shadow-drift',
          family: 'tokens',
          severity: 'advisory',
          key: `shadow:${entry.key}`,
          message:
            `Shadow "${entry.key.slice(0, 70)}" used ${entry.count}x nearly duplicates "${near.key.slice(0, 70)}" ` +
            `(${near.count}x); no offset, blur or spread differs by more than ${px(gap)}.`,
          count: entry.count,
          examples: entry.ex.slice(0, 3),
          data: { value: entry.key, near: near.key, delta: gap },
        })
      }
    }
  }

  return { scales, findings }
}

/** Split on top-level commas (not the ones inside `rgb(...)`), and read each layer's numbers. */
export function parseShadow(value) {
  const layers = []
  let depth = 0
  let start = 0
  const parts = []
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ',' && depth === 0) {
      parts.push(value.slice(start, i))
      start = i + 1
    }
  }
  parts.push(value.slice(start))

  for (const part of parts) {
    const trimmed = part.trim()
    const inset = /\binset\b/.test(trimmed)
    const color = (/(?:rgba?|oklab|oklch|lab|lch|hsla?|color)\([^)]*\)|#[0-9a-f]{3,8}/i.exec(trimmed) ?? [''])[0]
    const rest = trimmed.replace(color, '').replace(/\binset\b/, '')
    const nums = (rest.match(/-?[\d.]+(?:px)?/g) ?? []).map((n) => parseFloat(n))
    while (nums.length < 4) nums.push(0)
    layers.push({ inset, color: color.replace(/\s+/g, ''), nums: nums.slice(0, 4) })
  }
  return layers
}
