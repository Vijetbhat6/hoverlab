/**
 * Tests for the CSS → registry `css` object conversion.
 *
 *   npm test  →  node --import=tsx --test src/lib/registry/css-to-object.test.ts
 *
 * Two halves, and the second is the one that matters.
 *
 * The unit cases below pin the edges: quotes containing braces, `url()`
 * with a semicolon in it, keyframes, `@property`, duplicate declarations.
 * Every one of them was chosen because it occurs in the real catalog, not
 * because it is interesting CSS.
 *
 * Then `flattenCss` and `declarationsInSource` reduce the converted object
 * and the original text to the same shape — one declaration per scope path
 * — so they can be compared directly. `declarationsInSource` is a
 * deliberately dumber second walk, written so a bug in the converter cannot
 * hide behind the same bug in its own checker. Both are exported, and
 * `effects-css.test.ts` runs them across all 771 generated effects.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { cssToObject, type CssObject } from './css-to-object'

describe('cssToObject', () => {
  it('reads a plain rule', () => {
    const { css, warnings } = cssToObject('.a { color: red; font-weight: 600; }')
    assert.deepEqual(css, { '.a': { color: 'red', 'font-weight': '600' } })
    assert.deepEqual(warnings, [])
  })

  it('keeps rule order, because :hover follows the rule it modifies', () => {
    const { css } = cssToObject('.a { color: red } .a:hover { color: blue }')
    assert.deepEqual(Object.keys(css), ['.a', '.a:hover'])
  })

  it('handles a missing final semicolon', () => {
    const { css, warnings } = cssToObject('.a { color: red }')
    assert.deepEqual(css, { '.a': { color: 'red' } })
    assert.deepEqual(warnings, [])
  })

  it('nests keyframes, whose selectors are from/to/percentages', () => {
    const { css, warnings } = cssToObject(
      '@keyframes spin { from { transform: rotate(0) } 50% { opacity: .5 } to { transform: rotate(360deg) } }',
    )
    assert.deepEqual(css, {
      '@keyframes spin': {
        from: { transform: 'rotate(0)' },
        '50%': { opacity: '.5' },
        to: { transform: 'rotate(360deg)' },
      },
    })
    assert.deepEqual(warnings, [])
  })

  it('treats @property as declarations, not as rules', () => {
    // Its body is `syntax`/`inherits`/`initial-value`, and it comes out
    // right with no special case — see the note in the module.
    const { css, warnings } = cssToObject(
      "@property --angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }",
    )
    assert.deepEqual(css, {
      '@property --angle': {
        syntax: "'<angle>'",
        inherits: 'false',
        'initial-value': '0deg',
      },
    })
    assert.deepEqual(warnings, [])
  })

  it('nests media queries without reading their parens as structure', () => {
    const { css } = cssToObject('@media (min-width: 40rem) { .a { gap: 1rem } }')
    assert.deepEqual(css, { '@media (min-width: 40rem)': { '.a': { gap: '1rem' } } })
  })

  it('does not split on a semicolon inside url()', () => {
    const { css, warnings } = cssToObject(
      ".a { background: url(data:image/svg+xml;utf8,<svg/>); color: red }",
    )
    assert.deepEqual(css, {
      '.a': { background: 'url(data:image/svg+xml;utf8,<svg/>)', color: 'red' },
    })
    assert.deepEqual(warnings, [])
  })

  it('does not read a brace inside a string as a block', () => {
    const { css, warnings } = cssToObject('.a::after { content: "}"; color: red }')
    assert.deepEqual(css, { '.a::after': { content: '"}"', color: 'red' } })
    assert.deepEqual(warnings, [])
  })

  it('does not split a value at a colon inside parens', () => {
    const { css } = cssToObject('.a { background: image-set(url(a.png) 1x); }')
    assert.deepEqual(css, { '.a': { background: 'image-set(url(a.png) 1x)' } })
  })

  it('strips comments but not comment-like text inside a string', () => {
    const { css } = cssToObject('.a { /* note */ content: "/* not a comment */"; }')
    assert.deepEqual(css, { '.a': { content: '"/* not a comment */"' } })
  })

  it('merges two rules with the same selector rather than replacing', () => {
    const { css } = cssToObject('.a { color: red } .a { transform: scale(1.1) }')
    assert.deepEqual(css, { '.a': { color: 'red', transform: 'scale(1.1)' } })
  })

  it('warns when a declaration is repeated, and keeps the last', () => {
    const { css, warnings } = cssToObject('.a { background: red; background: linear-gradient(red, blue) }')
    assert.deepEqual(css, { '.a': { background: 'linear-gradient(red, blue)' } })
    assert.equal(warnings.length, 1)
    assert.match(warnings[0]!, /declared more than once/)
  })

  it('warns rather than dropping something it cannot read', () => {
    const { warnings } = cssToObject('.a { this-is-not-a-declaration }')
    assert.equal(warnings.length, 1)
    assert.match(warnings[0]!, /could not read/)
  })

  it('strips // line comments, which are not CSS but do occur', () => {
    const { css, warnings } = cssToObject(
      '.a { color: red }\n// usage: add the listener\n',
    )
    assert.deepEqual(css, { '.a': { color: 'red' } })
    assert.deepEqual(warnings, [])
  })

  it('does not mistake a URL for a // comment', () => {
    const { css, warnings } = cssToObject(
      '.a { background: url(https://cdn.example.com/x.png); border-image: url(//cdn/y.png) }',
    )
    assert.deepEqual(css, {
      '.a': {
        background: 'url(https://cdn.example.com/x.png)',
        'border-image': 'url(//cdn/y.png)',
      },
    })
    assert.deepEqual(warnings, [])
  })

  it('returns an empty object for empty input', () => {
    assert.deepEqual(cssToObject('').css, {})
    assert.deepEqual(cssToObject('   \n  ').css, {})
  })
})

/* -- round trip ---------------------------------------------------------- *
 *
 * Exported so `registry.test.ts` can run it across the whole catalog.
 * ------------------------------------------------------------------------ */

/** Flatten a converted object back to `path -> declaration` pairs. */
export function flattenCss(css: CssObject, prefix: string[] = []): Map<string, string> {
  const out = new Map<string, string>()
  for (const [key, value] of Object.entries(css)) {
    if (typeof value === 'string') {
      out.set([...prefix, key].join(' >> '), value)
    } else {
      for (const [k, v] of flattenCss(value, [...prefix, key])) out.set(k, v)
    }
  }
  return out
}

/**
 * Every declaration in the source text, keyed by its scope path.
 *
 * Built by a second, dumber walk than the converter's — regex over a
 * brace-depth stack — precisely so that a bug in the converter cannot hide
 * behind the same bug in the checker.
 */
export function declarationsInSource(css: string): Map<string, string> {
  const out = new Map<string, string>()
  const stack: string[] = []
  let buf = ''
  let quote: string | null = null
  let paren = 0

  const flushDeclaration = () => {
    const text = buf.trim()
    buf = ''
    if (!text) return
    const idx = text.indexOf(':')
    if (idx === -1) return
    const prop = text.slice(0, idx).trim()
    const value = text.slice(idx + 1).trim()
    if (prop && value) out.set([...stack, prop].join(' >> '), value)
  }

  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i]!
    if (quote) {
      buf += ch
      if (ch === '\\') { buf += css[i + 1] ?? ''; i += 1 }
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue }
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      i = end === -1 ? css.length : end + 1
      continue
    }
    if (ch === '(') paren += 1
    if (ch === ')') paren = Math.max(0, paren - 1)

    if (paren === 0 && ch === '{') {
      stack.push(buf.trim())
      buf = ''
      continue
    }
    if (paren === 0 && ch === '}') {
      flushDeclaration()
      stack.pop()
      continue
    }
    if (paren === 0 && ch === ';') {
      flushDeclaration()
      continue
    }
    buf += ch
  }

  return out
}

describe('round trip', () => {
  it('the independent source walk agrees with the converter', () => {
    const source = `
      .fx-a { color: red; background: url(x.png;y) }
      .fx-a:hover { color: blue }
      @keyframes k { from { opacity: 0 } to { opacity: 1 } }
      @media (min-width: 40rem) { .fx-a { gap: 1rem } }
    `
    const converted = flattenCss(cssToObject(source).css)
    const direct = declarationsInSource(source)
    assert.deepEqual([...converted.entries()].sort(), [...direct.entries()].sort())
  })
})
