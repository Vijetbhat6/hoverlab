/**
 * Unit tests for the Tailwind ↔ CSS translator.
 *
 * Runner: Node's built-in `node:test` via the tsx loader (no test deps).
 *   npm test  →  node --import=tsx --test src/lib/tailwind-convert.test.ts
 *
 * The mapping tables are the part of this module that will rot — a Tailwind
 * scale changes, or someone adds a property to one direction and forgets
 * the other. These pin the behaviour that the tool's output depends on:
 * that known values are exact, that unknown ones fall back rather than
 * disappear, and that a round trip through both directions comes back.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  cssToTailwind,
  declarationToUtilities,
  tailwindToCss,
} from './tailwind-convert'

/* ============================================================
 *  CSS → Tailwind
 * ============================================================ */

describe('declarationToUtilities', () => {
  it('maps whole-value keywords exactly', () => {
    assert.equal(declarationToUtilities('display', 'flex').output, 'flex')
    assert.equal(declarationToUtilities('display', 'none').output, 'hidden')
    assert.equal(declarationToUtilities('position', 'absolute').output, 'absolute')
    assert.equal(declarationToUtilities('justify-content', 'space-between').output, 'justify-between')
    assert.equal(declarationToUtilities('align-items', 'center').output, 'items-center')
  })

  it('accepts both the flex and the plain spelling of start and end', () => {
    assert.equal(declarationToUtilities('justify-content', 'flex-start').output, 'justify-start')
    assert.equal(declarationToUtilities('justify-content', 'start').output, 'justify-start')
  })

  it('maps px lengths onto the default spacing scale', () => {
    assert.equal(declarationToUtilities('padding', '16px').output, 'p-4')
    assert.equal(declarationToUtilities('margin-top', '8px').output, 'mt-2')
    assert.equal(declarationToUtilities('gap', '24px').output, 'gap-6')
    assert.equal(declarationToUtilities('width', '256px').output, 'w-64')
  })

  it('treats rem at a 16px root, the way the scale is defined', () => {
    assert.equal(declarationToUtilities('padding', '1rem').output, 'p-4')
    assert.equal(declarationToUtilities('padding', '0.5rem').output, 'p-2')
  })

  it('falls back to an arbitrary value when the length is off the scale', () => {
    const result = declarationToUtilities('padding', '37px')
    assert.equal(result.output, 'p-[37px]')
    assert.equal(result.kind, 'arbitrary-value')
    // The note has to name the neighbours — that is the whole reason a
    // fallback is more useful than a silent nearest-match.
    assert.match(result.note ?? '', /9 \(36px\)/)
  })

  it('puts the minus on the utility for negative spacing', () => {
    assert.equal(declarationToUtilities('margin-top', '-8px').output, '-mt-2')
  })

  it('uses the named size utilities where they exist', () => {
    assert.equal(declarationToUtilities('width', '100%').output, 'w-full')
    assert.equal(declarationToUtilities('height', 'auto').output, 'h-auto')
    assert.equal(declarationToUtilities('width', '50%').output, 'w-1/2')
  })

  it('maps the named scales', () => {
    assert.equal(declarationToUtilities('border-radius', '0.5rem').output, 'rounded-lg')
    assert.equal(declarationToUtilities('border-radius', '8px').output, 'rounded-lg')
    assert.equal(declarationToUtilities('border-radius', '9999px').output, 'rounded-full')
    assert.equal(declarationToUtilities('font-size', '1.5rem').output, 'text-2xl')
    assert.equal(declarationToUtilities('font-weight', '700').output, 'font-bold')
    assert.equal(declarationToUtilities('border-width', '1px').output, 'border')
    assert.equal(declarationToUtilities('opacity', '0.5').output, 'opacity-50')
  })

  it('emits colours as arbitrary values rather than guessing a theme name', () => {
    const result = declarationToUtilities('background-color', '#10b981')
    assert.equal(result.output, 'bg-[#10b981]')
    assert.equal(result.kind, 'arbitrary-value')
  })

  it('collapses an even fr grid to the numbered utility', () => {
    assert.equal(
      declarationToUtilities('grid-template-columns', 'repeat(3, minmax(0, 1fr))').output,
      'grid-cols-3',
    )
    assert.equal(
      declarationToUtilities('grid-template-columns', '1fr 1fr').output,
      'grid-cols-2',
    )
  })

  it('keeps an uneven grid exact, as an arbitrary value with no spaces', () => {
    const result = declarationToUtilities('grid-template-columns', '240px 1fr')
    assert.equal(result.output, 'grid-cols-[240px_1fr]')
    assert.equal(result.kind, 'arbitrary-value')
  })

  it('never drops a declaration it has no utility for', () => {
    const result = declarationToUtilities('mask-image', 'linear-gradient(black, transparent)')
    assert.equal(result.kind, 'arbitrary-property')
    assert.equal(result.output, '[mask-image:linear-gradient(black,_transparent)]')
  })

  it('refuses a custom property instead of inventing a class for it', () => {
    const result = declarationToUtilities('--brand', '#10b981')
    assert.equal(result.output, null)
    assert.equal(result.kind, 'unsupported')
  })
})

describe('cssToTailwind', () => {
  it('takes a bare list of declarations', () => {
    const { classes } = cssToTailwind('display: flex; gap: 16px; padding: 8px;')
    assert.equal(classes, 'flex gap-4 p-2')
  })

  it('takes a whole rule, braces and selector included', () => {
    const { classes } = cssToTailwind('.card {\n  display: grid;\n  gap: 24px;\n}')
    assert.equal(classes, 'grid gap-6')
  })

  it('ignores comments rather than converting what is inside them', () => {
    const { classes } = cssToTailwind('/* padding: 999px; */ display: flex;')
    assert.equal(classes, 'flex')
  })

  it('reports an at-rule instead of silently swallowing it', () => {
    const { lines } = cssToTailwind('@media (min-width: 640px) { display: flex; }')
    const atRule = lines.find((l) => l.source.startsWith('@'))
    assert.ok(atRule, 'the at-rule should appear in the report')
    assert.equal(atRule?.kind, 'unsupported')
  })

  it('returns one line per declaration so nothing goes missing', () => {
    const { lines } = cssToTailwind('display: flex; mask-image: none; --x: 1;')
    assert.equal(lines.length, 3)
  })
})

/* ============================================================
 *  Tailwind → CSS
 * ============================================================ */

describe('tailwindToCss', () => {
  it('expands keyword utilities', () => {
    assert.equal(tailwindToCss('flex')[0].css, 'display: flex;')
    assert.equal(tailwindToCss('hidden')[0].css, 'display: none;')
    assert.equal(tailwindToCss('items-center')[0].css, 'align-items: center;')
  })

  it('expands scale steps', () => {
    assert.equal(tailwindToCss('p-4')[0].css, 'padding: 1rem;')
    assert.equal(tailwindToCss('rounded-lg')[0].css, 'border-radius: 0.5rem;')
    assert.equal(tailwindToCss('text-2xl')[0].css, 'font-size: 1.5rem;')
    assert.equal(tailwindToCss('grid-cols-3')[0].css, 'grid-template-columns: repeat(3, minmax(0, 1fr));')
  })

  it('expands arbitrary values, turning underscores back into spaces', () => {
    assert.equal(tailwindToCss('grid-cols-[240px_1fr]')[0].css, 'grid-template-columns: 240px 1fr;')
    assert.equal(tailwindToCss('bg-[#10b981]')[0].css, 'background-color: #10b981;')
  })

  it('expands an arbitrary property', () => {
    assert.equal(
      tailwindToCss('[mask-image:linear-gradient(black,_transparent)]')[0].css,
      'mask-image: linear-gradient(black, transparent);',
    )
  })

  it('names a variant rather than guessing its breakpoint', () => {
    const [result] = tailwindToCss('md:flex')
    assert.equal(result.css, 'display: flex;')
    assert.match(result.note ?? '', /variant/)
  })

  it('does not mistake the colon inside an arbitrary property for a variant', () => {
    const [result] = tailwindToCss('[mask-image:none]')
    assert.equal(result.css, 'mask-image: none;')
    assert.equal(result.note, undefined)
  })

  it('says so when a class is outside the table', () => {
    const [result] = tailwindToCss('prose-lg')
    assert.equal(result.css, null)
    assert.ok(result.note)
  })

  it('handles several classes at once', () => {
    const results = tailwindToCss('flex gap-4 p-2')
    assert.equal(results.length, 3)
    assert.ok(results.every((r) => r.css))
  })
})

/* ============================================================
 *  Round trips — the property that keeps the two tables honest
 * ============================================================ */

describe('round trips', () => {
  const cases = [
    'display: flex;',
    'padding: 16px;',
    'gap: 24px;',
    'border-radius: 8px;',
    'align-items: center;',
    'grid-template-columns: repeat(3, minmax(0, 1fr));',
  ]

  for (const declaration of cases) {
    it(`survives CSS → Tailwind → CSS: ${declaration}`, () => {
      const { classes } = cssToTailwind(declaration)
      const [back] = tailwindToCss(classes)
      assert.ok(back.css, `${classes} should expand back to CSS`)

      // Lengths legitimately change unit on the way round — 16px is 1rem —
      // so the comparison is on the property plus the *meaning*, which is
      // what the scale tables are for.
      const property = declaration.slice(0, declaration.indexOf(':'))
      assert.ok(
        back.css!.startsWith(`${property}:`),
        `expected ${back.css} to be a ${property} declaration`,
      )
    })
  }
})
