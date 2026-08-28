/**
 * The scanner and the layout maths.
 *
 * The drawing itself needs a canvas and is not tested here; everything that
 * decides *what* gets drawn does not, and that is where the bugs live — a
 * block comment that never closes, a long line that makes a mural, a gutter
 * that overlaps the code once the file passes a hundred lines.
 *
 * `layout` takes its text measurement as an argument precisely so this file
 * can hand it a monospace stub and check the arithmetic exactly.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  CODE_THEMES,
  downloadName,
  layout,
  tokenize,
  wrapRow,
  type CodeImageOptions,
  type Token,
} from './code-image'

/** Every glyph one unit wide, so widths are character counts. */
const mono = (text: string) => text.length

function opts(over: Partial<CodeImageOptions> = {}): CodeImageOptions {
  return {
    code: 'const a = 1',
    language: 'tsx',
    theme: CODE_THEMES[0]!,
    fontSize: 10,
    padding: 10,
    inset: 10,
    radius: 8,
    chrome: false,
    title: '',
    lineNumbers: false,
    maxChars: 40,
    backdrop: 'theme',
    backdropColor: '#ffffff',
    shadow: false,
    ...over,
  }
}

const text = (row: Token[]) => row.map((t) => t.text).join('')
const kindOf = (rows: Token[][], line: number, word: string) =>
  rows[line]!.find((t) => t.text === word)?.kind

test('a line comment ends at the newline, not at the file', () => {
  const rows = tokenize('// note\nconst a = 1', 'tsx')
  assert.equal(rows.length, 2)
  assert.equal(kindOf(rows, 0, '// note'), 'comment')
  assert.equal(kindOf(rows, 1, 'const'), 'keyword')
})

test('a block comment spans lines and then releases', () => {
  const rows = tokenize('/* one\n   two */\nlet x', 'tsx')
  assert.equal(rows[0]![0]!.kind, 'comment')
  assert.equal(kindOf(rows, 2, 'let'), 'keyword')
})

test('an unterminated block comment does not swallow the file silently', () => {
  const rows = tokenize('/* open\nstill open', 'tsx')
  // It does swallow it — that is what the language says too. What matters is
  // that the rows still exist, so the image shows the code rather than one
  // giant blank.
  assert.equal(rows.length, 2)
  assert.equal(text(rows[1]!), 'still open')
})

test('a stray apostrophe does not paint the rest of the file', () => {
  const rows = tokenize("// it's fine\nconst a = 1", 'tsx')
  assert.equal(kindOf(rows, 1, 'const'), 'keyword')
})

test('a call is told apart from a bare identifier', () => {
  const rows = tokenize('doThing(value)', 'tsx')
  assert.equal(kindOf(rows, 0, 'doThing'), 'fn')
  assert.equal(kindOf(rows, 0, 'value'), 'plain')
})

test('css knows a property from a selector', () => {
  const rows = tokenize('.card {\n  color: red;\n}', 'css')
  assert.equal(kindOf(rows, 0, '.card'), 'tag')
  assert.equal(kindOf(rows, 1, 'color'), 'prop')
  assert.equal(kindOf(rows, 1, 'red'), 'plain')
})

test('css hex colours are numbers, not comments', () => {
  const rows = tokenize('a { color: #ff0055; }', 'css')
  assert.equal(kindOf(rows, 0, '#ff0055'), 'number')
})

test('json keys are told apart from string values', () => {
  const rows = tokenize('{ "name": "hoverlab", "n": 2 }', 'json')
  assert.equal(kindOf(rows, 0, '"name"'), 'prop')
  assert.equal(kindOf(rows, 0, '"hoverlab"'), 'string')
  assert.equal(kindOf(rows, 0, '2'), 'number')
})

test('html separates attributes from body text', () => {
  const rows = tokenize('<a href="/x">go</a>', 'html')
  assert.equal(kindOf(rows, 0, '<a'), 'tag')
  assert.equal(kindOf(rows, 0, 'href'), 'attr')
  assert.equal(kindOf(rows, 0, '"/x"'), 'string')
  assert.equal(kindOf(rows, 0, 'go'), 'plain')
})

test('plain text is left entirely alone', () => {
  const rows = tokenize('// not a comment here', 'plain')
  assert.deepEqual(rows[0], [{ text: '// not a comment here', kind: 'plain' }])
})

test('tokenizing preserves the source exactly', () => {
  const src = 'const a = "x" // y\n  return a\n'
  for (const lang of ['tsx', 'css', 'html', 'json', 'shell', 'plain'] as const) {
    assert.equal(
      tokenize(src, lang)
        .map(text)
        .join('\n'),
      src,
      `${lang} lost or invented characters`,
    )
  }
})

test('a short row is returned untouched', () => {
  const row: Token[] = [{ text: 'short', kind: 'plain' }]
  assert.deepEqual(wrapRow(row, 40), [row])
})

test('a long row wraps at the limit and keeps its indent', () => {
  const row: Token[] = [
    { text: '    ', kind: 'plain' },
    { text: 'x'.repeat(60), kind: 'string' },
  ]
  const wrapped = wrapRow(row, 30)
  assert.ok(wrapped.length > 1)
  assert.ok(
    wrapped.every((r) => text(r).length <= 30),
    'no wrapped row may exceed the limit',
  )
  assert.ok(text(wrapped[1]!).startsWith('      '), 'continuations hang under the original')
  assert.equal(
    wrapped
      .map(text)
      .join('')
      .replace(/ /g, '').length,
    60,
    'wrapping must not lose characters',
  )
})

test('the card is as wide as its longest row plus the padding', () => {
  const l = layout(opts({ code: 'abcde', padding: 10, inset: 10 }), mono)
  assert.equal(l.cardWidth, Math.max(220, 5 + 20))
  assert.equal(l.width, l.cardWidth + 20)
  assert.equal(l.cardX, 10)
})

test('the gutter grows with the line count, and only when asked', () => {
  const many = Array.from({ length: 120 }, (_, n) => `line ${n}`).join('\n')
  assert.equal(layout(opts({ code: many }), mono).gutterWidth, 0)
  // Three digits plus two columns of breathing room.
  assert.equal(layout(opts({ code: many, lineNumbers: true }), mono).gutterWidth, 5)
})

test('wrapped rows are drawn but not numbered', () => {
  const l = layout(opts({ code: 'y'.repeat(70), maxChars: 20, lineNumbers: true }), mono)
  assert.ok(l.rows.length > 1)
  assert.deepEqual(
    l.rowNumbers.filter((n) => n > 0),
    [1],
    'a continuation is not a new source line',
  )
})

test('chrome adds height, and only when it is on', () => {
  const bare = layout(opts(), mono)
  const withBar = layout(opts({ chrome: true }), mono)
  assert.equal(bare.chromeHeight, 0)
  assert.ok(withBar.chromeHeight > 0)
  assert.equal(withBar.cardHeight - bare.cardHeight, withBar.chromeHeight)
})

test('tabs are expanded, because a canvas has no tab stops', () => {
  const l = layout(opts({ code: '\tif (a) {' }), mono)
  assert.ok(text(l.rows[0]!).startsWith('  if'))
})

test('the filename follows the title, then the language', () => {
  assert.equal(downloadName({ title: 'use-debounced.ts', language: 'tsx' }), 'use-debounced-ts.png')
  assert.equal(downloadName({ title: '   ', language: 'css' }), 'css-snippet.png')
})
