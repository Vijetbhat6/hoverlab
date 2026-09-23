import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  LONG_WORD,
  cjkText,
  emptyText,
  expandText,
  expansionFactor,
  hugeNumbers,
  longName,
} from './pseudo'

describe('expandText', () => {
  it('follows the IBM allowance: short strings roughly triple, long ones grow ~30%', () => {
    assert.equal(expansionFactor(5), 3)
    assert.equal(expansionFactor(15), 1.8)
    assert.equal(expansionFactor(200), 1.3)
  })

  it('makes short labels much longer and keeps the surrounding whitespace', () => {
    const out = expandText('  Save  ')
    assert.match(out, /^ {2}\S+ {2}$/)
    assert.ok(out.trim().length >= 'Save'.length * 3 - 1)
  })

  it('accents the letters it keeps', () => {
    assert.match(expandText('Settings saved'), /š/)
  })

  it('lengthens a sentence by about 30% and never shrinks it', () => {
    const source = 'Your changes have been saved and will be visible to everyone on the team shortly'
    const out = expandText(source)
    assert.ok(out.length >= Math.floor(source.length * 1.28))
    assert.ok(out.length <= Math.ceil(source.length * 1.34))
  })

  it('leaves strings with no letters alone', () => {
    assert.equal(expandText('12,345'), '12,345')
    assert.equal(expandText('—'), '—')
  })

  it('leaves initials, units and abbreviations alone', () => {
    assert.equal(expandText('AL'), 'AL')
    assert.equal(expandText('180ms'), '180ms')
    assert.equal(expandText('2.4B'), '2.4B')
    assert.notEqual(expandText('Left'), 'Left')
  })

  it('is deterministic', () => {
    assert.equal(expandText('Add to cart'), expandText('Add to cart'))
  })
})

describe('cjkText', () => {
  it('removes the spaces so the line can only wrap between characters', () => {
    const out = cjkText('Download the report')
    assert.ok(!/\s/.test(out))
    assert.match(out, /^[一-鿿]+$/u)
  })

  it('is about half as many characters as the source letters', () => {
    const out = cjkText('abcdefgh')
    assert.equal(Array.from(out).length, 4)
  })

  it('keeps digits and punctuation so a price still reads as one', () => {
    assert.match(cjkText('Total: $42.00'), /\$42\.00$/)
  })

  it('leaves letterless strings alone', () => {
    assert.equal(cjkText('$1,200'), '$1,200')
  })
})

describe('longName', () => {
  it('appends an unbreakable word to short name-like strings', () => {
    assert.equal(longName('Ada Lovelace'), `Ada Lovelace ${LONG_WORD}`)
    assert.ok(!/\s/.test(LONG_WORD) && LONG_WORD.length >= 30)
  })

  it('leaves prose, numbers and times alone', () => {
    assert.equal(longName('This is a full sentence with many words in it.'), 'This is a full sentence with many words in it.')
    assert.equal(longName('$4,200'), '$4,200')
    assert.equal(longName('10:30'), '10:30')
  })

  it('leaves strings that are too short to be data', () => {
    assert.equal(longName('OK'), 'OK')
  })

  it('leaves measurements alone: a digit means it is not a name', () => {
    assert.equal(longName('2h 14m today'), '2h 14m today')
    assert.equal(longName('+108 more'), '+108 more')
  })
})

describe('hugeNumbers', () => {
  it('adds six digits to a currency amount', () => {
    assert.equal(hugeNumbers('$4,200'), '$4,200,000,000')
    assert.equal(hugeNumbers('12 users'), '12,000,000 users')
  })

  it('keeps decimals readable and a leading zero sensible', () => {
    assert.equal(hugeNumbers('3.5 GB'), '3,000,000.5 GB')
    assert.equal(hugeNumbers('0.8 stars'), '9,000,000.8 stars')
  })

  it('leaves percentages and lone ordinals alone', () => {
    assert.equal(hugeNumbers('72%'), '72%')
    assert.equal(hugeNumbers('99.9%'), '99.9%')
    assert.equal(hugeNumbers('14'), '14')
    assert.equal(hugeNumbers(' 3 '), ' 3 ')
    // but a two-digit quantity next to a noun is a quantity
    assert.equal(hugeNumbers('12 users'), '12,000,000 users')
  })

  it('leaves years, times, dates and identifiers alone', () => {
    assert.equal(hugeNumbers('© 2026 Acme'), '© 2026 Acme')
    assert.equal(hugeNumbers('at 10:30'), 'at 10:30')
    assert.equal(hugeNumbers('2026-09-21'), '2026-09-21')
    assert.equal(hugeNumbers('h2 and v2'), 'h2 and v2')
  })

  it('groups an ungrouped integer', () => {
    assert.equal(hugeNumbers('4200'), '4,200,000,000')
  })
})

describe('emptyText', () => {
  it('blanks text and keeps whitespace-only nodes', () => {
    assert.equal(emptyText('Ada'), '')
    assert.equal(emptyText('  '), '  ')
  })
})
