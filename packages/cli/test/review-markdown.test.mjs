/**
 * The pull-request comment renderer.
 *
 * The GitHub Action finds and edits its own comment by the first line, skips
 * the write when nothing changed by comparing bytes, and posts whatever this
 * produces into a markdown renderer that will swallow raw HTML. Those are
 * three contracts, and each has a test that fails if it is broken.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { MARKDOWN_MARKER, escapeMarkdown, renderMarkdown } from '../src/review/report.mjs'

const violation = {
  rule: 'control-has-name',
  family: 'a11y',
  sc: '4.1.2',
  severity: 'violation',
  file: 'src/a.tsx',
  line: 4,
  message: '<button> with an icon and no accessible name: <button className="p-2">',
}
const advisory = {
  rule: 'physical-spacing-utility',
  family: 'rtl',
  sc: '1.3.2',
  severity: 'advisory',
  file: 'src/a.tsx',
  line: 3,
  message: 'pl-4 is physical',
  fix: 'Use ps-4.',
}

describe('renderMarkdown', () => {
  test('the marker is the exact first line, in every case', () => {
    for (const findings of [[], [violation], [advisory]]) {
      assert.equal(renderMarkdown(findings).split('\n')[0], MARKDOWN_MARKER)
    }
    assert.equal(renderMarkdown([], { fileCount: 0 }).split('\n')[0], MARKDOWN_MARKER)
  })

  test('the same findings produce the same bytes', () => {
    // The poster skips the write when nothing changed; a timestamp or sha here
    // would edit the comment on every push.
    const a = renderMarkdown([violation, advisory], { scope: 'this branch', fileCount: 2 })
    const b = renderMarkdown([violation, advisory], { scope: 'this branch', fileCount: 2 })
    assert.equal(a, b)
    assert.ok(!/\b20\d\d-\d\d-\d\d\b/.test(a), 'contains a date')
  })

  test('says so when there is nothing to review, and when it is clean', () => {
    assert.match(renderMarkdown([], { fileCount: 0, scope: 'this branch' }), /Nothing to review/)
    assert.match(renderMarkdown([], { fileCount: 3, scope: 'this branch' }), /No design defects found/)
  })

  test('violations are listed, advisories are folded away and never called failures', () => {
    const body = renderMarkdown([violation, advisory])
    assert.match(body, /\*\*1 violation\*\* and 1 advisory/)
    assert.match(body, /### Violations/)
    assert.match(body, /<details>/)
    assert.ok(body.indexOf('control-has-name') < body.indexOf('<details>'))
    assert.ok(body.indexOf('physical-spacing-utility') > body.indexOf('<details>'))
  })

  test('advisories alone are not a violation', () => {
    const body = renderMarkdown([advisory])
    assert.match(body, /No violations/)
    assert.ok(!body.includes('### Violations'))
  })

  test('raw tags in a message cannot become HTML', () => {
    const body = renderMarkdown([violation])
    assert.ok(!/<button>/.test(body.replace(/`[^`]*`/g, '')), 'a bare <button> survived outside code')
    assert.match(body, /&lt;button&gt;/)
    // The quoted source tag is kept intact in a code span, class names and all.
    assert.match(body, /`<button className="p-2">`/)
  })

  test('locations link to the line when a blob base is known', () => {
    const body = renderMarkdown([violation], { blobBase: 'https://github.com/o/r/blob/abc123' })
    assert.match(body, /\[`src\/a\.tsx:4`\]\(https:\/\/github\.com\/o\/r\/blob\/abc123\/src\/a\.tsx#L4\)/)
  })

  test('a path with spaces or brackets is encoded in the link', () => {
    const body = renderMarkdown([{ ...violation, file: 'app/(shop)/[id]/page one.tsx' }], {
      blobBase: 'https://github.com/o/r/blob/abc',
    })
    assert.match(body, /app\/\(shop\)\/%5Bid%5D\/page%20one\.tsx#L4/)
  })

  test('a long list is cut and says so', () => {
    const many = Array.from({ length: 100 }, (_, i) => ({ ...violation, line: i + 1 }))
    const body = renderMarkdown(many)
    assert.match(body, /and 60 more/)
    assert.ok(body.length < 20_000)
  })

  test('states what was not checked', () => {
    assert.match(renderMarkdown([]), /not evaluated here/)
  })
})

describe('escapeMarkdown', () => {
  test('escapes markup and keeps code spans', () => {
    assert.equal(escapeMarkdown('a <b> & *c*'), 'a &lt;b&gt; &amp; \\*c\\*')
    assert.equal(escapeMarkdown('use `<div>` here'), 'use `<div>` here')
  })
})
